import {
  buildRecommendationDetail as engineBuildDetail,
  formatOfferExpiry,
  getOfferPrimaryAction as engineGetOfferPrimaryAction,
  listOffersForRecommendation as engineListOffers,
  resolveSavedOffers as engineResolveSavedOffers,
  summarizeBalances,
} from "@points-exchange/recommendations";
import type {
  GoalFitSummary,
  Recommendation,
  RecommendationAction,
  RecommendationDetail,
  RedemptionOffer,
  RewardBalance,
} from "../types/models";
import type { GoalContext } from "./goalContext";
import { balancesToInput } from "./balanceInput";
import { getValuationCatalog } from "./valuationCatalog";

export { formatOfferExpiry };

export type SavedOfferEntry = {
  id: string;
  offerKey: string;
  recommendationId: string;
  savedAt: string;
  status: "active" | "expired" | "unavailable";
  recommendationTitle: string;
  offer: RedemptionOffer | null;
};

export function getOfferPrimaryAction(
  detail: RecommendationDetail,
  offer: RedemptionOffer,
  rewardBalances: RewardBalance[],
): RecommendationAction {
  const balances = balancesToInput(rewardBalances);
  const { programCount, primary } = summarizeBalances(balances);
  const amount =
    balances.find((b) => b.programCode === offer.programCode)?.amount ??
    primary.amount;

  return engineGetOfferPrimaryAction(
    detail,
    {
      programCode: offer.programCode,
      label: offer.programLabel,
      amount,
    },
    programCount,
  );
}

export function listOffersForRecommendation(
  recommendationId: string,
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): RedemptionOffer[] {
  return engineListOffers(
    getValuationCatalog(),
    recommendationId,
    balancesToInput(rewardBalances),
    ctx,
  );
}

export function resolveSavedOffers(
  refs: { id: string; offerKey: string; recommendationId: string; savedAt: string }[],
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): SavedOfferEntry[] {
  return engineResolveSavedOffers(
    getValuationCatalog(),
    refs,
    balancesToInput(rewardBalances),
    ctx,
  );
}

export function buildRecommendationDetail(
  rec: Recommendation,
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): RecommendationDetail | null {
  return engineBuildDetail(
    getValuationCatalog(),
    rec,
    balancesToInput(rewardBalances),
    ctx,
  );
}

export type { GoalFitSummary };
