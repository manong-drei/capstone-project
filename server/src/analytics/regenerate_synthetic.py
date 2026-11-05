"""Regenerate only the 2012-2019 BOHC teaching rows; keep recorded rows intact."""

import csv
import io

import numpy as np

from arima import DATA_FILE, load_data


SEED = 2012
# Starting volumes are independent demo assumptions, not backcasts of recorded years.
PROFILES = {
    1: (120, 0.032),
    2: (320, 0.036),
    3: (480, 0.034),
    4: (420, 0.039),
    5: (380, 0.031),
    6: (2800, 0.037),
    7: (340, 0.035),
}


def synthetic_counts(group_order):
    starting_count, growth = PROFILES[group_order]
    rng = np.random.default_rng(SEED + group_order)
    variations = np.zeros(8)
    for index in range(1, 7):
        variations[index] = np.clip(
            0.5 * variations[index - 1] + rng.uniform(-0.018, 0.018), -0.025, 0.025,
        )
    # One small dip demonstrates that a growing series need not rise every year.
    dip = int(rng.integers(2, 6))
    variations[dip - 1], variations[dip] = 0.025, -0.025
    counts = np.rint(starting_count * (1 + growth) ** np.arange(8) * (1 + variations))
    return counts.astype(int).tolist()


def regenerate_data(path=DATA_FILE):
    load_data(path)
    original = path.read_bytes().decode("utf-8")
    reader = csv.DictReader(io.StringIO(original))
    rows = list(reader)
    generated = {order: synthetic_counts(order) for order in PROFILES}
    for row in rows:
        year = int(row["reporting_year"])
        if year >= 2020:
            continue
        order = int(row["age_group_order"])
        row["total_recipients"] = str(generated[order][year - 2012])
        row["synthetic_method"] = (
            f"Seed {SEED + order}; {PROFILES[order][1]:.1%} annual trend; "
            "+/-2.5% level variation with a slight decline"
        )
        row["data_quality_note"] = (
            "Synthetic placeholder; starting volume is a demo assumption; not a facility record"
        )
    output = io.StringIO(newline="")
    writer = csv.DictWriter(
        output, fieldnames=reader.fieldnames, lineterminator="\r\n" if "\r\n" in original else "\n",
    )
    writer.writeheader()
    writer.writerows(rows)
    path.write_bytes(output.getvalue().encode("utf-8"))


if __name__ == "__main__":
    regenerate_data()
    print("Regenerated 56 synthetic rows: 2012-2019; 3-4% annual trend with small variations.")
    print("All 42 recorded rows from 2020-2025 are unchanged. Run arima.py to refresh forecasts.")
