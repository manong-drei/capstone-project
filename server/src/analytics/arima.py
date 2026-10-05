"""Train one small annual ARIMA model per BOHC age group.

Install once with: python -m pip install pandas statsmodels
Put bohc_modeling_dataset.csv beside this script, then run: python train_bohc_arima.py

The synthetic 2014-2019 rows are teaching placeholders, not facility records.
Forecasts and scores are demonstrations because synthetic history is included.
"""

from itertools import product
from math import sqrt
from pathlib import Path
import warnings

try:
    import numpy as np
    import pandas as pd
    from statsmodels.tsa.arima.model import ARIMA
except ImportError as exc:
    raise SystemExit(
        "Install the required packages first: python -m pip install pandas statsmodels"
    ) from exc


DATA_FILE = Path(__file__).with_name("bohc_modeling_dataset.csv")
FORECAST_FILE = Path(__file__).with_name("bohc_arima_forecasts.csv")
BACKTEST_FILE = Path(__file__).with_name("bohc_arima_backtest.csv")
ORDERS = list(product((0, 1), repeat=3))  # small p, d, q values for a short annual series
VALIDATION_YEARS = range(2022, 2026)


def load_data(path):
    data = pd.read_csv(path)
    required = {"reporting_year", "age_group", "age_group_order", "total_recipients", "data_source", "is_synthetic"}
    missing = required - set(data.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

    data["reporting_year"] = pd.to_numeric(data["reporting_year"], errors="raise").astype(int)
    data["total_recipients"] = pd.to_numeric(data["total_recipients"], errors="raise")
    data["is_synthetic"] = data["is_synthetic"].astype(str).str.lower().map({"true": True, "false": False})
    if data["is_synthetic"].isna().any() or data["total_recipients"].isna().any():
        raise ValueError("Synthetic flags and recipient totals must be populated for every row.")
    if (data["total_recipients"] < 0).any():
        raise ValueError("Recipient totals cannot be negative.")
    if data.duplicated(["reporting_year", "age_group"]).any():
        raise ValueError("Each year and age group must have exactly one row.")

    groups = data["age_group"].drop_duplicates().tolist()
    expected_years = list(range(2014, 2026))
    for group in groups:
        series = data.loc[data["age_group"] == group].sort_values("reporting_year")
        if series["reporting_year"].tolist() != expected_years:
            raise ValueError(f"{group} must have one observation for every year from 2014 to 2025.")
        if series.loc[series["reporting_year"] < 2020, "is_synthetic"].ne(True).any():
            raise ValueError(f"{group}: years 2014-2019 must be labeled synthetic.")
        if series.loc[series["reporting_year"] >= 2020, "is_synthetic"].ne(False).any():
            raise ValueError(f"{group}: years 2020-2025 must be labeled actual.")
    if len(groups) != 7:
        raise ValueError(f"Expected 7 age groups; found {len(groups)}.")
    return data, groups


def fit_lowest_aic(values):
    candidates = []
    for order in ORDERS:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                fitted = ARIMA(values, order=order).fit()
            converged = getattr(fitted, "mle_retvals", {}).get("converged", True)
            if converged and pd.notna(fitted.aic):
                candidates.append((float(fitted.aic), order, fitted))
        except (ValueError, ArithmeticError, np.linalg.LinAlgError):
            continue
    if not candidates:
        raise RuntimeError("No small ARIMA candidate fitted successfully for this series.")
    return min(candidates, key=lambda item: (item[0], item[1]))[1:]


def predict_one(values, order):
    fitted = ARIMA(values, order=order).fit()
    prediction = fitted.get_forecast(steps=1)
    interval = prediction.conf_int(alpha=0.05)[0]
    return float(prediction.predicted_mean[0]), float(interval[0]), float(interval[1])


def main():
    if not DATA_FILE.exists():
        raise SystemExit(f"Could not find {DATA_FILE.name}. Put it beside this script and run again.")
    data, groups = load_data(DATA_FILE)
    backtests = []
    summaries = []

    for group in groups:
        group_data = data.loc[data["age_group"] == group].sort_values("reporting_year")
        series = group_data.set_index("reporting_year")["total_recipients"]

        for year in VALIDATION_YEARS:
            train = series.loc[series.index < year].to_numpy(dtype=float)
            actual = float(series.loc[year])
            order, _ = fit_lowest_aic(train)
            forecast, lower, upper = predict_one(train, order)
            backtests.append({
                "age_group": group,
                "validation_year": year,
                "actual_recipients": int(actual),
                "forecast_recipients": max(0, round(forecast)),
                "lower_95": max(0, round(lower)),
                "upper_95": max(0, round(upper)),
                "arima_order": str(order),
                "naive_last_year": int(train[-1]),
            })

        values = series.to_numpy(dtype=float)
        order, fitted = fit_lowest_aic(values)
        prediction = fitted.get_forecast(steps=1)
        forecast = float(prediction.predicted_mean[0])
        interval = prediction.conf_int(alpha=0.05)[0]
        actual_2025 = float(series.loc[2025])
        group_backtests = [row for row in backtests if row["age_group"] == group]
        errors = [row["actual_recipients"] - row["forecast_recipients"] for row in group_backtests]
        naive_errors = [row["actual_recipients"] - row["naive_last_year"] for row in group_backtests]
        nonzero = [row for row in group_backtests if row["actual_recipients"] != 0]
        mape = (
            sum(abs(row["actual_recipients"] - row["forecast_recipients"]) / row["actual_recipients"] for row in nonzero)
            / len(nonzero) * 100
            if nonzero else None
        )
        summaries.append({
            "age_group": group,
            "actual_2025": int(actual_2025),
            "forecast_2026": max(0, round(forecast)),
            "lower_95": max(0, round(float(interval[0]))),
            "upper_95": max(0, round(float(interval[1]))),
            "selected_arima_order": str(order),
            "backtest_years": "2022-2025",
            "backtest_mae": round(sum(abs(error) for error in errors) / len(errors), 2),
            "backtest_rmse": round(sqrt(sum(error * error for error in errors) / len(errors)), 2),
            "backtest_mape_pct": round(mape, 2) if mape is not None else None,
            "naive_last_year_mae": round(sum(abs(error) for error in naive_errors) / len(naive_errors), 2),
            "synthetic_years_in_training": 6,
            "interpretation": "Demonstration only: training includes synthetic historical values",
        })

    pd.DataFrame(summaries).to_csv(FORECAST_FILE, index=False)
    pd.DataFrame(backtests).to_csv(BACKTEST_FILE, index=False)
    print(f"Saved forecasts: {FORECAST_FILE.name}")
    print(f"Saved actual-year backtests: {BACKTEST_FILE.name}")
    print("Each model uses 2014-2025, including six synthetic rows; accuracy scores are demonstrations.")


if __name__ == "__main__":
    main()