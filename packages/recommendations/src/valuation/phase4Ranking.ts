import type { GoalPreference, CustomGoalCode } from "@points-exchange/shared";
import type { GoalContext } from "../types.js";

/** 1=easy … 3=advanced friction; inverted for scoring as “ease” below. */
export function difficultyFrictionScore(
  difficulty: "easy" | "medium" | "advanced",
): number {
  switch (difficulty) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "advanced":
      return 3;
  }
}

/** Normalized “ease preference” contribution in [~0.33, 1]; higher means lower friction. */
export function easeContributionFromDifficulty(
  difficulty: "easy" | "medium" | "advanced",
): number {
  const friction = difficultyFrictionScore(difficulty);
  return (4 - friction) / 3;
}

/**
 * Goal-weighted mix for Phase 4 dashboard ordering.
 * Components: normalized dollar estimate vs friction (strategy difficulty).
 */
export function goalRankingWeights(ctx: GoalContext): {
  value: number;
  ease: number;
} {
  const { goalPreference, customGoalCode } = ctx;

  const valueHeavyCustom = new Set<CustomGoalCode>([
    "INTERNATIONAL_FLIGHTS",
    "LUXURY_HOTELS",
    "CRUISE_TRAVEL",
    "ALL_INCLUSIVE_RESORT",
    "LOUNGE_AND_STATUS",
  ]);

  const balancedCustom = new Set<CustomGoalCode>([
    "DOMESTIC_FLIGHTS",
    "FAMILY_VACATION",
    "BUSINESS_TRAVEL",
    "LAST_MINUTE_TRAVEL",
  ]);

  if (goalPreference === "MAX_VALUE") {
    return { value: 0.82, ease: 0.18 };
  }
  if (goalPreference === "KEEP_IT_SIMPLE") {
    return { value: 0.28, ease: 0.72 };
  }
  if (goalPreference === "CASHLIKE") {
    return { value: 0.32, ease: 0.68 };
  }
  if (goalPreference === "TRAVEL_FOCUSED") {
    return { value: 0.52, ease: 0.48 };
  }

  if (goalPreference === "CUSTOM" && customGoalCode) {
    if (valueHeavyCustom.has(customGoalCode)) {
      return { value: 0.8, ease: 0.2 };
    }
    if (balancedCustom.has(customGoalCode)) {
      return { value: 0.55, ease: 0.45 };
    }
    if (customGoalCode === "EVERYDAY_OFFSET") {
      return { value: 0.26, ease: 0.74 };
    }
  }

  return { value: 0.58, ease: 0.42 };
}
