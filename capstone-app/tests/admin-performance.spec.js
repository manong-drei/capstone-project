import { selectAdminSection } from "./helpers/admin";
import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";
import { SYNC_INTERVAL_MS } from "../src/services/dataSync";

async function mockAdmin(page) {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.addInitScript(token => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "admin" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 8, role: "admin" }));
  const state = {
    requests: [], failPatients: false, failAppointments: false,
    patients: Array.from({ length: 24 }, (_, index) => ({
      user_id: index + 1, patient_id: index + 1, first_name: "Patient", last_name: `Record ${index + 1}`,
      full_name: `Patient Record ${index + 1}`, contact_number: `0912345${String(index).padStart(4, "0")}`,
      barangay: "Poblacion", is_active: index < 23, sms_job_id: index + 100,
      sms_state: "submitted", sms_provider_status: "sent",
    })),
    appointments: Array.from({ length: 23 }, (_, index) => ({
      appointment_id: 23 - index, patient_full_name: `Visit ${index + 1}`,
      appointment_date: "2026-10-25", appointment_time: "09:00:00", reason: "Dental check-up",
      status: index < 12 ? "completed" : "pending",
    })),
  };
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    state.requests.push({ path: url.pathname, params: Object.fromEntries(url.searchParams), method: request.method() });
    if (/\/api\/admin\/patients\/\d+\/deactivate$/.test(url.pathname)) {
      expect(request.postDataJSON()).toEqual({ reason: "Duplicate account" });
      state.patients.find(patient => patient.user_id === Number(url.pathname.split("/").at(-2))).is_active = false;
      return route.fulfill({ json: { success: true } });
    }
    if (url.pathname === "/api/admin/patients" || url.pathname === "/api/appointments") {
      const patients = url.pathname === "/api/admin/patients";
      if (patients ? state.failPatients : state.failAppointments) {
        return route.fulfill({ status: 503, json: { message: "List temporarily unavailable." } });
      }
      const search = (url.searchParams.get("search") || "").toLowerCase();
      const rows = patients ? state.patients.filter(patient =>
        (url.searchParams.get("includeInactive") === "true" || patient.is_active) &&
        [patient.full_name, patient.contact_number, patient.barangay].some(value => value.toLowerCase().includes(search)))
        : url.searchParams.get("includeWalkIns") === "true"
          ? [...state.appointments, {
              queue_id: 23, queue_number: "WQ23", visit_type: "walk_in",
              patient_full_name: "Legacy Walk-in", appointment_date: "2026-10-24",
              appointment_time: "10:00:00", queue_services: ["Check-up"], status: "done",
              doctor_first_name: "Maria", doctor_last_name: "Santos",
            }]
          : state.appointments;
      const limit = Number(url.searchParams.get("limit") || 10);
      const totalPages = Math.max(1, Math.ceil(rows.length / limit));
      const pageNumber = Math.min(Number(url.searchParams.get("page") || 1), totalPages);
      const data = rows.slice((pageNumber - 1) * limit, pageNumber * limit);
      return route.fulfill({ json: {
        [patients ? "patients" : "data"]: data,
        pagination: { page: pageNumber, limit, total: rows.length, totalPages },
        ...(!patients && { summary: {
          total: rows.length,
          completed: rows.filter(row => ["done", "completed"].includes(row.status)).length,
          cancelledOrNoShow: rows.filter(row => ["cancelled", "no_show"].includes(row.status)).length,
        } }),
      } });
    }
    const responses = {
      "/api/auth/profile": { data: { user_id: 8, role: "admin", display_name: "Test Admin" } },
      "/api/admin/overview": {}, "/api/queue": [], "/api/doctor": { data: [] },
      "/api/admin/staff": { staff: [] }, "/api/admin/sms-settings": { data: { threshold: 5 } },
      "/api/admin/sms-jobs": { jobs: [] },
    };
    return route.fulfill({ json: responses[url.pathname] ?? { data: [] } });
  });
  return state;
}

async function selectTab(page, name) {

  await selectAdminSection(page, name);
}

test("overview fetches five appointments and defers management panels until opened", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const state = await mockAdmin(page);
  const modules = [];
  page.on("request", request => modules.push(request.url()));
  await page.goto("/admin");
  await expect(page.getByText("Visit 1", { exact: true }).filter({ visible: true })).toBeVisible();
  expect(state.requests.filter(request => request.path === "/api/appointments").map(request => request.params))
    .toEqual([{ limit: "5" }]);
  expect(state.requests.some(request => ["/api/admin/staff", "/api/admin/patients"].includes(request.path))).toBe(false);
  expect(modules.some(url => /\/(AdminReportsTab|AdminNotificationsTab|PatientManager|StaffManager|UserManual)[-.]/.test(url))).toBe(false);
  await expect(page.getByRole("region", { name: "Overview account management", exact: true })).toHaveCount(0);
  await selectAdminSection(page, "Accounts");
  await expect(page.getByRole("heading", { name: "Staff Management", exact: true })).toBeVisible();
  expect(state.requests.some(request => request.path === "/api/admin/staff")).toBe(true);
});

for (const width of [1440, 375]) {
  test(`patient paging, global search and inactive filtering fetch only the current page at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockAdmin(page);
    await page.goto("/admin");
    await selectTab(page, "Accounts");
    await page.getByRole("button", { name: "Patients", exact: true }).click();
    await expect(page.getByText("Showing 1–10 of 23", { exact: true })).toBeVisible();
    expect(state.requests.filter(request => request.path === "/api/admin/patients").at(-1).params)
      .toEqual({ page: "1", limit: "10", search: "", includeInactive: "false" });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Showing 11–20 of 23", { exact: true })).toBeVisible();
    expect(state.requests.filter(request => request.path === "/api/admin/patients").at(-1).params.page).toBe("2");
    await page.getByPlaceholder("Search by name, phone number, or barangay...").fill("Record 23");
    await expect(page.getByText("Showing 1–1 of 1", { exact: true })).toBeVisible();
    const lastSearch = state.requests.filter(request => request.path === "/api/admin/patients").at(-1).params;
    expect(lastSearch.search).toBe("Record 23");
    expect(lastSearch.page).toBe("1");
    await expect(page.getByRole("status")).toHaveCount(0);
    await page.getByPlaceholder("Search by name, phone number, or barangay...").fill("Record 24");
    await expect(page.getByText("No patients match your search.", { exact: true })).toBeVisible();
    await page.getByLabel("Show inactive", { exact: true }).check();
    await expect(page.getByText("Showing 1–1 of 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reactivate", exact: true }).filter({ visible: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`patients-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });

  test(`visit history includes walk-ins in pagination and totals at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await mockAdmin(page);
    state.appointments.at(-1).status = "cancelled";
    await page.addInitScript((interval) => {
      // Let the Retry button recover before polling can clear the error.
      const schedule = window.setInterval.bind(window);
      window.setInterval = (callback, delay, ...args) =>
        schedule(callback, delay === interval ? 60_000 : delay, ...args);
    }, SYNC_INTERVAL_MS);
    await page.goto("/admin");
    await selectTab(page, "Patients History");
    await expect(page.getByText("Showing 1–10 of 24", { exact: true })).toBeVisible();
    const completed = page.getByText("Completed", { exact: true }).first().locator("..");
    await expect(completed).toContainText("13");
    await expect(page.getByText("Cancelled / No-shows", { exact: true }).locator("..")).toContainText("1");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Showing 11–20 of 24", { exact: true })).toBeVisible();
    await expect(completed).toContainText("13");
    expect(state.requests.filter(request => request.path === "/api/appointments").at(-1).params)
      .toEqual({ page: "2", limit: "10", includeWalkIns: "true" });
    state.failAppointments = true;
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("List temporarily unavailable.");
    state.failAppointments = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByText("Showing 21–24 of 24", { exact: true })).toBeVisible();
    await expect(page.getByText(/Legacy Walk-in/).filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Walk-in · WQ23", { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/Dr\. Maria Santos/).filter({ visible: true })).toBeVisible();
    await expect(page.getByText("Appointment", { exact: true }).filter({ visible: true })).toHaveCount(3);
    if (width > 900) await expect(page.getByRole("columnheader", { name: "Ticket Type" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  });
}

test("patient polling stays on the current page, retries failures and recovers after deactivation", async ({ page }) => {
  const state = await mockAdmin(page);
  state.patients = state.patients.slice(0, 21);
  await page.clock.install();
  await page.goto("/admin");
  await selectTab(page, "Accounts");
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await expect(page.getByText("Showing 1–10 of 21", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Showing 11–20 of 21", { exact: true })).toBeVisible();
  await page.clock.runFor(15_000);
  expect(state.requests.filter(request => request.path === "/api/admin/patients").at(-1).params.page).toBe("2");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Showing 21–21 of 21", { exact: true })).toBeVisible();
  const deactivate = page.getByRole("button", { name: "Deactivate", exact: true }).filter({ visible: true });
  await expect(deactivate).toHaveAttribute("title", "Deactivate");
  await deactivate.click();
  const dialog = page.getByRole("dialog", { name: "Deactivate account" });
  const confirm = dialog.getByRole("button", { name: "Deactivate", exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Reason for deactivation").selectOption("Duplicate account");
  await confirm.click();
  await expect(page.getByText("Showing 11–20 of 20", { exact: true })).toBeVisible();
  state.failPatients = true;
  await page.clock.runFor(15_000);
  await expect(page.getByText("List temporarily unavailable.", { exact: true })).toBeVisible();
  state.failPatients = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("Showing 11–20 of 20", { exact: true })).toBeVisible();
});

test("finishing an account action refreshes the latest patient search", async ({ page }) => {
  const state = await mockAdmin(page);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route("**/api/admin/patients/1/deactivate", async route => {
    expect(route.request().postDataJSON()).toEqual({ reason: "Account no longer needed" });
    await pending;
    state.patients[0].is_active = false;
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/admin");
  await selectTab(page, "Accounts");
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await expect(page.getByText("Showing 1–10 of 23", { exact: true })).toBeVisible();
  await page.locator(".pm-table-row").first().getByRole("button", { name: "Deactivate", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Deactivate account" });
  await dialog.getByLabel("Reason for deactivation").selectOption("Account no longer needed");
  await dialog.getByRole("button", { name: "Deactivate", exact: true }).click();
  await page.getByPlaceholder("Search by name, phone number, or barangay...").fill("Record 23");
  await expect(page.getByText("Showing 1–1 of 1", { exact: true })).toBeVisible();
  const before = state.requests.filter(request => request.path === "/api/admin/patients").length;
  release();
  await expect.poll(() => state.requests.filter(request => request.path === "/api/admin/patients").length).toBeGreaterThan(before);
  await expect(page.getByText("Showing 1–1 of 1", { exact: true })).toBeVisible();
  expect(state.requests.filter(request => request.path === "/api/admin/patients").at(-1).params.search).toBe("Record 23");
});

test("the mobile admin queue renders before offscreen charts load", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAdmin(page);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route("**/api/queue", async route => {
    await pending;
    return route.fulfill({ json: [{ id: 1, category: "dental", queue_number: "AQ01", full_name: "Ana Santos", status: "waiting", type: "regular" }] });
  });
  await page.route("**/api/admin/overview", async route => {
    await pending;
    return route.fulfill({ json: { dentalAgeGroups: [{ age_group: "20–59 years", count: 3 }], volumeDaily: [] } });
  });
  let chartRequested = false;
  let releaseCharts;
  const pendingCharts = new Promise(resolve => { releaseCharts = resolve; });
  await page.route(/\/AdminOverviewCharts[.-]/, async route => {
    chartRequested = true;
    await pendingCharts;
    await route.continue();
  });
  await page.goto("/admin");
  const details = page.getByRole("region", { name: "Live queue details", exact: true });
  await expect(details.getByRole("status")).toHaveText("Loading live queue…");
  const volume = page.getByRole("heading", { name: "Patient Volume", exact: true }).locator("../..");
  const volumeBefore = await volume.boundingBox();
  release();
  try {
    await expect(details.getByText("Ana Santos", { exact: true })).toHaveCount(2);
    await expect(page.getByText("20–59 years", { exact: true })).toBeAttached();
    expect(chartRequested).toBe(false);
    await volume.scrollIntoViewIfNeeded();
    await expect.poll(() => chartRequested).toBe(true);
    await expect(volume.getByText("Loading patient volume…", { exact: true })).toHaveCount(1);
    await expect(volume.getByRole("img", { name: /monthly patient volume/i })).toHaveCount(0);
  } finally {
    releaseCharts();
  }
  await expect(volume.getByRole("img", { name: /monthly patient volume/i })).toBeVisible();
  expect((await volume.boundingBox()).height).toBe(volumeBefore.height);
});
