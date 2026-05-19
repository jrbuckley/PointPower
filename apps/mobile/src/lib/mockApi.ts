import type {
  DashboardSummary,
  RecommendationDetail,
  RewardBalance,
} from "../types/models";
import type { GoalContext } from "./goalContext";
import { buildRecommendationDetail } from "./recommendationDetail";
import {
  generateRecommendations,
  valueRangeForBalances,
} from "./recommendations";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function dollarsFor(points: number, cpp: number): number {
  if (points <= 0) return 0;
  return roundMoney((points * cpp) / 100);
}

export async function getDashboardSummary(input: {
  rewardBalances: RewardBalance[];
  goal: GoalContext;
}): Promise<DashboardSummary> {
  await delay(180);

  const { rewardBalances, goal } = input;
  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );

  const { min: valueRangeMin, max: valueRangeMax } = valueRangeForBalances(
    rewardBalances,
    goal,
  );

  const recommendations = generateRecommendations(rewardBalances, goal);

  const cashbackD = dollarsFor(totalPoints, 1);
  const portalD = dollarsFor(totalPoints, 1.25);
  const transferD =
    recommendations.find((r) => r.id === "BEST_VALUE")?.estimatedDollarValue ??
    dollarsFor(totalPoints, 1.75);

  const comparison = [
    {
      id: "cashback" as const,
      label: "Cash back",
      estimatedDollars: cashbackD,
      subtitle: "Straightforward, predictable",
    },
    {
      id: "portal" as const,
      label: "Travel site",
      estimatedDollars: portalD,
      subtitle: "Book flights and hotels in one place",
    },
    {
      id: "transfer" as const,
      label: "Travel partners",
      estimatedDollars: transferD,
      subtitle: "Often the highest dollar value",
    },
  ];

  const best = transferD;
  const uplift =
    cashbackD > 0 ? Math.round(((best - cashbackD) / cashbackD) * 100) : 0;
  const insightMessage =
    totalPoints === 0
      ? "Add your balances to see personalized estimates."
      : goal.goalPreference === "CUSTOM"
        ? "Suggestions are tuned to your custom focus—save to refresh rankings."
        : uplift > 0
          ? `Your strongest option could be worth about ${uplift}% more than simple cash back.`
          : "Compare options below to see what fits your style.";

  return {
    totalPoints,
    valueRangeMin,
    valueRangeMax,
    recommendations,
    comparison,
    insightMessage,
  };
}

export async function getRecommendationDetail(input: {
  id: string;
  rewardBalances: RewardBalance[];
  goal: GoalContext;
}): Promise<RecommendationDetail | null> {
  await delay(150);

  const recs = generateRecommendations(input.rewardBalances, input.goal);
  const base = recs.find((r) => r.id === input.id);
  if (!base) return null;

  return buildRecommendationDetail(base, input.rewardBalances, input.goal);
}
