import type {
  CustomGoalCode,
  GoalPreference,
  RecommendationId,
  RedemptionMethodCode,
  ValuationCatalog,
} from "@points-exchange/shared";

export type { ValuationCatalog };

export type RewardBalanceInput = {
  programCode: string;
  amount: number;
};

export type GoalContext = {
  goalPreference: GoalPreference;
  customGoalCode: CustomGoalCode | null;
};

export type Recommendation = {
  id: RecommendationId;
  /** Short label on dashboard cards, e.g. "Most effective". */
  tagline: string;
  title: string;
  description: string;
  estimatedDollarValue: number;
  pointsUsed: number;
  cpp: number;
  difficulty: "easy" | "medium" | "advanced";
  redemptionType: RedemptionMethodCode;
};

export type GoalCoverageStatus = "full" | "partial" | "stretch";

export type GoalFitSummary = {
  status: GoalCoverageStatus;
  headline: string;
  detail: string;
  targetLabel: string;
  pointsYouHave: number;
  pointsForFullCoverage: number;
  percentCovered: number;
  pointsShort: number;
  cashGap: number;
  /** Number of programs with a balance > 0. */
  programCount: number;
  primaryProgramLabel: string;
};

export type RedemptionOffer = {
  /** Unique id, typically `offerKey@programCode`. */
  id: string;
  /** Base catalog key for saved-offer references. */
  offerKey: string;
  programCode: string;
  title: string;
  partner: string;
  programLabel: string;
  pointsRequired: number;
  estimatedCashValue: number;
  coverageStatus: GoalCoverageStatus;
  expiresAt: string;
  expiresLabel: string;
  availabilityNote: string;
  highlight?: string;
};

export type RecommendationAction = {
  id: string;
  label: string;
  description: string;
  kind: "primary" | "secondary";
  actionType:
    | "open_portal"
    | "start_transfer"
    | "statement_credit"
    | "save_offer"
    | "view_saved_offers"
    | "set_reminder"
    | "compare_alternatives";
};

export type RecommendationStep = {
  order: number;
  title: string;
  detail?: string;
};

export type RecommendationDetail = Recommendation & {
  whyRecommended: string;
  vsCashbackExtraDollars: number;
  effortExplanation: string;
  unlockExamples: string[];
  goalFit: GoalFitSummary;
  offers: RedemptionOffer[];
  nextSteps: RecommendationStep[];
};

export type ValueComparisonRow = {
  id: RedemptionMethodCode;
  label: string;
  estimatedDollars: number;
  subtitle: string;
};

export type DashboardSummary = {
  totalPoints: number;
  valueRangeMin: number;
  valueRangeMax: number;
  /** Top strategies for the user’s goal (up to 3). */
  recommendations: Recommendation[];
  /** Additional goal-relevant strategies behind “See more”, when any. */
  moreRecommendations: Recommendation[];
  comparison: ValueComparisonRow[];
  insightMessage: string;
};

export type SavedOfferEntry = {
  id: string;
  offerKey: string;
  recommendationId: string;
  savedAt: string;
  status: "active" | "expired" | "unavailable";
  recommendationTitle: string;
  offer: RedemptionOffer | null;
};

export type ProgramInfo = {
  programCode: string;
  label: string;
  amount: number;
};
