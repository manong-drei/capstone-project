import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const CAPACITY_MESSAGE = "No appointment slots available for today.";

async function mockPatient(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript((token) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 11, role: "patient" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 11, role: "patient" }));
  const state = { registrationMessage: null, started: false, rejectRegistration: false, posts: 0, doctorAvailability: 1, failQueue: false, queue: { id: 1, queue_number: "AQ11", category: "dental", status: "waiting", type: "regular", services: ["CONSULTATION"] } };
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body = { data: [] };
    if (path === '/api/queue' && route.request().method() === 'POST') {
      state.posts++;
      state.ticketType = route.request().postDataJSON().type;
      if (state.rejectRegistration) {
        state.registrationMessage = CAPACITY_MESSAGE;
        return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: CAPACITY_MESSAGE }) });
      }
      state.queue = { id: 2, queue_number: 'AQ12', category: 'dental', status: 'waiting', type: 'regular', services: ['CONSULTATION'] };
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(state.queue) });
    }
    if (path === "/api/auth/profile") body = { data: { user_id: 11, role: "patient", display_name: "Queue Patient" } };
    else if (path === "/api/patients/me") body = { data: {} };
    else if (path === "/api/queue/me") {
      if (state.failQueue) return route.fulfill({ status: 503, json: { message: 'Queue temporarily unavailable.' } });
      body = state.queue;
    }
    else if (path === "/api/queue/status") body = { now_serving: state.started ? 'Q02' : null, registration_message: state.registrationMessage };
    else if (path === "/api/doctor") body = { data: [{ doctor_id: 1, is_available: state.doctorAvailability }] };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.clock.install();
  return state;
}

const estimatedWaitCard = page => page.getByText('Estimated wait', { exact: true }).locator('..');

test("the ticket and queue line load independently of eligibility", async ({ page }) => {
  const state = await mockPatient(page);
  state.started = true;
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route("**/api/patients/me", async route => {
    await pending;
    await route.fulfill({ json: { data: { priority_category: "senior" } } });
  });
  await page.goto("/patient");
  const ticket = page.getByRole("article", { name: "My queue ticket" });
  const join = page.getByRole("button", { name: /Get queue ticket/i });
  try {
    await expect(ticket).toContainText("AQ11");
    await expect(page.getByRole("region", { name: "Live queue status" })).toContainText("Q02");
    state.queue = null;
    await page.clock.fastForward(15_000);
    await expect(ticket).toHaveCount(0);
    await expect(join).toBeDisabled();
  } finally {
    release();
  }
  await join.click();
  await page.getByRole("checkbox", { name: "Dental Check-up", exact: true }).check();
  await page.getByRole("button", { name: "Get Queue Ticket", exact: true }).click();
  await expect(ticket).toContainText("AQ12");
  expect(state.ticketType).toBe("priority");
});

test("closing the floating ticket keeps it live and the button reopens it", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const state = await mockPatient(page);
  await page.goto("/patient");
  const ticket = page.getByRole("article", { name: "My queue ticket" });
  const close = ticket.getByRole("button", { name: "Close ticket", exact: true });
  await expect(close).toBeInViewport();
  await close.click();
  const reopen = page.getByRole("button", { name: /My ticket.*AQ11/ });
  await expect(reopen).toBeFocused();
  await expect(ticket).toHaveCount(0);
  state.queue.status = "called";
  await page.clock.fastForward(15_000);
  await expect(page.getByRole("status").filter({ hasText: "Please report to staff now" })).toHaveCount(1);
  await reopen.press("Enter");
  await expect(ticket).toContainText("It's your turn!");
  await expect(close).toBeFocused();
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`patient dashboard keeps ticket actions readable without overflow at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockPatient(page);
    const ticket = { ...state.queue, type: "priority", queue_number: "AP12345678" };
    state.queue = null;
    await page.goto("/patient");
    const grid = page.getByRole("region", { name: "Patient information", exact: true });
    const myQueue = page.getByRole("region", { name: "My Queue", exact: true });
    await expect(grid.getByRole("button", { name: "View queue line", exact: true })).toBeVisible();

    for (const active of [false, true]) {
      if (active) {
        state.queue = ticket;
        await page.clock.fastForward(15_000);
        await expect(myQueue).toContainText(ticket.queue_number);
        await expect(myQueue.getByRole("button", { name: "Cancel Queue", exact: true })).toBeVisible();
        await expect(myQueue.getByRole("button", { name: "View queue line", exact: true })).toHaveCount(0);
        const ticketBounds = await myQueue.boundingBox();
        await expect(myQueue).toHaveCSS("position", "fixed");
        expect(ticketBounds.y).toBeGreaterThanOrEqual(0);
        expect(ticketBounds.y + ticketBounds.height).toBeLessThanOrEqual(900);
        expect(await myQueue.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
      } else {
        await expect(myQueue).toHaveCount(0);
        await expect(grid).toContainText("No active queue number");
      }

      await expect(page.getByRole('region', { name: 'Patient tools', exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 375 || width === 1440) {
        await page.screenshot({ path: testInfo.outputPath(`patient-cards-${width}-${active ? "active" : "idle"}.png`), fullPage: true });
      }
    }
  });
}

for (const width of [1440, 375]) {
  test(`estimated wait refreshes with the patient's queue at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockPatient(page);
    state.queue.wait_estimate = { minutes: 45, patients_ahead: 3, sample_count: 2 };
    await page.goto('/patient');
    const card = estimatedWaitCard(page);
    await expect(card).toContainText('~45 min');
    await expect(card).toContainText('3 patients ahead. Based on today’s completed visits.');
    state.queue.wait_estimate = { minutes: 25, patients_ahead: 2, sample_count: 3 };
    await page.clock.fastForward(15_000);
    await expect(card).toContainText('~25 min');
    await expect(card).not.toContainText('~45 min');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`patient-wait-${width}.png`), fullPage: true });
  });
}

test('wait estimates label the starting assumption and replace numbers for next/called/serving/missed states', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue.wait_estimate = { minutes: 30, patients_ahead: 2, sample_count: 0 };
  await page.goto('/patient');
  const card = estimatedWaitCard(page);
  await expect(card).toContainText('~30 min');
  await expect(card).toContainText('Using 15 min per patient until visits are completed.');
  state.queue.wait_estimate = { minutes: 0, patients_ahead: 0, sample_count: 0 };
  await page.clock.fastForward(15_000);
  await expect(card).toContainText('You’re next');
  for (const [status, value, detail] of [
    ['called', 'Your turn', 'Please report to staff now'],
    ['serving', 'In progress', 'You are receiving care'],
    ['missed', 'On hold', 'Report to staff to rejoin the queue'],
  ]) {
    Object.assign(state.queue, { status, grace_expires_at: '2026-10-18T10:10:00+08:00' });
    await page.clock.fastForward(15_000);
    await expect(card).toContainText(value);
    await expect(card).toContainText(detail);
    await expect(card).not.toContainText(' min');
  }
});

test('wait estimates handle doctor unavailability, missing estimates, and patients without a ticket', async ({ page }) => {
  const state = await mockPatient(page);
  state.doctorAvailability = 0;
  state.queue.wait_estimate = { minutes: 15, patients_ahead: 1, sample_count: 0 };
  await page.goto('/patient');
  const card = estimatedWaitCard(page);
  await expect(card).toContainText('Paused');
  await expect(card).not.toContainText('~15 min');
  state.doctorAvailability = 1;
  state.queue.wait_estimate = null;
  await page.clock.fastForward(15_000);
  await expect(card).toContainText('Updating…');
  state.queue = null;
  await page.clock.fastForward(15_000);
  await expect(card).toContainText('Join the queue to see your estimate');
  await expect(card).not.toContainText(' min');
});

test('failed queue polls hide stale estimates and successful polls restore the latest value', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue.wait_estimate = { minutes: 40, patients_ahead: 2, sample_count: 1 };
  await page.goto('/patient');
  const card = estimatedWaitCard(page);
  await expect(card).toContainText('~40 min');
  state.failQueue = true;
  await page.clock.fastForward(15_000);
  await expect(card).toContainText('Queue updates failed. Retrying automatically.');
  await expect(card).not.toContainText('~40 min');
  await expect(page.getByText('Your Queue Number', { exact: true })).toBeVisible();
  state.failQueue = false;
  state.queue.wait_estimate = { minutes: 18, patients_ahead: 1, sample_count: 2 };
  await page.clock.fastForward(15_000);
  await expect(card).toContainText('~18 min');
  await expect(card).toContainText('1 patient ahead.');
});

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
  await expect(page.getByRole("article", { name: "My queue ticket" })).toBeVisible();
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

test('registration notices disable intake and clear when the notice is removed', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  state.registrationMessage = CAPACITY_MESSAGE;
  await page.goto('/patient');
  const join = page.getByRole('button', { name: /Get queue ticket/i });
  await expect(join).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText(CAPACITY_MESSAGE);
  expect(state.posts).toBe(0);
  state.registrationMessage = null;
  await page.clock.fastForward(15_000);
  await expect(join).toBeEnabled();
  await expect(page.getByText(CAPACITY_MESSAGE, { exact: true })).toHaveCount(0);
});

test('a patient can get a ticket while the queue is running', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  state.started = true;
  await page.goto('/patient');
  await expect(page.getByRole('region', { name: 'Live queue status' }).getByText('Q02', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Get queue ticket/i }).click();
  await page.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  await page.getByRole('button', { name: 'Get Queue Ticket', exact: true }).click();
  await expect(page.getByText('AQ12', { exact: true }).first()).toBeVisible();
  expect(state.posts).toBe(1);
});

test('an open ticket form remains available when the first patient is called', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue = null;
  await page.goto('/patient');
  await page.getByRole('button', { name: /Get queue ticket/i }).click();
  await page.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  const submit = page.getByRole('button', { name: 'Get Queue Ticket', exact: true });
  await expect(submit).toBeEnabled();
  state.started = true;
  await page.clock.fastForward(15_000);
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText('AQ12', { exact: true }).first()).toBeVisible();
  expect(state.posts).toBe(1);
});

test('a confirmed return explains rejoining the priority group without promising the next opening', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue.returned_at = '2026-10-18T10:00:00+08:00';
  await page.goto('/patient');
  await expect(page.getByRole('status')).toHaveText('Your return is confirmed. You have rejoined behind patients already waiting in your priority group; please stay nearby.');
  await expect(page.getByText('You will be called at the next opening', { exact: false })).toHaveCount(0);
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

test('a capacity rejection from an open form refreshes eligibility and explains the error', async ({ page }) => {
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
  await expect(page.getByRole('dialog', { name: 'Get Queue Ticket' }).getByRole('alert')).toHaveText(CAPACITY_MESSAGE);
  expect(alertMessage).toBe(CAPACITY_MESSAGE);
  expect(state.posts).toBe(1);
  expect(state.queue).toBeNull();
});
