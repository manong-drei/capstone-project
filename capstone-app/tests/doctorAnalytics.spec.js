import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function openAnalytics(page, saved = new Map()) {
  await page.addInitScript((token) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 4, role: "doctor", display_name: "Dr. Test" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 4, role: "doctor" }));
  const fixture = { saved, requests: [], failSave: false, failReport: "", failAnalytics: "" };
  const completed = [
    { barangay: "Barangay Abuanan, Bago City", age_group: "20–59 years", sex: "Male", count: 5 },
    { barangay: "Unknown", age_group: "Unknown", sex: "Unknown", count: 3 },
    { barangay: "Elsewhere", age_group: "60+ years", sex: "Female", count: 1 },
    { barangay: "Taloc", age_group: "5–9 years", sex: "Other", count: 2 },
  ];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const period = url.searchParams.get("period") || "today";
    const date = url.searchParams.get("date") || "";
    const from = period === "today" ? date || "2026-10-06" : period === "weekly" ? "2026-10-05" : date.startsWith("2026-09") ? "2026-09-01" : "2026-10-01";
    const until = period === "today" ? new Date(Date.parse(`${from}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : period === "weekly" ? "2026-10-12" : from === "2026-09-01" ? "2026-10-01" : "2026-11-01";
    let body = {};
    let status = 200;
    if (path === "/api/doctor/analytics" || path === "/api/doctor/report") {
      fixture.requests.push({ path, period, date, from, until });
      if ((path.endsWith("/analytics") && fixture.failAnalytics === period) || (path.endsWith("/report") && fixture.failReport === period)) {
        status = 503;
        body = { message: path.endsWith("/analytics") ? "Analytics unavailable" : "Report unavailable" };
      } else if (path.endsWith("/analytics")) body = {
        report_date: "2026-10-06", period, from, until,
        patients: 10, waiting: 1, serving: 0, completed: 11, priority: 0, appointments: 5, walk_ins: 6,
        age_groups: completed.map(({ age_group, count }) => ({ age_group, count })),
        completed_demographics: completed,
      };
      else body = { period, from, until, reports: [...fixture.saved.entries()].filter(([day]) => day >= from && day < until).map(([, data]) => data) };
    } else if (path === "/api/doctor/daily-report") {
      if (route.request().method() === "PUT") {
        if (fixture.failSave) { status = 503; body = { message: "Save unavailable" }; }
        else {
          const { date: day, data } = route.request().postDataJSON();
          fixture.saved.set(day, data);
          body = { success: true, data };
        }
      } else {
        fixture.requests.push({ path, date });
        body = { data: fixture.saved.get(date) || null };
      }
    } else if (path === "/api/doctor/daily-settings") body = { appointment_limit: 10, walk_in_limit: 5, booked_count: 0, walkin_count: 0, is_available: 1 };
    else if (path === "/api/queue") body = [];
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto("/doctor");
  await page.getByRole("button", { name: "Analytics", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Daily dental service report", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
  return fixture;
}

const clinicalTable = (page) => page.locator(".da-page .da-month-table:not(.da-completed-table)");
const automaticTable = (page) => page.locator(".da-page .da-completed-table");
const rowCells = (table, barangay) => table.locator("tbody tr").filter({ has: table.page().getByRole("rowheader", { name: barangay, exact: true }) }).locator("td");

test("completed visits remain separate from optional manual entries and failed saves preserve inputs", async ({ page }) => {
  const fixture = await openAnalytics(page);
  await expect(page.getByRole("button", { name: "Daily barangay entries" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "Manual clinical entries" })).toHaveCount(0);
  expect(fixture.requests.filter(({ path }) => path === "/api/doctor/daily-report")).toHaveLength(0);
  await expect(page.getByText("11 completed visits · Male 5 · Female 1 · Other 2 · Unknown sex 3", { exact: true })).toBeVisible();
  await expect(page.getByText(/4 completed visits have missing demographics or a barangay outside the report list/)).toBeVisible();
  await expect(rowCells(automaticTable(page), "Abuanan").first()).toHaveText("5");
  await expect(rowCells(automaticTable(page), "Unknown").first()).toHaveText("3");
  await expect(rowCells(automaticTable(page), "Elsewhere").first()).toHaveText("1");
  await expect(clinicalTable(page)).toHaveCount(1);
  await expect(rowCells(clinicalTable(page), "Abuanan").first()).toHaveText("");

  await page.getByRole("button", { name: "Daily barangay entries" }).click();
  const male = page.getByRole("textbox", { name: /Abuanan, Orally fit children.*Male/ });
  const seniorFemale = page.getByRole("textbox", { name: /Abuanan, Senior citizens.*Female/ });
  await expect(male).toBeEnabled();
  await male.fill("3");
  await seniorFemale.fill("1");
  await expect(page.getByLabel("Report date", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Entry date", { exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "This week", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Daily barangay entries" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeDisabled();

  fixture.failSave = true;
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Save unavailable" })).toBeVisible();
  await expect(male).toHaveValue("3");
  await expect(seniorFemale).toHaveValue("1");
  await expect(page.getByRole("button", { name: "Save entries", exact: true })).toBeEnabled();
  expect(fixture.saved.size).toBe(0);
  fixture.failSave = false;
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByText("Saved for this date", { exact: true })).toBeVisible();
  expect(fixture.saved.get("2026-10-06")[0][23]).toBe(1);
  await expect(rowCells(clinicalTable(page), "Abuanan").first()).toHaveText("3");
  await expect(rowCells(automaticTable(page), "Abuanan").first()).toHaveText("5");
  await page.getByLabel("Entry date", { exact: true }).fill("2026-10-05");
  await expect(male).toHaveValue("");
  await expect(male).toBeEnabled();
  await male.fill("2");
  await seniorFemale.fill("4");
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByText("Saved for this date", { exact: true })).toBeVisible();
  expect(fixture.saved.get("2026-10-05")[0][23]).toBe(4);
  await page.getByRole("button", { name: "Daily barangay entries" }).click();

  await page.reload();
  await page.getByRole("button", { name: "Analytics", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Manual clinical entries" })).toHaveCount(0);
  await page.getByRole("button", { name: "Daily barangay entries" }).click();
  await expect(male).toHaveValue("3");
  await expect(seniorFemale).toHaveValue("1");
  await expect(rowCells(automaticTable(page), "Abuanan").first()).toHaveText("5");
});

test("daily, weekly and monthly reports share ranges, paginate and export both clinical pages", async ({ page }, testInfo) => {
  const day1 = Array.from({ length: 24 }, () => Array(24).fill(null));
  const day2 = Array.from({ length: 24 }, () => Array(24).fill(null));
  day1[0][0] = 3; day1[0][23] = 1;
  day2[0][0] = 2; day2[0][23] = 4;
  const fixture = await openAnalytics(page, new Map([["2026-10-06", day1], ["2026-10-05", day2]]));
  const dailyDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Excel" }).click();
  expect((await dailyDownload).suggestedFilename()).toBe("dental-report-today-2026-10-06.xlsx");

  await page.getByRole("button", { name: "This week", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Weekly dental service report", exact: true })).toBeVisible();
  await expect(rowCells(clinicalTable(page), "Abuanan").first()).toHaveText("5");
  await expect(page.getByRole("main").getByText("2026-10-05 – 2026-10-11 · Dr. Test", { exact: true })).toBeVisible();
  await page.getByLabel("Week containing", { exact: true }).fill("2026-10-05");
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
  await page.getByRole("button", { name: "Page 2", exact: true }).click();
  await expect(clinicalTable(page)).toHaveCount(1);
  await expect(clinicalTable(page).locator("thead")).toContainText("Senior citizens");
  await expect(clinicalTable(page).locator("thead")).not.toContainText("Orally fit children");
  await expect(rowCells(clinicalTable(page), "Abuanan").nth(16)).toHaveText("5");

  await page.getByRole("button", { name: "This month", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Monthly dental service report", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(rowCells(clinicalTable(page), "Abuanan").first()).toHaveText("5");
  await page.getByLabel("Report month", { exact: true }).fill("2026-09");
  await expect(page.getByRole("main").getByText("2026-09-01 – 2026-09-30 · Dr. Test", { exact: true })).toBeVisible();
  await expect(rowCells(clinicalTable(page), "Abuanan").first()).toHaveText("");
  await page.getByLabel("Report month", { exact: true }).fill("2026-10");
  await expect(rowCells(clinicalTable(page), "Abuanan").first()).toHaveText("5");
  for (const path of ["/api/doctor/analytics", "/api/doctor/report"]) {
    for (const range of [
      { period: "today", date: "", from: "2026-10-06", until: "2026-10-07" },
      { period: "weekly", date: "2026-10-05", from: "2026-10-05", until: "2026-10-12" },
      { period: "monthly", date: "2026-09-01", from: "2026-09-01", until: "2026-10-01" },
      { period: "monthly", date: "2026-10-01", from: "2026-10-01", until: "2026-11-01" },
    ]) expect(fixture.requests).toContainEqual({ path, ...range });
  }
  const monthlyDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Excel" }).click();
  expect((await monthlyDownload).suggestedFilename()).toBe("dental-report-monthly-2026-10-01.xlsx");
  await page.screenshot({ path: testInfo.outputPath("doctor-analytics.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  const printable = page.locator("#doctor-report-print");
  await expect(printable).toBeVisible();
  await expect(printable.locator(".da-month-table:not(.da-completed-table)")).toHaveCount(2);
  await expect(printable.locator(".da-completed-table")).toHaveCount(1);
  await expect(printable.getByRole("heading", { name: "Automatic completed visits · 11 visits", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("doctor-report-print.png"), fullPage: true });
  const pdf = await page.pdf({ path: testInfo.outputPath("doctor-report.pdf"), format: "A3", landscape: true, printBackground: true });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length).toBe(2);
  await page.emulateMedia({ media: "screen" });
});

test("report and analytics failures block stale exports until retry succeeds", async ({ page }) => {
  const fixture = await openAnalytics(page);
  fixture.failReport = "weekly";
  await page.getByRole("button", { name: "This week", exact: true }).click();
  const reportError = page.getByRole("alert").filter({ hasText: "Report unavailable" });
  await expect(reportError).toBeVisible();
  await expect(clinicalTable(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Print report" })).toBeDisabled();
  await expect(page.locator("#doctor-report-print")).toHaveCount(0);
  fixture.failReport = "";
  await reportError.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(clinicalTable(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();

  fixture.failAnalytics = "monthly";
  await page.getByRole("button", { name: "This month", exact: true }).click();
  const analyticsError = page.getByRole("alert").filter({ hasText: "Analytics unavailable" });
  await expect(analyticsError).toBeVisible();
  await expect(automaticTable(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeDisabled();
  await expect(page.locator("#doctor-report-print")).toHaveCount(0);
  fixture.failAnalytics = "";
  await analyticsError.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(automaticTable(page)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
});
