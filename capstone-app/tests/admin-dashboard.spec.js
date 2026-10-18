import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockAdmin(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript(token => {
    sessionStorage.setItem('ek_user', JSON.stringify({ user_id: 8, role: 'admin' }));
    sessionStorage.setItem('ek_token', token);
  }, createTestToken({ user_id: 8, role: 'admin' }));
  const responses = {
      '/api/auth/profile': { data: { user_id: 8, role: 'admin', display_name: 'Test Admin' } },
      '/api/admin/overview': { totalPatients: 12, totalDoctors: 2, totalAppointments: 18, completedQueues: 10 },
      '/api/doctor': { data: [{ doctor_id: 1, first_name: 'Maria', last_name: 'Santos', is_available: 1 }] },
      '/api/appointments': { data: [{ appointment_id: 1, patient_full_name: 'Test Patient', appointment_date: '2026-10-11', appointment_time: '09:00:00', doctor_first_name: 'Maria', doctor_last_name: 'Santos', reason: 'Dental check-up', status: 'completed' }] },
      '/api/admin/staff': { staff: [{ user_id: 9, first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@example.com', role: 'doctor', is_active: true }] },
      '/api/admin/patients': { patients: [{ user_id: 11, full_name: 'Test Patient', contact_number: '09123456789', barangay: 'Poblacion', is_active: true }] },
      '/api/admin/sms-settings': { data: { threshold: 5 } },
      '/api/admin/sms-jobs': { jobs: [] },
  };
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses[path] ?? { data: [] }) });
  });
  return responses;
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 900 }, { width: 375, height: 812 }]) {
  test(`admin history and account layout work at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await mockAdmin(page);
    await page.goto('/admin');
    const main = page.getByRole('main');
    await expect(main.getByText('Test Patient', { exact: true }).filter({ visible: true })).toHaveCount(1);
    await expect(main.getByRole('heading', { name: 'Notifications', exact: true })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`admin-overview-${viewport.width}.png`), fullPage: true, animations: 'disabled' });

    async function selectTab(name) {
      if (viewport.width <= 900) await page.getByRole('button', { name: 'Open menu' }).click();
      await page.locator('#ad-sidebar').getByRole('button', { name, exact: true }).click();
    }

    await selectTab('Accounts');
    await expect(main.getByRole('heading', { name: 'Staff Management' })).toBeVisible();
    await expect(main.getByText('maria.santos@example.com', { exact: true }).filter({ visible: true })).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath(`admin-accounts-${viewport.width}.png`), fullPage: true, animations: 'disabled' });
    await main.getByRole('button', { name: 'Add Staff', exact: true }).click();
    await expect(main.getByRole('heading', { name: 'New Staff Account' })).toBeVisible();
    await main.getByRole('button', { name: 'Cancel', exact: true }).click();
    await main.getByRole('button', { name: 'Patients', exact: true }).click();
    await expect(main.getByRole('heading', { name: 'Patient Accounts', exact: true })).toBeVisible();

    await selectTab('Patients History');
    await expect(main.getByText('Test Patient', { exact: true }).filter({ visible: true })).toHaveCount(1);
    await page.screenshot({ path: testInfo.outputPath(`admin-history-${viewport.width}.png`), fullPage: true, animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    await selectTab('Notifications');
    await expect(main.getByRole('heading', { name: 'SMS notifications', exact: true })).toBeVisible();
  });
}

test('patient creation reports request errors, queued SMS, and confirmed sending without duplicate toasts', async ({ page }, testInfo) => {
  const responses = await mockAdmin(page);
  await page.clock.install();
  let fail = true;
  await page.route('**/api/admin/patients', route => {
    if (route.request().method() === 'GET') return route.fallback();
    if (fail) return route.fulfill({ status: 503, json: { message: 'SMS request unavailable.' } });
    responses['/api/admin/patients'].patients.push({ user_id: 12, full_name: 'Ana Santos', is_active: true, must_change_password: true, sms_job_id: 91, sms_state: 'queued' });
    return route.fulfill({ status: 201, json: { success: true, sms_job_id: 91, sms_status: 'queued' } });
  });
  await page.goto('/admin');
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Accounts', exact: true }).click();
  await page.getByRole('main').getByRole('button', { name: 'Patients', exact: true }).click();
  await expect(page.getByText('Test Patient', { exact: true }).filter({ visible: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Add Patient', exact: true }).click();
  await page.getByPlaceholder('Juan', { exact: true }).fill('Ana');
  await page.getByPlaceholder('Dela Cruz', { exact: true }).fill('Santos');
  await page.locator('.pm-form-grid input[type="tel"]').fill('09123456780');
  await page.locator('.pm-form-grid input[type="date"]').fill('1990-01-01');
  await page.locator('.pm-form-grid select').nth(0).selectOption('Female');
  await page.locator('.pm-form-grid select').nth(1).selectOption('Poblacion');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('SMS request unavailable.');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  fail = false;
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Temporary password SMS for Ana Santos queued for sending.');
  const patient = responses['/api/admin/patients'].patients.at(-1);
  Object.assign(patient, { sms_state: 'submitted', sms_provider_status: 'sent' });
  await page.clock.runFor(15_000);
  await expect(page.getByRole('status')).toHaveText('Temporary password SMS for Ana Santos sent successfully.');
  await page.screenshot({ path: testInfo.outputPath('password-sms-toast.png') });
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await page.clock.runFor(15_000);
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('replacement password SMS reports request and delivery failures', async ({ page }) => {
  const responses = await mockAdmin(page);
  await page.clock.install();
  const patient = responses['/api/admin/patients'].patients[0];
  Object.assign(patient, { must_change_password: true, sms_job_id: 90, sms_state: 'submitted', sms_provider_status: 'sent' });
  let fail = true;
  await page.route('**/api/admin/patients/11/temporary-password', route => {
    expect(route.request().postDataJSON()).toEqual({ identity_confirmed: true });
    if (fail) return route.fulfill({ status: 503, json: { message: 'Unable to issue replacement password.' } });
    Object.assign(patient, { sms_job_id: 92, sms_state: 'queued', sms_provider_status: null });
    return route.fulfill({ status: 201, json: { sms_job_id: 92, sms_status: 'queued' } });
  });
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/admin');
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Accounts', exact: true }).click();
  await page.getByRole('main').getByRole('button', { name: 'Patients', exact: true }).click();
  const replace = page.getByRole('button', { name: 'Issue replacement password' }).filter({ visible: true });
  await expect(replace).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await replace.click();
  await expect(page.getByRole('alert')).toContainText('Unable to issue replacement password.');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  fail = false;
  await replace.click();
  await expect(page.getByRole('status')).toHaveText('Replacement password SMS for Test Patient queued for sending.');
  patient.sms_state = 'failed';
  await page.clock.runFor(15_000);
  await expect(page.getByRole('alert')).toHaveText('Temporary password SMS for Test Patient could not be sent.');
});
