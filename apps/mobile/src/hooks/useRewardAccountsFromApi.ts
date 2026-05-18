import { useEffect, useState } from "react";
import { isApiConfigured } from "../lib/apiClient";
import { fetchRewardAccounts } from "../lib/rewardAccountsApi";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

/** Loads reward balances from the API when the user is signed in. */
export function useRewardAccountsFromApi(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const setRewardBalances = useAppStore((s) => s.setRewardBalances);
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
        const balances = await fetchRewardAccounts();
        if (!cancelled) {
          setRewardBalances(balances);
        }
      } catch {
        // Keep local balances if the API is unreachable.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user?.id, setRewardBalances]);

  return { isLoading };
}
