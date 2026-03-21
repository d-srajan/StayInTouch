import { View, StyleSheet } from "react-native";
import type { UrgencyLevel } from "@/src/utils/urgency";

const COLORS: Record<UrgencyLevel, string> = {
  ok: "#4CAF50",     // green
  soon: "#FFB74D",   // amber
  overdue: "#EF5350", // coral/red
};

const A11Y_LABELS: Record<UrgencyLevel, string> = {
  ok: "Recently in touch",
  soon: "It's been a little while",
  overdue: "Would love to hear from you",
};

export function UrgencyDot({ level, size = 10 }: { level: UrgencyLevel; size?: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={A11Y_LABELS[level]}
      style={[
        styles.dot,
        {
          backgroundColor: COLORS[level],
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    marginRight: 8,
  },
});
