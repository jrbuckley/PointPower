export type RewardProgramType =
  | "CHASE_UR"
  | "AMEX_MR"
  | "CAPITAL_ONE_MILES"
  | "CITI_TY"
  | "CASHBACK";

export type RewardBalance = {
  program: RewardProgramType;
  amount: number;
};

export type GoalPreference =
  | "MAX_VALUE"
  | "KEEP_IT_SIMPLE"
  | "TRAVEL_FOCUSED"
  | "CASHLIKE";

export type RecommendationLabel =
  | "BEST_VALUE"
  | "EASIEST"
  | "BEST_FOR_TRAVEL";

export type Recommendation = {
  id: string;
  label: RecommendationLabel;
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
  comparison: ValueComparisonRow[];
  insightMessage: string;
};

export type RecommendationDetail = Recommendation & {
  whyRecommended: string;
  vsCashbackExtraDollars: number;
  effortExplanation: string;
  unlockExamples: string[];
};
