import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";

import { useOccasions, type OccasionWithContact } from "@/src/hooks/useOccasions";
import { useContacts } from "@/src/hooks/useContacts";
import { OccasionCard } from "@/src/components/OccasionCard";

const OCCASION_TYPES = [
  { label: "Birthday", value: "birthday", emoji: "🎂" },
  { label: "Anniversary", value: "anniversary", emoji: "💍" },
  { label: "Custom", value: "custom", emoji: "⭐" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Section = { title: string; data: OccasionWithContact[] };

export default function OccasionsScreen() {
  const router = useRouter();
  const { occasions, addOccasion } = useOccasions();
  const { contacts } = useContacts();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [occasionType, setOccasionType] = useState("birthday");
  const [customLabel, setCustomLabel] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [day, setDay] = useState(String(new Date().getDate()));

  // Group occasions into sections
  const sections = useMemo((): Section[] => {
    const thisWeek: OccasionWithContact[] = [];
    const thisMonth: OccasionWithContact[] = [];
    const upcoming: OccasionWithContact[] = [];

    for (const o of occasions) {
      if (o.daysUntil <= 7) thisWeek.push(o);
      else if (o.daysUntil <= 30) thisMonth.push(o);
      else upcoming.push(o);
    }

    const result: Section[] = [];
    if (thisWeek.length > 0) result.push({ title: "This week", data: thisWeek });
    if (thisMonth.length > 0) result.push({ title: "This month", data: thisMonth });
    if (upcoming.length > 0) result.push({ title: "Coming up", data: upcoming });
    return result;
  }, [occasions]);

  const handleAdd = () => {
    if (!selectedContactId) {
      Alert.alert("Pick someone", "Choose a contact for this occasion.");
      return;
    }
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      Alert.alert("Check the date", "Enter a valid month (1-12) and day (1-31).");
      return;
    }

    const contact = contacts.find((c) => c.id === selectedContactId);
    addOccasion({
      contactId: selectedContactId,
      contactName: contact?.name ?? "",
      contactColor: contact?.color,
      type: occasionType,
      label: occasionType === "custom" ? customLabel.trim() || undefined : undefined,
      month: m,
      day: d,
    });

    // Reset
    setSelectedContactId(null);
    setOccasionType("birthday");
    setCustomLabel("");
    setShowAdd(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Occasions</Text>
        <Pressable style={styles.addButton} onPress={() => setShowAdd(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <OccasionCard
            occasion={item}
            contactName={item.contactName}
            daysUntil={item.daysUntil}
            onPress={() => router.push(`/contact/${item.contactId}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎂</Text>
            <Text style={styles.emptyText}>
              No occasions yet — add birthdays and special dates to never miss a moment.
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />

      {/* Add Occasion Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Add occasion</Text>
              <Pressable onPress={handleAdd}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              {/* Contact picker */}
              <Text style={styles.label}>Who is it for?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactScroll}>
                {contacts.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.contactChip,
                      selectedContactId === c.id && styles.contactChipSelected,
                    ]}
                    onPress={() => setSelectedContactId(c.id)}
                  >
                    <View
                      style={[
                        styles.chipAvatar,
                        { backgroundColor: c.color ?? "#ccc" },
                      ]}
                    >
                      <Text style={styles.chipInitials}>{c.initials}</Text>
                    </View>
                    <Text
                      style={[
                        styles.chipName,
                        selectedContactId === c.id && styles.chipNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {c.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Type */}
              <Text style={styles.label}>What kind?</Text>
              <View style={styles.typeRow}>
                {OCCASION_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    style={[
                      styles.typeCard,
                      occasionType === t.value && styles.typeCardSelected,
                    ]}
                    onPress={() => setOccasionType(t.value)}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        occasionType === t.value && styles.typeLabelSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {occasionType === "custom" && (
                <>
                  <Text style={styles.label}>Label</Text>
                  <TextInput
                    style={styles.input}
                    value={customLabel}
                    onChangeText={setCustomLabel}
                    placeholder='e.g. "Work anniversary"'
                  />
                </>
              )}

              {/* Date */}
              <Text style={styles.label}>Date</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>Month</Text>
                  <TextInput
                    style={styles.input}
                    value={month}
                    onChangeText={setMonth}
                    keyboardType="number-pad"
                    placeholder="1-12"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>Day</Text>
                  <TextInput
                    style={styles.input}
                    value={day}
                    onChangeText={setDay}
                    keyboardType="number-pad"
                    placeholder="1-31"
                    maxLength={2}
                  />
                </View>
              </View>

              {month && day && (
                <Text style={styles.datePreview}>
                  {MONTHS[parseInt(month, 10) - 1] ?? "?"} {day}
                </Text>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#1a1a1a" },
  addButton: {
    backgroundColor: "#FFB74D",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  list: { paddingBottom: 24 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 15, color: "#888", textAlign: "center", lineHeight: 22 },
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
  saveText: { fontSize: 16, color: "#FFB74D", fontWeight: "600" },
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
  // Contact picker
  contactScroll: { marginBottom: 8 },
  contactChip: {
    alignItems: "center",
    marginRight: 12,
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    width: 72,
  },
  contactChipSelected: { borderColor: "#FFB74D", backgroundColor: "#FFF8F0" },
  chipAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  chipInitials: { color: "#fff", fontWeight: "700", fontSize: 14 },
  chipName: { fontSize: 12, color: "#666", textAlign: "center" },
  chipNameSelected: { color: "#FFB74D", fontWeight: "600" },
  // Type
  typeRow: { flexDirection: "row", gap: 8 },
  typeCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeCardSelected: { borderColor: "#FFB74D", backgroundColor: "#FFF8F0" },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 12, color: "#666" },
  typeLabelSelected: { color: "#FFB74D", fontWeight: "600" },
  // Date
  dateRow: { flexDirection: "row", gap: 12 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: "#aaa", marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  datePreview: {
    fontSize: 15,
    color: "#555",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "500",
  },
});
