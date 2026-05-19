import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";
import { useSavedOffersStore } from "../store/savedOffersStore";

export default function SettingsScreen() {
  const router = useRouter();
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const signOut = useAuthStore((s) => s.signOut);

  function onResetOnboarding() {
    Alert.alert(
      "Show onboarding again?",
      "You’ll see the intro flow the next time you open the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetOnboarding();
            refreshDashboardData();
            router.replace("/onboarding");
          },
        },
      ],
    );
  }

  function onClearData() {
    Alert.alert(
      "Clear all data?",
      "This removes your account session, balances, goals, and onboarding progress on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            refreshDashboardData();
            router.replace("/login");
          },
        },
      ],
    );
  }

  function onSignOut() {
    Alert.alert("Sign out?", "You can sign in again with the same email and password.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          useSavedOffersStore.getState().clearSavedOffers();
          refreshDashboardData();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.body}>
          Points value helps you understand what you already have—in dollars and
          simple tradeoffs—not sell you new cards.
        </Text>
        <Text style={styles.meta}>Version 1.0 (preview)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Redemptions</Text>
        <Pressable
          onPress={() => router.push("/saved-offers")}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.rowTitle}>Saved offers</Text>
          <Text style={styles.rowSub}>
            Bookmarked paths that update with your points and goals
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.rowTitle}>Sign out</Text>
          <Text style={styles.rowSub}>End this session</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/delete-account")}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.rowTitle, styles.danger]}>Delete account</Text>
          <Text style={styles.rowSub}>
            Permanently remove your account and data
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data on this device</Text>
        <Pressable
          onPress={onResetOnboarding}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.rowTitle}>Reset onboarding</Text>
          <Text style={styles.rowSub}>Show the welcome flow again</Text>
        </Pressable>
        <Pressable
          onPress={onClearData}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={[styles.rowTitle, styles.danger]}>Clear all data</Text>
          <Text style={styles.rowSub}>Remove balances and preferences</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
  meta: {
    marginTop: 12,
    fontSize: 13,
    color: "#9ca3af",
  },
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowPressed: { opacity: 0.92 },
  rowTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  danger: {
    color: "#b91c1c",
  },
  rowSub: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
});
