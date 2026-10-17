import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

const ageGroups = ["Infants 0-11 months", "Children 1-4 years", "Children 5-9 years", "Adolescents 10-14 years", "Adolescents 15-19 years", "Adults 20-59 years", "Senior Citizens 60 years and above"];
const forecasts = ageGroups.map((age_group, index) => ({
  age_group, actual_2025: index === 0 ? 0 : 100,
  forecast_2026: index === 0 ? 20 : index === 1 ? 90 : 100,
  lower_95: 0, upper_95: 200, selected_arima_order: "(0, 1, 0)",
  backtest_years: "2022-2025", backtest_mae: index === 0 ? 5 : index === 1 ? 20 : 10,
  backtest_rmse: "12.34", backtest_mape_pct: index === 0 ? "" : "10.5",
  naive_last_year_mae: "10", synthetic_years_in_training: "1",
}));
const history = [2019, 2025].flatMap((year) => ageGroups.map((age_group, index) => ({
  year, age_group, recipients: year === 2019 ? 0 : forecasts[index].actual_2025, is_synthetic: year === 2019,
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
      "/api/admin/patients": { patients: [] },
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
    const performance = page.getByRole("table", { name: "ARIMA model selection and historical validation" });
    await expect(performance.locator("tbody tr").first().locator("td")).toHaveText(["(0, 1, 0)", "2022-2025", "5", "12.34", "—", "10", "5 lower"]);
    await expect(performance.getByText("10 higher", { exact: true })).toBeVisible();
    await expect(performance.getByText("Same as baseline", { exact: true })).toHaveCount(5);
    await page.screenshot({ path: testInfo.outputPath(`admin-reports-${width}.png`), fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    const scroll = page.getByRole("region", { name: "Forecast breakdown table", exact: true });
    if (width === 375) {
      expect(await scroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      await scroll.focus();
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    }

    await page.getByRole("combobox", { name: "Year", exact: true }).selectOption("2019");
    const historicalTable = page.getByRole("table", { name: "2019 recipient breakdown · synthetic" });
    await expect(historicalTable.locator("tbody tr")).toHaveCount(7);
    await expect(historicalTable.locator("tbody tr").first().locator("td")).toHaveText(["0", "—", "Synthetic"]);
    await expect(page.getByText(/synthetic teaching data, not facility records/)).toBeVisible();
    await page.getByRole("combobox", { name: "Year", exact: true }).selectOption("2025");
    await expect(page.getByRole("table", { name: "2025 recipient breakdown · recorded" }).locator("tfoot td").first()).toHaveText("600");
    await page.getByRole("combobox", { name: "Year", exact: true }).selectOption("2026");
    await expect(page.getByRole("img", { name: /2026 prediction compared with 2025 actuals/ })).toBeVisible();
  });
}

test("zero totals and unavailable model scores do not show invalid percentages", async ({ page }) => {
  await mockAdmin(page, { forecasts: forecasts.map(row => ({ ...row, actual_2025: 0, forecast_2026: 0, backtest_mae: null, naive_last_year_mae: "" })), history });
  await openReports(page);
  await expect(page.getByText("No 2025 baseline for percentage change", { exact: true })).toBeVisible();
  const breakdown = page.getByRole("table", { name: "2025 actual recipients and 2026 predictions" });
  await expect(breakdown.locator("tbody tr").first().locator("td")).toHaveText(["0", "0", "0", "—", "—", "0 – 200"]);
  await expect(page.getByRole("table", { name: "ARIMA model selection and historical validation" }).locator("tbody tr").first().locator("td").last()).toHaveText("—");
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
