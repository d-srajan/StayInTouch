import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { db } from "@/src/db/client";
import { userPrefs } from "@/src/db/schema";
import { eq } from "drizzle-orm";

const ONBOARDING_KEY = "onboarding_complete";

// In-memory store for web preview
let webPrefs: Record<string, string> = {};

// ── Global state shared across all hook instances ──
let globalIsComplete: boolean | null = null;
const listeners = new Set<(value: boolean) => void>();

function notifyAll(value: boolean) {
  globalIsComplete = value;
  listeners.forEach((fn) => fn(value));
}

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState<boolean | null>(globalIsComplete);
  const isWeb = Platform.OS === "web";

  // Subscribe to global changes
  useEffect(() => {
    const handler = (v: boolean) => setIsComplete(v);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Initial check (only runs once globally)
  useEffect(() => {
    if (globalIsComplete !== null) {
      setIsComplete(globalIsComplete);
      return;
    }

    if (isWeb) {
      const val = webPrefs[ONBOARDING_KEY] === "true";
      notifyAll(val);
      return;
    }
    if (!db) {
      notifyAll(false);
      return;
    }
    try {
      const rows = db
        .select()
        .from(userPrefs)
        .where(eq(userPrefs.key, ONBOARDING_KEY))
        .all();
      notifyAll(rows.length > 0 && rows[0].value === "true");
    } catch {
      notifyAll(false);
    }
  }, [isWeb]);

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
    // Notify ALL hook instances (including _layout.tsx)
    notifyAll(true);
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
