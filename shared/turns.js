/* =========================================================
   Motor de turnos para juegos por tiempo (Tabú, Sound Charades).

   Modos:
     solo   → un solo grupo; solo se ven los puntos de cada ronda.
     round  → dos equipos que se turnan; solo se ven los puntos de cada ronda.
     total  → dos equipos con marcador acumulado, con o sin límite de rondas.

   La página debe tener los IDs que usa este archivo (ver tabu.html).
   #timerBar (opcional) es la barra de tiempo: se le pone --p entre 1 y 0.
   Los botones de juego llevan:
     data-points="1|0|-1"  puntos que suma/resta
     data-flash="#color"   color del destello de fondo
     data-cooldown         (opcional) se bloquea unos segundos tras cada carta
   ========================================================= */
window.TurnGame = function (cfg) {
  const $ = (s) => document.querySelector(s);
  const deck = new G.Deck(cfg.key, cfg.items, cfg.idOf);
  const settingsKey = 'settings:' + cfg.key;

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
    if (s.teamA) ui.teamA.value = s.teamA;
    if (s.teamB) ui.teamB.value = s.teamB;
    if (s.rounds != null) ui.rounds.value = s.rounds;
    ui.sound.value = G.soundOn ? 'on' : 'off';
    syncMenu();
  }

  function readSettings() {
    const s = {
      time: parseInt(ui.time.value, 10),
      cooldown: parseInt(ui.cooldown.value, 10),
      mode: ui.mode.value,
      teamA: ui.teamA.value.trim() || 'Equipo 1',
      teamB: ui.teamB.value.trim() || 'Equipo 2',
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
    return S.rounds ? `Ronda ${roundNo()} de ${S.rounds}` : `Ronda ${roundNo()}`;
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
    teams = [{ name: S.teamA, score: 0 }, { name: S.teamB, score: 0 }];
    turn = 0;
    showReady();
  }

  function showReady() {
    $('#readyTitle').textContent = isTeams() ? `Turno de ${team().name}` : '¡Preparados!';
    $('#readySub').textContent = [roundText(), cfg.readyHint].filter(Boolean).join(' · ');
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

    $('#resultTitle').textContent = isTeams() ? `${team().name} ha conseguido:` : 'Habéis conseguido:';
    $('#finalScore').textContent = points;
    renderBoard($('#resultBoard'));

    turn++;
    const finished = S.mode === 'total' && S.rounds && turn >= S.rounds * 2;
    $('#btnNext').textContent = finished ? 'Ver resultado' : (isTeams() ? `Turno de ${team().name}` : 'Siguiente turno');
    $('#btnNext').dataset.finished = finished ? '1' : '';
    $('#btnEnd').hidden = S.mode !== 'total' || finished;
    show('screen-result');
  }

  function showFinal() {
    const [a, b] = teams;
    $('#finalTitle').textContent =
      a.score === b.score ? '¡Empate!' : `¡Gana ${a.score > b.score ? a.name : b.name}!`;
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
    if (confirm('¿Terminar la partida y ver el resultado?')) showFinal();
  });
  $('#btnStop').addEventListener('click', () => {
    if (confirm('¿Terminar este turno ya?')) endTurn();
  });
  document.querySelectorAll('[data-to-menu]').forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.toMenu === 'confirm' && S && S.mode === 'total' &&
          !confirm('Se perderá el marcador de la partida. ¿Volver al menú?')) return;
      show('screen-menu');
    })
  );

  loadSettings();
};
