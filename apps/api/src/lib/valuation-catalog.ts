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

type IssuerTransferPartnerRow = {
  transfer_ratio_num: number;
  transfer_ratio_den: number;
  reward_programs: { code: string } | null;
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
  redemption_product_key: string | null;
};

type RedemptionProductRow = {
  product_key: string;
  points_required: number;
  cash_value_usd: number;
  title: string;
  sort_order: number;
  redemption_methods: { code: string } | null | { code: string }[];
  reward_programs: { code: string } | null | { code: string }[];
  transfer_partners: { code: string } | null | { code: string }[];
  highlight_goal_preference: string | null;
  highlight_custom_goal_code: string | null;
};

type GoalTargetRow = {
  goal_preference: string | null;
  custom_goal_code: string | null;
  label_suffix: string;
  points_required: number;
  cash_value_usd: number;
};

type PartnerTransferEdgeRow = {
  transfer_ratio_num: number;
  transfer_ratio_den: number;
  min_transfer_points: number | null;
  transfer_delay_hours: number;
  is_active: boolean;
  from_partner: { code: string } | null | { code: string }[];
  to_partner: { code: string } | null | { code: string }[];
};

type TransferBonusRow = {
  bonus_percent: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  reward_programs: { code: string } | null | { code: string }[];
  from_partner: { code: string } | null | { code: string }[];
  to_partner: { code: string } | null | { code: string }[];
};

function firstRelation<T extends { code: string }>(
  value: T | T[] | null | undefined,
): T | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export async function loadValuationCatalog(
  supabase: SupabaseClient,
): Promise<ValuationCatalog> {
  const [
    rulesRes,
    offersRes,
    targetsRes,
    transferPartnersRes,
    productsRes,
    partnerEdgesRes,
    bonusesRes,
  ] = await Promise.all([
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
        sort_order,
        redemption_product_key
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
      supabase.from("reward_program_transfer_partners").select(
        `
        transfer_ratio_num,
        transfer_ratio_den,
        reward_programs ( code ),
        transfer_partners ( code )
      `,
      ),
      supabase
        .from("redemption_products")
        .select(
          `
        product_key,
        points_required,
        cash_value_usd,
        title,
        sort_order,
        highlight_goal_preference,
        highlight_custom_goal_code,
        redemption_methods ( code ),
        reward_programs ( code ),
        transfer_partners ( code )
      `,
        )
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("partner_transfer_edges")
        .select(
          `
        transfer_ratio_num,
        transfer_ratio_den,
        min_transfer_points,
        transfer_delay_hours,
        is_active,
        from_partner:transfer_partners!from_partner_id ( code ),
        to_partner:transfer_partners!to_partner_id ( code )
      `,
        )
        .eq("is_active", true),
      supabase
        .from("transfer_bonuses")
        .select(
          `
        bonus_percent,
        starts_at,
        ends_at,
        is_active,
        reward_programs ( code ),
        from_partner:transfer_partners!from_partner_id ( code ),
        to_partner:transfer_partners!to_partner_id ( code )
      `,
        )
        .eq("is_active", true),
    ]);

  if (rulesRes.error) throw rulesRes.error;
  if (offersRes.error) throw offersRes.error;
  if (targetsRes.error) throw targetsRes.error;
  if (transferPartnersRes.error) throw transferPartnersRes.error;
  if (productsRes.error) throw productsRes.error;
  if (partnerEdgesRes.error) throw partnerEdgesRes.error;
  if (bonusesRes.error) throw bonusesRes.error;

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
      redemptionProductKey: row.redemption_product_key ?? null,
    })),
    goalTargets: ((targetsRes.data ?? []) as GoalTargetRow[]).map((row) => ({
      goalPreference: row.goal_preference as ValuationCatalog["goalTargets"][0]["goalPreference"],
      customGoalCode: row.custom_goal_code as ValuationCatalog["goalTargets"][0]["customGoalCode"],
      labelSuffix: row.label_suffix,
      pointsRequired: row.points_required,
      cashValueUsd: Number(row.cash_value_usd),
    })),
    issuerTransferEdges: ((transferPartnersRes.data ?? []) as unknown as IssuerTransferPartnerRow[])
      .map((row) => {
        const program = Array.isArray(row.reward_programs)
          ? row.reward_programs[0]
          : row.reward_programs;
        const partner = Array.isArray(row.transfer_partners)
          ? row.transfer_partners[0]
          : row.transfer_partners;
        const pc = program?.code;
        const partnerCode = partner?.code;
        if (!pc || !partnerCode) return null;
        return {
          rewardProgramCode: pc,
          partnerCode,
          transferRatioNum: Number(row.transfer_ratio_num),
          transferRatioDen: Number(row.transfer_ratio_den),
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null),
    redemptionProducts: ((productsRes.data ?? []) as unknown as RedemptionProductRow[])
      .map((row) => {
        const method = Array.isArray(row.redemption_methods)
          ? row.redemption_methods[0]
          : row.redemption_methods;
        const program = Array.isArray(row.reward_programs)
          ? row.reward_programs[0]
          : row.reward_programs;
        const partner = Array.isArray(row.transfer_partners)
          ? row.transfer_partners[0]
          : row.transfer_partners;
        const methodCode = method?.code;
        if (!methodCode) return null;
        return {
          productKey: row.product_key,
          redemptionMethodCode:
            methodCode as ValuationCatalog["redemptionProducts"][0]["redemptionMethodCode"],
          rewardProgramCode: program?.code ?? null,
          partnerCode: partner?.code ?? null,
          title: row.title,
          pointsRequired: row.points_required,
          cashValueUsd: Number(row.cash_value_usd),
          highlightGoalPreference: row.highlight_goal_preference as ValuationCatalog["redemptionProducts"][0]["highlightGoalPreference"],
          highlightCustomGoalCode: row.highlight_custom_goal_code as ValuationCatalog["redemptionProducts"][0]["highlightCustomGoalCode"],
          sortOrder: row.sort_order,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null),
    partnerTransferEdges: (
      (partnerEdgesRes.data ?? []) as unknown as PartnerTransferEdgeRow[]
    )
      .map((row) => {
        const from = firstRelation(row.from_partner);
        const to = firstRelation(row.to_partner);
        if (!from?.code || !to?.code) return null;
        return {
          fromPartnerCode: from.code,
          toPartnerCode: to.code,
          transferRatioNum: Number(row.transfer_ratio_num),
          transferRatioDen: Number(row.transfer_ratio_den),
          minTransferPoints: row.min_transfer_points,
          transferDelayHours: Number(row.transfer_delay_hours),
          isActive: row.is_active,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null),
    transferBonuses: ((bonusesRes.data ?? []) as unknown as TransferBonusRow[])
      .map((row) => {
        const to = firstRelation(row.to_partner);
        if (!to?.code) return null;
        const program = firstRelation(row.reward_programs);
        const fromPartner = firstRelation(row.from_partner);
        return {
          rewardProgramCode: program?.code ?? null,
          fromPartnerCode: fromPartner?.code ?? null,
          toPartnerCode: to.code,
          bonusPercent: Number(row.bonus_percent),
          startsAt: row.starts_at,
          endsAt: row.ends_at,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b !== null),
  };

  return valuationCatalogSchema.parse(catalog);
}
