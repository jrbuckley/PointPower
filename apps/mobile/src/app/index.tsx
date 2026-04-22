import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useHydration } from "../hooks/useHydration";
import { useAppStore } from "../store/appStore";

export default function Index() {
  const hydrated = useHydration();
  const hasCompletedOnboarding = useAppStore(
    (s) => s.hasCompletedOnboarding,
  );

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
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
  },
});
