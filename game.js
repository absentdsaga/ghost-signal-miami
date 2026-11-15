/* Ghost Signal: the case files. Each robot forgot why it went quiet; the caller collects real NASA clues and rebuilds the sentence.
   Logic only. Look and feel live in game.css (Emily: restyle freely; class names and events below are the contract).
   Events fired on window: gs:clue {robot, clue}, gs:wrong {robot}, gs:solved {robot}, gs:guide-open. */
(() => {
  const G = {
    en: {
      welcomeK: "Night shift · Ghost Signal desk", welcomeH: "11 machines went silent. You're on the radio tonight.",
      welcomeP: "NASA left them on the Moon and Mars. Tap one and it calls you back. Get it through its hardest moment and its memory comes home. Bring all 11 home.",
      namePh: "Your name", start: "Start my shift", skip: "Skip", operator: "Operator",
      wake: "Wake it up", wakeAgain: "Call it again", again: "Say hi again", wakeHeard: "You called it", caseK: "Case file", solvedK: "Brought back",
      clues: "Clues", found: (n, m) => `${n} of ${m} found`, newClue: "New clue!", tapToAsk: "tap to ask",
      look: "tap to look", build: "Solve it: build the sentence", bankEmpty: "Find clues to collect words.",
      check: "Check", wrong: "Not quite. Look at your clues and try again.", right: "That's it!",
      guide: "Field guide", guideH: "Field guide", guideP: (n) => `${n} of 11 brought back`,
      notYet: "Not brought back yet", today: "Today's open line", openLine: (n) => `Today's open line: ${n}`,
      everyone: (n) => n ? `Everyone together brought robots back ${n} time${n === 1 ? "" : "s"} today` : "Nobody has brought a robot back today. Be the first.",
      cleared: "All 11 brought back. Every robot remembers you.", toastBack: (n) => `Brought back! ${n} of 11`,
      back1: "Welcome back, {name}. Did you find out what happened to me?", back2: "{name}! I remember everything now, thanks to you.",
      heardClue: "You found a clue by asking", hear: "Hear its last day", sources: "NASA source",
      power: "Signal power", hint: "Hint", hintCost: "costs 1 ▮", lockedMem: "A memory it can't reach yet", lockedSub: "Ask it the right question to unlock it",
      flat: (s) => `Battery flat. Recharging from the Sun… ${s}s`, flatToast: "Battery flat!", scan: { last: "Search its last photo", orbit: "Find it from orbit" }, scanSub: "tap to search",
      cold: "Cold", warm: "Warmer", hot: "Hot!", gotIt: "Found it!", closed: "Case closed", perfect: "Perfect deduction!", stars: ["Solved", "Sharp detective", "Perfect signal"],
      tries: "Each question costs 1 ▮. Run out and the robot falls asleep.",
      gutK: "Gut call", gutH: "First guess, before you dig. No wrong answer yet: you'll find out if you were right.", gutYour: "Your gut said", gutFind: "Find the clues. Were you right?", gutRight: "Called it. Your gut was right.", gutWrong: "Plot twist. Your gut said something else.",
      you: "You", gutSay: (x) => `I think: ${x}`, gutBack: "Maybe... I can't tell yet. Ask me the right things and it'll come back.", notMine: (n) => `That memory isn't mine. ${n} would know that one.`, link: (n) => `Memory link ×${n}`, missed: "Static", showMe: "Show me where you are", showMeR: "Can you see me? Look closely.", allBack: "It's all coming back. Say it with me.", memK: "Memories", pick: "Pick your next question", wrongCost: "Study the NASA archive, then ask the questions only this machine can answer. Each right one brings back a memory. Get every memory back, then piece together what happened.",
    },
    es: {
      welcomeK: "Turno de noche · Central Señal Fantasma", welcomeH: "11 robots quedaron en silencio. Ayúdalos a recordar.",
      welcomeP: "La NASA dejó estas máquinas en la Luna y Marte. Cada una olvidó qué le pasó. Llámalas, encuentra pistas reales de la NASA y resuelve cada caso para traerlas de vuelta.",
      namePh: "Tu nombre", start: "Empezar mi turno", skip: "Saltar", operator: "Operador",
      wake: "Despiértalo", wakeAgain: "Llámalo otra vez", again: "Salúdalo otra vez", wakeHeard: "Lo llamaste", caseK: "Expediente", solvedK: "De vuelta",
      clues: "Pistas", found: (n, m) => `${n} de ${m} encontradas`, newClue: "¡Nueva pista!", tapToAsk: "toca para preguntar",
      look: "toca para mirar", build: "Resuélvelo: arma la frase", bankEmpty: "Encuentra pistas para juntar palabras.",
      check: "Comprobar", wrong: "Casi. Mira tus pistas e intenta otra vez.", right: "¡Eso es!",
      guide: "Guía", guideH: "Guía de campo", guideP: (n) => `${n} de 11 de vuelta`,
      notYet: "Todavía no vuelve", today: "Línea abierta hoy", openLine: (n) => `Línea abierta hoy: ${n}`,
      everyone: (n) => n ? `Entre todos trajeron robots de vuelta ${n} ${n === 1 ? "vez" : "veces"} hoy` : "Nadie ha traído un robot de vuelta hoy. Sé el primero.",
      cleared: "Los 11 están de vuelta. Todos los robots te recuerdan.", toastBack: (n) => `¡De vuelta! ${n} de 11`,
      back1: "Bienvenido de nuevo, {name}. ¿Descubriste qué me pasó?", back2: "¡{name}! Ahora lo recuerdo todo, gracias a ti.",
      heardClue: "Encontraste una pista al preguntar", hear: "Escucha su último día", sources: "Fuente NASA",
      power: "Energía", hint: "Pista", hintCost: "cuesta 1 ▮", lockedMem: "Un recuerdo que todavía no alcanza", lockedSub: "Hazle la pregunta correcta para desbloquearlo",
      flat: (s) => `Batería agotada. Recargando con el Sol… ${s}s`, flatToast: "¡Batería agotada!", scan: { last: "Busca en su última foto", orbit: "Encuéntralo desde órbita" }, scanSub: "toca para buscar",
      cold: "Frío", warm: "Tibio", hot: "¡Caliente!", gotIt: "¡Lo encontraste!", closed: "Caso cerrado", perfect: "¡Deducción perfecta!", stars: ["Resuelto", "Gran detective", "Señal perfecta"],
      tries: "Cada pregunta cuesta 1 ▮. Si se agota, el robot se duerme.",
      gutK: "Corazonada", gutH: "Primera corazonada, antes de investigar. Aún no hay respuesta incorrecta: al final sabrás si acertaste.", gutYour: "Tu corazonada", gutFind: "Encuentra las pistas. ¿Acertaste?", gutRight: "¡Le atinaste! Tu corazonada era cierta.", gutWrong: "Giro inesperado. Tu corazonada era otra.",
      you: "Tú", gutSay: (x) => `Creo que: ${x}`, gutBack: "Quizás... todavía no lo sé. Hazme las preguntas correctas y volverá.", notMine: (n) => `Ese recuerdo no es mío. ${n} lo sabría.`, link: (n) => `Enlace de memoria ×${n}`, missed: "Estática", showMe: "Muéstrame dónde estás", showMeR: "¿Me ves? Mira bien.", allBack: "Lo recuerdo todo. Dilo conmigo.", memK: "Recuerdos", pick: "Elige tu siguiente pregunta", wrongCost: "Estudia el archivo NASA y luego haz las preguntas que solo esta máquina puede responder. Cada acierto trae un recuerdo. Recupera todos los recuerdos y arma lo que pasó.",
    },
  };
  const GENERIC = new Set(["how", "do", "who", "where", "cómo", "como", "quién", "quien", "dónde", "donde", "find", "see", "ver", "fly", "volar"]);
  const KEY = "ghostsignal.v1";
  let D = null, DOOR = {};
  const S = Object.assign({ name: "", solved: {}, clues: {}, woke: {}, visits: {}, power: {}, recharge: {}, drained: {}, hints: {}, wrongs: {}, stars: {}, bets: {}, chat: {}, streak: {} }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
  const g = (k) => G[lang][k];
  const L = (o) => (o && (o[lang] || o.en)) || "";
  const W = (w) => (D?.words?.[w]?.[lang]) || w;
  const caseOf = (id) => D?.cases?.[id] || null;
  const isSolved = (id) => !!S.solved[id];
  const found = (id) => (S.clues[id] ||= []);
  const nm = () => S.name || g("operator");
  const fill = (s) => s.replaceAll("{name}", nm());
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const solvedCount = () => Object.keys(S.solved).filter((id) => caseOf(id)).length;
  let picks = [];
  const FX = (n, o) => window.GSFX?.sfx(n, o);
  const MAXP = 6, RECHARGE_MS = 20000;
  const pw = (id) => (S.power[id] ?? MAXP);
  const recharging = (id) => S.recharge[id] && Date.now() < S.recharge[id];
  function settleRecharge(id) { if (S.recharge[id] && Date.now() >= S.recharge[id]) { delete S.recharge[id]; S.power[id] = MAXP; save(); FX("recharge"); return true; } return false; }
  function spend(id) {
    if (recharging(id)) return false;
    S.power[id] = Math.max(0, pw(id) - 1); save(); FX("power");
    const b = document.querySelector("#gsCase .gs-bars i:not(.off):last-of-type");
    if (b) { const [x, y] = window.GSFX.at(b); window.GSFX.float("−1 ▮", x, y - 10, "#ffae36"); }
    if (S.power[id] <= 0) { S.recharge[id] = Date.now() + RECHARGE_MS; S.drained[id] = true; save(); setTimeout(() => { FX("flat"); toast(g("flatToast")); }, 300); }
    renderPower();
    return true;
  }
  window.GS_spend = (r, o = {}) => {
    const c = caseOf(r.id); if (!c || isSolved(r.id)) return true;
    if (o.kind !== "miss") return true;
    if (!spend(r.id)) { FX("wrong"); window.GSFX?.shake(document.querySelector("#gsCase .gs-power")); return false; }
    return true;
  };
  function renderPower() {
    const box = document.querySelector("#gsCase .gs-power"); if (!box || !cur) return;
    const id = cur.id; settleRecharge(id);
    const p = pw(id), rc = recharging(id);
    box.classList.toggle("flat", !!rc); box.classList.toggle("low", !rc && p <= 2);
    box.innerHTML = `<span class="gs-k">${g("power")}</span><span class="gs-bars">${Array.from({ length: MAXP }, (_, i) => `<i class="${i < p && !rc ? "" : "off"}"></i>`).join("")}</span>
      ${rc ? `<span class="gs-flat">${g("flat")(Math.ceil((S.recharge[id] - Date.now()) / 1000))}</span>` : ""}`;
    document.querySelectorAll("#gsCase .gs-check, #gsCase .gs-hint").forEach((b) => { if (rc) b.disabled = true; });
  }
  setInterval(() => { if (cur && recharging(cur.id) || (cur && S.recharge[cur.id])) { const was = !!S.recharge[cur.id]; renderPower(); if (was && !S.recharge[cur.id]) renderCase(); } }, 1000);

  window.GS_isMystery = (id) => !!caseOf(id) && !isSolved(id);
  window.GS_today = () => (D ? todayId() : null);
  window.GS_player = () => ({ name: S.name, skipped: !!S.skipped, solved: solvedCount() });

  window.GS_beforeAsk = (r, text) => {
    const c = caseOf(r.id); if (!c || isSolved(r.id)) return null;
    const q = " " + text.toLowerCase() + " ";
    const hit = c.clues.find((cl) => cl.how === "ask" && !found(r.id).includes(cl.id) && (cl.keys || []).some((k) => !GENERIC.has(k) && (k.length <= 4 ? q.replace(/[^\p{L}\p{N} ]/gu, " ").includes(" " + k) : q.includes(k))));
    return hit ? { script: L(hit.say), sources: [{ source: hit.source, text: L(hit.say) }], clue: hit.id } : null;
  };

  function unlock(id, clueId, quiet) {
    const c = caseOf(id); if (!c || found(id).includes(clueId)) return;
    found(id).push(clueId); opened[id] = clueId;
    const cl0 = c.clues.find((x) => x.id === clueId); if (cl0 && cl0.how !== "ask") { say(id, "bot", L(cl0.say), cl0.source); if (c.clues.every((x) => found(id).includes(x.id))) say(id, "bot", g("allBack")); }
    save();
    if (cur?.id === id) renderCase(clueId, quiet);
    const card = document.querySelector(`#gsCase .gs-clue[data-clue="${clueId}"]`), cl = c.clues.find((x) => x.id === clueId);
    if (card && !quiet) {
      const [x, y] = window.GSFX.at(card);
      window.GSFX.burst(x, y, { n: 34, speed: 7 }); window.GSFX.float("+ CLUE", x, y - 30);
      (cl?.words || []).forEach((w, i) => setTimeout(() => window.GSFX.float("+ " + W(w), x + 40, y + 10, "#ffae36"), 250 + i * 200));
    }
    window.dispatchEvent(new CustomEvent("gs:clue", { detail: { robot: id, clue: clueId } }));
  }

  /* ---------- welcome + name ---------- */
  function welcome() {
    if (S.name || S.skipped) return;
    const w = el("div", "gs-welcome", `<div class="gs-card"><div class="gs-k">${g("welcomeK")}</div><h1>${g("welcomeH")}</h1><p>${g("welcomeP")}</p>
      <form><input maxlength="20" autocomplete="off" placeholder="${g("namePh")}"><button type="submit" class="gs-go">${g("start")}</button></form><button class="gs-skip" type="button">${g("skip")}</button></div>`);
    w.id = "gsWelcome";
    const done = (n) => { S.name = (n || "").replace(/[^\p{L}\p{N} '\-]/gu, "").trim().slice(0, 20); if (!S.name) S.skipped = true; save(); w.classList.add("out"); setTimeout(() => w.remove(), 400); updateChrome(); window.dispatchEvent(new CustomEvent("gs:named", { detail: { name: S.name } })); };
    w.querySelector("form").onsubmit = (e) => { e.preventDefault(); done(w.querySelector("input").value); };
    w.querySelector(".gs-skip").onclick = () => done("");
    document.body.appendChild(w);
    setTimeout(() => w.querySelector("input")?.focus(), 200);
  }

  /* ---------- header: field guide + today's line ---------- */
  function todayId() {
    const ny = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    const n = Math.floor(Date.parse(ny + "T00:00:00Z") / 86400000);
    return D.order[n % D.order.length];
  }
  function updateChrome() {
    if (!D) return;
    let gb = document.getElementById("gsGuideBtn");
    if (!gb) { gb = el("button", "gs-guidebtn"); gb.id = "gsGuideBtn"; gb.onclick = openGuide; document.querySelector(".top .brand")?.appendChild(gb); }
    gb.innerHTML = `<span class="gs-gl">${g("guide")}</span>`;
    let tl = document.getElementById("gsToday");
    if (!tl) { tl = el("button", "gs-today"); tl.id = "gsToday"; tl.onclick = () => goTo(todayId()); document.body.appendChild(tl); }
    const tr = robots.find((r) => r.id === todayId());
    tl.textContent = tr ? g("openLine")(name(tr)) : "";
    tl.hidden = !tr;
    markPins();
  }
  function markPins() {
    document.querySelectorAll(".pin").forEach((p) => {
      const id = p.id.replace(/^g-/, "");
      p.classList.toggle("restored", isSolved(id));
      p.classList.toggle("today", D && id === todayId());
    });
  }
  function goTo(id) {
    const r = robots.find((x) => x.id === id); if (!r) return;
    if (window.GS_scene && GS_scene.phase === "off" && document.querySelector("#vista .vpin.spr")) { GS_scene.enter(id); return; }
    if (r.body !== body) document.querySelector(`#bodySeg button[data-body="${r.body}"]`)?.click();
    setTimeout(() => { openRobot(r); try { map.flyTo([r.lat, r.lon], Math.max(map.getZoom(), 3), { duration: 0.8 }); } catch {} }, r.body !== body ? 350 : 0);
  }

  /* ---------- field guide ---------- */
  function openGuide() {
    document.getElementById("gsGuide")?.remove();
    const n = solvedCount();
    const ov = el("div", "gs-guide"); ov.id = "gsGuide";
    const back = (typeof visits !== "undefined" && visits) ? visits.back_today || 0 : 0;
    ov.innerHTML = `<div class="gs-gpanel"><button class="gs-x" aria-label="Close">×</button><div class="gs-k">${g("guideH")}</div>
      <h2>${g("guideP")(n)}</h2><div class="gs-progress"><i style="width:${(n / 11) * 100}%"></i></div>
      <p class="gs-everyone">${g("everyone")(back)}</p>${n === 11 ? `<p class="gs-cleared">${g("cleared")}</p>` : ""}<div class="gs-grid"></div></div>`;
    const grid = ov.querySelector(".gs-grid");
    D.order.forEach((id) => {
      const r = robots.find((x) => x.id === id), c = caseOf(id); if (!r || !c) return;
      const im = media.img[id] || {}, face = cutOf(im) || im.portrait?.file || r.image?.url || "";
      const ok = isSolved(id);
      const card = el("button", `gs-page${ok ? " solved" : ""}${id === todayId() ? " today" : ""}`);
      card.dataset.robot = id;
      card.innerHTML = `<div class="gs-pimg" style="--img:url('${face}')"></div><div class="gs-pname">${esc(name(r))}</div>
        ${ok ? `<div class="gs-pline">${esc(sentenceText(c))}</div><div class="gs-pstars">${"★".repeat(S.stars[id] || 1)}<span>${"★".repeat(3 - (S.stars[id] || 1))}</span></div><div class="gs-pkeep">${esc(L(c.keepsake.title))}</div>` : `<div class="gs-pq">${esc(L(c.q))}</div><div class="gs-pstat">${g("notYet")} · ${found(id).length}/${c.clues.length}</div>`}
        ${id === todayId() ? `<span class="gs-ptoday">${g("today")}</span>` : ""}`;
      card.onclick = () => { ov.classList.add("out"); setTimeout(() => ov.remove(), 250); goTo(id); };
      grid.appendChild(card);
    });
    ov.querySelector(".gs-x").onclick = () => { ov.classList.add("out"); setTimeout(() => ov.remove(), 250); };
    ov.onclick = (e) => { if (e.target === ov) ov.querySelector(".gs-x").click(); };
    const escKey = (e) => { if (e.key === "Escape" && document.body.contains(ov)) { e.stopPropagation(); ov.querySelector(".gs-x").click(); } if (!document.body.contains(ov) || e.key === "Escape") removeEventListener("keydown", escKey, true); };
    addEventListener("keydown", escKey, true);
    document.body.appendChild(ov);
    window.dispatchEvent(new CustomEvent("gs:guide-open"));
  }
  const sentenceText = (c, words = c.answer) => L(c.sentence).replace(/\{(\d)\}/g, (_, i) => W(words[+i]));

  /* ---------- the case file inside the robot sheet ---------- */
  function ensureCasePanels() {
    if (!document.getElementById("gsTop")) {
      const top = el("div", "gs-top"); top.id = "gsTop";
      document.querySelector(".sheet-body .built").after(top);
    }
    if (!document.getElementById("gsCase")) {
      const cs = el("div", "gs-case"); cs.id = "gsCase";
      document.querySelector(".sheet-body .call").after(cs);
    }
  }

  function renderTop() {
    const top = document.getElementById("gsTop"), c = cur && caseOf(cur.id);
    document.getElementById("sheet").classList.toggle("gs-unsolved", !!c && !isSolved(cur.id));
    document.getElementById("sheet").classList.toggle("gs-solved", !!c && isSolved(cur.id));
    if (!c) { top.innerHTML = ""; return; }
    const ok = isSolved(cur.id);
    top.innerHTML = `<div class="gs-q"><span class="gs-k">${ok ? "✓ " + g("solvedK") : g("caseK")}</span><b>${esc(L(c.q))}</b></div>`;
    const b = el("button", "gs-wake"); b.textContent = ok ? g("again") : S.woke[cur.id] ? g("wakeAgain") : g("wake");
    if (!ok && S.woke[cur.id]) b.classList.add("small");
    b.onclick = () => wake();
    top.appendChild(b);
  }

  function wake() {
    const r = cur, c = caseOf(r.id); if (!c) return;
    const seen = S.woke[r.id];
    const line = isSolved(r.id) ? g("back2") : seen ? g("back1") : L(c.wake);
    S.woke[r.id] = (S.woke[r.id] || 0) + 1; save();
    pending = true;
    ask({ text: g("wakeHeard"), script: fill(line), kind: "wake" });
    renderCase();
    setTimeout(renderTop, 50);
  }

  function renderCase(newId, quiet) {
    const box = document.getElementById("gsCase"), r = cur, c = r && caseOf(r.id);
    if (!c) { box.innerHTML = ""; return; }
    const ok = isSolved(r.id), have = found(r.id);
    box.innerHTML = "";
    box.dataset.robot = r.id;
    if (ok) {
      box.appendChild(el("div", "gs-restored", `<div class="gs-k">✓ ${g("solvedK")}</div><p class="gs-sent done">${esc(sentenceText(c))}</p>`));
      box.appendChild(keepsake(c));
    }
    if (!ok && !S.woke[r.id]) { renderPower(); return; }
    if (!ok && c.gut && S.bets[r.id] == null) { box.appendChild(chatLog(r)); box.appendChild(gutCall(r, c)); const lg = box.querySelector(".gs-chat"); if (lg) lg.scrollTop = lg.scrollHeight; return; }
    if (!ok && c.gut) box.appendChild(el("div", "gs-gutmine", `<span class="gs-k">${g("gutYour")}</span><b>${esc(L(c.gut.opts[S.bets[r.id]]))}</b><small>${g("gutFind")}</small>`));
    if (!ok && DOOR[r.id] && !DOOR[r.id].game && !S.open?.[r.id]) { box.appendChild(DOOR[r.id].game ? gameView(r, c) : doorView(r, c)); const lg = box.querySelector(".gs-chat"); if (lg) lg.scrollTop = lg.scrollHeight; return; }
    if (!ok) { const pwr = el("div", "gs-power"); box.appendChild(pwr); box.appendChild(el("div", "gs-rule", lang === "es" ? "Cada archivo NASA tiene una palabra tachada. Haz la pregunta correcta para destaparla. Puedes resolver el caso cuando quieras." : "Each NASA file has a word blacked out. Ask the right question to uncover it. Solve the case whenever you think you know.")); }
    if (ok) { box.appendChild(chatLog(r)); nextBtn(box, r); renderPower(); return; }
    box.appendChild(memStrip(r, c, have));
    box.appendChild(leadCard(r, c, have));
    box.appendChild(builder(r, c));
    const more = el("div", "gs-more");
    const dA = el("details", "gs-fold", `<summary>${lang === "es" ? "Ver todo el archivo NASA" : "Browse the full NASA archive"}</summary>`); dA.appendChild(archive(r));
    const dC = el("details", "gs-fold", `<summary>${lang === "es" ? "Toda la conversación" : "Whole conversation"} (${chat(r.id).length})</summary>`); fullLog[r.id] = true; dC.appendChild(chatLog(r)); fullLog[r.id] = false;
    more.appendChild(dA); more.appendChild(dC); box.appendChild(more);
    renderPower();
    const log = box.querySelector(".gs-chat"); if (log) log.scrollTop = log.scrollHeight;
    if (newId && !quiet) {
      const n = box.querySelector(".gs-clue.new");
      n?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      FX("clue");
    }
  }



  /* ---------- one NASA file at a time: redacted fact -> ask -> word uncovered -> next ---------- */
  const opened = {}, leadFrom = {};
  const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function fileFor(r, c, cl, skip = new Set()) {
    if (!skip.size) for (const p of c.clues) { if (p === cl) break; if (p.how === "ask") { const pf = fileFor(r, c, p, new Set([...skip, "_"])); if (pf.fact) skip.add(pf.fact); } }
    const rb = robots.find((x) => x.id === r.id) || {}, es = lang === "es";
    const tx = (f) => (es && f.es ? f.es : f.text) || "";
    const ws = (cl.words || []).map((w) => W(w).toLowerCase());
    const facts = rb.facts || [];
    let f = ws.length && facts.find((f) => !skip.has(f) && ws.some((w) => tx(f).toLowerCase().includes(w)));
    if (!f && !ws.length) {
      const keys = (cl.keys || []).filter((k) => !GENERIC.has(k) && k.length > 3);
      let best = 0; facts.forEach((x) => { if (skip.has(x)) return; const n = keys.filter((k) => tx(x).toLowerCase().includes(k)).length; if (n > best) { best = n; f = x; } });
    }
    return f ? { text: tx(f), source: f.source, fact: f } : { text: L(cl.say), source: cl.source };
  }
  function redact(text, hide, show) {
    let h = esc(text);
    const all = [...new Set([...hide, ...show])].filter(Boolean).sort((a, b) => b.length - a.length);
    all.forEach((w) => {
      const open = show.includes(w);
      h = h.replace(new RegExp(`(?<![\\p{L}>])(${reEsc(esc(w))}(?:e?s)?)(?![\\p{L}<])`, "giu"), (m) => open ? `<mark class="gs-red open">${m}</mark>` : `<mark class="gs-red">${"\u2007".repeat(Math.max(4, m.length))}</mark>`);
    });
    return h;
  }
  function leadCard(r, c, have) {
    const es = lang === "es", nm = name(r), total = c.clues.length;
    const lockedWords = c.clues.filter((x) => !have.includes(x.id)).flatMap((x) => (x.words || []).map(W));
    const shown = opened[r.id] && have.includes(opened[r.id]) ? c.clues.find((x) => x.id === opened[r.id]) : null;
    const cl = shown || c.clues.find((x) => !have.includes(x.id));
    const host = (u) => { try { return new URL(u).hostname.replace("www.", ""); } catch { return "NASA"; } };
    const idx = c.clues.indexOf(cl) + 1;
    if (!cl) {
      const w = el("div", "gs-lead done", `<div class="gs-lead-h"><span class="gs-k">${es ? "Todos los archivos abiertos" : "Every file uncovered"}</span></div><p class="gs-lead-txt">${es ? "Ya tienes todas las palabras. Arma lo que pasó abajo." : "You have every word. Build what happened below."}</p>`);
      setTimeout(() => document.querySelector("#gsCase .gs-build")?.classList.add("gs-attn"), 50);
      return w;
    }
    const hunt = cl.how !== "ask";
    const im = media.img[r.id] || {}, ph = hunt ? (cl.how === "last" ? im.last_seen : im.from_orbit) : null;
    const f = hunt ? { text: L(cl.say), source: cl.source } : fileFor(r, c, cl);
    const words = (cl.words || []).map(W);
    const card = el("div", `gs-lead${shown ? " open" : ""}`);
    card.appendChild(el("div", "gs-lead-h", `<span class="gs-k">${es ? "Archivo NASA" : "NASA file"} ${idx} ${es ? "de" : "of"} ${total}</span><span class="gs-lead-tag">${shown ? (es ? "DESTAPADO" : "UNCOVERED") : hunt ? (es ? "FOTO" : "PHOTO") : (es ? "CLASIFICADO" : "CLASSIFIED")}</span>`));
    if (ph?.file) card.appendChild(el("div", "gs-lead-ph", `<img src="${ph.file}" alt="" loading="lazy">`));
    if (!hunt || shown) card.appendChild(el("p", "gs-lead-txt", redact(f.text, lockedWords, shown ? words : [])));
    card.appendChild(el("a", "gs-src", `${es ? "Fuente" : "Source"} · ${host(f.source)}`)).setAttribute("href", f.source);
    card.lastChild.target = "_blank"; card.lastChild.rel = "noopener";
    if (shown) {
      if (!hunt && f.text !== L(cl.say)) card.appendChild(el("div", "gs-msg-b bot gs-lead-said", `<b>${esc(nm)}:</b> ${esc(L(cl.say))}`));
      if (words.length) card.appendChild(el("div", "gs-lead-got", words.map((w) => `<span>+ ${esc(w)}</span>`).join("") + `<small>${es ? "en tus palabras" : "added to your words"}</small>`));
      const left = c.clues.filter((x) => !have.includes(x.id)).length;
      const nx = el("button", "gs-lead-next", left ? (es ? "Siguiente archivo →" : "Next file →") : (es ? "Resolver el caso ↓" : "Solve the case ↓"));
      nx.onclick = () => { delete opened[r.id]; FX("place"); renderCase(); if (!left) document.querySelector("#gsCase .gs-build")?.scrollIntoView({ behavior: "smooth", block: "center" }); else document.querySelector("#gsCase .gs-lead")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      card.appendChild(nx);
      return card;
    }
    if (hunt) {
      card.appendChild(el("div", "gs-lead-ask", `<b>${esc(cl.hunt ? L(cl.hunt.find) : L(cl.prompt))}</b>`));
      const b = el("button", "gs-lead-next", ph?.file && cl.hunt ? (es ? "Buscar en la foto" : "Search the photo") : (es ? "Ver" : "Look"));
      b.onclick = () => { if (busy || document.getElementById("gsScan")) return; FX("place"); if (cl.hunt && ph?.file) openScan(r, cl); else { showSlide(cl.how); unlock(r.id, cl.id); } };
      card.appendChild(b);
      return card;
    }
    card.appendChild(el("div", "gs-lead-ask", `<b>${es ? `¿Qué le preguntarías a ${esc(nm)} para destapar esto?` : `What would you ask ${esc(nm)} to uncover this?`}</b><small>${es ? "Habla o escribe abajo, o elige una. Una equivocada cuesta 1 ▮." : "Talk or type below, or pick one. A wrong pick costs 1 ▮."}</small>`));
    card.appendChild(replies(r, c, have, cl));
    const all = chat(r.id), last = all[all.length - 1];
    if (leadFrom[r.id]?.id !== cl.id) leadFrom[r.id] = { id: cl.id, n: have.length ? all.length : 0 };
    if (busy && pending) card.appendChild(el("div", "gs-msg-b bot typing", "<i></i><i></i><i></i>"));
    else if (last && all.length > leadFrom[r.id].n) card.appendChild(el("div", `gs-msg-b ${last.who} gs-lead-said`, esc(last.text)));
    return card;
  }

  /* ---------- NASA archive: study the real record, then ask ---------- */
  const archTab = {}; let archAudio = null;
  function archive(r) {
    const im = media.img[r.id] || {}, au = media.audio?.[r.id], rb = robots.find((x) => x.id === r.id) || {};
    const es = lang === "es";
    const tabs = [];
    const photos = [["last_seen", es ? "Su última foto" : "Its last photo"], ["from_orbit", es ? "Desde órbita hoy" : "From orbit today"], ["portrait", es ? "La máquina" : "The machine"]].filter(([k]) => im[k]?.file);
    if (photos.length) tabs.push(["photos", es ? "Fotos" : "Photos"]);
    if ((rb.facts || []).length) tabs.push(["facts", es ? "Expediente NASA" : "NASA file"]);
    const log = (DOOR[r.id]?.game?.rounds || []).filter((x) => x.hint);
    if (log.length) tabs.push(["log", es ? "Registro de misión" : "Mission log"]);
    if (au?.file) tabs.push(["sound", es ? "Sonido real" : "Real sound"]);
    const wrap = el("div", "gs-archive");
    if (!tabs.length) return wrap;
    const t = tabs.some(([k]) => k === archTab[r.id]) ? archTab[r.id] : tabs[0][0];
    wrap.appendChild(el("div", "gs-arch-h", `<span class="gs-k">${es ? "Archivo NASA" : "NASA archive"}</span><small>${es ? "Estudia esto para resolver el caso" : "Study this to crack the case"}</small>`));
    const bar = el("div", "gs-arch-tabs");
    tabs.forEach(([k, lab]) => { const b = el("button", k === t ? "on" : "", lab); b.onclick = () => { archTab[r.id] = k; FX("place"); const n = archive(r); wrap.replaceWith(n); }; bar.appendChild(b); });
    wrap.appendChild(bar);
    const host = (u) => { try { return new URL(u).hostname.replace("www.", ""); } catch { return "NASA"; } };
    const body = el("div", "gs-arch-body");
    if (t === "photos") photos.forEach(([k, lab]) => {
      const p = im[k];
      body.appendChild(el("figure", "gs-arch-card gs-arch-ph", `<img src="${p.file}" alt="" loading="lazy"><figcaption><b>${lab}${p.date ? " · " + esc(p.date) : ""}</b>${esc(p.caption || "")} <a href="${p.src || "#"}" target="_blank" rel="noopener">${esc(p.credit || "NASA")}</a></figcaption></figure>`));
    });
    if (t === "facts") (rb.facts || []).forEach((f) => body.appendChild(el("div", "gs-arch-card gs-arch-fact", `<p>${esc(es && f.es ? f.es : f.text)}</p><a href="${f.source}" target="_blank" rel="noopener">${/nasa|lroc|alsj|apollojournals|jpl|arizona/.test(host(f.source)) ? "NASA source" : "Source"} · ${host(f.source)}</a>`)));
    if (t === "log") log.forEach((x, i) => body.appendChild(el("div", "gs-arch-card gs-arch-fact", `<small>${es ? "Entrada" : "Entry"} ${i + 1}</small><p>${esc(x.hint)}</p>`)));
    if (t === "sound") {
      const c = el("div", "gs-arch-card gs-arch-snd", `<button class="gs-arch-play">${archAudio && !archAudio.paused ? "❚❚" : "▶"}</button><div><b>${esc(au.title || "")}</b><small>${esc(au.credit || "NASA")} · <a href="${au.src || "#"}" target="_blank" rel="noopener">${host(au.src || "")}</a></small></div>`);
      c.querySelector("button").onclick = (e) => {
        if (archAudio && !archAudio.paused) { archAudio.pause(); e.target.textContent = "▶"; return; }
        archAudio = new Audio(au.file); archAudio.volume = 0.8; archAudio.play().catch(() => {}); e.target.textContent = "❚❚";
        archAudio.onended = () => { e.target.textContent = "▶"; };
      };
      body.appendChild(c);
    }
    wrap.appendChild(body);
    return wrap;
  }

  /* ---------- the conversation: the case is played by talking ---------- */
  const QS = {
    "Ask what it ran on": ["What kept you running?", "¿Qué te daba energía?"],
    "Ask if anyone tried to wake it": ["Did anyone try to wake you up?", "¿Alguien intentó despertarte?"],
    "Ask if it got stuck": ["Did you get stuck?", "¿Te quedaste atascado?"],
    "Ask what it heard": ["What did you hear out there?", "¿Qué escuchaste allá?"],
    "Ask what it found": ["What did you find?", "¿Qué encontraste?"],
    "Ask how it talked to Earth": ["How did you talk to Earth?", "¿Cómo hablabas con la Tierra?"],
    "Ask about its battery": ["What about your battery?", "¿Y tu batería?"],
    "Ask what its job was": ["What was your job?", "¿Cuál era tu trabajo?"],
    "Ask how long it was built to last": ["How long were you built to last?", "¿Cuánto debías durar?"],
    "Ask when it stopped": ["When did you stop?", "¿Cuándo te detuviste?"],
    "Ask who kept it running": ["Who kept you running?", "¿Quién te mantenía funcionando?"],
    "Ask how it found its way": ["How did you find your way?", "¿Cómo te orientabas?"],
    "Ask what the ground looked like": ["What did the ground look like?", "¿Cómo era el suelo?"],
    "Ask who its crew was": ["Who was your crew?", "¿Quién era tu tripulación?"],
    "Ask what it's made of": ["What are you made of?", "¿De qué estás hecho?"],
    "Ask about the flag": ["What happened to the flag?", "¿Qué pasó con la bandera?"],
    "Ask what it carried": ["What did you carry?", "¿Qué llevabas?"],
    "Ask if anything broke": ["Did anything break?", "¿Se rompió algo?"],
    "Ask how fast it went": ["How fast did you go?", "¿Qué tan rápido ibas?"],
    "Ask what it did": ["What did you do up there?", "¿Qué hacías allá?"],
    "Ask how it saw": ["How did you see?", "¿Cómo veías?"],
    "Ask how it landed": ["How did you land?", "¿Cómo aterrizaste?"],
    "Ask who picked its name": ["Who picked your name?", "¿Quién eligió tu nombre?"],
    "Ask who it's named after": ["Who are you named after?", "¿En honor a quién te llamas?"],
    "Ask about its lander": ["Where's your lander?", "¿Dónde está tu módulo?"],
  };
  const Q = (cl) => { const q = QS[cl.prompt.en]; return q ? q[lang === "es" ? 1 : 0] : L(cl.prompt).replace(/^(Ask|Pregúntale)\s*/i, ""); };
  const chat = (id) => (S.chat[id] ||= []);
  function say(id, who, text, src) { const a = chat(id); a.push({ who, text, src }); if (a.length > 40) a.splice(0, a.length - 40); save(); }
  const fullLog = {};
  function chatLog(r) {
    const log = el("div", "gs-chat"), all = chat(r.id), unsolved = !isSolved(r.id);
    let li = all.length - 1; while (li > 0 && all[li].who !== "bot") li--;
    const showAll = !unsolved || fullLog[r.id], from = showAll ? 0 : Math.max(0, li - 1);
    if (!showAll && from > 0) {
      const t = el("button", "gs-chat-more", lang === "es" ? `Ver toda la conversación (${all.length})` : `Show the whole conversation (${all.length})`);
      t.onclick = () => { fullLog[r.id] = true; renderCase(); };
      log.appendChild(t);
    } else if (unsolved && fullLog[r.id] && all.length > 3) {
      const t = el("button", "gs-chat-more", lang === "es" ? "Mostrar solo lo último" : "Show only the latest");
      t.onclick = () => { fullLog[r.id] = false; renderCase(); };
      log.appendChild(t);
    }
    all.slice(from).forEach((m) => {
      const host = m.src ? (() => { try { return new URL(m.src).hostname.replace("www.", ""); } catch { return ""; } })() : "";
      log.appendChild(el("div", `gs-msg-b ${m.who}`, `${esc(m.text)}${m.src ? `<a class="gs-src" href="${m.src}" target="_blank" rel="noopener">${g("sources")} · ${host}</a>` : ""}`));
    });
    if (busy && pending) log.appendChild(el("div", "gs-msg-b bot typing", `<i></i><i></i><i></i>`));
    return log;
  }
  function memStrip(r, c, have) {
    const words = c.clues.filter((cl) => have.includes(cl.id)).flatMap((cl) => cl.words);
    const n = c.clues.length, k = have.length;
    const st = S.streak[r.id] || 0;
    return el("div", "gs-mem", `<span class="gs-k">${g("memK")}</span><span class="gs-dots">${c.clues.map((cl) => `<i class="${have.includes(cl.id) ? "on" : ""}"></i>`).join("")}</span><span class="gs-memn">${k}/${n}</span>${st > 1 ? `<span class="gs-streak">${g("link")(st)}</span>` : ""}`);
  }
  let pending = false; const tried = {};
  function decoys(r, c) {
    const mine = new Set(c.clues.map((cl) => cl.prompt.en));
    const out = [];
    for (const id of D.order) {
      if (id === r.id) continue;
      for (const cl of caseOf(id).clues) if (cl.how === "ask" && !mine.has(cl.prompt.en) && !(tried[r.id] || []).includes(cl.prompt.en) && !out.some((o) => o.cl.prompt.en === cl.prompt.en)) out.push({ id, cl });
    }
    let h = (found(r.id).length + 3) * 2654435761 >>> 0; for (const ch of r.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return [out[h % out.length], out[(h >> 7) % out.length === h % out.length ? (h % out.length + 5) % out.length : (h >> 7) % out.length]];
  }
  function replies(r, c, have, pick) {
    const wrap = el("div", "gs-replies");
    const next = pick || c.clues.find((cl) => cl.how === "ask" && !have.includes(cl.id));
    const row = el("div", "gs-reply-row");
    if (!next) {
      const hunt = c.clues.find((cl) => !have.includes(cl.id));
      if (!hunt) return el("div");
      const b = el("button", "gs-reply go", esc(g("showMe")));
      b.onclick = () => {
        if (busy || document.getElementById("gsScan")) return; say(r.id, "you", g("showMe")); say(r.id, "bot", g("showMeR")); FX("place");
        if (hunt.hunt && media.img[r.id]?.[hunt.how === "last" ? "last_seen" : "from_orbit"]?.file) openScan(r, hunt);
        else { showSlide(hunt.how); unlock(r.id, hunt.id); }
        renderCase();
      };
      row.appendChild(b); wrap.appendChild(row); return wrap;
    }
    const opts = decoys(r, c).filter(Boolean).map((d) => ({ right: false, ...d }));
    let h = 0; for (const ch of r.id + next.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    opts.splice((h + (tried[r.id] || []).length) % (opts.length + 1), 0, { right: true, cl: next });
    opts.forEach((o) => {
      const b = el("button", "gs-reply", esc(Q(o.cl)));
      b.onclick = () => {
        if (recharging(r.id)) { FX("wrong"); return; }
        say(r.id, "you", Q(o.cl));
        if (o.right) {
          S.streak[r.id] = (S.streak[r.id] || 0) + 1; save();
          pending = true; renderCase();
          ask({ text: Q(o.cl), script: L(o.cl.say), sources: [{ source: o.cl.source, text: L(o.cl.say) }], clue: o.cl.id, kind: "memory" });
        } else {
          S.streak[r.id] = 0; save(); (tried[r.id] ||= []).push(o.cl.prompt.en);
          const other = robots.find((x) => x.id === o.id); const nmO = other ? name(other) : o.id;
          pending = true; renderCase();
          b.classList.add("miss"); window.GSFX?.shake(b);
          ask({ text: Q(o.cl), script: g("notMine")(nmO), sources: [], kind: "miss" });
        }
      };
      row.appendChild(b);
    });
    wrap.appendChild(row);
    return wrap;
  }


  /* ---------- the door: talk your way in (Suck Up rules: read the machine, pick who you are, don't get caught) ---------- */
  const DS = {};
  const dstate = (id) => (DS[id] ||= { trust: 40, used: [], test: null, knocked: false, shuffle: 0 });
  const MOVE_LBL = { disguise: "Pretend to be", flatter: "Butter it up", honest: "Tell the truth" };
  function trustWord(t) { return t >= 85 ? "Almost open" : t >= 60 ? "Warming up" : t >= 35 ? "Suspicious" : "About to hang up"; }
  function doorMeter(r) {
    const d = dstate(r.id), t = Math.max(0, Math.min(100, d.trust));
    return el("div", `gs-door-m${t >= 85 ? " hot" : t < 35 ? " cold" : ""}`, `<div class="gs-door-top"><span class="gs-k">Hatch</span><b>${trustWord(t)}</b><span class="gs-door-n">${t}%</span></div><div class="gs-door-bar"><i style="width:${t}%"></i></div><div class="gs-door-mood">${esc(DOOR[r.id].mood)}</div>`);
  }
  function bumpTrust(r, delta, anchor) {
    const d = dstate(r.id); d.trust = Math.max(0, Math.min(100, d.trust + delta));
    const n = anchor || document.querySelector("#gsCase .gs-door-m");
    if (n && window.GSFX) { const [x, y] = window.GSFX.at(n); window.GSFX.float(`${delta > 0 ? "+" : ""}${delta} TRUST`, x, y - 16, delta > 0 ? "#e7ff3a" : "#ff5a5a"); if (delta > 0) window.GSFX.burst(x, y, { n: 14, speed: 4, colors: ["#e7ff3a", "#fff"] }); }
    if (delta < 0) { FX("wrong"); window.GSFX?.shake(document.querySelector("#gsCase")); window.GSFX?.flash("#ff3b3b"); } else FX("place");
  }
  const whenIdle = (fn, n = 0) => (busy || pending) && n < 3000 ? setTimeout(() => whenIdle(fn, n + 1), 250) : fn();
  function afterMove(r) {
    const d = dstate(r.id), dd = DOOR[r.id];
    if (d.trust >= 100) return whenIdle(() => cur?.id === r.id && openHatch(r));
    const left = dd.moves.filter((m, i) => !d.used.includes(i)).length;
    if (d.trust <= 0 || (!left && d.test == null)) return whenIdle(() => cur?.id === r.id && hangUp(r));
  }
  function hangUp(r) {
    const dd = DOOR[r.id]; say(r.id, "bot", dd.hangup); say(r.id, "you", "(call dropped. call back and try different moves)");
    FX("flat"); window.GSFX?.flash("#ff3b3b"); toast("Call dropped. Try again.");
    DS[r.id] = { trust: 40, used: [], test: null, knocked: true, shuffle: (DS[r.id]?.shuffle || 0) + 1 };
    renderCase();
  }
  function openHatch(r) {
    const c = caseOf(r.id), dd = DOOR[r.id];
    (S.open ||= {})[r.id] = true; save();
    FX("solve"); window.GSFX?.flash("#e7ff3a"); window.GSFX?.confetti?.();
    toast("Hatch open!");
    save();
    pending = true; renderCase();
    ask({ text: "", script: dd.open, kind: "door" });
  }
  function doorView(r, c) {
    const d = dstate(r.id), dd = DOOR[r.id], wrap = el("div", "gs-door");
    wrap.appendChild(doorMeter(r));
    wrap.appendChild(chatLog(r));
    if (!d.knocked) { d.knocked = true; setTimeout(() => whenIdle(() => { if (cur?.id !== r.id) return; pending = true; renderCase(); ask({ text: "", script: dd.knock, kind: "door" }); }), 0); return wrap; }
    if (busy || pending) { if (!pending && !d.wait) { d.wait = 1; setTimeout(() => whenIdle(() => { d.wait = 0; if (cur?.id === r.id) renderCase(); }), 0); } return wrap; }
    const row = el("div", "gs-reply-row");
    if (d.test != null) {
      const m = dd.moves[d.test];
      wrap.appendChild(el("div", "gs-k gs-door-ask", `You're ${esc(m.who)}. Answer like them:`));
      const opts = [m.right, ...m.wrong]; let h = d.shuffle + 1; for (const ch of r.id + m.who) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      opts.sort((a, b) => ((h ^ a.length * 2654435761) >>> 0) % 7 - ((h ^ b.length * 2654435761) >>> 0) % 7);
      opts.forEach((o) => {
        const b = el("button", "gs-reply", esc(o));
        b.onclick = () => {
          if (busy) return; d.test = null; say(r.id, "you", o);
          if (o === m.right) {
            bumpTrust(r, 35, b); S.streak[r.id] = (S.streak[r.id] || 0) + 1; save();
            const cl = c.clues.find((x) => x.id === m.clue);
            pending = true; renderCase();
            ask({ text: o, script: m.yes + (cl ? " " + L(cl.say) : ""), sources: cl ? [{ source: cl.source, text: L(cl.say) }] : [], clue: cl?.id, kind: "memory" });
          } else {
            b.classList.add("miss"); bumpTrust(r, -25, b); S.streak[r.id] = 0; save();
            pending = true; renderCase();
            ask({ text: o, script: "Busted. " + m.no, kind: "door" });
          }
          setTimeout(() => afterMove(r), 0);
        };
        row.appendChild(b);
      });
      wrap.appendChild(row); return wrap;
    }
    wrap.appendChild(el("div", "gs-k gs-door-ask", "Get it to open the hatch. Pick your move:"));
    dd.moves.forEach((m, i) => {
      if (d.used.includes(i)) return;
      const label = m.kind === "disguise" ? `<small>${MOVE_LBL.disguise} ${esc(m.who)}</small>${esc(m.role)}` : `<small>${MOVE_LBL[m.kind]}</small>${esc(m.line)}`;
      const b = el("button", `gs-reply gs-move ${m.kind}`, label);
      b.onclick = () => {
        if (busy) return; d.used.push(i);
        if (m.kind === "disguise") {
          d.test = i; say(r.id, "you", m.claim); FX("place");
          pending = true; renderCase(); ask({ text: m.claim, script: m.test, kind: "door" });
        } else {
          say(r.id, "you", m.line); bumpTrust(r, m.trust, b);
          pending = true; renderCase(); ask({ text: m.line, script: m.say, kind: "door" });
          setTimeout(() => afterMove(r), 0);
        }
      };
      row.appendChild(b);
    });
    wrap.appendChild(row);
    return wrap;
  }


  /* ---------- mission rounds: each machine's own game, built from its real history ---------- */
  const GS = {};
  let gTimer = null;
  const gstate = (id) => (GS[id] ||= { v: DOOR[id].game.meter.start, i: 0, said: -1, combo: 0, best: 0, deadline: 0, tries: (GS[id]?.tries || 0) });
  function gMeterHTML(gm, v) {
    const m = gm.meter, pct = Math.max(0, Math.min(100, (v / Math.max(m.start, 1)) * 100));
    return `<div class="gs-door-top"><span class="gs-k">${esc(m.name)}</span><b>${esc(gm.title)}</b><span class="gs-door-n">${Math.max(0, Math.round(v))}${esc(m.unit)}</span></div><div class="gs-door-bar"><i style="width:${pct}%"></i></div>`;
  }
  function gSteps(gm, i) {
    return `<div class="gs-steps">${gm.steps.map((s, k) => `<span class="${k < i ? "done" : k === i ? "now" : ""}">${esc(s)}</span>`).join("")}</div>`;
  }
  function gLose(r) {
    const gm = DOOR[r.id].game; clearInterval(gTimer);
    say(r.id, "bot", gm.lose); say(r.id, "you", "(call dropped. tap to try again)");
    FX("flat"); window.GSFX?.flash("#ff3b3b"); toast("Call dropped. Try again.");
    const t = (GS[r.id]?.tries || 0) + 1; delete GS[r.id]; gstate(r.id).tries = t; GS[r.id].said = -2; GS[r.id].q = -2;
    renderCase();
  }
  function gAnswer(r, c, o, btn) {
    const gm = DOOR[r.id].game, d = gstate(r.id), rd = gm.rounds[d.i];
    clearInterval(gTimer); d.deadline = 0;
    const right = o === rd.right;
    if (o) say(r.id, "you", o); else say(r.id, "you", "(too slow)");
    if (right) {
      d.v = Math.min(gm.meter.start, d.v + (gm.meter.gain || 0)); d.combo++; d.best = Math.max(d.best, d.combo);
      FX("place");
      if (btn && window.GSFX) { const [x, y] = window.GSFX.at(btn); window.GSFX.burst(x, y, { n: 16, speed: 4, colors: ["#e7ff3a", "#fff", "#ff4fa3"] }); window.GSFX.float(d.combo > 1 ? `x${d.combo} COMBO` : "NICE", x, y - 16, "#e7ff3a"); }
      S.streak[r.id] = (S.streak[r.id] || 0) + 1;
    } else {
      d.v = Math.max(1, d.v - gm.meter.loss); d.combo = 0; S.streak[r.id] = 0;
      if (btn) btn.classList.add("miss");
      FX("wrong"); window.GSFX?.shake(document.querySelector("#gsCase")); window.GSFX?.flash("#ff3b3b");
      const n = document.querySelector("#gsCase .gs-door-m");
      if (n && window.GSFX) { const [x, y] = window.GSFX.at(n); window.GSFX.float(`-${gm.meter.loss}${gm.meter.unit} ${gm.meter.name.toUpperCase()}`, x, y - 16, "#ff5a5a"); }
    }
    save();
    d.i++;
    const dead = d.v <= 0, done = d.i >= gm.rounds.length;
    if (dead || done) d.q = d.i;
    pending = true; renderCase();
    const P = lang === "en" && window.GS_persona ? window.GS_persona(r.id) : null, pk = (a) => a[d.i % a.length];
    const lead = right ? (P ? pk(P.yay) + " " : "") : !o ? "Too slow! " : /^(Nope|Wrong|No)\b/.test(rd.no) ? "" : P ? pk(P.oops) + " " : "Nope. ";
    ask({ text: o || "", script: lead + (right ? rd.yes : rd.no), kind: right ? "memory" : "door" });
    setTimeout(() => whenIdle(() => {
      if (cur?.id !== r.id) return;
      if (dead) { if (GS[r.id] === d) gLose(r); return; }
      if (done) { const dd = DOOR[r.id]; const keep = dd.open; dd.open = gm.win + (d.best > 2 ? ` Best combo: x${d.best}.` : ""); openHatch(r); dd.open = keep; return; }
      renderCase();
    }), 0);
  }
  function gTick(r, c, bar, meterEl) {
    clearInterval(gTimer);
    const gm = DOOR[r.id].game, d = gstate(r.id), T = (gm.time || 12) * 1000;
    if (!d.deadline) d.deadline = Date.now() + T;
    let last = Date.now();
    gTimer = setInterval(() => {
      if (cur?.id !== r.id || !document.body.contains(bar)) return clearInterval(gTimer);
      if (busy || pending || document.hidden) { d.deadline += Date.now() - last; last = Date.now(); return; }
      const now = Date.now(), dt = (now - last) / 1000; last = now;
      if (gm.meter.drain) { d.v -= gm.meter.drain * dt; meterEl.innerHTML = gMeterHTML(gm, d.v); meterEl.classList.toggle("cold", d.v < gm.meter.start * 0.35); if (d.v <= 0) { clearInterval(gTimer); d.q = d.i + 99; return gLose(r); } }
      const left = Math.max(0, d.deadline - now);
      bar.style.width = (left / T) * 100 + "%"; bar.parentNode.classList.toggle("hurry", left < 3500);
      if (left <= 0) gAnswer(r, c, "", null);
    }, 100);
  }
  function gameView(r, c) {
    const gm = DOOR[r.id].game, d = gstate(r.id), wrap = el("div", "gs-door gs-game");
    const meterEl = el("div", `gs-door-m${d.v < gm.meter.start * 0.35 ? " cold" : ""}`, gMeterHTML(gm, d.v));
    wrap.appendChild(meterEl);
    wrap.appendChild(el("div", "", gSteps(gm, d.i)));
    wrap.appendChild(chatLog(r));
    if (d.said === -2) {
      const b = el("button", "gs-reply gs-retry", "Call back");
      b.onclick = () => { d.said = -1; d.q = -1; FX("place"); renderCase(); };
      wrap.appendChild(b); return wrap;
    }
    const rd = gm.rounds[d.i];
    if (!rd) return wrap;
    if (d.said !== d.i) {
      if (d.q !== d.i) {
        d.q = d.i; clearInterval(gTimer); const at = d.i;
        const line = (at === 0 ? gm.intro + " " : "") + rd.say + " " + rd.q;
        setTimeout(() => whenIdle(() => { if (cur?.id !== r.id || GS[r.id] !== d || d.i !== at) return; d.said = at; pending = true; renderCase(); ask({ text: "", script: line, kind: "door" }); }), 0);
      }
      return wrap;
    }
    if (busy || pending) { if (!pending && !d.wait) { d.wait = 1; setTimeout(() => whenIdle(() => { d.wait = 0; if (cur?.id === r.id) renderCase(); }), 0); } return wrap; }
    if (d.i === 0) wrap.appendChild(el("div", "gs-mission", `<small>Your mission${lang === "en" && window.GS_persona ? " · " + esc(window.GS_persona(r.id).tag) : ""}</small><b>${esc(gm.title)}</b><span>${esc(gm.rule)}</span>`));
    if (rd.hint) {
      const im = media.img[r.id] || {}, ks = ["last_seen", "from_orbit", "portrait"].filter((k) => im[k]?.file), p = ks.length ? im[ks[d.i % ks.length]] : null;
      const cap = p ? (p.caption || "").slice(0, 160) + ((p.caption || "").length > 160 ? "…" : "") : "";
      wrap.appendChild(el("div", "gs-hint gs-evidence", `<small>${lang === "es" ? "Primero lee la evidencia · registro de la misión" : "Read the evidence first · mission log"}</small><p>${esc(rd.hint)}</p>${p ? `<figure class="gs-hint-fig"><img src="${p.file}" alt=""><figcaption>${esc(cap)} <a href="${p.src || "#"}" target="_blank" rel="noopener">${p.credit || "NASA"}</a></figcaption></figure>` : ""}<span class="gs-ev-note">${lang === "es" ? "Sin reloj. Tómate tu tiempo y luego decide." : "No clock. Take your time, then make the call."}</span>`));
    }
    const row = el("div", "gs-reply-row gs-two");
    const opts = [rd.right, ...rd.wrong.slice(0, 2)];
    let h = (d.tries || 0) + 3; for (const ch of r.id + d.i) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    if (h & 1) opts.reverse();
    opts.forEach((o) => { const b = el("button", "gs-reply", esc(o)); b.onclick = () => { if (busy || pending) return; gAnswer(r, c, o, b); }; row.appendChild(b); });
    wrap.appendChild(row);
    clearInterval(gTimer);
    setTimeout(() => wrap.querySelector(".gs-evidence")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    return wrap;
  }

  function gutCall(r, c) {
    const wrap = el("div", "gs-replies gs-gut2", `<div class="gs-k">${g("gutK")}: ${g("gutH")}</div>`);
    let h = 7; for (const ch of r.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = [0, 1, 2].sort((a, b) => ((h >> (a * 3)) & 7) - ((h >> (b * 3)) & 7));
    const row = el("div", "gs-reply-row");
    order.forEach((i) => {
      const b = el("button", "gs-reply"); b.textContent = L(c.gut.opts[i]);
      b.onclick = () => {
        S.bets[r.id] = i; say(r.id, "you", g("gutSay")(L(c.gut.opts[i]))); if (!DOOR[r.id]) say(r.id, "bot", g("gutBack")); save(); FX("place");
        b.classList.add("picked"); const [x, y] = window.GSFX?.at(b) || [0, 0]; window.GSFX?.burst(x, y, { n: 16, speed: 4, colors: ["#e7ff3a", "#fff"] });
        setTimeout(() => renderCase(), 380);
      };
      row.appendChild(b);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function nextBtn(box, r) {
    const nx = window.GS_nextAfter?.(r.id);
    const b = el("button", "gs-wake gs-next", nx ? `Call the next machine: ${esc(nx.name.replace(/\s*\(.*\)/, ""))}` : window.GS_allHome?.() ? "See all 11 home" : "Back to the map");
    b.onclick = () => { if (nx) return goTo(nx.id); if (window.GS_allHome?.()) return window.GS_finale?.(); document.getElementById("closeSheet")?.click(); };
    box.appendChild(b);
  }
  function keepsake(c) {
    const host = (() => { try { return new URL(c.keepsake.source).hostname.replace("www.", ""); } catch { return ""; } })();
    return el("div", "gs-keep", `<div class="gs-k">★ ${esc(L(c.keepsake.title))}</div><p>${esc(L(c.keepsake.text))}</p><a class="gs-src" href="${c.keepsake.source}" target="_blank" rel="noopener">${g("sources")} · ${host}</a>`);
  }

  function builder(r, c) {
    const wrap = el("div", "gs-build");
    wrap.appendChild(el("div", "gs-k", lang === "es" ? "¿Ya lo sabes? Resuélvelo ahora" : "Think you know? Solve it now"));
    wrap.appendChild(el("small", "gs-build-sub", lang === "es" ? "Las palabras con ✦ salieron de tus archivos. Una respuesta equivocada cuesta 1 ▮." : "Words marked ✦ came from files you uncovered. A wrong answer costs 1 ▮."));
    if (picks.length !== c.answer.length || picks._id !== r.id) { picks = c.answer.map(() => null); picks._id = r.id; }
    const sent = el("p", "gs-sent");
    L(c.sentence).split(/(\{\d\})/).forEach((part) => {
      const m = part.match(/^\{(\d)\}$/);
      if (!m) { sent.appendChild(document.createTextNode(part)); return; }
      const i = +m[1], b = el("button", `gs-blank${picks[i] ? " filled" : ""}`);
      b.dataset.slot = i; b.textContent = picks[i] ? W(picks[i]) : "______";
      b.onclick = () => { picks[i] = null; renderCase(); };
      sent.appendChild(b);
    });
    wrap.appendChild(sent);
    const have = found(r.id);
    const got = new Set(c.clues.filter((cl) => have.includes(cl.id)).flatMap((cl) => cl.words || []));
    const words = [...new Set([...c.clues.flatMap((cl) => cl.words || []), ...c.answer])];
    c.decoys.forEach((d) => { if (!words.includes(d)) words.push(d); });
    { const pool = Object.keys(D.words).filter((w) => !words.includes(w));
      let h = 0; for (const ch of r.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      for (let k = 0; k < 2 && pool.length; k++) words.push(pool.splice((h >> (k * 5)) % pool.length, 1)[0]); }
    words.sort((a, b) => (a.length * 7 + a.charCodeAt(0)) % 5 - (b.length * 7 + b.charCodeAt(0)) % 5);
    const bank = el("div", "gs-bank");
    words.forEach((w) => {
      const used = picks.includes(w);
      const b = el("button", `gs-word${used ? " used" : ""}${got.has(w) ? " got" : ""}`); b.textContent = W(w); b.dataset.word = w;
      b.onclick = () => {
        if (used) return; const i = picks.indexOf(null); if (i < 0) return;
        const from = b.getBoundingClientRect(), slot = document.querySelector(`#gsCase .gs-blank[data-slot="${i}"]`)?.getBoundingClientRect();
        FX("pick", { n: picks.filter(Boolean).length });
        picks[i] = w;
        const land = () => { renderCase(); FX("place"); const s2 = document.querySelector(`#gsCase .gs-blank[data-slot="${i}"]`); if (s2) { s2.classList.add("pop"); const [x, y] = window.GSFX.at(s2); window.GSFX.burst(x, y, { n: 12, speed: 3, size: 2 }); } };
        if (slot && window.GSFX) { b.style.visibility = "hidden"; window.GSFX.fly(W(w), from, slot, land); } else land();
      };
      bank.appendChild(b);
    });
    wrap.appendChild(bank);
    const go = el("button", "gs-check"); go.textContent = g("check"); go.disabled = picks.includes(null);
    go.onclick = () => check(r, c); if (recharging(r.id)) go.disabled = true;
    wrap.appendChild(go);
    wrap.appendChild(el("div", "gs-msg"));
    return wrap;
  }

  function check(r, c) {
    const right = picks.map((w, i) => w === c.answer[i]);
    if (right.every(Boolean)) return solve(r, c);
    const slots = document.querySelectorAll("#gsCase .gs-blank");
    slots.forEach((s, i) => s.classList.add(right[i] ? "right" : "wrong"));
    document.querySelector("#gsCase .gs-msg").textContent = g("wrong");
    FX("wrong"); window.GSFX?.shake(document.querySelector("#gsCase .gs-build")); window.GSFX?.flash("#ff3b3b");
    S.wrongs[r.id] = (S.wrongs[r.id] || 0) + 1; save(); spend(r.id);
    window.dispatchEvent(new CustomEvent("gs:wrong", { detail: { robot: r.id } }));
    setTimeout(() => { picks = picks.map((w, i) => (right[i] ? w : null)); picks._id = r.id; if (cur?.id === r.id) renderCase(); }, 1300);
  }

  function solve(r, c) {
    const stars = S.drained[r.id] ? 1 : pw(r.id) >= 3 ? 3 : 2, perfect = !S.wrongs[r.id] && !S.drained[r.id];
    S.stars[r.id] = Math.max(S.stars[r.id] || 0, stars);
    S.solved[r.id] = { t: new Date().toISOString(), stars }; save();
    const words = picks.slice(); picks = [];
    postVisit(r.id, { kind: "solved" });
    document.getElementById("stage").classList.add("restored");
    showSlide("robot");
    const lb = document.getElementById("lastBtn"); if (lb) lb.hidden = false;
    renderTop(); renderCase(); markPins(); updateChrome();
    closedCard(r, stars, perfect);
    ask({ text: "✓ " + sentenceText(c, words), script: fill(L(c.solved)), sources: [{ source: c.keepsake.source, text: L(c.keepsake.text) }], kind: "solved" });
    window.dispatchEvent(new CustomEvent("gs:solved", { detail: { robot: r.id } }));
    if (solvedCount() === 11) setTimeout(openGuide, 6000);
  }

  function gutLine(r) {
    const c = caseOf(r.id), b = S.bets[r.id]; if (!c?.gut || b == null) return "";
    const ok = b === c.gut.right;
    return `<div class="gs-cl-gut ${ok ? "right" : "twist"}">${ok ? g("gutRight") : g("gutWrong")}</div>`;
  }
  function closedCard(r, stars, perfect) {
    FX("solve"); window.GSFX?.flash("#ffae36"); window.GSFX?.confetti();
    const st = document.getElementById("stage"); if (st) { const [x, y] = window.GSFX.at(st); window.GSFX.burst(x, y, { n: 60, speed: 10, shape: "star", size: 5, colors: ["#ffae36", "#fff6d8", "#fff0cf"] }); }
    const d = el("div", "gs-closed", `<div class="gs-cl-in"><div class="gs-stamp">${g("closed")}</div><div class="gs-cl-name">${esc(name(r))}</div>
      <div class="gs-cl-stars">${[0, 1, 2].map((i) => `<i class="${i < stars ? "on" : ""}">★</i>`).join("")}</div>
      <div class="gs-cl-rank">${g("stars")[stars - 1]}${perfect ? " · " + g("perfect") : ""}</div><div class="gs-cl-count">${g("toastBack")(solvedCount())}</div>${gutLine(r)}</div>`);
    document.body.appendChild(d);
    d.querySelectorAll(".gs-cl-stars i").forEach((s, i) => setTimeout(() => { s.classList.add("in"); if (i < stars) { FX("star", { n: i }); const [x, y] = window.GSFX.at(s); window.GSFX.burst(x, y, { n: 18, shape: "star", colors: ["#ffae36", "#fff"], speed: 5 }); } }, 700 + i * 380));
    const bye = () => { d.classList.add("out"); setTimeout(() => d.remove(), 400); };
    d.onclick = bye; setTimeout(bye, 4200);
  }

  /* ---------- photo hunt: find the evidence in the real NASA photo ---------- */
  function openScan(r, cl) {
    const im = media.img[r.id] || {}, src = (cl.how === "last" ? im.last_seen : im.from_orbit)?.file, h = cl.hunt;
    document.getElementById("gsScan")?.remove();
    const ov = el("div", "gs-scan", `<div class="gs-scan-top"><div><div class="gs-k">${g("scan")[cl.how]}</div><b>${esc(L(h.find))}</b></div><button class="gs-x" aria-label="Close">×</button></div>
      <div class="gs-scan-box"><div class="gs-scan-wrap"><img alt=""><div class="gs-lens"></div><div class="gs-scanline"></div></div></div><div class="gs-scan-msg"></div>`);
    ov.id = "gsScan"; document.body.appendChild(ov); FX("open");
    const img = ov.querySelector("img"), wrap = ov.querySelector(".gs-scan-wrap"), lens = ov.querySelector(".gs-lens"), msg = ov.querySelector(".gs-scan-msg");
    img.src = src;
    let misses = 0, done = false;
    const close = () => { ov.classList.add("out"); setTimeout(() => ov.remove(), 250); };
    ov.querySelector(".gs-x").onclick = close;
    wrap.onpointermove = (e) => { const b = wrap.getBoundingClientRect(); lens.style.left = e.clientX - b.left + "px"; lens.style.top = e.clientY - b.top + "px"; lens.style.opacity = 1; };
    wrap.onpointerleave = () => (lens.style.opacity = 0);
    wrap.onclick = (e) => {
      if (done) return;
      const b = img.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      if (x < 0 || y < 0 || x > 1 || y > 1) return;
      let hit, dist;
      if (h.rect) { const [x0, y0, x1, y1] = h.rect; hit = x >= x0 && x <= x1 && y >= y0 && y <= y1; const cx = Math.max(x0, Math.min(x, x1)), cy = Math.max(y0, Math.min(y, y1)); dist = Math.hypot((x - cx) * b.width, (y - cy) * b.height) / b.width; }
      else { dist = Math.hypot((x - h.x) * b.width, (y - h.y) * b.height) / b.width; hit = dist <= h.r; }
      const wb = wrap.getBoundingClientRect(), px = e.clientX - wb.left, py = e.clientY - wb.top;
      const ring = el("div", "gs-ring"); ring.style.left = px + "px"; ring.style.top = py + "px"; wrap.appendChild(ring); setTimeout(() => ring.remove(), 900);
      if (hit) {
        done = true; ring.classList.add("hit"); msg.className = "gs-scan-msg hit"; msg.textContent = g("gotIt");
        FX("lock"); window.GSFX.burst(e.clientX, e.clientY, { n: 40, speed: 8, colors: ["#fff0cf", "#fff", "#ffae36"] });
        const lock = el("div", "gs-lock"); lock.style.left = px + "px"; lock.style.top = py + "px"; wrap.appendChild(lock);
        setTimeout(() => { close(); showSlide(cl.how); unlock(r.id, cl.id); }, 1100);
        return;
      }
      misses++;
      const heat = Math.max(0, 1 - (dist - (h.r || 0)) / 0.45);
      ring.style.setProperty("--c", heat > 0.75 ? "#ff6a3d" : heat > 0.45 ? "#ffae36" : "#fff0cf");
      msg.className = "gs-scan-msg"; msg.textContent = heat > 0.75 ? g("hot") : heat > 0.45 ? g("warm") : g("cold");
      FX("ping", { heat });
      if (misses === 4) {
        const z = el("div", "gs-zone"), cx = h.rect ? (h.rect[0] + h.rect[2]) / 2 : h.x, cy = h.rect ? (h.rect[1] + h.rect[3]) / 2 : h.y, ib = img.getBoundingClientRect();
        z.style.left = (ib.left - wb.left) + cx * ib.width + "px"; z.style.top = (ib.top - wb.top) + cy * ib.height + "px"; z.style.width = z.style.height = Math.max(90, ib.width * 0.32) + "px";
        wrap.appendChild(z);
      }
    };
  }

  function toast(msg) {
    const t = el("div", "gs-toast", esc(msg)); document.body.appendChild(t);
    setTimeout(() => t.classList.add("out"), 2600); setTimeout(() => t.remove(), 3200);
  }
  function chime() { FX("place"); }
  function chimeOld(...fs) {
    try {
      const c = ensureCtx(); if (!c) return;
      fs.forEach((f, i) => {
        const o = c.createOscillator(), gn = c.createGain(), t0 = c.currentTime + i * 0.11;
        o.type = "triangle"; o.frequency.value = f; gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(0.06, t0 + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
        o.connect(gn); gn.connect(c.destination); o.start(t0); o.stop(t0 + 0.4);
      });
    } catch {}
  }

  /* ---------- wiring to the app's events ---------- */
  window.addEventListener("gs:open", (e) => {
    if (!D) return;
    ensureCasePanels();
    const id = e.detail.robot.id;
    S.visits[id] = (S.visits[id] || 0) + 1; save();
    picks = [];
    document.getElementById("stage").classList.toggle("restored", isSolved(id));
    renderTop(); renderCase();
    if (caseOf(id) && !isSolved(id) && !S.woke[id]) setTimeout(() => { if (cur?.id === id && !S.woke[id]) whenIdle(() => { if (cur?.id === id && !S.woke[id]) wake(); }); }, 700);
    const lb = document.getElementById("lastBtn"); if (lb) lb.hidden = !!caseOf(id) && !isSolved(id);
  });
  window.addEventListener("gs:slide", (e) => {
    const r = e.detail.robot, c = r && caseOf(r.id); if (!c || isSolved(r.id)) return;
    const cl = c.clues.find((x) => x.how === e.detail.slide); if (cl && !cl.hunt) unlock(r.id, cl.id);
  });
  window.addEventListener("gs:answer", (e) => {
    const { robot: r, clue, heard, scripted, answer, kind } = e.detail;
    if (caseOf(r.id) && answer) {
      if (!scripted && heard) say(r.id, "you", heard);
      const cl = clue && caseOf(r.id).clues.find((x) => x.id === clue);
      say(r.id, "bot", answer, cl?.source);
      if (kind === "miss") { FX("wrong"); window.GSFX?.flash("#ff3b3b"); }
      if (clue && (S.streak[r.id] || 0) > 1) { const n = document.querySelector("#gsCase .gs-mem"); if (n) { const [x, y] = window.GSFX.at(n); setTimeout(() => window.GSFX.float(g("link")(S.streak[r.id]), x, y - 20, "#e7ff3a"), 400); } }
      pending = false;
      const c2 = caseOf(r.id), left = c2.clues.filter((x) => !found(r.id).includes(x.id) && x.id !== clue).length;
      if (!isSolved(r.id) && clue && left === 0) say(r.id, "bot", g("allBack"));
      if (!clue && cur?.id === r.id) setTimeout(() => renderCase(), 0);
    }
    if (kind === "wake" && cur?.id === r.id && caseOf(r.id) && !isSolved(r.id)) setTimeout(() => { const n = document.querySelector("#gsCase .gs-gut, #gsCase .gs-replies"); n?.scrollIntoView({ behavior: "smooth", block: "center" }); n?.classList.add("gs-attn"); setTimeout(() => n?.classList.remove("gs-attn"), 2400); }, 900);
    if (clue) return unlock(r.id, clue);
    if (scripted || !heard || !caseOf(r.id) || isSolved(r.id)) return;
    const h = window.GS_beforeAsk(r, heard);
    if (h?.clue) { say(r.id, "bot", h.script, h.sources?.[0]?.source); unlock(r.id, h.clue); toast(g("heardClue")); }
  });
  window.addEventListener("gs:pins", markPins);
  window.addEventListener("gs:lang", () => { updateChrome(); if (cur && D) { renderTop(); renderCase(); } document.getElementById("gsWelcome") && (document.getElementById("gsWelcome").remove(), welcome()); });

  (async () => {
    try { D = await (await fetch("data/mysteries.json", { cache: "no-store" })).json(); } catch { return; }
    try { DOOR = await (await fetch("data/door.json", { cache: "no-store" })).json(); } catch { DOOR = {}; }
    const wait = () => (robots.length ? Promise.resolve() : new Promise((res) => setTimeout(() => wait().then(res), 150)));
    await wait();
    const syncScope = (id, sc, of) => { if (id && !S.solved[id]) { S.solved[id] = { t: new Date().toISOString(), stars: sc >= of ? 3 : sc >= of / 2 ? 2 : 1 }; save(); } };
    Object.entries(window.GS_scope?.won || {}).forEach(([id, sc]) => syncScope(id, sc, 4));
    window.addEventListener("gs:scope-won", (e) => { syncScope(e.detail.robot, e.detail.score, e.detail.of); updateChrome(); });
    updateChrome(); welcome();
    if (cur) window.dispatchEvent(new CustomEvent("gs:open", { detail: { robot: cur } }));
  })();
})();
