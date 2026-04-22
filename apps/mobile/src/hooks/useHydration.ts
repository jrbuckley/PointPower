import { useEffect, useState } from "react";
import { useAppStore } from "../store/appStore";

export function useHydration(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useAppStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);

  return hydrated;
}
