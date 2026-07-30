/* The theme does not snap, and it does not fade.
 *
 * The new theme comes down over the old one as a straight edge, tilted so the
 * right side leads. It starts at the top right corner, where the button is,
 * and sweeps to the bottom left. Slow enough to watch: 900ms, near constant
 * speed, easing out only at the very end so it settles rather than stops.
 */
(function () {
  "use strict";
  var btn = document.getElementById("theme");
  if (!btn) return;

  var LEAN = 26;      // % the right edge leads the left by. The tilt.
  var MS = 900;

  function apply(next) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("shaan.wiki:theme", next); } catch (e) {}
  }

  // The covered region is everything above a tilted line. At p the right edge
  // sits at p*(100+LEAN) and the left edge trails it by LEAN, so at p=0 nothing
  // is covered and at p=1 even the bottom left corner is.
  function edge(p) {
    var right = p * (100 + LEAN);
    return "polygon(0% 0%, 100% 0%, 100% " + right.toFixed(2) + "%, 0% " +
      (right - LEAN).toFixed(2) + "%)";
  }

  btn.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (still || !document.startViewTransition) { apply(next); return; }

    document.startViewTransition(function () { apply(next); })
      .ready.then(function () {
        document.documentElement.animate(
          { clipPath: [edge(0), edge(0.5), edge(1)] },
          { duration: MS, easing: "cubic-bezier(.25,0,.15,1)",
            pseudoElement: "::view-transition-new(root)" });
      });
  });
})();
