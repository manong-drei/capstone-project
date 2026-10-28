const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs/promises");
const { getBohcForecast, parseCsvLine } = require("../src/controllers/adminAnalyticsController");

const response = () => ({
  statusCode: 200, headers: {},
  status(code) { this.statusCode = code; return this; },
  set(name, value) { this.headers[name] = value; return this; },
  json(data) { this.data = data; return this; },
});
const csv = (rows) => {
  const fields = Object.keys(rows[0]);
  return [fields.join(","), ...rows.map(row => fields.map(field => `"${String(row[field] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
};
function fixture(t) {
  const groups = Array.from({ length: 7 }, (_, index) => `Age group ${index + 1}`);
  const history = [2012, 2025].flatMap(year => groups.map(age_group => ({
    reporting_year: year, age_group, total_recipients: 100, is_synthetic: year === 2012,
  })));
  const forecasts = groups.flatMap(age_group => [1, 2, 3].map(horizon => ({
    age_group, baseline_year: 2025, baseline_recipients: 100,
    forecast_year: 2025 + horizon, horizon, forecast_recipients: 100 + horizon,
    lower_95: 80, upper_95: 130, selected_arima_order: "(0, 1, 0)",
    backtest_years: `${2021 + horizon}-2025`, backtest_count: 5 - horizon,
    backtest_mae: 10, backtest_rmse: 12, backtest_mape_pct: 8,
    naive_last_year_mae: 11, synthetic_years_in_training: 8,
  })));
  t.mock.method(fs, "readFile", async path => csv(path.endsWith("bohc_arima_forecasts.csv") ? forecasts : history));
  return { forecasts, history };
}

test("CSV parsing preserves commas and escaped quotes in model descriptions", () => {
  assert.deepEqual(parseCsvLine('a,"(0, 1, 0)","say ""hello""",'), ["a", "(0, 1, 0)", 'say "hello"', ""]);
});

test("Reports API returns three complete years with numeric fields and separate validation counts", async t => {
  fixture(t);
  const res = response();
  await getBohcForecast({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.equal(res.data.forecasts.length, 21);
  for (const horizon of [1, 2, 3]) {
    const rows = res.data.forecasts.filter(row => row.horizon === horizon);
    assert.equal(rows.length, 7);
    assert(rows.every(row => row.forecast_year === 2025 + horizon && row.backtest_count === 5 - horizon));
    assert(rows.every(row => row.baseline_recipients === 100 && row.forecast_recipients === 100 + horizon));
  }
});

test("missing model scores stay unavailable instead of becoming zero", async t => {
  const { forecasts } = fixture(t);
  forecasts[0].backtest_mape_pct = "";
  forecasts[0].backtest_mae = "";
  const res = response();
  await getBohcForecast({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.forecasts[0].backtest_mape_pct, null);
  assert.equal(res.data.forecasts[0].backtest_mae, null);
});

test("incomplete, duplicate, or mismatched forecast rows are rejected", async t => {
  const { forecasts } = fixture(t);
  const original = structuredClone(forecasts);
  for (const change of [
    rows => rows.pop(),
    rows => { rows[1] = { ...rows[0] }; },
    rows => { rows[0].forecast_year = 2029; },
    rows => { rows[0].baseline_recipients = 99; },
    rows => { rows[0].horizon = 4; },
    rows => { rows[0].forecast_recipients = ""; },
    rows => { rows[0].forecast_recipients = "invalid"; },
    rows => { rows[0].lower_95 = 110; },
    rows => { rows[0].upper_95 = 90; },
    rows => { rows[0].backtest_count = 0; },
  ]) {
    forecasts.splice(0, forecasts.length, ...structuredClone(original));
    change(forecasts);
    const res = response();
    await getBohcForecast({}, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.data.message, "Forecast results are incomplete.");
  }
});

test("missing output files produce a clear unavailable response", async t => {
  t.mock.method(fs, "readFile", async () => { throw Object.assign(new Error("Missing"), { code: "ENOENT" }); });
  const res = response();
  await getBohcForecast({}, res);
  assert.equal(res.statusCode, 404);
});

test("generated demonstration files contain all 21 forecasts and preserve the recorded baseline", async () => {
  const res = response();
  await getBohcForecast({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.forecasts.length, 21);
  assert.equal(res.data.history.length, 98);
  for (const year of [2026, 2027, 2028]) {
    const rows = res.data.forecasts.filter(row => row.forecast_year === year);
    assert.equal(rows.length, 7);
    assert.equal(rows.reduce((sum, row) => sum + row.baseline_recipients, 0), 9139);
    assert(rows.every(row => row.synthetic_years_in_training === 8));
  }
});
