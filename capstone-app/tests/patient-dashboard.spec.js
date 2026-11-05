import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockPatient(page) {
  const user = { user_id: 51, role: "patient", first_name: "Maria", last_name: "Test", phone: "09123456789" };
  await page.addInitScript(({ user, token }) => { sessionStorage.setItem("ek_user", JSON.stringify(user)); sessionStorage.setItem("ek_token", token); }, { user, token: createTestToken(user) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const state = {
    queue: { id: 71, queue_number: "AQ07", full_name: "Maria Test", status: "waiting", category: "dental", type: "regular", created_at: "2026-11-05T01:42:19.000Z", services: ["CONSULTATION", "ORAL_PROPHYLAXIS"], wait_estimate: { minutes: 30, patients_ahead: 2, sample_count: 1 } },
    registration: null, availability: 1, leaveEnd: null, failDoctor: false, failQueue: false, failProfile: false, failHistory: false, priority: {}, writes: [],
  };
  await page.route("**/api/**", route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET") state.writes.push({ path, method: request.method() });
    if (path === "/api/auth/change-password") {
      expect(request.postDataJSON()).toEqual({ oldPassword: "OldPassword1", newPassword: "NewPassword2" });
      return route.fulfill({ json: { success: true, user, token: createTestToken({ ...user, credential_version: 2 }) } });
    }
    if ((path === "/api/doctor" && state.failDoctor) || (path === "/api/queue/me" && state.failQueue) || (path === "/api/patients/me" && state.failProfile) || (path === "/api/appointments/me" && state.failHistory)) return route.fulfill({ status: 503, json: { message: "Temporarily unavailable." } });
    const responses = {
      "/api/auth/profile": { data: user },
      "/api/patients/me": { data: { ...user, date_of_birth: "1990-06-15", gender: "Female", contact_number: user.phone, barangay: "Poblacion", city: "Bago City", philhealth_id: "123456789012", emergency_contact: "Family Test", emg_contact_no: "09987654321", ...state.priority } },
      "/api/queue/me": state.queue,
      "/api/queue/status": { now_serving: "AQ04", next_queuing: "AQ05", registration_message: state.registration, line: [{ queue_number: "AQ04", status: "serving" }, { queue_number: "AQ05", status: "waiting" }, ...(state.queue ? [{ queue_number: state.queue.queue_number, status: state.queue.status }] : [])] },
      "/api/doctor": { data: [{ doctor_id: 1, is_available: state.availability, leave_end: state.leaveEnd }] },
      "/api/appointments/me": { appointments: [{ appointment_id: 101, appointment_date: "2026-10-12", appointment_time: "09:30:00", doctor_first_name: "Dentist", doctor_last_name: "Test", status: "completed", queue_services: '["CONSULTATION","ORAL_PROPHYLAXIS"]', diagnosis: "Recorded diagnosis", recommendations: '["Clinic-provided follow-up note <script>bad()</script>"]' }] },
    };
    return route.fulfill({ json: Object.hasOwn(responses, path) ? responses[path] : {} });
  });
  await page.clock.install();
  return state;
}

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`ticket fields, profile and visit details fit at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockPatient(page);
    await page.goto("/patient");
    await expect(page.getByRole("heading", { name: "Welcome, Maria Test.", exact: true })).toBeVisible();
    await expect(page.getByTestId("patient-hero").locator("section")).toHaveCSS("background-image", /BGHero\.webp/);
    await expect(page.getByRole("region", { name: "Patient tools", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "My queue", exact: true })).toHaveCount(0);
    const ticket = page.getByRole("article", { name: "My queue ticket", exact: true });
    await expect(ticket).toContainText("Maria Test");
    await expect(ticket).toContainText("November 5, 2026");
    await expect(ticket).toContainText("9:42:19 AM PHT");
    await expect(ticket).toContainText("Oral Prophylaxis");
    await expect(ticket.getByRole("button", { name: "Download Ticket", exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`patient-dashboard-${width}.png`), fullPage: true });
    await expect(page.getByRole("link", { name: /^(My )?Profile$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Toggle menu", exact: true })).toHaveCount(0);
    if (width < 768) {
      const mobileNav = page.getByRole("navigation", { name: "Mobile patient navigation" });
      await expect(mobileNav.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "Visits" })).toBeVisible();
    }
    await page.getByRole("button", { name: /Maria Test/ }).click();
    await page.getByRole("group", { name: "Profile actions" }).getByRole("link", { name: "My Profile" }).click();
    const card = page.getByRole("region", { name: "Maria Test", exact: true });
    await expect(card.getByText("Regular", { exact: true })).toHaveClass(/bg-blue-100/);
    const password = card.getByRole("link", { name: "Change password", exact: true });
    const cardBox = await card.boundingBox();
    const passwordBox = await password.boundingBox();
    expect(cardBox.width).toBeGreaterThanOrEqual(width - 64);
    expect(passwordBox.x).toBeGreaterThan(cardBox.x + cardBox.width / 2);
    expect(passwordBox.y - cardBox.y).toBeLessThan(32);
    await expect(card).toHaveCSS("border-top-width", "1px");
    const personal = card.getByRole("region", { name: "Personal information" });
    const account = card.getByRole("region", { name: "Account details" });
    await expect(account.getByText(/priority/i)).toHaveCount(0);
    await expect(personal.getByText("Maria", { exact: true })).toBeVisible();
    await expect(personal.getByRole("textbox")).toHaveCount(0);
    await expect(card.getByText(/PhilHealth ID|Emergency contact/i)).toHaveCount(0);
    await personal.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Maria");
    await expect(page.getByLabel("First name", { exact: true })).toBeEditable();
    await expect(card.getByText(/PhilHealth ID|Emergency contact/i)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel("First name", { exact: true }).fill("Unsaved");
    await personal.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(personal.getByText("Maria", { exact: true })).toBeVisible();
    await expect(personal.getByRole("textbox")).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "My Profile", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/patient/appointment-history");
    await page.locator("main details summary").click();
    await expect(page.getByText("Dental Check-up, Oral Prophylaxis", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Clinic-provided follow-up note <script>bad()</script>", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(state.writes).toEqual([]);
  });
}

test("patient status sits beside the role tag and follows priority eligibility", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const state = await mockPatient(page);
  state.priority = { priority_category: "pwd", priority_expires_at: "2099-01-01T00:00:00.000Z" };
  await page.goto("/patient/profile");
  const card = page.getByRole("region", { name: "Maria Test", exact: true });
  const priority = card.getByText("Priority", { exact: true });
  await expect(priority).toHaveClass(/bg-orange-100/);
  const patientBox = await card.getByText("Patient", { exact: true }).boundingBox();
  const priorityBox = await priority.boundingBox();
  expect(priorityBox.x).toBeGreaterThan(patientBox.x);
  expect(priorityBox.y).toBe(patientBox.y);

  state.priority.priority_expires_at = "2000-01-01T00:00:00.000Z";
  await page.reload();
  await expect(card.getByText("Regular", { exact: true })).toHaveClass(/bg-blue-100/);
});

test("patients can change their password from My Profile", async ({ page }) => {
  const state = await mockPatient(page);
  await page.goto("/patient/profile");
  await page.getByRole("link", { name: "Change password", exact: true }).click();
  await page.getByLabel("Current Password", { exact: true }).fill("OldPassword1");
  await page.getByLabel("New Password", { exact: true }).fill("NewPassword2");
  await page.getByLabel("Confirm New Password", { exact: true }).fill("NewPassword2");
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(page).toHaveURL(/\/patient\/profile$/);
  await expect(page.getByText("Password changed successfully.", { exact: true })).toBeVisible();
  expect(state.writes).toEqual([{ path: "/api/auth/change-password", method: "PATCH" }]);
});

test("the retired notifications URL returns patients to their dashboard", async ({ page }) => {
  await mockPatient(page);
  await page.goto("/patient/notifications");
  await expect(page).toHaveURL("/patient");
  await expect(page.getByRole("navigation", { name: "Patient navigation" }).getByRole("link", { name: /Notifications/i })).toHaveCount(0);
});

test("dental availability uses distinct indicators and does not show leave as available", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const state = await mockPatient(page);
  await page.goto("/patient");
  const hero = page.getByTestId("patient-hero");
  const indicator = hero.locator("p > span");
  await expect(hero.getByText("Dentist available today", { exact: true })).toBeVisible();
  const availableColor = await indicator.evaluate(element => getComputedStyle(element).backgroundColor);
  state.availability = 0;
  await page.clock.fastForward(15_000);
  await expect(hero.getByText("Dentist unavailable today", { exact: true })).toBeVisible();
  const unavailableColor = await indicator.evaluate(element => getComputedStyle(element).backgroundColor);
  expect(unavailableColor).not.toBe(availableColor);
  state.availability = 1;
  state.leaveEnd = "2026-11-10";
  await page.clock.fastForward(15_000);
  await expect(hero.getByText(/Dentist on leave through/)).toBeVisible();
  await expect(indicator).toHaveCSS("background-color", unavailableColor);
  await expect(page.getByText("Estimated wait", { exact: true }).locator("..")).toContainText("Paused");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  state.failDoctor = true;
  await page.clock.fastForward(15_000);
  await expect(hero.getByText("Dentist availability unknown", { exact: true })).toBeVisible();
  const unknownColor = await indicator.evaluate(element => getComputedStyle(element).backgroundColor);
  expect(unknownColor).not.toBe(availableColor);
  expect(unknownColor).not.toBe(unavailableColor);
});

async function trackTicketDrawing(page) {
  await page.evaluate(() => {
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    window.ticketDraws = [];
    window.printCalls = 0;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      window.ticketDraws.push({ text, color: this.fillStyle, y: args[1], font: this.font });
      return fillText.call(this, text, ...args);
    };
    window.print = () => { window.printCalls++; };
  });
}

for (const [type, number, accent] of [['regular', 'AQ07', '#1d4ed8'], ['priority', 'AP07', '#c2410c']]) {
  test('Download Ticket saves a 4:3 ' + type + ' PNG directly', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const state = await mockPatient(page);
    Object.assign(state.queue, { type, queue_number: number, sms_initial_position: 4 });
    await page.goto('/patient');
    await trackTicketDrawing(page);
    const ticket = page.getByRole('article', { name: 'My queue ticket', exact: true });
    await expect(ticket).not.toContainText(/Status last checked|Initial position|Order may change/i);
    await expect(ticket).toContainText('9:42:19 AM PHT');
    await expect(ticket.getByText(type.toUpperCase(), { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Print Ticket|Print.*PDF/i })).toHaveCount(0);
    const pending = page.waitForEvent('download');
    await ticket.getByRole('button', { name: 'Download Ticket', exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('queue-ticket-' + number + '.png');
    const path = testInfo.outputPath(type + '-queue-ticket.png');
    await download.saveAs(path);
    const png = await readFile(path);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width * 3).toBe(height * 4);
    expect(width).toBeGreaterThanOrEqual(1440);
    const draws = await page.evaluate(() => window.ticketDraws);
    const content = draws.map(draw => draw.text).join(' ');
    expect(content).toContain('November 5, 2026 · 9:42:19 AM PHT');
    for (const text of ['Maria Test', number, type.toUpperCase(), 'Waiting', '9:42:19 AM PHT', 'Dental Check-up, Oral Prophylaxis']) expect(content).toContain(text);
    expect(content).not.toMatch(/STATUS LAST CHECKED|Initial position|Order may change/i);
    expect(draws.find(draw => draw.text === number).color).toBe(accent);
    for (const draw of draws) expect(draw.y + Number(draw.font.match(/([0-9.]+)px/)[1])).toBeLessThan(height / 2 - 12);
    expect(await page.evaluate(() => window.printCalls)).toBe(0);
    await expect(page.locator('#patient-ticket-print, a[download]')).toHaveCount(0);
    await page.getByRole('button', { name: 'View queue line', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'My Queue', exact: true, level: 1 })).toBeVisible();
    const second = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download Ticket', exact: true }).click();
    expect((await second).suggestedFilename()).toBe('queue-ticket-' + number + '.png');
  });
}

test('long ticket details remain inside a 4:3 downloaded image', async ({ page }, testInfo) => {
  const state = await mockPatient(page);
  state.queue.full_name = 'Maria Isabel de los Santos Reyes '.repeat(8).trim();
  await page.goto('/patient');
  await trackTicketDrawing(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Ticket', exact: true }).click();
  const download = await pending;
  const path = testInfo.outputPath('long-queue-ticket.png');
  await download.saveAs(path);
  const png = await readFile(path);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  expect(width * 3).toBe(height * 4);
  expect(height).toBeGreaterThan(1080);
  const draws = await page.evaluate(() => window.ticketDraws);
  for (const draw of draws) expect(draw.y + Number(draw.font.match(/([0-9.]+)px/)[1])).toBeLessThan(height / 2 - 12);
});

test('a failed ticket render shows an error and can be retried', async ({ page }) => {
  await mockPatient(page);
  await page.goto('/patient');
  await page.evaluate(() => {
    window.originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.getByRole('button', { name: 'Download Ticket', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not download your ticket.');
  await expect(page.locator('a[download]')).toHaveCount(0);
  await page.evaluate(() => { HTMLCanvasElement.prototype.getContext = window.originalGetContext; });
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Ticket', exact: true }).click();
  expect((await pending).suggestedFilename()).toBe('queue-ticket-AQ07.png');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('a ticket with no issuance date downloads without invalid timestamps', async ({ page }) => {
  const state = await mockPatient(page);
  state.queue.created_at = null;
  await page.goto('/patient');
  await trackTicketDrawing(page);
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Ticket', exact: true }).click();
  await pending;
  const content = await page.evaluate(() => window.ticketDraws.map(draw => draw.text).join(' '));
  expect(content).toContain('—');
  expect(content).not.toMatch(/Invalid Date|NaN|undefined/);
});

test("failed refresh blocks downloading and failed sections show retry instead of empty results", async ({ page }) => {
  const state = await mockPatient(page);
  await page.goto("/patient");
  const downloadButton = page.getByRole("button", { name: "Download Ticket", exact: true });
  await expect(downloadButton).toBeEnabled();
  state.failQueue = true;
  await page.clock.fastForward(15_000);
  await expect(downloadButton).toBeDisabled();
  state.failHistory = true;
  await page.goto("/patient/appointment-history");
  await expect(page.getByRole("button", { name: "Retry history", exact: true })).toBeVisible();
  await expect(page.getByText("No appointments found.", { exact: true })).toHaveCount(0);
  state.failHistory = false;
  await page.getByRole("button", { name: "Retry history", exact: true }).click();
  await expect(page.getByText("Dr. Dentist Test", { exact: true })).toBeVisible();
  state.failProfile = true;
  await page.goto("/patient/profile");
  await expect(page.getByRole("button", { name: "Retry profile", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Change password", exact: true })).toBeVisible();
  state.failProfile = false;
  await page.getByRole("button", { name: "Retry profile", exact: true }).click();
  await expect(page.getByRole("region", { name: "Personal information" }).getByText("Maria", { exact: true })).toBeVisible();
});
