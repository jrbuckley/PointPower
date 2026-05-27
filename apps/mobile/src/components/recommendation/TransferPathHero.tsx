import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  getTransferPathAwardSearchAction,
  getTransferPathStepAction,
  openHandoffUrl,
} from "../../lib/handoffUrls";
import type { TransferPathExplanation } from "../../types/models";

const ISSUER_SHORT_LABELS: Record<string, string> = {
  chase_ur: "Chase",
  amex_mr: "Amex",
  capital_one_miles: "Capital One",
  citi_ty: "Citi",
};

const PARTNER_LABELS: Record<string, string> = {
  united: "United MileagePlus",
  hyatt: "World of Hyatt",
  flying_blue: "Air France / KLM Flying Blue",
};

function issuerShortLabel(code: string): string {
  return ISSUER_SHORT_LABELS[code] ?? code.replace(/_/g, " ");
}

function partnerLabel(code: string): string {
  return PARTNER_LABELS[code] ?? code.replace(/_/g, " ");
}

function stepHint(index: number, total: number): string | null {
  if (total === 1) return "Transfer on your issuer site, then search partner awards below.";
  if (index === 0) return "Start on your issuer’s transfer page.";
  return "Complete this hop in the partner account after the prior transfer posts.";
}

type Props = {
  path: TransferPathExplanation;
};

export function TransferPathHero({ path }: Props) {
  const hops = path.traceLines;
  const multi = hops.length > 1;
  const issuerName = issuerShortLabel(path.issuerProgramCode);
  const destination = partnerLabel(path.finalPartnerCode);
  const awardSearch = getTransferPathAwardSearchAction(path);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>Transfer path</Text>
      <Text style={styles.subtitle}>
        {issuerName} → {destination}
        {multi ? ` · ${hops.length} steps` : ""}
      </Text>

      <View style={styles.timeline}>
        {hops.map((line, index) => {
          const hint = stepHint(index, hops.length);
          const stepAction = getTransferPathStepAction(path, index);
          return (
            <View key={`${index}-${line}`} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{index + 1}</Text>
                </View>
                {index < hops.length - 1 ? (
                  <View style={styles.stepConnector} />
                ) : null}
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepLine}>{line}</Text>
                {hint ? <Text style={styles.stepHint}>{hint}</Text> : null}
                {stepAction ? (
                  <Pressable
                    onPress={() => openHandoffUrl(stepAction.url)}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.stepLink,
                      pressed && styles.stepLinkPressed,
                    ]}
                    accessibilityRole="link"
                  >
                    <Text style={styles.stepLinkText}>{stepAction.label}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.footer}>
        {path.modeledIssuerCpp.toFixed(2)}¢/pt est. · confirm availability before transferring
      </Text>

      {awardSearch ? (
        <Pressable
          onPress={() => openHandoffUrl(awardSearch.url)}
          style={({ pressed }: { pressed: boolean }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={awardSearch.label}
        >
          <Text style={styles.ctaText}>{awardSearch.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a8a",
    lineHeight: 21,
  },
  timeline: {
    gap: 0,
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
  },
  stepRail: {
    width: 28,
    alignItems: "center",
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  stepConnector: {
    flex: 1,
    width: 2,
    backgroundColor: "#93c5fd",
    marginTop: 4,
    marginBottom: 4,
    minHeight: 12,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 8,
  },
  stepLine: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a8a",
    lineHeight: 20,
  },
  stepHint: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
    marginTop: 2,
  },
  stepLink: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingVertical: 4,
  },
  stepLinkPressed: {
    opacity: 0.85,
  },
  stepLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  footer: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
  },
  cta: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 2,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
