import type { CustomGoalCode } from "@points-exchange/shared";
import type { Recommendation } from "../types/models";

export type RecommendationTuning = {
  transferCpp: number;
  portalCpp: number;
  cashbackCpp: number;
  order: Recommendation["id"][];
  transferDifficulty: Recommendation["difficulty"];
  /** Optional copy overrides keyed by recommendation id. */
  copy?: Partial<
    Record<Recommendation["id"], { title?: string; description?: string }>
  >;
};

/**
 * Per-use-case tuning when goalPreference is CUSTOM.
 * Future TRAVEL_FOCUSED "trip experience" planner will live separately.
 */
export const CUSTOM_GOAL_TUNING: Record<CustomGoalCode, RecommendationTuning> = {
  INTERNATIONAL_FLIGHTS: {
    transferCpp: 2.1,
    portalCpp: 1.3,
    cashbackCpp: 1,
    order: ["BEST_VALUE", "BEST_FOR_TRAVEL", "EASIEST"],
    transferDifficulty: "advanced",
    copy: {
      BEST_VALUE: {
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
    order: ["BEST_VALUE", "BEST_FOR_TRAVEL", "EASIEST"],
    transferDifficulty: "advanced",
    copy: {
      BEST_FOR_TRAVEL: {
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
    order: ["BEST_FOR_TRAVEL", "BEST_VALUE", "EASIEST"],
    transferDifficulty: "medium",
  },
  FAMILY_VACATION: {
    transferCpp: 1.75,
    portalCpp: 1.4,
    cashbackCpp: 1,
    order: ["BEST_FOR_TRAVEL", "EASIEST", "BEST_VALUE"],
    transferDifficulty: "medium",
    copy: {
      BEST_FOR_TRAVEL: {
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
    order: ["BEST_FOR_TRAVEL", "BEST_VALUE", "EASIEST"],
    transferDifficulty: "medium",
  },
  ALL_INCLUSIVE_RESORT: {
    transferCpp: 1.8,
    portalCpp: 1.42,
    cashbackCpp: 1,
    order: ["BEST_FOR_TRAVEL", "BEST_VALUE", "EASIEST"],
    transferDifficulty: "medium",
  },
  CRUISE_TRAVEL: {
    transferCpp: 1.85,
    portalCpp: 1.38,
    cashbackCpp: 1,
    order: ["BEST_VALUE", "BEST_FOR_TRAVEL", "EASIEST"],
    transferDifficulty: "advanced",
  },
  LAST_MINUTE_TRAVEL: {
    transferCpp: 1.65,
    portalCpp: 1.48,
    cashbackCpp: 1,
    order: ["BEST_FOR_TRAVEL", "EASIEST", "BEST_VALUE"],
    transferDifficulty: "easy",
    copy: {
      BEST_FOR_TRAVEL: {
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
    order: ["BEST_VALUE", "EASIEST", "BEST_FOR_TRAVEL"],
    transferDifficulty: "advanced",
  },
  EVERYDAY_OFFSET: {
    transferCpp: 1.45,
    portalCpp: 1.2,
    cashbackCpp: 1,
    order: ["EASIEST", "BEST_VALUE", "BEST_FOR_TRAVEL"],
    transferDifficulty: "easy",
    copy: {
      EASIEST: {
        title: "Statement credits & cash back",
        description:
          "Apply points toward everyday bills and purchases with minimal effort.",
      },
    },
  },
};
