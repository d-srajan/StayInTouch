import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OccasionsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Occasions</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Birthdays and special dates will show up here.
        </Text>
        <Text style={styles.emptySubtext}>Coming in Phase 2.</Text>
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
  },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { fontSize: 16, color: "#888" },
  emptySubtext: { fontSize: 14, color: "#bbb", marginTop: 4 },
});
