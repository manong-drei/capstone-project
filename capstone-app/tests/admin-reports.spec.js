import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";
import analyticsController from "../../server/src/controllers/adminAnalyticsController.js";

const ageGroups = ["Infants 0-11 months", "Children 1-4 years", "Children 5-9 years", "Adolescents 10-14 years", "Adolescents 15-19 years", "Adults 20-59 years", "Senior Citizens 60 years and above"];
const forecasts = [1, 2, 3].flatMap(horizon => ageGroups.map((age_group, index) => ({
  age_group, baseline_year: 2025, baseline_recipients: index === 0 ? 0 : 100,
  forecast_year: 2025 + horizon, horizon,
  forecast_recipients: (index === 0 ? 20 : index === 1 ? 90 : 100) + (horizon - 1) * 10,
  lower_95: 0, upper_95: 200 + (horizon - 1) * 50, selected_arima_order: "(0, 1, 0)",
  backtest_years: `${2021 + horizon}-2025`, backtest_count: 5 - horizon,
  backtest_mae: (index === 0 ? 5 : index === 1 ? 20 : 10) + (horizon - 1) * 5,
  backtest_rmse: (12.34 + horizon - 1).toFixed(2), backtest_mape_pct: index === 0 ? "" : "10.5",
  naive_last_year_mae: horizon * 10, synthetic_years_in_training: "8",
})));
const history = [...Array.from({ length: 8 }, (_, index) => 2012 + index), 2025].flatMap((year) => ageGroups.map((age_group, index) => ({
  year, age_group, recipients: year < 2020 ? 0 : forecasts[index].baseline_recipients, is_synthetic: year < 2020,
})));

async function mockAdmin(page, forecastResponse = { forecasts, history }, status = 200) {
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.addInitScript(token => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "admin" }));
    sessionStorage.setItem("ek_token", token);
  }, createTestToken({ user_id: 8, role: "admin" }));
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname;
    const responses = {
      "/api/auth/profile": { data: { user_id: 8, role: "admin", display_name: "Test Admin" } },
      "/api/admin/overview": { activeQueues: 12, waiting: 7, serving: 3, doneToday: 9, cancelled: 2 },
      "/api/doctor": { data: [] },
      "/api/appointments": { data: [] },
      "/api/admin/staff": { staff: [] },
      "/api/admin/patients": { patients: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } },
    };
    return route.fulfill({ status: path.endsWith("/bohc-forecast") ? status : 200, contentType: "application/json", body: JSON.stringify(path.endsWith("/bohc-forecast") ? forecastResponse : responses[path] ?? { data: [] }) });
  });
  await page.goto("/admin");
}

async function openReports(page, width = 1440) {
  if (width <= 900) await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#ad-sidebar").getByRole("button", { name: "Statistics/Analytics", exact: true }).click();
}

for (const width of [1440, 768, 375]) {
  test(`queue stats move to overview and predictive reports work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockAdmin(page);
    const queueStats = page.getByRole("region", { name: "Queue Statistics · Today" });
    await expect(queueStats).toBeVisible();
    for (const [label, value] of [["Waiting", "7"], ["Serving", "3"], ["Done", "9"], ["Cancelled", "2"]]) {
      await expect(queueStats.getByText(label, { exact: true }).locator("..")).toHaveText(`${value}${label}`);
    }
    await openReports(page, width);
    await expect(page.getByText("Demonstration forecast.", { exact: true })).toBeVisible();
    await expect(queueStats).toHaveCount(0);
    await expect(page.getByText("Weekly Trend", { exact: true })).toHaveCount(0);
    const summary = page.getByRole("region", { name: "2026 forecast summary" });
    await expect(summary.getByText("610", { exact: true })).toBeVisible();
    await expect(summary.getByText("600", { exact: true })).toBeVisible();
    await expect(summary.getByText("+10", { exact: true })).toBeVisible();
    await expect(summary.getByText("+1.7% compared with 2025", { exact: true })).toBeVisible();

    const breakdown = page.getByRole("table", { name: "2025 actual recipients and 2026 predictions" });
    await expect(breakdown.locator("tbody tr")).toHaveCount(7);
    const infantCells = breakdown.locator("tbody tr").first().locator("td");
    await expect(infantCells).toHaveText(["0", "20", "+20", "—", "3.3%", "0 – 200"]);
    await expect(breakdown.locator("tbody tr").nth(1).locator("td").nth(3)).toHaveText("-10%");
    const performance = page.getByRole("table", { name: "1-year ARIMA model selection and historical validation" });
    await expect(performance.locator("tbody tr").first().locator("td")).toHaveText(["(0, 1, 0)", "2022-2025", "4", "5", "12.34", "—", "10", "5 lower"]);
    await expect(performance.getByText("10 higher", { exact: true })).toBeVisible();
    await expect(performance.getByText("Same as baseline", { exact: true })).toHaveCount(5);
    const totals = page.getByRole("table", { name: "Predicted annual recipients for all three years" });
    await expect(totals.locator("tbody tr")).toHaveCount(3);
    for (const [index, total] of [[0, "610"], [1, "680"], [2, "750"]]) {
      await expect(totals.locator("tbody tr").nth(index).locator("td")).toHaveText([`${index + 1} ${index === 0 ? "year" : "years"}`, total]);
    }
    await expect(page.getByRole("img", { name: "Three-year BOHC demand forecast", exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`admin-reports-${width}.png`), fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const scroll = page.getByRole("region", { name: "Forecast breakdown table", exact: true });
    if (width === 375) {
      expect(await scroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      await scroll.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    }

    for (const [year, total, count, mae, rmse, baseline, difference] of [
      [2027, "680", "3", "10", "13.34", "20", "10 lower"],
      [2028, "750", "2", "15", "14.34", "30", "15 lower"],
    ]) {
      await page.getByRole("combobox", { name: "Year", exact: true }).selectOption(String(year));
      await expect(page.getByRole("region", { name: `${year} forecast summary` }).getByText(total, { exact: true })).toBeVisible();
      const yearlyBreakdown = page.getByRole("table", { name: `2025 actual recipients and ${year} predictions` });
      await expect(yearlyBreakdown.locator("tbody tr")).toHaveCount(7);
      await expect(yearlyBreakdown.locator("tbody tr").first().locator("td").nth(1)).toHaveText(year === 2027 ? "30" : "40");
      await expect(yearlyBreakdown.locator("tbody tr").first().locator("td").last()).toHaveText(year === 2027 ? "0 – 250" : "0 – 300");
      const yearlyPerformance = page.getByRole("table", { name: `${year - 2025}-year ARIMA model selection and historical validation` });
      await expect(yearlyPerformance.locator("tbody tr").first().locator("td")).toHaveText(["(0, 1, 0)", `${year - 4}-2025`, count, mae, rmse, "—", baseline, difference]);
      await expect(page.getByRole("img", { name: new RegExp(`${year} prediction compared with 2025 actuals`) })).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath(`admin-reports-2028-${width}.png`), fullPage: true, animations: "disabled" });

    for (const year of [2012, 2013, 2019]) {
      await page.getByRole("combobox", { name: "Year", exact: true }).selectOption(String(year));
      const historicalTable = page.getByRole("table", { name: `${year} recipient breakdown · synthetic` });
      await expect(historicalTable.locator("tbody tr")).toHaveCount(7);
      await expect(historicalTable.locator("tbody tr").first().locator("td")).toHaveText(["0", "—", "Synthetic"]);
    }
    await expect(page.getByText(/synthetic teaching data, not facility records/)).toBeVisible();
    await expect(page.getByRole("region", { name: /forecast summary/ })).toHaveCount(0);
    await page.getByRole("combobox", { name: "Year", exact: true }).selectOption("2025");
    await expect(page.getByRole("table", { name: "2025 recipient breakdown · recorded" }).locator("tfoot td").first()).toHaveText("600");
    await page.getByRole("combobox", { name: "Year", exact: true }).selectOption("2026");
    await expect(page.getByRole("img", { name: /2026 prediction compared with 2025 actuals/ })).toBeVisible();
  });
}

test("generated forecasts render from the actual Reports controller for all three years", async ({ page }, testInfo) => {
  let payload;
  await analyticsController.getBohcForecast({}, {
    set() { return this; },
    status(code) { throw new Error(`Unexpected Reports response: ${code}`); },
    json(data) { payload = data; return this; },
  });
  expect(payload.forecasts).toHaveLength(21);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockAdmin(page, payload);
  await openReports(page);
  for (const year of [2026, 2027, 2028]) {
    const rows = payload.forecasts.filter(row => row.forecast_year === year);
    const total = rows.reduce((sum, row) => sum + row.forecast_recipients, 0);
    await page.getByRole("combobox", { name: "Year", exact: true }).selectOption(String(year));
    await expect(page.getByRole("region", { name: `${year} forecast summary` }).getByText(total.toLocaleString("en-PH"), { exact: true })).toBeVisible();
    const table = page.getByRole("table", { name: `2025 actual recipients and ${year} predictions` });
    await expect(table.locator("tbody tr")).toHaveCount(7);
    await expect(table.locator("tbody tr").first().locator("td").nth(1)).toHaveText(rows[0].forecast_recipients.toLocaleString("en-PH"));
  }
  await page.screenshot({ path: testInfo.outputPath("admin-reports-generated-2028.png"), fullPage: true, animations: "disabled" });
});

test("zero totals and unavailable model scores do not show invalid percentages", async ({ page }) => {
  await mockAdmin(page, { forecasts: forecasts.map(row => ({ ...row, baseline_recipients: 0, forecast_recipients: 0, backtest_mae: null, naive_last_year_mae: "" })), history });
  await openReports(page);
  await expect(page.getByText("No 2025 baseline for percentage change", { exact: true })).toBeVisible();
  const breakdown = page.getByRole("table", { name: "2025 actual recipients and 2026 predictions" });
  await expect(breakdown.locator("tbody tr").first().locator("td")).toHaveText(["0", "0", "0", "—", "—", "0 – 200"]);
  await expect(page.getByRole("table", { name: "1-year ARIMA model selection and historical validation" }).locator("tbody tr").first().locator("td").last()).toHaveText("—");
  await expect(page.locator(".ar-page")).not.toContainText(/NaN|Infinity/);
});

test("missing forecasts and request failures show a clear state", async ({ page }) => {
  await mockAdmin(page, { forecasts: [], history: [] });
  await openReports(page);
  await expect(page.getByRole("status")).toHaveText("No forecast results are available yet.");
  await page.route("**/api/admin/bohc-forecast", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Forecast results are incomplete." }) }));
  await page.reload();
  await openReports(page);
  await expect(page.getByRole("alert")).toContainText("Predictive analytics are unavailable.");
  await expect(page.getByRole("alert")).toContainText("Forecast results are incomplete.");
  await expect(page.getByRole("region", { name: "2026 forecast summary" })).toHaveCount(0);
});
