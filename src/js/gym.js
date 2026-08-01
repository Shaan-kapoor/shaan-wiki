/* One tap to mark today, and one place it is kept.
 *
 * data/gym.json is the only record. It used to also live in localStorage and
 * in each entry's frontmatter, and either of those could put back a value you
 * had just cleared, so clearing a day sometimes did not take.
 *
 * The tick flips at once, because waiting on a network to acknowledge a fact
 * about your own morning is absurd. But it never claims to have saved until
 * GitHub says so, and it goes back if GitHub refuses.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var mark = $("today"), state = $("state"), gate = $("gate");
  if (!mark) return;

  var busy = false, known = null, timer = null;

  function paint(on) {
    mark.setAttribute("aria-pressed", on ? "true" : "false");
  }

  /* Three words, and only one of them lingers: an unsaved tap has to keep
     saying so, a saved one does not. */
  function say(word, sticky) {
    clearTimeout(timer);
    state.textContent = word;
    state.classList.remove("fade");
    if (!sticky) timer = setTimeout(function () { state.classList.add("fade"); }, 1600);
  }

  function ready() {
    gate.hidden = true;
    mark.hidden = false;
    SW.getGym().then(function (on) {
      known = on;
      paint(on);
    }).catch(function () {
      say("offline", true);
    });
  }

  mark.addEventListener("click", async function () {
    if (busy) return;
    var next = mark.getAttribute("aria-pressed") !== "true";
    paint(next);
    if (navigator.vibrate) navigator.vibrate(next ? 14 : 8);
    busy = true;
    mark.classList.add("saving");
    say("saving", true);
    try {
      await SW.setGym(next);
      known = next;
      say("saved");
    } catch (e) {
      paint(known === null ? !next : known);      // put it back the way it was
      say("not saved", true);
    }
    mark.classList.remove("saving");
    busy = false;
  });

  SW.autoUnlock($("pw"), ready, function (st) {
    if (st === "novault") $("gatemsg").innerHTML = '<a href="/setup/">set up</a>';
  });

  if (SW.cached()) { ready(); } else { gate.hidden = false; $("pw").focus(); }
})();
