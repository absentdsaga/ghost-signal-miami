/* Ghost Signal · light rigs for the wake sequence (branch wake-up).
   x, y = % of the 1280x720 scene layers (assets/layers/<id>/), measured on gridded crops of the machine layer.
   heart = the first light to come on (antenna node / status light). foot = where the machine meets the ground.
   real: true = the machine really had this light or motion (sources in Skills/machine-awakening/references/01-power-on-visuals.md §2);
   false = stylized glow, labelled "lights stylized" in the scene credit.
   fx = the one REAL thing each machine does when it wakes (§5 storyboards). */
window.GS_RIGS = {
  eagle: {
    heart: { x: 48.4, y: 21.6, c: "#d8ff6a" }, foot: { x: 53, y: 84, w: 46 }, spill: "#ffcf8a",
    lamps: [
      { x: 41.9, y: 38.2, c: "#ff3b30", r: 1.5, t: 0, real: true, label: "docking light, port (red)" },
      { x: 66.3, y: 38.2, c: "#34ff6a", r: 1.5, t: 160, real: true, label: "docking light, starboard (green)" },
      { x: 54.4, y: 48.5, c: "#ffb340", r: 1.4, t: 320, real: true, label: "docking light, underside (amber)" },
      { x: 52.6, y: 33.2, c: "#ffffff", r: 2.4, t: 520, kind: "strobe", hz: 1, real: true, label: "tracking light, 1 flash/s" },
    ],
    fx: [{ type: "glint", x0: 40, x1: 70, y0: 50, y1: 66, c: "255,214,140" }],
    note: { en: "Lights as flown in 1969 · real colours", es: "Luces como volaron en 1969 · colores reales" },
  },
  surveyor3: {
    heart: { x: 46.1, y: 10.7, c: "#d8ff6a" }, foot: { x: 50, y: 92, w: 52 }, spill: "#dfe6ff",
    lamps: [{ x: 56.3, y: 46.5, c: "#ffffff", r: 1.8, t: 0, kind: "mirror", real: true, label: "camera mirror catching the Sun" }],
    fx: [{ type: "glint", x0: 44, x1: 66, y0: 12, y1: 22, c: "235,240,255" }],
    note: { en: "Its camera mirror stepped by motor · glow stylized", es: "Su espejo de cámara se movía con motor · brillo estilizado" },
  },
  alsep: {
    focus: 47,
    heart: { x: 50.3, y: 10.6, c: "#d8ff6a" }, foot: { x: 52, y: 90, w: 60 }, spill: "#ffc86b",
    lamps: [
      { x: 47.2, y: 24.2, c: "#ffb340", r: 0.9, t: 0, real: false },
      { x: 49.0, y: 24.2, c: "#ffb340", r: 0.9, t: 120, real: false },
      { x: 50.8, y: 24.2, c: "#ffb340", r: 0.9, t: 240, real: false },
      { x: 29.5, y: 38.5, c: "#ff7a2a", r: 3.2, t: 380, kind: "heat", real: false, label: "nuclear battery heat" },
    ],
    fx: [{ type: "pulses", pts: [[29.5, 42], [36, 45.5], [43, 46], [49, 44]], c: "#d8ff6a" }, { type: "ripples", x: 53, y: 76, c: "#9fe8ff" }],
    note: { en: "No lamps on the real station · glow shows power and data", es: "La estación real no tenía luces · el brillo muestra energía y datos" },
  },
  rover16: {
    heart: { x: 72.3, y: 13.6, c: "#d8ff6a" }, foot: { x: 52, y: 84, w: 64 }, spill: "#ffd49a",
    lamps: [
      { x: 49.6, y: 49.5, c: "#ffcf7a", r: 2.2, t: 0, real: false, label: "console" },
      { x: 61.4, y: 41.5, c: "#ff3b30", r: 0.9, t: 300, real: false, label: "TV camera tally" },
    ],
    fx: [{ type: "glint", x0: 62, x1: 82, y0: 18, y1: 30, c: "235,240,255" }],
    note: { en: "Its TV camera was steered from Earth · glow stylized", es: "Su cámara de TV se movía desde la Tierra · brillo estilizado" },
  },
  opportunity: {
    heart: { x: 46.7, y: 16.5, c: "#d8ff6a" }, foot: { x: 50, y: 86, w: 64 }, spill: "#ffc28a",
    lamps: [{ x: 44.6, y: 14.9, c: "#bfe8ff", r: 1.2, t: 400, kind: "eye", real: false, label: "Pancam" }],
    fx: [{ type: "panels", x0: 26, x1: 84, y0: 47, y1: 57 }, { type: "dust", x0: 28, x1: 84, y: 52 }, { type: "glint", x0: 58, x1: 74, y0: 30, y1: 42, c: "255,230,200" }],
    note: { en: "Wind really blew dust off its panels · glow stylized", es: "El viento sí le limpió el polvo de los paneles · brillo estilizado" },
  },
  spirit: {
    heart: { x: 44.4, y: 12.2, c: "#ffc24a" }, foot: { x: 50, y: 88, w: 66 }, spill: "#ffb47a",
    lamps: [{ x: 44.4, y: 14.4, c: "#bfe8ff", r: 1.2, t: 400, kind: "eye", real: false, label: "Pancam" }],
    fx: [{ type: "panels", x0: 22, x1: 60, y0: 46, y1: 56 }, { type: "dust", x0: 22, x1: 60, y: 51 }, { type: "glint", x0: 58, x1: 74, y0: 32, y1: 42, c: "255,230,200" }],
    note: { en: "Stuck in soft sand, it could not tilt to the Sun · glow stylized", es: "Atascado en arena, no pudo girar hacia el Sol · brillo estilizado" },
  },
  sojourner: {
    hud: "right",
    heart: { x: 52.6, y: 16.5, c: "#d8ff6a" }, foot: { x: 50, y: 93, w: 60 }, spill: "#ffbf8a",
    lamps: [{ x: 30.6, y: 62, c: "#bfe8ff", r: 1.0, t: 300, kind: "eye", real: false, label: "front cameras" }],
    fx: [{ type: "stripes", x0: 4, x1: 26, y0: 77, y1: 89, n: 5, c: "#ff2f2f" }],
    note: { en: "Real lasers. They were infrared; shown red so you can see them", es: "Láseres reales. Eran infrarrojos; aquí en rojo para que se vean" },
  },
  viking1: {
    heart: { x: 32.4, y: 18.4, c: "#d8ff6a", r: 1.5 }, foot: { x: 45, y: 90, w: 70 }, spill: "#ffc79a",
    lamps: [{ x: 53.6, y: 14.6, c: "#d8ff6a", r: 1.0, t: 900, real: false, label: "weather boom tip" }],
    fx: [{ type: "scan", ms: 1700 }],
    note: { en: "Viking saw one line at a time, like this scan", es: "Viking veía una línea a la vez, como este escaneo" },
  },
  phoenix: {
    heart: { x: 42.9, y: 17.8, c: "#7dff3a" }, foot: { x: 50, y: 82, w: 80 }, spill: "#ffd2a8",
    lamps: [{ x: 72.9, y: 75.3, c: "#ff2a2a", r: 1.3, t: 500, kind: "rgb", real: true, label: "arm camera LEDs red, green, blue" }],
    fx: [{ type: "lidar", x: 49.8, y: 35.3, c: "#7dff3a" }],
    note: { en: "Real green laser (lidar) and real arm-camera LEDs", es: "Láser verde real (lidar) y luces LED reales en la cámara del brazo" },
  },
  insight: {
    heart: { x: 52.5, y: 32.7, c: "#d8ff6a" }, foot: { x: 50, y: 90, w: 80 }, spill: "#ffc48a",
    lamps: [],
    fx: [{ type: "panels", x0: 4, x1: 96, y0: 44, y1: 54 }, { type: "dust", x0: 4, x1: 96, y: 49 }, { type: "ripples", x: 33.7, y: 79, c: "#9fe8ff" }],
    note: { en: "Rings show what its seismometer felt · glow stylized", es: "Los anillos muestran lo que sintió su sismómetro · brillo estilizado" },
  },
  ingenuity: {
    heart: { x: 49.8, y: 25.5, c: "#d8ff6a" }, foot: { x: 50, y: 85, w: 60 }, spill: "#ffc48a",
    lamps: [],
    fx: [{ type: "rotor", x: 50.3, ys: [33.4, 44.4], span: 34 }],
    note: { en: "A slow rotor test, like before its first flight. Its blades broke in 2024", es: "Una prueba lenta del rotor, como antes de su primer vuelo. Sus aspas se rompieron en 2024" },
  },
};
