/* Ghost Signal: game feel. Sounds are synthesized live (no files), particles draw on one overlay canvas.
   API: GSFX.sfx(name, opts), GSFX.burst(x, y, opts), GSFX.confetti(), GSFX.float(text, x, y, color), GSFX.fly(text, fromRect, toRect), GSFX.flash(color), GSFX.shake(el).
   Emily: colours and feel are all here; game.js only calls these names. */
(() => {
  let ac = null, master = null;
  const ctx = () => {
    try {
      if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination); }
      if (ac.state === "suspended") ac.resume();
    } catch {}
    return ac;
  };
  ["pointerdown", "keydown", "touchstart"].forEach((e) => addEventListener(e, ctx, { once: true, passive: true }));

  function tone(f, t0, dur, { type = "triangle", vol = 0.08, to = null, attack = 0.01 } = {}) {
    const c = ac, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, { vol = 0.05, f = 4000, q = 0.8, type = "bandpass", sweep = null } = {}) {
    const c = ac, len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; fl.type = type; fl.frequency.setValueAtTime(f, t0); if (sweep) fl.frequency.exponentialRampToValueAtTime(sweep, t0 + dur); fl.Q.value = q;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur);
  }

  const SFX = {
    clue() { const t = ac.currentTime; [880, 1175, 1568, 2093, 2637].forEach((f, i) => tone(f, t + i * 0.055, 0.35, { vol: 0.07 })); noise(t, 0.5, { f: 6000, sweep: 12000, vol: 0.03, type: "highpass" }); },
    pick({ n = 0 } = {}) { const t = ac.currentTime, f = 520 * Math.pow(1.122, n); tone(f, t, 0.12, { type: "sine", to: f * 1.6, vol: 0.12 }); },
    place() { const t = ac.currentTime; tone(160, t, 0.12, { type: "square", to: 90, vol: 0.06 }); noise(t, 0.05, { f: 2500, vol: 0.05 }); },
    wrong() { const t = ac.currentTime; tone(150, t, 0.22, { type: "sawtooth", to: 95, vol: 0.07 }); tone(142, t + 0.18, 0.3, { type: "sawtooth", to: 70, vol: 0.07 }); },
    solve() {
      const t = ac.currentTime;
      noise(t, 0.7, { f: 300, sweep: 9000, vol: 0.06, q: 0.5 });
      [523, 659, 784].forEach((f, i) => tone(f, t + 0.25 + i * 0.09, 0.9, { vol: 0.07 }));
      [1047, 1319, 1568].forEach((f) => tone(f, t + 0.6, 1.4, { vol: 0.05, type: "sine" }));
      tone(2093, t + 0.62, 2.2, { vol: 0.05, type: "sine" }); tone(65, t + 0.25, 0.8, { type: "sine", vol: 0.12 });
    },
    star({ n = 0 } = {}) { const t = ac.currentTime, f = [1319, 1568, 2093][n] || 2093; tone(f, t, 0.5, { type: "sine", vol: 0.09 }); tone(f * 2, t, 0.3, { vol: 0.03 }); },
    ping({ heat = 0 } = {}) { const t = ac.currentTime, f = 500 + heat * 1300; tone(f, t, 0.25, { type: "sine", vol: 0.09 }); tone(f, t + 0.22, 0.25, { type: "sine", vol: 0.03 }); },
    lock() { const t = ac.currentTime; [988, 1319, 1976].forEach((f, i) => tone(f, t + i * 0.07, 0.12, { type: "square", vol: 0.04 })); tone(110, t + 0.21, 0.5, { type: "sine", vol: 0.14 }); noise(t + 0.2, 0.4, { f: 9000, vol: 0.03, type: "highpass" }); },
    power() { const t = ac.currentTime; tone(420, t, 0.16, { type: "square", to: 210, vol: 0.035 }); },
    flat() { const t = ac.currentTime; tone(380, t, 0.9, { type: "sawtooth", to: 45, vol: 0.06 }); },
    recharge() { const t = ac.currentTime; tone(200, t, 0.6, { type: "sawtooth", to: 900, vol: 0.04 }); tone(1200, t + 0.6, 0.3, { type: "sine", vol: 0.08 }); },
    hint() { const t = ac.currentTime; tone(1568, t, 0.4, { type: "sine", vol: 0.06 }); tone(2349, t + 0.08, 0.5, { type: "sine", vol: 0.04 }); },
    open() { const t = ac.currentTime; noise(t, 0.35, { f: 800, sweep: 3000, vol: 0.04 }); tone(660, t + 0.1, 0.2, { type: "sine", vol: 0.05 }); },
  };

  /* particles */
  const cv = document.createElement("canvas"); cv.className = "gsfx-canvas";
  const g2 = cv.getContext("2d"); let parts = [], raf = 0;
  const fit = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; };
  addEventListener("resize", fit);
  const ready = () => { if (!cv.isConnected) { document.body.appendChild(cv); fit(); } };
  function loop() {
    const dpr = devicePixelRatio; g2.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => (p.life -= 1 / 60) > 0);
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const a = Math.min(1, p.life / p.max * 1.6);
      g2.save(); g2.globalAlpha = a; g2.translate(p.x * dpr, p.y * dpr); g2.rotate(p.rot); g2.fillStyle = p.c;
      if (p.shape === "star") { g2.beginPath(); for (let i = 0; i < 10; i++) { const r = (i % 2 ? 0.45 : 1) * p.s * dpr, an = (i * Math.PI) / 5; g2.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g2.fill(); }
      else if (p.shape === "rect") g2.fillRect(-p.s * dpr, -p.s * 0.5 * dpr, p.s * 2 * dpr, p.s * dpr);
      else { g2.shadowColor = p.c; g2.shadowBlur = 8 * dpr; g2.beginPath(); g2.arc(0, 0, p.s * dpr, 0, 7); g2.fill(); }
      g2.restore();
    }
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function burst(x, y, { n = 26, colors = ["#7cf3ff", "#ffffff", "#ffcf7a"], speed = 6, shape = "dot", size = 3, grav = 0.08, life = 1 } = {}) {
    if (reduce) return; ready();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.4 + Math.random());
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.3, drag: 0.94, grav, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, s: size * (0.6 + Math.random() * 0.8), c: colors[i % colors.length], shape, life: life * (0.7 + Math.random() * 0.6), max: life });
    }
    kick();
  }
  function confetti() {
    if (reduce) return; ready();
    const cols = ["#ffcf7a", "#7cf3ff", "#ff7ab6", "#9dff7a", "#ffffff"];
    for (let i = 0; i < 140; i++) parts.push({ x: innerWidth * Math.random(), y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, drag: 0.99, grav: 0.06, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, s: 4 + Math.random() * 4, c: cols[i % 5], shape: i % 3 ? "rect" : "star", life: 3.2, max: 3.2 });
    kick();
  }
  function float(text, x, y, color = "#7cf3ff") {
    const d = document.createElement("div"); d.className = "gsfx-float"; d.textContent = text; d.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
    document.body.appendChild(d); setTimeout(() => d.remove(), 1400);
  }
  function fly(text, from, to, done) {
    const d = document.createElement("div"); d.className = "gsfx-fly"; d.textContent = text;
    d.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px,${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(1.05)`; });
    setTimeout(() => { d.remove(); done && done(); }, 380);
  }
  function flash(color = "#ffcf7a") { const d = document.createElement("div"); d.className = "gsfx-flash"; d.style.background = color; document.body.appendChild(d); setTimeout(() => d.remove(), 700); }
  function shake(el) { if (!el) return; el.classList.remove("gsfx-shake"); void el.offsetWidth; el.classList.add("gsfx-shake"); }

  window.GSFX = {
    sfx(name, o) { try { if (!ctx()) return; SFX[name] && SFX[name](o || {}); } catch {} },
    burst, confetti, float, fly, flash, shake,
    at(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; },
  };
})();
