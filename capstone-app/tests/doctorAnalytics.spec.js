import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function openAnalytics(page, saved = new Map()) {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
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
  await page.goto("/doctor/analytics");
  await expect(page.getByRole("heading", { name: "Daily dental service report", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
  return fixture;
}

const countInputs = (page) => page.getByRole("textbox", { name: /, / });
const clinicalRow = (page, barangay) => page.locator("main tr, main article").filter({ has: page.getByText(barangay, { exact: true }) }).filter({ visible: true });
const reportRegion = (page) => page.getByRole("region", { name: /^(Daily|Weekly|Monthly) dental service report$/ });
const openClinical = async (page) => page.getByRole("button", { name: "Clinical counts", exact: true }).click();
const selectMeasure = async (page, index) => page.getByRole("combobox", { name: "Clinical measure", exact: true }).selectOption(String(index));

test("completed visits stay separate and manual edits survive selectors, failed saves, and date changes", async ({ page }) => {
  const fixture = await openAnalytics(page);
  expect(fixture.requests.filter(({ path }) => path === "/api/doctor/daily-report")).toHaveLength(0);
  await expect(page.getByRole("heading", { name: "11 completed visits", exact: true })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("4 visits need demographic review");
  for (const [barangay, value] of [["Abuanan", "5"], ["Unknown", "3"], ["Elsewhere", "1"]]) {
    await expect(page.getByRole("progressbar", { name: `${barangay} completed visits`, exact: true })).toHaveAttribute("value", value);
  }
  const taloc = page.locator("details").filter({ has: page.getByRole("progressbar", { name: "Taloc completed visits", exact: true }) });
  await taloc.locator("summary").click();
  await expect(taloc.getByText("5–9 years", { exact: true })).toBeVisible();
  await expect(taloc.getByText(/^(Other|Unknown age|Unknown sex)$/)).toHaveCount(0);
  await page.getByRole("combobox", { name: "Breakdown", exact: true }).selectOption("age");
  await expect(page.getByRole("progressbar", { name: "Unknown completed visits", exact: true })).toHaveCount(0);
  await expect(page.getByRole("progressbar", { name: "5–9 years completed visits", exact: true })).toHaveAttribute("value", "2");
  await page.getByRole("combobox", { name: "Breakdown", exact: true }).selectOption("sex");
  await expect(page.getByRole("progressbar")).toHaveCount(2);
  await expect(page.getByRole("progressbar", { name: "Male completed visits", exact: true })).toHaveAttribute("value", "5");
  await expect(page.getByRole("progressbar", { name: "Female completed visits", exact: true })).toHaveAttribute("value", "1");
  await openClinical(page);
  await expect(page.getByText("No saved entries for this measure in the selected period.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
  await expect(page).toHaveURL(/\/doctor\/reports\/daily\?date=2026-10-06$/);
  await expect(countInputs(page)).toHaveCount(2);
  const male = page.getByRole("textbox", { name: /Abuanan, Orally fit children.*Male/ });
  await expect(male).toBeEnabled();
  await male.fill("3");
  await selectMeasure(page, 9);
  const seniorFemale = page.getByRole("textbox", { name: /Abuanan, Senior citizens.*Female/ });
  await seniorFemale.fill("1");
  await expect(page.getByLabel("Entry date", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Report date", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download Excel" })).toHaveCount(0);
  await selectMeasure(page, 0);
  await expect(male).toHaveValue("3");
  fixture.failSave = true;
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Save unavailable" })).toBeVisible();
  await expect(male).toHaveValue("3");
  await selectMeasure(page, 9);
  await expect(seniorFemale).toHaveValue("1");
  expect(fixture.saved.size).toBe(0);
  fixture.failSave = false;
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
  expect(fixture.saved.get("2026-10-06")[0][0]).toBe(3);
  expect(fixture.saved.get("2026-10-06")[0][23]).toBe(1);
  await page.getByRole("combobox", { name: "Barangay", exact: true }).selectOption("23");
  await page.getByRole("textbox", { name: /Taloc, Senior citizens.*Female/ }).fill("0");
  await page.getByRole("combobox", { name: "Barangay", exact: true }).selectOption("0");
  await expect(seniorFemale).toHaveValue("1");
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
  expect(fixture.saved.get("2026-10-06")[23][23]).toBe(0);

  await page.getByLabel("Entry date", { exact: true }).fill("2026-10-05");
  await expect(seniorFemale).toHaveValue("");
  await expect(seniorFemale).toBeEnabled();
  await seniorFemale.fill("4");
  await selectMeasure(page, 0);
  await male.fill("2");
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
  expect(fixture.saved.get("2026-10-05")[0][23]).toBe(4);
  await page.getByRole("button", { name: "Back to analytics", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
  await openClinical(page);
  await expect(clinicalRow(page, "Abuanan").locator("td").first()).toHaveText("3");
  await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
  await expect(male).toHaveValue("3");
  await selectMeasure(page, 9);
  await expect(seniorFemale).toHaveValue("1");
});

test("daily, weekly and monthly ranges export every clinical measure and both print pages", async ({ page }, testInfo) => {
  const day1 = Array.from({ length: 24 }, () => Array(24).fill(null));
  const day2 = Array.from({ length: 24 }, () => Array(24).fill(null));
  day1[0][0] = 3; day1[0][23] = 1;
  day2[0][0] = 2; day2[0][23] = 4;
  const fixture = await openAnalytics(page, new Map([["2026-10-06", day1], ["2026-10-05", day2]]));
  const dailyDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Excel" }).click();
  expect((await dailyDownload).suggestedFilename()).toBe("dental-report-today-2026-10-06.xlsx");
  await openClinical(page);
  await page.getByRole("button", { name: "This week", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Weekly dental service report", exact: true })).toBeVisible();
  await expect(clinicalRow(page, "Abuanan").locator("td").first()).toHaveText("5");
  await expect(page.getByRole("main").getByText("2026-10-05 – 2026-10-11 · Dr. Test", { exact: true })).toBeVisible();
  await page.getByLabel("Week containing", { exact: true }).fill("2026-10-05");
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
  await selectMeasure(page, 9);
  await expect(clinicalRow(page, "Abuanan").locator("td").nth(1)).toHaveText("5");
  await expect(page.getByRole("table", { name: "Clinical counts by barangay", exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "This month", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Monthly dental service report", exact: true })).toBeVisible();
  await selectMeasure(page, 0);
  await expect(clinicalRow(page, "Abuanan").locator("td").first()).toHaveText("5");
  await page.getByLabel("Report month", { exact: true }).fill("2026-09");
  await expect(page.getByRole("main").getByText("2026-09-01 – 2026-09-30 · Dr. Test", { exact: true })).toBeVisible();
  await expect(page.getByText("No saved entries for this measure in the selected period.", { exact: true })).toBeVisible();
  await page.getByLabel("Report month", { exact: true }).fill("2026-10");
  await expect(clinicalRow(page, "Abuanan").locator("td").first()).toHaveText("5");
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
  await expect(printable.locator(".da-completed-table").getByRole("columnheader", { name: /^(Other|Unknown age|Unknown sex)$/ })).toHaveCount(0);
  await expect(printable.getByRole("heading", { name: "Automatic completed visits · 11 visits", exact: true })).toBeVisible();
  const pdf = await page.pdf({ path: testInfo.outputPath("doctor-report.pdf"), format: "A3", landscape: true, printBackground: true });
  expect((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length).toBe(2);
});

test("report and analytics failures block stale exports until retry succeeds", async ({ page }) => {
  const fixture = await openAnalytics(page);
  fixture.failReport = "weekly";
  await page.getByRole("button", { name: "This week", exact: true }).click();
  const reportError = page.getByRole("alert").filter({ hasText: "Report unavailable" });
  await expect(reportError).toBeVisible();
  await openClinical(page);
  await expect(page.getByLabel("Clinical measure")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Print report" })).toBeDisabled();
  await expect(page.locator("#doctor-report-print")).toHaveCount(0);
  fixture.failReport = "";
  await reportError.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByLabel("Clinical measure")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
  fixture.failAnalytics = "monthly";
  await page.getByRole("button", { name: "This month", exact: true }).click();
  const analyticsError = page.getByRole("alert").filter({ hasText: "Analytics unavailable" });
  await expect(analyticsError).toBeVisible();
  await page.getByRole("button", { name: "Completed visits", exact: true }).click();
  await expect(page.getByRole("region", { name: "Completed visit breakdown" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeDisabled();
  await expect(page.locator("#doctor-report-print")).toHaveCount(0);
  fixture.failAnalytics = "";
  await analyticsError.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("region", { name: "Completed visit breakdown" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download Excel" })).toBeEnabled();
});

for (const width of [320, 375, 768, 1024, 1920]) {
  test(`analytics and focused entry remain usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const values = Array.from({ length: 24 }, () => Array(24).fill(null));
    values[0][0] = 3; values[0][1] = 2;
    values[1][0] = 0; values[1][1] = 0;
    values[0][9] = 0; values[0][10] = 1; values[0][11] = 0;
    await openAnalytics(page, new Map([["2026-10-06", values]]));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const report = reportRegion(page);
    if (width >= 1024) {
      const box = await report.boundingBox();
      expect(box.x).toBeLessThanOrEqual(16);
      expect(box.x + box.width).toBeGreaterThanOrEqual(width - 16);
    }
    await openClinical(page);
    await expect(clinicalRow(page, "Alianza")).toContainText("Confirmed zero");
    const blankRows = report.locator("summary").filter({ hasText: "22 barangays without entries" });
    await expect(blankRows).toBeVisible();
    await blankRows.click();
    await expect(clinicalRow(page, "Atipuluan")).toContainText("—");
    await selectMeasure(page, 10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(clinicalRow(page, "Abuanan")).toBeVisible();
    await selectMeasure(page, 0);
    if ([375, 768, 1920].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`analytics-${width}.png`), fullPage: true });
    }
    await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
    await expect(countInputs(page)).toHaveCount(2);
    await selectMeasure(page, 10);
    await expect(countInputs(page)).toHaveCount(4);
    await expect(page.getByRole("textbox", { name: /25 and above/ })).toBeVisible();
    await page.getByRole("textbox", { name: /15–19 years/ }).fill("0");
    await page.getByRole("textbox", { name: /20–24 years/ }).fill("2");
    await page.getByRole("textbox", { name: /25 and above/ }).fill("1");
    await expect(page.getByLabel("Total for this measure", { exact: true })).toHaveText("3");
    await expect(page.getByRole("button", { name: "Save entries", exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if ([375, 768, 1920].includes(width)) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath(`clinical-entry-${width}.png`), fullPage: true });
    }
    await page.getByRole("button", { name: "Save entries", exact: true }).click();
    await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
  });
}

test("all eleven measures keep their original field positions and unsaved navigation can be cancelled", async ({ page }) => {
  const fixture = await openAnalytics(page);
  await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
  await expect(countInputs(page).first()).toBeEnabled();
  for (let measure = 0; measure < 10; measure++) {
    await selectMeasure(page, measure);
    await countInputs(page).nth(0).fill(String(measure + 1));
    await countInputs(page).nth(1).fill("0");
  }
  await selectMeasure(page, 10);
  for (let field = 0; field < 4; field++) await countInputs(page).nth(field).fill(String(field));
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Back to analytics", exact: true }).click();
  await expect(page).toHaveURL(/\/doctor\/reports\/daily/);
  await expect(countInputs(page).nth(3)).toHaveValue("3");
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
  const row = fixture.saved.get("2026-10-06")[0];
  expect(row.slice(8, 12)).toEqual([0, 1, 2, 3]);
  for (let measure = 0; measure < 10; measure++) {
    const offset = measure < 4 ? measure * 2 : 12 + (measure - 4) * 2;
    expect(row[offset]).toBe(measure + 1);
    expect(row[offset + 1]).toBe(0);
  }
});

test("manual load failures disable editing until a successful retry", async ({ page }) => {
  await openAnalytics(page);
  let fail = true;
  await page.route("**/api/doctor/daily-report?**", route => fail
    ? route.fulfill({ status: 503, json: { message: "Entries unavailable" } })
    : route.fallback());
  await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
  const error = page.getByRole("alert").filter({ hasText: "Entries unavailable" });
  await expect(error).toBeVisible();
  await expect(countInputs(page).first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save entries", exact: true })).toBeDisabled();
  fail = false;
  await error.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(countInputs(page).first()).toBeEnabled();
  await expect(error).toHaveCount(0);
});

for (const width of [320, 768, 1920]) {
  test(`manual previous and next controls preserve edits and dropdown selections at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const fixture = await openAnalytics(page);
    await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
    await expect(countInputs(page).first()).toBeEnabled();
    const barangay = page.getByRole("combobox", { name: "Barangay", exact: true });
    const measure = page.getByRole("combobox", { name: "Clinical measure", exact: true });
    const previousBarangay = page.getByRole("button", { name: "Previous barangay", exact: true });
    const nextBarangay = page.getByRole("button", { name: "Next barangay", exact: true });
    const previousMeasure = page.getByRole("button", { name: "Previous clinical measure", exact: true });
    const nextMeasure = page.getByRole("button", { name: "Next clinical measure", exact: true });
    await expect(previousBarangay).toBeDisabled();
    await expect(previousMeasure).toBeDisabled();
    await expect(nextBarangay).toHaveText("Next");
    await expect(nextMeasure).toHaveText(/Next/);
    await expect(previousBarangay.locator("svg.lucide-chevron-left")).toHaveCount(1);
    await expect(nextBarangay.locator("svg.lucide-chevron-right")).toHaveCount(1);
    await expect(previousMeasure.locator("svg.lucide-chevron-left")).toHaveCount(1);
    await expect(nextMeasure.locator("svg.lucide-chevron-right")).toHaveCount(1);
    await expect(page.getByText("Switching barangay keeps your edits.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Choose only the measures you need.", { exact: true })).toHaveCount(0);
    const barangayBox = await barangay.boundingBox();
    const barangayButtonBox = await nextBarangay.boundingBox();
    expect(barangayButtonBox.y).toBeGreaterThanOrEqual(barangayBox.y + barangayBox.height);
    const entryCard = page.getByRole("region", { name: "Orally fit children", exact: true });
    await expect(entryCard.getByRole("group", { name: "Clinical measure navigation", exact: true })).toBeVisible();
    const totalBox = await page.getByLabel("Total for this measure", { exact: true }).boundingBox();
    const measureButtonBox = await nextMeasure.boundingBox();
    const cardBox = await entryCard.boundingBox();
    expect(measureButtonBox.y).toBeGreaterThan(totalBox.y + totalBox.height);
    expect(cardBox.x + cardBox.width - measureButtonBox.x - measureButtonBox.width).toBeLessThanOrEqual(24);
    const previousMeasureBox = await previousMeasure.boundingBox();
    expect(previousMeasureBox.y).toBe(measureButtonBox.y);
    if (width === 320) expect(Math.abs(previousMeasureBox.width - measureButtonBox.width)).toBeLessThanOrEqual(1);
    await countInputs(page).first().fill("5");
    await nextBarangay.click();
    await expect(barangay).toHaveValue("1");
    await expect(countInputs(page).first()).toHaveValue("");
    await countInputs(page).first().fill("2");
    await nextMeasure.click();
    await expect(measure).toHaveValue("1");
    await countInputs(page).first().fill("7");
    await previousMeasure.click();
    await expect(countInputs(page).first()).toHaveValue("2");
    await previousBarangay.click();
    await expect(countInputs(page).first()).toHaveValue("5");
    await barangay.selectOption("23");
    await measure.selectOption("10");
    await expect(nextBarangay).toBeDisabled();
    await expect(nextMeasure).toBeDisabled();
    await expect(countInputs(page)).toHaveCount(4);
    await previousBarangay.click();
    await previousMeasure.click();
    await expect(barangay).toHaveValue("22");
    await expect(measure).toHaveValue("9");
    await barangay.selectOption("0");
    await measure.selectOption("0");
    await expect(countInputs(page).first()).toHaveValue("5");
    expect(fixture.saved.size).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Save entries", exact: true }).click();
    await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
    expect(fixture.saved.get("2026-10-06")[0][0]).toBe(5);
    expect(fixture.saved.get("2026-10-06")[1][0]).toBe(2);
    expect(fixture.saved.get("2026-10-06")[1][2]).toBe(7);
  });
}

test("manual navigation is disabled while entries load or save", async ({ page }) => {
  await openAnalytics(page);
  let releaseLoad;
  const loading = new Promise(resolve => { releaseLoad = resolve; });
  await page.route("**/api/doctor/daily-report?**", async route => {
    await loading;
    await route.fallback();
  });
  await page.getByRole("button", { name: "Daily barangay entries", exact: true }).click();
  const nextBarangay = page.getByRole("button", { name: "Next barangay", exact: true });
  const nextMeasure = page.getByRole("button", { name: "Next clinical measure", exact: true });
  await expect(nextBarangay).toBeDisabled();
  await expect(nextMeasure).toBeDisabled();
  releaseLoad();
  await expect(nextBarangay).toBeEnabled();
  await expect(nextMeasure).toBeEnabled();
  await countInputs(page).first().fill("3");
  let releaseSave;
  const saving = new Promise(resolve => { releaseSave = resolve; });
  await page.route("**/api/doctor/daily-report", async route => {
    await saving;
    await route.fallback();
  });
  await page.getByRole("button", { name: "Save entries", exact: true }).click();
  await expect(nextBarangay).toBeDisabled();
  await expect(nextMeasure).toBeDisabled();
  releaseSave();
  await expect(page.getByRole("status", { name: "Entry save status" })).toHaveText("Saved for this date");
  await expect(nextBarangay).toBeEnabled();
  await expect(nextMeasure).toBeEnabled();
});
