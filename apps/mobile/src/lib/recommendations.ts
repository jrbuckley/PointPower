import type { Recommendation, RewardBalance } from "../types/models";
import { CUSTOM_GOAL_TUNING } from "./customGoalTuning";
import type { GoalContext } from "./goalContext";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** cpp = cents per point; dollars = points * cpp / 100 */
function dollarsFor(points: number, cpp: number): number {
  if (points <= 0) return 0;
  return roundMoney((points * cpp) / 100);
}

type PresetTuning = {
  transferCpp: number;
  portalCpp: number;
  cashbackCpp: number;
  order: Recommendation["id"][];
  transferDifficulty: Recommendation["difficulty"];
  copy?: Partial<
    Record<Recommendation["id"], { title?: string; description?: string }>
  >;
};

function presetTuning(goalPreference: GoalContext["goalPreference"]): PresetTuning {
  const travelBoost = goalPreference === "TRAVEL_FOCUSED" ? 1.08 : 1;
  const simplePenalty =
    goalPreference === "KEEP_IT_SIMPLE" || goalPreference === "CASHLIKE" ? 0.92 : 1;

  let transferCpp =
    goalPreference === "MAX_VALUE" ? 2 : goalPreference === "CASHLIKE" ? 1.45 : 1.75;
  transferCpp *= travelBoost * simplePenalty;

  const portalCpp = (goalPreference === "TRAVEL_FOCUSED" ? 1.35 : 1.25) * travelBoost;
  const cashbackCpp = 1;

  const transferDifficulty: Recommendation["difficulty"] =
    goalPreference === "KEEP_IT_SIMPLE" || goalPreference === "CASHLIKE"
      ? "medium"
      : "advanced";

  const order: Record<Exclude<GoalContext["goalPreference"], "CUSTOM">, Recommendation["id"][]> =
    {
      MAX_VALUE: ["BEST_VALUE", "BEST_FOR_TRAVEL", "EASIEST"],
      KEEP_IT_SIMPLE: ["EASIEST", "BEST_FOR_TRAVEL", "BEST_VALUE"],
      TRAVEL_FOCUSED: ["BEST_FOR_TRAVEL", "BEST_VALUE", "EASIEST"],
      CASHLIKE: ["EASIEST", "BEST_VALUE", "BEST_FOR_TRAVEL"],
    };

  return {
    transferCpp,
    portalCpp,
    cashbackCpp,
    order: order[goalPreference as keyof typeof order],
    transferDifficulty,
  };
}

function resolveTuning(ctx: GoalContext) {
  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    return CUSTOM_GOAL_TUNING[ctx.customGoalCode];
  }
  return presetTuning(ctx.goalPreference);
}

export function generateRecommendations(
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): Recommendation[] {
  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );

  const tuning = resolveTuning(ctx);

  const recs: Recommendation[] = [
    {
      id: "BEST_VALUE",
      label: "BEST_VALUE",
      title: tuning.copy?.BEST_VALUE?.title ?? "Highest typical dollar value",
      description:
        tuning.copy?.BEST_VALUE?.description ??
        "Using your points toward travel partners often stretches value the furthest.",
      estimatedDollarValue: dollarsFor(totalPoints, tuning.transferCpp),
      pointsUsed: totalPoints,
      cpp: Math.round(tuning.transferCpp * 100) / 100,
      difficulty: tuning.transferDifficulty,
      redemptionType: "transfer",
    },
    {
      id: "EASIEST",
      label: "EASIEST",
      title: tuning.copy?.EASIEST?.title ?? "Simple cash back or credits",
      description:
        tuning.copy?.EASIEST?.description ??
        "Turn points into dollars in your account with the least time and steps.",
      estimatedDollarValue: dollarsFor(totalPoints, tuning.cashbackCpp),
      pointsUsed: totalPoints,
      cpp: tuning.cashbackCpp,
      difficulty: "easy",
      redemptionType: "cashback",
    },
    {
      id: "BEST_FOR_TRAVEL",
      label: "BEST_FOR_TRAVEL",
      title: tuning.copy?.BEST_FOR_TRAVEL?.title ?? "Book travel in one place",
      description:
        tuning.copy?.BEST_FOR_TRAVEL?.description ??
        "Use your bank’s travel site for flights and hotels with solid value and less hassle.",
      estimatedDollarValue: dollarsFor(totalPoints, tuning.portalCpp),
      pointsUsed: totalPoints,
      cpp: Math.round(tuning.portalCpp * 100) / 100,
      difficulty: "easy",
      redemptionType: "portal",
    },
  ];

  return tuning.order.map((rid) => recs.find((r) => r.id === rid)!);
}

export function valueRangeForBalances(
  balances: RewardBalance[],
  ctx?: GoalContext,
): {
  min: number;
  max: number;
} {
  const totalPoints = balances.reduce((s, b) => s + Math.max(0, b.amount), 0);
  if (ctx) {
    const tuning = resolveTuning(ctx);
    const cppValues = [tuning.cashbackCpp, tuning.portalCpp, tuning.transferCpp];
    return {
      min: dollarsFor(totalPoints, Math.min(...cppValues)),
      max: dollarsFor(totalPoints, Math.max(...cppValues)),
    };
  }
  return {
    min: dollarsFor(totalPoints, 1),
    max: dollarsFor(totalPoints, 2),
  };
}
