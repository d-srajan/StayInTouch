import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ExpoContacts from "expo-contacts";
import { useOnboarding } from "@/src/hooks/useOnboarding";

type ImportSource = "phone" | "manual";

interface DeviceContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: { month: number; day: number; year?: number };
}

// Store for sharing between screens
let importedContacts: DeviceContact[] = [];
export function getImportedContacts() {
  return importedContacts;
}

export default function ImportScreen() {
  const router = useRouter();
  const { savePref } = useOnboarding();
  const [source, setSource] = useState<ImportSource | null>(null);
  const [loading, setLoading] = useState(false);

  const importFromPhone = async () => {
    if (Platform.OS === "web") {
      // Mock data for web preview
      importedContacts = [
        { id: "mock-1", name: "Mom", phone: "+1234567890" },
        { id: "mock-2", name: "Alex Chen", phone: "+1987654321", email: "alex@example.com" },
        { id: "mock-3", name: "Jamie Park", phone: "+1555000111" },
        { id: "mock-4", name: "Sam Rivera", email: "sam@work.com" },
        { id: "mock-5", name: "Taylor Kim", phone: "+1555000222", birthday: { month: 6, day: 15 } },
        { id: "mock-6", name: "Jordan Lee", phone: "+1555000333" },
        { id: "mock-7", name: "Chris Wu", phone: "+1555000444", birthday: { month: 12, day: 3 } },
        { id: "mock-8", name: "Pat Novak", phone: "+1555000555" },
      ];
      savePref("import_source", "phone");
      router.push("/onboarding/pick" as any);
      return;
    }

    setLoading(true);
    try {
      const { status } = await ExpoContacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Contacts access",
          "We need access to help you pick people to stay in touch with. Your data stays on your device.",
          [{ text: "OK" }]
        );
        setLoading(false);
        return;
      }

      const { data } = await ExpoContacts.getContactsAsync({
        fields: [
          ExpoContacts.Fields.PhoneNumbers,
          ExpoContacts.Fields.Emails,
          ExpoContacts.Fields.Birthday,
        ],
        sort: ExpoContacts.SortTypes.LastName,
      });

      importedContacts = data
        .filter((c) => c.name && c.name.trim().length > 0)
        .slice(0, 200) // cap to avoid overwhelming
        .map((c) => ({
          id: c.id ?? String(Math.random()),
          name: c.name!,
          phone: c.phoneNumbers?.[0]?.number ?? undefined,
          email: c.emails?.[0]?.email ?? undefined,
          birthday: c.birthday
            ? {
                month: (c.birthday.month ?? 0) + 1, // expo-contacts months are 0-based
                day: c.birthday.day ?? 1,
                year: c.birthday.year ?? undefined,
              }
            : undefined,
        }));

      savePref("import_source", "phone");
      router.push("/onboarding/pick" as any);
    } catch (e) {
      Alert.alert("Couldn't access contacts", "Please try again or add people manually.");
    } finally {
      setLoading(false);
    }
  };

  const goManual = () => {
    importedContacts = [];
    savePref("import_source", "manual");
    // Skip pick & rhythm screens — go straight to permissions
    router.push("/onboarding/permissions" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 2 of 5</Text>
          <Text style={styles.title}>Add your people</Text>
          <Text style={styles.subtitle}>
            Where should we look for the people you care about?
          </Text>
        </View>

        <View style={styles.options}>
          <Pressable
            style={[styles.option, source === "phone" && styles.optionSelected]}
            onPress={() => setSource("phone")}
          >
            <Text style={styles.optionEmoji}>📱</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Phone contacts</Text>
              <Text style={styles.optionDesc}>
                We'll suggest people from your phone
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                source === "phone" && styles.radioSelected,
              ]}
            >
              {source === "phone" && <View style={styles.radioDot} />}
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.option,
              source === "manual" && styles.optionSelected,
            ]}
            onPress={() => setSource("manual")}
          >
            <Text style={styles.optionEmoji}>✍️</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Add manually</Text>
              <Text style={styles.optionDesc}>
                Type in names yourself — take your time
              </Text>
            </View>
            <View
              style={[
                styles.radio,
                source === "manual" && styles.radioSelected,
              ]}
            >
              {source === "manual" && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        </View>

        <View style={styles.privacy}>
          <Text style={styles.privacyText}>
            🔒 Contact data stays on your device. We only read names, numbers,
            and birthdays — never messages or call history.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.button, !source && styles.buttonDisabled]}
          onPress={source === "phone" ? importFromPhone : goManual}
          disabled={!source || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Importing..." : source === "phone" ? "Import contacts" : "Continue"}
          </Text>
        </Pressable>
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
    marginBottom: 32,
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
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: "#E8E8E8",
  },
  optionSelected: {
    borderColor: "#0a7ea4",
    backgroundColor: "#F0FAFE",
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    color: "#888",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  radioSelected: {
    borderColor: "#0a7ea4",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0a7ea4",
  },
  privacy: {
    marginTop: 24,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
  },
  privacyText: {
    fontSize: 13,
    color: "#777",
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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
    opacity: 0.4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
