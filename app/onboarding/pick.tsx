import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { getImportedContacts } from "./import";
import { useOnboarding } from "@/src/hooks/useOnboarding";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
];

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function PickScreen() {
  const router = useRouter();
  const { savePref, getPref } = useOnboarding();
  const contacts = getImportedContacts();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const defaultThreshold = useMemo(() => {
    const saved = getPref("default_threshold");
    return saved ? parseInt(saved, 10) : 21;
  }, [getPref]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c.id)));
    }
  };

  const handleNext = () => {
    const picked = contacts.filter((c) => selected.has(c.id));
    savePref("picked_contacts", JSON.stringify(picked));
    router.push("/onboarding/rhythm" as any);
  };

  const renderItem = ({ item }: { item: (typeof contacts)[0] }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => toggle(item.id)}
      >
        <View style={[styles.avatar, { backgroundColor: pickColor(item.name) }]}>
          <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {item.phone && (
            <Text style={styles.detail}>{item.phone}</Text>
          )}
          {item.birthday && (
            <Text style={styles.birthday}>
              🎂 {item.birthday.month}/{item.birthday.day}
            </Text>
          )}
        </View>
        <View style={styles.suggestedBadge}>
          <Text style={styles.suggestedText}>{defaultThreshold}d</Text>
        </View>
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && <Text style={styles.check}>✓</Text>}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 3 of 5</Text>
        <Text style={styles.title}>Pick your people</Text>
        <Text style={styles.subtitle}>
          Who do you want to stay in touch with? You can always add more later.
        </Text>
        <Pressable style={styles.selectAll} onPress={selectAll}>
          <Text style={styles.selectAllText}>
            {selected.size === contacts.length ? "Deselect all" : "Select all"}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        }
      />

      <View style={styles.footerInfo}>
        <Text style={styles.footerNote}>
          Thresholds auto-suggested — you'll fine-tune next.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.button, selected.size === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selected.size === 0}
        >
          <Text style={styles.buttonText}>
            Next ({selected.size} selected)
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
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
  selectAll: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowSelected: {
    borderColor: "#0a7ea4",
    backgroundColor: "#F0FAFE",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  detail: {
    fontSize: 13,
    color: "#999",
    marginTop: 1,
  },
  birthday: {
    fontSize: 12,
    color: "#E67E22",
    marginTop: 2,
  },
  suggestedBadge: {
    backgroundColor: "#E8F6F9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  suggestedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: "#0a7ea4",
    backgroundColor: "#0a7ea4",
  },
  check: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  empty: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#999",
  },
  footerInfo: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  footerNote: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
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
