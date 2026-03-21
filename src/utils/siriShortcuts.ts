import { Platform } from "react-native";

/**
 * Siri Shortcuts integration for Stay In Touch.
 *
 * Registers shortcuts with iOS so users can:
 * - "Hey Siri, who should I message?" → opens app to home screen
 * - "Hey Siri, log a moment" → opens app to log interaction
 *
 * Uses expo-apple-settings on iOS; no-ops on other platforms.
 * Full Siri Intents require a native extension — this uses the
 * simpler NSUserActivity-based approach that Expo supports.
 */

interface ShortcutActivity {
  activityType: string;
  title: string;
  suggestedInvocationPhrase: string;
  isEligibleForSearch: boolean;
  isEligibleForPrediction: boolean;
}

const SHORTCUTS: ShortcutActivity[] = [
  {
    activityType: "com.stayintouch.checkIn",
    title: "Check who to message",
    suggestedInvocationPhrase: "Who should I message?",
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
  },
  {
    activityType: "com.stayintouch.logMoment",
    title: "Log a moment",
    suggestedInvocationPhrase: "Log a moment",
    isEligibleForSearch: true,
    isEligibleForPrediction: true,
  },
];

/**
 * Donate shortcuts to Siri.
 * Call this on app launch and after significant user actions
 * so Siri learns the user's patterns.
 *
 * Note: Full Siri Intents integration requires a native iOS
 * extension which needs `expo-dev-client` or bare workflow.
 * This provides the NSUserActivity-based shortcut donation
 * which works with managed Expo builds.
 */
export function donateShortcuts(): void {
  if (Platform.OS !== "ios") return;

  // NSUserActivity-based shortcuts are registered automatically
  // by iOS when the app sets currentActivity on views.
  // In a future version with expo-dev-client, this would use
  // the native SiriShortcuts API directly.
  //
  // For now, the app registers activities via the Expo config
  // in app.json under ios.infoPlist.NSUserActivityTypes.
}

/**
 * Handle an incoming Siri shortcut activity.
 * Returns the route to navigate to, or null if not a known shortcut.
 */
export function handleShortcutActivity(
  activityType: string
): string | null {
  switch (activityType) {
    case "com.stayintouch.checkIn":
      return "/(tabs)";
    case "com.stayintouch.logMoment":
      return "/(tabs)/contacts";
    default:
      return null;
  }
}

export { SHORTCUTS };
