/* ZERO TIME — composant d'interface « Digicode » (maquette interactive).
 *
 * Le composant ne contient AUCUNE règle de jeu. Il affiche, capte les touches et émet des événements ;
 * l'hôte (le jeu, ou le simulateur de digicode2.html) décide du verdict.
 *
 *   var ui = ZTDigicode.mount(conteneur, { base: "", len: 4, demo: false });
 *   ui.on("submit", function (code) { ...; ui.result({ verdicts: "xogx", solved: false }); });
 *   ui.setLamps({ red: 2, blue: 1 });      // voyants rouges / bleus allumés
 *   ui.setStatus("todo" | "done");         // voyant d'angle : rouge clignotant / vert
 *   ui.getState() / ui.setState(s);        // pour quitter et revenir au module sans perdre l'état
 *   ui.lock(true);                         // verrouille les touches (module résolu, pause...)
 *
 * Événements : "digit"(d), "back"(), "submit"(code), "press"(touche).
 * Verdicts : "g" bon chiffre bien placé, "o" bon chiffre mal placé, "x" absent du code.
 */
(function () {
  "use strict";
  var W = 1080, H = 1916, NS = "http://www.w3.org/2000/svg";

  // rectangles tactiles (coordonnées de l'image recadrée)
  var KEYS = {
    "1": [208, 723, 410, 876], "2": [440, 723, 645, 876], "3": [675, 723, 877, 876],
    "4": [208, 898, 410, 1050], "5": [440, 898, 645, 1050], "6": [675, 898, 877, 1050],
    "7": [208, 1071, 410, 1223], "8": [440, 1071, 645, 1223], "9": [675, 1071, 877, 1223],
    "back": [205, 1246, 412, 1398], "0": [440, 1246, 648, 1398], "ok": [678, 1246, 888, 1398]
  };
  var LAMP_R = [260, 337, 413, 490], LAMP_B = [600, 677, 753, 830], LAMP_Y = 646;
  var CELLS = [279, 407, 541, 684, 820];            // centres des 5 cases de l'afficheur
  var HIST = [288, 456, 621, 788];                   // centres des 4 cases de l'historique
  var DW = 74, DH = 128, T = 17, SKEW = 0.14, DTOP = 380;

  var SEG = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
  function hx(cx, cy, L) { var a = L / 2, b = T / 2; return [[cx - a, cy], [cx - a + b, cy - b], [cx + a - b, cy - b], [cx + a, cy], [cx + a - b, cy + b], [cx - a + b, cy + b]]; }
  function vx(cx, cy, L) { var a = L / 2, b = T / 2; return [[cx, cy - a], [cx + b, cy - a + b], [cx + b, cy + a - b], [cx, cy + a], [cx - b, cy + a - b], [cx - b, cy - a + b]]; }
  var m = T / 2, mid = DH / 2, lx = DW - T / 2;
  var GEO = {
    a: hx(DW / 2, m, DW - T - 2), g: hx(DW / 2, mid, DW - T - 2), d: hx(DW / 2, DH - m, DW - T - 2),
    f: vx(m, (m + mid) / 2, mid - m - 3), b: vx(lx, (m + mid) / 2, mid - m - 3),
    e: vx(m, (mid + DH - m) / 2, mid - m - 3), c: vx(lx, (mid + DH - m) / 2, mid - m - 3)
  };
  function pts(p) { return p.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }
  function pc(r) { return "left:" + (r[0] / W * 100).toFixed(3) + "%;top:" + (r[1] / H * 100).toFixed(3) + "%;width:" + ((r[2] - r[0]) / W * 100).toFixed(3) + "%;height:" + ((r[3] - r[1]) / H * 100).toFixed(3) + "%"; }
  function bgpos(r) { var w = r[2] - r[0], h = r[3] - r[1]; return "background-size:" + (W / w * 100).toFixed(3) + "% " + (H / h * 100).toFixed(3) + "%;background-position:" + (r[0] / (W - w) * 100).toFixed(3) + "% " + (r[1] / (H - h) * 100).toFixed(3) + "%"; }
  function buzz(n) { try { navigator.vibrate && navigator.vibrate(n); } catch (e) { } }

  var CSS = [
    ".ztd{position:relative;width:100%;aspect-ratio:" + W + "/" + H + ";background:#0b0c0e;-webkit-tap-highlight-color:transparent;user-select:none}",
    ".ztd>img{display:block;width:100%;height:100%;-webkit-user-drag:none}",
    ".ztd svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
    ".ztd .k{position:absolute;border:0;padding:0;background:transparent;border-radius:7%;cursor:pointer;outline:0}",
    ".ztd .k .cap{position:absolute;inset:0;background-repeat:no-repeat;border-radius:7%;transition:transform .09s ease-out,filter .09s;pointer-events:none}",
    ".ztd .k.on{background:#0a0807}",
    ".ztd .k.on .cap{transform:translateY(4%) scale(.92);filter:brightness(.72) contrast(1.05)}",
    ".ztd.locked .k{cursor:default}",
    ".ztd .seg{fill:#ff9f1a;filter:drop-shadow(0 0 5px rgba(255,150,20,.8))}",
    ".ztd .ok .seg,.ztd .ok .bar{fill:#00ffaa;filter:drop-shadow(0 0 6px rgba(0,255,170,.85))}",
    ".ztd .bad .seg,.ztd .bad .bar{fill:#ff3333;filter:drop-shadow(0 0 6px rgba(255,51,51,.9))}",
    ".ztd .bar{fill:#ff9f1a;filter:drop-shadow(0 0 5px rgba(255,150,20,.8))}",
    ".ztd .dash{fill:#7a5214;opacity:.85}",
    "@keyframes ztdc{0%,49%{opacity:1}50%,100%{opacity:0}}",
    ".ztd .cur{animation:ztdc 1s steps(1,end) infinite}",
    "@keyframes ztdb{0%,49%{opacity:0}50%,100%{opacity:1}}",
    ".ztd .ledoff.blink{animation:ztdb 1.2s steps(1,end) infinite}",
    "@keyframes ztdp{0%,100%{opacity:.8}50%{opacity:1}}",
    ".ztd .ledok{animation:ztdp 2.4s ease-in-out infinite}",
    ".ztd .lbl{font-family:ZTDBarlow,'Barlow Condensed',Oswald,sans-serif;font-weight:600;letter-spacing:.04em}",
    ".ztd .hd{font-family:ZTDBarlow,'Barlow Condensed',Oswald,sans-serif;font-weight:600;fill:#e9ddc6;text-anchor:middle}",
    "@keyframes ztdsh{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}",
    ".ztd.shake{animation:ztdsh .35s}"
  ].join("\n");

  function mount(root, opts) {
    opts = opts || {};
    var base = opts.base || "", LEN = opts.len || 4, demo = !!opts.demo;
    if (!document.getElementById("ztd-css")) {
      var st = document.createElement("style"); st.id = "ztd-css";
      st.textContent = "@font-face{font-family:ZTDBarlow;src:url(" + base + "barlow-600.woff2) format('woff2');font-weight:600;font-display:block}\n" + CSS;
      document.head.appendChild(st);
    }
    root.innerHTML = "";
    var box = document.createElement("div"); box.className = "ztd"; root.appendChild(box);
    var img = document.createElement("img"); img.src = base + "digicode2.jpg"; img.alt = "Module Digicode"; img.draggable = false; box.appendChild(img);
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" }, box);

    // --- couches (toutes masquées tant que le module est « brut » en mode démo)
    var L = el("g", { id: "ztd-layers" }, svg);
    var cleanD = el("image", { href: base + "digicode2-afficheur.jpg", x: 150, y: 348, width: 790, height: 200 }, L);
    var gDisp = el("g", {}, L);
    var cleanH = el("image", { href: base + "digicode2-histo.jpg", x: 195, y: 1540, width: 685, height: 166 }, L);
    var gHist = el("g", {}, L);
    var lampOff = [];
    LAMP_R.forEach(function (x) { lampOff.push(el("image", { href: base + "digicode2-lampe-r-off.png", x: x - 38, y: LAMP_Y - 38, width: 76, height: 76, opacity: 0 }, L)); });
    var lampOffB = [];
    LAMP_B.forEach(function (x) { lampOffB.push(el("image", { href: base + "digicode2-lampe-b-off.png", x: x - 38, y: LAMP_Y - 38, width: 76, height: 76, opacity: 0 }, L)); });
    var ledOff = el("image", { "class": "ledoff blink", href: base + "digicode2-led-off.png", x: 750, y: 195, width: 80, height: 80, opacity: 0 }, L);
    var ledOk = el("image", { "class": "ledok", href: base + "digicode2-led-vert.png", x: 750, y: 195, width: 80, height: 80, opacity: 0 }, L);
    var lblClean = el("image", { href: base + "digicode2-libelle.jpg", x: 826, y: 212, width: 140, height: 50, opacity: 0 }, L);
    var lbl = el("text", { "class": "lbl", x: 836, y: 251, "font-size": 44, fill: "#00ffaa", opacity: 0 }, L); lbl.textContent = "RÉSOLU";
    lbl.style.filter = "drop-shadow(0 0 6px rgba(0,255,170,.7))";

    // --- touches
    var keys = {};
    Object.keys(KEYS).forEach(function (k) {
      var b = document.createElement("button"); b.type = "button"; b.className = "k"; b.dataset.k = k;
      b.setAttribute("aria-label", k === "ok" ? "Valider" : k === "back" ? "Effacer" : "Touche " + k);
      b.style.cssText = pc(KEYS[k]);
      var cap = document.createElement("span"); cap.className = "cap";
      cap.style.cssText = "background-image:url(" + base + "digicode2.jpg);" + bgpos(KEYS[k]); b.appendChild(cap);
      box.appendChild(b); keys[k] = b;
    });

    // --- état
    var S = { buf: "", hist: null, red: 4, blue: 4, status: "todo", locked: false, active: !demo, flash: "" };
    var handlers = {};
    function emit(n, a) { (handlers[n] || []).forEach(function (f) { f(a); }); }

    // --- dessin
    function drawDigit(g, left, ch, cls) {
      var gg = el("g", { "class": cls || "", transform: "translate(" + left + " " + DTOP + ") matrix(1 0 -" + SKEW + " 1 " + (SKEW * DH).toFixed(1) + " 0)" }, g);
      var on = SEG[ch] || "";
      on.split("").forEach(function (s) { el("polygon", { "class": "seg", points: pts(GEO[s]) }, gg); });
    }
    function renderDisplay() {
      gDisp.innerHTML = "";
      var cls = S.flash || "";
      var wrap = el("g", { "class": cls }, gDisp);
      for (var i = 0; i < 5; i++) {
        var cx = CELLS[i];
        if (i >= LEN) continue;
        if (i < S.buf.length) drawDigit(wrap, cx - DW / 2 - SKEW * DH / 2, S.buf[i]);
        else if (i === S.buf.length && !S.locked) el("rect", { "class": "bar cur", x: cx - 38, y: 493, width: 77, height: 14, rx: 4 }, wrap);
        else el("rect", { "class": "dash", x: cx - 32, y: 441, width: 64, height: 14, rx: 4 }, wrap);
      }
    }
    function icon(g, kind, cx, cy) {
      if (kind === "x") { el("path", { d: "M" + (cx - 17) + " " + (cy - 17) + "L" + (cx + 17) + " " + (cy + 17) + "M" + (cx + 17) + " " + (cy - 17) + "L" + (cx - 17) + " " + (cy + 17), stroke: "#b8b2aa", "stroke-width": 7, "stroke-linecap": "round", fill: "none" }, g); }
      else if (kind === "o") { el("path", { d: "M" + cx + " " + (cy - 21) + "L" + (cx + 21) + " " + cy + "L" + cx + " " + (cy + 21) + "L" + (cx - 21) + " " + cy + "Z", stroke: "#ff6a3a", "stroke-width": 6, "stroke-linejoin": "round", fill: "none" }, g); }
      else { el("path", { d: "M" + (cx - 20) + " " + (cy + 1) + "L" + (cx - 6) + " " + (cy + 15) + "L" + (cx + 20) + " " + (cy - 15), stroke: "#4cd464", "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" }, g); }
    }
    function renderHistory() {
      gHist.innerHTML = "";
      if (!S.hist) return;
      for (var i = 0; i < 4 && i < S.hist.digits.length; i++) {
        var t = el("text", { "class": "hd", x: HIST[i], y: 1618, "font-size": 74 }, gHist); t.textContent = S.hist.digits[i];
        icon(gHist, S.hist.verdicts[i], HIST[i], 1668 - 212 + 212 - 10 - 0);
      }
    }
    function renderLamps() {
      lampOff.forEach(function (e, i) { e.setAttribute("opacity", i < S.red ? 0 : 1); });
      lampOffB.forEach(function (e, i) { e.setAttribute("opacity", i < S.blue ? 0 : 1); });
    }
    function renderStatus() {
      var done = S.status === "done";
      ledOff.setAttribute("opacity", done ? 0 : 1); ledOff.setAttribute("class", "ledoff" + (done ? "" : " blink"));
      ledOk.setAttribute("opacity", done ? 1 : 0);
      lblClean.setAttribute("opacity", done ? 1 : 0); lbl.setAttribute("opacity", done ? 1 : 0);
    }
    function renderAll() {
      var vis = S.active ? 1 : 0;
      cleanD.setAttribute("opacity", vis); cleanH.setAttribute("opacity", vis);
      gDisp.style.display = vis ? "" : "none"; gHist.style.display = vis ? "" : "none";
      if (!vis) { lampOff.concat(lampOffB).forEach(function (e) { e.setAttribute("opacity", 0); }); ledOff.setAttribute("opacity", 0); ledOk.setAttribute("opacity", 0); lblClean.setAttribute("opacity", 0); lbl.setAttribute("opacity", 0); return; }
      renderDisplay(); renderHistory(); renderLamps(); renderStatus();
      box.classList.toggle("locked", S.locked);
    }
    function activate() { if (!S.active) { S.active = true; renderAll(); } }

    // --- saisie
    function press(k) {
      if (S.locked) return;
      emit("press", k);
      activate();
      if (k === "back") { S.buf = S.buf.slice(0, -1); renderDisplay(); emit("back"); return; }
      if (k === "ok") {
        if (S.buf.length < LEN) { buzz([30, 40, 30]); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake"); emit("incomplete", S.buf); return; }
        emit("submit", S.buf); return;
      }
      if (S.buf.length < LEN) { S.buf += k; buzz(10); renderDisplay(); emit("digit", k); }
    }
    Object.keys(keys).forEach(function (k) {
      var b = keys[k], t0 = 0;
      function on() { if (S.locked) return; t0 = Date.now(); b.classList.add("on"); }
      function off() { var d = Math.max(0, 110 - (Date.now() - t0)); setTimeout(function () { b.classList.remove("on"); }, d); }
      b.addEventListener("touchstart", on, { passive: true }); b.addEventListener("touchend", off); b.addEventListener("touchcancel", off);
      b.addEventListener("mousedown", on); b.addEventListener("mouseup", off); b.addEventListener("mouseleave", off);
      b.addEventListener("click", function () { press(k); });
    });

    var api = {
      on: function (n, f) { (handlers[n] = handlers[n] || []).push(f); return api; },
      press: press,
      activate: activate,
      setLamps: function (o) { if (o.red != null) S.red = o.red; if (o.blue != null) S.blue = o.blue; if (S.active) renderLamps(); },
      setStatus: function (s) { S.status = s; if (S.active) renderStatus(); },
      lock: function (v) { S.locked = !!v; if (S.active) renderAll(); },
      /* résultat d'une tentative : { verdicts:"xogx", solved:bool } */
      result: function (r) {
        var digits = S.buf;
        S.hist = { digits: digits, verdicts: r.verdicts };
        renderHistory();
        if (r.solved) {
          S.flash = "ok"; S.status = "done"; S.locked = true; renderDisplay(); renderStatus(); box.classList.add("locked"); buzz([40, 30, 40]);
        } else {
          S.flash = "bad"; renderDisplay(); buzz([80, 40, 80]);
          setTimeout(function () { S.flash = ""; S.buf = ""; renderDisplay(); }, 650);
        }
      },
      getState: function () { return JSON.parse(JSON.stringify({ buf: S.buf, hist: S.hist, red: S.red, blue: S.blue, status: S.status, locked: S.locked, active: S.active })); },
      setState: function (s) { for (var k in s) S[k] = s[k]; S.flash = ""; renderAll(); },
      reset: function () { S.buf = ""; S.hist = null; S.status = "todo"; S.locked = false; S.flash = ""; S.active = true; renderAll(); },
      element: box, length: LEN
    };
    renderAll();
    document.addEventListener("keydown", function (e) {
      if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Enter") press("ok"); else if (e.key === "Backspace") press("back");
    });
    return api;
  }
  window.ZTDigicode = { mount: mount };
})();
