/* Signalscope: the talk game. Opens full-screen when a robot's call opens (gs:open).
   Hold to tune in, then the machine asks you questions from its real history (data/door.json game.rounds,
   or its disguise tests). Answer by tapping, pressing 1/2/3, or saying it. Right answers clear the picture.
   Every answer ends on a sourced NASA fact (data/robots.json facts). Win = mission patch + time-alone clock.
   Public: window.GS_scope = { open(id), close() }. Events: gs:scope-open, gs:scope-answer {robot, ok}, gs:scope-won {robot, score, of}.
   Off switch: add ?scope=0 to the URL. Look lives in signalscope.css. */
(() => {
  if (/[?&]scope=0/.test(location.search)) return;
  const KEY = "ghostsignal.scope";
  const won = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const saveWon = () => { try { localStorage.setItem(KEY, JSON.stringify(won)); } catch {} };
  let DOOR = null, ROBOTS = null;
  const ready = Promise.all([
    fetch("data/door.json").then((r) => r.json()).then((j) => (DOOR = j)),
    fetch("data/robots.json").then((r) => r.json()).then((j) => (ROBOTS = j)),
  ]).catch(() => {});

  const root = document.createElement("div");
  root.id = "ss"; root.hidden = true;
  root.innerHTML = `
  <div class="ss-scene"></div><div class="ss-static"></div><div class="ss-vig"></div>
  <div class="ss-hud"><button class="ss-pill" data-a="map">&larr; Map</button>
    <div class="ss-id"><b></b><small></small></div>
    <div class="ss-right"><span class="ss-streak"></span><button class="ss-pill" data-a="voice">Voice on</button><button class="ss-pill" data-a="case">Case file</button><div class="ss-pips"></div></div></div>
  <div class="ss-tune"><div class="ss-tw">
    <button class="ss-knob" aria-label="Hold to tune"><svg viewBox="0 0 232 232"><circle cx="116" cy="116" r="108" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="8"/><circle class="ss-arc" cx="116" cy="116" r="108" fill="none" stroke="#d7ff5a" stroke-width="8" stroke-linecap="round" stroke-dasharray="679" stroke-dashoffset="679" style="filter:drop-shadow(0 0 8px #d7ff5a)"/></svg><span class="ss-core">HOLD<br>TO TUNE</span></button>
    <p class="ss-tp"></p><div class="ss-mood"></div></div></div>
  <div class="ss-cap"><div class="ss-who"><span class="ss-wn"></span><span class="ss-wave"><i></i><i></i><i></i></span></div><p class="ss-line"></p></div>
  <div class="ss-timer"><i></i></div>
  <div class="ss-packet"></div><div class="ss-delay"></div>
  <div class="ss-fact"><b>FROM NASA'S RECORDS</b><p></p><a target="_blank" rel="noopener">See the source</a><button class="ss-go">Next</button></div>
  <div class="ss-plus">+1</div>
  <div class="ss-dock"></div>
  <div class="ss-win"><div class="ss-box"><div class="ss-patch"><span></span></div><h2>Signal locked</h2><div class="ss-score"></div>
    <div class="ss-met"><small></small><span></span></div><div class="ss-link"></div>
    <div class="ss-next"><button class="p" data-a="next">Next machine</button><button class="s" data-a="again">Play again</button><button class="s" data-a="case">Open case file</button></div></div></div>`;
  document.body.appendChild(root);
  const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];

  let R = null, rounds = [], i = 0, score = 0, streak = 0, phase = "off", run = 0, voice = true, ac = null, timers = [], tick = null, clock = null;
  const later = (fn, ms) => { const id = run; timers.push(setTimeout(() => { if (id === run) fn(); }, ms)); };
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; clearInterval(tick); clearInterval(clock); tick = clock = null; };
  const sig = (n) => root.style.setProperty("--ss-sig", n);
  const strip = (h) => h.replace(/<[^>]+>/g, "");
  const short = (r) => (/\(([^)]+)\)/.exec(r.name)?.[1] || r.name).toUpperCase();
  const plain = (r) => r.name.replace(/\s*\(.*\)/, "");

  function audio() { try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch {} return ac; }
  function tone(f, d, type = "sine", v = 0.1) { const a = audio(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, a.currentTime); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + d); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + d); }
  function noise(d, v = 0.06) { const a = audio(); if (!a) return; const b = a.createBuffer(1, a.sampleRate * d, a.sampleRate), c = b.getChannelData(0); for (let k = 0; k < c.length; k++) c[k] = Math.random() * 2 - 1; const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = v; s.connect(g).connect(a.destination); s.start(); }
  function speak(text) {
    if (!voice || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(strip(text)); u.rate = 1.05; u.pitch = R?.body === "mars" ? 1.25 : 0.8; u.lang = "en-US";
    speechSynthesis.speak(u);
  }

  function buildRounds(id) {
    const d = DOOR?.[id] || {}, facts = (ROBOTS.find((r) => r.id === id)?.facts) || [];
    let src = (d.game?.rounds || []).map((r) => ({ q: [r.say, r.q].filter(Boolean).join(" "), right: r.right, wrong: r.wrong || [], yes: r.yes, no: r.no }));
    if (!src.length) src = (d.moves || []).filter((m) => m.kind === "disguise" && m.test).map((m) => ({ q: `Someone says they're ${m.who}. ${m.test}`, right: m.right, wrong: m.wrong || [], yes: m.yes, no: m.no }));
    return src.slice(0, 5).map((r, k) => {
      const opts = [r.right, ...r.wrong.slice(0, 2)].map((t, j) => ({ t, ok: j === 0 }));
      for (let a = opts.length - 1; a > 0; a--) { const b = Math.floor(Math.random() * (a + 1)); [opts[a], opts[b]] = [opts[b], opts[a]]; }
      return { ...r, opts, fact: facts.length ? facts[k % facts.length] : null };
    });
  }

  function say(html, who, cb) {
    const c = q(".ss-cap"); q(".ss-who").className = "ss-who" + (who === "you" ? " you" : "");
    q(".ss-wn").textContent = (who === "you" ? "YOU" : short(R)) + " ";
    let d = 0; const out = html.split(/(\s+)/).map((w) => /^\s*$/.test(w) ? w : `<span class="w" style="animation-delay:${(d += 0.055).toFixed(3)}s">${w}</span>`).join("");
    q(".ss-line").innerHTML = out; c.classList.add("show");
    if (who !== "you") speak(html);
    later(cb || (() => {}), d * 1000 + 350);
  }

  function pips() {
    q(".ss-pips").innerHTML = rounds.map((_, k) => `<i style="height:${8 + k * 5}px"></i>`).join("") + `<span>NO SIGNAL</span>`;
  }
  function pipLabel() { const f = score / rounds.length; q(".ss-pips span").textContent = f >= 1 ? "LOCKED" : f >= 0.6 ? "STRONG" : f > 0 ? "CLEARER" : "WEAK SIGNAL"; }

  async function open(id) {
    await ready; if (!DOOR || !ROBOTS) return;
    const r = ROBOTS.find((x) => x.id === id); if (!r) return;
    clearAll(); run++; R = r; rounds = buildRounds(id); if (!rounds.length) return;
    i = 0; score = 0; streak = 0; phase = "tune";
    root.classList.remove("locked", "glitch"); q(".ss-win").classList.remove("show"); q(".ss-fact").classList.remove("show"); q(".ss-cap").classList.remove("show");
    q(".ss-dock").innerHTML = ""; q(".ss-timer").classList.remove("on"); q(".ss-streak").classList.remove("on");
    q(".ss-scene").style.backgroundImage = `url(assets/img/${id}-scene.jpg)`;
    q(".ss-id b").textContent = plain(r).toUpperCase(); q(".ss-id small").textContent = `${r.body === "mars" ? "Mars" : "Moon"} · landed ${r.landed}`;
    q(".ss-tp").innerHTML = `Something on the ${r.body === "mars" ? "Mars" : "Moon"} is still transmitting<small>hold the dial, or hold SPACE</small>`;
    q(".ss-mood").textContent = DOOR[id]?.game?.title ? `${DOOR[id].game.title.toUpperCase()} · ${rounds.length} QUESTIONS` : `${rounds.length} QUESTIONS`;
    hold = 0; q(".ss-arc").style.strokeDashoffset = 679; q(".ss-tune").classList.remove("gone");
    pips(); sig(0);
    root.hidden = false; requestAnimationFrame(() => root.classList.add("on"));
    window.dispatchEvent(new CustomEvent("gs:scope-open", { detail: { robot: id } }));
  }
  function close() {
    clearAll(); run++; phase = "off"; window.speechSynthesis?.cancel();
    root.classList.remove("on"); setTimeout(() => { if (phase === "off") root.hidden = true; }, 500);
  }

  /* tune */
  let hold = 0, ht = null;
  function down() { if (phase !== "tune" || ht) return; audio(); ht = setInterval(() => { hold = Math.min(1, hold + 0.03); q(".ss-arc").style.strokeDashoffset = 679 * (1 - hold); sig(hold * 0.25); if (Math.random() < 0.5) noise(0.05, 0.03 * (1 - hold)); if (Math.random() < 0.2) tone(200 + hold * 600, 0.05, "sawtooth", 0.015); if (hold >= 1) { clearInterval(ht); ht = null; lock(); } }, 30); }
  function up() { if (!ht) return; clearInterval(ht); ht = null; const d = setInterval(() => { if (ht || phase !== "tune") return clearInterval(d); hold = Math.max(0, hold - 0.04); q(".ss-arc").style.strokeDashoffset = 679 * (1 - hold); sig(hold * 0.25); if (hold <= 0) clearInterval(d); }, 30); }
  function lock() {
    phase = "talk"; tone(660, 0.15); later(() => tone(990, 0.3), 120);
    q(".ss-tune").classList.add("gone"); q(".ss-pips span").textContent = "WEAK SIGNAL";
    const d = DOOR[R.id] || {}, intro = d.game?.intro || d.knock;
    later(() => intro ? say(intro, "robot", () => later(ask, 900)) : ask(), 600);
  }

  /* one question */
  function ask() {
    const r = rounds[i]; phase = "ask";
    say(r.q, "robot", () => {
      const dk = q(".ss-dock"); dk.innerHTML = "";
      r.opts.forEach((o, k) => {
        const b = document.createElement("button"); b.className = `ss-opt ss-o${k + 1}`;
        b.innerHTML = `<span class="k">${k + 1}</span><div class="s">${o.t}</div>`; b.onclick = () => pick(k); dk.appendChild(b);
        later(() => { b.classList.add("in"); tone(400 + k * 120, 0.06, "triangle", 0.05); }, 80 + k * 110);
      });
      const m = document.createElement("button"); m.className = "ss-mic";
      m.innerHTML = `<span class="dot"><svg viewBox="0 0 24 24" fill="#111"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0" stroke="#111" stroke-width="2" fill="none"/><rect x="11" y="17" width="2" height="4"/></svg></span><b>Say it</b><small>tap, then talk</small>`;
      m.onclick = () => listen(m); dk.appendChild(m); later(() => m.classList.add("in"), 80 + r.opts.length * 110);
      root.style.setProperty("--ss-dock", dk.offsetHeight + "px");
      later(() => { phase = "pick"; startTimer(); }, 80 + r.opts.length * 110);
    });
  }
  function startTimer() {
    const secs = Math.max(15, (DOOR[R.id]?.game?.time || 10) * 1.6), t0 = Date.now(), bar = q(".ss-timer");
    bar.classList.add("on"); bar.classList.remove("low"); const fill = bar.querySelector("i");
    clearInterval(tick); tick = setInterval(() => {
      const left = 1 - (Date.now() - t0) / (secs * 1000); fill.style.transform = `scaleX(${Math.max(0, left)})`;
      bar.classList.toggle("low", left < 0.3);
      if (left <= 0) { clearInterval(tick); tick = null; if (phase === "pick") pick(-1); }
    }, 100);
  }
  function listen(m) {
    if (phase !== "pick") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { m.querySelector("small").textContent = "no mic here, tap one"; return; }
    const rec = new SR(); rec.lang = "en-US"; m.classList.add("listen"); m.querySelector("small").textContent = "listening...";
    rec.onresult = (e) => {
      const said = e.results[0][0].transcript.toLowerCase(); let best = 0, bi = -2;
      rounds[i].opts.forEach((o, k) => { let ws = o.t.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(" ").filter((w) => w.length > 2 || /\d/.test(w)); if (!ws.length) ws = [o.t.toLowerCase()]; const hit = ws.filter((w) => said.includes(w)).length / ws.length; if (hit > best) { best = hit; bi = k; } });
      m.classList.remove("listen");
      if (bi < 0) { m.querySelector("small").textContent = `heard "${said}". try again`; return; }
      pick(bi);
    };
    rec.onerror = () => { m.classList.remove("listen"); m.querySelector("small").textContent = "didn't catch that"; };
    rec.onend = () => m.classList.remove("listen");
    try { rec.start(); } catch {}
  }
  function delayText() {
    if (R.body === "moon") return "YOUR WORDS ARE CROSSING TO THE MOON · 1.3 SEC";
    const s = (typeof delay !== "undefined" && delay?.mars?.one_way_seconds) || 0;
    return s ? `TO MARS: ${Math.round(s / 60)} MIN EACH WAY · WARPED FOR YOU` : "TO MARS: MINUTES EACH WAY · WARPED FOR YOU";
  }
  function pick(k) {
    if (phase !== "pick") return;
    phase = "wait"; clearInterval(tick); tick = null; q(".ss-timer").classList.remove("on");
    const r = rounds[i], opts = qa(".ss-opt"), ok = k >= 0 && r.opts[k]?.ok;
    opts.forEach((b, j) => { if (j !== k) b.classList.add("dim"); });
    q(".ss-mic")?.classList.add("dim");
    say(k >= 0 ? r.opts[k].t : "...static...", "you");
    const p = q(".ss-packet"); p.classList.remove("fly"); void p.offsetWidth; if (k >= 0) p.classList.add("fly");
    q(".ss-delay").textContent = delayText(); q(".ss-delay").classList.add("show"); tone(520, 0.1, "square", 0.04);
    later(() => {
      q(".ss-delay").classList.remove("show");
      if (ok) {
        opts[k].classList.add("right"); score++; streak++;
        q(`.ss-pips i:nth-child(${score})`)?.classList.add("on"); sig(0.25 + (score / rounds.length) * 0.75); pipLabel();
        const pl = q(".ss-plus"), bb = opts[k].getBoundingClientRect(); pl.textContent = streak > 1 ? `x${streak}` : "+1";
        pl.style.left = bb.left + bb.width / 2 - 40 + "px"; pl.style.top = bb.top - 60 + "px"; pl.classList.remove("go"); void pl.offsetWidth; pl.classList.add("go");
        tone(784, 0.12); later(() => tone(1175, 0.25), 110);
        const st = q(".ss-streak"); if (streak > 1) { st.textContent = `${streak} IN A ROW`; st.classList.add("on"); }
      } else {
        streak = 0; q(".ss-streak").classList.remove("on");
        if (k >= 0) opts[k].classList.add("wrong");
        const rt = opts[r.opts.findIndex((o) => o.ok)]; rt?.classList.remove("dim"); rt?.classList.add("right");
        root.classList.add("glitch"); noise(0.35, 0.15); later(() => root.classList.remove("glitch"), 450);
      }
      window.dispatchEvent(new CustomEvent("gs:scope-answer", { detail: { robot: R.id, ok } }));
      say(ok ? r.yes : (k < 0 ? "Static ate your answer. " : "") + r.no, "robot", () => {
        const f = q(".ss-fact");
        if (!r.fact) return later(advance, 1200);
        f.querySelector("p").textContent = r.fact.text; const a = f.querySelector("a");
        if (r.fact.source) { a.href = r.fact.source; a.hidden = false; } else a.hidden = true;
        f.classList.add("show"); phase = "fact";
        later(advance, Math.min(11000, 4000 + r.fact.text.length * 45));
      });
    }, 1250);
  }
  function advance() {
    if (phase !== "fact" && phase !== "wait") return;
    q(".ss-fact").classList.remove("show"); q(".ss-dock").innerHTML = ""; q(".ss-cap").classList.remove("show");
    i++; if (i < rounds.length) later(ask, 300); else win();
  }

  function win() {
    phase = "won"; root.classList.add("locked"); sig(Math.max(0.55, score / rounds.length));
    [523, 659, 784, 1047].forEach((f, k) => later(() => tone(f, 0.4, "triangle", 0.1), k * 120));
    won[R.id] = Math.max(won[R.id] || 0, score); saveWon();
    window.GS_scenePower?.(R.id, true);
    window.dispatchEvent(new CustomEvent("gs:scope-won", { detail: { robot: R.id, score, of: rounds.length } }));
    q(".ss-patch span").textContent = short(R);
    q(".ss-win h2").textContent = score === rounds.length ? "Perfect signal" : score >= rounds.length / 2 ? "Signal locked" : "Weak, but it heard you";
    q(".ss-score").textContent = `${score} of ${rounds.length} right` + (score < rounds.length ? ". Play again for a perfect signal." : "");
    const land = Date.parse(R.landed) || Date.parse(/[A-Z][a-z]+ \d+, \d{4}/.exec(R.landed + " " + R.last_contact)?.[0]) || Date.UTC(+(/\d{4}/.exec(R.landed)?.[0] || 1970), 0, 1);
    q(".ss-met small").textContent = `${plain(R).toUpperCase()} HAS BEEN ON ${R.body === "mars" ? "MARS" : "THE MOON"} FOR`;
    const tk = () => { let s = Math.floor((Date.now() - land) / 1000); const y = Math.floor(s / 31557600); s -= y * 31557600; const d = Math.floor(s / 86400); s -= d * 86400; const h = Math.floor(s / 3600); s -= h * 3600; const m = Math.floor(s / 60); s -= m * 60; q(".ss-met span").textContent = `${y}y ${d}d ${h}h ${m}m ${String(s).padStart(2, "0")}s`; };
    tk(); clock = setInterval(tk, 1000);
    const nx = nextRobot();
    q(".ss-link").innerHTML = nx ? `Still waiting for a call: <b>${plain(nx)}</b>` : `Every machine on this world has heard from you.`;
    q(".ss-cap").classList.remove("show");
    later(() => q(".ss-win").classList.add("show"), 700);
  }
  function nextRobot() {
    const same = ROBOTS.filter((x) => x.body === R.body), k = same.findIndex((x) => x.id === R.id);
    for (let s = 1; s < same.length; s++) { const c = same[(k + s) % same.length]; if (!won[c.id]) return c; }
    return null;
  }

  /* wiring */
  const knob = q(".ss-knob");
  knob.addEventListener("pointerdown", (e) => { e.preventDefault(); down(); });
  addEventListener("pointerup", up); addEventListener("pointercancel", up);
  q(".ss-fact .ss-go").onclick = () => advance();
  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
    if (a === "voice") { voice = !voice; e.target.textContent = voice ? "Voice on" : "Voice off"; if (!voice) speechSynthesis?.cancel(); }
    if (a === "case") close();
    if (a === "again") open(R.id);
    if (a === "map") { close(); if (window.GS_scene?.phase && window.GS_scene.phase !== "off") window.GS_scene.leave(); else document.getElementById("closeSheet")?.click(); }
    if (a === "next") { const nx = nextRobot(); close(); if (!nx) return; if (window.GS_scene?.phase && window.GS_scene.phase !== "off") window.GS_scene.enter(nx.id); else if (typeof openRobot === "function") openRobot(nx); }
  });
  document.addEventListener("keydown", (e) => {
    if (root.hidden || phase === "off") return;
    if (e.target.closest?.("input,textarea")) return;
    e.stopPropagation();
    if (e.code === "Space") { e.preventDefault(); if (phase === "tune") down(); else if (phase === "fact") advance(); }
    else if (/^Digit[1-3]$/.test(e.code)) pick(+e.code.slice(-1) - 1);
    else if (e.key === "Escape") close();
  }, true);
  document.addEventListener("keyup", (e) => { if (!root.hidden && e.code === "Space") { e.stopPropagation(); up(); } }, true);
  addEventListener("gs:open", (e) => { const id = e.detail?.robot?.id; if (id && !won[id]) open(id); });
  window.GS_scope = { open, close, won };
})();
