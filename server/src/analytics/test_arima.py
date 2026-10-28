import tempfile
import unittest
from collections import Counter
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock, patch

import numpy as np
import pandas as pd

import arima


def fake_fit(values):
    def get_forecast(steps):
        means = values[-1] + np.arange(1, steps + 1)
        return SimpleNamespace(
            predicted_mean=means,
            conf_int=lambda alpha: np.column_stack((means - 1, means + 1)),
        )
    return (0, 1, 0), SimpleNamespace(get_forecast=get_forecast)


class ForecastTests(unittest.TestCase):
    def test_three_steps_keep_their_own_intervals_and_clip_negative_counts(self):
        fitted = Mock()
        fitted.get_forecast.return_value = SimpleNamespace(
            predicted_mean=[-2.1, 12.6, 20.2],
            conf_int=lambda alpha: [[-3, 3], [10.1, 15.9], [18, 25.7]],
        )
        self.assertEqual(arima.forecast_steps(fitted, 3), [
            {"horizon": 1, "forecast_recipients": 0, "lower_95": 0, "upper_95": 3},
            {"horizon": 2, "forecast_recipients": 13, "lower_95": 10, "upper_95": 16},
            {"horizon": 3, "forecast_recipients": 20, "lower_95": 18, "upper_95": 26},
        ])
        fitted.get_forecast.assert_called_once_with(steps=3)

    def test_backtests_do_not_use_observations_after_the_training_cutoff(self):
        series = pd.Series(range(1, 15), index=range(2012, 2026))
        with patch.object(arima, "fit_lowest_aic", side_effect=fake_fit) as fit:
            rows = arima.backtest_forecasts(series)
        self.assertEqual(Counter(row["horizon"] for row in rows), {1: 4, 2: 3, 3: 2})
        for origin, call in zip(range(2021, 2025), fit.call_args_list):
            np.testing.assert_array_equal(call.args[0], series.loc[:origin].to_numpy())
        self.assertEqual(fit.call_count, 4)
        for row in rows:
            self.assertGreaterEqual(row["training_end_year"], 2021)
            self.assertEqual(row["validation_year"], row["training_end_year"] + row["horizon"])
            self.assertEqual(row["actual_recipients"], row["forecast_recipients"])
            self.assertEqual(row["naive_last_year"], series.loc[row["training_end_year"]])

    def test_scores_include_zero_actual_errors_but_exclude_them_from_mape(self):
        rows = [
            {"validation_year": 2024, "actual_recipients": 0, "forecast_recipients": 5, "naive_last_year": 0},
            {"validation_year": 2025, "actual_recipients": 10, "forecast_recipients": 8, "naive_last_year": 7},
        ]
        self.assertEqual(arima.validation_scores(rows), {
            "backtest_years": "2024-2025", "backtest_count": 2, "backtest_mae": 3.5,
            "backtest_rmse": 3.81, "backtest_mape_pct": 20.0, "naive_last_year_mae": 1.5,
        })
        self.assertIsNone(arima.validation_scores(rows[:1])["backtest_mape_pct"])

    def test_generation_exports_21_forecasts_and_63_backtests_without_changing_history(self):
        directory = Path(__file__).resolve().parent
        scratch = tempfile.TemporaryDirectory(prefix=".bohc-test-", dir=directory)
        self.assertTrue(Path(scratch.name).resolve().is_relative_to(directory))
        self.addCleanup(scratch.cleanup)
        forecasts_path = Path(scratch.name) / "forecasts.csv"
        backtests_path = Path(scratch.name) / "backtests.csv"
        original = arima.DATA_FILE.read_bytes()
        with patch.object(arima, "FORECAST_FILE", forecasts_path), \
             patch.object(arima, "BACKTEST_FILE", backtests_path), \
             patch.object(arima, "fit_lowest_aic", side_effect=fake_fit):
            arima.main()
        forecasts = pd.read_csv(forecasts_path)
        backtests = pd.read_csv(backtests_path)
        self.assertEqual(len(forecasts), 21)
        self.assertEqual(len(backtests), 63)
        self.assertEqual(set(forecasts["forecast_year"]), {2026, 2027, 2028})
        self.assertTrue(forecasts["baseline_year"].eq(2025).all())
        self.assertTrue(forecasts["synthetic_years_in_training"].eq(8).all())
        for horizon, count in [(1, 4), (2, 3), (3, 2)]:
            selected = forecasts.loc[forecasts["horizon"] == horizon]
            self.assertEqual(len(selected), 7)
            self.assertTrue(selected["backtest_count"].eq(count).all())
            self.assertTrue(selected["forecast_recipients"].eq(selected["baseline_recipients"] + horizon).all())
        self.assertEqual(arima.DATA_FILE.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
