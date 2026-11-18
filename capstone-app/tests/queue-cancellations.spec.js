import { test, expect } from '@playwright/test';
import { createTestToken } from './helpers/auth';

const notice = (id = 1, role = 'staff') => ({ id, queue_number: `AQ0${id}`, category: 'dental',
  status_reason: 'Clinic emergency — please return tomorrow. Full details: '.repeat(3), cancelled_by_role: role });

async function mockPatient(context, notices = []) {
  const state = { pending: notices, failReads: false, failAck: false, ackCalls: 0, holdAck: null };
  await context.addInitScript(token => {
    sessionStorage.setItem('ek_user', JSON.stringify({ user_id: 11, role: 'patient' }));
    sessionStorage.setItem('ek_token', token);
  }, createTestToken({ user_id: 11, role: 'patient' }));
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await context.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body = { data: [] };
    if (path === '/api/auth/profile') body = { data: { user_id: 11, role: 'patient', display_name: 'Queue Patient' } };
    else if (path === '/api/patients/me') body = { data: {} };
    else if (path === '/api/doctor') body = { data: [{ doctor_id: 1, is_available: 1 }] };
    else if (path === '/api/queue/me') body = null;
    else if (path === '/api/queue/status') body = {};
    else if (path === '/api/queue/cancellations') {
      if (state.failReads) return route.fulfill({ status: 503, json: { message: 'Notices unavailable.' } });
      body = { success: true, cancellations: state.pending };
    } else if (path.endsWith('/acknowledge-cancellation')) {
      expect(route.request().method()).toBe('PATCH');
      state.ackCalls++;
      if (state.holdAck) await state.holdAck;
      if (state.failAck) return route.fulfill({ status: 503, json: { message: 'Acknowledgment unavailable. Please retry.' } });
      state.pending = state.pending.filter(item => item.id !== Number(path.split('/')[3]));
      body = { success: true };
    }
    await route.fulfill({ json: body });
  });
  return state;
}

const dialog = page => page.getByRole('dialog', { name: 'Your queue ticket was cancelled' });

for (const role of ['staff', 'doctor', 'admin']) test(`${role} cancellation shows the full reason and stays acknowledged after reload and another login`, async ({ page, context }) => {
  const item = notice(1, role);
  const state = await mockPatient(context, [item]);
  await page.goto('/patient');
  await expect(dialog(page)).toContainText('AQ01');
  await expect(dialog(page)).toContainText(item.status_reason);
  const acknowledge = dialog(page).getByRole('button', { name: 'I understand' });
  await expect(acknowledge).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(acknowledge).toBeFocused();
  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);
  await expect(dialog(page)).toBeVisible();
  expect(state.ackCalls).toBe(0);
  await acknowledge.click();
  await expect(dialog(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(dialog(page)).toHaveCount(0);
  const anotherSession = await context.newPage();
  await anotherSession.goto('/patient/appointment-history');
  await expect(anotherSession.getByRole('main')).toBeVisible();
  await expect(dialog(anotherSession)).toHaveCount(0);
  expect(state.ackCalls).toBe(1);
});

test('notices survive offline refresh failure and show sequentially on appointment history', async ({ page, context }) => {
  const state = await mockPatient(context, [notice(1), notice(2, 'admin')]);
  state.failReads = true;
  await page.clock.install();
  await page.goto('/patient/appointment-history');
  await expect(page.getByRole('alert')).toContainText('Unable to refresh cancellation notices');
  await expect(dialog(page)).toHaveCount(0);
  state.failReads = false;
  await page.clock.fastForward(5_000);
  await expect(dialog(page)).toContainText('AQ01');
  await dialog(page).getByRole('button', { name: 'I understand' }).click();
  await expect(dialog(page)).toContainText('AQ02');
  await dialog(page).getByRole('button', { name: 'I understand' }).click();
  await expect(dialog(page)).toHaveCount(0);
});

test('failed acknowledgment keeps the notice open and disables repeat submissions while saving', async ({ page, context }) => {
  const state = await mockPatient(context, [notice()]);
  state.failAck = true;
  await page.goto('/patient/my-queue');
  await dialog(page).getByRole('button', { name: 'I understand' }).click();
  await expect(dialog(page).getByRole('alert')).toContainText('Please retry');
  state.failAck = false;
  let release;
  state.holdAck = new Promise(resolve => { release = resolve; });
  await dialog(page).getByRole('button', { name: 'I understand' }).click();
  await expect(dialog(page).getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(state.ackCalls).toBe(2);
  release();
  await expect(dialog(page)).toHaveCount(0);
});

test('new notices defer to an open patient dialog and an empty response opens nothing', async ({ page, context }) => {
  const state = await mockPatient(context);
  await page.clock.install();
  await page.goto('/patient');
  await expect(page.getByRole('button', { name: /^Get queue ticket/ })).toBeEnabled();
  await expect(dialog(page)).toHaveCount(0);
  await page.getByRole('button', { name: /^Get queue ticket/ }).click();
  const queueDialog = page.getByRole('dialog').first();
  await expect(queueDialog).toBeVisible();
  state.pending = [notice()];
  await page.clock.fastForward(5_000);
  await expect(dialog(page)).toHaveCount(0);
  await queueDialog.getByRole('button', { name: /close|cancel/i }).first().click();
  await expect(dialog(page)).toBeVisible();
});

for (const [open, close] of [
  ['How the dental queue works', 'Close queue guide'],
  ['Location City Health Office', 'Close map'],
]) test(`new cancellation waits until ${close.toLowerCase()} finishes`, async ({ page, context }) => {
  const state = await mockPatient(context);
  await page.clock.install();
  await page.goto('/patient');
  await page.getByRole('button', { name: open, exact: true }).click();
  state.pending = [notice()];
  await page.clock.fastForward(5_000);
  await expect(dialog(page)).toHaveCount(0);
  await page.getByRole('button', { name: close, exact: true }).click();
  await expect(dialog(page)).toBeVisible();
});

test('long cancellation reasons fit a narrow phone and desktop', async ({ page, context }, testInfo) => {
  await mockPatient(context, [{ ...notice(), status_reason: 'x'.repeat(255) }]);
  await page.goto('/patient');
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    await expect(dialog(page)).toContainText('x'.repeat(255));
    const dimensions = await dialog(page).evaluate(element => ({ width: element.clientWidth, contentWidth: element.scrollWidth }));
    expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width);
    if (width === 320) await page.screenshot({ path: testInfo.outputPath('queue-cancellation-mobile.png') });
  }
});
