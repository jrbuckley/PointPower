import { StyleSheet, View } from "react-native";
import { SkeletonBox, SkeletonLines } from "./Skeleton";

function RecommendationCardSkeleton() {
  return (
    <View style={styles.recCard}>
      <SkeletonBox width={120} height={12} borderRadius={6} />
      <SkeletonBox height={20} width="85%" style={styles.gapSm} />
      <SkeletonLines lines={2} lastLineWidth="90%" gap={8} />
      <View style={styles.recFooter}>
        <SkeletonBox width={100} height={18} />
        <SkeletonBox width={72} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={styles.summaryCard}>
        <SkeletonBox height={22} width="70%" />
        <SkeletonBox height={20} width="55%" style={styles.gapMd} />
        <SkeletonBox height={14} width="88%" style={styles.gapSm} />
      </View>

      <SkeletonBox height={18} width={160} style={styles.gapLg} />
      <SkeletonBox height={14} width="92%" style={styles.gapSm} />

      <RecommendationCardSkeleton />
      <RecommendationCardSkeleton />
      <RecommendationCardSkeleton />

      <SkeletonBox height={18} width={140} style={styles.gapLg} />
      <View style={styles.compareCard}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.compareRow, i === 2 && styles.compareRowLast]}
          >
            <View style={styles.compareText}>
              <SkeletonBox height={16} width="50%" />
              <SkeletonBox height={12} width="75%" style={styles.gapSm} />
            </View>
            <SkeletonBox height={18} width={56} />
          </View>
        ))}
      </View>

      <View style={styles.insight}>
        <SkeletonLines lines={2} lastLineWidth="80%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  recCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  recFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  compareCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 20,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
  },
  compareRowLast: {
    borderBottomWidth: 0,
  },
  compareText: {
    flex: 1,
    marginRight: 12,
  },
  insight: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  gapSm: { marginTop: 8 },
  gapMd: { marginTop: 12 },
  gapLg: { marginTop: 20, marginBottom: 10 },
});
