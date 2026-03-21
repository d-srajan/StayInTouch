import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "@/src/db/client";
import { contacts, interactions, type Contact, type NewContact, type Interaction } from "@/src/db/schema";
import { getUrgencyScore, sortByUrgency, type UrgencyResult } from "@/src/utils/urgency";

export interface ContactWithUrgency extends Contact {
  urgency: UrgencyResult;
  lastInteraction: Date | null;
}

const AVATAR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function pickColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// In-memory store for web preview
let webStore: ContactWithUrgency[] = [];
let webInteractions: Interaction[] = [];

export function useContacts() {
  const [contactList, setContactList] = useState<ContactWithUrgency[]>([]);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === "web";

  const loadContacts = useCallback(async () => {
    try {
      if (isWeb) {
        const withUrgency = webStore.map((c) => {
          const lastInt = webInteractions
            .filter((i) => i.contactId === c.id)
            .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
          const lastDate = lastInt.length > 0 ? lastInt[0].occurredAt : null;
          const urgency = getUrgencyScore(lastDate, c.thresholdDays, null);
          return { ...c, urgency, lastInteraction: lastDate };
        });
        setContactList(sortByUrgency(withUrgency));
        return;
      }

      const allContacts = db!.select().from(contacts).all();

      const withUrgency: ContactWithUrgency[] = allContacts.map((c) => {
        const lastInt = db!
          .select()
          .from(interactions)
          .where(eq(interactions.contactId, c.id))
          .orderBy(desc(interactions.occurredAt))
          .limit(1)
          .all();

        const lastDate = lastInt.length > 0 ? lastInt[0].occurredAt : null;
        const urgency = getUrgencyScore(lastDate, c.thresholdDays, null);

        return { ...c, urgency, lastInteraction: lastDate };
      });

      setContactList(sortByUrgency(withUrgency));
    } finally {
      setLoading(false);
    }
  }, [isWeb]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const addContact = useCallback(
    (data: {
      name: string;
      phone?: string;
      email?: string;
      relationship?: string;
      preferredChannel?: string;
      thresholdDays?: number;
      notes?: string;
    }) => {
      const now = new Date();
      const id = uuid();
      const newContact: ContactWithUrgency = {
        id,
        name: data.name,
        initials: getInitials(data.name),
        relationship: data.relationship ?? null,
        preferredChannel: data.preferredChannel ?? "sms",
        thresholdDays: data.thresholdDays ?? 21,
        phone: data.phone ?? null,
        email: data.email ?? null,
        notes: data.notes ?? null,
        color: pickColor(data.name),
        createdAt: now,
        updatedAt: now,
        urgency: getUrgencyScore(null, data.thresholdDays ?? 21, null),
        lastInteraction: null,
      };

      if (isWeb) {
        webStore = [...webStore, newContact];
      } else {
        db!.insert(contacts)
          .values({
            id,
            name: newContact.name,
            initials: newContact.initials,
            relationship: newContact.relationship,
            preferredChannel: newContact.preferredChannel,
            thresholdDays: newContact.thresholdDays,
            phone: newContact.phone,
            email: newContact.email,
            notes: newContact.notes,
            color: newContact.color,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }

      loadContacts();
      return id;
    },
    [loadContacts, isWeb]
  );

  const updateContact = useCallback(
    (id: string, data: Partial<NewContact>) => {
      if (isWeb) {
        webStore = webStore.map((c) =>
          c.id === id ? { ...c, ...data, updatedAt: new Date() } : c
        );
      } else {
        db!.update(contacts)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(contacts.id, id))
          .run();
      }
      loadContacts();
    },
    [loadContacts, isWeb]
  );

  const deleteContact = useCallback(
    (id: string) => {
      if (isWeb) {
        webStore = webStore.filter((c) => c.id !== id);
        webInteractions = webInteractions.filter((i) => i.contactId !== id);
      } else {
        db!.delete(interactions).where(eq(interactions.contactId, id)).run();
        db!.delete(contacts).where(eq(contacts.id, id)).run();
      }
      loadContacts();
    },
    [loadContacts, isWeb]
  );

  const logInteraction = useCallback(
    (data: {
      contactId: string;
      type: string;
      channel?: string;
      notes?: string;
      occurredAt?: Date;
    }) => {
      const now = new Date();
      const entry: Interaction = {
        id: uuid(),
        contactId: data.contactId,
        type: data.type,
        channel: data.channel ?? null,
        notes: data.notes ?? null,
        occurredAt: data.occurredAt ?? now,
        createdAt: now,
      };

      if (isWeb) {
        webInteractions = [...webInteractions, entry];
      } else {
        db!.insert(interactions).values(entry).run();
      }
      loadContacts();
    },
    [loadContacts, isWeb]
  );

  const getInteractions = useCallback(
    (contactId: string): Interaction[] => {
      if (isWeb) {
        return webInteractions
          .filter((i) => i.contactId === contactId)
          .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
      }
      return db!
        .select()
        .from(interactions)
        .where(eq(interactions.contactId, contactId))
        .orderBy(desc(interactions.occurredAt))
        .all();
    },
    [isWeb]
  );

  return {
    contacts: contactList,
    loading,
    refresh: loadContacts,
    addContact,
    updateContact,
    deleteContact,
    logInteraction,
    getInteractions,
  };
}
