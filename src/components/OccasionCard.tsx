import { View, Text, StyleSheet, Pressable } from "react-native";
import type { Occasion } from "@/src/db/schema";

interface OccasionCardProps {
  occasion: Occasion;
  contactName: string;
  daysUntil: number;
  onPress?: () => void;
}

const TYPE_EMOJI: Record<string, string> = {
  birthday: "🎂",
  anniversary: "💍",
  custom: "⭐",
};

function formatOccasionDate(month: number, day: number): string {
  const date = new Date(2000, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function getDaysLabel(days: number): string {
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  if (days <= 30) {
    const weeks = Math.floor(days / 7);
    return `In ${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  const months = Math.floor(days / 30);
  return `In ${months} month${months > 1 ? "s" : ""}`;
}

function getDaysColor(days: number): string {
  if (days === 0) return "#EF5350";
  if (days <= 3) return "#FF8A65";
  if (days <= 7) return "#FFB74D";
  return "#888";
}

export function OccasionCard({
  occasion,
  contactName,
  daysUntil,
  onPress,
}: OccasionCardProps) {
  const emoji = TYPE_EMOJI[occasion.type] ?? "⭐";
  const label =
    occasion.type === "birthday"
      ? `${contactName}'s birthday`
      : occasion.label ?? `${contactName}'s ${occasion.type}`;

  const daysLabel = getDaysLabel(daysUntil);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${formatOccasionDate(occasion.month, occasion.day)}. ${daysLabel}`}
      accessibilityHint={onPress ? "Opens contact details" : undefined}
    >
      <Text style={styles.emoji} importantForAccessibility="no">
        {emoji}
      </Text>
      <View style={styles.info}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.date}>{formatOccasionDate(occasion.month, occasion.day)}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={[styles.daysText, { color: getDaysColor(daysUntil) }]}>
          {daysLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  date: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  badge: {
    marginLeft: 8,
  },
  daysText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
