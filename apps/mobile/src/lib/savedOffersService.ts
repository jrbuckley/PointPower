import type { RecommendationId, SavedOfferRef } from "@points-exchange/shared";
import {
  createSavedOfferApi,
  deleteSavedOfferApi,
  fetchSavedOfferRefs,
  toCreateSavedOfferInput,
} from "./savedOffersApi";
import { isApiConfigured } from "./apiClient";
import {
  localSavedOfferRef,
  useSavedOffersStore,
} from "../store/savedOffersStore";

export async function hydrateSavedOffersFromApi(): Promise<void> {
  if (!isApiConfigured()) return;

  const refs = await fetchSavedOfferRefs();
  useSavedOffersStore.getState().setRefs(refs);
}

export async function saveOffer(
  offerKey: string,
  recommendationId: RecommendationId,
): Promise<SavedOfferRef> {
  if (isApiConfigured()) {
    const saved = await createSavedOfferApi(
      toCreateSavedOfferInput(offerKey, recommendationId),
    );
    useSavedOffersStore.getState().addRef(saved);
    return saved;
  }

  const local = localSavedOfferRef(offerKey, recommendationId);
  useSavedOffersStore.getState().addRef(local);
  return local;
}

export async function unsaveOffer(savedOfferId: string): Promise<void> {
  if (isApiConfigured() && !savedOfferId.startsWith("local-")) {
    await deleteSavedOfferApi(savedOfferId);
  }
  useSavedOffersStore.getState().removeRef(savedOfferId);
}

export async function toggleSaveOffer(
  offerKey: string,
  recommendationId: RecommendationId,
): Promise<{ saved: boolean; ref?: SavedOfferRef }> {
  const store = useSavedOffersStore.getState();
  const existing = store.refs.find((r) => r.offerKey === offerKey);

  if (existing) {
    await unsaveOffer(existing.id);
    return { saved: false };
  }

  const ref = await saveOffer(offerKey, recommendationId);
  return { saved: true, ref };
}
