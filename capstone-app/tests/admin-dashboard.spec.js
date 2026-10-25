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
      '/api/admin/patients': { patients: [{ user_id: 11, first_name: 'Test', last_name: 'Patient', full_name: 'Test Patient', contact_number: '09123456789', barangay: 'Poblacion', is_active: true }] },
      '/api/admin/sms-settings': { data: { threshold: 5 } },
      '/api/admin/sms-jobs': { jobs: [] },
      '/api/queue': [],
  };
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/admin/patients') {
      const data = responses[path];
      return route.fulfill({ json: { ...data, pagination: { page: 1, limit: 10, total: data.patients.length, totalPages: 1 } } });
    }
    if (path === '/api/appointments') {
      const data = responses[path];
      return route.fulfill({ json: { ...data, summary: { total: data.data.length, completed: 1, open: 0 }, pagination: { page: 1, limit: 10, total: data.data.length, totalPages: 1 } } });
    }
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(responses[path] ?? { data: [] }) });
  });
  return responses;
}

const liveQueues = () => [
  { id: 1, category: 'dental', queue_number: 'AQ01', full_name: 'Ana Santos', status: 'called', type: 'regular', is_walk_in: 0 },
  { id: 9, category: 'dental', queue_number: 'WQ15', full_name: 'Maria Reyes', status: 'waiting', type: 'regular', is_walk_in: 1 },
  { id: 2, category: 'dental', queue_number: 'AP07', full_name: 'Jose Cruz', status: 'waiting', type: 'priority', is_walk_in: 0 },
  { id: 3, category: 'dental', queue_number: 'WQ12', walk_in_name: 'Carla Garcia', status: 'missed', type: 'regular', is_walk_in: 1, grace_expires_at: '2026-10-19T03:10:00+08:00' },
  { id: 4, category: 'dental', queue_number: 'AQ03', full_name: 'Luis Flores', status: 'no_show', type: 'regular', status_reason: 'Did not return within 10 minutes' },
  { id: 5, category: 'general', queue_number: 'GQ02', full_name: 'Rosa Lim', status: 'serving', type: 'regular', is_walk_in: 1 },
  { id: 6, category: 'general', queue_number: 'GQ04', full_name: 'Pedro Ramos', status: 'waiting', type: 'regular', is_walk_in: 1 },
];

for (const width of [1440, 768, 375]) {
  test(`overview live monitor shows both services and projected order at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const responses = await mockAdmin(page);
    responses['/api/queue'] = liveQueues();
    await page.clock.install();
    await page.goto('/admin');
    const monitor = page.getByRole('region', { name: 'Live queue monitor', exact: true });
    await expect(monitor).toBeVisible();
    await expect(page.locator('#ad-sidebar').getByRole('button', { name: 'Queue Monitor', exact: true })).toHaveCount(0);
    const dental = monitor.getByRole('region', { name: 'Dental live queue', exact: true });
    await expect(dental).toContainText('AQ01');
    await expect(dental).toContainText('Ana Santos');
    await expect(dental).toContainText('WQ15');
    await expect(dental).not.toContainText('AP07');
    await expect(dental).toContainText('2 waiting');
    const general = monitor.getByRole('region', { name: 'General live queue', exact: true });
    await expect(general).toContainText('GQ02');
    await expect(general).toContainText('GQ04');
    const tickets = monitor.getByRole('region', { name: "Today's queue tickets", exact: true });
    await expect(tickets.getByRole('listitem')).toHaveCount(7);
    await expect(tickets.getByRole('listitem').nth(1)).toContainText('WQ15');
    await expect(tickets.getByRole('listitem').nth(1)).toContainText('Regular');
    await expect(tickets.getByRole('listitem').nth(2)).toContainText('AP07');
    await expect(tickets.getByRole('listitem').nth(2)).toContainText('Priority');
    await expect(tickets.getByText('Carla Garcia', { exact: true })).toBeVisible();
    await expect(tickets.getByText(/^Return before /)).toBeVisible();
    await expect(tickets.getByText('Reason: Did not return within 10 minutes', { exact: true })).toBeVisible();
    await expect(tickets.getByRole('button', { name: 'Cancel ticket AQ03', exact: true })).toHaveCount(0);
    await monitor.getByRole('button', { name: 'General', exact: true }).click();
    await expect(tickets.getByRole('listitem')).toHaveCount(2);
    await expect(tickets).not.toContainText('Ana Santos');
    await monitor.getByRole('button', { name: 'Dental', exact: true }).click();
    await expect(tickets.getByRole('listitem')).toHaveCount(5);
    await monitor.getByRole('button', { name: 'All queues', exact: true }).click();

    Object.assign(responses['/api/queue'][0], { queue_number: 'AQ08', full_name: 'New Patient', status: 'serving' });
    await page.clock.runFor(15_000);
    await expect(dental).toContainText('AQ08');
    await expect(dental).not.toContainText('AQ01');
    await monitor.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`overview-live-monitor-${width}.png`), animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('live monitor distinguishes loading and failure, retains the last update, and stops polling off the overview', async ({ page }) => {
  const responses = await mockAdmin(page);
  await page.clock.install();
  let finishRequest;
  const pending = new Promise(resolve => { finishRequest = resolve; });
  let fail = true;
  let requests = 0;
  await page.route('**/api/queue', async route => {
    requests++;
    await pending;
    return fail
      ? route.fulfill({ status: 503, json: { message: 'Queue connection unavailable.' } })
      : route.fulfill({ json: responses['/api/queue'] });
  });
  await page.goto('/admin');
  const monitor = page.getByRole('region', { name: 'Live queue monitor', exact: true });
  await expect(monitor.getByRole('status')).toHaveText('Loading live queue…');
  await expect(monitor.getByText('No queue tickets today', { exact: true })).toHaveCount(0);
  finishRequest();
  await expect(monitor.getByRole('alert')).toContainText('Queue connection unavailable.');
  await expect(monitor.getByText('No queue tickets today', { exact: true })).toHaveCount(0);
  fail = false;
  await monitor.getByRole('button', { name: 'Refresh live queue', exact: true }).click();
  await expect(monitor.getByText('No queue tickets today', { exact: true })).toBeVisible();
  responses['/api/queue'] = liveQueues();
  await monitor.getByRole('button', { name: 'Refresh live queue', exact: true }).click();
  await expect(monitor.getByRole('region', { name: 'Dental live queue', exact: true })).toContainText('Ana Santos');
  fail = true;
  await page.clock.runFor(15_000);
  await expect(monitor.getByRole('alert')).toContainText('Showing the last successful update.');
  await expect(monitor.getByText('Update needed', { exact: true })).toBeVisible();
  await expect(monitor.getByRole('region', { name: 'Dental live queue', exact: true })).toContainText('Ana Santos');
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Accounts', exact: true }).click();
  const previousRequests = requests;
  await page.clock.runFor(30_000);
  expect(requests).toBe(previousRequests);
  fail = false;
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Dashboard', exact: true }).click();
  await expect(monitor.getByRole('region', { name: 'Dental live queue', exact: true })).toContainText('Ana Santos');
});

test('overview queue cancellation still requires a reason and reports rejected changes', async ({ page }) => {
  const responses = await mockAdmin(page);
  responses['/api/queue'] = liveQueues();
  let fail = true;
  const writes = [];
  await page.route('**/api/queue/9/status', route => {
    writes.push(route.request().postDataJSON());
    if (fail) return route.fulfill({ status: 409, json: { message: 'Could not cancel this ticket.' } });
    responses['/api/queue'] = responses['/api/queue'].filter(queue => queue.id !== 9);
    return route.fulfill({ json: { success: true } });
  });
  await page.goto('/admin');
  const monitor = page.getByRole('region', { name: 'Live queue monitor', exact: true });
  const cancel = monitor.getByRole('button', { name: 'Cancel ticket WQ15', exact: true });
  await cancel.click();
  const dialog = page.getByRole('dialog', { name: 'Reason for cancellation', exact: true });
  await expect(dialog.getByRole('button', { name: 'Continue', exact: true })).toBeDisabled();
  await dialog.getByRole('radio', { name: 'Wait time too long', exact: true }).check();
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(monitor.getByRole('alert')).toContainText('Could not cancel this ticket.');
  await expect(cancel).toBeEnabled();
  fail = false;
  await cancel.click();
  await dialog.getByRole('radio', { name: 'Wait time too long', exact: true }).check();
  await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(cancel).toHaveCount(0);
  await expect(monitor.getByRole('region', { name: 'Dental live queue', exact: true })).toContainText('AP07');
  expect(writes).toEqual(Array(2).fill({ status: 'cancelled', reason: 'Wait time too long' }));
});

for (const width of [1440, 375]) {
  test(`SMS audit history loads, refreshes and remounts at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const responses = await mockAdmin(page);
    await page.clock.install();
    const job = {
      id: 91, purpose: 'temporary_password', user_id: 11, queue_id: null,
      state: 'submitted', provider_status: 'sent', last_error: null,
      masked_recipient: '*******6789', attempts: 2, provider_message_id: '123456',
      created_at: '2026-10-19T01:00:00.000Z', updated_at: '2026-10-19T01:01:00.000Z',
    };
    responses['/api/admin/sms-jobs'].jobs = [job];
    await page.goto('/admin');
    const main = page.getByRole('main');
    async function selectTab(name) {
      if (width <= 900) await page.getByRole('button', { name: 'Open menu' }).click();
      await page.locator('#ad-sidebar').getByRole('button', { name, exact: true }).click();
    }
    await selectTab('Notifications');
    await expect(main.getByText('Account activation #11', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText('*******6789', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText('sent', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText('Job #91 · Attempts: 2', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText('Provider ref: 123456', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText(/^Updated: /).filter({ visible: true })).toHaveCount(1);
    await expect(main.getByLabel('Notify within the next')).toBeEnabled();

    Object.assign(job, { state: 'cancelled', provider_status: 'queued', last_error: 'credential_replaced' });
    await main.getByRole('button', { name: 'Refresh SMS activity' }).click();
    await expect(main.getByText('cancelled', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText('credential_replaced', { exact: true }).filter({ visible: true })).toBeVisible();

    responses['/api/admin/sms-jobs'].jobs.unshift({
      ...job, id: 92, purpose: 'queue_alert', queue_id: 42, state: 'unknown',
      provider_status: null, provider_message_id: null, attempts: 1,
    });
    await page.clock.runFor(15_000);
    await expect(main.getByText('Queue alert #42', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(main.getByText('Submission uncertain; check Semaphore before replacing.', { exact: true }).filter({ visible: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`sms-history-${width}.png`), fullPage: true, animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    await selectTab('Accounts');
    await selectTab('Notifications');
    await expect(main.getByText('Queue alert #42', { exact: true }).filter({ visible: true })).toBeVisible();
  });
}

for (const width of [1440, 375]) {
  test(`SMS activity pages retain their position on refresh and recover when history shrinks at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const responses = await mockAdmin(page);
    const makeJob = (id) => ({
      id, purpose: 'queue_alert', queue_id: id, state: 'submitted', provider_status: 'sent',
      masked_recipient: '*******6789', attempts: 1,
      created_at: '2026-10-19T01:00:00.000Z', updated_at: '2026-10-19T01:01:00.000Z',
    });
    responses['/api/admin/sms-jobs'].jobs = Array.from({ length: 23 }, (_, index) => makeJob(100 - index));
    let fail = false;
    await page.route('**/api/admin/sms-jobs', route => fail
      ? route.fulfill({ status: 503, json: { message: 'Unable to load SMS history.' } })
      : route.fulfill({ json: responses['/api/admin/sms-jobs'] }));
    await page.clock.install();
    await page.goto('/admin');
    if (width <= 900) await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#ad-sidebar').getByRole('button', { name: 'Notifications', exact: true }).click();
    const main = page.getByRole('main');
    const pagination = main.getByRole('navigation', { name: 'SMS activity pagination' });
    const rows = main.getByText(/^Queue alert #\d+$/).filter({ visible: true });
    const previous = pagination.getByRole('button', { name: 'Previous', exact: true });
    const next = pagination.getByRole('button', { name: 'Next', exact: true });
    await expect(pagination).toContainText('Showing 1–10 of 23');
    await expect(pagination).toContainText('Page 1 of 3');
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toHaveText('Queue alert #100');
    await expect(previous).toBeDisabled();
    await next.click();
    await expect(pagination).toContainText('Showing 11–20 of 23');
    await expect(rows.first()).toHaveText('Queue alert #90');
    await next.click();
    await expect(pagination).toContainText('Showing 21–23 of 23');
    await expect(rows).toHaveCount(3);
    await expect(next).toBeDisabled();
    await previous.click();
    responses['/api/admin/sms-jobs'].jobs.unshift(makeJob(101));
    await page.clock.runFor(15_000);
    await expect(pagination).toContainText('Showing 11–20 of 24');
    await expect(pagination).toContainText('Page 2 of 3');
    await expect(rows.first()).toHaveText('Queue alert #91');
    await expect(rows).toHaveCount(10);
    await pagination.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`sms-pagination-${width}.png`), fullPage: true, animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    fail = true;
    await main.getByRole('button', { name: 'Refresh SMS activity' }).click();
    await expect(main.getByRole('alert')).toHaveText('Unable to load SMS history.');
    await expect(pagination).toContainText('Page 2 of 3');
    await expect(rows).toHaveCount(10);
    fail = false;
    responses['/api/admin/sms-jobs'].jobs = [makeJob(101), makeJob(100)];
    await main.getByRole('button', { name: 'Refresh SMS activity' }).click();
    await expect(pagination).toContainText('Showing 1–2 of 2');
    await expect(pagination).toContainText('Page 1 of 1');
    await expect(rows).toHaveCount(2);
    await expect(previous).toBeDisabled();
    await expect(next).toBeDisabled();
    responses['/api/admin/sms-jobs'].jobs = [];
    await main.getByRole('button', { name: 'Refresh SMS activity' }).click();
    await expect(main.getByText('No SMS jobs yet', { exact: true })).toBeVisible();
    await expect(pagination).toHaveCount(0);
  });
}

test('SMS history distinguishes loading, request failure and an empty history', async ({ page }) => {
  await mockAdmin(page);
  let finishRequest;
  const pending = new Promise(resolve => { finishRequest = resolve; });
  await page.route('**/api/admin/sms-jobs', async route => {
    await pending;
    return route.fulfill({ status: 503, json: { message: 'Unable to load SMS history.' } });
  });
  await page.goto('/admin');
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Notifications', exact: true }).click();
  const main = page.getByRole('main');
  await expect(main.getByRole('status')).toHaveText('Loading SMS activity…');
  await expect(main.getByText('No SMS jobs yet', { exact: true })).toHaveCount(0);
  finishRequest();
  await expect(main.getByRole('alert')).toHaveText('Unable to load SMS history.');
  await expect(main.getByText('No SMS jobs yet', { exact: true })).toHaveCount(0);
  await page.route('**/api/admin/sms-jobs', route => route.fulfill({ json: { success: true, jobs: [] } }));
  await main.getByRole('button', { name: 'Refresh SMS activity' }).click();
  await expect(main.getByText('No SMS jobs yet', { exact: true })).toBeVisible();
  await expect(main.getByRole('alert')).toHaveCount(0);
});

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
    responses['/api/admin/patients'].patients.push({ user_id: 12, first_name: 'Ana', last_name: 'Santos', full_name: 'Ana Santos', is_active: true, must_change_password: true, sms_job_id: 91, sms_state: 'queued' });
    return route.fulfill({ status: 201, json: { success: true, sms_job_id: 91, sms_status: 'queued' } });
  });
  await page.goto('/admin');
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Accounts', exact: true }).click();
  await page.getByRole('main').getByRole('button', { name: 'Patients', exact: true }).click();
  await expect(page.locator('.pm-table-row').first().locator(':scope > span').nth(0)).toHaveText('Patient');
  await expect(page.locator('.pm-table-row').first().locator(':scope > span').nth(1)).toHaveText('Test');
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
