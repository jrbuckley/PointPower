import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DeleteAccountReasonCode } from "../constants/deleteAccountReasons";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type MockUser = {
  id: string;
  email: string;
  displayName: string | null;
};

/** Mock-only: persisted when Supabase is not configured. */
type RegisteredMockAccount = {
  user: MockUser;
  password: string;
};

export type SignUpResult =
  | { outcome: "success" }
  | { outcome: "check_email"; email: string }
  | { outcome: "error"; message: string };

type AuthState = {
  user: MockUser | null;
  registeredAccount: RegisteredMockAccount | null;
  syncFromSupabaseSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signUp: (input: {
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  clearMockRegistration: () => Promise<void>;
  deleteAccount: (input: {
    reasonCode: DeleteAccountReasonCode;
    reasonDetail?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function sessionToUser(session: Session | null): MockUser | null {
  if (!session?.user) return null;
  const u = session.user;
  const meta = u.user_metadata as { display_name?: string; full_name?: string } | undefined;
  const displayName =
    meta?.display_name?.trim() ||
    meta?.full_name?.trim() ||
    null;
  return {
    id: u.id,
    email: u.email ?? "",
    displayName,
  };
}

function authErrorMessage(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return "Incorrect email or password.";
  }
  return message;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      registeredAccount: null,

      syncFromSupabaseSession(session) {
        set({ user: sessionToUser(session) });
      },

      async signIn(email, password) {
        const e = normalizeEmail(email);
        if (!isValidEmail(e)) {
          return { ok: false, error: "Enter a valid email address." };
        }
        if (!password.trim()) {
          return { ok: false, error: "Enter your password." };
        }

        if (isSupabaseConfigured() && supabase) {
          const { error } = await supabase.auth.signInWithPassword({
            email: e,
            password,
          });
          if (error) {
            return { ok: false, error: authErrorMessage(error.message) };
          }
          return { ok: true };
        }

        await delay(400);
        const reg = get().registeredAccount;
        if (!reg) {
          return { ok: false, error: "No account found. Create one first." };
        }
        if (reg.user.email !== e) {
          return {
            ok: false,
            error: "No account for that email. Use the email you signed up with.",
          };
        }
        if (reg.password !== password) {
          return { ok: false, error: "Incorrect password." };
        }
        set({ user: reg.user });
        return { ok: true };
      },

      async signUp({ email, password, displayName }) {
        const e = normalizeEmail(email);
        if (!isValidEmail(e)) {
          return { outcome: "error", message: "Enter a valid email address." };
        }
        if (password.length < 6) {
          return { outcome: "error", message: "Password must be at least 6 characters." };
        }
        const name = displayName?.trim() || null;

        if (isSupabaseConfigured() && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email: e,
            password,
            options: {
              data: name ? { display_name: name } : undefined,
            },
          });
          if (error) {
            return { outcome: "error", message: error.message };
          }
          if (!data.session && data.user) {
            return { outcome: "check_email", email: e };
          }
          if (!data.session) {
            return {
              outcome: "error",
              message: "Could not complete sign-up. Try again or contact support.",
            };
          }
          return { outcome: "success" };
        }

        await delay(500);
        const user: MockUser = {
          id: `mock_${Date.now()}`,
          email: e,
          displayName: name,
        };
        set({
          user,
          registeredAccount: { user, password },
        });
        return { outcome: "success" };
      },

      async signOut() {
        if (isSupabaseConfigured() && supabase) {
          await supabase.auth.signOut();
        }
        set({ user: null });
      },

      async clearMockRegistration() {
        if (isSupabaseConfigured() && supabase) {
          await supabase.auth.signOut();
        }
        set({ user: null, registeredAccount: null });
      },

      async deleteAccount({ reasonCode, reasonDetail }) {
        const detail = reasonDetail?.trim() || null;

        if (isSupabaseConfigured() && supabase) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          const email = session?.user?.email ?? null;
          if (!uid) {
            return { ok: false, error: "You must be signed in to delete your account." };
          }

          const { error: feedbackError } = await supabase
            .from("account_deletion_feedback")
            .insert({
              user_id: uid,
              user_email: email,
              reason_code: reasonCode,
              reason_detail: detail,
            });
          if (feedbackError) {
            return { ok: false, error: feedbackError.message };
          }

          const { error: deleteError } = await supabase.rpc("delete_own_account");
          if (deleteError) {
            return { ok: false, error: deleteError.message };
          }

          await supabase.auth.signOut();
          set({ user: null, registeredAccount: null });
          return { ok: true };
        }

        await delay(400);
        set({ user: null, registeredAccount: null });
        return { ok: true };
      },
    }),
    {
      name: "points-exchange-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        if (isSupabaseConfigured()) {
          return {};
        }
        return {
          user: state.user,
          registeredAccount: state.registeredAccount,
        };
      },
    },
  ),
);
