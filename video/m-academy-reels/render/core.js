/* Core helpers, sprites and global layers for the M.ACADEMY reel renderer.
 * Everything is a pure function of time `t` (seconds) so any frame can be
 * rendered independently and in parallel. */
"use strict";

const W = 1080;
const H = 1920;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const E = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  back: (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
};
/** 0 before a, ramps to 1 by b, holds, ramps down from c to 0 at d. */
const win = (t, a, b, c, d) => inv(a, b, t) * (1 - inv(c, d, t));
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const noise1 = (x, s = 0) =>
  0.5 * Math.sin(x * 1.7 + s) + 0.3 * Math.sin(x * 3.1 + s * 2.3) + 0.2 * Math.sin(x * 7.3 + s * 0.7);

// ---------- palette ----------
const C = {
  black: "#020205",
  navy: "#08101f",
  navy2: "#0d1a33",
  gold: "#d4a640",
  goldL: "#f6dc94",
  goldD: "#8a6420",
  cream: "#f3e6c4",
  white: "#f8f4ea",
  cold: "#7fb3ff",
};

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function goldGrad(ctx, x0, y0, x1, y1, shine = -1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#7a5418");
  g.addColorStop(0.22, "#f3d68c");
  g.addColorStop(0.45, "#c08a2a");
  g.addColorStop(0.7, "#fff0c2");
  g.addColorStop(1, "#8a6420");
  if (shine >= 0 && shine <= 1) {
    const a = clamp(shine - 0.06, 0, 1);
    const b = clamp(shine + 0.06, 0, 1);
    g.addColorStop(a, "#f6dc94");
    g.addColorStop(shine, "#ffffff");
    g.addColorStop(b, "#f6dc94");
  }
  return g;
}

function softDot(color, size = 64) {
  const c = canvas(size, size);
  const g = c.getContext("2d");
  const r = size / 2;
  const gr = g.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, color);
  gr.addColorStop(0.25, color.replace(/[\d.]+\)$/, "0.55)"));
  gr.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

// ---------- text ----------
function text(ctx, str, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.style || ""} ${o.weight || 600} ${o.size || 40}px ${o.font || "Inter"}`;
  ctx.textAlign = o.align || "center";
  ctx.textBaseline = o.baseline || "alphabetic";
  const sp = o.tracking || 0;
  ctx.letterSpacing = `${sp}px`;
  ctx.globalAlpha *= o.alpha ?? 1;
  const dx = ctx.textAlign === "center" ? sp / 2 : 0;
  if (o.shadow) {
    ctx.shadowColor = o.shadow;
    ctx.shadowBlur = o.shadowBlur ?? 20;
  }
  if (o.fill === "gold") {
    const m = ctx.measureText(str);
    const w = m.width;
    const x0 = o.align === "left" ? x : o.align === "right" ? x - w : x - w / 2;
    ctx.fillStyle = goldGrad(ctx, x0, y - o.size, x0 + w, y + o.size * 0.2, o.shine ?? -1);
  } else ctx.fillStyle = o.fill || C.white;
  ctx.fillText(str, x + dx, y);
  if (o.stroke) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.strokeWidth || 1;
    ctx.strokeText(str, x + dx, y);
  }
  ctx.restore();
}

function wrapLines(ctx, str, maxW) {
  const words = str.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const cand = cur ? cur + " " + w : w;
    if (ctx.measureText(cand).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = cand;
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ---------- shared sprites (built once) ----------
const S = {};

function buildSprites() {
  S.dotGold = softDot("rgba(255,214,140,1)");
  S.dotWarm = softDot("rgba(255,170,80,1)");
  S.dotCold = softDot("rgba(150,200,255,1)", 64);
  S.dotWhite = softDot("rgba(255,250,235,1)", 64);

  // Film grain frames.
  S.grain = [];
  for (let k = 0; k < 4; k++) {
    const c = canvas(540, 960);
    const g = c.getContext("2d");
    const im = g.createImageData(540, 960);
    const r = rng(99 + k);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    S.grain.push(c);
  }

  // Vignette.
  const v = canvas(W, H);
  const vg = v.getContext("2d");
  const gr = vg.createRadialGradient(W / 2, H * 0.46, H * 0.22, W / 2, H * 0.5, H * 0.72);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0,0.78)");
  vg.fillStyle = gr;
  vg.fillRect(0, 0, W, H);
  S.vignette = v;

  S.beamBase = buildBeam();
  S.coin = buildCoin(512);
  S.guilloche = buildGuilloche(760);
}

/** Gold coin emblem with an "M" monogram, rendered once at high resolution. */
function buildCoin(size) {
  const c = canvas(size, size);
  const g = c.getContext("2d");
  const r = size / 2;
  g.translate(r, r);
  // outer rim
  let gr = g.createLinearGradient(-r, -r, r, r);
  gr.addColorStop(0, "#fff0c0");
  gr.addColorStop(0.3, "#c48f2c");
  gr.addColorStop(0.55, "#f9e2a0");
  gr.addColorStop(0.8, "#8f6420");
  gr.addColorStop(1, "#e8c372");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  g.fill();
  // reeded edge
  g.strokeStyle = "rgba(90,60,15,0.55)";
  g.lineWidth = r * 0.012;
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    g.beginPath();
    g.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
    g.lineTo(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97);
    g.stroke();
  }
  // inner face
  gr = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r * 0.88);
  gr.addColorStop(0, "#ffeab0");
  gr.addColorStop(0.45, "#d29d3a");
  gr.addColorStop(1, "#7d5517");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, r * 0.86, 0, Math.PI * 2);
  g.fill();
  // guilloche ring
  g.strokeStyle = "rgba(110,72,18,0.55)";
  g.lineWidth = r * 0.006;
  for (let k = 0; k < 36; k++) {
    g.beginPath();
    for (let i = 0; i <= 360; i++) {
      const a = (i / 360) * Math.PI * 2;
      const rr = r * (0.7 + 0.035 * Math.sin(a * 12 + k * 0.35));
      const x = Math.cos(a + k * 0.0175) * rr;
      const y = Math.sin(a + k * 0.0175) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.beginPath();
  g.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  g.fillStyle = "#1a1206";
  g.fill();
  gr = g.createRadialGradient(0, -r * 0.2, 0, 0, 0, r * 0.6);
  gr.addColorStop(0, "#2a2010");
  gr.addColorStop(1, "#0b0703");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = r * 0.02;
  g.strokeStyle = goldGrad(g, -r, -r, r, r);
  g.stroke();
  // monogram
  g.font = `700 ${r * 0.72}px Cinzel`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = goldGrad(g, -r * 0.4, -r * 0.4, r * 0.4, r * 0.4);
  g.fillText("M", 0, r * 0.04);
  // small dots
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.beginPath();
    g.arc(Math.cos(a) * r * 0.785, Math.sin(a) * r * 0.785, r * 0.018, 0, Math.PI * 2);
    g.fillStyle = "#5c3d0f";
    g.fill();
  }
  return c;
}

/** Ornamental guilloche medallion ring (like engraved banknote rosettes). */
function buildGuilloche(size) {
  const c = canvas(size, size);
  const g = c.getContext("2d");
  const r = size / 2;
  g.translate(r, r);
  g.lineWidth = 1.3;
  for (let k = 0; k < 64; k++) {
    g.strokeStyle = `rgba(230,190,110,${0.18 + 0.1 * Math.sin(k)})`;
    g.beginPath();
    for (let i = 0; i <= 720; i++) {
      const a = (i / 720) * Math.PI * 2;
      const rr = r * (0.84 + 0.07 * Math.sin(a * 18 + k * 0.098) + 0.03 * Math.sin(a * 6 - k * 0.2));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.lineWidth = 2;
  g.strokeStyle = "rgba(246,220,148,0.8)";
  for (const f of [0.74, 0.99]) {
    g.beginPath();
    g.arc(0, 0, r * f, 0, Math.PI * 2);
    g.stroke();
  }
  return c;
}

// ---------- global layers ----------
const PARTICLES = (() => {
  const r = rng(2024);
  const arr = [];
  for (let i = 0; i < 260; i++) {
    arr.push({
      x: r() * W,
      y: r() * H,
      z: 0.25 + r() * 1.4,
      vy: -(8 + r() * 26),
      vx: (r() - 0.5) * 10,
      ph: r() * 100,
      tw: 0.5 + r() * 2,
    });
  }
  return arr;
})();

function drawParticles(ctx, t, alpha, sprite = S.dotGold, speed = 1) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of PARTICLES) {
    const y = (((p.y + p.vy * t * speed * p.z) % (H + 100)) + H + 100) % (H + 100) - 50;
    const x = p.x + p.vx * t + 18 * Math.sin(t * 0.4 + p.ph) * p.z;
    const s = 5 + 16 * p.z * p.z;
    const tw = 0.55 + 0.45 * Math.sin(t * p.tw + p.ph);
    ctx.globalAlpha = alpha * tw * clamp(0.25 + 0.5 * p.z, 0, 1) * (p.z > 1.3 ? 0.5 : 1);
    ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
  }
  ctx.restore();
}

/** Soft volumetric light beam, pre-blurred once and reused. */
function buildBeam() {
  const raw = canvas(W, H);
  const g = raw.getContext("2d");
  for (let i = 0; i < 6; i++) {
    const topW = 50 + i * 34;
    const botW = 300 + i * 120;
    const gr = g.createLinearGradient(0, 0, 0, H);
    const a = 0.16 - i * 0.02;
    gr.addColorStop(0, `rgba(255,255,255,${a * 1.7})`);
    gr.addColorStop(0.5, `rgba(255,255,255,${a * 0.55})`);
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(W / 2 - topW, 0);
    g.lineTo(W / 2 + topW, 0);
    g.lineTo(W / 2 + botW, H);
    g.lineTo(W / 2 - botW, H);
    g.closePath();
    g.fill();
  }
  // a few thin god-ray streaks
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const off = (r() - 0.5) * 80;
    const spread = (r() - 0.5) * 900;
    g.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.06})`;
    g.lineWidth = 6 + r() * 26;
    g.beginPath();
    g.moveTo(W / 2 + off, 0);
    g.lineTo(W / 2 + spread, H * 0.95);
    g.stroke();
  }
  const out = canvas(W, H);
  const o = out.getContext("2d");
  o.filter = "blur(26px)";
  o.drawImage(raw, 0, 0);
  // hot source at the top
  o.filter = "none";
  const hs = o.createRadialGradient(W / 2, -40, 0, W / 2, -40, 420);
  hs.addColorStop(0, "rgba(255,255,255,0.5)");
  hs.addColorStop(1, "rgba(255,255,255,0)");
  o.fillStyle = hs;
  o.fillRect(0, 0, W, 520);
  return out;
}

function tinted(src, color) {
  const c = canvas(src.width, src.height);
  const g = c.getContext("2d");
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** Volumetric light beam from the top, like a spotlight through dust. */
function drawBeam(ctx, t, alpha, x = W / 2, color = "255,214,150", spread = 1) {
  if (alpha <= 0.01) return;
  const key = "beam_" + color;
  const spr = S[key] || (S[key] = tinted(S.beamBase, `rgb(${color})`));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const sway = 0.05 * Math.sin(t * 0.25);
  ctx.translate(x, 0);
  ctx.transform(spread, 0, sway, 1, 0, 0);
  ctx.globalAlpha = alpha * 0.85;
  ctx.drawImage(spr, -W / 2, 0);
  ctx.globalAlpha = alpha * 0.25 * (0.7 + 0.3 * Math.sin(t * 0.7));
  ctx.transform(1, 0, -sway * 2, 1, 0, 0);
  ctx.drawImage(spr, -W / 2 * 1.3, 0, W * 1.3, H);
  ctx.restore();
}

function drawFloorGlow(ctx, alpha, y = H - 260, color = "255,200,120") {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(W / 2, y);
  ctx.scale(1, 0.18);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 560);
  g.addColorStop(0, `rgba(${color},${alpha * 0.5})`);
  g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-600, -600, 1200, 1200);
  ctx.restore();
}

function drawGrainVignette(ctx, t, grain = 0.06) {
  ctx.save();
  ctx.drawImage(S.vignette, 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = grain;
  const f = Math.floor(t * 30) % 4;
  ctx.drawImage(S.grain[f], 0, 0, W, H);
  ctx.restore();
}

function drawCoinBadge(ctx, cx, cy, r, alpha, t, shineAt = -10) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = r * 0.4;
  ctx.drawImage(S.coin, cx - r, cy - r, r * 2, r * 2);
  ctx.shadowBlur = 0;
  // moving specular highlight
  const k = (t - shineAt) / 1.2;
  if (k > 0 && k < 1) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const x = cx - r * 1.6 + k * r * 3.2;
    const g = ctx.createLinearGradient(x - r * 0.4, cy - r, x + r * 0.4, cy + r);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,248,220,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
}

/** Synchronised subtitles (also exported as SRT). */
function drawSubtitles(ctx, t, cues, y = 1470) {
  const cue = cues.find((c) => t >= c.start && t < c.end + 0.15);
  if (!cue) return;
  const a = inv(cue.start, cue.start + 0.18, t) * (1 - inv(cue.end, cue.end + 0.15, t));
  if (a <= 0) return;
  ctx.save();
  ctx.font = "600 52px Inter";
  const lines = wrapLines(ctx, cue.text, 900);
  const lh = 66;
  const y0 = y - ((lines.length - 1) * lh) / 2 + (1 - E.out(inv(cue.start, cue.start + 0.25, t))) * 14;
  // soft scrim behind the text for legibility on bright frames
  const sg = ctx.createRadialGradient(W / 2, y, 40, W / 2, y, 560);
  sg.addColorStop(0, `rgba(0,0,0,${0.42 * a})`);
  sg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.translate(0, y);
  ctx.scale(1, 0.32);
  ctx.fillStyle = sg;
  ctx.fillRect(0, -560, W, 1120);
  ctx.restore();
  lines.forEach((ln, i) =>
    text(ctx, ln, W / 2, y0 + i * lh, {
      size: 52,
      weight: 600,
      alpha: a,
      fill: "#fbf7ee",
      shadow: "rgba(0,0,0,0.85)",
      shadowBlur: 18,
    }),
  );
  ctx.restore();
}
