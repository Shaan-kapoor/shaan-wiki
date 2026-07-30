(function () {
  "use strict";
  var b = document.getElementById("theme");
  if (!b) return;
  b.addEventListener("click", function () {
    var d = document.documentElement;
    var next = d.dataset.theme === "light" ? "dark" : "light";
    d.dataset.theme = next;
    try { localStorage.setItem("shaan.wiki:theme", next); } catch (e) {}
  });
})();
