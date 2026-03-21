import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Stay In Touch",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedule a daily "gentle nudge" notification for a contact.
 * Uses copy from the spec — never guilt-inducing.
 */
export async function scheduleContactReminder(
  contactId: string,
  contactName: string,
  triggerHour: number = 9 // default 9 AM
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Thinking of ${contactName}?`,
      body: "It's been a little while. Even a 'hi' can make their day — and yours.",
      data: { contactId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: triggerHour,
      minute: 0,
    },
  });
  return id;
}

/**
 * Schedule a one-time reminder for a specific date.
 */
export async function scheduleOneTimeReminder(
  contactId: string,
  contactName: string,
  date: Date,
  body?: string
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Thinking of ${contactName}?`,
      body:
        body ??
        "It's been a little while. Even a 'hi' can make their day — and yours.",
      data: { contactId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  return id;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}
