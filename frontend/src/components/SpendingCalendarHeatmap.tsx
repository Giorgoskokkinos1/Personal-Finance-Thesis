import React, { useMemo, useState } from "react";
import {
  buildSpendingHeatmap,
  getAvailableHeatmapYears,
  getHeatmapCategories,
  type SpendingHeatmapDay,
  type SpendingHeatmapTransaction,
} from "../utils/spendingHeatmap";

type SpendingCalendarHeatmapProps = {
  transactions: SpendingHeatmapTransaction[];
  currency?: string;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getIntensityClass(day: SpendingHeatmapDay, maxSpent: number): string {
  if (day.totalSpent <= 0 || maxSpent <= 0) return "heatmap-day-empty";

  const ratio = day.totalSpent / maxSpent;
  if (ratio >= 0.75) return "heatmap-day-level-4";
  if (ratio >= 0.5) return "heatmap-day-level-3";
  if (ratio >= 0.25) return "heatmap-day-level-2";
  return "heatmap-day-level-1";
}

function SpendingCalendarHeatmap({
  transactions,
  currency = "EUR",
}: SpendingCalendarHeatmapProps) {
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }),
    [currency]
  );
  const years = useMemo(
    () => getAvailableHeatmapYears(transactions),
    [transactions]
  );
  const categories = useMemo(
    () => getHeatmapCategories(transactions),
    [transactions]
  );
  const currentDate = new Date();
  const [mode, setMode] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState<number>(
    years[0] || currentDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth()
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeDay, setActiveDay] = useState<SpendingHeatmapDay | null>(null);

  const heatmapDays = useMemo(
    () =>
      buildSpendingHeatmap(transactions, {
        mode,
        year: selectedYear,
        month: selectedMonth,
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
      }),
    [transactions, mode, selectedYear, selectedMonth, selectedCategory]
  );

  const maxSpent = Math.max(
    ...heatmapDays.map((day) => day.totalSpent),
    0
  );
  const hasSpending = heatmapDays.some((day) => day.totalSpent > 0);

  const daysByMonth = monthNames.map((_, monthIndex) =>
    heatmapDays.filter((day) => day.monthIndex === monthIndex)
  );

  const visibleMonths =
    mode === "month"
      ? [[selectedMonth, daysByMonth[selectedMonth]] as const]
      : daysByMonth.map((days, index) => [index, days] as const);

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
          <div>
            <h4 className="mb-1">Daily Spending Heatmap</h4>
            <p className="text-muted mb-0">
              See spending intensity by day for a selected month or year.
            </p>
          </div>

          <div className="heatmap-controls">
            <div>
              <label className="form-label">View</label>
              <select
                className="form-select"
                value={mode}
                onChange={(e) => setMode(e.target.value as "month" | "year")}
              >
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div>
              <label className="form-label">Year</label>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {(years.length > 0 ? years : [currentDate.getFullYear()]).map(
                  (year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                )}
              </select>
            </div>

            {mode === "month" && (
              <div>
                <label className="form-label">Month</label>
                <select
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!hasSpending && (
          <div className="chart-empty-state mb-3">
            No expense transactions found for this heatmap selection.
          </div>
        )}

        <div className="heatmap-scroll">
          <div className={mode === "year" ? "heatmap-year-grid" : ""}>
            {visibleMonths.map(([monthIndex, days]) => (
              <section className="heatmap-month" key={monthIndex}>
                <h5>{monthNames[monthIndex]}</h5>
                <div className="heatmap-weekdays">
                  {weekdayLabels.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="heatmap-grid">
                  {days[0] &&
                    Array.from({ length: days[0].weekday }, (_, index) => (
                      <span
                        aria-hidden="true"
                        className="heatmap-day-placeholder"
                        key={`blank-${index}`}
                      />
                    ))}

                  {days.map((day) => (
                    <button
                      type="button"
                      className={`heatmap-day ${getIntensityClass(
                        day,
                        maxSpent
                      )}`}
                      key={day.dateKey}
                      aria-label={`${day.dateLabel}: ${currencyFormatter.format(
                        day.totalSpent
                      )} spent across ${day.transactionCount} transactions`}
                      onFocus={() => setActiveDay(day)}
                      onMouseEnter={() => setActiveDay(day)}
                      onClick={() => setActiveDay(day)}
                    >
                      {day.dayOfMonth}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="heatmap-footer">
          <div className="heatmap-legend" aria-label="Spending intensity">
            <span>Less</span>
            <span className="heatmap-swatch heatmap-day-empty" />
            <span className="heatmap-swatch heatmap-day-level-1" />
            <span className="heatmap-swatch heatmap-day-level-2" />
            <span className="heatmap-swatch heatmap-day-level-3" />
            <span className="heatmap-swatch heatmap-day-level-4" />
            <span>More</span>
          </div>

          <div className="heatmap-tooltip" role="status" aria-live="polite">
            {activeDay ? (
              <>
                <strong>{activeDay.dateLabel}</strong>
                <span>
                  {currencyFormatter.format(activeDay.totalSpent)} spent
                </span>
                <span>
                  {activeDay.transactionCount}{" "}
                  {activeDay.transactionCount === 1
                    ? "transaction"
                    : "transactions"}
                </span>
              </>
            ) : (
              <span>Hover or focus a day to see details.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpendingCalendarHeatmap;
