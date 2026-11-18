// Effets de l'écran opérateur : son de coupe, bip d'alerte, étincelles (repris de la maquette OP03 Stitch).
window.ZT_FX = (function () {
  "use strict";
  var audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) { try { audioCtx = new C(); } catch (e) {} }
    }
    if (audioCtx && audioCtx.state === "suspended") { try { audioCtx.resume(); } catch (e) {} }
    return audioCtx;
  }
  // Le navigateur n'autorise le son qu'après un geste : on déverrouille au premier toucher.
  window.addEventListener("pointerdown", function () { ctx(); }, { once: true, passive: true });

  function noise(c, len, decay, shape) {
    var n = Math.floor(c.sampleRate * len), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * decay)) * (shape ? shape(i) : 1);
    return buf;
  }

  // Son de coupe (synthèse reprise de la maquette Stitch) : ciseau, gaine, arc électrique, impact.
  function cutSound() {
    var c = ctx(); if (!c) return;
    try {
      var now = c.currentTime;
      var comp = c.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-10, now); comp.knee.setValueAtTime(4, now); comp.ratio.setValueAtTime(10, now);
      comp.attack.setValueAtTime(0.001, now); comp.release.setValueAtTime(0.08, now);
      comp.connect(c.destination);

      var snip = c.createOscillator(), snipG = c.createGain();
      snip.type = "triangle";
      snip.frequency.setValueAtTime(2600, now); snip.frequency.exponentialRampToValueAtTime(120, now + 0.04);
      snipG.gain.setValueAtTime(0.95, now); snipG.gain.exponentialRampToValueAtTime(0.001, now + 0.044);
      snip.connect(snipG); snipG.connect(comp); snip.start(now); snip.stop(now + 0.045);

      var cr = c.createBufferSource(); cr.buffer = noise(c, 0.05, 0.012);
      var crF = c.createBiquadFilter(); crF.type = "bandpass"; crF.frequency.setValueAtTime(3500, now); crF.Q.setValueAtTime(3, now);
      var crG = c.createGain(); crG.gain.setValueAtTime(1.1, now); crG.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      cr.connect(crF); crF.connect(crG); crG.connect(comp); cr.start(now); cr.stop(now + 0.052);

      var zap = c.createBufferSource();
      zap.buffer = noise(c, 0.085, 0.024, function (i) { return Math.sin(i * 0.4) > 0 ? 1 : -1; });
      var zPk = c.createBiquadFilter(); zPk.type = "peaking"; zPk.frequency.setValueAtTime(4800, now); zPk.gain.setValueAtTime(11, now);
      var zG = c.createGain(); zG.gain.setValueAtTime(0.9, now); zG.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      zap.connect(zPk); zPk.connect(zG); zG.connect(comp); zap.start(now); zap.stop(now + 0.085);

      var sub = c.createOscillator(), subG = c.createGain();
      sub.type = "sine"; sub.frequency.setValueAtTime(135, now); sub.frequency.exponentialRampToValueAtTime(35, now + 0.06);
      subG.gain.setValueAtTime(0.85, now); subG.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      sub.connect(subG); subG.connect(comp); sub.start(now); sub.stop(now + 0.07);
    } catch (e) {}
  }

  // Bip d'alerte de temps (2:00, 1:00, 0:30, 0:10), réservé à l'opérateur.
  function beep(freq) {
    var c = ctx(); if (!c) return;
    try {
      var now = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.setValueAtTime(freq || 880, now);
      g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.25, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      o.connect(g); g.connect(c.destination); o.start(now); o.stop(now + 0.18);
    } catch (e) {}
  }

  // Flash d'arc + gerbe d'étincelles au point de coupe (coordonnées écran). Posés sur <body> :
  // ils survivent au rafraîchissement de l'écran qui suit la réponse du serveur.
  function sparksAt(x, y) {
    var flash = document.createElement("div");
    flash.className = "arc-flash-burst";
    flash.style.position = "fixed"; flash.style.left = x + "px"; flash.style.top = y + "px";
    document.body.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 340);
    var colors = ["#ffffff", "#bae6fd", "#38bdf8", "#fed7aa", "#ff9f32", "#fef08a"];
    for (var i = 0; i < 48; i++) {
      var p = document.createElement("span");
      p.className = "spark-speck";
      var size = Math.random() < 0.25 ? (Math.random() * 3 + 3) : (Math.random() * 2 + 1.2);
      var color = colors[Math.floor(Math.random() * colors.length)];
      p.style.position = "fixed"; p.style.left = x + "px"; p.style.top = y + "px";
      p.style.width = size + "px"; p.style.height = size + "px"; p.style.backgroundColor = color;
      p.style.boxShadow = "0 0 " + (Math.random() * 8 + 4) + "px " + color + ", 0 0 12px " + color;
      var angle = Math.random() * 2 * Math.PI, dist = Math.random() * 85 + 20, dur = Math.random() * 0.22 + 0.35;
      p.style.setProperty("--tx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--ty", Math.sin(angle) * dist * 0.7 + "px");
      p.style.setProperty("--dur", dur + "s");
      document.body.appendChild(p);
      (function (n, d) { setTimeout(function () { n.remove(); }, d * 1000 + 40); })(p, dur);
    }
  }

  return { cutSound: cutSound, beep: beep, sparksAt: sparksAt };
})();
