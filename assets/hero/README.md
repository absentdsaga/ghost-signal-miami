# Hero art

## backgrounds/ (3840 x 2161)
`moon`, `mars-west`, `mars-east`, each as `.webp` (use in the game) and `.jpg`.
No machines and no light threads. Brighter, more contrast, a strong rim light on the planet edge.
Same framing as the painted maps, so `assets/layers/map-*/positions.json` still places each machine
(those numbers are 0 to 1 of the frame, so they work at any size).

## machines/ (1500 x 1500, transparent)
Each of the 11 machines, lit like a hero shot (warm key, pink and teal rim light).
- `eagle.png` / `eagle.webp`: lights off
- `eagle-on.png` / `eagle-on.webp`: lights on (status lamps, screens, antenna tip glowing)

The off and on versions of each machine have identical framing, so you can stack them and fade between them:

```html
<div class="bot">
  <img src="assets/hero/machines/eagle.webp">
  <img class="on" src="assets/hero/machines/eagle-on.webp">
</div>
```
```css
.bot{position:relative;width:min(60vw,600px);aspect-ratio:1}
.bot img{position:absolute;inset:0;width:100%}
.bot .on{opacity:0;transition:opacity .4s}
.bot.awake .on{opacity:1}
```
Use the `.webp` files in the game (much smaller). The `.png` files are there for editing.

Painted with Codex from the painted scenes so they match the world. Cut out with BiRefNet, backgrounds upscaled with Real-ESRGAN.
