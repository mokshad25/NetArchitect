/**
 * Generates public/og-image.png (1200×630) and public/apple-touch-icon.png
 * (180×180) by rendering small HTML pages in headless Chrome (so the real
 * self-hosted fonts are used), then compressing with sharp.
 *
 *   npm run assets           # uses Google Chrome from the default location
 *   CHROME=/path/to/chrome npm run assets
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const CHROME =
  process.env.CHROME ||
  {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  }[process.platform] ||
  'google-chrome';

const root = resolve(import.meta.dirname, '..');
const tmp = mkdtempSync(join(tmpdir(), 'na-assets-'));

function render(html, width, height, out) {
  const raw = join(tmp, `${width}x${height}.png`);
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    // Headless windows are shorter than --window-size; render taller and crop.
    `--window-size=${width},${height + 200}`,
    '--virtual-time-budget=3000',
    `--screenshot=${raw}`,
    pathToFileURL(join(root, 'scripts/assets', html)).href,
  ]);
  return sharp(raw)
    .extract({ left: 0, top: 0, width, height })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(out);
}

try {
  await render('og.html', 1200, 630, join(root, 'public/og-image.png'));
  await render('icon.html', 180, 180, join(root, 'public/apple-touch-icon.png'));
  console.log('Wrote public/og-image.png and public/apple-touch-icon.png');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
