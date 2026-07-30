/* The writing surface.
 *
 * The token lives in /vault.json encrypted with the password (PBKDF2-SHA256,
 * AES-GCM). It is never stored in plaintext and never leaves the device.
 *
 * The page only ever writes today's file, computed in IST. That single fact
 * is what "sealed at midnight" means — there is no job to run.
 */
(function () {
  "use strict";

  var OWNER = "Shaan-kapoor";
  var REPO = "shaan-wiki";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";

  var $ = function (id) { return document.getElementById(id); };
  var token = null, sha = null, saveTimer = null, stateTimer = null;

  function todayIST() {
    var n = new Date();
    return new Date(n.getTime() + (n.getTimezoneOffset() + 330) * 60000);
  }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
  }

  var DATE = iso(todayIST());
  var PATH = "entries/" + DATE + ".md";
  var DRAFT = "shaan.wiki:draft:" + DATE;

  function dayNumber() {
    var t = todayIST();
    return Math.floor((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) -
      Date.UTC(2026, 7, 1)) / 86400000) + 1;
  }

  // --- crypto ---------------------------------------------------------------
  function bytes(b64) {
    var s = atob(b64), a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function b64(arr) {
    var s = "", a = new Uint8Array(arr);
    for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  }
  var utf8 = function (s) { return b64(new TextEncoder().encode(s)); };
  var unb64 = function (s) { return new TextDecoder().decode(bytes(s.replace(/\s/g, ""))); };

  async function unlock(pw) {
    var r = await fetch("/vault.json", { cache: "no-store" });
    if (!r.ok) throw new Error("no vault");
    var v = await r.json();
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw),
      "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: bytes(v.salt), iterations: v.iter || 600000,
        hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(v.iv) },
      key, bytes(v.ct));
    return new TextDecoder().decode(out).trim();
  }

  // --- github ---------------------------------------------------------------
  async function gh(path, opts) {
    var r = await fetch(API + path, Object.assign({
      headers: { Authorization: "Bearer " + token,
                 Accept: "application/vnd.github+json" }
    }, opts || {}));
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }
  async function put(path, content, msg, prev) {
    var body = { message: msg, content: utf8(content) };
    if (prev) body.sha = prev;
    var r = await gh(path, {
      method: "PUT",
      headers: { Authorization: "Bearer " + token,
                 Accept: "application/vnd.github+json",
                 "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return r.content.sha;
  }

  // --- state line: cross-fades, never a spinner -----------------------------
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
    }, 200);
  }

  function ready() {
    var has = $("body").value.trim().length > 0;
    $("pub").disabled = !has;
    $("bar").classList.toggle("live", has);
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
      "\ndate: " + DATE + "\nday: " + dayNumber() +
      "\ngym: " + $("gym").getAttribute("aria-pressed") +
      "\n---\n\n" + $("body").value.trim() + "\n";
  }

  // --- boot -----------------------------------------------------------------
  $("pw").addEventListener("keydown", async function (e) {
    if (e.key !== "Enter") return;
    $("gatemsg").textContent = "";
    try {
      token = await unlock($("pw").value);
      sessionStorage.setItem("shaan.wiki:token", token);
      await open();
    } catch (err) {
      $("gatemsg").textContent = "✕";
      $("pw").value = "";
    }
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
      var cur = await gh(PATH);
      if (cur) {
        sha = cur.sha;
        if (!draft) {
          var txt = unb64(cur.content);
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
    } catch (e) { say("offline", true); }

    grow();
    ready();
    $("body").focus();
  }

  function grow() {
    var t = $("title");
    t.style.height = "auto";
    t.style.height = t.scrollHeight + "px";
  }

  ["title", "body"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      if (id === "title") grow();
      ready();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 500);
    });
  });

  // Enter in the title moves to the body rather than inserting a newline
  $("title").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); $("body").focus(); }
  });

  $("gym").addEventListener("click", function () {
    var on = this.getAttribute("aria-pressed") === "true";
    this.setAttribute("aria-pressed", on ? "false" : "true");
    saveDraft();
  });

  $("pub").addEventListener("click", async function () {
    if (!$("body").value.trim()) return;
    $("pub").disabled = true;
    say("publishing", true);
    try {
      sha = await put(PATH, compose(),
        (sha ? "Edit" : "Write") + " " + DATE, sha);
      var g = await gh("data/gym.json");
      var data = g ? JSON.parse(unb64(g.content)) : {};
      data[DATE] = $("gym").getAttribute("aria-pressed") === "true";
      var sorted = {};
      Object.keys(data).sort().forEach(function (k) { sorted[k] = data[k]; });
      await put("data/gym.json", JSON.stringify(sorted, null, 2) + "\n",
        "Gym " + DATE, g ? g.sha : null);
      try { localStorage.removeItem(DRAFT); } catch (e) {}
      say("published");
    } catch (err) {
      say("failed", true);
    }
    $("pub").disabled = false;
  });

  // ⌘/Ctrl+Enter publishes
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !$("pub").disabled) {
      $("pub").click();
    }
  });

  var cached = sessionStorage.getItem("shaan.wiki:token");
  if (cached) { token = cached; open(); } else { $("pw").focus(); }
})();
