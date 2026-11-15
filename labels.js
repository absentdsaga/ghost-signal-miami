/* Ghost Signal · map labels never cover a machine (Nov 15). Each label tries below / above / right / left of its own machine body and takes the first spot that covers no machine and no other label. Re-runs on zoom, pan end and resize. */
(function () {
  const C = ["below", "above", "right", "left"];
  const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  function set(lab, pos, hb, gap) {
    const s = lab.style; s.margin = "0"; s.right = "auto";
    if (pos === "below") { s.left = hb.cx + "px"; s.top = hb.b + gap + "px"; s.transformOrigin = "50% 0"; s.transform = "translateX(-50%) scale(var(--inv))"; }
    if (pos === "above") { s.left = hb.cx + "px"; s.top = hb.t - gap + "px"; s.transformOrigin = "50% 100%"; s.transform = "translate(-50%,-100%) scale(var(--inv))"; }
    if (pos === "right") { s.left = hb.r + gap + "px"; s.top = hb.cy + "px"; s.transformOrigin = "0 50%"; s.transform = "translateY(-50%) scale(var(--inv))"; }
    if (pos === "left") { s.left = hb.l - gap + "px"; s.top = hb.cy + "px"; s.transformOrigin = "100% 50%"; s.transform = "translate(-100%,-50%) scale(var(--inv))"; }
    lab.dataset.pos = pos;
  }
  function place() {
    const pins = [...document.querySelectorAll(".vpin.spr")].filter((p) => p.offsetWidth);
    if (!pins.length) return;
    const bodies = pins.map((p) => p.querySelector(".vhit")?.getBoundingClientRect()).filter(Boolean);
    const placed = [];
    for (const p of pins) {
      const lab = p.querySelector(".ghost-label"), hit = p.querySelector(".vhit"); if (!lab || !hit) continue;
      const pr = p.getBoundingClientRect(), k = pr.width / p.offsetWidth || 1, hr = hit.getBoundingClientRect();
      const hb = { l: (hr.left - pr.left) / k, r: (hr.right - pr.left) / k, t: (hr.top - pr.top) / k, b: (hr.bottom - pr.top) / k };
      hb.cx = (hb.l + hb.r) / 2; hb.cy = (hb.t + hb.b) / 2;
      let best = null;
      for (const c of C) {
        set(lab, c, hb, 3 / k);
        const r = lab.getBoundingClientRect();
        let cost = bodies.reduce((s, b) => s + area(r, b), 0) + placed.reduce((s, b) => s + area(r, b) * 2, 0);
        if (r.top < 70 || r.left < 0 || r.right > innerWidth) cost += r.width * r.height * 0.5;
        if (!best || cost < best.cost) best = { c, cost, r };
        if (cost === 0) break;
      }
      set(lab, best.c, hb, 3 / k); placed.push(lab.getBoundingClientRect());
    }
  }
  let q = 0; const later = () => { clearTimeout(q); q = setTimeout(() => requestAnimationFrame(place), 140); };
  addEventListener("resize", later);
  const mo = new MutationObserver(later);
  const hook = () => { const v = document.getElementById("vista"); if (v) mo.observe(v, { subtree: true, childList: true, attributes: true, attributeFilter: ["style", "class"] }); };
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", hook) : hook();
  addEventListener("load", later);
  window.GS_placeLabels = place;
})();
