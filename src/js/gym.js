/* One tap to mark today.
 *
 * No password here. The token is unlocked once per device on /write and kept,
 * so marking attendance is a tap and nothing else. The tick flips instantly and
 * the commit happens behind it; if the commit fails the tick goes back.
 */
(function () {
  "use strict";

  var mark = document.getElementById("today");
  if (!mark) return;

  function paint(on) { mark.setAttribute("aria-pressed", on ? "true" : "false"); }

  if (SW.cached()) {
    SW.getGym().then(paint).catch(function () {});
  }

  var busy = false;
  mark.addEventListener("click", async function () {
    if (busy) return;
    var on = mark.getAttribute("aria-pressed") !== "true";
    paint(on);
    if (navigator.vibrate) navigator.vibrate(on ? 14 : 8);

    if (!SW.cached()) { paint(!on); location.href = "/write/"; return; }
    busy = true;
    try {
      await SW.setGym(on);
    } catch (e) {
      paint(!on);
    }
    busy = false;
  });
})();
