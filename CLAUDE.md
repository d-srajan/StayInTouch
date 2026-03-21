# CLAUDE.md — Stay In Touch App

This file is read automatically by Claude Code. Start here before touching any code.

## Read the spec first

Full product spec is in `SPEC.md`. Read it before writing any code. It covers:
- Tech stack decisions and why
- Full SQLite schema
- Urgency algorithm (isolated in `src/utils/urgency.ts`)
- Canned message library (no AI API — zero cost)
- All UX/mental health principles
- Copy guide (exact strings for every UI moment)
- Deep linking to WhatsApp/iMessage/etc
- Build phases

## The single most important thing

This app is for people who may be experiencing loneliness or mental health struggles.
The app must never make them feel worse.

- Never use the word "overdue" in UI copy
- Never show failure counts or completion percentages
- Every skip/snooze is met with warmth, never silence or guilt
- "Hi" is always framed as enough
- See SPEC.md § "UX & Mental Health Principles" for the full list

## Key technical decisions (don't revisit without reading SPEC.md)

- **No AI API calls** — message drafts use canned templates in `src/data/messageTemplates.ts`
- **Fallback is always** `"Hi {name}!"` — hardcoded, never fails
- **No push server** — all notifications are local via `expo-notifications`
- **No backend** — everything is on-device SQLite
- **Urgency algorithm lives in one file** — `src/utils/urgency.ts` — isolated so v2 can swap it

## Commands

```bash
npx expo start          # dev server
npx expo run:ios        # iOS simulator
npx expo run:android    # Android emulator
npx drizzle-kit push    # apply schema changes
```

## When adding new UI strings

Check the Copy Guide in SPEC.md first. All key strings are defined there.
If adding a new one, follow the tone: warm, encouraging, shame-free.
