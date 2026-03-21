import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";

import { useContacts } from "@/src/hooks/useContacts";
import { ContactCard } from "@/src/components/ContactCard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { contacts, loading, refresh } = useContacts();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Contacts that need attention (urgency score >= 1.0)
  const needsAttention = contacts.filter((c) => c.urgency.score >= 1.0);
  // The most urgent contact gets highlighted
  const topContact = needsAttention.length > 0 ? needsAttention[0] : null;

  const handlePress = (id: string) => {
    router.push(`/contact/${id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={needsAttention}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {getGreeting()}. You've got this.
            </Text>

            {topContact && topContact.urgency.level === "overdue" && (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  A little while since you talked — {topContact.name} would love
                  to hear from you.
                </Text>
                <Pressable
                  style={styles.bannerButton}
                  onPress={() => handlePress(topContact.id)}
                >
                  <Text style={styles.bannerButtonText}>Say hi</Text>
                </Pressable>
              </View>
            )}

            {needsAttention.length > 0 && (
              <Text style={styles.sectionTitle}>Thinking of...</Text>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <ContactCard
            contact={item}
            onPress={handlePress}
            highlighted={index === 0}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>All caught up for now.</Text>
              <Text style={styles.emptySubtitle}>Enjoy your day.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  list: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  banner: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 15,
    color: "#5D4037",
    lineHeight: 22,
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: "#FF8A65",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  bannerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
    marginTop: 8,
    marginBottom: 4,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#888",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#aaa",
    marginTop: 4,
  },
});
