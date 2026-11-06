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
    if (path === "/api/queue/71/cancel" && request.method() === "PATCH") {
      expect(request.postDataJSON()).toEqual({ reason: "No longer needs the service" });
      state.queue = null;
      return route.fulfill({ json: { success: true } });
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
    await expect(page.getByRole("heading", { name: /Your Health, Schedule/ })).toBeVisible();
    await expect(page.getByTestId("patient-hero")).toHaveCSS("background-image", /BGHero\.webp/);
    await expect(page.getByRole("region", { name: "Patient tools", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "My queue", exact: true })).toHaveCount(0);
    const ticket = page.getByRole("article", { name: "My queue ticket", exact: true });
    await expect(ticket).toContainText("Maria Test");
    await expect(ticket).toContainText("November 5, 2026");
    await expect(ticket).toContainText("9:42:19 AM PHT");
    await expect(ticket).toContainText("Oral Prophylaxis");
    await expect(ticket).toHaveCSS("text-align", "center");
    await expect(ticket.getByRole("button")).toHaveText(["Cancel Queue"]);
    await expect(page.getByRole("button", { name: /Download Ticket|Print Ticket/i })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`patient-dashboard-${width}.png`), fullPage: true });
    const nav = page.getByRole("navigation", { name: "Patient navigation" });
    const menu = nav.getByRole("button", { name: "Toggle menu", exact: true });
    if (width <= 640) {
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
    } else {
      await expect(menu).toHaveCount(0);
    }
    await expect(nav.getByRole("link", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Appointment history", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Maria Test/ }).click();
    await nav.getByRole("menuitem", { name: "My Profile", exact: true }).click();
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

test("the availability card distinguishes a dentist on leave from an available dentist", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const state = await mockPatient(page);
  await page.goto("/patient");
  const availability = page.getByText("Doctor availability", { exact: true }).locator("..");
  await expect(availability).toContainText("Available today");
  const availableColor = await availability.evaluate(element => getComputedStyle(element).borderLeftColor);
  state.availability = 0;
  await page.clock.fastForward(15_000);
  await expect(availability).toContainText("Unavailable today");
  const unavailableColor = await availability.evaluate(element => getComputedStyle(element).borderLeftColor);
  expect(unavailableColor).not.toBe(availableColor);
  state.availability = 1;
  state.leaveEnd = "2026-11-10";
  await page.clock.fastForward(15_000);
  await expect(availability).toContainText("On leave");
  await expect(availability).toContainText("Through November 10, 2026");
  await expect(availability).toHaveCSS("border-left-color", unavailableColor);
  await expect(page.getByText("Estimated wait", { exact: true }).locator("..")).toContainText("Paused");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  state.failDoctor = true;
  await page.clock.fastForward(15_000);
  await expect(availability).toContainText("Availability unknown");
  const unknownColor = await availability.evaluate(element => getComputedStyle(element).borderLeftColor);
  expect(unknownColor).not.toBe(availableColor);
  expect(unknownColor).not.toBe(unavailableColor);
});

test("long ticket details and missing issuance dates remain readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const state = await mockPatient(page);
  state.queue.full_name = "Maria Isabel de los Santos Reyes ".repeat(8).trim();
  state.queue.created_at = null;
  await page.goto("/patient");
  const ticket = page.getByRole("article", { name: "My queue ticket" });
  await expect(ticket).toContainText(state.queue.full_name);
  await expect(ticket.getByText("—", { exact: true })).toHaveCount(2);
  await expect(ticket).not.toContainText(/Invalid Date|NaN|undefined/);
  expect(await ticket.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("the ticket's cancellation action confirms a reason and clears the ticket", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await mockPatient(page);
  await page.goto("/patient");
  const ticket = page.getByRole("article", { name: "My queue ticket" });
  await ticket.getByRole("button", { name: "Cancel Queue", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Why are you cancelling your queue?" });
  const confirm = dialog.getByRole("button", { name: "Continue", exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByRole("radio", { name: "No longer needs the service" }).check();
  await confirm.click();
  await expect(ticket).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Get queue ticket/i })).toBeEnabled();
  expect(state.writes).toEqual([{ path: "/api/queue/71/cancel", method: "PATCH" }]);
});

test("failed sections display a warning or retry while preserving available information", async ({ page }) => {
  const state = await mockPatient(page);
  await page.goto("/patient");
  const ticket = page.getByRole("article", { name: "My queue ticket" });
  await expect(ticket).toContainText("AQ07");
  state.failQueue = true;
  await page.clock.fastForward(15_000);
  await expect(page.getByRole("alert")).toContainText("Displayed ticket information may be outdated.");
  await expect(ticket).toContainText("AQ07");
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
