import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingButtonLabel } from "../components/loading/LoadingButtonLabel";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (!hasCompletedOnboarding) {
      router.replace("/onboarding");
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.brand}>PointPower</Text>
        <Text style={styles.lead}>Sign in to continue.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Your password"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitting}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            submitting && styles.ctaDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <LoadingButtonLabel
            loading={submitting}
            label="Sign in"
            loadingLabel="Signing in…"
          />
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Link href="/sign-up" asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f6f7fb" },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  error: {
    color: "#b91c1c",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  ctaPressed: { opacity: 0.92 },
  ctaDisabled: { opacity: 0.7 },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    color: "#4b5563",
  },
  link: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
});
