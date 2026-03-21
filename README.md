# Stay In Touch

A mobile app that helps you maintain relationships with the people who matter most. It tracks when you last reached out, gently reminds you when it's been a while, remembers birthdays and special occasions, and helps you draft a message to get started.

**Built with care.** This app is designed for people who may be experiencing loneliness or mental health struggles. Every interaction is warm, encouraging, and shame-free. There are no guilt counters, no "overdue" labels, no failure metrics — just gentle nudges and celebration of small moments.

## Features

- **Contact Management** — Add your people, set how often you'd like to check in, and track your interactions
- **Urgency Scoring** — Smart algorithm highlights who could use a "hi" right now, without making you feel bad
- **Interaction Logging** — Log messages, calls, and in-person moments with a single tap
- **Occasions** — Track birthdays, anniversaries, and custom dates with advance reminders
- **Draft Composer** — Canned message templates with tone picker (warm, casual, brief, playful) — no AI API, works offline
- **Deep Linking** — Copy a draft and open WhatsApp, iMessage, SMS, or email directly
- **Local Notifications** — Gentle daily nudges: _"Thinking of {name}?"_
- **Fully Offline** — All data stays on your device in encrypted SQLite. No accounts, no servers, no telemetry

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Navigation | Expo Router (file-based) |
| Database | SQLite via `expo-sqlite` + `drizzle-orm` |
| Notifications | `expo-notifications` (local only) |
| Contacts Import | `expo-contacts` (read-only) |
| AI Drafting | Canned templates (zero cost, zero network) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/d-srajan/StayInTouch.git
cd StayInTouch

# Install dependencies
npm install

# Start the dev server
npx expo start
```

From there you can:
- Press `w` to open in a web browser
- Press `i` to open in the iOS Simulator (requires Xcode)
- Press `a` to open in an Android Emulator (requires Android Studio)
- Scan the QR code with [Expo Go](https://expo.dev/go) on your phone

## Building Installers

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) for generating native installers.

### Setup (one-time)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Link the project (first time only)
eas init
```

### Android APK

```bash
# Build a preview APK (installable .apk file)
eas build --platform android --profile preview

# Build a production APK
eas build --platform android --profile production
```

Once the build completes, EAS provides a download link. You can also find all builds at [expo.dev](https://expo.dev) under your project.

**To install on Android:**
1. Download the `.apk` file to your phone
2. Open it and tap "Install" (you may need to enable "Install from unknown sources" in Settings)

### iOS

```bash
# Build for iOS Simulator
eas build --platform ios --profile preview

# Build for physical devices (requires Apple Developer account)
eas build --platform ios --profile production
```

**To install on iOS:**
- **Simulator:** Download the `.tar.gz`, extract, and drag the `.app` into your simulator
- **Physical device:** Requires an Apple Developer account ($99/year) and either TestFlight or ad-hoc distribution

## Project Structure

```
app/                          # Expo Router screens
  (tabs)/
    index.tsx                 # Home — urgency banner, needs-attention list
    contacts.tsx              # Contact list with search and add
    occasions.tsx             # Upcoming birthdays/anniversaries
    settings.tsx              # Notifications, about
  contact/[id].tsx            # Contact detail + interaction history
  compose/[id].tsx            # Draft message composer

src/
  db/
    schema.ts                 # Drizzle ORM schema
    client.ts                 # SQLite connection (native)
    client.web.ts             # Null fallback (web preview)
    migrate.ts                # Runtime table creation
  utils/
    urgency.ts                # Urgency scoring algorithm (isolated)
    notifications.ts          # Local notification scheduling
    deepLink.ts               # Open WhatsApp/iMessage/SMS/email
  data/
    messageTemplates.ts       # Canned message library
  components/
    ContactCard.tsx            # Contact list item with urgency dot
    UrgencyDot.tsx            # Green/amber/coral status indicator
    OccasionCard.tsx          # Occasion with countdown badge
  hooks/
    useContacts.ts            # Contact CRUD + urgency scoring
    useOccasions.ts           # Occasion CRUD + days-until
```

## Design Principles

1. **Never quantify failure** — No "8 overdue" counters or completion percentages
2. **Every skip is met with warmth** — "No worries — we'll check in again in a few days"
3. **One person at a time** — Home highlights ONE person, not a wall of red dots
4. **Celebrate tiny actions** — "That little moment matters more than you think"
5. **Return without shame** — "Welcome back. No catching up needed — just pick one person"
6. **"Hi" is always enough** — The compose screen always says so

## Privacy

- All data stored locally in encrypted SQLite
- No accounts, no servers, no analytics
- Contact data never leaves your device
- Message drafting uses built-in templates — no network calls
- Notifications are local only — no push server

## License

MIT
