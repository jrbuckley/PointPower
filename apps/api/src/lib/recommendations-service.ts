import {
  buildDashboardSummary,
  buildRecommendationDetail,
  generateRecommendations,
} from "@points-exchange/recommendations";
import type { CustomGoalCode, GoalPreference, ValuationCatalog } from "@points-exchange/shared";
import type { GoalContext } from "@points-exchange/recommendations";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listUserRewardAccounts } from "./reward-accounts.js";
import { getUserProfile } from "./profiles.js";

export type RecommendationGoalContext = GoalContext;

function accountsToBalances(
  accounts: Awaited<ReturnType<typeof listUserRewardAccounts>>,
) {
  return accounts.map((a) => ({
    programCode: a.programCode,
    amount: a.balance,
  }));
}

export async function getRecommendationContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  balances: { programCode: string; amount: number }[];
  goal: RecommendationGoalContext;
}> {
  const [accounts, profile] = await Promise.all([
    listUserRewardAccounts(supabase, userId),
    getUserProfile(supabase, userId),
  ]);

  const goal: GoalContext = {
    goalPreference: profile.goalPreference as GoalPreference,
    customGoalCode: profile.customGoalCode as CustomGoalCode | null,
  };

  return {
    balances: accountsToBalances(accounts),
    goal,
  };
}

export function getDashboardForUser(
  catalog: ValuationCatalog,
  balances: { programCode: string; amount: number }[],
  goal: RecommendationGoalContext,
) {
  return buildDashboardSummary(catalog, balances, goal);
}

export function getRecommendationDetailForUser(
  catalog: ValuationCatalog,
  recommendationId: string,
  balances: { programCode: string; amount: number }[],
  goal: RecommendationGoalContext,
) {
  const recs = generateRecommendations(catalog, balances, goal);
  const base = recs.find((r: { id: string }) => r.id === recommendationId);
  if (!base) return null;
  return buildRecommendationDetail(catalog, base, balances, goal);
}
