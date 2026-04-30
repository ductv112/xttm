/**
 * Idempotent font download script for PDF spike.
 *
 * Downloads Be Vietnam Pro static TTF (Regular, Bold, Italic) into public/fonts/.
 * Skips files that already exist. Validates size > 30KB to catch corrupted/empty downloads.
 *
 * Usage: npx tsx scripts/download-fonts.mts
 *
 * Why static TTF (not variable font): @react-pdf/renderer renders to PDF 2.0 spec which
 * does NOT support OpenType variable font axes. Variable font would render as broken glyphs.
 * See research/PITFALLS.md §1.1 (R1 CRITICAL).
 */
import { writeFile, access, mkdir, stat } from 'fs/promises';
import { join } from 'path';

const FONTS_DIR = join(process.cwd(), 'public', 'fonts');

// Primary source — GitHub raw (Be Vietnam Pro official typeface repo).
// Several mirrors exist; we try multiple known-working URLs in order.
const PRIMARY_URLS: Record<string, string[]> = {
  'BeVietnamPro-Regular.ttf': [
    'https://github.com/bettergui/Be-Vietnam-Pro-Font/raw/main/fonts/ttf/BeVietnamPro-Regular.ttf',
    'https://github.com/bvn-typeface/Be-Vietnam-Pro/raw/master/fonts/ttf/BeVietnamPro-Regular.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf',
  ],
  'BeVietnamPro-Bold.ttf': [
    'https://github.com/bettergui/Be-Vietnam-Pro-Font/raw/main/fonts/ttf/BeVietnamPro-Bold.ttf',
    'https://github.com/bvn-typeface/Be-Vietnam-Pro/raw/master/fonts/ttf/BeVietnamPro-Bold.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Bold.ttf',
  ],
  'BeVietnamPro-Italic.ttf': [
    'https://github.com/bettergui/Be-Vietnam-Pro-Font/raw/main/fonts/ttf/BeVietnamPro-Italic.ttf',
    'https://github.com/bvn-typeface/Be-Vietnam-Pro/raw/master/fonts/ttf/BeVietnamPro-Italic.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Italic.ttf',
  ],
};

const MIN_VALID_SIZE_BYTES = 30_000;

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(url: string, destination: string): Promise<number> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (XTTMQG-POC font fetcher)',
      Accept: 'font/ttf, application/octet-stream, */*',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(destination, buffer);
  return buffer.length;
}

async function tryDownloadFromUrls(urls: string[], destination: string): Promise<number> {
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const size = await downloadFile(url, destination);
      if (size < MIN_VALID_SIZE_BYTES) {
        throw new Error(`File too small (${size} bytes < ${MIN_VALID_SIZE_BYTES}). Likely HTML error page or corrupted.`);
      }
      console.log(`  ✓ Downloaded from ${url} (${(size / 1024).toFixed(1)}KB)`);
      return size;
    } catch (err) {
      lastError = err as Error;
      console.warn(`  ⚠ Failed: ${(err as Error).message}`);
    }
  }
  throw lastError ?? new Error('All URLs failed without specific error');
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });

  let totalSize = 0;
  for (const [filename, urls] of Object.entries(PRIMARY_URLS)) {
    const dest = join(FONTS_DIR, filename);
    if (await fileExists(dest)) {
      const stats = await stat(dest);
      if (stats.size >= MIN_VALID_SIZE_BYTES) {
        console.log(`✓ Already exists: ${filename} (${(stats.size / 1024).toFixed(1)}KB)`);
        totalSize += stats.size;
        continue;
      }
      console.log(`⚠ Existing ${filename} too small (${stats.size}B). Re-downloading...`);
    }

    console.log(`→ Downloading ${filename}...`);
    const size = await tryDownloadFromUrls(urls, dest);
    totalSize += size;
  }

  console.log(`\n🎉 Font download complete. Total: ${(totalSize / 1024).toFixed(1)}KB across 3 files.`);
}

main().catch((err) => {
  console.error('❌ Font download failed:', err);
  process.exit(1);
});
