/* Shared by the editor and the gym toggle.
 *
 * The token lives in /vault.json encrypted with the password (PBKDF2-SHA256,
 * AES-GCM). It is never stored in plaintext and never leaves the device.
 */
window.SW = (function () {
  "use strict";

  var OWNER = "Shaan-kapoor";
  var REPO = "shaan-wiki";
  var API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/";
  var token = null;

  function bytes(s) {
    var b = atob(s), a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  function b64(arr) {
    var s = "", a = new Uint8Array(arr);
    for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  }

  function todayIST() {
    var n = new Date();
    return new Date(n.getTime() + (n.getTimezoneOffset() + 330) * 60000);
  }
  function isoDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
  }

  var vault = null;
  async function unlock(pw) {
    if (!vault) {
      var r = await fetch("/vault.json", { cache: "no-store" });
      if (!r.ok) throw new Error("novault");
      vault = await r.json();
    }
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw),
      "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: bytes(vault.salt), iterations: vault.iter || 600000,
        hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(vault.iv) },
      key, bytes(vault.ct));
    token = new TextDecoder().decode(out).trim();
    try { sessionStorage.setItem("shaan.wiki:token", token); } catch (e) {}
    return token;
  }

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
    var body = { message: msg, content: b64(new TextEncoder().encode(content)) };
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

  function decode(b) { return new TextDecoder().decode(bytes(b.replace(/\s/g, ""))); }

  /* Marking the gym writes straight away rather than waiting for an entry to be
     published. Going to the gym and not writing that day has to still count. */
  async function setGym(on) {
    var cur = await gh("data/gym.json");
    var data = cur ? JSON.parse(decode(cur.content)) : {};
    data[isoDate(todayIST())] = !!on;
    var sorted = {};
    Object.keys(data).sort().forEach(function (k) { sorted[k] = data[k]; });
    await put("data/gym.json", JSON.stringify(sorted, null, 2) + "\n",
      "Gym " + isoDate(todayIST()) + " " + (on ? "yes" : "no"),
      cur ? cur.sha : null);
  }

  async function getGym() {
    var cur = await gh("data/gym.json");
    if (!cur) return false;
    return !!JSON.parse(decode(cur.content))[isoDate(todayIST())];
  }

  /* Auto-unlock: the password is accepted the moment it is fully typed, with no
     Enter. Deriving the key costs real time by design, so attempts are debounced
     and stale ones are discarded rather than fired on every keystroke. */
  function autoUnlock(input, onOpen, onState) {
    var timer = null, seq = 0, busy = false;
    function attempt() {
      var value = input.value;
      if (value.length < 4 || busy) return;
      var mine = ++seq;
      busy = true;
      if (onState) onState("checking");
      unlock(value).then(function () {
        if (mine === seq) onOpen();
      }).catch(function (e) {
        if (mine === seq && onState) {
          onState(e && e.message === "novault" ? "novault" : "");
        }
      }).finally(function () { busy = false; });
    }
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(attempt, 260);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { clearTimeout(timer); attempt(); }
    });
  }

  return {
    unlock: unlock, autoUnlock: autoUnlock, gh: gh, put: put, decode: decode,
    setGym: setGym, getGym: getGym, todayIST: todayIST, isoDate: isoDate,
    cached: function () {
      try { token = sessionStorage.getItem("shaan.wiki:token"); } catch (e) {}
      return token;
    },
    dayNumber: function () {
      var t = todayIST();
      return Math.floor((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) -
        Date.UTC(2026, 7, 1)) / 86400000) + 1;
    }
  };
})();
