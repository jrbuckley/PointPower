import type { CustomGoalCode, GoalPreference } from "@points-exchange/shared";
import { CUSTOM_GOAL_LABELS } from "../constants/customGoals";
import { PROGRAM_LABELS } from "../constants/programs";
import type {
  GoalCoverageStatus,
  GoalFitSummary,
  Recommendation,
  RecommendationAction,
  RecommendationDetail,
  RecommendationStep,
  RedemptionOffer,
  RewardBalance,
  RewardProgramId,
} from "../types/models";
import type { GoalContext } from "./goalContext";
import { generateRecommendations } from "./recommendations";

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function dollarsFor(points: number, cpp: number): number {
  return roundMoney((points * cpp) / 100);
}

function formatDollars(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
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

const GOAL_PRESET_LABELS: Record<Exclude<GoalPreference, "CUSTOM">, string> = {
  MAX_VALUE: "maximum redemption value",
  KEEP_IT_SIMPLE: "a simple, low-effort redemption",
  TRAVEL_FOCUSED: "a solid travel booking",
  CASHLIKE: "cash-like value in your pocket",
};

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
  ctx: GoalContext,
  rec: Recommendation,
): GoalTarget {
  const baseLabel = goalTargetLabel(ctx);

  if (ctx.goalPreference === "CUSTOM" && ctx.customGoalCode) {
    const targets: Record<CustomGoalCode, GoalTarget> = {
      INTERNATIONAL_FLIGHTS: {
        label: `${baseLabel} (round-trip premium cabin)`,
        pointsRequired: 88_000,
        cashValue: 3_200,
      },
      LUXURY_HOTELS: {
        label: `${baseLabel} (4–5 night premium stay)`,
        pointsRequired: 120_000,
        cashValue: 2_800,
      },
      DOMESTIC_FLIGHTS: {
        label: `${baseLabel} (domestic round-trip)`,
        pointsRequired: 25_000,
        cashValue: 450,
      },
      FAMILY_VACATION: {
        label: `${baseLabel} (family of 4, peak week)`,
        pointsRequired: 140_000,
        cashValue: 2_400,
      },
      BUSINESS_TRAVEL: {
        label: `${baseLabel} (last-minute business fare)`,
        pointsRequired: 45_000,
        cashValue: 900,
      },
      ALL_INCLUSIVE_RESORT: {
        label: `${baseLabel} (7-night package)`,
        pointsRequired: 100_000,
        cashValue: 2_100,
      },
      CRUISE_TRAVEL: {
        label: `${baseLabel} (balcony cabin)`,
        pointsRequired: 80_000,
        cashValue: 1_800,
      },
      LAST_MINUTE_TRAVEL: {
        label: `${baseLabel} (short-notice trip)`,
        pointsRequired: 35_000,
        cashValue: 650,
      },
      LOUNGE_AND_STATUS: {
        label: `${baseLabel} (premium card + lounge access)`,
        pointsRequired: 60_000,
        cashValue: 1_200,
      },
      EVERYDAY_OFFSET: {
        label: `${baseLabel} ($1,000 in statement credits)`,
        pointsRequired: 100_000,
        cashValue: 1_000,
      },
    };
    return targets[ctx.customGoalCode];
  }

  const presetTargets: Record<
    Exclude<GoalPreference, "CUSTOM">,
    GoalTarget
  > = {
    MAX_VALUE: {
      label: "high-value partner redemption",
      pointsRequired: Math.max(75_000, Math.round(rec.pointsUsed * 0.85)),
      cashValue: rec.estimatedDollarValue,
    },
    KEEP_IT_SIMPLE: {
      label: "straightforward statement credit",
      pointsRequired: Math.max(10_000, Math.round(rec.pointsUsed * 0.5)),
      cashValue: dollarsFor(Math.max(10_000, Math.round(rec.pointsUsed * 0.5)), 1),
    },
    TRAVEL_FOCUSED: {
      label: "round-trip economy flight + hotel night",
      pointsRequired: 55_000,
      cashValue: 1_100,
    },
    CASHLIKE: {
      label: "$500+ in cash back or credits",
      pointsRequired: 50_000,
      cashValue: 500,
    },
  };

  return {
    ...presetTargets[ctx.goalPreference as Exclude<GoalPreference, "CUSTOM">],
    label: `${baseLabel} — ${presetTargets[ctx.goalPreference as Exclude<GoalPreference, "CUSTOM">].label}`,
  };
}

function buildGoalFit(
  totalPoints: number,
  target: GoalTarget,
  rec: Recommendation,
): GoalFitSummary {
  const status = coverageStatus(totalPoints, target.pointsRequired);
  const percentCovered = Math.min(
    100,
    Math.round((totalPoints / target.pointsRequired) * 100),
  );
  const pointsShort = Math.max(0, target.pointsRequired - totalPoints);
  const cashGap = roundMoney((pointsShort * rec.cpp) / 100);

  const headlines: Record<GoalCoverageStatus, string> = {
    full: "Your points can cover this goal",
    partial: "Partial coverage — you’re close",
    stretch: "Stretch goal — plan to earn or combine",
  };

  const details: Record<GoalCoverageStatus, string> = {
    full: `You have about ${totalPoints.toLocaleString()} points toward ${target.label}. The offers below are actionable with your current balances.`,
    partial: `You’re at roughly ${percentCovered}% of a typical ${target.label}. You can book a lower tier now or top up about ${pointsShort.toLocaleString()} more points.`,
    stretch: `You’d need about ${pointsShort.toLocaleString()} more points (~${formatDollars(cashGap)} at typical rates) for full coverage. Start with a smaller offer or earn toward your goal.`,
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
  };
}

function primaryProgram(balances: RewardBalance[]): {
  programId: RewardProgramId;
  label: string;
  amount: number;
} {
  const sorted = [...balances].sort((a, b) => b.amount - a.amount);
  const top = sorted.find((b) => b.amount > 0) ?? sorted[0];
  if (!top) {
    return { programId: "CHASE_UR", label: PROGRAM_LABELS.CHASE_UR, amount: 0 };
  }
  return {
    programId: top.programId,
    label: PROGRAM_LABELS[top.programId],
    amount: top.amount,
  };
}

function buildOffers(
  rec: Recommendation,
  totalPoints: number,
  program: ReturnType<typeof primaryProgram>,
  ctx: GoalContext,
): RedemptionOffer[] {
  const expiresSoon = addDays(12);
  const expiresMid = addDays(34);
  const expiresLater = addDays(72);

  if (rec.redemptionType === "transfer") {
    return [
      {
        id: "offer-united-saver",
        title: "United Saver — U.S. to Europe",
        partner: "United MileagePlus",
        programLabel: program.label,
        pointsRequired: 60_000,
        estimatedCashValue: 1_150,
        coverageStatus: coverageStatus(totalPoints, 60_000),
        expiresAt: expiresMid,
        expiresLabel: formatOfferExpiry(expiresMid),
        availabilityNote: "Saver space limited; flexible dates improve odds.",
        highlight: ctx.customGoalCode === "INTERNATIONAL_FLIGHTS" ? "Matches your focus" : undefined,
      },
      {
        id: "offer-hyatt-premium",
        title: "Hyatt premium category — 3 nights",
        partner: "World of Hyatt",
        programLabel: program.label,
        pointsRequired: 75_000,
        estimatedCashValue: 1_400,
        coverageStatus: coverageStatus(totalPoints, 75_000),
        expiresAt: expiresLater,
        expiresLabel: formatOfferExpiry(expiresLater),
        availabilityNote: "Transfer 1:1 from most bank programs; book within 24h of transfer.",
        highlight: ctx.customGoalCode === "LUXURY_HOTELS" ? "Matches your focus" : undefined,
      },
      {
        id: "offer-air-france-promo",
        title: "Flying Blue promo award",
        partner: "Air France / KLM",
        programLabel: program.label,
        pointsRequired: 45_000,
        estimatedCashValue: 820,
        coverageStatus: coverageStatus(totalPoints, 45_000),
        expiresAt: expiresSoon,
        expiresLabel: formatOfferExpiry(expiresSoon),
        availabilityNote: "Promo ends soon — verify logged-in pricing before transferring.",
        highlight: "Limited-time",
      },
    ];
  }

  if (rec.redemptionType === "portal") {
    return [
      {
        id: "offer-portal-economy-rt",
        title: "Round-trip economy — bank travel portal",
        partner: `${program.label} Travel`,
        programLabel: program.label,
        pointsRequired: 32_000,
        estimatedCashValue: 480,
        coverageStatus: coverageStatus(totalPoints, 32_000),
        expiresAt: expiresMid,
        expiresLabel: formatOfferExpiry(expiresMid),
        availabilityNote: "Pay with points at checkout; prices track cash fares.",
      },
      {
        id: "offer-portal-hotel-bundle",
        title: "Flight + hotel bundle",
        partner: `${program.label} Travel`,
        programLabel: program.label,
        pointsRequired: 48_000,
        estimatedCashValue: 720,
        coverageStatus: coverageStatus(totalPoints, 48_000),
        expiresAt: expiresLater,
        expiresLabel: formatOfferExpiry(expiresLater),
        availabilityNote: "Often better than booking separately in the portal.",
        highlight: ctx.goalPreference === "TRAVEL_FOCUSED" ? "Good fit for your goal" : undefined,
      },
      {
        id: "offer-portal-lastminute",
        title: "Last-minute weekend getaway",
        partner: `${program.label} Travel`,
        programLabel: program.label,
        pointsRequired: 22_000,
        estimatedCashValue: 330,
        coverageStatus: coverageStatus(totalPoints, 22_000),
        expiresAt: expiresSoon,
        expiresLabel: formatOfferExpiry(expiresSoon),
        availabilityNote: "Inventory changes daily — lock a refundable fare if unsure.",
        highlight: ctx.customGoalCode === "LAST_MINUTE_TRAVEL" ? "Matches your focus" : undefined,
      },
    ];
  }

  return [
    {
      id: "offer-statement-500",
      title: "$500 statement credit",
      partner: program.label,
      programLabel: program.label,
      pointsRequired: 50_000,
      estimatedCashValue: 500,
      coverageStatus: coverageStatus(totalPoints, 50_000),
      expiresAt: expiresLater,
      expiresLabel: formatOfferExpiry(expiresLater),
      availabilityNote: "No blackout dates; posts in 1–2 billing cycles.",
    },
    {
      id: "offer-cash-deposit",
      title: "Deposit to linked bank account",
      partner: program.label,
      programLabel: program.label,
      pointsRequired: Math.min(totalPoints || 10_000, 25_000),
      estimatedCashValue: dollarsFor(Math.min(totalPoints || 10_000, 25_000), 1),
      coverageStatus: coverageStatus(totalPoints, Math.min(totalPoints || 10_000, 25_000)),
      expiresAt: expiresMid,
      expiresLabel: formatOfferExpiry(expiresMid),
      availabilityNote: "Minimum redemption may apply depending on issuer.",
    },
    {
      id: "offer-shop-with-points",
      title: "Shop with points — everyday purchases",
      partner: program.label,
      programLabel: program.label,
      pointsRequired: 5_000,
      estimatedCashValue: 50,
      coverageStatus: coverageStatus(totalPoints, 5_000),
      expiresAt: expiresSoon,
      expiresLabel: formatOfferExpiry(expiresSoon),
      availabilityNote: "Lower value per point; useful for small offsets.",
      highlight: ctx.goalPreference === "CASHLIKE" ? "Quick win" : undefined,
    },
  ];
}

function buildActions(rec: Recommendation, programLabel: string): RecommendationAction[] {
  if (rec.redemptionType === "transfer") {
    return [
      {
        id: "start-transfer",
        label: "Start partner transfer",
        description: `Move points from ${programLabel} to a partner program.`,
        kind: "primary",
        actionType: "start_transfer",
      },
      {
        id: "check-availability",
        label: "Check award availability",
        description: "Search partner sites before you transfer.",
        kind: "secondary",
        actionType: "open_portal",
      },
      {
        id: "view-saved",
        label: "View saved offers",
        description: "See everything you’ve bookmarked in one place.",
        kind: "secondary",
        actionType: "view_saved_offers",
      },
      {
        id: "reminder",
        label: "Remind me before expiry",
        description: "Get a nudge when time-limited deals are ending.",
        kind: "secondary",
        actionType: "set_reminder",
      },
    ];
  }

  if (rec.redemptionType === "portal") {
    return [
      {
        id: "open-portal",
        label: "Open travel portal",
        description: `Book on ${programLabel} Travel with points at checkout.`,
        kind: "primary",
        actionType: "open_portal",
      },
      {
        id: "compare-cash",
        label: "Compare cash price",
        description: "See if a transfer partner beats portal pricing.",
        kind: "secondary",
        actionType: "compare_alternatives",
      },
      {
        id: "view-saved",
        label: "View saved offers",
        description: "See everything you’ve bookmarked in one place.",
        kind: "secondary",
        actionType: "view_saved_offers",
      },
    ];
  }

  return [
    {
      id: "redeem-credit",
      label: "Redeem statement credit",
      description: "Apply points toward your balance in the issuer app.",
      kind: "primary",
      actionType: "statement_credit",
    },
    {
      id: "compare-travel",
      label: "Compare travel value",
      description: "See if a portal or transfer beats cash back.",
      kind: "secondary",
      actionType: "compare_alternatives",
    },
    {
      id: "view-saved",
      label: "View saved offers",
      description: "See everything you’ve bookmarked in one place.",
      kind: "secondary",
      actionType: "view_saved_offers",
    },
  ];
}

function buildNextSteps(
  rec: Recommendation,
  programLabel: string,
  goalFit: GoalFitSummary,
): RecommendationStep[] {
  const steps: RecommendationStep[] = [
    {
      order: 1,
      title: "Confirm your balance",
      detail: `You’re working with about ${goalFit.pointsYouHave.toLocaleString()} points in ${programLabel}.`,
    },
  ];

  if (rec.redemptionType === "transfer") {
    steps.push(
      {
        order: 2,
        title: "Search partner award space",
        detail: "Find flights or hotels before moving points—transfers are usually irreversible.",
      },
      {
        order: 3,
        title: "Transfer only what you need",
        detail:
          goalFit.status === "partial"
            ? `Start with the smallest offer that fits (~${Math.min(goalFit.pointsYouHave, 45_000).toLocaleString()} pts) or earn ${goalFit.pointsShort.toLocaleString()} more for full coverage.`
            : "Move points 1:1 to the partner, then book within 24 hours.",
      },
      {
        order: 4,
        title: "Book and save confirmation",
        detail: "Screenshot taxes/fees and cancellation rules.",
      },
    );
  } else if (rec.redemptionType === "portal") {
    steps.push(
      {
        order: 2,
        title: "Search the travel portal",
        detail: "Filter by dates and “pay with points” to see true cost.",
      },
      {
        order: 3,
        title: "Check refundable options",
        detail: "Especially if you’re still earning toward a bigger trip.",
      },
      {
        order: 4,
        title: "Complete checkout with points",
        detail: "Portal prices can change—book when the offer matches your goal.",
      },
    );
  } else {
    steps.push(
      {
        order: 2,
        title: "Pick a credit amount",
        detail: "Partial redemptions are fine if you’re not covering a full trip.",
      },
      {
        order: 3,
        title: "Redeem in your issuer app",
        detail: "Statement credits usually post within 1–2 billing cycles.",
      },
    );
  }

  return steps;
}

const detailCopy: Record<
  string,
  Pick<
    RecommendationDetail,
    "whyRecommended" | "effortExplanation" | "unlockExamples"
  >
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
      "Mostly a few taps in your card’s app or website—great when you want clarity over squeezing every penny.",
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

/** Live offers for a recommendation path (mock catalog; resolved at read time). */
export function listOffersForRecommendation(
  recommendationId: string,
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): RedemptionOffer[] {
  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );
  const program = primaryProgram(rewardBalances);
  const rec = generateRecommendations(rewardBalances, ctx).find(
    (r) => r.id === recommendationId,
  );
  if (!rec) return [];
  return buildOffers(rec, totalPoints, program, ctx);
}

export type SavedOfferEntry = {
  id: string;
  offerKey: string;
  recommendationId: string;
  savedAt: string;
  status: "active" | "expired" | "unavailable";
  recommendationTitle: string;
  offer: RedemptionOffer | null;
};

export function resolveSavedOffers(
  refs: { id: string; offerKey: string; recommendationId: string; savedAt: string }[],
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): SavedOfferEntry[] {
  const now = Date.now();
  const recs = generateRecommendations(rewardBalances, ctx);
  const recById = new Map(recs.map((r) => [r.id, r]));

  return refs.map((ref) => {
    const rec = recById.get(ref.recommendationId);
    const offers = listOffersForRecommendation(
      ref.recommendationId,
      rewardBalances,
      ctx,
    );
    const offer = offers.find((o) => o.id === ref.offerKey) ?? null;

    let status: SavedOfferEntry["status"] = "unavailable";
    if (offer) {
      status =
        new Date(offer.expiresAt).getTime() < now ? "expired" : "active";
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
  rec: Recommendation,
  rewardBalances: RewardBalance[],
  ctx: GoalContext,
): RecommendationDetail | null {
  const extra = detailCopy[rec.id];
  if (!extra) return null;

  const totalPoints = Math.round(
    rewardBalances.reduce((s, b) => s + Math.max(0, b.amount), 0),
  );
  const program = primaryProgram(rewardBalances);
  const target = goalTargetForContext(ctx, rec);
  const goalFit = buildGoalFit(totalPoints, target, rec);
  const offers = buildOffers(rec, totalPoints, program, ctx);
  const actions = buildActions(rec, program.label);
  const nextSteps = buildNextSteps(rec, program.label, goalFit);

  const cashbackValue = dollarsFor(rec.pointsUsed, 1);
  const vsCashbackExtraDollars = roundMoney(
    rec.estimatedDollarValue - cashbackValue,
  );

  return {
    ...rec,
    ...extra,
    vsCashbackExtraDollars,
    goalFit,
    offers,
    actions,
    nextSteps,
  };
}
