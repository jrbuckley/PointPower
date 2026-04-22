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

export default function RewardsAccountsScreen() {
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

  function onSave() {
    const next: RewardBalance[] = ALL_PROGRAMS.map((program) => ({
      program,
      amount: parseAmountInput(inputs[program] ?? ""),
    }));
    setRewardBalances(next);
    refreshDashboardData();
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Update your totals anytime. We’ll refresh your dashboard estimates.
        </Text>
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
        <Pressable
          onPress={onSave}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>Save changes</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f6f7fb" },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  lead: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
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
