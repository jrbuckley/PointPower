import { useEffect } from "react";
import { isApiConfigured } from "../lib/apiClient";
import { fetchProfile } from "../lib/profileApi";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

/** Loads profile goals from the API when the user is signed in. */
export function useProfileFromApi(enabled: boolean) {
  const user = useAuthStore((s) => s.user);
  const setProfileGoals = useAppStore((s) => s.setProfileGoals);

  useEffect(() => {
    if (!enabled || !user || !isApiConfigured()) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const profile = await fetchProfile();
        if (!cancelled) {
          setProfileGoals(profile.goalPreference, profile.customGoalCode);
        }
      } catch {
        // Keep local preference if the API is unreachable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, user?.id, setProfileGoals]);
}
