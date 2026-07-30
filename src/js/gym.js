/* One tap to mark today.
 *
 * Local-first: the tick lands immediately in localStorage and is pushed to
 * GitHub whenever a token is available. It never waits on a network, never
 * asks for a password, and never sends you somewhere else to do it.
 */
(function () {
  "use strict";

  var mark = document.getElementById("today");
  if (!mark) return;

  function paint(on) { mark.setAttribute("aria-pressed", on ? "true" : "false"); }

  var local = SW.localGet();
  if (local !== null) paint(local);

  if (SW.cached()) {
    SW.flush()
      .then(function (pushed) { if (!pushed) return SW.getGym().then(function (r) {
        if (SW.localGet() === null) { paint(r); SW.localSet(r); }
      }); })
      .catch(function () {});
  }

  mark.addEventListener("click", function () {
    var on = mark.getAttribute("aria-pressed") !== "true";
    paint(on);
    SW.localSet(on);
    if (navigator.vibrate) navigator.vibrate(on ? 14 : 8);
    if (SW.cached()) {
      SW.setGym(on).catch(function () { /* stays local, flushed next load */ });
    }
  });
})();
