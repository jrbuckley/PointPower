import { Pressable, StyleSheet, Text, View } from "react-native";
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

function stepHint(index: number, total: number): string {
  if (total === 1) {
    return "Transfer on your issuer site, then book with the partner.";
  }
  if (index === 0) {
    return "Start here — open your card issuer’s transfer page.";
  }
  if (index === total - 1) {
    return "If offered, move points inside the destination partner’s account.";
  }
  return "After the prior transfer posts, continue in that partner’s account.";
}

type Props = {
  path: TransferPathExplanation;
  transferUrl: string | null;
  onOpenIssuerTransfer: () => void;
};

export function TransferPathHero({
  path,
  transferUrl,
  onOpenIssuerTransfer,
}: Props) {
  const hops = path.traceLines;
  const multi = path.transferHops > 1 || hops.length > 1;
  const issuerName = issuerShortLabel(path.issuerProgramCode);
  const destination = partnerLabel(path.finalPartnerCode);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>Best modeled transfer path</Text>

      {multi ? (
        <Text style={styles.headline}>{path.headline}</Text>
      ) : (
        <Text style={styles.headlineSingle}>
          {issuerName} → {destination}
        </Text>
      )}

      <View style={styles.timeline}>
        {hops.map((line, index) => (
          <View key={`${index}-${line}`} style={styles.stepRow}>
            <View style={styles.stepRail}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              {index < hops.length - 1 ? <View style={styles.stepConnector} /> : null}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLine}>{line}</Text>
              <Text style={styles.stepHint}>{stepHint(index, hops.length)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.destinationRow}>
        <Text style={styles.destinationLabel}>Book with</Text>
        <Text style={styles.destinationName}>{destination}</Text>
        <Text style={styles.destinationNote}>
          Confirm award space before transferring. Points moves are usually
          irreversible.
        </Text>
      </View>

      <Text style={styles.cppMeta}>
        {path.modeledIssuerCpp.toFixed(2)}¢ per point modeled · illustrative catalog
        data
      </Text>

      {transferUrl ? (
        <>
          <Pressable
            onPress={onOpenIssuerTransfer}
            style={({ pressed }: { pressed: boolean }) => [
              styles.cta,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Start transfer at ${issuerName}`}
          >
            <Text style={styles.ctaText}>Start at {issuerName} transfers</Text>
          </Pressable>
          {multi ? (
            <Text style={styles.ctaFootnote}>
              Step 1 opens your issuer site. Later hops happen in partner
              programs—not on your bank’s transfer page.
            </Text>
          ) : null}
        </>
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
    gap: 10,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headline: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a8a",
    lineHeight: 20,
  },
  headlineSingle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e3a8a",
    lineHeight: 22,
  },
  timeline: {
    gap: 0,
  },
  stepRow: {
    flexDirection: "row",
    gap: 10,
    minHeight: 52,
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
    minHeight: 16,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 12,
  },
  stepLine: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a8a",
    lineHeight: 20,
  },
  stepHint: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
    marginTop: 3,
  },
  destinationRow: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  destinationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  destinationName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  destinationNote: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    marginTop: 4,
  },
  cppMeta: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
  },
  cta: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  ctaFootnote: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
  },
});
