import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

/**
 * Stack back from screens opened from the dashboard. Uses router.back() when
 * possible; otherwise replace to dashboard (e.g. when history was reset).
 */
export function DashboardBackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to dashboard"
      hitSlop={12}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/dashboard");
        }
      }}
      style={styles.row}
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.label}>Dashboard</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  chevron: {
    fontSize: 34,
    fontWeight: "300",
    color: "#2563eb",
    marginTop: -2,
    marginRight: 2,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2563eb",
  },
});
