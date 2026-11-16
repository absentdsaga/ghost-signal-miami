// Pre-records every line of a call file through the game's voice endpoint. Run: bun scripts/bake-call-voice.ts mockups/call/eagle.js
import { createHash } from "node:crypto";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
const API = "https://dioni.zo.space/api/ghost-signal";
const file = process.argv[2]; const g: any = {}; new Function("window", await Bun.file(file).text())(g); const C = g.CALL;
const VOICE: Record<string, string> = { BUZZ: "rover16", HOUSTON: "alsep" };
const lines: { who: string; say: string }[] = [];
(function walk(o: any) { if (!o || typeof o !== "object") return; if (o.who && o.say) lines.push({ who: o.who, say: o.say });
  if (o.say && o.yes) { lines.push({ who: C.name, say: o.yes }); lines.push({ who: C.name, say: o.no }); }
  for (const k in o) if (typeof o[k] === "object") walk(o[k]); })(C);
const dir = "assets/" + C.voiceDir.replace(/^(\.\.\/)+assets\//, ""); mkdirSync(dir, { recursive: true });
const mf = `${dir}manifest.json`; const manifest: Record<string, string> = existsSync(mf) ? JSON.parse(readFileSync(mf, "utf8")) : {};
let fails = 0;
for (const l of lines) { const key = l.who + "|" + l.say; if (manifest[key]) continue;
  const id = createHash("sha1").update(key).digest("hex").slice(0, 12), f = `${dir}${id}.mp3`;
  for (let t = 0; t < 3 && !existsSync(f); t++) { try { await Bun.sleep(900);
    const r = await fetch(`${API}/speak?robot=${VOICE[l.who] || C.id}&lang=en&text=${encodeURIComponent(l.say)}`);
    if (!r.ok || !(r.headers.get("content-type") || "").includes("audio")) throw new Error(String(r.status));
    writeFileSync(f, new Uint8Array(await r.arrayBuffer())); } catch (e) { await Bun.sleep(4000 * (t + 1)); if (t === 2) { fails++; console.error("FAIL", l.say.slice(0, 50), e); } } }
  if (existsSync(f)) manifest[key] = `${id}.mp3`; }
writeFileSync(mf, JSON.stringify(manifest, null, 1));
console.log(`${lines.filter(l => manifest[l.who + "|" + l.say]).length}/${lines.length} lines voiced, ${fails} failed`);
