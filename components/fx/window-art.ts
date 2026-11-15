// The home hero's picture: a dark room at sunset, a window onto a city, a cat on the sill. Drawn as pixel art on a
// small canvas the page scales up. startWindowScene returns a function that stops it. Under reduced motion it draws
// one still frame. Original art, inspired by a window at golden hour; no game assets.

type RGB = [number, number, number];
type Cloud = { x: number; y: number; w: number; layer: number; sp: number; lumps: { dx: number; r: number }[] };
type Building = { x: number; w: number; h: number; tower: boolean; antenna: boolean; pale?: boolean; lights: [number, number, number][] };
type Layout = { wx: number; wy: number; ww: number; wh: number; sill: number; sunX: number; sunY: number; horizon: number; portrait: boolean };

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

// The sky: dusty blue-lavender above, mauve, peach, then a hot orange at the horizon.
const SKY = ["#56649a", "#6d76aa", "#8f84b4", "#b98fb0", "#e199a0", "#f4a27a", "#fb8a4a", "#ff7a34"].map(hex);

// The cat, from behind; # is fur. Its right edge catches the sun.
const CAT = [
  "....#..........#....",
  "...##..........##...",
  "...###........###...",
  "..####........####..",
  "..################..",
  ".##################.",
  ".##################.",
  ".##################.",
  ".##################.",
  "..################..",
  "...##############...",
  ".....##########.....",
  ".....##########.....",
  "....############....",
  "...##############...",
  "..################..",
  "..################..",
  ".##################.",
  ".##################.",
  ".##################.",
  "####################",
  "####################",
  "####################",
  "####################",
  "####################",
  ".##################.",
];
const TAIL: [number, number][] = [[19, 24], [21, 25], [23, 25], [25, 25], [27, 24], [28, 23], [29, 22], [29, 21], [28, 20]];
const LEAF = [".##.##", "######", "######", ".####.", "..##..", "...#.."];
const LEAVES: [number, number, number][] = [[2, -17, 1], [7, -21, 1], [11, -16, 0], [-3, -14, 1], [14, -11, 0], [4, -25, 0], [-5, -8, 0], [9, -28, 0]];

export function startWindowScene(canvas: HTMLCanvasElement): () => void {
  const g = canvas.getContext("2d");
  if (!g) return () => {};
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 384;
  let H = 240;
  let L: Layout = { wx: 0, wy: 0, ww: 0, wh: 0, sill: 0, sunX: 0, sunY: 0, horizon: 0, portrait: false };
  let seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };

  let clouds: Cloud[] = [];
  let wisps: { x: number; y: number; w: number }[] = [];
  let far: { x: number; w: number; h: number }[] = [];
  let near: Building[] = [];
  let roofs: { x: number; w: number }[] = [];
  let trees: number[] = [];
  const motes = Array.from({ length: 60 }, (_, i) => ({ x: (i * 97) % 384, y: (i * 53) % 400, s: ((i * 37) % 100) / 100 }));

  function layout() {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const portrait = box.width / box.height < 1.15;
    W = portrait ? 240 : 384;
    H = Math.max(160, Math.round((W * box.height) / box.width));
    canvas.width = W;
    canvas.height = H;
    let wx: number, wy: number, ww: number, wh: number;
    if (portrait) {
      wx = 46; ww = W - wx - 16; wh = Math.round(H * 0.28); wy = H - wh - 34;
    } else {
      wx = Math.round(W * 0.5); wy = 34; ww = W - wx - 24; wh = Math.round(H * 0.6);
    }
    L = { wx, wy, ww, wh, sill: wy + wh, sunX: wx + ww * 0.7, sunY: wy + wh * 0.62, horizon: wy + wh * 0.9, portrait };
    build();
  }

  function build() {
    seed = 19;
    const { wx, wy, ww, wh } = L;
    const cloud = (x: number, y: number, w: number, layer: number): Cloud => {
      const lumps = Array.from({ length: 3 + Math.floor(w / 9) }, () => ({ dx: rnd() * w, r: 3 + rnd() * (layer === 2 ? 3 : 6) }));
      return { x, y, w, layer, lumps, sp: [0.4, 0.8, 1.3][layer] };
    };
    clouds = [];
    for (let i = 0; i < 4; i++) clouds.push(cloud(wx + rnd() * ww * 1.2, wy + 6 + rnd() * wh * 0.22, 30 + rnd() * 40, 0));
    for (let i = 0; i < 4; i++) clouds.push(cloud(wx + rnd() * ww * 1.2, wy + wh * 0.3 + rnd() * wh * 0.2, 24 + rnd() * 36, 1));
    for (let i = 0; i < 2; i++) clouds.push(cloud(wx + rnd() * ww * 1.2, wy + wh * 0.52 + rnd() * wh * 0.08, 18 + rnd() * 26, 2));
    wisps = Array.from({ length: 6 }, () => ({ x: wx + rnd() * ww, y: wy + 3 + rnd() * wh * 0.35, w: 20 + rnd() * 60 }));
    far = []; near = []; roofs = [];
    let x = wx;
    while (x < wx + ww) { const w = 4 + Math.floor(rnd() * 8); far.push({ x, w, h: 5 + Math.floor(rnd() * 10) }); x += w; }
    x = wx - 2;
    while (x < wx + ww) {
      const w = 6 + Math.floor(rnd() * 10), tall = rnd() < 0.12;
      const b: Building = { x, w, h: tall ? 20 + Math.floor(rnd() * 8) : 7 + Math.floor(rnd() * 10), tower: rnd() < 0.15, antenna: rnd() < 0.2, lights: [] };
      for (let ly = 2; ly < b.h - 1; ly += 2) for (let lx = 1; lx < b.w - 1; lx += 2) if (rnd() < 0.18) b.lights.push([lx, ly, rnd()]);
      near.push(b);
      x += w + (rnd() < 0.3 ? 1 : 0);
    }
    // the pale block, catching the last light
    near.push({ x: wx + Math.round(ww * 0.36), w: 16, h: 26, pale: true, lights: [], tower: false, antenna: true });
    for (let i = 0; i < 4; i++) roofs.push({ x: wx + rnd() * ww, w: 12 + rnd() * 10 });
    trees = Array.from({ length: 140 }, () => rnd());
  }

  function sky(x0: number, y0: number, w: number, h: number) {
    const img = g!.getImageData(x0, y0, w, h), d = img.data, n = SKY.length - 1, steps = 30;
    const glow = hex("#ffc27a");
    for (let y = 0; y < h; y++) {
      const v = Math.pow(y / h, 1.1) * n, i = Math.min(n - 1, Math.floor(v)), t = v - i;
      const q = t * steps, lo = Math.floor(q) / steps, hi = Math.min(1, lo + 1 / steps), f = q - Math.floor(q);
      for (let x = 0; x < w; x++) {
        const near = Math.max(0, 1 - Math.hypot(x0 + x - L.sunX, (y0 + y - L.sunY) * 1.6) / 90);
        let c = mix(SKY[i], SKY[i + 1], f > BAYER[(y & 3) * 4 + (x & 3)] ? hi : lo);
        c = mix(c, glow, near * near * 0.55);
        const o = (y * w + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    g!.putImageData(img, x0, y0);
  }

  function sun(t: number) {
    const { sunX: x, sunY: y } = L, r = 7;
    const halo = g!.createRadialGradient(x, y, 0, x, y, 60);
    halo.addColorStop(0, "rgba(255,226,140,.7)");
    halo.addColorStop(0.25, "rgba(255,160,90,.3)");
    halo.addColorStop(1, "rgba(255,130,70,0)");
    g!.fillStyle = halo;
    g!.fillRect(x - 60, y - 60, 120, 120);
    g!.save();
    g!.globalAlpha = 0.07;
    g!.translate(x, y);
    g!.rotate(t * 0.02);
    for (let i = 0; i < 10; i++) { g!.rotate(Math.PI / 5); g!.fillStyle = "#ffe0a0"; g!.fillRect(0, -1, 90, 2); }
    g!.restore();
    for (let dy = -r; dy <= r; dy++) {
      const hw = Math.round(Math.sqrt(r * r - dy * dy));
      px(x - hw, y + dy, hw * 2, 1, dy < -3 ? "#fff6d0" : dy < 2 ? "#ffe07a" : "#ffb84a");
    }
    px(x - 3, y - 5, 2, 1, "#ffffff");
  }

  function drawCloud(c: Cloud, ox: number) {
    const near = Math.max(0, 1 - Math.abs(ox + c.w / 2 - L.sunX) / 160);
    const low = (c.y - L.wy) / L.wh;
    const dark = mix(hex("#4c4778"), hex("#7a5a8a"), low), mid = mix(hex("#6d6496"), hex("#a77a9e"), low);
    const top = hex("#a99cc8"), rim = mix(hex("#f08fa6"), hex("#ffc07a"), near);
    for (const l of c.lumps) {
      const cx = ox + l.dx, cy = c.y - l.r * 0.6;
      for (let yy = -l.r; yy <= l.r * 0.6; yy++) {
        const hw = Math.round(Math.sqrt(Math.max(0, l.r * l.r - yy * yy)) * 1.6);
        const k = (yy + l.r) / (l.r * 1.6);
        px(cx - hw, cy + yy, hw * 2, 1, css(k < 0.25 ? top : k < 0.6 ? mid : dark, c.layer === 2 ? 0.85 : 1));
      }
    }
    px(ox, c.y, c.w, 2, css(dark));
    px(ox + 2, c.y + 2, c.w - 4, 1, css(rim, 0.6 + near * 0.4));
    if (near > 0.3) px(ox + 4, c.y + 3, c.w - 8, 1, css(rim, near * 0.5));
  }

  function view(t: number) {
    const { wx, wy, ww, wh, horizon } = L;
    g!.save();
    g!.beginPath();
    g!.rect(wx, wy, ww, wh);
    g!.clip();
    sky(wx, wy, ww, wh);
    for (const s of wisps) {
      const x = ((s.x - wx + t * 0.5) % (ww + 60)) + wx - 30;
      px(x, s.y, s.w, 1, "rgba(168,150,200,.55)");
      px(x + 6, s.y + 1, s.w * 0.6, 1, "rgba(240,160,180,.35)");
    }
    sun(t);
    for (const c of clouds) drawCloud(c, ((c.x - wx + t * c.sp) % (ww * 1.4)) + wx - ww * 0.2);
    // birds, a loose V
    for (let i = 0; i < 5; i++) {
      const bx = wx + ((t * 7 + i * 6) % (ww + 40)) - 20 + Math.abs(i - 2) * 3, by = wy + wh * 0.32 + Math.abs(i - 2) * 3 + Math.sin(t * 2 + i) * 0.8;
      const f = Math.sin(t * 8 + i) > 0 ? 1 : 0;
      px(bx, by, 1, 1, "#3a2a44"); px(bx - 1, by - f, 1, 1, "#3a2a44"); px(bx + 1, by - f, 1, 1, "#3a2a44");
    }
    // a plane, its light blinking
    const planeX = wx + ((t * 4) % (ww + 40)) - 20;
    px(planeX, wy + 14, 3, 1, "#4a3a5a");
    if (Math.floor(t * 1.5) % 2 === 0) px(planeX + 3, wy + 14, 1, 1, "#ff6a6a");
    // hazy hills, the far city in the haze, the near city
    for (let x = wx; x < wx + ww; x++) {
      const h = 4 + Math.round(Math.sin(x * 0.05) * 2 + Math.sin(x * 0.13) * 1.5);
      px(x, horizon - 6 - h, 1, h + 8, "rgba(196,128,150,.55)");
    }
    for (const b of far) px(b.x, horizon - b.h, b.w, b.h, "#a3708a");
    for (const b of near) {
      const top = horizon - b.h + 3;
      if (b.pale) {
        px(b.x, top, b.w, b.h, "#c9b3c0"); px(b.x + b.w - 3, top, 3, b.h, "#9c8296");
        for (let ly = 3; ly < b.h - 2; ly += 3) for (let lx = 2; lx < b.w - 4; lx += 3) px(b.x + lx, top + ly, 1, 1, "#7c6680");
        px(b.x, top, b.w, 1, "#ffd9b8");
      } else {
        px(b.x, top, b.w, b.h, "#5c4566"); px(b.x, top, 1, b.h, "#6e5276"); px(b.x + b.w - 1, top, 1, b.h, "#c47a6e");
        for (const [lx, ly, p] of b.lights) if (Math.sin(t * 0.25 + p * 50) > -0.2) px(b.x + lx, top + ly, 1, 1, p > 0.7 ? "#fff0b0" : "#ffcf7a");
      }
      if (b.tower) { px(b.x + 2, top - 5, 4, 3, "#4a3654"); px(b.x + 2, top - 2, 1, 2, "#4a3654"); px(b.x + 5, top - 2, 1, 2, "#4a3654"); }
      if (b.antenna) {
        const ax = b.x + Math.floor(b.w / 2);
        px(ax, top - 6, 1, 6, "#4a3654");
        if (Math.floor(t * 1.2 + b.x) % 3 === 0) px(ax, top - 7, 1, 1, "#ff5050");
      }
    }
    // houses with pale roofs, then the trees, warmer on the sun's side
    for (const r of roofs) { const ry = horizon + 3; px(r.x, ry, r.w, 3, "#d8c8c4"); px(r.x + 1, ry + 3, r.w - 2, 4, "#7a5c6a"); px(r.x + 3, ry + 4, 2, 2, "#ffcf7a"); }
    for (let x = wx - 4, i = 0; x < wx + ww + 4; x += 4, i++) {
      const h = 3 + Math.round(trees[i % trees.length] * 6), base = horizon + 10;
      const sway = Math.round(Math.sin(t * 1.3 + i) * 0.5);
      px(x + sway, base - h, 6, h + 30, "#2e3d30"); px(x + 1 + sway, base - h - 1, 4, 1, "#2e3d30");
      px(x + 4 + sway, base - h + 1, 2, Math.max(2, h - 3), "#4f5a34"); px(x + 1 + sway, base - h + 2, 1, 2, "#3b4c38");
    }
    // reflections on the glass
    g!.globalAlpha = 0.06;
    g!.fillStyle = "#ffffff";
    for (let i = 0; i < 3; i++) {
      const sx = wx + 20 + i * 60;
      g!.beginPath(); g!.moveTo(sx, wy); g!.lineTo(sx + 10, wy); g!.lineTo(sx - 40, wy + wh); g!.lineTo(sx - 50, wy + wh); g!.fill();
    }
    g!.globalAlpha = 1;
    g!.restore();
  }

  function room() {
    const { wx, wy, ww } = L;
    seed = 5;
    px(0, 0, W, H, "#1c1520");
    for (let i = 0; i < 900; i++) px(rnd() * W, rnd() * H, 1, 1, rnd() < 0.5 ? "#201823" : "#19121c");
    // warm light through the two panes, across the wall and down to the floor
    const beam = (x0: number, x1: number, a: number) => {
      g!.fillStyle = `rgba(255,150,90,${a})`;
      g!.beginPath(); g!.moveTo(x0, wy + 4); g!.lineTo(x1, wy + 4); g!.lineTo(x1 - 150, H); g!.lineTo(x0 - 210, H); g!.fill();
    };
    beam(wx + 4, wx + Math.round(ww * 0.33) - 2, 0.06);
    beam(wx + Math.round(ww * 0.33) + 4, wx + ww - 4, 0.045);
  }

  function frameAndCurtain(t: number) {
    const { wx, wy, ww, wh, sill } = L;
    const mull = wx + Math.round(ww * 0.33), rail = wy + Math.round(wh * 0.12);
    const wood = "#2a1b1c", woodLit = "#5e3a30", woodDark = "#160e10";
    px(wx - 5, wy - 5, ww + 10, 5, wood); px(wx - 5, wy - 5, ww + 10, 1, "#3a2724");
    px(wx - 5, wy, 5, wh, wood); px(wx + ww, wy, 5, wh, wood); px(wx + ww, wy, 1, wh, woodLit);
    px(mull - 2, wy, 4, wh, wood); px(mull + 1, wy, 1, wh, woodLit); px(mull - 2, wy, 1, wh, woodDark);
    px(wx, rail, ww, 3, wood); px(wx, rail + 2, ww, 1, woodLit);
    px(mull + 2, wy + Math.round(wh * 0.55), 3, 2, "#b08a5a"); px(mull + 2, wy + Math.round(wh * 0.55), 1, 1, "#f0c890");
    // the sill, its front edge lit, and the wall under it
    px(wx - 14, sill, ww + 26, 4, "#3a2a2c"); px(wx - 14, sill, ww + 26, 1, "#ff9a5c"); px(wx - 14, sill + 4, ww + 26, 3, "#241a1e");
    px(wx - 14, sill + 7, ww + 26, 1, "#150e12");
    g!.fillStyle = "rgba(255,140,80,.05)";
    g!.fillRect(wx - 14, sill + 8, ww + 26, H);
    // the curtain on its rod: folds, a printed vine, light through its edge
    const cx0 = wx - 34, cx1 = wx + 6, len = L.portrait ? wh + 10 : wh + 40;
    px(cx0 - 6, wy - 12, cx1 - cx0 + 20, 2, "#5a4a46"); px(cx0 - 8, wy - 13, 3, 4, "#7a6a60");
    for (let x = cx0; x < cx1; x += 5) px(x, wy - 11, 2, 3, "#8a7a6c");
    for (let x = cx0; x < cx1; x++) {
      const k = (x - cx0) / (cx1 - cx0);
      const fold = Math.sin((x - cx0) * 0.75) * 0.5 + 0.5;
      g!.fillStyle = css(mix(hex("#8f7d6a"), hex("#e8d2b0"), Math.min(1, k * 0.9 + fold * 0.25)));
      g!.fillRect(x, wy - 9, 1, len + Math.round(Math.sin(t * 0.8 + x * 0.2) * 0.6));
    }
    g!.fillStyle = "rgba(255,170,100,.25)";
    g!.fillRect(cx1 - 6, wy - 9, 6, len);
    seed = 41;
    for (let v = 0; v < 4; v++) {
      const vx = cx0 + 4 + v * 9;
      for (let y = wy; y < wy - 9 + len; y += 2) {
        const xx = vx + Math.round(Math.sin(y * 0.15 + v) * 1.5);
        px(xx, y, 1, 1, "rgba(80,96,60,.55)");
        if (rnd() < 0.18) { px(xx + 1, y, 2, 1, "rgba(96,120,70,.6)"); px(xx + 1, y - 1, 1, 1, "rgba(96,120,70,.6)"); }
      }
    }
    g!.fillStyle = "rgba(0,0,0,.25)";
    g!.fillRect(cx0 - 6, wy - 9, 6, len);
  }

  function plant(x: number, y: number, t: number) {
    px(x, y - 10, 13, 10, "#e9e2dc"); px(x + 9, y - 10, 4, 10, "#bfb4ae"); px(x - 1, y - 11, 15, 2, "#f4efea"); px(x, y - 9, 13, 1, "#3a2a24");
    const leaf = (lx: number, ly: number, i: number, big: boolean) => {
      const sw = Math.round(Math.sin(t * 1.1 + i * 0.7) * 0.6);
      const fill = i % 3 === 0 ? "#8cc152" : i % 3 === 1 ? "#6aa23c" : "#5a8f34";
      const rows = big ? LEAF : LEAF.slice(1, 5);
      rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) if (row[c] === "#") px(x + lx + c + sw, y + ly + r, 1, 1, fill);
        const last = row.lastIndexOf("#");
        if (last >= 0) px(x + lx + last + sw, y + ly + r, 1, 1, "#c8e878");
      });
      for (let r = 1; r < rows.length - 1; r++) px(x + lx + 2 + sw, y + ly + r, 1, 1, "#3f6e27");
    };
    LEAVES.forEach(([lx, ly, b], i) => leaf(lx, ly, i, b === 1));
    for (let i = 0; i < 18; i++) {
      const sw = Math.round(Math.sin(t * 0.9 + i * 0.4) * 0.8), vx = 14 + Math.round(Math.sin(i * 0.5) * 1.5);
      px(x + vx + sw, y - 4 + i, 1, 1, "#4f7f2f");
      if (i % 4 === 2) leaf(vx + 1, -4 + i, i + 9, false);
    }
    for (let i = 0; i < 10; i++) px(x - 2 - Math.round(Math.sin(i * 0.6)), y - 6 + i, 1, 1, "#4f7f2f");
    leaf(-6, 2, 20, false);
  }

  function books(x: number, y: number) {
    px(x, y - 4, 22, 4, "#6a4a5a"); px(x, y - 4, 22, 1, "#8a6478"); px(x + 18, y - 4, 1, 4, "#4a3040");
    px(x + 2, y - 7, 18, 3, "#3e5a72"); px(x + 2, y - 7, 18, 1, "#5a7a94"); px(x + 6, y - 6, 6, 1, "#c8b070");
    px(x + 1, y - 9, 16, 2, "#a07a4a"); px(x + 1, y - 9, 16, 1, "#c89a62");
  }

  function mug(x: number, y: number, t: number) {
    px(x, y - 8, 7, 8, "#d8584a"); px(x, y - 8, 7, 1, "#f07a6a"); px(x + 5, y - 8, 2, 8, "#a8403a"); px(x + 7, y - 6, 2, 4, "#a8403a"); px(x + 7, y - 5, 1, 2, "#2a1b1c");
    px(x + 1, y - 7, 4, 1, "#3a2016");
    if (still) return;
    for (let i = 0; i < 4; i++) {
      const k = (t * 5 + i * 3) % 12;
      px(x + 2 + Math.round(Math.sin(t * 2 + i) * 1.5), y - 10 - k, 1, 2, `rgba(255,236,226,${0.45 - k / 28})`);
    }
  }

  let catHover = 0;
  function cat(x: number, y: number, t: number) {
    const tilt = Math.round(Math.sin(t * 0.4) * 0.4 + catHover);
    CAT.forEach((row, r) => {
      const off = r <= 10 ? tilt : 0;
      let start = -1;
      for (let c = 0; c <= row.length; c++) {
        if (row[c] === "#" && start < 0) start = c;
        if (row[c] !== "#" && start >= 0) {
          const end = c - 1;
          px(x + start + off, y + r, end - start + 1, 1, "#231923");
          px(x + start + off, y + r, 1, 1, "#33263a");
          px(x + end + off, y + r, 1, 1, "#ff9a5c");
          if (end - start > 2) px(x + end - 1 + off, y + r, 1, 1, "#7a4036");
          start = -1;
        }
      }
      if (r === 4) px(x + 3 + off, y + r, 14, 1, "#2e2232");
    });
    px(x + 5 + tilt, y + 2, 1, 2, "#4a2e34");
    px(x + 14 + tilt, y + 2, 1, 2, "#c46a48");
    if (!still && (Math.sin(t * 0.9) > 0.97 || catHover > 0.5)) px(x + 16 + tilt, y - 1, 1, 1, "#231923");
    const sw = Math.sin(t * (1.5 + catHover * 3)) * 2.5;
    TAIL.forEach(([tx, ty], i) => {
      const k = i / (TAIL.length - 1), dx = Math.round(sw * k * k), dy = Math.round(-Math.abs(sw) * k * k * 0.4);
      px(x + tx + dx, y + ty + dy, 2, 2, "#231923");
      px(x + tx + dx + 1, y + ty + dy, 1, 1, i > 3 ? "#ff9a5c" : "#3a2a34");
    });
  }

  // A floral pillow in the corner, in shadow.
  function pillow() {
    const y0 = H - 16;
    const topAt = (x: number) => y0 + Math.round(Math.pow(x / 120, 2.2) * 22 - Math.sin(x * 0.05) * 3);
    for (let x = 0; x < 120; x++) { const top = topAt(x); px(x, top, 1, H - top, "#4a3a44"); px(x, top, 1, 1, "#6a5260"); }
    seed = 77;
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 110, y = y0 + 4 + rnd() * 20;
      if (y < topAt(x) + 2) continue;
      const c = rnd() < 0.5 ? "#8a4a5a" : "#6a5a3a";
      px(x, y, 2, 1, c); px(x, y - 1, 1, 1, c);
    }
  }

  function dust(t: number) {
    const { wx, wy } = L;
    for (const m of motes) {
      const y = (m.y + t * (1 + m.s * 2)) % H, x = m.x + Math.sin(t * 0.6 + m.s * 9) * 3 - (y - wy) * 0.9;
      if (x < 0 || x > wx) continue;
      px(x, y, 1, 1, `rgba(255,214,160,${0.15 + 0.45 * Math.abs(Math.sin(t * 0.8 + m.s * 10))})`);
    }
  }

  const mouse = { x: -1, y: -1 };
  const onMove = (e: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - box.left) / box.width) * W;
    mouse.y = ((e.clientY - box.top) / box.height) * H;
  };

  function draw(ms: number) {
    const t = still ? 0 : ms / 1000;
    const { wx, ww, sill } = L;
    room();
    view(t);
    frameAndCurtain(t);
    books(wx + ww - 30, sill);
    plant(wx + ww - 58, sill, t);
    mug(wx + 8, sill, t);
    const cx = wx + Math.round(ww * 0.4), cy = sill - CAT.length;
    const over = mouse.x > cx - 4 && mouse.x < cx + 34 && mouse.y > cy - 4 && mouse.y < sill + 2;
    catHover += ((over ? 1 : 0) - catHover) * 0.1;
    cat(cx, cy, t);
    if (!L.portrait) pillow();
    if (!still) dust(t);
  }

  let raf = 0;
  let visible = true;
  const loop = (ms: number) => {
    draw(ms);
    raf = visible && !still ? requestAnimationFrame(loop) : 0;
  };
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf && !still) raf = requestAnimationFrame(loop);
  });
  const resize = new ResizeObserver(() => {
    layout();
    draw(performance.now());
  });
  layout();
  draw(0);
  seen.observe(canvas);
  resize.observe(canvas);
  if (!still) {
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  return () => {
    cancelAnimationFrame(raf);
    seen.disconnect();
    resize.disconnect();
    window.removeEventListener("pointermove", onMove);
  };
}
