import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  headerRight?: ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function CollapsibleCard({
  title,
  summary,
  defaultOpen = false,
  children,
  headerRight,
  backgroundColor = "#fff",
  borderColor = "#e5e7eb",
  style,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor, borderColor },
        style,
      ]}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headerMain}>
          <Text style={styles.title}>{title}</Text>
          {summary && !open ? (
            <Text style={styles.summary} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          {headerRight}
          <Text style={styles.chevron}>{open ? "−" : "+"}</Text>
        </View>
      </Pressable>

      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    padding: 14,
  },
  headerPressed: { opacity: 0.92 },
  headerMain: {
    flex: 1,
    paddingRight: 8,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 22,
  },
  summary: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  chevron: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
