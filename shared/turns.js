/* =========================================================
   Motor de turnos para juegos por tiempo (Tabú, Sound Charades).

   Modos:
     solo   → un solo grupo; solo se ven los puntos de cada ronda.
     round  → dos equipos que se turnan; solo se ven los puntos de cada ronda.
     total  → dos equipos con marcador acumulado, con o sin límite de rondas.

   La página debe tener los IDs que usa este archivo (ver tabu.html).
   #timerBar (opcional) es la barra de tiempo: se le pone --p entre 1 y 0.
   Idioma: cfg.items puede ser una lista o { es: [...], en: [...] }; cada idioma
   tiene su propio mazo (deck:<juego> y deck:<juego>-en). Los textos de la
   página van en G.T (ver common.js); aquí se añaden los del motor.
   Los botones de juego llevan:
     data-points="1|0|-1"  puntos que suma/resta
     data-flash="#color"   color del destello de fondo
     data-cooldown         (opcional) se bloquea unos segundos tras cada carta
   ========================================================= */
window.TurnGame = function (cfg) {
  const $ = (s) => document.querySelector(s);
  const settingsKey = 'settings:' + cfg.key;

  // Textos del motor en los dos idiomas (la página puede sobrescribirlos)
  const TEXTS = {
    es: {
      ready: '¡Preparados!', turnOf: 'Turno de {team}', round: 'Ronda {n}', roundOf: 'Ronda {n} de {total}',
      teamGot: '{team} ha conseguido:', youGot: 'Habéis conseguido:', seeResult: 'Ver resultado',
      nextTurn: 'Siguiente turno', tie: '¡Empate!', wins: '¡Gana {team}!', team1: 'Equipo 1', team2: 'Equipo 2',
      confirmEnd: '¿Terminar la partida y ver el resultado?', confirmStop: '¿Terminar este turno ya?',
      confirmMenu: 'Se perderá el marcador de la partida. ¿Volver al menú?',
    },
    en: {
      ready: 'Get ready!', turnOf: "{team}'s turn", round: 'Round {n}', roundOf: 'Round {n} of {total}',
      teamGot: '{team} scored:', youGot: 'You scored:', seeResult: 'See result',
      nextTurn: 'Next turn', tie: "It's a tie!", wins: '{team} wins!', team1: 'Team 1', team2: 'Team 2',
      confirmEnd: 'End the game and see the result?', confirmStop: 'End this turn now?',
      confirmMenu: 'The scoreboard will be lost. Back to the menu?',
    },
  };
  ['es', 'en'].forEach((l) => { G.T[l] = Object.assign({}, TEXTS[l], G.T[l]); });

  // Un mazo por idioma, creado al empezar la partida
  const decks = {};
  const itemsFor = (l) => (Array.isArray(cfg.items) ? cfg.items : (cfg.items[l] || cfg.items.es));
  const deckFor = (l) => decks[l] ||
    (decks[l] = new G.Deck(l === 'es' ? cfg.key : cfg.key + '-' + l, itemsFor(l), cfg.idOf));
  let deck = null;

  const ui = {
    time: $('#timeSelect'),
    cooldown: $('#cooldownSelect'),
    mode: $('#modeSelect'),
    teamsBox: $('#teamsBox'),
    teamA: $('#teamA'),
    teamB: $('#teamB'),
    roundsBox: $('#roundsBox'),
    rounds: $('#roundsSelect'),
    sound: $('#soundSelect'),
  };

  const gameButtons = [...document.querySelectorAll('#screen-game [data-points]')];
  const cooldown = new G.Cooldown(gameButtons.filter((b) => b.hasAttribute('data-cooldown')));

  let S = null;       // ajustes de la partida en curso
  let teams = [];     // [{name, score}]
  let turn = 0;       // nº de turno jugado (0, 1, 2...)
  let points = 0;     // puntos del turno actual
  let timer = null;

  /* ---------- Ajustes del menú (se recuerdan) ---------- */
  function loadSettings() {
    const s = G.store.get(settingsKey, {});
    if (s.time) ui.time.value = s.time;
    if (s.cooldown != null) ui.cooldown.value = s.cooldown;
    if (s.mode) ui.mode.value = s.mode;
    // Los nombres por defecto no se guardan: así cambian con el idioma
    if (s.teamA && !/^(Equipo|Team) 1$/.test(s.teamA)) ui.teamA.value = s.teamA;
    if (s.teamB && !/^(Equipo|Team) 2$/.test(s.teamB)) ui.teamB.value = s.teamB;
    if (s.rounds != null) ui.rounds.value = s.rounds;
    ui.sound.value = G.soundOn ? 'on' : 'off';
    syncMenu();
  }

  function readSettings() {
    const s = {
      time: parseInt(ui.time.value, 10),
      cooldown: parseInt(ui.cooldown.value, 10),
      mode: ui.mode.value,
      teamA: ui.teamA.value.trim() || G.t('team1'),
      teamB: ui.teamB.value.trim() || G.t('team2'),
      rounds: parseInt(ui.rounds.value, 10),
    };
    G.store.set(settingsKey, s);
    G.setSound(ui.sound.value === 'on');
    return s;
  }

  function syncMenu() {
    ui.teamsBox.hidden = ui.mode.value === 'solo';
    ui.roundsBox.hidden = ui.mode.value !== 'total';
  }
  ui.mode.addEventListener('change', syncMenu);

  /* ---------- Pantallas ---------- */
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.body.style.backgroundColor = '';
  }

  const isTeams = () => S.mode !== 'solo';
  const team = () => teams[turn % 2];
  const roundNo = () => Math.floor(turn / 2) + 1;

  function roundText() {
    if (S.mode !== 'total') return '';
    return S.rounds ? G.t('roundOf', { n: roundNo(), total: S.rounds }) : G.t('round', { n: roundNo() });
  }

  function renderBoard(el) {
    el.innerHTML = '';
    el.hidden = S.mode !== 'total';
    if (el.hidden) return;
    const best = Math.max(...teams.map((t) => t.score));
    teams.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'board-row' + (i === turn % 2 ? ' current' : '') +
        (t.score === best && teams[0].score !== teams[1].score ? ' leader' : '');
      const n = document.createElement('span');
      n.textContent = t.name;
      const p = document.createElement('b');
      p.textContent = t.score;
      row.append(n, p);
      el.appendChild(row);
    });
  }

  /* ---------- Flujo de la partida ---------- */
  function newGame() {
    G.unlockAudio();
    S = readSettings();
    deck = deckFor(G.lang);
    teams = [{ name: S.teamA, score: 0 }, { name: S.teamB, score: 0 }];
    turn = 0;
    showReady();
  }

  function showReady() {
    $('#readyTitle').textContent = isTeams() ? G.t('turnOf', { team: team().name }) : G.t('ready');
    $('#readySub').textContent = [roundText(), G.t('readyHint')].filter(Boolean).join(' · ');
    renderBoard($('#readyBoard'));
    show('screen-ready');
  }

  function startTurn() {
    G.unlockAudio();
    points = 0;
    $('#scoreDisplay').textContent = '0';
    $('#turnLabel').textContent = isTeams() ? team().name : '';
    const td = $('#timerDisplay');
    const bar = $('#timerBar');
    td.classList.remove('low');
    td.textContent = S.time + ' s';
    if (bar) bar.style.setProperty('--p', 1);
    show('screen-game');
    G.keepAwake(true);
    G.beepStart();
    nextCard();

    timer = new G.Timer({
      seconds: S.time,
      onTick(left) {
        td.textContent = left + ' s';
        td.classList.toggle('low', left <= 10);
        if (bar) bar.style.setProperty('--p', left / S.time);
        if (left <= 5 && left > 0) G.beepTick();
      },
      onEnd() { G.alarm(); endTurn(); },
    });
    timer.start();
  }

  function nextCard() {
    cfg.render(deck.draw());
    cooldown.start(S.cooldown);
  }

  function score(btn) {
    if (!timer || !timer.running) return;
    points += parseInt(btn.dataset.points, 10) || 0;
    $('#scoreDisplay').textContent = points;
    if (btn.dataset.flash) {
      document.body.style.backgroundColor = btn.dataset.flash;
      setTimeout(() => { document.body.style.backgroundColor = ''; }, 150);
    }
    nextCard();
  }
  gameButtons.forEach((b) => b.addEventListener('click', () => score(b)));

  function endTurn() {
    if (timer) timer.stop();
    cooldown.stop();
    G.keepAwake(false);
    if (isTeams()) team().score += points;

    $('#resultTitle').textContent = isTeams() ? G.t('teamGot', { team: team().name }) : G.t('youGot');
    $('#finalScore').textContent = points;
    renderBoard($('#resultBoard'));

    turn++;
    const finished = S.mode === 'total' && S.rounds && turn >= S.rounds * 2;
    $('#btnNext').textContent = finished ? G.t('seeResult') : (isTeams() ? G.t('turnOf', { team: team().name }) : G.t('nextTurn'));
    $('#btnNext').dataset.finished = finished ? '1' : '';
    $('#btnEnd').hidden = S.mode !== 'total' || finished;
    show('screen-result');
  }

  function showFinal() {
    const [a, b] = teams;
    $('#finalTitle').textContent =
      a.score === b.score ? G.t('tie') : G.t('wins', { team: a.score > b.score ? a.name : b.name });
    turn = -1; // ningún equipo resaltado como "en turno"
    renderBoard($('#finalBoard'));
    show('screen-final');
  }

  /* ---------- Botones ---------- */
  $('#btnStart').addEventListener('click', newGame);
  $('#btnGo').addEventListener('click', startTurn);
  $('#btnNext').addEventListener('click', () => {
    if ($('#btnNext').dataset.finished) showFinal(); else showReady();
  });
  $('#btnEnd').addEventListener('click', () => {
    if (confirm(G.t('confirmEnd'))) showFinal();
  });
  $('#btnStop').addEventListener('click', () => {
    if (confirm(G.t('confirmStop'))) endTurn();
  });
  document.querySelectorAll('[data-to-menu]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.toMenu === 'confirm' && S && S.mode === 'total' &&
          !confirm(G.t('confirmMenu'))) return;
      show('screen-menu');
    })
  );

  loadSettings();
};
