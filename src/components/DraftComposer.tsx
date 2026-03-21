import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useState, useMemo } from "react";
import { getTemplate } from "@/src/data/messageTemplates";

const TONES = [
  { label: "Warm", value: "warm" },
  { label: "Casual", value: "casual" },
  { label: "Brief", value: "brief" },
  { label: "Playful", value: "playful" },
];

interface DraftComposerProps {
  contactName: string;
  relationship: string | null;
  context: string; // 'general' | 'long_gap' | 'birthday' | 'occasion' | 'family' | 'professional'
  onSend: (draft: string) => void;
  onSkip: () => void;
}

export function DraftComposer({
  contactName,
  relationship,
  context,
  onSend,
  onSkip,
}: DraftComposerProps) {
  const [tone, setTone] = useState("warm");
  const [draft, setDraft] = useState(() =>
    getTemplate(context, "warm", contactName)
  );
  const [edited, setEdited] = useState(false);

  const handleToneChange = (newTone: string) => {
    setTone(newTone);
    if (!edited) {
      setDraft(getTemplate(context, newTone, contactName));
    }
  };

  const handleRefresh = () => {
    setDraft(getTemplate(context, tone, contactName));
    setEdited(false);
  };

  const handleEditDraft = (text: string) => {
    setDraft(text);
    setEdited(true);
  };

  // Get the right tones for this context
  const availableTones = useMemo(() => {
    if (relationship === "colleague") {
      return [
        { label: "Formal", value: "formal" },
        { label: "Casual", value: "casual" },
      ];
    }
    return TONES;
  }, [relationship]);

  return (
    <View style={styles.container}>
      {/* Tone picker */}
      <Text style={styles.label} accessibilityRole="header">
        Tone
      </Text>
      <View style={styles.toneRow} accessibilityRole="radiogroup">
        {availableTones.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.toneChip, tone === t.value && styles.toneChipActive]}
            onPress={() => handleToneChange(t.value)}
            accessible
            accessibilityRole="radio"
            accessibilityState={{ selected: tone === t.value }}
            accessibilityLabel={`${t.label} tone`}
          >
            <Text
              style={[
                styles.toneText,
                tone === t.value && styles.toneTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Draft area */}
      <View style={styles.draftCard}>
        <TextInput
          style={styles.draftInput}
          value={draft}
          onChangeText={handleEditDraft}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Message draft"
          accessibilityHint="Edit the message before sending"
        />
        <Pressable
          style={styles.refreshButton}
          onPress={handleRefresh}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Try another draft"
          accessibilityHint="Generates a new message suggestion"
        >
          <Text style={styles.refreshText}>Try another</Text>
        </Pressable>
      </View>

      <Text
        style={styles.hint}
        accessibilityRole="text"
      >
        A starting point — make it yours. Even "hi" is enough.
      </Text>

      {/* Actions */}
      <Pressable
        style={styles.sendButton}
        onPress={() => onSend(draft)}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Copy and send message"
      >
        <Text style={styles.sendText}>Copy & send</Text>
      </Pressable>

      <Pressable
        style={styles.skipButton}
        onPress={onSkip}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Skip and write your own message"
      >
        <Text style={styles.skipText}>I'll write my own</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  toneRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  toneChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  toneChipActive: {
    backgroundColor: "#4ECDC4",
  },
  toneText: {
    fontSize: 14,
    color: "#555",
  },
  toneTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  draftCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  draftInput: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1a1a1a",
    minHeight: 100,
  },
  refreshButton: {
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  refreshText: {
    fontSize: 14,
    color: "#4ECDC4",
    fontWeight: "500",
  },
  hint: {
    fontSize: 13,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  sendButton: {
    backgroundColor: "#4ECDC4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 15,
    color: "#888",
  },
});
