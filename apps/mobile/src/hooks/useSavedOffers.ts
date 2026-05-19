import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { buildGoalContext } from "../lib/goalContext";
import { hydrateSavedOffersFromApi } from "../lib/savedOffersService";
import {
  resolveSavedOffers,
  type SavedOfferEntry,
} from "../lib/recommendationDetail";
import { isApiConfigured } from "../lib/apiClient";
import { useSavedOffersStore } from "../store/savedOffersStore";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

export function useSavedOffersHydration(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState(
    () => enabled && isApiConfigured() && Boolean(user),
  );

  useEffect(() => {
    if (!enabled || !user || !isApiConfigured()) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        await hydrateSavedOffersFromApi();
      } catch {
        // Keep local saved offers if API is unreachable.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user?.id]);

  return { isLoading };
}

export function useResolvedSavedOffers() {
  const refs = useSavedOffersStore((s) => s.refs);
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const goalPreference = useAppStore((s) => s.goalPreference);
  const customGoalCode = useAppStore((s) => s.customGoalCode);
  const goal = buildGoalContext(goalPreference, customGoalCode);

  return useQuery({
    queryKey: ["saved-offers", refs, rewardBalances, goal] as const,
    queryFn: (): SavedOfferEntry[] =>
      resolveSavedOffers(refs, rewardBalances, goal),
    placeholderData: (previous) => previous,
  });
}
