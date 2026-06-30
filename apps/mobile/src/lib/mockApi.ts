import {
  buildDashboardSummary,
  normalizeRecommendationId,
  strategyToRecommendationId,
} from "@points-exchange/recommendations";
import type {
  DashboardSummary,
  RecommendationDetail,
  RewardBalance,
} from "../types/models";
import type { GoalContext } from "./goalContext";
import { balancesToInput } from "./balanceInput";
import { buildRecommendationDetail } from "./recommendationDetail";
import { generateRecommendations } from "./recommendations";
import { getValuationCatalog } from "./valuationCatalog";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getDashboardSummary(input: {
  rewardBalances: RewardBalance[];
  goal: GoalContext;
}): Promise<DashboardSummary> {
  await delay(180);
  return buildDashboardSummary(
    getValuationCatalog(),
    balancesToInput(input.rewardBalances),
    input.goal,
  );
}

export async function getRecommendationDetail(input: {
  id: string;
  rewardBalances: RewardBalance[];
  goal: GoalContext;
}): Promise<RecommendationDetail | null> {
  await delay(150);

  const recs = generateRecommendations(input.rewardBalances, input.goal);
  const canonical = normalizeRecommendationId(input.id);
  const base = recs.find(
    (r) =>
      r.id === input.id ||
      (canonical !== null && r.id === strategyToRecommendationId(canonical)),
  );
  if (!base) return null;

  return buildRecommendationDetail(base, input.rewardBalances, input.goal);
}
