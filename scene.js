/* Ghost Signal · cinematic arrival (branch wake-up, Nov 15 2026).
   Tap a machine on the map -> ~6 s directed sequence, then straight into its case (openRobot):
     a. descent: the map dive carries on into the scene's ground layer, dust, a camera shake on landing
     b. establishing: multi-plane parallax dolly (ground / shadow / machine move at different speeds), letterbox,
        grain, vignette; the machine is dark and silent; "Silent for N years" types in like telemetry
     c. signs of life: relay click, stutter flicker of its real lights at their real positions (rigs.js),
        colour floods back, light spill on the ground, power-up sound (wake-audio.js, music ducked),
        a small breath, and the one real thing it does (lidar, laser stripes, Viking scan, rotor, ...)
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
      credit: "Painted from NASA photos · AI-assisted" },
    es: { next: "Siguiente máquina", map: "Mapa", skip: "Saltar", silent: "En silencio desde hace", y: ["año", "años"], mo: ["mes", "meses"], d: ["día", "días"],
      left: "Dejado en", moon: "la Luna", mars: "Marte", search: "Buscando su señal", power: "Subiendo energía", lock: "Señal captada", back: "De vuelta · ya despierto",
      credit: "Pintado a partir de fotos de la NASA · con ayuda de IA" },
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
      <div class="pl pl-shadow"><img class="sh" alt="" draggable="false"></div>
      <div class="sc-dark"></div>
      <div class="pl pl-mach"><div class="mach">
        <canvas class="fx fx-under"></canvas>
        <img class="m m-dark" alt="" draggable="false"><img class="m m-lit" alt="" draggable="false">
        <div class="lights"></div>
        <canvas class="fx fx-over"></canvas>
      </div></div>
    </div></div></div>
    <div class="sc-vig"></div><div class="sc-grain"></div>
    <div class="sc-bar t"></div><div class="sc-bar b"></div>
    <div class="sc-hud">
      <div class="h-k"></div>
      <h1 class="h-n"></h1>
      <div class="h-s"></div>
      <div class="h-st"><i></i><span></span></div>
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
  const L = (id) => ({ g: `assets/layers/${id}/ground.webp`, sh: `assets/layers/${id}/shadow.webp`, m: `assets/layers/${id}/machine.webp` });
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
    const b = BOXES[id] || [0.2, 0, 0.8, 0.9], bw = b[2] - b[0], cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    let sc;
    if (phone) sc = Math.min(vh / 720 * 1.1, Math.max(vw / (bw * 1280) * 1.02, vh * 0.5 / 720, vw / 1280 * 1.08));
    else sc = Math.max(vw / 1280, vh / 720) * 1.1;
    const w = 1280 * sc, h = 720 * sc;
    let left = vw / 2 - cx * w; left = w >= vw ? Math.min(0, Math.max(vw - w, left)) : (vw - w) / 2;
    let top = phone ? vh * 0.4 - h * 0.5 : (vh - h) / 2; if (h >= vh) top = Math.min(0, Math.max(vh - h, top));
    Object.assign(frame.style, { left: left + "px", top: top + "px", width: w + "px", height: h + "px" });
    const ox = left + cx * w, oy = top + cy * h;
    cam.style.transformOrigin = `${ox}px ${oy}px`;
    root.style.setProperty("--bar-t", Math.max(phone ? top + h * 0.06 : vh * 0.085, 0) + "px");
    root.style.setProperty("--bar-b", Math.max(phone ? vh - top - h * 0.97 : vh * 0.085, 0) + "px");
    root.classList.toggle("phone", phone);
    const dpr = Math.min(devicePixelRatio || 1, 1.5), cw = Math.min(2048, Math.round(w * dpr)), ch = Math.round(cw * 720 / 1280);
    [cUnder, cOver].forEach((c) => { if (c.width !== cw) { c.width = cw; c.height = ch; } });
    geo = { w, h, left, top, ox, oy, phone, cw, ch, k: cw / w };
  }
  addEventListener("resize", () => { if (curId && !root.hidden) layout(curId); });

  /* ---------- light FX canvas (additive), one rAF while anything is drawing ---------- */
  const gU = cUnder.getContext("2d"), gO = cOver.getContext("2d");
  let fx = [], raf = 0;
  const P = (x, y) => [x / 100 * cUnder.width, y / 100 * cUnder.height];
  function loop(now) {
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
        const sp = g.createRadialGradient(bx, by, 0, bx, by, 26 * u); sp.addColorStop(0, hex(c, 0.8)); sp.addColorStop(1, hex(c, 0));
        g.globalAlpha = k; g.fillStyle = sp; g.beginPath(); g.arc(bx, by, 26 * u, 0, 7); g.fill();
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
    scan({ ms, onX }) {
      return addFx({ over: true, draw(now, g, W, H) {
        const k = Math.min(1, (now - this.t0) / ms), x = k * W, u = W / 1280; onX && onX(k * 100);
        g.globalAlpha = 0.9 * (1 - k * 0.4); g.fillStyle = "#e9ffd0"; g.fillRect(x - 1.2 * u, 0, 2.4 * u, H);
        const gr = g.createLinearGradient(x - 40 * u, 0, x, 0); gr.addColorStop(0, "rgba(233,255,208,0)"); gr.addColorStop(1, "rgba(233,255,208,.28)");
        g.fillStyle = gr; g.fillRect(x - 40 * u, 0, 40 * u, H);
        if (k >= 1) return false;
      } });
    },
    ripples({ x, y, c }) {
      return addFx({ draw(now, g, W, H) {
        const [cx, cy] = P(x, y), t = now - this.t0;
        for (let i = 0; i < 3; i++) { const k = ((t - i * 520) % 2600) / 1800; if (t - i * 520 < 0 || k > 1 || k < 0) continue;
          g.save(); g.translate(cx, cy); g.scale(1, 0.24); g.globalAlpha = (1 - k) * 0.7; g.strokeStyle = c; g.lineWidth = 2.2 * W / 1280;
          g.beginPath(); g.arc(0, 0, 8 + k * W * 0.3, 0, 7); g.stroke(); g.restore(); }
      } });
    },
    pulses({ pts, c }) {
      const segs = pts.slice(1).map((p, i) => [pts[i], p]);
      return addFx({ over: true, draw(now, g, W, H) {
        const t = (now - this.t0) / 1000;
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
    q(".h-st").className = "h-st"; q(".h-note").textContent = "";
    root.dataset.k = `${s("left")} ${r.body === "moon" ? s("moon") : s("mars")}${yr ? " · " + yr : ""}`;
    root.dataset.s = solved ? s("back") : silentText(id);
    q(".sc-skip .l").textContent = s("skip");
    q(".d-map .l").textContent = s("map"); q(".d-next .l").textContent = s("next");
    q(".d-next").hidden = order(r.body).length < 2;
    root.setAttribute("aria-label", name(r));
  }

  /* ---------- building one shot ---------- */
  function build(id, lit) {
    clearRun(); fx = []; lights.innerHTML = "";
    const l = L(id);
    q(".g").src = l.g; q(".sh").src = l.sh; q(".m-dark").src = l.m; q(".m-lit").src = l.m;
    layout(id);
    root.classList.toggle("lit", lit); root.classList.remove("behind", "waking", "awake", "show-hud", "show-note", "done");
    root.dataset.body = robot(id).body;
    q(".m-lit").style.clipPath = "";
    [".sc-dark", ".m-lit", ".sc-cam", ".pl-ground", ".pl-shadow", ".pl-mach", ".mach", ".sc-hud", ".h-n"].forEach((c) => { const e = q(c); e.getAnimations().forEach((a) => a.cancel()); e.style.opacity = ""; e.style.transform = ""; });
  }
  function startIdle(id, R) {
    if (robot(id).body === "mars" && !reduce()) FX.motes({});
  }
  function lightUp(id, R, instant) {
    const heart = lamp(R.heart, true);
    if (instant) { heart.classList.add("on", "breathe"); R.lamps.forEach((L) => lampOn(lamp(L), L, true)); }
    FX.spill({ x: R.foot.x, y: R.foot.y, w: R.foot.w * 1.25, c: R.spill || "#ffd0a0" });
    const keep = (R.fx || []).filter((f) => ["lidar", "stripes", "ripples", "pulses", "rotor"].includes(f.type));
    if (instant) keep.forEach((f) => FX[f.type](f));
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

    /* a. descent: camera drops from above onto the ground; planes travel at different depths */
    const D = fromScene ? 1100 : 1450, DESC = "cubic-bezier(.25,.6,.35,1)";
    anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: dive ? 260 : 420, easing: "ease-out", fill: "both" });
    anim(cam, [{ transform: "translateY(-10%) scale(1.55)" }, { transform: "translateY(0) scale(1.0)" }], { duration: D, easing: DESC, fill: "both" });
    anim(q(".pl-ground"), [{ transform: "translateY(5%)" }, { transform: "none" }], { duration: D, easing: DESC, fill: "both" });
    anim(q(".pl-mach"), [{ transform: "translateY(12%) scale(1.06)" }, { transform: "none" }], { duration: D, easing: DESC, fill: "both" });
    if (!dive) GS_wakeAudio?.ui.descend();
    later(() => {
      if (my !== runId) return;
      GS_wakeAudio?.ui.land();
      anim(shake, [{ transform: "translate(0,0)" }, { transform: "translate(-5px,7px)" }, { transform: "translate(4px,-4px)" }, { transform: "translate(-2px,2px)" }, { transform: "translate(0,0)" }], { duration: 320, easing: "linear" });
      FX.puff({ x: R.foot.x, y: R.foot.y, w: R.foot.w, c: r.body === "mars" ? "214,150,112" : "200,190,205" });
      /* b. establishing: slow dolly + orbit-feel parallax, runs to the end of the shot */
      const T = 7000;
      anim(cam, [{ transform: "scale(1)" }, { transform: "scale(1.075)" }], { duration: T, easing: "cubic-bezier(.25,.1,.35,1)", fill: "both" });
      anim(q(".pl-ground"), [{ transform: "translateX(0)" }, { transform: "translateX(1.4%)" }], { duration: T, easing: "ease-in-out", fill: "both" });
      anim(q(".pl-shadow"), [{ transform: "translateX(0)" }, { transform: "translateX(1.1%)" }], { duration: T, easing: "ease-in-out", fill: "both" });
      anim(q(".pl-mach"), [{ transform: "translateX(0)" }, { transform: "translateX(-1.6%)" }], { duration: T, easing: "ease-in-out", fill: "both" });
      startIdle(id, R);
    }, D - 120);

    root.classList.add("show-hud");
    later(() => type(q(".h-k"), root.dataset.k, 44), fromScene ? 300 : 500);
    anim(q(".h-n"), [{ opacity: 0, transform: "translateY(16px)", letterSpacing: ".04em" }, { opacity: 1, transform: "none", letterSpacing: "-.04em" }], { duration: 900, delay: fromScene ? 600 : 900, easing: OUT, fill: "both" });
    later(() => type(q(".h-s"), root.dataset.s, 40), fromScene ? 1000 : 1400);

    if (solved) {
      /* already brought back: lights on from the first frame, short shot */
      lightUp(id, R, true);
      later(() => { status("ok", s("back")); q(".h-note").textContent = R.note?.[lang] || ""; root.classList.add("show-note"); GS_wakeAudio?.ui.lock(); }, 1700);
      later(() => handoff(id), 3600);
      return;
    }

    /* c. signs of life */
    const W0 = fromScene ? 2300 : 2700;
    later(() => { status("search", s("search")); }, W0 - 900);
    later(() => { /* anticipation: the world dips darker, a relay ticks */
      if (my !== runId) return;
      GS_wakeAudio?.ui.dim(); root.classList.add("waking");
      window.GS_music?.duck(true);
    }, W0);
    later(() => {
      if (my !== runId) return;
      GS_wakeAudio?.wake(id);
      status("power", s("power"));
      const heart = lightUp(id, R, false);
      lightStyle(heart, STY.stutter, 62, () => { heart.classList.add("on", "breathe"); FX.sparks({ x: R.heart.x, y: R.heart.y, c: R.heart.c }); });
      R.lamps.forEach((L) => later(() => lampOn(lamp(L), L, false), 1150 + (L.t || 0)));
      const flood = 1250, scan = (R.fx || []).find((f) => f.type === "scan");
      if (scan) {
        const lit = q(".m-lit"); lit.style.clipPath = "inset(0 100% 0 0)"; root.classList.add("scanning");
        later(() => FX.scan({ ms: scan.ms, onX: (x) => { lit.style.clipPath = `inset(0 ${(100 - x).toFixed(2)}% 0 0)`; q(".sc-dark").style.clipPath = `inset(0 0 0 ${x.toFixed(2)}%)`; } }), 500);
        later(() => { root.classList.add("awake"); lit.style.clipPath = ""; q(".sc-dark").style.clipPath = ""; }, 500 + scan.ms + 30);
      } else later(() => root.classList.add("awake"), flood);
      (R.fx || []).forEach((f) => { if (f.type !== "scan") later(() => FX[f.type](f), f.type === "glint" ? 1900 : f.type === "dust" ? 1250 : 1400); });
      if ((R.fx || []).some((f) => f.type === "rotor")) later(() => FX.puff({ x: R.foot.x, y: R.foot.y, w: R.foot.w * 1.3, n: 50, c: "214,150,112", rise: 0.2 }), 2000);
      later(() => { /* breath: a small settle with overshoot, like a motor finding its load */
        anim(mach, [{ transform: "scale(1)" }, { transform: "scale(1.022) translateY(-0.6%)", offset: 0.35 }, { transform: "scale(.996)", offset: 0.7 }, { transform: "scale(1)" }], { duration: 1300, easing: "ease-in-out" });
      }, 1300);
      later(() => { status("ok", s("lock")); GS_wakeAudio?.ui.lock(); q(".h-note").textContent = R.note?.[lang] || ""; root.classList.add("show-note"); }, 2700);
      later(() => handoff(id), 3500);
    }, W0 + 260);
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
    clearRun(true); runId++;
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
