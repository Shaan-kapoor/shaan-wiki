/* The theme does not snap, and it does not fade.
 *
 * The new theme comes down over the old one as a straight edge, tilted so the
 * right side leads. It starts at the top right corner, where the button is,
 * and sweeps to the bottom left. Constant speed: an eased tail makes the last
 * third crawl, which reads worse than simply moving faster.
 */
(function () {
  "use strict";
  var btn = document.getElementById("theme");
  if (!btn) return;

  var MS = 780;

  function apply(next) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("shaan.wiki:theme", next); } catch (e) {}
  }

  /* The band occupies the 44% to 56% stops of a mask 2.5 pages tall, so the
     feather is 30% of a page height and the opaque head is 1.1 pages.

     At 93.3333% the band sits exactly above the page and nothing of the new
     theme shows. At 0% the box top is level with the page top and the opaque
     head covers all of it. Those two endpoints are forced by the geometry: end
     anywhere below 0% and the top strip falls outside the mask box, which
     no-repeat renders transparent, so the old theme reappears at the top until
     the transition ends. */
  var FROM = "0% 93.3333%", TO = "0% 0%";

  btn.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (still || !document.startViewTransition) { apply(next); return; }

    document.startViewTransition(function () { apply(next); })
      .ready.then(function () {
        document.documentElement.animate(
          { maskPosition: [FROM, TO], WebkitMaskPosition: [FROM, TO] },
          { duration: MS, easing: "linear",
            pseudoElement: "::view-transition-new(root)" });
      });
  });
})();
