(() => {
  const SRC = { moon: "assets/audio/music-moon.mp3", mars: "assets/audio/music-mars.mp3" };
  const LV = { browse: 0.55, call: 0.3, voice: 0.12 };
  const KEY = "ghostsignal.music";
  let on = localStorage.getItem(KEY) !== "off";
  let ctx = null, started = false, curBody = null, want = LV.browse;
  const tr = {};
  function track(b) {
    if (tr[b]) return tr[b];
    const el = new Audio(SRC[b]); el.loop = true; el.preload = "auto"; el.crossOrigin = "anonymous";
    const t = { el, g: null, v: 0 };
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      const s = ctx.createMediaElementSource(el); t.g = ctx.createGain(); t.g.gain.value = 0; s.connect(t.g); t.g.connect(ctx.destination);
    } catch { t.g = null; el.volume = 0; }
    return (tr[b] = t);
  }
  function ramp(t, to, sec) {
    t.v = to;
    if (t.g && ctx) { const n = ctx.currentTime; t.g.gain.cancelScheduledValues(n); t.g.gain.setValueAtTime(t.g.gain.value, n); t.g.gain.linearRampToValueAtTime(to, n + sec); }
    else { const from = t.el.volume, t0 = performance.now(); clearInterval(t.iv); t.iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / (sec * 1000)); t.el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k >= 1) clearInterval(t.iv); }, 50); }
    if (to === 0) { clearTimeout(t.pz); t.pz = setTimeout(() => { if (t.v === 0) t.el.pause(); }, sec * 1000 + 100); }
  }
  function level() {
    const voice = typeof player !== "undefined" && !player.paused && !player.ended && player.src && !player.src.startsWith("data:");
    const call = document.getElementById("sheet")?.classList.contains("open");
    return voice ? LV.voice : call ? LV.call : LV.browse;
  }
  function apply(sec = 1.2) {
    if (!started) return;
    const b = (typeof body !== "undefined" && body === "mars") ? "mars" : "moon";
    if (!on) { Object.values(tr).forEach((t) => ramp(t, 0, 0.6)); return; }
    if (b !== curBody) { if (curBody && tr[curBody]) ramp(tr[curBody], 0, 2.5); curBody = b; sec = 2.5; }
    const t = track(b); if (t.el.paused) t.el.play().catch(() => {});
    ramp(t, level(), sec);
  }
  function start() {
    if (started) return; started = true;
    try { if (ctx && ctx.state === "suspended") ctx.resume(); } catch {}
    track("moon"); if (ctx && ctx.state === "suspended") ctx.resume();
    apply(4);
  }
  ["pointerdown", "keydown", "touchstart"].forEach((e) => addEventListener(e, start, { capture: true, passive: true }));
  if (typeof player !== "undefined") {
    player.addEventListener("play", () => apply(0.35));
    ["ended", "pause"].forEach((e) => player.addEventListener(e, () => setTimeout(() => apply(1.4), 250)));
  }
  const sheet = document.getElementById("sheet");
  if (sheet) new MutationObserver(() => apply(1.2)).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  document.querySelectorAll("#bodySeg button").forEach((b) => b.addEventListener("click", () => setTimeout(() => apply(), 0)));
  document.addEventListener("visibilitychange", () => { if (document.hidden) Object.values(tr).forEach((t) => t.el.pause()); else { curBody = null; apply(1.5); } });
  const ctrls = document.querySelector("header .controls");
  if (ctrls) {
    const btn = document.createElement("button"); btn.id = "musicBtn"; btn.className = "musicbtn";
    const draw = () => { btn.textContent = on ? "♪" : "♪̸"; btn.setAttribute("aria-pressed", String(on)); btn.title = btn.ariaLabel = on ? "Music on (tap to mute)" : "Music off (tap to play)"; btn.classList.toggle("off", !on); };
    btn.onclick = (e) => { e.stopPropagation(); on = !on; localStorage.setItem(KEY, on ? "on" : "off"); draw(); if (!started) start(); else apply(0.8); };
    draw(); ctrls.appendChild(btn);
  }
  window.GS_music = { on: () => on, levels: LV, state: () => Object.fromEntries(Object.entries(tr).map(([k, t]) => [k, { level: t.v, paused: t.el.paused, t: +t.el.currentTime.toFixed(1), webaudio: !!t.g }])) };
})();
