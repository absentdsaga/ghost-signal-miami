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
