/* The writing surface.
 *
 * The page only ever writes today's file, computed in IST. That single fact is
 * what sealing at midnight means: there is no job to run.
 */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var sha = null, saveTimer = null, stateTimer = null;
  var aliases = [], loadedSlug = null;

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
        t: $("title").value, b: $("body").value
      }));
      say("saved");
    } catch (e) {}
  }

  function slugify(s) {
    return s.toLowerCase().replace(/[^\w\s-]/g, "").trim()
      .replace(/[\s_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  }

  function compose() {
    var title = $("title").value.trim() || DATE;
    /* Retitling moves the page, so the address it used to live at is recorded
       and the build keeps serving a redirect from it. */
    var now = slugify(title), all = aliases.slice();
    if (loadedSlug && loadedSlug !== now && all.indexOf(loadedSlug) < 0) {
      all.push(loadedSlug);
    }
    return "---\ntitle: " + title +
      "\ndate: " + DATE + "\nday: " + SW.dayNumber() +
      (all.length ? "\naliases: [" + all.join(", ") + "]" : "") +
      "\n---\n\n" + $("body").value.trim() + "\n";
  }

  SW.autoUnlock($("pw"), open, function (st) {
    var gate = $("gate");
    gate.dataset.state = st || "";
    if (st === "novault") { $("gatemsg").innerHTML = '<a href="/setup/">set up</a>'; return; }
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
    if (!ok) $("gatemsg").innerHTML = '<a href="/setup/">set up</a>';
  });

  async function open() {
    $("gate").hidden = true;
    $("compose").hidden = false;

    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT) || "null"); } catch (e) {}
    if (draft) {
      $("title").value = draft.t || "";
      $("body").value = draft.b || "";
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
          loadedSlug = meta.title ? slugify(meta.title) : null;
          aliases = (meta.aliases || "").replace(/[\[\]]/g, "")
                     .split(",").map(function (x) { return x.trim(); })
                     .filter(Boolean);
          $("body").value = m ? txt.slice(m[0].length).trim() : txt;
        }
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

  /* The date is fixed when the page loads, so a tab left open across midnight
     still believes it is yesterday. Publishing then would overwrite yesterday's
     entry with today's writing. Instead the entry moves to the new day: the
     previous one is never touched. */
  async function rollover() {
    var now = SW.isoDate(SW.todayIST());
    if (now === DATE) return false;
    var wasDraft = DRAFT;
    DATE = now;
    PATH = "entries/" + DATE + ".md";
    DRAFT = "shaan.wiki:draft:" + DATE;
    try {
      var carried = localStorage.getItem(wasDraft);
      if (carried) { localStorage.setItem(DRAFT, carried); }
      localStorage.removeItem(wasDraft);
    } catch (e) {}
    var cur = await SW.gh(PATH);      // today may already have something
    sha = cur ? cur.sha : null;
    return true;
  }

  $("pub").addEventListener("click", async function () {
    if (!$("body").value.trim()) return;
    $("pub").disabled = true;
    say("publishing", true);
    try {
      var moved = await rollover();
      sha = await SW.put(PATH, compose(),
        (sha ? "Edit" : "Write") + " " + DATE, sha);
      try { localStorage.removeItem(DRAFT); } catch (e) {}
      say(moved ? "published, " + DATE : "published", moved);
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
