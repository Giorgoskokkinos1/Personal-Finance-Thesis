export type TargetTrendTransaction = {
  id: string;
  type: "transfer" | "withdraw";
  amount: number;
  category: string;
  date: string;
  targetId?: string;
};

export type TargetTrendPoint = {
  monthKey: string;
  monthLabel: string;
  year: number;
  monthlyGains: number;
  cumulativeGains: number;
};

const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
});

export function getAvailableTargetTrendYears(
  transactions: TargetTrendTransaction[]
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

export function buildTargetTrend(
  transactions: TargetTrendTransaction[],
  targetId?: string,
  year?: number
): TargetTrendPoint[] {
  const monthlyTotals = new Map<string, Omit<TargetTrendPoint, "cumulativeGains">>();

  transactions.forEach((transaction) => {
    if (targetId && transaction.targetId !== targetId) return;

    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return;

    const transactionYear = date.getFullYear();
    if (year && transactionYear !== year) return;

    const monthKey = `${transactionYear}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const current =
      monthlyTotals.get(monthKey) ||
      ({
        monthKey,
        monthLabel: monthFormatter.format(date),
        year: transactionYear,
        monthlyGains: 0,
      } satisfies Omit<TargetTrendPoint, "cumulativeGains">);

    current.monthlyGains +=
      transaction.type === "transfer" ? transaction.amount : -transaction.amount;

    monthlyTotals.set(monthKey, current);
  });

  let cumulativeGains = 0;

  return Array.from(monthlyTotals.values())
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((point) => {
      cumulativeGains += point.monthlyGains;

      return {
        ...point,
        cumulativeGains,
      };
    });
}
