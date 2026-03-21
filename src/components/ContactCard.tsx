import { View, Text, StyleSheet, Pressable } from "react-native";
import { UrgencyDot } from "./UrgencyDot";
import type { ContactWithUrgency } from "@/src/hooks/useContacts";

interface ContactCardProps {
  contact: ContactWithUrgency;
  onPress: (id: string) => void;
  highlighted?: boolean;
}

function formatDaysSince(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

export function ContactCard({ contact, onPress, highlighted }: ContactCardProps) {
  return (
    <Pressable
      style={[styles.card, highlighted && styles.highlighted]}
      onPress={() => onPress(contact.id)}
    >
      <View style={[styles.avatar, { backgroundColor: contact.color ?? "#ccc" }]}>
        <Text style={styles.initials}>{contact.initials ?? "?"}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <UrgencyDot level={contact.urgency.level} />
          <Text style={styles.name} numberOfLines={1}>
            {contact.name}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          {contact.lastInteraction
            ? formatDaysSince(contact.urgency.daysSince)
            : "Haven't connected yet"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
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
  highlighted: {
    borderWidth: 1.5,
    borderColor: "#FFB74D",
    backgroundColor: "#FFFBF0",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  initials: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    marginLeft: 18, // align with name after dot
  },
});
