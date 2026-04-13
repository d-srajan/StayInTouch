import { withDatabaseVoid } from "./client";
import { sql } from "drizzle-orm";

/**
 * Run initial table creation.
 * Drizzle-kit push is the preferred approach during development,
 * but this ensures tables exist at runtime on a fresh install.
 */
export function runMigrations() {
  withDatabaseVoid((safeDb) => {
    safeDb.run(sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        initials TEXT,
        relationship TEXT,
        preferred_channel TEXT,
        threshold_days INTEGER NOT NULL DEFAULT 21,
        phone TEXT,
        email TEXT,
        notes TEXT,
        color TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    safeDb.run(sql`
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id),
        type TEXT,
        channel TEXT,
        notes TEXT,
        occurred_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    safeDb.run(sql`
      CREATE TABLE IF NOT EXISTS occasions (
        id TEXT PRIMARY KEY,
        contact_id TEXT NOT NULL REFERENCES contacts(id),
        type TEXT NOT NULL,
        label TEXT,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        year INTEGER,
        advance_reminder_days INTEGER DEFAULT 3,
        created_at INTEGER NOT NULL
      );
    `);

    safeDb.run(sql`
      CREATE TABLE IF NOT EXISTS user_prefs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Index for interaction lookups by contact
    safeDb.run(sql`
      CREATE INDEX IF NOT EXISTS idx_interactions_contact
      ON interactions(contact_id, occurred_at DESC);
    `);

    console.log('Database migrations completed successfully');
  }, () => {
    console.warn('Database not available, skipping migrations');
  });
}
