/* shaan.wiki intro — a generative field that blooms, breathes, and settles.
 *
 * Three references, pulling different ways:
 *
 *   The Way of Code   generative rather than choreographed. There are no
 *                     keyframes here — a noise field and a pointer force
 *                     produce the motion, so it is never the same twice.
 *                     Slow, elemental, reshapes under the cursor.
 *   Nothing           the form is a dot matrix. Same lattice as the year grid,
 *                     so this is the grid assembling itself, not decoration.
 *   Tetragrammaton    it ends. Motion whose whole purpose is to resolve into
 *                     stillness — after ~4s nothing on this site ever moves again.
 *
 * ~3 KB, no library, black and white, one canvas.
 * No JS, reduced motion, or a second visit: never runs.
 */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (sessionStorage.getItem("shaan.wiki:seen")) return;
    sessionStorage.setItem("shaan.wiki:seen", "1");
  } catch (e) { /* private mode — just play it */ }

  var N = 17;               // lattice is N x N
  var LIFE = 4200;          // ms until everything is still
  var BLOOM = 1500;         // ms for the wave to reach the far corner

  var overlay = document.createElement("div");
  overlay.className = "intro";
  overlay.setAttribute("aria-hidden", "true");

  var canvas = document.createElement("canvas");
  canvas.className = "intro-canvas";
  var mark = document.createElement("span");
  mark.className = "intro-mark";
  mark.textContent = "shaan.wiki";
  overlay.appendChild(canvas);
  overlay.appendChild(mark);
  document.body.appendChild(overlay);

  var ctx = canvas.getContext("2d");
  var ink = getComputedStyle(document.body).color || "#000";
  var size = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var pointer = { x: -999, y: -999, on: false };

  function resize() {
    size = Math.min(window.innerWidth * 0.72, window.innerHeight * 0.62, 420);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function movePointer(e) {
    var r = canvas.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    pointer.x = p.clientX - r.left;
    pointer.y = p.clientY - r.top;
    pointer.on = true;
  }
  overlay.addEventListener("pointermove", movePointer);
  overlay.addEventListener("touchmove", movePointer, { passive: true });
  overlay.addEventListener("pointerleave", function () { pointer.on = false; });

  // cheap, dependency-free organic noise — enough for slow drift
  function noise(x, y, t) {
    return Math.sin(x * 0.72 + t) * Math.cos(y * 0.61 - t * 0.8) +
           0.5 * Math.sin((x + y) * 0.43 + t * 1.27);
  }

  var mid = (N - 1) / 2;
  var maxd = Math.hypot(mid, mid);
  var start = performance.now();
  var raf;

  function frame(now) {
    var age = now - start;
    var t = age / 1000;
    // everything decays to nothing by LIFE — the settling
    var settle = age < LIFE - 900 ? 1 : Math.max(0, (LIFE - age) / 900);

    ctx.clearRect(0, 0, size, size);
    var gap = size / (N + 1);

    for (var iy = 0; iy < N; iy++) {
      for (var ix = 0; ix < N; ix++) {
        var d = Math.hypot(ix - mid, iy - mid);
        if (d > maxd * 0.94) continue;

        // radial wave: each ring wakes a little after the one inside it
        var wake = (d / maxd) * BLOOM;
        if (age < wake) continue;
        var life = Math.min((age - wake) / 620, 1);
        var ease = 1 - Math.pow(1 - life, 3);

        var bx = gap * (ix + 1);
        var by = gap * (iy + 1);

        // organic drift
        var n = noise(ix * 0.5, iy * 0.5, t * 0.35);
        var px = bx + n * gap * 0.34 * ease;
        var py = by + noise(iy * 0.5, ix * 0.5, t * 0.31) * gap * 0.34 * ease;

        // the pointer pushes the field open
        if (pointer.on) {
          var dx = px - pointer.x, dy = py - pointer.y;
          var pd = Math.hypot(dx, dy);
          var reach = size * 0.28;
          if (pd < reach && pd > 0.01) {
            var force = (1 - pd / reach) * gap * 1.5;
            px += (dx / pd) * force;
            py += (dy / pd) * force;
          }
        }

        // dots breathe, then shrink toward the quiet state
        var breath = 0.62 + 0.38 * Math.sin(t * 1.1 - d * 0.42);
        var r = gap * 0.19 * ease * (0.55 + 0.45 * breath) * settle;
        if (r <= 0.1) continue;

        ctx.globalAlpha = Math.min(1, ease) * settle * (0.28 + 0.72 * breath);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, 6.2832);
        ctx.fillStyle = ink;
        ctx.fill();
      }
    }

    if (age < LIFE) {
      raf = requestAnimationFrame(frame);
    } else {
      overlay.classList.add("done");
      setTimeout(function () {
        cancelAnimationFrame(raf);
        overlay.remove();
      }, 700);
    }
  }
  raf = requestAnimationFrame(frame);

  // any tap or key skips straight to the page
  function skip() {
    start -= LIFE;
  }
  overlay.addEventListener("click", skip);
  window.addEventListener("keydown", skip, { once: true });
})();
