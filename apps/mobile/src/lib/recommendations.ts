import type {
  GoalPreference,
  Recommendation,
  RewardBalance,
} from "../types/models";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** cpp = cents per point; dollars = points * cpp / 100 */
function dollarsFor(points: number, cpp: number): number {
  if (points <= 0) return 0;
  return roundMoney((points * cpp) / 100);
}

export function generateRecommendations(
  rewardBalances: RewardBalance[],
  goalPreference: GoalPreference,
): Recommendation[] {
  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );

  const travelBoost = goalPreference === "TRAVEL_FOCUSED" ? 1.08 : 1;
  const simplePenalty =
    goalPreference === "KEEP_IT_SIMPLE" || goalPreference === "CASHLIKE"
      ? 0.92
      : 1;

  let transferCpp =
    goalPreference === "MAX_VALUE" ? 2 : goalPreference === "CASHLIKE" ? 1.45 : 1.75;
  transferCpp *= travelBoost * simplePenalty;

  const portalCpp = (goalPreference === "TRAVEL_FOCUSED" ? 1.35 : 1.25) * travelBoost;
  const cashbackCpp = 1;

  const transferDifficulty: Recommendation["difficulty"] =
    goalPreference === "KEEP_IT_SIMPLE" || goalPreference === "CASHLIKE"
      ? "medium"
      : "advanced";

  const recs: Recommendation[] = [
    {
      id: "BEST_VALUE",
      label: "BEST_VALUE",
      title: "Highest typical dollar value",
      description:
        "Using your points toward travel partners often stretches value the furthest.",
      estimatedDollarValue: dollarsFor(totalPoints, transferCpp),
      pointsUsed: totalPoints,
      cpp: Math.round(transferCpp * 100) / 100,
      difficulty: transferDifficulty,
      redemptionType: "transfer",
    },
    {
      id: "EASIEST",
      label: "EASIEST",
      title: "Simple cash back or credits",
      description:
        "Turn points into dollars in your account with the least time and steps.",
      estimatedDollarValue: dollarsFor(totalPoints, cashbackCpp),
      pointsUsed: totalPoints,
      cpp: cashbackCpp,
      difficulty: "easy",
      redemptionType: "cashback",
    },
    {
      id: "BEST_FOR_TRAVEL",
      label: "BEST_FOR_TRAVEL",
      title: "Book travel in one place",
      description:
        "Use your bank’s travel site for flights and hotels with solid value and less hassle.",
      estimatedDollarValue: dollarsFor(totalPoints, portalCpp),
      pointsUsed: totalPoints,
      cpp: Math.round(portalCpp * 100) / 100,
      difficulty: "easy",
      redemptionType: "portal",
    },
  ];

  const order: Record<GoalPreference, string[]> = {
    MAX_VALUE: ["BEST_VALUE", "BEST_FOR_TRAVEL", "EASIEST"],
    KEEP_IT_SIMPLE: ["EASIEST", "BEST_FOR_TRAVEL", "BEST_VALUE"],
    TRAVEL_FOCUSED: ["BEST_FOR_TRAVEL", "BEST_VALUE", "EASIEST"],
    CASHLIKE: ["EASIEST", "BEST_VALUE", "BEST_FOR_TRAVEL"],
  };

  return order[goalPreference].map((rid) => recs.find((r) => r.id === rid)!);
}

export function valueRangeForBalances(balances: RewardBalance[]): {
  min: number;
  max: number;
} {
  const totalPoints = balances.reduce((s, b) => s + Math.max(0, b.amount), 0);
  return {
    min: dollarsFor(totalPoints, 1),
    max: dollarsFor(totalPoints, 2),
  };
}
