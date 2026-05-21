import { z } from "zod";

const goalPreferenceSchema = z.enum([
  "MAX_VALUE",
  "KEEP_IT_SIMPLE",
  "TRAVEL_FOCUSED",
  "CASHLIKE",
  "CUSTOM",
]);

const customGoalCodeSchema = z.enum([
  "INTERNATIONAL_FLIGHTS",
  "LUXURY_HOTELS",
  "DOMESTIC_FLIGHTS",
  "FAMILY_VACATION",
  "BUSINESS_TRAVEL",
  "ALL_INCLUSIVE_RESORT",
  "CRUISE_TRAVEL",
  "LAST_MINUTE_TRAVEL",
  "LOUNGE_AND_STATUS",
  "EVERYDAY_OFFSET",
]);

const recommendationIdSchema = z.enum([
  "BEST_VALUE",
  "EASIEST",
  "BEST_FOR_TRAVEL",
]);

export const redemptionMethodCodeSchema = z.enum([
  "cashback",
  "portal",
  "transfer",
]);

export type RedemptionMethodCode = z.infer<typeof redemptionMethodCodeSchema>;

export const valuationRuleSchema = z.object({
  rewardProgramCode: z.string(),
  redemptionMethodCode: redemptionMethodCodeSchema,
  transferPartnerCode: z.string().nullable(),
  minCpp: z.number(),
  maxCpp: z.number(),
  typicalCpp: z.number(),
  difficulty: z.string().nullable(),
  title: z.string().nullable(),
});

export type ValuationRule = z.infer<typeof valuationRuleSchema>;

export const redemptionOfferTemplateSchema = z.object({
  offerKey: z.string(),
  recommendationId: recommendationIdSchema,
  redemptionMethodCode: redemptionMethodCodeSchema,
  /** When null, the offer is generated once per user program that supports this method. */
  rewardProgramCode: z.string().nullable(),
  title: z.string(),
  partnerName: z.string(),
  pointsRequired: z.number().int().positive(),
  estimatedCashValueUsd: z.number().positive(),
  expiresInDays: z.number().int().positive(),
  availabilityNote: z.string(),
  highlightLabel: z.string().nullable(),
  highlightGoalPreference: goalPreferenceSchema.nullable(),
  highlightCustomGoalCode: customGoalCodeSchema.nullable(),
  sortOrder: z.number().int(),
});

export type RedemptionOfferTemplate = z.infer<typeof redemptionOfferTemplateSchema>;

export const goalRedemptionTargetSchema = z.object({
  goalPreference: goalPreferenceSchema.nullable(),
  customGoalCode: customGoalCodeSchema.nullable(),
  labelSuffix: z.string(),
  pointsRequired: z.number().int().positive(),
  cashValueUsd: z.number().positive(),
});

export type GoalRedemptionTarget = z.infer<typeof goalRedemptionTargetSchema>;

export const valuationCatalogSchema = z.object({
  valuationRules: z.array(valuationRuleSchema),
  offers: z.array(redemptionOfferTemplateSchema),
  goalTargets: z.array(goalRedemptionTargetSchema),
});

export type ValuationCatalog = z.infer<typeof valuationCatalogSchema>;
