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

  var MS = 1000;

  function apply(next) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("shaan.wiki:theme", next); } catch (e) {}
  }

  /* The mask is 250% of the page tall and its soft band occupies the 32% to 44%
     stops, which is about a third of a page height. At 73.33% the whole band
     sits above the page and nothing of the new theme shows; at -13.33% it has
     passed below and the page is fully covered. Sliding between the two walks
     the band down. A wider feather washes the whole page grey at the midpoint,
     which reads as a fault rather than as light. */
  var FROM = "0% 73.33%", TO = "0% -13.33%";

  btn.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (still || !document.startViewTransition) { apply(next); return; }

    document.startViewTransition(function () { apply(next); })
      .ready.then(function () {
        document.documentElement.animate(
          { maskPosition: [FROM, TO], WebkitMaskPosition: [FROM, TO] },
          { duration: MS, easing: "cubic-bezier(.22,0,.18,1)",
            pseudoElement: "::view-transition-new(root)" });
      });
  });
})();
