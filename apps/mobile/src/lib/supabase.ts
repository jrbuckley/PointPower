import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
/** Prefer publishable key; fall back to legacy anon JWT during migration. */
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseKey);
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
