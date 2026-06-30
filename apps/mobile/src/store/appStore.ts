import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { emptyBalances } from "../constants/programs";
import type {
  CustomGoalCode,
  GoalPreference,
  RewardBalance,
} from "../types/models";
import { useAuthStore } from "./authStore";
import { useSavedOffersStore } from "./savedOffersStore";

type AppState = {
  hasCompletedOnboarding: boolean;
  goalPreference: GoalPreference;
  customGoalCode: CustomGoalCode | null;
  rewardBalances: RewardBalance[];
  setHasCompletedOnboarding: (v: boolean) => void;
  setGoalPreference: (v: GoalPreference) => void;
  setCustomGoalCode: (v: CustomGoalCode | null) => void;
  setProfileGoals: (
    goalPreference: GoalPreference,
    customGoalCode: CustomGoalCode | null,
  ) => void;
  setRewardBalances: (balances: RewardBalance[]) => void;
  resetOnboarding: () => void;
  clearAllData: () => Promise<void>;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      goalPreference: "KEEP_IT_SIMPLE",
      customGoalCode: null,
      rewardBalances: emptyBalances(),
      setHasCompletedOnboarding: (v) => set({ hasCompletedOnboarding: v }),
      setGoalPreference: (v) =>
        set({
          goalPreference: v,
          customGoalCode: v === "CUSTOM" ? get().customGoalCode : null,
        }),
      setCustomGoalCode: (v) => set({ customGoalCode: v }),
      setProfileGoals: (goalPreference, customGoalCode) =>
        set({
          goalPreference,
          customGoalCode: goalPreference === "CUSTOM" ? customGoalCode : null,
        }),
      setRewardBalances: (balances) => set({ rewardBalances: balances }),
      resetOnboarding: () => set({ hasCompletedOnboarding: false }),
      clearAllData: async () => {
        await useAuthStore.getState().clearMockRegistration();
        useSavedOffersStore.getState().clearSavedOffers();
        set({
          hasCompletedOnboarding: false,
          goalPreference: "KEEP_IT_SIMPLE",
          customGoalCode: null,
          rewardBalances: emptyBalances(),
        });
      },
    }),
    {
      name: "points-exchange-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        goalPreference: s.goalPreference,
        customGoalCode: s.customGoalCode,
        rewardBalances: s.rewardBalances,
      }),
    },
  ),
);
