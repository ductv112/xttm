/**
 * Clipboard helper với fallback cho non-secure contexts.
 *
 * - Primary: navigator.clipboard.writeText (requires HTTPS or localhost)
 * - Fallback: hidden textarea + document.execCommand('copy') for older
 *   browsers or when running over plain HTTP (POC dev fallback).
 *
 * Must be called from a user-gesture handler (click/keydown) — browsers
 * reject clipboard writes outside of trusted events.
 */

export async function copyToClipboard(text: string): Promise<void> {
  // Modern path — Clipboard API (secure context required by spec)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to legacy path below — happens on Firefox + insecure
      // origin or when permission is revoked
    }
  }

  // Guard SSR
  if (typeof document === 'undefined') {
    throw new Error('copyToClipboard yêu cầu môi trường browser');
  }

  // Legacy fallback — works in HTTP dev and very old browsers
  const textarea = document.createElement('textarea');
  textarea.value = text;
  // Position off-screen so the page doesn't visibly scroll
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');

  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    const success = document.execCommand('copy');
    if (!success) {
      throw new Error('document.execCommand("copy") returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
