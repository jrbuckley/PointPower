import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RewardBalanceInputRow } from "../components/RewardBalanceInputRow";
import {
  PROGRAM_CATALOG,
  PROGRAM_IDS,
  PROGRAM_LABELS,
} from "../constants/programs";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import { persistRewardBalances } from "../lib/persistRewardBalances";
import type { RewardBalance, RewardProgramId } from "../types/models";
import {
  formatAmountInputDisplay,
  parseAmountInput,
} from "../utils/format";
import { useAppStore } from "../store/appStore";

function buildInitialStrings(balances: RewardBalance[]) {
  const out: Record<string, string> = {};
  for (const b of balances) {
    out[b.programId] = formatAmountInputDisplay(b.amount);
  }
  return out;
}

function normalizeSelectedPrograms(balances: RewardBalance[]): RewardProgramId[] {
  const ids = new Set<RewardProgramId>();
  for (const b of balances as any[]) {
    const raw = (b?.programId ?? b?.program) as unknown;
    if (PROGRAM_IDS.includes(raw as RewardProgramId)) {
      ids.add(raw as RewardProgramId);
    }
  }
  return [...ids];
}

export default function RewardsAccountsScreen() {
  const rewardBalances = useAppStore((s) => s.rewardBalances);
  const setRewardBalances = useAppStore((s) => s.setRewardBalances);

  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    buildInitialStrings(rewardBalances),
  );
  const [selectedPrograms, setSelectedPrograms] = useState<RewardProgramId[]>(
    () => normalizeSelectedPrograms(rewardBalances),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    return selectedPrograms.map((programId) => ({
      programId,
      label: PROGRAM_LABELS[programId],
    }));
  }, [selectedPrograms]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PROGRAM_CATALOG;
    return PROGRAM_CATALOG.filter((p) => p.label.toLowerCase().includes(q));
  }, [search]);

  function onChange(programId: RewardProgramId, text: string) {
    const cleaned = text.replace(/[^\d]/g, "");
    const display =
      cleaned === "" ? "" : formatAmountInputDisplay(parseAmountInput(cleaned));
    setInputs((prev) => ({ ...prev, [programId]: display }));
  }

  function addProgram(programId: RewardProgramId) {
    setSelectedPrograms((prev) => {
      if (prev.includes(programId)) return prev;
      return [...prev, programId];
    });
    setPickerOpen(false);
    setSearch("");
  }

  function removeProgram(programId: RewardProgramId) {
    setSelectedPrograms((prev) => prev.filter((p) => p !== programId));
    setInputs((prev) => {
      const next = { ...prev };
      delete next[programId];
      return next;
    });
  }

  async function onSave() {
    const next: RewardBalance[] = selectedPrograms.map((programId) => ({
      programId,
      amount: parseAmountInput(inputs[programId] ?? ""),
    }));
    setSaving(true);
    try {
      const saved = await persistRewardBalances(next);
      setRewardBalances(saved);
      refreshDashboardData();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/dashboard");
      }
    } catch {
      Alert.alert(
        "Could not save",
        "Your balances could not be saved. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [
              styles.addProgram,
              pressed && styles.addProgramPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add a rewards program"
          >
            <Text style={styles.addProgramText}>Add a program</Text>
          </Pressable>

          {rows.length === 0 ? (
            <Text style={styles.emptyHint}>
              Add at least one program to enter a balance.
            </Text>
          ) : null}
          {rows.map((r) => (
            <RewardBalanceInputRow
              key={r.programId}
              label={r.label}
              value={inputs[r.programId] ?? ""}
              onChangeText={(t) => onChange(r.programId, t)}
              onRemove={() => removeProgram(r.programId)}
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

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a program</Text>
              <Pressable
                onPress={() => setPickerOpen(false)}
                accessibilityRole="button"
                hitSlop={10}
              >
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search programs"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            style={styles.search}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredCatalog.map((p) => {
              const already = selectedPrograms.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => addProgram(p.id)}
                  disabled={already}
                  style={({ pressed }) => [
                    styles.programRow,
                    pressed && !already && styles.programRowPressed,
                    already && styles.programRowDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: already }}
                >
                  <Text style={styles.programLabel}>{p.label}</Text>
                  <Text style={styles.programMeta}>
                    {already ? "Added" : "Add"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  addProgram: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  addProgramPressed: { opacity: 0.9 },
  addProgramText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  emptyHint: {
    paddingVertical: 14,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17,24,39,0.45)",
  },
  modalCard: {
    backgroundColor: "#f6f7fb",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  modalClose: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2563eb",
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    marginBottom: 12,
  },
  programRow: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  programRowPressed: { opacity: 0.9 },
  programRowDisabled: {
    opacity: 0.6,
  },
  programLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  programMeta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },
});
