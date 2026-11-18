(function () {
  "use strict";
  var cfg = window.ZT_CONFIG;
  var sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");
  var KEY = "zt_session";
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
    abandon_indisponible: "Abandon impossible pour le moment."
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
    } else {
      app.appendChild(el("div", { class: "muted", text: "Le créateur choisit les rôles et lance la partie." }));
    }
    app.appendChild(el("button", { text: "Quitter", onclick: function () { forget(); render(); } }));
  }

  var COLORS = { red: "Rouge", blue: "Bleu", yellow: "Jaune", white: "Blanc", black: "Noir" };
  var activePanel = 0, selectedWire = null, manualTab = "w4";
  var timerId = null, offsetMs = 0;
  var seenEvent, alerted = {}, alertInit = false, tickSent = false, cutting = false;
  var ALERTS = [120, 60, 30, 10];
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16);
    });
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function resetGameFlags() { seenEvent = undefined; alerted = {}; alertInit = false; tickSent = false; }

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

  // Dégradés des câbles (repris de la maquette OP03 Stitch).
  var GRAD = {"cable-red": [["0%", "#7f1d1d"], ["25%", "#dc2626"], ["50%", "#f87171"], ["75%", "#b91c1c"], ["100%", "#450a0a"]], "cable-white": [["0%", "#94a3b8"], ["35%", "#e2e8f0"], ["55%", "#ffffff"], ["80%", "#cbd5e1"], ["100%", "#64748b"]], "cable-yellow": [["0%", "#854d0e"], ["25%", "#eab308"], ["50%", "#fef08a"], ["75%", "#ca8a04"], ["100%", "#713f12"]], "cable-blue": [["0%", "#1e3a8a"], ["25%", "#2563eb"], ["50%", "#93c5fd"], ["75%", "#1d4ed8"], ["100%", "#172554"]], "cable-black": [["0%", "#0f172a"], ["35%", "#334155"], ["50%", "#64748b"], ["70%", "#1e293b"], ["100%", "#020617"]]};
  var GRADID = { red: "cable-red", blue: "cable-blue", yellow: "cable-yellow", white: "cable-white", black: "cable-black" };
  function gradDefs() {
    var h = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>';
    Object.keys(GRAD).forEach(function (id) {
      h += '<linearGradient id="' + id + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
        GRAD[id].map(function (st) { return '<stop offset="' + st[0] + '" stop-color="' + st[1] + '"/>'; }).join("") + '</linearGradient>';
    });
    return h + "</defs></svg>";
  }
  var HL = { red: 0.4, blue: 0.65, yellow: 0.55, white: 0.7, black: 0.25 };
  var BADGE_OFF = "wire-badge w-8 h-8 rounded bg-[#172330] border border-[#2b3e52] text-slate-200 font-code-serial font-bold text-[13px] flex items-center justify-center shadow-inner";
  var BADGE_ON = "wire-badge w-8 h-8 rounded bg-gradient-to-br from-[#ffb872] to-[#ff9f32] border border-[#ffdcbf] text-[#3d1e00] font-code-serial font-black text-[14px] flex items-center justify-center shadow-md";
  var BADGE_CUT = "w-8 h-8 rounded bg-[#101821] border border-[#1b2633] text-slate-500 font-code-serial font-bold text-[13px] flex items-center justify-center line-through";

  function wireRowHtml(n, color, isCut, isSel) {
    var gid = GRADID[color], hl = HL[color];
    if (isCut) {
      return '' +
      '<div class="flex items-center gap-1.5 z-10"><div class="' + BADGE_CUT + '">' + n + '</div>' +
      '<div class="flex flex-col items-center gap-1 py-0.5 opacity-40"><span class="w-2 h-1 rounded-sm bg-[#88703a]"></span><span class="w-2.5 h-1.5 rounded-sm bg-[#192430]"></span></div></div>' +
      '<div class="wire-conduit flex-1 mx-2 h-8 bg-[#05080c] rounded border border-[#101720] px-2 flex items-center justify-between relative overflow-hidden shadow-inner">' +
      '<div class="w-[36%] h-3 relative flex items-center justify-end"><svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 12"><path d="M 0,1 L 90,1 Q 95,6 90,11 L 0,11 Z" fill="url(#' + gid + ')"></path><line stroke="rgba(255,255,255,0.7)" stroke-width="1" x1="0" x2="88" y1="3" y2="3"></line></svg><span class="w-2 h-1.5 bg-[#d97706] rounded-r -mr-1 shadow-sm"></span></div>' +
      '<div class="flex flex-col items-center justify-center px-1"><span class="material-symbols-outlined text-secondary text-[15px]">content_cut</span><span class="font-label-sm text-[8px] font-bold text-slate-400 uppercase tracking-tight">SECTIONNÉ</span></div>' +
      '<div class="w-[36%] h-3 relative flex items-center justify-start"><span class="w-2 h-1.5 bg-[#d97706] rounded-l -ml-1 shadow-sm"></span><svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 12"><path d="M 10,1 L 100,1 L 100,11 L 10,11 Q 5,6 10,1 Z" fill="url(#' + gid + ')"></path><line stroke="rgba(255,255,255,0.7)" stroke-width="1" x1="12" x2="100" y1="3" y2="3"></line></svg></div></div>' +
      '<div class="flex items-center gap-1.5 z-10"><div class="flex flex-col items-center gap-1 py-0.5 opacity-40"><span class="w-2.5 h-1.5 rounded-sm bg-[#192430]"></span><span class="w-2 h-1 rounded-sm bg-[#88703a]"></span></div><div class="' + BADGE_CUT + '">' + n + '</div></div>';
    }
    var badge = isSel ? BADGE_ON : BADGE_OFF;
    return '' +
      '<div class="flex items-center gap-1.5 z-10 pointer-events-none"><div class="' + badge + '">' + n + '</div>' +
      '<div class="flex flex-col items-center gap-1 py-0.5"><span class="w-2 h-1 rounded-sm bg-[#c8923a]"></span><span class="w-2.5 h-1.5 rounded-sm bg-[#223344] border border-[#31485e]"></span></div></div>' +
      '<div class="wire-conduit flex-1 mx-2 h-8 bg-[#060a0e] rounded border border-[#131d27] px-1 flex items-center relative overflow-hidden shadow-inner">' +
      '<svg class="wire-svg w-full h-4" preserveAspectRatio="none" viewBox="0 0 300 16"><rect fill="url(#' + gid + ')" height="12" rx="6" width="300" x="0" y="2"></rect><line stroke="rgba(255,255,255,' + hl + ')" stroke-width="1.2" x1="0" x2="300" y1="5" y2="5"></line></svg>' +
      (isSel ? '<div class="absolute inset-0 flex items-center justify-center pointer-events-none"><span class="px-2 py-0.5 rounded bg-[#0b131c]/95 border border-[#ff9f32]/60 text-primary-container font-code-serial text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-md"><span class="material-symbols-outlined text-[11px] animate-pulse">adjust</span>CIBLE ACTIVE</span></div>' : '') +
      '</div>' +
      '<div class="flex items-center gap-1.5 z-10 pointer-events-none"><div class="flex flex-col items-center gap-1 py-0.5"><span class="w-2.5 h-1.5 rounded-sm bg-[#223344] border border-[#31485e]"></span><span class="w-2 h-1 rounded-sm bg-[#c8923a]"></span></div><div class="' + badge + '">' + n + '</div></div>';
  }

  function renderOperator() {
    var g = view.game;
    offsetMs = new Date(g.server_now).getTime() - Date.now();
    var endsAt = new Date(g.ends_at).getTime();
    var solved = g.panels.filter(function (p) { return p.state === "solved"; }).length;
    var panel = g.panels[activePanel] || g.panels[0];
    var paused = view.paused;
    var nWires = panel.wires.length;

    var diodes = "";
    for (var i = 0; i < 3; i++) diodes += i < g.errors
      ? '<div class="w-6 h-6 rounded bg-[#3b0b0b] border border-[#ff4d4d] flex items-center justify-center glow-red"><span class="material-symbols-outlined text-[#ffffff] text-[13px] font-black">priority_high</span></div>'
      : '<div class="w-6 h-6 rounded bg-[#090e13] border border-[#1b2633] flex items-center justify-center shadow-inner"><span class="w-1.5 h-1.5 rounded-full bg-[#18232e]"></span></div>';
    var crans = "";
    for (var k = 0; k < 3; k++) crans += k < solved
      ? '<div class="flex-1 h-full rounded-sm bg-gradient-to-r from-[#ff9f32] to-[#ffb872] shadow-[0_0_8px_rgba(255,159,50,0.6)]"></div>'
      : '<div class="flex-1 h-full rounded-sm bg-[#121c26]"></div>';
    var screws = '<span class="screw-torx absolute top-2 left-2 w-3 h-3 rounded-full"></span><span class="screw-torx absolute top-2 right-2 w-3 h-3 rounded-full"></span><span class="screw-torx absolute bottom-2 left-2 w-3 h-3 rounded-full"></span><span class="screw-torx absolute bottom-2 right-2 w-3 h-3 rounded-full"></span>';

    app.innerHTML = gradDefs() +
    '<header class="fixed top-0 left-0 right-0 z-50 pt-safe bg-[#0b1118]/95 border-b border-[#1b2633] backdrop-blur-md"><div class="h-14 px-3 flex items-center justify-between max-w-md mx-auto">' +
      '<div class="flex flex-col"><div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse-soft"></span><span class="font-label-sm text-[9px] font-semibold text-primary-container uppercase tracking-wider">UNITÉ OPÉRATEUR TACTIQUE</span></div>' +
      '<span class="font-headline-sm text-[15px] font-bold tracking-tight text-white flex items-center gap-1.5">BAIE CÂBLAGE <span class="text-[10px] text-secondary font-code-serial font-normal">[MODULE ' + nWires + ' FILS]</span></span></div>' +
      '<div class="flex items-center gap-1 px-2.5 py-1 rounded bg-[#101923] border border-[#1e2d3d]"><span class="w-1.5 h-1.5 rounded-full ' + (paused ? "bg-primary-container" : "bg-[#10b981]") + '"></span><span class="font-code-serial text-[10px] text-[#9bb1c5] tracking-widest font-bold">' + (paused ? "PAUSE" : "ACTIF") + '</span></div>' +
    '</div></header>' +
    '<main class="w-full max-w-md mx-auto px-2.5 pt-16 pb-safe flex flex-col gap-2" id="tactical-rack">' +
      '<section class="relative rounded-xl bg-gradient-to-b from-[#111923] to-[#0c1219] p-3 border border-[#223242] chassis-bevel mt-1">' + screws +
        '<div class="px-3 flex items-center justify-between text-secondary"><span class="flex items-center gap-1.5 font-label-sm text-[10px] text-primary-container font-semibold tracking-wider"><span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>' + (paused ? "PARTIE EN PAUSE" : "DÉTONATION IMMINENTE") + '</span><span class="font-code-serial text-[10px] text-slate-400 tracking-widest">CANAL // LIVE</span></div>' +
        '<div class="relative mt-2 mx-1 p-2.5 rounded-lg bezel-screen overflow-hidden border border-[#000000]"><div class="glass-reflection absolute inset-0 pointer-events-none"></div>' +
          '<div class="flex items-baseline justify-center relative z-10 py-0.5"><div class="font-display-timer text-[52px] leading-none font-bold timer-green tracking-wider" id="chrono-display">00:00</div><span class="ml-2 font-code-serial text-[16px] font-bold timer-green tracking-widest" id="chrono-ms">.00</span></div>' +
          '<div class="mt-2 pt-2 border-t border-[#182635] grid grid-cols-2 gap-2 items-center relative z-10">' +
            '<div class="flex flex-col gap-1"><div class="flex items-center gap-1"><span class="material-symbols-outlined text-error text-[13px]">warning</span><span class="font-label-sm text-[9px] font-bold tracking-wider text-error uppercase">ERREURS ' + g.errors + '/3</span></div><div class="flex items-center gap-1.5">' + diodes + '</div></div>' +
            '<div class="flex flex-col items-end gap-1"><div class="flex items-center gap-1 text-secondary"><span class="font-label-sm text-[9px] font-bold tracking-wider uppercase">PANNEAUX ' + solved + '/3</span><span class="material-symbols-outlined text-[13px]">grid_view</span></div><div class="flex items-center gap-1.5 w-24 h-4 bg-[#080d12] p-0.5 rounded border border-[#182533]">' + crans + '</div></div>' +
          '</div></div></section>' +
      '<div id="zt-pause"></div>' +
      '<div class="flex gap-2" id="zt-tabs"></div>' +
      '<section class="relative rounded-xl bg-gradient-to-b from-[#111822] via-[#0d141d] to-[#0a0f16] p-3 border border-[#233345] chassis-bevel flex flex-col gap-2">' +
        '<span class="screw-torx absolute top-2 left-2 w-2.5 h-2.5 rounded-full"></span><span class="screw-torx absolute top-2 right-2 w-2.5 h-2.5 rounded-full"></span>' +
        '<div class="pt-1 px-1 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-[#16212d] border border-[#26374a] flex items-center justify-center text-primary-container shadow-inner"><span class="material-symbols-outlined text-[17px]">settings_input_component</span></div>' +
        '<div class="flex flex-col"><span class="font-label-sm text-[9px] tracking-wider text-secondary uppercase font-semibold">BAIE DE CONNEXION TACTIQUE</span><span class="font-headline-sm text-[13px] font-bold text-white tracking-wide">MODULE ' + nWires + ' FILS' + (panel.state === "solved" ? " — SÉCURISÉ" : "") + '</span></div></div>' +
        '<div class="px-2.5 py-1 rounded bg-gradient-to-r from-[#17222d] via-[#1b2938] to-[#17222d] border border-[#314457] shadow-sm flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-[#ff9f32]/70"></span><div class="flex flex-col items-end"><span class="font-label-sm text-[7px] text-slate-400 uppercase tracking-widest leading-none">SÉRIE APPAREIL</span><span class="font-code-serial text-[12px] font-black tracking-widest text-[#ffdcbf] leading-tight" id="zt-serial"></span></div><span class="w-1.5 h-1.5 rounded-full bg-[#ff9f32]/70"></span></div></div>' +
        '<div class="flex flex-col gap-2 pt-1" id="wire-loom-container"></div></section>' +
      '<section class="mt-0.5 mb-1 flex flex-col gap-1.5"><div class="flex items-center justify-between px-2 font-code-serial text-[10.5px]"><span class="flex items-center gap-1.5 text-secondary"><span class="w-2 h-2 rounded-full ' + (selectedWire ? "bg-primary-container" : "bg-slate-500") + '"></span>PINCE HYDRAULIQUE PRÊTE</span>' +
        '<span class="font-bold ' + (selectedWire ? "text-primary-container" : "text-slate-400") + ' tracking-wider uppercase" id="zt-target"></span></div>' +
        '<div class="p-1 rounded-2xl bg-gradient-to-b from-[#1c2836] to-[#0a0f16] border border-[#2e4054] shadow-2xl"><button class="industrial-trigger w-full min-h-[54px] rounded-xl text-[#2b1400] font-headline-sm text-[15px] font-black tracking-widest uppercase flex items-center justify-center gap-2.5 select-none transition-all duration-200" id="cut-wire-button" type="button"><span class="material-symbols-outlined text-[24px]">content_cut</span><span>COUPER CE FIL</span><span class="material-symbols-outlined text-[20px]">bolt</span></button></div></section>' +
    '</main>';

    document.getElementById("zt-serial").textContent = panel.serial;
    document.getElementById("zt-target").textContent = selectedWire ? "CIBLE ENGAGÉE : FIL #" + selectedWire : "AUCUNE CIBLE ENGAGÉE";
    if (paused) document.getElementById("zt-pause").appendChild(pauseCard());

    var tabs = document.getElementById("zt-tabs");
    g.panels.forEach(function (p, idx) {
      var on = idx === activePanel;
      var b = el("button", {
        type: "button",
        class: "flex-1 min-h-[38px] rounded-lg border font-label-sm text-[11px] font-bold tracking-wider uppercase " + (on ? "bg-[#141f2c] border-primary-container text-primary-container wire-selected-ring" : "bg-[#0c1219] border-[#1b2836] text-slate-400"),
        text: p.wires.length + " FILS" + (p.state === "solved" ? " ✓" : ""),
        onclick: function () { activePanel = idx; selectedWire = null; render(); }
      });
      tabs.appendChild(b);
    });

    var loom = document.getElementById("wire-loom-container"), rows = {};
    panel.wires.forEach(function (color, idx) {
      var n = idx + 1, isCut = panel.cut.indexOf(n) !== -1, isSel = selectedWire === n;
      var row = document.createElement(isCut ? "div" : "button");
      if (isCut) row.className = "w-full min-h-[52px] rounded-lg bg-[#090e13]/80 border border-[#16222e] p-1.5 flex items-center justify-between opacity-70 select-none";
      else {
        row.type = "button";
        row.className = "wire-row w-full min-h-[52px] rounded-lg p-1.5 flex items-center justify-between transition-all active:scale-[0.99] relative cursor-pointer " +
          (isSel ? "bg-[#141f2c] border border-primary-container wire-selected-ring" : "bg-[#0c1219] border border-[#1b2836] panel-recess");
        row.setAttribute("aria-label", "Fil " + n);
        row.onclick = function () { if (panel.state !== "solved") { selectedWire = n; render(); } };
      }
      row.innerHTML = wireRowHtml(n, color, isCut, isSel);
      rows[n] = row; loom.appendChild(row);
    });

    var timerMain = document.getElementById("chrono-display"), timerMs = document.getElementById("chrono-ms");
    function paint(ms) {
      var f = fmtH(ms); timerMain.textContent = f[0]; timerMs.textContent = f[1];
      var crit = ms <= 20000 && !paused;
      [timerMain, timerMs].forEach(function (e) { e.classList.toggle("timer-critical", crit); e.classList.toggle("timer-green", !crit); e.style.opacity = paused ? ".45" : ""; });
    }
    stopTimer();
    var remInit = (endsAt - (Date.now() + offsetMs)) / 1000;
    if (paused) paint(paused.remaining_ms); else paint(endsAt - (Date.now() + offsetMs));
    if (!alertInit) { alertInit = true; ALERTS.forEach(function (T) { if (remInit <= T) alerted[T] = true; }); }
    if (!paused) timerId = setInterval(function () {
      var ms = endsAt - (Date.now() + offsetMs), rem = ms / 1000;
      paint(ms);
      var fire = null;
      ALERTS.forEach(function (T) { if (rem <= T && rem > 0 && !alerted[T]) { alerted[T] = true; fire = T; } });
      if (fire !== null) { toast("Il reste " + fmt(ms), false); buzz([150, 80, 150]); window.ZT_FX.beep(fire <= 10 ? 1200 : 880); }
      if (rem <= 0 && !tickSent) {
        tickSent = true;
        sb.rpc("zt_tick", { p_code: session.code, p_token: session.token }).then(function (r) { if (!r.error) { view = r.data; render(); } });
      }
    }, 50);

    // Retour de la dernière coupe : flash et vibration, une seule fois par événement.
    var ev = g.event;
    if (seenEvent === undefined) { seenEvent = ev ? ev.id : null; }
    else if (ev && ev.id !== seenEvent) {
      seenEvent = ev.id;
      if (ev.type === "error") {
        document.body.classList.add("flash"); setTimeout(function () { document.body.classList.remove("flash"); }, 700);
        buzz([250]); toast("ERREUR " + ev.n + "/3" + (ev.penalty ? " — −" + ev.penalty + " s" : ""), false);
      } else { buzz([80]); }
    }

    var btn = document.getElementById("cut-wire-button");
    if (!selectedWire || paused) { btn.disabled = true; btn.className += " opacity-40 pointer-events-none grayscale cursor-not-allowed"; }
    btn.onclick = function () {
      if (cutting || !selectedWire || view.paused) return;
      cutting = true;
      var n = selectedWire, row = rows[n];
      window.ZT_FX.cutSound(); buzz([22, 12, 45]);
      if (row) window.ZT_FX.sparks(row);
      hold(450);
      sb.rpc("zt_cut", { p_code: session.code, p_token: session.token, p_action: uuid(), p_pos: panel.pos, p_wire: n }).then(function (r) {
        cutting = false;
        if (r.error) { holdUntil = 0; fail(r.error); return render(); }
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
  function doRender() {
    var isOp = !!(session && view && view.status === "playing" && view.me && view.me.role === "operator" && view.game);
    document.body.classList.toggle("op", isOp);
    if (!session || !view) { stopTimer(); return renderHome(); }
    if (view.status === "lobby") { stopTimer(); resetGameFlags(); return renderLobby(); }
    if (view.status === "ended" || view.status === "abandoned") return renderEnded();
    return renderPlaying();
  }

  session = load();
  if (session) { subscribe(); startHeartbeat(); } 
  render();
})();
