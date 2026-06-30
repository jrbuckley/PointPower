import { useStoresHydrated } from "./useStoresHydrated";
import { useSupabaseSessionHydrated } from "./useSupabaseSessionHydrated";

/** Zustand rehydration + (if applicable) first Supabase `getSession` for routing. */
export function useAppBootstrapReady(): boolean {
  const storesHydrated = useStoresHydrated();
  const supabaseSessionHydrated = useSupabaseSessionHydrated();
  return storesHydrated && supabaseSessionHydrated;
}
