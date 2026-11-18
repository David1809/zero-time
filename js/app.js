(function () {
  "use strict";
  var cfg = window.ZT_CONFIG;
  var sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");
  var KEY = "zt_session";
  var APP_VERSION = "1.0.15";
  var session = null; // { code, player_id, token }
  var view = null;    // dernière vue reçue du serveur (propre à ce joueur)
  var channel = null;
  var toastTimer = null;

  var ERREURS = {
    pseudo_invalide: "Pseudo invalide (1 à 16 caractères).",
    salle_introuvable: "Salle introuvable.",
    salle_pleine: "La salle est pleine.",
    partie_deja_lancee: "La partie est déjà lancée.",
    pseudo_deja_pris: "Ce pseudo est déjà pris dans la salle.",
    joueur_inconnu: "Joueur inconnu.",
    reserve_au_createur: "Action réservée au créateur.",
    joueur_manquant: "Il manque un joueur.",
    role_non_choisi: "Choisis ton rôle ou le tirage au sort.",
    reserve_operateur: "Action réservée à l'opérateur.",
    coupe_invalide: "Ce fil ne peut pas être coupé.",
    panneau_inconnu: "Panneau inconnu.",
    abandon_indisponible: "Abandon impossible pour le moment.",
    mode_solo_indisponible: "Mode solo indisponible : un autre joueur est dans la salle."
  };

  function toast(msg, ok) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    toastEl.style.background = ok ? "#2E7D4F" : "";
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 3500);
  }
  function fail(error) {
    var m = (error && error.message) || "";
    var k = Object.keys(ERREURS).filter(function (e) { return m.indexOf(e) !== -1; })[0];
    toast(k ? ERREURS[k] : "Connexion impossible, réessaie.");
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function clear() { while (app.firstChild) app.removeChild(app.firstChild); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(session)); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} session = null; view = null; unsubscribe(); stopHeartbeat(); }

  function unsubscribe() { if (channel) { sb.removeChannel(channel); channel = null; } }
  function subscribe() {
    unsubscribe();
    // Canal privé du joueur : l'identifiant de joueur n'est connu que de lui.
    channel = sb.channel("zt-" + session.code + "-" + session.player_id)
      .on("broadcast", { event: "state" }, function (msg) { view = msg.payload; render(); })
      .subscribe(function (status) { if (status === "SUBSCRIBED") refresh(); });
  }
  var hbId = null;
  function sig(v) {
    if (!v) return "";
    var c = JSON.parse(JSON.stringify(v));
    if (c.game) delete c.game.server_now;
    return JSON.stringify(c);
  }
  // Signal de présence (toutes les 5 s) : le serveur détecte les absences, met en pause et reprend.
  function heartbeat() {
    // Un onglet caché ou un écran verrouillé n'est pas « présent » : pas de signal, même si le
    // navigateur réveille brièvement la page (sinon la partie reprendrait par à-coups).
    if (!session || document.hidden) return;
    var code = session.code;
    sb.rpc("zt_heartbeat", { p_code: session.code, p_token: session.token }).then(function (r) {
      if (!session || session.code !== code) return;
      if (r.error) {
        if ((r.error.message || "").indexOf("joueur_inconnu") !== -1) { forget(); render(); }
        return; // réseau coupé : on réessaiera au prochain signal
      }
      if (sig(r.data) !== sig(view)) { view = r.data; render(); }
    });
  }
  function startHeartbeat() { stopHeartbeat(); hbId = setInterval(heartbeat, 5000); }
  function stopHeartbeat() { if (hbId) { clearInterval(hbId); hbId = null; } }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) heartbeat(); });
  window.addEventListener("online", heartbeat);
  function refresh() { heartbeat(); }
  function enter(data) {
    session = { code: data.code, player_id: data.player_id, token: data.token };
    save(); subscribe(); startHeartbeat(); refresh();
  }

  function header() {
    return [el("div", { class: "mark", text: "0" }), el("h1", { text: "ZERO TIME" })];
  }

  function renderHome() {
    clear();
    header().forEach(function (n) { app.appendChild(n); });
    var pseudo = el("input", { id: "pseudo", maxlength: "16", autocomplete: "nickname", placeholder: "Ton pseudo" });
    var code = el("input", { id: "code", maxlength: "4", autocapitalize: "characters", autocomplete: "off", placeholder: "CODE" });
    var create = el("button", { class: "primary", text: "Créer une salle", onclick: function () {
      create.disabled = true;
      sb.rpc("zt_create_room", { p_pseudo: pseudo.value }).then(function (r) {
        create.disabled = false;
        if (r.error) return fail(r.error);
        enter(r.data);
      });
    } });
    var join = el("button", { text: "Rejoindre", onclick: function () {
      join.disabled = true;
      sb.rpc("zt_join_room", { p_code: code.value, p_pseudo: pseudo.value }).then(function (r) {
        join.disabled = false;
        if (r.error) return fail(r.error);
        enter(r.data);
      });
    } });
    app.appendChild(el("div", { class: "card" }, [
      el("label", { for: "pseudo", text: "Pseudo" }), pseudo, create,
      el("label", { for: "code", text: "Code de la salle" }), code, join
    ]));
    var ver = el("button", { id: "zt-version", text: "v" + APP_VERSION + " · toucher pour mettre à jour", onclick: function () {
      ver.textContent = "Mise à jour…";
      var done = function () { location.replace(location.pathname + "?u=" + Date.now()); };
      Promise.all([
        (navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (x) { return x.unregister(); })); }) : null),
        (window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null)
      ]).then(done, done);
    } });
    ver.style.cssText = "display:block;margin:18px auto 0;background:none;border:0;color:#6b7684;font:11px 'JetBrains Mono',monospace;min-height:0;padding:6px;width:auto";
    app.appendChild(ver);
  }

  function roleLabel(r) { return r === "operator" ? "Opérateur" : r === "technician" ? "Technicien" : "—"; }

  function renderLobby() {
    clear();
    header().forEach(function (n) { app.appendChild(n); });
    app.appendChild(el("div", { class: "muted", text: "Code de la salle" }));
    app.appendChild(el("div", { class: "code", text: view.code }));
    var ul = el("ul", { class: "players" });
    view.players.forEach(function (p) {
      ul.appendChild(el("li", {}, [el("span", { text: p.pseudo }), el("span", { class: "tag", text: p.is_creator ? "créateur" : "" })]));
    });
    app.appendChild(ul);
    if (view.players.length < 2) app.appendChild(el("div", { class: "muted", text: "En attente du deuxième joueur…" }));

    if (view.is_creator) {
      var mode = view.role_mode, cr = view.creator_role;
      function setMode(m, role) {
        sb.rpc("zt_set_role_mode", { p_code: view.code, p_token: session.token, p_mode: m, p_role: role || null }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
      }
      var card = el("div", { class: "card" }, [
        el("label", { text: "Attribution des rôles" }),
        el("div", { class: "row" }, [
          el("button", { class: mode === "choose" && cr === "operator" ? "on" : "", text: "Je suis opérateur", onclick: function () { setMode("choose", "operator"); } }),
          el("button", { class: mode === "choose" && cr === "technician" ? "on" : "", text: "Je suis technicien", onclick: function () { setMode("choose", "technician"); } })
        ]),
        el("button", { class: mode === "random" ? "on" : "", text: "Tirage au sort", onclick: function () { setMode("random"); } })
      ]);
      app.appendChild(card);
      var ready = view.players.length === 2 && (mode === "random" || !!cr);
      app.appendChild(el("button", { class: "primary", text: "Lancer", disabled: ready ? null : "disabled", onclick: function () {
        sb.rpc("zt_start", { p_code: view.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
      } }));
      if (view.players.length === 1) {
        function startSolo(role) {
          sb.rpc("zt_start_solo", { p_code: view.code, p_token: session.token, p_role: role }).then(function (r) { if (r.error) return fail(r.error); view = r.data; resetGameFlags(); selectedWire = null; activePanel = 0; render(); });
        }
        app.appendChild(el("div", { class: "card" }, [
          el("label", { text: "Mode test (seul, sans deuxième joueur)" }),
          el("div", { class: "row" }, [
            el("button", { text: "Tester en opérateur", onclick: function () { startSolo("operator"); } }),
            el("button", { text: "Tester en technicien", onclick: function () { startSolo("technician"); } })
          ])
        ]));
      }
    } else {
      app.appendChild(el("div", { class: "muted", text: "Le créateur choisit les rôles et lance la partie." }));
    }
    app.appendChild(el("button", { text: "Quitter", onclick: function () { forget(); render(); } }));
  }

  var COLORS = { red: "Rouge", blue: "Bleu", yellow: "Jaune", white: "Blanc", black: "Noir" };
  var activePanel = 0, selectedWire = null, manualTab = "w4";
  var timerId = null, offsetMs = 0;
  var errFlash = null, alertFlash = null;
  var seenEvent, alerted = {}, alertInit = false, tickSent = false, cutting = false;
  var ALERTS = [120, 60, 30, 10];
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function resetGameFlags() { errFlash = null; alertFlash = null; seenEvent = undefined; alerted = {}; alertInit = false; tickSent = false; }

  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
  }

  function pauseCard() {
    var p = view.paused;
    var kids = [
      el("div", { class: "code", style: "font-size:26px;letter-spacing:.02em", text: "En attente de " + p.pseudo }),
      el("div", { class: "muted", text: "La partie est en pause. Le temps ne s'écoule plus." })
    ];
    if (p.can_abandon) kids.push(el("button", { text: "Abandonner la partie", onclick: function () {
      if (!window.confirm("Abandonner la partie ?")) return;
      sb.rpc("zt_abandon", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
    } }));
    return el("div", { class: "card pause" }, kids);
  }

  function fmtH(ms) {
    ms = Math.max(0, ms);
    var s = Math.floor(ms / 1000), c = Math.floor((ms % 1000) / 10);
    return [(Math.floor(s / 60) < 10 ? "0" : "") + Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60), (c < 10 ? ".0" : ".") + c];
  }

  // ---- Géométrie des câbles (repris des maquettes Stitch V2 pour 5 fils ; même style pour 3 et 4 fils) ----
  // Chaque fil = suites de courbes de Bézier [x0,y0,x1,y1,x2,y2,x3,y3] dans un repère 320 x 256.
  // cut = où le fil est sectionné : moignon gauche (li, jusqu'à lt) et moignon droit (ri, depuis rt).
  var G2 = { li: 0, lt: 0.88, ri: 1, rt: 0.12 };
  var GEOM = {
    5: [
      { s: [[0,22,60,20,85,95,160,110],[160,110,235,125,255,40,320,22]], cut: G2 },
      { s: [[0,74,45,74,75,45,110,62],[110,62,150,85,170,112,210,135],[210,135,245,150,280,82,320,74]], cut: { li: 1, lt: 0.3, ri: 1, rt: 0.7 } },
      { s: [[0,128,70,130,90,45,160,50],[160,50,230,55,260,195,320,128]], cut: G2 },
      { s: [[0,180,80,185,105,230,160,215],[160,215,215,200,240,110,320,180]], cut: G2 },
      { s: [[0,234,65,230,110,140,160,155],[160,155,210,170,250,245,320,234]], cut: G2 }
    ],
    4: [
      { s: [[0,22,60,20,85,85,160,100],[160,100,235,115,255,40,320,22]], cut: G2 },
      { s: [[0,92,70,95,95,150,160,140],[160,140,225,130,250,60,320,92]], cut: G2 },
      { s: [[0,164,70,160,90,75,160,72],[160,72,230,69,255,190,320,164]], cut: G2 },
      { s: [[0,234,65,230,110,170,160,180],[160,180,210,190,250,245,320,234]], cut: G2 }
    ],
    3: [
      { s: [[0,22,60,20,85,95,160,110],[160,110,235,125,255,40,320,22]], cut: G2 },
      { s: [[0,128,70,130,90,45,160,50],[160,50,230,55,260,195,320,128]], cut: G2 },
      { s: [[0,234,65,230,110,140,160,155],[160,155,210,170,250,245,320,234]], cut: G2 }
    ]
  };
  // Ordre de dessin (le dernier est au premier plan) et ombres de croisement, comme dans la maquette.
  var ORDER = { 5: [3, "x1", 2, 4, "x2", 5, 1], 4: [3, 2, 4, 1], 3: [2, 3, 1] };
  var XSHADOW = {
    x1: "M 125,86 C 145,98 172,106 190,118",
    x2: "M 120,186 C 138,191 166,196 182,198"
  };
  var BASE = { red: "#250202", yellow: "#240c01", blue: "#040914", black: "#010204", white: "#0f172a" };

  function r1(v) { return Math.round(v * 10) / 10; }
  function cubic(p, t0, t1) { // sous-courbe [t0,t1] d'une Bézier cubique (de Casteljau)
    function split(q, t) {
      var x01 = q[0] + (q[2] - q[0]) * t, y01 = q[1] + (q[3] - q[1]) * t;
      var x12 = q[2] + (q[4] - q[2]) * t, y12 = q[3] + (q[5] - q[3]) * t;
      var x23 = q[4] + (q[6] - q[4]) * t, y23 = q[5] + (q[7] - q[5]) * t;
      var xa = x01 + (x12 - x01) * t, ya = y01 + (y12 - y01) * t;
      var xb = x12 + (x23 - x12) * t, yb = y12 + (y23 - y12) * t;
      var xm = xa + (xb - xa) * t, ym = ya + (yb - ya) * t;
      return [[q[0], q[1], x01, y01, xa, ya, xm, ym], [xm, ym, xb, yb, x23, y23, q[6], q[7]]];
    }
    var q = p;
    if (t1 < 1) q = split(q, t1)[0];
    if (t0 > 0) q = split(q, t0 / (t1 < 1 ? t1 : 1))[1];
    return q;
  }
  function segD(q, move) { return (move ? "M " + r1(q[0]) + "," + r1(q[1]) + " " : "") + "C " + [2, 3, 4, 5, 6, 7].map(function (i, k) { return r1(q[i]) + (k % 2 ? " " : ","); }).join("").trim().replace(/ (?=\d|-)/g, " ").replace(/,(?=$)/, ""); }
  function pathD(list) { return list.map(function (q, i) { return segD(q, i === 0); }).join(" "); }
  function wireParts(g) {
    var c = g.cut, left = [], right = [], i;
    for (i = 0; i < c.li; i++) left.push(g.s[i]);
    left.push(cubic(g.s[c.li], 0, c.lt));
    right.push(cubic(g.s[c.ri], c.rt, 1));
    for (i = c.ri + 1; i < g.s.length; i++) right.push(g.s[i]);
    var le = left[left.length - 1], rs = right[0];
    return { full: pathD(g.s), left: pathD(left), right: pathD(right),
      ex: le[6], ey: le[7], sx: rs[0], sy: rs[1], cx: (le[6] + rs[0]) / 2, cy: (le[7] + rs[1]) / 2 };
  }

  var CL_BASE = "terminal-clamp-block w-6 h-6 rounded flex items-center justify-center font-code-serial font-bold text-[11px]";
  function clampCls(isCut, isSel, locked) {
    if (isCut) return CL_BASE + " text-slate-500 line-through";
    if (isSel) return "terminal-clamp-block active-clamp w-6 h-6 rounded flex items-center justify-center font-code-serial font-black text-[12px]";
    return CL_BASE + (locked ? " text-slate-300" : " text-slate-200 group-hover:border-primary");
  }
  function lugsL(isCut) { return '<div class="flex flex-col items-center gap-0.5' + (isCut ? " opacity-40" : "") + '"><span class="w-1.5 h-1 rounded-xs terminal-lug"></span><span class="w-2 h-1.5 rounded-xs bg-[#111418]' + (isCut ? "" : " border border-[#3b434e]") + '"></span></div>'; }
  function lugsR(isCut) { return '<div class="flex flex-col items-center gap-0.5' + (isCut ? " opacity-40" : "") + '"><span class="w-2 h-1.5 rounded-xs bg-[#111418]' + (isCut ? "" : " border border-[#3b434e]") + '"></span><span class="w-1.5 h-1 rounded-xs terminal-lug"></span></div>'; }

  var GRADS = "<linearGradient id=\"grad-wire-red\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#3d0303\"/><stop offset=\"12%\" stop-color=\"#880f0f\"/><stop offset=\"26%\" stop-color=\"#dc2626\"/><stop offset=\"38%\" stop-color=\"#f87171\"/><stop offset=\"46%\" stop-color=\"#ffffff\"/><stop offset=\"56%\" stop-color=\"#ef4444\"/><stop offset=\"78%\" stop-color=\"#b91c1c\"/><stop offset=\"92%\" stop-color=\"#650909\"/><stop offset=\"100%\" stop-color=\"#2d0202\"/></linearGradient><linearGradient id=\"grad-wire-white\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#1e293b\"/><stop offset=\"14%\" stop-color=\"#475569\"/><stop offset=\"28%\" stop-color=\"#94a3b8\"/><stop offset=\"40%\" stop-color=\"#e2e8f0\"/><stop offset=\"48%\" stop-color=\"#ffffff\"/><stop offset=\"58%\" stop-color=\"#cbd5e1\"/><stop offset=\"80%\" stop-color=\"#64748b\"/><stop offset=\"94%\" stop-color=\"#334155\"/><stop offset=\"100%\" stop-color=\"#141c27\"/></linearGradient><linearGradient id=\"grad-wire-yellow\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#451a03\"/><stop offset=\"14%\" stop-color=\"#92400e\"/><stop offset=\"28%\" stop-color=\"#d97706\"/><stop offset=\"40%\" stop-color=\"#fbbf24\"/><stop offset=\"48%\" stop-color=\"#ffffff\"/><stop offset=\"58%\" stop-color=\"#f59e0b\"/><stop offset=\"80%\" stop-color=\"#b45309\"/><stop offset=\"94%\" stop-color=\"#712e06\"/><stop offset=\"100%\" stop-color=\"#2d1001\"/></linearGradient><linearGradient id=\"grad-wire-blue\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#050e20\"/><stop offset=\"14%\" stop-color=\"#1e3a8a\"/><stop offset=\"28%\" stop-color=\"#2563eb\"/><stop offset=\"40%\" stop-color=\"#60a5fa\"/><stop offset=\"48%\" stop-color=\"#ffffff\"/><stop offset=\"58%\" stop-color=\"#3b82f6\"/><stop offset=\"80%\" stop-color=\"#1d4ed8\"/><stop offset=\"94%\" stop-color=\"#112763\"/><stop offset=\"100%\" stop-color=\"#040b19\"/></linearGradient><linearGradient id=\"grad-wire-black\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#020406\"/><stop offset=\"14%\" stop-color=\"#0f172a\"/><stop offset=\"28%\" stop-color=\"#334155\"/><stop offset=\"40%\" stop-color=\"#64748b\"/><stop offset=\"48%\" stop-color=\"#cbd5e1\"/><stop offset=\"58%\" stop-color=\"#475569\"/><stop offset=\"80%\" stop-color=\"#1e293b\"/><stop offset=\"94%\" stop-color=\"#0f141d\"/><stop offset=\"100%\" stop-color=\"#010204\"/></linearGradient><linearGradient id=\"copper-wires\" x1=\"0%\" x2=\"100%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#b45309\"/><stop offset=\"35%\" stop-color=\"#fde047\"/><stop offset=\"65%\" stop-color=\"#ea580c\"/><stop offset=\"100%\" stop-color=\"#78350f\"/></linearGradient>";
  var DEFS = '<defs>' +
    '<filter height="200%" id="cavity-shadow" width="140%" x="-20%" y="-40%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="0" dy="7" result="offsetblur"/><feComponentTransfer><feFuncA slope="0.82" type="linear"/></feComponentTransfer><feMerge><feMergeNode/></feMerge></filter>' +
    '<filter height="220%" id="crossing-shadow" width="160%" x="-30%" y="-50%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="0" dy="5" result="offsetblur"/><feComponentTransfer><feFuncA slope="0.9" type="linear"/></feComponentTransfer><feMerge><feMergeNode/></feMerge></filter>' +
    GRADS +
    '</defs>';

  var lastCut = null; // fil qui vient d'être coupé (pour l'animation de recul)

  function renderOperator() {
    var g = view.game;
    offsetMs = new Date(g.server_now).getTime() - Date.now();
    var endsAt = new Date(g.ends_at).getTime();
    var solved = g.panels.filter(function (p) { return p.state === "solved"; }).length;
    var panel = g.panels[activePanel] || g.panels[0];
    var paused = view.paused;
    var n = panel.wires.length;
    var isSolved = panel.state === "solved";
    var geom = GEOM[n] || GEOM[5];
    var now = Date.now();

    // Événement de la dernière coupe : bandeau d'erreur + vignette rouge quelques secondes.
    var ev = g.event;
    if (seenEvent === undefined) { seenEvent = ev ? ev.id : null; }
    else if (ev && ev.id !== seenEvent) {
      seenEvent = ev.id;
      if (ev.type === "error") { errFlash = { n: ev.n, penalty: ev.penalty, until: now + 3200 }; buzz([250]); }
      else buzz([80]);
    }
    var showErr = errFlash && errFlash.until > now && !paused;
    if (showErr) setTimeout(function () { render(); }, errFlash.until - now + 30);
    var showAlert = alertFlash && alertFlash.until > now && !paused;
    if (showAlert) setTimeout(function () { render(); }, alertFlash.until - now + 30);

    var remNow = paused ? paused.remaining_ms : endsAt - (now + offsetMs);
    var critical = remNow <= 60000;
    var mode = paused ? "pause" : (isSolved ? "ok" : (showErr ? "err" : (critical ? "alert" : "live")));

    // --- éléments de l'en-tête
    var chips = g.panels.map(function (p, idx) {
      var on = idx === activePanel, w = p.wires.length;
      var cls = on ? "px-2.5 py-1.5 rounded bg-[#2b333d] text-[10px] font-code-serial font-bold " + (mode === "pause" ? "text-slate-300 border border-slate-600/40" : (mode === "ok" ? "text-primary border border-primary/40" : "text-primary border border-primary/40")) + " shadow-sm"
                  : "px-2.5 py-1.5 rounded text-[10px] font-code-serial font-semibold text-slate-300 border border-slate-600/40";
      return '<button type="button" data-panel="' + idx + '" class="' + cls + '">' + ((idx + 1) + "·" + w + "F") + (p.state === "solved" ? " ✓" : "") + '</button>';
    }).join("");
    var topLed = { live: '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span><span class="font-label-sm text-[8px] font-bold text-primary tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      alert: '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span><span class="font-label-sm text-[8px] font-bold text-primary tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      err: '<span class="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span><span class="font-label-sm text-[8px] font-bold text-error tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      ok: '<span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span><span class="font-label-sm text-[8px] font-bold text-[#00ffaa] tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      pause: '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span><span class="font-label-sm text-[8px] font-bold text-amber-400 tracking-widest uppercase">UNITÉ TACTIQUE // SUSPENDUE</span>' }[mode];
    var badge = { live: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#101923] border border-[#1e2d3d]"><span class="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span><span class="font-code-serial text-[9px] text-[#9bb1c5] tracking-widest font-bold">ACTIF</span></div>',
      alert: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#191e25] border border-[#313945]"><span class="w-1.5 h-1.5 rounded-full bg-[#ff4d4d] shadow-[0_0_6px_#ff4d4d] animate-pulse"></span><span class="font-code-serial text-[9px] text-[#ffb4ab] tracking-widest font-bold">ALERTE</span></div>',
      err: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#221010] border border-[#522121]"><span class="w-1.5 h-1.5 rounded-full bg-[#ff3333] shadow-[0_0_6px_#ff3333] animate-pulse"></span><span class="font-code-serial text-[9px] text-[#ff9999] tracking-widest font-bold">ALERTE</span></div>',
      ok: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#13281f] border border-[#00ffaa]/50 shadow-[0_0_8px_rgba(0,255,170,0.3)]"><span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span><span class="font-code-serial text-[9px] text-[#00ffaa] tracking-widest font-bold">RÉSOLU</span></div>',
      pause: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#261f14] border border-[#6b4e20]"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#ffaa00] animate-ping"></span><span class="font-code-serial text-[9px] text-amber-300 tracking-widest font-bold">PAUSE</span></div>' }[mode];

    // --- bloc télémétrie
    var diodes = "";
    for (var i = 0; i < 3; i++) diodes += i < g.errors
      ? '<div class="w-5 h-5 rounded bg-[#4a0d0d] border border-[#ff4d4d] flex items-center justify-center shadow-[0_0_10px_rgba(255,77,77,0.85)]"><span class="material-symbols-outlined text-white text-[12px] font-black">priority_high</span></div>'
      : '<div class="w-5 h-5 rounded bg-[#101419] border border-[#26313d] flex items-center justify-center shadow-inner"><span class="w-1.5 h-1.5 rounded-full bg-[#1b232c]"></span></div>';
    var crans = "";
    for (var k = 0; k < 3; k++) crans += k < solved
      ? '<div class="flex-1 h-full rounded-xs bg-gradient-to-r ' + (mode === "ok" ? "from-[#00ffaa] to-[#10ff98] shadow-[0_0_8px_rgba(0,255,170,0.8)]" : "from-primary to-[#ffbe73] shadow-[0_0_8px_rgba(255,159,50,0.7)]") + '"></div>'
      : '<div class="flex-1 h-full rounded-xs bg-[#171d24]"></div>';
    var screws = function (a, b, c, d) { return '<span class="screw-cross ' + a + ' top-2 left-2"></span><span class="screw-cross ' + b + ' top-2 right-2"></span><span class="screw-cross ' + c + ' bottom-2 left-2"></span><span class="screw-cross ' + d + ' bottom-2 right-2"></span>'; };
    var head = { live: '<span class="pilot-led-alert"></span><span class="font-label-sm text-[9px] font-bold text-primary tracking-wider uppercase">DÉTONATION IMMINENTE</span>',
      alert: '<span class="pilot-led-alert"></span><span class="font-label-sm text-[9px] font-bold text-[#ffb4ab] tracking-wider uppercase">ATTENTION : COMPTE À REBOURS CRITIQUE</span>',
      err: '<span class="pilot-led-red"></span><span class="font-label-sm text-[9px] font-bold text-[#ff6666] tracking-wider uppercase">ATTENTION : DÉTONATION IMMINENTE</span>',
      ok: '<span class="pilot-led-green"></span><span class="font-label-sm text-[9px] font-bold text-[#00ffaa] tracking-wider uppercase">PANNEAU SÉCURISÉ // DÉSAMORÇAGE EFFECTIF</span>',
      pause: '<span class="pilot-led-pause"></span><span class="font-label-sm text-[9px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5"><span class="material-symbols-outlined text-[13px]">pause_circle</span>SESSION EN PAUSE // HORLOGE FIGÉE</span>' }[mode];
    var chan = { live: '<span class="font-code-serial text-[9px] text-primary tracking-widest uppercase">CANAL 03 // LIVE</span>',
      alert: '<span class="font-code-serial text-[9px] text-primary tracking-widest uppercase">CANAL 03 // LIVE</span>',
      err: '<span class="font-code-serial text-[9px] text-[#ff8080] tracking-widest uppercase font-bold">CANAL 03 // LIVE</span>',
      ok: '<span class="font-code-serial text-[9px] text-slate-400 tracking-widest uppercase">CANAL 03 // OK</span>',
      pause: '<span class="font-code-serial text-[9px] text-slate-400 tracking-widest uppercase">STANDBY // T-HOLD</span>' }[mode];
    var waiting = paused ? '<div class="relative z-15 flex items-center justify-center gap-2 pb-1"><div class="h-[1px] w-6 bg-gradient-to-r from-transparent to-amber-400/60"></div><span class="font-code-serial text-[10px] font-extrabold text-amber-300 tracking-widest uppercase flex items-center gap-1 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30"><span class="material-symbols-outlined text-[12px] animate-spin">sync</span><span id="zt-wait"></span></span><div class="h-[1px] w-6 bg-gradient-to-l from-transparent to-amber-400/60"></div></div>' : "";
    var tele =
      '<section class="rugged-chassis rounded-xl p-2.5 mt-0.5' + (mode === "err" ? " border border-[#522020]" : "") + '">' + screws("screw-rot-1", "screw-rot-2", "screw-rot-3", "screw-rot-4") +
      '<div class="px-4 flex items-center justify-between"><div class="flex items-center gap-2">' + head + '</div>' + chan + '</div>' +
      '<div class="relative mt-1.5 mx-0.5 p-2 rounded-lg bezel-screen-recess overflow-hidden"><div class="polycarbonate-screen-glare' + (mode === "ok" ? " glare-green" : "") + ' absolute inset-0 pointer-events-none z-20"></div>' +
      (paused ? '<div class="pause-scanline-veil absolute inset-0 pointer-events-none z-10"></div>' : "") +
      '<svg class="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-10" preserveAspectRatio="none"><line stroke="#ffffff" stroke-width="0.75" x1="10%" x2="35%" y1="15%" y2="85%"></line><line stroke="#ffffff" stroke-width="0.5" x1="70%" x2="90%" y1="18%" y2="72%"></line></svg>' +
      waiting +
      '<div class="flex items-baseline justify-center relative z-15 py-0.5"><div class="font-display-timer text-[46px] leading-none font-bold tracking-wider transition-colors duration-300" id="chrono-display">00:00</div><span class="ml-2 font-code-serial text-[16px] font-bold tracking-widest transition-colors duration-300" id="chrono-ms">.00</span>' +
      (paused ? '<span class="ml-2.5 px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-[8px] font-code-serial text-slate-400 uppercase tracking-widest">FIGÉ</span>' : "") + '</div>' +
      '<div class="flex items-center justify-center gap-1.5 relative z-15 pb-1">' + chips + '</div>' +
      '<div class="mt-1 pt-1 border-t border-[#182029] grid grid-cols-2 gap-2 items-center relative z-15">' +
      '<div class="flex flex-col gap-0.5"><div class="flex items-center gap-1"><span class="material-symbols-outlined text-error text-[12px]' + (mode === "err" ? " animate-pulse" : "") + '">warning</span><span class="font-label-sm text-[8px] font-bold tracking-wider text-error uppercase">ERREURS ' + g.errors + '/3</span></div><div class="flex items-center gap-1.5">' + diodes + '</div></div>' +
      '<div class="flex flex-col items-end gap-0.5"><div class="flex items-center gap-1 ' + (mode === "ok" ? "text-[#00ffaa]" : "text-secondary") + '"><span class="font-label-sm text-[8px] font-bold tracking-wider uppercase">MODULES VALIDES ' + solved + '/3</span><span class="material-symbols-outlined text-[12px]">' + (mode === "ok" ? "check_circle" : "grid_view") + '</span></div><div class="flex items-center gap-1.5 w-24 h-3.5 bg-[#0e1216] p-0.5 rounded border border-[#28323d] shadow-inner">' + crans + '</div></div>' +
      '</div></div></section>';

    var errBanner = showErr
      ? '<aside class="relative z-30 flex items-center justify-between px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#3e0b0b] via-[#521010] to-[#3e0b0b] border border-[#ff3333]/80 shadow-[0_0_18px_rgba(255,51,51,0.45)]"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-[#ff4d4d] text-[20px] animate-bounce">warning</span><div class="flex flex-col"><span class="font-label-sm text-[11px] font-black text-white tracking-widest uppercase flex items-center gap-1.5">ERREUR ' + errFlash.n + '/3' + (errFlash.penalty ? ' <span class="text-[#ffb3ad] font-code-serial font-bold">— PÉNALITÉ APPLIQUÉE</span>' : "") + '</span><span class="font-code-serial text-[8.5px] text-[#ffc2bd] tracking-wider uppercase">CIRCUIT COURT-CIRCUIT DÉTECTÉ</span></div></div>' + (errFlash.penalty ? '<div class="px-2 py-0.5 rounded bg-[#1f0505] border border-[#ff4d4d] text-right"><span class="font-code-serial text-[13px] font-black text-[#ff3333] tracking-wider drop-shadow-[0_0_8px_rgba(255,51,51,0.8)]">−' + errFlash.penalty + ' s</span></div>' : "") + '</aside>'
      : "";
    var alertStrip = showAlert
      ? '<div class="time-alert-strip rounded-lg px-2.5 py-1 flex items-center justify-between mx-0.5"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-[15px] animate-pulse">timer</span><span class="font-label-sm text-[8.5px] font-bold tracking-widest text-[#ffd3a0] uppercase">ALERTE SEUIL // TEMPS CRITIQUE :</span></div><div class="flex items-center gap-1.5"><span class="px-2 py-0.5 rounded bg-[#451208] border border-[#ff6e40] font-code-serial text-[11px] font-black text-[#ffbe73] tracking-widest shadow-[0_0_8px_rgba(255,110,64,0.6)]">' + fmt(alertFlash.T * 1000) + '</span><span class="font-code-serial text-[8.5px] text-slate-300 font-bold uppercase tracking-wider">RESTANT</span></div></div>'
      : "";

    // --- module de câblage
    var locked = paused || isSolved;
    var order = ORDER[n] || ORDER[5], cutNow = (lastCut && lastCut.pos === panel.pos) ? lastCut.wire : 0;
    var shadows = "", wiresSvg = "", leftCol = "", rightCol = "";
    var parts = geom.map(function (gm) { return wireParts(gm); });
    panel.wires.forEach(function (color, idx) {
      var num = idx + 1, isCut = panel.cut.indexOf(num) !== -1, isSel = selectedWire === num;
      var P = parts[idx];
      shadows += '<path d="' + P.full + '" fill="none" filter="url(#cavity-shadow)" stroke="#000000" stroke-linecap="round" stroke-width="16"' + (isCut ? ' opacity="0.25"' : "") + '></path>';
      var tag = locked ? "div" : "button", btnAttrs = locked ? "" : ' type="button" data-wire="' + num + '"';
      var cls = locked ? "flex items-center gap-1" + (isCut ? " opacity-40" : "") : "selector-wire-btn" + (isCut ? " is-cut" : "") + " flex items-center gap-1 " + (isCut ? "cursor-not-allowed" : "cursor-pointer") + " group";
      var dis = (!locked && isCut) ? " disabled" : "";
      leftCol += '<' + tag + ' class="' + cls + '"' + btnAttrs + dis + '><div class="' + clampCls(isCut, isSel, locked) + '">' + num + '</div>' + lugsL(isCut) + '</' + tag + '>';
      rightCol += '<' + tag + ' class="' + cls + '"' + btnAttrs + dis + '>' + lugsR(isCut) + '<div class="' + clampCls(isCut, isSel, locked) + '">' + num + '</div></' + tag + '>';
    });
    order.forEach(function (o, zi) {
      if (typeof o === "string") { if (n === 5) wiresSvg += '<path d="' + XSHADOW[o] + '" fill="none" filter="url(#crossing-shadow)" opacity="0.8" pointer-events="none" stroke="#000" stroke-linecap="round" stroke-width="14"></path>'; return; }
      var idx = o - 1, color = panel.wires[idx], P = parts[idx], isCut = panel.cut.indexOf(o) !== -1, isSel = selectedWire === o;
      var grad = "url(#grad-wire-" + color + ")", base = BASE[color] || "#10141a", spec = color === "black" ? "#cbd5e1" : "#ffffff";
      var top = zi === order.length - 1;
      if (isCut) {
        var anim = cutNow === o;
        var cu = function (x, y, dir) { return "M " + r1(x) + "," + r1(y - 1) + " L " + r1(x + dir * 13) + "," + r1(y - 7) + " M " + r1(x + dir) + "," + r1(y) + " L " + r1(x + dir * 16) + "," + r1(y) + " M " + r1(x) + "," + r1(y + 1) + " L " + r1(x + dir * 12) + "," + r1(y + 7); };
        wiresSvg += '<g class="opacity-80" data-wire-group="' + o + '" pointer-events="none">' +
          '<g' + (anim ? ' class="cut-recoil-left"' : "") + '><path d="' + P.left + '" fill="none" stroke="#10141a" stroke-linecap="round" stroke-width="14.5"></path><path d="' + P.left + '" fill="none" stroke="' + grad + '" stroke-linecap="round" stroke-width="13"></path><path transform="translate(0,-2.5)" d="' + P.left + '" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="2" opacity="0.8"></path><path d="' + cu(P.ex, P.ey, 1) + '" fill="none" stroke="url(#copper-wires)" stroke-linecap="round" stroke-width="2.2"></path></g>' +
          '<g' + (anim ? ' class="cut-recoil-right"' : "") + '><path d="' + cu(P.sx, P.sy, -1) + '" fill="none" stroke="url(#copper-wires)" stroke-linecap="round" stroke-width="2.2"></path><path d="' + P.right + '" fill="none" stroke="#10141a" stroke-linecap="round" stroke-width="14.5"></path><path d="' + P.right + '" fill="none" stroke="' + grad + '" stroke-linecap="round" stroke-width="13"></path><path transform="translate(0,-2.5)" d="' + P.right + '" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="2" opacity="0.8"></path></g></g>';
      } else {
        wiresSvg += '<g class="' + (locked ? "" : "interactive-wire-group") + (isSel ? " wire-selected-glow" : "") + '"' + (locked ? ' pointer-events="none"' : ' data-wire="' + o + '"') + '>' +
          (top ? '<path d="' + P.full + '" fill="none" filter="url(#crossing-shadow)" opacity="0.92" pointer-events="none" stroke="#000000" stroke-linecap="round" stroke-width="15"></path>' : "") +
          '<path d="' + P.full + '" fill="none" stroke="' + base + '" stroke-linecap="round" stroke-width="15"></path>' +
          '<path class="wire-body-core" d="' + P.full + '" fill="none" stroke="' + grad + '" stroke-linecap="round" stroke-width="13.5"></path>' +
          '<path transform="translate(0,-2.5)" d="' + P.full + '" fill="none" opacity="0.82" stroke="' + spec + '" stroke-linecap="round" stroke-width="2.2"></path>' +
          '<path transform="translate(0,-3)" d="' + P.full + '" fill="none" opacity="0.95" stroke="#ffffff" stroke-linecap="round" stroke-width="0.9"></path></g>';
      }
    });

    var modHead = isSolved
      ? '<div class="px-4 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-[#10291f] border border-[#00ffaa]/60 flex items-center justify-center text-[#00ffaa] shadow-[0_0_8px_rgba(0,255,170,0.35)]"><span class="material-symbols-outlined text-[17px] font-bold">check</span></div><div class="flex flex-col"><span class="font-label-sm text-[7.5px] tracking-widest text-[#00ffaa] uppercase font-bold">MODULE ' + n + ' FILS // RÉSOLU ✓</span><span class="font-headline-sm text-[12px] font-bold text-white tracking-wide">CORPS DE LIAISON PRINCIPAL</span></div></div>' +
        '<div class="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#122e22] via-[#1a3d2e] to-[#122e22] border border-[#00ffaa]/70 shadow-[0_0_12px_rgba(0,255,170,0.35)] flex items-center gap-1.5"><span class="material-symbols-outlined text-[#00ffaa] text-[14px] font-bold">verified</span><div class="flex flex-col items-end"><span class="font-code-serial text-[9.5px] font-black tracking-wider text-[#00ffaa] leading-tight">RÉSOLU ✓</span><span class="font-code-serial text-[7px] text-[#71cf9e] tracking-widest uppercase" id="zt-serial"></span></div></div></div>'
      : '<div class="px-4 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-[#20262e] border border-[#3b4552] flex items-center justify-center ' + (paused ? "text-secondary" : "text-primary") + ' shadow-inner"><span class="material-symbols-outlined text-[16px]">cable</span></div><div class="flex flex-col"><span class="font-label-sm text-[7.5px] tracking-widest text-slate-300 uppercase">MODULE ' + n + ' FILS // HARNESS</span><span class="font-headline-sm text-[12px] font-bold text-white tracking-wide">CORPS DE LIAISON PRINCIPAL</span></div></div>' +
        '<div class="px-2 py-0.5 rounded bg-gradient-to-r from-[#232931] via-[#2f3742] to-[#232931] border border-[#444f5c] shadow-sm flex items-center gap-1.5"><div class="flex flex-col items-end"><span class="font-label-sm text-[6.5px] text-slate-400 uppercase tracking-widest leading-none">SÉRIE / LOT</span><span class="font-code-serial text-[10.5px] font-black tracking-widest text-[#ffdcbf] leading-tight" id="zt-serial"></span></div></div></div>';
    var resolvedBar = isSolved ? '<div class="absolute top-2 inset-x-12 z-40 resolved-badge-bar rounded-md px-3 py-1 flex items-center justify-between pointer-events-none"><div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa] animate-ping"></span><span class="font-code-serial text-[9px] font-bold text-[#00ffaa] tracking-widest uppercase">CIRCUIT DÉSAMORCÉ AVEC SUCCÈS</span></div><span class="font-code-serial text-[8.5px] text-[#a4e6c3] tracking-widest font-semibold">STATUS: SECURE</span></div>' : "";
    var veil = paused ? '<div class="absolute inset-0 pointer-events-none z-25 bg-[#090d12]/30 backdrop-contrast-90"></div>' : "";
    var colCls = locked ? "flex flex-col justify-between py-1 z-30 pointer-events-none opacity-85" : "flex flex-col justify-between py-1 z-30 pointer-events-auto";
    var module =
      '<section class="rugged-chassis rounded-xl p-2.5 flex flex-col gap-1.5 relative min-h-0 flex-1">' + screws("screw-rot-4", "screw-rot-3", "screw-rot-2", "screw-rot-1") + modHead +
      '<div class="relative bay-chassis-inner rounded-lg p-1.5 flex items-stretch justify-between overflow-hidden" id="harness-chamber">' + veil +
      '<div class="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between py-5 px-12"><div class="h-0.5 border-b border-dashed border-slate-400"></div><div class="h-0.5 border-b border-dashed border-slate-400"></div><div class="h-0.5 border-b border-dashed border-slate-400"></div><div class="h-0.5 border-b border-dashed border-slate-400"></div></div>' + resolvedBar +
      '<div class="' + colCls + '">' + leftCol + '</div>' +
      '<div class="flex-1 mx-1 relative overflow-hidden" id="svg-wire-zone"><svg class="w-full h-full" id="wires-canvas" preserveAspectRatio="none" viewBox="0 0 320 256">' + DEFS +
      '<g opacity="0.95" pointer-events="none">' + shadows + '</g>' + wiresSvg + '</svg></div>' +
      '<div class="' + colCls + '">' + rightCol + '</div></div></section>';

    // --- commandes
    var cmd;
    if (paused) {
      cmd = '<section class="mt-0.5 mb-1 flex flex-col gap-1.5"><div class="flex items-center justify-between px-2 font-code-serial text-[9.5px]"><span class="flex items-center gap-1.5 text-slate-400"><span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span class="uppercase tracking-wider">COMMANDES SUSPENDUES</span></span><span class="font-bold text-amber-400/90 tracking-wider uppercase">PAUSE TACTIQUE ACTIVE</span></div>' +
        (paused.can_abandon ? '<button id="zt-abort" class="abort-btn-tactical w-full min-h-[44px] rounded-lg text-[#ff9999] hover:text-white font-headline-sm text-[13px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 select-none cursor-pointer transition-colors shadow-lg group" type="button"><span class="material-symbols-outlined text-[19px] text-[#ff5c5c] group-hover:scale-110 transition-transform">dangerous</span><span>ABANDONNER LA MISSION</span><span class="px-1.5 py-0.5 rounded text-[8px] font-code-serial bg-[#4a1417] text-[#ffb4ab] border border-[#7f2328]">CONFIRMER</span></button>' : "") +
        '<div class="p-1 rounded-xl bg-gradient-to-b from-[#242930] to-[#181c22] border border-[#333a44] shadow-md relative opacity-45"><button class="push-trigger-suspended w-full min-h-[44px] rounded-lg text-slate-500 font-headline-sm text-[13.5px] font-black tracking-widest uppercase flex items-center justify-center gap-2 select-none cursor-not-allowed" disabled type="button"><span class="material-symbols-outlined text-[20px]">content_cut</span><span>ACTION NEUTRALISÉE</span><span class="material-symbols-outlined text-[16px]">lock</span></button></div></section>';
    } else if (isSolved) {
      cmd = '<section class="mt-0.5 mb-1 flex flex-col gap-1"><div class="flex items-center justify-between px-2 font-code-serial text-[9.5px]"><span class="flex items-center gap-1.5 text-[#00ffaa]"><span class="w-2 h-2 rounded-full bg-[#00ffaa] shadow-[0_0_8px_#00ffaa]"></span><span class="uppercase tracking-wider font-bold">MODULE SÉCURISÉ</span></span><span class="font-bold text-[#00ffaa] tracking-wider uppercase flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">lock</span>SÉCURITÉ ENGAGÉE</span></div>' +
        '<div class="p-1 rounded-xl bg-gradient-to-b from-[#222930] to-[#161b21] border border-[#323b46] shadow-xl relative"><button class="push-trigger-secured w-full min-h-[48px] rounded-lg text-slate-400 font-headline-sm text-[13.5px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 select-none cursor-not-allowed opacity-80" disabled type="button"><span class="material-symbols-outlined text-[#00ffaa] text-[20px]">check_circle</span><span class="text-slate-300">MODULE SÉCURISÉ — DÉSAMORÇAGE EFFECTIF</span><span class="material-symbols-outlined text-slate-500 text-[18px]">lock</span></button></div></section>';
    } else {
      cmd = '<section class="mt-0.5 mb-1 flex flex-col gap-1"><div class="flex items-center justify-between px-2 font-code-serial text-[9.5px]"><span class="flex items-center gap-1.5 text-secondary"><span class="w-2 h-2 rounded-full ' + (selectedWire ? "bg-primary shadow-[0_0_8px_#ff9f32] animate-pulse" : "bg-slate-500") + ' transition-colors"></span><span class="uppercase tracking-wider">PINCE HYDRAULIQUE PRÊTE</span></span><span class="font-bold ' + (selectedWire ? "text-primary" : "text-slate-400") + ' tracking-wider uppercase transition-colors" id="zt-target"></span></div>' +
        '<div class="p-1 rounded-xl bg-gradient-to-b from-[#2a3038] to-[#1c2127] border border-[#3b4450] shadow-xl relative"><button class="push-trigger-heavy w-full min-h-[48px] rounded-lg text-[#261100] font-headline-sm text-[14.5px] font-black tracking-widest uppercase flex items-center justify-center gap-2 select-none transition-all duration-150' + (selectedWire ? "" : " opacity-40 pointer-events-none grayscale cursor-not-allowed") + '"' + (selectedWire ? "" : " disabled") + ' id="cut-wire-button" type="button"><span class="material-symbols-outlined text-[22px]">content_cut</span><span>COUPER CE FIL</span><span class="material-symbols-outlined text-[18px]">bolt</span></button></div></section>';
    }

    app.innerHTML =
      ((mode === "err" || (!paused && remNow <= 30000)) ? '<div class="alarm-vignette-overlay fixed inset-0 pointer-events-none z-40"' + (remNow <= 30000 && !showErr ? ' style="animation-duration:.6s"' : "") + '></div>' : "") +
      '<header class="fixed top-0 left-0 right-0 z-50 pt-safe bg-[#242930]/95 border-b border-[#3b434e] backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.6)]"><div class="h-12 px-3 flex items-center justify-between max-w-md mx-auto">' +
      '<div class="flex items-center gap-2"><div class="flex flex-col"><div class="flex items-center gap-1.5">' + topLed + '</div><span class="font-headline-sm text-[14px] font-bold tracking-tight text-white flex items-center gap-1.5">BAIE CÂBLAGE <span class="text-[10px] text-secondary font-code-serial font-normal">[MOD-0' + (activePanel + 1) + ']</span></span></div></div>' +
      '<div class="flex items-center gap-2">' + badge + '</div></div></header>' +
      '<main class="w-full max-w-md mx-auto px-2.5 pb-safe flex flex-col justify-between gap-1 overflow-hidden relative z-30" id="tactical-rack">' + errBanner + tele + module + cmd + '</main>';

    // Valeurs dynamiques (texte pur)
    var se = document.getElementById("zt-serial"); if (se) se.textContent = panel.serial;
    var tg = document.getElementById("zt-target"); if (tg) tg.textContent = selectedWire ? "CIBLE ENGAGÉE : FIL #" + selectedWire : "AUCUNE CIBLE ENGAGÉE";
    var wt = document.getElementById("zt-wait"); if (wt) wt.textContent = "EN ATTENTE DE " + String(paused.pseudo || "").toUpperCase();
    lastCut = null;

    // Interactions
    Array.prototype.forEach.call(app.querySelectorAll("[data-panel]"), function (b) {
      b.onclick = function () { activePanel = +b.getAttribute("data-panel"); selectedWire = null; render(); };
    });
    Array.prototype.forEach.call(app.querySelectorAll("[data-wire]"), function (b) {
      var onSel = function () { var w = +b.getAttribute("data-wire"); selectedWire = (selectedWire === w) ? null : w; render(); };
      if (b.tagName === "g" || b.namespaceURI === "http://www.w3.org/2000/svg") b.addEventListener("click", onSel); else b.onclick = onSel;
    });
    var ab = document.getElementById("zt-abort");
    if (ab) ab.onclick = function () {
      if (!window.confirm("ATTENTION : voulez-vous vraiment abandonner la mission de déminage en cours ?")) return;
      sb.rpc("zt_abandon", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
    };

    // Chronomètre
    var timerMain = document.getElementById("chrono-display"), timerMs = document.getElementById("chrono-ms");
    function paint(ms) {
      var f = fmtH(ms); timerMain.textContent = f[0]; timerMs.textContent = f[1];
      var cls = paused ? "timer-neon-paused" : (ms > 60000 ? "timer-neon-green" : (ms > 15000 ? "timer-neon-warning" : "timer-neon-alert"));
      [timerMain, timerMs].forEach(function (e) {
        if (e.getAttribute("data-t") !== cls) { e.classList.remove("timer-neon-green", "timer-neon-warning", "timer-neon-alert", "timer-neon-paused"); e.classList.add(cls); e.setAttribute("data-t", cls); }
      });
    }
    stopTimer();
    var remInit = (endsAt - (now + offsetMs)) / 1000;
    paint(remNow);
    if (!alertInit) { alertInit = true; ALERTS.forEach(function (T) { if (remInit <= T) alerted[T] = true; }); }
    if (!paused) timerId = setInterval(function () {
      var ms = endsAt - (Date.now() + offsetMs), rem = ms / 1000;
      paint(ms);
      var fire = null;
      ALERTS.forEach(function (T) { if (rem <= T && rem > 0 && !alerted[T]) { alerted[T] = true; fire = T; } });
      if (fire !== null) { buzz([150, 80, 150]); window.ZT_FX.beep(fire <= 10 ? 1200 : 880); render(); }
      if (rem <= 0 && !tickSent) {
        tickSent = true;
        sb.rpc("zt_tick", { p_code: session.code, p_token: session.token }).then(function (r) { if (!r.error) { view = r.data; render(); } });
      }
    }, 50);

    // Coupe
    var btn = document.getElementById("cut-wire-button");
    if (btn) btn.onclick = function () {
      if (cutting || !selectedWire || view.paused) return;
      cutting = true;
      var w = selectedWire, P = parts[w - 1];
      var zone = document.getElementById("svg-wire-zone").getBoundingClientRect();
      window.ZT_FX.cutSound(); buzz([24, 15, 45]);
      window.ZT_FX.sparksAt(zone.left + (P.cx / 320) * zone.width, zone.top + (P.cy / 256) * zone.height);
      lastCut = { pos: panel.pos, wire: w };
      sb.rpc("zt_cut", { p_code: session.code, p_token: session.token, p_action: uuid(), p_pos: panel.pos, p_wire: w }).then(function (r) {
        cutting = false;
        if (r.error) { lastCut = null; fail(r.error); return render(); }
        selectedWire = null; view = r.data; render();
      });
    };
  }

  function renderTechnician() {
    stopTimer();
    var m = view.manual;
    if (view.paused) app.appendChild(pauseCard());
    function list(items, cls) {
      var ol = el("ol", { class: cls || "rules" });
      items.forEach(function (x) {
        ol.appendChild(typeof x === "string" ? el("li", { text: x }) : el("li", {}, [el("b", { text: x.n + "  " }), document.createTextNode(x.t)]));
      });
      return ol;
    }
    app.appendChild(el("div", { class: "card" }, [el("h2", { text: "Manuel Fils" }), el("div", { class: "muted", text: m.rule_order })]));
    app.appendChild(el("div", { class: "card" }, [el("h3", { text: "1. Lire un panneau" }), list(m.read)]));
    app.appendChild(el("div", { class: "row" }, ["w3", "w4", "w5"].map(function (k) {
      return el("button", { class: manualTab === k ? "on" : "", text: k.slice(1) + " fils", onclick: function () { manualTab = k; render(); } });
    })));
    app.appendChild(el("div", { class: "card" }, [el("h3", { text: "2. Module " + manualTab.slice(1) + " fils" }), list(m[manualTab])]));
    app.appendChild(el("div", { class: "card" }, [el("h3", { text: "3. Lexique" }), list(m.lexicon, "lex")]));
    app.appendChild(el("div", { class: "card" }, [el("h3", { text: "4. Erreurs" }), el("div", { text: m.penalties })]));
  }

  function renderPlaying() {
    clear();
    if (view.me.role === "operator" && view.game) return renderOperator();
    if (view.me.role === "technician" && view.manual) return renderTechnician();
    app.appendChild(el("div", { class: "card" }, [el("div", { class: "muted", text: "Chargement…" })]));
  }

  function renderEnded() {
    stopTimer(); clear();
    var e = view.end, win = e.outcome === "defused";
    var lines = [];
    if (e.outcome === "abandoned") {
      app.appendChild(el("div", { class: "card end boom" }, [
        el("div", { class: "code", style: "font-size:30px;letter-spacing:.03em;color:#FF9F32", text: "PARTIE ABANDONNÉE" })
      ]));
      app.appendChild(el("button", { class: "primary", text: "Rejouer", onclick: function () {
        sb.rpc("zt_replay", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; resetGameFlags(); selectedWire = null; activePanel = 0; render(); });
      } }));
      app.appendChild(el("button", { text: "Quitter", onclick: function () { forget(); render(); } }));
      return;
    }
    if (win) {
      if (typeof e.remaining_ms === "number") lines.push("Temps restant : " + fmt(e.remaining_ms));
      lines.push("Erreurs : " + e.errors + "/3");
    } else {
      lines.push(e.cause === "errors" ? "Cause : trois erreurs" : "Cause : temps écoulé");
      lines.push("Panneaux résolus : " + e.solved + "/" + e.total);
    }
    app.appendChild(el("div", { class: "card end " + (win ? "win" : "boom") }, [
      el("div", { class: "code", style: "font-size:34px;letter-spacing:.05em;color:" + (win ? "#42C97A" : "#F04444"), text: win ? "BOMBE DÉSAMORCÉE" : "EXPLOSION" })
    ].concat(lines.map(function (l) { return el("div", { class: "muted", style: "font-size:18px", text: l }); }))));
    app.appendChild(el("button", { class: "primary", text: "Rejouer", onclick: function () {
      sb.rpc("zt_replay", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; resetGameFlags(); selectedWire = null; activePanel = 0; render(); });
    } }));
    app.appendChild(el("button", { text: "Quitter", onclick: function () { forget(); render(); } }));
  }

  var holdUntil = 0, holdTimer = null;
  function hold(ms) { holdUntil = Date.now() + ms; }
  function render() {
    var wait = holdUntil - Date.now();
    if (wait > 0) {
      if (!holdTimer) holdTimer = setTimeout(function () { holdTimer = null; render(); }, wait + 10);
      return;
    }
    doRender();
  }
  function soloChip() {
    var old = document.getElementById("zt-solo"); if (old) old.remove();
    if (!(session && view && view.solo && view.status === "playing" && view.me)) return;
    var other = view.me.role === "operator" ? "technician" : "operator";
    var b = document.createElement("button");
    b.id = "zt-solo"; b.type = "button";
    b.textContent = "TEST ⇄ " + (other === "operator" ? "voir opérateur" : "voir technicien");
    b.style.cssText = "position:fixed;right:8px;top:calc(60px + env(safe-area-inset-top,0px));z-index:90;min-height:0;padding:5px 9px;border-radius:6px;border:1px solid #ff9f32;background:#1a1e23ee;color:#ff9f32;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase";
    b.onclick = function () {
      sb.rpc("zt_solo_role", { p_code: session.code, p_token: session.token, p_role: other }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
    };
    document.body.appendChild(b);
  }
  document.addEventListener("touchmove", function (e) { if (document.body.classList.contains("op")) e.preventDefault(); }, { passive: false });
  function doRender() {
    soloChip();
    var isOp = !!(session && view && view.status === "playing" && view.me && view.me.role === "operator" && view.game);
    document.body.classList.toggle("op", isOp);
    document.body.classList.toggle("bg-industrial-bay", isOp);
    if (!session || !view) { stopTimer(); return renderHome(); }
    if (view.status === "lobby") { stopTimer(); resetGameFlags(); return renderLobby(); }
    if (view.status === "ended" || view.status === "abandoned") return renderEnded();
    return renderPlaying();
  }

  session = load();
  if (session) { subscribe(); startHeartbeat(); } 
  render();
})();
