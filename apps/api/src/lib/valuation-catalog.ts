import {
  valuationCatalogSchema,
  type ValuationCatalog,
} from "@points-exchange/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

type ValuationRuleRow = {
  min_cpp: number;
  max_cpp: number;
  typical_cpp: number;
  difficulty: string | null;
  title: string | null;
  reward_programs: { code: string } | null;
  redemption_methods: { code: string } | null;
  transfer_partners: { code: string } | null;
};

type OfferRow = {
  offer_key: string;
  redemption_method_code: string;
  reward_program_code: string | null;
  title: string;
  partner_name: string;
  points_required: number;
  estimated_cash_value_usd: number;
  expires_in_days: number;
  availability_note: string;
  highlight_label: string | null;
  highlight_goal_preference: string | null;
  highlight_custom_goal_code: string | null;
  sort_order: number;
};

type GoalTargetRow = {
  goal_preference: string | null;
  custom_goal_code: string | null;
  label_suffix: string;
  points_required: number;
  cash_value_usd: number;
};

export async function loadValuationCatalog(
  supabase: SupabaseClient,
): Promise<ValuationCatalog> {
  const [rulesRes, offersRes, targetsRes] = await Promise.all([
    supabase
      .from("valuation_rules")
      .select(
        `
        min_cpp,
        max_cpp,
        typical_cpp,
        difficulty,
        title,
        reward_programs ( code ),
        redemption_methods ( code ),
        transfer_partners ( code )
      `,
      )
      .order("typical_cpp", { ascending: false }),
    supabase
      .from("redemption_offers")
      .select(
        `
        offer_key,
        redemption_method_code,
        reward_program_code,
        title,
        partner_name,
        points_required,
        estimated_cash_value_usd,
        expires_in_days,
        availability_note,
        highlight_label,
        highlight_goal_preference,
        highlight_custom_goal_code,
        sort_order
      `,
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase.from("goal_redemption_targets").select(
      `
        goal_preference,
        custom_goal_code,
        label_suffix,
        points_required,
        cash_value_usd
      `,
    ),
  ]);

  if (rulesRes.error) throw rulesRes.error;
  if (offersRes.error) throw offersRes.error;
  if (targetsRes.error) throw targetsRes.error;

  const catalog: ValuationCatalog = {
    valuationRules: ((rulesRes.data ?? []) as unknown as ValuationRuleRow[]).map((row) => {
      const program = Array.isArray(row.reward_programs)
        ? row.reward_programs[0]
        : row.reward_programs;
      const method = Array.isArray(row.redemption_methods)
        ? row.redemption_methods[0]
        : row.redemption_methods;
      const partner = Array.isArray(row.transfer_partners)
        ? row.transfer_partners[0]
        : row.transfer_partners;
      return {
      rewardProgramCode: program?.code ?? "chase_ur",
      redemptionMethodCode: method?.code as ValuationCatalog["valuationRules"][0]["redemptionMethodCode"],
      transferPartnerCode: partner?.code ?? null,
      minCpp: Number(row.min_cpp),
      maxCpp: Number(row.max_cpp),
      typicalCpp: Number(row.typical_cpp),
      difficulty: row.difficulty,
      title: row.title,
    };
    }),
    offers: ((offersRes.data ?? []) as OfferRow[]).map((row) => ({
      offerKey: row.offer_key,
      redemptionMethodCode: row.redemption_method_code as ValuationCatalog["offers"][0]["redemptionMethodCode"],
      rewardProgramCode: row.reward_program_code,
      title: row.title,
      partnerName: row.partner_name,
      pointsRequired: row.points_required,
      estimatedCashValueUsd: Number(row.estimated_cash_value_usd),
      expiresInDays: row.expires_in_days,
      availabilityNote: row.availability_note,
      highlightLabel: row.highlight_label,
      highlightGoalPreference: row.highlight_goal_preference as ValuationCatalog["offers"][0]["highlightGoalPreference"],
      highlightCustomGoalCode: row.highlight_custom_goal_code as ValuationCatalog["offers"][0]["highlightCustomGoalCode"],
      sortOrder: row.sort_order,
    })),
    goalTargets: ((targetsRes.data ?? []) as GoalTargetRow[]).map((row) => ({
      goalPreference: row.goal_preference as ValuationCatalog["goalTargets"][0]["goalPreference"],
      customGoalCode: row.custom_goal_code as ValuationCatalog["goalTargets"][0]["customGoalCode"],
      labelSuffix: row.label_suffix,
      pointsRequired: row.points_required,
      cashValueUsd: Number(row.cash_value_usd),
    })),
  };

  return valuationCatalogSchema.parse(catalog);
}
