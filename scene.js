/* Ghost Signal · cinematic arrival (branch wake-up, Nov 15 2026).
   Tap a machine on the map -> ~6 s directed sequence, then straight into its case (openRobot):
     a. contact, not a landing: the map push-in hands off to the machine's picture being RECEIVED (static -> coarse pass ->
        fine pass, line by line, like a Deep Space Network downlink) while the uplink carrier sweeps and locks
     b. establishing: multi-plane parallax dolly (ground / shadow / machine move at different speeds), letterbox,
        grain, vignette; the machine is dark and silent; "Silent for N years" types in like telemetry
     c. signs of life: relay click, stutter flicker of its real lights at their real positions (rigs.js),
        colour floods back, light spill on the ground, power-up sound (wake-audio.js, music ducked),
        a small breath, and the real thing it does as a light pass on the painting + its own sound: lidar, laser
        stripes, Viking's dish slewing, Pancams looking at you, Apollo telemetry blinks, seismometer rings, rotor;
        then its answer leaves the antenna and crosses back to Earth
     d. handoff: openRobot(r) opens the case; the scene stays alive behind it (dimmed).
   Skip: tap anywhere, Space, Enter or Esc during the sequence. After the handoff: Esc, browser Back or
   "Map" go back to the map; "Next machine" runs the same sequence for the next machine on that body.
   Solved machines arrive already lit (no dark phase). prefers-reduced-motion: a short fade, no motion.
   Performance: only transform/opacity animate (WAAPI), one pair of canvases for light FX, no animated filters.
   Public: window.GS_scene = { enter, leave, next }, window.GS_scenePower(id, on). #site=<id> deep links. */
(() => {
  const S = {
    en: { next: "Next machine", map: "Map", skip: "Skip", silent: "Silent for", y: ["year", "years"], mo: ["month", "months"], d: ["day", "days"],
      left: "Left on", moon: "the Moon", mars: "Mars", search: "Searching for its signal", power: "Power rising", lock: "Signal acquired", back: "Brought back · already awake",
      credit: "Painted from NASA photos · AI-assisted",
      ping: "Earth calling · Deep Space Network", lt: "light-time", fast: "shown sped up", earth: "EARTH", listen: "Listening", carrier: "Faint carrier", hello: "…hello? … Earth?" },
    es: { next: "Siguiente máquina", map: "Mapa", skip: "Saltar", silent: "En silencio desde hace", y: ["año", "años"], mo: ["mes", "meses"], d: ["día", "días"],
      left: "Dejado en", moon: "la Luna", mars: "Marte", search: "Buscando su señal", power: "Subiendo energía", lock: "Señal captada", back: "De vuelta · ya despierto",
      credit: "Pintado a partir de fotos de la NASA · con ayuda de IA",
      ping: "La Tierra llama · Red de Espacio Profundo", lt: "a la velocidad de la luz", fast: "acelerado", earth: "TIERRA", listen: "Escuchando", carrier: "Portadora débil", hello: "…¿hola? … ¿Tierra?" },
  };
  const s = (k) => (S[lang] || S.en)[k];
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const OUT = "cubic-bezier(.16,.84,.3,1)", IN = "cubic-bezier(.55,0,.85,.4)", SETTLE = "cubic-bezier(.3,1.45,.5,1)";
  const TS = Math.max(0.1, +(new URLSearchParams(location.search).get("slow") || 1)); /* test only: ?slow=4 plays the sequence 4x slower for frame checks */
  const BOXES = {};
  fetch("assets/layers/scenes.json").then((r) => r.json()).then((j) => Object.entries(j).forEach(([k, v]) => (BOXES[k] = v.machine_box))).catch(() => {});

  let curId = null, phase = "off", pushed = false, powered = {}, timers = [], anims = [], quietClose = false, runId = 0;

  /* ---------- DOM ---------- */
  const root = document.createElement("section");
  root.id = "scene"; root.className = "sc"; root.hidden = true;
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "false");
  root.innerHTML = `
    <div class="sc-shake"><div class="sc-cam"><div class="sc-frame">
      <div class="pl pl-ground"><img class="g" alt="" draggable="false"></div>
      <div class="sc-dark"></div>
      <div class="pl pl-mach"><div class="mach">
        <canvas class="fx fx-under"></canvas>
        <img class="m m-lit" alt="" draggable="false">
        <div class="lights"></div>
        <canvas class="fx fx-over"></canvas>
      </div></div>
      <canvas class="sc-rx"></canvas>
    </div></div></div>
    <div class="sc-vig"></div><div class="sc-grain"></div>
    <div class="sc-bar t"></div><div class="sc-bar b"></div>
    <div class="sc-hud">
      <div class="h-k"></div>
      <h1 class="h-n"></h1>
      <div class="h-s"></div>
      <div class="h-st"><i></i><span></span></div>
      <div class="h-voice" aria-live="polite"></div>
      <div class="h-note"></div>
    </div>
    <button class="sc-skip" type="button"><span class="l"></span> <span aria-hidden="true">›</span></button>
    <div class="sc-dock">
      <button class="d-map" type="button"><span aria-hidden="true">←</span> <span class="l"></span></button>
      <button class="d-next" type="button"><span class="l"></span> <span aria-hidden="true">→</span></button>
    </div>`;
  document.body.appendChild(root);
  if (TS !== 1) root.style.setProperty("--ts", TS);
  const q = (c) => root.querySelector(c);
  const frame = q(".sc-frame"), cam = q(".sc-cam"), shake = q(".sc-shake"), mach = q(".mach"), lights = q(".lights");
  const cUnder = q(".fx-under"), cOver = q(".fx-over");
  (function grain() { /* film grain: one small noise tile, moved by a stepped transform (composited) */
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), d = g.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); q(".sc-grain").style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ---------- data ---------- */
  const robot = (id) => robots.find((r) => r.id === id);
  const rig = (id) => (window.GS_RIGS || {})[id] || { heart: { x: 50, y: 20, c: "#d8ff6a" }, foot: { x: 50, y: 88, w: 60 }, lamps: [], fx: [] };
  const L = (id) => ({ g: `assets/wake/scene/${id}-dark.webp`, m: `assets/wake/scene/${id}.webp` }); /* the cohesive painting (same one the case panel used to show), 2x Lanczos; -dark = pre-baked grey/dim copy. One plane, no cutout edge */
  function order(b) {
    const panels = VISTA[b]; if (!panels) return robots.filter((r) => r.body === b).map((r) => r.id);
    return panels.flatMap((p) => Object.entries(p.pts).sort((a, c) => a[1][0] - c[1][0]).map(([id]) => id)).filter(robot);
  }
  function isSolved(id) {
    if (id in powered) return powered[id];
    try { return !!JSON.parse(localStorage.getItem("ghostsignal.v1"))?.solved?.[id]; } catch { return false; }
  }
  const cache = {};
  function preload(id) {
    if (cache[id]) return cache[id];
    return (cache[id] = Promise.all(Object.values(L(id)).map((src) => { const i = new Image(); i.src = src; return i.decode ? i.decode().catch(() => {}) : Promise.resolve(); })));
  }
  const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
  const later = (fn, ms) => { const k = setTimeout(fn, ms * TS); timers.push(k); return k; };
  const every = (fn, ms) => { const k = setInterval(fn, ms * TS); timers.push(k); return k; };
  const anim = (el, kf, o) => { const a = el.animate(kf, TS === 1 ? o : { ...o, duration: o.duration * TS, delay: (o.delay || 0) * TS }); anims.push(a); return a; };
  function clearRun(finish) { timers.forEach((k) => { clearTimeout(k); clearInterval(k); }); timers = []; anims.forEach((a) => { try { finish ? a.finish() : a.cancel(); } catch {} }); anims = []; }

  /* ---------- framing: one 16:9 box all planes share, so % coords stay glued to the hardware ---------- */
  let geo = null;
  function layout(id) {
    const vw = innerWidth, vh = innerHeight, phone = vw < 760 && vh > vw * 1.1;
    const b = BOXES[id] || [0.2, 0, 0.8, 0.9], R = rig(id), bw = b[2] - b[0];
    const cx = R.focus ? R.focus / 100 : (b[0] + b[2]) / 2, hy = (R.heart?.y ?? 10) / 100, fy = Math.min(b[3], (R.foot?.y ?? 90) / 100 + 0.04), cy = (hy + fy) / 2;
    let sc;
    if (phone) sc = Math.min(vh / 720 * 1.1, Math.max(vw / (bw * 1280) * 1.02, vh * 0.5 / 720, vw / 1280 * 1.08));
    else sc = Math.max(vw / 1280, vh / 720) * 1.04;
    const w = 1280 * sc, h = 720 * sc;
    let left = vw / 2 - cx * w; left = w >= vw ? Math.min(0, Math.max(vw - w, left)) : (vw - w) / 2;
    /* keep the machine's feet above the bottom letterbox: aim the box bottom at ~88% of the screen */
    const barT = phone ? 0 : vh * 0.07;
    let top = phone ? vh * 0.4 - h * 0.5 : Math.min((vh - h) / 2, vh * 0.9 - fy * h);
    top = Math.max(top, barT + vh * 0.06 - hy * h); /* never hide the first light under the letterbox */
    if (h >= vh) top = Math.min(0, Math.max(vh - h, top));
    Object.assign(frame.style, { left: left + "px", top: top + "px", width: w + "px", height: h + "px" });
    const ox = left + cx * w, oy = top + cy * h;
    cam.style.transformOrigin = `${ox}px ${oy}px`;
    root.style.setProperty("--bar-t", Math.max(phone ? top + h * 0.06 : vh * 0.07, 0) + "px");
    root.style.setProperty("--bar-b", Math.max(phone ? vh - top - h * 0.97 : vh * 0.07, 0) + "px");
    root.classList.toggle("phone", phone);
    root.classList.toggle("hud-right", R.hud === "right" && !phone);
    const cw = Math.min(1400, Math.round(w * 0.8)), ch = Math.round(cw * 720 / 1280); /* light FX are soft: 0.8x resolution is invisible and cheap */
    [cUnder, cOver].forEach((c) => { if (c.width !== cw) { c.width = cw; c.height = ch; } });
    geo = { w, h, left, top, ox, oy, phone, cw, ch, k: cw / w };
  }
  addEventListener("resize", () => { if (curId && !root.hidden) layout(curId); });

  /* ---------- light FX canvas (additive), one rAF while anything is drawing ---------- */
  const gU = cUnder.getContext("2d"), gO = cOver.getContext("2d");
  let fx = [], raf = 0;
  const P = (x, y) => [x / 100 * cUnder.width, y / 100 * cUnder.height];
  let odd = false;
  function loop(now) {
    if (phase === "behind" && (odd = !odd)) { raf = requestAnimationFrame(loop); return; } /* half rate while dimmed behind the case */
    gU.clearRect(0, 0, cUnder.width, cUnder.height); gO.clearRect(0, 0, cOver.width, cOver.height);
    gU.globalCompositeOperation = gO.globalCompositeOperation = "lighter";
    fx = fx.filter((f) => { const g = f.over ? gO : gU; g.save(); const keep = f.draw(f.t0 + (now - f.t0) / TS, g, cUnder.width, cUnder.height) !== false; g.restore(); return keep; });
    raf = fx.length && !root.hidden ? requestAnimationFrame(loop) : 0;
  }
  const addFx = (f) => { f.t0 ??= performance.now(); fx.push(f); if (!raf) raf = requestAnimationFrame(loop); return f; };
  const ease = (k) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);
  const hex = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; };

  const FX = {
    spill({ x, y, w, c }) {
      return addFx({ draw(now, g, W, H) {
        const k = ease((now - this.t0) / 1100), [cx, cy] = P(x, y), rx = w / 100 * W / 2;
        g.translate(cx, cy); g.scale(1, 0.22);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, hex(c, 0.42)); gr.addColorStop(0.5, hex(c, 0.14)); gr.addColorStop(1, hex(c, 0));
        g.globalAlpha = k * (0.88 + 0.12 * Math.sin(now / 520)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 7); g.fill();
      } });
    },
    puff({ x, y, w, n = 70, c = "232,200,180", rise = 0.5 }) {
      const ps = Array.from({ length: n }, () => { const a = (Math.random() - 0.5) * Math.PI; return { x: x + (Math.random() - 0.5) * w * 0.5, y: y + (Math.random() - 0.5) * 2, vx: Math.cos(a) * (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 16), vy: -(Math.random() * 5 * rise + 0.5), r: 0.8 + Math.random() * 2.6, a: 0.14 + Math.random() * 0.22 }; });
      return addFx({ over: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000; if (t > 1.8) return false;
        g.globalCompositeOperation = "source-over";
        for (const p of ps) { const d = 1 - Math.exp(-t * 2.4); const px = (p.x + p.vx * d) / 100 * W, py = (p.y + p.vy * d) / 100 * H;
          g.globalAlpha = p.a * Math.max(0, 1 - t / 1.8); g.fillStyle = `rgb(${c})`; g.beginPath(); g.arc(px, py, p.r * (1 + t) * W / 1280, 0, 7); g.fill(); }
      } });
    },
    motes({ c = "255,210,170", n = 26 }) {
      const ps = Array.from({ length: n }, () => ({ x: Math.random() * 100, y: 20 + Math.random() * 75, v: 0.4 + Math.random() * 1.2, r: 0.6 + Math.random() * 1.6, a: 0.06 + Math.random() * 0.16, ph: Math.random() * 7 }));
      return addFx({ over: true, motes: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000, k = Math.min(1, t / 1.5);
        for (const p of ps) { const px = ((p.x + p.v * t * 1.6) % 104 - 2) / 100 * W, py = (p.y + Math.sin(t * 0.8 + p.ph) * 0.8) / 100 * H;
          g.globalAlpha = p.a * k; g.fillStyle = `rgb(${c})`; g.beginPath(); g.arc(px, py, p.r * W / 1280, 0, 7); g.fill(); }
      } });
    },
    sparks({ x, y, c }) {
      const ps = Array.from({ length: 16 }, () => { const a = Math.random() * 7; return { vx: Math.cos(a) * (1 + Math.random() * 3), vy: Math.sin(a) * (1 + Math.random() * 3) - 1.5 }; });
      return addFx({ over: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000; if (t > 0.7) return false;
        const [cx, cy] = P(x, y); g.fillStyle = c;
        for (const p of ps) { g.globalAlpha = 1 - t / 0.7; g.beginPath(); g.arc(cx + p.vx * t * W / 60, cy + (p.vy * t + 3 * t * t) * H / 34, 1.4 * W / 1280, 0, 7); g.fill(); }
      } });
    },
    lidar({ x, y, c }) {
      return addFx({ over: true, draw(now, g, W, H) {
        const t = now - this.t0, [bx, by] = P(x, y), on = Math.floor(t / 83) % 2 === 0, k = Math.min(1, t / 160);
        const reach = by * Math.min(1, t / 260);
        const gr = g.createLinearGradient(bx, by, bx, by - reach); gr.addColorStop(0, hex(c, 1)); gr.addColorStop(1, hex(c, 0));
        const u = W / 1280;
        g.fillStyle = gr; g.globalAlpha = k * (on ? 0.95 : 0.45); g.fillRect(bx - 1.6 * u, by - reach, 3.2 * u, reach);
        g.globalAlpha = k * (on ? 0.3 : 0.12); g.fillRect(bx - 9 * u, by - reach, 18 * u, reach);
        const sp = g.createRadialGradient(bx, by, 0, bx, by, 11 * u); sp.addColorStop(0, "rgba(255,255,255,.95)"); sp.addColorStop(0.35, hex(c, 0.7)); sp.addColorStop(1, hex(c, 0));
        g.globalAlpha = k; g.fillStyle = sp; g.beginPath(); g.arc(bx, by, 11 * u, 0, 7); g.fill(); /* emitter sits ON the turret cap, small and hot */
      } });
    },
    stripes({ x0, x1, y0, y1, n, c }) {
      return addFx({ draw(now, g, W, H) {
        const u = W / 1280;
        for (let i = 0; i < n; i++) {
          const ti = now - this.t0 - i * 140; if (ti < 0) continue;
          const on = Math.floor(ti / 300) % 2 === 0, yy = y0 + (y1 - y0) * i / (n - 1);
          const [ax, ay] = P(x0 - i * 1.5, yy), [bx, by] = P(x1 + i * 1.5, yy + 0.6);
          g.globalAlpha = on ? 0.95 : 0.1; g.strokeStyle = c; g.lineWidth = 2.4 * u; g.shadowColor = c; g.shadowBlur = 12 * u;
          g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
          g.globalAlpha *= 0.35; g.lineWidth = 9 * u; g.stroke();
        }
      } });
    },
    pulses({ pts, c }) {
      const segs = pts.slice(1).map((p, i) => [pts[i], p]);
      return addFx({ over: true, draw(now, g, W, H) {
        const t = Math.max(0, (now - this.t0) / 1000); /* rAF time can be a hair before t0: a negative t indexed past the cable */
        for (let j = 0; j < 3; j++) { const k = ((t * 0.9 + j / 3) % 1), f = k * segs.length, si = Math.floor(f), [a, b] = segs[si], u = f - si;
          const [x, y] = P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u), r = 9 * W / 1280;
          const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hex(c, 0.95)); gr.addColorStop(1, hex(c, 0));
          g.globalAlpha = Math.min(1, t * 2); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      } });
    },
    panels({ x0, x1, y0, y1 }) {
      const rows = 4;
      return addFx({ over: true, draw(now, g, W, H) {
        const t = now - this.t0;
        for (let i = 0; i < rows; i++) { const ti = t - i * 160; if (ti < 0) continue;
          const k = Math.min(1, ti / 380), a = k < 1 ? k * 0.32 : 0.06 + 0.26 * Math.exp(-(ti - 380) / 500);
          const yy = y0 + (y1 - y0) * (i + 0.5) / rows, [lx, ly] = P(x0, yy), [rx] = P(x1, yy), hh = (y1 - y0) / rows / 100 * H * 0.55;
          const gr = g.createLinearGradient(lx, 0, rx, 0); gr.addColorStop(0, "rgba(140,200,255,0)"); gr.addColorStop(0.2, "rgba(150,210,255,1)"); gr.addColorStop(0.8, "rgba(150,210,255,1)"); gr.addColorStop(1, "rgba(140,200,255,0)");
          g.globalAlpha = a; g.fillStyle = gr; g.fillRect(lx, ly - hh / 2, rx - lx, hh);
        }
      } });
    },
    dust({ x0, x1, y }) {
      const ps = Array.from({ length: 60 }, () => ({ x: x0 + Math.random() * (x1 - x0), y: y + (Math.random() - 0.5) * 6, vx: 6 + Math.random() * 14, vy: -(1 + Math.random() * 5), r: 0.6 + Math.random() * 1.8, a: 0.15 + Math.random() * 0.25, d: Math.random() * 400 }));
      return addFx({ over: true, draw(now, g, W, H) {
        const t0 = now - this.t0; if (t0 > 2600) return false;
        g.globalCompositeOperation = "source-over"; g.fillStyle = "rgb(214,150,110)";
        for (const p of ps) { const t = Math.max(0, t0 - p.d) / 1000; if (!t) continue;
          g.globalAlpha = p.a * Math.max(0, 1 - t / 2); g.beginPath(); g.arc((p.x + p.vx * t) / 100 * W, (p.y + p.vy * t) / 100 * H, p.r * W / 1280, 0, 7); g.fill(); }
      } });
    },
    glint({ x0, x1, y0, y1, c }) {
      return addFx({ over: true, draw(now, g, W, H) {
        const k = (now - this.t0) / 900; if (k > 1) return false;
        const e = ease(k), [x, y] = P(x0 + (x1 - x0) * e, y0 + (y1 - y0) * (0.5 + 0.2 * Math.sin(e * 3))), r = (x1 - x0) / 100 * W * 0.22;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},.75)`); gr.addColorStop(1, `rgba(${c},0)`);
        g.globalAlpha = Math.sin(k * Math.PI); g.translate(x, y); g.scale(1, 0.5); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      } });
    },
    rotor({ x, ys, span }) {
      return addFx({ over: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000, sp = Math.min(1, t / 1.8), u = W / 1280;
        ys.forEach((y, i) => {
          const [cx, cy] = P(x, y), rx = span / 100 * W, ry = rx * 0.07, ang = (i ? -1 : 1) * t * (0.6 + sp * 5);
          g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
          g.globalAlpha = 0.1 + 0.12 * sp; g.strokeStyle = "rgba(255,226,196,1)"; g.lineWidth = 3 * u * rx / ry;
          for (let b = 0; b < 2; b++) { const a0 = ang + b * Math.PI; g.beginPath(); g.arc(0, 0, rx * 0.97, a0, a0 + 0.35 + sp * 0.9); g.stroke(); }
          g.restore();
        });
      } });
    },
  };

  /* ---------- reactions: light passes that follow the REAL painted surface (no cutouts, no shapes pasted on top) ----------
     sheen(): a once-per-shot map of the painting's own highlights inside an ellipse (crinkled foil, dish metal),
     so moving light can brighten exactly the crinkles/edges the painter put there. */
  function sheenMap(cx, cy, rx, ry, W, H, { lo = 0.42, tint = [236, 244, 255], soft = 0.18 } = {}) {
    const img = q(".m-lit"); if (!img.naturalWidth) return null;
    const x0 = Math.max(0, Math.floor((cx - rx) / 100 * W)), y0 = Math.max(0, Math.floor((cy - ry) / 100 * H));
    const w = Math.min(W - x0, Math.ceil(rx * 2 / 100 * W)), h = Math.min(H - y0, Math.ceil(ry * 2 / 100 * H));
    if (w < 4 || h < 4) return null;
    const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
    const sx = img.naturalWidth / W, sy = img.naturalHeight / H;
    try { g.drawImage(img, x0 * sx, y0 * sy, w * sx, h * sy, 0, 0, w, h); const d = g.getImageData(0, 0, w, h), a = d.data;
      const ex = cx / 100 * W - x0, ey = cy / 100 * H - y0, erx = rx / 100 * W, ery = ry / 100 * H;
      for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
        const L = (a[i] * 0.3 + a[i + 1] * 0.55 + a[i + 2] * 0.15) / 255, v = Math.pow(Math.max(0, (L - lo) / (1 - lo)), 1.3);
        const e = ((x - ex) / erx) ** 2 + ((y - ey) / ery) ** 2, m = e >= 1 ? 0 : e <= 1 - soft ? 1 : (1 - e) / soft;
        a[i] = tint[0]; a[i + 1] = tint[1]; a[i + 2] = tint[2]; a[i + 3] = Math.min(255, v * m * 330);
      }
      g.putImageData(d, 0, 0);
    } catch { return null; }
    return { c, x0, y0, w, h, W };
  }
  const scratch = document.createElement("canvas"), sg = scratch.getContext("2d");
  function throughSheen(g, sh, paintMask, alpha) { /* mask (drawn by paintMask into sheen-local coords) x sheen highlights -> added onto g */
    if (scratch.width !== sh.w || scratch.height !== sh.h) { scratch.width = sh.w; scratch.height = sh.h; } else sg.clearRect(0, 0, sh.w, sh.h);
    sg.globalCompositeOperation = "source-over"; sg.globalAlpha = 1; paintMask(sg); sg.globalCompositeOperation = "source-in"; sg.drawImage(sh.c, 0, 0);
    g.globalAlpha = alpha; g.drawImage(scratch, sh.x0, sh.y0);
  }
  Object.assign(FX, {
    /* seismometer: soft rings spreading over the ground plane from the instrument, foreshortened to the footprint,
       lighting the foil crinkles they pass (sheen) and fading with distance. Strong on wake, then a slow heartbeat. */
    quake({ x, y, cx, cy, rx, ry, r0 = 6, sheen = false }) {
      let sh = null;
      return addFx({ over: true, keep: true, draw(now, g, W, H) {
        if (sheen && (!sh || sh.W !== W)) sh = sheenMap(cx, cy, rx, ry, W, H);
        const t = (now - this.t0) / 1000, u = W / 1280, ox = x / 100 * W, oy = y / 100 * H, asp = (ry / 100 * H) / (rx / 100 * W);
        const Rmax = rx / 100 * W * 1.15, R0 = r0 / 100 * W;
        const rings = [];
        for (let i = 0; i < 3; i++) { const k = (t - i * 0.42) / 1.9; if (k > 0 && k < 1) rings.push([k, 1 - 0.25 * i]); } /* the wake: three strong rings */
        if (t > 2.6) { const k = ((t - 2.6) % 3.4) / 2.4; if (k < 1) rings.push([k, 0.42]); } /* then a quiet heartbeat */
        if (!rings.length) return;
        const paint = (c2, dx, dy, a) => { rings.forEach(([k, amp]) => {
          const e = ease(k), R = R0 + (Rmax - R0) * e, bw = (26 + 40 * e) * u;
          c2.save(); c2.translate(ox - dx, oy - dy); c2.scale(1, asp);
          const gr = c2.createRadialGradient(0, 0, Math.max(0, R - bw), 0, 0, R + bw);
          const f = amp * Math.pow(1 - k, 1.4) * a; gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(255,255,255,${f})`); gr.addColorStop(1, "rgba(255,255,255,0)");
          c2.fillStyle = gr; c2.beginPath(); c2.arc(0, 0, R + bw, 0, 7); c2.fill(); c2.restore(); }); };
        if (sh) throughSheen(g, sh, (c2) => paint(c2, sh.x0, sh.y0, 1), 1);
        /* a faint cool light on the ground itself, clipped to the footprint so nothing floats past the skirt/sand */
        g.save(); g.beginPath(); g.ellipse(cx / 100 * W, cy / 100 * H, rx / 100 * W, ry / 100 * H, 0, 0, 7); g.clip();
        g.globalAlpha = sheen ? 0.10 : 0.16; g.globalCompositeOperation = "lighter";
        const tmp = g.fillStyle; paint(g, 0, 0, 1); g.restore(); g.fillStyle = tmp;
      } });
    },
    /* Viking's high-gain dish slews toward Earth: its reflection sweeps across the real dish, overshoots, settles */
    dish({ x, y, rx, ry }) {
      let sh = null;
      return addFx({ over: true, draw(now, g, W, H) {
        if (!sh || sh.W !== W) sh = sheenMap(x, y, rx, ry, W, H, { lo: 0.3, tint: [255, 246, 228], soft: 0.08 });
        const t = (now - this.t0) / 1000; if (t > 3.4) return false; if (!sh) return;
        const pos = t < 1.5 ? ease(t / 1.5) * 1.12 : 1.12 - 0.12 * ease((t - 1.5) / 0.6); /* slew, overshoot, settle */
        const a = Math.min(1, t / 0.25) * (t > 2.6 ? Math.max(0, 1 - (t - 2.6) / 0.8) : 1);
        throughSheen(g, sh, (c2) => { const bx = (-0.35 + 1.5 * pos) * sh.w, bw = sh.w * 0.32;
          c2.save(); c2.translate(bx, 0); c2.transform(1, 0, -0.5, 1, 0, 0);
          const gr = c2.createLinearGradient(-bw, 0, bw, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
          c2.fillStyle = gr; c2.fillRect(-bw, 0, bw * 2 + sh.h, sh.h); c2.restore(); }, 0.85 * a);
      } });
    },
    /* a camera turns to look at you: its lens catches the light (star glint), focuses twice, settles to a small idle glint */
    look({ x, y, pan = 1, small = false }) {
      return addFx({ over: true, keep: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000, u = W / 1280 * (small ? 0.7 : 1);
        const drift = pan * 0.5 * (1 - ease(t / 0.9)), [cx, cy] = P(x + drift, y);
        const lv = t < 0.9 ? 0.25 * ease(t / 0.9) : t < 1.6 ? 0.25 + 0.75 * Math.sin((t - 0.9) / 0.7 * Math.PI) * (t < 1.25 ? 1 : 0.8) : 0.22 + 0.06 * Math.sin(t * 2);
        const core = g.createRadialGradient(cx, cy, 0, cx, cy, 16 * u); core.addColorStop(0, "rgba(255,255,255,1)"); core.addColorStop(0.3, "rgba(200,232,255,.55)"); core.addColorStop(1, "rgba(160,210,255,0)");
        g.globalAlpha = lv; g.fillStyle = core; g.beginPath(); g.arc(cx, cy, 16 * u, 0, 7); g.fill();
        [[1, 0.06], [0.06, 1]].forEach(([sx, sy]) => { g.save(); g.translate(cx, cy); g.scale(sx, sy);
          const st = g.createRadialGradient(0, 0, 0, 0, 0, 46 * u); st.addColorStop(0, "rgba(255,255,255,.9)"); st.addColorStop(1, "rgba(200,232,255,0)");
          g.globalAlpha = lv * 0.9; g.fillStyle = st; g.beginPath(); g.arc(0, 0, 46 * u, 0, 7); g.fill(); g.restore(); });
        if (t > 0.9 && t < 1.7) { const k = (t - 0.9) / 0.8; g.globalAlpha = (1 - k) * 0.7; g.strokeStyle = "rgba(200,232,255,1)"; g.lineWidth = 1.4 * u; g.beginPath(); g.arc(cx, cy, (22 - 14 * ease(k)) * u, 0, 7); g.stroke(); }
      } });
    },
    /* Apollo telemetry: the status light blinks out a data word as the station starts talking */
    telemetry({ x, y, c = "#d8ff6a" }) {
      const bits = "1101001110101100";
      return addFx({ over: true, draw(now, g, W, H) {
        const t = now - this.t0, i = Math.floor(t / 70); if (i >= bits.length) return false; if (bits[i] !== "1") return;
        const [cx, cy] = P(x, y), r = 20 * W / 1280, gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, hex(c, 0.7)); gr.addColorStop(1, hex(c, 0));
        g.globalAlpha = 0.95; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
      } });
    },
  });

  /* ---------- the arrival: the picture is RECEIVED, not landed on. Static, then a coarse pass, then the fine pass
     line by line, the way a spacecraft picture comes down a Deep Space Network dish. One 320x180 canvas, scaled up. ---------- */
  const rx = q(".sc-rx"), rg = rx.getContext("2d"); let rxRaf = 0;
  const RXW = 320, RXH = 180; rx.width = RXW; rx.height = RXH;
  const noiseTile = (() => { const c = document.createElement("canvas"); c.width = RXW; c.height = RXH * 2; const g = c.getContext("2d"), d = g.createImageData(RXW, RXH * 2);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.pow(Math.random(), 2.2) * 210, row = ((i / 4 / RXW) | 0) % 2 ? 0.78 : 1; d.data[i] = v * 0.86 * row; d.data[i + 1] = v * 0.84 * row; d.data[i + 2] = v * row + 8; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); return c; })();
  function rxStop() { cancelAnimationFrame(rxRaf); rxRaf = 0; rx.style.opacity = "0"; rx.getAnimations().forEach((a) => a.cancel()); }
  function downlink(lit, ms, done) {
    rxStop();
    const src = lit ? q(".m-lit") : q(".g"), lo = document.createElement("canvas"); lo.width = 48; lo.height = 27;
    const co = document.createElement("canvas"); co.width = RXW; co.height = RXH; const cg = co.getContext("2d");
    let coarse = false; /* the coarse pass is made from the same painting, once it has decoded */
    const mkCoarse = () => { if (coarse || !src.complete || !src.naturalWidth) return; try { lo.getContext("2d").drawImage(src, 0, 0, 48, 27); cg.imageSmoothingEnabled = false; cg.drawImage(lo, 0, 0, RXW, RXH); coarse = true; } catch {} };
    rx.style.opacity = "1";
    const t0 = performance.now(); let locked = false;
    const step = (now) => {
      mkCoarse(); const t = (now - t0) / TS, kc = Math.min(1, t / (ms * 0.5)), kf = Math.min(1, Math.max(0, (t - ms * 0.28) / (ms * 0.72)));
      const yc = Math.round(ease(kc) * RXH), yf = Math.round(kf * kf * (3 - 2 * kf) * RXH);
      rg.clearRect(0, 0, RXW, RXH); rg.globalAlpha = 1;
      if (yc < RXH) rg.drawImage(noiseTile, 0, (Math.random() * RXH) | 0, RXW, RXH - yc, 0, yc, RXW, RXH - yc);
      if (!coarse && yc > yf) rg.drawImage(noiseTile, 0, (Math.random() * RXH) | 0, RXW, yc - yf, 0, yf, RXW, yc - yf);
      else for (let y = yf; y < yc; y += 3) { const dx = Math.random() < 0.1 ? ((Math.random() - 0.5) * 16) | 0 : 0; rg.drawImage(co, 0, y, RXW, 3, dx, y, RXW, 3); }
      if (yc < RXH) { rg.fillStyle = "rgba(170,215,255,.55)"; rg.fillRect(0, yc, RXW, 1); }
      if (yf > 0 && yf < RXH) { rg.fillStyle = "rgba(230,255,205,.85)"; rg.fillRect(0, yf - 1, RXW, 1); rg.fillStyle = "rgba(216,255,62,.18)"; rg.fillRect(0, yf - 6, RXW, 5); }
      if (kf >= 1) { if (!locked) { locked = true; rxRaf = 0; anim(rx, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-out", fill: "forwards" }); done && done(); } return; }
      rxRaf = requestAnimationFrame(step);
    };
    rxRaf = requestAnimationFrame(step);
  }

  /* contact from Earth: where Earth sits in this painting's sky (the corner away from the machine) */
  const earthAt = (R) => { /* below the top letterbox, inside the visible part of the frame (phones crop the 16:9 frame) */
    const v0 = geo ? Math.max(0, -geo.left / geo.w * 100) : 0, v1 = geo ? Math.min(100, (innerWidth - geo.left) / geo.w * 100) : 100;
    const left = (R.heart?.x ?? 50) > 50, pad = (v1 - v0) * 0.12;
    return { x: left ? v0 + pad : v1 - pad, y: geo?.phone ? 12 : 17 };
  };
  Object.assign(FX, {
    earth({ x, y, mars }) { /* Moon: Earth hangs in the black sky. Mars: Earth is a small blue evening star */
      return addFx({ over: true, earth: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000, k = Math.min(1, t / 0.8), u = W / 1280, [cx, cy] = P(x, y), r = (mars ? 2.2 : 9) * u;
        const halo = g.createRadialGradient(cx, cy, 0, cx, cy, r * (mars ? 9 : 3.2)); halo.addColorStop(0, "rgba(140,190,255,.55)"); halo.addColorStop(1, "rgba(140,190,255,0)");
        g.globalAlpha = k * (this.fade ?? 1); g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, r * (mars ? 9 : 3.2), 0, 7); g.fill();
        const disc = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx, cy, r); disc.addColorStop(0, "#eaf4ff"); disc.addColorStop(0.55, "#5b8fe0"); disc.addColorStop(1, "#1d3f8a");
        g.fillStyle = disc; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
        g.globalCompositeOperation = "source-over"; g.globalAlpha = k * 0.75 * (this.fade ?? 1); g.fillStyle = "#cfe2ff";
        g.font = `600 ${Math.round(10.5 * u)}px ui-monospace,monospace`; g.textAlign = x > 50 ? "right" : "left";
        g.fillText(s("earth"), cx + (x > 50 ? -1 : 1) * r * (mars ? 5 : 2.2), cy + 4 * u);
      } });
    },
    beam({ from, to, ms, c = "#bfe6ff", onArrive }) { /* the signal: a hot head with a fading trail along a gentle arc */
      const [ax, ay] = [from.x, from.y], [bx, by] = [to.x, to.y], mx = (ax + bx) / 2, my = Math.min(ay, by) - 6;
      const at = (k) => [(1 - k) * (1 - k) * ax + 2 * (1 - k) * k * mx + k * k * bx, (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * my + k * k * by];
      let fired = false;
      return addFx({ over: true, draw(now, g, W, H) {
        const t = now - this.t0, k = Math.min(1, t / ms), u = W / 1280;
        if (k >= 1 && !fired) { fired = true; onArrive && onArrive(); }
        const tail = 0.28, fadeOut = k >= 1 ? Math.max(0, 1 - (t - ms) / 350) : 1; if (!fadeOut) return false;
        for (let i = 0; i <= 36; i++) { const kk = k - tail * i / 36; if (kk < 0) break; const [px, py] = P(...at(kk)), a = (1 - i / 36);
          g.globalAlpha = a * a * 0.9 * fadeOut; g.fillStyle = hex(c, 1); g.beginPath(); g.arc(px, py, (1.2 + 2.2 * a) * u, 0, 7); g.fill(); }
        const [hx, hy] = P(...at(k)), gr = g.createRadialGradient(hx, hy, 0, hx, hy, 22 * u); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, hex(c, 0.8)); gr.addColorStop(1, hex(c, 0));
        g.globalAlpha = fadeOut; g.fillStyle = gr; g.beginPath(); g.arc(hx, hy, 22 * u, 0, 7); g.fill();
      } });
    },
    waves({ x, y, c = "#9fe8ff", n = 3, ms = 1300, out = false }) { /* radio rings: arriving (shrinking onto the antenna) or leaving */
      return addFx({ over: true, draw(now, g, W, H) {
        const t = now - this.t0, u = W / 1280, [cx, cy] = P(x, y); if (t > ms + n * 220) return false;
        for (let i = 0; i < n; i++) { const k = (t - i * 220) / ms; if (k < 0 || k > 1) continue;
          const r = (out ? 6 + k * 120 : 120 - k * 114) * u; g.globalAlpha = (out ? 1 - k : k) * 0.85; g.strokeStyle = c; g.lineWidth = 2 * u;
          g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
      } });
    },
    bloom({ x, y, c = "#fff3dc", ms = 700, a = 0.45 }) {
      return addFx({ over: true, draw(now, g, W, H) {
        const k = (now - this.t0) / ms; if (k > 1) return false; const [cx, cy] = P(x, y), r = W * 0.55;
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, hex(c, 1)); gr.addColorStop(0.3, hex(c, 0.35)); gr.addColorStop(1, hex(c, 0));
        g.globalAlpha = a * (k < 0.12 ? k / 0.12 : Math.pow(1 - (k - 0.12) / 0.88, 2)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      } });
    },
    sweep({ ms = 750 }) { /* one glare band crossing the painting as the power arrives */
      return addFx({ over: true, draw(now, g, W, H) {
        const k = (now - this.t0) / ms; if (k > 1) return false; const x = (-0.3 + 1.6 * ease(k)) * W, bw = W * 0.12;
        g.translate(x, 0); g.transform(1, 0, -0.35, 1, 0, 0);
        const gr = g.createLinearGradient(-bw, 0, bw, 0); gr.addColorStop(0, "rgba(255,240,220,0)"); gr.addColorStop(0.5, "rgba(255,240,220,.22)"); gr.addColorStop(1, "rgba(255,240,220,0)");
        g.globalAlpha = Math.sin(k * Math.PI); g.fillStyle = gr; g.fillRect(-bw, 0, bw * 2 + H * 0.4, H);
      } });
    },
    flare({ x, y, c }) { /* anamorphic streak + two ghosts on the line through frame centre; settles to a low idle */
      return addFx({ over: true, flare: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000, u = W / 1280, [cx, cy] = P(x, y);
        const lv = t < 0.25 ? t / 0.25 : 0.32 + 0.68 * Math.exp(-(t - 0.25) * 2.2), br = lv * (0.92 + 0.08 * Math.sin(t * 2.4));
        g.save(); g.translate(cx, cy); g.scale(1, 0.018);
        const st = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.32); st.addColorStop(0, "rgba(255,255,255,.9)"); st.addColorStop(0.2, hex(c, 0.5)); st.addColorStop(1, hex(c, 0));
        g.globalAlpha = br * 0.8; g.fillStyle = st; g.beginPath(); g.arc(0, 0, W * 0.32, 0, 7); g.fill(); g.restore();
        const core = g.createRadialGradient(cx, cy, 0, cx, cy, 30 * u); core.addColorStop(0, "rgba(255,255,255,.95)"); core.addColorStop(0.4, hex(c, 0.35)); core.addColorStop(1, hex(c, 0));
        g.globalAlpha = br; g.fillStyle = core; g.beginPath(); g.arc(cx, cy, 30 * u, 0, 7); g.fill();
        [[0.55, 16, 0.14], [1.35, 34, 0.08]].forEach(([d, r, a]) => { const gx = cx + (W / 2 - cx) * d * 2, gy = cy + (H / 2 - cy) * d * 2;
          const gh = g.createRadialGradient(gx, gy, r * u * 0.6, gx, gy, r * u); gh.addColorStop(0, hex(c, a)); gh.addColorStop(1, hex(c, 0));
          g.globalAlpha = br; g.fillStyle = gh; g.beginPath(); g.arc(gx, gy, r * u, 0, 7); g.fill(); });
      } });
    },
  });
  /* a relay kicking in shows up the way it would on a received picture: a few torn lines of signal, not a camera shake */
  function microShake(px = 4) {
    if (rxRaf || reduce()) return;
    const n = Math.round(2 + px), bands = Array.from({ length: n }, () => [(Math.random() * RXH) | 0, 1 + ((Math.random() * px * 0.8) | 0)]);
    rg.clearRect(0, 0, RXW, RXH); rg.globalAlpha = 0.55; bands.forEach(([y, h]) => rg.drawImage(noiseTile, 0, (Math.random() * RXH) | 0, RXW, h, ((Math.random() - 0.5) * 10) | 0, y, RXW, h));
    rg.globalAlpha = 1; rx.style.opacity = "1"; later(() => { if (!rxRaf) { rg.clearRect(0, 0, RXW, RXH); rx.style.opacity = "0"; } }, 70 + px * 14);
  }
  function lightTime(b) {
    const v = typeof delay !== "undefined" && delay?.[b]?.one_way_seconds;
    if (v) return { s: v, txt: typeof fmt === "function" ? fmt(v) : v.toFixed(2) + " s" };
    return b === "moon" ? { s: 1.28, txt: "1.28 s" } : null;
  }

  /* ---------- lamps (DOM, additive) ---------- */
  const STY = { stutter: "aaamaaazamaamzzzmm", flicker: "mmnmmomzzm", fluoro: "mmamammmmammam" };
  function lamp(L, big) {
    const el = document.createElement("i");
    el.className = "lamp" + (big ? " heart" : "") + (L.kind ? " k-" + L.kind : "");
    el.style.left = L.x + "%"; el.style.top = L.y + "%"; el.style.setProperty("--c", L.c); el.style.setProperty("--r", (L.r || (big ? 2.6 : 1.4)));
    lights.appendChild(el); return el;
  }
  function lightStyle(el, str, step, done) {
    let i = 0;
    const tick = () => { const v = (str.charCodeAt(i) - 97) / 12; el.style.opacity = Math.min(1, v).toFixed(2); if (++i < str.length) later(tick, step); else { el.style.opacity = ""; done && done(); } };
    tick();
  }
  function lampOn(el, L, instant) {
    const on = () => {
      el.classList.add("on");
      if (L.kind === "strobe") { el.classList.add("strobe"); every(() => { el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 110); }, 1000 / (L.hz || 1)); }
      else if (L.kind === "rgb") { const cs = ["#ff2a2a", "#2aff5a", "#3a6bff"]; let i = 0; every(() => el.style.setProperty("--c", cs[++i % 3]), 420); }
      else if (L.kind !== "mirror") el.classList.add("breathe");
    };
    if (instant || reduce()) return on();
    if (L.kind === "mirror") { [0, 330, 660].forEach((d) => later(() => { el.classList.add("on", "flash"); setTimeout(() => el.classList.remove("flash"), 120); GS_wakeAudio?.ui.tick(); }, d)); later(() => el.classList.add("dim"), 900); return; }
    lightStyle(el, STY.flicker, 55, on);
  }

  /* ---------- HUD text ---------- */
  function silentText(id) {
    const p = silentParts(id); if (!p) return "";
    const u = (n, k) => `${n} ${s(k)[n === 1 ? 0 : 1]}`;
    return `${s("silent")} ${u(p.y, "y")}, ${u(p.mo, "mo")}, ${u(p.d, "d")}`;
  }
  function type(el, text, cps = 38) {
    if (reduce()) { el.textContent = text; return; }
    el.textContent = ""; let i = 0;
    const step = () => { i += 1; el.textContent = text.slice(0, i); if (i % 2 === 0) GS_wakeAudio?.ui.tick(); if (i < text.length) later(step, 1000 / cps); };
    step();
  }
  function status(cls, text) { const st = q(".h-st"); st.className = "h-st show " + cls; st.querySelector("span").textContent = text; }
  function fillHud(id, solved) {
    const r = robot(id), yr = (r.landed || "").match(/\d{4}/)?.[0];
    q(".h-k").textContent = ""; q(".h-s").textContent = ""; q(".h-n").textContent = name(r);
    q(".h-st").className = "h-st"; q(".h-note").textContent = ""; q(".h-voice").textContent = ""; q(".h-voice").classList.remove("show");
    root.dataset.k = `${s("left")} ${r.body === "moon" ? s("moon") : s("mars")}${yr ? " · " + yr : ""}`;
    root.dataset.s = solved ? s("back") : silentText(id);
    q(".sc-skip .l").textContent = s("skip");
    q(".d-map .l").textContent = s("map"); q(".d-next .l").textContent = s("next");
    q(".d-next").hidden = order(r.body).length < 2;
    root.setAttribute("aria-label", name(r));
  }

  /* ---------- building one shot ---------- */
  function build(id, lit) {
    clearRun(); rxStop(); fx = []; lights.innerHTML = "";
    const l = L(id);
    q(".g").src = l.g; q(".m-lit").src = l.m;
    layout(id);
    root.classList.toggle("lit", lit); root.classList.remove("behind", "waking", "awake", "show-hud", "show-note", "done");
    root.dataset.body = robot(id).body;
    q(".m-lit").style.clipPath = "";
    [".sc-dark", ".m-lit", ".sc-cam", ".pl-ground", ".pl-mach", ".sc-frame", ".mach", ".sc-hud", ".h-n"].forEach((c) => { const e = q(c); e.getAnimations().forEach((a) => a.cancel()); e.style.opacity = ""; e.style.transform = ""; });
  }
  function startIdle(id, R) {
    if (robot(id).body === "mars" && !reduce()) FX.motes({});
  }
  function lightUp(id, R, instant) {
    const heart = lamp(R.heart, true);
    if (instant) { heart.classList.add("on", "breathe"); R.lamps.forEach((L) => lampOn(lamp(L), L, true)); }
    FX.spill({ x: R.foot.x, y: R.foot.y, w: R.foot.w * 1.25, c: R.spill || "#ffd0a0" });
    const keep = (R.fx || []).filter((f) => ["lidar", "stripes", "quake", "pulses", "rotor", "look"].includes(f.type));
    if (instant) { keep.forEach((f) => FX[f.type](f)); FX.flare({ x: R.heart.x, y: R.heart.y, c: R.heart.c }); }
    return heart;
  }

  /* the sequence. opts: dive (came from the map), fromScene (Next), instant (deep link) */
  async function play(id, { dive = false, fromScene = false } = {}) {
    const my = ++runId, r = robot(id); if (!r) return;
    curId = id; phase = "seq";
    const solved = isSolved(id), R = rig(id), rm = reduce();
    const ready = preload(id);
    document.body.classList.add("sc-going");
    if (dive && window.GS_map && !rm) { GS_wakeAudio?.ui.descend(); await Promise.all([GS_map.dive(id), within(ready, 900)]); }
    else await within(ready, 1200);
    if (my !== runId) return;
    build(id, solved); fillHud(id, solved);
    root.hidden = false; document.body.classList.add("sc-on"); root.classList.add("seq");
    if (!raf && fx.length) raf = requestAnimationFrame(loop);

    if (rm) {
      root.classList.add("lit", "show-hud", "awake"); lightUp(id, R, true); startIdle(id, R);
      q(".h-k").textContent = root.dataset.k; q(".h-s").textContent = root.dataset.s; status("ok", solved ? s("back") : s("lock"));
      anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: "both" });
      later(() => handoff(id), 1500); return;
    }

    /* a. arrival: the camera settles in out of black (no landing thud: nothing lands, Earth is calling) */
    const D = fromScene ? 1000 : 1400, DESC = "cubic-bezier(.22,.7,.3,1)";
    anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: dive ? 90 : 160, easing: "ease-out", fill: "both" });
    anim(cam, [{ transform: "scale(1.06)" }, { transform: "scale(1.0)" }], { duration: D, easing: DESC, fill: "both" });
    if (!dive) GS_wakeAudio?.ui.descend();
    /* nothing lands: the map push-in hands off to the picture being received from the machine, static -> coarse -> fine */
    downlink(solved, fromScene ? 1150 : 1500, () => { if (my === runId) GS_wakeAudio?.ui.rx(); });
    later(() => {
      if (my !== runId) return;
      /* b. establishing: slow dolly over the whole painting, runs to the end of the shot */
      const T = 9000;
      anim(cam, [{ transform: "scale(1)" }, { transform: "scale(1.085)" }], { duration: T, easing: "cubic-bezier(.25,.1,.35,1)", fill: "both" });
      anim(frame, [{ transform: "translateX(0)" }, { transform: "translateX(-0.9%)" }], { duration: T, easing: "ease-in-out", fill: "both" }); /* one painting, one plane: a slow truck, never a cutout sliding over its ground */
      startIdle(id, R);
    }, D - 120);

    root.classList.add("show-hud");
    later(() => type(q(".h-k"), root.dataset.k, 44), fromScene ? 300 : 500);
    anim(q(".h-n"), [{ opacity: 0, transform: "translateY(16px) scale(1.03)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: fromScene ? 600 : 900, easing: OUT, fill: "both" });
    later(() => type(q(".h-s"), root.dataset.s, 40), fromScene ? 1000 : 1400);

    if (solved) {
      /* already brought back: lights on from the first frame, short shot */
      lightUp(id, R, true);
      later(() => { status("ok", s("back")); q(".h-note").textContent = R.note?.[lang] || ""; root.classList.add("show-note"); GS_wakeAudio?.ui.lock(); }, 1700);
      later(() => handoff(id), 3600);
      return;
    }

    /* c. contact. Beat 1: Earth reaches out (DSN ping, real one-way light-time; Mars is shown sped up and says so) */
    const C0 = fromScene ? 1400 : 1700, mars = r.body === "mars", E = earthAt(R), lt = lightTime(r.body);
    const travel = mars ? 1700 : Math.round(Math.min(1.6, Math.max(1.1, lt?.s || 1.28)) * 1000);
    later(() => {
      if (my !== runId) return;
      window.GS_music?.duck(true);
      status("search", `${s("ping")}${lt ? ` · ${lt.txt} ${s("lt")}` : ""}${mars ? ` · ${s("fast")}` : ""}`);
      FX.earth({ x: E.x, y: E.y, mars });
      later(() => {
        if (my !== runId) return;
        GS_wakeAudio?.ui.ping(travel / 1000);
        FX.waves({ x: E.x, y: E.y, c: "#bfe6ff", n: 2, ms: 700, out: true });
        FX.beam({ from: E, to: R.heart, ms: travel, onArrive: () => { if (my === runId) FX.waves({ x: R.heart.x, y: R.heart.y, n: 3, ms: 900 }); } });
      }, 500);
    }, C0);

    /* Beat 2: nothing. The world dips, the music almost goes, we wait... then one faint answer */
    const B2 = C0 + 500 + travel + 250;
    later(() => { if (my !== runId) return; root.classList.add("waking"); status("search", s("listen")); }, B2);
    const FL = B2 + 900;
    later(() => {
      if (my !== runId) return;
      const one = lamp(R.heart, true); lightStyle(one, "aamaaaa", 70, () => one.remove());
      GS_wakeAudio?.ui.flicker(); status("power", s("carrier"));
    }, FL);

    /* Beat 3: the wake cascade */
    const W1 = FL + 650;
    later(() => {
      if (my !== runId) return;
      const cues = GS_wakeAudio?.wake(id) || { chargeEnd: 1.0, chirp: 1.8 };
      microShake(3);
      later(() => microShake(5), (cues.chargeEnd || 1) * 1000);
      status("power", s("power"));
      const heart = lightUp(id, R, false);
      lightStyle(heart, STY.stutter, 62, () => {
        heart.classList.add("on", "breathe"); FX.sparks({ x: R.heart.x, y: R.heart.y, c: R.heart.c });
        FX.flare({ x: R.heart.x, y: R.heart.y, c: R.heart.c }); FX.bloom({ x: R.heart.x, y: R.heart.y, a: 0.32 });
      });
      R.lamps.forEach((L) => later(() => { lampOn(lamp(L), L, false); microShake(1.5); }, 1150 + (L.t || 0)));
      later(() => { root.classList.add("awake"); FX.sweep({}); }, 1250); /* one shared flood for all 11 (Viking's one-off hard wipe is gone) */
      /* the machine physically answers: its real motion as a light pass on the painting + its own sound (wake-audio react) */
      const AT = { glint: 1900, dust: 1250, look: 1500, dish: 1350, telemetry: 1600 };
      (R.fx || []).forEach((f) => { if (FX[f.type]) later(() => FX[f.type](f), AT[f.type] ?? 1400); });
      later(() => GS_wakeAudio?.react?.(id), 1350);
      if ((R.fx || []).some((f) => f.type === "rotor")) later(() => FX.puff({ x: R.foot.x, y: R.foot.y, w: R.foot.w * 1.3, n: 50, c: "214,150,112", rise: 0.2 }), 2000);
      later(() => { /* breath: a small settle with overshoot, like a motor finding its load */
        anim(mach, [{ transform: "scale(1)" }, { transform: "scale(1.012)", offset: 0.35 }, { transform: "scale(.998)", offset: 0.7 }, { transform: "scale(1)" }], { duration: 1500, easing: "ease-in-out" });
      }, 1400);
      later(() => { const v = q(".h-voice"); v.classList.add("show"); type(v, s("hello"), 16);
        /* its answer goes home: the reply leaves its antenna and crosses the sky back to Earth */
        GS_wakeAudio?.answer?.(id);
        FX.waves({ x: R.heart.x, y: R.heart.y, c: "#d8ff6a", n: 2, ms: 700, out: true });
        FX.beam({ from: R.heart, to: E, ms: 850, c: "#d8ff6a" });
      }, 1900);
      later(() => { status("ok", s("lock")); GS_wakeAudio?.ui.lock(); q(".h-note").textContent = R.note?.[lang] || ""; root.classList.add("show-note"); fx.forEach((f) => { if (f.earth) f.fade = 0.35; }); }, 2800);
      later(() => handoff(id), 3600);
    }, W1);
  }

  /* d. handoff: open the case with the scene alive behind it */
  function handoff(id) {
    if (curId !== id || phase !== "seq") return;
    phase = "behind";
    root.classList.remove("seq", "waking"); root.classList.add("behind", "awake", "done");
    q(".m-lit").style.clipPath = ""; q(".sc-dark").style.clipPath = "";
    setTimeout(() => window.GS_music?.duck(false), 900);
    const r = robot(id); if (r) { quietClose = true; openRobot(r); quietClose = false; }
    q(".d-next").focus?.({ preventScroll: true });
  }

  function skip() {
    if (phase !== "seq" || !curId) return;
    const id = curId, R = rig(id);
    clearRun(true); runId++; rxStop();
    root.classList.add("lit", "awake", "show-hud", "show-note");
    q(".h-k").textContent = root.dataset.k; q(".h-s").textContent = root.dataset.s; status("ok", isSolved(id) ? s("back") : s("lock"));
    q(".h-note").textContent = R.note?.[lang] || "";
    fx = fx.filter((f) => f.motes); lights.innerHTML = ""; lightUp(id, R, true);
    if (!fx.some((f) => f.motes)) startIdle(id, R);
    q(".m-lit").style.clipPath = ""; q(".sc-dark").style.clipPath = "";
    window.GS_music?.duck(false);
    phase = "seq"; handoff(id);
  }

  /* ---------- enter / leave / next ---------- */
  function enter(id, { push = true, instant = false } = {}) {
    const r = robot(id); if (!r) return;
    if (phase !== "off") return;
    if (body !== r.body) switchBody(r.body);
    if (push) { history.pushState({ site: id }, "", "#site=" + id); pushed = true; }
    play(id, { dive: !instant });
  }

  async function leave({ fromPop = false } = {}) {
    if (phase === "off" || phase === "leaving") return;
    const id = curId;
    if (!fromPop && pushed) { pushed = false; history.back(); return; }
    phase = "leaving"; runId++;
    if (!fromPop) history.replaceState(null, "", location.pathname + location.search);
    pushed = false;
    const sh = document.getElementById("sheet"); if (sh?.classList.contains("open")) { quietClose = true; document.getElementById("closeSheet").click(); quietClose = false; }
    window.GS_music?.duck(false); GS_wakeAudio?.stopHum(0.8);
    document.body.classList.remove("sc-going");
    const back = window.GS_map && !reduce() ? GS_map.restore(id) : Promise.resolve();
    if (!reduce()) anim(q(".sc-frame"), [{ transform: "none" }, { transform: "translateY(-5%) scale(1.3)" }], { duration: 560, easing: IN, fill: "forwards" });
    const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce() ? 250 : 520, easing: "ease-in", fill: "forwards" });
    await fade.finished.catch(() => {});
    clearRun(); fx = []; lights.innerHTML = "";
    root.hidden = true; document.body.classList.remove("sc-on"); fade.cancel();
    root.classList.remove("behind", "seq", "awake", "lit", "done");
    await back;
    document.getElementById("g-" + id)?.focus({ preventScroll: true });
    curId = null; phase = "off";
  }

  function next(dir = 1) {
    if (!curId || phase === "leaving" || phase === "off") return;
    const list = order(robot(curId).body); if (list.length < 2) return;
    const id = list[(list.indexOf(curId) + dir + list.length) % list.length];
    history.replaceState({ site: id }, "", "#site=" + id);
    const sh = document.getElementById("sheet"); if (sh?.classList.contains("open")) { quietClose = true; document.getElementById("closeSheet").click(); quietClose = false; }
    GS_wakeAudio?.stopHum(0.4);
    preload(id);
    if (reduce()) { play(id, { fromScene: true }); return; }
    /* whip-pan out of this machine, then the next one descends */
    runId++; phase = "seq";
    const whip = anim(frame, [{ transform: "none", opacity: 1 }, { transform: `translateX(${-18 * dir}%)`, opacity: 0 }], { duration: 360, easing: IN, fill: "forwards" });
    whip.finished.then(() => { frame.getAnimations().forEach((a) => a.cancel()); play(id, { fromScene: true }); }).catch(() => {});
  }

  function switchBody(b) { document.querySelector(`#bodySeg [data-body="${b}"]`)?.click(); }

  /* ---------- wiring ---------- */
  q(".sc-skip").onclick = (e) => { e.stopPropagation(); skip(); };
  q(".d-map").onclick = (e) => { e.stopPropagation(); leave(); };
  q(".d-next").onclick = (e) => { e.stopPropagation(); next(1); };
  root.addEventListener("pointerdown", (e) => { if (phase === "seq" && !e.target.closest("button")) skip(); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("#vista .vpin"); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    if (window.GS_map?.wasDrag?.()) return;
    enter(b.id.slice(2));
  }, true);
  document.addEventListener("pointerover", (e) => { const b = e.target.closest?.("#vista .vpin"); if (b) preload(b.id.slice(2)); });
  document.addEventListener("keydown", (e) => {
    if (phase === "off" || e.target.closest?.("input,textarea,[contenteditable]")) return;
    if (phase === "seq" && (e.key === " " || e.key === "Enter" || e.key === "Escape")) { e.preventDefault(); skip(); return; }
    if (phase === "behind" && e.key === "Escape") { e.preventDefault(); leave(); }
  });
  /* the call sheet's own close button means "back to the map" while a scene is behind it */
  const sheet = document.getElementById("sheet");
  if (sheet) new MutationObserver(() => { if (!quietClose && phase === "behind" && !sheet.classList.contains("open")) leave(); }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  addEventListener("popstate", () => {
    const m = /site=([a-z0-9]+)/.exec(location.hash), id = m && robot(m[1]) ? m[1] : null;
    if (id && id !== curId) { if (phase !== "off") { pushed = false; const sh2 = document.getElementById("sheet"); if (sh2?.classList.contains("open")) { quietClose = true; document.getElementById("closeSheet").click(); quietClose = false; } play(id, { fromScene: true }); } else enter(id, { push: false, instant: true }); }
    else if (!id && phase !== "off") leave({ fromPop: true });
  });
  addEventListener("gs:lang", () => { if (curId) { fillHud(curId, isSolved(curId)); q(".h-k").textContent = root.dataset.k; q(".h-s").textContent = root.dataset.s; } });
  addEventListener("gs:solved", (e) => { const id = e.detail?.robot; if (id) powered[id] = true; });
  window.GS_scenePower = (id, on = true) => { powered[id] = !!on; };
  window.GS_scene = { enter, leave, next, skip, get phase() { return phase; }, get id() { return curId; } };

  (function deep() {
    const m = /site=([a-z0-9]+)/.exec(location.hash); if (!m) return;
    const go = () => { if (robot(m[1])) setTimeout(() => enter(m[1], { push: false, instant: true }), 0); };
    if (robots.length && document.querySelector("#vista .vpin")) go(); else addEventListener("gs:pins", go, { once: true });
  })();
})();
