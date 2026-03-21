import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";

export async function openWithDraft(
  channel: string,
  draft: string,
  phone?: string
) {
  const encoded = encodeURIComponent(draft);

  const urls: Record<string, string> = {
    whatsapp: `whatsapp://send?text=${encoded}${phone ? `&phone=${phone}` : ""}`,
    sms: `sms:${phone ?? ""}?body=${encoded}`,
    imessage: `sms:${phone ?? ""}?body=${encoded}`,
    email: `mailto:?body=${encoded}`,
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
