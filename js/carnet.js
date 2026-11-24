/* Carnet du technicien : fiches anonymes à onglets, texte noir, tampons rouges. */
(function () {
  "use strict";
  var current = 0;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // o: {root, manual:{pages,solo_serial,solo_piles}, paused, onAbort}
  function mount(o) {
    var pages = (o.manual.pages || []).slice().sort(function (a, b) { return a.n - b.n; });
    var root = o.root;
    if (current >= pages.length) current = 0;
    root.innerHTML = '<div id="ztcar"><div class="shell">' +
      '<div class="topline"><span class="brand">ZERO TIME / DOCUMENTS</span><span class="status">COPIE TERRAIN</span></div>' +
      '<main class="book"><nav class="tabs" id="ztc-tabs"></nav>' +
      '<div class="paper-wrap"><article class="paper" id="ztc-paper"></article></div>' +
      '<div class="footer"><span>ARCHIVES TECHNIQUES · CONFIDENTIEL</span><div class="controls">' +
      '<button class="navbtn" id="ztc-prev" aria-label="Précédent">←</button><span class="counter" id="ztc-count"></span>' +
      '<button class="navbtn" id="ztc-next" aria-label="Suivant">→</button></div></div></main></div></div>';
    var car = root.firstChild, tabs = car.querySelector("#ztc-tabs"), paper = car.querySelector("#ztc-paper");
    if (o.paused) {
      var pb = document.createElement("div"); pb.className = "pausebox";
      pb.innerHTML = "<b>⏸ En attente de " + esc(o.paused.pseudo) + "</b>La partie est en pause. Le temps ne s'écoule plus." +
        (o.paused.can_abandon ? '<br><button id="ztc-abort">Abandonner la partie</button>' : "");
      car.appendChild(pb);
      var ab = pb.querySelector("#ztc-abort"); if (ab) ab.onclick = function () { if (o.onAbort) o.onAbort(); };
    }
    function draw() {
      tabs.innerHTML = pages.map(function (p, i) {
        return '<button class="tab" data-i="' + i + '" aria-label="Post-it ' + (i + 1) + '"' + (i === current ? ' aria-current="page"' : "") + "></button>";
      }).join("");
      var p = pages[current];
      if (!p) { paper.innerHTML = '<p class="note">Aucune fiche.</p>'; return; }
      paper.innerHTML =
        '<header class="page-head"><span class="kicker">ZERO TIME · CARNET TECHNICIEN</span><span class="page-number">FICHE ' + pad(p.n) + "</span></header>" +
        (p.stamp ? '<div class="stamp">' + esc(p.stamp) + "</div>" : "") +
        '<section class="signature"><div class="signature-label">Signature observée</div><div class="signature-value">' + p.sig + "</div></section>" +
        '<div class="section-title">Consignes à appliquer</div>' +
        '<ol class="rules">' + (p.rules || []).map(function (r) { return "<li>" + r + "</li>"; }).join("") + "</ol>" +
        '<div class="final-rule"><b>RÈGLE FINALE</b>' + p.end + "</div>" +
        '<p class="note">' + (p.note || "") + "</p>";
      car.querySelector("#ztc-count").textContent = pad(current + 1) + " / " + pad(pages.length);
      car.querySelector("#ztc-prev").disabled = current === 0;
      car.querySelector("#ztc-next").disabled = current >= pages.length - 1;
      paper.scrollTop = 0;
    }
    function go(to) {
      if (to < 0 || to >= pages.length || to === current) return;
      current = to; draw();
    }
    tabs.onclick = function (e) { var b = e.target.closest("[data-i]"); if (b) go(Number(b.getAttribute("data-i"))); };
    car.querySelector("#ztc-prev").onclick = function () { go(current - 1); };
    car.querySelector("#ztc-next").onclick = function () { go(current + 1); };
    var tx = null, ty = 0;
    paper.addEventListener("touchstart", function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
    paper.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
      tx = null;
    }, { passive: true });
    draw();
  }
  window.ZTCarnet = { mount: mount };
})();
