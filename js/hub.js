/* ZERO TIME — écran de la bombe globale (paysage). Composant d'affichage : aucune règle de jeu.
 *   var hub = ZTHub.mount(root, { remaining: fn()->ms, onOpen(id), onDisarm(), onExpire(), onAbandon() });
 *   hub.update({ mods:{alim:{done:bool},hor:{..},deto:{..},digi:{..}}, paused:{pseudo,can_abandon}|null, frozenMs:n });
 *   hub.destroy();
 * Les 4 compartiments sont fixes (Alimentation, Détonateur, Digicode, Horloge) ; les 2 autres restent « libres ».
 */
(function () {
  "use strict";
  var NAME = { alim: "Alimentation", digi: "Digicode" };
  var LOCKED = { deto: "Détonateur", hor: "Horloge" };
  var CSS = `
@font-face{font-family:"ZTOrb";src:url(assets/hub/jetbrains-400.woff2) format("woff2");font-weight:400;font-display:block}
@font-face{font-family:"ZTOrb";src:url(assets/hub/jetbrains-700.woff2) format("woff2");font-weight:700;font-display:block}
#zthub{position:fixed;inset:0;background:#000;overflow:hidden;z-index:30;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
#zthub #stage{position:absolute;left:50%;top:50%;width:min(100vw,calc(100dvh*1918/1080));aspect-ratio:1918/1080;transform:translate(-50%,-50%)}
#zthub #stage img{display:block;width:100%;height:100%;-webkit-user-drag:none}
#zthub .z{position:absolute;border:0;padding:0;min-height:0;background:transparent;border-radius:1.2%;cursor:pointer;outline:0}
#zthub .z[data-t=free],#zthub .z[data-t=chrono]{cursor:default}
#zthub .z.on{background:rgba(255,255,255,.14)}
@keyframes zthsh{0%,100%{transform:translate(-50%,-50%)}20%{transform:translate(calc(-50% - 7px),-50%)}40%{transform:translate(calc(-50% + 7px),-50%)}60%{transform:translate(calc(-50% - 5px),-50%)}80%{transform:translate(calc(-50% + 5px),-50%)}}
#zthub #stage.sh{animation:zthsh .35s}
#zthub #turn{position:absolute;inset:0;background:#000;color:#f3f5f5;z-index:20;display:none;align-items:center;justify-content:center;flex-direction:column;gap:14px;text-align:center;font:700 18px "ZTOrb",monospace;letter-spacing:.1em}
#zthub #turn b{font-size:44px;color:#ff9f32}

#zthub #turn button{min-height:0;height:46px;padding:0 18px;margin:4px 0 0;font:700 14px "ZTOrb",monospace;letter-spacing:.06em;border-radius:8px;border:1px solid #ff9f32;background:transparent;color:#ff9f32}
#zthub #turn button.b2{border-color:#555;color:#aab}
@media (orientation:portrait){#zthub{inset:auto;top:0;left:100vw;width:100dvh;height:100vw;transform:rotate(90deg);transform-origin:top left}
#zthub #stage{width:min(100dvh,calc(100vw*1918/1080))}
body:has(#zthub) #toast{top:50% !important;bottom:auto !important;left:auto !important;right:0 !important;max-width:80dvh;transform:translateY(-50%) translateX(-6px) rotate(90deg) !important;transform-origin:center right;z-index:40}}
#zthub #fx .sn{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;font-size:36px;fill:#f2b32a;filter:drop-shadow(0 0 4px rgba(242,179,42,.45))}
#zthub #fx .et{font-family:"ZTOrb",ui-monospace,monospace;font-weight:400;font-size:30px;fill:#a9acae}
#zthub #fx .en{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;font-size:34px;fill:#5b5c60;text-anchor:middle}
#zthub #fx .lk{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;font-size:25px;fill:#80858b;text-anchor:middle;letter-spacing:.06em}
#zthub #fx .rtl{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;font-size:30px;fill:#cfc8bb;letter-spacing:.16em;paint-order:stroke;stroke:#1d1914;stroke-width:1px}
#zthub #hubpause{position:absolute;left:50%;top:6px;transform:translateX(-50%);z-index:12;display:none;align-items:center;gap:10px;background:rgba(38,31,20,.94);border:1px solid #6b4e20;color:#ffcf7a;border-radius:8px;padding:6px 12px;font:700 13px "ZTOrb",monospace;letter-spacing:.06em;white-space:nowrap}
#zthub #hubpause.on{display:flex}
#zthub #hubpause button{min-height:0;height:28px;padding:0 10px;font:700 12px "ZTOrb",monospace;border:1px solid #ff6b6b;background:transparent;color:#ff9a9a;border-radius:6px}
#zthub #fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#zthub #fx .dig{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;font-size:92px;letter-spacing:.05em;fill:#00ffaa;text-anchor:middle;filter:drop-shadow(0 0 8px rgba(0,255,170,.9)) drop-shadow(0 0 22px rgba(0,255,170,.6)) drop-shadow(0 0 42px rgba(0,255,170,.35))}
#zthub #fx .off{opacity:0}
@keyframes bl{0%,44%{opacity:0}50%,94%{opacity:1}100%{opacity:0}}
@keyframes blg2{0%,44%{opacity:1}50%,94%{opacity:.12}100%{opacity:1}}
@keyframes blg{0%,44%{opacity:.12}50%,94%{opacity:1}100%{opacity:.12}}
@keyframes bl2{0%,44%{opacity:1}50%,94%{opacity:0}100%{opacity:1}}
@keyframes pu{0%,100%{opacity:0}50%{opacity:.42}}
#zthub .a1{animation:bl 1.2s steps(1,end) infinite}
#zthub .a2{animation:bl2 1.2s steps(1,end) infinite}
#zthub .a3{animation:pu 2.4s ease-in-out infinite}
#zthub .a4{animation:bl 2.4s steps(1,end) infinite}
#zthub #fx.fast .a1,#fx.fast .a2{animation-duration:.5s}
#zthub #fx.fast .a4{animation-duration:1s}
@keyframes fl{0%,100%{background:#2a0000}50%{background:#b00000}}
#zthub #fx .dig.al{fill:#ff3333;filter:drop-shadow(0 0 10px rgba(255,51,51,1)) drop-shadow(0 0 28px rgba(255,51,51,.8)) drop-shadow(0 0 50px rgba(255,51,51,.5));animation:fc .65s ease-in-out infinite alternate}
@keyframes fc{0%{opacity:.85}100%{opacity:1}}
#zthub #fx .ms{font-size:38px}
#zthub .led .lr,.led .lg{display:none}
#zthub .led.red .lr,.led.green .lg{display:inline}
#zthub .led.red .lr{animation:blg 1.2s steps(1,end) infinite}
#zthub .led.red.alt .lr{animation:blg2 1.2s steps(1,end) infinite}
#zthub .led.green .lg{animation:pu2 2.4s ease-in-out infinite}
#zthub #fx.fast .led.red .lr{animation-duration:.5s}
#zthub #fx.al30 .led.red .lr{animation:blg var(--p,1s) steps(1,end) infinite}
#zthub #fx.al30 .led.red.alt .lr{animation-name:blg2}
@keyframes pu2{0%,100%{opacity:.7}50%{opacity:1}}
#zthub #fx .at{font-family:"ZTOrb",ui-monospace,monospace;font-weight:400;font-size:26px;fill:#a9acae;letter-spacing:.03em}
#zthub #fx .bt{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;text-anchor:middle}
#zthub #armb .gr,#armb .rd{display:none}
#zthub #armb.lock .rd{display:inline}#armb.open .gr{display:inline}
#zthub #es .cap{transition:transform .12s;transform-box:fill-box;transform-origin:center}
#zthub #es.pressed .cap{transform:translateY(5px) scale(.93)}
#zthub #es .halo{opacity:0}
#zthub #es.open .halo{animation:pu3 1.1s ease-in-out infinite}
@keyframes pu3{0%,100%{opacity:.25}50%{opacity:.9}}
#zthub #fx .st{font-family:"ZTOrb",ui-monospace,monospace;font-weight:700;font-size:40px;letter-spacing:.05em}
#zthub #armb.lock .st{fill:#ff3333;filter:drop-shadow(0 0 8px rgba(255,51,51,.95)) drop-shadow(0 0 20px rgba(255,51,51,.6))}
#zthub #armb.open .st{fill:#00ffaa;filter:drop-shadow(0 0 8px rgba(0,255,170,.9)) drop-shadow(0 0 22px rgba(0,255,170,.6))}
#zthub #fx .sub{font-size:21px}
`;
  var DEFS = `<defs>
<radialGradient id="offR"><stop offset="0" stop-color="#2b0707"/><stop offset=".5" stop-color="#3a0b0b"/><stop offset=".62" stop-color="#1c0606" stop-opacity=".9"/><stop offset="1" stop-color="#0d0404" stop-opacity="0"/></radialGradient>
<radialGradient id="offG"><stop offset="0" stop-color="#062a12"/><stop offset=".5" stop-color="#0a3a18"/><stop offset=".62" stop-color="#05200c" stop-opacity=".9"/><stop offset="1" stop-color="#030f06" stop-opacity="0"/></radialGradient>
<radialGradient id="offY"><stop offset="0" stop-color="#2a2204"/><stop offset=".55" stop-color="#3a2f06"/><stop offset="1" stop-color="#120d02" stop-opacity="0"/></radialGradient>
<radialGradient id="hR"><stop offset="0" stop-color="#ff2a1f" stop-opacity=".75"/><stop offset=".45" stop-color="#ff2a1f" stop-opacity=".35"/><stop offset="1" stop-color="#ff2a1f" stop-opacity="0"/></radialGradient>
<radialGradient id="hG"><stop offset="0" stop-color="#17ff6a" stop-opacity=".75"/><stop offset=".45" stop-color="#17ff6a" stop-opacity=".35"/><stop offset="1" stop-color="#17ff6a" stop-opacity="0"/></radialGradient>
<radialGradient id="lR" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe6cf"/><stop offset=".38" stop-color="#ff8a66"/><stop offset=".75" stop-color="#ff1a1a"/><stop offset="1" stop-color="#b00808"/></radialGradient>
<radialGradient id="lG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e4fff0"/><stop offset=".38" stop-color="#8dffb4"/><stop offset=".75" stop-color="#16e04e"/><stop offset="1" stop-color="#087a2a"/></radialGradient>
<radialGradient id="bz" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#b9c1c4"/><stop offset=".6" stop-color="#6c7478"/><stop offset="1" stop-color="#2b3134"/></radialGradient>
<radialGradient id="pt"><stop offset="0" stop-color="#3b3836"/><stop offset=".62" stop-color="#3b3836"/><stop offset="1" stop-color="#3b3836" stop-opacity="0"/></radialGradient>
<radialGradient id="esb" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#3a3f43"/><stop offset="1" stop-color="#0d0e0f"/></radialGradient>
<radialGradient id="esy" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffd21f"/><stop offset=".7" stop-color="#d09a00"/><stop offset="1" stop-color="#7a5a00"/></radialGradient>
<radialGradient id="esr" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#ff9a8c"/><stop offset=".4" stop-color="#f3190f"/><stop offset=".85" stop-color="#b30a05"/><stop offset="1" stop-color="#6b0402"/></radialGradient>
<radialGradient id="esh"><stop offset=".55" stop-color="#ff2a1f" stop-opacity=".7"/><stop offset="1" stop-color="#ff2a1f" stop-opacity="0"/></radialGradient>
<linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0d0a"/><stop offset=".12" stop-color="#14160f"/><stop offset=".3" stop-color="#141414"/><stop offset="1" stop-color="#151515"/></linearGradient>
<linearGradient id="bgR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d11a1a"/><stop offset="1" stop-color="#8a0c0c"/></linearGradient>
<linearGradient id="bgG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14a04c"/><stop offset="1" stop-color="#0a6a30"/></linearGradient>
</defs>`;
  function ledSvg(id, x, y, alt) {
    var inner = '<g class="lr"><circle class="glow" r="46" fill="url(#hR)"/><circle r="18" fill="url(#lR)"/><circle cx="-5" cy="-6" r="4" fill="#fff" opacity=".6"/></g>' +
      '<g class="lg"><circle class="glow" r="46" fill="url(#hG)"/><circle r="18" fill="url(#lG)"/><circle cx="-5" cy="-6" r="4" fill="#fff" opacity=".6"/></g>';
    return '<g class="led red' + (alt ? " alt" : "") + '" id="led-' + id + '" transform="translate(' + x + " " + y + ')"><circle r="48" fill="url(#pt)"/><circle r="26" fill="url(#bz)" stroke="#1b2023" stroke-width="2"/><circle r="19" fill="#120a0a"/>' + inner + "</g>";
  }
  function mount(root, o) {
    if (!document.getElementById("zthub-css")) { var st = document.createElement("style"); st.id = "zthub-css"; st.textContent = CSS; document.head.appendChild(st); }
    root.innerHTML =
      '<div id="zthub"><div id="stage"><img src="assets/hub/bombe.jpg" alt="Bombe : Alimentation, Détonateur, Digicode, Horloge" draggable="false">' +
      '<svg id="fx" viewBox="0 0 1918 1080" aria-hidden="true">' + DEFS +
      '<rect x="532" y="74" width="250" height="42" rx="3" fill="#1b1b1b" style="filter:blur(2px)"/><text id="sn" class="sn" x="540" y="108">--------</text>' +
      '<rect x="752" y="294" width="436" height="102" rx="6" fill="#090405" style="filter:blur(3px)"/>' +
      '<text class="dig" id="dg" x="972" y="383"><tspan id="dm">00:00</tspan><tspan class="ms" id="dms" dx="8">.00</tspan></text>' +
      '<g id="errg"><rect x="915" y="426" width="280" height="82" fill="#050505" style="filter:blur(2px)"/><rect x="756" y="466" width="150" height="40" fill="#050505" style="filter:blur(2px)"/><text id="errt" x="762" y="494" class="et">[0/3]</text><g id="errb"></g></g>' +
      '<g class="lockpl"><rect x="323" y="222" width="272" height="126" rx="7" fill="#0d0e10" stroke="#2b2d31" stroke-width="2"/><rect x="445" y="352" width="150" height="44" rx="4" fill="#17191c"/><path d="M416 284 v-14 a14 14 0 0 1 28 0 v14" fill="none" stroke="#6d7177" stroke-width="5"/><rect x="411" y="284" width="38" height="30" rx="4" fill="#6d7177"/><circle cx="430" cy="299" r="4" fill="#0d0e10"/><text x="583" y="385" class="lk" style="text-anchor:end;font-size:21px">VERROUILLÉ</text></g>'.replace(/<g class="lockpl">/, '<g class="lockpl" id="lk-deto" transform="translate(0 298)">') +
      '<g class="lockpl"><rect x="1359" y="222" width="272" height="126" rx="7" fill="#0d0e10" stroke="#2b2d31" stroke-width="2"/><rect x="1481" y="352" width="150" height="44" rx="4" fill="#17191c"/><path d="M1452 284 v-14 a14 14 0 0 1 28 0 v14" fill="none" stroke="#6d7177" stroke-width="5"/><rect x="1447" y="284" width="38" height="30" rx="4" fill="#6d7177"/><circle cx="1466" cy="299" r="4" fill="#0d0e10"/><text x="1619" y="385" class="lk" style="text-anchor:end;font-size:21px">VERROUILLÉ</text></g>'.replace(/<g class="lockpl">/, '<g class="lockpl" id="lk-hor" transform="translate(0 298)">') +
      '<g id="rotpl"><rect x="286" y="788" width="328" height="118" rx="4" fill="#3d352c" style="filter:blur(1.5px)"/>' +
      '<text x="450" y="830" class="rtl" style="text-anchor:middle">ROTARY</text>' +
      ["a","b","c","d"].map(function (k, i) { return '<image href="assets/rotary4/knob_' + k + '.png" x="' + (342 + i * 72 - 31) + '" y="' + (868 - 31) + '" width="62" height="62"/>'; }).join("") + '</g>' +
      ledSvg("alim", 597, 183) + ledSvg("deto", 597, 481) + ledSvg("digi", 1632, 183, true) + ledSvg("hor", 1634, 481) + ledSvg("rot", 597, 773) +
      '<g id="armb" class="lock">'+
      '<rect x="728" y="756" width="120" height="154" rx="14" fill="#131313"/>'+
      '<rect x="866" y="820" width="336" height="94" fill="#131313"/>'+
      '<rect x="1062" y="754" width="174" height="68" fill="url(#pbg)"/>'+
      '<text class="st" id="at1" x="872" y="868">VERROUILLÉ</text>'+
      '<text class="at sub" id="at2" x="872" y="902">0/4 MODULES NEUTRALISÉS</text>'+
      '<g id="es" class="lock" transform="translate(787 832)">'+
      '<circle class="halo" r="78" fill="url(#esh)"/>'+
      '<circle r="66" fill="url(#esb)" stroke="#4a5055" stroke-width="3"/>'+
      '<circle r="58" fill="url(#esy)" stroke="#5a4300" stroke-width="2"/>'+
      '<circle r="49" fill="#16181a" stroke="#000" stroke-width="2"/>'+
      '<ellipse cx="0" cy="9" rx="40" ry="38" fill="#3a0503"/>'+
      '<g class="cap"><circle r="41" fill="url(#esr)" stroke="#5a0300" stroke-width="2"/><ellipse cx="-12" cy="-17" rx="17" ry="9" fill="#fff" opacity=".4" transform="rotate(-30 -12 -17)"/></g>'+
      '</g>' +
      '<g id="pil"></g>' +
      '<circle class="a1" cx="1036" cy="238" r="26" fill="url(#offR)"/><ellipse class="a4" cx="1049" cy="96" rx="22" ry="26" fill="url(#offY)"/></svg>' +
      '<button class="z" data-t="todo" data-n="Alimentation" data-id="alim" style="left:13.608%;top:13.241%;width:19.604%;height:26.389%" aria-label="Alimentation"></button>'+
      '<button class="z" data-t="locked" data-n="Détonateur" data-id="deto" style="left:13.608%;top:40.741%;width:19.604%;height:25.741%" aria-label="Détonateur"></button>'+
      '<button class="z" data-t="todo" data-n="Rotary" data-id="rot" style="left:13.608%;top:67.870%;width:19.604%;height:20.093%" aria-label="Rotary"></button>'+
      '<button class="z" data-t="todo" data-n="Digicode" data-id="digi" style="left:68.352%;top:13.241%;width:18.665%;height:26.389%" aria-label="Digicode"></button>'+
      '<button class="z" data-t="locked" data-n="Horloge" data-id="hor" style="left:68.352%;top:40.741%;width:18.665%;height:25.741%" aria-label="Horloge"></button>'+
      '<button class="z" data-t="free" data-n="" style="left:68.352%;top:67.870%;width:18.665%;height:20.093%" aria-label="free"></button>'+
      '<button class="z" data-t="chrono" data-n="" style="left:36.705%;top:16.204%;width:27.894%;height:31.944%" aria-label="chrono"></button>'+
      '<button class="z" data-t="arm" data-n="" style="left:37.643%;top:70.185%;width:6.778%;height:13.889%;border-radius:50%" aria-label="arm"></button>'+
      '' +
      '</div><div id="hubpause"><span id="hpt"></span><button id="hpa" type="button">ABANDONNER</button></div>' +
      '</div>';
    var $ = function (s) { return root.querySelector(s); };

    var stage = $("#stage"), fx = $("#fx"), dm = $("#dm"), dms = $("#dms"), dg = $("#dg");
    var S = { mods: {}, paused: null, frozenMs: 0, over: false, expired: false };
    var tt = null, toastEl = null;
    function buzz(n) { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} }
    function say(m) { /* pas de pop-up : le retour est la vibration et la secousse */ }
    function nleft() { return Object.keys(NAME).filter(function (k) { return !(S.mods[k] && S.mods[k].done); }).length; }
    function piles(n) {
      n = n | 0; if (S.piles === n) return; S.piles = n;
      var g = $("#pil"); if (!g) return;
      if (n < 2 || n > 4 || n === 3) { g.innerHTML = ""; return; }
      var X0 = 688, X1 = 1250, W = n === 4 ? 124 : 158, gap = (X1 - X0 - n * W) / (n + 1), h = '<rect x="' + X0 + '" y="578" width="' + (X1 - X0) + '" height="92" fill="#141517"/>';
      for (var i = 0; i < n; i++) {
        var x = X0 + gap + i * (W + gap), c = W * 0.34;
        h += '<rect x="' + (x - 7) + '" y="613" width="9" height="30" fill="#aab0b4"/><rect x="' + (x + W - 2) + '" y="613" width="9" height="30" fill="#aab0b4"/>' +
          '<rect x="' + x + '" y="588" width="' + c + '" height="78" rx="8" fill="#c79a2e"/><rect x="' + (x + c) + '" y="588" width="' + (W - c) + '" height="78" rx="8" fill="#0d0d0e"/>' +
          '<rect x="' + (x + 4) + '" y="594" width="' + (c - 8) + '" height="10" rx="5" fill="#f0d27a" opacity=".55"/><rect x="' + (x + c + 6) + '" y="594" width="' + (W - c - 12) + '" height="8" rx="4" fill="#fff" opacity=".12"/>';
      }
      g.innerHTML = h;
    }
    function armUI() {
      var left = nleft(), open = left === 0, a = $("#armb"), e = $("#es");
      a.classList.toggle("lock", !open); a.classList.toggle("open", open); e.classList.toggle("lock", !open); e.classList.toggle("open", open);
      $("#at1").textContent = open ? "DÉVERROUILLÉ" : "VERROUILLÉ";
      $("#at2").textContent = open ? "APPUYER SUR ARRÊT" : (2 - left) + "/2 MODULES NEUTRALISÉS";
    }
    function leds() { Object.keys(NAME).forEach(function (k) { var g = $("#led-" + k), d = S.mods[k] && S.mods[k].done; g.classList.remove("red", "green"); g.classList.add(d ? "green" : "red"); });
      Object.keys(LOCKED).forEach(function (k) { var g = $("#led-" + k); g.classList.remove("red", "green"); }); armUI(); }
    function errs(n) {
      $("#errt").textContent = "[" + n + "/3]";
      var h = "";
      for (var i = 0; i < 3; i++) {
        var x = 932 + i * 94.5, on = i < n;
        h += on
          ? '<rect x="' + (x - 8) + '" y="430" width="77" height="75" rx="12" fill="#ff2a1f" opacity=".28" style="filter:blur(7px)"/><rect x="' + x + '" y="438" width="61" height="59" rx="6" fill="url(#bgR)" stroke="#ff6a5f" stroke-width="2"/><path d="M' + (x + 17) + " 455L" + (x + 44) + " 481M" + (x + 44) + " 455L" + (x + 17) + ' 481" stroke="#fff" stroke-width="6" stroke-linecap="round"/>'
          : '<rect x="' + x + '" y="438" width="61" height="59" rx="6" fill="#26272a" stroke="#34353a" stroke-width="2"/><text x="' + (x + 30.5) + '" y="478" class="en">' + (i + 1) + "</text>";
      }
      $("#errb").innerHTML = h;
    }
    function show(ms) {
      var sec = Math.floor(ms / 1000), cs = Math.floor((ms % 1000) / 10);
      dm.textContent = ("0" + Math.floor(sec / 60)).slice(-2) + ":" + ("0" + (sec % 60)).slice(-2);
      dms.textContent = "." + ("0" + cs).slice(-2);
      var al = ms <= 30000;
      dg.classList.toggle("al", al); fx.classList.toggle("fast", al); fx.classList.toggle("al30", al);
      if (al) { var per = Math.round((0.14 + 0.86 * Math.min(1, ms / 30000)) * 25) / 25; if (fx._per !== per) { fx._per = per; fx.style.setProperty("--p", per + "s"); } }
    }
    function tick() {
      if (S.paused) { show(S.frozenMs); return; }
      var ms = Math.max(0, o.remaining());
      show(ms);
      if (ms === 0 && !S.expired) { S.expired = true; o.onExpire && o.onExpire(); }
    }
    Array.prototype.forEach.call(root.querySelectorAll(".z"), function (z) {
      function on() { if (z.dataset.t !== "chrono") z.classList.add("on"); }
      function off() { z.classList.remove("on"); }
      z.addEventListener("touchstart", on, { passive: true }); z.addEventListener("touchend", off); z.addEventListener("touchcancel", off);
      z.addEventListener("mousedown", on); z.addEventListener("mouseup", off); z.addEventListener("mouseleave", off);
      z.addEventListener("click", function () {
        var t = z.dataset.t;
        if (t === "todo" || t === "done") { buzz(15); o.onOpen && o.onOpen(z.dataset.id); }
        else if (t === "free") { buzz(10); say("Emplacement libre"); }
        else if (t === "locked") { buzz(10); say("Module verrouillé : bientôt disponible"); }
        else if (t === "arm") {
          var l = nleft();
          if (l > 0) { buzz([30, 40, 30]); stage.classList.remove("sh"); void stage.offsetWidth; stage.classList.add("sh"); say("Verrouillé : " + l + " module" + (l > 1 ? "s" : "") + " à traiter"); }
          else if (!S.over) { S.over = true; var e = $("#es"); e.classList.add("pressed"); buzz([60, 30, 90]); setTimeout(function () { e.classList.remove("pressed"); o.onDisarm && o.onDisarm(function () { S.over = false; }); }, 300); }
        }
      });
    });
    $("#hpa").onclick = function () { o.onAbandon && o.onAbandon(); };
    var iv = setInterval(tick, 40);
    var api = {
      update: function (s) {
        if (s.serial) $("#sn").textContent = s.serial; S.mods = s.mods || S.mods; S.paused = s.paused || null; S.frozenMs = s.frozenMs || 0;
        leds(); errs(s.errors || 0); piles(s.piles);
        var pb = $("#hubpause"); pb.classList.toggle("on", !!S.paused);
        if (S.paused) { $("#hpt").textContent = "⏸ EN ATTENTE DE " + String(S.paused.pseudo || "").toUpperCase(); $("#hpa").style.display = S.paused.can_abandon ? "" : "none"; }
        tick();
      },
      destroy: function () { clearInterval(iv); root.innerHTML = ""; }
    };
    return api;
  }
  window.ZTHub = { mount: mount };
})();
