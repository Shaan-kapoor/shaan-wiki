/* One-time setup, done on the site itself.
 *
 * Paste the token, choose the password, press Save. The page encrypts the
 * token with the password and then uses that same token to commit the result
 * as data/vault.json. Nothing is downloaded, nothing is saved by hand, nothing
 * is committed from a laptop.
 *
 * Needs a secure context for crypto.subtle, so: https://shaan.wiki/setup, or
 * http://127.0.0.1 while the certificate is still being issued. Both count.
 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  function say(m) { $("msg").textContent = m; }

  if (!window.crypto || !crypto.subtle) {
    say("needs https, or localhost");
    $("go").disabled = true;
    return;
  }

  $("go").addEventListener("click", async function () {
    var tok = $("tok").value.trim();
    var pw = $("pw").value;
    if (!tok || !pw) { say("token and password"); return; }

    $("go").disabled = true;
    say("encrypting");
    try {
      var enc = new TextEncoder();
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var iv = crypto.getRandomValues(new Uint8Array(12));
      var iter = 600000;
      var base = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2",
        false, ["deriveKey"]);
      var key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: iter, hash: "SHA-256" },
        base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
      var ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key,
        enc.encode(tok));

      var b64 = function (buf) {
        var s = "", a = new Uint8Array(buf);
        for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
        return btoa(s);
      };
      var vault = JSON.stringify(
        { v: 1, iter: iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) }, null, 2) + "\n";

      say("saving");
      SW.setToken(tok);
      var cur = await SW.gh("data/vault.json");
      await SW.put("data/vault.json", vault, "Set up the vault",
        cur ? cur.sha : null);

      $("tok").value = "";
      say("done. live in about a minute");
      setTimeout(function () { location.href = "/write/"; }, 2200);
    } catch (e) {
      say("failed: " + (e && e.message ? e.message : "check the token"));
      $("go").disabled = false;
    }
  });
})();
