import type {
  CustomGoalCode,
  GoalPreference,
  RedemptionMethodCode,
  ValuationCatalog,
} from "@points-exchange/shared";
import { resolveTuning } from "./customGoalTuning.js";
import type {
  DashboardSummary,
  GoalContext,
  GoalCoverageStatus,
  GoalFitSummary,
  ProgramInfo,
  Recommendation,
  RecommendationAction,
  RecommendationDetail,
  RecommendationStep,
  RedemptionOffer,
  RewardBalanceInput,
  SavedOfferEntry,
  ValueComparisonRow,
} from "./types.js";

const PROGRAM_LABELS: Record<string, string> = {
  amex_mr: "Amex Membership Rewards",
  chase_ur: "Chase Ultimate Rewards",
  capital_one_miles: "Capital One Miles",
  citi_ty: "Citi ThankYou Points",
  cashback: "Cash back / statement credit",
};

const GOAL_PRESET_LABELS: Record<Exclude<GoalPreference, "CUSTOM">, string> = {
  MAX_VALUE: "maximum redemption value",
  KEEP_IT_SIMPLE: "a simple, low-effort redemption",
  TRAVEL_FOCUSED: "a solid travel booking",
  CASHLIKE: "cash-like value in your pocket",
};

const CUSTOM_GOAL_LABELS: Record<CustomGoalCode, string> = {
  INTERNATIONAL_FLIGHTS: "International premium flights",
  LUXURY_HOTELS: "Luxury hotel stays",
  DOMESTIC_FLIGHTS: "Domestic flights",
  FAMILY_VACATION: "Family vacation",
  BUSINESS_TRAVEL: "Business travel",
  ALL_INCLUSIVE_RESORT: "All-inclusive resort",
  CRUISE_TRAVEL: "Cruise travel",
  LAST_MINUTE_TRAVEL: "Last-minute travel",
  LOUNGE_AND_STATUS: "Lounge access & status",
  EVERYDAY_OFFSET: "Everyday spending offset",
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function dollarsFor(points: number, cpp: number): number {
  if (points <= 0) return 0;
  return roundMoney((points * cpp) / 100);
}

function activeBalances(balances: RewardBalanceInput[]): RewardBalanceInput[] {
  return balances.filter((b) => b.amount > 0);
}

function totalPointsAcrossPrograms(balances: RewardBalanceInput[]): number {
  return Math.round(activeBalances(balances).reduce((s, b) => s + b.amount, 0));
}

function formatPointsShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return amount.toLocaleString();
}

export function buildPointsBreakdown(
  balances: RewardBalanceInput[],
  programLabels: Record<string, string> = PROGRAM_LABELS,
): string {
  const parts = activeBalances(balances)
    .sort((a, b) => b.amount - a.amount)
    .map(
      (b) =>
        `${programLabels[b.programCode] ?? b.programCode} ${formatPointsShort(b.amount)}`,
    );
  return parts.length > 0 ? parts.join(" · ") : "No balances yet";
}

export function summarizeBalances(
  balances: RewardBalanceInput[],
  programLabels: Record<string, string> = PROGRAM_LABELS,
) {
  const active = activeBalances(balances);
  const primary = primaryProgram(balances, programLabels);
  return {
    totalPoints: totalPointsAcrossPrograms(balances),
    programCount: active.length,
    pointsBreakdown: buildPointsBreakdown(balances, programLabels),
    primary,
  };
}

function userProgramCodes(balances: RewardBalanceInput[]): string[] {
  const codes = activeBalances(balances).map((b) => b.programCode);
  return codes.length > 0 ? codes : ["chase_ur"];
}

function resolveCppForProgram(
  catalog: ValuationCatalog,
  programCode: string,
  method: RedemptionMethodCode,
): number {
  const rule = catalog.valuationRules.find(
    (r) =>
      r.rewardProgramCode === programCode &&
      r.redemptionMethodCode === method &&
      !r.transferPartnerCode,
  );
  if (rule) return rule.typicalCpp;
  return resolveMethodCpp(catalog, method, [{ programCode, amount: 1 }]);
}

function effectiveCppForProgram(
  catalog: ValuationCatalog,
  programCode: string,
  ctx: GoalContext,
  method: RedemptionMethodCode,
): number {
  const dbCpp = resolveCppForProgram(catalog, programCode, method);
  const tuning = resolveTuning(ctx);

  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    if (method === "transfer") return tuning.transferCpp;
    if (method === "portal") return tuning.portalCpp;
    return tuning.cashbackCpp;
  }

  const tuningCpp =
    method === "transfer"
      ? tuning.transferCpp
      : method === "portal"
        ? tuning.portalCpp
        : tuning.cashbackCpp;
  const baseline =
    method === "transfer" ? 1.75 : method === "portal" ? 1.25 : 1;
  return roundMoney(dbCpp * (tuningCpp / baseline));
}

/** Sum of per-program value at typical rates (points are not pooled across issuers). */
function estimatedValueAcrossPrograms(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  ctx: GoalContext,
  method: RedemptionMethodCode,
): number {
  return roundMoney(
    activeBalances(balances).reduce(
      (sum, b) =>
        sum +
        dollarsFor(b.amount, effectiveCppForProgram(catalog, b.programCode, ctx, method)),
      0,
    ),
  );
}

function blendedCpp(totalPoints: number, totalValue: number): number {
  if (totalPoints <= 0) return 0;
  return Math.round((totalValue / totalPoints) * 100 * 100) / 100;
}

/** Best typical cpp for a method using DB rules for the user's programs. */
export function resolveMethodCpp(
  catalog: ValuationCatalog,
  method: RedemptionMethodCode,
  balances: RewardBalanceInput[],
): number {
  const programs = userProgramCodes(balances);
  const directRules = catalog.valuationRules.filter(
    (r) =>
      r.redemptionMethodCode === method &&
      !r.transferPartnerCode &&
      programs.includes(r.rewardProgramCode),
  );
  if (directRules.length > 0) {
    return Math.max(...directRules.map((r) => r.typicalCpp));
  }
  const fallback = catalog.valuationRules.filter(
    (r) => r.redemptionMethodCode === method && !r.transferPartnerCode,
  );
  return fallback.length > 0
    ? Math.max(...fallback.map((r) => r.typicalCpp))
    : method === "cashback"
      ? 1
      : method === "portal"
        ? 1.25
        : 1.75;
}

function effectiveCpp(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  ctx: GoalContext,
  method: RedemptionMethodCode,
): number {
  const dbCpp = resolveMethodCpp(catalog, method, balances);
  const tuning = resolveTuning(ctx);

  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    if (method === "transfer") return tuning.transferCpp;
    if (method === "portal") return tuning.portalCpp;
    return tuning.cashbackCpp;
  }

  const tuningCpp =
    method === "transfer"
      ? tuning.transferCpp
      : method === "portal"
        ? tuning.portalCpp
        : tuning.cashbackCpp;
  const baseline =
    method === "transfer" ? 1.75 : method === "portal" ? 1.25 : 1;
  return roundMoney(dbCpp * (tuningCpp / baseline));
}

export function generateRecommendations(
  catalog: ValuationCatalog,
  rewardBalances: RewardBalanceInput[],
  ctx: GoalContext,
): Recommendation[] {
  const { totalPoints, programCount } = summarizeBalances(rewardBalances);
  const tuning = resolveTuning(ctx);

  const transferValue = estimatedValueAcrossPrograms(
    catalog,
    rewardBalances,
    ctx,
    "transfer",
  );
  const portalValue = estimatedValueAcrossPrograms(
    catalog,
    rewardBalances,
    ctx,
    "portal",
  );
  const cashbackValue = estimatedValueAcrossPrograms(
    catalog,
    rewardBalances,
    ctx,
    "cashback",
  );

  const transferCpp = blendedCpp(totalPoints, transferValue);
  const portalCpp = blendedCpp(totalPoints, portalValue);
  const cashbackCpp = blendedCpp(totalPoints, cashbackValue);

  const multiProgram = programCount > 1;
  const multiSuffix = multiProgram
    ? " Estimates add up each program separately. Points can’t be combined across issuers."
    : "";

  const recs: Recommendation[] = [
    {
      id: "BEST_VALUE",
      label: "BEST_VALUE",
      title: tuning.copy?.BEST_VALUE?.title ?? "Highest typical dollar value",
      description:
        tuning.copy?.BEST_VALUE?.description ??
        `Partner transfers often stretch value the furthest.${multiSuffix}`,
      estimatedDollarValue: transferValue,
      pointsUsed: totalPoints,
      cpp: transferCpp,
      difficulty: tuning.transferDifficulty,
      redemptionType: "transfer",
    },
    {
      id: "EASIEST",
      label: "EASIEST",
      title: tuning.copy?.EASIEST?.title ?? "Simple cash back or credits",
      description:
        tuning.copy?.EASIEST?.description ??
        `Redeem per issuer for cash back or statement credits.${multiSuffix}`,
      estimatedDollarValue: cashbackValue,
      pointsUsed: totalPoints,
      cpp: cashbackCpp,
      difficulty: "easy",
      redemptionType: "cashback",
    },
    {
      id: "BEST_FOR_TRAVEL",
      label: "BEST_FOR_TRAVEL",
      title: tuning.copy?.BEST_FOR_TRAVEL?.title ?? "Book travel in one place",
      description:
        tuning.copy?.BEST_FOR_TRAVEL?.description ??
        `Use each bank’s travel portal with the points in that program.${multiSuffix}`,
      estimatedDollarValue: portalValue,
      pointsUsed: totalPoints,
      cpp: portalCpp,
      difficulty: "easy",
      redemptionType: "portal",
    },
  ];

  return tuning.order.map((rid) => recs.find((r) => r.id === rid)!);
}

export function valueRangeForBalances(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  ctx: GoalContext,
): { min: number; max: number } {
  const values = [
    estimatedValueAcrossPrograms(catalog, balances, ctx, "cashback"),
    estimatedValueAcrossPrograms(catalog, balances, ctx, "portal"),
    estimatedValueAcrossPrograms(catalog, balances, ctx, "transfer"),
  ];
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function coverageStatus(
  pointsHave: number,
  pointsRequired: number,
): GoalCoverageStatus {
  if (pointsRequired <= 0) return "full";
  const ratio = pointsHave / pointsRequired;
  if (ratio >= 1) return "full";
  if (ratio >= 0.45) return "partial";
  return "stretch";
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function formatOfferExpiry(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  if (days <= 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  if (days <= 21) return `Expires in ${days} days`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function goalTargetLabel(ctx: GoalContext): string {
  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    return CUSTOM_GOAL_LABELS[ctx.customGoalCode];
  }
  return GOAL_PRESET_LABELS[ctx.goalPreference as Exclude<GoalPreference, "CUSTOM">];
}

type GoalTarget = {
  label: string;
  pointsRequired: number;
  cashValue: number;
};

function goalTargetForContext(
  catalog: ValuationCatalog,
  ctx: GoalContext,
  rec: Recommendation,
): GoalTarget {
  const baseLabel = goalTargetLabel(ctx);

  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    const row = catalog.goalTargets.find(
      (t) => t.customGoalCode === ctx.customGoalCode,
    );
    if (row) {
      return {
        label: `${baseLabel} (${row.labelSuffix})`,
        pointsRequired: row.pointsRequired,
        cashValue: row.cashValueUsd,
      };
    }
  }

  const preset = catalog.goalTargets.find(
    (t) => t.goalPreference === ctx.goalPreference && !t.customGoalCode,
  );

  if (ctx.goalPreference === "MAX_VALUE") {
    return {
      label: `${baseLabel}, ${preset?.labelSuffix ?? "high-value partner redemption"}`,
      pointsRequired: Math.max(
        preset?.pointsRequired ?? 75_000,
        Math.round(rec.pointsUsed * 0.85),
      ),
      cashValue: rec.estimatedDollarValue,
    };
  }
  if (ctx.goalPreference === "KEEP_IT_SIMPLE") {
    const pts = Math.max(preset?.pointsRequired ?? 10_000, Math.round(rec.pointsUsed * 0.5));
    return {
      label: `${baseLabel}, ${preset?.labelSuffix ?? "straightforward statement credit"}`,
      pointsRequired: pts,
      cashValue: dollarsFor(pts, 1),
    };
  }
  if (ctx.goalPreference === "TRAVEL_FOCUSED") {
    return {
      label: `${baseLabel}, ${preset?.labelSuffix ?? "round-trip economy flight + hotel night"}`,
      pointsRequired: preset?.pointsRequired ?? 55_000,
      cashValue: preset?.cashValueUsd ?? 1_100,
    };
  }
  return {
    label: `${baseLabel}, ${preset?.labelSuffix ?? "$500+ in cash back or credits"}`,
    pointsRequired: preset?.pointsRequired ?? 50_000,
    cashValue: preset?.cashValueUsd ?? 500,
  };
}

function buildGoalFit(
  balances: RewardBalanceInput[],
  target: GoalTarget,
  rec: Recommendation,
): GoalFitSummary {
  const { totalPoints, programCount, primary } = summarizeBalances(balances);
  const status = coverageStatus(totalPoints, target.pointsRequired);
  const percentCovered = Math.min(
    100,
    Math.round((totalPoints / target.pointsRequired) * 100),
  );
  const pointsShort = Math.max(0, target.pointsRequired - totalPoints);
  const cashGap = roundMoney((pointsShort * rec.cpp) / 100);

  const planningNote =
    programCount > 1
      ? " Totals are across programs for planning only. You redeem each issuer separately."
      : "";

  const offerNote =
    programCount > 1
      ? " Offers below are listed separately for each program you can redeem from."
      : " The offers below match your current balance.";

  const headlines: Record<GoalCoverageStatus, string> = {
    full: "Your points can cover this goal",
    partial: "Partial coverage. You’re close",
    stretch: "Stretch goal. Plan to earn or combine",
  };

  const details: Record<GoalCoverageStatus, string> = {
    full: `You have about ${totalPoints.toLocaleString()} combined points toward ${target.label}.${planningNote}${offerNote}`,
    partial: `You’re at roughly ${percentCovered}% of a typical ${target.label} on a combined basis.${planningNote} You can book a smaller offer now or earn about ${pointsShort.toLocaleString()} more.`,
    stretch: `You’d need about ${pointsShort.toLocaleString()} more points combined (~$${Math.round(cashGap).toLocaleString()} at typical rates) for full coverage.${planningNote}${offerNote}`,
  };

  return {
    status,
    headline: headlines[status],
    detail: details[status],
    targetLabel: target.label,
    pointsYouHave: totalPoints,
    pointsForFullCoverage: target.pointsRequired,
    percentCovered,
    pointsShort,
    cashGap,
    programCount,
    primaryProgramLabel: primary.label,
  };
}

export function primaryProgram(
  balances: RewardBalanceInput[],
  programLabels: Record<string, string> = PROGRAM_LABELS,
): ProgramInfo {
  const sorted = [...balances].sort((a, b) => b.amount - a.amount);
  const top = sorted.find((b) => b.amount > 0) ?? sorted[0];
  if (!top) {
    return { programCode: "chase_ur", label: programLabels.chase_ur ?? "Chase Ultimate Rewards", amount: 0 };
  }
  return {
    programCode: top.programCode,
    label: programLabels[top.programCode] ?? top.programCode,
    amount: top.amount,
  };
}

function partnerDisplayName(templatePartner: string, programLabel: string): string {
  if (templatePartner === "Issuer travel portal") {
    return `${programLabel} Travel`;
  }
  if (templatePartner === "Card issuer") {
    return programLabel;
  }
  return templatePartner;
}

function offerHighlight(
  template: ValuationCatalog["offers"][number],
  ctx: GoalContext,
): string | undefined {
  if (
    template.highlightCustomGoalCode &&
    ctx.customGoalCode === template.highlightCustomGoalCode
  ) {
    return template.highlightLabel ?? "Matches your focus";
  }
  if (
    template.highlightGoalPreference &&
    ctx.goalPreference === template.highlightGoalPreference
  ) {
    return template.highlightLabel ?? "Good fit for your goal";
  }
  if (template.highlightLabel && !template.highlightCustomGoalCode && !template.highlightGoalPreference) {
    return template.highlightLabel;
  }
  return undefined;
}

function programsForMethod(
  catalog: ValuationCatalog,
  balances: RewardBalanceInput[],
  method: RedemptionMethodCode,
): ProgramInfo[] {
  return activeBalances(balances)
    .filter((b) =>
      catalog.valuationRules.some(
        (r) =>
          r.rewardProgramCode === b.programCode &&
          r.redemptionMethodCode === method &&
          !r.transferPartnerCode,
      ),
    )
    .sort((a, b) => b.amount - a.amount)
    .map((b) => ({
      programCode: b.programCode,
      label: PROGRAM_LABELS[b.programCode] ?? b.programCode,
      amount: b.amount,
    }));
}

export function offerInstanceId(offerKey: string, programCode: string): string {
  return `${offerKey}@${programCode}`;
}

function buildOfferInstance(
  catalog: ValuationCatalog,
  template: ValuationCatalog["offers"][number],
  program: ProgramInfo,
  ctx: GoalContext,
): RedemptionOffer {
  const expiresAt = addDays(template.expiresInDays);
  let pointsRequired = template.pointsRequired;
  let estimatedCashValue = template.estimatedCashValueUsd;
  const pointsInProgram = program.amount;

  if (template.offerKey === "offer-cash-deposit") {
    pointsRequired = Math.min(pointsInProgram || 10_000, 25_000);
    estimatedCashValue = dollarsFor(
      pointsRequired,
      effectiveCppForProgram(catalog, program.programCode, ctx, "cashback"),
    );
  }

  return {
    id: offerInstanceId(template.offerKey, program.programCode),
    offerKey: template.offerKey,
    programCode: program.programCode,
    title: template.title,
    partner: partnerDisplayName(template.partnerName, program.label),
    programLabel: program.label,
    pointsRequired,
    estimatedCashValue,
    coverageStatus: coverageStatus(pointsInProgram, pointsRequired),
    expiresAt,
    expiresLabel: formatOfferExpiry(expiresAt),
    availabilityNote: template.availabilityNote,
    highlight: offerHighlight(template, ctx),
  };
}

export function buildOffers(
  catalog: ValuationCatalog,
  rec: Recommendation,
  balances: RewardBalanceInput[],
  ctx: GoalContext,
): RedemptionOffer[] {
  const templates = catalog.offers
    .filter((o) => o.recommendationId === rec.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const programs = programsForMethod(catalog, balances, rec.redemptionType);
  const offers: RedemptionOffer[] = [];

  for (const program of programs) {
    for (const template of templates) {
      if (
        template.rewardProgramCode &&
        template.rewardProgramCode !== program.programCode
      ) {
        continue;
      }
      offers.push(buildOfferInstance(catalog, template, program, ctx));
    }
  }

  return offers;
}

export function getOfferPrimaryAction(
  rec: Recommendation,
  program: ProgramInfo,
  programCount = 1,
): RecommendationAction {
  const fromLabel =
    programCount > 1
      ? `${program.label} (${program.amount.toLocaleString()} pts)`
      : program.label;

  if (rec.redemptionType === "transfer") {
    return {
      id: "start-transfer",
      label: "Start partner transfer",
      description: `Move points from ${fromLabel} to a partner program.`,
      kind: "primary",
      actionType: "start_transfer",
    };
  }
  if (rec.redemptionType === "portal") {
    return {
      id: "open-portal",
      label: "Open travel portal",
      description: `Book on ${fromLabel} Travel with points at checkout.`,
      kind: "primary",
      actionType: "open_portal",
    };
  }
  return {
    id: "redeem-credit",
    label: "Redeem statement credit",
    description: "Apply points toward your balance in the issuer app.",
    kind: "primary",
    actionType: "statement_credit",
  };
}

function buildNextSteps(
  rec: Recommendation,
  goalFit: GoalFitSummary,
  offers: RedemptionOffer[],
): RecommendationStep[] {
  const multi = goalFit.programCount > 1;

  if (rec.redemptionType === "transfer") {
    const smallestFit = offers
      .filter((o) => o.coverageStatus !== "stretch")
      .sort((a, b) => a.pointsRequired - b.pointsRequired)[0];

    return [
      {
        order: 1,
        title: "Search partner award space",
        detail: "Find flights or hotels before moving points. Transfers are usually irreversible.",
      },
      {
        order: 2,
        title: "Transfer only what you need",
        detail: smallestFit
          ? `Example: ${smallestFit.title} needs ${smallestFit.pointsRequired.toLocaleString()} ${smallestFit.programLabel} pts. Transfer 1:1, then book within 24 hours.`
          : "Move points 1:1 to the partner, then book within 24 hours.",
      },
      {
        order: 3,
        title: "Book and save confirmation",
        detail: "Screenshot taxes/fees and cancellation rules.",
      },
    ];
  }

  if (rec.redemptionType === "portal") {
    return [
      {
        order: 1,
        title: "Search the right travel portal",
        detail: multi
          ? "Open the portal for the program on the offer."
          : "Filter by dates and “pay with points” to see true cost.",
      },
      {
        order: 2,
        title: "Check refundable options",
        detail: "Especially if you’re still earning toward a bigger trip.",
      },
      {
        order: 3,
        title: "Complete checkout with points",
        detail: "Portal prices can change, book when the offer matches your goal.",
      },
    ];
  }

  return [
    {
      order: 1,
      title: "Pick a credit amount",
      detail: multi
        ? "Redeem in each issuer’s app for the offers above."
        : "Partial redemptions are fine if you’re not covering a full trip.",
    },
    {
      order: 2,
      title: "Redeem in your issuer app",
      detail: "Statement credits usually post within 1 to 2 billing cycles.",
    },
  ];
}

const detailCopy: Record<
  string,
  Pick<RecommendationDetail, "whyRecommended" | "effortExplanation" | "unlockExamples">
> = {
  BEST_VALUE: {
    whyRecommended:
      "This path usually turns each point into more dollars when you’re willing to spend a little time booking through partners.",
    effortExplanation:
      "You may need to move points to an airline or hotel program, then book there. It’s a few extra steps, but the upside is often meaningful.",
    unlockExamples: [
      "A long weekend flight that would cost hundreds in cash",
      "A hotel stay where the room rate is high but points cover it well",
    ],
  },
  EASIEST: {
    whyRecommended:
      "You get money back in the bank or on your statement without hunting for award space.",
    effortExplanation:
      "Mostly a few taps in your card’s app or website. Great when you want clarity over squeezing every penny.",
    unlockExamples: [
      "Paying down your balance or covering everyday purchases",
      "A simple statement credit when you don’t want to think about travel",
    ],
  },
  BEST_FOR_TRAVEL: {
    whyRecommended:
      "You stay inside your bank’s travel tools, so it’s easier than moving points around while still beating plain cash back.",
    effortExplanation:
      "Search and book like a normal travel site. Value is usually better than cash back, with less work than partner transfers.",
    unlockExamples: [
      "Round-trip flights for a trip you already planned",
      "A hotel night booked in the same checkout flow as flights",
    ],
  },
};

export function listOffersForRecommendation(
  catalog: ValuationCatalog,
  recommendationId: string,
  rewardBalances: RewardBalanceInput[],
  ctx: GoalContext,
): RedemptionOffer[] {
  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );
  const rec = generateRecommendations(catalog, rewardBalances, ctx).find(
    (r) => r.id === recommendationId,
  );
  if (!rec) return [];
  return buildOffers(catalog, rec, rewardBalances, ctx);
}

export function resolveSavedOffers(
  catalog: ValuationCatalog,
  refs: { id: string; offerKey: string; recommendationId: string; savedAt: string }[],
  rewardBalances: RewardBalanceInput[],
  ctx: GoalContext,
): SavedOfferEntry[] {
  const now = Date.now();
  const recs = generateRecommendations(catalog, rewardBalances, ctx);
  const recById = new Map(recs.map((r) => [r.id, r]));

  return refs.map((ref) => {
    const recId = ref.recommendationId as Recommendation["id"];
    const rec = recById.get(recId);
    const offers = listOffersForRecommendation(
      catalog,
      recId,
      rewardBalances,
      ctx,
    );
    const offer =
      offers.find(
        (o) => o.id === ref.offerKey || o.offerKey === ref.offerKey,
      ) ?? null;

    let status: SavedOfferEntry["status"] = "unavailable";
    if (offer) {
      status = new Date(offer.expiresAt).getTime() < now ? "expired" : "active";
    }

    return {
      id: ref.id,
      offerKey: ref.offerKey,
      recommendationId: ref.recommendationId,
      savedAt: ref.savedAt,
      status,
      recommendationTitle: rec?.title ?? "Redemption path",
      offer,
    };
  });
}

export function buildRecommendationDetail(
  catalog: ValuationCatalog,
  rec: Recommendation,
  rewardBalances: RewardBalanceInput[],
  ctx: GoalContext,
): RecommendationDetail | null {
  const extra = detailCopy[rec.id];
  if (!extra) return null;

  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );
  const target = goalTargetForContext(catalog, ctx, rec);
  const goalFit = buildGoalFit(rewardBalances, target, rec);
  const offers = buildOffers(catalog, rec, rewardBalances, ctx);
  const nextSteps = buildNextSteps(rec, goalFit, offers);

  const cashbackValue = estimatedValueAcrossPrograms(
    catalog,
    rewardBalances,
    ctx,
    "cashback",
  );
  const vsCashbackExtraDollars = roundMoney(rec.estimatedDollarValue - cashbackValue);

  return {
    ...rec,
    ...extra,
    vsCashbackExtraDollars,
    goalFit,
    offers,
    nextSteps,
  };
}

export function buildDashboardSummary(
  catalog: ValuationCatalog,
  rewardBalances: RewardBalanceInput[],
  ctx: GoalContext,
): DashboardSummary {
  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );

  const { min: valueRangeMin, max: valueRangeMax } = valueRangeForBalances(
    catalog,
    rewardBalances,
    ctx,
  );

  const recommendations = generateRecommendations(catalog, rewardBalances, ctx);

  const cashbackD = estimatedValueAcrossPrograms(
    catalog,
    rewardBalances,
    ctx,
    "cashback",
  );
  const portalD = estimatedValueAcrossPrograms(
    catalog,
    rewardBalances,
    ctx,
    "portal",
  );
  const transferD =
    recommendations.find((r) => r.id === "BEST_VALUE")?.estimatedDollarValue ??
    estimatedValueAcrossPrograms(catalog, rewardBalances, ctx, "transfer");

  const comparison: ValueComparisonRow[] = [
    {
      id: "cashback",
      label: "Cash back",
      estimatedDollars: cashbackD,
      subtitle: "Straightforward, predictable",
    },
    {
      id: "portal",
      label: "Travel site",
      estimatedDollars: portalD,
      subtitle: "Book flights and hotels in one place",
    },
    {
      id: "transfer",
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
      : ctx.goalPreference === "CUSTOM"
        ? "Suggestions are tuned to your custom focus. Save to refresh rankings."
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
