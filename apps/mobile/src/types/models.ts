export type RewardProgramId =
  | "CHASE_UR"
  | "AMEX_MR"
  | "CAPITAL_ONE_MILES"
  | "CITI_TY"
  | "CASHBACK";

export type RewardBalance = {
  programId: RewardProgramId;
  amount: number;
};

import type { RecommendationId as SharedRecommendationId } from "@points-exchange/shared";

export type {
  CustomGoalCode,
  GoalPreference,
} from "@points-exchange/shared";

export type RecommendationId = SharedRecommendationId;

export type Recommendation = {
  id: RecommendationId;
  tagline: string;
  title: string;
  description: string;
  estimatedDollarValue: number;
  pointsUsed: number;
  cpp: number;
  difficulty: "easy" | "medium" | "advanced";
  redemptionType: "cashback" | "portal" | "transfer";
};

export type ValueComparisonRow = {
  id: "cashback" | "portal" | "transfer";
  label: string;
  estimatedDollars: number;
  subtitle: string;
};

export type DashboardSummary = {
  totalPoints: number;
  valueRangeMin: number;
  valueRangeMax: number;
  recommendations: Recommendation[];
  moreRecommendations: Recommendation[];
  comparison: ValueComparisonRow[];
  insightMessage: string;
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
  programCount: number;
  primaryProgramLabel: string;
};

export type RedemptionOffer = {
  id: string;
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

export type TransferPathExplanation = {
  headline: string;
  detail: string;
  traceLines: string[];
  stepDestinationCodes: string[];
  issuerProgramCode: string;
  finalPartnerCode: string;
  transferHops: number;
  modeledIssuerCpp: number;
};

export type RecommendationDetail = Recommendation & {
  whyRecommended: string;
  vsCashbackExtraDollars: number;
  effortExplanation: string;
  unlockExamples: string[];
  goalFit: GoalFitSummary;
  offers: RedemptionOffer[];
  nextSteps: RecommendationStep[];
  transferPath?: TransferPathExplanation;
  rankingRationale?: string;
};
