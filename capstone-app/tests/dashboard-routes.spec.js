import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockDashboard(page, role) {
  const user = { user_id: 8, role, display_name: "Route Tester" };
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken(user) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ body: "", contentType: "text/css" }));
  const doctor = { doctor_id: 7, first_name: "Maria", last_name: "Santos", is_available: 1 };
  const visit = { visit_id: "queue-1", consultation_id: 11, queue_number: "AQ11", patient_full_name: "My Patient", visit_date: "2026-11-02", visit_type: "appointment", status: "done" };
  const state = {
    doctor,
    queue: { id: 1, queue_number: "AQ11", category: "dental", status: "waiting", services: ["CONSULTATION"] },
    statusError: false,
    status: { now_serving: "Q01", current_status: "serving", next_queuing: "P02", line: [
      { queue_number: "Q01", status: "serving" },
      { queue_number: "P02", status: "waiting" },
      { queue_number: "AQ11", status: "waiting" },
    ] },
  };
  await page.route("**/api/**", route => {
    const url = new URL(route.request().url());
    const pagination = { page: Number(url.searchParams.get("page")) || 1, totalPages: 2, total: 11 };
    const report = { report_date: "2026-11-02", from: "2026-11-02", until: "2026-11-03", reports: [], age_groups: [], completed_demographics: [] };
    const responses = {
      "/api/auth/profile": { data: user },
      "/api/doctor": { data: [doctor] },
      "/api/doctor/7/records": { data: { doctor, availability: [] } },
      "/api/doctor/daily-settings": { appointment_limit: 10, walk_in_limit: 5, is_available: 1 },
      "/api/doctor/analytics": report,
      "/api/doctor/report": report,
      "/api/doctor/daily-report": { data: null },
      "/api/doctor/patient-history": { visits: [visit] },
      "/api/doctor/consultations/11": { data: { ...visit, notes: "Saved visit notes", prescriptions: [] } },
      "/api/doctor/leave-requests": { requests: [] },
      "/api/queue": [],
      "/api/queue/me": state.queue,
      "/api/queue/status": state.status,
      "/api/patients/me": { data: {} },
      "/api/admin/overview": {},
      "/api/admin/bohc-forecast": { forecasts: [], history: [] },
      "/api/admin/staff": { staff: [] },
      "/api/admin/patients": { patients: [], pagination },
      "/api/admin/audit-logs": { events: [], pagination },
      "/api/admin/sms-settings": { data: { threshold: 5 } },
      "/api/admin/sms-jobs": { jobs: [] },
      "/api/admin/doctor-leaves": { requests: [] },
      "/api/admin/doctor-leaves/9": { leave: { id: 9, doctor_name: "Maria Santos", start_date: "2026-11-03", end_date: "2026-11-04", status: "pending" }, impacts: { appointments: [], queues: [], version: "test" } },
      "/api/appointments": { data: [], summary: {}, pagination },
      "/api/appointments/me": { appointments: [] },
    };
    if (url.pathname === "/api/queue/status" && state.statusError) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fulfill({ json: responses[url.pathname] ?? { data: [] } });
  });
  return state;
}

const destinations = {
  patient: [
    ["/patient/appointment-history", "Appointment History"],
    ["/patient/my-queue", "My Queue"],
  ],
  doctor: [
    ["/doctor/analytics", "Doctor Analytics"],
    ["/doctor/patient-history", "Patient History"],
    ["/doctor/leave-requests", "Leave Requests"],
    ["/doctor/consultations/11", "Consultation Notes"],
    ["/doctor/reports/daily?date=2026-11-02", "Daily barangay entries"],
  ],
  admin: [
    ["/admin/analytics", "Statistics & Analytics"],
    ["/admin/doctors", "Doctor Availability"],
    ["/admin/doctors/7/records", "Doctor information"],
    ["/admin/leave-requests", "Leave Requests"],
    ["/admin/leave-requests/9", "Review leave request"],
    ["/admin/patient-history?page=2", "Patients History"],
    ["/admin/notifications", "SMS notifications"],
    ["/admin/accounts/staff", "Staff Management"],
    ["/admin/accounts/patients", "Patient Accounts"],
    ["/admin/audit-logs", "Audit Logs"],
    ["/admin/queue", "Live queue monitor"],
  ],
  staff: [
    ["/staff/account-recovery", "Find a patient for account recovery"],
    ["/staff/walk-ins/new", "Walk-in registration"],
  ],
};

for (const [role, routes] of Object.entries(destinations)) {
  test(`${role} sections and record views open directly and survive refresh`, async ({ page }) => {
    await mockDashboard(page, role);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const [url, heading] of routes) {
      await page.goto(url);
      await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
      await page.reload();
      await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
      await expect(page).toHaveURL(`http://127.0.0.1:3000${url}`);
    }
    expect(errors).toEqual([]);
  });

  test(`${role} cannot open another role's new dashboard URLs`, async ({ page }) => {
    await mockDashboard(page, role);
    const otherRoutes = Object.entries(destinations).filter(([otherRole]) => otherRole !== role).map(([, routes]) => routes[0][0]);
    for (const url of otherRoutes) {
      await page.goto(url);
      await expect(page).toHaveURL("http://127.0.0.1:3000/");
    }
  });
}

for (const width of [1440, 375]) {
  test(`My Queue shows the ordered line, marks my ticket and refreshes at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.clock.install();
    const state = await mockDashboard(page, "patient");
    await page.goto("/patient");
    const myQueueCard = page.getByRole("region", { name: "My Queue", exact: true });
    await expect(myQueueCard).toHaveCount(1);
    await expect(myQueueCard).toContainText("AQ11");
    await expect(myQueueCard).toContainText("Your Queue Number");
    await expect(myQueueCard).toContainText("Dental Check-up");
    await expect(myQueueCard.getByRole("button", { name: "Cancel Queue", exact: true })).toBeVisible();
    await expect(page.getByText("AQ11", { exact: true })).toHaveCount(1);
    await expect(page.getByText("My queue number", { exact: true })).toHaveCount(0);
    await myQueueCard.getByRole("button", { name: "View queue line", exact: true }).click();
    await expect(page).toHaveURL(/\/patient\/my-queue$/);
    const line = page.getByRole("list", { name: "Current queue line" });
    await expect(line.getByRole("listitem")).toHaveText([/Q01.*Now serving/, /P02.*Waiting/, /AQ11.*Your ticket.*Waiting/]);
    state.status.line = [{ queue_number: "AQ11", status: "called" }];
    state.status.now_serving = "AQ11";
    state.status.next_queuing = null;
    state.status.current_status = "called";
    state.queue.status = "called";
    await page.clock.fastForward(15_000);
    await expect(line.getByRole("listitem")).toHaveText([/AQ11.*Your ticket.*Now calling/]);
    await page.screenshot({ path: testInfo.outputPath(`my-queue-${width}.png`), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    state.statusError = true;
    await page.clock.fastForward(15_000);
    await expect(page.getByRole("alert")).toContainText("Unable to refresh the current queue line");
    await expect(line).toHaveCount(0);
    state.statusError = false;
    state.status = { now_serving: null, next_queuing: null, line: [] };
    await page.clock.fastForward(15_000);
    await expect(page.getByText("No active tickets in the queue.", { exact: true })).toBeVisible();
  });
}

test("My Queue shows the line without a personal ticket and respects the dentist's leave", async ({ page }) => {
  const state = await mockDashboard(page, "patient");
  state.queue = null;
  state.doctor.leave_end = "2026-11-04";
  await page.goto("/patient");
  const myQueueCard = page.getByRole("region", { name: "My Queue", exact: true });
  await expect(myQueueCard).toContainText("No active queue number");
  await myQueueCard.getByRole("button", { name: /My Queue/ }).click();
  await expect(page).toHaveURL(/\/patient\/my-queue$/);
  await expect(page.getByRole("list", { name: "Current queue line" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByText("Your ticket", { exact: true })).toHaveCount(0);
  await expect(page.getByText("The dentist is on leave. Please approach clinic staff for assistance.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get Queue Ticket", exact: true })).toBeDisabled();
});

test("admin navigation follows browser history and Overview has no duplicate account management", async ({ page }) => {
  await mockDashboard(page, "admin");
  await page.goto("/admin");
  await expect(page.getByRole("region", { name: "Overview account management" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Account Management", exact: true })).toHaveCount(0);
  await page.locator("#ad-sidebar").getByRole("button", { name: "Accounts", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/accounts\/staff$/);
  await page.getByRole("button", { name: "Patients", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/accounts\/patients$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Staff Management", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Patient Accounts", exact: true })).toBeVisible();
  await page.goto("/admin/accounts");
  await expect(page).toHaveURL(/\/admin\/accounts\/staff$/);
});

test("daily entries keep their date on refresh and protect unsaved changes during navigation", async ({ page }) => {
  await mockDashboard(page, "doctor");
  await page.goto("/doctor/analytics");
  await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
  await expect(page.getByLabel("Entry date", { exact: true })).toHaveValue("2026-11-02");
  await page.getByLabel("Entry date", { exact: true }).fill("2026-11-01");
  const count = page.getByRole("textbox", { name: /Abuanan, Orally fit children.*Male/ });
  await expect(page.getByLabel("Entry date", { exact: true })).toHaveValue("2026-11-01");
  await page.reload();
  await expect(page.getByLabel("Entry date", { exact: true })).toHaveValue("2026-11-01");
  await expect(count).toBeEnabled();
  await count.fill("3");
  const rejectedDialog = page.waitForEvent("dialog");
  const rejectedNavigation = page.getByRole("button", { name: "Patient History", exact: true }).click();
  await (await rejectedDialog).dismiss();
  await rejectedNavigation;
  await expect(page).toHaveURL(/\/doctor\/reports\/daily\?date=2026-11-01$/);
  await expect(count).toHaveValue("3");
  const backDialog = page.waitForEvent("dialog");
  await page.evaluate(() => window.history.back());
  await (await backDialog).dismiss();
  await expect(page).toHaveURL(/\/doctor\/reports\/daily\?date=2026-11-01$/);
  await expect(count).toHaveValue("3");
  const acceptedDialog = page.waitForEvent("dialog");
  const acceptedNavigation = page.getByRole("button", { name: "Patient History", exact: true }).click();
  await (await acceptedDialog).accept();
  await acceptedNavigation;
  await expect(page).toHaveURL(/\/doctor\/patient-history$/);
});

test("patient history filters survive refresh and opening a consultation preserves the return view", async ({ page }) => {
  await mockDashboard(page, "doctor");
  await page.goto("/doctor/patient-history?filter=all&type=appointment&sort=name&order=asc&search=My");
  await expect(page.getByRole("searchbox", { name: "Search patients or tickets" })).toHaveValue("My");
  await expect(page.getByRole("combobox", { name: "Visit type", exact: true })).toHaveValue("appointment");
  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Search patients or tickets" })).toHaveValue("My");
  await page.getByRole("button", { name: "View Notes", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/doctor\/consultations\/11\?filter=all&type=appointment&sort=name&order=asc&search=My$/);
  await expect(page.getByRole("dialog", { name: "Consultation Notes", exact: true })).toContainText("Saved visit notes");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/\/doctor\/patient-history\?filter=all&type=appointment&sort=name&order=asc&search=My$/);
  await expect(page.getByRole("searchbox", { name: "Search patients or tickets" })).toHaveValue("My");
});
