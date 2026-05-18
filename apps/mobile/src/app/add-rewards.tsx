import { useLocalSearchParams, useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RewardBalanceInputRow } from "../components/RewardBalanceInputRow";
import { LoadingButtonLabel } from "../components/loading/LoadingButtonLabel";
import { PROGRAM_CATALOG, PROGRAM_IDS, PROGRAM_LABELS } from "../constants/programs";
import { isApiConfigured } from "../lib/apiClient";
import { refreshDashboardData } from "../lib/invalidateDashboard";
import { persistRewardBalances } from "../lib/persistRewardBalances";
import {
  applyMockLinkedAccounts,
  mockLinkConnect,
} from "../lib/rewardAccountsApi";
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

export default function AddRewardsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
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
  const [submitting, setSubmitting] = useState(false);
  const [linking, setLinking] = useState(false);
  const apiEnabled = isApiConfigured();

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

  async function onSubmit() {
    const next: RewardBalance[] = selectedPrograms.map((programId) => ({
      programId,
      amount: parseAmountInput(inputs[programId] ?? ""),
    }));
    setSubmitting(true);
    try {
      const saved = await persistRewardBalances(next);
      setRewardBalances(saved);
      refreshDashboardData();
      router.replace(
        params.from === "onboarding"
          ? "/goal-preferences?from=onboarding"
          : "/dashboard",
      );
    } catch {
      Alert.alert(
        "Could not save",
        "Your balances could not be saved. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onMockLinkAccounts() {
    setLinking(true);
    try {
      const preview = await mockLinkConnect({ provider: "aggregator" });
      const summary = preview.previewAccounts
        .map(
          (a: { programName: string; balance: number }) =>
            `${a.programName}: ${a.balance.toLocaleString()} pts`,
        )
        .join("\n");

      Alert.alert(
        "Preview linked accounts",
        `${preview.message}\n\n${summary}`,
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Import balances",
            onPress: () => {
              void (async () => {
                try {
                  const imported = await applyMockLinkedAccounts();
                  const saved = await persistRewardBalances(imported);
                  setRewardBalances(saved);
                  setSelectedPrograms(saved.map((b) => b.programId));
                  setInputs(buildInitialStrings(saved));
                  refreshDashboardData();
                } catch {
                  Alert.alert(
                    "Import failed",
                    "Could not import preview balances. Try again later.",
                  );
                }
              })();
            },
          },
        ],
      );
    } catch {
      Alert.alert(
        "Connection preview unavailable",
        "Make sure the API server is running and you are signed in.",
      );
    } finally {
      setLinking(false);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Your balances</Text>
        <Text style={styles.subtitle}>
          Add the programs you use, then enter rough totals. You can edit later.
        </Text>

        <View style={styles.linkCard}>
          <Text style={styles.linkTitle}>
            {apiEnabled ? "Link accounts (preview)" : "Link accounts (coming soon)"}
          </Text>
          <Text style={styles.linkBody}>
            {apiEnabled
              ? "Try a mock connection to see how automatic balance import would work."
              : "Soon you’ll be able to connect accounts so balances and program types fill automatically."}
          </Text>
          <Pressable
            onPress={apiEnabled ? onMockLinkAccounts : undefined}
            disabled={!apiEnabled || linking}
            style={({ pressed }) => [
              apiEnabled ? styles.linkCta : styles.linkDisabled,
              pressed && apiEnabled && styles.linkCtaPressed,
              linking && styles.linkDisabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !apiEnabled || linking }}
          >
            {apiEnabled ? (
              <LoadingButtonLabel
                loading={linking}
                label="Preview link my accounts"
                loadingLabel="Connecting…"
              />
            ) : (
              <Text style={styles.linkDisabledText}>Preview link my accounts</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.listWrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.ctaPressed,
              submitting && styles.ctaDisabled,
            ]}
            accessibilityRole="button"
          >
            <LoadingButtonLabel
              loading={submitting}
              label={
                params.from === "onboarding" ? "Set my goals" : "See my value"
              }
              loadingLabel="Saving…"
            />
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 16 }]}>
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
  linkCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 14,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  linkBody: {
    marginTop: 6,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  linkCta: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  linkCtaPressed: { opacity: 0.92 },
  linkCtaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  linkDisabled: {
    marginTop: 12,
    backgroundColor: "#e5e7eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  linkDisabledText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "700",
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
  ctaDisabled: { opacity: 0.7 },
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
