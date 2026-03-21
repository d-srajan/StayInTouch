import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useContacts } from "@/src/hooks/useContacts";
import { ContactCard } from "@/src/components/ContactCard";

const RELATIONSHIPS = [
  { label: "Family", value: "family" },
  { label: "Close Friend", value: "close_friend" },
  { label: "Friend", value: "friend" },
  { label: "Colleague", value: "colleague" },
  { label: "Long Distance", value: "long_distance" },
];

export default function ContactsScreen() {
  const router = useRouter();
  const { contacts, addContact } = useContacts();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Add contact form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRelationship, setNewRelationship] = useState("friend");
  const [newThreshold, setNewThreshold] = useState("21");

  const filtered = search
    ? contacts.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : contacts;

  const handleAdd = () => {
    if (!newName.trim()) {
      Alert.alert("Name needed", "Every person needs a name.");
      return;
    }
    addContact({
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      email: newEmail.trim() || undefined,
      relationship: newRelationship,
      thresholdDays: parseInt(newThreshold, 10) || 21,
    });
    // Reset
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewRelationship("friend");
    setNewThreshold("21");
    setShowAdd(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <Pressable style={styles.addButton} onPress={() => setShowAdd(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onPress={(id) => router.push(`/contact/${id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search ? "No matches" : "No contacts yet — tap + Add to start."}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Add Contact Modal */}
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
              <Text style={styles.modalTitle}>Add someone</Text>
              <Pressable onPress={handleAdd}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="Their name"
                autoFocus
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Relationship</Text>
              <View style={styles.chips}>
                {RELATIONSHIPS.map((r) => (
                  <Pressable
                    key={r.value}
                    style={[
                      styles.chip,
                      newRelationship === r.value && styles.chipSelected,
                    ]}
                    onPress={() => setNewRelationship(r.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        newRelationship === r.value && styles.chipTextSelected,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>
                Check in every (days): {newThreshold}
              </Text>
              <TextInput
                style={styles.input}
                value={newThreshold}
                onChangeText={setNewThreshold}
                keyboardType="number-pad"
                placeholder="21"
              />
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
    backgroundColor: "#4ECDC4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  list: { paddingBottom: 24 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 15, color: "#aaa" },
  // Modal styles
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
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  chipSelected: { backgroundColor: "#4ECDC4" },
  chipText: { fontSize: 14, color: "#555" },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
});
