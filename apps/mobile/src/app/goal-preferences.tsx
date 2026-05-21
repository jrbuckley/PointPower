import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CUSTOM_GOAL_CATALOG,
  DEFAULT_CUSTOM_GOAL_CODE,
} from "../constants/customGoals";
import { GoalPreferencesSkeleton } from "../components/loading/GoalPreferencesSkeleton";
import { LoadingButtonLabel } from "../components/loading/LoadingButtonLabel";
import { useProfileFromApi } from "../hooks/useProfileFromApi";
import { isApiConfigured } from "../lib/apiClient";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import { persistProfileGoals } from "../lib/persistGoalPreference";
import type { CustomGoalCode, GoalPreference } from "../types/models";
import { useAppStore } from "../store/appStore";

const PRESET_OPTIONS: {
  value: Exclude<GoalPreference, "CUSTOM">;
  title: string;
  subtitle: string;
}[] = [
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

const CUSTOM_OPTION = {
  value: "CUSTOM" as const,
  title: "Custom goal",
  subtitle:
    "Get specific: international flights, luxury hotels, and more. (Trip planning comes later under Travel focused.)",
};

export default function GoalPreferencesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const goalPreference = useAppStore((s) => s.goalPreference);
  const customGoalCode = useAppStore((s) => s.customGoalCode);
  const setProfileGoals = useAppStore((s) => s.setProfileGoals);
  const fromOnboarding = params.from === "onboarding";

  const { isLoading: profileLoading } = useProfileFromApi(true);
  const showSkeleton = isApiConfigured() && profileLoading;

  const [draftPreference, setDraftPreference] =
    useState<GoalPreference>(goalPreference);
  const [draftCustomCode, setDraftCustomCode] = useState<CustomGoalCode>(
    customGoalCode ?? DEFAULT_CUSTOM_GOAL_CODE,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftPreference(goalPreference);
    setDraftCustomCode(customGoalCode ?? DEFAULT_CUSTOM_GOAL_CODE);
  }, [goalPreference, customGoalCode]);

  const hasChanges = useMemo(() => {
    if (draftPreference !== goalPreference) return true;
    if (draftPreference === "CUSTOM") {
      return draftCustomCode !== customGoalCode;
    }
    return false;
  }, [
    draftPreference,
    goalPreference,
    draftCustomCode,
    customGoalCode,
  ]);

  const customSaveBlocked =
    draftPreference === "CUSTOM" && !draftCustomCode;

  async function onSave(navigateAfter = false) {
    if (customSaveBlocked) {
      Alert.alert(
        "Choose a focus",
        "Select what you want your points to work toward.",
      );
      return;
    }

    setSaving(true);
    try {
      const customCode =
        draftPreference === "CUSTOM" ? draftCustomCode : null;
      const saved = await persistProfileGoals(draftPreference, customCode);
      setProfileGoals(saved.goalPreference, saved.customGoalCode);
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

  function selectPreset(value: Exclude<GoalPreference, "CUSTOM">) {
    setDraftPreference(value);
  }

  function selectCustom() {
    setDraftPreference("CUSTOM");
    if (!draftCustomCode) {
      setDraftCustomCode(DEFAULT_CUSTOM_GOAL_CODE);
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
          Choose what “good” means for you. Pick a preset or define a custom
          focus. Your dashboard reorders after you save.
        </Text>

        {showSkeleton ? (
          <GoalPreferencesSkeleton />
        ) : (
          <>
        {PRESET_OPTIONS.map((opt) => {
          const selected = draftPreference === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => selectPreset(opt.value)}
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

        <Pressable
          onPress={selectCustom}
          style={({ pressed }) => [
            styles.option,
            draftPreference === "CUSTOM" && styles.optionSelected,
            pressed && styles.optionPressed,
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: draftPreference === "CUSTOM" }}
        >
          <View style={styles.radioOuter}>
            {draftPreference === "CUSTOM" ? (
              <View style={styles.radioInner} />
            ) : null}
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>{CUSTOM_OPTION.title}</Text>
            <Text style={styles.optionSub}>{CUSTOM_OPTION.subtitle}</Text>
          </View>
        </Pressable>

        {draftPreference === "CUSTOM" ? (
          <View style={styles.customSection}>
            <Text style={styles.customHeading}>What are you optimizing for?</Text>
            <Text style={styles.customHint}>
              These tune recommendations today. Planning a full trip itinerary
              will be a separate feature under Travel focused.
            </Text>
            {CUSTOM_GOAL_CATALOG.map((item) => {
              const selected = draftCustomCode === item.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => setDraftCustomCode(item.code)}
                  style={({ pressed }) => [
                    styles.customRow,
                    selected && styles.customRowSelected,
                    pressed && styles.optionPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.customRowText}>
                    <Text style={styles.customTitle}>{item.title}</Text>
                    <Text style={styles.customSub}>{item.subtitle}</Text>
                  </View>
                  <Text style={selected ? styles.customCheckOn : styles.customCheck}>
                    {selected ? "✓" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={() => void onSave(fromOnboarding)}
          disabled={
            saving ||
            customSaveBlocked ||
            (!fromOnboarding && !hasChanges)
          }
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
            (saving ||
              customSaveBlocked ||
              (!fromOnboarding && !hasChanges)) &&
              styles.ctaDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            fromOnboarding ? "See my value" : "Save changes"
          }
        >
          <LoadingButtonLabel
            loading={saving}
            label={fromOnboarding ? "See my value" : "Save changes"}
            loadingLabel="Saving…"
          />
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
  customSection: {
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 4,
  },
  customHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  customHint: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 19,
    marginBottom: 12,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  customRowSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  customRowText: { flex: 1 },
  customTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  customSub: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  customCheck: {
    width: 22,
    fontSize: 16,
    fontWeight: "800",
    color: "transparent",
    textAlign: "center",
  },
  customCheckOn: {
    width: 22,
    fontSize: 16,
    fontWeight: "800",
    color: "#2563eb",
    textAlign: "center",
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
