import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import type { GoalPreference } from "../types/models";
import { useAppStore } from "../store/appStore";

const OPTIONS: { value: GoalPreference; title: string; subtitle: string }[] = [
  {
    value: "MAX_VALUE",
    title: "Maximize value",
    subtitle: "Favor options that usually pay the most per point.",
  },
  {
    value: "KEEP_IT_SIMPLE",
    title: "Keep it simple",
    subtitle: "Prefer straightforward paths with fewer steps.",
  },
  {
    value: "TRAVEL_FOCUSED",
    title: "Travel focused",
    subtitle: "Highlight flights, hotels, and trip-friendly choices.",
  },
  {
    value: "CASHLIKE",
    title: "Cash-like",
    subtitle: "Lean toward money in your pocket over travel hoops.",
  },
];

export default function GoalPreferencesScreen() {
  const router = useRouter();
  const goalPreference = useAppStore((s) => s.goalPreference);
  const setGoalPreference = useAppStore((s) => s.setGoalPreference);

  function select(v: GoalPreference) {
    setGoalPreference(v);
    refreshDashboardData();
    router.back();
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.lead}>
        Choose what “good” means for you. Your dashboard reorders suggestions
        automatically.
      </Text>
      {OPTIONS.map((opt) => {
        const selected = goalPreference === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => select(opt.value)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View style={styles.radioOuter}>
              {selected ? <View style={styles.radioInner} /> : null}
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{opt.title}</Text>
              <Text style={styles.optionSub}>{opt.subtitle}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    padding: 20,
  },
  lead: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  optionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  optionPressed: { opacity: 0.92 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
  },
  optionText: { flex: 1 },
  optionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
