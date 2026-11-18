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

  // Claquement des mâchoires, craquement de la gaine, arc électrique, impact grave.
  function cutSound() {
    var c = ctx(); if (!c) return;
    try {
      var now = c.currentTime;
      var comp = c.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-12, now); comp.knee.setValueAtTime(6, now); comp.ratio.setValueAtTime(8, now);
      comp.attack.setValueAtTime(0.002, now); comp.release.setValueAtTime(0.08, now);
      comp.connect(c.destination);

      var snip = c.createOscillator(), snipG = c.createGain();
      snip.type = "triangle";
      snip.frequency.setValueAtTime(2200, now); snip.frequency.exponentialRampToValueAtTime(140, now + 0.038);
      snipG.gain.setValueAtTime(0.9, now); snipG.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
      snip.connect(snipG); snipG.connect(comp); snip.start(now); snip.stop(now + 0.045);

      var cr = c.createBufferSource(); cr.buffer = noise(c, 0.055, 0.015);
      var crF = c.createBiquadFilter(); crF.type = "bandpass";
      crF.frequency.setValueAtTime(3200, now); crF.frequency.exponentialRampToValueAtTime(800, now + 0.05); crF.Q.setValueAtTime(2.5, now);
      var crG = c.createGain(); crG.gain.setValueAtTime(1.1, now); crG.gain.exponentialRampToValueAtTime(0.001, now + 0.052);
      cr.connect(crF); crF.connect(crG); crG.connect(comp); cr.start(now); cr.stop(now + 0.055);

      var zap = c.createBufferSource();
      zap.buffer = noise(c, 0.09, 0.028, function (i) { return Math.sin(i * 0.35) > 0 ? 1 : (Math.random() > 0.4 ? 0.7 : -0.7); });
      var zHp = c.createBiquadFilter(); zHp.type = "highpass"; zHp.frequency.setValueAtTime(1400, now);
      var zPk = c.createBiquadFilter(); zPk.type = "peaking"; zPk.frequency.setValueAtTime(4500, now); zPk.gain.setValueAtTime(8, now); zPk.Q.setValueAtTime(4, now);
      var zG = c.createGain(); zG.gain.setValueAtTime(0.85, now); zG.gain.exponentialRampToValueAtTime(0.001, now + 0.088);
      zap.connect(zHp); zHp.connect(zPk); zPk.connect(zG); zG.connect(comp); zap.start(now); zap.stop(now + 0.09);

      var sub = c.createOscillator(), subG = c.createGain();
      sub.type = "sine"; sub.frequency.setValueAtTime(125, now); sub.frequency.exponentialRampToValueAtTime(40, now + 0.06);
      subG.gain.setValueAtTime(0.8, now); subG.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
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

  // Flash d'arc + gerbe d'étincelles au centre du fil coupé.
  function sparks(row) {
    var conduit = row && row.querySelector(".conduit");
    if (!conduit) return;
    var flash = document.createElement("div");
    flash.className = "arc-flash"; conduit.appendChild(flash);
    setTimeout(function () { flash.remove(); }, 380);
    var palette = ["#ffffff", "#e0f2fe", "#38bdf8", "#ffedd5", "#ffb872", "#ff9f32", "#fef08a"];
    for (var i = 0; i < 42; i++) {
      var p = document.createElement("span");
      p.className = "spark-particle";
      var size = Math.random() < 0.25 ? (Math.random() * 3 + 3.5) : (Math.random() * 2.5 + 1.5);
      var color = palette[Math.floor(Math.random() * palette.length)];
      p.style.width = size + "px"; p.style.height = size + "px"; p.style.backgroundColor = color;
      p.style.boxShadow = "0 0 " + (Math.random() * 8 + 4) + "px " + color + ", 0 0 14px " + color;
      var angle = Math.random() * 2 * Math.PI, dist = Math.random() * 75 + 20;
      var dur = Math.random() * 0.22 + 0.38;
      p.style.setProperty("--tx", (Math.cos(angle) * dist * (Math.random() * 0.6 + 0.8)) + "px");
      p.style.setProperty("--ty", (Math.sin(angle) * dist * 0.45) + "px");
      p.style.setProperty("--dur", dur + "s");
      conduit.appendChild(p);
      (function (n, d) { setTimeout(function () { n.remove(); }, d * 1000 + 50); })(p, dur);
    }
  }

  return { cutSound: cutSound, beep: beep, sparks: sparks };
})();
