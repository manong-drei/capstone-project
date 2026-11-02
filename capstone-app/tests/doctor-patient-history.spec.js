import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const now = "2026-10-29T10:30:00+08:00";
const visits = [
  { visit_id: "queue-1", queue_number: "AQ01", visit_type: "appointment", visit_date: "2026-10-29", visit_time: "09:00:00", patient_full_name: "Ana Santos", queue_services: '["CONSULTATION"]', status: "done", consultation_id: 11 },
  { visit_id: "queue-2", queue_number: "WQ02", visit_type: "walk_in", visit_date: "2026-10-29", visit_time: "10:00:00", patient_full_name: "Ana Santos", queue_services: ["ORAL_PROPHYLAXIS"], status: "done", consultation_id: 12 },
  { visit_id: "queue-3", queue_number: "WQ03", visit_type: "walk_in", visit_date: "2026-10-29", visit_time: "10:20:00", patient_full_name: "No Notes Patient", status: "done", consultation_id: null },
  { visit_id: "appointment-4", visit_type: "appointment", visit_date: "2026-10-28", visit_time: "09:00:00", patient_full_name: "Earlier Patient", reason: "Check-up", status: "completed", consultation_id: null },
];

async function mockDoctor(page) {
  const user = { user_id: 4, role: "doctor", display_name: "Test Doctor" };
  await page.clock.install({ time: new Date(now) });
  await page.addInitScript(({ user, token }) => {
    sessionStorage.setItem("ek_user", JSON.stringify(user));
    sessionStorage.setItem("ek_token", token);
  }, { user, token: createTestToken({ ...user, exp: Math.floor(new Date(now).getTime() / 1000) + 86400 }) });
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  const responses = {
    "/api/auth/profile": { data: user },
    "/api/queue": [],
    "/api/doctor/daily-settings": { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 },
    "/api/doctor/patient-history": { success: true, visits },
    "/api/doctor/consultations/11": { data: { notes: "First visit notes", diagnosis: "First diagnosis", prescriptions: ["First recommendations"] } },
    "/api/doctor/consultations/12": { data: { notes: "Return visit notes\nSecond line", diagnosis: "Return diagnosis", prescriptions: ["Follow-up instructions"] } },
  };
  await page.route("**/api/**", route => route.fulfill({ json: responses[new URL(route.request().url()).pathname] ?? {} }));
  return responses;
}

async function openHistory(page) {
  await page.goto("/doctor");
  if (page.viewportSize().width <= 640) await page.getByRole("button", { name: "Toggle menu", exact: true }).click();
  await page.getByRole("button", { name: "Patient History", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: "Patient History", exact: true })).toBeVisible();
}

for (const width of [1440, 768, 375]) {
  test(`patient history shows visit types and opens the exact visit's read-only notes at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockDoctor(page);
    const reads = [];
    const writes = [];
    page.on("request", request => {
      if (/\/doctor\/consultations\/\d+$/.test(request.url())) reads.push(request.url().split("/").pop());
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method())) writes.push(request.url());
    });
    await openHistory(page);
    const row = ticket => page.locator("tr, .dd-show-on-mobile > div").filter({ has: page.getByText(ticket, { exact: true }) }).filter({ visible: true });
    await expect(row("AQ01")).toContainText("Appointment");
    await expect(row("WQ02")).toContainText("Walk-in");
    await expect(row("WQ03")).toContainText("No notes recorded");
    await expect(row("WQ03").getByRole("button", { name: "View Notes" })).toHaveCount(0);
    await expect(page.getByText("Earlier Patient", { exact: true })).toHaveCount(0);
    const returnNotes = row("WQ02").getByRole("button", { name: "View Notes" });
    await returnNotes.click();
    const dialog = page.getByRole("dialog", { name: "Consultation Notes", exact: true });
    await expect(dialog).toContainText("Return visit notes\nSecond line");
    await expect(dialog).toContainText("Return diagnosis");
    await expect(dialog).toContainText("Follow-up instructions");
    await expect(dialog).not.toContainText("First visit notes");
    await expect(dialog.getByRole("textbox")).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: /Save/ })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath(`patient-notes-${width}.png`), animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(returnNotes).toBeFocused();
    await row("AQ01").getByRole("button", { name: "View Notes" }).click();
    await expect(dialog).toContainText("First visit notes");
    await expect(dialog).not.toContainText("Return diagnosis");
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(page.getByText("Earlier Patient", { exact: true }).filter({ visible: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`patient-history-${width}.png`), fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(reads).toEqual(["12", "11"]);
    expect(writes).toEqual([]);
  });
}

for (const width of [1440, 375]) {
  test(`patient history pagination, search, filters and sorting work together at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const responses = await mockDoctor(page);
    responses["/api/doctor/patient-history"].visits = Array.from({ length: 25 }, (_, index) => ({
      visit_id: `queue-${index + 1}`, queue_number: `WQ${String(index + 1).padStart(2, "0")}`,
      patient_full_name: `Patient ${String(25 - index).padStart(2, "0")}`,
      visit_type: index % 2 ? "appointment" : "walk_in",
      visit_date: index < 23 ? "2026-10-29" : "2026-10-28",
      visit_time: `09:${String(index).padStart(2, "0")}:00`, status: "done",
      queue_services: index % 2 ? ["SERVICE-B"] : ["SERVICE-A"], consultation_id: null,
    }));
    await openHistory(page);
    const rows = page.locator("tbody > tr, .dd-show-on-mobile > div").filter({ visible: true });
    const pagination = page.getByRole("navigation", { name: "Patient history pagination" });
    const previous = pagination.getByRole("button", { name: "Previous", exact: true });
    const next = pagination.getByRole("button", { name: "Next", exact: true });
    const search = page.getByRole("searchbox", { name: "Search patients or tickets" });
    const type = page.getByRole("combobox", { name: "Visit type", exact: true });
    await expect(pagination).toContainText("Showing 1–10 of 23");
    await expect(previous).toBeDisabled();
    await expect(rows).toHaveCount(10);
    await expect(rows.first()).toContainText("WQ23");
    await next.click();
    await expect(pagination).toContainText("Showing 11–20 of 23");
    await expect(rows.first()).toContainText("WQ13");
    await next.click();
    await expect(pagination).toContainText("Showing 21–23 of 23");
    await expect(rows).toHaveCount(3);
    await expect(next).toBeDisabled();
    await previous.click();
    await type.selectOption("walk_in");
    await expect(pagination).toContainText("Showing 1–10 of 12");
    await expect(pagination).toContainText("Page 1 of 2");
    await next.click();
    await expect(rows).toHaveCount(2);
    await search.fill(" wq01 ");
    await expect(pagination).toContainText("Showing 1–1 of 1");
    await expect(rows.first()).toContainText("WQ01");
    await expect(previous).toBeDisabled();
    await expect(next).toBeDisabled();
    await search.fill("Unknown patient");
    await expect(page.getByText("No visits match these filters.", { exact: true })).toBeVisible();
    await expect(pagination).toHaveCount(0);
    await search.fill("");
    await type.selectOption("all");
    await next.click();
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(pagination).toContainText("Showing 1–10 of 25");
    await next.click();
    await page.getByRole("combobox", { name: "Sort by", exact: true }).selectOption("name");
    await expect(pagination).toContainText("Page 1 of 3");
    await page.getByRole("button", { name: "Sort ascending", exact: true }).click();
    await expect(rows.first()).toContainText("Patient 01");
    await next.click();
    await page.getByRole("combobox", { name: "Sort by", exact: true }).selectOption("services");
    await expect(pagination).toContainText("Page 1 of 3");
    await expect(rows.first()).toContainText("SERVICE-A");
    if (width > 640) {
      await page.getByRole("button", { name: "Patient Name", exact: true }).click();
      await expect(rows.first()).toContainText("Patient 01");
      await expect(page.getByRole("columnheader", { name: "Patient Name" })).toHaveAttribute("aria-sort", "ascending");
    }
    await pagination.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath(`history-pagination-${width}.png`), animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test("patient history reports load failures, retries, and distinguishes empty history", async ({ page }) => {
  const responses = await mockDoctor(page);
  let fail = true;
  await page.route("**/api/doctor/patient-history", route => fail
    ? route.fulfill({ status: 503, json: { message: "History temporarily unavailable." } })
    : route.fulfill({ json: responses["/api/doctor/patient-history"] }));
  await openHistory(page);
  await expect(page.getByRole("alert")).toHaveText("History temporarily unavailable.");
  await expect(page.getByText("No patient history yet.")).toHaveCount(0);
  fail = false;
  responses["/api/doctor/patient-history"].visits = [];
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("No patient visits for today.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByText("No patient history yet.", { exact: true })).toBeVisible();
});

test("consultation notes show loading and a retryable error while keeping records read-only", async ({ page }) => {
  await mockDoctor(page);
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  let fail = true;
  await page.route("**/api/doctor/consultations/12", async route => {
    await pending;
    return fail
      ? route.fulfill({ status: 503, json: { message: "Notes temporarily unavailable." } })
      : route.fulfill({ json: { data: { notes: "Saved notes", diagnosis: null, prescriptions: [] } } });
  });
  await openHistory(page);
  await page.locator("tr").filter({ hasText: "WQ02" }).getByRole("button", { name: "View Notes" }).click();
  const dialog = page.getByRole("dialog", { name: "Consultation Notes", exact: true });
  await expect(dialog.getByRole("status")).toHaveText("Loading consultation notes…");
  finish();
  await expect(dialog.getByRole("alert")).toHaveText("Notes temporarily unavailable.");
  fail = false;
  await dialog.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(dialog).toContainText("Saved notes");
  await expect(dialog.getByText("Not recorded", { exact: true })).toHaveCount(2);
  await expect(dialog.getByRole("textbox")).toHaveCount(0);
});
