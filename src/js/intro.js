/* shaan.wiki intro: order assembling itself out of scatter, then settling.
 *
 * Generative rather than choreographed, after The Way of Code: a noise field
 * and a pointer force produce the motion, so it is never the same twice. The
 * form is a dot matrix, which is the same lattice as the year grid, so this
 * reads as the grid arriving rather than as decoration. And it ends, which is
 * the whole point: after this nothing on the site moves again.
 *
 * Every dot starts somewhere random and finds its place. Runs on every load,
 * so it is kept short.
 */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var N = 19;
  var GATHER = 1500;   // ms for the scatter to resolve into the lattice
  var LIFE = 2700;     // ms until it is gone

  var overlay = document.createElement("div");
  overlay.className = "intro";
  overlay.setAttribute("aria-hidden", "true");
  var canvas = document.createElement("canvas");
  canvas.className = "intro-canvas";
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);

  var ctx = canvas.getContext("2d");
  var ink = getComputedStyle(document.body).color || "#fff";
  var size = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var pointer = { x: -999, y: -999, on: false };

  function resize() {
    size = Math.min(window.innerWidth * 0.74, window.innerHeight * 0.6, 440);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function move(e) {
    var r = canvas.getBoundingClientRect();
    var p = e.touches ? e.touches[0] : e;
    pointer.x = p.clientX - r.left;
    pointer.y = p.clientY - r.top;
    pointer.on = true;
  }
  overlay.addEventListener("pointermove", move);
  overlay.addEventListener("touchmove", move, { passive: true });

  // deterministic scatter: each dot remembers where it came from
  function rand(i) {
    var x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function noise(x, y, t) {
    return Math.sin(x * 0.72 + t) * Math.cos(y * 0.61 - t * 0.8) +
           0.5 * Math.sin((x + y) * 0.43 + t * 1.27);
  }

  var mid = (N - 1) / 2;
  var maxd = Math.hypot(mid, mid);
  var dots = [];
  for (var iy = 0; iy < N; iy++) {
    for (var ix = 0; ix < N; ix++) {
      var d = Math.hypot(ix - mid, iy - mid);
      if (d > maxd * 0.96) continue;
      var i = iy * N + ix;
      var ang = rand(i) * 6.2832;
      var far = 0.55 + rand(i + 7919) * 0.9;
      dots.push({
        ix: ix, iy: iy, d: d,
        // where it starts: flung out along a random bearing
        ox: Math.cos(ang) * far, oy: Math.sin(ang) * far,
        delay: (d / maxd) * 620 + rand(i + 104729) * 260
      });
    }
  }

  var start = performance.now(), raf;

  function frame(now) {
    var age = now - start;
    var t = age / 1000;
    var out = age < LIFE - 620 ? 1 : Math.max(0, (LIFE - age) / 620);

    ctx.clearRect(0, 0, size, size);
    var gap = size / (N + 1);

    for (var k = 0; k < dots.length; k++) {
      var p = dots[k];
      var life = (age - p.delay) / GATHER;
      if (life <= 0) continue;
      life = Math.min(life, 1);
      // decelerating arrival, no overshoot, nothing bounces
      var ease = 1 - Math.pow(1 - life, 4);

      var hx = gap * (p.ix + 1);
      var hy = gap * (p.iy + 1);
      var px = hx + p.ox * size * (1 - ease);
      var py = hy + p.oy * size * (1 - ease);

      // once home, the lattice breathes on the noise field
      var drift = ease * gap * 0.3;
      px += noise(p.ix * 0.5, p.iy * 0.5, t * 0.34) * drift;
      py += noise(p.iy * 0.5, p.ix * 0.5, t * 0.31) * drift;

      if (pointer.on) {
        var dx = px - pointer.x, dy = py - pointer.y;
        var pd = Math.hypot(dx, dy);
        var reach = size * 0.3;
        if (pd < reach && pd > 0.01) {
          var f = (1 - pd / reach) * gap * 1.7;
          px += (dx / pd) * f;
          py += (dy / pd) * f;
        }
      }

      var breath = 0.6 + 0.4 * Math.sin(t * 1.15 - p.d * 0.4);
      var r = gap * 0.2 * ease * (0.5 + 0.5 * breath) * out;
      if (r <= 0.12) continue;

      ctx.globalAlpha = ease * out * (0.3 + 0.7 * breath);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 6.2832);
      ctx.fillStyle = ink;
      ctx.fill();
    }

    if (age < LIFE) {
      raf = requestAnimationFrame(frame);
    } else {
      overlay.classList.add("done");
      setTimeout(function () {
        cancelAnimationFrame(raf);
        overlay.remove();
      }, 620);
    }
  }
  raf = requestAnimationFrame(frame);

  function skip() { start -= LIFE; }
  overlay.addEventListener("click", skip);
  window.addEventListener("keydown", skip, { once: true });
})();
