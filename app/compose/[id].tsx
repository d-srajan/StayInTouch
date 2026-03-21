import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useContacts } from "@/src/hooks/useContacts";
import { DraftComposer } from "@/src/components/DraftComposer";
import { openWithDraft } from "@/src/utils/deepLink";

function getContext(
  relationship: string | null,
  daysSince: number
): string {
  if (relationship === "family") return "family";
  if (relationship === "colleague") return "professional";
  if (daysSince > 60) return "long_gap";
  return "general";
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  imessage: "iMessage",
  sms: "Messages",
  email: "Email",
  call: "Phone",
};

export default function ComposeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { contacts, logInteraction } = useContacts();

  const contact = contacts.find((c) => c.id === id);

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Contact not found</Text>
      </SafeAreaView>
    );
  }

  const context = getContext(contact.relationship, contact.urgency.daysSince);
  const channelLabel =
    CHANNEL_LABELS[contact.preferredChannel ?? "sms"] ?? "Messages";

  const handleSend = async (draft: string) => {
    // Log the interaction
    logInteraction({
      contactId: contact.id,
      type: "message",
      channel: contact.preferredChannel ?? "sms",
      notes: draft.length > 100 ? draft.slice(0, 100) + "..." : draft,
    });

    // Open the messaging app with the draft
    await openWithDraft(
      contact.preferredChannel ?? "sms",
      draft,
      contact.phone ?? undefined
    );

    Alert.alert(
      "Logged!",
      "That little moment matters more than you think.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  const handleSkip = () => {
    // Warm response per spec: "No worries"
    Alert.alert(
      "No worries",
      "You've got this — reach out whenever feels right.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: contact.color ?? "#ccc" },
            ]}
          >
            <Text style={styles.initials}>{contact.initials ?? "?"}</Text>
          </View>
          <Text style={styles.name}>Message {contact.name}</Text>
          <Text style={styles.channel}>via {channelLabel}</Text>
        </View>

        {/* Draft composer */}
        <DraftComposer
          contactName={contact.name}
          relationship={contact.relationship}
          context={context}
          onSend={handleSend}
          onSkip={handleSkip}
        />
      </ScrollView>
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
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  initials: { color: "#fff", fontWeight: "700", fontSize: 22 },
  name: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  channel: { fontSize: 14, color: "#888", marginTop: 4 },
});
