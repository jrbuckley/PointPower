import type {
  GoalPreference,
  RecommendationId,
  RedemptionMethodCode,
} from "@points-exchange/shared";
import type { GoalContext, RewardBalanceInput } from "./types.js";

export type CanonicalStrategyId =
  | "MOST_EFFECTIVE"
  | "LEAST_HASSLE"
  | "LIMITED_TIME"
  | "TRAVEL_PORTAL"
  | "SIMPLE_CASH";

export type OfferFilter = "default" | "primary_program_only" | "limited_time";

export type ValueMode =
  | "transfer_all"
  | "portal_all"
  | "cashback_all"
  | "transfer_primary"
  | "portal_primary"
  | "cashback_primary"
  | "limited_offers_sum";

export type StrategyDefinition = {
  id: CanonicalStrategyId;
  tagline: string;
  title: string;
  description: string;
  redemptionType: "cashback" | "portal" | "transfer";
  difficulty: "easy" | "medium" | "advanced";
  /** Which redemption methods to pull offers from (transfer, portal, cashback). */
  offerMethods: RedemptionMethodCode[];
  offerFilter: OfferFilter;
  valueMode: ValueMode;
};

const LEGACY_ID_MAP: Record<string, CanonicalStrategyId> = {
  BEST_VALUE: "MOST_EFFECTIVE",
  BEST_FOR_TRAVEL: "TRAVEL_PORTAL",
  EASIEST: "SIMPLE_CASH",
};

export function normalizeRecommendationId(
  id: string,
): CanonicalStrategyId | null {
  if (id in LEGACY_ID_MAP) {
    return LEGACY_ID_MAP[id]!;
  }
  const canonical = id as CanonicalStrategyId;
  if (
    canonical === "MOST_EFFECTIVE" ||
    canonical === "LEAST_HASSLE" ||
    canonical === "LIMITED_TIME" ||
    canonical === "TRAVEL_PORTAL" ||
    canonical === "SIMPLE_CASH"
  ) {
    return canonical;
  }
  return null;
}

const STRATEGY_DEFS: Record<CanonicalStrategyId, StrategyDefinition> = {
  MOST_EFFECTIVE: {
    id: "MOST_EFFECTIVE",
    tagline: "Most effective",
    title: "Combine programs for top value",
    description:
      "Use partner transfers and high-value offers across each rewards program you hold. Best when you are willing to coordinate redemptions per issuer.",
    redemptionType: "transfer",
    difficulty: "advanced",
    offerMethods: ["transfer"],
    offerFilter: "default",
    valueMode: "transfer_all",
  },
  LEAST_HASSLE: {
    id: "LEAST_HASSLE",
    tagline: "Least hassle",
    title: "One program, straightforward steps",
    description:
      "Focus on your largest balance in a single program. Fewer moving parts than juggling multiple issuers.",
    redemptionType: "cashback",
    difficulty: "easy",
    offerMethods: ["cashback", "portal"],
    offerFilter: "primary_program_only",
    valueMode: "cashback_primary",
  },
  LIMITED_TIME: {
    id: "LIMITED_TIME",
    tagline: "Limited time",
    title: "Act on expiring opportunities",
    description:
      "Promos and short booking windows that may beat everyday redemption rates. Verify pricing before you transfer points.",
    redemptionType: "transfer",
    difficulty: "medium",
    offerMethods: ["transfer", "portal", "cashback"],
    offerFilter: "limited_time",
    valueMode: "limited_offers_sum",
  },
  TRAVEL_PORTAL: {
    id: "TRAVEL_PORTAL",
    tagline: "Book in one place",
    title: "Bank travel portals",
    description:
      "Search flights and hotels inside your issuer’s travel site and pay with points at checkout.",
    redemptionType: "portal",
    difficulty: "easy",
    offerMethods: ["portal"],
    offerFilter: "default",
    valueMode: "portal_all",
  },
  SIMPLE_CASH: {
    id: "SIMPLE_CASH",
    tagline: "Cash and credits",
    title: "Statement credits and cash back",
    description:
      "Redeem points for statement credits or cash in each issuer’s app. Predictable value with minimal planning.",
    redemptionType: "cashback",
    difficulty: "easy",
    offerMethods: ["cashback"],
    offerFilter: "default",
    valueMode: "cashback_all",
  },
};

const PRESET_STRATEGY_ORDER: Record<
  Exclude<GoalPreference, "CUSTOM">,
  CanonicalStrategyId[]
> = {
  MAX_VALUE: ["MOST_EFFECTIVE", "LIMITED_TIME", "LEAST_HASSLE"],
  KEEP_IT_SIMPLE: ["LEAST_HASSLE", "SIMPLE_CASH"],
  TRAVEL_FOCUSED: ["MOST_EFFECTIVE", "TRAVEL_PORTAL", "LIMITED_TIME"],
  CASHLIKE: ["SIMPLE_CASH", "LEAST_HASSLE"],
};

const CUSTOM_STRATEGY_ORDER: Record<string, CanonicalStrategyId[]> = {
  INTERNATIONAL_FLIGHTS: ["MOST_EFFECTIVE", "LIMITED_TIME", "LEAST_HASSLE"],
  LUXURY_HOTELS: ["MOST_EFFECTIVE", "TRAVEL_PORTAL", "LIMITED_TIME"],
  DOMESTIC_FLIGHTS: ["TRAVEL_PORTAL", "LEAST_HASSLE", "LIMITED_TIME"],
  FAMILY_VACATION: ["TRAVEL_PORTAL", "LEAST_HASSLE", "MOST_EFFECTIVE"],
  BUSINESS_TRAVEL: ["TRAVEL_PORTAL", "LIMITED_TIME", "LEAST_HASSLE"],
  ALL_INCLUSIVE_RESORT: ["TRAVEL_PORTAL", "MOST_EFFECTIVE", "LIMITED_TIME"],
  CRUISE_TRAVEL: ["MOST_EFFECTIVE", "TRAVEL_PORTAL", "LIMITED_TIME"],
  LAST_MINUTE_TRAVEL: ["TRAVEL_PORTAL", "LIMITED_TIME", "LEAST_HASSLE"],
  LOUNGE_AND_STATUS: ["MOST_EFFECTIVE", "SIMPLE_CASH", "LEAST_HASSLE"],
  EVERYDAY_OFFSET: ["SIMPLE_CASH", "LEAST_HASSLE"],
};

/** Methods shown in the “Compare all paths” section for the active goal. */
export function comparisonMethodsForGoal(
  ctx: GoalContext,
): Array<"cashback" | "portal" | "transfer"> {
  if (ctx.goalPreference === "CASHLIKE") {
    return ["cashback"];
  }
  if (ctx.goalPreference === "KEEP_IT_SIMPLE") {
    return ["cashback", "portal"];
  }
  if (ctx.goalPreference === "TRAVEL_FOCUSED") {
    return ["portal", "transfer"];
  }
  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    const order = CUSTOM_STRATEGY_ORDER[ctx.customGoalCode];
    const methods = new Set<"cashback" | "portal" | "transfer">();
    for (const sid of order ?? PRESET_STRATEGY_ORDER.MAX_VALUE) {
      methods.add(STRATEGY_DEFS[sid].redemptionType);
    }
    return [...methods];
  }
  return ["transfer", "portal", "cashback"];
}

export function resolveStrategyOrder(ctx: GoalContext): CanonicalStrategyId[] {
  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    return (
      CUSTOM_STRATEGY_ORDER[ctx.customGoalCode] ??
      PRESET_STRATEGY_ORDER.MAX_VALUE
    );
  }
  return PRESET_STRATEGY_ORDER[ctx.goalPreference as Exclude<
    GoalPreference,
    "CUSTOM"
  >];
}

/** Max cards shown before “See more”. Goals with fewer strategies show all of them. */
export const DASHBOARD_PRIMARY_LIMIT = 3;

export function dashboardStrategyIds(ctx: GoalContext): {
  primary: CanonicalStrategyId[];
  more: CanonicalStrategyId[];
} {
  const order = resolveStrategyOrder(ctx);
  return {
    primary: order.slice(0, DASHBOARD_PRIMARY_LIMIT),
    more: order.slice(DASHBOARD_PRIMARY_LIMIT),
  };
}

export function getStrategyDefinition(
  id: CanonicalStrategyId,
): StrategyDefinition {
  return STRATEGY_DEFS[id];
}

export function applyStrategyTuning(
  def: StrategyDefinition,
  ctx: GoalContext,
  programCount: number,
  copy?: Partial<Record<CanonicalStrategyId, { title?: string; description?: string }>>,
): StrategyDefinition {
  const tuned = { ...def };
  const override = copy?.[def.id];
  if (override?.title) tuned.title = override.title;
  if (override?.description) tuned.description = override.description;

  if (ctx.goalPreference === "CASHLIKE" || ctx.goalPreference === "KEEP_IT_SIMPLE") {
    if (def.id === "LEAST_HASSLE") {
      tuned.redemptionType = "cashback";
      tuned.offerMethods = ["cashback"];
      tuned.valueMode = "cashback_primary";
      tuned.difficulty = "easy";
    }
  }

  if (ctx.goalPreference === "TRAVEL_FOCUSED" && def.id === "LEAST_HASSLE") {
    tuned.redemptionType = "portal";
    tuned.offerMethods = ["portal"];
    tuned.valueMode = "portal_primary";
    tuned.difficulty = "easy";
  }

  if (
    (ctx.goalPreference === "MAX_VALUE" ||
      (ctx.goalPreference === "CUSTOM" &&
        ctx.customGoalCode &&
        ["INTERNATIONAL_FLIGHTS", "LUXURY_HOTELS", "CRUISE_TRAVEL"].includes(
          ctx.customGoalCode,
        ))) &&
    def.id === "LEAST_HASSLE"
  ) {
    tuned.redemptionType = "transfer";
    tuned.offerMethods = ["transfer"];
    tuned.valueMode = "transfer_primary";
    tuned.difficulty = "medium";
    tuned.description =
      programCount > 1
        ? "Start with your largest program and one partner transfer before expanding to other issuers."
        : "One partner transfer from your main balance when you want fewer steps than a multi-program plan.";
  }

  if (def.id === "LIMITED_TIME" && ctx.goalPreference === "CASHLIKE") {
    tuned.offerMethods = ["cashback"];
    tuned.redemptionType = "cashback";
    tuned.valueMode = "limited_offers_sum";
  }

  const multiSuffix =
    programCount > 1
      ? " Offers are listed separately for each program."
      : "";

  if (def.id === "MOST_EFFECTIVE" && !override?.description) {
    tuned.description =
      (programCount > 1
        ? "Layer high-value partner offers across Chase, Amex, and other programs you use."
        : "Partner transfers often stretch value the furthest for your balance.") +
      multiSuffix;
  }

  return tuned;
}

export function strategyToRecommendationId(
  id: CanonicalStrategyId,
): RecommendationId {
  return id as RecommendationId;
}

export function isLimitedTimeTemplate(
  template: { expiresInDays: number; highlightLabel: string | null },
): boolean {
  return (
    template.expiresInDays <= 21 ||
    template.highlightLabel === "Limited-time"
  );
}

export function activeProgramCount(balances: RewardBalanceInput[]): number {
  return balances.filter((b) => b.amount > 0).length;
}
