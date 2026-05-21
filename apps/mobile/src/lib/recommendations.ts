import {
  generateRecommendations as engineGenerate,
  valueRangeForBalances as engineValueRange,
} from "@points-exchange/recommendations";
import type { RewardBalance } from "../types/models";
import type { GoalContext } from "./goalContext";
import { balancesToInput } from "./balanceInput";
import { getValuationCatalog } from "./valuationCatalog";

export function generateRecommendations(
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
) {
  return engineGenerate(
    getValuationCatalog(),
    balancesToInput(rewardBalances),
    ctx,
  );
}

export function valueRangeForBalances(
  balances: RewardBalance[],
  ctx?: GoalContext,
) {
  const catalog = getValuationCatalog();
  if (!ctx) {
    return engineValueRange(catalog, balancesToInput(balances), {
      goalPreference: "KEEP_IT_SIMPLE",
      customGoalCode: null,
    });
  }
  return engineValueRange(catalog, balancesToInput(balances), ctx);
}
