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

/**
 * Schedule an advance reminder for an occasion (birthday, anniversary, etc).
 * Fires `advanceDays` before the occasion date at 9 AM.
 */
export async function scheduleOccasionReminder(
  contactId: string,
  contactName: string,
  occasionType: string,
  month: number,
  day: number,
  advanceDays: number = 3,
  triggerHour: number = 9
): Promise<string> {
  const today = new Date();
  const thisYear = today.getFullYear();

  let occasionDate = new Date(thisYear, month - 1, day);
  if (occasionDate.getTime() < today.setHours(0, 0, 0, 0)) {
    occasionDate = new Date(thisYear + 1, month - 1, day);
  }

  const reminderDate = new Date(occasionDate);
  reminderDate.setDate(reminderDate.getDate() - advanceDays);
  reminderDate.setHours(triggerHour, 0, 0, 0);

  // Don't schedule if the reminder date is in the past
  if (reminderDate.getTime() < Date.now()) return "";

  const typeLabel = occasionType === "birthday" ? "birthday" : "special day";
  const body =
    advanceDays <= 1
      ? `${contactName}'s ${typeLabel} is tomorrow — a quick message goes a long way.`
      : `${contactName}'s ${typeLabel} is in ${advanceDays} days — a quick message goes a long way.`;

  return scheduleOneTimeReminder(contactId, contactName, reminderDate, body);
}
