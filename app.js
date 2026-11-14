const API = "https://dioni.zo.space/api/ghost-signal";

const T = {
  en: {
    tag: "Call the robots we left behind", moon: "Moon", mars: "Mars", hint: "Tap a robot to call it",
    hold: "Tap to talk", stop: "Tap to send", typeph: "…or type a question", send: "Send",
    warp: "⏩ Time-warp (skip the real wait)", last: "Hear its last day", label: "Imagined voice (AI). Real NASA facts, each one linked to its source.",
    landed: "Landed", lastc: "Last contact", left: "Left on", moonW: "the Moon", marsW: "Mars",
    listening: "Listening… tap again to send", hearing: "🎙 I can hear you", noaudio: "No sound yet, speak up or check your mic", paused: "Go on, or tap to send", tapsend: "tap to send", sending: (s) => `Your voice is travelling to the robot… ${s}`,
    back: (s) => `Its answer is travelling back… ${s}`, tuning: "Picking up its signal…", waiting: (t) => `Real wait for a reply from Mars: ${t}. Real mission teams wait this long.`,
    lost: (d) => `Signal lost. Last contact: ${d}.`, err: "Signal lost. Try again.", heard: "You asked",
    delay: (m, r) => `Live from NASA JPL: a message takes ${m} to reach the Moon and ${r} to reach Mars right now`,
    chips: ["Who are you?", "What did you discover?", "What happened on your last day?", "Are you lonely?"],
    lastQ: "What happened on your last day?", photo: "Photo: NASA",
    tRobot: "The robot", tLast: "Its last photo", tOrbit: "From orbit today", msgph: "Leave it a message", leave: "Leave it",
    skipping: "Skipping the real wait", warp: "Time-warp", warpSub: (x) => `skip the real ${x} round trip`,
    silent: "Silent for", awake: "Signal open", ago: "ago",
    calls: (n, tot) => n ? `Not forgotten: called <b>${n}</b> time${n === 1 ? "" : "s"} today${tot > n ? ` · ${tot} all time` : ""}` : `Nobody has called today. Be the first.`,
    tally: (n) => ` · ${n} call${n === 1 ? "" : "s"} today`, sent: "Sent. It will keep it.", y: "y", mo: "m", d: "d",
  },
  es: {
    tag: "Llama a los robots que dejamos atrás", moon: "Luna", mars: "Marte", hint: "Toca un robot para llamarlo",
    hold: "Toca para hablar", stop: "Toca para enviar", typeph: "…o escribe una pregunta", send: "Enviar",
    warp: "⏩ Salto en el tiempo (saltar la espera real)", last: "Escucha su último día", label: "Voz imaginada (IA). Datos reales de la NASA, cada uno con su fuente.",
    landed: "Aterrizó", lastc: "Último contacto", left: "Dejado en", moonW: "la Luna", marsW: "Marte",
    listening: "Escuchando… toca otra vez para enviar", hearing: "🎙 Te escucho", noaudio: "Aún no se oye nada, habla más fuerte o revisa el micrófono", paused: "Sigue, o toca para enviar", tapsend: "toca para enviar", sending: (s) => `Tu voz viaja hacia el robot… ${s}`,
    back: (s) => `Su respuesta viene de regreso… ${s}`, tuning: "Captando su señal…", waiting: (t) => `Espera real para una respuesta desde Marte: ${t}. Los equipos de misión esperan esto de verdad.`,
    lost: (d) => `Señal perdida. Último contacto: ${d}.`, err: "Se perdió la señal. Intenta otra vez.", heard: "Preguntaste",
    delay: (m, r) => `En vivo desde NASA JPL: un mensaje tarda ${m} en llegar a la Luna y ${r} en llegar a Marte ahora mismo`,
    chips: ["¿Quién eres?", "¿Qué descubriste?", "¿Qué pasó en tu último día?", "¿Te sientes solo?"],
    lastQ: "¿Qué pasó en tu último día?", photo: "Foto: NASA",
    tRobot: "El robot", tLast: "Su última foto", tOrbit: "Desde órbita hoy", msgph: "Déjale un mensaje", leave: "Dejar",
    skipping: "Saltando la espera real", warp: "Salto en el tiempo", warpSub: (x) => `saltar los ${x} reales de ida y vuelta`,
    silent: "En silencio desde hace", awake: "Señal abierta", ago: "",
    calls: (n, tot) => n ? `No olvidado: lo llamaron <b>${n}</b> ${n === 1 ? "vez" : "veces"} hoy${tot > n ? ` · ${tot} en total` : ""}` : `Nadie lo ha llamado hoy. Sé el primero.`,
    tally: (n) => ` · ${n} llamada${n === 1 ? "" : "s"} hoy`, sent: "Enviado. Lo va a guardar.", y: "a", mo: "m", d: "d",
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
let warpNow = null, busy = false, warped = false, waitEnd = 0, curOneWay = 0;
const SILENT_SINCE = {
  eagle: "1969-07-21T17:54:00Z", surveyor3: "1967-05-04T00:00:00Z", alsep: "1977-09-30T00:00:00Z", rover16: "1972-04-24T01:25:00Z",
  opportunity: "2018-06-10T00:00:00Z", spirit: "2010-03-22T00:00:00Z", sojourner: "1997-09-27T00:00:00Z", viking1: "1982-11-11T00:00:00Z",
  phoenix: "2008-11-02T00:00:00Z", insight: "2022-12-15T00:00:00Z", ingenuity: "2024-01-18T00:00:00Z",
};
let media = { img: {}, model: {}, audio: {} }, visits = null;
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
    const sz = innerWidth <= 600 ? 42 : 54, h = sz / 2 + 4;
    const im = media.img[r.id] || {};
    const cut = cutOf(im) || null, face = cut || im.portrait?.file || r.image?.url || "";
    const icon = L.divIcon({ className: "", html: `<div class="pin" id="g-${r.id}"><div class="face${cut ? " cut" : ""}" style="background-image:url('${face}')"></div></div>`, iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] });
    const m = L.marker([r.lat, r.lon], { icon }).addTo(map);
    const dir = r.label_dir || "right";
    m.bindTooltip(`${name(r)}<small class="sil" data-id="${r.id}">${silentShort(r.id)}</small>`, { permanent: true, direction: dir, offset: dir === "left" ? [-h, 0] : dir === "top" ? [0, -h] : dir === "bottom" ? [0, h] : [h, 0], className: "ghost-label" });
    m.on("click", () => openRobot(r));
    markers.push(m);
  });
  if (list.length) {
    const b = L.latLngBounds(list.map((r) => [r.lat, r.lon]));
    map.fitBounds(b.pad(1.2), { maxZoom: 4 });
  }
}

function silentParts(id) {
  const since = SILENT_SINCE[id]; if (!since) return null;
  const a = new Date(since), now = new Date();
  let y = now.getUTCFullYear() - a.getUTCFullYear(), mo = now.getUTCMonth() - a.getUTCMonth(), d = now.getUTCDate() - a.getUTCDate();
  if (d < 0) { mo--; d += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate(); }
  if (mo < 0) { y--; mo += 12; }
  const secs = Math.floor((now - a) / 1000) % 86400;
  const hh = String(Math.floor(secs / 3600)).padStart(2, "0"), mm = String(Math.floor(secs / 60) % 60).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  return { y, mo, d, clock: `${hh}:${mm}:${ss}` };
}
function silentShort(id) { const p = silentParts(id); return p ? `${p.y}${t("y")} ${p.mo}${t("mo")} ${p.d}${t("d")}<i> · ${p.clock}</i>` : ""; }
function tickSilence() {
  document.querySelectorAll(".sil").forEach((el) => (el.innerHTML = silentShort(el.dataset.id)));
  if (cur && !$("rSilent").classList.contains("awake")) {
    const p = silentParts(cur.id);
    if (p) $("rSilent").innerHTML = `${t("silent")} <b>${p.y} ${lang === "es" ? "años" : "years"}, ${p.mo} ${lang === "es" ? "meses" : "months"}, ${p.d} ${lang === "es" ? "días" : "days"}</b> · ${p.clock}`;
  }
}
setInterval(tickSilence, 1000);

const cutOf = (im) => (typeof im.cutout === "string" ? im.cutout : im.cutout?.file) || null;
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
  if (cur) fillSheet(cur); else renderVisits();
  tickSilence();
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
  fillStage(r);
  renderVisits();
  $("chips").innerHTML = "";
  t("chips").forEach((q) => { const b = document.createElement("button"); b.textContent = q; b.onclick = () => ask({ text: q }); $("chips").appendChild(b); });
}

function fillStage(r) {
  const im = media.img[r.id] || {}, mdl = media.model[r.id];
  const cut = cutOf(im), por = cut || im.portrait?.file || r.image?.url || "";
  const p = $("rPhoto"); p.classList.toggle("cut", !!cut); p.src = por; p.alt = im.portrait?.caption || r.image?.caption || name(r);
  const mv = $("rModel");
  if (mdl?.file) { if (mv.getAttribute("src") !== mdl.file) mv.setAttribute("src", mdl.file); mv.hidden = false; p.style.visibility = "hidden"; }
  else { mv.hidden = true; mv.removeAttribute("src"); p.style.visibility = ""; }
  $("rLast").src = im.last_seen?.file || ""; $("rOrbit").src = im.from_orbit?.file || "";
  document.querySelector('#stageTabs [data-go="last"]').disabled = !im.last_seen?.file;
  document.querySelector('#stageTabs [data-go="orbit"]').disabled = !im.from_orbit?.file;
  document.querySelector('#stageTabs').style.display = (im.last_seen?.file || im.from_orbit?.file) ? "" : "none";
  showSlide(curSlide || "robot");
}
let curSlide = "robot";
function showSlide(k) {
  if (!cur) return;
  const im = media.img[cur.id] || {};
  if ((k === "last" && !im.last_seen?.file) || (k === "orbit" && !im.from_orbit?.file)) k = "robot";
  curSlide = k;
  document.querySelectorAll("#stage .slide").forEach((s) => s.classList.toggle("on", s.dataset.slide === k));
  document.querySelectorAll("#stageTabs button").forEach((b) => b.classList.toggle("on", b.dataset.go === k));
  const src = k === "last" ? im.last_seen : k === "orbit" ? im.from_orbit : (media.model[cur.id]?.file ? { credit: "3D model: NASA" } : im.portrait);
  const bits = [src?.credit || t("photo"), src?.date].filter(Boolean);
  const lab = k === "last" ? t("tLast") : k === "orbit" ? t("tOrbit") : "";
  $("rCredit").textContent = (lab ? lab + " · " : "") + bits.join(" · ");
  $("rCredit").title = src?.caption || "";
}
document.querySelectorAll("#stageTabs button").forEach((b) => (b.onclick = () => showSlide(b.dataset.go)));
$("rModel").addEventListener("error", () => { $("rModel").hidden = true; $("rPhoto").style.visibility = ""; });

function setAwake(on) {
  const st = $("stage"); st.classList.toggle("awake", on); st.classList.remove("lost");
  const g = cur && $("g-" + cur.id); if (g) { g.classList.toggle("live", on); g.classList.remove("lost"); }
  const el = $("rSilent");
  if (on) { el.classList.add("awake"); el.innerHTML = `<b>● ${t("awake")}</b>`; } else { el.classList.remove("awake"); tickSilence(); }
}

function openRobot(r) {
  cur = r; curSlide = "robot";
  $("stage").classList.remove("awake", "lost", "noise", "talking"); $("rSilent").classList.remove("awake");
  document.querySelectorAll(".pin").forEach((g) => g.classList.remove("sel", "live"));
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

$("closeSheet").onclick = () => { $("sheet").classList.remove("open"); $("hint").style.display = ""; stopAudio(); stopAmbient(); setAwake(false); };

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
    const end = Date.now() + ms; waitEnd = end;
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
const player = new Audio(); player.crossOrigin = "anonymous";
const amb = new Audio(); amb.loop = true; amb.crossOrigin = "anonymous";
let actx = null, analyser = null, routed = false, pulseRaf = 0;
function ensureCtx() {
  try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch {}
  return actx;
}
function routePlayer() {
  if (routed || !actx || actx.state !== "running") return;
  try { const src = actx.createMediaElementSource(player); analyser = actx.createAnalyser(); analyser.fftSize = 256; src.connect(analyser); analyser.connect(actx.destination); routed = true; } catch {}
}
function startPulse() {
  const st = $("stage"), ring = $("glowring"), mv = $("rModel"); st.classList.add("talking");
  const data = new Uint8Array(128);
  cancelAnimationFrame(pulseRaf);
  const tick = () => {
    let lvl = 0;
    if (analyser) { analyser.getByteTimeDomainData(data); let s2 = 0; for (const v of data) { const x = (v - 128) / 128; s2 += x * x; } lvl = Math.min(1, Math.sqrt(s2 / data.length) * 4); }
    else lvl = 0.35 + 0.3 * Math.abs(Math.sin(performance.now() / 120));
    ring.style.setProperty("--v", (1 + lvl * 0.9).toFixed(3));
    if (!mv.hidden) mv.exposure = (0.55 + lvl * 1.1).toFixed(2);
    if (!player.paused && !player.ended) pulseRaf = requestAnimationFrame(tick); else stopPulse();
  };
  tick();
}
function stopPulse() { cancelAnimationFrame(pulseRaf); $("stage").classList.remove("talking"); $("glowring").style.setProperty("--v", 1); const mv = $("rModel"); if (!mv.hidden) mv.exposure = 0.55; }
player.addEventListener("play", startPulse);
player.addEventListener("play", () => { if (!amb.paused) fadeAmb(0.06, 400); });
player.addEventListener("ended", () => { if (!amb.paused && $("stage").classList.contains("awake")) fadeAmb(0.22, 900); });
function startAmbient(r) {
  const a = media.audio[r.id]; if (!a?.file) return;
  try { if (!amb.src.endsWith(a.file)) amb.src = a.file; amb.volume = 0; amb.play().catch(() => {}); fadeAmb(0.22, 1500); } catch {}
}
let ambTimer = 0;
function fadeAmb(to, ms) {
  clearInterval(ambTimer); const from = amb.volume, t0 = Date.now();
  ambTimer = setInterval(() => { const k = Math.min(1, (Date.now() - t0) / ms); amb.volume = Math.max(0, Math.min(1, from + (to - from) * k)); if (k >= 1) { clearInterval(ambTimer); if (to === 0) amb.pause(); } }, 50);
}
function stopAmbient() { fadeAmb(0, 1200); }
function staticBurst(ms, vol = 0.18) {
  const st = $("stage"); st.classList.add("noise");
  const cv = $("staticFx"), cx = cv.getContext("2d"); cv.width = 160; cv.height = 90;
  const img = cx.createImageData(160, 90), t0 = performance.now();
  const draw = () => { for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } cx.putImageData(img, 0, 0); if (performance.now() - t0 < ms) requestAnimationFrame(draw); else st.classList.remove("noise"); };
  draw();
  try {
    const c = ensureCtx(); if (!c) return;
    const len = Math.floor(c.sampleRate * ms / 1000), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * vol * Math.min(1, (len - i) / (len * 0.6));
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.6;
    const src = c.createBufferSource(); src.buffer = buf; src.connect(bp); bp.connect(c.destination); src.start();
  } catch {}
}
let audioEl = null, unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  ensureCtx(); setTimeout(routePlayer, 50);
  try { player.src = SILENT; const p = player.play(); if (p) p.catch(() => { unlocked = false; }); } catch { unlocked = false; }
}
function stopAudio() { player.onended = null; player.onerror = null; try { player.pause(); } catch {} audioEl = null; }

async function travel(oneWay) {
  if (oneWay < 10) {
    animateBlip(oneWay * 1000, false);
    await wait(oneWay * 1000, t("sending"));
    return;
  }
  $("warpBtn").hidden = false; $("warpSub").textContent = t("warpSub")(fmt(oneWay * 2));
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

$("warpBtn").onclick = () => {
  if (warped) return;
  warped = true;
  const skipped = Math.max(0, (waitEnd - Date.now()) / 1000) + curOneWay;
  $("warpBtn").hidden = true;
  timeWarpFx(skipped, () => { $("blip").style.transition = "left .5s linear"; warpNow && warpNow(); });
};
function timeWarpFx(skipped, done) {
  const fx = $("warpfx"), cv = $("warpCanvas"), cx = cv.getContext("2d");
  fx.hidden = false; cv.width = innerWidth; cv.height = innerHeight;
  const W = cv.width, H = cv.height, stars = Array.from({ length: 420 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random() * 40, v: 2 + Math.random() * 10 }));
  const D = 950, t0 = performance.now();
  try { const c = ensureCtx(); const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(90, c.currentTime); o.frequency.exponentialRampToValueAtTime(900, c.currentTime + D / 1000); g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.08, c.currentTime + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + D / 1000); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + D / 1000 + 0.05); } catch {}
  const frame = (now) => {
    const k = Math.min(1, (now - t0) / D), sp = 1 + 30 * Math.sin(Math.PI * k);
    cx.fillStyle = "rgba(0,0,0,0.25)"; cx.fillRect(0, 0, W, H);
    cx.lineCap = "round";
    for (const s of stars) {
      const r0 = s.r; s.r += s.v * sp * 0.6;
      if (s.r > Math.hypot(W, H) / 1.5) { s.r = Math.random() * 20; }
      const x0 = W / 2 + Math.cos(s.a) * r0, y0 = H / 2 + Math.sin(s.a) * r0, x1 = W / 2 + Math.cos(s.a) * s.r, y1 = H / 2 + Math.sin(s.a) * s.r;
      cx.strokeStyle = `rgba(${200 + Math.random() * 55},${210 + Math.random() * 45},255,${0.35 + 0.6 * k})`; cx.lineWidth = 1 + sp / 18;
      cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y1); cx.stroke();
    }
    const left = skipped * (1 - (1 - Math.pow(1 - k, 3)));
    $("warpNum").textContent = fmt(Math.max(0, left));
    if (k < 1) requestAnimationFrame(frame);
    else { $("warpNum").textContent = fmt(0); setTimeout(() => { fx.hidden = true; cx.clearRect(0, 0, W, H); done(); }, 60); }
  };
  requestAnimationFrame(frame);
}

async function ask({ text, audio, last }) {
  if (!cur || busy) return;
  unlock();
  busy = true; warped = false; stopAudio();
  const r = cur;
  const oneWay = delay ? delay[r.body].one_way_seconds : (r.body === "moon" ? 1.3 : 600);
  curOneWay = oneWay;
  setAwake(true); staticBurst(Math.min(2400, Math.max(1200, oneWay * 1000))); startAmbient(r); postVisit(r.id, { kind: "call" });
  $("answer").className = "answer"; $("answer").textContent = ""; $("sources").innerHTML = "";
  const fd = new FormData();
  fd.append("robot", r.id); fd.append("lang", lang); fd.append("voice", "0");
  if (text) fd.append("text", text);
  if (audio) fd.append("audio", audio, "q.webm");
  const req = fetch(API + "/ask", { method: "POST", body: fd }).then((x) => x.json()).catch(() => ({ error: t("err") })).then((res) => {
    if (cur === r && !res.error && res.answer) {
      player.onended = null; player.onerror = null;
      player.src = `${API}/speak?robot=${encodeURIComponent(r.id)}&lang=${lang}&text=${encodeURIComponent(res.answer)}`;
      player.preload = "auto"; player.load(); audioEl = player;
    }
    return res;
  });
  try {
    await travel(oneWay);
    $("status").textContent = t("tuning");
    const res = await req;
    if (!warped) await travelBack(oneWay);
    $("warpBtn").hidden = true;
    if (res.error) { $("status").textContent = res.error; return; }
    $("status").innerHTML = ""; const h = document.createElement("div"); h.className = "heard"; h.textContent = `${t("heard")}: “${res.heard}”`; $("status").appendChild(h);
    $("answer").textContent = res.answer;
    [...new Map((res.sources || []).map((x) => [x.source, x])).values()].forEach((s) => {
      const a = document.createElement("a"); a.href = s.source; a.target = "_blank"; a.rel = "noopener";
      const host = new URL(s.source).hostname.replace("www.", ""); a.textContent = (/nasa\.gov|alsj|lroc|hirise|jpl/.test(host) ? "NASA source · " : "Source · ") + host; a.title = s.text; $("sources").appendChild(a);
    });
    if (audioEl) {
      const a = audioEl;
      if (last) { a.onended = () => signalLost(r); a.onerror = () => signalLost(r); if (media.img[r.id]?.last_seen?.file) showSlide("last"); }
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
  staticBurst(1600, 0.1); stopAmbient(); stopPulse();
  const st = $("stage"); st.classList.remove("awake"); st.classList.add("lost");
  const g = $("g-" + r.id); if (g) { g.classList.remove("live", "sel"); g.classList.add("lost"); setTimeout(() => g.classList.remove("lost"), 8000); }
  $("rSilent").classList.remove("awake"); tickSilence();
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

async function postVisit(id, body) {
  try { const x = await fetch(API + "/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ robot: id, ...body }) }); const j = await x.json(); if (j.robots) { visits = j; renderVisits(); } return j; } catch { return null; }
}
function renderVisits() {
  if (visits) $("hint").dataset.tally = ""; 
  const hint = $("hint"); if (visits && hint) hint.textContent = t("hint") + (visits.today_total ? t("tally")(visits.today_total) : "");
  if (!cur || !visits) { $("rCalls").innerHTML = ""; $("rMsgs").innerHTML = ""; return; }
  const v = visits.robots[cur.id] || { today: 0, total: 0, messages: [] };
  $("rCalls").innerHTML = t("calls")(v.today, v.total);
  $("rMsgs").innerHTML = "";
  (v.messages || []).forEach((m) => { const d = document.createElement("div"); d.textContent = "“" + m.text + "”"; const s = document.createElement("span"); s.textContent = new Date(m.t).toLocaleDateString(lang === "es" ? "es" : "en", { month: "short", day: "numeric" }); d.appendChild(s); $("rMsgs").appendChild(d); });
}
$("msgForm").onsubmit = async (e) => {
  e.preventDefault(); if (!cur) return;
  const v = $("msgBox").value.trim(); if (v.length < 2) return;
  $("msgBox").value = "";
  const j = await postVisit(cur.id, { kind: "message", text: v });
  $("msgBox").placeholder = j && !j.error ? t("sent") : (j?.error || "…");
  setTimeout(() => ($("msgBox").placeholder = t("msgph")), 2500);
};
async function loadMedia() {
  const get = async (f) => { try { const x = await fetch(f, { cache: "no-store" }); return x.ok ? await x.json() : {}; } catch { return {}; } };
  const [img, model, audio] = await Promise.all([get("data/media-images.json"), get("data/media-models.json"), get("data/media-audio.json")]);
  media = { img: img || {}, model: model || {}, audio: audio || {} };
}

(async function init() {
  setTiles();
  $("micLabel").textContent = t("hold");
  try { robots = await (await fetch("data/robots.json", { cache: "no-store" })).json(); } catch { robots = []; }
  await loadMedia();
  drawPins(); tickSilence();
  fetch(API + "/visits").then((x) => x.json()).then((j) => { visits = j; renderVisits(); }).catch(() => {});
  try { delay = await (await fetch(API + "/delay")).json(); showDelay(); } catch {}
})();
