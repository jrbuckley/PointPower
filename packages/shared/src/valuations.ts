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
  "MOST_EFFECTIVE",
  "LEAST_HASSLE",
  "LIMITED_TIME",
  "TRAVEL_PORTAL",
  "SIMPLE_CASH",
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
  /** Optional link to `redemption_products.product_key`. */
  redemptionProductKey: z.string().nullable().default(null),
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

export const issuerTransferEdgeSchema = z.object({
  rewardProgramCode: z.string(),
  partnerCode: z.string(),
  transferRatioNum: z.number().int().positive(),
  transferRatioDen: z.number().int().positive(),
});

export type IssuerTransferEdge = z.infer<typeof issuerTransferEdgeSchema>;

export const redemptionProductTemplateSchema = z
  .object({
    productKey: z.string().min(1),
    redemptionMethodCode: redemptionMethodCodeSchema,
    /** Issuer-program leaf only (cashback / portal); null when `partnerCode` is set. */
    rewardProgramCode: z.string().nullable(),
    /** Partner-program leaf after transfer; null when `rewardProgramCode` is set. */
    partnerCode: z.string().nullable(),
    title: z.string(),
    pointsRequired: z.number().int().positive(),
    cashValueUsd: z.number().positive(),
    highlightGoalPreference: goalPreferenceSchema.nullable(),
    highlightCustomGoalCode: customGoalCodeSchema.nullable(),
    sortOrder: z.number().int(),
  })
  .superRefine((data, ctx) => {
    const hasPartner = data.partnerCode != null && data.partnerCode !== "";
    const hasIssuer = data.rewardProgramCode != null && data.rewardProgramCode !== "";
    if (hasPartner === hasIssuer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Redemption product must set exactly one of partnerCode (transfer leaf) or rewardProgramCode (issuer leaf).",
        path: hasPartner ? ["rewardProgramCode"] : ["partnerCode"],
      });
    }
  });

export type RedemptionProductTemplate = z.infer<
  typeof redemptionProductTemplateSchema
>;

export const partnerTransferEdgeSchema = z.object({
  fromPartnerCode: z.string(),
  toPartnerCode: z.string(),
  transferRatioNum: z.number().int().positive(),
  transferRatioDen: z.number().int().positive(),
  minTransferPoints: z.number().int().positive().nullable(),
  transferDelayHours: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export type PartnerTransferEdge = z.infer<typeof partnerTransferEdgeSchema>;

export const transferBonusSchema = z.object({
  /** Set for issuer → partner bonuses; null for partner → partner. */
  rewardProgramCode: z.string().nullable(),
  /** Set for partner → partner bonuses; null for issuer → partner. */
  fromPartnerCode: z.string().nullable(),
  toPartnerCode: z.string(),
  bonusPercent: z.number(),
  startsAt: z.string(),
  endsAt: z.string(),
});

export type TransferBonus = z.infer<typeof transferBonusSchema>;

export const valuationCatalogSchema = z.object({
  valuationRules: z.array(valuationRuleSchema),
  offers: z.array(redemptionOfferTemplateSchema),
  goalTargets: z.array(goalRedemptionTargetSchema),
  /** Direct issuer → transfer partner edges (from reward_program_transfer_partners). */
  issuerTransferEdges: z.array(issuerTransferEdgeSchema).default([]),
  /**
   * Named redemption leaves for Phase 2+ valuation (concrete cash / points bands).
   * Transfer products attach to partner_code; issuer-only portal/cashback leaves use reward_program_code.
   */
  redemptionProducts: z.array(redemptionProductTemplateSchema).default([]),
  /** Curated partner → partner transfer routes (Phase 3). */
  partnerTransferEdges: z.array(partnerTransferEdgeSchema).default([]),
  /** Active-window transfer bonuses applied at valuation time (Phase 3). */
  transferBonuses: z.array(transferBonusSchema).default([]),
});

export type ValuationCatalog = z.infer<typeof valuationCatalogSchema>;
