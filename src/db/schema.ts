import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  initials: text("initials"),
  relationship: text("relationship"), // 'family' | 'close_friend' | 'friend' | 'colleague' | 'long_distance'
  preferredChannel: text("preferred_channel"), // 'whatsapp' | 'imessage' | 'sms' | 'email' | 'call'
  thresholdDays: integer("threshold_days").notNull().default(21),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  color: text("color"), // for avatar background
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  type: text("type"), // 'message' | 'call' | 'in_person' | 'other'
  channel: text("channel"),
  notes: text("notes"),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const occasions = sqliteTable("occasions", {
  id: text("id").primaryKey(),
  contactId: text("contact_id")
    .notNull()
    .references(() => contacts.id),
  type: text("type").notNull(), // 'birthday' | 'anniversary' | 'custom'
  label: text("label"), // e.g. "Work anniversary"
  month: integer("month").notNull(), // 1-12
  day: integer("day").notNull(), // 1-31
  year: integer("year"), // optional, null = recurring annually
  advanceReminderDays: integer("advance_reminder_days").default(3),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const userPrefs = sqliteTable("user_prefs", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Type exports
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
export type Occasion = typeof occasions.$inferSelect;
export type NewOccasion = typeof occasions.$inferInsert;
