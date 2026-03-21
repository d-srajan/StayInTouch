import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { db } from "@/src/db/client";
import { userPrefs } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const ONBOARDING_KEY = "onboarding_complete";

// In-memory store for web preview
let webPrefs: Record<string, string> = {};

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null); // null = loading
  const isWeb = Platform.OS === "web";

  const check = useCallback(() => {
    if (isWeb) {
      setIsComplete(webPrefs[ONBOARDING_KEY] === "true");
      return;
    }
    if (!db) {
      setIsComplete(false);
      return;
    }
    try {
      const rows = db
        .select()
        .from(userPrefs)
        .where(eq(userPrefs.key, ONBOARDING_KEY))
        .all();
      setIsComplete(rows.length > 0 && rows[0].value === "true");
    } catch {
      setIsComplete(false);
    }
  }, [isWeb]);

  useEffect(() => {
    check();
  }, [check]);

  const completeOnboarding = useCallback(() => {
    if (isWeb) {
      webPrefs[ONBOARDING_KEY] = "true";
    } else if (db) {
      db.insert(userPrefs)
        .values({ key: ONBOARDING_KEY, value: "true" })
        .onConflictDoUpdate({
          target: userPrefs.key,
          set: { value: "true" },
        })
        .run();
    }
    setIsComplete(true);
  }, [isWeb]);

  const savePref = useCallback(
    (key: string, value: string) => {
      if (isWeb) {
        webPrefs[key] = value;
      } else if (db) {
        db.insert(userPrefs)
          .values({ key, value })
          .onConflictDoUpdate({
            target: userPrefs.key,
            set: { value },
          })
          .run();
      }
    },
    [isWeb]
  );

  const getPref = useCallback(
    (key: string): string | null => {
      if (isWeb) {
        return webPrefs[key] ?? null;
      }
      if (!db) return null;
      try {
        const rows = db
          .select()
          .from(userPrefs)
          .where(eq(userPrefs.key, key))
          .all();
        return rows.length > 0 ? rows[0].value : null;
      } catch {
        return null;
      }
    },
    [isWeb]
  );

  return { isComplete, completeOnboarding, savePref, getPref };
}
