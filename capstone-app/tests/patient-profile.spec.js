import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const profile = {
  patient_id: 42, user_id: 10, first_name: "Maria", middle_name: "Clara", last_name: "Santos",
  date_of_birth: "1992-03-17T16:00:00.000Z", gender: "Female", contact_number: "09175550128",
  barangay: "Poblacion", city: "Bago City", philhealth_id: "hidden-philhealth-number",
  emergency_contact: "Hidden Emergency Contact", emg_contact_no: "09185550142",
  account: { phone: "09175550128", is_active: 1, credential_version: 2 },
  visits: [
    { id: 18, queue_number: "D-018", services: '["CONSULTATION","ORAL_PROPHYLAXIS"]', created_at: "2026-11-04T01:30:00Z", is_walk_in: 0, status: "waiting" },
    { id: 6, queue_number: "D-006", services: ["CONSULTATION"], created_at: "2026-10-12T01:00:00Z", is_walk_in: 1, status: "done" },
  ],
};

async function mockApp(page, role = "staff", patch = {}) {
  const user = { user_id: 8, role, display_name: "Profile Tester" };
  const state = { patient: { ...profile, ...patch }, error: false, pending: false, reads: 0, merges: [] };
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken(user) });
  await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/patients/42") {
      state.reads++;
      if (state.pending) await new Promise((resolve) => { state.release = resolve; });
      return route.fulfill({ status: state.error ? 503 : 200, json: state.error ? { message: "Unable to load this patient." } : { data: state.patient } });
    }
    if (pathname === "/api/patients/43") return route.fulfill({ json: { data: { ...profile, patient_id: 43, first_name: "Correct", middle_name: null } } });
    if (pathname === "/api/patients/search") return route.fulfill({ json: { data: [{ ...profile, patient_id: 43, first_name: "Correct", masked_contact: "•••••••0128" }] } });
    if (pathname === "/api/patients/42/merge") {
      state.merges.push(route.request().postDataJSON());
      return route.fulfill({ json: { success: true } });
    }
    const historyVisit = { patient_id: 42, visit_id: "queue-18", queue_number: "D-018", visit_type: "appointment", visit_date: "2026-11-04", patient_full_name: "Maria Clara Santos", queue_services: ["CONSULTATION"], status: "waiting" };
    const responses = {
      "/api/auth/profile": { data: user },
      "/api/queue": [],
      "/api/doctor": { data: [{ doctor_id: 7, is_available: 1 }] },
      "/api/doctor/daily-settings": { appointment_limit: 10, walk_in_limit: 5, is_available: 1 },
      "/api/doctor/patient-history": { visits: [historyVisit] },
      "/api/appointments": { data: [{ ...historyVisit, appointment_id: 1, appointment_date: "2026-11-04", appointment_time: "09:30:00" }], pagination: { page: 1, totalPages: 1, total: 1 }, summary: {} },
    };
    return route.fulfill({ json: responses[pathname] ?? {} });
  });
  return state;
}

for (const role of ["doctor", "staff", "admin"]) {
  for (const width of [1920, 1280, 390]) {
    test(`${role} has one patient details card and no removed sections at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 960 });
      await mockApp(page, role);
      await page.goto(`/${role}/patients/42`);
      const identity = page.getByRole("region", { name: "Maria Clara Santos" });
      await expect(identity).toBeVisible();
      for (const text of ["Personal information", "Mar 18, 1992", "Female", "09175550128", "Poblacion, Bago City"]) await expect(identity).toContainText(text);
      await expect(page.getByRole("heading", { name: "Personal information" })).toHaveCount(1);
      const backLabel = role === "doctor" ? "Back to patient history" : `Back to ${role} dashboard`;
      const backLink = page.getByRole("link", { name: backLabel, exact: true });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute("href", role === "doctor" ? "/doctor/patient-history" : `/${role}`);
      const titleBox = await page.getByRole("heading", { name: "Patient profile", exact: true }).boundingBox();
      const backBox = await backLink.boundingBox();
      if (width >= 640) {
        expect(backBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
        expect(backBox.y).toBeLessThanOrEqual(titleBox.y + titleBox.height);
      } else {
        expect(backBox.y).toBeGreaterThan(titleBox.y + titleBox.height);
        expect(backBox.x).toBeCloseTo(titleBox.x, 0);
      }
      await expect(page.getByRole("tab")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(/Overview|Visit history|Consultations|PhilHealth|Emergency contact|Today's visit|hidden-philhealth-number|Hidden Emergency Contact/);
      const visibleVisits = width >= 768 ? page.getByRole("table", { name: "Patient visit records" }) : page.locator("article").first();
      await expect(visibleVisits).toContainText("D-018");
      await expect(visibleVisits).toContainText("Dental Check-up, Oral Prophylaxis");
      await expect(visibleVisits).toContainText("Waiting");
      const pagination = page.getByRole("navigation", { name: "Recent visits pagination" });
      await expect(pagination).toContainText("Showing 1–2 of 2");
      await expect(pagination.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
      await expect(pagination.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Start account recovery" })).toHaveCount(role === "doctor" ? 0 : 1);
      await expect(page.getByRole("navigation", { name: role === "admin" ? "Administrator navigation" : `${role[0].toUpperCase()}${role.slice(1)} navigation` })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: testInfo.outputPath(`patient-profile-${role}-${width}.png`), fullPage: true, animations: "disabled" });
      await page.reload();
      await expect(identity).toBeVisible();
    });
  }
}

test("long details wrap at 320px, and missing values and an empty history are clear", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const name = "Maria".repeat(30);
  await mockApp(page, "doctor", { first_name: name, barangay: "Barangay".repeat(40), date_of_birth: null, gender: null, contact_number: null, visits: [] });
  await page.goto("/doctor/patients/42");
  const identity = page.getByRole("region", { name: `${name} Clara Santos` });
  await expect(identity).toBeVisible();
  await expect(identity.getByText("Not recorded", { exact: true })).toHaveCount(3);
  await expect(page.getByText("No visits recorded yet.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Recent visits pagination" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("loading, a failed request, and retry retain the dashboard shell", async ({ page }) => {
  const state = await mockApp(page);
  state.pending = true;
  await page.goto("/staff/patients/42");
  await expect(page.getByRole("status", { name: "Loading patient profile" })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
  state.error = true;
  state.pending = false;
  state.release();
  await expect(page.getByRole("alert")).toContainText("Unable to load this patient.");
  const initialReads = state.reads;
  state.error = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("region", { name: "Maria Clara Santos" })).toBeVisible();
  expect(state.reads).toBe(initialReads + 1);
});

test("doctor patient names open the shared profile from history", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-04T02:00:00Z") });
  await mockApp(page, "doctor");
  await page.goto("/doctor/patient-history");
  await page.getByRole("link", { name: "Maria Clara Santos", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/doctor\/patients\/42$/);
  await expect(page.getByRole("region", { name: "Maria Clara Santos" })).toBeVisible();
  await page.getByRole("link", { name: "Back to patient history", exact: true }).click();
  await expect(page).toHaveURL(/\/doctor\/patient-history$/);
});

test("admin history links use the admin profile route", async ({ page }) => {
  await mockApp(page, "admin");
  await page.goto("/admin/patient-history");
  await page.getByRole("link", { name: "Maria Clara Santos", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/admin\/patients\/42$/);
  await expect(page.getByRole("region", { name: "Maria Clara Santos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to admin dashboard", exact: true })).toHaveAttribute("href", "/admin");
});

test("eligible walk-in merges preserve confirmation and navigate within the admin role", async ({ page }) => {
  const state = await mockApp(page, "admin", { user_id: null, account: null });
  await page.goto("/admin/patients/42");
  await page.getByLabel("Find the correct patient").fill("Correct");
  await page.getByRole("radio").check();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Merge into selected patient" }).click();
  expect(state.merges).toHaveLength(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Merge into selected patient" }).click();
  await expect(page).toHaveURL(/\/admin\/patients\/43$/);
  await expect(page.getByRole("region", { name: "Correct Santos" })).toBeVisible();
  expect(state.merges).toEqual([{ target_patient_id: 43, confirm: true }]);
});

test("archived profiles point to the destination patient and disable account recovery", async ({ page }) => {
  await mockApp(page, "staff", { archived_into_patient_id: 43 });
  await page.goto("/staff/patients/42");
  await expect(page.getByText("Archived record", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start account recovery" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Merge duplicate record" })).toHaveCount(0);
  await page.getByRole("link", { name: "patient #43", exact: true }).click();
  await expect(page.getByRole("region", { name: "Correct Santos" })).toBeVisible();
});

for (const width of [1440, 1024, 390, 320]) {
  test(`recent visits paginate without skipping records at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    const visits = Array.from({ length: 23 }, (_, index) => ({
      ...profile.visits[1], id: index + 1, queue_number: `D-${String(index + 1).padStart(3, "0")}`,
    }));
    const state = await mockApp(page, "staff", { visits, archived_into_patient_id: 43 });
    await page.goto("/staff/patients/42");
    const pagination = page.getByRole("navigation", { name: "Recent visits pagination" });
    const previous = pagination.getByRole("button", { name: "Previous", exact: true });
    const next = pagination.getByRole("button", { name: "Next", exact: true });
    const visibleRecord = (ticket) => page.getByText(ticket, { exact: true }).filter({ visible: true });
    const visibleRows = width >= 768 ? page.getByRole("table").locator("tbody tr") : page.locator("article");

    await expect(pagination).toContainText("Showing 1–10 of 23");
    await expect(pagination).toContainText("Page 1 of 3");
    await expect(previous).toBeDisabled();
    await expect(visibleRows).toHaveCount(10);
    await expect(visibleRecord("D-001")).toBeVisible();
    await expect(page.getByText("D-011", { exact: true })).toHaveCount(0);

    const initialReads = state.reads;
    await next.click();
    await expect(pagination).toContainText("Showing 11–20 of 23");
    await expect(pagination).toContainText("Page 2 of 3");
    await expect(visibleRows).toHaveCount(10);
    await expect(visibleRecord("D-011")).toBeVisible();
    await expect(visibleRecord("D-020")).toBeVisible();
    await expect(page.getByText("D-001", { exact: true })).toHaveCount(0);

    await next.click();
    await expect(pagination).toContainText("Showing 21–23 of 23");
    await expect(pagination).toContainText("Page 3 of 3");
    await expect(visibleRows).toHaveCount(3);
    await expect(visibleRecord("D-021")).toBeVisible();
    await expect(visibleRecord("D-023")).toBeVisible();
    await expect(next).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`recent-visits-pagination-${width}.png`), fullPage: true, animations: "disabled" });

    await previous.click();
    await expect(pagination).toContainText("Page 2 of 3");
    await expect(visibleRecord("D-011")).toBeVisible();
    expect(state.reads).toBe(initialReads);
    await page.getByRole("link", { name: "patient #43", exact: true }).click();
    await expect(page.getByRole("region", { name: "Correct Santos" })).toBeVisible();
    await expect(pagination).toContainText("Page 1 of 1");
    await expect(previous).toBeDisabled();
    await expect(next).toBeDisabled();
  });
}
