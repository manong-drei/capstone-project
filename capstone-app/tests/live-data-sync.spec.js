import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

async function mockApp(page, role = 'admin', state = {}, userId = 8) {
  Object.assign(state, { name: state.name ?? 'Original', reads: state.reads ?? [], writes: state.writes ?? [] });
  const user = { user_id: userId, role, phone: '09123456789' };
  const token = createTestToken(user);
  await page.clock.install();
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem('ek_user', JSON.stringify(user));
    sessionStorage.setItem('ek_token', token);
  }, { user, token });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    expect(request.headers().authorization).toBe('Bearer ' + token);
    if (request.method() !== 'GET') {
      state.writes.push(url.pathname);
      state.name = request.postDataJSON()?.first_name ?? state.name;
      return route.fulfill({ json: { success: true } });
    }
    state.reads.push({ path: url.pathname, search: url.search });
    if (state.hold === url.pathname) await new Promise(resolve => { state.release = resolve; });
    if (state.fail === url.pathname) return route.fulfill({ status: 503, json: { message: 'Connection interrupted.' } });
    const profile = { ...user, first_name: state.name, last_name: 'Tester', display_name: state.name + ' Tester', contact_number: user.phone, barangay: 'Poblacion', city: 'Bago City' };
    const doctor = { doctor_id: 7, first_name: state.name, last_name: 'Dentist', is_available: 1 };
    const leave = { id: 9, doctor_name: 'Test Dentist', start_date: '2026-12-01', end_date: '2026-12-02', status: 'pending' };
    const patient = { ...profile, patient_id: 42, date_of_birth: '1990-01-01', gender: 'Female', visits: [], account: { phone: user.phone, is_active: 1, credential_version: 1 } };
    const pagination = { page: 1, total: 1, totalPages: 1 };
    const report = { report_date: '2026-11-05', from: '2026-11-05', until: '2026-11-06', reports: [], age_groups: [], completed_demographics: [] };
    const responses = {
      '/api/auth/profile': { data: profile }, '/api/patients/me': { data: patient },
      '/api/doctor': { data: [doctor] }, '/api/queue': [], '/api/queue/me': null,
      '/api/queue/status': { line: [] }, '/api/appointments': { data: [], summary: {}, pagination },
      '/api/appointments/me': { appointments: [] }, '/api/doctor/patient-history': { visits: [] },
      '/api/doctor/daily-settings': { appointment_limit: state.limit ?? 10, walk_in_limit: 5, is_available: 1 },
      '/api/doctor/analytics': report, '/api/doctor/report': report, '/api/doctor/daily-report': { data: null },
      '/api/doctor/leave-requests': { requests: [leave] },
      '/api/doctor/consultations/11': { data: { consultation_id: 11, patient_full_name: 'Test Patient', notes: state.name } },
      '/api/doctor/7/records': { data: { doctor, availability: [] } },
      '/api/admin/overview': {}, '/api/admin/doctor-leaves': { requests: [leave] },
      '/api/admin/doctor-leaves/9': { leave, impacts: { appointments: state.affected ? [{ appointment_id: 1, patient_name: 'Test Patient', appointment_date: '2026-12-01', status: 'pending' }] : [], queues: [], version: state.version ?? 'one' } },
      '/api/admin/staff': { staff: [{ ...profile, user_id: 9, role: 'admin', is_active: 1 }] },
      '/api/admin/patients': { patients: [patient], pagination },
      '/api/admin/audit-logs': { events: [], pagination },
      '/api/admin/sms-jobs': { jobs: [] }, '/api/admin/sms-settings': { data: { threshold: state.threshold ?? 5 } },
      '/api/admin/bohc-forecast': { forecasts: [], history: [] },
      '/api/patients/42': { data: patient }, '/api/patients/search': { data: [patient] },
    };
    return route.fulfill({ json: responses[url.pathname] ?? {} });
  });
  return state;
}

const views = [
  ['admin', '/admin', ['/admin/overview', '/appointments', '/queue', '/admin/doctor-leaves', '/admin/sms-jobs']],
  ['admin', '/admin/accounts/staff', ['/admin/staff']],
  ['admin', '/admin/accounts/patients', ['/admin/patients']],
  ['admin', '/admin/doctors', ['/doctor', '/admin/doctor-leaves']],
  ['admin', '/admin/doctors/7/records', ['/doctor/7/records']],
  ['admin', '/admin/leave-requests/9', ['/admin/doctor-leaves/9']],
  ['admin', '/admin/patient-history', ['/appointments']],
  ['admin', '/admin/notifications', ['/admin/sms-jobs', '/admin/sms-settings']],
  ['admin', '/admin/audit-logs', ['/admin/audit-logs']],
  ['admin', '/admin/analytics', ['/admin/bohc-forecast']],
  ['doctor', '/doctor', ['/queue', '/doctor/daily-settings']],
  ['doctor', '/doctor/patient-history', ['/doctor/patient-history']],
  ['doctor', '/doctor/consultations/11', ['/doctor/consultations/11']],
  ['doctor', '/doctor/analytics', ['/doctor/analytics', '/doctor/report']],
  ['doctor', '/doctor/reports/daily?date=2026-11-05', ['/doctor/daily-report']],
  ['doctor', '/doctor/leave-requests', ['/doctor/leave-requests']],
  ['patient', '/patient', ['/queue/me', '/queue/status', '/doctor', '/patients/me']],
  ['patient', '/patient/appointment-history', ['/appointments/me']],
  ['patient', '/patient/my-queue', ['/queue/me', '/queue/status']],
  ['staff', '/staff', ['/queue', '/doctor']],
  ['staff', '/staff/patients/42', ['/patients/42']],
  ...['admin', 'doctor', 'staff', 'patient'].map(role => [role, '/' + role + '/profile', [role === 'patient' ? '/patients/me' : '/auth/profile']]),
];

for (const [role, path, endpoints] of views) {
  test(role + ' ' + path + ' stays synchronized without reloading', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const state = await mockApp(page, role);
    await page.goto(path);
    const count = endpoint => state.reads.filter(read => read.path === '/api' + endpoint).length;
    for (const endpoint of endpoints) await expect.poll(() => count(endpoint), { message: endpoint + ' initially loads' }).toBeGreaterThan(0);
    const initial = endpoints.map(count);
    state.name = 'Remote';
    await page.clock.fastForward(5_000);
    for (const [index, endpoint] of endpoints.entries()) {
      await expect.poll(() => count(endpoint), { message: endpoint + ' refreshes automatically' }).toBeGreaterThan(initial[index]);
    }
    if (path.endsWith('/profile')) await expect(page.getByRole('region', { name: 'Remote Tester' })).toBeVisible();
    if (path === '/admin/accounts/staff') await expect(page.getByText('Remote', { exact: true }).filter({ visible: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('writes update another tab immediately while keeping each tab authenticated separately', async ({ page, context }) => {
  const state = await mockApp(page);
  await page.goto('/admin/accounts/staff');
  await expect(page.getByText('Original', { exact: true }).filter({ visible: true })).toBeVisible();
  const other = await context.newPage();
  await mockApp(other, 'admin', state, 10);
  await other.goto('/admin/accounts/staff');
  await expect(other.getByText('Original', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.evaluate(async () => {
    const { default: api } = await import('/src/services/api.js');
    await api.put('/admin/staff/9', { first_name: 'Remote' });
  });
  await expect(other.getByText('Remote', { exact: true }).filter({ visible: true })).toBeVisible();
  await expect(page.getByText('Remote', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('hidden tabs pause polling and refresh on return; leaving a tab stops its requests', async ({ page }) => {
  const state = await mockApp(page);
  await page.goto('/admin/accounts/staff');
  await expect(page.getByText('Original', { exact: true }).filter({ visible: true })).toBeVisible();
  const count = () => state.reads.filter(read => read.path === '/api/admin/staff').length;
  const initial = count();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  state.name = 'Remote';
  await page.clock.fastForward(20_000);
  expect(count()).toBe(initial);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('Remote', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(navigator, 'onLine', { configurable: true, value: false }));
  const offline = count();
  await page.clock.fastForward(10_000);
  expect(count()).toBe(offline);
  state.name = 'Reconnected';
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));
  });
  await expect(page.getByText('Reconnected', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.goto('/admin/audit-logs');
  await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
  const stopped = count();
  await page.clock.fastForward(10_000);
  expect(count()).toBe(stopped);
});

test('slow requests do not overlap and failed refreshes recover automatically', async ({ page }) => {
  const state = await mockApp(page, 'admin', { hold: '/api/admin/staff' });
  await page.goto('/admin/accounts/staff');
  await expect.poll(() => Boolean(state.release)).toBe(true);
  const count = () => state.reads.filter(read => read.path === '/api/admin/staff').length;
  await page.clock.fastForward(20_000);
  expect(count()).toBe(1);
  state.hold = null;
  state.release();
  await expect(page.getByText('Original', { exact: true }).filter({ visible: true })).toBeVisible();
  state.fail = '/api/admin/staff';
  await page.clock.fastForward(5_000);
  await expect(page.getByText('Connection interrupted.', { exact: true })).toBeVisible();
  state.fail = null;
  state.name = 'Recovered';
  await page.clock.fastForward(5_000);
  await expect(page.getByText('Recovered', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('profile and notification drafts survive remote changes', async ({ page }) => {
  const state = await mockApp(page);
  await page.goto('/admin/profile');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('First name', { exact: true }).fill('Unsaved');
  state.name = 'Remote';
  await page.clock.fastForward(10_000);
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Unsaved');
  await expect(page.getByLabel('Last name', { exact: true })).toHaveValue('Tester');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Remote Tester' })).toBeVisible();
  await page.goto('/admin/notifications');
  const threshold = page.getByRole('spinbutton');
  await expect(threshold).toHaveValue('5');
  await threshold.fill('8');
  state.threshold = 3;
  await page.clock.fastForward(10_000);
  await expect(threshold).toHaveValue('8');
});

test('doctor capacity and daily report drafts survive remote changes', async ({ page }) => {
  const state = await mockApp(page, 'doctor');
  await page.goto('/doctor');
  const limit = page.getByLabel('Appointment Limit', { exact: true });
  await expect(limit).toHaveValue('10');
  await limit.fill('7');
  state.limit = 4;
  await page.clock.fastForward(10_000);
  await expect(limit).toHaveValue('7');
  await page.goto('/doctor/reports/daily?date=2026-11-05');
  const count = page.getByRole('textbox', { name: /Abuanan, Orally fit children.*Male/ });
  await count.fill('12');
  await page.clock.fastForward(10_000);
  await expect(count).toHaveValue('12');
});

test('leave review preserves its note and requires acknowledgment again when impacts change', async ({ page }) => {
  const state = await mockApp(page, 'admin', { affected: true });
  await page.goto('/admin/leave-requests/9');
  const approve = page.getByRole('button', { name: 'Approve leave', exact: true });
  const acknowledgment = page.getByRole('checkbox');
  await acknowledgment.check();
  await page.getByLabel('Review note (optional)').fill('Keep this note');
  await expect(approve).toBeEnabled();
  state.version = 'two';
  await page.clock.fastForward(5_000);
  await expect(acknowledgment).not.toBeChecked();
  await expect(approve).toBeDisabled();
  await expect(page.getByLabel('Review note (optional)')).toHaveValue('Keep this note');
});

test('same-page updates work when BroadcastChannel is unavailable', async ({ page }) => {
  await page.addInitScript(() => { globalThis.BroadcastChannel = undefined; });
  await mockApp(page);
  await page.goto('/admin/accounts/staff');
  await expect(page.getByText('Original', { exact: true }).filter({ visible: true })).toBeVisible();
  await page.evaluate(async () => {
    const { default: api } = await import('/src/services/api.js');
    await api.put('/admin/staff/9', { first_name: 'Fallback' });
  });
  await expect(page.getByText('Fallback', { exact: true }).filter({ visible: true })).toBeVisible();
});

for (const [path, label, submit] of [
  ['/staff/account-recovery', 'Patient name or mobile number', true],
  ['/staff/walk-ins/new', 'Find an existing patient', false],
]) {
  test(path + ' refreshes search results without changing the search input', async ({ page }) => {
    const state = await mockApp(page, 'staff');
    await page.goto(path);
    const input = page.getByLabel(label, { exact: true });
    await input.fill('Original');
    if (submit) await page.getByRole('button', { name: 'Search patients', exact: true }).click();
    else await page.clock.fastForward(400);
    const reads = () => state.reads.filter(read => read.path === '/api/patients/search').length;
    await expect.poll(reads).toBeGreaterThan(0);
    const initial = reads();
    state.name = 'Remote';
    await page.clock.fastForward(5_000);
    await expect.poll(reads).toBeGreaterThan(initial);
    await expect(input).toHaveValue('Original');
  });
}

test('a change during a slow request triggers one follow-up refresh', async ({ page }) => {
  const state = await mockApp(page, 'admin', { hold: '/api/admin/staff' });
  await page.goto('/admin/accounts/staff');
  await expect.poll(() => Boolean(state.release)).toBe(true);
  await page.evaluate(async () => {
    const { default: api } = await import('/src/services/api.js');
    await api.put('/admin/staff/9', { first_name: 'Remote' });
  });
  state.hold = null;
  state.release();
  await expect.poll(() => state.reads.filter(read => read.path === '/api/admin/staff').length).toBe(2);
  await expect(page.getByText('Remote', { exact: true }).filter({ visible: true })).toBeVisible();
});
