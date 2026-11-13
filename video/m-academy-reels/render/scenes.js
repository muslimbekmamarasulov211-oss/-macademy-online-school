/* The six storyboard scenes. Each scene is drawn by a function of absolute
 * time t. Scenes overlap slightly for cross-dissolves (see renderFrame). */
"use strict";

const PINGS = [28.3, 29.1, 29.8, 30.4, 31.1, 31.6, 32.2, 32.9]; // keep in sync with scripts/music.py

// ======================================================================
// Silhouettes
// ======================================================================

/** Profile bust of a scholar (facing right). Local units: head ~200 tall. */
function scholarProfile(v = {}) {
  const tb = v.turban ?? 1; // turban size
  const bd = v.beard ?? 1; // beard length
  // face, beard and robe as one silhouette
  const p = new Path2D();
  p.moveTo(62, -60);
  p.bezierCurveTo(72, -50, 80, -40, 80, -30); // brow
  p.bezierCurveTo(84, -18, 108, 6, 104, 14); // nose
  p.bezierCurveTo(100, 20, 90, 20, 86, 24);
  p.bezierCurveTo(92, 30, 90, 38, 86, 42); // lips
  p.bezierCurveTo(100, 70, 98, 110 * bd, 72, 160 * bd); // beard front
  p.bezierCurveTo(60, 190 * bd, 46, 215 * bd, 36, 222 * bd); // beard tip
  p.bezierCurveTo(24, 214 * bd, 10, 190 * bd, -8, 160 * bd); // beard underside
  p.lineTo(-14, 185);
  p.bezierCurveTo(60, 200, 150, 232, 195, 300); // chest / robe front
  p.bezierCurveTo(220, 350, 232, 410, 236, 470);
  p.lineTo(-310, 470);
  p.bezierCurveTo(-300, 360, -250, 262, -140, 200); // back
  p.bezierCurveTo(-96, 176, -80, 140, -76, 100); // nape
  p.bezierCurveTo(-112, 72, -124, 10, -100, -40); // back of head
  p.bezierCurveTo(-60, -80, 20, -90, 62, -60);
  p.closePath();
  // turban: bulbous wrapped dome, rim curving down behind the ear
  const t = new Path2D();
  t.moveTo(-122, -6);
  t.bezierCurveTo(-160 * tb, -110 * tb, -112 * tb, -192 * tb, -6, -198 * tb);
  t.bezierCurveTo(96 * tb, -202 * tb, 138 * tb, -124 * tb, 98, -50);
  t.bezierCurveTo(60, -46, -10, -42, -60, -24);
  t.bezierCurveTo(-84, -14, -104, -4, -122, -6);
  t.closePath();
  // diagonal wraps of cloth
  const folds = new Path2D();
  for (let i = 0; i < 6; i++) {
    const o = i * 36;
    folds.moveTo(-160 + o, -10 - i * 6);
    folds.bezierCurveTo(-100 + o, -110 * tb, -20 + o * 0.6, -175 * tb, 80 + o * 0.2, -150 * tb + i * 18);
  }
  const tail = new Path2D();
  tail.moveTo(-10, -4); // ear
  tail.bezierCurveTo(-34, -10, -40, 30, -14, 38);
  // inner robe collar line
  const collar = new Path2D();
  collar.moveTo(-14, 185);
  collar.bezierCurveTo(30, 260, 46, 360, 36, 470);
  return { body: p, turban: t, folds, tail, collar };
}

function drawProfile(ctx, sil, x, y, s, flip, o) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  // silhouette fill: deep navy, lifted toward the face side
  const g = ctx.createLinearGradient(-200, 0, 200, 0);
  g.addColorStop(0, "#070a12");
  g.addColorStop(1, "#1a2238");
  ctx.fillStyle = g;
  ctx.globalAlpha = o.fill;
  ctx.fill(sil.body);
  ctx.fill(sil.turban);
  // warm rim light inside the face edge
  ctx.save();
  ctx.clip(sil.body);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,180,90,0.22)";
  ctx.lineWidth = 26;
  ctx.filter = "blur(6px)";
  ctx.stroke(sil.body);
  ctx.restore();
  ctx.save();
  ctx.clip(sil.turban);
  ctx.strokeStyle = "rgba(240,200,130,0.35)";
  ctx.lineWidth = 2.2;
  ctx.stroke(sil.folds);
  ctx.globalCompositeOperation = "lighter";
  const tg = ctx.createLinearGradient(-120, -190, 100, -40);
  tg.addColorStop(0, "rgba(255,200,120,0)");
  tg.addColorStop(1, "rgba(255,200,120,0.18)");
  ctx.fillStyle = tg;
  ctx.fill(sil.turban);
  ctx.restore();
  ctx.globalAlpha = 1;
  // drawn gold outline
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash([3600, 3600]);
  ctx.lineDashOffset = 3600 * (1 - o.draw);
  ctx.strokeStyle = goldGrad(ctx, -200, -200, 200, 470);
  ctx.lineWidth = 4 / s;
  ctx.shadowColor = "rgba(255,200,110,0.8)";
  ctx.shadowBlur = 12;
  ctx.stroke(sil.body);
  ctx.stroke(sil.turban);
  ctx.lineWidth = 2 / s;
  ctx.globalAlpha = 0.6;
  ctx.stroke(sil.collar);
  ctx.stroke(sil.tail);
  ctx.restore();
}

/** Sitting scholar reading at a book stand (rahl), side view facing right. */
function drawSittingScholar(ctx, x, y, s, flip, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  const fill = o.fill || "#06080e";
  ctx.fillStyle = fill;
  // body (robe) — a seated mound
  ctx.beginPath();
  ctx.moveTo(-170, 0);
  ctx.bezierCurveTo(-180, -90, -150, -190, -70, -235);
  ctx.bezierCurveTo(-40, -250, -10, -250, 10, -235);
  ctx.bezierCurveTo(40, -200, 70, -150, 120, -120); // arm toward book
  ctx.bezierCurveTo(140, -110, 150, -95, 135, -85);
  ctx.bezierCurveTo(90, -80, 60, -90, 40, -70);
  ctx.bezierCurveTo(90, -50, 150, -30, 160, 0);
  ctx.closePath();
  ctx.fill();
  // head + turban (leaning forward)
  const hx = 5;
  const hy = -285;
  ctx.beginPath();
  ctx.ellipse(hx + 8, hy + 10, 34, 42, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(hx - 4, hy - 26, 50, 36, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // beard
  ctx.beginPath();
  ctx.moveTo(hx + 30, hy + 20);
  ctx.bezierCurveTo(hx + 50, hy + 50, hx + 30, hy + 80, hx + 5, hy + 75);
  ctx.lineTo(hx - 5, hy + 30);
  ctx.fill();
  // rahl (X stand) + open book
  ctx.strokeStyle = o.rahl || fill;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(150, 0);
  ctx.lineTo(225, -110);
  ctx.moveTo(240, 0);
  ctx.lineTo(165, -110);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(150, -100);
  ctx.lineTo(195, -122);
  ctx.lineTo(245, -100);
  ctx.lineTo(240, -92);
  ctx.lineTo(195, -112);
  ctx.lineTo(155, -92);
  ctx.closePath();
  ctx.fillStyle = o.bookColor || "#e9d6a4";
  ctx.fill();
  // rim light
  if (o.rim) {
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,190,100,${o.rim})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, -235);
    ctx.bezierCurveTo(40, -200, 70, -150, 120, -120);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(hx - 4, hy - 26, 50, 36, 0.25, -1.2, 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

/** Front-facing modern young person behind a desk. pose: 0 phone, 1 head-in-hands, 2 upright typing. */
function drawPerson(ctx, x, y, s, pose, light) {
  // pose blend weights
  const P = [
    { head: [0, -330 + 22], hands: [[-40, -60], [40, -60]], elbows: [[-150, -20], [150, -20]] },
    { head: [0, -315], hands: [[-78, -310], [78, -310]], elbows: [[-150, 5], [150, 5]] },
    { head: [0, -345], hands: [[-110, 15], [110, 15]], elbows: [[-185, -70], [185, -70]] },
  ];
  const i0 = Math.floor(clamp(pose, 0, 1.999));
  const f = E.inOut(pose - i0);
  const a = P[i0];
  const b = P[Math.min(i0 + 1, 2)];
  const L = (u, v) => [lerp(u[0], v[0], f), lerp(u[1], v[1], f)];
  const head = L(a.head, b.head);
  const hands = [L(a.hands[0], b.hands[0]), L(a.hands[1], b.hands[1])];
  const elbows = [L(a.elbows[0], b.elbows[0]), L(a.elbows[1], b.elbows[1])];

  const c = S.personCanvas || (S.personCanvas = canvas(900, 900));
  const g = c.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, 900, 900);
  g.translate(450, 620);
  g.fillStyle = "#0b0f18";
  g.strokeStyle = "#0b0f18";
  // torso
  g.beginPath();
  g.moveTo(-210, 120);
  g.bezierCurveTo(-215, -40, -190, -200, -120, -235);
  g.bezierCurveTo(-60, -258, 60, -258, 120, -235);
  g.bezierCurveTo(190, -200, 215, -40, 210, 120);
  g.closePath();
  g.fill();
  // neck + head + hair
  g.fillRect(head[0] - 28, head[1] + 40, 56, 70);
  g.beginPath();
  g.ellipse(head[0], head[1], 64, 78, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(head[0], head[1] - 34, 72, 54, 0, Math.PI, Math.PI * 2);
  g.fill();
  // arms
  g.lineCap = "round";
  g.lineJoin = "round";
  g.lineWidth = 58;
  for (let k = 0; k < 2; k++) {
    const sh = [k ? 150 : -150, -200];
    g.beginPath();
    g.moveTo(sh[0], sh[1]);
    g.lineTo(elbows[k][0], elbows[k][1]);
    g.lineTo(hands[k][0], hands[k][1]);
    g.stroke();
  }
  // light from device / lamp
  g.globalCompositeOperation = "source-atop";
  const lx = light.x;
  const ly = light.y;
  const lg = g.createRadialGradient(lx, ly, 10, lx, ly, light.r);
  lg.addColorStop(0, `rgba(${light.color},${light.a})`);
  lg.addColorStop(1, `rgba(${light.color},0)`);
  g.fillStyle = lg;
  g.fillRect(-450, -620, 900, 900);
  // rim light from the window behind
  const rg = g.createLinearGradient(-260, 0, 260, 0);
  rg.addColorStop(0, `rgba(${light.rim},0.45)`);
  rg.addColorStop(0.22, `rgba(${light.rim},0)`);
  rg.addColorStop(0.78, `rgba(${light.rim},0)`);
  rg.addColorStop(1, `rgba(${light.rim},0.45)`);
  g.fillStyle = rg;
  g.fillRect(-450, -620, 900, 900);
  g.globalCompositeOperation = "source-over";
  ctx.drawImage(c, x - 450 * s, y - 620 * s, 900 * s, 900 * s);
  return { head, hands };
}

// ======================================================================
// SCENE 1 — ancestors: manuscript, candle, library fly-through (0–8)
// ======================================================================

function buildPortal() {
  // A stone portal wall with a pointed arch and bookshelves; world 1600 x 2600.
  const w = 800;
  const h = 1300; // half resolution of world units
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const sg = g.createLinearGradient(0, 0, 0, h);
  sg.addColorStop(0, "#3a2614");
  sg.addColorStop(0.5, "#4a311a");
  sg.addColorStop(1, "#2a1a0d");
  g.fillStyle = sg;
  g.fillRect(0, 0, w, h);
  const r = rng(7);
  // bookshelves on both sides of the arch
  const shelf = (x0, x1) => {
    for (let row = 0; row < 9; row++) {
      const yb = 300 + row * 105;
      g.fillStyle = "#0e0905";
      g.fillRect(x0 - 6, yb - 96, x1 - x0 + 12, 100);
      let x = x0;
      while (x < x1 - 8) {
        const bw = 7 + r() * 12;
        const bh = 60 + r() * 30;
        const hue = [
          [92, 40, 24],
          [60, 38, 22],
          [40, 52, 60],
          [104, 76, 34],
          [70, 26, 20],
        ][Math.floor(r() * 5)];
        const k = 0.55 + r() * 0.5;
        g.fillStyle = `rgb(${hue[0] * k},${hue[1] * k},${hue[2] * k})`;
        if (r() < 0.12) {
          // leaning book
          g.save();
          g.translate(x, yb);
          g.rotate(-0.25);
          g.fillRect(0, -bh, bw, bh);
          g.restore();
          x += bw + 10;
          continue;
        }
        g.fillRect(x, yb - bh, bw, bh);
        g.fillStyle = "rgba(230,180,90,0.35)";
        g.fillRect(x, yb - bh + 8, bw, 2);
        g.fillRect(x, yb - 12, bw, 2);
        x += bw + 1;
      }
      g.fillStyle = "#3a2614";
      g.fillRect(x0 - 6, yb, x1 - x0 + 12, 8);
    }
  };
  shelf(40, 200);
  shelf(600, 760);
  // pointed arch opening
  const arch = new Path2D();
  const ax0 = 230;
  const ax1 = 570;
  const top = 360;
  arch.moveTo(ax0, h);
  arch.lineTo(ax0, 640);
  arch.bezierCurveTo(ax0, 500, 330, 400, (ax0 + ax1) / 2, top);
  arch.bezierCurveTo(470, 400, ax1, 500, ax1, 640);
  arch.lineTo(ax1, h);
  arch.closePath();
  // rim ornament
  g.save();
  g.lineWidth = 26;
  g.strokeStyle = "#3b2812";
  g.stroke(arch);
  g.lineWidth = 3;
  g.strokeStyle = "rgba(240,190,100,0.75)";
  g.stroke(arch);
  g.restore();
  // muqarnas-like band above arch
  g.strokeStyle = "rgba(220,170,90,0.35)";
  g.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    g.beginPath();
    g.arc(160 + i * 44, 170, 20, Math.PI, 0);
    g.stroke();
  }
  g.fillStyle = "rgba(220,170,90,0.25)";
  g.fillRect(120, 200, 560, 4);
  g.fillRect(120, 135, 560, 3);
  g.globalCompositeOperation = "destination-out";
  g.fill(arch);
  // fog/silhouette version
  const f = canvas(w, h);
  const fg = f.getContext("2d");
  fg.drawImage(c, 0, 0);
  fg.globalCompositeOperation = "source-in";
  fg.fillStyle = "#1c120a";
  fg.fillRect(0, 0, w, h);
  return { img: c, fog: f };
}

function drawLibrary(ctx, t, camZ, alpha) {
  if (alpha <= 0.01) return;
  const P = S.portal || (S.portal = buildPortal());
  ctx.save();
  ctx.globalAlpha = alpha;
  // deep background with warm far light
  const bg = ctx.createRadialGradient(W / 2, 980, 20, W / 2, 980, 900);
  bg.addColorStop(0, "#6b4316");
  bg.addColorStop(0.2, "#2b1a0b");
  bg.addColorStop(1, "#050302");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const F = 380;
  const HZ = 1000; // horizon y
  for (let i = 9; i >= 0; i--) {
    const z = i * 520 - camZ;
    if (z < 60) continue;
    const s = F / z;
    const pw = 1600 * s;
    const ph = 2600 * s;
    const x = W / 2 - pw / 2;
    const y = HZ - 1500 * s;
    const near = clamp((z - 60) / 260);
    ctx.globalAlpha = alpha * near;
    ctx.drawImage(P.img, x, y, pw, ph);
    ctx.globalAlpha = alpha * near * clamp((z - 500) / 4500, 0, 0.8);
    ctx.drawImage(P.fog, x, y, pw, ph);
    // hanging lamp glow in the arch
    ctx.globalAlpha = alpha * near;
    const lx = W / 2;
    const ly = HZ - 900 * s;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const flick = 0.85 + 0.15 * noise1(t * 6 + i);
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 520 * s);
    lg.addColorStop(0, `rgba(255,190,100,${0.75 * flick})`);
    lg.addColorStop(1, "rgba(255,150,60,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(lx - 540 * s, ly - 540 * s, 1080 * s, 1080 * s);
    ctx.drawImage(S.dotWarm, lx - 30 * s, ly - 30 * s, 60 * s, 60 * s);
    ctx.restore();
    // scholars seated between portals
    if (i % 2 === 1 && i < 8) {
      const zz = z - 260;
      if (zz > 120) {
        const ss = F / zz;
        const side = i % 4 === 1 ? -1 : 1;
        drawSittingScholar(ctx, W / 2 + side * 330 * ss, HZ + 1100 * ss, ss * 1.05, side > 0, {
          rim: 0.5,
          bookColor: "#d9bf84",
        });
      }
    }
  }
  // floor
  ctx.globalAlpha = alpha;
  const fl = ctx.createLinearGradient(0, HZ + 80, 0, H);
  fl.addColorStop(0, "rgba(10,6,3,0)");
  fl.addColorStop(1, "rgba(10,6,3,0.85)");
  ctx.fillStyle = fl;
  ctx.fillRect(0, HZ + 80, W, H - HZ);
  ctx.restore();
}

function drawPage(ctx, x, y, w, h, side, content, t) {
  // parchment page
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  if (side < 0) {
    g.addColorStop(0, "#d8c18e");
    g.addColorStop(0.85, "#efdcae");
    g.addColorStop(1, "#b39561");
  } else {
    g.addColorStop(0, "#b39561");
    g.addColorStop(0.15, "#efdcae");
    g.addColorStop(1, "#d8c18e");
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  if (!content) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // ornamental border
  ctx.strokeStyle = "rgba(150,100,30,0.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 18, y + 18, w - 36, h - 36);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 26, y + 26, w - 52, h - 52);
  if (content === "rosette") {
    const cx = x + w / 2;
    const cy = y + h * 0.4;
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.05);
    for (let k = 0; k < 3; k++) {
      const r = 95 - k * 26;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = i % 2 ? r * 0.62 : r;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.strokeStyle = k === 0 ? "rgba(140,90,20,0.95)" : "rgba(170,110,30,0.8)";
      ctx.lineWidth = 2.5 - k * 0.5;
      ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    text(ctx, "دانش", cx, y + h * 0.78, { font: "Amiri", weight: 400, size: 54, fill: "rgba(70,40,15,0.9)" });
  } else {
    text(ctx, "العلم نور", x + w / 2, y + 95, { font: "Amiri", weight: 400, size: 50, fill: "rgba(120,60,15,0.95)" });
    const words = ["علم", "حكمة", "كتاب", "قلم", "نور", "معرفة", "عقل", "دانش", "فكر"];
    const r = rng(11);
    for (let ln = 0; ln < 9; ln++) {
      let s = "";
      for (let k = 0; k < 4; k++) s += words[Math.floor(r() * words.length)] + " ";
      text(ctx, s.trim(), x + w / 2, y + 150 + ln * 32, {
        font: "Amiri",
        weight: 400,
        size: 24,
        fill: "rgba(60,35,15,0.8)",
      });
    }
  }
  ctx.restore();
}

function drawBook(ctx, t, cx, cy, open, alpha, glow) {
  if (alpha <= 0.01) return;
  const pw = 300;
  const ph = 420;
  ctx.save();
  ctx.globalAlpha = alpha;
  // shadow
  ctx.save();
  ctx.translate(cx, cy + ph / 2 + 18);
  ctx.scale(1, 0.12);
  const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, 420);
  sh.addColorStop(0, "rgba(0,0,0,0.75)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(-420, -420, 840, 840);
  ctx.restore();
  // back cover (both sides)
  ctx.fillStyle = "#3a160e";
  ctx.fillRect(cx - pw - 10, cy - ph / 2 - 10, pw * 2 + 20, ph + 20);
  // right page under the cover
  drawPage(ctx, cx, cy - ph / 2, pw, ph, 1, open > 0.5 ? "text" : null, t);
  // left page appears as cover swings over
  if (open > 0.5) drawPage(ctx, cx - pw, cy - ph / 2, pw, ph, -1, "rosette", t);
  // rotating front cover / page
  const k = Math.cos(open * Math.PI); // 1 closed -> -1 open
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(k, 1);
  if (k > 0) {
    const g = ctx.createLinearGradient(0, -ph / 2, pw, ph / 2);
    g.addColorStop(0, "#5a2214");
    g.addColorStop(1, "#2a0d07");
    ctx.fillStyle = g;
    ctx.fillRect(0, -ph / 2 - 10, pw + 10, ph + 20);
    ctx.strokeStyle = goldGrad(ctx, 0, -ph / 2, pw, ph / 2);
    ctx.lineWidth = 3;
    ctx.strokeRect(22, -ph / 2 + 14, pw - 34, ph - 28);
    // central medallion
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = i % 2 ? 46 : 74;
      ctx.lineTo(pw / 2 + Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pw / 2, 0, 30, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // inside of the page being turned (shaded)
    ctx.fillStyle = `rgb(${200 + 30 * -k},${180 + 30 * -k},${130 + 20 * -k})`;
    ctx.fillRect(0, -ph / 2, pw, ph);
  }
  ctx.restore();
  // spine shading
  const sp = ctx.createLinearGradient(cx - 40, 0, cx + 40, 0);
  sp.addColorStop(0, "rgba(60,30,10,0)");
  sp.addColorStop(0.5, "rgba(60,30,10,0.45)");
  sp.addColorStop(1, "rgba(60,30,10,0)");
  ctx.fillStyle = sp;
  ctx.fillRect(cx - 40, cy - ph / 2, 80, ph);
  // golden light emerging from the pages
  if (glow > 0) {
    ctx.globalCompositeOperation = "lighter";
    const gl = ctx.createRadialGradient(cx, cy - 40, 10, cx, cy - 40, 520);
    gl.addColorStop(0, `rgba(255,220,150,${0.32 * glow})`);
    gl.addColorStop(0.4, `rgba(255,170,70,${0.14 * glow})`);
    gl.addColorStop(1, "rgba(255,150,50,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(cx - 560, cy - 600, 1120, 1120);
  }
  ctx.restore();
}

function drawCandle(ctx, t, x, y, s, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  // holder
  ctx.fillStyle = goldGrad(ctx, -60, 0, 60, 30);
  ctx.beginPath();
  ctx.ellipse(0, 0, 70, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // wax
  const wg = ctx.createLinearGradient(-26, 0, 26, 0);
  wg.addColorStop(0, "#b8a27a");
  wg.addColorStop(0.5, "#f4e6c4");
  wg.addColorStop(1, "#a08860");
  ctx.fillStyle = wg;
  ctx.fillRect(-26, -170, 52, 170);
  // flame
  const fl = noise1(t * 9, 1) * 0.12;
  const fh = 70 * (1 + fl);
  ctx.save();
  ctx.translate(0, -178);
  ctx.rotate(noise1(t * 5, 3) * 0.06);
  ctx.globalCompositeOperation = "lighter";
  const gg = ctx.createRadialGradient(0, -fh * 0.4, 2, 0, -fh * 0.4, fh);
  gg.addColorStop(0, "rgba(255,250,220,1)");
  gg.addColorStop(0.35, "rgba(255,200,90,0.9)");
  gg.addColorStop(1, "rgba(255,120,30,0)");
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.moveTo(0, -fh * 1.25);
  ctx.bezierCurveTo(18, -fh * 0.6, 16, 0, 0, 4);
  ctx.bezierCurveTo(-16, 0, -18, -fh * 0.6, 0, -fh * 1.25);
  ctx.fill();
  const halo = ctx.createRadialGradient(0, -30, 0, 0, -30, 420);
  halo.addColorStop(0, `rgba(255,170,70,${0.42 + fl})`);
  halo.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(-430, -450, 860, 860);
  ctx.restore();
  ctx.restore();
}

function scene1(ctx, t) {
  ctx.fillStyle = C.black;
  ctx.fillRect(0, 0, W, H);
  const fly = E.inOut(inv(4.4, 8.6, t));
  const camZ = lerp(-200, 980, fly) + t * 20;
  // library visible faintly behind the book, then fully during the fly-through
  drawLibrary(ctx, t, camZ, lerp(0.3, 1, inv(4.0, 5.6, t)) * inv(0.8, 2.6, t));
  // warm darkness around the book
  const dark = 1 - inv(4.4, 5.6, t);
  if (dark > 0) {
    const rg = ctx.createRadialGradient(W / 2, 1050, 200, W / 2, 1050, 1100);
    rg.addColorStop(0, `rgba(0,0,0,${0.15 * dark})`);
    rg.addColorStop(1, `rgba(0,0,0,${0.85 * dark})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }
  // desk
  const deskA = (1 - inv(4.6, 5.8, t)) * inv(1.0, 2.0, t);
  if (deskA > 0) {
    ctx.save();
    ctx.globalAlpha = deskA;
    const dg = ctx.createLinearGradient(0, 1240, 0, H);
    dg.addColorStop(0, "#2a170b");
    dg.addColorStop(1, "#090503");
    ctx.fillStyle = dg;
    ctx.fillRect(0, 1240 + fly * 500, W, H);
    ctx.restore();
  }
  // book: opens, then the camera moves past it
  const open = E.inOut(inv(1.5, 4.2, t));
  const bs = 1 + E.in(inv(4.6, 6.0, t)) * 0.9;
  const ba = inv(1.0, 2.0, t) * (1 - inv(4.9, 5.7, t));
  ctx.save();
  ctx.translate(W / 2, 1020 + E.in(inv(4.6, 6.0, t)) * 700);
  ctx.scale(bs, bs);
  ctx.translate(-W / 2, -1020);
  drawBook(ctx, t, W / 2, 1020, open, ba, inv(2.6, 4.4, t));
  drawCandle(ctx, t, 150, 1240, 0.9, ba);
  drawCandle(ctx, t, 940, 1250, 0.75, ba * inv(1.6, 2.6, t));
  ctx.restore();
  drawBeam(ctx, t, inv(0.6, 3.0, t) * 0.75, W / 2);
  drawParticles(ctx, t, inv(0.0, 1.6, t), S.dotGold, 0.7);
  // caption
  text(ctx, "AJDODLARIMIZ MEROSI", W / 2, 330, {
    font: "Inter",
    size: 26,
    weight: 600,
    tracking: 10,
    fill: C.goldL,
    alpha: win(t, 2.0, 3.0, 6.6, 7.6),
  });
  const a = win(t, 2.4, 3.4, 6.6, 7.6);
  text(ctx, "Ilm — nur", W / 2, 440, { font: "Cormorant Garamond", size: 104, weight: 700, fill: "gold", alpha: a, shadow: "rgba(0,0,0,0.6)" });
}

// ======================================================================
// SCENE 2 — great scholars (8–18)
// ======================================================================

function buildSkyline() {
  const c = canvas(1400, 700);
  const g = c.getContext("2d");
  g.fillStyle = "#070b16";
  const base = 700;
  g.beginPath();
  g.moveTo(0, base);
  g.lineTo(0, 520);
  // left madrasa block with small domes
  g.lineTo(150, 520);
  g.lineTo(150, 470);
  g.arc(200, 470, 50, Math.PI, 0);
  g.lineTo(250, 520);
  g.lineTo(330, 520);
  // minaret (tall tapered)
  g.lineTo(345, 160);
  g.lineTo(338, 150);
  g.lineTo(352, 120);
  g.arc(370, 118, 22, Math.PI, 0);
  g.lineTo(402, 150);
  g.lineTo(395, 160);
  g.lineTo(410, 520);
  // big portal (pishtaq)
  g.lineTo(480, 520);
  g.lineTo(480, 300);
  g.lineTo(760, 300);
  g.lineTo(760, 520);
  // great dome with drum
  g.lineTo(800, 520);
  g.lineTo(800, 380);
  g.lineTo(830, 380);
  g.bezierCurveTo(830, 240, 900, 180, 960, 150);
  g.lineTo(965, 110);
  g.lineTo(970, 150);
  g.bezierCurveTo(1030, 180, 1100, 240, 1100, 380);
  g.lineTo(1130, 380);
  g.lineTo(1130, 520);
  // second small minaret
  g.lineTo(1200, 520);
  g.lineTo(1210, 300);
  g.arc(1225, 296, 16, Math.PI, 0);
  g.lineTo(1250, 520);
  g.lineTo(1400, 520);
  g.lineTo(1400, base);
  g.closePath();
  g.fill();
  // portal arch opening (lighter)
  g.fillStyle = "#0e1424";
  g.beginPath();
  g.moveTo(540, 520);
  g.lineTo(540, 420);
  g.bezierCurveTo(540, 370, 600, 340, 620, 330);
  g.bezierCurveTo(640, 340, 700, 370, 700, 420);
  g.lineTo(700, 520);
  g.fill();
  // gold rim highlights on silhouette edge
  g.globalCompositeOperation = "source-atop";
  const rim = g.createLinearGradient(0, 100, 0, 520);
  rim.addColorStop(0, "rgba(255,190,110,0.25)");
  rim.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = rim;
  g.fillRect(0, 0, 1400, 700);
  // tile band on portal
  g.globalCompositeOperation = "source-over";
  g.strokeStyle = "rgba(220,170,90,0.35)";
  g.lineWidth = 2;
  g.strokeRect(495, 315, 250, 200);
  // small windows lit
  g.fillStyle = "rgba(255,190,100,0.55)";
  for (const [x, y] of [[180, 540], [220, 540], [880, 450], [1040, 450], [960, 450]]) g.fillRect(x, y, 10, 22);
  return c;
}

const SCHOLARS = [
  { name: "Imom al-Buxoriy", years: "810 – 870", field: "HADIS ILMI", sky: ["#0a1430", "#3a2a40", "#c9763a"], flip: false, turban: 1.1, beard: 1.1 },
  { name: "Ibn Sino", years: "980 – 1037", field: "TIB VA FALSAFA", sky: ["#06182a", "#1d3a48", "#b8813e"], flip: true, turban: 1.0, beard: 0.8 },
  { name: "al-Xorazmiy", years: "780 – 850", field: "ALGEBRA VA MATEMATIKA", sky: ["#070b24", "#1c1d4a", "#8a5a3a"], flip: false, turban: 0.9, beard: 0.95 },
];

function scholarPanel(ctx, t, idx, t0, dur) {
  const sc = SCHOLARS[idx];
  const lt = t - t0; // local time
  const k = lt / dur;
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, 1300);
  sky.addColorStop(0, sc.sky[0]);
  sky.addColorStop(0.62, sc.sky[1]);
  sky.addColorStop(1, sc.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // stars
  const r = rng(30 + idx);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 70; i++) {
    const x = r() * W;
    const y = r() * 700;
    ctx.globalAlpha = 0.25 + 0.35 * Math.sin(t * 2 + i);
    ctx.drawImage(S.dotWhite, x - 4, y - 4, 8, 8);
  }
  ctx.restore();
  // skyline with parallax + reflection
  const SK = S.skyline || (S.skyline = buildSkyline());
  const px = -160 - k * 90 + (idx === 1 ? -120 : idx === 2 ? -60 : 0);
  ctx.drawImage(SK, px, 1300 - 620, 1400, 700);
  ctx.save();
  ctx.translate(0, 2 * 1380);
  ctx.scale(1, -1);
  ctx.globalAlpha = 0.25;
  ctx.drawImage(SK, px, 1300 - 620, 1400, 700);
  ctx.restore();
  // water
  const wg = ctx.createLinearGradient(0, 1380, 0, H);
  wg.addColorStop(0, "rgba(10,14,28,0.55)");
  wg.addColorStop(1, "rgba(3,4,8,0.98)");
  ctx.fillStyle = wg;
  ctx.fillRect(0, 1380, W, H - 1380);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 14; i++) {
    const y = 1395 + i * 18;
    const a = 0.12 * (1 - i / 14) * (0.6 + 0.4 * Math.sin(t * 2 + i));
    ctx.fillStyle = `rgba(255,190,110,${a})`;
    ctx.fillRect(W / 2 - 220 + 40 * Math.sin(t + i), y, 440 - i * 20, 2);
  }
  ctx.restore();
  // dark scrim for depth
  const sc2 = ctx.createLinearGradient(0, 0, 0, H);
  sc2.addColorStop(0, "rgba(2,3,8,0.55)");
  sc2.addColorStop(0.45, "rgba(2,3,8,0.15)");
  sc2.addColorStop(1, "rgba(2,3,8,0.4)");
  ctx.fillStyle = sc2;
  ctx.fillRect(0, 0, W, H);

  // medallion + portrait
  const mx = W / 2;
  const my = 770;
  const ms = 0.92 + 0.06 * E.out(k);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(t * 0.06 * (idx % 2 ? -1 : 1));
  ctx.globalAlpha = E.out(inv(0, 0.8, lt));
  ctx.drawImage(S.guilloche, -380 * ms, -380 * ms, 760 * ms, 760 * ms);
  ctx.restore();
  // inner dark disc
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, 278 * ms, 0, Math.PI * 2);
  const dg = ctx.createRadialGradient(mx, my - 60, 20, mx, my, 280);
  dg.addColorStop(0, "rgba(40,30,20,0.85)");
  dg.addColorStop(1, "rgba(6,6,10,0.95)");
  ctx.fillStyle = dg;
  ctx.fill();
  ctx.clip();
  // metaphor layer behind the portrait
  metaphors(ctx, t, idx, lt, mx, my);
  const sil = S["sil" + idx] || (S["sil" + idx] = scholarProfile({ turban: sc.turban, beard: sc.beard }));
  drawProfile(ctx, sil, mx + (sc.flip ? 20 : -20), my + 20, 0.88, sc.flip, { draw: E.out(inv(0.1, 1.9, lt)), fill: inv(0.6, 1.6, lt) });
  ctx.restore();
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = goldGrad(ctx, mx - 280, my - 280, mx + 280, my + 280);
  ctx.beginPath();
  ctx.arc(mx, my, 278 * ms, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // metaphors in front / outside the medallion
  metaphorsFront(ctx, t, idx, lt, mx, my);

  // typography
  const ta = E.out(inv(0.35, 1.1, lt));
  const ty = (1 - ta) * 30;
  text(ctx, ["I", "II", "III"][idx], W / 2, (idx === 2 ? 290 : 330) + ty, { font: "Cinzel", size: 40, weight: 700, fill: C.goldL, alpha: ta * 0.9 });
  text(ctx, sc.name, W / 2, 1180 + ty, { font: "Cormorant Garamond", size: 104, weight: 700, fill: "gold", alpha: ta, shadow: "rgba(0,0,0,0.7)", shine: inv(0.8, 2.2, lt) });
  text(ctx, sc.years, W / 2, 1245 + ty, { font: "Inter", size: 34, weight: 500, fill: "rgba(248,244,234,0.9)", alpha: E.out(inv(0.6, 1.3, lt)) });
  text(ctx, sc.field, W / 2, 1300 + ty, { font: "Inter", size: 24, weight: 600, tracking: 8, fill: C.goldL, alpha: E.out(inv(0.8, 1.5, lt)) });
}

function metaphors(ctx, t, idx, lt, mx, my) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  if (idx === 0) {
    // drifting Arabic letters (manuscript research)
    const letters = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";
    const r = rng(5);
    for (let i = 0; i < 26; i++) {
      const x = mx - 260 + r() * 520;
      const y = my + 260 - ((lt * (30 + r() * 40) + r() * 600) % 560);
      text(ctx, letters[i % letters.length], x, y, { font: "Amiri", weight: 400, size: 26 + r() * 30, fill: "rgba(240,190,110,0.5)", alpha: 0.8 });
    }
  } else if (idx === 1) {
    // pulse line (medicine) + circular diagram (observation)
    ctx.strokeStyle = "rgba(240,190,110,0.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -280; x <= 280; x += 4) {
      const u = (x + 280) / 560;
      if (u > E.out(inv(0.3, 2.0, lt))) break;
      const ph = (x / 60 - lt * 2) % 4;
      const beat = Math.abs(ph % 4) < 0.35 ? Math.sin((ph % 4) * 18) * 60 : 0;
      ctx.lineTo(mx + x, my + 150 - beat);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(240,190,110,0.25)";
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(mx, my - 20, 90 + i * 45, t * 0.3 + i, t * 0.3 + i + Math.PI * 1.4);
      ctx.stroke();
    }
  } else {
    // completing the square: x² + 10x = 39 (al-Xorazmiy's classic example)
    const p = E.out(inv(0.3, 2.2, lt));
    const s = 120;
    const ox = mx - 150;
    const oy = my - 210;
    ctx.strokeStyle = "rgba(240,190,110,0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([900, 900]);
    ctx.lineDashOffset = 900 * (1 - p);
    ctx.strokeRect(ox, oy, s, s);
    ctx.strokeRect(ox + s, oy, 60, s);
    ctx.strokeRect(ox, oy + s, s, 60);
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = 0;
    ctx.globalAlpha = inv(1.6, 2.4, lt);
    ctx.strokeRect(ox + s, oy + s, 60, 60);
    ctx.setLineDash([]);
    ctx.globalAlpha = p;
    text(ctx, "x²", ox + s / 2, oy + s / 2 + 12, { font: "Cormorant Garamond", size: 40, weight: 700, fill: "rgba(250,220,150,0.8)" });
    text(ctx, "5x", ox + s + 30, oy + s / 2 + 10, { font: "Cormorant Garamond", size: 28, weight: 700, fill: "rgba(250,220,150,0.8)" });
    text(ctx, "5x", ox + s / 2, oy + s + 40, { font: "Cormorant Garamond", size: 28, weight: 700, fill: "rgba(250,220,150,0.8)" });
  }
  ctx.restore();
}

function metaphorsFront(ctx, t, idx, lt, mx, my) {
  ctx.save();
  if (idx === 0) {
    // stack of manuscripts, bottom-left, and a quill writing
    const a = E.out(inv(0.4, 1.2, lt));
    ctx.globalAlpha = a;
    const bx = 150;
    const by = 1040;
    const cols = ["#4a1c10", "#2e3a40", "#5a3a14", "#3a1810"];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = cols[i];
      roundRect(ctx, bx - 90 + i * 6, by - i * 34, 180 - i * 12, 30, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(240,200,120,0.6)";
      ctx.fillRect(bx - 90 + i * 6, by - i * 34 + 13, 180 - i * 12, 2);
    }
    // scroll on the right
    ctx.translate(930, 1000 - 12 * Math.sin(t));
    ctx.rotate(-0.25);
    ctx.fillStyle = "#e6d1a0";
    ctx.fillRect(-70, -90, 140, 180);
    ctx.fillStyle = "#b39561";
    roundRect(ctx, -82, -102, 164, 22, 11);
    ctx.fill();
    roundRect(ctx, -82, 82, 164, 22, 11);
    ctx.fill();
    for (let i = 0; i < 6; i++) {
      const w = 100 * clamp((lt - 0.8 - i * 0.25) / 0.4);
      ctx.fillStyle = "rgba(80,45,15,0.75)";
      ctx.fillRect(-50, -60 + i * 22, w, 3);
    }
  } else if (idx === 1) {
    // herb branch (left) and alembic flask (right)
    const a = E.out(inv(0.4, 1.2, lt));
    ctx.globalAlpha = a;
    ctx.strokeStyle = goldGrad(ctx, 60, 900, 260, 1100);
    ctx.lineWidth = 3;
    ctx.translate(170, 1080);
    ctx.rotate(-0.5 + 0.04 * Math.sin(t * 1.3));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(20, -120, 0, -240);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const y = -40 - i * 36;
      const sgn = i % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.ellipse(sgn * 30, y, 30, 12, sgn * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(910, 1020 - 10 * Math.sin(t * 1.1));
    ctx.strokeStyle = goldGrad(ctx, -60, -120, 60, 60);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 60, -Math.PI * 0.35, Math.PI * 1.35);
    ctx.lineTo(-18, -110);
    ctx.lineTo(18, -110);
    ctx.closePath();
    ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    const lg = ctx.createRadialGradient(0, 10, 0, 0, 10, 60);
    lg.addColorStop(0, "rgba(120,220,200,0.35)");
    lg.addColorStop(1, "rgba(120,220,200,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI);
    ctx.fill();
  } else {
    // numbers transforming into an equation
    const eq = "x² + 10x = 39";
    const p = inv(0.5, 1.7, lt);
    const shown = eq.slice(0, Math.floor(p * eq.length));
    const sol = inv(2.0, 2.5, lt);
    text(ctx, shown, W / 2 - 110 * sol, 385, { font: "Cormorant Garamond", size: 62, weight: 700, fill: "gold", shadow: "rgba(0,0,0,0.8)" });
    text(ctx, "→  x = 3", W / 2 + 230, 385, { font: "Cormorant Garamond", size: 52, weight: 600, fill: C.goldL, alpha: sol });
    const r = rng(77);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 18; i++) {
      const a0 = r() * Math.PI * 2 + lt * (0.2 + r() * 0.3);
      const rr = 340 + r() * 110;
      text(ctx, String(i % 10), mx + Math.cos(a0) * rr, my + Math.sin(a0) * rr * 0.9, {
        font: "Cormorant Garamond",
        size: 30 + r() * 26,
        weight: 600,
        fill: "rgba(240,200,120,0.55)",
        alpha: 1 - inv(1.8, 2.6, lt) * 0.6,
      });
    }
  }
  ctx.restore();
}

function scene2(ctx, t) {
  const cuts = [8.0, 11.33, 14.66, 18.0];
  for (let i = 0; i < 3; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    if (t < a - 0.01 || t > b + 0.5) continue;
    const alpha = i === 0 ? 1 : E.inOut(inv(a, a + 0.5, t));
    const draw = (g) => {
      // slow push-in per panel
      const z = 1 + 0.05 * inv(a, b + 0.5, t);
      g.translate(W / 2, 900);
      g.scale(z, z);
      g.translate(-W / 2, -900);
      scholarPanel(g, t, i, a, b - a);
    };
    if (alpha >= 1) {
      ctx.save();
      draw(ctx);
      ctx.restore();
    } else {
      const L = S.panelLayer || (S.panelLayer = canvas(W, H));
      const g = L.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.clearRect(0, 0, W, H);
      g.save();
      draw(g);
      g.restore();
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(L, 0, 0);
      ctx.restore();
    }
  }
  drawParticles(ctx, t, 0.75, S.dotGold, 0.6);
}

// ======================================================================
// SCENE 3 — what made them different (18–27)
// ======================================================================

const VIRTUES = [
  { w: "QIZIQUVCHANLIK", at: 19.7 },
  { w: "SABR", at: 20.45 },
  { w: "INTIZOM", at: 21.05 },
  { w: "MUHABBAT", at: 23.0 },
];

function scene3(ctx, t) {
  const lt = t - 18;
  const bg = ctx.createRadialGradient(W / 2, 1000, 50, W / 2, 1000, 1300);
  bg.addColorStop(0, "#3a230d");
  bg.addColorStop(0.5, "#120b05");
  bg.addColorStop(1, "#030203");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const push = 1 + 0.08 * E.sine(inv(18, 25, t)) + 2.4 * E.in(inv(25.2, 27.0, t));
  ctx.save();
  ctx.translate(W / 2, 1060);
  ctx.scale(push, push);
  ctx.translate(-W / 2, -1060);
  // faint library behind
  drawLibrary(ctx, t, 1500 + lt * 40, 0.35);
  // orbiting science symbols
  const syms = ["x² + 10x = 39", "√2", "π", "∑", "△", "⊙", "a² + b² = c²", "1 : 1.618", "∞", "◇"];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < syms.length; i++) {
    const a = (i / syms.length) * Math.PI * 2 + lt * 0.35;
    const rx = 400;
    const ry = 170;
    const x = W / 2 + Math.cos(a) * rx;
    const y = 900 + Math.sin(a) * ry - 80;
    const depth = (Math.sin(a) + 1) / 2;
    text(ctx, syms[i], x, y, {
      font: "Cormorant Garamond",
      size: 34 + 20 * depth,
      weight: 600,
      fill: "rgba(250,210,130,0.9)",
      alpha: (0.3 + 0.6 * depth) * inv(18.3, 19.4, t),
    });
  }
  // astrolabe rings
  ctx.strokeStyle = "rgba(240,190,110,0.28)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(W / 2, 830, 300 + i * 70, 110 + i * 30, 0.1 * i, lt * 0.2 * (i + 1), lt * 0.2 * (i + 1) + Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.restore();
  // scholar reading at the glowing book
  const glow = 0.5 + 0.5 * inv(19, 24, t) + 1.5 * inv(24.8, 26.4, t);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const bx = W / 2 + 120;
  const by = 1105;
  const gl = ctx.createRadialGradient(bx, by, 10, bx, by, 650 * (0.7 + glow * 0.3));
  gl.addColorStop(0, `rgba(255,225,160,${clamp(0.5 * glow, 0, 1)})`);
  gl.addColorStop(0.35, `rgba(255,170,70,${clamp(0.22 * glow, 0, 1)})`);
  gl.addColorStop(1, "rgba(255,140,40,0)");
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  drawSittingScholar(ctx, W / 2 - 280, 1300, 1.6, false, { rim: 0.9, bookColor: "#fff1cc", rahl: "#2a1a0c" });
  // turning pages
  for (let k = 0; k < 4; k++) {
    const ts = 18.6 + k * 1.4;
    const p = inv(ts, ts + 0.7, t);
    if (p <= 0 || p >= 1) continue;
    const sx = Math.cos(p * Math.PI);
    ctx.save();
    ctx.translate(W / 2 - 280 + 195 * 1.6, 1300 - 115 * 1.6);
    ctx.scale(sx, 1 - 0.15 * Math.sin(p * Math.PI));
    ctx.fillStyle = `rgba(255,${235 - 30 * Math.abs(sx)},190,0.95)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(80, 30);
    ctx.lineTo(80, 50);
    ctx.lineTo(0, 18);
    ctx.fill();
    ctx.restore();
  }
  // desk/floor
  const fl = ctx.createLinearGradient(0, 1300, 0, H);
  fl.addColorStop(0, "#140c06");
  fl.addColorStop(1, "#040302");
  ctx.fillStyle = fl;
  ctx.fillRect(0, 1298, W, H);
  ctx.restore();

  // virtues
  const ya = 300;
  text(ctx, "ULARNING KUCHI", W / 2, ya - 70, { font: "Inter", size: 26, weight: 600, tracking: 10, fill: C.goldL, alpha: win(t, 18.5, 19.2, 25.0, 25.6) });
  VIRTUES.forEach((v, i) => {
    const p = E.out(inv(v.at, v.at + 0.6, t));
    const out = 1 - inv(25.0, 25.6, t);
    const y = ya + i * 92;
    const sz = i === 3 ? 76 : 64;
    text(ctx, v.w, W / 2, y + (1 - p) * 20, {
      font: "Cinzel",
      size: sz,
      weight: 700,
      tracking: lerp(30, 6, p),
      fill: "gold",
      alpha: p * out,
      shadow: "rgba(0,0,0,0.75)",
      shine: inv(v.at + 0.3, v.at + 1.4, t),
    });
  });
  drawBeam(ctx, t, 0.7, W / 2 + 60);
  drawParticles(ctx, t, 0.9, S.dotGold, 0.8);
  // transition: gold light floods, then turns into digital pixels
  const flood = inv(25.4, 26.5, t);
  if (flood > 0) {
    ctx.save();
    ctx.globalAlpha = E.in(flood) * (1 - inv(26.45, 26.8, t));
    ctx.fillStyle = "#fff3d6";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const dig = inv(26.45, 27.2, t);
  if (dig > 0 && dig < 1) {
    ctx.save();
    // light collapses into a cold digital grid: scanlines + sparse pixel blocks
    ctx.fillStyle = `rgba(8,16,34,${E.out(clamp(dig * 1.6))})`;
    ctx.fillRect(0, 0, W, H);
    const cell = 54;
    const r = rng(3);
    for (let y = 0; y < H; y += cell) {
      for (let x = 0; x < W; x += cell) {
        const th = r();
        const c = r();
        if (Math.abs(dig - th) > 0.12) continue;
        ctx.fillStyle = c > 0.5 ? "rgba(140,190,255,0.35)" : "rgba(255,220,160,0.3)";
        ctx.fillRect(x + 3, y + 3, cell - 6, cell - 6);
      }
    }
    ctx.globalAlpha = 0.25 * (1 - Math.abs(dig - 0.5) * 2);
    ctx.fillStyle = "#9cc4ff";
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);
    ctx.restore();
  }
}

// ======================================================================
// SCENES 4 & 5 — the modern room (27–49)
// ======================================================================

function drawRoom(ctx, t, warm) {
  // warm: 0 cold night -> 1 warm hopeful
  const top = mixColor([5, 9, 18], [26, 20, 14], warm);
  const bot = mixColor([10, 18, 34], [44, 30, 16], warm);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgb(${top})`);
  g.addColorStop(1, `rgb(${bot})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // window with city bokeh / dawn
  const wx = 600;
  const wy = 260;
  const ww = 380;
  const wh = 560;
  const sg = ctx.createLinearGradient(0, wy, 0, wy + wh);
  sg.addColorStop(0, `rgb(${mixColor([8, 16, 36], [40, 52, 90], warm)})`);
  sg.addColorStop(1, `rgb(${mixColor([16, 30, 60], [230, 150, 80], warm)})`);
  ctx.fillStyle = sg;
  ctx.fillRect(wx, wy, ww, wh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(wx, wy, ww, wh);
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const r = rng(9);
  for (let i = 0; i < 40; i++) {
    const x = wx + r() * ww;
    const y = wy + wh * 0.45 + r() * wh * 0.55;
    const s = 14 + r() * 40;
    ctx.globalAlpha = (0.25 + 0.3 * r()) * (1 - warm * 0.6) * (0.8 + 0.2 * Math.sin(t * 1.5 + i));
    ctx.drawImage(r() > 0.6 ? S.dotWarm : S.dotCold, x - s / 2, y - s / 2, s, s);
  }
  ctx.restore();
  ctx.strokeStyle = "#05070c";
  ctx.lineWidth = 14;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();
  // shelf with a few books (left wall)
  ctx.fillStyle = "#070a12";
  ctx.fillRect(70, 760, 360, 12);
  const bc = ["#1b2333", "#26202a", "#1d2a2a", "#2a2318", "#1a1e30"];
  for (let i = 0; i < 9; i++) ctx.fillRect(90 + i * 30, 760 - (70 + (i % 3) * 14), 24, 70 + (i % 3) * 14);
  ctx.fillStyle = bc[0];
}

function mixColor(a, b, k) {
  return [0, 1, 2].map((i) => Math.round(lerp(a[i], b[i], k))).join(",");
}

function drawClock(ctx, t, x, y, r, speed, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = "#0b111d";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(170,200,240,0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
    ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
    ctx.stroke();
  }
  const m = speed;
  const hand = (a, len, w) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(a) * len, -Math.cos(a) * len);
    ctx.stroke();
  };
  ctx.strokeStyle = "rgba(220,235,255,0.9)";
  ctx.lineCap = "round";
  hand(m, r * 0.7, 4);
  hand(m / 12, r * 0.45, 7);
  // motion trails of the minute hand
  ctx.globalAlpha = alpha * 0.25;
  for (let k = 1; k < 5; k++) hand(m - k * 0.08, r * 0.7, 3);
  ctx.restore();
}

function drawDesk(ctx, warm, items) {
  const g = ctx.createLinearGradient(0, 1240, 0, H);
  g.addColorStop(0, `rgb(${mixColor([18, 24, 38], [60, 40, 22], warm)})`);
  g.addColorStop(0.04, `rgb(${mixColor([10, 14, 24], [34, 22, 12], warm)})`);
  g.addColorStop(1, `rgb(${mixColor([3, 5, 9], [10, 7, 4], warm)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 1240, W, H - 1240);
  // stacked unfinished books (left)
  if (items.books) {
    const cols = ["#22304a", "#3a2a22", "#253a36"];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[i];
      ctx.fillRect(90 + i * 8, 1225 - i * 36, 230 - i * 16, 34);
      ctx.fillStyle = "rgba(200,210,230,0.18)";
      ctx.fillRect(90 + i * 8, 1225 - i * 36 + 4, 230 - i * 16, 3);
    }
    // bookmark sticking out (unfinished)
    ctx.fillStyle = "#7a2a2a";
    ctx.fillRect(200, 1150, 10, 48);
  }
}

function drawNotebook(ctx, t, x, y, lines, warm, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.35, 0.45, 0, 0);
  ctx.fillStyle = `rgb(${mixColor([150, 160, 180], [240, 225, 190], warm)})`;
  ctx.fillRect(-170, -120, 340, 240);
  ctx.strokeStyle = "rgba(60,80,120,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(-150, -90 + i * 26);
    ctx.lineTo(150, -90 + i * 26);
    ctx.stroke();
  }
  // handwriting
  ctx.strokeStyle = warm > 0.5 ? "rgba(120,80,20,0.9)" : "rgba(30,40,70,0.9)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const p = clamp(lines - i);
    if (p <= 0) break;
    ctx.beginPath();
    for (let xx = 0; xx <= 280 * p; xx += 4) {
      const yy = -95 + i * 26 + 4 * Math.sin(xx * 0.25 + i) * Math.sin(xx * 0.05);
      xx ? ctx.lineTo(-145 + xx, yy) : ctx.moveTo(-145 + xx, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function notifCard(ctx, x, y, w, icon, title, sub, a, rot = 0) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(0.9 + 0.1 * E.back(clamp(a)), 0.9 + 0.1 * E.back(clamp(a)));
  ctx.globalAlpha = clamp(a);
  ctx.shadowColor = "rgba(40,120,255,0.35)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#121a2b";
  roundRect(ctx, -w / 2, -48, w, 96, 26);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(140,180,255,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // icon
  const ix = -w / 2 + 50;
  ctx.fillStyle = icon.color;
  roundRect(ctx, ix - 28, -28, 56, 56, 14);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  if (icon.kind === "heart") {
    ctx.beginPath();
    ctx.moveTo(ix, 12);
    ctx.bezierCurveTo(ix - 26, -6, ix - 14, -24, ix, -10);
    ctx.bezierCurveTo(ix + 14, -24, ix + 26, -6, ix, 12);
    ctx.fill();
  } else if (icon.kind === "chat") {
    roundRect(ctx, ix - 16, -14, 32, 22, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ix - 8, 8);
    ctx.lineTo(ix - 12, 16);
    ctx.lineTo(ix, 8);
    ctx.fill();
  } else if (icon.kind === "play") {
    ctx.beginPath();
    ctx.moveTo(ix - 9, -13);
    ctx.lineTo(ix + 13, 0);
    ctx.lineTo(ix - 9, 13);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(ix, -2, 11, Math.PI, 0);
    ctx.lineTo(ix + 13, 10);
    ctx.lineTo(ix - 13, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix, 13, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, title, -w / 2 + 96, -6, { align: "left", size: 28, weight: 700, fill: "#eef3ff" });
  text(ctx, sub, -w / 2 + 96, 28, { align: "left", size: 24, weight: 500, fill: "rgba(200,215,240,0.75)" });
  ctx.restore();
}

const NOTIFS = [
  { icon: { kind: "chat", color: "#2f7cf6" }, t: "Yangi xabar", s: "Hozirgina · 3 ta suhbat" },
  { icon: { kind: "heart", color: "#e2456b" }, t: "+99 yoqtirish", s: "Postingizga reaksiya" },
  { icon: { kind: "play", color: "#e23b3b" }, t: "Yangi video", s: "Sizga tavsiya qilindi" },
  { icon: { kind: "bell", color: "#8a5cf6" }, t: "12 ta bildirishnoma", s: "Oʻqilmagan" },
  { icon: { kind: "chat", color: "#22a36b" }, t: "Guruhda 48 xabar", s: "Hozirgina" },
  { icon: { kind: "heart", color: "#e2456b" }, t: "Sizni belgilashdi", s: "Rasmda" },
  { icon: { kind: "play", color: "#e23b3b" }, t: "Jonli efir boshlandi", s: "Hozir" },
  { icon: { kind: "bell", color: "#f08a24" }, t: "Yana 5 daqiqa…", s: "Eslatma" },
];

function drawPhoneCloseup(ctx, t, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  const pw = 560;
  const ph = 1060;
  const px = W / 2 - pw / 2;
  const py = 330;
  const tilt = 0.04 * Math.sin(t * 0.8);
  ctx.translate(W / 2, py + ph / 2);
  ctx.rotate(tilt);
  ctx.translate(-W / 2, -(py + ph / 2));
  // glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const gg = ctx.createRadialGradient(W / 2, py + ph / 2, 100, W / 2, py + ph / 2, 800);
  gg.addColorStop(0, "rgba(60,130,255,0.35)");
  gg.addColorStop(1, "rgba(60,130,255,0)");
  ctx.fillStyle = gg;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.fillStyle = "#05070c";
  roundRect(ctx, px - 16, py - 16, pw + 32, ph + 32, 70);
  ctx.fill();
  ctx.fillStyle = "#0d1322";
  roundRect(ctx, px, py, pw, ph, 56);
  ctx.fill();
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 56);
  ctx.clip();
  // fast-scrolling feed, with motion smear
  const scroll = (t - 29) * 1400 + 600 * Math.sin(t * 2.3);
  const cardH = 520;
  for (let smear = 0; smear < 3; smear++) {
    ctx.globalAlpha = a * (smear ? 0.25 : 1);
    const off = scroll - smear * 40;
    for (let i = -1; i < 4; i++) {
      const idx = Math.floor(off / cardH) + i;
      const y = py + 90 + i * cardH - (off % cardH);
      const r = rng(idx * 13 + 5);
      const hue = Math.floor(r() * 360);
      const cg = ctx.createLinearGradient(px, y, px + pw, y + 340);
      cg.addColorStop(0, `hsl(${hue},45%,32%)`);
      cg.addColorStop(1, `hsl(${(hue + 60) % 360},55%,18%)`);
      ctx.fillStyle = cg;
      roundRect(ctx, px + 24, y, pw - 48, 340, 22);
      ctx.fill();
      ctx.fillStyle = "rgba(220,230,255,0.35)";
      ctx.fillRect(px + 24, y + 360, 300, 16);
      ctx.fillRect(px + 24, y + 392, 200, 14);
      ctx.fillStyle = "rgba(255,90,120,0.8)";
      ctx.beginPath();
      ctx.arc(px + pw - 60, y + 380, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = a;
  ctx.restore();
  // notch
  ctx.fillStyle = "#05070c";
  roundRect(ctx, W / 2 - 70, py + 18, 140, 34, 17);
  ctx.fill();
  ctx.restore();
}

function scene4(ctx, t) {
  const shake = 3 * noise1(t * 3, 1);
  ctx.save();
  ctx.translate(shake, 2 * noise1(t * 2.7, 5));
  drawRoom(ctx, t, 0);
  drawClock(ctx, t, 250, 420, 110, (t - 27) * lerp(1.2, 6, inv(32, 37.5, t)) * (1 + (t - 27) * 0.3), 1);
  // person
  const pose = inv(32.4, 33.6, t);
  const wide = 1 + 0.05 * inv(27, 38, t);
  ctx.save();
  ctx.translate(W / 2, 1240);
  ctx.scale(wide, wide);
  ctx.translate(-W / 2, -1240);
  const flick = 0.85 + 0.15 * noise1(t * 7, 2);
  drawPerson(ctx, W / 2, 1300, 1, pose, {
    x: 0,
    y: -150 + pose * 40,
    r: 300,
    a: 0.5 * flick * (1 - pose * 0.5),
    color: "90,150,255",
    rim: "120,160,230",
  });
  drawDesk(ctx, 0, { books: true });
  drawNotebook(ctx, t, 800, 1330, 1.4, 0, 1);
  // phone glow in hands
  if (pose < 0.9) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(W / 2, 1250, 0, W / 2, 1250, 300);
    g.addColorStop(0, `rgba(110,170,255,${0.6 * (1 - pose) * flick})`);
    g.addColorStop(1, "rgba(110,170,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(W / 2 - 300, 950, 600, 600);
    ctx.restore();
    ctx.fillStyle = "#cfe0ff";
    ctx.globalAlpha = 1 - pose;
    roundRect(ctx, W / 2 - 34, 1222, 68, 30, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // close-up of the phone feed
  drawPhoneCloseup(ctx, t, win(t, 29.3, 29.8, 32.3, 32.8));
  // notifications popping around
  PINGS.forEach((p, i) => {
    const a = inv(p, p + 0.25, t) * (1 - inv(33.0, 33.6, t));
    if (a <= 0) return;
    const r = rng(40 + i);
    const x = 300 + r() * 480;
    const y = 300 + ((i * 137) % 760);
    notifCard(ctx, x, y + (t - p) * -20, 600, NOTIFS[i].icon, NOTIFS[i].t, NOTIFS[i].s, a, (r() - 0.5) * 0.12);
  });
  // lack of direction: arrows scattering, question marks
  const lost = inv(33.3, 34.5, t);
  if (lost > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(150,180,230,${0.35 * lost})`;
    ctx.fillStyle = `rgba(150,180,230,${0.35 * lost})`;
    ctx.lineWidth = 3;
    const r = rng(17);
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      const len = 120 + 220 * E.out(inv(33.3 + i * 0.12, 35.3 + i * 0.12, t));
      const ox = W / 2;
      const oy = 880;
      const ex = ox + Math.cos(a) * len * 1.6;
      const ey = oy + Math.sin(a) * len;
      ctx.setLineDash([14, 12]);
      ctx.beginPath();
      ctx.moveTo(ox + Math.cos(a) * 160, oy + Math.sin(a) * 100);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(a) * 14, ey + Math.sin(a) * 14);
      ctx.lineTo(ex + Math.cos(a + 2.5) * 18, ey + Math.sin(a + 2.5) * 18);
      ctx.lineTo(ex + Math.cos(a - 2.5) * 18, ey + Math.sin(a - 2.5) * 18);
      ctx.fill();
    }
    for (let i = 0; i < 5; i++) {
      const y = 760 - ((t - 33.3) * 40 + i * 70);
      text(ctx, "?", 260 + i * 140, y + 40 * Math.sin(i * 2), { font: "Cormorant Garamond", size: 70 + (i % 2) * 30, weight: 700, fill: "rgba(170,200,240,0.6)", alpha: lost * (1 - inv(37.3, 38, t)) });
    }
    ctx.restore();
  }
  ctx.restore();
  text(ctx, "CHALGʻISH  ·  KECHIKTIRISH  ·  YOʻNALISHSIZLIK", W / 2, 200, { size: 24, weight: 600, tracking: 4, fill: "rgba(170,200,240,0.85)", alpha: win(t, 33.4, 34.2, 37.2, 37.9) });
  // cold desaturating overlay + heartbeat pulse
  const hb = t > 33 ? Math.pow(Math.max(0, Math.sin(((t - 33) / 0.85) * Math.PI)), 12) : 0;
  ctx.fillStyle = `rgba(2,6,16,${0.18 + 0.2 * inv(33, 37.5, t) + 0.12 * hb})`;
  ctx.fillRect(0, 0, W, H);
  drawParticles(ctx, t, 0.35, S.dotCold, 0.4);
}

const STEPS = [
  { w: "TOʻGʻRI YOʻL", at: 42.95 },
  { w: "SIFATLI TAʼLIM", at: 44.0 },
  { w: "IZCHIL HARAKAT", at: 45.2 },
];

function drawLessonScreen(ctx, t, x, y, w, h, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "#0a0e18";
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.save();
  roundRect(ctx, x, y, w, h, 18);
  ctx.clip();
  // top bar
  ctx.fillStyle = "#101726";
  ctx.fillRect(x, y, w, 70);
  ctx.drawImage(S.coin, x + 20, y + 13, 44, 44);
  text(ctx, "M.ACADEMY", x + 78, y + 46, { align: "left", font: "Cinzel", size: 26, weight: 700, fill: "gold" });
  text(ctx, "ONLAYN DARS", x + w - 24, y + 45, { align: "right", size: 20, weight: 600, tracking: 4, fill: "rgba(240,220,170,0.8)" });
  // video panel: teacher at a board
  const vx = x + 24;
  const vy = y + 92;
  const vw = w * 0.62;
  const vh = h - 210;
  const vg = ctx.createLinearGradient(vx, vy, vx, vy + vh);
  vg.addColorStop(0, "#1d2a3a");
  vg.addColorStop(1, "#0f1622");
  ctx.fillStyle = vg;
  roundRect(ctx, vx, vy, vw, vh, 12);
  ctx.fill();
  // board
  ctx.fillStyle = "#0e2a22";
  ctx.fillRect(vx + 30, vy + 30, vw - 60, vh * 0.55);
  ctx.strokeStyle = "rgba(240,240,220,0.9)";
  ctx.lineWidth = 3;
  const wp = inv(41.6, 45.0, t);
  const eq = "a² + 2ab + b²";
  text(ctx, eq.slice(0, Math.floor(wp * eq.length)), vx + 60, vy + 110, { align: "left", font: "Cormorant Garamond", size: 46, weight: 600, fill: "#f2f0e6" });
  ctx.beginPath();
  ctx.moveTo(vx + 60, vy + 140);
  ctx.lineTo(vx + 60 + (vw - 140) * inv(42.5, 45.5, t), vy + 140);
  ctx.stroke();
  // teacher silhouette (head + shoulders), gesturing
  const tx = vx + vw * 0.72;
  const ty = vy + vh;
  ctx.fillStyle = "#2b3b50";
  ctx.beginPath();
  ctx.ellipse(tx, ty - 150, 40, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tx - 110, ty);
  ctx.bezierCurveTo(tx - 110, ty - 80, tx - 70, ty - 100, tx, ty - 100);
  ctx.bezierCurveTo(tx + 70, ty - 100, tx + 110, ty - 80, tx + 110, ty);
  ctx.fill();
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#2b3b50";
  const ga = Math.sin(t * 3) * 0.15;
  ctx.beginPath();
  ctx.moveTo(tx - 70, ty - 80);
  ctx.lineTo(tx - 140, ty - 150 + 30 * ga);
  ctx.stroke();
  // play bar
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(vx + 20, vy + vh - 24, vw - 40, 6);
  ctx.fillStyle = C.gold;
  ctx.fillRect(vx + 20, vy + vh - 24, (vw - 40) * inv(40.5, 48.5, t), 6);
  // module list
  const lx = vx + vw + 24;
  const lw = w - vw - 72;
  const mods = ["1-modul", "2-modul", "3-modul", "4-modul"];
  mods.forEach((m, i) => {
    const yy = vy + i * 92;
    const done = t > 42.6 + i * 1.3;
    ctx.fillStyle = done ? "rgba(212,166,64,0.16)" : "rgba(255,255,255,0.05)";
    roundRect(ctx, lx, yy, lw, 76, 12);
    ctx.fill();
    ctx.strokeStyle = done ? C.gold : "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lx + 34, yy + 38, 15, 0, Math.PI * 2);
    ctx.stroke();
    if (done) {
      const cp = inv(42.6 + i * 1.3, 42.9 + i * 1.3, t);
      ctx.beginPath();
      ctx.moveTo(lx + 26, yy + 38);
      ctx.lineTo(lx + 26 + 6 * Math.min(1, cp * 2), yy + 38 + 6 * Math.min(1, cp * 2));
      if (cp > 0.5) ctx.lineTo(lx + 32 + 10 * (cp - 0.5) * 2, yy + 44 - 14 * (cp - 0.5) * 2);
      ctx.stroke();
    }
    text(ctx, m, lx + 62, yy + 47, { align: "left", size: 24, weight: 600, fill: done ? C.goldL : "rgba(230,235,245,0.7)" });
  });
  // progress bar
  const prog = E.inOut(inv(41.2, 47.6, t));
  const by = y + h - 90;
  text(ctx, "Natija", x + 24, by - 14, { align: "left", size: 24, weight: 600, fill: "rgba(240,235,220,0.85)" });
  text(ctx, `${Math.round(prog * 100)}%`, x + w - 24, by - 14, { align: "right", size: 26, weight: 700, fill: C.goldL });
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, x + 24, by, w - 48, 22, 11);
  ctx.fill();
  ctx.fillStyle = goldGrad(ctx, x, by, x + w, by + 22, inv(46, 48, t));
  roundRect(ctx, x + 24, by, (w - 48) * prog, 22, 11);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function scene5(ctx, t) {
  const warm = E.inOut(inv(38.0, 43.0, t));
  drawRoom(ctx, t, warm);
  drawClock(ctx, t, 250, 420, 110, 8 + (t - 38) * 0.6, 1 - inv(39, 40.5, t));
  // desk lamp turns on
  const lamp = inv(38.4, 38.7, t);
  // camera: wide -> push into the laptop
  const push = E.inOut(inv(40.6, 42.0, t));
  ctx.save();
  const sc = lerp(1, 1.0, push);
  ctx.translate(W / 2, 1240);
  ctx.scale(sc, sc);
  ctx.translate(-W / 2, -1240);
  const pose = lerp(1, 2, E.inOut(inv(38.2, 39.6, t)));
  const open = E.inOut(inv(39.0, 40.3, t));
  const lw = 480;
  const lh = 300;
  const hx = W / 2;
  const hy = 1250;
  if (open > 0.02) {
    // the screen faces away from camera: its glow spills behind/around the person
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(hx, hy - 260, 10, hx, hy - 260, 560);
    g.addColorStop(0, `rgba(255,200,120,${0.3 * open})`);
    g.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 500, W, 1100);
    ctx.restore();
  }
  drawPerson(ctx, W / 2, 1300, 1, pose, {
    x: 0,
    y: -250,
    r: 260,
    a: 0.22 * open + 0.06 * lamp,
    color: "255,190,110",
    rim: "255,200,140",
  });
  drawDesk(ctx, warm, { books: false });
  // laptop (lid opens toward camera)
  ctx.fillStyle = "#1a1c22";
  ctx.beginPath();
  ctx.moveTo(hx - lw / 2 - 30, hy + 30);
  ctx.lineTo(hx + lw / 2 + 30, hy + 30);
  ctx.lineTo(hx + lw / 2, hy);
  ctx.lineTo(hx - lw / 2, hy);
  ctx.fill();
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(1, -open);
  ctx.fillStyle = "#23262e";
  roundRect(ctx, -lw / 2, 0, lw, lh, 12);
  ctx.fill();
  ctx.restore();
  if (open > 0.02) ctx.drawImage(S.coin, hx - 22, hy - (lh * open) / 2 - 22, 44, 44 * open);
  drawNotebook(ctx, t, 830, 1360, inv(39.5, 47, t) * 7, warm, 1);
  // desk lamp
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const lg = ctx.createRadialGradient(150, 1080, 0, 150, 1080, 600);
  lg.addColorStop(0, `rgba(255,190,110,${0.45 * lamp})`);
  lg.addColorStop(1, "rgba(255,190,110,0)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 500, 800, 1200);
  ctx.restore();
  ctx.fillStyle = "#0c0a08";
  ctx.beginPath();
  ctx.moveTo(110, 1240);
  ctx.lineTo(190, 1240);
  ctx.lineTo(160, 1230);
  ctx.lineTo(150, 1080);
  ctx.lineTo(220, 1040);
  ctx.lineTo(90, 1040);
  ctx.lineTo(140, 1080);
  ctx.lineTo(140, 1230);
  ctx.fill();
  ctx.restore();

  // lesson UI close-up (the "screen" we follow)
  const ui = win(t, 40.6, 41.4, 47.6, 48.4);
  const uiS = 0.92 + 0.08 * E.out(inv(40.6, 41.6, t));
  ctx.save();
  ctx.translate(W / 2, 830);
  ctx.scale(uiS, uiS);
  ctx.translate(-W / 2, -830);
  // dim behind UI
  ctx.fillStyle = `rgba(6,5,4,${0.55 * ui})`;
  ctx.fillRect(0, 0, W, H);
  drawLessonScreen(ctx, t, 50, 560, 980, 620, ui);
  ctx.restore();
  // ascending steps with labels (synced to narration)
  STEPS.forEach((s, i) => {
    const p = E.out(inv(s.at, s.at + 0.5, t)) * (1 - inv(47.8, 48.4, t));
    if (p <= 0) return;
    const bx = 120 + i * 300;
    const bh = 60 + i * 50;
    const by = 470;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = goldGrad(ctx, bx, by - bh, bx + 240, by);
    ctx.fillRect(bx, by - bh * p, 240, bh * p);
    ctx.restore();
    text(ctx, s.w, bx + 120, by - bh - 22, { size: 26, weight: 700, tracking: 2, fill: C.goldL, alpha: p, shadow: "rgba(0,0,0,0.8)" });
  });
  // light sweep into the brand
  const sweep = inv(46.6, 48.6, t);
  if (sweep > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const x = lerp(-600, W + 600, E.inOut(sweep));
    const g = ctx.createLinearGradient(x - 300, 0, x + 300, 0);
    g.addColorStop(0, "rgba(255,210,140,0)");
    g.addColorStop(0.5, "rgba(255,220,160,0.45)");
    g.addColorStop(1, "rgba(255,210,140,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  drawBeam(ctx, t, 0.45 * warm, W / 2, "255,214,150", 0.9);
  drawParticles(ctx, t, 0.3 + 0.6 * warm, S.dotGold, 0.6 + warm);
  // fade to black before the brand finale
  ctx.fillStyle = `rgba(0,0,0,${E.in(inv(48.2, 49.0, t))})`;
  ctx.fillRect(0, 0, W, H);
}

// ======================================================================
// SCENE 6 — brand finale (49–59)
// ======================================================================

const LOGO_PTS = (() => {
  const r = rng(321);
  const pts = [];
  for (let i = 0; i < 420; i++) {
    const a = r() * Math.PI * 2;
    const rr = i < 300 ? 0.86 + r() * 0.12 : r() * 0.55;
    pts.push({ sx: r() * W, sy: r() * H, tx: Math.cos(a) * rr, ty: Math.sin(a) * rr, d: r() * 0.5 });
  }
  return pts;
})();

function scene6(ctx, t) {
  ctx.fillStyle = C.black;
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W / 2, 700, 50, W / 2, 800, 1200);
  bg.addColorStop(0, "#14182a");
  bg.addColorStop(1, "#020205");
  ctx.fillStyle = bg;
  ctx.globalAlpha = inv(49, 50, t);
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  drawBeam(ctx, t, 0.8 * inv(49.0, 50.5, t), W / 2);
  drawFloorGlow(ctx, inv(49.5, 51, t), H - 230);
  const cx = W / 2;
  const cy = 455;
  const R = 160;
  // particles converge into the emblem
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of LOGO_PTS) {
    const k = E.inOut(inv(49.0 + p.d * 0.6, 50.6 + p.d * 0.4, t));
    const x = lerp(p.sx, cx + p.tx * R, k);
    const y = lerp(p.sy, cy + p.ty * R, k);
    ctx.globalAlpha = (0.9 - 0.9 * inv(50.6, 51.3, t)) * inv(49.0, 49.3, t);
    ctx.drawImage(S.dotGold, x - 9, y - 9, 18, 18);
  }
  ctx.restore();
  // emblem
  const ca = E.out(inv(50.3, 51.1, t));
  const pulse = 1 + 0.03 * Math.pow(Math.max(0, Math.sin((t - 57.7) * 4)), 2) * (t > 57.7 ? 1 : 0);
  const spin = Math.cos(Math.min(1, inv(50.3, 51.6, t)) * Math.PI * 2) * 0.12 + 0.88 + 0.12 * inv(50.3, 51.6, t);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(spin * pulse, pulse);
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 2.4);
  halo.addColorStop(0, `rgba(255,200,110,${0.35 * ca})`);
  halo.addColorStop(1, "rgba(255,200,110,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(-R * 2.5, -R * 2.5, R * 5, R * 5);
  ctx.restore();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(spin * pulse, pulse);
  ctx.translate(-cx, -cy);
  drawCoinBadge(ctx, cx, cy, R, ca, t, 51.2);
  ctx.restore();
  // wordmark
  const wa = E.out(inv(51.0, 51.9, t));
  text(ctx, "M.ACADEMY", W / 2, 770 + (1 - wa) * 24, {
    font: "Cinzel",
    size: 112,
    weight: 700,
    tracking: lerp(40, 6, wa),
    fill: "gold",
    alpha: wa,
    shine: inv(51.6, 53.0, t),
    shadow: "rgba(255,180,80,0.35)",
    shadowBlur: 40,
  });
  const oa = E.out(inv(51.5, 52.3, t));
  text(ctx, "ONLINE SCHOOL", W / 2, 838, { font: "Cinzel", size: 40, weight: 500, tracking: lerp(30, 18, oa), fill: C.cream, alpha: oa });
  // divider
  const dv = E.inOut(inv(51.9, 52.8, t));
  if (dv > 0) {
    ctx.save();
    ctx.strokeStyle = goldGrad(ctx, W / 2 - 260, 0, W / 2 + 260, 0);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 260 * dv, 892);
    ctx.lineTo(W / 2 - 16, 892);
    ctx.moveTo(W / 2 + 16, 892);
    ctx.lineTo(W / 2 + 260 * dv, 892);
    ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.translate(W / 2, 892);
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = dv;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
  const qa = E.out(inv(52.4, 53.3, t));
  text(ctx, "“Ilmingizni keyingi bosqichga olib chiqing.”", W / 2, 968 + (1 - qa) * 16, { font: "Cormorant Garamond", size: 52, weight: 600, fill: C.white, alpha: qa });
  const sa = E.out(inv(53.4, 54.2, t));
  text(ctx, "Bizga obuna boʻling!", W / 2, 1046 + (1 - sa) * 16, { font: "Cormorant Garamond", size: 62, weight: 700, fill: "gold", alpha: sa, shine: inv(54, 55.2, t) });
  // instagram handle
  const ia = E.out(inv(54.0, 54.8, t));
  if (ia > 0) {
    ctx.save();
    ctx.globalAlpha = ia;
    ctx.font = "600 40px Inter";
    const handle = "@M.ACADEMY.UZ";
    const tw = ctx.measureText(handle).width;
    const ix = W / 2 - (tw + 64) / 2;
    const iy = 1116;
    ctx.strokeStyle = C.goldL;
    ctx.lineWidth = 4;
    roundRect(ctx, ix, iy - 22, 44, 44, 13);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ix + 22, iy, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = C.goldL;
    ctx.beginPath();
    ctx.arc(ix + 34, iy - 11, 3, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, handle, ix + 64, iy + 14, { align: "left", size: 40, weight: 600, fill: C.white });
    ctx.restore();
  }
  // CTA button
  const ba = E.back(inv(54.8, 55.5, t));
  if (ba > 0) {
    const bw = 620;
    const bh = 104;
    const bx = W / 2 - bw / 2;
    const by = 1178;
    const pul = t > 55.6 ? 1 + 0.025 * Math.sin((t - 55.6) * 5) : 1;
    ctx.save();
    ctx.translate(W / 2, by + bh / 2);
    ctx.scale(ba * pul, ba * pul);
    ctx.translate(-W / 2, -(by + bh / 2));
    ctx.shadowColor = "rgba(255,190,90,0.55)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = goldGrad(ctx, bx, by, bx + bw, by + bh, inv(55.6, 56.8, t));
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    text(ctx, "FOLLOW M.ACADEMY", W / 2, by + 66, { font: "Inter", size: 40, weight: 800, tracking: 4, fill: "#141008" });
    ctx.restore();
    // tap ripple
    const rp = inv(56.2, 57.0, t);
    if (rp > 0 && rp < 1) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,230,170,${1 - rp})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(W / 2 + 180, by + bh / 2, 20 + rp * 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  drawParticles(ctx, t, 0.8 * inv(50.5, 52, t), S.dotGold, 0.5);
  // final hit flash
  const hit = t > 57.7 ? Math.exp(-(t - 57.7) * 4) : 0;
  if (hit > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
    g.addColorStop(0, `rgba(255,220,150,${0.5 * hit})`);
    g.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// ======================================================================
// Frame composition
// ======================================================================

function renderFrame(ctx, t, timeline) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const layers = [
    [scene1, 0, 8.6, 0],
    [scene2, 8.0, 18.5, 0.6],
    [scene3, 18.0, 27.2, 0.5],
    [scene4, 27.0, 38.4, 0.25],
    [scene5, 38.0, 49.1, 0.4],
    [scene6, 49.0, 59.0, 0.0],
  ];
  for (const [fn, a, b, xf] of layers) {
    if (t < a || t >= b) continue;
    ctx.save();
    ctx.globalAlpha = xf > 0 ? E.inOut(inv(a, a + xf, t)) : 1;
    if (ctx.globalAlpha < 1) {
      // draw into an offscreen layer so the scene can cross-dissolve as a whole
      const L = S.layer || (S.layer = canvas(W, H));
      const g = L.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, W, H);
      fn(g, t);
      ctx.drawImage(L, 0, 0);
    } else fn(ctx, t);
    ctx.restore();
  }
  // brand badge (top-right) through the story, hidden during the finale
  drawCoinBadge(ctx, 978, 150, 48, win(t, 1.5, 2.5, 48.0, 48.8), t, 9.0);
  drawSubtitles(ctx, t, timeline.subtitles);
  drawGrainVignette(ctx, t, 0.07);
  // global fade in/out
  const fin = 1 - inv(0, 0.5, t);
  const fout = E.in(inv(58.1, 59.0, t));
  const f = Math.max(fin, fout);
  if (f > 0) {
    ctx.fillStyle = `rgba(0,0,0,${f})`;
    ctx.fillRect(0, 0, W, H);
  }
}
