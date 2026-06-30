import { StyleSheet, View } from "react-native";
import { SkeletonBox, SkeletonLines } from "./Skeleton";

export function RecommendationDetailSkeleton() {
  return (
    <View style={styles.wrap}>
      <SkeletonBox height={24} width="88%" />
      <View style={styles.headerMeta}>
        <SkeletonBox height={28} width={96} borderRadius={14} />
        <SkeletonBox height={20} width="38%" />
      </View>

      <SkeletonBox height={20} width={180} style={styles.gapLg} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.offerCard}>
          <SkeletonBox height={18} width="80%" />
          <SkeletonBox height={14} width="65%" style={styles.gapSm} />
          <View style={styles.offerMetrics}>
            <SkeletonBox height={32} width="40%" />
            <SkeletonBox height={32} width="40%" />
          </View>
        </View>
      ))}

      <View style={styles.goalCard}>
        <SkeletonBox height={20} width="75%" />
        <SkeletonLines lines={2} lastLineWidth="90%" />
      </View>

      <SkeletonBox height={48} borderRadius={12} style={styles.gapMd} />
      <SkeletonBox height={48} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    paddingBottom: 40,
  },
  headerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    flex: 1,
    borderRadius: 10,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  offerMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  gapSm: { marginTop: 8 },
  gapMd: { marginTop: 12 },
  gapLg: { marginTop: 20, marginBottom: 10 },
});
