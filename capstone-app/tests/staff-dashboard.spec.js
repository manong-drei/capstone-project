import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockStaff(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript((token) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff", display_name: "Alex Staff" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 8, role: "staff" }));
  await page.clock.install();
  const state = { calls: [], actions: [], updates: [], registrations: [], searches: [], queues: [
    { id: 1, category: "dental", queue_number: "AP02", status: "waiting", type: "priority", patient_id: 11, full_name: "Priority Patient", is_walk_in: 0 },
    { id: 2, category: "dental", queue_number: "Q10", status: "waiting", type: "regular", patient_id: 12, full_name: "Walk-in Patient", is_walk_in: 1 },
    { id: 3, category: "general", queue_number: "G-001", status: "waiting", type: "regular", full_name: "Excluded General Patient" },
    { id: 4, category: "dental", queue_number: "AQ09", status: "done", type: "regular", full_name: "Completed Patient", is_walk_in: 0, has_consultation: 1 },
  ] };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body = {};
    if (url.pathname === "/api/auth/profile") body = { data: { user_id: 8, role: "staff", display_name: "Alex Staff" } };
    else if (url.pathname === "/api/doctor") body = { data: [{ doctor_id: 1, is_available: 1 }] };
    else if (url.pathname === "/api/queue") {
      expect(url.searchParams.get("category")).toBe("dental");
      body = state.queues.filter((queue) => ["waiting", "called", "serving", "missed", "done", "no_show"].includes(queue.status));
    } else if (url.pathname === "/api/queue/call-next") {
      state.calls.push(request.postDataJSON());
      if (state.queues.some(queue => queue.category === 'dental' && ['called', 'serving'].includes(queue.status))) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'A patient is already called or being served in this queue.' }) });
        return;
      }
      const next = state.queues.find((queue) => queue.category === "dental" && queue.status === "waiting");
      if (next) Object.assign(next, { status: 'called', call_count: 1, last_called_at: await page.evaluate(() => new Date().toISOString()) });
      body = next;
    } else if (/\/api\/queue\/\d+\/(recall|skip|return)$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/')[3]);
      const action = url.pathname.split('/')[4];
      state.actions.push(action);
      const queue = state.queues.find(q => q.id === id);
      const now = await page.evaluate(() => Date.now());
      if (action === 'recall') Object.assign(queue, { call_count: 2, last_called_at: new Date(now).toISOString() });
      if (action === 'return') Object.assign(queue, { status: 'waiting', returned_at: new Date(now).toISOString() });
      if (action === 'skip') {
        Object.assign(queue, { status: queue.returned_at ? 'no_show' : 'missed', grace_expires_at: queue.grace_expires_at || new Date(now + 600_000).toISOString() });
        const next = state.queues.find(q => q.category === 'dental' && q.status === 'waiting');
        if (next) Object.assign(next, { status: 'called', call_count: 1, last_called_at: new Date(now).toISOString() });
        body = { queue, next_queue: next || null };
      } else body = queue;
    } else if (/\/api\/queue\/\d+\/status/.test(url.pathname)) {
      const id = Number(url.pathname.split("/")[3]);
      const data = request.postDataJSON();
      if (data.status === 'cancelled') expect(data.reason).toBeTruthy();
      const queue = state.queues.find((queue) => queue.id === id);
      if (data.status === 'done' && !['serving', 'done'].includes(queue.status)) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'This queue status change is not allowed.' }) });
        return;
      }
      state.updates.push({ id, ...data });
      queue.status = data.status;
      body = queue;
    } else if (url.pathname === "/api/queue/walkin") {
      state.registrations.push(request.postDataJSON());
      body = { queue: { queue_number: "P03", sms_initial_position: 2, sms_alert_state: "suppressed" } };
    } else if (url.pathname === "/api/patients/search") {
      state.searches.push(url.search);
      const phone = url.searchParams.get("phone");
      body = { data: url.searchParams.get("name") === "Returning" || (phone && "09123456789".includes(phone)) ? [{ patient_id: 20, first_name: "Returning", last_name: "Patient", date_of_birth: "1960-01-01", masked_contact: "*******6789" }] : [] };
    } else if (url.pathname === "/api/patients/20") body = { data: { patient_id: 20, first_name: "Returning", last_name: "Patient", date_of_birth: "1960-01-01", gender: "Female", barangay: "Abuanan", contact_number: "09123456789", visits: [
      { id: 30, category: "dental", queue_number: "Q-030", status: "done", created_at: "2026-10-07T09:00:00+08:00" },
      { id: 31, category: "general", queue_number: "G-031", status: "done", created_at: "2026-10-07T09:00:00+08:00" },
    ] } };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return state;
}

test("staff keeps serving order, handles reasons, and calls only the dental queue", async ({ page }) => {
  const state = await mockStaff(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Welcome, Alex Staff." })).toBeVisible();
  await expect(page.getByText("Excluded General Patient")).toHaveCount(0);
  await expect(page.locator("#dental-queue ol li").first()).toContainText("AP02");
  await expect(page.getByText("Dentist available today")).toBeVisible();
  await page.screenshot({ path: "test-results/staff-desktop.png", fullPage: true });
  await expect(page.locator('#dental-queue').getByRole('button', { name: 'Call next patient', exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Call next patient" }).click();
  await expect(page.getByRole("button", { name: "Patient present", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Call next patient" })).toBeDisabled();
  const calledControls = await page.getByRole('region', { name: 'Called patient controls' }).boundingBox();
  const queueHeading = await page.getByRole('heading', { name: 'Dental queue', exact: true }).boundingBox();
  const upNext = await page.getByRole('heading', { name: 'Up next', exact: true }).boundingBox();
  expect(calledControls.y).toBeGreaterThan(queueHeading.y);
  expect(calledControls.y + calledControls.height).toBeLessThan(upNext.y);
  await page.screenshot({ path: 'test-results/staff-called-desktop.png', fullPage: true });
  const recall = page.getByRole('button', { name: 'Call again', exact: true });
  await expect(recall).toBeDisabled();
  await page.clock.fastForward(30_000);
  await recall.click();
  const skip = page.getByRole('button', { name: 'Skip and call next' });
  await expect(skip).toBeDisabled();
  await page.clock.fastForward(30_000);
  await skip.click();
  await expect(page.locator("#dental-queue")).toContainText("Q10");
  await expect(page.getByRole('region', { name: 'Missed patients' })).toContainText('AP02');
  expect(state.actions).toEqual(['recall', 'skip']);
  expect(state.calls).toEqual([{ category: "dental" }]);
  await page.getByRole('button', { name: 'Patient returned AP02' }).click();
  expect(state.queues[0].status).toBe('waiting');
  expect(state.queues[1].status).toBe('called');
  await expect(page.getByRole('region', { name: 'Missed patients' })).toHaveCount(0);
  await page.reload();
  state.queues[0].status = "waiting";
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: "Cancel queue AP02" }).click();
  await page.getByRole("radio", { name: "Schedule conflict / no longer available" }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel queue AP02" })).toHaveCount(0);
});

test("mobile walk-in registration preserves patient lookup, priority, service limits, and SMS instructions", async ({ page }) => {
  const state = await mockStaff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Register dental walk-in" })).toBeVisible();
  await page.getByLabel("Find an existing patient").fill("Returning");
  await page.getByRole("button", { name: /Returning Patient · 1960-01-01/ }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Returning Patient");
  await expect(page.getByLabel("Confirmed mobile number")).toHaveValue("9123456789");
  await expect(page.getByText("Previous dental visits: 1")).toBeVisible();
  await expect(page.getByText(/G-031/)).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Dental Check-up", exact: true }).check();
  await page.getByRole("checkbox", { name: "Oral Prophylaxis", exact: true }).check();
  await expect(page.getByRole("checkbox", { name: "Fluoride", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "Priority", exact: true }).check();
  await page.getByLabel("Priority category").selectOption("senior");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/staff-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Register and assign dental queue" }).click();
  await expect(page.getByRole("status")).toContainText("queue number P03");
  await expect(page.getByRole("status")).toContainText("Please stay nearby; no queue SMS will be sent.");
  expect(state.registrations[0]).toMatchObject({ category: "dental", patient_id: 20, services: ["CONSULTATION", "ORAL_PROPHYLAXIS"], type: "priority", priority_category: "senior", contact: "+639123456789" });
  await expect(page.getByLabel("Full name")).toHaveValue("");
});

test('partial phone lookup starts at four digits and clears matches below that threshold', async ({ page }) => {
  const state = await mockStaff(page);
  await page.goto('/staff');
  const lookup = page.getByLabel('Find an existing patient');
  const match = page.getByRole('button', { name: /Returning Patient · 1960-01-01/ });
  await lookup.fill('456');
  await page.clock.runFor(400);
  expect(state.searches).toEqual([]);
  for (const fragment of ['4567', '6789', '0912']) {
    await lookup.fill(fragment);
    await page.clock.runFor(400);
    await expect(match).toBeVisible();
    await expect.poll(() => new URLSearchParams(state.searches.at(-1)).get('phone')).toBe(fragment);
    expect(new URLSearchParams(state.searches.at(-1)).has('name')).toBe(false);
  }
  const searchCount = state.searches.length;
  await lookup.fill('456');
  await page.clock.runFor(400);
  await expect(match).toHaveCount(0);
  expect(state.searches).toHaveLength(searchCount);
  await lookup.fill('4567');
  await page.clock.runFor(400);
  await match.click();
  await expect(page.getByLabel('Full name')).toHaveValue('Returning Patient');
  await expect(page.getByLabel('Confirmed mobile number')).toHaveValue('9123456789');
});

test('partial phone lookup also uses the registration contact field and still requires a complete number', async ({ page }) => {
  const state = await mockStaff(page);
  await page.goto('/staff');
  const contact = page.getByLabel('Confirmed mobile number');
  await contact.fill('912');
  await page.clock.runFor(400);
  expect(state.searches).toEqual([]);
  await contact.fill('9123');
  await page.clock.runFor(400);
  await expect(page.getByRole('button', { name: /Returning Patient · 1960-01-01/ })).toBeVisible();
  expect(new URLSearchParams(state.searches.at(-1)).get('phone')).toBe('9123');
  expect(await contact.evaluate(input => input.checkValidity())).toBe(false);
  await page.getByRole('button', { name: /Returning Patient · 1960-01-01/ }).click();
  expect(await contact.evaluate(input => input.checkValidity())).toBe(true);
});

test('staff advances the queue while the doctor finishes the previous consultation notes', async ({ page, browser }) => {
  const state = await mockStaff(page);
  await page.goto('/staff');
  const call = page.getByRole('button', { name: 'Call next patient', exact: true });
  await expect(call).toBeEnabled();
  const doctor = await browser.newPage({ baseURL: new URL(page.url()).origin });
  const doctorCalls = [];
  const consultations = [];
  try {
    await doctor.clock.install();
    await doctor.addInitScript(token => {
      sessionStorage.setItem('ek_user', JSON.stringify({ user_id: 4, role: 'doctor' }));
      sessionStorage.setItem('ek_token', token);
    }, createTestToken({ user_id: 4, role: 'doctor' }));
    await doctor.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await doctor.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let body = {};
      if (path === '/api/auth/profile') body = { data: { user_id: 4, role: 'doctor' } };
      else if (path === '/api/doctor/daily-settings') body = { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 };
      else if (path === '/api/queue') body = state.queues;
      else if (path === '/api/queue/call-next') doctorCalls.push(route.request().postDataJSON());
      else if (path === '/api/doctor/consultations') {
        consultations.push(route.request().postDataJSON());
        state.queues.find(queue => queue.id === route.request().postDataJSON().queue_id).has_consultation = 1;
        body = { success: true, consultation_id: 1 };
      }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    await doctor.goto('/doctor');
    await expect(doctor.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
    await call.click();
    await expect(page.getByRole('button', { name: 'Patient present', exact: true })).toBeEnabled();
    await doctor.clock.fastForward(30_000);
    await expect(doctor.getByText('Called — awaiting patient', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Patient present', exact: true }).click();
    await expect(page.locator('#staff-call-next-hint')).toContainText('calling next will mark AP02 complete');
    await expect(call).toBeEnabled();
    await doctor.clock.fastForward(30_000);
    await doctor.getByRole('button', { name: 'Consult', exact: true }).click();
    await expect(doctor.getByRole('heading', { name: 'Consultation Notes' })).toBeVisible();
    await expect(doctor.getByText('Priority Patient', { exact: true }).last()).toBeVisible();
    await call.click();
    await expect(page.locator('#staff-call-next-hint')).toContainText('Called Q10');
    await expect(call).toBeDisabled();
    expect(state.queues[0].status).toBe('done');
    expect(state.queues[1].status).toBe('called');
    await doctor.getByRole('button', { name: 'Cancel', exact: true }).click();
    await doctor.clock.fastForward(30_000);
    await expect(doctor.getByRole('button', { name: 'Add notes for AQ09', exact: true })).toHaveCount(0);
    await doctor.getByRole('button', { name: 'Add notes for AP02', exact: true }).click();
    await expect(doctor.getByRole('heading', { name: 'Consultation Notes' })).toBeVisible();
    await doctor.getByPlaceholder('Chief complaint, history, physical examination findings...').fill('Finished check-up notes');
    await doctor.getByRole('button', { name: 'Save Consultation', exact: true }).click();
    await expect(doctor.getByRole('heading', { name: 'Consultation Notes' })).toHaveCount(0);
    await expect(doctor.getByRole('button', { name: 'Add notes for AP02', exact: true })).toHaveCount(0);
    expect(consultations).toEqual([{ queue_id: 1, notes: 'Finished check-up notes', diagnosis: '', prescription: '' }]);
    expect(doctorCalls).toEqual([]);
    expect(state.calls).toEqual([{ category: 'dental' }, { category: 'dental' }]);
    expect(state.updates).toEqual([{ id: 1, status: 'serving' }, { id: 1, status: 'done' }]);
    expect(state.queues[1].status).toBe('called');
  } finally {
    await doctor.close();
  }
});

for (const width of [1440, 375]) {
  test(`staff completes a check-up and calls next from the dental queue at ${width}px`, async ({ page }) => {
    const state = await mockStaff(page);
    state.queues[0].status = 'serving';
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/staff');
    const queue = page.locator('#dental-queue');
    await queue.getByRole('button', { name: 'Call next patient', exact: true }).click();
    await expect(queue.getByRole('region', { name: 'Called patient controls' })).toContainText('Called Q10');
    expect(state.updates).toEqual([{ id: 1, status: 'done' }]);
    expect(state.calls).toEqual([{ category: 'dental' }]);
    expect(state.queues[0].status).toBe('done');
    expect(state.queues[1].status).toBe('called');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 375) await page.screenshot({ path: 'test-results/staff-called-mobile.png', fullPage: true });
    await queue.getByRole('button', { name: 'Patient present', exact: true }).click();
    await queue.getByRole('button', { name: 'Finish check-up', exact: true }).click();
    await expect(queue.getByRole('button', { name: 'Call next patient', exact: true })).toBeDisabled();
    await expect(page.locator('#staff-call-next-hint')).toHaveText('No patients are waiting to be called.');
    expect(state.queues[1].status).toBe('done');
    expect(state.calls).toHaveLength(1);
  });
}

test('staff does not call another patient if completing the current check-up fails', async ({ page }) => {
  const state = await mockStaff(page);
  state.queues[0].status = 'serving';
  await page.route('**/api/queue/1/status', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Unable to finish this visit.' }) }));
  await page.goto('/staff');
  await page.getByRole('button', { name: 'Call next patient', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to finish this visit.');
  expect(state.queues[0].status).toBe('serving');
  expect(state.calls).toEqual([]);
});

test('staff can retry calling next after the previous check-up was completed successfully', async ({ page }) => {
  const state = await mockStaff(page);
  state.queues[0].status = 'serving';
  let failCall = true;
  await page.route('**/api/queue/call-next', route => failCall
    ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Unable to call next.' }) })
    : route.fallback());
  await page.goto('/staff');
  await page.getByRole('button', { name: 'Call next patient', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to call next.');
  expect(state.queues[0].status).toBe('done');
  expect(state.queues[1].status).toBe('waiting');
  failCall = false;
  await page.getByRole('button', { name: 'Call next patient', exact: true }).click();
  await expect(page.locator('#staff-call-next-hint')).toContainText('Called Q10');
  expect(state.updates).toEqual([{ id: 1, status: 'done' }]);
  expect(state.calls).toEqual([{ category: 'dental' }]);
});

test('staff refreshes a stale queue when another user has already called the next patient', async ({ page }) => {
  const state = await mockStaff(page);
  await page.route('**/api/queue/call-next', async route => {
    Object.assign(state.queues[0], { status: 'called', call_count: 1, last_called_at: new Date().toISOString() });
    await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'A patient is already called or being served in this queue.' }) });
  });
  await page.goto('/staff');
  await page.getByRole('button', { name: 'Call next patient', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('A patient is already called or being served');
  await expect(page.getByRole('button', { name: 'Call next patient', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Patient present', exact: true })).toBeVisible();
  await expect(page.locator('#staff-call-next-hint')).toContainText('Called AP02');
});

test('staff retains the called patient when the subsequent queue refresh fails', async ({ page }) => {
  const state = await mockStaff(page);
  await page.goto('/staff');
  const call = page.getByRole('button', { name: 'Call next patient', exact: true });
  await expect(call).toBeEnabled();
  await page.route('**/api/queue?category=dental', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Queue refresh unavailable.' }) }));
  await call.click();
  await expect(page.getByRole('alert')).toContainText('Queue refresh unavailable.');
  await expect(call).toBeDisabled();
  await expect(page.locator('#staff-call-next-hint')).toContainText('Called AP02');
  expect(state.calls).toEqual([{ category: 'dental' }]);
});
