/**
 * Procedural textures, generated at load from code.
 *
 * Nothing here is downloaded. The hall ships as JavaScript, which keeps the
 * cold load inside its three second budget and means there is no asset
 * pipeline to maintain. The cost is a few tens of milliseconds of canvas work
 * on startup, measured by the performance overlay.
 *
 * Text is drawn with Canvas 2D rather than as WebGL glyphs on purpose. The
 * browser's canvas text path shapes Devanagari conjuncts correctly; the SDF
 * text renderers commonly used in three.js do not, and a Marathi label with
 * broken conjuncts would be worse than no label.
 */

import * as THREE from 'three';

// ---------- noise ----------

function hash(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Value noise, tileable over `period` cells so textures repeat without seams. */
function valueNoise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const wrap = (v: number) => ((v % period) + period) % period;
  const a = hash(wrap(xi), wrap(yi), seed);
  const b = hash(wrap(xi + 1), wrap(yi), seed);
  const c = hash(wrap(xi), wrap(yi + 1), seed);
  const d = hash(wrap(xi + 1), wrap(yi + 1), seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

function fbm(u: number, v: number, base: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = base;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(u * freq, v * freq, freq, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (ctx === null) throw new Error('2D canvas unavailable');
  return [c, ctx];
}

function toTexture(
  c: HTMLCanvasElement,
  srgb: boolean,
  repeat = false,
): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  t.needsUpdate = true;
  return t;
}

// ---------- stone ----------

/**
 * Red sandstone, from the Chaitya Arch and the interior friezes. Grain from
 * layered noise, and faint horizontal bedding, because sandstone is laid down
 * in strata and a uniform red reads as plastic.
 */
export function sandstone(size = 512): {
  map: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const [c, ctx] = canvas(size, size);
  const [rc, rctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  const rough = rctx.createImageData(size, size);
  const base = [150, 86, 66];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const grain = fbm(u, v, 8, 5, 3);
      const strata = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 9 + fbm(u, v, 3, 3, 9) * 5);
      const speck = hash(x, y, 41) > 0.985 ? 0.12 : 0;
      const k = 0.78 + grain * 0.36 + strata * 0.06 - speck;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, base[0]! * k);
      img.data[i + 1] = Math.min(255, base[1]! * k * (0.96 + grain * 0.08));
      img.data[i + 2] = Math.min(255, base[2]! * k);
      img.data[i + 3] = 255;
      const r = 170 + (grain - 0.5) * 120;
      rough.data[i] = r;
      rough.data[i + 1] = r;
      rough.data[i + 2] = r;
      rough.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rough, 0, 0);
  return { map: toTexture(c, true, true), roughness: toTexture(rc, false, true) };
}

/**
 * Carved relief, used as a bump map. The Sanchi gateways are covered in dense
 * narrative relief. This does not model it; it suggests it under raking light
 * with rows of bosses, lotus medallions and figure-like uprights in framed
 * panels, which is enough for the eye at hall distances.
 */
export function relief(size = 512): THREE.CanvasTexture {
  // The Sanchi posts carry narrative panels stacked in registers, divided by
  // horizontal bands. A grid of square panels, which was the first attempt,
  // made every carved surface read as tiled wall. Registers read as carving.
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Weathering: a low mid grey with soft variation, so flat stone is not flat.
      const v = 104 + (fbm(x / size, y / size, 6, 4, 23) - 0.5) * 40;
      const i = (y * size + x) * 4;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const register = size / 2;
  const band = (y: number) => {
    const g = ctx.createLinearGradient(0, y - 10, 0, y + 10);
    g.addColorStop(0, '#5a5a5a');
    g.addColorStop(0.5, '#c8c8c8');
    g.addColorStop(1, '#5a5a5a');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 10, size, 20);
  };
  band(0);
  band(register);
  band(size);

  // Upper register: three lotus medallions.
  for (let i = 0; i < 3; i++) {
    const cx = size * (0.18 + i * 0.32);
    const cy = register * 0.52;
    const radius = register * 0.3;
    for (let p = 0; p < 12; p++) {
      const a = (p / 12) * Math.PI * 2;
      const px = cx + Math.cos(a) * radius * 0.62;
      const py = cy + Math.sin(a) * radius * 0.62;
      const g = ctx.createRadialGradient(px, py, 1, px, py, radius * 0.34);
      g.addColorStop(0, '#c2c2c2');
      g.addColorStop(1, 'rgba(104,104,104,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, radius * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
    const core = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, radius * 0.3);
    core.addColorStop(0, '#d8d8d8');
    core.addColorStop(1, '#707070');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lower register: a procession, figures of uneven height at uneven spacing.
  const heights = [0.62, 0.7, 0.55, 0.66, 0.6, 0.72];
  let fx = size * 0.08;
  heights.forEach((ht, i) => {
    const top = register + register * (0.86 - ht);
    const bottom = register + register * 0.86;
    const g = ctx.createLinearGradient(fx - 12, 0, fx + 12, 0);
    g.addColorStop(0, '#6a6a6a');
    g.addColorStop(0.5, '#cfcfcf');
    g.addColorStop(1, '#6a6a6a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(fx - 13, top + 26, 26, bottom - top - 26, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx, top + 12, 13, 0, Math.PI * 2);
    ctx.fill();
    fx += size * (0.14 + ((i * 37) % 5) * 0.006);
  });

  const [s, sctx] = canvas(size, size);
  sctx.filter = 'blur(2.2px)';
  sctx.drawImage(c, 0, 0);
  return toTexture(s, false, true);
}

/** Dark polished floor in large slabs, with a faint sheen variation. */
export function floor(size = 1024): {
  map: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const [c, ctx] = canvas(size, size);
  const [rc, rctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  const rough = rctx.createImageData(size, size);
  const tiles = 4;
  const seam = size / tiles;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const tileId = Math.floor(x / seam) + Math.floor(y / seam) * tiles;
      const tone = 0.9 + hash(tileId, 7, 5) * 0.2;
      const cloud = fbm(u, v, 4, 4, 11);
      const onSeam = x % seam < 2 || y % seam < 2;
      const k = (onSeam ? 0.78 : tone) * (0.82 + cloud * 0.3);
      const i = (y * size + x) * 4;
      img.data[i] = 52 * k;
      img.data[i + 1] = 44 * k;
      img.data[i + 2] = 36 * k;
      img.data[i + 3] = 255;
      const r = onSeam ? 230 : 70 + cloud * 70;
      rough.data[i] = r;
      rough.data[i + 1] = r;
      rough.data[i + 2] = r;
      rough.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rough, 0, 0);
  return { map: toTexture(c, true, true), roughness: toTexture(rc, false, true) };
}

/** Soft contact shadow. Cheaper than real shadows by a wide margin on a tablet. */
export function blob(size = 128): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return toTexture(c, false);
}

/**
 * Alpha for light shafts: bright at the window, falling off toward the floor.
 *
 * three.js reads an alphaMap from the GREEN channel, not the alpha channel.
 * The gradient is therefore drawn in grey on an opaque black ground. Drawing
 * white with varying alpha, which is the obvious way, leaves green at 255
 * wherever any alpha exists and turns every shaft into a hard-edged slab.
 */
export function shaft(): THREE.CanvasTexture {
  const w = 64;
  const h = 256;
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#6a6a6a');
  g.addColorStop(0.75, '#1c1c1c');
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Darken toward both edges so a shaft has no hard sides.
  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const across = Math.sin((x / (w - 1)) * Math.PI) ** 1.6;
      const i = (y * w + x) * 4;
      const v = img.data[i]! * across;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, false);
}

/**
 * A jali, the pierced stone lattice of Indian windows. Light comes through the
 * diamonds between the stone bars, warmer at the top where the sky is.
 */
export function jali(): THREE.CanvasTexture {
  const w = 128;
  const h = 400;
  const [c, ctx] = canvas(w, h);
  const glow = ctx.createLinearGradient(0, 0, 0, h);
  glow.addColorStop(0, '#fff0cf');
  glow.addColorStop(0.5, '#ffd79c');
  glow.addColorStop(1, '#e8a45e');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2b1f16';
  ctx.lineWidth = 7;
  const step = 26;
  for (let k = -h; k < w + h; k += step) {
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k + h, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k - h, h);
    ctx.stroke();
  }
  // Rosettes where the bars cross.
  ctx.fillStyle = '#2b1f16';
  for (let y = 0; y <= h; y += step / 2) {
    for (let x = (y / (step / 2)) % 2 === 0 ? 0 : step / 2; x <= w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Stone frame.
  ctx.lineWidth = 10;
  ctx.strokeRect(0, 0, w, h);
  return toTexture(c, true);
}

/** Dusk sky for the forecourt: warm at the horizon, near black overhead. */
export function sky(): THREE.CanvasTexture {
  // Mapped onto a sphere, so the horizon is the middle of the texture.
  const [c, ctx] = canvas(8, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#0b0a09');
  g.addColorStop(0.34, '#15110e');
  g.addColorStop(0.46, '#34261b');
  g.addColorStop(0.5, '#5a3b25');
  g.addColorStop(0.54, '#2b2019');
  g.addColorStop(1, '#141210');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return toTexture(c, true);
}

// ---------- documents and screens ----------

const FONT_UI = 'Archivo, system-ui, sans-serif';
const FONT_READ = 'Spectral, Georgia, serif';
const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';
const FONT_INDIC = '"Noto Serif Devanagari", Spectral, serif';

/**
 * The Preamble as adopted on 26 November 1949, for the Constitution gallery.
 * This is the text as the Assembly adopted it. The words "socialist",
 * "secular" and "integrity" were added by the Forty-second Amendment in 1976
 * and are deliberately absent, because the gallery is about the making of the
 * Constitution, and the caption says which text it is.
 */
export function preamble(): THREE.CanvasTexture {
  const w = 768;
  const h = 1152;
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#9a6a2f';
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, w - 68, h - 68);
  ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, w - 92, h - 92);

  ctx.fillStyle = '#1a1714';
  ctx.textAlign = 'center';
  ctx.font = `600 40px ${FONT_READ}`;
  ctx.fillText('THE CONSTITUTION OF INDIA', w / 2, 140);
  ctx.fillStyle = '#803d29';
  ctx.fillRect(w / 2 - 60, 168, 120, 2);

  const lines: [string, string][] = [
    ['WE, THE PEOPLE OF INDIA, having solemnly', '500 27px'],
    ['resolved to constitute India into a', '400 27px'],
    ['SOVEREIGN DEMOCRATIC REPUBLIC', '600 27px'],
    ['and to secure to all its citizens:', '400 27px'],
    ['', ''],
    ['JUSTICE, social, economic and political;', '400 27px'],
    ['LIBERTY of thought, expression, belief,', '400 27px'],
    ['faith and worship;', '400 27px'],
    ['EQUALITY of status and of opportunity;', '400 27px'],
    ['and to promote among them all', '400 27px'],
    ['FRATERNITY assuring the dignity of the', '400 27px'],
    ['individual and the unity of the Nation;', '400 27px'],
    ['', ''],
    ['IN OUR CONSTITUENT ASSEMBLY this', '400 27px'],
    ['twenty-sixth day of November, 1949,', '400 27px'],
    ['do HEREBY ADOPT, ENACT AND GIVE', '500 27px'],
    ['TO OURSELVES THIS CONSTITUTION.', '500 27px'],
  ];
  let y = 262;
  ctx.fillStyle = '#1a1714';
  for (const [text, font] of lines) {
    if (text === '') {
      y += 26;
      continue;
    }
    ctx.font = `${font} ${FONT_READ}`;
    ctx.fillText(text, w / 2, y);
    y += 46;
  }
  ctx.font = `400 17px ${FONT_MONO}`;
  ctx.fillStyle = '#56503f';
  ctx.fillText('Preamble, as adopted 26 November 1949', w / 2, h - 96);
  return toTexture(c, true);
}

export type ScreenStatus = 'online' | 'idle' | 'offline';

/**
 * What each device is showing. These are miniatures of the real applications,
 * so a visitor looking across the hall sees a building full of working screens
 * rather than thirteen identical glowing rectangles.
 */
export function screen(
  channel: string,
  title: string,
  status: ScreenStatus,
  statusLabel: string,
  lang: string,
  portrait = false,
): THREE.CanvasTexture {
  const w = portrait ? 320 : 512;
  const h = portrait ? 576 : 320;
  const [c, ctx] = canvas(w, h);
  const indic = /^(hi|mr|sa|ne|kok|mai|doi|brx)$/.test(lang);

  if (status === 'offline') {
    ctx.fillStyle = '#0d0b0a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a332b';
    ctx.font = `500 22px ${FONT_MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText(statusLabel, w / 2, h / 2 + 8);
    return toTexture(c, true);
  }

  const dim = status === 'idle' ? 0.55 : 1;
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1f1b17';
  ctx.fillRect(0, 0, w, h);

  // Header.
  ctx.globalAlpha = dim;
  ctx.fillStyle = '#c89b52';
  ctx.fillRect(0, 0, w, 3);
  ctx.font = `600 22px ${indic ? FONT_INDIC : FONT_UI}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8e1d3';
  ctx.fillText(title, 24, 44);
  ctx.font = `500 14px ${FONT_MONO}`;
  ctx.fillStyle = '#a99e8c';
  ctx.textAlign = 'right';
  ctx.fillText('TORAN', w - 24, 42);
  ctx.textAlign = 'left';

  const paper = '#e8e1d3';
  const soft = '#a99e8c';
  const brass = '#c89b52';
  const sand = '#c2634a';
  const green = '#74a891';
  const line = (x: number, y: number, len: number, color = soft, hh = 6) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, len, hh);
  };

  switch (channel) {
    case 'reading': {
      for (let i = 0; i < 7; i++)
        line(24, 78 + i * 22, 300 + ((i * 53) % 150), i === 3 ? brass : soft);
      ctx.fillStyle = 'rgba(200,155,82,0.25)';
      ctx.fillRect(22, 138, 190, 12);
      ctx.font = `400 13px ${FONT_MONO}`;
      ctx.fillStyle = brass;
      ctx.fillText('BAWS vol. 1, p. 47', 24, 262);
      break;
    }
    case 'provenance': {
      const nodes: [number, number, string][] = [
        [90, 150, '1936'],
        [256, 110, '1948'],
        [420, 150, '1950'],
      ];
      ctx.strokeStyle = brass;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(90, 150);
      ctx.lineTo(256, 110);
      ctx.stroke();
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = sand;
      ctx.beginPath();
      ctx.moveTo(256, 110);
      ctx.lineTo(420, 150);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const [x, y, label] of nodes) {
        ctx.fillStyle = '#141210';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = brass;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = `500 15px ${FONT_MONO}`;
        ctx.fillStyle = paper;
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 56);
      }
      ctx.textAlign = 'left';
      ctx.font = `500 16px ${FONT_UI}`;
      ctx.fillStyle = brass;
      ctx.fillText('Article 17', 24, 268);
      break;
    }
    case 'timeline': {
      line(24, 220, w - 48, soft, 2);
      const years = ['1891', '1916', '1927', '1936', '1948', '1956'];
      years.forEach((y, i) => {
        const x = 34 + i * ((w - 88) / (years.length - 1));
        line(x, 212, 2, brass, 18);
        ctx.font = `500 13px ${FONT_MONO}`;
        ctx.fillStyle = soft;
        ctx.fillText(y, x - 16, 252);
        if (i % 2 === 0) {
          ctx.fillStyle = '#3a332b';
          ctx.fillRect(x - 30, 88, 64, 86);
          ctx.strokeStyle = brass;
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 30, 88, 64, 86);
        }
      });
      break;
    }
    case 'manuscript': {
      ctx.fillStyle = '#d9cdb4';
      ctx.fillRect(28, 66, 250, 220);
      ctx.strokeStyle = '#6b4921';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let x = 40; x < 262; x += 6) {
          const y = 90 + i * 24 + Math.sin(x * 0.18 + i) * 2.5;
          if (x === 40) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = brass;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(380, 170, 70, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 5; i++) line(330, 132 + i * 18, 100 - i * 8, soft, 5);
      break;
    }
    case 'audio': {
      for (let i = 0; i < 44; i++) {
        const hgt = 12 + Math.abs(Math.sin(i * 0.61) * Math.cos(i * 0.23)) * 110;
        line(28 + i * 10, 170 - hgt / 2, 5, i < 18 ? brass : soft, hgt);
      }
      ctx.font = `500 16px ${FONT_INDIC}`;
      ctx.fillStyle = paper;
      ctx.fillText('मराठी   ·   हिन्दी   ·   English', 28, 272);
      break;
    }
    case 'av': {
      ctx.fillStyle = '#0d0b0a';
      ctx.fillRect(24, 64, w - 48, 150);
      ctx.fillStyle = brass;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 16, 116);
      ctx.lineTo(w / 2 + 22, 139);
      ctx.lineTo(w / 2 - 16, 162);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 3; i++)
        line(24, 232 + i * 18, 380 - i * 60, i === 1 ? brass : soft, 5);
      break;
    }
    case 'assistant': {
      ctx.fillStyle = '#3a332b';
      ctx.beginPath();
      ctx.roundRect(210, 70, 278, 52, 10);
      ctx.fill();
      line(228, 92, 200, paper, 6);
      ctx.fillStyle = '#2a241f';
      ctx.beginPath();
      ctx.roundRect(24, 138, 350, 112, 10);
      ctx.fill();
      for (let i = 0; i < 3; i++) line(42, 160 + i * 22, 300 - i * 40, soft, 6);
      ctx.font = `500 13px ${FONT_MONO}`;
      ctx.fillStyle = brass;
      ctx.fillText('CAD 7.62.185+', 42, 238);
      break;
    }
    case 'curator': {
      for (let r = 0; r < 7; r++) {
        const y = 74 + r * 28;
        line(24, y, w - 48, '#2a241f', 22);
        ctx.fillStyle = r === 4 ? sand : green;
        ctx.beginPath();
        ctx.arc(40, y + 11, 5, 0, Math.PI * 2);
        ctx.fill();
        line(56, y + 8, 160, soft, 5);
        line(300, y + 8, 60, soft, 5);
      }
      line(24, 280, w - 48, '#2a241f', 10);
      line(24, 280, (w - 48) * 0.62, brass, 10);
      break;
    }
    case 'entrance':
    default: {
      // Portrait. The script carousel, frozen at one frame: the same welcome
      // in three scripts, so a visitor sees their own before touching anything.
      ctx.textAlign = 'center';
      ctx.font = `600 58px ${FONT_READ}`;
      ctx.fillStyle = paper;
      ctx.fillText('Toran', w / 2, h * 0.3);
      ctx.fillStyle = brass;
      ctx.fillRect(w / 2 - 36, h * 0.3 + 18, 72, 2);
      const greetings: [string, string][] = [
        ['स्वागत', FONT_INDIC],
        ['Welcome', FONT_READ],
        ['स्वागत आहे', FONT_INDIC],
      ];
      greetings.forEach(([text, face], i) => {
        ctx.font = `400 30px ${face}`;
        ctx.fillStyle = i === 1 ? paper : soft;
        ctx.fillText(text, w / 2, h * 0.47 + i * 48);
      });
      // The card, where a visitor taps.
      ctx.strokeStyle = brass;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 54, h * 0.74, 108, 68, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.74 + 34, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.textAlign = 'left';
      break;
    }
  }

  // Footer status.
  ctx.globalAlpha = 1;
  ctx.fillStyle = status === 'idle' ? '#a99e8c' : '#74a891';
  ctx.beginPath();
  ctx.arc(w - 34, h - 26, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `500 14px ${indic ? FONT_INDIC : FONT_MONO}`;
  ctx.fillStyle = '#a99e8c';
  ctx.textAlign = 'right';
  ctx.fillText(statusLabel, w - 48, h - 21);
  return toTexture(c, true);
}

/** Floating name plate above a device. Always visible, never hover-only. */
export function label(
  name: string,
  status: ScreenStatus,
  lang: string,
): THREE.CanvasTexture {
  const w = 512;
  const h = 112;
  const [c, ctx] = canvas(w, h);
  const indic = /^(hi|mr|sa|ne|kok|mai|doi|brx)$/.test(lang);
  ctx.fillStyle = 'rgba(20,18,16,0.82)';
  ctx.beginPath();
  ctx.roundRect(4, 4, w - 8, h - 8, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,155,82,0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  const dot = status === 'online' ? '#74a891' : status === 'idle' ? '#a99e8c' : '#d4736b';
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(46, h / 2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `600 38px ${indic ? FONT_INDIC : FONT_UI}`;
  ctx.fillStyle = '#e8e1d3';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 78, h / 2 + 2);
  return toTexture(c, true);
}

/** Wait for the faces canvas text depends on, or labels render in a fallback. */
export async function fontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  await Promise.all([
    document.fonts.load(`600 38px ${FONT_UI}`),
    document.fonts.load(`600 40px ${FONT_READ}`),
    document.fonts.load(`400 27px ${FONT_READ}`),
    document.fonts.load(`500 14px ${FONT_MONO}`),
    document.fonts.load(`400 24px ${FONT_INDIC}`, 'स्वागत'),
  ]);
}

// ---------- the campus ----------

/**
 * Coursed ashlar, for the compound wall and the sandstone of the spine.
 *
 * The same red as `sandstone`, but with the horizontal joints and the broken
 * vertical joints of laid masonry. The memorial's walls are unmistakably built
 * of blocks rather than cast, and at the distance the arrival flight passes
 * them the coursing is the only thing that says so.
 */
export function ashlar(size = 512): {
  map: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const [c, ctx] = canvas(size, size);
  const [rc, rctx] = canvas(size, size);

  // Four courses per tile, each offset half a block from the one below, which
  // is how the joints break in the photographs.
  const courses = 4;
  const blocksPerCourse = 3;
  const courseH = size / courses;
  const blockW = size / blocksPerCourse;

  const img = ctx.createImageData(size, size);
  const rough = rctx.createImageData(size, size);
  const base = [156, 88, 66];

  for (let y = 0; y < size; y++) {
    const course = Math.floor(y / courseH);
    const offset = (course % 2) * (blockW / 2);
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      const inCourse = y - course * courseH;
      const shifted = (x + offset) % size;
      const inBlock = shifted % blockW;

      // Joints are recessed, so they read darker and rougher.
      const joint =
        inCourse < 3 || inCourse > courseH - 3 || inBlock < 3 || inBlock > blockW - 3;

      // Each block gets its own tone, so a wall is not one flat colour.
      const blockId = course * 31 + Math.floor(shifted / blockW) * 7;
      const tone = 0.93 + hash(blockId, course, 13) * 0.16;

      const grain = fbm(u, v, 10, 4, 5);
      const k = (joint ? 0.62 : tone) * (0.82 + grain * 0.3);

      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, base[0]! * k);
      img.data[i + 1] = Math.min(255, base[1]! * k * (0.96 + grain * 0.08));
      img.data[i + 2] = Math.min(255, base[2]! * k);
      img.data[i + 3] = 255;

      const r = joint ? 240 : 165 + (grain - 0.5) * 110;
      rough.data[i] = r;
      rough.data[i + 1] = r;
      rough.data[i + 2] = r;
      rough.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rough, 0, 0);
  return { map: toTexture(c, true, true), roughness: toTexture(rc, false, true) };
}

/**
 * Lawn. Delhi grass in the dry months is not English grass: yellower, patchier,
 * and worn to dust where people walk. A flat green reads as a golf simulator.
 */
export function lawn(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Two scales: broad patches of wear, and the blade-level speckle that
      // keeps a lawn from flattening out under a distant camera.
      const patch = fbm(u, v, 4, 4, 61);
      const blade = hash(x, y, 77);
      const k = 0.72 + patch * 0.5 + blade * 0.14;
      const i = (y * size + x) * 4;
      // Olive rather than emerald. The first mix was a English-lawn green and
      // made the campus read as a golf course laid out around a monument.
      img.data[i] = Math.min(255, 116 * k * (1.06 - patch * 0.14));
      img.data[i + 1] = Math.min(255, 120 * k);
      img.data[i + 2] = Math.min(255, 62 * k * (0.9 + patch * 0.2));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, true, true);
}

/**
 * Asphalt, with the dust every Delhi road carries at the kerb.
 *
 * Lane markings are geometry rather than baked in here, because the road is
 * long and thin: a texture holding them would either repeat them every few
 * metres or have to be enormous.
 */
export function asphalt(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const aggregate = hash(x, y, 91);
      const patch = fbm(u, v, 5, 3, 29);
      const k = 0.78 + patch * 0.34 + (aggregate > 0.93 ? 0.22 : 0);
      const i = (y * size + x) * 4;
      // Warm grey, not neutral: dust settles on everything here.
      img.data[i] = Math.min(255, 62 * k);
      img.data[i + 1] = Math.min(255, 59 * k);
      img.data[i + 2] = Math.min(255, 55 * k);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, true, true);
}

/**
 * One storey of a Delhi residential block: rendered wall, a window, a balcony
 * opening, and the floor band under it.
 *
 * A single storey rather than a whole building, so it can tile. Blocks along
 * the road run three to five storeys and the windows have to come out the same
 * size on all of them; baking four storeys into one map and stretching it over
 * whatever height a block happens to be gives every building its own window
 * scale, which is the one thing that makes a row read as wallpaper.
 *
 * Tiled by world-space projection at one repeat per storey, so a wall four
 * storeys tall simply gets four of these.
 */
export function facade(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);

  ctx.fillStyle = '#d9d2c4';
  ctx.fillRect(0, 0, size, size);

  // Render is never flat: patchy, and dirtier toward the floor band.
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = 0.93 + fbm(x / size, y / size, 5, 3, 67) * 0.14;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, img.data[i]! * k);
      img.data[i + 1] = Math.min(255, img.data[i + 1]! * k);
      img.data[i + 2] = Math.min(255, img.data[i + 2]! * k);
    }
  }
  ctx.putImageData(img, 0, 0);

  // Two bays: a window and a balcony opening.
  const pad = size * 0.09;
  const bay = (size - pad * 3) / 2;
  const top = size * 0.2;
  const h = size * 0.46;

  // Window, recessed, with a sill and a reveal.
  ctx.fillStyle = '#3c4048';
  ctx.fillRect(pad, top, bay, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(pad, top, bay, h);
  // Glazing bars.
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad + bay / 2, top);
  ctx.lineTo(pad + bay / 2, top + h);
  ctx.stroke();
  ctx.fillStyle = 'rgba(160,150,136,0.85)';
  ctx.fillRect(pad - 3, top + h, bay + 6, 5);

  // Balcony: darker opening with a rail across it.
  const bx = pad * 2 + bay;
  ctx.fillStyle = '#33373d';
  ctx.fillRect(bx, top, bay, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(bx, top, bay, h);
  ctx.fillStyle = 'rgba(120,112,100,0.9)';
  ctx.fillRect(bx, top + h * 0.58, bay, 6);
  for (let i = 1; i < 7; i++) {
    ctx.fillRect(bx + (i / 7) * bay - 1, top + h * 0.58, 2, h * 0.42);
  }

  // The floor band, and the grime that collects under it.
  ctx.fillStyle = 'rgba(178,168,152,0.55)';
  ctx.fillRect(0, size - size * 0.1, size, size * 0.06);
  const dirt = ctx.createLinearGradient(0, size - size * 0.1, 0, size);
  dirt.addColorStop(0, 'rgba(70,62,52,0.28)');
  dirt.addColorStop(1, 'rgba(70,62,52,0)');
  ctx.fillStyle = dirt;
  ctx.fillRect(0, size - size * 0.1, size, size * 0.1);

  return toTexture(c, true, true);
}

/**
 * The stone of the plaza paving, as grain only.
 *
 * The rings themselves are geometry — alternating annuli — because their edges
 * have to stay crisp from a bird's-eye view, and a texture sharp enough to do
 * that across a sixty metre plaza would eat the whole texture budget.
 */
export function paving(size = 256): {
  map: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
} {
  const [c, ctx] = canvas(size, size);
  const [rc, rctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  const rough = rctx.createImageData(size, size);

  const slab = size / 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const slabId = Math.floor(x / slab) * 13 + Math.floor(y / slab) * 5;
      const tone = 0.94 + hash(slabId, 2, 19) * 0.12;
      const onJoint = x % slab < 2 || y % slab < 2;
      const grain = fbm(u, v, 7, 3, 37);
      const k = (onJoint ? 0.84 : tone) * (0.88 + grain * 0.22);
      const i = (y * size + x) * 4;
      // Near white. The ring colours come from the material, not from here.
      img.data[i] = Math.min(255, 228 * k);
      img.data[i + 1] = Math.min(255, 222 * k);
      img.data[i + 2] = Math.min(255, 208 * k);
      img.data[i + 3] = 255;
      const r = onJoint ? 235 : 150 + (grain - 0.5) * 90;
      rough.data[i] = r;
      rough.data[i + 1] = r;
      rough.data[i + 2] = r;
      rough.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rough, 0, 0);
  return { map: toTexture(c, true, true), roughness: toTexture(rc, false, true) };
}

/**
 * The page of the open book: the Preamble, set as a printed page, for the two
 * cream faces that are the roof of the memorial.
 *
 * Read from the air rather than at arm's length, so the text is set as ruled
 * lines of type with only the opening words legible. Rendering the whole
 * Preamble at a size nobody can read would cost a 2048 texture to say the same
 * thing this says at 512.
 */
export function pageFace(size = 512): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);

  ctx.fillStyle = '#ede5d6';
  ctx.fillRect(0, 0, size, size);

  // Paper, with the mottle of a printed leaf rather than a flat fill.
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const k = 0.95 + fbm(x / size, y / size, 6, 3, 83) * 0.1;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, img.data[i]! * k);
      img.data[i + 1] = Math.min(255, img.data[i + 1]! * k);
      img.data[i + 2] = Math.min(255, img.data[i + 2]! * k);
    }
  }
  ctx.putImageData(img, 0, 0);

  const margin = size * 0.13;
  const width = size - margin * 2;

  ctx.fillStyle = '#4a4034';
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(size * 0.05)}px ${FONT_READ}`;
  ctx.fillText('WE, THE PEOPLE OF INDIA', size / 2, margin + size * 0.06);

  // The body, as ruled lines of type. Line lengths vary the way set text does,
  // and the last line of each paragraph is short.
  ctx.fillStyle = 'rgba(74,64,52,0.55)';
  let y = margin + size * 0.12;
  const leading = size * 0.026;
  for (let line = 0; line < 26; line++) {
    const last = line % 7 === 6;
    const w = last ? width * (0.3 + hash(line, 1, 7) * 0.25) : width * 0.97;
    ctx.fillRect(margin, y, w, Math.max(1, size * 0.0055));
    y += leading;
    if (last) y += leading * 0.5;
  }

  // The enacting line, which is the one other thing an eye picks out.
  ctx.fillStyle = '#4a4034';
  ctx.font = `600 ${Math.round(size * 0.032)}px ${FONT_READ}`;
  ctx.fillText('HEREBY ADOPT, ENACT AND GIVE TO OURSELVES', size / 2, y + size * 0.05);
  ctx.fillText('THIS CONSTITUTION', size / 2, y + size * 0.09);

  return toTexture(c, true);
}

/**
 * The memorial's name in raised gold letters, for the wall beside the gate.
 *
 * Drawn with the Devanagari line above the Latin, as it is on the wall. The
 * letters carry a highlight above and a shadow below so they read as standing
 * proud of the stone rather than painted on it.
 */
export function nameplate(width = 1024, height = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(width, height);

  // Transparent ground: this goes on the wall as a decal, so the stone shows.
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';

  const gold = '#c89b52';
  const line = (text: string, y: number, px: number, font: string, spacing = 0): void => {
    ctx.font = `600 ${px}px ${font}`;
    if (spacing > 0) {
      // Canvas has no tracking, so letters are placed one at a time. The name
      // on the wall is set very wide and it is most of its character.
      const chars = [...text];
      const widths = chars.map((ch) => ctx.measureText(ch).width + spacing);
      const total = widths.reduce((a, b) => a + b, 0) - spacing;
      let x = (width - total) / 2;
      chars.forEach((ch, i) => {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillText(ch, x + widths[i]! / 2 + 2, y + 3);
        ctx.fillStyle = gold;
        ctx.fillText(ch, x + widths[i]! / 2, y);
        x += widths[i]!;
      });
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(text, width / 2 + 2, y + 3);
    ctx.fillStyle = gold;
    ctx.fillText(text, width / 2, y);
  };

  line('डॉ॰ अम्बेडकर राष्ट्रीय स्मारक', 62, 40, FONT_INDIC);
  line('DR. AMBEDKAR NATIONAL MEMORIAL', 136, 54, FONT_UI, 6);
  line('26 ALIPUR ROAD, DELHI', 186, 26, FONT_UI, 4);

  // The two notice panels, white on the stone, as on the wall.
  ctx.fillStyle = 'rgba(244,239,230,0.92)';
  ctx.fillRect(width * 0.3, 208, width * 0.18, 34);
  ctx.fillRect(width * 0.52, 208, width * 0.18, 34);
  ctx.fillStyle = '#1a1714';
  ctx.font = `500 16px ${FONT_UI}`;
  ctx.fillText('MONDAY CLOSED', width * 0.39, 230);
  ctx.fillText('ENTRY FREE', width * 0.61, 230);

  return toTexture(c, true);
}

/**
 * Daylight sky over the campus: the pale, hazy, slightly brown sky of Delhi
 * rather than a clear blue one.
 *
 * `sky` above is the dusk gradient the old forecourt used and the interior
 * still wants. The arrival flight opens on the campus in daylight, and a deep
 * blue overhead would make the red sandstone read as a postcard. The haze is
 * the point: it is what puts the neighbouring blocks in the distance.
 */
export function daysky(): THREE.CanvasTexture {
  // Mapped onto a sphere, so the horizon is the middle of the texture.
  const [c, ctx] = canvas(8, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#6f8ba8');
  g.addColorStop(0.3, '#9db0c2');
  g.addColorStop(0.44, '#c9cfcb');
  g.addColorStop(0.5, '#ddd6c4');
  g.addColorStop(0.56, '#cfc7b6');
  g.addColorStop(0.74, '#8e8578');
  g.addColorStop(1, '#5d564c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return toTexture(c, true);
}

/**
 * Alpha for a fountain plume: brightest at the jet and thinning as it rises and
 * spreads.
 *
 * Same discipline as `shaft` — three.js reads an alphaMap from the GREEN
 * channel, so this is drawn in grey on opaque black rather than in white with
 * varying alpha. Without it, the crossed sheets of a fountain render as two
 * solid white slabs standing in the garden, which is exactly what they did.
 */
export function plume(): THREE.CanvasTexture {
  const w = 128;
  const h = 128;
  const [c, ctx] = canvas(w, h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const img = ctx.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    // v: 0 at the top of the sheet, 1 at the jet.
    const v = y / (h - 1);
    // Dense at the nozzle, falling away toward the crown of the plume.
    const up = Math.pow(v, 1.5);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      // The plume widens as it falls, so the waist is narrow at the top.
      const spread = 0.22 + (1 - v) * 0.5;
      const across = Math.max(0, 1 - Math.abs(u - 0.5) / spread);
      const value = 255 * up * across ** 1.7 * (0.75 + fbm(u, v, 7, 3, 53) * 0.5);
      const i = (y * w + x) * 4;
      img.data[i] = value;
      img.data[i + 1] = value;
      img.data[i + 2] = value;
    }
  }
  ctx.putImageData(img, 0, 0);
  return toTexture(c, false);
}

// ---------- the interior ----------

/**
 * The inscription on the statue's pedestal, in gold on transparent.
 *
 * Bilingual, as it is on the real one: the honour above, the name below, the
 * dates under that. Drawn as a decal rather than modelled in relief — raised
 * letters are a bump map's job, and at nine metres nobody reads them in relief
 * anyway.
 */
export function inscription(width = 512, height = 176): THREE.CanvasTexture {
  const [c, ctx] = canvas(width, height);
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';

  const gold = '#c89b52';
  const line = (text: string, y: number, px: number, font: string) => {
    ctx.font = `600 ${px}px ${font}`;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(text, width / 2 + 1.5, y + 2);
    ctx.fillStyle = gold;
    ctx.fillText(text, width / 2, y);
  };

  line('भारत रत्न', 34, 26, FONT_INDIC);
  line('BHARAT RATNA', 60, 22, FONT_UI);
  line('डॉ॰ भीमराव अम्बेडकर', 100, 30, FONT_INDIC);
  line('DR. BHIMRAO AMBEDKAR', 130, 28, FONT_UI);
  line('1891 — 1956', 158, 18, FONT_MONO);

  return toTexture(c, true);
}

/**
 * The atrium ceiling: dark panels pierced by a grid of small recessed lights.
 *
 * image8's dome is perforated and almost black, with pinpoints of warm light in
 * it. Modelling several hundred coffers would cost more than the statue under
 * them; this is the same reading at one texture, and the pinpoints are drawn
 * bright enough to survive the bloom threshold.
 */
export function coffer(size = 256): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);

  ctx.fillStyle = '#14120f';
  ctx.fillRect(0, 0, size, size);

  // The panel joints.
  ctx.strokeStyle = 'rgba(70,64,56,0.55)';
  ctx.lineWidth = 2;
  const cells = 4;
  for (let i = 1; i < cells; i++) {
    const at = (i / cells) * size;
    ctx.beginPath();
    ctx.moveTo(at, 0);
    ctx.lineTo(at, size);
    ctx.moveTo(0, at);
    ctx.lineTo(size, at);
    ctx.stroke();
  }

  // Perforation: a dense field of small dark holes, and one downlight per
  // panel among them.
  const step = size / 32;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  for (let y = step; y < size; y += step) {
    for (let x = step; x < size; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const x = (cx + 0.5) * (size / cells);
      const y = (cy + 0.5) * (size / cells);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, size / cells / 2.4);
      glow.addColorStop(0, '#ffe9c4');
      glow.addColorStop(0.24, 'rgba(255,214,150,0.55)');
      glow.addColorStop(1, 'rgba(255,196,120,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(
        x - size / cells / 2,
        y - size / cells / 2,
        size / cells,
        size / cells,
      );
    }
  }

  return toTexture(c, true, true);
}

/**
 * The backlit archive wall: black and white photographs, edge to edge, with
 * printed text panels between them, as in image5.
 *
 * The photographs are not photographs. What the eye reads at gallery distance
 * is tone, grain, and the shape of a crowd — so each panel is built from those:
 * a sky that falls to a dark ground, a band of massed heads at the horizon, a
 * few larger figures nearer the camera, and film grain over all of it. Anything
 * more literal would be a lie about what the archive actually contains.
 */
export function mural(size = 512): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);
  const panels = 3;
  const w = size / panels;

  for (let p = 0; p < panels; p++) {
    const x0 = p * w;
    const seed = 90 + p * 31;
    // A text panel every third frame, as the wall in image5 interleaves them.
    const isText = p % 3 === 2;

    if (isText) {
      ctx.fillStyle = '#e8e4dc';
      ctx.fillRect(x0, 0, w, size);
      ctx.fillStyle = '#2a2724';
      ctx.font = `600 ${Math.round(size * 0.028)}px ${FONT_UI}`;
      ctx.textAlign = 'left';
      ctx.fillText('DR. B. R. AMBEDKAR', x0 + w * 0.08, size * 0.1);
      ctx.fillStyle = 'rgba(42,39,36,0.55)';
      for (let line = 0; line < 30; line++) {
        const last = line % 6 === 5;
        const lw = (last ? 0.4 + hash(line, p, 5) * 0.3 : 0.84) * w;
        ctx.fillRect(x0 + w * 0.08, size * 0.15 + line * size * 0.026, lw, 2);
      }
      continue;
    }

    // Sky to ground, the tonal spine of any crowd photograph.
    const sky = ctx.createLinearGradient(0, 0, 0, size);
    sky.addColorStop(0, '#d8d5d0');
    sky.addColorStop(0.46, '#a8a49e');
    sky.addColorStop(0.62, '#55524d');
    sky.addColorStop(1, '#22201e');
    ctx.fillStyle = sky;
    ctx.fillRect(x0, 0, w, size);

    // The crowd: a dense band of heads along the horizon, thinning upward.
    for (let i = 0; i < 900; i++) {
      const u = hash(i, seed, 1);
      const v = hash(i, seed, 2);
      const y = size * (0.6 + v * 0.42);
      const r = size * (0.004 + v * 0.012);
      const tone = 30 + hash(i, seed, 3) * 90;
      ctx.fillStyle = `rgba(${tone},${tone},${tone},0.85)`;
      ctx.beginPath();
      ctx.arc(x0 + u * w, y, r, 0, Math.PI * 2);
      ctx.fill();
      // Shoulders under each head, which is what makes a dot read as a person.
      ctx.fillRect(x0 + u * w - r, y + r * 0.7, r * 2, r * 2.4);
    }

    // Two or three figures nearer the lens, in the lower third.
    for (let i = 0; i < 3; i++) {
      const fx = x0 + w * (0.2 + hash(i, seed, 7) * 0.6);
      const fy = size * (0.76 + hash(i, seed, 8) * 0.1);
      const fh = size * (0.12 + hash(i, seed, 9) * 0.06);
      ctx.fillStyle = 'rgba(18,17,16,0.9)';
      ctx.beginPath();
      ctx.arc(fx, fy, fh * 0.17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(fx - fh * 0.2, fy + fh * 0.12, fh * 0.4, fh * 0.78);
    }
  }

  // Film grain, and the frame lines between panels.
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (hash(i, 3, 11) - 0.5) * 26;
    img.data[i] = Math.max(0, Math.min(255, img.data[i]! + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1]! + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2]! + n));
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = '#141210';
  ctx.lineWidth = 4;
  for (let p = 1; p < panels; p++) {
    ctx.beginPath();
    ctx.moveTo(p * w, 0);
    ctx.lineTo(p * w, size);
    ctx.stroke();
  }

  return toTexture(c, true, true);
}

/**
 * The painted backdrop behind the banyan tableau: a forest, a great tree with
 * aerial roots, and daylight falling through the canopy, after image6.
 *
 * Painted rather than modelled because that is what it is in the building — a
 * flat scenic backdrop with the foreground built out in front of it.
 */
export function forest(size = 384): THREE.CanvasTexture {
  const [c, ctx] = canvas(size, size);

  // Canopy light: bright and green above, falling to leaf litter below.
  const depth = ctx.createLinearGradient(0, 0, 0, size);
  depth.addColorStop(0, '#5c6b3a');
  depth.addColorStop(0.28, '#41522c');
  depth.addColorStop(0.62, '#2f3a24');
  depth.addColorStop(0.84, '#4a4128');
  depth.addColorStop(1, '#3a331f');
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, size, size);

  // Dappled light through the leaves.
  for (let i = 0; i < 260; i++) {
    const x = hash(i, 5, 1) * size;
    const y = hash(i, 5, 2) * size * 0.72;
    const r = size * (0.01 + hash(i, 5, 3) * 0.045);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(206,214,150,0.4)');
    g.addColorStop(1, 'rgba(206,214,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Distant trunks, receding and paler with depth.
  for (let i = 0; i < 16; i++) {
    const x = hash(i, 9, 1) * size;
    const w = size * (0.012 + hash(i, 9, 2) * 0.03);
    const fade = 0.2 + hash(i, 9, 3) * 0.3;
    ctx.fillStyle = `rgba(48,44,32,${fade})`;
    ctx.fillRect(x, size * 0.1, w, size * 0.78);
  }

  // The banyan itself: a broad trunk off centre, with aerial roots falling
  // from the canopy. The roots are the whole character of the tree.
  const cx = size * 0.56;
  ctx.fillStyle = '#4a4232';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.13, size);
  ctx.lineTo(cx - size * 0.075, size * 0.2);
  ctx.lineTo(cx + size * 0.075, size * 0.2);
  ctx.lineTo(cx + size * 0.14, size);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#453d2e';
  for (let i = 0; i < 22; i++) {
    const x = cx + (hash(i, 13, 1) - 0.5) * size * 0.52;
    const top = size * (0.16 + hash(i, 13, 2) * 0.14);
    const bottom = size * (0.6 + hash(i, 13, 3) * 0.38);
    ctx.lineWidth = 1.5 + hash(i, 13, 4) * 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.bezierCurveTo(
      x + (hash(i, 13, 5) - 0.5) * 20,
      (top + bottom) / 2,
      x + (hash(i, 13, 6) - 0.5) * 16,
      (top + bottom) / 2,
      x + (hash(i, 13, 7) - 0.5) * 10,
      bottom,
    );
    ctx.stroke();
  }

  // Buttress roots spreading across the ground at its foot.
  ctx.fillStyle = '#524832';
  for (let i = 0; i < 7; i++) {
    const x = cx + (hash(i, 17, 1) - 0.5) * size * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, size * 0.78);
    ctx.quadraticCurveTo(
      x + (hash(i, 17, 2) - 0.5) * 60,
      size * 0.93,
      x + (hash(i, 17, 3) - 0.5) * 110,
      size,
    );
    ctx.lineTo(x + (hash(i, 17, 3) - 0.5) * 110 + 26, size);
    ctx.quadraticCurveTo(
      x + (hash(i, 17, 2) - 0.5) * 60 + 18,
      size * 0.94,
      x + 12,
      size * 0.78,
    );
    ctx.closePath();
    ctx.fill();
  }

  return toTexture(c, true);
}
