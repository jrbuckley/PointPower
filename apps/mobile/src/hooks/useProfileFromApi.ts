import { useEffect, useState } from "react";
import { isApiConfigured } from "../lib/apiClient";
import { fetchProfile } from "../lib/profileApi";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

/** Loads profile goals from the API when the user is signed in. */
export function useProfileFromApi(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const setProfileGoals = useAppStore((s) => s.setProfileGoals);
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
        const profile = await fetchProfile();
        if (!cancelled) {
          setProfileGoals(profile.goalPreference, profile.customGoalCode);
        }
      } catch {
        // Keep local preference if the API is unreachable.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user?.id, setProfileGoals]);

  return { isLoading };
}
