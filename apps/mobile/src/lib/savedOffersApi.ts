import type {
  CreateSavedOfferInput,
  RecommendationId,
  SavedOfferRef,
} from "@points-exchange/shared";
import { apiFetch } from "./apiClient";

export async function fetchSavedOfferRefs(): Promise<SavedOfferRef[]> {
  const data = await apiFetch<{ saved: SavedOfferRef[] }>("/api/v1/saved-offers");
  return data.saved;
}

export async function createSavedOfferApi(
  input: CreateSavedOfferInput,
): Promise<SavedOfferRef> {
  const data = await apiFetch<{ saved: SavedOfferRef }>("/api/v1/saved-offers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.saved;
}

export async function deleteSavedOfferApi(savedOfferId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/saved-offers/${savedOfferId}`, {
    method: "DELETE",
  });
}

export function toCreateSavedOfferInput(
  offerKey: string,
  recommendationId: string,
): CreateSavedOfferInput {
  return {
    offerKey,
    recommendationId: recommendationId as RecommendationId,
  };
}
