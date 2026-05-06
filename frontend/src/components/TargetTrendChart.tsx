import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import {
  buildTargetTrend,
  getAvailableTargetTrendYears,
  type TargetTrendTransaction,
} from "../utils/targetTrend";

type TargetOption = {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
};

type TargetTrendChartProps = {
  transactions: TargetTrendTransaction[];
  targets: TargetOption[];
};

type TrendMode = "monthly" | "cumulative";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
});

function TargetTrendChart({ transactions, targets }: TargetTrendChartProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [trendMode, setTrendMode] = useState<TrendMode>("cumulative");

  const years = useMemo(
    () => getAvailableTargetTrendYears(transactions),
    [transactions]
  );

  const trendPoints = useMemo(
    () =>
      buildTargetTrend(
        transactions,
        selectedTargetId === "ALL" ? undefined : selectedTargetId,
        selectedYear === "ALL" ? undefined : Number(selectedYear)
      ),
    [transactions, selectedTargetId, selectedYear]
  );

  const dataKey = trendMode === "monthly" ? "monthlyGains" : "cumulativeGains";
  const chartLabel =
    trendMode === "monthly" ? "Monthly gains" : "Cumulative gains";
  const selectedTarget = targets.find((target) => target.id === selectedTargetId);
  const shouldShowTargetAmount =
    selectedTargetId !== "ALL" && selectedTarget && trendPoints.length > 0;

  const chartData = {
    labels: trendPoints.map((point) => point.monthLabel),
    datasets: [
      {
        label: chartLabel,
        data: trendPoints.map((point) => point[dataKey]),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.14)",
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
      },
      ...(shouldShowTargetAmount
        ? [
            {
              label: "Target amount",
              data: trendPoints.map(() => selectedTarget.targetAmount),
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              pointBackgroundColor: "#f59e0b",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              borderDash: [6, 6],
              tension: 0,
              fill: false,
            },
          ]
        : []),
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
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
          label: (context: TooltipItem<"line">) => {
            const value =
              typeof context.raw === "number" ? context.raw : Number(context.raw);
            return `${context.dataset.label}: ${currencyFormatter.format(
              value || 0
            )}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#475569" },
      },
      y: {
        grid: { color: "#e5edf6" },
        ticks: {
          color: "#475569",
          callback: (value) => currencyFormatter.format(Number(value)),
        },
      },
    },
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
          <div>
            <h4 className="mb-1">Target Trend</h4>
            <p className="text-muted mb-0">
              Track transfers and withdrawals by month for a selected target or
              all targets.
            </p>
          </div>

          <div className="target-trend-controls">
            <div>
              <label className="form-label">Target</label>
              <select
                className="form-select"
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
              >
                <option value="ALL">All targets</option>
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name} ({target.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Year</label>
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={years.length === 0}
              >
                <option value="ALL">All time</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">View</label>
              <div className="btn-group w-100">
                <button
                  type="button"
                  className={
                    trendMode === "monthly"
                      ? "btn btn-primary"
                      : "btn btn-outline-secondary"
                  }
                  onClick={() => setTrendMode("monthly")}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={
                    trendMode === "cumulative"
                      ? "btn btn-primary"
                      : "btn btn-outline-secondary"
                  }
                  onClick={() => setTrendMode("cumulative")}
                >
                  Cumulative
                </button>
              </div>
            </div>
          </div>
        </div>

        {trendPoints.length === 0 ? (
          <div className="chart-empty-state">
            No transfers or withdrawals available for this target selection.
          </div>
        ) : (
          <div className="chart-frame-lg">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default TargetTrendChart;
