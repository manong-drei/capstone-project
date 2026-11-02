import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

test.use({ timezoneId: 'America/Los_Angeles' });
const now = new Date('2026-10-29T00:30:00+08:00');
const request = (id = 1) => ({ id, doctor_id: 7, doctor_name: 'Test Doctor', start_date: '2026-10-29', end_date: '2026-11-04', reason: 'Private leave reason', status: 'pending', review_note: null });
const fixture = () => ({ requests: [], decisions: [], dailyWrites: [], daily: 1, version: 'review-1',
  appointments: [{ appointment_id: 51, appointment_date: '2026-10-30', patient_name: 'Ana Patient', status: 'confirmed' }],
  queues: [{ id: 61, queue_number: 'WQ61', patient_name: 'Returning Patient', status: 'waiting' }],
});

async function mockRole(page, role, state) {
  const user = { user_id: role === 'doctor' ? 4 : role === 'admin' ? 8 : role === 'staff' ? 3 : 11, role, display_name: `Test ${role}` };
  await page.clock.install({ time: now });
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem('ek_user', JSON.stringify(user)); sessionStorage.setItem('ek_token', token);
  }, { user, token: createTestToken({ ...user, exp: Math.floor(now.getTime() / 1000) + 86400 }) });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? route.request().postDataJSON() ?? {} : {};
    const active = state.requests.find(row => row.status === 'approved' && row.start_date <= '2026-10-29' && row.end_date >= '2026-10-29');
    let json = { data: [] };
    if (url.pathname === '/api/auth/profile') json = { data: user };
    else if (url.pathname === '/api/admin/overview') json = {};
    else if (url.pathname === '/api/doctor') json = { data: [
      { doctor_id: 9, first_name: 'Other', last_name: 'Doctor', is_available: 1 },
      { doctor_id: 7, first_name: 'Test', last_name: 'Doctor', is_available: active ? 0 : state.daily, leave_end: active?.end_date ?? null },
    ] };
    else if (url.pathname === '/api/doctor/daily-settings') {
      if (method === 'PUT') {
        state.dailyWrites.push(body);
        if (active && body.is_available === 1) return route.fulfill({ status: 409, json: { message: 'Approved leave cannot be overridden.' } });
        if (body.is_available !== undefined) state.daily = body.is_available;
      }
      json = { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0,
        is_available: active ? 0 : state.daily, daily_is_available: state.daily, approved_leave: active ?? null };
    } else if (url.pathname === '/api/doctor/leave-requests') {
      if (method === 'POST') {
        state.requests.push({ ...request(state.requests.length + 1), ...body, status: 'pending' });
        json = { success: true, message: 'Leave request submitted for admin approval. Availability is unchanged until approval.' };
      } else json = { requests: state.requests };
    } else if (/\/api\/doctor\/leave-requests\/\d+\/withdraw$/.test(url.pathname)) {
      const row = state.requests.find(row => row.id === Number(url.pathname.split('/')[4]));
      row.status = 'cancelled'; json = { success: true };
    } else if (url.pathname === '/api/admin/doctor-leaves') json = { requests: state.requests };
    else if (/\/api\/admin\/doctor-leaves\/\d+$/.test(url.pathname)) {
      const row = state.requests.find(row => row.id === Number(url.pathname.split('/').pop()));
      if (method === 'PATCH') {
        if (body.status === 'approved' && (state.appointments.length || state.queues.length) && (!body.acknowledge_conflicts || body.impact_version !== state.version)) {
          return route.fulfill({ status: 409, json: { message: 'Affected bookings changed. Refresh review before approving.' } });
        }
        state.decisions.push(body); row.status = body.status; row.review_note = body.review_note;
        json = { success: true };
      } else json = { leave: row, impacts: { appointments: state.appointments, queues: state.queues, version: state.version } };
    } else if (url.pathname === '/api/queue') json = [];
    else if (url.pathname === '/api/queue/me') json = null;
    else if (url.pathname === '/api/queue/status') json = { now_serving: null, next_queuing: null };
    else if (url.pathname === '/api/patients/me') json = { data: { patient_id: 11, first_name: 'Test', last_name: 'Patient' } };
    else if (url.pathname === '/api/appointments') json = { data: [], summary: {}, pagination: { page: 1, total: 0, totalPages: 1 } };
    else if (url.pathname === '/api/admin/staff') json = { staff: [] };
    else if (url.pathname === '/api/admin/patients') json = { patients: [], pagination: { total: 0 } };
    return route.fulfill({ json });
  });
}

async function doctorLeave(page) {
  if (page.viewportSize().width <= 640) await page.getByRole('button', { name: 'Toggle menu', exact: true }).click();
  await page.getByRole('button', { name: 'Leave Requests', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('heading', { name: 'Leave Requests', exact: true })).toBeVisible();
}
async function adminLeave(page) {
  if (page.viewportSize().width <= 900) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.locator('#ad-sidebar').getByRole('button', { name: 'Leave Requests', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Leave Requests', exact: true })).toBeVisible();
}

for (const width of [1440, 375]) {
  test(`doctor leave requires admin approval and updates all dashboards at ${width}px`, async ({ page: doctor, context }, testInfo) => {
    const state = fixture();
    await doctor.setViewportSize({ width, height: 1000 });
    await mockRole(doctor, 'doctor', state);
    await doctor.goto('/doctor');
    await doctor.getByRole('button', { name: 'Available', exact: true }).click();
    await expect(doctor.getByRole('button', { name: 'Unavailable', exact: true })).toBeEnabled();
    await doctor.getByRole('button', { name: 'Unavailable', exact: true }).click();
    await expect(doctor.getByRole('button', { name: 'Available', exact: true })).toBeEnabled();
    expect(state.decisions).toHaveLength(0);
    expect(state.dailyWrites.every(row => row.date === '2026-10-29')).toBe(true);
    await doctorLeave(doctor);
    const form = doctor.getByRole('form', { name: 'Request doctor leave' });
    await form.getByLabel('Start date', { exact: true }).fill('2026-10-29');
    await form.getByLabel('End date', { exact: true }).fill('2026-11-04');
    await form.getByLabel('Reason (optional)', { exact: true }).fill('Private leave reason');
    await form.getByRole('button', { name: 'Submit leave request' }).click();
    await expect(doctor.getByText('Pending approval', { exact: true })).toBeVisible();
    await expect(doctor.getByRole('button', { name: 'Withdraw request' })).toBeVisible();
    await expect(doctor.getByRole('button', { name: 'Approve leave' })).toHaveCount(0);
    expect(state.requests[0].status).toBe('pending');
    await doctor.screenshot({ path: testInfo.outputPath(`doctor-leave-${width}.png`), fullPage: true, animations: 'disabled' });

    const admin = await context.newPage(); await admin.setViewportSize({ width, height: 1000 });
    await mockRole(admin, 'admin', state); await admin.goto('/admin'); await adminLeave(admin);
    await admin.getByRole('button', { name: 'Review request #1', exact: true }).click();
    const review = admin.getByRole('dialog', { name: 'Review leave request', exact: true });
    await expect(review).toContainText('Private leave reason');
    await expect(review).toContainText('1 open appointment');
    await expect(review).toContainText('WQ61');
    const approve = review.getByRole('button', { name: 'Approve leave', exact: true });
    await expect(approve).toBeDisabled();
    await review.getByRole('checkbox').check();
    await review.getByLabel('Review note (optional)', { exact: true }).fill('Approved for planned leave');
    await admin.screenshot({ path: testInfo.outputPath(`admin-leave-review-${width}.png`), animations: 'disabled' });
    expect(await admin.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await approve.click();
    await expect(review).toHaveCount(0);
    await expect(admin.getByText('Leave request approved.', { exact: true })).toBeVisible();
    expect(state.decisions[0].acknowledge_conflicts).toBe(true);
    await doctor.getByRole('button', { name: 'Refresh leave requests' }).click();
    await expect(doctor.getByText('Approved', { exact: true })).toBeVisible();
    await expect(doctor.getByText('Approved for planned leave')).toBeVisible();
    await expect(doctor.getByRole('button', { name: 'Withdraw request' })).toHaveCount(0);
    await doctor.getByRole('button', { name: '← Back', exact: true }).click();
    await expect(doctor.getByRole('button', { name: 'On leave', exact: true })).toBeDisabled();
    await expect(doctor.getByText(/On approved leave through/)).toBeVisible();
    await doctor.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(doctor.getByText('Saved ✓', { exact: true })).toBeVisible();
    expect(state.dailyWrites.at(-1).is_available).toBeUndefined();

    for (const role of ['staff', 'patient']) {
      const viewer = await context.newPage(); await viewer.setViewportSize({ width, height: 1000 });
      await mockRole(viewer, role, state); await viewer.goto(`/${role}`);
      if (role === 'staff') {
        await expect(viewer.getByText(/Dentist on leave through/)).toBeVisible();
        await expect(viewer.getByRole('button', { name: 'Register and assign dental queue' })).toBeDisabled();
      } else {
        await expect(viewer.getByText('On leave', { exact: true })).toBeVisible();
        await expect(viewer.getByRole('button', { name: /Get queue ticket/ })).toBeDisabled();
      }
      await expect(viewer.getByText('Private leave reason', { exact: true })).toHaveCount(0);
      expect(await viewer.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await viewer.close();
    }
    await admin.getByLabel('Request status').selectOption('approved');
    await admin.getByRole('button', { name: 'Review request #1', exact: true }).click();
    await review.getByRole('button', { name: 'Cancel approved leave', exact: true }).click();
    await expect(admin.getByText('Leave request cancelled.', { exact: true })).toBeVisible();
    await doctor.reload();
    await expect(doctor.getByRole('button', { name: 'Available', exact: true })).toBeEnabled();
    expect(state.requests[0].status).toBe('cancelled');
  });
}

test('doctors can withdraw pending leave and see an admin rejection note', async ({ page: doctor, context }) => {
  const state = fixture(); state.requests = [request(1), { ...request(2), start_date: '2026-11-10', end_date: '2026-11-16' }];
  await mockRole(doctor, 'doctor', state); await doctor.goto('/doctor'); await doctorLeave(doctor);
  await doctor.getByRole('button', { name: 'Withdraw request', exact: true }).first().click();
  await expect(doctor.getByText('Cancelled', { exact: true })).toBeVisible();
  const admin = await context.newPage(); await mockRole(admin, 'admin', state); await admin.goto('/admin'); await adminLeave(admin);
  await admin.getByRole('button', { name: 'Review request #2', exact: true }).click();
  const review = admin.getByRole('dialog', { name: 'Review leave request' });
  await review.getByLabel('Review note (optional)').fill('Please choose another week.');
  await review.getByRole('button', { name: 'Reject request', exact: true }).click();
  await expect(admin.getByText('Leave request rejected.', { exact: true })).toBeVisible();
  await doctor.getByRole('button', { name: 'Refresh leave requests' }).click();
  await expect(doctor.getByText('Rejected', { exact: true })).toBeVisible();
  await expect(doctor.getByText('Please choose another week.', { exact: false })).toBeVisible();
  expect(state.daily).toBe(1);
});

test('admin must refresh and acknowledge newly affected bookings before approving', async ({ page }) => {
  const state = fixture(); state.requests = [request()];
  await mockRole(page, 'admin', state); await page.goto('/admin'); await adminLeave(page);
  await page.getByRole('button', { name: 'Review request #1', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Review leave request' });
  await review.getByRole('checkbox').check();
  state.version = 'review-2'; state.appointments.push({ appointment_id: 52, appointment_date: '2026-10-31', patient_name: 'New Booking Patient', status: 'confirmed' });
  await review.getByRole('button', { name: 'Approve leave', exact: true }).click();
  await expect(review.getByRole('alert')).toContainText('Affected bookings changed.');
  expect(state.requests[0].status).toBe('pending');
  await review.getByRole('button', { name: 'Refresh review', exact: true }).click();
  await expect(review).toContainText('New Booking Patient');
  await expect(review.getByRole('button', { name: 'Approve leave', exact: true })).toBeDisabled();
  await review.getByRole('checkbox').check();
  await review.getByRole('button', { name: 'Approve leave', exact: true }).click();
  await expect(page.getByText('Leave request approved.', { exact: true })).toBeVisible();
});

test('leave loading and submission errors are recoverable and preserve entered dates', async ({ page }) => {
  const state = fixture(); await mockRole(page, 'doctor', state);
  let failList = true; let failSubmit = true;
  await page.route('**/api/doctor/leave-requests', async route => {
    if (route.request().method() === 'GET' && failList) return route.fulfill({ status: 503, json: { message: 'Leave history unavailable.' } });
    if (route.request().method() === 'POST' && failSubmit) return route.fulfill({ status: 503, json: { message: 'Please try submitting again.' } });
    return route.fallback();
  });
  await page.goto('/doctor'); await doctorLeave(page);
  await expect(page.getByRole('alert')).toContainText('Leave history unavailable.');
  failList = false; await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('No leave requests yet.', { exact: true })).toBeVisible();
  const form = page.getByRole('form', { name: 'Request doctor leave' });
  await form.getByLabel('Start date', { exact: true }).fill('2026-10-29');
  await form.getByLabel('End date', { exact: true }).fill('2026-11-04');
  await form.getByRole('button', { name: 'Submit leave request' }).click();
  await expect(page.getByRole('alert')).toHaveText('Please try submitting again.');
  await expect(form.getByLabel('Start date', { exact: true })).toHaveValue('2026-10-29');
  failSubmit = false; await form.getByRole('button', { name: 'Submit leave request' }).click();
  await expect(page.getByText('Pending approval', { exact: true })).toBeVisible();
});
