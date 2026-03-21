import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { useContacts, type ContactWithUrgency } from "@/src/hooks/useContacts";
import { useOccasions } from "@/src/hooks/useOccasions";
import { UrgencyDot } from "@/src/components/UrgencyDot";
import { OccasionCard } from "@/src/components/OccasionCard";
import type { Interaction } from "@/src/db/schema";

const INTERACTION_TYPES = [
  { label: "Message", value: "message", emoji: "💬" },
  { label: "Call", value: "call", emoji: "📞" },
  { label: "In person", value: "in_person", emoji: "🤝" },
  { label: "Other", value: "other", emoji: "✨" },
];

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getUrgencyLabel(contact: ContactWithUrgency): string {
  if (!contact.lastInteraction) return "Haven't connected yet";
  if (contact.urgency.level === "ok") return "You're doing well";
  if (contact.urgency.level === "soon")
    return "It's been a little while — say hi?";
  return `${contact.name} would love to hear from you`;
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { contacts, logInteraction, getInteractions, deleteContact } =
    useContacts();
  const { getOccasionsForContact } = useOccasions();

  const contact = contacts.find((c) => c.id === id);
  const history = useMemo(
    () => (id ? getInteractions(id) : []),
    [id, getInteractions, contacts] // re-derive when contacts refresh
  );
  const contactOccasions = useMemo(
    () => (id ? getOccasionsForContact(id) : []),
    [id, getOccasionsForContact]
  );

  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState("message");
  const [logNotes, setLogNotes] = useState("");

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Contact not found</Text>
      </SafeAreaView>
    );
  }

  const handleLog = () => {
    logInteraction({
      contactId: contact.id,
      type: logType,
      notes: logNotes.trim() || undefined,
    });
    setLogNotes("");
    setShowLog(false);
    Alert.alert("Logged!", "That little moment matters more than you think.");
  };

  const handleDelete = () => {
    Alert.alert("Remove contact", `Remove ${contact.name} from your list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          deleteContact(contact.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + Name */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: contact.color ?? "#ccc" },
            ]}
          >
            <Text style={styles.initials}>{contact.initials ?? "?"}</Text>
          </View>
          <Text style={styles.name}>{contact.name}</Text>
          {contact.relationship && (
            <Text style={styles.relationship}>
              {contact.relationship.replace("_", " ")}
            </Text>
          )}
        </View>

        {/* Urgency Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <UrgencyDot level={contact.urgency.level} size={12} />
            <Text style={styles.statusText}>{getUrgencyLabel(contact)}</Text>
          </View>
          <Text style={styles.thresholdText}>
            Check-in every {contact.thresholdDays} days
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.composeButton}
            onPress={() => router.push(`/compose/${contact.id}`)}
          >
            <Text style={styles.composeButtonText}>Say hi</Text>
          </Pressable>
          <Pressable
            style={styles.logButton}
            onPress={() => setShowLog(true)}
          >
            <Text style={styles.logButtonText}>Log a moment</Text>
          </Pressable>
        </View>

        {/* Contact info */}
        {(contact.phone || contact.email) && (
          <View style={styles.infoSection}>
            {contact.phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{contact.phone}</Text>
              </View>
            )}
            {contact.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{contact.email}</Text>
              </View>
            )}
          </View>
        )}

        {/* Occasions */}
        {contactOccasions.length > 0 && (
          <View style={styles.occasionsSection}>
            <Text style={styles.sectionTitle}>Upcoming occasions</Text>
            {contactOccasions.map((o) => (
              <OccasionCard
                key={o.id}
                occasion={o}
                contactName={contact.name}
                daysUntil={o.daysUntil}
              />
            ))}
          </View>
        )}

        {/* History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent moments</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistory}>
              No moments logged yet. Tap "Log a moment" above to start.
            </Text>
          ) : (
            history.slice(0, 20).map((item: Interaction) => (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>
                  {INTERACTION_TYPES.find((t) => t.value === item.type)
                    ?.emoji ?? "✨"}
                </Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>
                    {INTERACTION_TYPES.find((t) => t.value === item.type)
                      ?.label ?? "Other"}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(item.occurredAt)}
                  </Text>
                  {item.notes && (
                    <Text style={styles.historyNotes}>{item.notes}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Delete */}
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Remove contact</Text>
        </Pressable>
      </ScrollView>

      {/* Log Interaction Modal */}
      <Modal visible={showLog} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowLog(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Log a moment</Text>
            <Pressable onPress={handleLog}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>What kind?</Text>
            <View style={styles.typeGrid}>
              {INTERACTION_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  style={[
                    styles.typeCard,
                    logType === t.value && styles.typeCardSelected,
                  ]}
                  onPress={() => setLogType(t.value)}
                >
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      logType === t.value && styles.typeLabelSelected,
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={logNotes}
              onChangeText={setLogNotes}
              placeholder="What did you talk about?"
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { paddingBottom: 40 },
  notFound: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    paddingTop: 60,
  },
  // Profile
  profileSection: { alignItems: "center", paddingTop: 24, paddingBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  initials: { color: "#fff", fontWeight: "700", fontSize: 28 },
  name: { fontSize: 24, fontWeight: "700", color: "#1a1a1a" },
  relationship: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
    textTransform: "capitalize",
  },
  // Status
  statusCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusText: { fontSize: 15, color: "#555", flex: 1 },
  thresholdText: { fontSize: 13, color: "#aaa", marginTop: 6, marginLeft: 20 },
  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  composeButton: {
    flex: 1,
    backgroundColor: "#FF8A65",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  composeButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  logButton: {
    flex: 1,
    backgroundColor: "#4ECDC4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  // Info
  infoSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: "#888" },
  infoValue: { fontSize: 14, color: "#1a1a1a" },
  // Occasions
  occasionsSection: {
    marginBottom: 16,
  },
  // History
  historySection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  noHistory: { fontSize: 14, color: "#bbb", textAlign: "center", padding: 20 },
  historyItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  historyEmoji: { fontSize: 20, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyType: { fontSize: 15, fontWeight: "500", color: "#1a1a1a" },
  historyDate: { fontSize: 13, color: "#aaa", marginTop: 2 },
  historyNotes: { fontSize: 13, color: "#666", marginTop: 4 },
  // Delete
  deleteButton: { alignItems: "center", paddingVertical: 16 },
  deleteText: { fontSize: 15, color: "#EF5350" },
  // Modal
  modalContainer: { flex: 1, backgroundColor: "#FAFAFA" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 17, fontWeight: "600", color: "#1a1a1a" },
  cancelText: { fontSize: 16, color: "#888" },
  saveText: { fontSize: 16, color: "#4ECDC4", fontWeight: "600" },
  form: { padding: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  typeCard: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeCardSelected: { borderColor: "#4ECDC4", backgroundColor: "#F0FFFE" },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 12, color: "#666" },
  typeLabelSelected: { color: "#4ECDC4", fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
});
