import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "@/services/api";
import "./AdminReportsTab.css";

const formatNumber = (value, digits = 0) =>
  value != null && value !== "" && Number.isFinite(Number(value))
    ? Number(value).toLocaleString("en-PH", { maximumFractionDigits: digits })
    : "—";
const formatChange = (value, digits = 0) =>
  `${value > 0 ? "+" : ""}${formatNumber(value, digits)}`;
const formatPercent = (value) =>
  value == null ? "—" : `${formatNumber(value, 1)}%`;

export default function AdminReportsTab() {
  const [bohcForecast, setBohcForecast] = useState([]);
  const [bohcHistory, setBohcHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/admin/bohc-forecast")
      .then((data) => {
        if (!active) return;
        setBohcForecast(data.forecasts ?? []);
        setBohcHistory(data.history ?? []);
      })
      .catch((error) => {
        if (active) setForecastError(error.message);
      })
      .finally(() => {
        if (active) setForecastLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const years = [...new Set(bohcHistory.map((row) => row.year))].sort(
    (a, b) => b - a,
  );
  const isForecast = selectedYear === 2026;
  const actualTotal = bohcForecast.reduce(
    (sum, row) => sum + Number(row.actual_2025),
    0,
  );
  const forecastTotal = bohcForecast.reduce(
    (sum, row) => sum + Number(row.forecast_2026),
    0,
  );
  const totalChange = forecastTotal - actualTotal;
  const growth = actualTotal > 0 ? (totalChange / actualTotal) * 100 : null;
  const largestGroup = bohcForecast.reduce(
    (largest, row) =>
      !largest || Number(row.forecast_2026) > Number(largest.forecast_2026)
        ? row
        : largest,
    null,
  );
  const chartData = bohcForecast.map((row) => ({
    age_group: row.age_group,
    recipients: isForecast
      ? Number(row.actual_2025)
      : bohcHistory.find(
          (item) =>
            item.year === selectedYear && item.age_group === row.age_group,
        )?.recipients,
    forecast: isForecast ? Number(row.forecast_2026) : undefined,
    lower: isForecast ? Number(row.lower_95) : undefined,
    upper: isForecast ? Number(row.upper_95) : undefined,
  }));
  const selectedHistory = bohcHistory.filter(
    (row) => row.year === selectedYear,
  );
  const synthetic = selectedHistory.some((row) => row.is_synthetic);
  const historyTotal = selectedHistory.reduce(
    (sum, row) => sum + row.recipients,
    0,
  );

  return (
    <div className="ar-page">
      <header>
        <p className="ar-eyebrow">Annual service planning</p>
        <h2>Statistics & Analytics</h2>
        <p className="ar-muted">
          Basic Oral Health Care (BOHC) recipients, demand forecasts, and model
          performance.
        </p>
      </header>

      {forecastLoading ? (
        <div className="ar-card" role="status">
          Loading predictive analytics…
        </div>
      ) : forecastError ? (
        <div className="ar-notice" role="alert">
          <strong>Predictive analytics are unavailable.</strong>
          <p>{forecastError} Refresh the page to try again.</p>
        </div>
      ) : bohcForecast.length === 0 ? (
        <div className="ar-card" role="status">
          No forecast results are available yet.
        </div>
      ) : (
        <>
          <section className="ar-metrics" aria-label="2026 forecast summary">
            {[
              {
                label: "2026 predicted recipients",
                value: formatNumber(forecastTotal),
                note: `Across ${bohcForecast.length} age groups`,
              },
              {
                label: "2025 actual recipients",
                value: formatNumber(actualTotal),
                note: "Recorded comparison year",
              },
              {
                label: "Expected annual change",
                value: formatChange(totalChange),
                note:
                  growth == null
                    ? "No 2025 baseline for percentage change"
                    : `${formatChange(growth, 1)}% compared with 2025`,
              },
              {
                label: "Largest predicted age group",
                value: formatNumber(largestGroup.forecast_2026),
                note: largestGroup.age_group,
              },
            ].map(({ label, value, note }) => (
              <div className="ar-card ar-metric" key={label}>
                <span className="ar-muted">{label}</span>
                <strong>{value}</strong>
                <span className="ar-muted">{note}</span>
              </div>
            ))}
          </section>

          <section className="ar-card" aria-labelledby="bohc-chart-heading">
            <div className="ar-section-head">
              <div>
                <h3 id="bohc-chart-heading">BOHC recipients by age group</h3>
                <p className="ar-muted">
                  {isForecast
                    ? "2026 prediction compared with 2025 actual recipients."
                    : `${selectedYear} recipient counts · ${synthetic ? "synthetic teaching data, not facility records" : "recorded data"}.`}
                </p>
              </div>
              <label className="ar-year">
                Year
                <select
                  value={selectedYear}
                  onChange={(event) =>
                    setSelectedYear(Number(event.target.value))
                  }
                >
                  <option value={2026}>2026 prediction</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {!isForecast && selectedHistory.length === 0 ? (
              <p className="ar-muted">No recorded data for this year.</p>
            ) : (
              <>
                <div
                  className="ar-scroll"
                  role="region"
                  aria-label="BOHC recipients chart"
                  tabIndex={0}
                >
                  <div
                    className="ar-chart"
                    role="img"
                    aria-label={`Line graph of BOHC recipients by age group for ${selectedYear}${isForecast ? " prediction compared with 2025 actuals" : ""}`}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 16, right: 24, bottom: 28, left: 10 }}
                      >
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis
                          dataKey="age_group"
                          tickFormatter={(value) =>
                            value.match(/\d+(?:-\d+)?/)?.[0] ?? value
                          }
                          tick={{ fontSize: 11, fill: "#475569" }}
                          label={{
                            value: "Age group (years; first group in months)",
                            position: "insideBottom",
                            offset: -18,
                            fontSize: 11,
                            fill: "#64748b",
                          }}
                        />
                        <YAxis
                          tickFormatter={(value) => formatNumber(value)}
                          tick={{ fontSize: 11, fill: "#475569" }}
                          width={65}
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatNumber(value),
                            name,
                          ]}
                          contentStyle={{
                            fontSize: "12px",
                            borderRadius: "8px",
                          }}
                        />
                        {isForecast && (
                          <Line
                            type="linear"
                            dataKey="lower"
                            name="95% lower"
                            stroke="#94a3b8"
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                          />
                        )}
                        {isForecast && (
                          <Line
                            type="linear"
                            dataKey="upper"
                            name="95% upper"
                            stroke="#94a3b8"
                            strokeDasharray="4 4"
                            dot={false}
                            isAnimationActive={false}
                          />
                        )}
                        <Line
                          type="linear"
                          dataKey="recipients"
                          name={
                            isForecast
                              ? "2025 actual"
                              : `${selectedYear} recipients`
                          }
                          stroke="#059669"
                          strokeWidth={2.5}
                          dot={{ r: 4 }}
                          isAnimationActive={false}
                        />
                        {isForecast && (
                          <Line
                            type="linear"
                            dataKey="forecast"
                            name="2026 prediction"
                            stroke="#1e4db7"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            isAnimationActive={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="ar-muted ar-chart-key">
                  {isForecast
                    ? "Green: 2025 actual · Blue: 2026 prediction · Dashed gray: 95% prediction interval. Counts are annual recipients."
                    : "Green: annual recipients. Hover or tap a point for the full age group and count."}
                </p>
                {!isForecast && (
                  <div
                    className="ar-scroll"
                    role="region"
                    aria-label={`${selectedYear} recipient details`}
                    tabIndex={0}
                  >
                    <table className="ar-table">
                      <caption>
                        {selectedYear} recipient breakdown ·{" "}
                        {synthetic ? "synthetic" : "recorded"}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Age group</th>
                          <th scope="col">Recipients</th>
                          <th scope="col">Share of total</th>
                          <th scope="col">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((row) => (
                          <tr key={row.age_group}>
                            <th scope="row">{row.age_group}</th>
                            <td>{formatNumber(row.recipients)}</td>
                            <td>
                              {formatPercent(
                                row.recipients != null && historyTotal > 0
                                  ? (row.recipients / historyTotal) * 100
                                  : null,
                              )}
                            </td>
                            <td>
                              {row.recipients == null
                                ? "Unavailable"
                                : selectedHistory.find(
                                      (item) =>
                                        item.age_group === row.age_group,
                                    )?.is_synthetic
                                  ? "Synthetic"
                                  : "Recorded"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th scope="row">Total</th>
                          <td>{formatNumber(historyTotal)}</td>
                          <td>{historyTotal > 0 ? "100%" : "—"}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>

          <section
            className="ar-card"
            aria-labelledby="forecast-breakdown-heading"
          >
            <h3 id="forecast-breakdown-heading">2026 forecast breakdown</h3>
            <p className="ar-muted">
              Expected demand, annual change, and uncertainty for each age
              group.
            </p>
            <div
              className="ar-scroll"
              role="region"
              aria-label="Forecast breakdown table"
              tabIndex={0}
            >
              <table className="ar-table">
                <caption>2025 actual recipients and 2026 predictions</caption>
                <thead>
                  <tr>
                    {[
                      "Age group",
                      "2025 actual",
                      "2026 prediction",
                      "Change",
                      "Change (%)",
                      "Forecast share",
                      "95% prediction interval",
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bohcForecast.map((row) => {
                    const change =
                      Number(row.forecast_2026) - Number(row.actual_2025);
                    return (
                      <tr key={row.age_group}>
                        <th scope="row">{row.age_group}</th>
                        <td>{formatNumber(row.actual_2025)}</td>
                        <td className="ar-emphasis">
                          {formatNumber(row.forecast_2026)}
                        </td>
                        <td>{formatChange(change)}</td>
                        <td>
                          {Number(row.actual_2025) > 0
                            ? `${formatChange((change / Number(row.actual_2025)) * 100, 1)}%`
                            : "—"}
                        </td>
                        <td>
                          {formatPercent(
                            forecastTotal > 0
                              ? (Number(row.forecast_2026) / forecastTotal) *
                                  100
                              : null,
                          )}
                        </td>
                        <td>
                          {formatNumber(row.lower_95)} –{" "}
                          {formatNumber(row.upper_95)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td>{formatNumber(actualTotal)}</td>
                    <td>{formatNumber(forecastTotal)}</td>
                    <td>{formatChange(totalChange)}</td>
                    <td>
                      {growth == null ? "—" : `${formatChange(growth, 1)}%`}
                    </td>
                    <td>{forecastTotal > 0 ? "100%" : "—"}</td>
                    <td>Per age group only</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="ar-muted">
              Change = prediction − 2025 actual. A dash in Change (%) means the
              2025 baseline is zero. Wider intervals indicate more uncertainty;
              group intervals are not added into a total interval.
            </p>
          </section>

          <section
            className="ar-card"
            aria-labelledby="model-performance-heading"
          >
            <h3 id="model-performance-heading">
              Model performance by age group
            </h3>
            <p className="ar-muted">
              Historical validation scores compare one-year predictions with
              actual recipients. Lower errors are better.
            </p>
            <div
              className="ar-scroll"
              role="region"
              aria-label="Model performance table"
              tabIndex={0}
            >
              <table className="ar-table">
                <caption>
                  ARIMA model selection and historical validation
                </caption>
                <thead>
                  <tr>
                    {[
                      "Age group",
                      "ARIMA (p, d, q)",
                      "Validation years",
                      "MAE",
                      "RMSE",
                      "MAPE (%)",
                      "Baseline MAE",
                      "MAE vs. baseline",
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bohcForecast.map((row) => {
                    const hasScores = [
                      row.backtest_mae,
                      row.naive_last_year_mae,
                    ].every(
                      (value) =>
                        value != null &&
                        value !== "" &&
                        Number.isFinite(Number(value)),
                    );
                    const difference =
                      Number(row.backtest_mae) -
                      Number(row.naive_last_year_mae);
                    return (
                      <tr key={row.age_group}>
                        <th scope="row">{row.age_group}</th>
                        <td>{row.selected_arima_order || "—"}</td>
                        <td>{row.backtest_years || "—"}</td>
                        <td>{formatNumber(row.backtest_mae, 2)}</td>
                        <td>{formatNumber(row.backtest_rmse, 2)}</td>
                        <td>{formatNumber(row.backtest_mape_pct, 2)}</td>
                        <td>{formatNumber(row.naive_last_year_mae, 2)}</td>
                        <td>
                          {!hasScores
                            ? "—"
                            : difference === 0
                              ? "Same as baseline"
                              : `${formatNumber(Math.abs(difference), 2)} ${difference < 0 ? "lower" : "higher"}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <dl className="ar-definitions">
              <div>
                <dt>MAE · Mean absolute error</dt>
                <dd>
                  Average absolute difference between predicted and actual
                  recipients, in recipients.
                </dd>
              </div>
              <div>
                <dt>RMSE · Root mean squared error</dt>
                <dd>
                  Error in recipients that gives more weight to large misses.
                </dd>
              </div>
              <div>
                <dt>MAPE · Mean absolute percentage error</dt>
                <dd>
                  Average percentage error. Years with zero actual recipients
                  are excluded; a dash means no score is available.
                </dd>
              </div>
              <div>
                <dt>Baseline · Previous year's count</dt>
                <dd>
                  Repeats the prior year's recipients as the prediction. A lower
                  ARIMA MAE means it performed better than this baseline.
                </dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
