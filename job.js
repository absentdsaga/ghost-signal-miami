/* Ghost Signal · machine jobs (Nov 15 2026). Each hero machine gets one real job you do with your hands,
   then the last moment, the question it can't answer, and goodnight.
   Plugs in AFTER the wake sequence: wraps the global openRobot(r). Machines with a job play it the first
   time; after that (or with "Open case file") the regular case screen opens as before.
   Needs only app.js globals (robots, lang, openRobot) and fx.js (GSFX). Look lives in job.css.
   Demo: ?demo=1 jumps straight into Eagle's landing.
   Eagle facts: Apollo Lunar Surface Journal, landing transcript https://www.nasa.gov/history/alsj/a11/a11.landing.html
   Ground: LRO NAC mosaic of the Apollo 11 site via NASA Moon Trek, 0.65 m per pixel. */
(() => {
  const SRC = {
    alsj: "https://www.nasa.gov/history/alsj/a11/a11.landing.html",
    lander: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
    a12: "https://www.nasa.gov/history/alsj/a12/a12.html",
    laser: "https://www.nasa.gov/missions/laser-beams-reflected-between-earth-and-moon-boost-science",
  };
  const T = {
    en: {
      alt: "Altitude", fuel: "Fuel left", s: "s",
      steer: "Touch where you want to fly", rocks: "Boulders. Too rocky to land. Keep flying.", crater: "Crater. Fly past it.",
      good: "Smooth ground. Let it settle.",
      calls: {
        go: ["Houston", "Eagle, you are go for landing."],
        alarm: ["Eagle", "Program alarm. It's a 1202."],
        gofix: ["Houston", "We're go on that alarm."],
        garman: ["Fact", "Jack Garman, 24, knew this alarm was safe."],
        s60: ["Houston", "60 seconds."],
        s30: ["Houston", "30 seconds."],
        dust: ["Buzz Aldrin", "Picking up some dust."],
        contact: ["Buzz Aldrin", "Contact light."],
      },
      alarmP: "The computer is overloaded. Keep landing?", go: "GO",
      landed: "The Eagle has landed.", landedBy: "Neil Armstrong, July 20, 1969",
      near: (m) => m < 40 ? "You landed right where Eagle really sits." : `You landed ${m} m from where Eagle really sits.`,
      fuelLeft: (f) => `${f} seconds of fuel to spare.`,
      fail: { boulders: "A leg came down on a boulder.", crater: "Eagle slid into the crater.", fuel: "Out of fuel. Abort." },
      retry: "Try again from lower down", assist: "The orange dot is where Armstrong really landed.",
      caps: [
        ["The autopilot was flying them into a boulder field.", "Neil Armstrong took over by hand and flew past it. So did you."],
        ["Neil and Buzz walked outside for two and a half hours.", "They planted a flag, set up experiments, and left their bootprints."],
        ["21 hours and 36 minutes after landing...", ""],
        ["Your top half flew them home.", "Your bottom half stayed. It was their launch pad."],
        ["Nobody has called you since.", ""],
      ],
      tap: "tap to continue",
      q: "Did it matter that I stayed?", qk: "Eagle asks",
      tiles: [
        { t: "Five more crews landed on the Moon after you.", ok: true, say: "Five more. Copy that. Then I was first, not last." },
        { t: "Nobody ever went back to the Moon.", say: "Negative. I heard engines again four months later." },
        { t: "They took you back to Earth.", say: "Look again. My legs are still in the dust." },
      ],
      keep: "Next to me they left 100 small mirrors. Scientists still bounce lasers off them today.",
      cardK: "Brought back", where: "Where", whereV: "Sea of Tranquility, the Moon", when: "Landed", whenV: "July 20, 1969",
      you: "Your landing", youV: (m, f) => `${m} m off, ${f} s fuel left`,
      thread: "<b>New thread: Surveyor 3.</b> Four months later, Apollo 12 landed about 180 m from it, on purpose.",
      next: "Call Surveyor 3", file: "Open case file", map: "Back to map", src: "NASA source", goodnight: "Goodnight, Eagle.",
    },
    es: {
      alt: "Altitud", fuel: "Combustible", s: "s",
      steer: "Toca hacia donde quieres volar", rocks: "Rocas. Muy rocoso. Sigue volando.", crater: "Cráter. Pásalo.",
      good: "Suelo liso. Déjalo bajar.",
      calls: {
        go: ["Houston", "Eagle, tienen luz verde para alunizar."],
        alarm: ["Eagle", "Alarma del programa. Es una 1202."],
        gofix: ["Houston", "Seguimos adelante con esa alarma."],
        garman: ["Dato", "Jack Garman, de 24 años, sabía que la alarma no era peligrosa."],
        s60: ["Houston", "60 segundos."],
        s30: ["Houston", "30 segundos."],
        dust: ["Buzz Aldrin", "Levantando algo de polvo."],
        contact: ["Buzz Aldrin", "Luz de contacto."],
      },
      alarmP: "La computadora está saturada. ¿Seguir bajando?", go: "SEGUIR",
      landed: "El Eagle ha alunizado.", landedBy: "Neil Armstrong, 20 de julio de 1969",
      near: (m) => m < 40 ? "Alunizaste justo donde está Eagle de verdad." : `Alunizaste a ${m} m de donde está Eagle de verdad.`,
      fuelLeft: (f) => `Te sobraron ${f} segundos de combustible.`,
      fail: { boulders: "Una pata cayó sobre una roca.", crater: "Eagle se deslizó al cráter.", fuel: "Sin combustible. Abortar." },
      retry: "Intenta otra vez desde más abajo", assist: "El punto naranja es donde Armstrong alunizó de verdad.",
      caps: [
        ["El piloto automático los llevaba a un campo de rocas.", "Neil Armstrong tomó el control a mano y lo pasó. Tú también."],
        ["Neil y Buzz caminaron afuera dos horas y media.", "Pusieron una bandera, instalaron experimentos y dejaron sus huellas."],
        ["21 horas y 36 minutos después de alunizar...", ""],
        ["Tu mitad de arriba los llevó a casa.", "Tu mitad de abajo se quedó. Fue su plataforma de despegue."],
        ["Nadie te ha llamado desde entonces.", ""],
      ],
      tap: "toca para seguir",
      q: "¿Sirvió de algo que me quedara?", qk: "Eagle pregunta",
      tiles: [
        { t: "Cinco tripulaciones más llegaron a la Luna después de ti.", ok: true, say: "Cinco más. Recibido. Fui el primero, no el último." },
        { t: "Nadie volvió nunca a la Luna.", say: "Negativo. Oí motores otra vez cuatro meses después." },
        { t: "Te llevaron de vuelta a la Tierra.", say: "Mira otra vez. Mis patas siguen en el polvo." },
      ],
      keep: "A mi lado dejaron 100 espejitos. Todavía rebotan láseres en ellos.",
      cardK: "De vuelta", where: "Dónde", whereV: "Mar de la Tranquilidad, la Luna", when: "Alunizó", whenV: "20 de julio de 1969",
      you: "Tu alunizaje", youV: (m, f) => `a ${m} m, ${f} s de combustible`,
      thread: "<b>Nuevo hilo: Surveyor 3.</b> Cuatro meses después, el Apolo 12 alunizó a unos 180 m de él, a propósito.",
      next: "Llamar a Surveyor 3", file: "Abrir expediente", map: "Volver al mapa", src: "Fuente NASA", goodnight: "Buenas noches, Eagle.",
    },
  };
  const L = () => T[(typeof lang !== "undefined" && T[lang]) ? lang : "en"];
  const FX = (n, o) => window.GSFX?.sfx(n, o);
  const KEY = "ghostsignal.jobs";
  const jobs = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
  const saveJobs = () => { try { localStorage.setItem(KEY, JSON.stringify(jobs)); } catch {} };
  const solvedInGame = (id) => { try { return !!JSON.parse(localStorage.getItem("ghostsignal.v1"))?.solved?.[id]; } catch { return false; } };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- sound (own context, tiny) ---------- */
  let ac = null, rumble = null;
  function audio() {
    if (localStorage.getItem("ghostsignal.sfx") === "off") return null;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ac.state === "suspended") ac.resume();
    return ac;
  }
  function startRumble() {
    const c = audio(); if (!c || rumble) return;
    const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    const src = c.createBufferSource(); src.buffer = b; src.loop = true;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 160;
    const g = c.createGain(); g.gain.value = 0.0001;
    src.connect(f).connect(g).connect(c.destination); src.start();
    g.gain.linearRampToValueAtTime(0.22, c.currentTime + 0.6);
    rumble = { src, g, f };
  }
  function setRumble(power) { if (!rumble || !ac) return; rumble.g.gain.setTargetAtTime(0.14 + power * 0.22, ac.currentTime, 0.08); rumble.f.frequency.setTargetAtTime(140 + power * 160, ac.currentTime, 0.1); }
  function stopRumble() { if (!rumble || !ac) return; const r = rumble; rumble = null; r.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.12); setTimeout(() => { try { r.src.stop(); } catch {} }, 700); }
  function beep(freq = 880, dur = 0.12, vol = 0.12, type = "square") {
    const c = audio(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur + 0.02);
  }
  const quindar = () => { beep(2525, 0.25, 0.05, "sine"); };
  const thud = () => { beep(70, 0.5, 0.35, "sine"); beep(110, 0.25, 0.15, "triangle"); };

  /* ---------- shell ---------- */
  const root = el("section", "jb"); root.hidden = true; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");
  document.body.appendChild(root);
  let alive = 0; // run token, so closing mid-run cancels everything
  function shell(id) {
    alive++;
    root.innerHTML = ""; root.hidden = false; root.dataset.job = id;
    document.body.style.overflow = "hidden";
    const x = el("button", "jb-x", "×"); x.setAttribute("aria-label", "Close"); x.onclick = () => close(true);
    root.appendChild(x);
    window.GS_music?.duck?.(0.35);
    return alive;
  }
  function close(toMap) {
    alive++; stopRumble(); cancelAnimationFrame(raf);
    root.hidden = true; root.innerHTML = ""; document.body.style.overflow = "";
    window.GS_music?.duck?.(1);
    if (toMap) window.GS_scene?.leave?.();
  }

  /* ---------- Eagle: fly the landing ---------- */
  const SITE = { src: "assets/jobs/eagle-site.webp", w: 2048, h: 1280, mpp: 0.6505,
    real: [559, 621], west: [1440, 760, 270], lw: [670, 610, 34], start: [1800, 690] };
  let raf = 0;
  function eagleLand(r, run) {
    return new Promise((resolve) => {
      const t = L(), cv = el("canvas"), ctx = cv.getContext("2d");
      const vig = el("div", "jb-vig"), haze = el("div", "jb-haze"), hud = el("div", "jb-hud");
      hud.innerHTML = `<div class="jb-gauge jb-alt"><small>${t.alt}</small><b>152<i>m</i></b></div>
        <div class="jb-gauge jb-fuel"><small>${t.fuel}</small><b>64<i>${t.s}</i></b><div class="jb-fbar"><i></i></div></div>
        <div class="jb-call"></div><div class="jb-hint">${t.steer}</div>
        <div class="jb-alarm" hidden><div class="code">1202</div><p>${t.alarmP}</p><button class="jb-go">${t.go}</button></div>`;
      root.append(cv, haze, vig, hud);
      root.querySelector(".jb-x").remove(); root.appendChild(root.querySelector(".jb-x") || (() => { const x = el("button", "jb-x", "×"); x.onclick = () => close(true); return x; })());
      const $ = (c) => hud.querySelector(c), altB = $(".jb-alt b"), fuelB = $(".jb-fuel b"), fuelBox = $(".jb-fuel"), bar = $(".jb-fbar i"), call = $(".jb-call"), hint = $(".jb-hint"), alarm = $(".jb-alarm");
      const img = new Image(); img.src = SITE.src;
      let W = 0, H = 0, dpr = 1;
      const fit = () => { dpr = Math.min(2, devicePixelRatio || 1); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
      fit(); addEventListener("resize", fit);

      let callT = 0;
      const say = (k) => { const [who, txt] = t.calls[k]; call.innerHTML = `<em>${who}</em>${txt}`; call.classList.add("on"); clearTimeout(callT); callT = setTimeout(() => call.classList.remove("on"), 3200); quindar(); };

      // state
      const TOTAL = 32, ALT0 = 152;
      let fails = 0, st;
      const reset = (retry) => {
        st = retry
          ? { x: 1520, y: 690, vx: -26, vy: 0, t: TOTAL * 0.45, fuel: 34, alarmDone: true, said: { go: 1, alarm: 1, s60: 1 }, over: false }
          : { x: SITE.start[0], y: SITE.start[1], vx: -40, vy: 0, t: 0, fuel: 64, alarmDone: false, said: {}, over: false };
      };
      reset(false);
      const input = { on: false, sx: 0, sy: 0, kx: 0, ky: 0 };
      let alarmUp = false, alarmAt = 0;
      const ptr = (e) => { input.on = true; input.sx = e.clientX; input.sy = e.clientY; };
      cv.addEventListener("pointerdown", (e) => { ptr(e); cv.setPointerCapture?.(e.pointerId); audio(); startRumble(); });
      cv.addEventListener("pointermove", (e) => { if (input.on) ptr(e); });
      const up = () => (input.on = false);
      cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
      const keys = {};
      const kd = (e) => { if (root.hidden) return; keys[e.key] = e.type === "keydown"; if (e.key.startsWith("Arrow")) e.preventDefault(); startRumble(); };
      addEventListener("keydown", kd); addEventListener("keyup", kd);
      const fixAlarm = () => { if (!alarmUp) return; alarmUp = false; alarm.hidden = true; FX("lock"); say("gofix"); setTimeout(() => { if (run === alive && !st.over) say("garman"); }, 2600); };
      $(".jb-go").onclick = fixAlarm;

      const hazard = (x, y) => {
        if (Math.hypot(x - SITE.west[0], y - SITE.west[1]) < SITE.west[2]) return "boulders";
        if (Math.hypot(x - SITE.lw[0], y - SITE.lw[1]) < SITE.lw[2]) return "crater";
        return null;
      };
      const dust = [];
      let last = performance.now(), started = false, LX = W / 2, LY = H / 2;
      say("go");

      function frame(now) {
        if (run !== alive) { removeEventListener("keydown", kd); removeEventListener("keyup", kd); removeEventListener("resize", fit); return; }
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        // input: direction from the lander (screen centre) toward the finger
        let ix = 0, iy = 0;
        if (input.on) { ix = (input.sx - LX) / 140; iy = (input.sy - LY) / 140; }
        ix += (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
        iy += (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
        if (fails >= 2 && !st.over) { ix += -0.35 * Math.sign(st.x - SITE.real[0]); }
        const mag = Math.min(1, Math.hypot(ix, iy)); if (mag > 0) { const k = mag / Math.hypot(ix, iy); ix *= k; iy *= k; }
        if (mag > 0.05) { started = true; hint.style.opacity = 0; }
        if (!st.over) {
          st.vx += ix * 58 * dt; st.vy += iy * 58 * dt;
          if (mag < 0.05) { st.vx *= 1 - 0.25 * dt; st.vy *= 1 - 0.25 * dt; }
          const sp = Math.hypot(st.vx, st.vy); if (sp > 95) { st.vx *= 95 / sp; st.vy *= 95 / sp; }
          st.x = Math.max(80, Math.min(SITE.w - 80, st.x + st.vx * dt)); st.y = Math.max(80, Math.min(SITE.h - 80, st.y + st.vy * dt));
          st.t += dt; st.fuel -= dt * (1 + 0.9 * mag);
          setRumble(mag);
        }
        const u = Math.min(1, st.t / TOTAL), alt = Math.max(0, ALT0 * Math.pow(1 - u, 1.35));
        // story beats
        if (!st.alarmDone && st.t > 5) { st.alarmDone = true; alarmUp = true; alarm.hidden = false; alarmAt = now; say("alarm"); beep(1000, 0.15); setTimeout(() => beep(750, 0.15), 180); }
        if (alarmUp && now - alarmAt > 6000) fixAlarm();
        if (alarmUp && Math.floor(now / 500) % 2 === 0 && Math.floor((now - dt * 1000) / 500) % 2 === 1) beep(1000, 0.08, 0.06);
        if (st.fuel < 60 && !st.said.s60) { st.said.s60 = 1; say("s60"); }
        if (st.fuel < 30 && !st.said.s30) { st.said.s30 = 1; say("s30"); }
        if (alt < 13 && !st.said.dust) { st.said.dust = 1; say("dust"); }
        const hz = hazard(st.x, st.y);
        if (!st.over && started && alt < 75) { hint.style.opacity = 1; hint.textContent = hz === "boulders" ? t.rocks : hz === "crater" ? t.crater : t.good; hint.classList.toggle("warn", !!hz); }
        // HUD
        altB.innerHTML = `${Math.round(alt)}<i>m</i>`;
        const f = Math.max(0, st.fuel); fuelB.innerHTML = `${Math.ceil(f)}<i>${t.s}</i>`; bar.style.width = (f / 64 * 100).toFixed(1) + "%"; fuelBox.classList.toggle("low", f < 30);
        haze.style.opacity = alt < 30 ? ((30 - alt) / 30 * 0.45).toFixed(2) : 0;

        // draw
        const zoom = Math.exp(Math.log(W / 1500) + (Math.log(W / 380) - Math.log(W / 1500)) * Math.pow(1 - alt / ALT0, 1.1));
        const s = Math.max(zoom, H / 1100 * (1 - alt / ALT0) + zoom * 0.0);
        const hw = W / 2 / s, hh = H / 2 / s;
        const cl = (v, lo, hi) => lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v));
        const cx = cl(st.x + st.vx * 0.5, hw, SITE.w - hw), cy = cl(st.y + st.vy * 0.5, hh, SITE.h - hh);
        const lx = W / 2 + (st.x - cx) * s, ly = H / 2 + (st.y - cy) * s; LX = lx; LY = ly;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#07050b"; ctx.fillRect(0, 0, W, H);
        const shakeA = alt < 25 && !st.over ? (25 - alt) / 25 * 2.2 : 0;
        const ox = W / 2 - cx * s + (Math.random() - 0.5) * shakeA, oy = H / 2 - cy * s + (Math.random() - 0.5) * shakeA;
        if (img.complete && img.naturalWidth) ctx.drawImage(img, ox, oy, SITE.w * s, SITE.h * s);
        // warm night grade over the real photo
        ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "#f2b48a"; ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "#6e4a62"; ctx.globalAlpha = 0.35; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
        const P = (x, y) => [ox + x * s, oy + y * s];
        // boulder field warning glow when low
        if (alt < 90) {
          const [bx, by] = P(SITE.west[0], SITE.west[1]), a = Math.min(0.28, (90 - alt) / 90 * 0.28);
          const g = ctx.createRadialGradient(bx, by, 0, bx, by, SITE.west[2] * s);
          g.addColorStop(0, `rgba(255,79,160,0)`); g.addColorStop(0.75, `rgba(255,79,160,${a * 0.4})`); g.addColorStop(1, `rgba(255,79,160,${a})`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, SITE.west[2] * s, 0, 7); ctx.fill();
        }
        // where Armstrong really landed (after 2 misses, and after landing)
        if (fails >= 2 || st.over) { const [rx, ry] = P(...SITE.real); ctx.fillStyle = "#ff7a2f"; ctx.shadowColor = "#ff7a2f"; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(rx, ry, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        // lander shadow: Sun low in the east (11 degrees), so the shadow falls west and races in as you drop
        const sl = alt / Math.tan(11 * Math.PI / 180) / SITE.mpp, [sx, sy] = P(st.x - sl, st.y), lw = 9.4 / SITE.mpp * s;
        ctx.fillStyle = "rgba(7,3,10,.72)"; ctx.beginPath(); ctx.ellipse(sx, sy, lw * 0.9, lw * 0.42, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = "rgba(7,3,10,.72)"; ctx.lineWidth = Math.max(1.5, lw * 0.07);
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(sx + a * lw * 0.4, sy + b * lw * 0.2); ctx.lineTo(sx + a * lw * 0.95, sy + b * lw * 0.55); ctx.stroke(); });
        // dust
        if (alt < 22 && !st.over) for (let i = 0; i < 4; i++) dust.push({ a: Math.random() * 7, r: lw * 0.4, v: 120 + Math.random() * 160, life: 1 });
        ctx.fillStyle = "rgba(242,205,176,.5)";
        for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.r += d.v * dt; d.life -= dt * 1.4; if (d.life <= 0) { dust.splice(i, 1); continue; } ctx.globalAlpha = d.life * 0.6; ctx.beginPath(); ctx.arc(lx + Math.cos(d.a) * d.r, ly + Math.sin(d.a) * d.r * 0.7, 2.2, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        // the landing reticle (where Eagle will touch down)
        const rr = Math.max(26, 18 / SITE.mpp * s * 0.6), col = hz && alt < 75 ? "#ff4fa0" : "#d8ff3e";
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(lx, ly, rr, 0, 7); ctx.stroke();
        for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + now / 900; ctx.beginPath(); ctx.arc(lx, ly, rr + 8, a, a + 0.5); ctx.stroke(); }
        ctx.shadowBlur = 0;
        if (input.on) { ctx.strokeStyle = "rgba(216,255,62,.35)"; ctx.setLineDash([4, 8]); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(input.sx, input.sy); ctx.stroke(); ctx.setLineDash([]); }

        // outcomes
        if (!st.over && st.fuel <= 0 && alt > 0) return end("fuel");
        if (!st.over && alt <= 0) return end(hz);
        raf = requestAnimationFrame(frame);
      }
      async function end(bad) {
        st.over = true; alarm.hidden = true; alarmUp = false; stopRumble(); hint.style.opacity = 0;
        if (bad) {
          fails++; FX("wrong"); window.GSFX?.shake(root); thud();
          const big = el("div", "jb-big on", `<h2>${t.fail[bad]}</h2><p>${fails >= 2 ? t.assist : ""}</p><p><button class="jb-btn main">${t.retry}</button></p>`);
          big.style.pointerEvents = "auto"; hud.appendChild(big);
          big.querySelector("button").onclick = () => { big.remove(); reset(true); startRumble(); };
          raf = requestAnimationFrame(frame);
          return;
        }
        say("contact"); thud(); FX("lock");
        const m = Math.round(Math.hypot(st.x - SITE.real[0], st.y - SITE.real[1]) * SITE.mpp), f = Math.max(0, Math.ceil(st.fuel));
        await sleep(1200); if (run !== alive) return;
        window.GSFX?.flash("#fff4e3"); window.GSFX?.confetti?.();
        const big = el("div", "jb-big", `<small>${t.landedBy}</small><h2>${t.landed}</h2><p>${t.near(m)} ${t.fuelLeft(f)}</p>`);
        hud.appendChild(big); requestAnimationFrame(() => big.classList.add("on"));
        jobs[r.id] = { ...(jobs[r.id] || {}), m, f, t: new Date().toISOString() }; saveJobs();
        // keep drawing (shadow under you, the real spot appears)
        raf = requestAnimationFrame(function hold(n) { if (run !== alive) return; frame(n); });
        await sleep(3800); if (run !== alive) return;
        cancelAnimationFrame(raf); removeEventListener("keydown", kd); removeEventListener("keyup", kd); removeEventListener("resize", fit);
        resolve({ m, f });
      }
      raf = requestAnimationFrame((n) => { last = n; frame(n); });
    });
  }

  /* ---------- the last moment, on Dioni's painted layers ---------- */
  async function lastMoment(r, run, caps, liftAt) {
    const t = L(), id = r.id, base = `assets/layers/${id}/`;
    const sc = el("div", "jb-scene", `<div class="st"><img class="gnd" src="${base}ground.webp" alt=""><img class="shd" src="${base}shadow.webp" alt="">
      <img class="bot" src="${base}machine.webp" alt=""><img class="top" src="${base}machine.webp" alt=""><div class="flame"></div></div>`);
    const cap = el("div", "jb-cap"), tap = el("div", "jb-tap", t.tap);
    [...root.children].forEach((c) => { if (!c.classList.contains("jb-x")) c.remove(); });
    root.prepend(sc); root.append(cap, tap);
    await sleep(60); sc.classList.add("on");
    const top = sc.querySelector(".top"), flame = sc.querySelector(".flame");
    for (let i = 0; i < caps.length; i++) {
      if (run !== alive) return;
      cap.innerHTML = `${caps[i][0]}${caps[i][1] ? `<small>${caps[i][1]}</small>` : ""}`; cap.classList.add("on");
      if (i === liftAt) {
        await sleep(1400); if (run !== alive) return;
        FX("lock"); startRumble(); setRumble(1);
        flame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: "forwards" });
        window.GSFX?.flash("#ffcf8a");
        const fly = { duration: 2600, easing: "cubic-bezier(.55,0,.85,.4)", fill: "forwards" };
        top.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6%)", offset: 0.25 }, { transform: "translateY(-140%)" }], fly);
        flame.animate([{ transform: "translate(-50%,0)" }, { transform: "translate(-50%,-6%)", offset: 0.25 }, { transform: "translate(-50%,-140%)" }], fly);
        await sleep(2500); flame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: "forwards" }); await sleep(300); stopRumble(); continue;
      }
      if (i === caps.length - 1) { sc.classList.add("grey"); }
      await new Promise((res) => { const go = () => { root.removeEventListener("pointerdown", go); clearTimeout(tm); res(); }; const tm = setTimeout(go, 4200); setTimeout(() => root.addEventListener("pointerdown", go), 500); });
      cap.classList.remove("on"); await sleep(300);
    }
    cap.remove(); tap.remove();
    return sc;
  }

  /* ---------- the question it can't answer ---------- */
  function ask(r, run, sc, tq) {
    const t = L();
    return new Promise((resolve) => {
      const p = el("div", "jb-panel", `<p class="jb-q"><small>${t.qk}</small>${tq.q}</p><div class="jb-tiles"></div><p class="jb-say"></p>`);
      root.appendChild(p); requestAnimationFrame(() => p.classList.add("on"));
      const box = p.querySelector(".jb-tiles"), sayEl = p.querySelector(".jb-say");
      const order = tq.tiles.map((x, i) => [x, Math.random()]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
      order.forEach((tile) => {
        const b = el("button", "jb-tile", tile.t); box.appendChild(b);
        b.onclick = async () => {
          sayEl.textContent = tile.say; quindar();
          if (!tile.ok) { b.classList.add("no"); FX("wrong"); return; }
          b.classList.add("yes"); [...box.children].forEach((c) => c !== b && c.classList.add("dim"));
          FX("lock"); const [x, y] = window.GSFX?.at?.(b) || [innerWidth / 2, innerHeight / 2]; window.GSFX?.burst?.(x, y, { n: 50, speed: 9, colors: ["#d8ff3e", "#fff4e3", "#ffcf8a"] });
          sc.classList.remove("grey"); sc.classList.add("lit");
          await sleep(2600); if (run !== alive) return;
          sayEl.innerHTML = `${tq.keep} <a href="${tq.keepSrc}" target="_blank" rel="noopener">${t.src}</a>`;
          await sleep(3200); if (run !== alive) return;
          p.classList.remove("on"); await sleep(400); p.remove(); resolve();
        };
      });
    });
  }

  /* ---------- goodnight: keepsake + the thread ---------- */
  function goodnight(r, run, sc, res) {
    const t = L();
    if (window.GS_markSolved) window.GS_markSolved(r.id, 3);
    else { try { const k = "ghostsignal.v1", s = JSON.parse(localStorage.getItem(k)) || {}; (s.solved ||= {})[r.id] = { t: new Date().toISOString(), stars: 3 }; localStorage.setItem(k, JSON.stringify(s)); } catch {} window.dispatchEvent(new CustomEvent("gs:solved", { detail: { robot: r.id } })); }
    window.GS_scenePower?.(r.id, true);
    const nm = (typeof name === "function" ? name(r) : r.name);
    const p = el("div", "jb-panel", `<div class="jb-card"><img src="assets/hero/machines/${r.id}-on.webp" alt="" onerror="this.style.display='none'"><div>
      <small style="font:12px var(--mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:#d8ff3e">★ ${t.cardK}</small><h3>${nm}</h3>
      <dl><dt>${t.where}</dt><dd>${t.whereV}</dd><dt>${t.when}</dt><dd>${t.whenV}</dd>${res ? `<dt>${t.you}</dt><dd>${t.youV(res.m, res.f)}</dd>` : ""}</dl></div></div>
      <div class="jb-thread">${t.thread}</div>
      <div class="jb-btns"><button class="jb-btn main" data-a="next">${t.next}</button><button class="jb-btn" data-a="file">${t.file}</button><button class="jb-btn" data-a="map">${t.map}</button></div>`);
    root.appendChild(p); requestAnimationFrame(() => p.classList.add("on"));
    window.GSFX?.confetti?.();
    p.querySelector('[data-a="next"]').onclick = () => { close(false); window.GS_scene?.enter ? window.GS_scene.enter("surveyor3") : (location.hash = "site=surveyor3"); };
    p.querySelector('[data-a="file"]').onclick = () => { close(false); orig(r); };
    p.querySelector('[data-a="map"]').onclick = () => close(true);
  }

  /* ---------- registry ---------- */
  const JOBS = {
    eagle: async (r, run) => {
      const res = await eagleLand(r, run); if (run !== alive) return;
      const t = L();
      const sc = await lastMoment(r, run, t.caps, 2); if (run !== alive || !sc) return;
      await ask(r, run, sc, { q: t.q, tiles: t.tiles, keep: t.keep, keepSrc: SRC.laser }); if (run !== alive) return;
      goodnight(r, run, sc, res);
    },
  };
  async function play(r) {
    const run = shell(r.id);
    try { await JOBS[r.id](r, run); } catch (e) { console.error("job", e); close(false); orig(r); }
  }
  window.GS_job = (id) => { const r = (typeof robots !== "undefined" ? robots : []).find((x) => x.id === id); if (r && JOBS[id]) play(r); };

  /* ---------- hook: after the wake sequence, play the job instead of the old form ---------- */
  const orig = window.openRobot;
  if (typeof orig === "function") {
    window.openRobot = function (r, ...rest) {
      if (r && JOBS[r.id] && !jobs[r.id] && !solvedInGame(r.id)) { play(r); return; }
      return orig.call(this, r, ...rest);
    };
  }
  addEventListener("keydown", (e) => { if (!root.hidden && e.key === "Escape") { e.stopPropagation(); close(true); } }, true);

  /* ---------- demo path ---------- */
  if (/[?&]demo=1/.test(location.search)) {
    const go = () => { document.querySelectorAll(".gs-welcome,.gs-intro").forEach((n) => n.remove()); window.GS_job("eagle"); };
    const wait = () => (typeof robots !== "undefined" && robots.length ? go() : setTimeout(wait, 200));
    setTimeout(wait, 600);
  }
})();
