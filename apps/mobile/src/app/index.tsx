import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LoadingSpinner } from "../components/loading/LoadingSpinner";
import { useAppBootstrapReady } from "../hooks/useAppBootstrapReady";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const hydrated = useAppBootstrapReady();
  const user = useAuthStore((s) => s.user);
  const hasCompletedOnboarding = useAppStore(
    (s) => s.hasCompletedOnboarding,
  );

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <Text style={styles.brand}>PointPower</Text>
        <LoadingSpinner message="Getting things ready…" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/dashboard" />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f7fb",
    paddingHorizontal: 32,
  },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
});
