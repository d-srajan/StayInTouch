// expo-notifications is native-only. Stubs for web preview.

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleContactReminder(
  _contactId: string,
  _contactName: string,
  _triggerHour: number = 9
): Promise<string> {
  return "web-stub";
}

export async function scheduleOneTimeReminder(
  _contactId: string,
  _contactName: string,
  _date: Date,
  _body?: string
): Promise<string> {
  return "web-stub";
}

export async function cancelAllReminders(): Promise<void> {}
export async function cancelReminder(_id: string): Promise<void> {}
