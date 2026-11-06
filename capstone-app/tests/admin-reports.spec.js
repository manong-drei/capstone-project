import { selectAdminSection } from "./helpers/admin";
import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";
import analyticsController from "../../server/src/controllers/adminAnalyticsController.js";

const ageGroups = ["Infants 0-11 months", "Children 1-4 years", "Children 5-9 years", "Adolescents 10-14 years", "Adolescents 15-19 years", "Adults 20-59 years", "Senior Citizens 60 years and above"];
const forecasts = [1, 2, 3].flatMap(horizon => ageGroups.map((age_group, index) => ({
  age_group, baseline_year: 2025, baseline_recipients: index === 0 ? 0 : 100,
  forecast_year: 2025 + horizon, horizon,
  forecast_recipients: (index === 0 ? 20 : index === 1 ? 90 : 100) + (horizon - 1) * 10,
  lower_95: 0, upper_95: 200 + (horizon - 1) * 50, selected_arima_order: "(0, 1, 0)",
  selected_arima_trend: index === 0 ? "t" : "n",
  backtest_years: `${2021 + horizon}-2025`, backtest_count: 5 - horizon,
  backtest_mae: (index === 0 ? 5 : index === 1 ? 20 : 10) + (horizon - 1) * 5,
  backtest_rmse: (12.34 + horizon - 1).toFixed(2), backtest_mape_pct: index === 0 ? "" : "10.5",
  naive_last_year_mae: horizon * 10, synthetic_years_in_training: "8",
})));
const history = Array.from({ length: 14 }, (_, index) => 2012 + index).flatMap((year) => ageGroups.map((age_group, index) => ({
  year, age_group, recipients: year < 2020 ? 0 : year === 2025 ? forecasts[index].baseline_recipients : (year - 2019) * (index + 1) * 10, is_synthetic: year < 2020,
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

async function openReports(page) {
  await selectAdminSection(page, "Statistics/Analytics");
}

async function expectChartPoint(chart, series, point, year, recipients) {
  await chart.locator(`.recharts-line-dot[stroke="${series === 0 ? "#059669" : "#1e4db7"}"]`).nth(point).hover({ force: true });
  await expect(chart.locator(".recharts-tooltip-wrapper")).toBeVisible();
  await expect(chart.locator(".recharts-tooltip-label")).toHaveText(String(year));
  await expect(chart.locator(".recharts-tooltip-item")).toHaveCount(1);
  await expect(chart.locator(".recharts-tooltip-item-value")).toHaveText(recipients.toLocaleString("en-PH"));
}

for (const width of [1440, 768, 375]) {
  test(`queue stats move to overview and predictive reports work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const chartWarnings = [];
    page.on("console", message => {
      if (/of chart should be greater than 0/.test(message.text())) chartWarnings.push(message.text());
    });
    await mockAdmin(page);
    const queueStats = page.getByRole("region", { name: "Queues today" });
    await expect(queueStats).toBeVisible();
    for (const [label, value] of [["Waiting", "7"], ["Serving", "3"], ["Completed", "9"], ["Cancelled", "2"]]) {
      await expect(queueStats.getByText(label, { exact: true }).locator("..")).toContainText(value);
    }
    await openReports(page);
    await expect(page.getByText("Demonstration forecast.", { exact: true })).toBeVisible();
    await expect(page.getByText(/Synthetic history follows a 3–4% annual growth trend/)).toBeVisible();
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
    await expect(performance.locator("tbody tr").first().locator("td")).toHaveText(["(0, 1, 0) · drift", "2022-2025", "4", "5", "12.34", "—", "10", "5 lower"]);
    await expect(performance.getByText("10 higher", { exact: true })).toBeVisible();
    await expect(performance.getByText("Same as baseline", { exact: true })).toHaveCount(5);
    const totals = page.getByRole("table", { name: "Predicted annual recipients for all three years" });
    await expect(totals.locator("tbody tr")).toHaveCount(3);
    for (const [index, total] of [[0, "610"], [1, "680"], [2, "750"]]) {
      await expect(totals.locator("tbody tr").nth(index).locator("td")).toHaveText([`${index + 1} ${index === 0 ? "year" : "years"}`, total]);
    }
    await expect(page.getByRole("img", { name: "Three-year BOHC demand forecast", exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /^Annual BOHC patient volume/ }).locator("svg.recharts-surface").first()).toBeVisible();
    expect(chartWarnings).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`admin-reports-${width}.png`), fullPage: true, animations: "disabled" });
    const ageChart = page.getByRole("region", { name: "BOHC recipients by age group", exact: true });
    await expect(ageChart.getByRole("combobox", { name: "Age group", exact: true }).locator("option")).toHaveText(ageGroups);
    await expect(ageChart.getByRole("combobox", { name: /year/i })).toHaveCount(0);
    for (const chart of [page.getByRole("region", { name: "Three-year demand forecast", exact: true }), ageChart]) {
      await expect(chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")).toHaveText(Array.from({ length: 15 }, (_, index) => String(2014 + index)));
      const historical = chart.locator('.recharts-line-curve[stroke="#059669"]');
      const prediction = chart.locator('.recharts-line-curve[stroke="#1e4db7"]');
      const historicalDots = chart.locator('.recharts-line-dot[stroke="#059669"]');
      const predictionDots = chart.locator('.recharts-line-dot[stroke="#1e4db7"]');
      await expect(historical).not.toHaveAttribute("stroke-dasharray", /.+/);
      await expect(historicalDots).toHaveCount(12);
      await expect(prediction).toHaveAttribute("stroke-dasharray", "6 4");
      await expect(predictionDots).toHaveCount(4);
      await expect(predictionDots.first()).toHaveAttribute("cx", await historicalDots.last().getAttribute("cx"));
      await expect(predictionDots.first()).toHaveAttribute("cy", await historicalDots.last().getAttribute("cy"));
      await expect(chart.getByRole("list", { name: "Chart legend", exact: true }).getByRole("listitem")).toHaveText(["Historical (2014–2025)", "Prediction (2026–2028)"]);
      await expect(chart.locator(".ar-legend-history")).toHaveCSS("border-top-color", "rgb(5, 150, 105)");
      await expect(chart.locator(".ar-legend-prediction")).toHaveCSS("border-top-color", "rgb(30, 77, 183)");
      await expect(chart.locator(".ar-legend-prediction")).toHaveCSS("border-top-style", "dashed");
      expect(await chart.locator(".ar-chart-legend li").evaluateAll(items => items.every(item => {
        const bounds = item.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= window.innerWidth;
      }))).toBe(true);
    }
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
      await page.getByRole("combobox", { name: "Forecast year", exact: true }).selectOption(String(year));
      await expect(page.getByRole("region", { name: `${year} forecast summary` }).getByText(total, { exact: true })).toBeVisible();
      const yearlyBreakdown = page.getByRole("table", { name: `2025 actual recipients and ${year} predictions` });
      await expect(yearlyBreakdown.locator("tbody tr")).toHaveCount(7);
      await expect(yearlyBreakdown.locator("tbody tr").first().locator("td").nth(1)).toHaveText(year === 2027 ? "30" : "40");
      await expect(yearlyBreakdown.locator("tbody tr").first().locator("td").last()).toHaveText(year === 2027 ? "0 – 250" : "0 – 300");
      const yearlyPerformance = page.getByRole("table", { name: `${year - 2025}-year ARIMA model selection and historical validation` });
      await expect(yearlyPerformance.locator("tbody tr").first().locator("td")).toHaveText(["(0, 1, 0) · drift", `${year - 4}-2025`, count, mae, rmse, "—", baseline, difference]);
      await expect(ageChart.getByRole("img", { name: "Annual BOHC patient volume for Infants 0-11 months, 2014–2028", exact: true })).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath(`admin-reports-2028-${width}.png`), fullPage: true, animations: "disabled" });

    for (const group of ageGroups) {
      await ageChart.getByRole("combobox", { name: "Age group", exact: true }).selectOption(group);
      await expect(ageChart.getByRole("img", { name: `Annual BOHC patient volume for ${group}, 2014–2028`, exact: true })).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.getByRole("region", { name: "2028 forecast summary" })).toBeVisible();
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
  const annualChart = page.getByRole("region", { name: "Three-year demand forecast", exact: true });
  for (const year of [2014, 2020, 2024, 2025, 2026, 2027, 2028]) {
    const total = year <= 2025
      ? payload.history.filter(row => row.year === year).reduce((sum, row) => sum + row.recipients, 0)
      : payload.forecasts.filter(row => row.forecast_year === year).reduce((sum, row) => sum + row.forecast_recipients, 0);
    await expectChartPoint(annualChart, year <= 2025 ? 0 : 1, year <= 2025 ? year - 2014 : year - 2025, year, total);
  }
  const ageChart = page.getByRole("region", { name: "BOHC recipients by age group", exact: true });
  for (const group of ageGroups) {
    await ageChart.getByRole("combobox", { name: "Age group", exact: true }).selectOption(group);
    for (const year of [2024, 2025, 2026, 2028]) {
      const recipients = year <= 2025
        ? payload.history.find(row => row.year === year && row.age_group === group).recipients
        : payload.forecasts.find(row => row.forecast_year === year && row.age_group === group).forecast_recipients;
      await expectChartPoint(ageChart, year <= 2025 ? 0 : 1, year <= 2025 ? year - 2014 : year - 2025, year, recipients);
    }
  }
  for (const year of [2026, 2027, 2028]) {
    const rows = payload.forecasts.filter(row => row.forecast_year === year);
    const total = rows.reduce((sum, row) => sum + row.forecast_recipients, 0);
    await page.getByRole("combobox", { name: "Forecast year", exact: true }).selectOption(String(year));
    await expect(page.getByRole("region", { name: `${year} forecast summary` }).getByText(total.toLocaleString("en-PH"), { exact: true })).toBeVisible();
    const table = page.getByRole("table", { name: `2025 actual recipients and ${year} predictions` });
    await expect(table.locator("tbody tr")).toHaveCount(7);
    await expect(table.locator("tbody tr").first().locator("td").nth(1)).toHaveText(rows[0].forecast_recipients.toLocaleString("en-PH"));
  }
  await page.screenshot({ path: testInfo.outputPath("admin-reports-generated-2028.png"), fullPage: true, animations: "disabled" });
});

test("missing historical years stay empty rather than showing zero patients", async ({ page }) => {
  await mockAdmin(page, { forecasts, history: history.filter(row => row.year !== 2020) });
  await openReports(page);
  for (const chart of [page.getByRole("region", { name: "Three-year demand forecast", exact: true }), page.getByRole("region", { name: "BOHC recipients by age group", exact: true })]) {
    await expect(chart.locator('.recharts-line-dot[stroke="#059669"]')).toHaveCount(11);
    expect((await chart.locator('.recharts-line-curve[stroke="#059669"]').getAttribute("d")).match(/M/g)).toHaveLength(2);
    await expect(chart.locator(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")).toContainText(["2020"]);
  }
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
