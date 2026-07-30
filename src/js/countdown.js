/* The counter is rendered correctly at build time, so this only keeps it
 * honest for a tab left open overnight. Days only — no ticking seconds,
 * because a clock that repaints every second would ghost an e-ink screen
 * into uselessness. */
(function () {
  "use strict";
  var el = document.querySelector(".counter[data-expiry]");
  if (!el) return;
  var expiry = new Date(el.getAttribute("data-expiry"));
  var b = el.querySelectorAll("b");
  if (b.length < 2) return;

  function tick() {
    var days = Math.max(0, Math.ceil((expiry - new Date()) / 86400000));
    if (b[1].textContent !== String(days)) b[1].textContent = days;
  }
  tick();
  setInterval(tick, 60000);
})();
