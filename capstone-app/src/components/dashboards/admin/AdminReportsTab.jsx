import useLiveData from "@/hooks/useLiveData";
import { useCallback, useState } from "react";
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
const historyYears = Array.from({ length: 12 }, (_, index) => 2014 + index);
const formatChartTooltip = (value, name, item) =>
  item.dataKey === "forecast" && item.payload.recipients != null
    ? null
    : [formatNumber(value), name];

function ChartLegend() {
  return (
    <ul className="ar-chart-legend" aria-label="Chart legend">
      <li><span className="ar-legend-history" aria-hidden="true" />Historical (2014–2025)</li>
      <li><span className="ar-legend-prediction" aria-hidden="true" />Prediction (2026–2028)</li>
    </ul>
  );
}

export default function AdminReportsTab() {
  const [bohcForecast, setBohcForecast] = useState([]);
  const [bohcHistory, setBohcHistory] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("");
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState("");

  useLiveData(useCallback(async (signal) => {
    try {
      const data = await api.get('/admin/bohc-forecast', { signal });
      if (!signal.aborted) {
        setBohcForecast(data.forecasts ?? []); setBohcHistory(data.history ?? []); setForecastError('');
      }
    } catch (error) { if (!signal.aborted) setForecastError(error.message); }
    finally { if (!signal.aborted) setForecastLoading(false); }
  }, []));

  const forecastYears = [...new Set(bohcForecast.map((row) => row.forecast_year))].sort(
    (a, b) => a - b,
  );
  const baselineYear = bohcForecast[0]?.baseline_year;
  const baselineForecast = bohcForecast.filter((row) => row.forecast_year === forecastYears[0]);
  const selectedForecast = bohcForecast.filter((row) => row.forecast_year === selectedYear);
  const horizon = selectedForecast[0]?.horizon;
  const actualTotal = baselineForecast.reduce(
    (sum, row) => sum + Number(row.baseline_recipients),
    0,
  );
  const forecastTotal = selectedForecast.reduce(
    (sum, row) => sum + Number(row.forecast_recipients),
    0,
  );
  const totalChange = forecastTotal - actualTotal;
  const growth = actualTotal > 0 ? (totalChange / actualTotal) * 100 : null;
  const largestGroup = selectedForecast.reduce(
    (largest, row) =>
      !largest || Number(row.forecast_recipients) > Number(largest.forecast_recipients)
        ? row
        : largest,
    null,
  );
  const forecastTotals = forecastYears.map((year) => ({
    year,
    horizon: year - baselineYear,
    recipients: bohcForecast.filter((row) => row.forecast_year === year)
      .reduce((sum, row) => sum + Number(row.forecast_recipients), 0),
  }));
  const trendData = [
    ...historyYears.map((year) => {
      const rows = bohcHistory.filter((row) => row.year === year);
      const recipients = rows.length
        ? rows.reduce((sum, row) => sum + Number(row.recipients), 0)
        : null;
      return { year, recipients, forecast: year === baselineYear ? recipients : null };
    }),
    ...forecastTotals.map((row) => ({ year: row.year, recipients: null, forecast: row.recipients })),
  ];
  const ageGroups = baselineForecast.map((row) => row.age_group);
  const ageGroup = selectedAgeGroup || ageGroups[0];
  const chartData = trendData.map(({ year }) => {
    const recipients = bohcHistory.find(
      (row) => row.year === year && row.age_group === ageGroup,
    )?.recipients ?? null;
    return {
      year,
      recipients,
      forecast: year === baselineYear
        ? recipients
        : bohcForecast.find(
            (row) => row.forecast_year === year && row.age_group === ageGroup,
          )?.forecast_recipients ?? null,
    };
  });

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
          <p className="ar-muted">
            <strong>Demonstration forecast.</strong> Displayed history includes
            synthetic totals for 2014–2019 and recorded totals for 2020–2025.
            Model training also includes synthetic 2012–2013 data. Synthetic
            history follows a 3–4% annual growth trend with small variations and
            occasional slight declines. Forecasts and validation scores are illustrative.
          </p>

          <section className="ar-card" aria-labelledby="forecast-trend-heading">
            <h3 id="forecast-trend-heading">Three-year demand forecast</h3>
            <p className="ar-muted">
              Total annual patient volume across all age groups. The solid line
              shows 2014–2025 history; the dashed line shows 2026–2028 predictions.
            </p>
            <div className="ar-scroll" role="region" aria-label="Annual patient volume chart" tabIndex={0}>
              <div className="ar-chart ar-trend-chart" role="img" aria-label="Three-year BOHC demand forecast">
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 820, height: 340 }}>
                  <LineChart data={trendData} margin={{ top: 16, right: 24, bottom: 8, left: 10 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="year" interval={0} tick={{ fontSize: 11 }} height={50} label={{ value: "Year", position: "insideBottom", offset: 0 }} />
                    <YAxis tickFormatter={(value) => formatNumber(value)} width={90} allowDecimals={false} label={{ value: "Annual patient volume", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fontSize: 12 } }} />
                    <Tooltip formatter={formatChartTooltip} />
                    <Line type="linear" dataKey="recipients" name="Historical (2014–2025)" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                    <Line type="linear" dataKey="forecast" name="Prediction (2026–2028)" stroke="#1e4db7" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <ChartLegend />
            <div className="ar-scroll" role="region" aria-label="Three-year forecast totals" tabIndex={0}>
              <table className="ar-table ar-trend-table">
                <caption>Predicted annual recipients for all three years</caption>
                <thead>
                  <tr>
                    <th scope="col">Year</th>
                    <th scope="col">Horizon</th>
                    <th scope="col">Predicted recipients</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastTotals.map((row) => (
                    <tr key={row.year}>
                      <th scope="row">{row.year}</th>
                      <td>{row.horizon} {row.horizon === 1 ? "year" : "years"}</td>
                      <td>{formatNumber(row.recipients)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ar-card" aria-labelledby="bohc-chart-heading">
            <div className="ar-section-head">
              <div>
                <h3 id="bohc-chart-heading">BOHC recipients by age group</h3>
                <p className="ar-muted">
                  Annual patient volume for {ageGroup}. Solid: 2014–2025 history;
                  dashed: 2026–2028 predictions.
                </p>
              </div>
              <label className="ar-year">
                Age group
                <select
                  value={ageGroup ?? ""}
                  onChange={(event) =>
                    setSelectedAgeGroup(event.target.value)
                  }
                >
                  {ageGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ar-scroll" role="region" aria-label="BOHC recipients chart" tabIndex={0}>
              <div className="ar-chart" role="img" aria-label={`Annual BOHC patient volume for ${ageGroup}, 2014–2028`}>
                <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 820, height: 340 }}>
                  <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 10 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      interval={0}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      height={50}
                      label={{ value: "Year", position: "insideBottom", offset: 0, fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      tickFormatter={(value) => formatNumber(value)}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      width={90}
                      allowDecimals={false}
                      label={{ value: "Patient volume", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fontSize: 12 } }}
                    />
                    <Tooltip formatter={formatChartTooltip} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                    <Line type="linear" dataKey="recipients" name="Historical (2014–2025)" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
                    <Line type="linear" dataKey="forecast" name="Prediction (2026–2028)" stroke="#1e4db7" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <ChartLegend />
          </section>

          <div className="ar-section-head">
            <h3>Forecast details</h3>
            <label className="ar-year">
              Forecast year
              <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
                {forecastYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
          <section className="ar-metrics" aria-label={`${selectedYear} forecast summary`}>
            {[
              {
                label: `${selectedYear} predicted recipients`,
                value: formatNumber(forecastTotal),
                note: `${horizon}-year forecast across ${selectedForecast.length} age groups`,
              },
              {
                label: `${baselineYear} actual recipients`,
                value: formatNumber(actualTotal),
                note: "Recorded comparison year",
              },
              {
                label: `Change from ${baselineYear}`,
                value: formatChange(totalChange),
                note:
                  growth == null
                    ? `No ${baselineYear} baseline for percentage change`
                    : `${formatChange(growth, 1)}% compared with ${baselineYear}`,
              },
              {
                label: "Largest predicted age group",
                value: formatNumber(largestGroup.forecast_recipients),
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
          <section
            className="ar-card"
            aria-labelledby="forecast-breakdown-heading"
          >
            <h3 id="forecast-breakdown-heading">{selectedYear} forecast breakdown</h3>
            <p className="ar-muted">
              Expected demand, change from {baselineYear}, and uncertainty for each age
              group.
            </p>
            <div
              className="ar-scroll"
              role="region"
              aria-label="Forecast breakdown table"
              tabIndex={0}
            >
              <table className="ar-table">
                <caption>{baselineYear} actual recipients and {selectedYear} predictions</caption>
                <thead>
                  <tr>
                    {[
                      "Age group",
                      `${baselineYear} actual`,
                      `${selectedYear} prediction`,
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
                  {selectedForecast.map((row) => {
                    const change =
                      Number(row.forecast_recipients) - Number(row.baseline_recipients);
                    return (
                      <tr key={row.age_group}>
                        <th scope="row">{row.age_group}</th>
                        <td>{formatNumber(row.baseline_recipients)}</td>
                        <td className="ar-emphasis">
                          {formatNumber(row.forecast_recipients)}
                        </td>
                        <td>{formatChange(change)}</td>
                        <td>
                          {Number(row.baseline_recipients) > 0
                            ? `${formatChange((change / Number(row.baseline_recipients)) * 100, 1)}%`
                            : "—"}
                        </td>
                        <td>
                          {formatPercent(
                            forecastTotal > 0
                              ? (Number(row.forecast_recipients) / forecastTotal) *
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
              Change = prediction − {baselineYear} actual, including for later forecast years.
              A dash in Change (%) means the {baselineYear} baseline is zero. Wider intervals indicate more uncertainty;
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
              These scores compare {horizon}-year-ahead predictions with actual recipients,
              using only data available at each training cutoff. Lower errors are better.
              There are {selectedForecast[0].backtest_count} validation forecasts per age group;
              the small sample limits confidence in these scores.
              Small ARIMA models are compared with and without drift using AICc.
              Drift allows an average annual increase or decrease; it does not force growth.
            </p>
            <div
              className="ar-scroll"
              role="region"
              aria-label="Model performance table"
              tabIndex={0}
            >
              <table className="ar-table">
                <caption>
                  {horizon}-year ARIMA model selection and historical validation
                </caption>
                <thead>
                  <tr>
                    {[
                      "Age group",
                      "ARIMA (p, d, q)",
                      "Validation years",
                      "Validation forecasts",
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
                  {selectedForecast.map((row) => {
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
                        <td>{row.selected_arima_order || "—"}{row.selected_arima_trend === "t" ? " · drift" : ""}</td>
                        <td>{row.backtest_years || "—"}</td>
                        <td>{formatNumber(row.backtest_count)}</td>
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
                <dt>Baseline · Last observed count</dt>
                <dd>
                  Repeats the last count available at each training cutoff for every forecast horizon. A lower
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
