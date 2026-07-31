/* shaan.wiki intro: the name assembling itself out of a lattice, then leaving.
 *
 * Generative rather than choreographed, after The Way of Code: a noise field
 * and a pointer force produce the drift, so it is never the same twice. The
 * form is a dot matrix, which is the same lattice as the year grid, so this
 * reads as the grid arriving rather than as decoration. And it ends, which is
 * the point: after this, nothing on the site moves again.
 *
 * Runs on every load, so it is kept short. Tap or press any key to skip.
 */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var N = 47;          // the name is 41 cells wide, so the field is 47 square
  var GATHER = 1500;   // ms for the scatter to resolve into the lattice
  var LIFE = 2700;     // ms until it is gone
  var FADE = 620;      // ms of ease out at the end
  var STEP = 3;        // field carries every third cell
  var CLEAR = 2.2;     // cells of empty space held around the letterforms
  var FEATHER = 3.4;   // cells over which the field fades back in

  /* Capitals. Every glyph is the same height, which is why dot matrix displays
     have always been uppercase: at this resolution there is no ascender to
     find room for. */
  var F = {
    "s": [".###", "#...", ".##.", "...#", "###."],
    "h": ["#..#", "#..#", "####", "#..#", "#..#"],
    "a": [".##.", "#..#", "####", "#..#", "#..#"],
    "n": ["#..#", "##.#", "#.##", "#..#", "#..#"],
    ".": [".", ".", ".", ".", "#"],
    "w": ["#...#", "#...#", "#.#.#", "##.##", "#...#"],
    "i": ["#", "#", "#", "#", "#"],
    "k": ["#..#", "#.#.", "##..", "#.#.", "#..#"]
  };
  var WORD = "shaan.wiki";

  var NAME = (function () {
    var w = -1, i;
    for (i = 0; i < WORD.length; i++) w += F[WORD[i]][0].length + 1;
    var x = Math.round((N - w) / 2), y0 = Math.round((N - 5) / 2), set = {};
    for (i = 0; i < WORD.length; i++) {
      var g = F[WORD[i]];
      for (var r = 0; r < 5; r++) for (var c = 0; c < g[r].length; c++)
        if (g[r][c] === "#") set[(x + c) + "," + (y0 + r)] = 1;
      x += g[0].length + 1;
    }
    return set;
  })();

  /* Distance from every cell to the nearest name cell. The field is on a three
     cell pitch and the name on a one cell pitch, so without this the field
     drops dots at arbitrary offsets inside the letters and reads as uneven. */
  var DIST = (function () {
    var keys = Object.keys(NAME).map(function (k) { return k.split(","); });
    var out = {};
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var best = 1e9;
      for (var i = 0; i < keys.length; i++) {
        var d = Math.hypot(x - keys[i][0], y - keys[i][1]);
        if (d < best) best = d;
      }
      out[x + "," + y] = best;
    }
    return out;
  })();

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
  var pointer = { x: -1e4, y: -1e4, on: false };

  function resize() {
    size = Math.min(window.innerWidth * 0.88, window.innerHeight * 0.62, 520);
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

  function rnd(i) {
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
      var isName = !!NAME[ix + "," + iy];
      var near = DIST[ix + "," + iy];
      if (!isName) {
        if (ix % STEP || iy % STEP) continue;
        if (near < CLEAR) continue;
      }
      var i = iy * N + ix;
      var ang = rnd(i) * 6.2832, far = 0.55 + rnd(i + 7919) * 0.9;
      dots.push({
        ix: ix, iy: iy, d: d, isName: isName, near: near,
        ox: Math.cos(ang) * far, oy: Math.sin(ang) * far,
        delay: (d / maxd) * 620 + rnd(i + 104729) * 260
      });
    }
  }

  var start = performance.now(), raf;

  function frame(now) {
    var age = now - start;
    var t = age / 1000;
    var out = age < LIFE - FADE ? 1 : Math.max(0, (LIFE - age) / FADE);

    ctx.clearRect(0, 0, size, size);
    var gap = size / (N + 1);

    for (var k = 0; k < dots.length; k++) {
      var p = dots[k];
      var life = (age - p.delay) / GATHER;
      if (life <= 0) continue;
      life = Math.min(life, 1);
      var ease = 1 - Math.pow(1 - life, 4);

      var hx = gap * (p.ix + 1), hy = gap * (p.iy + 1);
      var px = hx + p.ox * size * (1 - ease);
      var py = hy + p.oy * size * (1 - ease);

      var drift = ease * gap * 0.3;
      px += noise(p.ix * 0.5, p.iy * 0.5, t * 0.35) * drift;
      py += noise(p.iy * 0.5, p.ix * 0.5, t * 0.31) * drift;

      if (pointer.on) {
        var dx = px - pointer.x, dy = py - pointer.y;
        var pd = Math.hypot(dx, dy);
        var reach = size * 0.3;
        if (pd < reach && pd > 0.01) {
          var force = (1 - pd / reach) * gap * 1.7;
          px += (dx / pd) * force;
          py += (dy / pd) * force;
        }
      }

      /* The breath phase runs with distance from centre, so it paints rings.
         Normalising by maxd holds it at 0.81 of a cycle, one soft ring, at any
         lattice size. Left as a raw coefficient it painted a bullseye. */
      var breath = 0.6 + 0.4 * Math.sin(t * 1.15 - (p.d / maxd) * 5.09);
      var r, a;

      if (p.isName) {
        r = gap * 0.34 * ease * (0.78 + 0.22 * breath) * out;
        a = ease * out * (0.86 + 0.14 * breath);
      } else {
        /* Fade the field back as it nears the letters, so the clearing follows
           their shape rather than being a hole cut around them. */
        var soft = Math.min(1, Math.max(0, (p.near - CLEAR) / FEATHER));
        r = gap * 0.48 * ease * (0.5 + 0.5 * breath) * out * (0.35 + 0.65 * soft);
        a = ease * out * (0.3 + 0.7 * breath) * 0.62 * soft;
      }

      if (r <= 0.12 || a <= 0.01) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.beginPath();
      ctx.arc(px, py, r, 0, 6.2832);
      ctx.fillStyle = ink;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

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
