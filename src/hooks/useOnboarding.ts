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
let initAttempted = false;
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

  // Initial check — retries if db wasn't ready on first attempt
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

    function tryInit() {
      if (globalIsComplete !== null) return; // already resolved

      if (!db) {
        // DB not ready yet — if this is first attempt, retry after a short delay
        if (!initAttempted) {
          initAttempted = true;
          setTimeout(tryInit, 200);
        } else {
          // DB truly unavailable after retry — default to not complete
          notifyAll(false);
        }
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
    }

    tryInit();
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
