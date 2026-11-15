# Ghost Signal (Señal Fantasma)

NASA Space Apps Challenge 2026, Miami. Challenge: *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars.*

Tap a robot NASA left on the Moon or Mars and call it, in English or Spanish. It answers in first person, only from a fact card built from cited NASA sources, and its reply waits the real light-travel time from Earth, computed live from NASA JPL Horizons.

- Maps: NASA Moon Trek (LRO WAC mosaic) and Mars Trek (Viking MDIM 2.1) tiles
- Live signal delay: NASA JPL Horizons API
- Facts and photos: NASA mission pages and NASA Image and Video Library (see `data/SOURCES.md`)
- The robot's voice is AI-generated and labelled as an imagined voice in the app.

## The game: case files

Each robot forgot what happened to it. The caller wakes it up, collects real NASA clues (by asking, by looking at its last photo, by finding it from orbit), then rebuilds the true sentence from word chips. Solving it brings the robot back in colour, plays its own words and unlocks a keepsake card (the person behind it, or what it left us). Progress, the caller's name and solved robots are saved on the device; one robot's line is "open" each day; everyone's "brought back" count is shared.

- `data/mysteries.json`: the 11 cases. Every clue links to the NASA page it comes from. Built by checking each answer is reachable from the clues.
- `game.js`: game logic. Fires `gs:clue`, `gs:wrong`, `gs:solved`, `gs:guide-open` on `window` for animations.
- `game.css`: the look of the case file, word chips, solve moment and field guide. Restyle freely; the class names are what `game.js` uses.
- While a case is unsolved, the robot's AI does not see the facts that answer it, so it can't give the answer away.

Built Nov 14-15, 2026 at Miami Dade College.

## NASA data used

- **NASA JPL Horizons API**: the real light-travel time from Earth to the Moon and Mars, fetched live (refreshed every 10 minutes). The robot's reply waits that long.
- **NASA Moon Trek and Mars Trek**: LRO WAC global mosaic and Viking MDIM 2.1 colour mosaic, used for the maps and to place each machine at its true landing site.
- **NASA mission pages, NSSDCA, LROC and the NASA Image and Video Library**: every fact, clue, "last photo" and "seen from orbit today" image.
- **Apollo Lunar Surface Journal (NASA radio recordings)**: each Apollo machine's real radio clip.
- **NASA 3D Resources**: 3D models where NASA publishes one.

Full list, by machine: [`data/SOURCES.md`](data/SOURCES.md).

## Use of AI (labelled)

| Part | AI tool | How it is labelled |
|---|---|---|
| Painted scenes, painted maps, machine art | Image generation (Codex), painted from real NASA photos and maps; cut-outs with BiRefNet, upscaling with Real-ESRGAN | On screen: "Painted from NASA photos · AI-assisted" credit on the map and scenes |
| Robot voices | ElevenLabs (eleven_v3), OpenAI gpt-4o-mini-tts as backup | On screen: "Imagined voice (AI)"; here |
| Robot answers | OpenAI gpt-4.1-mini, answering only from the cited fact card for that machine | On screen: every answer shows its NASA source link; here |
| Speech to text | OpenAI gpt-4o-mini-transcribe | Here |
| Background music | ElevenLabs Music (instrumental) | Here, and in the MP3 file's metadata (`assets/audio/music-*.mp3`) |
| Code | Written with AI coding assistants (Claude, Codex), directed and reviewed by the team | Here, and in the git commit metadata (Co-Authored-By lines) |

Not AI: every fact, photo, map tile, radio recording and the live light-travel time come from NASA (see above). The real NASA photos are shown separately from the painted art and keep their NASA credit.

## References

- NASA sources: [`data/SOURCES.md`](data/SOURCES.md)
- Tools: ElevenLabs, OpenAI API, Codex, Claude, BiRefNet, Real-ESRGAN, GitHub Pages, Zo Computer (API host)
