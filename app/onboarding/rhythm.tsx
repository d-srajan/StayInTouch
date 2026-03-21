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
import Slider from "@react-native-community/slider";
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

function formatThreshold(days: number): string {
  if (days <= 7) return `${days} days`;
  if (days < 30) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} month${days >= 45 ? "s" : ""}`;
}

interface PickedContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: { month: number; day: number; year?: number };
}

export default function RhythmScreen() {
  const router = useRouter();
  const { savePref, getPref } = useOnboarding();

  const contacts = useMemo<PickedContact[]>(() => {
    try {
      const raw = getPref("picked_contacts");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [getPref]);

  const defaultThreshold = useMemo(() => {
    const saved = getPref("default_threshold");
    return saved ? parseInt(saved, 10) : 21;
  }, [getPref]);

  const [thresholds, setThresholds] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    contacts.forEach((c) => {
      initial[c.id] = defaultThreshold;
    });
    return initial;
  });

  const updateThreshold = (id: string, value: number) => {
    setThresholds((prev) => ({
      ...prev,
      [id]: Math.round(value),
    }));
  };

  const handleNext = () => {
    // Save thresholds
    const contactsWithThresholds = contacts.map((c) => ({
      ...c,
      thresholdDays: thresholds[c.id] ?? defaultThreshold,
    }));
    savePref("contacts_with_thresholds", JSON.stringify(contactsWithThresholds));
    router.push("/onboarding/permissions" as any);
  };

  const renderItem = ({ item }: { item: PickedContact }) => {
    const threshold = thresholds[item.id] ?? defaultThreshold;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View
            style={[styles.avatar, { backgroundColor: pickColor(item.name) }]}
          >
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Every {formatThreshold(threshold)}
            </Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={3}
          maximumValue={90}
          step={1}
          value={threshold}
          onValueChange={(v) => updateThreshold(item.id, v)}
          minimumTrackTintColor="#0a7ea4"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#0a7ea4"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>3 days</Text>
          <Text style={styles.sliderLabel}>90 days</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.step}>Step 4 of 5</Text>
        <Text style={styles.title}>Set your rhythm</Text>
        <Text style={styles.subtitle}>
          How often do you want to be in touch with each person? Drag to set.
          You can change these anytime.
        </Text>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#E8F6F9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0a7ea4",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  sliderLabel: {
    fontSize: 11,
    color: "#BBB",
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
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
