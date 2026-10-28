const fs = require("node:fs/promises");
const path = require("node:path");

const forecastFile = path.join(__dirname, "../analytics/bohc_arima_forecasts.csv");
const historyFile = path.join(__dirname, "../analytics/bohc_modeling_dataset.csv");

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  fields.push(value);
  return fields;
}

function parseForecastCsv(csv) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => Object.fromEntries(
    parseCsvLine(line).map((value, index) => [headers[index], value]),
  ));
}

const getBohcForecast = async (req, res) => {
  try {
    const [csv, historyCsv] = await Promise.all([
      fs.readFile(forecastFile, "utf8"),
      fs.readFile(historyFile, "utf8"),
    ]);
    const numericFields = [
      "baseline_year", "baseline_recipients", "forecast_year", "horizon",
      "forecast_recipients", "lower_95", "upper_95", "backtest_count", "synthetic_years_in_training",
    ];
    const scoreFields = ["backtest_mae", "backtest_rmse", "backtest_mape_pct", "naive_last_year_mae"];
    const forecasts = parseForecastCsv(csv).map((row) => ({
      ...row,
      ...Object.fromEntries(numericFields.map((field) => [field, row[field]?.trim() ? Number(row[field]) : NaN])),
      ...Object.fromEntries(scoreFields.map((field) => [field, row[field]?.trim() ? Number(row[field]) : null])),
    }));
    const history = parseForecastCsv(historyCsv).map((row) => ({
      year: Number(row.reporting_year),
      age_group: row.age_group,
      recipients: Number(row.total_recipients),
      is_synthetic: row.is_synthetic.toLowerCase() === "true",
    }));
    if (history.some((row) => !Number.isInteger(row.year) || !Number.isFinite(row.recipients))) {
      return res.status(503).json({ success: false, message: "Historical results are incomplete." });
    }
    const baselineYear = Math.max(...history.filter((row) => !row.is_synthetic).map((row) => row.year));
    const baseline = history.filter((row) => row.year === baselineYear && !row.is_synthetic);
    if (
      baseline.length !== 7 || new Set(baseline.map((row) => row.age_group)).size !== 7 ||
      forecasts.length !== 21 || new Set(forecasts.map((row) => `${row.age_group}:${row.horizon}`)).size !== 21 ||
      forecasts.some((row) =>
        numericFields.some((field) => !Number.isFinite(row[field]) || row[field] < 0) ||
        scoreFields.some((field) => row[field] != null && (!Number.isFinite(row[field]) || row[field] < 0)) ||
        ![1, 2, 3].includes(row.horizon) || row.forecast_year !== baselineYear + row.horizon ||
        row.baseline_year !== baselineYear ||
        !baseline.some((actual) => actual.age_group === row.age_group && actual.recipients === row.baseline_recipients) ||
        !Number.isInteger(row.backtest_count) || row.backtest_count < 1 ||
        row.lower_95 > row.forecast_recipients || row.upper_95 < row.forecast_recipients
      )
    ) {
      return res.status(503).json({ success: false, message: "Forecast results are incomplete." });
    }
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, forecasts, history });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ success: false, message: "Forecast results are not available yet." });
    }
    console.error("getBohcForecast error:", err);
    return res.status(500).json({ success: false, message: "Could not load forecast results." });
  }
};

module.exports = { getBohcForecast, parseCsvLine };
