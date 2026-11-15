/* Ghost Signal · move around the painted map (branch wake-up).
   #vista holds .vworld (all panels of a body side by side); we move it with one transform.
   Drag / swipe to pan (with inertia), wheel or pinch to zoom (bounded), double-click / double-tap to zoom in,
   arrow keys pan, + / - zoom, 0 or the recenter button resets. A press that moves more than 6 px is a drag, not a tap.
   Map life: Mars dust, a sun glint that visits one dormant machine at a time, hover blips.
   Public: window.GS_map = { reset, dive, restore, wasDrag, view }. */
(() => {
  const v = document.getElementById("vista"); if (!v) return;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX = 3, TAP = 6, TS = Math.max(0.1, +(new URLSearchParams(location.search).get("slow") || 1));
  let st = { x: 0, y: 0, s: 1 }, minS = 1, saved = null, tw = 0, inert = 0, lastDrag = 0;
  const world = () => v.querySelector(".vworld");
  const size = () => { const w = world(); return w ? { W: w.offsetWidth, H: w.offsetHeight } : { W: innerWidth, H: innerHeight }; };
  function limits() { const { W } = size(); minS = Math.max(1, innerWidth / W); }
  function clamp(p) {
    const { W, H } = size(), s = Math.min(MAX, Math.max(minS, p.s)), ww = W * s, wh = H * s, vw = innerWidth, vh = innerHeight;
    const x = ww <= vw ? (vw - ww) / 2 : Math.min(0, Math.max(vw - ww, p.x));
    const y = wh <= vh ? (vh - wh) / 2 : Math.min(0, Math.max(vh - wh, p.y));
    return { x, y, s };
  }
  function apply(p = st, free = false) {
    st = free ? p : clamp(p);
    const w = world(); if (!w) return;
    w.style.transform = `translate3d(${st.x.toFixed(2)}px,${st.y.toFixed(2)}px,0) scale(${st.s.toFixed(4)})`;
    w.style.setProperty("--inv", (1 / st.s).toFixed(4));
    v.classList.toggle("zoomed", st.s > minS * 1.05);
  }
  const stop = () => { cancelAnimationFrame(tw); cancelAnimationFrame(inert); tw = inert = 0; };
  const E = { out: (k) => 1 - Math.pow(1 - k, 3), in: (k) => k * k * k, io: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) };
  function tween(to, ms = 450, ease = E.out, free = false) {
    stop(); const from = { ...st }, t0 = performance.now();
    if (reduce()) ms = Math.min(ms, 1);
    return new Promise((res) => {
      const f = (now) => { const k = Math.min(1, (now - t0) / ms), e = ease(k);
        apply({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, s: from.s + (to.s - from.s) * e }, free);
        if (k < 1) tw = requestAnimationFrame(f); else { tw = 0; res(); } };
      tw = requestAnimationFrame(f);
    });
  }
  function zoomAt(cx, cy, s2, ms = 0) {
    const s = Math.min(MAX, Math.max(minS, s2)), k = s / st.s;
    const to = clamp({ x: cx - (cx - st.x) * k, y: cy - (cy - st.y) * k, s });
    return ms ? tween(to, ms, E.io) : (apply(to), Promise.resolve());
  }

  /* initial view: centre a fraction of the strip, like the old scroll position */
  function reset(frac = 0.5, ms = 0) {
    limits();
    const { W, H } = size(), s = minS;
    const to = clamp({ x: innerWidth / 2 - W * frac * s, y: (innerHeight - H * s) / 2, s });
    lastFrac = frac;
    if (ms) return tween(to, ms, E.io);
    stop(); apply(to); return Promise.resolve();
  }
  let lastFrac = 0.5;

  /* ---------- pointers ---------- */
  const pts = new Map(); let drag = null, pinch = null, samples = [], lastTap = { t: 0, x: 0, y: 0 };
  const sceneUp = () => document.body.classList.contains("sc-on") || document.body.classList.contains("sc-going");
  v.addEventListener("pointerdown", (e) => {
    if (sceneUp() || e.button > 0) return;
    stop(); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { drag = { x0: e.clientX, y0: e.clientY, sx: st.x, sy: st.y, moved: false }; samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]; }
    else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: st.s, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, x0: st.x, y0: st.y };
      if (drag) drag.moved = true;
    }
  });
  addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const s = Math.min(MAX, Math.max(minS, pinch.s0 * d / pinch.d0)), k = s / pinch.s0;
      apply({ x: mx - (pinch.mx - pinch.x0) * k, y: my - (pinch.my - pinch.y0) * k, s });
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > TAP) { drag.moved = true; v.classList.add("dragging"); }
    if (drag.moved) { apply({ x: drag.sx + dx, y: drag.sy + dy, s: st.s }); samples.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (samples.length > 6) samples.shift(); }
  }, { passive: true });
  function up(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pinch) { if (pts.size < 2) { pinch = null; const r = [...pts.values()][0]; drag = r ? { x0: r.x, y0: r.y, sx: st.x, sy: st.y, moved: true } : null; lastDrag = performance.now(); } return; }
    if (!drag) return;
    v.classList.remove("dragging");
    if (drag.moved) {
      lastDrag = performance.now();
      const a = samples[0], b = samples[samples.length - 1], dt = Math.max(1, b.t - a.t);
      let vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
      if (performance.now() - b.t > 80 || reduce()) vx = vy = 0;
      let t = performance.now();
      const glide = (now) => { const d = now - t; t = now; const f = Math.pow(0.94, d / 16);
        vx *= f; vy *= f; const before = st; apply({ x: st.x + vx * d, y: st.y + vy * d, s: st.s });
        if ((Math.abs(vx) + Math.abs(vy) > 0.02) && (before.x !== st.x || before.y !== st.y)) inert = requestAnimationFrame(glide); else inert = 0; };
      if (vx || vy) inert = requestAnimationFrame(glide);
    } else if (e.pointerType !== "mouse") { /* double-tap to zoom (not on a machine) */
      const now = performance.now();
      if (now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30 && !e.target.closest(".vpin")) { dblZoom(e.clientX, e.clientY); lastTap.t = 0; }
      else lastTap = { t: now, x: e.clientX, y: e.clientY };
    }
    drag = null;
  }
  addEventListener("pointerup", up); addEventListener("pointercancel", up);
  const dblZoom = (x, y) => (st.s >= MAX * 0.9 ? reset(lastFrac, 500) : zoomAt(x, y, st.s * 1.9, 420));
  v.addEventListener("dblclick", (e) => { if (sceneUp() || e.target.closest(".vpin")) return; e.preventDefault(); dblZoom(e.clientX, e.clientY); });
  v.addEventListener("wheel", (e) => {
    if (sceneUp()) return; e.preventDefault(); stop();
    if (!e.ctrlKey && Math.abs(e.deltaX) > Math.abs(e.deltaY)) { apply({ x: st.x - e.deltaX, y: st.y, s: st.s }); return; }
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(e.clientX, e.clientY, st.s * Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0018)));
  }, { passive: false });
  v.addEventListener("dragstart", (e) => e.preventDefault());
  addEventListener("keydown", (e) => {
    if (sceneUp() || e.target.closest?.("input,textarea,select,[contenteditable]") || document.getElementById("sheet")?.classList.contains("open")) return;
    if (document.querySelector(".gs-welcome,.gs-guide")) return;
    const step = 120, k = e.key;
    if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault();
      tween(clamp({ x: st.x + (k === "ArrowLeft" ? step : k === "ArrowRight" ? -step : 0), y: st.y + (k === "ArrowUp" ? step : k === "ArrowDown" ? -step : 0), s: st.s }), 260);
    } else if (k === "+" || k === "=") zoomAt(innerWidth / 2, innerHeight / 2, st.s * 1.4, 300);
    else if (k === "-" || k === "_") zoomAt(innerWidth / 2, innerHeight / 2, st.s / 1.4, 300);
    else if (k === "0") reset(lastFrac, 450);
  });
  addEventListener("resize", () => { if (!sceneUp()) { limits(); apply(st); } });

  /* ---------- controls: zoom in / out / recenter ---------- */
  const ctl = document.createElement("div"); ctl.className = "mapctl";
  ctl.innerHTML = `<button type="button" data-z="in" aria-label="Zoom in">+</button><button type="button" data-z="out" aria-label="Zoom out">−</button><button type="button" data-z="home" aria-label="Recenter the map" class="home"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 1.5v4M12 18.5v4M1.5 12h4M18.5 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>`;
  document.querySelector("main")?.appendChild(ctl);
  ctl.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; const z = b.dataset.z;
    if (z === "home") reset(lastFrac, 500); else zoomAt(innerWidth / 2, innerHeight / 2, st.s * (z === "in" ? 1.5 : 1 / 1.5), 320); };
  const syncCtl = () => ctl.classList.toggle("on", document.body.classList.contains("vista-on"));
  new MutationObserver(syncCtl).observe(document.body, { attributes: true, attributeFilter: ["class"] }); syncCtl();

  /* ---------- the dive into a machine, and the pull back out ---------- */
  function pinCentre(id) {
    const p = document.getElementById("g-" + id), w = world(); if (!p || !w) return null;
    const panel = p.closest(".vpanel");
    return { x: panel.offsetLeft + p.offsetLeft + p.offsetWidth / 2, y: panel.offsetTop + p.offsetTop + p.offsetHeight * 0.62 };
  }
  const diveTarget = (c, S) => ({ x: innerWidth / 2 - c.x * S, y: innerHeight / 2 - c.y * S, s: S });
  function dive(id) {
    const c = pinCentre(id); if (!c) return Promise.resolve();
    saved = { ...st };
    v.classList.add("diving");
    return Promise.race([tween(diveTarget(c, Math.max(4.2, st.s * 2.6)), 720 * TS, E.in, true), new Promise((r) => setTimeout(r, 560 * TS))]);
  }
  function restore(id) {
    const c = pinCentre(id); v.classList.remove("diving");
    if (!c || !saved) return Promise.resolve();
    apply(diveTarget(c, Math.max(3.2, saved.s * 2.2)), true);
    const to = clamp(saved); saved = null;
    v.classList.add("returning"); setTimeout(() => v.classList.remove("returning"), 50);
    return tween(to, 850 * TS, E.out);
  }

  /* ---------- map life ---------- */
  function glintLoop() {
    if (!reduce() && !document.hidden && !sceneUp()) {
      const dormant = [...v.querySelectorAll(".vpin.spr:not(:hover)")];
      const el = dormant[Math.floor(Math.random() * dormant.length)];
      if (el) { el.classList.remove("glint"); void el.offsetWidth; el.classList.add("glint"); }
    }
    setTimeout(glintLoop, 4500 + Math.random() * 4000);
  }
  setTimeout(glintLoop, 2500);
  v.addEventListener("pointerover", (e) => { const b = e.target.closest?.(".vpin"); if (b && e.pointerType === "mouse" && !b.contains(e.relatedTarget)) window.GS_wakeAudio?.ui.hover(); });

  const dust = document.createElement("canvas"); dust.className = "vdust"; v.appendChild(dust);
  const dg = dust.getContext("2d"); let D = [], draf = 0;
  for (let i = 0; i < 38; i++) D.push({ x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.4, v: 0.00003 + Math.random() * 0.00007, a: 0.05 + Math.random() * 0.18, p: Math.random() * 7 });
  function dustTick(now) {
    const on = document.body.classList.contains("vista-on") && typeof body !== "undefined" && body === "mars" && !sceneUp() && !document.hidden && !reduce();
    if (!on) { dg.clearRect(0, 0, dust.width, dust.height); draf = 0; return; }
    const W = dust.width = innerWidth, H = dust.height = innerHeight; dg.clearRect(0, 0, W, H);
    for (const p of D) { p.x -= p.v * 16; if (p.x < -0.02) p.x = 1.02;
      dg.globalAlpha = p.a; dg.fillStyle = "rgb(255,196,150)"; dg.beginPath(); dg.arc(p.x * W, (p.y + Math.sin(now / 2400 + p.p) * 0.01) * H, p.r, 0, 7); dg.fill(); }
    draf = requestAnimationFrame(dustTick);
  }
  const wakeDust = () => { if (!draf) draf = requestAnimationFrame(dustTick); };
  setInterval(wakeDust, 1000); wakeDust();

  addEventListener("gs:pins", () => { requestAnimationFrame(() => { limits(); apply(st); }); });
  window.GS_map = { reset, dive, restore, wasDrag: () => performance.now() - lastDrag < 250 || !!drag?.moved, view: () => ({ ...st, minS }) };
})();
