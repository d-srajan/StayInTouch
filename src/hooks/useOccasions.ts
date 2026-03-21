import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "@/src/db/client";
import { occasions, contacts, type Occasion, type NewOccasion } from "@/src/db/schema";

export interface OccasionWithContact extends Occasion {
  contactName: string;
  contactColor: string | null;
  daysUntil: number;
}

function getDaysUntil(month: number, day: number): number {
  const today = new Date();
  const thisYear = today.getFullYear();

  let next = new Date(thisYear, month - 1, day);
  // If the date has already passed this year, use next year
  if (next.getTime() < today.setHours(0, 0, 0, 0)) {
    next = new Date(thisYear + 1, month - 1, day);
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((next.getTime() - now.getTime()) / 86_400_000);
}

// In-memory store for web preview
let webOccasions: (Occasion & { contactName: string; contactColor: string | null })[] = [];

export function useOccasions() {
  const [occasionList, setOccasionList] = useState<OccasionWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === "web";

  const loadOccasions = useCallback(async () => {
    try {
      if (isWeb) {
        const withDays = webOccasions.map((o) => ({
          ...o,
          daysUntil: getDaysUntil(o.month, o.day),
        }));
        withDays.sort((a, b) => a.daysUntil - b.daysUntil);
        setOccasionList(withDays);
        return;
      }

      // Native — join occasions with contacts for names
      const allOccasions = db!
        .select({
          id: occasions.id,
          contactId: occasions.contactId,
          type: occasions.type,
          label: occasions.label,
          month: occasions.month,
          day: occasions.day,
          year: occasions.year,
          advanceReminderDays: occasions.advanceReminderDays,
          createdAt: occasions.createdAt,
          contactName: contacts.name,
          contactColor: contacts.color,
        })
        .from(occasions)
        .innerJoin(contacts, eq(occasions.contactId, contacts.id))
        .all();

      const withDays: OccasionWithContact[] = allOccasions.map((o) => ({
        ...o,
        daysUntil: getDaysUntil(o.month, o.day),
      }));

      withDays.sort((a, b) => a.daysUntil - b.daysUntil);
      setOccasionList(withDays);
    } finally {
      setLoading(false);
    }
  }, [isWeb]);

  useEffect(() => {
    loadOccasions();
  }, [loadOccasions]);

  const addOccasion = useCallback(
    (data: {
      contactId: string;
      contactName: string;
      contactColor?: string | null;
      type: string;
      label?: string;
      month: number;
      day: number;
      year?: number;
      advanceReminderDays?: number;
    }) => {
      const now = new Date();
      const id = uuid();
      const entry: NewOccasion = {
        id,
        contactId: data.contactId,
        type: data.type,
        label: data.label ?? null,
        month: data.month,
        day: data.day,
        year: data.year ?? null,
        advanceReminderDays: data.advanceReminderDays ?? 3,
        createdAt: now,
      };

      if (isWeb) {
        const webEntry = {
          ...entry,
          label: entry.label ?? null,
          year: entry.year ?? null,
          advanceReminderDays: entry.advanceReminderDays ?? 3,
          createdAt: now,
          contactName: data.contactName,
          contactColor: data.contactColor ?? null,
        };
        webOccasions = [...webOccasions, webEntry];
      } else {
        db!.insert(occasions).values(entry).run();
      }

      loadOccasions();
      return id;
    },
    [loadOccasions, isWeb]
  );

  const deleteOccasion = useCallback(
    (id: string) => {
      if (isWeb) {
        webOccasions = webOccasions.filter((o) => o.id !== id);
      } else {
        db!.delete(occasions).where(eq(occasions.id, id)).run();
      }
      loadOccasions();
    },
    [loadOccasions, isWeb]
  );

  const getOccasionsForContact = useCallback(
    (contactId: string): OccasionWithContact[] => {
      return occasionList.filter((o) => o.contactId === contactId);
    },
    [occasionList]
  );

  /**
   * Get the nearest upcoming occasion for a contact (in days).
   * Returns null if no occasion within 30 days.
   */
  const getNearestOccasionDays = useCallback(
    (contactId: string): number | null => {
      const contactOccasions = occasionList.filter(
        (o) => o.contactId === contactId && o.daysUntil <= 30
      );
      if (contactOccasions.length === 0) return null;
      return contactOccasions[0].daysUntil; // already sorted by daysUntil
    },
    [occasionList]
  );

  return {
    occasions: occasionList,
    loading,
    refresh: loadOccasions,
    addOccasion,
    deleteOccasion,
    getOccasionsForContact,
    getNearestOccasionDays,
  };
}
