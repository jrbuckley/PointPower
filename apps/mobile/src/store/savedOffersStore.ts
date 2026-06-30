import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RecommendationId, SavedOfferRef } from "@points-exchange/shared";

type SavedOffersState = {
  refs: SavedOfferRef[];
  setRefs: (refs: SavedOfferRef[]) => void;
  addRef: (ref: SavedOfferRef) => void;
  removeRef: (id: string) => void;
  isOfferSaved: (offerKey: string) => boolean;
  clearSavedOffers: () => void;
};

export const useSavedOffersStore = create<SavedOffersState>()(
  persist(
    (set, get) => ({
      refs: [],
      setRefs: (refs) => set({ refs }),
      addRef: (ref) =>
        set((state) => {
          const without = state.refs.filter((r) => r.offerKey !== ref.offerKey);
          return { refs: [ref, ...without] };
        }),
      removeRef: (id) =>
        set((state) => ({
          refs: state.refs.filter((r) => r.id !== id),
        })),
      isOfferSaved: (offerKey) =>
        get().refs.some((r) => r.offerKey === offerKey),
      clearSavedOffers: () => set({ refs: [] }),
    }),
    {
      name: "points-exchange-saved-offers",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function localSavedOfferRef(
  offerKey: string,
  recommendationId: RecommendationId,
): SavedOfferRef {
  return {
    id: `local-${offerKey}-${Date.now()}`,
    offerKey,
    recommendationId,
    savedAt: new Date().toISOString(),
    remindAt: null,
  };
}
