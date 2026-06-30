import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

/** True when both persisted stores have finished rehydrating from AsyncStorage. */
export function useStoresHydrated(): boolean {
  const [ready, setReady] = useState(() => {
    return useAppStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated();
  });

  useEffect(() => {
    if (useAppStore.persist.hasHydrated() && useAuthStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsubApp = useAppStore.persist.onFinishHydration(() => {
      if (useAuthStore.persist.hasHydrated()) setReady(true);
    });
    const unsubAuth = useAuthStore.persist.onFinishHydration(() => {
      if (useAppStore.persist.hasHydrated()) setReady(true);
    });
    return () => {
      unsubApp();
      unsubAuth();
    };
  }, []);

  return ready;
}
