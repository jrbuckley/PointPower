import type { CustomGoalCode } from "@points-exchange/shared";
import type { GoalContext } from "./types.js";
import type { CanonicalStrategyId } from "./strategies.js";

export type RecommendationTuning = {
  transferCpp: number;
  portalCpp: number;
  cashbackCpp: number;
  strategyOrder: CanonicalStrategyId[];
  transferDifficulty: "easy" | "medium" | "advanced";
  copy?: Partial<
    Record<CanonicalStrategyId, { title?: string; description?: string }>
  >;
};

export const CUSTOM_GOAL_TUNING: Record<CustomGoalCode, RecommendationTuning> = {
  INTERNATIONAL_FLIGHTS: {
    transferCpp: 2.1,
    portalCpp: 1.3,
    cashbackCpp: 1,
    strategyOrder: ["MOST_EFFECTIVE", "LIMITED_TIME", "LEAST_HASSLE"],
    transferDifficulty: "advanced",
    copy: {
      MOST_EFFECTIVE: {
        title: "Partner miles for long-haul flights",
        description:
          "International premium cabins often price best through airline and alliance transfers.",
      },
    },
  },
  LUXURY_HOTELS: {
    transferCpp: 2.05,
    portalCpp: 1.45,
    cashbackCpp: 1,
    strategyOrder: ["MOST_EFFECTIVE", "TRAVEL_PORTAL", "LIMITED_TIME"],
    transferDifficulty: "advanced",
    copy: {
      TRAVEL_PORTAL: {
        title: "Premium hotel portals",
        description:
          "Book high-end properties through your bank’s travel site when award space is tight.",
      },
    },
  },
  DOMESTIC_FLIGHTS: {
    transferCpp: 1.85,
    portalCpp: 1.35,
    cashbackCpp: 1,
    strategyOrder: ["TRAVEL_PORTAL", "LEAST_HASSLE", "LIMITED_TIME"],
    transferDifficulty: "medium",
  },
  FAMILY_VACATION: {
    transferCpp: 1.75,
    portalCpp: 1.4,
    cashbackCpp: 1,
    strategyOrder: ["TRAVEL_PORTAL", "LEAST_HASSLE", "MOST_EFFECTIVE"],
    transferDifficulty: "medium",
    copy: {
      TRAVEL_PORTAL: {
        title: "One-stop family booking",
        description:
          "Portals simplify multi-room hotels and flights without juggling several programs.",
      },
    },
  },
  BUSINESS_TRAVEL: {
    transferCpp: 1.9,
    portalCpp: 1.4,
    cashbackCpp: 1,
    strategyOrder: ["TRAVEL_PORTAL", "LIMITED_TIME", "LEAST_HASSLE"],
    transferDifficulty: "medium",
  },
  ALL_INCLUSIVE_RESORT: {
    transferCpp: 1.8,
    portalCpp: 1.42,
    cashbackCpp: 1,
    strategyOrder: ["TRAVEL_PORTAL", "MOST_EFFECTIVE", "LIMITED_TIME"],
    transferDifficulty: "medium",
  },
  CRUISE_TRAVEL: {
    transferCpp: 1.85,
    portalCpp: 1.38,
    cashbackCpp: 1,
    strategyOrder: ["MOST_EFFECTIVE", "TRAVEL_PORTAL", "LIMITED_TIME"],
    transferDifficulty: "advanced",
  },
  LAST_MINUTE_TRAVEL: {
    transferCpp: 1.65,
    portalCpp: 1.48,
    cashbackCpp: 1,
    strategyOrder: ["TRAVEL_PORTAL", "LIMITED_TIME", "LEAST_HASSLE"],
    transferDifficulty: "easy",
    copy: {
      TRAVEL_PORTAL: {
        title: "Fast portal bookings",
        description:
          "When timing matters, bank travel sites usually beat hunting for award space.",
      },
    },
  },
  LOUNGE_AND_STATUS: {
    transferCpp: 1.95,
    portalCpp: 1.25,
    cashbackCpp: 1,
    strategyOrder: ["MOST_EFFECTIVE", "SIMPLE_CASH", "LEAST_HASSLE"],
    transferDifficulty: "advanced",
  },
  EVERYDAY_OFFSET: {
    transferCpp: 1.45,
    portalCpp: 1.2,
    cashbackCpp: 1,
    strategyOrder: ["SIMPLE_CASH", "LEAST_HASSLE"],
    transferDifficulty: "easy",
    copy: {
      SIMPLE_CASH: {
        title: "Statement credits and cash back",
        description:
          "Apply points toward everyday bills and purchases with minimal effort.",
      },
    },
  },
};

function presetTuning(
  goalPreference: GoalContext["goalPreference"],
): RecommendationTuning {
  const travelBoost = goalPreference === "TRAVEL_FOCUSED" ? 1.08 : 1;
  const simplePenalty =
    goalPreference === "KEEP_IT_SIMPLE" || goalPreference === "CASHLIKE"
      ? 0.92
      : 1;

  let transferCpp =
    goalPreference === "MAX_VALUE"
      ? 2
      : goalPreference === "CASHLIKE"
        ? 1.45
        : 1.75;
  transferCpp *= travelBoost * simplePenalty;

  const portalCpp =
    (goalPreference === "TRAVEL_FOCUSED" ? 1.35 : 1.25) * travelBoost;
  const cashbackCpp = 1;

  const transferDifficulty: RecommendationTuning["transferDifficulty"] =
    goalPreference === "KEEP_IT_SIMPLE" || goalPreference === "CASHLIKE"
      ? "medium"
      : "advanced";

  const strategyOrder: Record<
    Exclude<GoalContext["goalPreference"], "CUSTOM">,
    CanonicalStrategyId[]
  > = {
    MAX_VALUE: ["MOST_EFFECTIVE", "LIMITED_TIME", "LEAST_HASSLE"],
    KEEP_IT_SIMPLE: ["LEAST_HASSLE", "SIMPLE_CASH"],
    TRAVEL_FOCUSED: ["MOST_EFFECTIVE", "TRAVEL_PORTAL", "LIMITED_TIME"],
    CASHLIKE: ["SIMPLE_CASH", "LEAST_HASSLE"],
  };

  return {
    transferCpp,
    portalCpp,
    cashbackCpp,
    strategyOrder: strategyOrder[goalPreference as keyof typeof strategyOrder],
    transferDifficulty,
  };
}

export function resolveTuning(ctx: GoalContext): RecommendationTuning {
  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    return CUSTOM_GOAL_TUNING[ctx.customGoalCode];
  }
  return presetTuning(ctx.goalPreference);
}
