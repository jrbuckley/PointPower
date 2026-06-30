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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const setHasCompletedOnboarding = useAppStore(
    (s) => s.setHasCompletedOnboarding,
  );

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    const result = await signUp({
      email,
      password,
      displayName: displayName.trim() || undefined,
    });
    setSubmitting(false);
    if (result.outcome === "error") {
      setError(result.message);
      return;
    }
    if (result.outcome === "check_email") {
      setHasCompletedOnboarding(false);
      router.replace({
        pathname: "/verify-email",
        params: { email: result.email },
      });
      return;
    }
    setHasCompletedOnboarding(false);
    router.replace("/onboarding");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.brand}>Create account</Text>
        <Text style={styles.lead}>
          Create your account. We’ll email you a link if your project requires email
          verification.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Display name (optional)</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder="Alex"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>
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
            placeholder="At least 6 characters"
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
          accessibilityLabel="Create account"
        >
          <LoadingButtonLabel
            loading={submitting}
            label="Create account"
            loadingLabel="Creating account…"
          />
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.link}>Sign in</Text>
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
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 24,
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
