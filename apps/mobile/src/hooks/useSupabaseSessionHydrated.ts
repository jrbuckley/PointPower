import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

/**
 * When Supabase is configured, waits until the first `getSession` completes and
 * keeps the auth store in sync via `onAuthStateChange`. When not configured, always true.
 */
export function useSupabaseSessionHydrated(): boolean {
  const [ready, setReady] = useState(() => !isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const sync = useAuthStore.getState().syncFromSupabaseSession;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return;
        sync(session);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      sync(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return ready;
}
