import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfileFromApi } from "../hooks/useProfileFromApi";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import { persistGoalPreference } from "../lib/persistGoalPreference";
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const goalPreference = useAppStore((s) => s.goalPreference);
  const setGoalPreference = useAppStore((s) => s.setGoalPreference);
  const fromOnboarding = params.from === "onboarding";

  useProfileFromApi(true);

  const [draft, setDraft] = useState<GoalPreference>(goalPreference);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(goalPreference);
  }, [goalPreference]);

  const hasChanges = draft !== goalPreference;

  async function onSave(navigateAfter = false) {
    setSaving(true);
    try {
      const saved = await persistGoalPreference(draft);
      setGoalPreference(saved);
      refreshDashboardData();
      if (navigateAfter) {
        router.replace("/dashboard");
      } else if (router.canGoBack()) {
        router.back();
      }
    } catch {
      Alert.alert(
        "Could not save",
        "Your goal preference could not be saved. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Choose what “good” means for you. Your dashboard reorders suggestions
          after you save.
        </Text>
        {OPTIONS.map((opt) => {
          const selected = draft === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setDraft(opt.value)}
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => void onSave(fromOnboarding)}
          disabled={saving || (!fromOnboarding && !hasChanges)}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            (saving || (!fromOnboarding && !hasChanges)) && styles.ctaDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            fromOnboarding ? "See my value" : "Save changes"
          }
        >
          <Text style={styles.ctaText}>
            {saving
              ? "Saving…"
              : fromOnboarding
                ? "See my value"
                : "Save changes"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 12,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#f6f7fb",
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.9 },
  ctaDisabled: { opacity: 0.55 },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
