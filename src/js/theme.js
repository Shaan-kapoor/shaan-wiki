/* The theme does not snap. It is wiped in as a circle growing from the button
 * that was pressed, so the change has a direction and an origin.
 */
(function () {
  "use strict";
  var btn = document.getElementById("theme");
  if (!btn) return;

  function apply(next) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("shaan.wiki:theme", next); } catch (e) {}
  }

  btn.addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (still || !document.startViewTransition) { apply(next); return; }

    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    // far enough to cover the furthest corner from the button
    var reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    document.startViewTransition(function () { apply(next); })
      .ready.then(function () {
        document.documentElement.animate(
          { clipPath: ["circle(0px at " + x + "px " + y + "px)",
                       "circle(" + reach + "px at " + x + "px " + y + "px)"] },
          { duration: 520, easing: "cubic-bezier(.4,0,.2,1)",
            pseudoElement: "::view-transition-new(root)" });
      });
  });
})();
