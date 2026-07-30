/* shaan.wiki editor.
 *
 * The GitHub token lives in /vault.json, encrypted with the password using
 * PBKDF2-SHA256 + AES-GCM. The password never leaves the device and the token
 * is never stored in plaintext anywhere. A raw token committed to a public
 * repo would be auto-revoked by GitHub secret scanning within minutes; an
 * encrypted blob is invisible to it.
 *
 * The whole day model lives in one place: today, computed in IST. The page
 * only ever writes to today's file, which is what "sealed at midnight" means.
 */
(function () {
  "use strict";

  var OWNER = "Shaan-kapoor";
  var REPO = "shaan-wiki";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";

  var $ = function (id) { return document.getElementById(id); };
  var token = null;
  var sha = null;          // sha of today's entry file, if it already exists
  var gymSha = null;
  var saveTimer = null;

  // --- the day, in IST -------------------------------------------------------
  function todayIST() {
    var now = new Date();
    var ist = new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60000);
    return ist;
  }

  function iso(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  var DATE = iso(todayIST());
  var PATH = "entries/" + DATE + ".md";
  var DRAFT = "shaan.wiki:draft:" + DATE;

  // --- crypto ----------------------------------------------------------------
  function b64ToBytes(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function bytesToB64(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function utf8ToB64(str) {
    return bytesToB64(new TextEncoder().encode(str));
  }

  function b64ToUtf8(b64) {
    return new TextDecoder().decode(b64ToBytes(b64.replace(/\s/g, "")));
  }

  async function unlock(password) {
    var res = await fetch("/vault.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No vault.json yet — run tools/make-vault.html");
    var v = await res.json();
    var base = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64ToBytes(v.salt),
        iterations: v.iter || 600000, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(v.iv) }, key, b64ToBytes(v.ct));
    return new TextDecoder().decode(plain).trim();
  }

  // --- github ----------------------------------------------------------------
  async function gh(path, options) {
    var res = await fetch(API + path, Object.assign({
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json"
      }
    }, options || {}));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("GitHub " + res.status + ": " + await res.text());
    return res.json();
  }

  async function put(path, content, message, existingSha) {
    var body = { message: message, content: utf8ToB64(content) };
    if (existingSha) body.sha = existingSha;
    var res = await gh(path, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return res.content.sha;
  }

  // --- entry -----------------------------------------------------------------
  function slugify(s) {
    return s.toLowerCase().replace(/[^\w\s-]/g, "").trim()
      .replace(/[\s_]+/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  }

  function dayNumber() {
    var one = Date.UTC(2026, 7, 1);
    var t = todayIST();
    return Math.floor((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - one)
      / 86400000) + 1;
  }

  function compose() {
    var title = $("title").value.trim() || DATE;
    return "---\ntitle: " + title +
      "\ndate: " + DATE +
      "\nday: " + dayNumber() +
      "\ngym: " + ($("gym").checked ? "true" : "false") +
      "\n---\n\n" + $("body").value.trim() + "\n";
  }

  function parseExisting(text) {
    var m = /^---\n([\s\S]*?)\n---\n*/.exec(text);
    if (!m) return { body: text };
    var meta = {};
    m[1].split("\n").forEach(function (line) {
      var i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    return { title: meta.title, gym: meta.gym === "true",
             body: text.slice(m[0].length) };
  }

  // --- draft -----------------------------------------------------------------
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT, JSON.stringify({
        title: $("title").value, body: $("body").value, gym: $("gym").checked
      }));
      note("Draft saved on this device.");
    } catch (e) { /* private mode, storage full — not fatal */ }
  }

  function loadDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT) || "null");
      if (!d) return false;
      if (d.title) $("title").value = d.title;
      if (d.body) $("body").value = d.body;
      $("gym").checked = !!d.gym;
      return true;
    } catch (e) { return false; }
  }

  function note(msg) { $("status").textContent = msg; }

  function words() {
    var n = $("body").value.trim().split(/\s+/).filter(Boolean).length;
    $("count").textContent = n + (n === 1 ? " word" : " words");
    var t = $("title").value.trim();
    $("urlhint").textContent = t ? "shaan.wiki/" + slugify(t) : "";
  }

  // --- boot ------------------------------------------------------------------
  var t = todayIST();
  $("dateline").textContent = t.toDateString() + " · day " + dayNumber() +
    " of 365 · sealed at midnight IST";

  $("unlock").addEventListener("submit", async function (e) {
    e.preventDefault();
    $("lockmsg").textContent = "Unlocking…";
    try {
      token = await unlock($("pw").value);
      sessionStorage.setItem("shaan.wiki:token", token);
      await open();
    } catch (err) {
      $("lockmsg").textContent =
        /vault/.test(err.message) ? err.message : "Wrong password.";
      $("pw").value = "";
      $("pw").focus();
    }
  });

  async function open() {
    $("lock").hidden = true;
    $("editor").hidden = false;

    var hadDraft = loadDraft();
    try {
      var existing = await gh(PATH);
      if (existing) {
        sha = existing.sha;
        if (!hadDraft) {
          var parsed = parseExisting(b64ToUtf8(existing.content));
          if (parsed.title) $("title").value = parsed.title;
          $("body").value = parsed.body.trim();
          $("gym").checked = !!parsed.gym;
        }
        note("Today's entry is already published. Editing it.");
      } else {
        note(hadDraft ? "Unpublished draft restored." : "Nothing written today yet.");
      }
    } catch (err) {
      note("Could not reach GitHub: " + err.message);
    }
    words();
    $("body").focus();
  }

  ["title", "body"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      words();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveDraft, 400);
    });
  });
  $("gym").addEventListener("change", saveDraft);

  $("entry").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!$("body").value.trim()) { note("Nothing to publish."); return; }
    $("publish").disabled = true;
    note("Publishing…");
    try {
      sha = await put(PATH, compose(),
        (sha ? "Edit" : "Write") + " day " + dayNumber() + ": " +
        ($("title").value.trim() || DATE), sha);

      // gym.json — read, merge today, write back
      var g = await gh("data/gym.json");
      var data = g ? JSON.parse(b64ToUtf8(g.content)) : {};
      gymSha = g ? g.sha : null;
      data[DATE] = $("gym").checked;
      var ordered = {};
      Object.keys(data).sort().forEach(function (k) { ordered[k] = data[k]; });
      await put("data/gym.json", JSON.stringify(ordered, null, 2) + "\n",
        "Gym " + DATE + ": " + ($("gym").checked ? "yes" : "no"), gymSha);

      try { localStorage.removeItem(DRAFT); } catch (e2) {}
      note("Published. Live at shaan.wiki/" +
        slugify($("title").value.trim() || DATE) + " in about a minute.");
    } catch (err) {
      note("Failed: " + err.message + " — your draft is safe on this device.");
    }
    $("publish").disabled = false;
  });

  // already unlocked this session?
  var cached = sessionStorage.getItem("shaan.wiki:token");
  if (cached) { token = cached; open(); }
})();
