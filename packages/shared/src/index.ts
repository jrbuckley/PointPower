import { z } from "zod";

/** How a balance is denominated (extend as you add programs). */
export const rewardUnitSchema = z.enum([
  "points",
  "miles",
  "cash_back",
  "other",
]);

export type RewardUnit = z.infer<typeof rewardUnitSchema>;

/**
 * Manual program entry — user-typed balances before any issuer linking exists.
 * `programKey` is a stable id you choose (e.g. "chase_ur", "amex_mr") for rules later.
 */
export const manualProgramEntrySchema = z.object({
  id: z.string().uuid(),
  programKey: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_]+$/, "use lowercase snake_case, e.g. chase_ur"),
  displayName: z.string().min(1).max(120),
  balance: z.string().regex(/^\d+(\.\d{1,4})?$/, "non-negative decimal string"),
  unit: rewardUnitSchema,
  notes: z.string().max(2000).optional(),
  updatedAt: z.string().datetime(),
});

export type ManualProgramEntry = z.infer<typeof manualProgramEntrySchema>;

export const createManualProgramInputSchema = manualProgramEntrySchema.omit({
  id: true,
  updatedAt: true,
});

export type CreateManualProgramInput = z.infer<
  typeof createManualProgramInputSchema
>;

/**
 * Placeholder for a future linked issuer account (OAuth / partner API).
 * Not used in v1 — kept so API and mobile can evolve without breaking types.
 */
export const linkedAccountStubSchema = z.object({
  provider: z.enum(["issuer_oauth", "aggregator"]),
  externalId: z.string().min(1),
  linkedAt: z.string().datetime(),
  status: z.enum(["active", "revoked", "error"]),
});

export type LinkedAccountStub = z.infer<typeof linkedAccountStubSchema>;

/** Stable program codes aligned with `reward_programs.code` in Postgres. */
export const rewardProgramCodeSchema = z.enum([
  "amex_mr",
  "chase_ur",
  "capital_one_miles",
  "citi_ty",
  "cashback",
]);

export type RewardProgramCode = z.infer<typeof rewardProgramCodeSchema>;

export const rewardProgramSchema = z.object({
  id: z.string().uuid(),
  code: rewardProgramCodeSchema,
  name: z.string(),
  issuer: z.string().nullable(),
  pointName: z.string().nullable(),
  isActive: z.boolean(),
});

export type RewardProgram = z.infer<typeof rewardProgramSchema>;

export const rewardAccountSourceSchema = z.enum([
  "manual",
  "linked",
  "linked_mock",
]);

export type RewardAccountSource = z.infer<typeof rewardAccountSourceSchema>;

export const userRewardAccountSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  programCode: rewardProgramCodeSchema,
  programName: z.string(),
  balance: z.number().int().nonnegative(),
  source: rewardAccountSourceSchema,
  lastUpdatedAt: z.string(),
});

export type UserRewardAccount = z.infer<typeof userRewardAccountSchema>;

export const createRewardAccountInputSchema = z.object({
  programCode: rewardProgramCodeSchema,
  balance: z.number().int().nonnegative(),
});

export type CreateRewardAccountInput = z.infer<
  typeof createRewardAccountInputSchema
>;

export const updateRewardAccountInputSchema = z.object({
  balance: z.number().int().nonnegative(),
});

export type UpdateRewardAccountInput = z.infer<
  typeof updateRewardAccountInputSchema
>;

export const syncRewardAccountsInputSchema = z.object({
  accounts: z.array(
    z.object({
      programCode: rewardProgramCodeSchema,
      balance: z.number().int().nonnegative(),
    }),
  ),
});

export type SyncRewardAccountsInput = z.infer<typeof syncRewardAccountsInputSchema>;

export const linkedAccountsStatusSchema = z.object({
  featureStatus: z.enum(["unavailable", "coming_soon", "mock_preview"]),
  connections: z.array(linkedAccountStubSchema),
});

export type LinkedAccountsStatus = z.infer<typeof linkedAccountsStatusSchema>;

export const mockLinkPreviewAccountSchema = z.object({
  programCode: rewardProgramCodeSchema,
  programName: z.string(),
  balance: z.number().int().nonnegative(),
});

export type MockLinkPreviewAccount = z.infer<typeof mockLinkPreviewAccountSchema>;

export const mockLinkConnectInputSchema = z.object({
  provider: z.enum(["issuer_oauth", "aggregator"]),
});

export type MockLinkConnectInput = z.infer<typeof mockLinkConnectInputSchema>;

export const mockLinkConnectResponseSchema = z.object({
  connection: linkedAccountStubSchema,
  message: z.string(),
  previewAccounts: z.array(mockLinkPreviewAccountSchema),
});

export type MockLinkConnectResponse = z.infer<
  typeof mockLinkConnectResponseSchema
>;

/** Aligned with `goal_preference` enum on `users_profile`. */
export const goalPreferenceSchema = z.enum([
  "MAX_VALUE",
  "KEEP_IT_SIMPLE",
  "TRAVEL_FOCUSED",
  "CASHLIKE",
  "CUSTOM",
]);

export type GoalPreference = z.infer<typeof goalPreferenceSchema>;

/**
 * Refined redemption focus when `goalPreference` is CUSTOM.
 * Distinct from future TRAVEL_FOCUSED "trip experience" planning.
 */
export const customGoalCodeSchema = z.enum([
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

export type CustomGoalCode = z.infer<typeof customGoalCodeSchema>;

export const CUSTOM_GOAL_CODES = customGoalCodeSchema.options;

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().nullable(),
  goalPreference: goalPreferenceSchema,
  customGoalCode: customGoalCodeSchema.nullable(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateUserProfileInputSchema = z
  .object({
    goalPreference: goalPreferenceSchema,
    customGoalCode: customGoalCodeSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.goalPreference === "CUSTOM" && !data.customGoalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customGoalCode is required when goalPreference is CUSTOM.",
        path: ["customGoalCode"],
      });
    }
    if (data.goalPreference !== "CUSTOM" && data.customGoalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "customGoalCode must be null unless goalPreference is CUSTOM.",
        path: ["customGoalCode"],
      });
    }
  });

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

export const recommendationIdSchema = z.enum([
  "MOST_EFFECTIVE",
  "LEAST_HASSLE",
  "LIMITED_TIME",
  "TRAVEL_PORTAL",
  "SIMPLE_CASH",
  /** @deprecated Legacy ids still accepted for saved offers and old links */
  "BEST_VALUE",
  "EASIEST",
  "BEST_FOR_TRAVEL",
]);

export type RecommendationId = z.infer<typeof recommendationIdSchema>;

export const savedOfferRefSchema = z.object({
  id: z.string().uuid(),
  offerKey: z.string().min(1).max(128),
  recommendationId: recommendationIdSchema,
  savedAt: z.string(),
  remindAt: z.string().nullable().optional(),
});

export type SavedOfferRef = z.infer<typeof savedOfferRefSchema>;

export const createSavedOfferInputSchema = z.object({
  offerKey: z.string().min(1).max(128),
  recommendationId: recommendationIdSchema,
});

export type CreateSavedOfferInput = z.infer<typeof createSavedOfferInputSchema>;

export const savedOfferStatusSchema = z.enum([
  "active",
  "expired",
  "unavailable",
]);

export type SavedOfferStatus = z.infer<typeof savedOfferStatusSchema>;

export {
  redemptionMethodCodeSchema,
  valuationRuleSchema,
  redemptionOfferTemplateSchema,
  goalRedemptionTargetSchema,
  valuationCatalogSchema,
  type RedemptionMethodCode,
  type ValuationRule,
  type RedemptionOfferTemplate,
  type GoalRedemptionTarget,
  type ValuationCatalog,
} from "./valuations.js";
