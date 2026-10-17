import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockAdmin(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript(token => {
    sessionStorage.setItem('ek_user', JSON.stringify({ user_id: 8, role: 'admin' }));
    sessionStorage.setItem('ek_token', token);
  }, createTestToken({ user_id: 8, role: 'admin' }));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
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
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses[path] ?? { data: [] }) });
  });
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
