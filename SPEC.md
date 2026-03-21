# Stay In Touch — Full Product Spec

## What this app is

A mobile app that helps people maintain relationships with friends and family. It tracks when you last contacted someone, reminds you gently when it's been too long, reminds you of birthdays and special occasions, and helps you draft a message to get started.

**Core philosophy:** The user may be dealing with loneliness or mental health struggles. The app must never make them feel worse. Every interaction is warm, encouraging, and shame-free.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo | One codebase for iOS + Android. Expo handles builds, OTA updates, permissions. |
| Local DB | SQLite via `expo-sqlite` + `drizzle-orm` | Encrypted with SQLCipher. Fully offline. Schema migrations handled cleanly. |
| Notifications | `expo-notifications` | Scheduled local notifications only — no push server needed. Urgency algorithm runs on-device. |
| Contacts import | `expo-contacts` | Native read-only access. Pulled once at onboarding, stored locally. |
| Calendar import | `expo-calendar` | Read-only. Used to auto-detect birthdays from calendar events. |
| AI drafting | Canned message templates (built-in) | Zero cost, zero network call, works offline. See message library below. |
| Backup | Google Drive API (user's own account) | User authenticates with their own Google account. App uploads one encrypted JSON file. No server involved. |

---

## SQLite Schema

```sql
-- contacts table
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT,
  relationship TEXT, -- 'family' | 'close_friend' | 'friend' | 'colleague' | 'long_distance'
  preferred_channel TEXT, -- 'whatsapp' | 'imessage' | 'sms' | 'email' | 'call'
  threshold_days INTEGER NOT NULL DEFAULT 21,
  phone TEXT,
  email TEXT,
  notes TEXT,
  color TEXT, -- for avatar background
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- interactions table
CREATE TABLE interactions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  type TEXT, -- 'message' | 'call' | 'in_person' | 'other'
  channel TEXT,
  notes TEXT,
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- occasions table
CREATE TABLE occasions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id),
  type TEXT NOT NULL, -- 'birthday' | 'anniversary' | 'custom'
  label TEXT, -- e.g. "Work anniversary"
  month INTEGER NOT NULL, -- 1-12
  day INTEGER NOT NULL,   -- 1-31
  year INTEGER,           -- optional, null = recurring annually
  advance_reminder_days INTEGER DEFAULT 3,
  created_at INTEGER NOT NULL
);

-- user_prefs table
CREATE TABLE user_prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- keys: goals (JSON array), notifications_enabled, backup_enabled, reminder_time
```

---

## Urgency Algorithm (v1)

Isolated in one function. Easy to replace in v2 without touching the rest of the app.

```typescript
// src/utils/urgency.ts

export type UrgencyLevel = 'ok' | 'soon' | 'overdue';

export interface UrgencyResult {
  score: number;
  level: UrgencyLevel;
  daysSince: number;
  overdueness: number;
}

export function getUrgencyScore(
  lastContactDate: Date | null,
  thresholdDays: number,
  upcomingOccasionDays: number | null  // null if no occasion soon
): UrgencyResult {
  const today = new Date();
  const daysSince = lastContactDate
    ? Math.floor((today.getTime() - lastContactDate.getTime()) / 86400000)
    : thresholdDays * 2; // never contacted = treat as very overdue

  const overdueness = daysSince / thresholdDays;

  // occasion boost: max +1.0 if occasion is tomorrow, 0 if 7+ days away
  const occasionBoost = upcomingOccasionDays !== null
    ? Math.max(0, 1 - upcomingOccasionDays / 7)
    : 0;

  const score = overdueness + occasionBoost;

  const level: UrgencyLevel =
    score >= 1.5 ? 'overdue' :
    score >= 1.0 ? 'soon' :
    'ok';

  return { score, level, daysSince, overdueness };
}

// Sort contacts by urgency descending
export function sortByUrgency(contacts: ContactWithUrgency[]): ContactWithUrgency[] {
  return [...contacts].sort((a, b) => b.urgency.score - a.urgency.score);
}
```

**Score thresholds:**
- `< 1.0` → green dot, "doing well" — not shown in needs-attention list
- `1.0–1.5` → amber dot — listed in "needs attention"
- `> 1.5` → coral/red dot — shown as banner at top of home screen

**Designed to evolve:** v2 can add relationship-weight multipliers, recency decay, or ML-based scoring by only changing this file.

---

## Canned Message Library (Zero Cost, Zero API)

Selection logic:
```typescript
getTemplate(context, tone) =>
  templates[context][tone] ??
  templates[context]['warm'] ??
  templates['general']['warm'] ??
  `Hi ${name}!`   // ultimate fallback — always works
```

Rotate within session using a local index so the user never sees the same draft twice in a row.

```typescript
// src/data/messageTemplates.ts

export const templates = {
  general: {
    warm: [
      "Hey {name}, been thinking about you. How are you doing?",
      "Hi {name}! Just wanted to check in and see how you're going.",
      "Thinking of you, {name}. Hope everything's good on your end.",
    ],
    casual: [
      "Yo {name}! What's going on with you lately?",
      "Hey {name}, what have you been up to?",
      "Hey! Haven't caught up in a bit — what's new with you, {name}?",
    ],
    brief: [
      "Hi {name}! Just wanted to say hi.",
      "Hey {name} — hi!",
      "Thinking of you {name}! Hope you're well.",
    ],
    playful: [
      "Randomly thought of you, {name}. Hope life's treating you well!",
      "Hey {name}! My brain decided to think about you today. How are things?",
      "You crossed my mind, {name}! What are you up to?",
    ],
  },
  long_gap: {
    warm: [
      "Hey {name}, it's been too long! Was thinking about you. How's life?",
      "Hi {name}! We haven't spoken in a while — hope you're doing well.",
      "Hey {name}! I've been meaning to reach out. How are you doing?",
    ],
    casual: [
      "{name}! We haven't talked in ages. What are you up to?",
      "Hey {name}, long time! Fill me in on your life.",
    ],
  },
  birthday: {
    warm: [
      "Happy birthday {name}! Hope your day is as wonderful as you are.",
      "Wishing you the happiest birthday, {name}! Hope it's a great one.",
      "Happy birthday! Thinking of you today, {name} — hope it's a lovely day.",
    ],
    casual: [
      "Happy birthday!! Hope it's a great one {name} :)",
      "HAPPY BIRTHDAY {name}!! Hope you have an amazing day!",
    ],
    brief: [
      "Happy birthday {name}!",
      "Happy birthday! Hope it's a good one :)",
    ],
  },
  occasion: {
    warm: [
      "Thinking of you today, {name}. Hope it's a beautiful one.",
      "Just wanted to say hi and wish you a wonderful day, {name}.",
    ],
  },
  family: {
    warm: [
      "Hi {name}! Just wanted to check in. Miss you — hope everything is good.",
      "Hey {name}, thinking of you. How is everything going?",
      "Hi {name}! Just checking in — hope all is well with you.",
    ],
  },
  professional: {
    formal: [
      "Hi {name}, hope you're doing well. Wanted to check in and see how things are going on your end.",
      "Hi {name}, hope all is well. Just wanted to touch base — let me know if you'd like to catch up.",
    ],
    casual: [
      "Hey {name}! Hope work's going well. Would love to catch up sometime.",
    ],
  },
};

// Ultimate fallback — never fails
export const FALLBACK_MESSAGE = "Hi {name}!";
```

---

## Onboarding Flow (5 screens)

### Screen 1: Goals
User selects all that apply. This configures defaults throughout the app.

| Goal | Default threshold | App changes |
|---|---|---|
| Friends & family | 7–30 days | Warm tone default, occasion calendar prominent |
| Birthdays & occasions | Annual | Occasions tab is first; 7-day advance alerts; birthday import prompt |
| Be more social | 14 days (tighter) | Weekly "reach out" goal on home; streak counter |
| Professional network | 45–90 days | Formal tone in drafts; LinkedIn channel option; "work context" field |
| Long-distance loved ones | 21 days | Timezone shown; video call suggested as channel |

### Screen 2: Import source
Options: Phone contacts (read-only), Google Contacts (OAuth), Add manually.
Privacy note shown: "Contact data stays on your device. We only read names, numbers, and birthdays — never messages or call history."

### Screen 3: Pick your people
Shows suggested contacts (frequent + recent). Each row shows AI-suggested threshold. User taps to select. "Thresholds auto-suggested — you'll fine-tune next."

### Screen 4: Set your rhythm
Per-contact threshold sliders. Range 3–90 days. Pre-filled from suggestions. User can adjust. "Drag to set. You can change these anytime."

### Screen 5: Permissions + summary
- Notifications (on by default) — "Morning digest so you don't miss anyone"
- Calendar read-only (on) — "Auto-detect birthdays from events"
- Google Drive backup (off by default) — "Encrypted backup to your own Drive"

Summary stats: X people, Y occasions, 0 overdue.
CTA: "Start keeping in touch"
Completion message: "The people you love are lucky to have you thinking about them."

---

## UX & Mental Health Principles

These are non-negotiable. Every string, screen, and interaction passes through this filter.

### 1. Never quantify failure
No "8 overdue contacts" counters. No completion percentages. No streak-broken screens. Only show what's possible, not what was missed.

### 2. Every skip is met with warmth
"Maybe later" and "I'll write my own" always respond kindly. Never silence. Never a repeat nudge same day.

### 3. One person at a time
Home screen highlights ONE person prominently. Not a wall of red dots. Reduces overwhelm to a single doable action.

### 4. Celebrate tiny actions loudly
Every logged interaction gets an affirmation. "That little moment matters more than you think." Logging a 2-minute call = same celebration as a long conversation.

### 5. Return after absence without shame
If someone opens app after weeks away: "Welcome back. No catching up needed — just pick one person." Never show how long they were gone.

### 6. Reframe all negative language
- "Overdue" → "a little while since you talked"
- "Missed" → "hasn't heard from you yet"
- "Reminder" → "gentle nudge"
- "Action needed" → "Thinking of {name}?"
- "0 contacts reached" → never shown; show "enjoy your day" instead

### 7. "Hi" is always enough
The compose screen always shows: "A starting point — make it yours. Even 'hi' is enough."

---

## Copy Guide (key UI strings)

```
Home greeting:          "Good morning. You've got this."
Overdue contact banner: "A little while since you talked — {name} would love to hear from you."
Occasion banner:        "{name}'s birthday is in {n} days — a quick message goes a long way."
Notification title:     "Thinking of {name}?"
Notification body:      "It's been a little while. Even a 'hi' can make their day — and yours."
Snooze response:        "No worries — we'll check in again in a few days."
After logging contact:  "Logged! That little moment matters more than you think."
Weekly summary:         "You reached out to {n} people this week. That's real."
Return after absence:   "Welcome back. No catching up needed — just pick one person."
Onboarding complete:    "The people you love are lucky to have you thinking about them."
Compose screen sub:     "A starting point — make it yours. Even 'hi' is enough."
Empty state:            "All caught up for now. Enjoy your day."
Draft button:           "Copy & open {app}"
Skip button:            "I'll write my own"
```

---

## Navigation (bottom tab bar)

| Tab | Icon | Content |
|---|---|---|
| Home | house | Urgent banner + needs-attention list + upcoming occasions |
| Contacts | heart | Full contact list, search, add |
| Occasions | star | Upcoming birthdays/anniversaries/custom events |
| Settings | gear | Notifications, privacy, backup, thresholds |

---

## Privacy Architecture

```
Device (SQLite encrypted) → user-initiated export → encrypted JSON → user's Google Drive
Contact data             → never leaves device
AI drafting              → canned templates, no network call
Notifications            → local only, no push server
```

- No accounts required to use the app
- Encryption key lives in device keychain only
- Zero telemetry
- Google Drive backup is opt-in, user's own account, one file

---

## Project Structure (Expo)

```
/app                     # Expo Router screens
  (tabs)/
    index.tsx            # Home
    contacts.tsx         # Contact list
    occasions.tsx        # Occasions calendar
    settings.tsx         # Settings
  contact/[id].tsx       # Contact detail
  compose/[id].tsx       # Draft message
  onboarding/
    goals.tsx
    import.tsx
    pick.tsx
    thresholds.tsx
    permissions.tsx

/src
  db/
    schema.ts            # Drizzle schema (matches SQL above)
    migrations/
  utils/
    urgency.ts           # Urgency scoring function (isolated, versioned)
    templates.ts         # Canned message library
    deepLink.ts          # Open WhatsApp/iMessage/etc with pre-filled text
  components/
    ContactCard.tsx
    UrgencyDot.tsx
    DraftComposer.tsx
    OccasionCard.tsx
  hooks/
    useContacts.ts
    useUrgency.ts
    useOccasions.ts

/assets
```

---

## Deep Linking to Messaging Apps

```typescript
// src/utils/deepLink.ts

export async function openWithDraft(channel: string, draft: string, phone?: string) {
  const encoded = encodeURIComponent(draft);

  const urls: Record<string, string> = {
    whatsapp: `whatsapp://send?text=${encoded}${phone ? `&phone=${phone}` : ''}`,
    sms:      `sms:${phone ?? ''}?body=${encoded}`,
    imessage: `sms:${phone ?? ''}?body=${encoded}`,
    email:    `mailto:?body=${encoded}`,
  };

  const url = urls[channel] ?? `sms:?body=${encoded}`;

  // Copy to clipboard as fallback regardless
  await Clipboard.setStringAsync(draft);

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
  // If can't open: draft is already in clipboard, show toast "Copied to clipboard"
}
```

---

## Build Phases

| Phase | What | Weeks |
|---|---|---|
| 1 | MVP: contacts, interaction log, urgency sort, local notifications | 1–3 |
| 2 | Occasions engine: birthdays, anniversaries, calendar import | 4–5 |
| 3 | Draft composer: canned templates, tone picker, deep-link to apps | 6–7 |
| 4 | Onboarding flow: goals, import, picker, thresholds, permissions | 8–9 |
| 5 | Google Drive encrypted backup + restore | 10–11 |
| 6 | Polish: home-screen widget, Siri shortcuts, accessibility | 12–13 |

---

## What's explicitly NOT in scope (v1)

- Any server or backend
- User accounts / login
- Sync across devices (Drive backup is restore-only)
- Sending messages from within the app (always opens the native app)
- Reading message history or call logs
- Social graph inference
- Paid AI model usage of any kind
