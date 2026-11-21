/* ZERO TIME — module ROTARY (écran opérateur)
   Le visuel de référence est utilisé tel quel en fond ; on superpose uniquement ce qui bouge :
   4 molettes, voyants, bouton de validation, chrono. API : ZTRotary.mount(el, opts) */
(function () {
  "use strict";
  var P = "assets/rotary2/";
  var KNOBS = { A: [253, 478], B: [690, 478], C: [253, 1003], D: [690, 1003] };
  var NAMES = ["A", "B", "C", "D"];
  // 8 crans = les 8 symboles gravés sur la couronne (décalage depuis le centre de la molette, en px du visuel 941 × 1672)
  var SYMS = [
    { n: "triangle", dx: 1, dy: -126, a: 0 }, { n: "cercle", dx: 107, dy: -93, a: 49 }, { n: "carré", dx: 144, dy: 1, a: 90 },
    { n: "croix", dx: 111, dy: 98, a: 131 }, { n: "losange", dx: 1, dy: 148, a: 180 }, { n: "onde", dx: -108, dy: 100, a: 227 },
    { n: "étoile", dx: -145, dy: 1, a: 270 }, { n: "cible", dx: -107, dy: -95, a: 311 }
  ];
  var LEDS = { sys: [102, 1387, "orange"], sync: [102, 1456, "orange"], ready: [102, 1525, "green"] };
  var BTN = [468, 1450];

  // ---- son : clic métallique synthétisé (aucun fichier à télécharger) ----
  var ac = null;
  function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === "suspended") ac.resume(); return ac; }
  // vrai clic métallique (assets/sfx/knob_click.wav) pour chaque cran des potentiomètres ; synthèse en secours
  var clickBuf = null, clickLoading = false;
  function loadClick() {
    var a = ctx(); if (!a || clickBuf || clickLoading) return; clickLoading = true;
    fetch("assets/sfx/knob_click.wav?v=1").then(function (r) { return r.arrayBuffer(); }).then(function (b) {
      return new Promise(function (ok, ko) { a.decodeAudioData(b, ok, ko); });
    }).then(function (buf) { clickBuf = buf; }, function () { clickLoading = false; });
  }
  function sample() {
    var a = ctx(); if (!a || !clickBuf) return false;
    var s = a.createBufferSource(), g = a.createGain(); s.buffer = clickBuf; s.playbackRate.value = 0.96 + Math.random() * 0.08; g.gain.value = 1;
    s.connect(g); g.connect(a.destination); s.start(); return true;
  }
  function click(kind) {
    if (kind === "tick" && sample()) return;
    var a = ctx(); if (!a) return; var t = a.currentTime;
    var heavy = kind === "btn", f = heavy ? 900 : 2600;
    var n = a.createBufferSource(), len = Math.floor(a.sampleRate * 0.05), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    n.buffer = buf;
    var bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 2.2;
    var g = a.createGain(); g.gain.setValueAtTime(heavy ? 0.9 : 0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(bp); bp.connect(g); g.connect(a.destination); n.start(t);
    var o = a.createOscillator(), og = a.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(heavy ? 150 : 1900, t); o.frequency.exponentialRampToValueAtTime(heavy ? 70 : 1100, t + 0.05);
    og.gain.setValueAtTime(heavy ? 0.6 : 0.16, t); og.gain.exponentialRampToValueAtTime(0.001, t + (heavy ? 0.12 : 0.05));
    o.connect(og); og.connect(a.destination); o.start(t); o.stop(t + 0.14);
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  function el(cls, tag) { var e = document.createElement(tag || "div"); e.className = cls; return e; }
  function at(e, x, y, w) { e.style.setProperty("--x", x); e.style.setProperty("--y", y); e.style.setProperty("--w", w); return e; }
  function img(src) { var i = document.createElement("img"); i.src = P + src; i.draggable = false; i.alt = ""; return i; }

  function mount(root, opts) {
    opts = opts || {};
    var S = {
      pos: [0, 0, 0, 0], locked: false, phase: "idle", armTimer: 0, t0: 0,
      onChange: opts.onChange || function () {}, onValidate: opts.onValidate || null, linked: opts.linked || function () { return false; }
    };
    root.innerHTML = ""; loadClick();
    var zr = el("zr"); root.appendChild(zr);
    var bar = el("zr-bar"); zr.appendChild(bar);
    if (opts.onBack || opts.backLabel) {
      var bk = el("zr-back", "button"); bk.type = "button"; bk.textContent = opts.backLabel || "← BOMBE"; bk.addEventListener("click", function () { opts.onBack && opts.onBack(); }); bar.appendChild(bk);
    }
    var wrap = el("zr-wrap"); zr.appendChild(wrap);
    var stage = el("zr-stage"); wrap.appendChild(stage);
    var panel = img("panel.jpg"); panel.className = "zr-panel"; stage.appendChild(panel);

    // chrono
    stage.appendChild(el("zr-tpatch"));
    var timeEl = el("zr-time"), tMain = el("zr-tm", "span"), tCs = el("zr-tc", "span"); tMain.textContent = "--:--"; tCs.textContent = ".--"; timeEl.appendChild(tMain); timeEl.appendChild(tCs); stage.appendChild(timeEl);

    // liaisons entre molettes
    var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "zr-links"); svg.setAttribute("viewBox", "0 0 941 1672");
    var pairs = [[0, 1], [2, 3], [0, 2], [1, 3]], lines = pairs.map(function (p) {
      var a = KNOBS[NAMES[p[0]]], b = KNOBS[NAMES[p[1]]], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), u = [dx / L, dy / L], m = 128;
      var ln = document.createElementNS(NS, "line"); ln.setAttribute("x1", a[0] + u[0] * m); ln.setAttribute("y1", a[1] + u[1] * m); ln.setAttribute("x2", b[0] - u[0] * m); ln.setAttribute("y2", b[1] - u[1] * m);
      svg.appendChild(ln); return ln;
    });
    stage.appendChild(svg);

    // molettes
    var knobs = NAMES.map(function (nm, i) {
      var c = KNOBS[nm], k = el("zr-k"); k.style.cssText = "position:absolute;inset:0;pointer-events:none";
      var ring = at(el("zr-at zr-ring"), c[0], c[1], 226);
      var cap = at(el("zr-at"), c[0], c[1], 198); var ci = img("knob_" + nm.toLowerCase() + ".png"); ci.className = "zr-cap"; cap.appendChild(ci);
      var tri = at(el("zr-at zr-tri"), c[0] + 1, c[1] - 169, 52); tri.appendChild(img("tri3_" + nm.toLowerCase() + ".png"));
      var sym = at(el("zr-at zr-sym"), c[0], c[1], 64);
      var hit = at(el("zr-at zr-hit"), c[0], c[1], 280); hit.style.pointerEvents = "auto"; hit.setAttribute("role", "slider"); hit.tabIndex = 0; hit.setAttribute("aria-label", "Sélecteur " + nm);
      k.appendChild(ring); k.appendChild(tri); k.appendChild(cap); k.appendChild(sym); k.appendChild(hit); stage.appendChild(k);
      return { k: k, tri: tri, cap: ci, sym: sym, hit: hit, c: c };
    });
    // voyants
    var leds = {};
    Object.keys(LEDS).forEach(function (id) {
      var d = LEDS[id], w = at(el("zr-at zr-led"), d[0], d[1], 80); w.appendChild(img("led_off.png"));
      var on = img(d[2] === "green" ? "led_green.png" : "led_orange.png"); on.className = "on"; w.appendChild(on); stage.appendChild(w); leds[id] = w;
    });
    // bouton
    var btn = el("zr-btn idle"); btn.style.cssText = "position:absolute;inset:0;pointer-events:none"; stage.appendChild(btn);
    var arm = at(el("zr-at zr-arm"), BTN[0], BTN[1], 252); btn.appendChild(arm);
    var lensW = at(el("zr-at"), BTN[0], BTN[1], 184); var lens = img("lens.png"); lens.className = "zr-lens"; lensW.appendChild(lens); btn.appendChild(lensW);
    var bhit = at(el("zr-at zr-bhit"), BTN[0], BTN[1], 250); bhit.style.pointerEvents = "auto"; bhit.setAttribute("role", "button"); bhit.setAttribute("aria-label", "Validation"); btn.appendChild(bhit);

    function led(id, mode, bp) { // mode : on | off | blink
      var e = leds[id]; e.classList.toggle("on", mode === "on" || mode === "blink"); e.classList.toggle("blink", mode === "blink"); e.style.setProperty("--bp", (bp || 0.5) + "s");
    }
    function btnState(s) { btn.className = "zr-btn " + s; }
    function paint(i, animate) {
      var kn = knobs[i], sy = SYMS[S.pos[i]];
      kn.cap.style.transform = "rotate(" + sy.a + "deg)";
      kn.sym.style.left = "calc(" + (kn.c[0] + sy.dx) + " / 941 * 100%)"; kn.sym.style.top = "calc(" + (kn.c[1] + sy.dy) + " / 1672 * 100%)";
      kn.hit.setAttribute("aria-valuenow", S.pos[i]); kn.hit.setAttribute("aria-valuetext", sy.n);
    }
    function paintLinks() { pairs.forEach(function (p, j) { lines[j].classList.toggle("on", !!S.linked(p[0], p[1], S.pos)); }); }
    function setPos(i, p, silent) {
      p = ((p % SYMS.length) + SYMS.length) % SYMS.length; if (p === S.pos[i]) return false;
      S.pos[i] = p; paint(i); paintLinks();
      if (!silent) { click("tick"); buzz(8); S.onChange(S.pos.slice(), i); disarm(); knobs[i].tri.classList.remove("ok"); }
      return true;
    }
    function nearest(deg) {
      var best = 0, bd = 999; for (var j = 0; j < SYMS.length; j++) { var d = Math.abs(((deg - SYMS[j].a + 540) % 360) - 180); if (d < bd) { bd = d; best = j; } } return best;
    }
    // interaction : glisser en cercle (ou toucher un symbole) pour amener la molette sur le cran voulu
    knobs.forEach(function (kn, i) {
      var active = false;
      function angleOf(e) { var r = kn.hit.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; return (Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180 / Math.PI + 360) % 360; }
      function dist(e) { var r = kn.hit.getBoundingClientRect(); return Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) / (r.width / 2); }
      kn.hit.addEventListener("pointerdown", function (e) {
        if (S.locked) { buzz(15); return; }
        ctx(); active = true; kn.hit.setPointerCapture(e.pointerId); kn.k.classList.add("rot"); if (dist(e) > 0.28) setPos(i, nearest(angleOf(e)));
      });
      kn.hit.addEventListener("pointermove", function (e) { if (active && !S.locked && dist(e) > 0.2) setPos(i, nearest(angleOf(e))); });
      function end() { if (!active) return; active = false; kn.k.classList.remove("rot"); kn.tri.classList.toggle("ok", !!(opts.isCorrect && opts.isCorrect(i, S.pos[i]))); }
      kn.hit.addEventListener("pointerup", end); kn.hit.addEventListener("pointercancel", end);
      kn.hit.addEventListener("keydown", function (e) {
        if (S.locked) return; if (e.key === "ArrowRight" || e.key === "ArrowUp") { setPos(i, S.pos[i] + 1); e.preventDefault(); } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setPos(i, S.pos[i] - 1); e.preventDefault(); }
      });
    });

    // validation : 1er appui = armé (confirmation), 2e appui = synchronisation puis verdict
    function disarm() { if (S.phase === "armed") { clearTimeout(S.armTimer); S.phase = "idle"; btnState("idle"); led("sync", "off"); } }
    function sync(cb) {
      S.phase = "sync"; S.locked = true; btnState("busy"); led("ready", "off"); led("sync", "blink", 0.22); knobs.forEach(function (k) { k.k.classList.add("lock"); });
      setTimeout(cb, 1500);
    }
    function verdict(ok) {
      led("sync", "off");
      if (ok) {
        S.phase = "done"; btnState("ok"); led("ready", "on"); knobs.forEach(function (k) { k.k.classList.remove("lock"); k.k.classList.add("ok"); }); click("btn"); buzz([30, 40, 60]);
        if (opts.onSuccess) opts.onSuccess(S.pos.slice());
      } else {
        S.phase = "fail"; btnState("fail"); led("sys", "blink", 0.12); stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake"); buzz([90, 60, 90, 60, 160]);
        if (opts.onFail) opts.onFail(S.pos.slice());
        setTimeout(function () { S.phase = "idle"; S.locked = false; btnState("idle"); led("sys", "on"); led("ready", "off"); knobs.forEach(function (k) { k.k.classList.remove("lock"); }); }, 1300);
      }
    }
    bhit.addEventListener("pointerdown", function () {
      if (S.locked || S.phase === "done") return; ctx(); btn.classList.add("down"); click("btn"); buzz(20);
    });
    function up() { btn.classList.remove("down"); }
    bhit.addEventListener("pointerup", function () {
      up(); if (S.locked || S.phase === "done") return;
      if (S.phase !== "armed") { S.phase = "armed"; btnState("armed"); led("sync", "blink", 0.5); S.armTimer = setTimeout(disarm, 3200); return; }
      clearTimeout(S.armTimer);
      sync(function () {
        var r = S.onValidate ? S.onValidate(S.pos.slice()) : true;
        if (r && typeof r.then === "function") r.then(verdict, function () { verdict(false); }); else verdict(!!r);
      });
    });
    bhit.addEventListener("pointerleave", up); bhit.addEventListener("pointercancel", up);

    // états initiaux
    for (var i = 0; i < 4; i++) paint(i);
    paintLinks(); led("sys", "on"); led("sync", "off"); led("ready", "off");

    function fmt(ms) { ms = Math.max(0, ms); var s = Math.floor(ms / 1000), c = Math.floor((ms % 1000) / 10); return [("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + (s % 60)).slice(-2), "." + ("0" + c).slice(-2)]; }
    return {
      setTime: function (ms) { var f = fmt(ms); tMain.textContent = f[0]; tCs.textContent = f[1]; var al = ms <= 30000 && ms > 0; timeEl.classList.toggle("al", al); if (al) timeEl.style.setProperty("--zp", (0.14 + 0.86 * Math.min(1, ms / 30000)) + "s"); },
      setPositions: function (arr) { arr.forEach(function (p, i) { setPos(i, p, true); }); },
      getPositions: function () { return S.pos.slice(); },
      lock: function (b) { S.locked = !!b; knobs.forEach(function (k) { k.k.classList.toggle("lock", !!b); }); },
      led: led, symbols: SYMS, stage: stage
    };
  }
  window.ZTRotary = { mount: mount, SYMBOLS: SYMS };
})();
