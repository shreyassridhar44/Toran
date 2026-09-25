/**
 * Where Chrome is.
 *
 * The verification tools were written on Linux and name
 * /usr/bin/google-chrome directly, which means none of them run on a Windows
 * or macOS machine — including the ones whose whole job is to let somebody
 * look at the twin. This resolves the browser instead of assuming it.
 *
 * CHROME=/path/to/chrome overrides everything, for a machine that keeps it
 * somewhere else or wants a specific channel.
 */

import { existsSync } from 'node:fs';

const CANDIDATES = {
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
};

export function chromePath() {
  const override = process.env.CHROME;
  if (override !== undefined && override !== '') {
    if (!existsSync(override))
      throw new Error(`CHROME is set to ${override}, which does not exist`);
    return override;
  }

  for (const candidate of CANDIDATES[process.platform] ?? []) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error(
    `No Chrome found for ${process.platform}. Set CHROME to its executable.`,
  );
}

/**
 * Flags that ask for the real GPU.
 *
 * ANGLE's Vulkan backend is the right choice on Linux and wrong on Windows,
 * where the default D3D11 backend is what a visitor's browser would use and
 * what the machine actually has drivers for.
 */
export function gpuFlags() {
  const flags = ['--no-sandbox', '--enable-gpu', '--ignore-gpu-blocklist'];
  if (process.platform === 'linux') flags.push('--use-angle=vulkan');
  return flags;
}
