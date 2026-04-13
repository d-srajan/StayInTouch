import { useContacts } from "@/src/hooks/useContacts";
import { useOccasions } from "@/src/hooks/useOccasions";
import { useOnboarding } from "@/src/hooks/useOnboarding";
import { requestNotificationPermissions } from "@/src/utils/notifications";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ContactToAdd {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  thresholdDays?: number;
  birthday?: { month: number; day: number; year?: number };
}

export default function PermissionsScreen() {
  const router = useRouter();
  const { completeOnboarding, getPref } = useOnboarding();
  const { addContact } = useContacts();
  const { addOccasion } = useOccasions();

  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  const contactsToAdd = useMemo<ContactToAdd[]>(() => {
    try {
      const raw = getPref("contacts_with_thresholds");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [getPref]);

  const peopleCount = contactsToAdd.length;
  const occasionsCount = contactsToAdd.filter((c) => c.birthday).length;

  const handleFinish = useCallback(async () => {
  setLoading(true);

  try {
    // Request notification permissions if enabled
    if (notifications && Platform.OS !== "web") {
      await requestNotificationPermissions();
    }

    // Add all selected contacts to the database
    for (const contact of contactsToAdd) {
      try {
        const contactId = addContact({
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          thresholdDays: contact.thresholdDays ?? 21,
        });

        // If they have a birthday, add it as an occasion
        if (contact.birthday && contactId) {
          addOccasion({
            contactId,
            contactName: contact.name,
            type: "birthday",
            label: `${contact.name}'s birthday`,
            month: contact.birthday.month,
            day: contact.birthday.day,
            year: contact.birthday.year ?? undefined,
          });
        }
      } catch (contactError) {
        console.error(`Failed to add contact ${contact.name}:`, contactError);
        // Continue with other contacts
      }
    }

    // Mark onboarding as complete
    completeOnboarding();
  } catch (e) {
    console.error('Onboarding completion error:', e);
    Alert.alert("Something went wrong", "Please try again.");
  } finally {
    setLoading(false);
  }
}, [notifications, contactsToAdd, addContact, addOccasion, completeOnboarding]);


  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 5 of 5</Text>
          <Text style={styles.title}>Almost there</Text>
          <Text style={styles.subtitle}>
            A couple of permissions to help you stay in touch — all optional.
          </Text>
        </View>

        <View style={styles.permissions}>
          <View style={styles.permRow}>
            <View style={styles.permInfo}>
              <Text style={styles.permEmoji}>🔔</Text>
              <View style={styles.permText}>
                <Text style={styles.permLabel}>Gentle nudges</Text>
                <Text style={styles.permDesc}>
                  Morning digest so you don't miss anyone
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#E0E0E0", true: "#7CC4D6" }}
              thumbColor={notifications ? "#0a7ea4" : "#BDBDBD"}
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Your setup</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>👥</Text>
            <Text style={styles.summaryText}>
              {peopleCount} {peopleCount === 1 ? "person" : "people"}
            </Text>
          </View>
          {occasionsCount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryEmoji}>🎂</Text>
              <Text style={styles.summaryText}>
                {occasionsCount} {occasionsCount === 1 ? "birthday" : "birthdays"}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEmoji}>✨</Text>
            <Text style={styles.summaryText}>Ready to go</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerSection}>
        <Text style={styles.warmMessage}>
          The people you love are lucky to have you thinking about them.
        </Text>
        <View style={styles.footer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleFinish}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Setting up..." : "Start keeping in touch"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 28,
  },
  step: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0a7ea4",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
  },
  permissions: {
    marginBottom: 28,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    justifyContent: "space-between",
  },
  permInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  permEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  permText: {
    flex: 1,
  },
  permLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  permDesc: {
    fontSize: 13,
    color: "#888",
    marginTop: 1,
  },
  summary: {
    backgroundColor: "#F0FAFE",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D4EEF5",
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0a7ea4",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  summaryText: {
    fontSize: 15,
    color: "#333",
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  warmMessage: {
    fontSize: 15,
    color: "#0a7ea4",
    textAlign: "center",
    paddingHorizontal: 30,
    paddingTop: 16,
    lineHeight: 22,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  backButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
  },
  button: {
    flex: 1,
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
