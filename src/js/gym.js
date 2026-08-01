/* One tap to mark today, and one place it is kept.
 *
 * data/gym.json is the only record. It used to also live in localStorage and
 * in each entry's frontmatter, and either of those could put back a value you
 * had just cleared, so clearing a day sometimes did not take.
 *
 * The grid on this page is baked at build time, so after a tap it is a minute
 * out of date until CI rebuilds. Since this page holds the real numbers in
 * memory anyway, it lights the square and recounts the streaks itself rather
 * than showing you something it knows to be stale.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var mark = $("today"), state = $("state"), gate = $("gate");
  if (!mark) return;

  var DAY_ONE = "2026-07-31";
  var busy = false, known = null, timer = null;

  function paint(on) {
    mark.setAttribute("aria-pressed", on ? "true" : "false");
    var cell = document.querySelector('.year[data-kind="gym"] i[data-today]');
    if (cell) cell.className = (on ? "y" : "n") + " t";
  }

  /* Three words, and only one of them lingers: an unsaved tap has to keep
     saying so, a saved one does not. */
  function say(word, sticky) {
    clearTimeout(timer);
    state.textContent = word;
    state.classList.remove("fade");
    if (!sticky) timer = setTimeout(function () { state.classList.add("fade"); }, 1600);
  }

  /* The same arithmetic the build does, over the data already in hand. */
  function recount(data) {
    var one = new Date(DAY_ONE + "T00:00:00Z");
    var t = SW.todayIST();
    var today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    var elapsed = Math.floor((today - one) / 86400000) + 1;

    var key = function (i) {
      return new Date(one.getTime() + i * 86400000).toISOString().slice(0, 10);
    };

    var count = 0, longest = 0, run = 0;
    for (var i = 0; i < elapsed; i++) {
      if (data[key(i)]) { count++; run++; if (run > longest) longest = run; }
      else run = 0;
    }

    // Start at today if today is marked, otherwise yesterday: an unmarked
    // today has not broken anything, the day is simply not over.
    var current = 0, j = data[key(elapsed - 1)] ? elapsed - 1 : elapsed - 2;
    while (j >= 0 && data[key(j)]) { current++; j--; }

    if ($("gcount")) $("gcount").textContent = count;
    if ($("gstreak")) $("gstreak").textContent = current;
    if ($("glongest")) $("glongest").textContent = longest;
  }

  function ready() {
    gate.hidden = true;
    mark.hidden = false;
    SW.loadGym().then(function (data) {
      known = !!data[SW.isoDate(SW.todayIST())];
      paint(known);
      recount(data);
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
      recount(await SW.loadGym());
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
