import { Font } from '@react-pdf/renderer';
import { join } from 'path';

/**
 * Font registration for @react-pdf/renderer.
 *
 * - Registers "Be Vietnam Pro" family with Regular (400), Bold (700), Italic (400 italic).
 * - Idempotent: guarded by module-level boolean flag, safe to call from any route handler.
 * - Uses absolute paths from process.cwd() to survive Next.js bundling. Font files are NOT
 *   bundled — they are read from disk at render time.
 * - Disables hyphenation: react-pdf default hyphenates English words; this breaks Vietnamese
 *   compound words (e.g. "không" hyphenated as "kh-ông"). Identity callback returns the word
 *   as a single segment.
 *
 * See research/PITFALLS.md §1.1 (R1 CRITICAL): variable fonts and WOFF/WOFF2 do not render
 * correctly with PDF 2.0 spec. Static TTF only.
 */
let registered = false;

export function registerPdfFonts(): void {
  if (registered) return;

  const fontsDir = join(process.cwd(), 'public', 'fonts');

  Font.register({
    family: 'Be Vietnam Pro',
    fonts: [
      { src: join(fontsDir, 'BeVietnamPro-Regular.ttf'), fontWeight: 'normal' },
      { src: join(fontsDir, 'BeVietnamPro-Bold.ttf'), fontWeight: 'bold' },
      {
        src: join(fontsDir, 'BeVietnamPro-Italic.ttf'),
        fontWeight: 'normal',
        fontStyle: 'italic',
      },
    ],
  });

  // Disable hyphenation for Vietnamese — react-pdf default would break diacritics across
  // line wraps (e.g. "không" → "kh-ông"). Identity callback keeps each word intact.
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
