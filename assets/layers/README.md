# Art layers

Every painting is split into separate layers, all the same size, so they stack exactly.

## Site scenes (11 folders, e.g. `eagle/`), 1280x720

Stack bottom to top:

1. `ground.webp`: the landscape with the machine painted out
2. `shadow.webp`: the machine's shadow, transparent
3. `machine.webp`: the machine alone, transparent, full frame

`scenes.json` gives each machine's box (0 to 1 of the frame) for glow, tap area or zoom.

```html
<div class="scene">
  <img src="assets/layers/eagle/ground.webp">
  <img src="assets/layers/eagle/shadow.webp">
  <img src="assets/layers/eagle/machine.webp">
</div>
```
```css
.scene{position:relative;aspect-ratio:16/9}
.scene img{position:absolute;inset:0;width:100%;height:100%}
```

Now the machine can breathe, float, glow, go grey while silent, or light up when it wakes, without touching the ground.

## Maps (`map-moon/`, `map-mars-west/`, `map-mars-east/`)

Stack: `ground.webp`, `shadows.webp`, `threads.webp` (the light lines), `machines.webp`.
Each machine also has its own small sprite (`eagle.webp` etc.). `positions.json` gives
`sprite_box` (where that sprite sits, 0 to 1 of the frame), `box` (tight tap area) and `thread_x` (where its light line falls).

Notes: a few plates keep a faint trace of the old shadow on the ground. Ingenuity sits on the Mars-east limb, so its patch of planet edge is softer.
