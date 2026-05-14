import React, { useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import {
  buildCategorySpending,
  type CategorySpendingTransaction,
} from "../utils/categorySpending";

type CategorySpendingRangeChartProps = {
  transactions: CategorySpendingTransaction[];
  currency?: string;
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

function shortenCategoryLabel(label: string): string {
  return label.length > 24 ? `${label.slice(0, 21)}...` : label;
}

function CategorySpendingRangeChart({
  transactions,
  currency = "EUR",
}: CategorySpendingRangeChartProps) {
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }),
    [currency]
  );

  const spendingByCategory = useMemo(
    () => buildCategorySpending(transactions, dateRange),
    [transactions, dateRange]
  );

  const chartData = {
    labels: spendingByCategory.map((item) =>
      shortenCategoryLabel(item.category)
    ),
    datasets: [
      {
        label: "Total spent",
        data: spendingByCategory.map((item) => item.totalAmount),
        backgroundColor: "#e11d48",
        hoverBackgroundColor: "#be123c",
        borderRadius: 6,
        borderWidth: 0,
        barThickness: 24,
      },
    ],
  };

  const chartHeight = Math.max(300, spendingByCategory.length * 52);

  const chartOptions: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#475569",
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<"bar">[]) => {
            const index = items[0]?.dataIndex;
            return index === undefined
              ? ""
              : spendingByCategory[index]?.category || "";
          },
          label: (context: TooltipItem<"bar">) => {
            const index = context.dataIndex;
            const item = spendingByCategory[index];
            if (!item) return "";

            return [
              `Amount: ${currencyFormatter.format(item.totalAmount)}`,
              `Share: ${percentFormatter.format(item.percentageOfTotal)}%`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: "#e5edf6" },
        ticks: {
          color: "#475569",
          callback: (value) => currencyFormatter.format(Number(value)),
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "#475569",
          autoSkip: false,
        },
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
          <div>
            <h4 className="mb-1">Spending by Category</h4>
            <p className="text-muted mb-0">
              Compare expense categories over a selected date range.
            </p>
          </div>

          <div className="category-date-range-controls">
            <div>
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setDateRange({ from: "", to: "" })}
            >
              Reset
            </button>
          </div>
        </div>

        {spendingByCategory.length === 0 ? (
          <div className="chart-empty-state">
            No expense transactions available for this date range.
          </div>
        ) : (
          <div style={{ height: `${chartHeight}px` }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default CategorySpendingRangeChart;
