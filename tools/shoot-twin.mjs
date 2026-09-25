/**
 * Captures the Twin at points through the entry sequence, on the real GPU.
 * Used to look at the hall, not to pass or fail it.
 */
import puppeteer from 'puppeteer-core';
import { chromePath, gpuFlags } from './lib/chrome.mjs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:4173';
const tier = process.argv[2] ?? 'high';

const browser = await puppeteer.launch({
  executablePath: chromePath(),
  headless: 'new',
  args: gpuFlags(),
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning')
    errors.push(`[${m.type()}] ${m.text()}`);
});

// One frame per beat of the arrival, each captured with the flight held at
// that moment rather than sampled while it runs. A screenshot of a moving
// camera lands whenever the GPU gets round to it, which on this hardware is
// most of a beat late; held, every frame is the pose the keyframes describe.
const shots = [
  [0, 'a-bird'],
  [2310, 'b-descent'],
  [3080, 'c-gate'],
  [3600, 'd-torana'],
  [4390, 'e-pillar'],
  [5210, 'f-elevation'],
  [6000, 'g-steps'],
];
for (const [at, name] of shots) {
  await page.goto(`${BASE}/?quality=${tier}&perf&entry=${at}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(() => window.__toranTwin?.entryEnd != null, {
    timeout: 60000,
  });
  // A moment for the environment bake, the last shaders, and the loading
  // scrim to finish fading. Caught too early the frame comes out dimmed by it.
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: `tools/shots/twin-${tier}-${name}.png` });
}

// Then the flight itself, for the timings and the frame budget.
await page.goto(`${BASE}/?quality=${tier}&perf`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__toranTwin?.entryStart != null, {
  timeout: 60000,
});
await page.waitForFunction(() => window.__toranTwin?.entryEnd != null, {
  timeout: 20000,
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: `tools/shots/twin-${tier}-h-nave.png` });
const tele = await page.evaluate(() => window.__toranTwin);
console.log(
  JSON.stringify(
    {
      tier: tele.tier,
      renderer: tele.renderer,
      firstFrameMs: Math.round(tele.firstFrame),
      entryMs: Math.round(tele.entryEnd - tele.entryStart),
      entryFrames: (() => {
        const f = [...tele.entryFrames].sort((a, b) => a - b);
        const q = (p) => f[Math.min(f.length - 1, Math.floor(f.length * p))];
        return {
          count: f.length,
          p50: +q(0.5).toFixed(1),
          p95: +q(0.95).toFixed(1),
          max: +f[f.length - 1].toFixed(1),
          over25ms: f.filter((x) => x > 25).length,
        };
      })(),
      texturesMs: tele.texturesMs,
      frame: {
        fps: +tele.frame.fps.toFixed(1),
        ms: +tele.frame.ms.toFixed(2),
        calls: tele.frame.calls,
        triangles: tele.frame.triangles,
        geometries: tele.frame.geometries,
        textures: tele.frame.textures,
      },
    },
    null,
    2,
  ),
);
if (errors.length) console.log('console:', errors.slice(0, 6).join('\n  '));
await browser.close();
