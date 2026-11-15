/* Ghost Signal · first-visit flow (branch flow).
   1. Title sequence after the name card: Earth at night (Miami lit) -> a signal leaves -> the camera rides it past the Moon
      -> GHOST SIGNAL locks in -> "<Name>, 11 machines went silent. Some are still listening." -> lands on the map.
      Canvas + DOM type, WebAudio (silent when music is muted), skippable (button / Esc / Enter), once per player, replay from the Field guide.
   2. Coach: map dims except today's open-line machine (spotlight, signal rings, fast beacon, soft radio ping), a pointer line
      "This one is still listening. Tap it.", the bottom button calls it, the other machines wake one by one. Gone after the first tap, never again.
   3. After the first case, back on the map: one-time hint on the Field guide ("Bring all 11 back").
   Public: window.GS_intro = { play, coach } */
(() => {
  const K_INTRO = "ghostsignal.intro", K_COACH = "ghostsignal.coach", K_GUIDE = "ghostsignal.guidehint";
  const has = (k) => { try { return !!localStorage.getItem(k); } catch { return true; } };
  const mark = (k) => { try { localStorage.setItem(k, "1"); } catch {} };
  const es = () => (typeof lang !== "undefined" && lang === "es");
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const soundOn = () => !window.GS_music || window.GS_music.on();
  const onMap = () => !document.body.classList.contains("sc-on") && !document.body.classList.contains("sc-going") && !document.getElementById("sheet")?.classList.contains("open") && !document.getElementById("gsWelcome") && !document.getElementById("gsGuide");
  const TX = {
    en: { skip: "Skip intro", listen: "This one is still listening.", tap: "Tap it.", cta: (n) => `Answer the signal · ${n}`, guideH: "Bring all 11 back", guideP: "Every case you solve fills a page here.", replay: "Replay the intro",
      s1: (n) => `${n ? n + ", " : ""}11 machines went silent.`, s2: "Some are still listening.", out: "OUTGOING", miami: "MIAMI · 25.77° N  80.19° W", moon: "THE MOON" },
    es: { skip: "Saltar intro", listen: "Este todavía escucha.", tap: "Tócalo.", cta: (n) => `Responde la señal · ${n}`, guideH: "Trae de vuelta a los 11", guideP: "Cada caso que resuelves llena una página aquí.", replay: "Ver la intro otra vez",
      s1: (n) => `${n ? n + ", " : ""}11 máquinas quedaron en silencio.`, s2: "Algunas todavía escuchan.", out: "SALIENTE", miami: "MIAMI · 25.77° N  80.19° O", moon: "LA LUNA" },
  };
  const T = (k) => TX[es() ? "es" : "en"][k];

  /* ---------- audio ---------- */
  let ac = null;
  const ctx = () => { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch { ac = null; } return ac; };
  function ping(vol = 0.05, f = 1320) {
    if (!soundOn()) return; const c = ctx(); if (!c) return;
    const t = c.currentTime, o = c.createOscillator(), g = c.createGain(), d = c.createDelay(), fb = c.createGain(), lp = c.createBiquadFilter();
    o.type = "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.985, t + 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    d.delayTime.value = 0.23; fb.gain.value = 0.38; lp.type = "lowpass"; lp.frequency.value = 2600;
    o.connect(g); g.connect(lp); lp.connect(c.destination); lp.connect(d); d.connect(fb); fb.connect(d); fb.connect(c.destination);
    o.start(t); o.stop(t + 0.6);
  }
  function noise(c, dur) { const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; }
  function score() { /* drone + signal ping + whoosh past the Moon + title hit */
    if (!soundOn()) return () => {}; const c = ctx(); if (!c) return () => {};
    const t = c.currentTime, master = c.createGain(); master.gain.setValueAtTime(0.0001, t); master.gain.exponentialRampToValueAtTime(0.9, t + 1.2); master.connect(c.destination);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(260, t); lp.frequency.linearRampToValueAtTime(900, t + 5.4); lp.frequency.linearRampToValueAtTime(420, t + 9); lp.connect(master);
    const nodes = [];
    [55, 55.4, 82.4].forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = i === 2 ? "triangle" : "sawtooth"; o.frequency.value = f; g.gain.value = i === 2 ? 0.05 : 0.07; o.connect(g); g.connect(lp); o.start(t); o.stop(t + 10); nodes.push(o); });
    setTimeout(() => ping(0.06, 1320), 1000); setTimeout(() => ping(0.035, 1760), 1350);
    const w = noise(c, 2.2), bp = c.createBiquadFilter(), wg = c.createGain(); bp.type = "bandpass"; bp.Q.value = 0.8; bp.frequency.setValueAtTime(300, t + 3.4); bp.frequency.exponentialRampToValueAtTime(3200, t + 4.4); bp.frequency.exponentialRampToValueAtTime(500, t + 5.4);
    wg.gain.setValueAtTime(0.0001, t + 3.4); wg.gain.exponentialRampToValueAtTime(0.16, t + 4.3); wg.gain.exponentialRampToValueAtTime(0.0001, t + 5.5); w.connect(bp); bp.connect(wg); wg.connect(master); w.start(t + 3.4); nodes.push(w);
    const hit = (at) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(110, t + at); o.frequency.exponentialRampToValueAtTime(38, t + at + 1.1); g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(0.32, t + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + at + 1.6); o.connect(g); g.connect(master); o.start(t + at); o.stop(t + at + 1.7); nodes.push(o);
      [1046.5, 1568, 2093].forEach((f, i) => { const s = c.createOscillator(), sg = c.createGain(); s.type = "sine"; s.frequency.value = f; sg.gain.setValueAtTime(0.0001, t + at); sg.gain.exponentialRampToValueAtTime(0.018 / (i + 1), t + at + 0.05); sg.gain.exponentialRampToValueAtTime(0.0001, t + at + 2.8); s.connect(sg); sg.connect(master); s.start(t + at); s.stop(t + at + 3); nodes.push(s); }); };
    hit(5.45);
    setTimeout(() => ping(0.03, 1320), 7600);
    return (fast) => { try { const n = c.currentTime; master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(master.gain.value, n); master.gain.exponentialRampToValueAtTime(0.0001, n + (fast ? 0.25 : 1.2)); setTimeout(() => nodes.forEach((x) => { try { x.stop(); } catch {} }), 1400); } catch {} };
  }

  /* ---------- 1. title sequence ---------- */
  let playing = false;
  function play(name, { onEnd } = {}) {
    if (playing) return; playing = true; mark(K_INTRO);
    const DUR = reduce() ? 3800 : 9400;
    const root = document.createElement("div"); root.className = "gsi" + (reduce() ? " still" : ""); root.id = "gsIntro";
    const nm = (name || "").trim();
    root.innerHTML = `<canvas></canvas><div class="gsi-vig"></div>
      <div class="gsi-hud gsi-hud-a"><i></i>${T("miami")}</div><div class="gsi-hud gsi-hud-b"><i></i>${T("out")} · <span class="gsi-sec"></span></div><div class="gsi-hud gsi-hud-c">${T("moon")}</div>
      <div class="gsi-title" aria-label="Ghost Signal">${[..."GHOST SIGNAL"].map((ch, i) => `<span style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span>`).join("")}<b class="gsi-sweep"></b></div>
      <div class="gsi-rule"></div><div class="gsi-sub"><span class="gsi-l1"></span><span class="gsi-l2"></span></div>
      <button class="gsi-skip" type="button">${T("skip")} <span>›</span></button>`;
    document.body.appendChild(root);
    document.body.classList.add("gsi-on");
    const cv = root.querySelector("canvas"), cx = cv.getContext("2d");
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0;
    const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; cx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener("resize", size);
    const sec = typeof delay !== "undefined" && delay?.moon?.one_way_seconds ? delay.moon.one_way_seconds : 1.3;
    root.querySelector(".gsi-sec").textContent = `${sec.toFixed(2)} s → ${es() ? "LUNA" : "MOON"}`;
    /* deterministic random */
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const stars = Array.from({ length: 520 }, () => ({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, z: 0.15 + rnd() * 0.85, b: rnd() }));
    /* city lights on the night side: Florida + the US east coast + Caribbean, clustered, Miami brightest (lat/lon -> sphere) */
    const cities = [];
    const spot = (lat, lon, n, spread, w) => { for (let i = 0; i < n; i++) cities.push({ lat: lat + (rnd() - 0.5) * spread * (0.4 + rnd()), lon: lon + (rnd() - 0.5) * spread * (0.4 + rnd()), w: w * (0.4 + rnd() * 0.8) }); };
    spot(25.77, -80.19, 70, 0.9, 1.6); spot(26.7, -80.1, 30, 0.7, 1); spot(28.5, -81.4, 40, 1.2, 1.1); spot(27.95, -82.46, 34, 1, 1.05); spot(30.3, -81.66, 22, 0.9, 0.9);
    spot(33.75, -84.39, 40, 1.4, 1.1); spot(35.2, -80.8, 26, 1.4, 0.9); spot(38.9, -77, 40, 1.4, 1.1); spot(40.7, -74, 60, 1.4, 1.4); spot(29.76, -95.37, 40, 1.4, 1.1); spot(32.8, -96.8, 34, 1.4, 1);
    spot(23.1, -82.4, 22, 1.2, 0.8); spot(18.47, -69.9, 18, 1.2, 0.7); spot(18.4, -66.06, 16, 0.8, 0.8); spot(19.4, -99.1, 46, 1.6, 1.2); spot(20.9, -89.6, 12, 1, 0.6);
    for (let i = 0; i < 260; i++) cities.push({ lat: 18 + rnd() * 24, lon: -100 + rnd() * 30, w: 0.25 + rnd() * 0.4 });
    const LAT0 = 27 * Math.PI / 180, LON0 = -80.19 * Math.PI / 180;
    const proj = (lat, lon) => { /* orthographic, centred near Miami, tilted so Miami sits near the top limb */
      const la = lat * Math.PI / 180, lo = lon * Math.PI / 180 - LON0;
      const x = Math.cos(la) * Math.sin(lo), y = Math.cos(LAT0) * Math.sin(la) - Math.sin(LAT0) * Math.cos(la) * Math.cos(lo), z = Math.sin(LAT0) * Math.sin(la) + Math.cos(LAT0) * Math.cos(la) * Math.cos(lo);
      return [x, y, z];
    };
    const craters = Array.from({ length: 26 }, () => ({ a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()) * 0.86, s: 0.04 + rnd() * 0.13, d: rnd() }));
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2), cl = (v) => Math.max(0, Math.min(1, v)), seg = (t, a, b) => cl((t - a) / (b - a));
    const t0 = performance.now(); let raf = 0, done = false;
    const stopScore = score();
    window.GS_music?.duck(true, 0.6);
    const AT = new URLSearchParams(location.search).get("introAt");
    function frame(now) {
      const t = AT != null ? +AT : (now - t0) / 1000, m = Math.min(W, H);
      cx.fillStyle = "#020106"; cx.fillRect(0, 0, W, H);
      /* camera: rides the signal up and away. ride 0..1 between 1.4s and 5.2s */
      const ride = reduce() ? 0.75 : ease(seg(t, 1.5, 5.3));
      const speed = reduce() ? 0 : Math.sin(Math.PI * seg(t, 1.6, 5.6)) * 1;
      /* stars, streaking downward while we climb */
      for (const s of stars) {
        const px = W / 2 + s.x * W * 0.62, py0 = ((s.y + 1) / 2 + (t * 0.012 + ride * 1.4) * s.z) % 1, py = py0 * H;
        const a = 0.25 + 0.75 * s.b * s.z, len = 1 + speed * 46 * s.z * s.z;
        cx.strokeStyle = `rgba(${200 + 55 * s.b | 0},${210 + 40 * s.b | 0},255,${a * (0.5 + 0.5 * cl(t / 1.2))})`; cx.lineWidth = s.z * 1.5; cx.lineCap = "round";
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px, py - len); cx.stroke();
      }
      /* Earth: big night-side limb at the bottom, recedes as we climb */
      const R = m * (1.05 - 0.78 * ride), ex = W / 2, ey = H * (0.98 + 0.9 * ride) + R * 0.32;
      if (ey - R < H + 40) {
        const atm = cx.createRadialGradient(ex, ey, R * 0.98, ex, ey, R * 1.12); atm.addColorStop(0, "rgba(70,140,255,.55)"); atm.addColorStop(0.35, "rgba(60,110,255,.18)"); atm.addColorStop(1, "rgba(40,80,255,0)");
        cx.fillStyle = atm; cx.beginPath(); cx.arc(ex, ey, R * 1.12, 0, Math.PI * 2); cx.fill();
        const disc = cx.createRadialGradient(ex - R * 0.3, ey - R * 0.6, R * 0.1, ex, ey, R); disc.addColorStop(0, "#0d1426"); disc.addColorStop(1, "#04060d");
        cx.fillStyle = disc; cx.beginPath(); cx.arc(ex, ey, R, 0, Math.PI * 2); cx.fill();
        cx.save(); cx.beginPath(); cx.arc(ex, ey, R, 0, Math.PI * 2); cx.clip(); cx.globalCompositeOperation = "lighter";
        const on = cl(t / 0.9);
        for (const c of cities) {
          const [x, y, z] = proj(c.lat, c.lon); if (z <= 0.02) continue;
          const sx = ex + x * R, sy = ey - y * R; const tw = 0.75 + 0.25 * Math.sin(t * 3 + c.lon * 7);
          const r = Math.max(0.6, c.w * R / 520) * z;
          cx.fillStyle = `rgba(255,${180 + 40 * c.w | 0},110,${0.75 * on * tw * z})`; cx.beginPath(); cx.arc(sx, sy, r, 0, Math.PI * 2); cx.fill();
        }
        const [mx, my, mz] = proj(25.77, -80.19), mxs = ex + mx * R, mys = ey - my * R;
        const glow = cx.createRadialGradient(mxs, mys, 0, mxs, mys, R * 0.06); glow.addColorStop(0, `rgba(255,214,150,${0.9 * on})`); glow.addColorStop(1, "rgba(255,180,110,0)");
        cx.fillStyle = glow; cx.beginPath(); cx.arc(mxs, mys, R * 0.06, 0, Math.PI * 2); cx.fill();
        cx.restore();
        /* terminator haze */
        const rim = cx.createRadialGradient(ex, ey, R * 0.86, ex, ey, R); rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(90,150,255,.22)");
        cx.fillStyle = rim; cx.beginPath(); cx.arc(ex, ey, R, 0, Math.PI * 2); cx.fill();
        /* the signal leaves Miami at 1.0s */
        if (t > 0.95 && mz > 0) {
          const k = seg(t, 0.95, 2.4);
          for (let i = 0; i < 3; i++) { const kk = cl(k * 1.4 - i * 0.22); if (kk <= 0 || kk >= 1) continue; cx.strokeStyle = `rgba(216,255,62,${(1 - kk) * 0.8})`; cx.lineWidth = 2; cx.beginPath(); cx.arc(mxs, mys, 6 + kk * m * 0.22, 0, Math.PI * 2); cx.stroke(); }
        }
        root.querySelector(".gsi-hud-a").style.cssText = `left:${mxs + 18}px;top:${mys - 8}px;opacity:${cl(t / 0.8) * (1 - seg(t, 2.2, 2.8))}`;
      }
      /* the signal itself: a lime comet the camera follows, it stays ahead of us at ~38% height */
      if (t > 1.0) {
        const k = seg(t, 1.0, 1.8), hx = W / 2 + Math.sin(t * 1.3) * W * 0.004, hy = H * (0.86 - 0.48 * ease(k));
        const tail = cx.createLinearGradient(hx, hy, hx, hy + H * 0.5); tail.addColorStop(0, "rgba(216,255,62,.95)"); tail.addColorStop(1, "rgba(216,255,62,0)");
        cx.strokeStyle = tail; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(hx, hy); cx.lineTo(hx, hy + H * 0.5); cx.stroke();
        const hg = cx.createRadialGradient(hx, hy, 0, hx, hy, 26); hg.addColorStop(0, "rgba(250,255,220,1)"); hg.addColorStop(0.25, "rgba(216,255,62,.7)"); hg.addColorStop(1, "rgba(216,255,62,0)");
        cx.fillStyle = hg; cx.globalAlpha = 1 - seg(t, 5.4, 6.2); cx.beginPath(); cx.arc(hx, hy, 26, 0, Math.PI * 2); cx.fill(); cx.globalAlpha = 1;
        root.querySelector(".gsi-hud-b").style.cssText = `left:${hx + 22}px;top:${hy - 9}px;opacity:${seg(t, 1.3, 1.8) * (1 - seg(t, 3.6, 4.1))}`;
      }
      /* the Moon: comes in from above, swells, slides past on the right */
      const mk = reduce() ? 0.62 : seg(t, 2.6, 5.4);
      if (mk > 0 && mk < 1) {
        const mr = m * (0.05 + 0.5 * mk * mk), mcx = W * (0.62 + 0.42 * Math.pow(mk, 2.2)), mcy = H * (-0.1 + 0.62 * mk);
        const mg = cx.createRadialGradient(mcx - mr * 0.45, mcy - mr * 0.35, mr * 0.1, mcx, mcy, mr); mg.addColorStop(0, "#d9d2c8"); mg.addColorStop(0.6, "#8d867e"); mg.addColorStop(1, "#2a2724");
        cx.fillStyle = mg; cx.beginPath(); cx.arc(mcx, mcy, mr, 0, Math.PI * 2); cx.fill();
        cx.save(); cx.beginPath(); cx.arc(mcx, mcy, mr, 0, Math.PI * 2); cx.clip();
        for (const c of craters) { const x = mcx + Math.cos(c.a) * c.r * mr, y = mcy + Math.sin(c.a) * c.r * mr; cx.fillStyle = `rgba(40,36,34,${0.18 + c.d * 0.2})`; cx.beginPath(); cx.arc(x, y, c.s * mr, 0, Math.PI * 2); cx.fill(); cx.fillStyle = "rgba(255,250,240,.10)"; cx.beginPath(); cx.arc(x - c.s * mr * 0.25, y - c.s * mr * 0.25, c.s * mr * 0.8, 0, Math.PI * 2); cx.fill(); }
        const sh = cx.createLinearGradient(mcx - mr, mcy - mr, mcx + mr, mcy + mr); sh.addColorStop(0.45, "rgba(2,1,6,0)"); sh.addColorStop(1, "rgba(2,1,6,.85)");
        cx.fillStyle = sh; cx.fillRect(mcx - mr, mcy - mr, mr * 2, mr * 2); cx.restore();
        root.querySelector(".gsi-hud-c").style.cssText = `left:${mcx - mr - 120}px;top:${mcy}px;opacity:${seg(mk, 0.15, 0.3) * (1 - seg(mk, 0.6, 0.75))}`;
      }
      /* fade to the map at the end */
      if (t * 1000 > DUR - 900) root.classList.add("out");
      if (AT != null) { root.classList.toggle("t-title", t > 5.3); root.classList.toggle("t-sub", t > 6.5); root.classList.remove("out"); if (t > 6.5) { sub1.textContent = T("s1")(nm); sub2.textContent = t > 7.5 ? T("s2") : ""; } raf = requestAnimationFrame(frame); return; }
      if (t * 1000 >= DUR) return end(false);
      raf = requestAnimationFrame(frame);
    }
    const timers = [];
    const sub1 = root.querySelector(".gsi-l1"), sub2 = root.querySelector(".gsi-l2");
    const type = (elx, text, at, cps = 34) => { [...text].forEach((ch, i) => timers.push(setTimeout(() => { elx.textContent = text.slice(0, i + 1); }, at + i * (1000 / cps)))); };
    const TT = reduce() ? 0 : 5300;
    timers.push(setTimeout(() => root.classList.add("t-title"), TT));
    if (reduce()) { sub1.textContent = T("s1")(nm); sub2.textContent = T("s2"); timers.push(setTimeout(() => root.classList.add("t-sub"), 300)); }
    else { timers.push(setTimeout(() => root.classList.add("t-sub"), 6500)); type(sub1, T("s1")(nm), 6550); type(sub2, T("s2"), 7550, 30); }
    timers.push(setTimeout(() => { window.dispatchEvent(new CustomEvent("gs:intro-landing")); }, DUR - 1100));
    function end(skipped) {
      if (done) return; done = true; cancelAnimationFrame(raf); timers.forEach(clearTimeout); stopScore(skipped);
      removeEventListener("resize", size); removeEventListener("keydown", key, true);
      window.dispatchEvent(new CustomEvent("gs:intro-landing"));
      root.classList.add("out"); setTimeout(() => { root.remove(); document.body.classList.remove("gsi-on"); playing = false; window.GS_music?.duck(false); onEnd && onEnd(); window.dispatchEvent(new CustomEvent("gs:intro-done")); }, skipped ? 380 : 650);
    }
    const key = (e) => { if (["Escape", "Enter", " "].includes(e.key)) { e.preventDefault(); e.stopPropagation(); end(true); } };
    addEventListener("keydown", key, true);
    root.querySelector(".gsi-skip").onclick = (e) => { e.stopPropagation(); end(true); };
    raf = requestAnimationFrame(frame);
  }

  /* ---------- 2. first-visit coach ---------- */
  let coachOn = false;
  function coach() {
    if (coachOn || has(K_COACH)) return;
    const id = window.GS_today?.(); if (!id || typeof robots === "undefined") return;
    const r = robots.find((x) => x.id === id); if (!r) return;
    coachOn = true;
    const go = () => {
      const pin = document.getElementById("g-" + id); if (!pin) { coachOn = false; return; }
      const frac = (() => { const w = document.querySelector("#vista .vworld")?.getBoundingClientRect(), p = pin.getBoundingClientRect(); return w && w.width ? (p.left + p.width / 2 - w.left) / w.width : 0.5; })();
      window.GS_map?.reset(Math.max(0, Math.min(1, frac)), 0);
      start(pin);
    };
    if (typeof body !== "undefined" && r.body !== body) { addEventListener("gs:pins", () => setTimeout(go, 60), { once: true }); document.querySelector(`#bodySeg button[data-body="${r.body}"]`)?.click(); }
    else go();
    function start(pin) {
      const nmR = (typeof name === "function" ? name(r) : r.name);
      document.body.classList.add("coach-on");
      pin.classList.add("coach-target");
      const dim = document.createElement("div"); dim.className = "coach-dim"; dim.innerHTML = `<i class="cr"></i><i class="cr"></i><i class="cr"></i>`;
      const tip = document.createElement("div"); tip.className = "coach-tip"; tip.innerHTML = `<span class="ct-live"><i></i>LIVE</span><b>${T("listen")}</b><span class="ct-tap">${T("tap")}</span><svg class="ct-arrow" viewBox="0 0 40 60" aria-hidden="true"><path d="M20 2 C 30 18, 30 34, 20 54 M10 44 L20 56 L30 44" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      tip.onclick = () => pin.click();
      document.body.append(dim, tip);
      /* the others wake up one by one */
      const others = [...document.querySelectorAll("#vista .vpin")].filter((p) => p !== pin);
      others.forEach((p) => p.classList.add("coach-sleep"));
      const wakeT = others.map((p, i) => setTimeout(() => { p.classList.remove("coach-sleep"); p.classList.add("coach-wake", "glint"); ping(0.012, 880 + i * 110); setTimeout(() => p.classList.remove("glint"), 1000); }, 1300 + i * 520));
      /* bottom button = tap the robot */
      const hint = document.getElementById("hint"), oldHint = hint?.textContent;
      if (hint) { hint.classList.add("coach-cta"); hint.setAttribute("role", "button"); hint.tabIndex = 0; hint.innerHTML = `<i class="cc-dot"></i>${T("cta")(nmR)} <span>→</span>`; hint.onclick = () => pin.click(); hint.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin.click(); } }; }
      const pingT = setInterval(() => { if (document.hidden || !onMap()) return; ping(0.04, 1320); setTimeout(() => ping(0.02, 1320), 260); }, 2600);
      setTimeout(() => onMap() && ping(0.045, 1320), 500);
      let raf = 0;
      const track = () => {
        const b = pin.querySelector(".vbeacon") || pin, br = b.getBoundingClientRect(), pr = (pin.querySelector(".vhit") || pin).getBoundingClientRect();
        const cxp = br.left + br.width / 2, cyp = br.top + br.height / 2;
        dim.style.setProperty("--cx", cxp + "px"); dim.style.setProperty("--cy", ((cyp + pr.top + pr.height / 2) / 2) + "px"); dim.style.setProperty("--bx", cxp + "px"); dim.style.setProperty("--by", cyp + "px");
        const tw = tip.offsetWidth, th = tip.offsetHeight, above = cyp - th - 70 > 110;
        tip.classList.toggle("below", !above);
        const tx = Math.max(10, Math.min(innerWidth - tw - 10, cxp - tw / 2)), ty = above ? cyp - th - 64 : pr.bottom + 40;
        tip.style.transform = `translate(${tx}px,${ty}px)`; tip.style.setProperty("--ax", (cxp - tx) + "px");
        raf = requestAnimationFrame(track);
      };
      track();
      const finish = () => {
        if (!coachOn) return; coachOn = false; mark(K_COACH); localStorage.setItem(K_GUIDE + ".armed", "1");
        cancelAnimationFrame(raf); clearInterval(pingT); wakeT.forEach(clearTimeout);
        others.forEach((p) => p.classList.remove("coach-sleep", "coach-wake"));
        pin.classList.remove("coach-target"); document.body.classList.remove("coach-on");
        dim.classList.add("out"); tip.classList.add("out"); setTimeout(() => { dim.remove(); tip.remove(); }, 400);
        if (hint) { hint.classList.remove("coach-cta"); hint.removeAttribute("role"); hint.removeAttribute("tabindex"); hint.onclick = hint.onkeydown = null; hint.textContent = oldHint; }
        removeEventListener("gs:open", finish); removeEventListener("gs:pins", lost);
      };
      const lost = () => { if (!document.body.contains(pin)) { finish(); } };
      addEventListener("gs:open", finish);
      addEventListener("gs:pins", lost);
      document.addEventListener("click", (e) => { if (e.target.closest?.("#vista .vpin")) finish(); }, { capture: true, once: false });
    }
  }

  /* ---------- 3. field-guide hint after the first case ---------- */
  function guideHint() {
    if (has(K_GUIDE) || !localStorage.getItem(K_GUIDE + ".armed") || !onMap() || coachOn || playing) return;
    const gb = document.getElementById("gsGuideBtn"); if (!gb) return;
    mark(K_GUIDE);
    const r = gb.getBoundingClientRect(), tip = document.createElement("div");
    tip.className = "guide-tip"; tip.innerHTML = `<b>${T("guideH")}</b><span>${T("guideP")}</span>`;
    document.body.appendChild(tip); gb.classList.add("guide-glow");
    const place = () => { const r2 = gb.getBoundingClientRect(), up = r2.top > innerHeight / 2; tip.classList.toggle("up", up); const x = Math.max(10, Math.min(innerWidth - tip.offsetWidth - 10, r2.left)); tip.style.left = x + "px"; tip.style.setProperty("--ax", (r2.left + r2.width / 2 - x) + "px"); tip.style.top = up ? (r2.top - tip.offsetHeight - 14) + "px" : (r2.bottom + 14) + "px"; };
    place(); ping(0.03, 1568);
    const bye = () => { tip.classList.add("out"); gb.classList.remove("guide-glow"); setTimeout(() => tip.remove(), 350); removeEventListener("pointerdown", bye, true); };
    setTimeout(() => addEventListener("pointerdown", bye, true), 300); setTimeout(bye, 9000);
  }
  let backT = 0;
  setInterval(() => { if (onMap()) { backT += 500; if (backT >= 1000) guideHint(); } else backT = 0; }, 500);

  /* ---------- wiring ---------- */
  let pendingIntro = false;
  addEventListener("gs:named", (e) => {
    if (has(K_INTRO)) return;
    pendingIntro = true;
    const t0 = Date.now(), tryPlay = () => { if (onMap()) { pendingIntro = false; play(e.detail?.name || ""); } else if (Date.now() - t0 < 1500) setTimeout(tryPlay, 80); else pendingIntro = false; };
    setTimeout(tryPlay, 120);
  });
  addEventListener("gs:intro-landing", () => setTimeout(coach, 0));
  const tryCoach = () => { if (!has(K_COACH) && onMap() && !playing && !pendingIntro && document.querySelector("#vista .vpin") && window.GS_today?.()) coach(); };
  const iv = setInterval(() => { if (has(K_COACH)) return clearInterval(iv); tryCoach(); }, 600);
  addEventListener("gs:guide-open", () => {
    const p = document.querySelector("#gsGuide .gs-gpanel"); if (!p || p.querySelector(".gsi-replay")) return;
    const b = document.createElement("button"); b.className = "gsi-replay"; b.type = "button"; b.innerHTML = `▶ ${T("replay")}`;
    b.onclick = () => { document.querySelector("#gsGuide .gs-x")?.click(); setTimeout(() => play(window.GS_player?.().name || ""), 300); };
    p.appendChild(b);
  });
  window.GS_intro = { play, coach };
})();
