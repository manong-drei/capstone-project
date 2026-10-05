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
    const forecasts = parseForecastCsv(csv).map((row) => ({
      ...row,
      actual_2025: Number(row.actual_2025),
      forecast_2026: Number(row.forecast_2026),
      lower_95: Number(row.lower_95),
      upper_95: Number(row.upper_95),
      backtest_mae: Number(row.backtest_mae),
    }));

    if (forecasts.length !== 7 || forecasts.some((row) => !Number.isFinite(row.forecast_2026))) {
      return res.status(503).json({ success: false, message: "Forecast results are incomplete." });
    }
    const history = parseForecastCsv(historyCsv).map((row) => ({
      year: Number(row.reporting_year),
      age_group: row.age_group,
      recipients: Number(row.total_recipients),
      is_synthetic: row.is_synthetic.toLowerCase() === "true",
    }));
    if (history.some((row) => !Number.isInteger(row.year) || !Number.isFinite(row.recipients))) {
      return res.status(503).json({ success: false, message: "Historical results are incomplete." });
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
