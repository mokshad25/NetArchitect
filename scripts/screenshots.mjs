/**
 * Captures README screenshots (light + dark) from a running server.
 *
 *   npm run build && npm run preview      # in one terminal (port 4173)
 *   npm run screenshots                   # in another
 *
 * Set BASE_URL to use a different server, CHROME for a custom Chrome path.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const CHROME =
  process.env.CHROME ||
  {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  }[process.platform] ||
  'google-chrome';
const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = resolve(import.meta.dirname, '../docs/screenshots');
const W = 1440;
const H = 900;

const SHOTS = [
  ['landing', '/'],
  ['designer', '/app?demo=1'],
  ['ip-plan', '/app?demo=1&tab=ip'],
];

mkdirSync(OUT, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'na-shots-'));
try {
  for (const theme of ['light', 'dark']) {
    for (const [name, path] of SHOTS) {
      const raw = join(tmp, `${name}-${theme}.png`);
      const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}theme=${theme}`;
      execFileSync(CHROME, [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        // Headless windows are shorter than --window-size; render taller and crop.
        `--window-size=${W},${H + 200}`,
        '--virtual-time-budget=6000',
        `--screenshot=${raw}`,
        url,
      ]);
      await sharp(raw)
        .extract({ left: 0, top: 0, width: W, height: H })
        .png({ compressionLevel: 9 })
        .toFile(join(OUT, `${name}-${theme}.png`));
      console.log(`docs/screenshots/${name}-${theme}.png`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
