export type SpendingHeatmapTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
};

export type SpendingHeatmapScope = {
  mode: "month" | "year";
  year: number;
  month: number;
  category?: string;
};

export type SpendingHeatmapDay = {
  dateKey: string;
  dateLabel: string;
  dayOfMonth: number;
  monthIndex: number;
  weekday: number;
  totalSpent: number;
  transactionCount: number;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getAvailableHeatmapYears(
  transactions: SpendingHeatmapTransaction[]
): number[] {
  return Array.from(
    new Set(
      transactions
        .map((transaction) => {
          const date = new Date(transaction.date);
          return Number.isNaN(date.getTime()) ? null : date.getFullYear();
        })
        .filter((year): year is number => year !== null)
    )
  ).sort((a, b) => b - a);
}

export function getHeatmapCategories(
  transactions: SpendingHeatmapTransaction[]
): string[] {
  return Array.from(
    new Set(
      transactions
        .filter((transaction) => transaction.type === "expense")
        .map((transaction) => transaction.category.trim() || "Uncategorized")
    )
  ).sort((a, b) => a.localeCompare(b));
}

// Builds every day in the selected range so zero-spending days still appear.
export function buildSpendingHeatmap(
  transactions: SpendingHeatmapTransaction[],
  scope: SpendingHeatmapScope
): SpendingHeatmapDay[] {
  const dailyTotals = new Map<
    string,
    { totalSpent: number; transactionCount: number }
  >();

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    if (scope.category && transaction.category !== scope.category) return;

    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return;
    if (date.getFullYear() !== scope.year) return;
    if (scope.mode === "month" && date.getMonth() !== scope.month) return;

    const dateKey = getDateKey(date);
    const current = dailyTotals.get(dateKey) || {
      totalSpent: 0,
      transactionCount: 0,
    };

    dailyTotals.set(dateKey, {
      totalSpent: current.totalSpent + transaction.amount,
      transactionCount: current.transactionCount + 1,
    });
  });

  const months =
    scope.mode === "month"
      ? [scope.month]
      : Array.from({ length: 12 }, (_, index) => index);

  return months.flatMap((month) =>
    Array.from({ length: getDaysInMonth(scope.year, month) }, (_, index) => {
      const date = new Date(scope.year, month, index + 1);
      const dateKey = getDateKey(date);
      const totals = dailyTotals.get(dateKey) || {
        totalSpent: 0,
        transactionCount: 0,
      };

      return {
        dateKey,
        dateLabel: dateFormatter.format(date),
        dayOfMonth: date.getDate(),
        monthIndex: month,
        weekday: date.getDay(),
        totalSpent: totals.totalSpent,
        transactionCount: totals.transactionCount,
      };
    })
  );
}
