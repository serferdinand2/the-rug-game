// Approved style C prototype: the Lighthouse landmark as a 64x64 vector pixel-art scene
// (one crispEdges path per colour). Usage: node lighthouse.mjs <output directory>
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];

const canvas = (w, h) => ({ w, h, p: new Array(w * h).fill(null) });
const inside = (c, x, y) => x >= 0 && y >= 0 && x < c.w && y < c.h;
const get = (c, x, y) => (inside(c, x, y) ? c.p[y * c.w + x] : undefined);
const set = (c, x, y, col) => { if (inside(c, x, y) && col) c.p[y * c.w + x] = col; };
const fillEmpty = (c, x, y, col) => { if (get(c, x, y) === null) set(c, x, y, col); };
const rect = (c, x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(c, x + i, y + j, col); };

function outline(c, col) {
  const add = [];
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    if (get(c, x, y) !== null) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const v = get(c, x + dx, y + dy); return v && v !== col; })) add.push([x, y]);
  }
  for (const [x, y] of add) set(c, x, y, col);
}

const hex = n => n.toString(16).padStart(2, '0');
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => hex(Math.round(v + (pb[i] - v) * t))).join('');
};

function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

function toSVG(c, opacity = {}) {
  const runs = new Map();
  for (let y = 0; y < c.h; y++) {
    let x = 0;
    while (x < c.w) {
      const col = c.p[y * c.w + x];
      if (!col) { x++; continue; }
      let n = 1;
      while (x + n < c.w && c.p[y * c.w + x + n] === col) n++;
      if (!runs.has(col)) runs.set(col, []);
      runs.get(col).push(`M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  }
  const paths = [...runs].map(([col, d]) => `<path fill="${col}"${opacity[col] ? ` fill-opacity="${opacity[col]}"` : ''} d="${d.join('')}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${c.w} ${c.h}" shape-rendering="crispEdges">${paths}</svg>`;
}

// Shared palette
const K = '#1a1326', W = '#efe6d2', w = '#c4b79f', H = '#fffaf0', R = '#c43c3c', r = '#8a2534', P = '#e8675b';
const Y = '#ffd25e', y = '#fff4bf', O = '#e09a2b', D = '#3b2d55', d = '#271d3b', E = '#6a5a92';
const G = '#8a8797', g = '#5c596c', S = '#b3afc2', F = '#a9dcec', N = '#3a2a22';

// Draws one row of the striped, shaded tower.
function towerRow(c, cx, yy, hw, band, { shade = 2, bricks = false, dither = true } = {}) {
  const [main, dark, light] = band ? [R, r, P] : [W, w, H];
  const x0 = cx - hw, x1 = cx + hw - 1;
  for (let x = x0; x <= x1; x++) {
    let col = main;
    if (x === x0) col = light;
    else if (x > x1 - shade) col = dark;
    else if (dither && x === x1 - shade && yy % 2) col = dark;
    if (bricks && !band && col === main && (x + (Math.floor(yy / 2) % 2) * 2) % 4 === 0 && yy % 2 === 0) col = mix(W, w, 0.5);
    set(c, x, yy, col);
  }
}

// C: 64x64 night-sea scene
function scene() {
  const c = canvas(64, 64), cx = 24, rand = rng(7);
  const sky = ['#120d24', '#1a1434', '#241d47', '#30275a', '#3f336c', '#52427c'];
  const skyAt = (x, yy) => { const t = yy / 41 * (sky.length - 1), i = Math.floor(t), f = t - i; return i + 1 < sky.length && f > 0.6 && (x + yy) % 2 === 0 ? sky[i + 1] : sky[i]; };
  const layer = canvas(64, 64);
  for (let yy = 0; yy <= 41; yy++) for (let x = 0; x < 64; x++) set(layer, x, yy, skyAt(x, yy));
  for (let i = 0; i < 46; i++) { const sx = Math.floor(rand() * 64), sy = Math.floor(rand() * 32); set(layer, sx, sy, rand() > 0.6 ? '#ffffff' : '#bdb4e6'); }
  for (const [sx, sy] of [[8, 6], [58, 22], [37, 4], [3, 24]]) { set(layer, sx, sy, '#ffffff'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(layer, sx + dx, sy + dy, '#bdb4e6'); }
  for (let yy = 3; yy <= 17; yy++) for (let x = 43; x <= 57; x++) {
    const inMoon = (x - 50) ** 2 + (yy - 10) ** 2 <= 30, bite = (x - 53) ** 2 + (yy - 8) ** 2 <= 26;
    if (inMoon && !bite) set(layer, x, yy, (x - 50) ** 2 + (yy - 10) ** 2 >= 20 ? '#e8d7a6' : '#f8eecb');
  }
  // Distant headland on the right.
  for (let x = 40; x < 64; x++) { const top = Math.round(37 - Math.min(x - 40, 14) * 0.45 + Math.sin(x * 0.7) * 0.6); for (let yy = top; yy <= 41; yy++) set(layer, x, yy, yy === top ? '#3a2f57' : '#241c3b'); }
  // Sea with waves and the lamp's reflection.
  for (let yy = 42; yy < 64; yy++) for (let x = 0; x < 64; x++) set(layer, x, yy, yy === 42 ? '#4a7fbf' : yy < 48 ? '#24508e' : yy < 56 ? '#1b3f74' : '#132f5b');
  for (let i = 0; i < 60; i++) { const wy = 43 + Math.floor(rand() * 21), wx = Math.floor(rand() * 60), n = 2 + Math.floor(rand() * 4); rect(layer, wx, wy, n, 1, wy < 50 ? '#5f97d4' : '#3a6aa8'); }
  for (let yy = 47; yy < 64; yy += 2) { const jitter = Math.floor(rand() * 5) - 2, n = 4 - Math.floor((yy - 47) / 6); rect(layer, cx - 1 + jitter, yy, Math.max(1, n), 1, yy < 54 ? '#ffd25e' : '#c9a24a'); }

  // Lighthouse and rock island.
  set(c, 23, 3, E); set(c, 24, 3, E); set(c, 23, 4, E); set(c, 24, 4, D);
  [[5, 1], [6, 2], [7, 3], [8, 4], [9, 5], [10, 6]].forEach(([yy, hw]) => { for (let x = cx - hw; x < cx + hw; x++) set(c, x, yy, x < cx - hw + 2 ? E : x >= cx + hw - 3 ? d : D); });
  for (let yy = 11; yy <= 17; yy++) for (let x = 19; x <= 28; x++) {
    const core = (x - 23.5) ** 2 + (yy - 14) ** 2;
    set(c, x, yy, x === 21 || x === 26 ? '#7a5a2a' : core <= 3 ? '#ffffff' : core <= 7 ? y : x >= 27 ? O : Y);
  }
  for (let x = 16; x <= 31; x++) { set(c, x, 18, x <= 17 ? '#8a7bb5' : E); set(c, x, 20, x >= 29 ? K : d); }
  for (let x = 18; x <= 29; x++) set(c, x, 21, d);
  for (let yy = 22; yy <= 44; yy++) towerRow(c, cx, yy, Math.round(4 + (yy - 22) * 3 / 22), Math.floor((yy - 22) / 5) % 2 === 0, { shade: 3, bricks: true });
  for (const wy of [27, 36]) { rect(c, 23, wy, 2, 3, Y); set(c, 24, wy + 2, O); }
  rect(c, 22, 41, 4, 4, N); set(c, 22, 41, null); set(c, 25, 41, null); set(c, 24, 43, '#c9a24a');
  for (let x = 14; x <= 33; x++) for (let yy = 45; yy <= 47; yy++) set(c, x, yy, yy === 45 ? S : x >= 31 ? g : (x + yy) % 6 === 0 ? g : G);
  const boulders = [[20, 48, 6], [29, 48, 6], [13, 51, 5], [36, 51, 5], [24, 53, 6], [7, 54, 3], [42, 54, 3]];
  boulders.forEach(([bx, by, br], n) => {
    for (let yy = by - br; yy <= by + br; yy++) for (let x = bx - br; x <= bx + br; x++) {
      const dx = x - bx, dy = yy - by;
      if (dx * dx + dy * dy > br * br || get(c, x, yy) !== null || yy > 57) continue;
      set(c, x, yy, dx + dy < -br * 0.7 ? S : dx + dy > br * 0.45 ? g : n % 2 ? G : '#7c7990');
    }
  });
  outline(c, '#120c1e');
  // Railing posts sit in front of the sky, so they skip the outline pass.
  for (let x = 16; x <= 31; x += 2) set(c, x, 19, D);
  // Beams: brighten the sky behind them.
  for (let dist = 1; dist <= 40; dist++) {
    const spread = Math.floor(dist * 0.2);
    for (let yy = 14 - spread; yy <= 14 + spread; yy++) {
      const t = (dist < 12 ? 0.55 : 0.4) * (1 - Math.abs(yy - 14) / (spread + 1.5));
      for (const x of [19 - dist, 28 + dist]) { const v = get(layer, x, yy); if (v && yy < 41) set(layer, x, yy, mix(v, '#fff1a8', t)); }
    }
  }
  // Foam where the rock meets the sea.
  for (let x = 0; x < 64; x++) for (let yy = 50; yy < 60; yy++) if (get(c, x, yy) === '#120c1e' && get(c, x, yy + 1) === null && (x + yy) % 3) fillEmpty(c, x, yy + 1, F);
  for (let i = 0; i < c.p.length; i++) if (!c.p[i]) c.p[i] = layer.p[i];
  for (const [gx, gy] of [[41, 21], [46, 17]]) for (const [dx, dy] of [[-2, 0], [-1, -1], [0, 0], [1, -1], [2, 0]]) set(c, gx + dx, gy + dy, '#d9d4f0');
  return toSVG(c);
}

writeFileSync(join(out, 'lighthouse-scene.svg'), scene());
console.log('wrote lighthouse-scene.svg');
