// Pre-records every Eagle-call line through the game's own voice endpoint, so the demo never waits on the network.
// Run: bun scripts/bake-eagle-voice.ts   (from the repo root)
import { createHash } from "node:crypto";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
const API = "https://dioni.zo.space/api/ghost-signal";
const VOICE: Record<string, string> = { EAGLE: "eagle", BUZZ: "rover16", HOUSTON: "alsep" };
const g: any = {}; new Function("window", await Bun.file("mockups/eagle-call-data.js").text())(g);
const E = g.EAGLE, lines: { who: string; say: string }[] = [];
const add = (who: string, say?: string) => say && lines.push({ who, say });
for (const o of [E.open, E.radio30, E.abort, E.liftoff, E.plaque.intro, E.plaque.done, E.talk.hello]) add(o.who, o.say);
for (const A of E.acts) for (const C of A.cards) { add(C.who, C.say); add("EAGLE", C.yes); add("EAGLE", C.no); }
for (const s of E.plaque.spots) add("EAGLE", s.say);
for (const c of E.talk.chips) for (const l of c.lines || []) add("EAGLE", l.say);
const dir = "assets/eagle-call/v"; mkdirSync(dir, { recursive: true });
const manifest: Record<string, string> = {};
let i = 0, fails = 0;
async function worker() { while (i < lines.length) { const l = lines[i++]; const id = createHash("sha1").update(l.who + "|" + l.say).digest("hex").slice(0, 12); const f = `${dir}/${id}.mp3`;
  if (!existsSync(f)) { await Bun.sleep(900); for (let t = 0; t < 3; t++) { try { const r = await fetch(`${API}/speak?robot=${VOICE[l.who] || "eagle"}&lang=en&text=${encodeURIComponent(l.say)}`); if (!r.ok || !(r.headers.get("content-type") || "").includes("audio")) throw new Error(String(r.status)); writeFileSync(f, new Uint8Array(await r.arrayBuffer())); break; } catch (e) { await Bun.sleep(4000 * (t + 1)); if (t === 2) { fails++; console.error("FAIL", l.say.slice(0, 40), e); } } } }
  if (existsSync(f)) manifest[l.who + "|" + l.say] = `${id}.mp3`; } }
await worker();
writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(`${Object.keys(manifest).length}/${lines.length} lines baked, ${fails} failed`);
