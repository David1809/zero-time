(function () {
  "use strict";
  var cfg = window.ZT_CONFIG;
  var sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");
  var KEY = "zt_session";
  var APP_VERSION = "1.0.28";
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
    mode_solo_indisponible: "Mode solo indisponible : un autre joueur est dans la salle.",
    partie_non_en_cours: "Aucune partie en cours."
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
    var BL = '<div class="absolute %P% w-4 h-4 rounded-full bg-surface-variant flex items-center justify-center shadow-md"><div class="w-2.5 h-0.5 bg-surface-container-lowest %R%"></div></div>';
    function bolt(p, r) { return BL.replace("%P%", p).replace("%R%", r); }
    app.innerHTML = S(`<div class="flex flex-col w-full min-h-full overflow-hidden select-none justify-between p-3 pt-safe pb-safe box-border bg-gradient-to-b from-[#0c141c] via-[#101923] to-[#070f17]">
<header class="relative w-full bg-surface-container-low rounded-t-xl rounded-b p-3 shadow-2xl overflow-hidden"><div class="absolute inset-0 bg-gradient-to-b from-surface-bright/20 to-transparent pointer-events-none"></div><div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-container/40 to-transparent"></div><div class="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-surface-variant flex items-center justify-center shadow-inner"><div class="w-2 h-0.5 bg-surface-container-lowest rotate-45"></div></div><div class="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-surface-variant flex items-center justify-center shadow-inner"><div class="w-2 h-0.5 bg-surface-container-lowest -rotate-45"></div></div>
<div class="flex items-center justify-between px-4 pt-0.5"><div class="flex items-center space-x-2"><span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]"></span></span><div class="flex flex-col"><span class="font-label-sm text-on-surface tracking-wider text-[9px] uppercase leading-none">Terminal Opérationnel</span><span class="font-code-serial text-on-surface-variant text-[8px] tracking-tight">FRQ 2.4 GHz CRYPTÉE</span></div></div><div class="flex items-center space-x-1.5 bg-surface-container-lowest px-2 py-1 rounded"><span class="font-label-sm text-primary text-[9px] font-bold tracking-widest">[UNIT-00]</span><span class="material-symbols-outlined text-primary text-[12px]">sensors</span></div></div></header>
<section class="relative w-full my-auto flex flex-col items-center"><div class="relative w-full bg-surface-container rounded-xl p-4 shadow-2xl flex flex-col items-center">${bolt("top-2.5 left-2.5", "rotate-12")}${bolt("top-2.5 right-2.5", "-rotate-45")}${bolt("bottom-2.5 left-2.5", "-rotate-[30deg]")}${bolt("bottom-2.5 right-2.5", "rotate-90")}
<div class="flex items-center space-x-2 bg-surface-container-lowest px-3 py-0.5 rounded-full mb-3 shadow-inner"><span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span><span class="font-code-serial text-on-surface-variant text-[10px] tracking-widest uppercase">DISPOSITIF TACTIQUE MIL-STD-810H</span><span class="w-1.5 h-1.5 rounded-full bg-primary-container"></span></div>
<div class="relative w-full bg-surface-container-lowest rounded-lg py-3 px-2 flex flex-col items-center shadow-inner overflow-hidden mb-3"><div class="absolute inset-0 bg-[radial-gradient(#182029_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div><div class="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
<div class="flex items-baseline justify-center relative"><div class="font-display-timer text-[38px] leading-tight font-bold timer-neon-green tracking-wider">30:00</div><span class="ml-1.5 font-code-serial text-[15px] font-bold timer-neon-green tracking-widest">.00</span></div>
<div class="w-full flex justify-between px-3 pt-1 text-[8px] font-label-sm text-outline tracking-widest uppercase"><span>CHRONO DETONATEUR</span><span class="text-error font-bold flex items-center gap-0.5"><span class="w-1 h-1 rounded-full bg-error inline-block animate-ping"></span>ARMÉ</span></div></div>
<div class="text-center w-full px-2"><h1 class="font-headline-lg-mobile text-on-surface tracking-wider font-extrabold uppercase m-0 leading-none drop-shadow-md">ZERO <span class="text-primary-container drop-shadow-[0_0_8px_rgba(255,159,50,0.5)]">TIME</span></h1><p class="font-label-md text-primary tracking-widest uppercase mt-1 mb-0 text-[11px] font-semibold">Protocole de Désamorçage Coopératif</p></div>
<div class="w-full bg-surface-container-high rounded p-2.5 mt-3 shadow-inner"><div class="flex items-center space-x-2 mb-1 text-primary-container"><span class="material-symbols-outlined text-[16px]">record_voice_over</span><span class="font-label-sm text-[10px] tracking-wider uppercase font-bold">Règles d'Engagement Tactiques</span></div><div class="font-body-sm text-secondary text-[11px] leading-tight space-y-0.5"><div class="flex items-center justify-between"><span class="text-on-surface-variant">Configuration :</span><span class="font-code-serial text-on-surface font-semibold text-[10px]">2 OPÉRATEURS REQUIS</span></div><div class="flex items-center justify-between"><span class="text-on-surface-variant">Canal de secours :</span><span class="font-code-serial text-on-surface font-semibold text-[10px]">LIAISON VOCALE DIRECTE</span></div><div class="flex items-center justify-between pt-1"><span class="text-[9px] text-outline font-label-sm">RÔLE 01: DÉMINEUR</span><span class="text-[9px] text-outline font-label-sm">RÔLE 02: TECHNICIEN</span></div></div></div>
</div></section>
<footer class="w-full flex flex-col space-y-2.5 pb-1">
<div class="w-full bg-surface-container-low rounded-lg p-2 shadow-lg flex flex-col space-y-2"><div class="flex items-center justify-between px-1"><span class="font-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-primary">badge</span> Identifiant Agent</span><span class="font-code-serial text-[9px] text-outline">16 SIGNES MAX</span></div><div class="relative w-full h-12 bg-surface-container-lowest rounded flex items-center px-3 shadow-inner"><input class="w-full bg-transparent font-code-serial text-on-surface text-center tracking-[0.1em] text-sm focus:outline-none placeholder:text-outline/40 placeholder:tracking-normal font-bold" id="pseudo" maxlength="16" autocomplete="nickname" placeholder="TON PSEUDO" type="text"/></div></div>
<button class="group relative w-full h-14 bg-gradient-to-r from-primary-container via-primary to-primary-container rounded-lg p-0.5 shadow-[0_4px_20px_rgba(255,159,50,0.35)] active:translate-y-0.5 transition-transform overflow-hidden cursor-pointer" id="btnCreateRoom" type="button"><div class="w-full h-full bg-gradient-to-b from-primary-container to-[#c9741b] rounded-[6px] px-4 flex items-center justify-between"><div class="flex items-center space-x-3"><div class="w-9 h-9 rounded bg-surface-container-lowest/30 flex items-center justify-center text-on-primary"><span class="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">cell_tower</span></div><div class="flex flex-col text-left"><span class="font-headline-sm text-on-primary font-bold tracking-wider leading-none text-sm uppercase">Créer une Salle</span><span class="font-code-serial text-on-primary/80 text-[9px] tracking-normal leading-tight mt-0.5">INITIALISER LE POSTE MAÎTRE</span></div></div><div class="flex items-center space-x-1.5 bg-surface-container-lowest/40 px-2 py-1 rounded"><span class="w-2 h-2 rounded-full bg-on-primary animate-pulse"></span><span class="font-label-sm text-on-primary text-[10px] font-bold">HÔTE</span></div></div></button>
<div class="w-full bg-surface-container-low rounded-lg p-2 shadow-lg flex flex-col space-y-2"><div class="flex items-center justify-between px-1"><span class="font-label-sm text-on-surface-variant text-[10px] uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[13px] text-[#22c55e]">cable</span> Rejoindre une Opération</span><span class="font-code-serial text-[9px] text-outline">CODE 4 SIGNES</span></div><div class="flex items-center space-x-2"><div class="relative flex-1 h-12 bg-surface-container-lowest rounded flex items-center px-3 shadow-inner"><input class="w-full bg-transparent font-code-serial text-on-surface text-center tracking-[0.25em] text-sm uppercase focus:outline-none placeholder:text-outline/40 placeholder:tracking-normal font-bold" id="roomCodeInput" maxlength="4" autocapitalize="characters" autocomplete="off" placeholder="CODE EX: K9X2" type="text"/></div><button class="h-12 px-4 bg-gradient-to-b from-[#22c55e] to-[#15803d] rounded flex items-center justify-center space-x-1.5 shadow-[0_2px_12px_rgba(34,197,94,0.3)] active:translate-y-0.5 transition-transform cursor-pointer" id="btnJoinRoom" type="button"><span class="font-label-md text-surface-container-lowest font-extrabold uppercase text-xs">Entrer</span><span class="material-symbols-outlined text-surface-container-lowest text-[18px]">login</span></button></div></div>
<div class="w-full bg-surface-container-lowest rounded px-3 py-1 flex items-center justify-between text-[9px] font-label-sm"><button class="flex items-center space-x-1.5 text-on-surface-variant" id="zt-version" type="button"><span class="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span><span id="zt-version-txt">BUILD v${APP_VERSION} · MAJ</span></button><span class="font-code-serial text-outline uppercase tracking-wider">SERVEUR SÉCURISÉ ACTIF</span></div>
</footer></div>`);
    var pseudo = $("pseudo"), code = $("roomCodeInput"), create = $("btnCreateRoom"), join = $("btnJoinRoom");
    code.addEventListener("input", function () { code.value = code.value.toUpperCase(); });
    create.onclick = function () {
      create.disabled = true;
      sb.rpc("zt_create_room", { p_pseudo: pseudo.value }).then(function (r) {
        create.disabled = false;
        if (r.error) return fail(r.error);
        enter(r.data);
      });
    };
    join.onclick = function () {
      join.disabled = true;
      sb.rpc("zt_join_room", { p_code: code.value, p_pseudo: pseudo.value }).then(function (r) {
        join.disabled = false;
        if (r.error) return fail(r.error);
        enter(r.data);
      });
    };
    $("zt-version").onclick = function () {
      $("zt-version-txt").textContent = "MISE À JOUR…";
      var done = function () { location.replace(location.pathname + "?u=" + Date.now()); };
      Promise.all([
        (navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (x) { return x.unregister(); })); }) : null),
        (window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : null)
      ]).then(done, done);
    };
  }

  function roleLabel(r) { return r === "operator" ? "Opérateur" : r === "technician" ? "Technicien" : "—"; }

  // ===== Écrans Stitch : salle d'attente, victoire, explosion =====
  // Les classes des maquettes sont reprises telles quelles ; seuls primary/secondary/surface/on-surface/error
  // (noms déjà pris par l'écran opérateur) sont convertis en couleurs exactes de la maquette.
  var SC_HEX = { "primary": "#ffc691", "secondary": "#b8c9d6", "surface": "#0c141c", "on-surface": "#dbe3ef", "error": "#ffb4ab" };
  function S(html) {
    return html.replace(/class="([^"]*)"/g, function (m, cls) {
      return 'class="' + cls.split(/\s+/).map(function (t) {
        var x = /^((?:[a-z-]+:)*)(text|bg|border|ring|from|via|to|fill|stroke|shadow|outline|divide)-(primary|secondary|surface|on-surface|error)(\/[\d.]+)?$/.exec(t);
        return x ? x[1] + x[2] + "-[" + SC_HEX[x[3]] + "]" + (x[4] || "") : t;
      }).join(" ") + '"';
    });
  }
  function escS(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function leaveRoom() { if (!window.confirm("Quitter la salle ?")) return; forget(); render(); }
  function doReplay() {
    sb.rpc("zt_replay", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; resetGameFlags(); selectedWire = null; activePanel = 0; render(); });
  }
  var ROLE_FULL = { operator: "OPÉRATEUR (TERRAIN)", technician: "TECHNICIEN (MANUEL)" };
  var BOLT = '<div class="w-1.5 h-0.5 bg-surface-container-lowest';

  function renderLobby() {
    clear();
    var players = view.players, n = players.length, mode = view.role_mode, cr = view.creator_role, isC = view.is_creator;
    var ready = n === 2 && (mode === "random" || !!cr);
    function roleOf(p) {
      if (mode === "random") return "RÔLE : TIRAGE AU SORT";
      if (!cr) return "RÔLE : À DÉFINIR";
      var r = p.is_creator ? cr : (cr === "operator" ? "technician" : "operator");
      return "RÔLE : " + ROLE_FULL[r];
    }
    function iconOf(p) {
      if (mode === "random" || !cr) return "person";
      return (p.is_creator ? cr : (cr === "operator" ? "technician" : "operator")) === "operator" ? "shield_person" : "menu_book";
    }
    function slot(p, i) {
      var host = !!p.is_creator;
      return `<div class="bg-surface-container-lowest rounded p-2 flex items-center justify-between shadow-inner"><div class="flex items-center gap-2.5 min-w-0"><div class="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center ${host ? "text-primary" : "text-secondary"} shrink-0"><span class="material-symbols-outlined text-lg">${iconOf(p)}</span></div><div class="flex flex-col min-w-0"><div class="flex items-center gap-1.5"><span class="font-label-md text-label-md text-on-surface font-bold truncate">${escS(p.pseudo)}</span><span class="font-label-sm text-label-sm ${host ? "bg-primary-container/20 text-primary" : "bg-surface-bright text-on-surface-variant"} px-1 rounded uppercase tracking-wider text-[9px]">${host ? "HÔTE" : "BINÔME"}</span></div><span class="font-label-sm text-label-sm ${host ? "text-primary" : "text-secondary"} tracking-wide uppercase truncate">${roleOf(p)}</span></div></div><div class="flex items-center gap-1.5 shrink-0 pl-1"><span class="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(184,201,214,0.6)]"></span><span class="font-label-sm text-label-sm text-secondary font-bold">${host ? "PRÊT" : "SYNCHRO"}</span></div></div>`;
    }
    var emptySlot = `<div class="bg-surface-container-lowest rounded p-2 flex items-center justify-between shadow-inner opacity-75"><div class="flex items-center gap-2.5 min-w-0"><div class="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary shrink-0"><span class="material-symbols-outlined text-lg">person_search</span></div><div class="flex flex-col min-w-0"><span class="font-label-md text-label-md text-on-surface-variant font-bold truncate">EN ATTENTE DU BINÔME…</span><span class="font-label-sm text-label-sm text-secondary tracking-wide uppercase truncate">CANAL OUVERT</span></div></div><div class="flex items-center gap-1.5 shrink-0 pl-1"><span class="w-2.5 h-2.5 rounded-full bg-surface-bright animate-pulse"></span><span class="font-label-sm text-label-sm text-on-surface-variant font-bold">ATTENTE</span></div></div>`;
    function sel(id, on, title, sub) {
      return `<button class="role-selector min-h-[52px] p-2 rounded ${on ? "bg-surface-container-high" : "bg-surface-container-lowest opacity-75"} flex flex-col justify-between text-left shadow-inner transition-all" id="${id}" type="button"><div class="flex items-center justify-between w-full"><span class="font-label-sm text-label-sm ${on ? "text-primary" : "text-on-surface-variant"} uppercase font-bold tracking-wider">${title}</span><span class="radio-indicator w-2.5 h-2.5 rounded-full ${on ? "bg-primary shadow-[0_0_8px_rgba(255,159,50,0.8)]" : "bg-surface-bright"}"></span></div><span class="font-body-sm text-body-sm ${on ? "text-on-surface" : "text-on-surface-variant"} font-medium truncate mt-1">${sub}</span></button>`;
    }
    var manual = mode !== "random";
    var roleRow = manual ? `<div class="grid grid-cols-2 gap-2">${sel("role-op", cr === "operator", "OPÉRATEUR", "Je vois la bombe")}${sel("role-tech", cr === "technician", "TECHNICIEN", "Je tiens le manuel")}</div>` : "";
    var solo = (isC && n === 1) ? `<section class="relative bg-surface-container rounded-lg p-3 shadow-md flex flex-col gap-2"><div class="flex items-center justify-between px-3"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">MODE TEST // SOLO</span><span class="font-label-sm text-label-sm text-primary uppercase">SANS BINÔME</span></div><div class="grid grid-cols-2 gap-2">${sel("solo-op", false, "OPÉRATEUR", "Tester seul")}${sel("solo-tech", false, "TECHNICIEN", "Tester seul")}</div></section>` : "";
    var msg, icon = "lock_open";
    if (!isC) { msg = "EN ATTENTE DU LANCEMENT PAR L'HÔTE"; icon = "hourglass_top"; }
    else if (n < 2) { msg = "EN ATTENTE DU BINÔME"; icon = "hourglass_top"; }
    else if (!ready) { msg = "CHOISIS UN RÔLE"; icon = "lock"; }
    else msg = "TOUS LES DÉMINEURS SONT PRÊTS";
    var canLaunch = isC && ready;
    app.innerHTML = S(`<div class="flex flex-col w-full min-h-full justify-between gap-2 p-3 pt-safe pb-safe select-none">
<header class="flex items-center justify-between bg-surface-container px-3 py-2 rounded-lg shadow-md"><div class="flex items-center gap-2 min-w-0"><div class="relative flex items-center justify-center w-3 h-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></div><div class="flex flex-col min-w-0"><span class="font-label-sm text-label-sm text-primary tracking-widest uppercase truncate">SALLE D'ATTENTE // CANAL SÉCURISÉ</span><span class="font-headline-sm text-headline-sm text-on-surface tracking-tight uppercase font-bold truncate">FRÉQUENCE TAC-${escS(view.code)}</span></div></div><button aria-label="Quitter le salon" class="w-10 h-10 flex items-center justify-center rounded bg-surface-container-high text-on-surface-variant hover:text-error active:scale-95 transition-all" id="btn-leave" type="button"><span class="material-symbols-outlined text-lg">close</span></button></header>
<section class="relative bg-surface-container rounded-lg p-3 shadow-md flex flex-col justify-between overflow-hidden"><div class="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} rotate-45"></div></div><div class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} -rotate-45"></div></div><div class="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} -rotate-12"></div></div><div class="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} rotate-12"></div></div>
<div class="flex items-center justify-between mb-1 px-3"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase flex items-center gap-1.5"><span class="material-symbols-outlined text-xs text-primary">key</span>CODE ACCÈS OPÉRATION</span><span class="font-code-serial text-label-sm text-primary uppercase">SER-${escS(view.code)}</span></div>
<div class="bg-surface-container-lowest rounded p-2 flex items-center justify-between shadow-inner"><div class="flex flex-col pl-2"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-widest text-[9px] uppercase">LIAISON DÉCRYPTÉE</span><div class="flex items-center gap-2"><span class="font-display-timer-mobile text-display-timer-mobile text-primary tracking-widest drop-shadow-[0_0_12px_rgba(255,159,50,0.45)]" id="room-code">${escS(view.code)}</span></div></div><button class="min-h-[48px] px-3 bg-surface-container hover:bg-surface-bright active:bg-primary text-primary hover:text-on-primary-fixed rounded flex items-center gap-1.5 transition-all" id="copy-btn" type="button"><span class="material-symbols-outlined text-base" id="copy-icon">content_copy</span><span class="font-label-md text-label-md uppercase tracking-wider font-bold" id="copy-text">COPIER</span></button></div>
<div class="mt-1.5 flex items-center justify-center gap-1 px-1"><span class="material-symbols-outlined text-xs text-secondary">record_voice_over</span><span class="font-label-sm text-label-sm text-secondary truncate">TRANSMETTRE CE CODE AU DÉMINEUR BINÔME</span></div></section>
<section class="relative bg-surface-container rounded-lg p-3 shadow-md flex flex-col gap-2"><div class="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} rotate-90"></div></div><div class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT}"></div></div>
<div class="flex items-center justify-between px-3"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">EFFECTIF ENGAGÉ (${n}/2)</span><span class="font-label-sm text-label-sm text-secondary uppercase flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>${n === 2 ? "VOIE 2-WAY OK" : "VOIE 1-WAY"}</span></div>
${players.map(slot).join("")}${n < 2 ? emptySlot : ""}</section>
<section class="relative bg-surface-container rounded-lg p-3 shadow-md flex flex-col gap-2"><div class="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} rotate-45"></div></div><div class="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-surface-bright flex items-center justify-center">${BOLT} -rotate-45"></div></div>
<div class="flex items-center justify-between px-3"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">PARAMÈTRE D'ATTRIBUTION</span><span class="font-label-sm text-label-sm text-primary uppercase">AUTORITÉ HÔTE</span></div>
<div class="grid grid-cols-2 gap-2">${sel("role-mode-manual", manual, "MANUEL", "Attribution Fixe")}${sel("role-mode-random", !manual, "ALÉATOIRE", "Tirage Au Sort")}</div>${roleRow}</section>
${solo}
<footer class="w-full flex flex-col gap-1.5 pt-1"><div class="flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-xs text-primary animate-pulse">${icon}</span><span class="font-label-sm text-label-sm text-primary tracking-widest uppercase font-semibold">${msg}</span></div>
<button class="w-full min-h-[56px] bg-primary-container hover:bg-primary active:scale-[0.99] text-on-primary rounded-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,159,50,0.45)] transition-all${canLaunch ? "" : " opacity-40"}" id="btn-launch" type="button"><span class="material-symbols-outlined text-2xl font-black">power_settings_new</span><span class="font-label-lg text-label-lg tracking-widest font-black uppercase">LANCER LA MISSION</span></button></footer>
</div>`);
    $("btn-leave").onclick = function () { forget(); render(); };
    var cb = $("copy-btn");
    cb.onclick = function () {
      var done = function (ok) {
        $("copy-text").textContent = ok ? "COPIÉ !" : view.code; $("copy-icon").textContent = ok ? "check" : "content_copy";
        setTimeout(function () { var t = $("copy-text"); if (t) { t.textContent = "COPIER"; $("copy-icon").textContent = "content_copy"; } }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(view.code).then(function () { done(true); }, function () { done(false); });
      else done(false);
    };
    if (isC) {
      var setMode = function (m, role) {
        sb.rpc("zt_set_role_mode", { p_code: view.code, p_token: session.token, p_mode: m, p_role: role || null }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
      };
      $("role-mode-manual").onclick = function () { setMode("choose", cr || "operator"); };
      $("role-mode-random").onclick = function () { setMode("random"); };
      if ($("role-op")) { $("role-op").onclick = function () { setMode("choose", "operator"); }; $("role-tech").onclick = function () { setMode("choose", "technician"); }; }
      var startSolo = function (role) {
        sb.rpc("zt_start_solo", { p_code: view.code, p_token: session.token, p_role: role }).then(function (r) { if (r.error) return fail(r.error); view = r.data; resetGameFlags(); selectedWire = null; activePanel = 0; render(); });
      };
      if ($("solo-op")) { $("solo-op").onclick = function () { startSolo("operator"); }; $("solo-tech").onclick = function () { startSolo("technician"); }; }
      $("btn-launch").onclick = function () {
        if (!canLaunch) return;
        sb.rpc("zt_start", { p_code: view.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
      };
    }
  }

  var COLORS = { red: "Rouge", blue: "Bleu", yellow: "Jaune", white: "Blanc", black: "Noir" };
  var activePanel = 0, selectedWire = null, manualTab = "w4";
  var timerId = null, offsetMs = 0, bestOff = null;
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
  function resetGameFlags() { endFxKey = null; errFlash = null; alertFlash = null; seenEvent = undefined; alerted = {}; alertInit = false; tickSent = false; }

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
  // Modules de 6, 7 et 8 fils : courbes générées sur le même principe (bosse douce, croisements).
  function mkGeom(n) {
    var ys = [], i; for (i = 0; i < n; i++) ys.push(22 + i * 212 / (n - 1));
    var k = { 6: 5, 7: 3, 8: 3 }[n], c = { 6: 2, 7: 2, 8: 1 }[n], out = [];
    for (i = 0; i < n; i++) {
      var y0 = ys[i], m = y0 + (ys[(i * k + c) % n] - y0) * 0.55;
      out.push({ s: [[0, y0, 70, y0, 90, m, 160, m].map(r1), [160, m, 230, m, 250, y0, 320, y0].map(r1)], cut: G2 });
    }
    return out;
  }
  [6, 7, 8].forEach(function (n) { GEOM[n] = mkGeom(n); ORDER[n] = []; for (var i = 1; i <= n; i++) ORDER[n].push(i); });
  var BASE = { red: "#250202", yellow: "#240c01", blue: "#040914", black: "#000000", white: "#475569" };

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

  var clampPx = 22;
  function clBase() { return "terminal-clamp-block w-[" + clampPx + "px] h-[" + clampPx + "px] rounded flex items-center justify-center font-code-serial font-bold " + (clampPx < 22 ? "text-[9px]" : "text-[10px]"); }
  function clampCls(isCut, isSel, locked) {
    if (isCut) return clBase() + " text-slate-500 line-through";
    if (isSel) return "terminal-clamp-block active-clamp w-[" + clampPx + "px] h-[" + clampPx + "px] rounded flex items-center justify-center font-code-serial font-black text-[" + (clampPx < 22 ? 10 : 11) + "px]";
    return clBase() + (locked ? " text-slate-300" : " text-slate-200 group-hover:border-primary");
  }
  function lugsL(isCut) { return '<div class="flex flex-col items-center gap-0.5' + (isCut ? " opacity-40" : "") + '"><span class="w-1.5 h-1 rounded-xs terminal-lug"></span><span class="w-1.5 h-1 rounded-xs bg-[#111418]' + (isCut ? "" : " border border-[#3b434e]") + '"></span></div>'; }
  function lugsR(isCut) { return '<div class="flex flex-col items-center gap-0.5' + (isCut ? " opacity-40" : "") + '"><span class="w-1.5 h-1 rounded-xs bg-[#111418]' + (isCut ? "" : " border border-[#3b434e]") + '"></span><span class="w-1.5 h-1 rounded-xs terminal-lug"></span></div>'; }

  var GRADS = "<linearGradient id=\"grad-wire-red\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#3d0303\"/><stop offset=\"12%\" stop-color=\"#880f0f\"/><stop offset=\"26%\" stop-color=\"#dc2626\"/><stop offset=\"38%\" stop-color=\"#f87171\"/><stop offset=\"46%\" stop-color=\"#ffffff\"/><stop offset=\"56%\" stop-color=\"#ef4444\"/><stop offset=\"78%\" stop-color=\"#b91c1c\"/><stop offset=\"92%\" stop-color=\"#650909\"/><stop offset=\"100%\" stop-color=\"#2d0202\"/></linearGradient><linearGradient id=\"grad-wire-white\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#8fa0b5\"/><stop offset=\"15%\" stop-color=\"#dbe4ee\"/><stop offset=\"30%\" stop-color=\"#f8fafc\"/><stop offset=\"46%\" stop-color=\"#ffffff\"/><stop offset=\"58%\" stop-color=\"#ffffff\"/><stop offset=\"76%\" stop-color=\"#e2e8f0\"/><stop offset=\"92%\" stop-color=\"#94a3b8\"/><stop offset=\"100%\" stop-color=\"#64748b\"/></linearGradient><linearGradient id=\"grad-wire-yellow\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#451a03\"/><stop offset=\"14%\" stop-color=\"#92400e\"/><stop offset=\"28%\" stop-color=\"#d97706\"/><stop offset=\"40%\" stop-color=\"#fbbf24\"/><stop offset=\"48%\" stop-color=\"#ffffff\"/><stop offset=\"58%\" stop-color=\"#f59e0b\"/><stop offset=\"80%\" stop-color=\"#b45309\"/><stop offset=\"94%\" stop-color=\"#712e06\"/><stop offset=\"100%\" stop-color=\"#2d1001\"/></linearGradient><linearGradient id=\"grad-wire-blue\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#050e20\"/><stop offset=\"14%\" stop-color=\"#1e3a8a\"/><stop offset=\"28%\" stop-color=\"#2563eb\"/><stop offset=\"40%\" stop-color=\"#60a5fa\"/><stop offset=\"48%\" stop-color=\"#ffffff\"/><stop offset=\"58%\" stop-color=\"#3b82f6\"/><stop offset=\"80%\" stop-color=\"#1d4ed8\"/><stop offset=\"94%\" stop-color=\"#112763\"/><stop offset=\"100%\" stop-color=\"#040b19\"/></linearGradient><linearGradient id=\"grad-wire-black\" x1=\"0%\" x2=\"0%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#000000\"/><stop offset=\"14%\" stop-color=\"#0e1116\"/><stop offset=\"32%\" stop-color=\"#181d24\"/><stop offset=\"45%\" stop-color=\"#374151\"/><stop offset=\"52%\" stop-color=\"#4b5563\"/><stop offset=\"65%\" stop-color=\"#1a1f26\"/><stop offset=\"85%\" stop-color=\"#0f1217\"/><stop offset=\"100%\" stop-color=\"#000000\"/></linearGradient><linearGradient id=\"copper-wires\" x1=\"0%\" x2=\"100%\" y1=\"0%\" y2=\"100%\"><stop offset=\"0%\" stop-color=\"#b45309\"/><stop offset=\"35%\" stop-color=\"#fde047\"/><stop offset=\"65%\" stop-color=\"#ea580c\"/><stop offset=\"100%\" stop-color=\"#78350f\"/></linearGradient>";
  var DEFS = '<defs>' +
    '<filter height="200%" id="cavity-shadow" width="140%" x="-20%" y="-40%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="0" dy="7" result="offsetblur"/><feComponentTransfer><feFuncA slope="0.82" type="linear"/></feComponentTransfer><feMerge><feMergeNode/></feMerge></filter>' +
    '<filter height="220%" id="crossing-shadow" width="160%" x="-30%" y="-50%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dx="0" dy="5" result="offsetblur"/><feComponentTransfer><feFuncA slope="0.9" type="linear"/></feComponentTransfer><feMerge><feMergeNode/></feMerge></filter>' +
    GRADS +
    '</defs>';

  var SCR_TELE = "";
  var SCR_SEL = "";
  var SCR_MOD = "";
  var SCR_PUSH = "";
  var lastCut = null; // fil qui vient d'être coupé (pour l'animation de recul)

  function renderOperator() {
    var g = view.game;
    // Décalage horloge serveur/local : mesuré UNE seule fois à la réception de cette vue (sinon un simple
    // clic relit un ancien server_now et le temps « remonte »), puis lissé : on garde le meilleur échantillon
    // (celui où la latence réseau est la plus faible).
    if (g._off === undefined) {
      var smp = new Date(g.server_now).getTime() - Date.now();
      bestOff = bestOff === null ? smp : Math.max(smp, bestOff - 20);
      g._off = bestOff;
    }
    offsetMs = g._off;
    var endsAt = new Date(g.ends_at).getTime();
    var solved = g.panels.filter(function (p) { return p.state === "solved"; }).length;
    var panel = g.panels[activePanel] || g.panels[0];
    var paused = view.paused;
    var n = panel.wires.length;
    clampPx = n >= 7 ? 18 : 22;
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

    var remNow = paused ? paused.remaining_ms : endsAt - (now + offsetMs);
    var critical = remNow <= 60000;
    var mode = paused ? "pause" : (isSolved ? "ok" : (showErr ? "err" : (critical ? "alert" : "live")));

    // --- éléments de l'en-tête
    var topLed = { live: '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span><span class="font-label-sm text-[8px] font-bold text-primary tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      alert: '<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span><span class="font-label-sm text-[8px] font-bold text-primary tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      err: '<span class="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span><span class="font-label-sm text-[8px] font-bold text-error tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      ok: '<span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span><span class="font-label-sm text-[8px] font-bold text-[#00ffaa] tracking-widest uppercase">UNITÉ TACTIQUE // DÉMINEUR</span>',
      pause: '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span><span class="font-label-sm text-[8px] font-bold text-amber-400 tracking-widest uppercase">UNITÉ TACTIQUE // SUSPENDUE</span>' }[mode];
    var badge = { live: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#161a20] border border-[#2c343f]"><span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span><span class="font-code-serial text-[8.5px] text-[#9bb1c5] tracking-widest font-bold">ARMÉ</span></div>',
      alert: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#191e25] border border-[#313945]"><span class="w-1.5 h-1.5 rounded-full bg-[#ff4d4d] shadow-[0_0_6px_#ff4d4d] animate-pulse"></span><span class="font-code-serial text-[8.5px] text-[#ffb4ab] tracking-widest font-bold">ALERTE</span></div>',
      err: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#221010] border border-[#522121]"><span class="w-1.5 h-1.5 rounded-full bg-[#ff3333] shadow-[0_0_6px_#ff3333] animate-pulse"></span><span class="font-code-serial text-[8.5px] text-[#ff9999] tracking-widest font-bold">ALERTE</span></div>',
      ok: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#13281f] border border-[#00ffaa]/50 shadow-[0_0_8px_rgba(0,255,170,0.3)]"><span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span><span class="font-code-serial text-[8.5px] text-[#00ffaa] tracking-widest font-bold">RÉSOLU</span></div>',
      pause: '<div class="flex items-center gap-1 px-2 py-1 rounded bg-[#261f14] border border-[#6b4e20]"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#ffaa00] animate-ping"></span><span class="font-code-serial text-[8.5px] text-amber-300 tracking-widest font-bold">PAUSE</span></div>' }[mode];

    // --- bloc télémétrie
    var diodes = "";
    for (var i = 0; i < 3; i++) diodes += i < g.errors
      ? '<div class="w-[18px] h-[18px] rounded bg-[#4a0d0d] border border-[#ff4d4d] flex items-center justify-center shadow-[0_0_8px_rgba(255,77,77,0.85)]"><span class="material-symbols-outlined text-white text-[11px] font-black">priority_high</span></div>'
      : '<div class="w-[18px] h-[18px] rounded bg-[#101419] border border-[#26313d] flex items-center justify-center shadow-inner"><span class="w-1.5 h-1.5 rounded-full bg-[#1b232c]"></span></div>';
    var crans = "";
    for (var k = 0; k < 3; k++) crans += k < solved
      ? '<div class="flex-1 h-full rounded-xs bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></div>'
      : '<div class="flex-1 h-full rounded-xs bg-[#171d24]"></div>';
    var screws = function (a, b, c, d) {
      function w(pos, rot) { return '<div class="absolute pointer-events-none z-20" style="' + pos + ' width: 14px; height: 14px;"><span class="screw-cross ' + rot + '" style="top: 0; left: 0;"></span></div>'; }
      return w("top: 5px; left: 5px;", a) + w("top: 5px; right: 5px;", b) + w("bottom: 5px; left: 5px;", c) + w("bottom: 5px; right: 5px;", d);
    };
    var head = { live: '<span class="pilot-led-green"></span><span class="font-label-sm text-[8.5px] font-bold text-primary tracking-wider uppercase">ATTENTION : DÉTONATION IMMINENTE</span>',
      alert: '<span class="pilot-led-green"></span><span class="font-label-sm text-[8.5px] font-bold text-primary tracking-wider uppercase">ATTENTION : DÉTONATION IMMINENTE</span>',
      err: '<span class="pilot-led-red"></span><span class="font-label-sm text-[8.5px] font-bold text-[#ff6666] tracking-wider uppercase">ATTENTION : DÉTONATION IMMINENTE</span>',
      ok: '<span class="pilot-led-green"></span><span class="font-label-sm text-[8.5px] font-bold text-[#00ffaa] tracking-wider uppercase">PANNEAU SÉCURISÉ // DÉSAMORÇAGE EFFECTIF</span>',
      pause: '<span class="pilot-led-pause"></span><span class="font-label-sm text-[8.5px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5"><span class="material-symbols-outlined text-[13px]">pause_circle</span>SESSION EN PAUSE // HORLOGE FIGÉE</span>' }[mode];
    var chan = { live: '<span class="font-code-serial text-[8.5px] text-slate-400 tracking-widest uppercase">CANAL 03 // LIVE</span>',
      alert: '<span class="font-code-serial text-[8.5px] text-slate-400 tracking-widest uppercase">CANAL 03 // LIVE</span>',
      err: '<span class="font-code-serial text-[9px] text-[#ff8080] tracking-widest uppercase font-bold">CANAL 03 // LIVE</span>',
      ok: '<span class="font-code-serial text-[9px] text-slate-400 tracking-widest uppercase">CANAL 03 // OK</span>',
      pause: '<span class="font-code-serial text-[9px] text-slate-400 tracking-widest uppercase">STANDBY // T-HOLD</span>' }[mode];
    var waiting = paused ? '<div class="relative z-15 flex items-center justify-center gap-2 pb-1"><div class="h-[1px] w-6 bg-gradient-to-r from-transparent to-amber-400/60"></div><span class="font-code-serial text-[10px] font-extrabold text-amber-300 tracking-widest uppercase flex items-center gap-1 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30"><span class="material-symbols-outlined text-[12px] animate-spin">sync</span><span id="zt-wait"></span></span><div class="h-[1px] w-6 bg-gradient-to-l from-transparent to-amber-400/60"></div></div>' : "";
    var tele =
      '<section class="rugged-chassis rounded-xl p-2.5 relative shrink-0' + (mode === "err" ? " border-[#522020]" : "") + '">' + SCR_TELE + screws("screw-rot-1", "screw-rot-2", "screw-rot-3", "screw-rot-4") +
      '<div class="px-6 flex items-center justify-between h-[16px] overflow-hidden"><div class="flex items-center gap-2">' + head + '</div>' + chan + '</div>' +
      '<div class="relative mt-1 mx-2 p-1.5 rounded-lg bezel-screen-recess overflow-hidden"><div class="polycarbonate-screen-glare' + (mode === "ok" ? " glare-green" : "") + ' absolute inset-0 pointer-events-none z-20"></div>' +
      (paused ? '<div class="pause-scanline-veil absolute inset-0 pointer-events-none z-10"></div>' : "") +
      '<svg class="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-10" preserveAspectRatio="none"><line stroke="#ffffff" stroke-width="0.75" x1="10%" x2="35%" y1="15%" y2="85%"></line><line stroke="#ffffff" stroke-width="0.5" x1="70%" x2="90%" y1="18%" y2="72%"></line><line opacity="0.3" stroke="#ff9f32" stroke-dasharray="2 4" stroke-width="0.5" x1="5%" x2="95%" y1="50%" y2="50%"></line></svg>' +
      waiting +
      '<div class="flex items-baseline justify-center relative z-15 py-0"><div class="font-display-timer text-[38px] leading-tight font-bold tracking-wider transition-colors duration-300" id="chrono-display">00:00</div><span class="ml-1.5 font-code-serial text-[15px] font-bold tracking-widest transition-colors duration-300" id="chrono-ms">.00</span>' +
      (paused ? '<span class="ml-2.5 px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-[8px] font-code-serial text-slate-400 uppercase tracking-widest">FIGÉ</span>' : "") + '</div>' +
      '<div class="mt-0.5 pt-1 border-t border-[#182029] grid grid-cols-2 gap-2 items-center relative z-15">' +
      '<div class="flex flex-col gap-0.5"><div class="flex items-center gap-1"><span class="material-symbols-outlined text-error text-[11px]">warning</span><span class="font-label-sm text-[7.5px] font-bold tracking-wider text-error uppercase">ERREURS ' + g.errors + '/3</span></div><div class="flex items-center gap-1.5">' + diodes + '</div></div>' +
      '<div class="flex flex-col items-end gap-0.5"><div class="flex items-center gap-1 ' + (mode === "ok" ? "text-[#00ffaa]" : "text-secondary") + '"><span class="font-label-sm text-[7.5px] font-bold tracking-wider uppercase">MODULES VALIDÉS ' + solved + '/3</span><span class="material-symbols-outlined text-[11px]">grid_view</span></div><div class="flex items-center gap-1 w-20 h-3 bg-[#0e1216] p-0.5 rounded border border-[#28323d] shadow-inner">' + crans + '</div></div>' +
      '</div></div></section>';

    // --- sélection des 3 modules (cadrans encastrés)
    var cells = g.panels.map(function (p, idx) {
      var on = idx === activePanel, ok = p.state === "solved", w = p.wires.length;
      var cls, led, ico, nameCls, wCls, bar;
      if (on) {
        cls = "module-cell-recess rounded-lg p-1.5 flex flex-col items-center justify-between active:scale-[0.97] transition-transform text-left cursor-pointer border-2 " + (ok ? "border-[#00ffaa] bg-gradient-to-b from-[#0d2a20] to-[#14181f] shadow-[0_0_14px_rgba(0,255,170,0.35)]" : "border-primary bg-gradient-to-b from-[#2a1c0d] to-[#14181f] shadow-[0_0_14px_rgba(255,159,50,0.4)]");
        led = ok ? '<span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span>' : '<span class="pilot-led-orange animate-pulse"></span>';
        nameCls = ok ? "font-black text-[#00ffaa]" : "font-black text-primary";
        ico = ok ? '<span class="material-symbols-outlined text-[13px] text-[#00ffaa] font-black drop-shadow-[0_0_4px_rgba(0,255,170,0.8)]">check_circle</span>' : '<span class="material-symbols-outlined text-[13px] text-primary font-black animate-spin" style="animation-duration: 8s;">sync</span>';
        wCls = ok ? "font-black text-[#d1fae5]" : "font-black text-[#ffdcbf]";
        bar = ok ? '<div class="w-full h-1 rounded-full bg-[#00ffaa] shadow-[0_0_8px_#00ffaa] mt-1"></div>' : '<div class="w-full h-1 rounded-full bg-primary shadow-[0_0_10px_#ff9f32] mt-1 animate-pulse"></div>';
      } else if (ok) {
        cls = "module-cell-recess rounded-lg p-1.5 flex flex-col items-center justify-between active:scale-[0.97] transition-transform text-left cursor-pointer border border-[#1b3d2f]";
        led = '<span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa]"></span>'; nameCls = "font-bold text-[#00ffaa]";
        ico = '<span class="material-symbols-outlined text-[13px] text-[#00ffaa] font-black drop-shadow-[0_0_4px_rgba(0,255,170,0.8)]">check_circle</span>';
        wCls = "font-black text-[#d1fae5]"; bar = '<div class="w-full h-1 rounded-full bg-[#00ffaa] shadow-[0_0_8px_#00ffaa] mt-1"></div>';
      } else {
        cls = "module-cell-recess rounded-lg p-1.5 flex flex-col items-center justify-between active:scale-[0.97] transition-transform text-left cursor-pointer border border-[#222933] opacity-75";
        led = '<span class="w-1.5 h-1.5 rounded-full bg-[#2a333e]"></span>'; nameCls = "font-semibold text-slate-400";
        ico = '<span class="material-symbols-outlined text-[13px] text-slate-500 font-light">lock_open</span>';
        wCls = "font-bold text-slate-400"; bar = '<div class="w-full h-1 rounded-full bg-[#161c24] border border-[#252f3b] mt-1"></div>';
      }
      return '<button class="' + cls + '" type="button" data-panel="' + idx + '"><div class="w-full flex items-center justify-between mb-0.5"><div class="flex items-center gap-1">' + led + '<span class="font-label-sm text-[8px] ' + nameCls + ' tracking-wider uppercase">MODULE ' + (idx + 1) + '</span></div>' + ico + '</div><span class="font-code-serial text-[11px] ' + wCls + ' tracking-tight leading-none my-0.5">' + w + ' FILS</span>' + bar + '</button>';
    }).join("");
    var select =
      '<section class="rugged-chassis rounded-xl p-2.5 relative shrink-0">' + SCR_SEL + screws("screw-rot-3", "screw-rot-1", "screw-rot-4", "screw-rot-2") +
      '<div class="px-6 pb-1 flex items-center justify-between border-b border-[#3b434e]/60"><div class="flex items-center gap-2"><span class="pilot-led-green"></span><span class="font-label-sm text-[8.5px] font-bold text-slate-200 tracking-wider uppercase">MODULE SELECT // RACK-01</span></div>' +
      '<div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#101419] border border-[#2e3742] shadow-inner"><span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_5px_#00ffaa]"></span><span class="font-code-serial text-[8px] font-bold text-[#a7f3d0] tracking-wider uppercase">' + solved + '/3 VALIDÉ</span></div></div>' +
      '<div class="grid grid-cols-3 gap-1.5 pt-1.5 mx-2">' + cells + '</div></section>';

    var errBanner = "";

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
      var cutBase = (color === "white" || color === "black") ? base : "#10141a";
      var cs = color === "white" ? { o: "0.95", w: "2.4" } : { o: "0.8", w: "2" };
      var top = zi === order.length - 1;
      if (isCut) {
        var anim = cutNow === o;
        var cu = function (x, y, dir) { return "M " + r1(x) + "," + r1(y - 1) + " L " + r1(x + dir * 13) + "," + r1(y - 7) + " M " + r1(x + dir) + "," + r1(y) + " L " + r1(x + dir * 16) + "," + r1(y) + " M " + r1(x) + "," + r1(y + 1) + " L " + r1(x + dir * 12) + "," + r1(y + 7); };
        wiresSvg += '<g class="opacity-80" data-wire-group="' + o + '" pointer-events="none">' +
          '<g' + (anim ? ' class="cut-recoil-left"' : "") + '><path d="' + P.left + '" fill="none" stroke="' + cutBase + '" stroke-linecap="round" stroke-width="14.5"></path><path d="' + P.left + '" fill="none" stroke="' + grad + '" stroke-linecap="round" stroke-width="13"></path><path transform="translate(0,-2.5)" d="' + P.left + '" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="' + cs.w + '" opacity="' + cs.o + '"></path><path d="' + cu(P.ex, P.ey, 1) + '" fill="none" stroke="url(#copper-wires)" stroke-linecap="round" stroke-width="2.2"></path></g>' +
          '<g' + (anim ? ' class="cut-recoil-right"' : "") + '><path d="' + cu(P.sx, P.sy, -1) + '" fill="none" stroke="url(#copper-wires)" stroke-linecap="round" stroke-width="2.2"></path><path d="' + P.right + '" fill="none" stroke="' + cutBase + '" stroke-linecap="round" stroke-width="14.5"></path><path d="' + P.right + '" fill="none" stroke="' + grad + '" stroke-linecap="round" stroke-width="13"></path><path transform="translate(0,-2.5)" d="' + P.right + '" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-width="' + cs.w + '" opacity="' + cs.o + '"></path></g></g>';
      } else {
        wiresSvg += '<g class="' + (locked ? "" : "interactive-wire-group") + (isSel ? " wire-selected-glow" : "") + '"' + (locked ? ' pointer-events="none"' : ' data-wire="' + o + '"') + '>' +
          (top ? '<path d="' + P.full + '" fill="none" filter="url(#crossing-shadow)" opacity="0.92" pointer-events="none" stroke="#000000" stroke-linecap="round" stroke-width="15"></path>' : "") +
          '<path d="' + P.full + '" fill="none" stroke="' + base + '" stroke-linecap="round" stroke-width="' + (color === "black" ? "15.5" : "15") + '"></path>' +
          '<path class="wire-body-core" d="' + P.full + '" fill="none" stroke="' + grad + '" stroke-linecap="round" stroke-width="13.5"></path>' +
          (color === "black"
            ? '<path transform="translate(0,-2.5)" d="' + P.full + '" fill="none" opacity="0.55" stroke="#9ca3af" stroke-linecap="round" stroke-width="1.8"></path><path transform="translate(0,-3)" d="' + P.full + '" fill="none" opacity="0.75" stroke="#cbd5e1" stroke-linecap="round" stroke-width="0.8"></path>'
            : '<path transform="translate(0,-2.5)" d="' + P.full + '" fill="none" opacity="' + (color === "white" ? "0.95" : "0.82") + '" stroke="' + spec + '" stroke-linecap="round" stroke-width="' + (color === "white" ? "2.4" : "2.2") + '"></path><path transform="translate(0,-3)" d="' + P.full + '" fill="none" opacity="0.95" stroke="#ffffff" stroke-linecap="round" stroke-width="0.9"></path>') + '</g>';
      }
    });

    var modHead = isSolved
      ? '<div class="px-4 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-[#10291f] border border-[#00ffaa]/60 flex items-center justify-center text-[#00ffaa] shadow-[0_0_8px_rgba(0,255,170,0.35)]"><span class="material-symbols-outlined text-[17px] font-bold">check</span></div><div class="flex flex-col"><span class="font-label-sm text-[7.5px] tracking-widest text-[#00ffaa] uppercase font-bold">MODULE ' + n + ' FILS // RÉSOLU ✓</span><span class="font-headline-sm text-[12px] font-bold text-white tracking-wide">CORPS DE LIAISON PRINCIPAL</span></div></div>' +
        '<div class="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#122e22] via-[#1a3d2e] to-[#122e22] border border-[#00ffaa]/70 shadow-[0_0_12px_rgba(0,255,170,0.35)] flex items-center gap-1.5"><span class="material-symbols-outlined text-[#00ffaa] text-[14px] font-bold">verified</span><div class="flex flex-col items-end"><span class="font-code-serial text-[9.5px] font-black tracking-wider text-[#00ffaa] leading-tight">RÉSOLU ✓</span><span class="font-code-serial text-[7px] text-[#71cf9e] tracking-widest uppercase" id="zt-serial"></span></div></div></div>'
      : '<div class="px-6 flex items-center justify-between"><div class="flex items-center gap-1.5"><div class="w-6 h-6 rounded bg-[#20262e] border border-[#3b4552] flex items-center justify-center ' + (paused ? "text-secondary" : "text-primary") + ' shadow-inner"><span class="material-symbols-outlined text-[15px]">cable</span></div><div class="flex flex-col"><span class="font-label-sm text-[7px] tracking-widest text-slate-300 uppercase">MODULE ' + n + ' FILS // HARNESS</span><span class="font-headline-sm text-[11px] font-bold text-white tracking-wide">CORPS DE LIAISON PRINCIPAL</span></div></div>' +
        '<div class="px-2 py-0.5 rounded bg-gradient-to-r from-[#232931] via-[#2f3742] to-[#232931] border border-[#444f5c] shadow-sm flex items-center gap-1.5"><div class="flex flex-col items-end"><span class="font-label-sm text-[6px] text-slate-400 uppercase tracking-widest leading-none">SÉRIE / LOT</span><span class="font-code-serial text-[10px] font-black tracking-widest text-[#ffdcbf] leading-tight" id="zt-serial"></span></div></div></div>';
    var resolvedBar = isSolved ? '<div class="absolute top-2 inset-x-12 z-40 resolved-badge-bar rounded-md px-3 py-1 flex items-center justify-between pointer-events-none"><div class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#00ffaa] shadow-[0_0_6px_#00ffaa] animate-ping"></span><span class="font-code-serial text-[9px] font-bold text-[#00ffaa] tracking-widest uppercase">CIRCUIT DÉSAMORCÉ AVEC SUCCÈS</span></div><span class="font-code-serial text-[8.5px] text-[#a4e6c3] tracking-widest font-semibold">STATUS: SECURE</span></div>' : "";
    var veil = paused ? '<div class="absolute inset-0 pointer-events-none z-25 bg-[#090d12]/30 backdrop-contrast-90"></div>' : "";
    var colCls = locked ? "flex flex-col justify-between py-0.5 z-30 pointer-events-none opacity-85" : "flex flex-col justify-between py-0.5 z-30 pointer-events-auto";
    var module =
      '<section class="rugged-chassis rounded-xl p-2.5 flex flex-col gap-1 relative min-h-0 flex-1">' + SCR_MOD + screws("screw-rot-4", "screw-rot-3", "screw-rot-2", "screw-rot-1") + modHead +
      '<div class="relative bay-chassis-inner rounded-lg p-1 mx-2 flex items-stretch justify-between overflow-hidden" id="harness-chamber">' + veil +
      '<div class="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between py-4 px-10"><div class="h-0.5 border-b border-dashed border-slate-400"></div><div class="h-0.5 border-b border-dashed border-slate-400"></div><div class="h-0.5 border-b border-dashed border-slate-400"></div><div class="h-0.5 border-b border-dashed border-slate-400"></div></div>' + resolvedBar +
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
      cmd = '<section class="mb-0.5 flex flex-col gap-0.5 shrink-0"><div class="flex items-center justify-between px-2 font-code-serial text-[9px] whitespace-nowrap"><span class="flex items-center gap-1.5 text-secondary"><span class="w-2 h-2 rounded-full ' + (selectedWire ? "bg-primary shadow-[0_0_8px_#ff9f32] animate-pulse" : "bg-slate-500") + ' transition-colors"></span><span class="uppercase tracking-wider">PINCE HYDRAULIQUE PRÊTE</span></span><span class="font-bold ' + (selectedWire ? "text-primary" : "text-slate-400") + ' tracking-wider uppercase transition-colors" id="zt-target"></span></div>' +
        '<div class="p-1 rounded-xl bg-gradient-to-b from-[#282e36] to-[#1a1f25] border border-[#363f4b] shadow-xl relative overflow-hidden">' + SCR_PUSH + '<button class="push-trigger-heavy w-full min-h-[44px] rounded-lg text-[#261100] font-headline-sm text-[14px] font-black tracking-widest uppercase flex items-center justify-center gap-2 select-none transition-all duration-150 relative z-20' + (selectedWire ? "" : " opacity-40 pointer-events-none grayscale cursor-not-allowed") + '"' + (selectedWire ? "" : " disabled") + ' id="cut-wire-button" type="button"><span class="material-symbols-outlined text-[20px]">content_cut</span><span>COUPER CE FIL</span><span class="material-symbols-outlined text-[17px]">bolt</span></button></div></section>';
    }

    var hsel = g.panels.map(function (p, idx) { return idx === activePanel
      ? '<span class="px-2 py-0.5 rounded bg-[#272e37] text-[8px] font-code-serial font-bold text-primary border border-primary/40 shadow-sm">' + p.wires.length + ' FILS</span>'
      : '<span class="px-1.5 py-0.5 rounded text-[8px] font-code-serial font-semibold text-slate-400">' + p.wires.length + 'F</span>'; }).join("");
    app.innerHTML =
      ((mode === "err" || (!paused && remNow <= 30000)) ? '<div class="alarm-vignette-overlay fixed inset-0 pointer-events-none z-40"' + (remNow <= 30000 && !showErr ? ' style="animation-duration:.6s"' : "") + '></div>' : "") +
      '<header class="fixed top-0 left-0 right-0 z-50 pt-safe bg-[#20252c]/95 border-b border-[#353d47] backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.6)]"><div class="h-11 px-3 flex items-center justify-between max-w-md mx-auto">' +
      '<div class="flex items-center gap-2"><div aria-hidden="true" class="w-7 h-7 flex items-center justify-center rounded bg-[#1a1e24] border border-[#373f4a] text-secondary shadow-inner"><span class="material-symbols-outlined text-[17px]">arrow_back</span></div><div class="flex flex-col"><div class="flex items-center gap-1.5">' + topLed + '</div><span class="font-headline-sm text-[13px] font-bold tracking-tight text-white flex items-center gap-1.5">BAIE CÂBLAGE <span class="text-[9.5px] text-secondary font-code-serial font-normal">[MOD-0' + (activePanel + 1) + ']</span></span></div></div>' +
      '<div class="flex items-center gap-2"><div class="flex items-center p-0.5 rounded bg-[#14181e] border border-[#2f3640]">' + hsel + '</div><div class="h-[22px] flex items-center">' + badge + '</div></div></div></header>' +
      '<main class="flex-1 w-full max-w-md mx-auto px-2 pb-safe flex flex-col justify-between gap-1 overflow-hidden relative z-30" id="tactical-rack">' + errBanner + tele + select + module + cmd + '</main>';

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
      var cls = paused ? "timer-neon-paused" : (ms > 20000 ? "timer-neon-green" : "timer-neon-alert");
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

  // ===== Carnet du technicien (design TE04 Stitch : papier recyclé manuscrit) =====
  function escH(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var WCOL = { rouge: "red", blanc: "white", bleu: "blue", jaune: "yellow", noir: "black" };
  function inkText(t) {
    return escH(t).replace(/\b(rouge|blanc|bleu|jaune|noir)\b/g, function (w) { return '<span class="wire-sketch wire-' + WCOL[w] + ' w-7 mx-1"></span>'; })
      .replace(/(\d)(er|e)\b/g, "$1<sup>$2</sup>");
  }
  function ruleParts(r) {
    var k = r.t.indexOf(" : "), cond = k < 0 ? r.t : r.t.slice(0, k), act = k < 0 ? "" : r.t.slice(k + 3);
    act = act.replace(/^coupe /, "couper "); act = act.charAt(0).toUpperCase() + act.slice(1);
    return { cond: cond, act: act, dflt: /^Sinon$/.test(cond) };
  }
  function ruleLi(r, idx, circle) {
    var p = ruleParts(r), n = String(r.n).split(".").pop();
    var bg = p.dflt ? "bg-slate-200/40 p-1.5 rounded border border-slate-400/30" : (idx % 2 === 0 ? "bg-amber-50/40 p-1.5 rounded border border-dashed border-amber-900/20" : "p-1.5 rounded");
    var cond = p.dflt ? '<span class="font-bold underline">Sinon</span> :' : inkText(p.cond) + " :";
    var act = '<div class="font-notes text-sm text-inkRed font-bold ' + (circle ? "pl-2" : "pl-3") + ' pt-0.5">➔ ' + inkText(p.act) + "</div>";
    if (circle) return '<li class="flex items-start gap-2.5 ' + bg + '"><span class="font-notes font-bold text-inkBlue text-base bg-amber-200/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">' + n + '</span><div class="leading-snug"><span>' + cond + "</span>" + act + "</div></li>";
    return '<li class="' + bg + '"><span class="font-notes font-bold text-inkBlue text-base bg-amber-200/60 px-1.5 rounded">' + n + "</span> <span>" + cond + "</span>" + act + "</li>";
  }
  var TECH_ORDER = ["lecture", "w3", "w4", "w5", "w6", "w7", "w8"];
  var TECH_META = {
    lecture: { tab: "📌 Lire un panneau", title: "Section 02 — Lire un Panneau", sub: "Protocole de communication avec l'opérateur", pg: "p. 02", ind: "Page 2 / 8 — Lire un panneau" },
    w3: { tab: "3 fils", title: "Section 03 — Module 3 fils", sub: "Configuration compacte à 3 connexions", pg: "p. 03", ind: "Page 3 / 8 — Module 3 fils" },
    w4: { tab: "4 fils", title: "Section 04 — Module 4 fils", sub: "Règles de désamorçage de la baie câblée à 4 connexions", pg: "p. 04", ind: "Page 4 / 8 — Module 4 fils" },
    w5: { tab: "5 fils", title: "Section 05 — Module 5 fils", sub: "Harnais principal lourd à 5 connexions", pg: "p. 05", ind: "Page 5 / 8 — Module 5 fils" },
    w6: { tab: "6 fils", title: "Section 06 — Module 6 fils", sub: "Faisceau étendu à 6 connexions", pg: "p. 06", ind: "Page 6 / 8 — Module 6 fils" },
    w7: { tab: "7 fils", title: "Section 07 — Module 7 fils", sub: "Faisceau dense à 7 connexions", pg: "p. 07", ind: "Page 7 / 8 — Module 7 fils" },
    w8: { tab: "8 fils", title: "Section 08 — Module 8 fils", sub: "Harnais maximal à 8 connexions", pg: "p. 08", ind: "Page 8 / 8 — Module 8 fils" },
    index: { tab: "", title: "Sommaire du Manuel", sub: "Index rapide des modules de déminage", pg: "INDEX", ind: "Sommaire général" }
  };
  var techQuery = "";
  function techHead(k, extra) {
    var m = TECH_META[k];
    return '<div class="border-b-2 border-inkBlue/30 pb-2 mb-3 flex items-baseline justify-between"><div><div class="font-hand text-3xl font-bold text-inkBlue tracking-wide flex items-center gap-2"><span>' + m.title + "</span>" + (extra || "") + '</div><p class="font-notes text-xs text-slate-600 italic">' + m.sub + '</p></div><div class="font-typewriter text-xs text-slate-500 font-bold">' + m.pg + "</div></div>";
  }
  function techPageHtml(k, m) {
    if (k === "w4") {
      return techHead(k, '<span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-notes text-inkRed border border-inkRed/40 bg-red-50/50 rotate-[-2deg]">URGENT</span>') +
        '<ol class="space-y-3 font-hand text-lg text-inkBlue">' + m.w4.map(function (r, i) { return ruleLi(r, i, true); }).join("") + "</ol>" +
        '<div class="mt-4 pt-2 border-t border-inkBlue/20 flex items-center justify-end"><div class="font-notes text-[11px] text-inkRed font-bold">✓ Révision atelier 03/A</div></div>';
    }
    if (k === "w3" || k === "w5" || k === "w6" || k === "w7" || k === "w8") {
      return techHead(k) + '<ol class="space-y-' + (k === "w5" ? "2.5" : "3") + ' font-hand text-lg text-inkBlue">' + m[k].map(function (r, i) { return ruleLi(r, i, false); }).join("") + "</ol>";
    }
    if (k === "lecture") {
      var L = ["Étape A : Annoncer le module", "Étape B : Relever le numéro de série", "Étape C : Lister les couleurs"];
      return techHead(k) + '<div class="space-y-3 font-hand text-lg text-inkBlue leading-snug">' + m.read.map(function (t, i) {
        return '<div class="bg-amber-100/40 p-2.5 rounded border border-amber-800/30"><span class="font-notes text-xs font-bold text-inkRed uppercase tracking-wider block">' + L[i % 3] + '</span><p class="mt-1">' + escH(t) + "</p></div>";
      }).join("") + "</div>";
    }
    var items = [["lecture", "📌", "Lire un panneau", "(protocole série, comptage)", "p. 02"], ["w3", "⚡", "Module 3 fils", "(combinaisons de base)", "p. 03"], ["w4", "⚡", "Module 4 fils", "(série pair/impair & règles)", "p. 04"], ["w5", "⚡", "Module 5 fils", "(harnais complexe à 5 brins)", "p. 05"], ["w6", "⚡", "Module 6 fils", "(faisceau étendu)", "p. 06"], ["w7", "⚡", "Module 7 fils", "(faisceau dense)", "p. 07"], ["w8", "⚡", "Module 8 fils", "(harnais maximal)", "p. 08"]];
    return techHead("index") +
      '<div class="mb-4 bg-amber-50/70 p-2.5 rounded border border-amber-900/30 shadow-inner"><label class="block font-notes text-xs text-slate-700 font-bold mb-1">🔍 Recherche de mot-clé ou module :</label><div class="relative"><input type="text" id="indexSearchInput" placeholder="Ex: 4 fils, série, pair..." class="w-full bg-transparent border-b-2 border-inkBlue text-inkBlue font-hand text-xl px-1 py-0.5 focus:outline-none focus:border-inkRed placeholder-slate-400"/><span class="absolute right-1 top-1 text-xs text-slate-400 font-notes italic">écrire ici</span></div></div>' +
      '<ul id="indexList" class="space-y-2.5 font-hand text-lg text-inkBlue">' + items.map(function (x) {
        return '<li class="index-item flex items-center justify-between border-b border-dotted border-inkBlue/40 pb-1 cursor-pointer" data-go="' + x[0] + '"><span class="flex items-center gap-2"><span>' + x[1] + "</span> <b>" + x[2] + '</b> <span class="font-notes text-xs text-slate-500">' + x[3] + '</span></span><span class="font-typewriter text-sm font-bold text-inkBlue">' + x[4] + "</span></li>";
      }).join("") + '<li class="index-item flex items-center justify-between border-b border-dotted border-inkBlue/40 pb-1 opacity-50"><span class="flex items-center gap-2"><span>🔒</span> Module Clavier & Symboles</span><span class="font-typewriter text-sm text-slate-400">p. 09</span></li></ul>';
  }

  function renderTechnician() {
    stopTimer();
    var m = view.manual, k = TECH_META[manualTab] ? manualTab : "w4", meta = TECH_META[k], paused = view.paused;
    var tabs = TECH_ORDER.map(function (t) {
      return t === k
        ? '<button data-tab="' + t + '" class="tab-btn tab-active px-3 py-1.5 text-sm font-hand text-inkBlue bg-[#f4ecdf] border-t-2 border-x-2 border-amber-800/40 rounded-t-lg shadow-sm whitespace-nowrap">' + TECH_META[t].tab + "</button>"
        : '<button data-tab="' + t + '" class="tab-btn px-2.5 py-1 text-xs font-hand text-slate-400 bg-[#352d24] border-t border-x border-[#524436] rounded-t-md whitespace-nowrap">' + TECH_META[t].tab + "</button>";
    }).join("");
    var lex = m.lexicon.concat([m.penalties]).map(function (t) { return "<div>• " + escH(t) + "</div>"; }).join("");
    var pauseBox = paused ? '<div class="absolute inset-x-3 top-3 z-40 bg-amber-100 border-2 border-inkRed rounded p-2.5 text-center shadow-lg"><div class="font-hand text-2xl font-bold text-inkRed">⏸ En attente de ' + escH(paused.pseudo) + '</div><div class="font-notes text-xs text-slate-700">La partie est en pause. Le temps ne s\'écoule plus.</div>' + (paused.can_abandon ? '<button id="zt-t-abort" class="mt-2 px-3 py-1 rounded border-2 border-inkRed text-inkRed font-notes text-xs font-bold">Abandonner la partie</button>' : "") + "</div>" : "";
    app.innerHTML =
      '<header class="flex items-center justify-between px-2 pt-1 pb-1 z-20"><div class="flex items-center space-x-2"><span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span><span class="font-tech text-xs tracking-wider text-slate-400 font-bold uppercase">UNITÉ SUPPORT // TECHNICIEN</span><span class="font-tech text-[10px] text-slate-500 border border-slate-700/80 px-1 rounded">MANUEL TE04</span></div>' +
      '<button data-tab="index" class="relative ribbon-bookmark px-3 py-1.5 rounded-t-sm text-amber-100 font-tech text-xs tracking-widest font-bold uppercase flex items-center gap-1 active:translate-y-0.5 transition-transform" title="Ouvrir le Sommaire"><svg class="w-3.5 h-3.5 fill-amber-200" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></svg><span>INDEX</span></button></header>' +
      '<nav class="flex items-end space-x-1 px-3 z-10 overflow-x-auto pt-1" id="tabBar">' + tabs + "</nav>" +
      '<div class="relative flex-1 paper-sheet paper-edge mx-1.5 mb-1.5 p-0 overflow-hidden flex flex-col z-20" id="tech-sheet" style="min-height:0"><div class="paperclip"></div><div class="coffee-stain top-4 right-10"></div><div class="tape-strip absolute -top-1 -left-2 w-14 h-5 rotate-[-25deg] z-10 pointer-events-none"></div>' + pauseBox +
      '<div class="paper-content-scroll ruled-lines p-4 sm:p-5 flex flex-col justify-between" id="pageContainer"><div class="page-view flex-1 flex flex-col">' + techPageHtml(k, m) + "</div>" +
      '<footer class="mt-4 pt-3 border-t-2 border-dashed border-amber-900/30 bg-amber-100/30 p-2 rounded"><div class="flex items-center gap-1.5 mb-1"><span class="font-notes text-xs font-bold text-inkRed">📖 RAPPEL LEXIQUE & CONVENTIONS :</span></div><div class="grid grid-cols-2 gap-2 font-hand text-sm text-slate-700">' + lex + "</div></footer></div>" +
      '<div class="border-t border-amber-900/20 bg-[#ede4d4] px-4 py-2 flex items-center justify-between text-xs font-notes text-inkBlue"><button id="btnPrev" class="flex items-center gap-1 font-bold text-inkBlue active:scale-95 transition-transform"><span>⟵</span> <span>Précédent</span></button><div class="flex items-center gap-1 font-typewriter text-[11px] text-slate-600 bg-amber-200/50 px-2 py-0.5 rounded border border-amber-800/30"><span>' + meta.ind + '</span></div><button id="btnNext" class="flex items-center gap-1 font-bold text-inkBlue active:scale-95 transition-transform"><span>Suivant</span> <span>⟶</span></button></div></div>';

    function go(t) { manualTab = t; render(); }
    function step(d) { var i = TECH_ORDER.indexOf(manualTab); if (i < 0) i = TECH_ORDER.indexOf("w4"); go(TECH_ORDER[(i + d + TECH_ORDER.length) % TECH_ORDER.length]); }
    Array.prototype.forEach.call(app.querySelectorAll("[data-tab]"), function (b) { b.onclick = function () { go(b.getAttribute("data-tab")); }; });
    Array.prototype.forEach.call(app.querySelectorAll("[data-go]"), function (b) { b.onclick = function () { go(b.getAttribute("data-go")); }; });
    document.getElementById("btnPrev").onclick = function () { step(-1); };
    document.getElementById("btnNext").onclick = function () { step(1); };
    var ab = document.getElementById("zt-t-abort");
    if (ab) ab.onclick = function () {
      if (!window.confirm("Abandonner la partie ?")) return;
      sb.rpc("zt_abandon", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
    };
    var inp = document.getElementById("indexSearchInput");
    if (inp) {
      var filt = function () {
        techQuery = inp.value;
        Array.prototype.forEach.call(app.querySelectorAll("#indexList .index-item"), function (it) { it.style.display = it.textContent.toLowerCase().indexOf(techQuery.toLowerCase()) >= 0 ? "flex" : "none"; });
      };
      inp.value = techQuery; filt(); inp.oninput = filt;
    }
    var sx = 0, sy = 0, pc = document.getElementById("pageContainer");
    pc.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].screenX; sy = e.changedTouches[0].screenY; }, { passive: true });
    pc.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].screenX - sx, dy = e.changedTouches[0].screenY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function renderPlaying() {
    clear();
    if (view.me.role === "operator" && view.game) return renderOperator();
    if (view.me.role === "technician" && view.manual) return renderTechnician();
    app.appendChild(el("div", { class: "card" }, [el("div", { class: "muted", text: "Chargement…" })]));
  }

  var endFxKey = null;
  var audioCtx = null;
  function playBoomSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime, size = audioCtx.sampleRate * 1.2;
      var buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate), data = buffer.getChannelData(0);
      for (var i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      var noise = audioCtx.createBufferSource(); noise.buffer = buffer;
      var filter = audioCtx.createBiquadFilter(); filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, now); filter.frequency.exponentialRampToValueAtTime(45, now + 1.1);
      var osc = audioCtx.createOscillator(); osc.type = "sine";
      osc.frequency.setValueAtTime(120, now); osc.frequency.exponentialRampToValueAtTime(28, now + 0.9);
      var og = audioCtx.createGain(); og.gain.setValueAtTime(0.7, now); og.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      var ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.9, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      noise.connect(filter); filter.connect(ng); ng.connect(audioCtx.destination);
      osc.connect(og); og.connect(audioCtx.destination);
      noise.start(now); osc.start(now); noise.stop(now + 1.2); osc.stop(now + 1.2);
    } catch (e) {}
  }
  function triggerDetonationFX() {
    var rumble = $("screen-rumble-container"), flash = $("explosion-flash-layer"), r1 = $("shockwave-ring-1"), r2 = $("shockwave-ring-2");
    if (!rumble) return;
    rumble.classList.remove("shake-active"); flash.classList.remove("flash-active");
    if (r1) r1.classList.remove("shockwave-active-1");
    if (r2) r2.classList.remove("shockwave-active-2");
    void rumble.offsetWidth;
    rumble.classList.add("shake-active"); flash.classList.add("flash-active");
    if (r1) r1.classList.add("shockwave-active-1");
    if (r2) r2.classList.add("shockwave-active-2");
    playBoomSound();
    buzz([120, 40, 200, 60, 90]);
  }

  function debriefHeader(z, extra) {
    return `<header class="fixed top-0 w-full ${z} bg-surface-container-low/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] pt-safe"><div class="h-14 px-margin flex items-center justify-between"><div class="flex items-center gap-space-sm"><button aria-label="Retour" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors focus:outline-none" id="btn-back"><span class="material-symbols-outlined text-[20px]">arrow_back</span></button><div class="flex flex-col"><span class="font-label-sm text-label-sm text-primary tracking-widest uppercase">SYS // LIVE-ENGAGE</span><h1 class="font-headline-sm text-headline-sm tracking-tight text-on-surface uppercase">Mission Debrief</h1></div></div><div class="flex items-center gap-space-sm"><div class="flex items-center gap-space-xs px-2 py-0.5 bg-surface-container rounded-sm"><span class="w-2 h-2 rounded-full bg-primary-container animate-ping"></span><span class="font-label-sm text-label-sm text-primary-fixed">ARMÉ</span></div>${extra}</div></div></header>`;
  }

  function renderEnded() {
    stopTimer(); clear();
    var e = view.end, isOp = !(view.me && view.me.role === "technician");
    var done = false;
    function bind() {
      var b = $("btn-back"); if (b) b.onclick = leaveRoom;
      var rp = $("btn-replay"); if (rp) rp.onclick = function () { if (done) return; done = true; doReplay(); };
    }
    if (e.outcome === "abandoned") {
      app.innerHTML = S(`${debriefHeader("z-50", `<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[18px]">person</span></div>`)}<main class="flex-1 flex flex-col relative w-full px-margin pt-14 pb-safe bg-surface"><div class="flex flex-col w-full max-w-md mx-auto space-y-3 pb-4 pt-3"><div class="relative bg-surface-container rounded-xl p-4 shadow-xl overflow-hidden flex flex-col items-center text-center"><div class="relative w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-[0_0_24px_rgba(255,159,50,0.35)]"><span class="material-symbols-outlined text-primary-container text-[36px]" style="font-variation-settings: 'FILL' 1;">flag</span></div><span class="font-label-sm text-label-sm text-primary-container tracking-widest uppercase mt-2">SYS_ORDNANCE // INTERROMPU</span><h2 class="font-headline-lg-mobile text-headline-lg-mobile text-primary-container uppercase tracking-tight mt-0.5">PARTIE ABANDONNÉE</h2></div><button class="relative w-full h-14 bg-primary-container hover:bg-primary active:scale-[0.98] rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(255,159,50,0.35)] transition-all" id="btn-replay"><span class="material-symbols-outlined text-surface-container-lowest text-[22px] font-bold">replay</span><span class="font-label-lg text-label-lg tracking-wider text-surface-container-lowest font-bold uppercase">RÉENGAGER UNE PARTIE // REJOUER</span></button></div></main>`);
      bind(); return;
    }
    var solved = e.solved || 0, total = e.total || 3, errs = e.errors || 0;
    var hasTime = isOp && typeof e.remaining_ms === "number";
    if (e.outcome === "defused") {
      var t = fmtH(hasTime ? e.remaining_ms : 0);
      var lamps = [0, 1, 2].map(function (i) {
        return i < errs
          ? `<div class="w-6 h-6 rounded bg-error-container/60 flex items-center justify-center shadow-[0_0_8px_rgba(255,180,171,0.5)]"><span class="material-symbols-outlined text-error text-[16px]" style="font-variation-settings: 'FILL' 1;">warning</span></div>`
          : `<div class="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center"><span class="w-1.5 h-1.5 rounded-full bg-outline-variant"></span></div>`;
      }).join("");
      var mods = [1, 2, 3].map(function (i) {
        return `<div class="bg-surface-container p-2 rounded-lg flex flex-col items-center justify-center text-center shadow-inner"><span class="font-label-sm text-label-sm text-secondary">MOD-0${i}</span><span class="font-code-serial text-body-sm text-emerald-400 font-semibold truncate w-full">${escS(view.code)}-${i}</span><span class="font-label-sm text-label-sm text-emerald-400 mt-0.5 flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">done</span>CÂBLAGE</span></div>`;
      }).join("");
      var timeBlock = hasTime
        ? `<div class="font-display-timer-mobile text-display-timer-mobile text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]" id="timer-display">${t[0]}<span class="text-emerald-400/70 font-code-serial text-code-serial">${t[1]}</span></div>`
        : `<div class="flex flex-col items-end" id="timer-sealed"><div class="bg-surface-container-highest px-2.5 py-1 rounded font-label-sm text-label-sm text-primary tracking-widest uppercase flex items-center gap-1 shadow-inner"><span class="material-symbols-outlined text-[14px]">lock</span><span>NON TRANSMIS</span></div><span class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Restriction Manuel Tech</span></div>`;
      app.innerHTML = S(`${debriefHeader("z-50", `<div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined text-on-primary text-[18px]">person</span></div>`)}<main class="flex-1 flex flex-col relative w-full px-margin pt-14 pb-safe bg-surface"><div class="flex flex-col w-full max-w-md mx-auto space-y-3 pb-4">
<div class="relative bg-surface-container-high rounded-xl p-3 shadow-md overflow-hidden"><div class="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center shadow-inner"><div class="w-2.5 h-0.5 bg-outline transform rotate-45"></div></div><div class="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-surface-container-highest flex items-center justify-center shadow-inner"><div class="w-2.5 h-0.5 bg-outline -rotate-45"></div></div><div class="flex items-center justify-center gap-2 pl-3 pr-3 pt-0.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></span><span class="font-label-sm text-label-sm tracking-widest text-emerald-300 font-bold uppercase">SÉCURISÉ // DÉTONATION ANNULÉE</span><span class="material-symbols-outlined text-[16px] text-emerald-400" style="font-variation-settings: 'FILL' 1;">lock</span></div></div>
<div class="relative bg-surface-container rounded-xl p-4 shadow-xl overflow-hidden flex flex-col items-center text-center"><div class="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-surface-variant flex items-center justify-center shadow-inner"><div class="w-2 h-0.5 bg-outline transform rotate-12"></div></div><div class="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-surface-variant flex items-center justify-center shadow-inner"><div class="w-2 h-0.5 bg-outline transform -rotate-45"></div></div><div class="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-surface-variant flex items-center justify-center shadow-inner"><div class="w-2 h-0.5 bg-outline transform rotate-90"></div></div><div class="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-surface-variant flex items-center justify-center shadow-inner"><div class="w-2 h-0.5 bg-outline"></div></div>
<div class="relative my-1"><div class="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl"></div><div class="relative w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.35)]"><span class="material-symbols-outlined text-emerald-400 text-[36px]" style="font-variation-settings: 'FILL' 1;">verified_user</span></div></div>
<span class="font-label-sm text-label-sm text-emerald-400 tracking-widest uppercase mt-2">SYS_ORDNANCE // NEUTRALISÉ</span><h2 class="font-headline-lg-mobile text-headline-lg-mobile text-emerald-300 uppercase tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] mt-0.5">BOMBE DÉSAMORCÉE</h2><div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 mt-1 shadow-sm"><span class="material-symbols-outlined text-emerald-400 text-[14px]">check_circle</span><span class="font-code-serial text-body-sm text-emerald-200 uppercase font-semibold">Toutes charges inhibées</span></div></div>
<div class="grid grid-cols-1 gap-2.5">
<div class="relative bg-surface-container-low rounded-xl p-3 shadow-md flex items-center justify-between" id="telemetry-timer"><div class="flex flex-col"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">TEMPS RESTANT</span><span class="font-body-sm text-body-sm text-secondary">Marge sécuritaire d'intervention</span></div>${timeBlock}</div>
<div class="relative bg-surface-container-low rounded-xl p-3 shadow-md flex items-center justify-between"><div class="flex flex-col"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">INCIDENTS // ERREURS</span><span class="font-body-sm text-body-sm text-secondary">Tolérance seuil maximal : 3</span></div><div class="flex items-center gap-3"><div class="flex items-center gap-1.5 bg-surface-container-lowest px-2 py-1.5 rounded-lg shadow-inner">${lamps}</div><span class="font-headline-sm text-headline-sm text-on-surface">${errs}<span class="text-secondary font-body-sm">/3</span></span></div></div>
<div class="relative bg-surface-container-low rounded-xl p-3 shadow-md"><div class="flex items-center justify-between mb-2"><div class="flex flex-col"><span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">MODULES DÉSACTIVÉS</span><span class="font-body-sm text-body-sm text-secondary">Désengagement total validé</span></div><div class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-label-sm text-label-sm font-bold">${solved} / ${total} COMPLETS</div></div><div class="grid grid-cols-3 gap-2">${mods}</div></div>
</div>
<div class="pt-1"><button class="relative w-full h-14 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] rounded-xl flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(52,211,153,0.35)] transition-all overflow-hidden group" id="btn-replay"><div class="absolute inset-0 bg-gradient-to-r from-emerald-600/40 via-emerald-400/20 to-emerald-600/40 pointer-events-none"></div><span class="material-symbols-outlined text-surface-container-lowest text-[22px] font-bold transition-transform group-hover:rotate-180 duration-500">replay</span><span class="font-label-lg text-label-lg tracking-wider text-surface-container-lowest font-bold uppercase">RÉENGAGER UNE PARTIE // REJOUER</span><div class="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-emerald-700/60"></div><div class="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-700/60"></div><div class="absolute bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-emerald-700/60"></div><div class="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-700/60"></div></button></div>
</div></main>`);
      bind(); buzz([40, 60, 40]); return;
    }
    // ---- Explosion ----
    var timeout = e.cause !== "errors";
    var seg = [];
    for (var i = 0; i < total; i++) seg.push(i < solved ? `<div class="h-2 rounded-xs bg-primary-container shadow-[0_0_6px_#ff9f32]"></div>` : i === solved ? `<div class="h-2 rounded-xs bg-error animate-pulse shadow-[0_0_8px_#ffb4ab]"></div>` : `<div class="h-2 rounded-xs bg-surface-variant"></div>`);
    var cause = timeout ? "CAUSE : TEMPS ÉCOULÉ (00:00.00)" : "CAUSE : 3 ERREURS CRITIQUES (COURT-CIRCUIT)";
    var first = endFxKey !== session.code + ":" + (e.outcome || "") + ":" + solved + ":" + errs;
    endFxKey = session.code + ":" + (e.outcome || "") + ":" + solved + ":" + errs;
    var chrono = isOp
      ? `<div class="flex flex-col mt-1" id="chrono-op-view"><span class="font-display-timer-mobile text-display-timer-mobile text-error font-black leading-tight tracking-tight">${timeout ? `00:00<span class="text-label-md text-tertiary">.00</span>` : `--:--`}</span><span class="font-label-sm text-label-sm text-error/80 uppercase text-[9px]">${timeout ? "DÉPASSEMENT TOTAL" : "COURT-CIRCUIT"}</span></div>`
      : `<div class="flex flex-col items-center justify-center py-1" id="chrono-tech-view"><span class="material-symbols-outlined text-outline text-[20px] mb-0.5">lock</span><span class="font-label-sm text-[9px] text-center text-outline leading-tight font-bold uppercase tracking-tight">NON TRANSMIS // CONFIDENTIEL</span></div>`;
    app.innerHTML = S(`<div class="fixed inset-0 z-50 pointer-events-none${first ? " flash-active" : ""} transition-opacity" id="explosion-flash-layer"></div>
<div class="flex flex-col h-full w-full relative${first ? " shake-active" : ""}" id="screen-rumble-container">
${debriefHeader("z-40", `<button aria-label="Rejouer détonation" class="w-8 h-8 rounded-full bg-error-container/80 border border-error/50 flex items-center justify-center text-error hover:bg-error-container active:scale-95 transition-all" id="btn-fx" title="Rejouer l'onde de choc et détonation"><span class="material-symbols-outlined text-[18px]">electric_bolt</span></button>`)}
<main class="flex-1 flex flex-col relative w-full px-margin pt-14 pb-safe bg-surface min-h-0"><div class="flex flex-col w-full h-full overflow-hidden relative justify-between py-space-sm select-none">
<div class="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-error-container via-surface-container-lowest to-transparent animate-pulse"></div>
<div class="absolute inset-0 pointer-events-none opacity-10 bg-repeat bg-[radial-gradient(#ffb4ab_1px,transparent_1px)] [background-size:16px_16px]"></div>
<div class="absolute inset-0 pointer-events-none overflow-hidden z-[5]" id="embers-container"><div class="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_#ff9f32] ember-p1"></div><div class="absolute bottom-2/5 left-1/2 w-2 h-2 rounded-full bg-error shadow-[0_0_10px_#ffb4ab] ember-p2"></div><div class="absolute bottom-1/3 right-1/4 w-1 h-1 rounded-full bg-primary-fixed shadow-[0_0_6px_#ffc691] ember-p3"></div><div class="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-tertiary-container shadow-[0_0_8px_#ff9992] ember-p4"></div><div class="absolute bottom-2/5 right-1/3 w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_#ffb872] ember-p5"></div></div>
<div class="relative w-full rounded-xl bg-surface-container-low shadow-[0_8px_30px_rgba(147,0,10,0.45)] px-space-md py-space-sm flex flex-col gap-1.5 z-10"><div class="flex items-center justify-between"><div class="flex items-center gap-space-xs"><span class="w-3.5 h-3.5 rounded-full bg-surface-variant flex items-center justify-center text-[10px] text-surface-bright font-mono shadow-inner">✕</span><div class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-error-container/60 animate-pulse"><span class="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_#ffb4ab]"></span><span class="font-label-sm text-label-sm text-error uppercase tracking-wider font-bold">ALERTE ROUGE // SECTEUR 04</span></div></div><div class="flex items-center gap-2"><span class="font-code-serial text-label-sm text-outline tracking-widest uppercase">DISP-UID: #LZ-${escS(view.code)}</span><span class="w-3.5 h-3.5 rounded-full bg-surface-variant flex items-center justify-center text-[10px] text-surface-bright font-mono shadow-inner">✕</span></div></div>
<div class="flex items-center justify-between bg-surface-container-lowest/80 px-space-sm py-1 rounded"><div class="flex items-center gap-2"><span class="material-symbols-outlined text-error text-[18px] animate-spin" style="animation-duration: 3s;">warning</span><span class="font-label-sm text-label-sm text-tertiary uppercase tracking-tight">INTÉGRITÉ CHÂSSIS : COMPROMISE 0%</span></div><div class="flex items-center gap-1"><span class="w-1.5 h-3 bg-error rounded-xs animate-ping"></span><span class="w-1.5 h-3 bg-error rounded-xs"></span><span class="w-1.5 h-3 bg-error-container rounded-xs"></span></div></div></div>
<div class="relative w-full my-auto flex flex-col items-center justify-center text-center px-space-sm z-10 cursor-pointer select-none" id="blast-zone" title="Cliquer pour rejouer l'explosion">
<div class="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-error/80 pointer-events-none${first ? " shockwave-active-1" : ""}" id="shockwave-ring-1"></div>
<div class="absolute top-1/2 left-1/2 w-64 h-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary-container/60 pointer-events-none${first ? " shockwave-active-2" : ""}" id="shockwave-ring-2"></div>
<div class="absolute w-56 h-56 rounded-full bg-gradient-to-r from-error/30 via-primary-container/20 to-transparent blur-2xl pointer-events-none animate-pulse"></div>
<svg class="absolute inset-0 w-full h-full pointer-events-none opacity-30 text-error stroke-current" fill="none" viewBox="0 0 300 160"><path d="M10 80 L90 70 L140 95 L200 65 L290 85" stroke-dasharray="2 1" stroke-width="1.5"></path><path d="M140 95 L155 140 L170 160" stroke-width="1"></path><path d="M90 70 L75 20 L60 0" stroke-width="1"></path></svg>
<div class="relative px-space-md py-space-xs rounded bg-surface-container-highest/70 backdrop-blur-sm mb-2 border border-error/30 hover:border-error transition-all"><div class="flex items-center justify-center gap-2"><span class="material-symbols-outlined text-error text-[20px] animate-bounce">local_fire_department</span><span class="font-label-md text-label-md text-primary-fixed tracking-[0.25em] uppercase font-bold">DÉTONATION BALISTIQUE</span><span class="material-symbols-outlined text-error text-[20px] animate-bounce">local_fire_department</span></div></div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile text-error tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,180,171,0.85)] font-black active:scale-95 transition-transform">EXPLOSION</h2>
<p class="font-code-serial text-label-md text-tertiary tracking-wider uppercase mt-0.5">UNITÉ DÉTRUITE — ÉCHEC DU PROTOCOLE</p>
<div class="mt-2 flex items-center justify-center"><button class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/40 border border-error/40 text-error text-[11px] font-label-sm font-bold uppercase tracking-wider hover:bg-error-container/70 active:scale-95 transition-all shadow-[0_0_12px_rgba(147,0,10,0.4)]" id="btn-fx2" type="button"><span class="material-symbols-outlined text-[14px] animate-spin" style="animation-duration: 6s;">bolt</span><span>REJOUER DÉTONATION</span></button></div>
</div>
<div class="relative w-full rounded-xl bg-surface-container-low shadow-xl p-space-sm flex flex-col gap-2 z-10"><div class="flex items-center justify-between pb-1 bg-surface-container-lowest px-2 py-1 rounded"><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-error-container animate-pulse"></span><span class="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">RAPPORT NOIR // TACTICAL LOG</span></div></div>
<div class="bg-surface-container p-space-sm rounded-lg flex items-center justify-between"><div class="flex flex-col min-w-0"><span class="font-label-sm text-label-sm text-outline tracking-wider uppercase">ORIGINE ÉCHEC</span><span class="font-code-serial text-label-md text-error font-bold uppercase truncate" id="cause-text">${cause}</span></div><div class="w-8 h-8 rounded bg-error-container/40 flex items-center justify-center text-error shrink-0"><span class="material-symbols-outlined text-[20px]" id="cause-icon">${timeout ? "timer_off" : "bolt"}</span></div></div>
<div class="grid grid-cols-2 gap-2"><div class="bg-surface-container p-2.5 rounded-lg flex flex-col justify-between"><div class="flex items-center justify-between"><span class="font-label-sm text-label-sm text-outline uppercase">MODULES</span><span class="font-code-serial text-label-sm text-primary-container font-bold">${solved} / ${total}</span></div><div class="grid gap-1.5 mt-2" style="grid-template-columns:repeat(${total},minmax(0,1fr))">${seg.join("")}</div><span class="font-label-sm text-label-sm text-on-surface-variant text-[9px] mt-1 tracking-tight">${solved < total ? "MOD-0" + (solved + 1) + ": ÉCHEC DÉTONÉ" : "TOUS MODULES RÉSOLUS"}</span></div>
<div class="bg-surface-container p-2.5 rounded-lg flex flex-col justify-between relative overflow-hidden"><span class="font-label-sm text-label-sm text-outline uppercase">CHRONO FINAL</span>${chrono}</div></div></div>
<div class="w-full pt-space-xs z-10 pb-safe"><button class="w-full min-h-[52px] h-[52px] bg-gradient-to-r from-error-container via-primary-container to-error-container hover:brightness-110 active:scale-[0.98] transition-all rounded-lg flex items-center justify-center gap-space-sm px-space-md shadow-[0_0_20px_rgba(255,159,50,0.35)] text-on-primary font-code-serial text-label-lg font-bold uppercase tracking-wider" id="btn-replay"><span class="material-symbols-outlined text-[24px] text-on-primary animate-spin" style="animation-duration: 4s;">restart_alt</span><span>RÉINITIALISER &amp; RÉARMER</span><span class="material-symbols-outlined text-[20px] text-on-primary">chevron_right</span></button><div class="text-center mt-1"><span class="font-label-sm text-label-sm text-outline tracking-widest text-[9px] uppercase">SYSTÈME BALISTIQUE // ORDONNANCE PROTOCOL V4.2</span></div></div>
</div></main></div>`);
    bind();
    $("btn-fx").onclick = triggerDetonationFX;
    $("btn-fx2").onclick = function (ev) { ev.stopPropagation(); triggerDetonationFX(); };
    $("blast-zone").onclick = triggerDetonationFX;
    if (first) { playBoomSound(); buzz([120, 40, 200, 60, 90]); }
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
    var box = document.createElement("div");
    box.id = "zt-solo";
    box.style.cssText = "position:fixed;right:14px;" + (document.body.classList.contains("tech") ? "bottom:calc(64px + env(safe-area-inset-bottom,0px));" : "top:calc(60px + env(safe-area-inset-top,0px));") + "z-index:90;display:flex;flex-direction:column;align-items:flex-end;gap:4px";
    var base = "min-height:0;width:auto;padding:5px 9px;border-radius:6px;background:#1a1e23ee;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;";
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = "TEST ⇄ " + (other === "operator" ? "voir opérateur" : "voir technicien");
    b.style.cssText = base + "border:1px solid #ff9f32;color:#ff9f32";
    b.onclick = function () {
      sb.rpc("zt_solo_role", { p_code: session.code, p_token: session.token, p_role: other }).then(function (r) { if (r.error) return fail(r.error); view = r.data; render(); });
    };
    var st = document.createElement("button");
    st.type = "button";
    st.textContent = "■ TEST : arrêter la partie";
    st.style.cssText = base + "border:1px solid #ff5252;color:#ff8a8a";
    st.onclick = function () {
      if (!window.confirm("Arrêter la partie de test ?")) return;
      sb.rpc("zt_solo_stop", { p_code: session.code, p_token: session.token }).then(function (r) { if (r.error) return fail(r.error); view = r.data; resetGameFlags(); render(); });
    };
    box.appendChild(b); box.appendChild(st);
    document.body.appendChild(box);
  }
  document.addEventListener("touchmove", function (e) { if (document.body.classList.contains("op")) e.preventDefault(); }, { passive: false });
  function doRender() {
    var isOp = !!(session && view && view.status === "playing" && view.me && view.me.role === "operator" && view.game);
    document.body.classList.toggle("op", isOp);
    document.body.classList.toggle("bg-industrial-bay", isOp);
    var isTech = !!(session && view && view.status === "playing" && view.me && view.me.role === "technician" && view.manual);
    document.body.classList.toggle("tech", isTech);
    document.body.classList.toggle("workbench-bg", isTech);
    document.body.classList.toggle("scr", !(session && view) || view.status === "lobby" || view.status === "ended" || view.status === "abandoned");
    soloChip();
    if (!session || !view) { stopTimer(); return renderHome(); }
    if (view.status === "lobby") { stopTimer(); resetGameFlags(); return renderLobby(); }
    if (view.status === "ended" || view.status === "abandoned") return renderEnded();
    return renderPlaying();
  }

  session = load();
  if (session) { subscribe(); startHeartbeat(); } 
  render();
})();
