import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockStaff(page) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript((token) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff", display_name: "Alex Staff" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 8, role: "staff" }));
  await page.clock.install();
  const returningPatient = {
    patient_id: 20, first_name: "Returning", last_name: "Patient", date_of_birth: "1959-12-31T16:00:00.000Z",
    gender: "Female", barangay: "Abuanan", contact_number: "09123456789", effective_priority_category: "senior",
  };
  const state = { calls: [], actions: [], updates: [], registrations: [], searches: [], returningPatient, queues: [
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
    else if (url.pathname === "/api/doctor") body = { data: [{ doctor_id: 1, first_name: "Maria", last_name: "Santos", is_available: 1 }] };
    else if (url.pathname === "/api/queue") {
      expect(url.searchParams.get("category")).toBe("dental");
      body = state.queues.filter((queue) => ["waiting", "called", "serving", "missed", "done", "no_show", "held"].includes(queue.status));
      if (state.serverTime !== undefined) body = { data: body, server_time: state.serverTime + await page.evaluate(() => performance.now()) };
    } else if (url.pathname === '/api/queue/hold-remaining') {
      state.actions.push('hold-remaining');
      const now = await page.evaluate(() => Date.now());
      const tickets = state.queues.filter(queue => queue.category === 'dental' && ['waiting', 'called', 'missed'].includes(queue.status));
      for (const queue of tickets) Object.assign(queue, { status: 'held', held_expires_at: new Date(now + 86_400_000).toISOString(), status_reason: 'Doctor unavailable — emergency or meeting' });
      body = { held_count: tickets.length };
    } else if (url.pathname === "/api/queue/call-next") {
      state.calls.push(request.postDataJSON());
      if (state.queues.some(queue => queue.category === 'dental' && ['called', 'serving'].includes(queue.status))) {
        await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ message: 'A patient is already called or being served in this queue.' }) });
        return;
      }
      const next = state.queues.find((queue) => queue.category === "dental" && queue.status === "waiting");
      if (next) Object.assign(next, { status: 'called', call_count: 1, last_called_at: await page.evaluate(() => new Date().toISOString()) });
      body = next;
    } else if (/\/api\/queue\/\d+\/(recall|skip|return|hold|reactivate)$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/')[3]);
      const action = url.pathname.split('/')[4];
      state.actions.push(action);
      const queue = state.queues.find(q => q.id === id);
      const now = await page.evaluate(() => Date.now());
      if (action === 'hold') Object.assign(queue, { status: 'held', held_expires_at: new Date(now + 86_400_000).toISOString(), status_reason: 'Doctor unavailable — emergency or meeting' });
      if (action === 'reactivate') {
        if (state.failRestore) return route.fulfill({ status: 409, json: { message: 'The 24-hour hold has expired. This ticket cannot be restored.' } });
        Object.assign(queue, { status: 'waiting', held_reactivated_at: new Date(now).toISOString(), held_insert_order: 1 });
        state.queues = [queue, ...state.queues.filter(item => item.id !== id)];
      }
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
      const { patient_id, first_name, last_name, date_of_birth, effective_priority_category } = returningPatient;
      body = { data: url.searchParams.get("name") === "Returning" || (phone && "09123456789".includes(phone)) ? [{ patient_id, first_name, last_name, date_of_birth, effective_priority_category, masked_contact: "*******6789" }] : [] };
    } else if (url.pathname === "/api/patients/20") body = { data: { ...returningPatient, visits: [
      { id: 30, category: "dental", queue_number: "Q-030", status: "done", created_at: "2026-10-07T09:00:00+08:00" },
      { id: 31, category: "general", queue_number: "G-031", status: "done", created_at: "2026-10-07T09:00:00+08:00" },
    ] } };
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  return state;
}

test('staff walk-ins today uses the capacity count excluding cancelled tickets', async ({ page }) => {
  const state = await mockStaff(page);
  state.queues = Array.from({ length: 7 }, (_, index) => ({
    id: index + 1, category: 'dental', queue_number: `WQ${index + 1}`,
    is_walk_in: 1, type: 'regular', status: index < 4 ? 'waiting' : 'cancelled',
  }));
  const dentist = { doctor_id: 1, is_available: 1, walk_in_limit: 15, walkin_count: 4 };
  let fail = false;
  await page.route('**/api/doctor', route => route.fulfill(fail
    ? { status: 503, json: { message: 'Unavailable' } }
    : { json: { data: [dentist] } }));
  await page.goto('/staff');
  const count = page.getByRole('region', { name: "Today's dental queue summary" })
    .getByText('Walk-ins today', { exact: true }).locator('..').locator('p').last();
  await expect(count).toHaveText('4');
  dentist.walkin_count = 3;
  await page.clock.fastForward(5000);
  await expect(count).toHaveText('3');
  fail = true;
  await page.clock.fastForward(5000);
  await expect(count).toHaveText('—');
});

test('staff hides held tickets and bulk doctor-unavailable cancellation', async ({ page }) => {
  const state = await mockStaff(page);
  Object.assign(state.queues[0], { status: 'held', held_expires_at: new Date(Date.now() + 86_400_000).toISOString() });
  await page.goto('/staff');
  await expect(page.locator('#dental-queue')).toBeVisible();
  await expect(page.getByText('Cancel remaining — doctor unavailable', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Show cancel remaining', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel remaining — doctor unavailable', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide cancel remaining', exact: true }).click();
  await expect(page.getByText('Cancel remaining — doctor unavailable', { exact: true })).toBeHidden();
  await expect(page.locator('#held-tickets-title')).toBeHidden();
  const toggle = page.locator('button[aria-controls="staff-held-tickets"]');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.locator('#held-tickets-title')).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Hide held tickets' }).click();
  await expect(page.locator('#held-tickets-title')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Call next patient' })).toBeVisible();
  expect(state.actions).toEqual([]);
});

test('walk-in capacity warns at five remaining slots without repeating on refresh', async ({ page }) => {
  await mockStaff(page);
  const dentist = { doctor_id: 1, is_available: 1, walk_in_limit: 10, walkin_count: 4 };
  await page.route('**/api/doctor', route => route.fulfill({ json: { data: [dentist] } }));
  await page.goto('/staff/walk-ins/new');
  await expect(page.getByText(/Walk-in slots almost full/)).toHaveCount(0);
  dentist.walkin_count = 5;
  await page.clock.fastForward(5000);
  await expect(page.getByText(/5 slots remaining today/)).toHaveCount(2);
  await page.getByRole('button', { name: 'Dismiss notification', exact: true }).click();
  await page.clock.fastForward(5000);
  await expect(page.getByText(/5 slots remaining today/)).toHaveCount(1);
  dentist.walkin_count = 9;
  await page.clock.fastForward(5000);
  await expect(page.getByText(/1 slot remaining today/)).toHaveCount(1);
  dentist.walkin_count = 10;
  await page.clock.fastForward(5000);
  await expect(page.getByText('SLOTS FULL — No more walk-ins can be accepted today')).toBeVisible();
  await expect(page.getByText(/Walk-in slots almost full/)).toHaveCount(0);
});

test('queue SMS toasts distinguish pending, sent, failed, and uncertain results and do not repeat on refresh', async ({ page }, testInfo) => {
  const state = await mockStaff(page);
  const queue = state.queues[0];
  Object.assign(queue, { sms_job_id: 70, sms_state: 'submitted', sms_provider_status: 'sent' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/staff');
  await expect(page.locator('#dental-queue')).toContainText('AP02');
  await expect(page.getByRole('status')).toHaveCount(0);

  for (const [sms_job_id, sms_state, sms_provider_status, role, message] of [
    [71, 'queued', null, 'status', 'queued for sending.'],
    [71, 'submitting', null, null, null],
    [71, 'submitted', 'pending', 'status', 'accepted by the SMS provider. Delivery is pending.'],
    [71, 'submitted', 'sent', 'status', 'sent successfully.'],
    [71, 'submitted', 'refunded', 'alert', 'could not be sent.'],
    [72, 'unknown', null, 'status', 'sending status is unknown. Verify the SMS history before retrying.'],
    [73, 'cancelled', null, 'status', 'was cancelled before sending.'],
  ]) {
    Object.assign(queue, { sms_job_id, sms_state, sms_provider_status });
    await page.clock.fastForward(5_000);
    if (role) {
      await expect(page.getByRole(role)).toHaveText(`Queue alert SMS for AP02 ${message}`);
      if (sms_provider_status === 'sent') {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath('queue-sms-toast-mobile.png') });
      }
      await page.getByRole('button', { name: 'Dismiss notification' }).click();
    }
    await page.clock.fastForward(5_000);
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
});

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
  await page.clock.runFor(14_000);
  await expect(recall).toBeDisabled();
  await page.clock.runFor(1_000);
  await expect(recall).toBeEnabled();
  await recall.click();
  const skip = page.getByRole('button', { name: 'Skip and call next' });
  await expect(skip).toBeDisabled();
  await page.clock.runFor(14_000);
  await expect(skip).toBeDisabled();
  await page.clock.runFor(1_000);
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
  await page.clock.fastForward(5_000);
  await page.getByRole("button", { name: "Cancel queue AP02" }).click();
  await page.getByRole("radio", { name: "Other", exact: true }).check();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Other reason' }).fill('  Patient requested rescheduling  ');
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel queue AP02" })).toHaveCount(0);
  expect(state.updates).toContainEqual({ id: 1, status: 'cancelled', reason: 'Patient requested rescheduling' });
});

test("mobile walk-in registration preserves patient lookup, priority, service limits, and SMS instructions", async ({ page }) => {
  const state = await mockStaff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Register dental walk-in" })).toBeVisible();
  await page.getByLabel("Find an existing patient").fill("Returning");
  await page.getByRole("button", { name: /Returning Patient · 1960-01-01/ }).click();
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Returning");
  await expect(page.getByLabel("Last name", { exact: true })).toHaveValue("Patient");
  await expect(page.getByLabel("Date of birth", { exact: true })).toHaveValue("1960-01-01");
  await expect(page.getByLabel("Confirmed mobile number")).toHaveValue("9123456789");
  await expect(page.getByText("Previous dental visits: 1")).toBeVisible();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText(/G-031/)).toHaveCount(0);
  const consultation = page.getByRole("checkbox", { name: "Consultation", exact: true });
  await page.getByRole("checkbox", { name: /^Tooth Extraction/ }).check();
  await consultation.check();
  await expect(page.getByRole("checkbox", { name: /^Tooth Extraction/ })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Priority", exact: true })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Regular", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Priority category")).toHaveValue("senior");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/staff-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Register and assign dental queue" }).click();
  await expect(page.getByRole("status")).toContainText("queue number P03");
  await expect(page.getByRole("status")).toContainText("Please stay nearby; no queue SMS will be sent.");
  expect(state.registrations[0]).toMatchObject({ category: "dental", patient_id: 20, first_name: "Returning", last_name: "Patient", services: ["CONSULTATION"], contact: "+639123456789" });
  expect(state.registrations[0]).not.toHaveProperty("priority_category");
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Last name", { exact: true })).toHaveValue("");
});

test('walk-in services are required and senior priority starts on the 60th birthday in Philippine time', async ({ page }) => {
  const state = await mockStaff(page);
  await page.clock.setFixedTime(new Date('2026-10-24T16:30:00Z'));
  await page.goto('/staff');
  const form = page.getByRole('form', { name: 'Dental walk-in registration' });
  const submit = form.getByRole('button', { name: 'Register and assign dental queue' });
  const services = form.getByRole('group', { name: 'Dental services', exact: true });
  const first = form.getByLabel('First name', { exact: true });
  const last = form.getByLabel('Last name', { exact: true });
  const dob = form.getByLabel('Date of birth');
  await expect(submit).toBeEnabled();
  await first.fill('Juan Pedro');
  await last.fill('Dela Cruz');
  await dob.fill('1966-10-26');
  await expect(form.getByRole('radio', { name: 'Regular', exact: true })).toBeChecked();
  await dob.fill('1966-10-25');
  await expect(form.getByLabel('Priority category')).toHaveValue('senior');
  await expect(form.getByLabel('Priority category')).toBeDisabled();
  await expect(form.getByText(/Senior Citizen priority assigned automatically/)).toContainText('60 years old today');
  await dob.fill('1966-10-26');
  await expect(form.getByRole('radio', { name: 'Regular', exact: true })).toBeChecked();
  await form.getByRole('radio', { name: 'Priority', exact: true }).check();
  await form.getByLabel('Priority category').selectOption('pwd');
  await dob.fill('1960-01-01');
  await expect(form.getByLabel('Priority category')).toHaveValue('senior');
  await dob.fill('1966-10-26');
  await expect(form.getByLabel('Priority category')).toHaveValue('pwd');
  await expect(form.getByLabel('Priority category')).toBeEnabled();
  await dob.fill('1966-10-25');
  await form.getByLabel('Gender', { exact: true }).selectOption('male');
  await form.getByLabel('Barangay, Bago City').selectOption('Barangay Poblacion, Bago City');
  await form.getByLabel('Confirmed mobile number').fill('9998765432');
  await page.clock.runFor(400);
  await expect(submit).toBeEnabled();
  const checkup = form.getByRole('checkbox', { name: 'Consultation', exact: true });
  await submit.click();
  await expect(checkup).toBeFocused();
  await expect(services).toHaveAttribute('aria-invalid', 'true');
  expect(state.registrations).toHaveLength(0);
  await checkup.check();
  await expect(submit).toBeEnabled();
  await expect(services).not.toHaveAttribute('aria-invalid');
  await submit.click();
  await expect(form.getByRole('status')).toContainText('queue number P03');
  expect(state.registrations[0]).toMatchObject({ first_name: 'Juan Pedro', last_name: 'Dela Cruz' });
  expect(state.registrations[0]).not.toHaveProperty('priority_category');
  await expect(form.getByRole('radio', { name: 'Regular', exact: true })).toBeChecked();
  await expect(submit).toBeEnabled();
  await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
});

test("staff see saved walk-in priority and send only intentional changes", async ({ page }) => {
  const state = await mockStaff(page);
  const patient = state.returningPatient;
  Object.assign(patient, {
    date_of_birth: "1990-01-01",
    priority_category: "pwd",
    effective_priority_category: "pwd",
  });
  await page.goto("/staff/walk-ins/new");
  const form = page.getByRole("form", { name: "Dental walk-in registration" });
  const choosePatient = async (category) => {
    await form.getByLabel("Find an existing patient").fill("Returning");
    const match = form.getByRole("button", { name: /Returning Patient · 1990-01-01/ });
    await expect(match).toContainText(category);
    await match.click();
  };
  const priority = form.getByLabel("Priority category");
  const regular = form.getByRole("radio", { name: "Regular", exact: true });
  const submit = form.getByRole("button", { name: "Register and assign dental queue" });

  await choosePatient("Priority (PWD)");
  await expect(form.getByText("Priority (PWD)", { exact: true })).toBeVisible();
  await expect(priority).toHaveValue("pwd");
  await form.getByRole("checkbox", { name: "Consultation", exact: true }).check();
  await submit.click();
  await expect(form.getByRole("status")).toContainText("queue number P03");
  expect(state.registrations[0]).not.toHaveProperty("priority_category");
  expect(state.registrations[0]).not.toHaveProperty("clear_priority");
  await expect(regular).toBeChecked();

  Object.assign(patient, {
    priority_category: "pregnant",
    effective_priority_category: "pregnant",
    priority_expires_at: "2027-02-27T16:00:00.000Z",
  });
  await page.goto("/staff/patients/20");
  await expect(page.getByText("Walk-in queue type", { exact: true })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "Priority (Pregnant)" })).toBeVisible();
  await expect(page.getByText(/Pregnancy priority expires on/)).toContainText("2027");

  await page.goto("/staff/walk-ins/new");
  await choosePatient("Priority (Pregnant)");
  await expect(priority).toHaveValue("pregnant");
  await expect(form.getByText(/Pregnancy priority expires on/)).toBeVisible();
  await form.getByRole("button", { name: "Clear selection" }).click();
  await expect(regular).toBeChecked();
  await expect(priority).toHaveCount(0);
  await choosePatient("Priority (Pregnant)");
  await regular.check();
  await form.getByRole("checkbox", { name: "Consultation", exact: true }).check();
  await submit.click();
  await expect(form.getByRole("status")).toContainText("queue number P03");
  expect(state.registrations[1]).toMatchObject({ patient_id: 20, clear_priority: true });
  expect(state.registrations[1]).not.toHaveProperty("priority_category");

  Object.assign(patient, { effective_priority_category: null, priority_expires_at: null });
  await choosePatient("Regular");
  await expect(regular).toBeChecked();
  await expect(form.getByText(/Confirm whether the patient is still pregnant/)).toBeVisible();
});

for (const width of [1440, 375, 320]) {
  test(`walk-in validation marks required fields and focuses the first problem at ${width}px`, async ({ page }, testInfo) => {
    const state = await mockStaff(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/staff');
    const form = page.getByRole('form', { name: 'Dental walk-in registration' });
    const submit = form.getByRole('button', { name: 'Register and assign dental queue' });
    const services = form.getByRole('group', { name: 'Dental services', exact: true });
    const checkup = form.getByRole('checkbox', { name: 'Dental Check-up', exact: true });
    const first = form.getByLabel('First name', { exact: true });
    const last = form.getByLabel('Last name', { exact: true });
    const dob = form.getByLabel('Date of birth', { exact: true });
    const gender = form.getByLabel('Gender', { exact: true });
    const address = form.getByLabel('Barangay, Bago City', { exact: true });
    const contact = form.getByLabel('Confirmed mobile number', { exact: true });
    await expect(services.locator('legend')).not.toContainText('Required');
    expect(await services.locator('legend [aria-hidden="true"]').evaluate(mark => getComputedStyle(mark, '::after').content)).toBe('"*"');
    for (const field of [first, last, dob, gender, address, contact]) {
      const id = await field.getAttribute('id');
      expect(await form.locator(`label[for="${id}"] [aria-hidden="true"]`).evaluate(mark => getComputedStyle(mark, '::after').content)).toBe('"*"');
      await expect(field).toHaveAttribute('required', '');
    }
    await expect(form.getByLabel('Middle name (optional)')).not.toHaveAttribute('required');
    await expect(form.getByLabel('Suffix (optional)')).not.toHaveAttribute('required');
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(checkup).toBeFocused();
    await expect(services).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByRole('alert')).toContainText('Please check the highlighted fields');
    for (const field of [first, last, dob, gender, address, contact]) {
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      const errorId = (await field.getAttribute('aria-describedby')).split(' ').at(-1);
      await expect(form.locator(`#${errorId}`)).toBeVisible();
    }
    expect(state.registrations).toHaveLength(0);
    await form.screenshot({ path: testInfo.outputPath(`walkin-validation-${width}.png`), animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await checkup.check();
    await expect(services).not.toHaveAttribute('aria-invalid');
    await submit.click();
    await expect(first).toBeFocused();
    await first.fill('   ');
    await expect(first).toHaveAttribute('aria-invalid', 'true');
    await first.fill('Juan');
    await expect(first).not.toHaveAttribute('aria-invalid');
    await first.press('Enter');
    await expect(last).toBeFocused();
    await last.fill('Cruz');
    await dob.fill('2099-01-01');
    await submit.click();
    await expect(dob).toBeFocused();
    await expect(form.getByText('Date of birth cannot be in the future.', { exact: true })).toBeVisible();
    await dob.fill('2000-01-01');
    await expect(dob).not.toHaveAttribute('aria-invalid');
    await gender.selectOption('male');
    await address.selectOption('Barangay Poblacion, Bago City');
    await contact.fill('812');
    await submit.click();
    await expect(contact).toBeFocused();
    await expect(contact).toHaveAttribute('aria-describedby', 'walkin-contact-help walkin-contact-error');
    await contact.fill('9998765432');
    await expect(contact).not.toHaveAttribute('aria-invalid');
    await expect(contact).toHaveAttribute('aria-describedby', 'walkin-contact-help');
    await form.getByRole('radio', { name: 'Priority', exact: true }).check();
    await submit.click();
    const priority = form.getByLabel('Priority category', { exact: true });
    await expect(priority).toBeFocused();
    await expect(priority).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByText('Select a priority category.', { exact: true })).toBeVisible();
    await form.getByRole('radio', { name: 'Regular', exact: true }).check();
    await expect(priority).toHaveCount(0);
    await expect(form.getByRole('alert')).toHaveCount(0);
    await form.getByRole('radio', { name: 'Priority', exact: true }).check();
    await priority.selectOption('pwd');
    expect(state.registrations).toHaveLength(0);
    await submit.click();
    await expect(form.getByRole('status')).toContainText('queue number P03');
    expect(state.registrations).toHaveLength(1);
    expect(state.registrations[0]).toMatchObject({ first_name: 'Juan', last_name: 'Cruz', contact: '+639998765432', priority_category: 'pwd' });
    await expect(form.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(first).toHaveValue('');
  });
}

test('walk-in validation focuses duplicate confirmation and clears it when staff confirm a new record', async ({ page }) => {
  const state = await mockStaff(page);
  await page.goto('/staff');
  const form = page.getByRole('form', { name: 'Dental walk-in registration' });
  await form.getByRole('checkbox', { name: 'Dental Check-up', exact: true }).check();
  await form.getByLabel('First name', { exact: true }).fill('Juan');
  await form.getByLabel('Last name', { exact: true }).fill('Cruz');
  await form.getByLabel('Date of birth', { exact: true }).fill('2000-01-01');
  await form.getByLabel('Gender', { exact: true }).selectOption('male');
  await form.getByLabel('Barangay, Bago City', { exact: true }).selectOption('Barangay Poblacion, Bago City');
  await form.getByLabel('Confirmed mobile number', { exact: true }).fill('9998765432');
  await form.getByLabel('Find an existing patient', { exact: true }).fill('Returning');
  await expect(form.getByRole('button', { name: /Returning Patient · 1960-01-01/ })).toBeVisible();
  const confirm = form.getByRole('checkbox', { name: 'I checked these records; create a new patient.', exact: true });
  await form.getByRole('button', { name: 'Register and assign dental queue' }).click();
  await expect(confirm).toBeFocused();
  await expect(confirm).toHaveAttribute('aria-invalid', 'true');
  await expect(form.getByText('Select an existing patient above or confirm that this is a new patient.', { exact: true })).toBeVisible();
  expect(state.registrations).toHaveLength(0);
  await confirm.check();
  await expect(confirm).not.toHaveAttribute('aria-invalid');
  await expect(form.getByRole('alert')).toHaveCount(0);
  await form.getByRole('button', { name: 'Register and assign dental queue' }).click();
  await expect(form.getByRole('status')).toContainText('queue number P03');
  expect(state.registrations).toHaveLength(1);
  expect(state.registrations[0].create_new_confirmed).toBe(true);
});

test('up next paginates every waiting ticket and handles a shrinking queue', async ({ page }) => {
  const state = await mockStaff(page);
  state.queues.push(...Array.from({ length: 10 }, (_, index) => ({
    id: 5 + index, category: 'dental', queue_number: `Q${11 + index}`, status: 'waiting', type: 'regular', full_name: `Patient ${index}`,
  })));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/staff');
  const rows = page.locator('#dental-queue ol li');
  const pages = page.getByRole('navigation', { name: 'Up next pagination' });
  const previous = pages.getByRole('button', { name: 'Previous queue page' });
  const next = pages.getByRole('button', { name: 'Next queue page' });
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText('AP02');
  await expect(previous).toBeDisabled();
  await expect(pages).toContainText('1–5 of 12 waiting');
  await next.click();
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText('Q14');
  await expect(rows.first().locator(':scope > span').first()).toHaveText('6');
  await next.click();
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Q19');
  await expect(rows.last()).toContainText('Q20');
  await expect(next).toBeDisabled();
  await expect(pages).toContainText('11–12 of 12 waiting');
  state.queues = state.queues.filter(queue => queue.id <= 9);
  await page.clock.fastForward(5_000);
  await expect(pages).toContainText('Page 2 of 2');
  await expect(rows).toHaveCount(2);
  await previous.click();
  await expect(rows).toHaveCount(5);
  await expect(rows.first()).toContainText('AP02');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
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
  await expect(page.getByLabel('First name', { exact: true })).toHaveValue('Returning');
  await expect(page.getByLabel('Last name', { exact: true })).toHaveValue('Patient');
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
    await expect(page.getByRole('dialog', { name: 'Complete walk-in Q10' })).toHaveCount(0);
    await expect(queue.getByRole('button', { name: 'Call next patient', exact: true })).toBeDisabled();
    await expect(page.locator('#staff-call-next-hint')).toHaveText('No patients are waiting to be called.');
    expect(state.queues[1].status).toBe('done');
    expect(state.updates.at(-1)).toEqual({ id: 2, status: 'done' });
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
  await page.route('**/api/queue?category=dental&include_clock=1', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Queue refresh unavailable.' }) }));
  await call.click();
  await expect(page.getByRole('alert')).toContainText('Queue refresh unavailable.');
  await expect(call).toBeDisabled();
  await expect(page.locator('#staff-call-next-hint')).toContainText('Called AP02');
  expect(state.calls).toEqual([{ category: 'dental' }]);
});
