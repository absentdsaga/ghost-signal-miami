/* Radio voice: makes the robot's reply sound like a far-away signal from the machine's own era.
   Live: GS_radio.attach(ctx, mediaSource, audioEl) returns the node to connect onward; GS_radio.preset(robotId, mood) before each reply.
   Offline (tests): GS_radio.render(buffer, robotId, mood) -> Promise<AudioBuffer>. */
(() => {
  const ERA = { eagle: "apollo", alsep: "apollo", rover16: "apollo", surveyor3: "sixties", viking1: "viking", sojourner: "packet", spirit: "packet", opportunity: "packet", phoenix: "modern", insight: "modern", ingenuity: "modern" };
  const P = {
    apollo:  { hp: 300, lp: 2700, pres: 4, drive: 2.6, bits: 0, ring: 0.05, ringHz: 55, comb: 0.10, combMs: 3.1, hiss: 0.012, crackle: 0.022, drop: 0, quindar: true, chirp: 0, makeup: 0.74 },
    sixties: { hp: 320, lp: 2600, pres: 4, drive: 3.0, bits: 0, ring: 0.06, ringHz: 48, comb: 0.12, combMs: 3.6, hiss: 0.014, crackle: 0.026, drop: 0, quindar: false, chirp: 1, makeup: 0.72 },
    viking:  { hp: 280, lp: 3000, pres: 3.5, drive: 2.2, bits: 0, ring: 0.07, ringHz: 62, comb: 0.12, combMs: 2.7, hiss: 0.010, crackle: 0.012, drop: 0.08, quindar: false, chirp: 2, makeup: 0.82 },
    packet:  { hp: 240, lp: 3600, pres: 3, drive: 1.5, bits: 7, ring: 0.06, ringHz: 90, comb: 0.10, combMs: 2.2, hiss: 0.005, crackle: 0, drop: 0.16, quindar: false, chirp: 3, makeup: 0.7 },
    modern:  { hp: 180, lp: 5200, pres: 2.5, drive: 1.2, bits: 0, ring: 0.05, ringHz: 110, comb: 0.09, combMs: 1.8, hiss: 0.0035, crackle: 0, drop: 0.05, quindar: false, chirp: 4, makeup: 0.7 },
  };
  const LAST = { lpMul: 0.85, hissMul: 1.8, crackleMul: 1.6, dropAdd: 0.12, driveMul: 1.2 };
  const sfxOff = () => { try { return localStorage.getItem("ghostsignal.sfx") === "off"; } catch { return false; } };
  const presetFor = (id, mood) => {
    const base = { ...(P[ERA[id]] || P.modern), era: ERA[id] || "modern" };
    if (mood === "last") { base.lp *= LAST.lpMul; base.hiss *= LAST.hissMul; base.crackle *= LAST.crackleMul; base.drop += LAST.dropAdd; base.drive *= LAST.driveMul; }
    return base;
  };
  function curve(drive, bits) {
    const n = 2048, c = new Float32Array(n), k = Math.tanh(drive), lv = bits ? Math.pow(2, bits - 1) : 0;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      let y = Math.tanh(drive * x) / k;
      if (lv) y = Math.round(y * lv) / lv;
      c[i] = y;
    }
    return c;
  }
  function noiseBuf(ctx, kind) {
    const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    if (kind === "hiss") { for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    else { for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * (0.5 + Math.random()) : 0; }
    return b;
  }
  function build(ctx, input) {
    const N = {};
    N.delay = ctx.createDelay(0.5); N.delay.delayTime.value = 0;
    N.hp1 = ctx.createBiquadFilter(); N.hp1.type = "highpass"; N.hp1.Q.value = 0.7;
    N.hp2 = ctx.createBiquadFilter(); N.hp2.type = "highpass"; N.hp2.Q.value = 0.7;
    N.lp1 = ctx.createBiquadFilter(); N.lp1.type = "lowpass"; N.lp1.Q.value = 0.7;
    N.lp2 = ctx.createBiquadFilter(); N.lp2.type = "lowpass"; N.lp2.Q.value = 0.9;
    N.pres = ctx.createBiquadFilter(); N.pres.type = "peaking"; N.pres.frequency.value = 2000; N.pres.Q.value = 0.9;
    N.shaper = ctx.createWaveShaper(); N.shaper.oversample = "2x";
    N.sum = ctx.createGain();
    N.dry = ctx.createGain();
    N.ringG = ctx.createGain(); N.ringG.gain.value = 0; N.ringMix = ctx.createGain();
    N.ringOsc = ctx.createOscillator(); N.ringOsc.type = "sine"; N.ringOsc.connect(N.ringG.gain); N.ringOsc.start();
    N.comb = ctx.createDelay(0.05); N.combFb = ctx.createGain(); N.combFb.gain.value = 0.45; N.combMix = ctx.createGain();
    N.drop = ctx.createGain();
    N.comp = ctx.createDynamicsCompressor(); N.comp.threshold.value = -26; N.comp.knee.value = 8; N.comp.ratio.value = 4; N.comp.attack.value = 0.004; N.comp.release.value = 0.12;
    N.makeup = ctx.createGain();
    N.lim = ctx.createDynamicsCompressor(); N.lim.threshold.value = -4; N.lim.knee.value = 0; N.lim.ratio.value = 20; N.lim.attack.value = 0.001; N.lim.release.value = 0.08;
    N.out = ctx.createGain();
    N.bed = ctx.createGain(); N.bed.gain.value = 0;
    N.bedHp = ctx.createBiquadFilter(); N.bedHp.type = "highpass"; N.bedLp = ctx.createBiquadFilter(); N.bedLp.type = "lowpass";
    N.hissG = ctx.createGain(); N.crackG = ctx.createGain();
    const hiss = ctx.createBufferSource(); hiss.buffer = noiseBuf(ctx, "hiss"); hiss.loop = true; hiss.connect(N.hissG); hiss.start();
    const crk = ctx.createBufferSource(); crk.buffer = noiseBuf(ctx, "crackle"); crk.loop = true; crk.connect(N.crackG); crk.start();
    N.hissG.connect(N.bedHp); N.crackG.connect(N.bedHp); N.bedHp.connect(N.bedLp); N.bedLp.connect(N.bed); N.bed.connect(N.out);
    N.tones = ctx.createGain(); N.tones.connect(N.out);
    input.connect(N.delay); N.delay.connect(N.hp1); N.hp1.connect(N.hp2); N.hp2.connect(N.lp1); N.lp1.connect(N.lp2); N.lp2.connect(N.pres); N.pres.connect(N.shaper);
    N.shaper.connect(N.dry); N.dry.connect(N.sum);
    N.shaper.connect(N.ringG); N.ringG.connect(N.ringMix); N.ringMix.connect(N.sum);
    N.shaper.connect(N.comb); N.comb.connect(N.combFb); N.combFb.connect(N.comb); N.comb.connect(N.combMix); N.combMix.connect(N.sum);
    N.sum.connect(N.drop); N.drop.connect(N.comp); N.comp.connect(N.makeup); N.makeup.connect(N.lim); N.lim.connect(N.out);
    return N;
  }
  function apply(ctx, N, p) {
    const t = ctx.currentTime, s = (prm, v) => { prm.cancelScheduledValues(t); prm.setValueAtTime(v, t); };
    s(N.hp1.frequency, p.hp); s(N.hp2.frequency, p.hp);
    s(N.lp1.frequency, p.lp); s(N.lp2.frequency, p.lp);
    s(N.pres.frequency, Math.min(2200, p.lp * 0.7)); s(N.pres.gain, p.pres);
    N.shaper.curve = curve(p.drive, p.bits);
    s(N.dry.gain, 1 - p.ring - p.comb * 0.5);
    s(N.ringOsc.frequency, p.ringHz); s(N.ringMix.gain, p.ring);
    s(N.comb.delayTime, p.combMs / 1000); s(N.combMix.gain, p.comb);
    s(N.makeup.gain, p.makeup);
    s(N.bedHp.frequency, Math.max(250, p.hp)); s(N.bedLp.frequency, Math.min(6000, p.lp * 1.1));
    s(N.hissG.gain, p.hiss); s(N.crackG.gain, p.crackle);
    s(N.delay.delayTime, p.quindar ? 0.32 : 0.16);
    s(N.drop.gain, 1);
  }
  function tone(ctx, N, t, freq, dur, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(N.tones);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setValueAtTime(vol, t + dur - 0.008); g.gain.linearRampToValueAtTime(0, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function chirpAt(ctx, N, t, kind, vol = 0.05) {
    if (kind === 1) { tone(ctx, N, t, 1200, 0.07, vol); tone(ctx, N, t + 0.1, 1200, 0.07, vol); }
    else if (kind === 2) { [1700, 1100, 1700].forEach((f, i) => tone(ctx, N, t + i * 0.045, f, 0.035, vol * 0.9)); }
    else if (kind === 3) { [2400, 1800, 2900, 2100].forEach((f, i) => tone(ctx, N, t + i * 0.028, f, 0.022, vol * 0.8)); }
    else if (kind === 4) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.connect(g); g.connect(N.tones);
      o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(3200, t + 0.12);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 0.8, t + 0.01); g.gain.linearRampToValueAtTime(0, t + 0.13);
      o.start(t); o.stop(t + 0.15);
    }
  }
  function opening(ctx, N, p, t) {
    if (sfxOff()) return;
    if (p.quindar) tone(ctx, N, t + 0.02, 2525, 0.25, 0.07);
    else if (p.chirp) chirpAt(ctx, N, t + 0.01, p.chirp);
  }
  function closing(ctx, N, p, t) {
    if (sfxOff()) return;
    if (p.quindar) tone(ctx, N, t, 2475, 0.25, 0.07);
    else if (p.chirp === 1 || p.chirp === 2) chirpAt(ctx, N, t, p.chirp, 0.04);
  }
  function bedTo(ctx, N, v, sec) { const t = ctx.currentTime; N.bed.gain.cancelScheduledValues(t); N.bed.gain.setTargetAtTime(sfxOff() ? 0 : v, t, sec / 3); }
  function dip(ctx, N, t, depth, ms) {
    const g = N.drop.gain; g.setValueAtTime(1, t); g.linearRampToValueAtTime(depth, t + 0.008); g.setValueAtTime(depth, t + ms / 1000); g.linearRampToValueAtTime(1, t + ms / 1000 + 0.012);
  }

  let live = null;
  const api = {
    eraOf: (id) => ERA[id] || "modern",
    presets: P,
    presetFor,
    attach(ctx, src, el) {
      try {
        const N = build(ctx, src);
        live = { ctx, N, el, p: presetFor("", ""), dropT: 0, on: false };
        apply(ctx, N, live.p);
        const stopDrops = () => { clearInterval(live.dropT); live.dropT = 0; };
        const voiced = () => el.src && !el.src.startsWith("data:");
        el.addEventListener("play", () => {
          if (!voiced()) return;
          live.on = true; const p = live.p;
          opening(ctx, N, p, ctx.currentTime); bedTo(ctx, N, 1, 0.25);
          stopDrops();
          if (p.drop > 0) live.dropT = setInterval(() => { if (Math.random() < p.drop) dip(ctx, N, ctx.currentTime + 0.02, 0.3, 35 + Math.random() * 30); }, 700);
        });
        const end = (ended) => {
          if (!live.on) return; live.on = false; stopDrops();
          const lag = N.delay.delayTime.value;
          if (ended) closing(ctx, N, live.p, ctx.currentTime + lag + 0.05);
          setTimeout(() => bedTo(ctx, N, 0, 0.35), (lag + (ended ? 0.35 : 0)) * 1000);
        };
        el.addEventListener("ended", () => end(true));
        el.addEventListener("pause", () => end(false));
        return N.out;
      } catch (e) { live = null; return null; }
    },
    preset(id, mood) {
      if (!live) return;
      live.p = presetFor(id, mood);
      apply(live.ctx, live.N, live.p);
    },
    async render(buffer, id, mood, seed = 7) {
      const lead = 0.6, tail = 0.8, sr = buffer.sampleRate;
      const ctx = new OfflineAudioContext(1, Math.ceil((buffer.duration + lead + tail) * sr), sr);
      const src = ctx.createBufferSource(); src.buffer = buffer;
      const N = build(ctx, src), p = presetFor(id, mood);
      apply(ctx, N, p); N.out.connect(ctx.destination);
      let r = seed; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
      src.start(lead); opening(ctx, N, p, lead);
      N.bed.gain.setValueAtTime(0, 0); N.bed.gain.setTargetAtTime(1, lead, 0.08);
      for (let t = lead + 0.5; t < lead + buffer.duration; t += 0.7) if (p.drop > 0 && rnd() < p.drop) dip(ctx, N, t + p.quindar * 0.32 + 0.16, 0.3, 35 + rnd() * 30);
      const lag = p.quindar ? 0.32 : 0.16, endT = lead + buffer.duration + lag;
      closing(ctx, N, p, endT + 0.05);
      N.bed.gain.setTargetAtTime(0, endT + 0.35, 0.12);
      return ctx.startRendering();
    },
  };
  window.GS_radio = api;
})();
