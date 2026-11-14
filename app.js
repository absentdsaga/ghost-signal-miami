const API = "https://dioni.zo.space/api/ghost-signal";

const T = {
  en: {
    tag: "Call the robots we left behind", moon: "Moon", mars: "Mars", hint: "Tap a glowing robot to call it",
    hold: "Tap to talk", stop: "Tap to send", typeph: "…or type a question", send: "Send",
    warp: "⏩ Time-warp (skip the real wait)", last: "Hear its last day", label: "Imagined voice (AI). Real NASA facts, each one linked to its source.",
    landed: "Landed", lastc: "Last contact", left: "Left on the", moonW: "Moon", marsW: "Mars",
    listening: "Listening… tap again to send", hearing: "🎙 I can hear you", noaudio: "No sound yet, speak up or check your mic", paused: "Go on, or tap to send", tapsend: "tap to send", sending: (s) => `Your voice is travelling to the robot… ${s}`,
    back: (s) => `Its answer is travelling back… ${s}`, waiting: (t) => `Real wait for a reply from Mars: ${t}. Real mission teams wait this long.`,
    lost: (d) => `Signal lost. Last contact: ${d}.`, err: "Signal lost. Try again.", heard: "You asked",
    delay: (m, r) => `Live from NASA JPL: a message takes ${m} to reach the Moon and ${r} to reach Mars right now`,
    chips: ["Who are you?", "What did you discover?", "What happened on your last day?", "Are you lonely?"],
    lastQ: "What happened on your last day?", photo: "Photo: NASA",
  },
  es: {
    tag: "Llama a los robots que dejamos atrás", moon: "Luna", mars: "Marte", hint: "Toca un robot brillante para llamarlo",
    hold: "Toca para hablar", stop: "Toca para enviar", typeph: "…o escribe una pregunta", send: "Enviar",
    warp: "⏩ Salto en el tiempo (saltar la espera real)", last: "Escucha su último día", label: "Voz imaginada (IA). Datos reales de la NASA, cada uno con su fuente.",
    landed: "Aterrizó", lastc: "Último contacto", left: "Dejado en", moonW: "la Luna", marsW: "Marte",
    listening: "Escuchando… toca otra vez para enviar", hearing: "🎙 Te escucho", noaudio: "Aún no se oye nada, habla más fuerte o revisa el micrófono", paused: "Sigue, o toca para enviar", tapsend: "toca para enviar", sending: (s) => `Tu voz viaja hacia el robot… ${s}`,
    back: (s) => `Su respuesta viene de regreso… ${s}`, waiting: (t) => `Espera real para una respuesta desde Marte: ${t}. Los equipos de misión esperan esto de verdad.`,
    lost: (d) => `Señal perdida. Último contacto: ${d}.`, err: "Se perdió la señal. Intenta otra vez.", heard: "Preguntaste",
    delay: (m, r) => `En vivo desde NASA JPL: un mensaje tarda ${m} en llegar a la Luna y ${r} en llegar a Marte ahora mismo`,
    chips: ["¿Quién eres?", "¿Qué descubriste?", "¿Qué pasó en tu último día?", "¿Te sientes solo?"],
    lastQ: "¿Qué pasó en tu último día?", photo: "Foto: NASA",
  },
};

const TILES = {
  moon: "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
  mars: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg",
};
const ATTR = {
  moon: 'Map: <a href="https://trek.nasa.gov/moon/" target="_blank">NASA Moon Trek</a>, LRO WAC mosaic',
  mars: 'Map: <a href="https://trek.nasa.gov/mars/" target="_blank">NASA Mars Trek</a>, Viking MDIM 2.1',
};

let lang = "en", body = "moon", robots = [], cur = null, delay = null, layer = null, markers = [];
let warpNow = null, busy = false, warped = false;
const $ = (id) => document.getElementById(id);
const t = (k) => T[lang][k];

const map = L.map("map", { crs: L.CRS.EPSG4326, zoomControl: false, attributionControl: true, minZoom: 1, maxZoom: 7, worldCopyJump: false })
  .setView([0, 0], 2);
L.control.zoom({ position: "bottomright" }).addTo(map);

function setTiles() {
  if (layer) map.removeLayer(layer);
  layer = L.tileLayer(TILES[body], { tileSize: 256, noWrap: true, bounds: [[-90, -180], [90, 180]], attribution: ATTR[body], maxNativeZoom: 7 }).addTo(map);
}

function drawPins() {
  markers.forEach((m) => map.removeLayer(m));
  markers = [];
  const list = robots.filter((r) => r.body === body);
  list.forEach((r) => {
    const icon = L.divIcon({ className: "", html: `<div class="ghost" id="g-${r.id}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
    const m = L.marker([r.lat, r.lon], { icon }).addTo(map);
    const dir = r.label_dir || "right";
    m.bindTooltip(name(r), { permanent: true, direction: dir, offset: dir === "left" ? [-12, 0] : dir === "top" ? [0, -12] : dir === "bottom" ? [0, 12] : [12, 0], className: "ghost-label" });
    m.on("click", () => openRobot(r));
    markers.push(m);
  });
  if (list.length) {
    const b = L.latLngBounds(list.map((r) => [r.lat, r.lon]));
    map.fitBounds(b.pad(1.2), { maxZoom: 4 });
  }
}

const name = (r) => (lang === "es" && r.es?.name) || r.name;
const fld = (r, k) => (lang === "es" && r.es?.[k]) || r[k] || "";
const fmt = (s) => {
  if (s < 60) return `${s.toFixed(2)} s`;
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return lang === "es" ? `${m} min ${r} s` : `${m} min ${r} s`;
};

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { const v = t(el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  showDelay();
  drawPins();
  if (cur) fillSheet(cur);
}

function showDelay() {
  if (!delay) return;
  $("delayText").textContent = t("delay")(fmt(delay.moon.one_way_seconds), fmt(delay.mars.one_way_seconds));
}

function fillSheet(r) {
  $("rName").textContent = name(r);
  $("rTag").textContent = (lang === "es" ? r.persona?.tag_es : r.persona?.tag) || "";
  $("rKicker").textContent = `${t("left")} ${r.body === "moon" ? t("moonW") : t("marsW")}`;
  $("rMeta").textContent = `${t("landed")} ${r.landed || "?"} · ${t("lastc")} ${r.last_contact || "?"}${r.mission_length ? " · " + r.mission_length : ""}`;
  $("rBuilt").textContent = fld(r, "built_to");
  $("rPhoto").src = r.image?.url || "";
  $("rPhoto").alt = r.image?.caption || name(r);
  $("rCredit").textContent = t("photo") + (r.image?.nasa_id ? ` · ${r.image.nasa_id}` : "");
  $("chips").innerHTML = "";
  t("chips").forEach((q) => { const b = document.createElement("button"); b.textContent = q; b.onclick = () => ask({ text: q }); $("chips").appendChild(b); });
}

function openRobot(r) {
  cur = r;
  document.querySelectorAll(".ghost").forEach((g) => g.classList.remove("sel"));
  $("g-" + r.id)?.classList.add("sel");
  $("answer").textContent = ""; $("answer").className = "answer"; $("sources").innerHTML = ""; $("status").textContent = "";
  fillSheet(r);
  $("sheet").classList.add("open"); $("sheet").setAttribute("aria-hidden", "false");
  $("hint").style.display = "none";
  prewarm(r);
}

const warmed = new Set();
function prewarm(r) {
  const k = r.id + "|" + lang;
  if (warmed.has(k)) return; warmed.add(k);
  const fd = new FormData(); fd.append("robot", r.id); fd.append("lang", lang); fd.append("voice", "0"); fd.append("text", t("lastQ"));
  fetch(API + "/ask", { method: "POST", body: fd }).then((x) => x.json()).then((res) => {
    if (res.answer) fetch(`${API}/speak?robot=${encodeURIComponent(r.id)}&lang=${lang}&text=${encodeURIComponent(res.answer)}`).catch(() => {});
  }).catch(() => {});
}

$("closeSheet").onclick = () => { $("sheet").classList.remove("open"); $("hint").style.display = ""; stopAudio(); };

function animateBlip(ms, back) {
  const blip = $("blip");
  blip.style.transition = "none"; blip.style.opacity = 1; blip.style.left = back ? "calc(100% - 10px)" : "0";
  void blip.offsetWidth;
  blip.style.transition = `left ${ms}ms linear`;
  blip.style.left = back ? "0" : "calc(100% - 10px)";
}

function wait(ms, label) {
  return new Promise((res) => {
    if (warped) ms = Math.min(ms, 600);
    const end = Date.now() + ms;
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      $("status").textContent = label(fmt(left / 1000));
      if (left <= 0) return res();
      timer = setTimeout(tick, 100);
    };
    let timer;
    warpNow = () => { clearTimeout(timer); res(); };
    tick();
  });
}

const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const player = new Audio();
let audioEl = null, unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  try { player.src = SILENT; const p = player.play(); if (p) p.catch(() => { unlocked = false; }); } catch { unlocked = false; }
}
function stopAudio() { player.onended = null; player.onerror = null; try { player.pause(); } catch {} audioEl = null; }

async function travel(oneWay) {
  if (oneWay < 10) {
    animateBlip(oneWay * 1000, false);
    await wait(oneWay * 1000, t("sending"));
    return;
  }
  $("warpBtn").hidden = false;
  $("answer").textContent = t("waiting")(fmt(oneWay * 2));
  animateBlip(oneWay * 1000, false);
  await wait(oneWay * 1000, t("sending"));
}

async function travelBack(oneWay) {
  if (oneWay < 10) { animateBlip(oneWay * 1000, true); await wait(oneWay * 1000, t("back")); return; }
  animateBlip(oneWay * 1000, true);
  await wait(oneWay * 1000, t("back"));
  $("warpBtn").hidden = true;
}

$("warpBtn").onclick = () => { warped = true; $("blip").style.transition = "left .5s linear"; warpNow && warpNow(); };

async function ask({ text, audio, last }) {
  if (!cur || busy) return;
  unlock();
  busy = true; warped = false; stopAudio();
  const r = cur;
  const oneWay = delay ? delay[r.body].one_way_seconds : (r.body === "moon" ? 1.3 : 600);
  $("answer").className = "answer"; $("answer").textContent = ""; $("sources").innerHTML = "";
  const fd = new FormData();
  fd.append("robot", r.id); fd.append("lang", lang); fd.append("voice", "0");
  if (text) fd.append("text", text);
  if (audio) fd.append("audio", audio, "q.webm");
  const req = fetch(API + "/ask", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({ error: t("err") }));
  try {
    await travel(oneWay);
    $("status").textContent = "…";
    const res = await req;
    if (!res.error && res.answer) {
      player.onended = null; player.onerror = null;
      player.src = `${API}/speak?robot=${encodeURIComponent(r.id)}&lang=${lang}&text=${encodeURIComponent(res.answer)}`;
      player.preload = "auto"; player.load(); audioEl = player;
    }
    await travelBack(oneWay);
    $("warpBtn").hidden = true;
    if (res.error) { $("status").textContent = res.error; return; }
    $("status").innerHTML = ""; const h = document.createElement("div"); h.className = "heard"; h.textContent = `${t("heard")}: “${res.heard}”`; $("status").appendChild(h);
    $("answer").textContent = res.answer;
    (res.sources || []).forEach((s) => {
      const a = document.createElement("a"); a.href = s.source; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "NASA source · " + new URL(s.source).hostname.replace("www.", ""); a.title = s.text; $("sources").appendChild(a);
    });
    if (audioEl) {
      const a = audioEl;
      if (last) { a.onended = () => signalLost(r); a.onerror = () => signalLost(r); }
      a.play().catch(() => { if (last) signalLost(r); });
    } else if (last) signalLost(r);
  } finally { busy = false; $("blip").style.opacity = 0; }
}

function signalLost(r) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const len = ctx.sampleRate * 2.2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.25 * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); src.start();
  } catch {}
  $("g-" + r.id)?.classList.remove("sel");
  const g = $("g-" + r.id); if (g) { g.style.animation = "none"; g.style.opacity = 0.25; setTimeout(() => { g.style.animation = ""; g.style.opacity = ""; }, 6000); }
  $("status").textContent = t("lost")(r.last_contact || "?");
  $("answer").classList.add("dead");
}

$("lastBtn").onclick = () => ask({ text: t("lastQ"), last: true });
$("typeForm").onsubmit = (e) => { e.preventDefault(); const v = $("typeBox").value.trim(); if (v) { $("typeBox").value = ""; ask({ text: v }); } };


let meterCtx = null, meterRaf = 0;
function startMeter(stream) {
  const box = $("meter"), bars = [...box.children];
  box.hidden = false;
  try {
    meterCtx = new (window.AudioContext || window.webkitAudioContext)();
    const an = meterCtx.createAnalyser(); an.fftSize = 512;
    meterCtx.createMediaStreamSource(stream).connect(an);
    const data = new Uint8Array(an.fftSize), t0 = performance.now();
    let lastLoud = t0, heardAny = false;
    const tick = () => {
      an.getByteTimeDomainData(data);
      let sum = 0; for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
      const lvl = Math.min(1, Math.sqrt(Math.sqrt(sum / data.length)) * 3.2);
      const now = performance.now();
      if (lvl > 0.25) { lastLoud = now; heardAny = true; }
      bars.forEach((b, i) => { const k = 0.35 + 0.65 * Math.abs(Math.sin(now / 140 + i * 1.3)); b.style.transform = `scaleY(${Math.max(0.08, lvl * k)})`; });
      const secs = Math.floor((now - t0) / 1000);
      const quiet = now - lastLoud > 2500;
      box.classList.toggle("quiet", quiet);
      $("status").textContent = `${quiet ? t(heardAny ? "paused" : "noaudio") : t("hearing")} · 0:${String(secs).padStart(2, "0")} · ${t("tapsend")}`;
      meterRaf = requestAnimationFrame(tick);
    };
    tick();
  } catch {}
}
function stopMeter() {
  cancelAnimationFrame(meterRaf); $("meter").hidden = true;
  try { meterCtx && meterCtx.close(); } catch {} meterCtx = null;
}

let rec = null, chunks = [];
$("micBtn").onclick = async () => {
  if (busy) return;
  unlock();
  if (rec && rec.state === "recording") { rec.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopMeter();
      stream.getTracks().forEach((x) => x.stop());
      $("micBtn").classList.remove("rec"); $("micLabel").textContent = t("hold");
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      if (blob.size > 1500) ask({ audio: blob });
    };
    rec.start();
    $("micBtn").classList.add("rec"); $("micLabel").textContent = t("stop"); $("status").textContent = t("listening");
    startMeter(stream);
  } catch (e) { $("status").textContent = "Mic blocked. Type instead."; }
};

document.querySelectorAll("#bodySeg button").forEach((b) => b.onclick = () => {
  document.querySelectorAll("#bodySeg button").forEach((x) => x.classList.remove("on")); b.classList.add("on");
  body = b.dataset.body; $("sheet").classList.remove("open"); cur = null; setTiles(); drawPins(); $("hint").style.display = "";
});
document.querySelectorAll("#langSeg button").forEach((b) => b.onclick = () => {
  document.querySelectorAll("#langSeg button").forEach((x) => x.classList.remove("on")); b.classList.add("on");
  lang = b.dataset.lang; applyLang();
});

(async function init() {
  setTiles();
  $("micLabel").textContent = t("hold");
  try { robots = await (await fetch("data/robots.json", { cache: "no-store" })).json(); } catch { robots = []; }
  drawPins();
  try { delay = await (await fetch(API + "/delay")).json(); showDelay(); } catch {}
})();
