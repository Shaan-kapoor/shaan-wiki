/* The writing surface.
 *
 * The page only ever writes today's file, computed in IST. That single fact is
 * what sealing at midnight means: there is no job to run.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var sha = null, saveTimer = null, stateTimer = null;

  var DATE = SW.isoDate(SW.todayIST());
  var PATH = "entries/" + DATE + ".md";
  var DRAFT = "shaan.wiki:draft:" + DATE;

  function say(msg, sticky) {
    var el = $("state");
    el.classList.add("fade");
    clearTimeout(stateTimer);
    setTimeout(function () {
      el.textContent = msg;
      el.classList.remove("fade");
      if (!sticky) {
        stateTimer = setTimeout(function () { el.classList.add("fade"); }, 1800);
      }
    }, 180);
  }

  function ready() {
    var has = $("body").value.trim().length > 0;
    $("pub").disabled = !has;
    $("bar").classList.toggle("live", has);
  }

  function grow() {
    var t = $("title");
    t.style.height = "auto";
    t.style.height = t.scrollHeight + "px";
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT, JSON.stringify({
        t: $("title").value, b: $("body").value,
        g: $("gym").getAttribute("aria-pressed") === "true"
      }));
      say("saved");
    } catch (e) {}
  }

  function compose() {
    return "---\ntitle: " + ($("title").value.trim() || DATE) +
      "\ndate: " + DATE + "\nday: " + SW.dayNumber() +
      "\ngym: " + $("gym").getAttribute("aria-pressed") +
      "\n---\n\n" + $("body").value.trim() + "\n";
  }

  SW.autoUnlock($("pw"), open, function (st) {
    var gate = $("gate");
    gate.dataset.state = st || "";
    if (st === "novault") { $("gatemsg").textContent = "no vault.json"; return; }
    if (st === "") {
      $("gatemsg").textContent = "";
      gate.classList.remove("wrong");
      void gate.offsetWidth;          // restart the animation
      gate.classList.add("wrong");
    } else {
      $("gatemsg").textContent = "";
    }
  });

  SW.hasVault().then(function (ok) {
    if (!ok) $("gatemsg").textContent = "no vault.json";
  });

  async function open() {
    $("gate").hidden = true;
    $("compose").hidden = false;

    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch (e) {}
    if (draft) {
      $("title").value = draft.t || "";
      $("body").value = draft.b || "";
      $("gym").setAttribute("aria-pressed", draft.g ? "true" : "false");
    }

    try {
      var cur = await SW.gh(PATH);
      if (cur) {
        sha = cur.sha;
        if (!draft) {
          var txt = SW.decode(cur.content);
          var m = /^---\n([\s\S]*?)\n---\n*/.exec(txt);
          var meta = {};
          if (m) m[1].split("\n").forEach(function (l) {
            var i = l.indexOf(":");
            if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
          });
          $("title").value = meta.title || "";
          $("body").value = m ? txt.slice(m[0].length).trim() : txt;
          $("gym").setAttribute("aria-pressed", meta.gym === "true" ? "true" : "false");
        }
      }
      if (!draft && !cur) {
        var g = await SW.getGym();
        $("gym").setAttribute("aria-pressed", g ? "true" : "false");
      }
    } catch (e) { say("offline", true); }

    grow();
    ready();
    $("body").focus();
  }

  ["title", "body"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      if (id === "title") grow();
      ready();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 500);
    });
  });

  $("title").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); $("body").focus(); }
  });

  /* The tick commits immediately. Going to the gym and not writing that day
     still has to count, so it cannot wait for Publish. */
  $("gym").addEventListener("click", async function () {
    var on = this.getAttribute("aria-pressed") !== "true";
    this.setAttribute("aria-pressed", on ? "true" : "false");
    SW.localSet(on);
    saveDraft();
    try {
      await SW.setGym(on);
    } catch (e) { /* held locally, flushed on the next load */ }
  });

  $("pub").addEventListener("click", async function () {
    if (!$("body").value.trim()) return;
    $("pub").disabled = true;
    say("publishing", true);
    try {
      sha = await SW.put(PATH, compose(),
        (sha ? "Edit" : "Write") + " " + DATE, sha);
      await SW.setGym($("gym").getAttribute("aria-pressed") === "true");
      try { localStorage.removeItem(DRAFT); } catch (e) {}
      say("published");
    } catch (err) {
      say("failed", true);
    }
    $("pub").disabled = false;
  });

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !$("pub").disabled) {
      $("pub").click();
    }
  });

  if (SW.cached()) { open(); } else { $("pw").focus(); }
})();
