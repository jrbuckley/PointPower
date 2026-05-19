import type { CreateSavedOfferInput, SavedOfferRef } from "@points-exchange/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureUserProfile } from "./profiles.js";

type SavedOfferRow = {
  id: string;
  offer_key: string;
  recommendation_id: string;
  created_at: string;
  remind_at: string | null;
};

function mapRow(row: SavedOfferRow): SavedOfferRef {
  return {
    id: row.id,
    offerKey: row.offer_key,
    recommendationId: row.recommendation_id as SavedOfferRef["recommendationId"],
    savedAt: row.created_at,
    remindAt: row.remind_at,
  };
}

export async function listSavedOffers(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedOfferRef[]> {
  const { data, error } = await supabase
    .from("saved_offers")
    .select("id, offer_key, recommendation_id, created_at, remind_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapRow(row as SavedOfferRow));
}

export async function createSavedOffer(
  supabase: SupabaseClient,
  userId: string,
  input: CreateSavedOfferInput,
): Promise<SavedOfferRef> {
  await ensureUserProfile(supabase, userId);

  const { data, error } = await supabase
    .from("saved_offers")
    .insert({
      user_id: userId,
      offer_key: input.offerKey,
      recommendation_id: input.recommendationId,
    })
    .select("id, offer_key, recommendation_id, created_at, remind_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: fetchError } = await supabase
        .from("saved_offers")
        .select("id, offer_key, recommendation_id, created_at, remind_at")
        .eq("user_id", userId)
        .eq("offer_key", input.offerKey)
        .single();

      if (fetchError) {
        throw fetchError;
      }
      return mapRow(existing as SavedOfferRow);
    }
    throw error;
  }

  return mapRow(data as SavedOfferRow);
}

export async function deleteSavedOffer(
  supabase: SupabaseClient,
  userId: string,
  savedOfferId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("saved_offers")
    .delete()
    .eq("id", savedOfferId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}
