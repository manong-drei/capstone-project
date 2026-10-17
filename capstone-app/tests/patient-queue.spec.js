import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const CLOSED_MESSAGE = "Today's dental queue has started. New same-day appointment registration is closed. Please approach staff for walk-in registration.";

async function mockPatient(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript((token) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 11, role: "patient" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 11, role: "patient" }));
  const state = { registrationMessage: null, started: false, rejectRegistration: false, posts: 0, queue: { id: 1, queue_number: "AQ11", category: "dental", status: "waiting", type: "regular", services: ["CONSULTATION"] } };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body = { data: [] };
    if (path === '/api/queue' && route.request().method() === 'POST') {
      state.posts++;
      if (state.rejectRegistration) {
        state.registrationMessage = CLOSED_MESSAGE;
        return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: CLOSED_MESSAGE }) });
      }
      state.queue = { id: 2, queue_number: 'AQ12', category: 'dental', status: 'waiting', type: 'regular', services: ['CONSULTATION'] };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(state.queue) });
    }
    if (path === "/api/auth/profile") body = { data: { user_id: 11, role: "patient", display_name: "Queue Patient" } };
    else if (path === "/api/queue/me") body = state.queue;
    else if (path === "/api/queue/status") body = { now_serving: state.started ? 'Q02' : null, registration_message: state.registrationMessage };
    else if (path === "/api/doctor") body = { data: [{ doctor_id: 1, is_available: 1 }] };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.clock.install();
  return state;
}

for (const [type, ticket] of [["regular", "AQ11"], ["priority", "AP11"]]) {
  test(`patient displays the assigned ${ticket} ticket`, async ({ page }) => {
    const state = await mockPatient(page);
    Object.assign(state.queue, { type, queue_number: ticket });
    await page.goto("/patient");
    await expect(page.getByText(ticket, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Get queue ticket/i })).toBeDisabled();
  });
}

test("patient clears a staff-cancelled ticket on the next poll", async ({ page }) => {
  const state = await mockPatient(page);
  await page.goto("/patient");
  const joinQueue = page.getByRole("button", { name: /Get queue ticket/i });
  await expect(joinQueue).toBeDisabled();
  state.queue = null;
  await page.clock.fastForward(15_000);
  await expect(joinQueue).toBeEnabled();
  await expect(page.getByText("Your Queue Number", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(joinQueue).toBeEnabled();
});

for (const status of ["", "cancelled", "done"]) {
  test(`a ${JSON.stringify(status)} ticket does not keep the patient in the active queue`, async ({ page }) => {
    const state = await mockPatient(page);
    state.queue.status = status;
    await page.goto("/patient");
    await expect(page.getByRole("heading", { name: /Your Health, Schedule/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Get queue ticket/i })).toBeEnabled();
    await expect(page.getByText("Your Queue Number", { exact: true })).toHaveCount(0);
  });
}

for (const status of ['called', 'missed']) {
  test(`${status} tickets stay active and show actionable instructions`, async ({ page }) => {
    const state = await mockPatient(page);
    Object.assign(state.queue, { status, grace_expires_at: '2026-10-10T09:10:00+08:00' });
    await page.goto('/patient');
    await expect(page.getByRole('button', { name: /Get queue ticket/i })).toBeDisabled();
    if (status === 'missed') await expect(page.getByRole('status')).toContainText('You missed your call. Report to staff before 9:10 AM to keep this ticket.');
    else await expect(page.getByRole('status')).toContainText('Please report to staff now');
  });
}

test('expired no-show explains closure and permits requesting a new ticket', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue.status = 'no_show';
  state.queue.status_reason = 'No-show — did not return within 10 minutes';
  await page.goto('/patient');
  await expect(page.getByRole('button', { name: /Get queue ticket/i })).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('This ticket ended as a no-show.');
  await expect(page.getByRole('status')).toContainText('did not return within 10 minutes');
});

test('closed registration directs patients to staff even between calls and refreshes when intake reopens', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  state.registrationMessage = CLOSED_MESSAGE;
  await page.goto('/patient');
  const join = page.getByRole('button', { name: /Get queue ticket/i });
  await expect(join).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText(CLOSED_MESSAGE);
  expect(state.posts).toBe(0);
  state.registrationMessage = null;
  await page.clock.fastForward(15_000);
  await expect(join).toBeEnabled();
  await expect(page.getByText(CLOSED_MESSAGE, { exact: true })).toHaveCount(0);
});

test('a patient with an existing eligible booking can get a ticket while the queue is running', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  state.started = true;
  await page.goto('/patient');
  await expect(page.getByText('Q02', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Get queue ticket/i }).click();
  await page.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  await page.getByRole('button', { name: 'Get Queue Ticket', exact: true }).click();
  await expect(page.getByText('AQ12', { exact: true }).first()).toBeVisible();
  expect(state.posts).toBe(1);
});

test('an open ticket form stops registration when the first-call cutoff arrives on a poll', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  await page.goto('/patient');
  await page.getByRole('button', { name: /Get queue ticket/i }).click();
  await page.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  const submit = page.getByRole('button', { name: 'Get Queue Ticket', exact: true });
  await expect(submit).toBeEnabled();
  state.registrationMessage = CLOSED_MESSAGE;
  await page.clock.fastForward(15_000);
  await expect(submit).toBeDisabled();
  await expect(page.getByRole('alert')).toHaveText(CLOSED_MESSAGE);
  expect(state.posts).toBe(0);
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 667 }]) {
  test(`queue ticket selection and keyboard access work at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const state = await mockPatient(page);
    state.queue = null;
    await page.goto('/patient');
    const join = page.getByRole('region', { name: 'Quick actions' }).getByRole('button', { name: /Get queue ticket/i });
    await join.click();
    const dialog = page.getByRole('dialog', { name: 'Get Queue Ticket' });
    const close = dialog.getByRole('button', { name: 'Close queue ticket' });
    const submit = dialog.getByRole('button', { name: 'Get Queue Ticket', exact: true });
    const checkup = dialog.getByRole('checkbox', { name: 'Dental Check-up', exact: true });
    const cleaning = dialog.getByRole('checkbox', { name: 'Oral Prophylaxis', exact: true });
    const others = dialog.getByRole('checkbox', { name: 'Others', exact: true });
    await expect(close).toBeFocused();
    await expect(submit).toBeDisabled();
    await checkup.check();
    await cleaning.check();
    await expect(dialog.getByRole('status')).toHaveText('2 / 2 selected');
    await expect(others).toBeDisabled();
    await expect(submit).toBeEnabled();
    const bounds = await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    const submitBounds = await submit.boundingBox();
    expect(submitBounds.y + submitBounds.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: testInfo.outputPath(`queue-modal-${viewport.width}.png`), animations: 'disabled' });
    await checkup.uncheck();
    await expect(others).toBeEnabled();
    await others.check();
    await expect(dialog.getByRole('status')).toHaveText('2 / 2 selected');
    await submit.focus();
    await join.focus();
    await expect(submit).toBeFocused();
    await close.focus();
    await page.keyboard.press('Tab');
    await expect(cleaning).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(join).toBeFocused();
    expect(state.posts).toBe(0);
    await join.click();
    await page.mouse.click(4, 4);
    await expect(dialog).not.toBeVisible();
  });
}

test('a cutoff rejection from a stale form refreshes eligibility and explains walk-in registration', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  await page.goto('/patient');
  await page.getByRole('button', { name: /Get queue ticket/i }).click();
  await page.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  state.rejectRegistration = true;
  let alertMessage;
  page.once('dialog', async dialog => { alertMessage = dialog.message(); await dialog.dismiss(); });
  const submit = page.getByRole('button', { name: 'Get Queue Ticket', exact: true });
  await submit.click();
  await expect(submit).toBeDisabled();
  await expect(page.getByRole('alert')).toHaveText(CLOSED_MESSAGE);
  expect(alertMessage).toBe(CLOSED_MESSAGE);
  expect(state.posts).toBe(1);
  expect(state.queue).toBeNull();
});
