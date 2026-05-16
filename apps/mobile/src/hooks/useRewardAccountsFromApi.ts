import { useEffect } from "react";
import { isApiConfigured } from "../lib/apiClient";
import { fetchRewardAccounts } from "../lib/rewardAccountsApi";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

/** Loads reward balances from the API when the user is signed in. */
export function useRewardAccountsFromApi(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const setRewardBalances = useAppStore((s) => s.setRewardBalances);

  useEffect(() => {
    if (!enabled || !user || !isApiConfigured()) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const balances = await fetchRewardAccounts();
        if (!cancelled) {
          setRewardBalances(balances);
        }
      } catch {
        // Keep local balances if the API is unreachable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user?.id, setRewardBalances]);
}
