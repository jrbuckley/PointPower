import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const displayEmail =
    typeof email === "string" && email.trim().length > 0 ? email.trim() : "your email";

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.mailMark}>@</Text>
      </View>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.body}>
        We sent a verification link to{" "}
        <Text style={styles.email}>{displayEmail}</Text>. Open that message and tap
        the link to activate your account, then come back to sign in.
      </Text>
      <Text style={styles.hint}>
        Didn’t get it? Check spam or promotions, or wait a minute and try signing up
        again with the same address.
      </Text>

      <Pressable
        onPress={() => router.replace("/login")}
        style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
        accessibilityRole="button"
        accessibilityLabel="Continue to sign in"
      >
        <Text style={styles.primaryText}>Continue to sign in</Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/sign-up")}
        style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
        accessibilityRole="button"
        accessibilityLabel="Use a different email"
      >
        <Text style={styles.secondaryText}>Use a different email</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  mailMark: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563eb",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 14,
  },
  body: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 12,
  },
  email: {
    fontWeight: "700",
    color: "#1e40af",
  },
  hint: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 28,
  },
  primary: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryPressed: { opacity: 0.92 },
  primaryText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  secondary: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryPressed: { opacity: 0.85 },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
});
