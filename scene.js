/* Ghost Signal · feature scenes (branch feature-scenes, Nov 15 2026).
   Tap a machine on the painted map -> the map dives in on it -> its painted scene settles in full screen.
   From the scene: Play this case (the existing call screen, openRobot unchanged), Next machine (same body, wraps),
   Back to map (the dive in reverse). Esc = back, Right arrow = next, browser Back = map, #site=<id> deep links.
   Self-contained: reads app.js globals (robots, lang, body, VISTA, media, name, fld, t, silentParts, openRobot),
   intercepts taps on .vpin in the capture phase, so app.js needs no edits.
   Restored hook: a solved case (game.js localStorage + gs:solved) shows its scene in full colour;
   window.GS_scenePower(id, on) lets later code flip it by hand. */
(() => {
  const S = {
    en: { play: "Play this case", next: "Next machine", back: "Back to map", silent: "Silent for", y: ["year", "years"], mo: ["month", "months"], d: ["day", "days"],
      back2: "Brought back", left: "Left on", moon: "the Moon", mars: "Mars", credit: "Painted from NASA photos · AI-assisted" },
    es: { play: "Jugar este caso", next: "Siguiente máquina", back: "Volver al mapa", silent: "En silencio desde hace", y: ["año", "años"], mo: ["mes", "meses"], d: ["día", "días"],
      back2: "De vuelta", left: "Dejado en", moon: "la Luna", mars: "Marte", credit: "Pintado a partir de fotos de la NASA · con ayuda de IA" },
  };
  const s = (k) => (S[lang] || S.en)[k];
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE_IN = "cubic-bezier(.55,0,.85,.4)", EASE_OUT = "cubic-bezier(.15,.6,.25,1)";
  const ZOOM = 3.2;
  let curId = null, busy = false, pushed = false, front = 0, powered = {};

  /* ---------- DOM ---------- */
  const root = document.createElement("section");
  root.id = "scene"; root.className = "sc"; root.hidden = true;
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
  root.innerHTML = `
    <div class="sc-cam"><div class="sc-drift"><img class="sc-img" alt="" draggable="false"><img class="sc-img" alt="" draggable="false"></div></div>
    <div class="sc-vig"></div>
    <div class="sc-ui">
      <div class="sc-top"><span class="sc-count"></span><span class="sc-credit"></span></div>
      <div class="sc-info">
        <div class="sc-kicker"></div>
        <h1 class="sc-name"></h1>
        <div class="sc-tag"></div>
        <div class="sc-silent"></div>
        <p class="sc-hook"></p>
      </div>
      <div class="sc-ctrls">
        <button class="sc-back" type="button"><span aria-hidden="true">←</span> <span class="l"></span></button>
        <button class="sc-play" type="button"><span class="l"></span></button>
        <button class="sc-next" type="button"><span class="l"></span> <span aria-hidden="true">→</span></button>
      </div>
    </div>`;
  document.body.appendChild(root);
  const q = (c) => root.querySelector(c);
  const imgs = [...root.querySelectorAll(".sc-img")];

  /* ---------- data ---------- */
  const robot = (id) => robots.find((r) => r.id === id);
  const sceneSrc = (id) => media.img?.[id]?.scene?.file || `assets/img/${id}-scene.jpg`;
  function order(b) { // machines on a body, west to east as painted on the map
    const panels = VISTA[b]; if (!panels) return robots.filter((r) => r.body === b).map((r) => r.id);
    return panels.flatMap((p) => Object.entries(p.pts).sort((a, c) => a[1][0] - c[1][0]).map(([id]) => id)).filter(robot);
  }
  function isSolved(id) {
    if (id in powered) return powered[id];
    try { return !!JSON.parse(localStorage.getItem("ghostsignal.v1"))?.solved?.[id]; } catch { return false; }
  }
  const preload = (id) => { const i = new Image(); i.src = sceneSrc(id); return i.decode ? i.decode().catch(() => {}) : Promise.resolve(); };
  const within = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
  const done = (a) => (a ? a.finished.catch(() => {}) : Promise.resolve());

  /* ---------- text ---------- */
  function silentLine(id) {
    if (isSolved(id)) return `<b class="on">● ${s("back2")}</b>`;
    const p = silentParts(id); if (!p) return "";
    const u = (n, k) => `${n} ${s(k)[n === 1 ? 0 : 1]}`;
    return `${s("silent")} <b>${u(p.y, "y")}, ${u(p.mo, "mo")}, ${u(p.d, "d")}</b> · ${p.clock}`;
  }
  function fill(id) {
    const r = robot(id); if (!r) return;
    const list = order(r.body);
    q(".sc-kicker").textContent = `${s("left")} ${r.body === "moon" ? s("moon") : s("mars")}`;
    q(".sc-name").textContent = name(r);
    q(".sc-tag").textContent = (lang === "es" ? r.persona?.tag_es : r.persona?.tag) || "";
    q(".sc-hook").textContent = fld(r, "built_to");
    q(".sc-silent").innerHTML = silentLine(id);
    q(".sc-count").textContent = `${list.indexOf(id) + 1} / ${list.length}`;
    q(".sc-credit").textContent = s("credit");
    q(".sc-play .l").textContent = s("play");
    q(".sc-next .l").textContent = s("next");
    q(".sc-back .l").textContent = s("back");
    q(".sc-next").hidden = list.length < 2;
    root.setAttribute("aria-label", name(r));
    root.classList.toggle("restored", isSolved(id));
    root.dataset.body = r.body;
  }
  setInterval(() => { if (curId && !root.hidden) q(".sc-silent").innerHTML = silentLine(curId); }, 1000);

  /* ---------- the camera ---------- */
  const vista = () => document.getElementById("vista");
  const pinEl = (id) => document.getElementById("g-" + id);
  function diveTransform(id) { // translate+scale that puts the pin at screen centre, zoomed in
    const p = pinEl(id), v = vista(); if (!p || !v) return null;
    const b = p.getBoundingClientRect(), vb = v.getBoundingClientRect();
    const px = b.left + b.width / 2 - vb.left, py = b.top + b.height / 2 - vb.top;
    return `translate(${(vb.width / 2 - ZOOM * px).toFixed(1)}px,${(vb.height / 2 - ZOOM * py).toFixed(1)}px) scale(${ZOOM})`;
  }
  function centrePin(id) {
    const p = pinEl(id), v = vista(); if (!p || !v) return;
    const pr = p.getBoundingClientRect(), vr = v.getBoundingClientRect();
    v.scrollLeft += pr.left + pr.width / 2 - (vr.left + vr.width / 2);
  }
  function setImg(id, k) { const i = imgs[k]; i.src = sceneSrc(id); i.alt = media.img?.[id]?.scene?.caption || ""; }

  async function enter(id, { push = true, instant = false } = {}) {
    const r = robot(id); if (!r || busy) return;
    busy = true; curId = id;
    if (body !== r.body) await switchBody(r.body);
    const ready = preload(id);
    fill(id); setImg(id, front); imgs[front].classList.add("on"); imgs[1 - front].classList.remove("on");
    if (push) { history.pushState({ site: id }, "", "#site=" + id); pushed = true; }
    document.body.classList.add("sc-going");
    const v = vista(), tf = !instant && !reduce() && diveTransform(id);
    let dive = null;
    if (tf) { v.style.transformOrigin = "0 0"; dive = v.animate([{ transform: "none", filter: "brightness(1)" }, { transform: tf, filter: "brightness(.55)" }], { duration: 700, easing: EASE_IN, fill: "forwards" }); }
    await within(ready, tf ? 650 : 900);
    if (tf) await new Promise((res) => setTimeout(res, Math.max(0, 500 - (dive.currentTime || 0))));
    root.hidden = false; document.body.classList.add("sc-on");
    const fade = root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduce() ? 350 : instant ? 500 : 650, easing: "ease-out", fill: "both" });
    const settle = !reduce() && imgs[front].animate([{ transform: "scale(1.16)" }, { transform: "scale(1)" }], { duration: 1200, easing: EASE_OUT, fill: "both" });
    if (!reduce()) q(".sc-ui").animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: instant ? 150 : 500, easing: EASE_OUT, fill: "both" });
    await done(fade); dive?.cancel(); v.style.transformOrigin = "";
    await done(settle || null);
    q(".sc-play").focus({ preventScroll: true });
    busy = false;
  }

  async function leave({ fromPop = false } = {}) {
    if (root.hidden || busy) return;
    busy = true;
    const sh = document.getElementById("sheet"); if (sh?.classList.contains("open")) document.getElementById("closeSheet").click();
    const id = curId;
    if (!fromPop) { if (pushed) { pushed = false; busy = false; history.back(); return; } history.replaceState(null, "", location.pathname + location.search); }
    pushed = false;
    centrePin(id);
    const v = vista(), tf = !reduce() && diveTransform(id);
    document.body.classList.remove("sc-going");
    let pull = null;
    if (tf) { v.style.transformOrigin = "0 0"; pull = v.animate([{ transform: tf, filter: "brightness(.55)" }, { transform: "none", filter: "brightness(1)" }], { duration: 800, delay: 180, easing: EASE_OUT, fill: "backwards" }); }
    if (!reduce()) imgs[front].animate([{ transform: "scale(1)" }, { transform: "scale(1.14)" }], { duration: 550, easing: EASE_IN, fill: "forwards" });
    const fade = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce() ? 300 : 520, easing: "ease-in", fill: "forwards" });
    await done(fade);
    root.hidden = true; document.body.classList.remove("sc-on"); fade.cancel();
    imgs.forEach((i) => i.getAnimations().forEach((a) => a.cancel()));
    await done(pull); v.style.transformOrigin = "";
    pinEl(id)?.focus({ preventScroll: true });
    curId = null; busy = false;
  }

  async function next(dir = 1) {
    if (!curId || busy || root.hidden) return;
    const list = order(robot(curId).body); if (list.length < 2) return;
    const id = list[(list.indexOf(curId) + dir + list.length) % list.length];
    busy = true;
    const ready = preload(id), back = 1 - front, out = imgs[front], inn = imgs[back];
    setImg(id, back); await within(ready, 900);
    curId = id; history.replaceState({ site: id }, "", "#site=" + id);
    const ui = q(".sc-ui");
    if (reduce()) {
      inn.classList.add("on"); out.classList.remove("on"); fill(id);
    } else {
      const d = 22 * dir, base = root.classList.contains("restored") ? "" : "grayscale(.85) brightness(.62) contrast(1.06) ";
      out.getAnimations().forEach((a) => a.cancel());
      ui.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
      out.animate([{ transform: "none", filter: base + "blur(0)", opacity: 1 }, { transform: `translateX(${-d}%) scale(1.04)`, filter: base + "blur(10px)", opacity: 0 }], { duration: 420, easing: EASE_IN, fill: "forwards" });
      inn.classList.add("on");
      const nb = isSolved(id) ? "" : "grayscale(.85) brightness(.62) contrast(1.06) ";
      const a = inn.animate([{ transform: `translateX(${d}%) scale(1.06)`, filter: nb + "blur(10px)", opacity: 0 }, { transform: "none", filter: nb + "blur(0)", opacity: 1 }], { duration: 520, delay: 90, easing: EASE_OUT, fill: "backwards" });
      setTimeout(() => fill(id), 200);
      await done(a);
      out.classList.remove("on"); out.getAnimations().forEach((x) => x.cancel());
      ui.getAnimations().forEach((x) => x.cancel());
      ui.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: EASE_OUT });
    }
    front = back;
    busy = false;
  }

  function switchBody(b) {
    const btn = document.querySelector(`#bodySeg [data-body="${b}"]`); if (!btn) return Promise.resolve();
    btn.click();
    return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  }

  /* ---------- wiring ---------- */
  q(".sc-play").onclick = () => { const r = robot(curId); if (r) openRobot(r); };
  q(".sc-next").onclick = () => next(1);
  q(".sc-back").onclick = () => leave();
  // tap on a machine on the painted map: travel instead of opening the call screen straight away
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("#vista .vpin"); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    enter(b.id.slice(2));
  }, true);
  document.addEventListener("pointerover", (e) => { const b = e.target.closest?.("#vista .vpin"); if (b) preload(b.id.slice(2)); });
  document.addEventListener("keydown", (e) => {
    if (root.hidden || e.target.closest?.("input,textarea,[contenteditable]")) return;
    const sheetOpen = document.getElementById("sheet")?.classList.contains("open");
    if (e.key === "Escape") { e.preventDefault(); if (sheetOpen) document.getElementById("closeSheet").click(); else leave(); }
    else if (e.key === "ArrowRight" && !sheetOpen) { e.preventDefault(); next(1); }
    else if (e.key === "ArrowLeft" && !sheetOpen) { e.preventDefault(); next(-1); }
  });
  // pointer parallax: the scene leans a few px toward the cursor
  const cam = q(".sc-cam");
  root.addEventListener("pointermove", (e) => {
    if (reduce() || e.pointerType !== "mouse") return;
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    cam.style.transform = `translate(${(-x * 18).toFixed(1)}px,${(-y * 12).toFixed(1)}px)`;
  });
  addEventListener("popstate", () => {
    const m = /site=([a-z0-9]+)/.exec(location.hash), id = m && robot(m[1]) ? m[1] : null;
    if (id && id !== curId) { if (!root.hidden) { curId = id; fill(id); setImg(id, front); } else enter(id, { push: false, instant: true }); }
    else if (!id && !root.hidden) leave({ fromPop: true });
  });
  addEventListener("gs:lang", () => { if (curId) fill(curId); });
  addEventListener("gs:solved", (e) => { const id = e.detail?.robot; if (id) { powered[id] = true; if (id === curId) fill(id); } });
  window.GS_scenePower = (id, on = true) => { powered[id] = !!on; if (id === curId) fill(id); };
  window.GS_scene = { enter, leave, next };

  // deep link: #site=<id> opens that scene once the map is drawn
  (function deep() {
    const m = /site=([a-z0-9]+)/.exec(location.hash); if (!m) return;
    const go = () => { if (robot(m[1])) setTimeout(() => enter(m[1], { push: false, instant: true }), 0); };
    if (robots.length && document.querySelector("#vista .vpin")) go(); else addEventListener("gs:pins", go, { once: true });
  })();
})();
