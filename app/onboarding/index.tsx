import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useOnboarding } from "@/src/hooks/useOnboarding";

type Goal = {
  id: string;
  emoji: string;
  label: string;
  description: string;
  threshold: number;
};

const GOALS: Goal[] = [
  {
    id: "friends_family",
    emoji: "💛",
    label: "Friends & family",
    description: "Keep in touch with the people closest to you",
    threshold: 14,
  },
  {
    id: "birthdays",
    emoji: "🎂",
    label: "Birthdays & occasions",
    description: "Never miss a birthday or special day",
    threshold: 21,
  },
  {
    id: "social",
    emoji: "🌟",
    label: "Be more social",
    description: "Build a habit of reaching out regularly",
    threshold: 14,
  },
  {
    id: "professional",
    emoji: "💼",
    label: "Professional network",
    description: "Stay connected with colleagues and mentors",
    threshold: 45,
  },
  {
    id: "long_distance",
    emoji: "🌍",
    label: "Long-distance loved ones",
    description: "Bridge the distance with people far away",
    threshold: 21,
  },
];

export default function GoalsScreen() {
  const router = useRouter();
  const { savePref } = useOnboarding();
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const handleNext = () => {
    // Save selected goals
    savePref("onboarding_goals", JSON.stringify(Array.from(selected)));

    // Determine default threshold from selected goals
    const selectedGoals = GOALS.filter((g) => selected.has(g.id));
    const defaultThreshold =
      selectedGoals.length > 0
        ? Math.min(...selectedGoals.map((g) => g.threshold))
        : 21;
    savePref("default_threshold", String(defaultThreshold));

    router.push("/onboarding/import" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.step}>Step 1 of 5</Text>
          <Text style={styles.title}>What brings you here?</Text>
          <Text style={styles.subtitle}>
            Pick all that resonate. This helps us suggest the right rhythm for
            staying in touch.
          </Text>
        </View>

        <View style={styles.goals}>
          {GOALS.map((goal) => {
            const isSelected = selected.has(goal.id);
            return (
              <Pressable
                key={goal.id}
                style={[styles.goalCard, isSelected && styles.goalSelected]}
                onPress={() => toggle(goal.id)}
              >
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalText}>
                  <Text
                    style={[
                      styles.goalLabel,
                      isSelected && styles.goalLabelSelected,
                    ]}
                  >
                    {goal.label}
                  </Text>
                  <Text style={styles.goalDesc}>{goal.description}</Text>
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
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, selected.size === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selected.size === 0}
        >
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
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
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
  goals: {
    gap: 12,
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
  },
  goalSelected: {
    borderColor: "#0a7ea4",
    backgroundColor: "#F0FAFE",
  },
  goalEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  goalText: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  goalLabelSelected: {
    color: "#0a7ea4",
  },
  goalDesc: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: "#FAFAFA",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  button: {
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
