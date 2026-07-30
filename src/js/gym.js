/* One tap to mark today, without opening the editor.
 *
 * Marking the gym must not require writing an entry, so this commits straight
 * to data/gym.json the moment it is tapped.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var mark = $("today");
  if (!mark) return;

  function paint(on) {
    mark.setAttribute("aria-pressed", on ? "true" : "false");
  }

  async function load() {
    $("gate").hidden = true;
    $("todaywrap").hidden = false;
    try { paint(await SW.getGym()); } catch (e) {}
  }

  mark.addEventListener("click", async function () {
    var on = mark.getAttribute("aria-pressed") !== "true";
    paint(on);
    mark.disabled = true;
    try {
      await SW.setGym(on);
    } catch (e) {
      paint(!on);
    }
    mark.disabled = false;
  });

  SW.autoUnlock($("pw"), load, function (s) { $("gate").dataset.state = s || ""; });
  if (SW.cached()) { load(); }
})();
