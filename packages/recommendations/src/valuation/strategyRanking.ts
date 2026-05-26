import type { GoalContext, Recommendation } from "../types.js";
import {
  DASHBOARD_PRIMARY_LIMIT,
  resolveStrategyOrder,
  type CanonicalStrategyId,
} from "../strategies.js";
import {
  easeContributionFromDifficulty,
  goalRankingWeights,
} from "./phase4Ranking.js";

export type RankedStrategy = {
  strategyId: CanonicalStrategyId;
  recommendation: Recommendation;
  score: number;
  valueNorm: number;
  easeNorm: number;
};

function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const max = Math.max(...values);
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => v / max);
}

/**
 * Rank goal-relevant strategies by weighted score (value + ease), with editorial order as tie-breaker.
 */
export function rankStrategiesForGoal(
  recommendations: Recommendation[],
  ctx: GoalContext,
): RankedStrategy[] {
  const editorialOrder = resolveStrategyOrder(ctx);
  const editorialRank = new Map(
    editorialOrder.map((id, index) => [id, index]),
  );

  const weights = goalRankingWeights(ctx);
  const values = recommendations.map((r) => r.estimatedDollarValue);
  const valueNorms = normalize(values);

  const ranked: RankedStrategy[] = recommendations.map((rec, i) => {
    const canonical = rec.id as CanonicalStrategyId;
    const easeNorm = easeContributionFromDifficulty(rec.difficulty);
    const valueNorm = valueNorms[i] ?? 0;
    const score = weights.value * valueNorm + weights.ease * easeNorm;
    return {
      strategyId: canonical,
      recommendation: rec,
      score,
      valueNorm,
      easeNorm,
    };
  });

  ranked.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.0001) return scoreDiff;
    const aRank = editorialRank.get(a.strategyId) ?? 999;
    const bRank = editorialRank.get(b.strategyId) ?? 999;
    return aRank - bRank;
  });

  return ranked;
}

export function dashboardStrategyIdsRanked(
  ranked: RankedStrategy[],
): { primary: CanonicalStrategyId[]; more: CanonicalStrategyId[] } {
  const ids = ranked.map((r) => r.strategyId);
  return {
    primary: ids.slice(0, DASHBOARD_PRIMARY_LIMIT),
    more: ids.slice(DASHBOARD_PRIMARY_LIMIT),
  };
}
