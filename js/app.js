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
    panneau_inconnu: "Panneau inconnu."
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
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} session = null; view = null; unsubscribe(); }

  function unsubscribe() { if (channel) { sb.removeChannel(channel); channel = null; } }
  function subscribe() {
    unsubscribe();
    // Canal privé du joueur : l'identifiant de joueur n'est connu que de lui.
    channel = sb.channel("zt-" + session.code + "-" + session.player_id)
      .on("broadcast", { event: "state" }, function (msg) { view = msg.payload; render(); })
      .subscribe(function (status) { if (status === "SUBSCRIBED") refresh(); });
  }
  function refresh() {
    if (!session) return;
    sb.rpc("zt_get_state", { p_code: session.code, p_token: session.token }).then(function (r) {
      if (r.error) { forget(); render(); return; }
      view = r.data; render();
    });
  }
  function enter(data) {
    session = { code: data.code, player_id: data.player_id, token: data.token };
    save(); subscribe(); refresh();
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

  function renderOperator() {
    var g = view.game;
    offsetMs = new Date(g.server_now).getTime() - Date.now();
    var endsAt = new Date(g.ends_at).getTime();
    var solved = g.panels.filter(function (p) { return p.state === "solved"; }).length;
    var panel = g.panels[activePanel] || g.panels[0];

    var timer = el("div", { class: "timer", text: fmt(endsAt - (Date.now() + offsetMs)) });
    stopTimer();
    var remInit = (endsAt - (Date.now() + offsetMs)) / 1000;
    if (!alertInit) { alertInit = true; ALERTS.forEach(function (T) { if (remInit <= T) alerted[T] = true; }); }
    timerId = setInterval(function () {
      var ms = endsAt - (Date.now() + offsetMs), rem = ms / 1000;
      timer.textContent = fmt(ms);
      var fire = null;
      ALERTS.forEach(function (T) { if (rem <= T && rem > 0 && !alerted[T]) { alerted[T] = true; fire = T; } });
      if (fire !== null) { toast("Il reste " + fmt(ms), false); buzz([150, 80, 150]); }
      if (rem <= 0 && !tickSent) {
        tickSent = true;
        sb.rpc("zt_tick", { p_code: session.code, p_token: session.token }).then(function (r) { if (!r.error) { view = r.data; render(); } });
      }
    }, 250);
    // Retour de la dernière coupe : flash et vibration, une seule fois par événement.
    var ev = g.event;
    if (seenEvent === undefined) { seenEvent = ev ? ev.id : null; }
    else if (ev && ev.id !== seenEvent) {
      seenEvent = ev.id;
      if (ev.type === "error") {
        document.body.classList.add("flash"); setTimeout(function () { document.body.classList.remove("flash"); }, 700);
        buzz([250]); toast("ERREUR " + ev.n + "/3" + (ev.penalty ? " — −" + ev.penalty + " s" : ""), false);
      } else { buzz([80]); toast("Panneau résolu ✓", true); }
    }

    var dots = el("div", { class: "dots" });
    for (var i = 0; i < 3; i++) dots.appendChild(el("span", { class: "dot" + (i < g.errors ? " full" : "") }));

    app.appendChild(el("div", { class: "hud" }, [
      timer,
      el("div", { class: "row2" }, [dots, el("span", { text: "Erreurs " + g.errors + "/3" })]),
      el("div", { class: "muted", text: "Panneaux " + solved + "/3" })
    ]));

    var tabs = el("div", { class: "row" });
    g.panels.forEach(function (p, idx) {
      tabs.appendChild(el("button", {
        class: idx === activePanel ? "on" : "",
        text: p.wires.length + " fils" + (p.state === "solved" ? " ✓" : ""),
        onclick: function () { activePanel = idx; selectedWire = null; render(); }
      }));
    });
    app.appendChild(tabs);

    var card = el("div", { class: "card" }, [
      el("div", { class: "modname", text: "Module " + panel.wires.length + " fils" }),
      el("div", { class: "muted", text: "N° de série" }),
      el("div", { class: "serial", text: panel.serial }),
      el("div", { class: "muted", text: panel.state === "solved" ? "Résolu ✓" : "À faire" })
    ]);
    panel.wires.forEach(function (color, idx) {
      var n = idx + 1, isCut = panel.cut.indexOf(n) !== -1;
      var wire = el("button", {
        class: "wire w-" + color + (isCut ? " cut" : "") + (selectedWire === n ? " sel" : ""),
        "aria-label": "Fil " + n + (isCut ? " coupé" : ""),
        onclick: function () { if (!isCut && panel.state !== "solved") { selectedWire = n; render(); } }
      }, [el("span", { class: "num", text: String(n) }), el("span", { class: "bar" }), el("span", { class: "state", text: isCut ? "✂" : (selectedWire === n ? "●" : "") })]);
      card.appendChild(wire);
    });
    app.appendChild(card);

    app.appendChild(el("button", { class: "primary", text: "Couper ce fil", disabled: selectedWire ? null : "disabled",
      onclick: function () {
        if (cutting || !selectedWire) return;
        cutting = true;
        sb.rpc("zt_cut", { p_code: session.code, p_token: session.token, p_action: uuid(), p_pos: panel.pos, p_wire: selectedWire }).then(function (r) {
          cutting = false;
          if (r.error) return fail(r.error);
          selectedWire = null; view = r.data; render();
        });
      } }));
    app.appendChild(el("div", { class: "muted", text: "Annonce le temps et les erreurs à voix haute au technicien." }));
  }

  function renderTechnician() {
    stopTimer();
    var m = view.manual;
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

  function render() {
    if (!session || !view) { stopTimer(); return renderHome(); }
    if (view.status === "lobby") { stopTimer(); resetGameFlags(); return renderLobby(); }
    if (view.status === "ended") return renderEnded();
    return renderPlaying();
  }

  session = load();
  if (session) { subscribe(); } 
  render();
})();
