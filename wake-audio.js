/* Ghost Signal · wake sounds (branch wake-up). Pure WebAudio, no files.
   Voices and per-machine profiles adapted from Skills/machine-awakening/references/02-power-on-sound.md (§4):
   relay clack -> charge-up whine -> servo/rotor -> hum settles -> recognition chirp. Apollo machines get the
   real Mission Control Quindar tone (2525 Hz in). Original synthesis, no film or Apple sounds.
   One AudioContext; music.js is ducked through window.GS_music.duck while a machine wakes. */
(() => {
  let ctx = null, bus = null;
  const DB = (d) => Math.pow(10, d / 20);
  const muted = () => localStorage.getItem("ghostsignal.sfx") === "off";
  function softClip(ceil, n = 2048) { const k = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; k[i] = ceil * Math.tanh(x / ceil); } return k; }
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" }); } catch { return null; }
    const master = ctx.createGain(); master.gain.value = DB(-1);
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 12; lim.attack.value = 0.001; lim.release.value = 0.12;
    const clip = ctx.createWaveShaper(); clip.curve = softClip(DB(-1.2)); clip.oversample = "4x";
    master.connect(lim); lim.connect(clip); clip.connect(ctx.destination);
    const mk = (db) => { const g = ctx.createGain(); g.gain.value = DB(db); g.connect(master); return g; };
    bus = { master, wake: mk(-2.5), ui: mk(-10) };
    if (ctx.state === "suspended") ctx.resume();
    document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx.state !== "running") ctx.resume(); });
    return ctx;
  }
  ["pointerdown", "keydown", "touchend"].forEach((e) => addEventListener(e, init, { capture: true, passive: true }));
  const ready = () => ctx && ctx.state === "running" && !muted();

  const noiseCache = new WeakMap();
  function noiseBuf(c) { let b = noiseCache.get(c); if (b) return b; const n = c.sampleRate * 2; b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; noiseCache.set(c, b); return b; }
  const env = (g, t0, a, peak, hold, rel) => { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a); g.gain.setValueAtTime(peak, t0 + a + hold); g.gain.setTargetAtTime(0, t0 + a + hold, rel / 4); };

  function relay(c, out, t0, { vol = 0.5, pitch = 1, count = 1, gap = 0.045 } = {}) {
    for (let k = 0; k < count; k++) {
      const t = t0 + k * gap * (0.8 + Math.random() * 0.4);
      const src = c.createBufferSource(); src.buffer = noiseBuf(c);
      const b1 = c.createBiquadFilter(); b1.type = "bandpass"; b1.frequency.value = 3200 * pitch; b1.Q.value = 9;
      const b2 = c.createBiquadFilter(); b2.type = "bandpass"; b2.frequency.value = 1150 * pitch; b2.Q.value = 14;
      const g = c.createGain(); env(g, t, 0.0005, vol * (k ? 0.6 : 1), 0.002, 0.03);
      src.connect(b1); src.connect(b2); b1.connect(g); b2.connect(g); g.connect(out); src.start(t, Math.random()); src.stop(t + 0.08);
      const th = c.createOscillator(), tg = c.createGain(); th.frequency.setValueAtTime(140 * pitch, t); th.frequency.exponentialRampToValueAtTime(50, t + 0.03);
      env(tg, t, 0.001, vol * 0.5, 0.004, 0.025); th.connect(tg); tg.connect(out); th.start(t); th.stop(t + 0.06);
    }
    return t0 + count * gap;
  }
  function charge(c, out, t0, { dur = 1.1, from = 280, to = 3800, vol = 0.18, grit = 0.35 } = {}) {
    const end = t0 + dur, g = c.createGain(); g.connect(out);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.85); g.gain.setTargetAtTime(0, end, 0.03);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.setValueAtTime(5, t0); lfo.frequency.exponentialRampToValueAtTime(28, end);
    lg.gain.setValueAtTime(from * 0.01, t0); lg.gain.linearRampToValueAtTime(to * 0.006, end); lfo.connect(lg);
    [["sine", 1, 1], ["triangle", 2.003, 0.35]].forEach(([type, mul, lv]) => {
      const o = c.createOscillator(), og = c.createGain(); o.type = type; og.gain.value = lv;
      o.frequency.setValueAtTime(from * mul, t0); o.frequency.exponentialRampToValueAtTime(to * mul, end);
      lg.connect(o.frequency); o.connect(og); og.connect(g); o.start(t0); o.stop(end + 0.2);
    });
    const n = c.createBufferSource(); n.buffer = noiseBuf(c); n.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 6; bp.frequency.setValueAtTime(from * 2, t0); bp.frequency.exponentialRampToValueAtTime(Math.min(to * 2.5, 12000), end);
    const ng = c.createGain(); ng.gain.value = grit; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t0); n.stop(end + 0.2);
    lfo.start(t0); lfo.stop(end + 0.2);
    return end;
  }
  function servo(c, out, t0, { moves = [[0, 0.45, 1]], base = 95, teeth = 14, vol = 0.16, bright = 2400 } = {}) {
    let last = t0;
    for (const [st, dur, sp] of moves) {
      const t = t0 + st, e = t + dur, f = base * (0.6 + sp);
      const o = c.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(f * 0.55, t); o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.09, dur * 0.3));
      o.frequency.setValueAtTime(f, e - Math.min(0.08, dur * 0.3)); o.frequency.exponentialRampToValueAtTime(f * 0.7, e);
      const am = c.createOscillator(), amg = c.createGain(), vca = c.createGain(); am.type = "square";
      am.frequency.setValueAtTime(f * teeth / 10, t); amg.gain.value = 0.35; vca.gain.value = 0.65; am.connect(amg); amg.connect(vca.gain);
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = bright; lp.Q.value = 3;
      const pk = c.createBiquadFilter(); pk.type = "peaking"; pk.frequency.value = f * 5.1; pk.Q.value = 8; pk.gain.value = 9;
      const g = c.createGain(); env(g, t, 0.02, vol, Math.max(0, dur - 0.06), 0.06);
      o.connect(vca); vca.connect(lp); lp.connect(pk); pk.connect(g); g.connect(out);
      o.start(t); am.start(t); o.stop(e + 0.2); am.stop(e + 0.2);
      relay(c, out, e, { vol: vol * 0.9, pitch: 0.7 });
      last = Math.max(last, e);
    }
    return last;
  }
  function hum(c, out, t0, { f = 55, vol = 0.07, spin = 0.9, air = 0.25, partials = [1, 0.5, 0.33, 0.12] } = {}) {
    const fader = c.createGain(); fader.connect(out);
    const g = c.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + spin); g.connect(fader);
    const oscs = partials.map((lv, i) => {
      const o = c.createOscillator(), og = c.createGain(); o.type = i ? "sine" : "triangle"; og.gain.value = lv;
      const h = (i + 1) * f * (1 + (Math.random() - 0.5) * 0.004);
      o.frequency.setValueAtTime(h * 0.4, t0); o.frequency.exponentialRampToValueAtTime(h * 1.03, t0 + spin * 0.8); o.frequency.setTargetAtTime(h, t0 + spin * 0.8, 0.12);
      o.connect(og); og.connect(g); o.start(t0); return o;
    });
    const n = c.createBufferSource(); n.buffer = noiseBuf(c); n.loop = true;
    const lp = c.createBiquadFilter(); lp.type = "bandpass"; lp.frequency.value = f * 8; lp.Q.value = 1.2;
    const ng = c.createGain(); ng.gain.value = air; n.connect(lp); lp.connect(ng); ng.connect(g); n.start(t0); oscs.push(n);
    return { gain: g, stop(t = c.currentTime, fade = 0.6) { fader.gain.setTargetAtTime(0, t, fade / 4); oscs.forEach((o) => { try { o.stop(t + fade * 1.5); } catch {} }); } };
  }
  function chirp(c, out, t0, { root = 1400, notes = [[0, 0.07, 3], [5, 0.07, 2], [12, 0.16, -1]], vol = 0.12, fm = 2.01, idx = 0.8, gap = 0.035 } = {}) {
    let t = t0;
    for (const [st, dur, gl] of notes) {
      const f = root * Math.pow(2, st / 12), f2 = f * Math.pow(2, gl / 12);
      const car = c.createOscillator(), m = c.createOscillator(), mg = c.createGain(), g = c.createGain();
      car.frequency.setValueAtTime(f, t); car.frequency.exponentialRampToValueAtTime(f2, t + dur);
      m.frequency.setValueAtTime(f * fm, t); m.frequency.exponentialRampToValueAtTime(f2 * fm, t + dur);
      mg.gain.setValueAtTime(f * idx, t); mg.gain.exponentialRampToValueAtTime(f * idx * 0.2, t + dur);
      m.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(out); env(g, t, 0.006, vol, dur * 0.6, dur * 0.5);
      car.start(t); m.start(t); car.stop(t + dur + 0.15); m.stop(t + dur + 0.15);
      t += dur + gap;
    }
    return t;
  }
  function quindar(c, out, t0, { vol = 0.05 } = {}) {
    const o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter();
    o.frequency.value = 2525; bp.type = "bandpass"; bp.frequency.value = 2500; bp.Q.value = 2;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.004); g.gain.setValueAtTime(vol, t0 + 0.246); g.gain.linearRampToValueAtTime(0, t0 + 0.25);
    o.connect(bp); bp.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.26); return t0 + 0.25;
  }
  function rotor(c, out, t0, { dur = 1.6, bpf = 84, vol = 0.14, top = 0.25 } = {}) {
    const end = t0 + dur, g = c.createGain(); env(g, t0, dur * 0.7, vol, dur * 0.3, 0.4); g.connect(out);
    const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(bpf * 0.04, t0); o.frequency.exponentialRampToValueAtTime(bpf * top, end);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(300, t0); lp.frequency.exponentialRampToValueAtTime(1400, end);
    const n = c.createBufferSource(); n.buffer = noiseBuf(c); n.loop = true; const ng = c.createGain(), am = c.createGain();
    ng.gain.value = 0.5; am.gain.value = 0; o.connect(am.gain); n.connect(am); am.connect(ng); ng.connect(lp);
    o.connect(lp); lp.connect(g); o.start(t0); n.start(t0); o.stop(end + 0.5); n.stop(end + 0.5);
    return end;
  }
  function sweep(c, out, t0, { dur = 0.8, from = 200, to = 3000, vol = 0.08, q = 1.2, type = "bandpass" } = {}) {
    const n = c.createBufferSource(); n.buffer = noiseBuf(c); n.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(from, t0); f.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    n.connect(f); f.connect(g); g.connect(out); n.start(t0); n.stop(t0 + dur + 0.05);
  }
  function tone(c, out, t0, f, dur, { type = "sine", vol = 0.1, to = null, a = 0.004 } = {}) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + dur + 0.05);
  }

  const PROFILES = {
    eagle: { era: "apollo", hum: { f: 100, partials: [0.6, 0.3, 0.2, 1] }, relay: { count: 3, pitch: 0.8 }, charge: { from: 180, to: 2400, dur: 1.0, grit: 0.5 }, servo: { moves: [[0, 0.35, 0.6]], base: 70 }, chirp: { root: 900, notes: [[0, 0.09, 0], [7, 0.09, 0], [12, 0.22, 0]] } },
    surveyor3: { era: "apollo", hum: { f: 50 }, relay: { count: 2, pitch: 0.9 }, charge: { from: 220, to: 2000, dur: 0.9 }, servo: { moves: [[0, 0.5, 0.5], [0.6, 0.3, 0.8]], base: 80, teeth: 20 }, chirp: { root: 760, notes: [[0, 0.1, 0], [-5, 0.08, 0], [7, 0.2, 0]] } },
    alsep: { era: "apollo", hum: { f: 60 }, relay: { count: 2, pitch: 1.1 }, charge: { from: 300, to: 3000, dur: 0.8 }, servo: { moves: [[0, 0.25, 0.4]], base: 120 }, chirp: { root: 1200, notes: [[0, 0.06, 0], [0, 0.06, 0], [12, 0.18, 0]] } },
    rover16: { era: "apollo", hum: { f: 45 }, relay: { count: 2, pitch: 0.85 }, charge: { from: 160, to: 1800, dur: 0.9, grit: 0.5 }, servo: { moves: [[0, 0.9, 0.7]], base: 55, teeth: 30, bright: 1600 }, chirp: { root: 820, notes: [[0, 0.08, 0], [4, 0.08, 0], [7, 0.08, 0], [12, 0.2, 0]] } },
    viking1: { era: "mars-old", hum: { f: 50 }, relay: { count: 3, pitch: 0.75 }, charge: { from: 140, to: 1600, dur: 1.2, grit: 0.6 }, servo: { moves: [[0, 1.1, 0.35]], base: 60, teeth: 24, bright: 1400 }, chirp: { root: 600, notes: [[0, 0.12, 2], [5, 0.12, 0], [3, 0.26, -2]], idx: 1.6 } },
    sojourner: { era: "mars-old", hum: { f: 110, vol: 0.05 }, relay: { count: 1, pitch: 1.6 }, charge: { from: 600, to: 5200, dur: 0.6 }, servo: { moves: [[0, 0.18, 1], [0.24, 0.18, 1], [0.48, 0.25, 0.8]], base: 160, teeth: 10, bright: 3600 }, chirp: { root: 2000, notes: [[0, 0.05, 4], [7, 0.05, 4], [12, 0.12, 2]] } },
    spirit: { era: "mars-mer", hum: { f: 55 }, relay: { count: 2, pitch: 1.0 }, charge: { from: 260, to: 3600, dur: 1.0 }, servo: { moves: [[0, 0.5, 0.6], [0.65, 0.35, 0.9]], base: 95 }, chirp: { root: 1300, notes: [[0, 0.07, 3], [5, 0.07, 2], [12, 0.16, -1]] } },
    opportunity: { era: "mars-mer", hum: { f: 55 }, relay: { count: 2, pitch: 1.0 }, charge: { from: 260, to: 3600, dur: 1.0 }, servo: { moves: [[0, 0.5, 0.6], [0.65, 0.35, 0.9]], base: 95 }, chirp: { root: 1300, notes: [[0, 0.07, 3], [5, 0.07, 2], [12, 0.16, -1], [12, 0.08, 0]] } },
    phoenix: { era: "mars-new", hum: { f: 65 }, relay: { count: 2, pitch: 1.2 }, charge: { from: 400, to: 4400, dur: 1.0 }, servo: { moves: [[0, 0.7, 0.5]], base: 100, bright: 3000 }, chirp: { root: 1800, notes: [[0, 0.06, 0], [7, 0.06, 0], [14, 0.1, 0], [19, 0.24, 0]], idx: 0.3 } },
    insight: { era: "mars-new", hum: { f: 55, partials: [1, 0.4, 0.2, 0.05] }, relay: { count: 2, pitch: 1.2 }, charge: { from: 380, to: 4200, dur: 1.0 }, servo: { moves: [[0, 0.8, 1]], base: 62, teeth: 16, bright: 2600 }, chirp: { root: 1600, notes: [[0, 0.08, 0], [4, 0.08, 0], [11, 0.26, 1]], idx: 0.25 } },
    ingenuity: { era: "mars-new", rotor: { bpf: 84, dur: 1.5 }, hum: { f: 84, partials: [0.4, 1, 0.6, 0.2], vol: 0.05 }, relay: { count: 1, pitch: 1.5 }, charge: { from: 500, to: 5000, dur: 0.7 }, chirp: { root: 2200, notes: [[0, 0.04, 5], [5, 0.04, 5], [12, 0.1, 3]] } },
  };
  const TRIM = { eagle: 5.6, surveyor3: 6.9, alsep: 6.8, rover16: 6.8, viking1: 6.5, sojourner: 7.0, spirit: 5.8, opportunity: 5.6, phoenix: 4.9, insight: 5.5, ingenuity: 5.9 };

  let liveHum = null;
  function stopHum(fade = 0.8) { if (liveHum && ctx) { liveHum.stop(ctx.currentTime, fade); liveHum = null; } }

  /* the full wake; returns cue times (s from now) or null when audio is unavailable */
  function wake(id, delay = 0) {
    if (!ready()) return null;
    const c = ctx, P = PROFILES[id] || PROFILES.spirit, t0 = c.currentTime + 0.03 + delay, cues = {};
    const out = c.createGain(); out.gain.value = DB(TRIM[id] || 0); out.connect(bus.wake);
    relay(c, out, t0, { vol: 0.3, ...P.relay });
    if (P.era === "apollo") quindar(c, out, t0 + 0.12);
    const chargeEnd = charge(c, out, t0 + 0.1, { vol: 0.16, ...P.charge }); cues.chargeEnd = chargeEnd - t0;
    relay(c, out, chargeEnd, { vol: 0.28, pitch: (P.relay.pitch || 1) * 0.9 });
    let moveEnd = chargeEnd;
    if (P.rotor) moveEnd = rotor(c, out, chargeEnd - 0.1, { vol: 0.15, ...P.rotor });
    if (P.servo) moveEnd = servo(c, out, chargeEnd + 0.12, { vol: 0.16, ...P.servo });
    stopHum(0.3);
    liveHum = hum(c, out, chargeEnd - 0.05, { vol: 0.06, spin: 0.8, ...P.hum });
    const tChirp = Math.max(moveEnd + 0.1, chargeEnd + 0.6); cues.chirp = tChirp - t0;
    const end = chirp(c, out, tChirp, { vol: 0.12, ...P.chirp }); cues.done = end - t0;
    liveHum.gain.gain.setTargetAtTime(DB(-12) * (P.hum.vol || 0.06), end + 0.4, 0.8);
    return cues;
  }
  const at = () => ctx.currentTime + 0.02;
  const UI = {
    descend() { if (!ready()) return; sweep(ctx, bus.wake, at(), { dur: 0.9, from: 2600, to: 180, vol: 0.06, q: 0.9 }); tone(ctx, bus.wake, at(), 70, 1.0, { type: "sine", vol: 0.05, to: 40 }); },
    land() { if (!ready()) return; const t = at(); tone(ctx, bus.wake, t, 62, 0.45, { vol: 0.22, to: 34 }); sweep(ctx, bus.wake, t, { dur: 0.5, from: 900, to: 160, vol: 0.05, type: "lowpass", q: 0.7 }); },
    tick() { if (!ready()) return; tone(ctx, bus.ui, at(), 1900 + Math.random() * 300, 0.025, { type: "square", vol: 0.012 }); },
    dim() { if (!ready()) return; relay(ctx, bus.wake, at(), { vol: 0.14, pitch: 0.6 }); },
    lock() { if (!ready()) return; const t = at(); tone(ctx, bus.ui, t, 1318.5, 0.18, { vol: 0.05 }); tone(ctx, bus.ui, t + 0.09, 1975.5, 0.32, { vol: 0.05 }); },
    blip() { if (!ready()) return; tone(ctx, bus.ui, at(), 1480, 0.07, { vol: 0.035, to: 1760 }); },
    hover() { if (!ready()) return; tone(ctx, bus.ui, at(), 980, 0.05, { vol: 0.02, to: 1180 }); },
    /* Earth calls: a sonar-like DSN ping with a long echo tail, the signal hiss crossing space for `dur` s, a small pip on arrival */
    ping(dur = 1.3) {
      if (!ready()) return; const c = ctx, t = at();
      const d = c.createDelay(1.5), fb = c.createGain(), lp = c.createBiquadFilter(), wet = c.createGain();
      d.delayTime.value = 0.31; fb.gain.value = 0.48; lp.type = "lowpass"; lp.frequency.value = 2600; wet.gain.value = 0.55;
      d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(bus.wake);
      const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(1180, t); o.frequency.exponentialRampToValueAtTime(1120, t + 0.6);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(bus.wake); g.connect(d); o.start(t); o.stop(t + 0.75);
      tone(c, bus.wake, t, 2360, 0.4, { vol: 0.03 });
      sweep(c, bus.wake, t + 0.15, { dur: Math.max(0.6, dur - 0.1), from: 260, to: 2800, vol: 0.035, q: 3 });
      const ta = t + dur; tone(c, bus.wake, ta, 2349, 0.09, { vol: 0.06 }); tone(c, bus.wake, ta + 0.1, 1760, 0.16, { vol: 0.04 });
      setTimeout(() => { try { fb.gain.value = 0; wet.disconnect(); } catch {} }, (dur + 4) * 1000);
    },
    /* one faint answer: an electrical tick and a 120 Hz buzz that dies */
    flicker() {
      if (!ready()) return; const t = at();
      relay(ctx, bus.wake, t, { vol: 0.12, pitch: 1.4 });
      tone(ctx, bus.wake, t + 0.01, 120, 0.22, { type: "sawtooth", vol: 0.035 });
      tone(ctx, bus.wake, t + 0.14, 120, 0.12, { type: "sawtooth", vol: 0.02 });
    },
  };
  window.GS_wakeAudio = { init, wake, stopHum, ui: UI, profiles: PROFILES, get ctx() { return ctx; } };
})();
