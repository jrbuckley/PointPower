import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RewardBalanceInputRow } from "../components/RewardBalanceInputRow";
import { ALL_PROGRAMS, PROGRAM_LABELS } from "../constants/programs";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import type { RewardBalance, RewardProgramType } from "../types/models";
import {
  formatAmountInputDisplay,
  parseAmountInput,
} from "../utils/format";
import { useAppStore } from "../store/appStore";

function buildInitialStrings(balances: RewardBalance[]) {
  const map = new Map(
    balances.map((b) => [b.program, formatAmountInputDisplay(b.amount)]),
  );
  const out: Record<RewardProgramType, string> = {} as Record<
    RewardProgramType,
    string
  >;
  for (const p of ALL_PROGRAMS) {
    out[p] = map.get(p) ?? "";
  }
  return out;
}

export default function AddRewardsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const setRewardBalances = useAppStore((s) => s.setRewardBalances);

  const [inputs, setInputs] = useState<Record<RewardProgramType, string>>(() =>
    buildInitialStrings(rewardBalances),
  );

  const rows = useMemo(
    () =>
      ALL_PROGRAMS.map((program) => ({
        program,
        label: PROGRAM_LABELS[program],
      })),
    [],
  );

  function onChange(program: RewardProgramType, text: string) {
    const cleaned = text.replace(/[^\d]/g, "");
    const display =
      cleaned === "" ? "" : formatAmountInputDisplay(parseAmountInput(cleaned));
    setInputs((prev) => ({ ...prev, [program]: display }));
  }

  function onSubmit() {
    const next: RewardBalance[] = ALL_PROGRAMS.map((program) => ({
      program,
      amount: parseAmountInput(inputs[program] ?? ""),
    }));
    setRewardBalances(next);
    refreshDashboardData();
    router.replace("/dashboard");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Your balances</Text>
        <Text style={styles.subtitle}>
          Add rough totals—skip anything you don’t use. You can edit later.
        </Text>

        <ScrollView
          style={styles.listWrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {rows.map((r) => (
              <RewardBalanceInputRow
                key={r.program}
                program={r.program}
                label={r.label}
                value={inputs[r.program] ?? ""}
                onChangeText={(t) => onChange(r.program, t)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={onSubmit}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>See my value</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f6f7fb" },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  listWrap: { flex: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  footer: {
    paddingTop: 8,
    backgroundColor: "#f6f7fb",
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
