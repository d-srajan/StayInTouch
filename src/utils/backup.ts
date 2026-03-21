import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import { db } from "@/src/db/client";
import { contacts, interactions, occasions, userPrefs } from "@/src/db/schema";
import { encrypt, decrypt, generateEncryptionKey } from "./encryption";

const ENCRYPTION_KEY_STORE = "sit_backup_encryption_key";
const BACKUP_FILE_NAME = "stay-in-touch-backup.enc";

export interface BackupData {
  version: number;
  createdAt: string;
  contacts: any[];
  interactions: any[];
  occasions: any[];
  prefs: any[];
}

// ── Encryption key management ──

async function getOrCreateKey(): Promise<string> {
  if (Platform.OS === "web") {
    return "web-preview-key-not-secure";
  }
  try {
    const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE);
    if (existing) return existing;
  } catch {}

  const newKey = await generateEncryptionKey();
  await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE, newKey);
  return newKey;
}

// ── Export all data from SQLite ──

export function exportAllData(): BackupData {
  if (!db) {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      contacts: [],
      interactions: [],
      occasions: [],
      prefs: [],
    };
  }

  const allContacts = db.select().from(contacts).all();
  const allInteractions = db.select().from(interactions).all();
  const allOccasions = db.select().from(occasions).all();
  const allPrefs = db.select().from(userPrefs).all();

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    contacts: allContacts,
    interactions: allInteractions,
    occasions: allOccasions,
    prefs: allPrefs,
  };
}

// ── Create encrypted backup file ──

export async function createBackupFile(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const data = exportAllData();
  const json = JSON.stringify(data);
  const key = await getOrCreateKey();
  const encrypted = await encrypt(json, key);

  const file = new File(Paths.document, BACKUP_FILE_NAME);
  file.write(encrypted);

  return file.uri;
}

// ── Restore from encrypted backup file ──

export async function restoreFromFile(filePath: string): Promise<BackupData> {
  const file = new File(filePath);
  const encrypted = await file.text();

  if (!encrypted) {
    throw new Error("Backup file is empty");
  }

  const key = await getOrCreateKey();
  const json = await decrypt(encrypted, key);
  const data: BackupData = JSON.parse(json);

  if (!data.version || !data.contacts) {
    throw new Error("Invalid backup format");
  }

  return data;
}

// ── Import backup data into SQLite ──

export function importBackupData(data: BackupData): {
  contactCount: number;
  interactionCount: number;
  occasionCount: number;
} {
  if (!db) {
    return { contactCount: 0, interactionCount: 0, occasionCount: 0 };
  }

  let contactCount = 0;
  let interactionCount = 0;
  let occasionCount = 0;

  for (const c of data.contacts) {
    try {
      db.insert(contacts)
        .values({
          ...c,
          createdAt: new Date(c.createdAt ?? c.created_at),
          updatedAt: new Date(c.updatedAt ?? c.updated_at),
        })
        .onConflictDoNothing()
        .run();
      contactCount++;
    } catch {}
  }

  for (const i of data.interactions) {
    try {
      db.insert(interactions)
        .values({
          ...i,
          occurredAt: new Date(i.occurredAt ?? i.occurred_at),
          createdAt: new Date(i.createdAt ?? i.created_at),
        })
        .onConflictDoNothing()
        .run();
      interactionCount++;
    } catch {}
  }

  for (const o of data.occasions) {
    try {
      db.insert(occasions)
        .values({
          ...o,
          createdAt: new Date(o.createdAt ?? o.created_at),
        })
        .onConflictDoNothing()
        .run();
      occasionCount++;
    } catch {}
  }

  for (const p of data.prefs) {
    if (p.key === "onboarding_complete") continue;
    try {
      db.insert(userPrefs)
        .values(p)
        .onConflictDoUpdate({
          target: userPrefs.key,
          set: { value: p.value },
        })
        .run();
    } catch {}
  }

  return { contactCount, interactionCount, occasionCount };
}
