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
