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
import { useState, useCallback, useMemo } from "react";

import { useContacts } from "@/src/hooks/useContacts";
import { useOccasions, type OccasionWithContact } from "@/src/hooks/useOccasions";
import { ContactCard } from "@/src/components/ContactCard";
import { OccasionCard } from "@/src/components/OccasionCard";
import { getUrgencyScore, sortByUrgency } from "@/src/utils/urgency";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const router = useRouter();
  const { contacts, loading, refresh } = useContacts();
  const { occasions, refresh: refreshOccasions, getNearestOccasionDays } = useOccasions();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshOccasions()]);
    setRefreshing(false);
  }, [refresh, refreshOccasions]);

  // Re-score contacts with occasion boost
  const contactsWithOccasionBoost = useMemo(() => {
    return contacts.map((c) => {
      const occasionDays = getNearestOccasionDays(c.id);
      if (occasionDays === null) return c;
      // Re-compute urgency with occasion boost
      const urgency = getUrgencyScore(c.lastInteraction, c.thresholdDays, occasionDays);
      return { ...c, urgency };
    });
  }, [contacts, getNearestOccasionDays]);

  const sorted = useMemo(() => sortByUrgency(contactsWithOccasionBoost), [contactsWithOccasionBoost]);

  // Contacts that need attention (urgency score >= 1.0)
  const needsAttention = sorted.filter((c) => c.urgency.score >= 1.0);
  const topContact = needsAttention.length > 0 ? needsAttention[0] : null;

  // Upcoming occasions within 7 days
  const soonOccasions = occasions.filter((o) => o.daysUntil <= 7);

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

            {/* Urgency banner */}
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

            {/* Occasion banners */}
            {soonOccasions.map((o) => (
              <Pressable
                key={o.id}
                style={styles.occasionBanner}
                onPress={() => handlePress(o.contactId)}
              >
                <Text style={styles.occasionBannerText}>
                  {o.daysUntil === 0
                    ? `Today is ${o.contactName}'s ${o.type === "birthday" ? "birthday" : o.label ?? "special day"}! A quick message goes a long way.`
                    : `${o.contactName}'s ${o.type === "birthday" ? "birthday" : o.label ?? "special day"} is in ${o.daysUntil} day${o.daysUntil > 1 ? "s" : ""} — a quick message goes a long way.`}
                </Text>
              </Pressable>
            ))}

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
  occasionBanner: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB74D",
  },
  occasionBannerText: {
    fontSize: 15,
    color: "#5D4037",
    lineHeight: 22,
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
