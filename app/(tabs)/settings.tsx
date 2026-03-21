import { View, Text, StyleSheet, Pressable, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { requestNotificationPermissions } from "@/src/utils/notifications";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Permissions needed",
          "Enable notifications in your device settings to get gentle reminders."
        );
        return;
      }
    }
    setNotificationsEnabled(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Gentle nudges</Text>
            <Text style={styles.rowHint}>
              Morning reminders so you don't miss anyone
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ true: "#4ECDC4" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.about}>
          Stay In Touch helps you maintain the relationships that matter most.
          All your data stays on your device.
        </Text>
        <Text style={styles.version}>v1.0.0 — Phase 1</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 16, fontWeight: "500", color: "#1a1a1a" },
  rowHint: { fontSize: 13, color: "#aaa", marginTop: 2 },
  about: { fontSize: 15, color: "#666", lineHeight: 22 },
  version: { fontSize: 13, color: "#bbb", marginTop: 8 },
});
