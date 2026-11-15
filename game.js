/* Ghost Signal: the case files. Each robot forgot why it went quiet; the caller collects real NASA clues and rebuilds the sentence.
   Logic only. Look and feel live in game.css (Emily: restyle freely; class names and events below are the contract).
   Events fired on window: gs:clue {robot, clue}, gs:wrong {robot}, gs:solved {robot}, gs:guide-open. */
(() => {
  const G = {
    en: {
      welcomeK: "Night shift · Ghost Signal desk", welcomeH: "11 robots went quiet. Help them remember.",
      welcomeP: "NASA left these machines on the Moon and Mars. Each one forgot what happened to it. Call them, find real NASA clues, and solve each case to bring it back.",
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
      gutK: "Gut call", gutH: "Before you dig: what do you think happened?", gutYour: "Your gut said", gutFind: "Find the clues. Were you right?", gutRight: "Called it. Your gut was right.", gutWrong: "Plot twist. Your gut said something else.",
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
      gutK: "Corazonada", gutH: "Antes de investigar: ¿qué crees que pasó?", gutYour: "Tu corazonada", gutFind: "Encuentra las pistas. ¿Acertaste?", gutRight: "¡Le atinaste! Tu corazonada era cierta.", gutWrong: "Giro inesperado. Tu corazonada era otra.",
    },
  };
  const GENERIC = new Set(["how", "do", "who", "where", "cómo", "como", "quién", "quien", "dónde", "donde", "find", "see", "ver", "fly", "volar"]);
  const KEY = "ghostsignal.v1";
  let D = null;
  const S = Object.assign({ name: "", solved: {}, clues: {}, woke: {}, visits: {}, power: {}, recharge: {}, drained: {}, hints: {}, wrongs: {}, stars: {}, bets: {} }, (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })());
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
    if (o.kind === "wake" || o.kind === "solved" || o.kind === "last") return true;
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

  window.GS_beforeAsk = (r, text) => {
    const c = caseOf(r.id); if (!c || isSolved(r.id)) return null;
    const q = " " + text.toLowerCase() + " ";
    const hit = c.clues.find((cl) => cl.how === "ask" && !found(r.id).includes(cl.id) && (cl.keys || []).some((k) => !GENERIC.has(k) && q.includes(k)));
    return hit ? { script: L(hit.say), sources: [{ source: hit.source, text: L(hit.say) }], clue: hit.id } : null;
  };

  function unlock(id, clueId, quiet) {
    const c = caseOf(id); if (!c || found(id).includes(clueId)) return;
    found(id).push(clueId); save();
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
    const done = (n) => { S.name = (n || "").replace(/[^\p{L}\p{N} '\-]/gu, "").trim().slice(0, 20); if (!S.name) S.skipped = true; save(); w.classList.add("out"); setTimeout(() => w.remove(), 400); updateChrome(); };
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
    gb.innerHTML = `<span class="gs-gl">${g("guide")}</span> <b>${solvedCount()}/11</b>`;
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
    b.onclick = () => wake();
    top.appendChild(b);
  }

  function wake() {
    const r = cur, c = caseOf(r.id); if (!c || busy) return;
    const seen = S.woke[r.id];
    const line = isSolved(r.id) ? g("back2") : seen ? g("back1") : L(c.wake);
    S.woke[r.id] = (S.woke[r.id] || 0) + 1; save();
    ask({ text: g("wakeHeard"), script: fill(line), kind: "wake" });
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
    if (!ok && c.gut && S.bets[r.id] == null) { box.appendChild(gutCall(r, c)); return; }
    if (!ok && c.gut) box.appendChild(el("div", "gs-gutmine", `<span class="gs-k">${g("gutYour")}</span><b>${esc(L(c.gut.opts[S.bets[r.id]]))}</b><small>${g("gutFind")}</small>`));
    if (!ok) { const pwr = el("div", "gs-power"); box.appendChild(pwr); box.appendChild(el("div", "gs-rule", g("tries"))); }
    const head = el("div", "gs-cluehead", `<span class="gs-k">${g("clues")}</span><span>${g("found")(have.length, c.clues.length)}</span>`);
    box.appendChild(head);
    const list = el("div", "gs-clues");
    c.clues.forEach((cl) => {
      const got = have.includes(cl.id);
      const it = el(got ? "div" : "button", `gs-clue ${got ? "got" : "locked"} how-${cl.how}${cl.id === newId ? " new" : ""}`);
      it.dataset.clue = cl.id;
      if (got) {
        const host = (() => { try { return new URL(cl.source).hostname.replace("www.", ""); } catch { return ""; } })();
        it.innerHTML = `<span class="gs-ci">${cl.how === "last" ? "CAM" : cl.how === "orbit" ? "ORB" : "REC"}</span><div><p>${esc(L(cl.say))}</p>
          ${cl.words.length ? `<div class="gs-earned">${cl.words.map((w) => `<span class="gs-word mini">${esc(W(w))}</span>`).join("")}</div>` : ""}
          <a class="gs-src" href="${cl.source}" target="_blank" rel="noopener">${g("sources")} · ${host}</a></div>${cl.id === newId ? `<span class="gs-newtag">${g("newClue")}</span>` : ""}`;
      } else if (cl.how === "ask" && !(S.hints[r.id] || []).includes(cl.id)) {
        const m = el("div", "gs-clue locked mystery", `<span class="gs-ci">???</span><div><b>${g("lockedMem")}</b><small>${g("lockedSub")}</small></div>`);
        m.dataset.clue = cl.id; list.appendChild(m); return;
      } else if (cl.how === "ask") {
        it.classList.add("hinted");
        it.innerHTML = `<span class="gs-ci">HINT</span><div><b>${esc(L(cl.prompt))}</b><small>${g("tapToAsk")} · 1 ▮</small></div>`;
        it.onclick = () => { if (!busy) ask({ text: L(cl.prompt).replace(/^(Ask|Pregúntale)\s*/i, ""), script: L(cl.say), sources: [{ source: cl.source, text: L(cl.say) }], clue: cl.id }); };
      } else {
        it.classList.add("hunt");
        it.innerHTML = `<span class="gs-ci">${cl.how === "last" ? "CAM" : "ORB"}</span><div><b>${g("scan")[cl.how] || esc(L(cl.prompt))}</b><small>${cl.hunt ? esc(L(cl.hunt.find)) : g("look")}</small></div><span class="gs-go-scan">${g("scanSub")} ›</span>`;
        it.onclick = () => {
          if (cl.hunt && media.img[r.id]?.[cl.how === "last" ? "last_seen" : "from_orbit"]?.file) openScan(r, cl);
          else { showSlide(cl.how); document.getElementById("stage")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
        };
      }
      list.appendChild(it);
    });
    box.appendChild(list);
    if (!ok) {
      const left = c.clues.filter((cl) => cl.how === "ask" && !have.includes(cl.id) && !(S.hints[r.id] || []).includes(cl.id));
      if (left.length) {
        const hb = el("button", "gs-hint", `${g("hint")} <small>${g("hintCost")}</small>`);
        hb.onclick = () => {
          if (busy || !spend(r.id)) { FX("wrong"); return; }
          (S.hints[r.id] ||= []).push(left[0].id); save(); FX("hint"); renderCase();
          const n = document.querySelector(`#gsCase .gs-clue[data-clue="${left[0].id}"]`); if (n) { n.classList.add("new"); const [x, y] = window.GSFX.at(n); window.GSFX.burst(x, y, { n: 14, colors: ["#ffe9a8", "#fff"], speed: 4 }); }
          renderPower();
        };
        box.appendChild(hb);
      }
      box.appendChild(builder(r, c));
    }
    renderPower();
    if (newId && !quiet) {
      const n = box.querySelector(".gs-clue.new");
      n?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      FX("clue");
    }
  }

  function gutCall(r, c) {
    const wrap = el("div", "gs-gut", `<div class="gs-k">${g("gutK")}</div><b class="gs-gut-h">${g("gutH")}</b>`);
    let h = 7; for (const ch of r.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const order = [0, 1, 2].sort((a, b) => ((h >> (a * 3)) & 7) - ((h >> (b * 3)) & 7));
    const row = el("div", "gs-gut-opts");
    order.forEach((i) => {
      const b = el("button", "gs-gut-opt"); b.textContent = L(c.gut.opts[i]);
      b.onclick = () => {
        S.bets[r.id] = i; save(); FX("place");
        b.classList.add("picked"); const [x, y] = window.GSFX?.at(b) || [0, 0]; window.GSFX?.burst(x, y, { n: 16, speed: 4, colors: ["#e7ff3a", "#fff"] });
        setTimeout(() => renderCase(), 380);
      };
      row.appendChild(b);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function keepsake(c) {
    const host = (() => { try { return new URL(c.keepsake.source).hostname.replace("www.", ""); } catch { return ""; } })();
    return el("div", "gs-keep", `<div class="gs-k">★ ${esc(L(c.keepsake.title))}</div><p>${esc(L(c.keepsake.text))}</p><a class="gs-src" href="${c.keepsake.source}" target="_blank" rel="noopener">${g("sources")} · ${host}</a>`);
  }

  function builder(r, c) {
    const wrap = el("div", "gs-build");
    wrap.appendChild(el("div", "gs-k", g("build")));
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
    const words = [...new Set(c.clues.filter((cl) => have.includes(cl.id)).flatMap((cl) => cl.words))];
    if (have.length) {
      c.decoys.forEach((d) => { if (!words.includes(d)) words.push(d); });
      const pool = Object.keys(D.words).filter((w) => !words.includes(w) && !c.answer.includes(w));
      let h = 0; for (const ch of r.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      for (let k = 0; k < 2 && pool.length; k++) words.push(pool.splice((h >> (k * 5)) % pool.length, 1)[0]);
    }
    words.sort((a, b) => (a.length * 7 + a.charCodeAt(0)) % 5 - (b.length * 7 + b.charCodeAt(0)) % 5);
    const bank = el("div", "gs-bank");
    if (!words.length && !c.clues.some((cl) => !have.includes(cl.id) && cl.words && cl.words.length)) bank.appendChild(el("span", "gs-empty", g("bankEmpty")));
    words.forEach((w) => {
      const used = picks.includes(w);
      const b = el("button", `gs-word${used ? " used" : ""}`); b.textContent = W(w); b.dataset.word = w;
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
    const locked = c.clues.filter((cl) => !have.includes(cl.id) && cl.words && cl.words.length).length;
    for (let k = 0; k < locked; k++) {
      const b = el("button", "gs-word locked"); b.disabled = true; b.textContent = "🔒 ? ? ?";
      b.title = lang === "es" ? "Desbloquea un recuerdo para ganar esta palabra" : "Unlock a memory to earn this word";
      bank.appendChild(b);
    }
    if (locked) bank.appendChild(el("div", "gs-lockhint", lang === "es" ? `Faltan ${locked} palabras: están en recuerdos bloqueados.` : `${locked} word${locked > 1 ? "s" : ""} still locked inside memories you haven't reached.`));
    wrap.appendChild(bank);
    const go = el("button", "gs-check"); go.textContent = g("check"); go.disabled = picks.includes(null);
    go.onclick = () => check(r, c); if (recharging(r.id)) go.disabled = true;
    wrap.appendChild(go);
    wrap.appendChild(el("div", "gs-msg"));
    return wrap;
  }

  function check(r, c) {
    if (busy) return;
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
    const lb = document.getElementById("lastBtn"); if (lb) lb.hidden = !!caseOf(id) && !isSolved(id);
  });
  window.addEventListener("gs:slide", (e) => {
    const r = e.detail.robot, c = r && caseOf(r.id); if (!c || isSolved(r.id)) return;
    const cl = c.clues.find((x) => x.how === e.detail.slide); if (cl && !cl.hunt) unlock(r.id, cl.id);
  });
  window.addEventListener("gs:answer", (e) => {
    const { robot: r, clue, heard, scripted } = e.detail;
    if (clue) return unlock(r.id, clue);
    if (scripted || !heard || !caseOf(r.id) || isSolved(r.id)) return;
    const h = window.GS_beforeAsk(r, heard);
    if (h?.clue) { unlock(r.id, h.clue); toast(g("heardClue")); }
  });
  window.addEventListener("gs:pins", markPins);
  window.addEventListener("gs:lang", () => { updateChrome(); if (cur && D) { renderTop(); renderCase(); } document.getElementById("gsWelcome") && (document.getElementById("gsWelcome").remove(), welcome()); });

  (async () => {
    try { D = await (await fetch("data/mysteries.json", { cache: "no-store" })).json(); } catch { return; }
    const wait = () => (robots.length ? Promise.resolve() : new Promise((res) => setTimeout(() => wait().then(res), 150)));
    await wait();
    updateChrome(); welcome();
    if (cur) window.dispatchEvent(new CustomEvent("gs:open", { detail: { robot: cur } }));
  })();
})();
