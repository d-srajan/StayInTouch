// Web stub for deep linking — just copies to clipboard via navigator API
export async function openWithDraft(
  _channel: string,
  draft: string,
  _phone?: string
) {
  try {
    await navigator.clipboard.writeText(draft);
  } catch {
    // Clipboard API may not be available in all contexts
  }
}
