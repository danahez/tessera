/* =========================================================
   Utilidades compartidas por todos los juegos.
   Expone un único objeto global: G
   ========================================================= */
(function () {
  const G = {};

  /* ---------- Almacenamiento (nunca rompe si localStorage falla) ---------- */
  G.store = {
    get(key, def) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
    }
  };

  /* ---------- Barajado justo (Fisher-Yates) ---------- */
  G.shuffle = function (array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /* ---------- Día de juego ----------
     El "día" empieza a las 5:00 de la mañana: una partida que sigue a las
     2:00 cuenta como el día anterior. Cada día los mazos se barajan de nuevo. */
  G.RESET_HOUR = 5;
  G.gameDay = function () {
    const d = new Date(Date.now() - G.RESET_HOUR * 3600 * 1000);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };

  /* ---------- Mazo que no repite durante el día ----------
     Recuerda qué cartas quedan aunque se cierre la app, pero solo durante
     el día de juego: a partir de las 5:00 se vuelve a barajar entero.
     Si se acaba antes, también se baraja de nuevo.
     idOf: cómo obtener un identificador único de cada carta. */
  G.Deck = class {
    constructor(key, items, idOf = (x) => x) {
      this.key = 'deck:' + key;
      this.byId = new Map(items.map((it) => [idOf(it), it]));
      const saved = G.store.get(this.key, null);
      const ok = saved && saved.day === G.gameDay() && Array.isArray(saved.ids);
      const ids = ok ? saved.ids.filter((id) => this.byId.has(id)) : [];
      this.day = G.gameDay();
      this.ids = ids.length ? ids : this._fresh();
      this._save();
    }
    _fresh() { return G.shuffle([...this.byId.keys()]); }
    _save() { G.store.set(this.key, { day: this.day, ids: this.ids }); }
    /** Si ha empezado otro día (pasadas las 5:00) baraja todo de nuevo. */
    _checkDay() {
      if (this.day !== G.gameDay()) { this.day = G.gameDay(); this.reset(); }
    }
    get remaining() { this._checkDay(); return this.ids.length; }
    get total() { return this.byId.size; }
    /** Saca una carta. Si el mazo está vacío lo vuelve a barajar. */
    draw() {
      this._checkDay();
      if (!this.ids.length) this.ids = this._fresh();
      const id = this.ids.pop();
      this._save();
      return this.byId.get(id);
    }
    reset() { this.ids = this._fresh(); this._save(); }
  };

  /* ---------- Pantalla siempre encendida ---------- */
  let wakeLock = null;
  let wantAwake = false;
  G.keepAwake = async function (on = true) {
    wantAwake = on;
    if (!on) {
      try { wakeLock && wakeLock.release(); } catch (e) {}
      wakeLock = null;
      return;
    }
    if (!('wakeLock' in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { wakeLock = null; }
  };
  // El sistema suelta el bloqueo al salir de la app: se recupera al volver.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wantAwake) G.keepAwake(true);
  });

  /* ---------- Sonido (generado, sin archivos) ---------- */
  let actx = null;
  G.soundOn = G.store.get('sound', true);
  G.setSound = function (on) { G.soundOn = !!on; G.store.set('sound', G.soundOn); };
  G.unlockAudio = function () {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  };
  G.tone = function (freq, dur, type = 'sine', vol = 0.2, when = 0) {
    if (!G.soundOn || !actx) return;
    const t = actx.currentTime + when;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.03);
  };
  G.beepStart = () => G.tone(660, 0.12, 'sine', 0.2);
  G.beepTick = () => G.tone(880, 0.12, 'sine', 0.25);
  G.alarm = function () {
    G.tone(523, 0.18, 'square', 0.12, 0);
    G.tone(523, 0.18, 'square', 0.12, 0.22);
    G.tone(392, 0.55, 'square', 0.12, 0.44);
    try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 400]); } catch (e) {}
  };

  /* ---------- Temporizador basado en la hora real ----------
     No se desajusta aunque el móvil vaya lento o se bloquee un momento. */
  G.Timer = class {
    constructor({ seconds, onTick, onEnd }) {
      this.seconds = seconds;
      this.onTick = onTick;
      this.onEnd = onEnd;
      this.id = null;
    }
    start() {
      this.stop();
      this.endAt = Date.now() + this.seconds * 1000;
      this.last = null;
      this.id = setInterval(() => this._tick(), 200);
      this._tick();
    }
    _tick() {
      const left = Math.max(0, Math.ceil((this.endAt - Date.now()) / 1000));
      if (left !== this.last) {
        this.last = left;
        this.onTick && this.onTick(left);
      }
      if (left <= 0) {
        this.stop();
        this.onEnd && this.onEnd();
      }
    }
    stop() { clearInterval(this.id); this.id = null; }
    get running() { return this.id !== null; }
  };

  /* ---------- Espera antes de poder pasar ----------
     Bloquea los botones indicados durante unos segundos tras mostrar
     cada palabra, para que nadie pase cartas sin intentarlo. */
  G.Cooldown = class {
    constructor(buttons) { this.buttons = buttons; this.id = null; }
    start(seconds) {
      this.stop();
      if (!seconds) return;
      const end = Date.now() + seconds * 1000;
      const update = () => {
        const left = Math.ceil((end - Date.now()) / 1000);
        if (left <= 0) { this.stop(); return; }
        this.buttons.forEach((b) => {
          b.disabled = true;
          b.classList.add('cooling');
          b.dataset.cd = left;
        });
      };
      update();
      this.id = setInterval(update, 200);
    }
    stop() {
      clearInterval(this.id);
      this.id = null;
      this.buttons.forEach((b) => {
        b.disabled = false;
        b.classList.remove('cooling');
        delete b.dataset.cd;
      });
    }
  };

  /* El aspecto de los botones en espera (.cooling) está en shared/estilo.css */

  /* ---------- Selector de opciones de un toque ----------
     Convierte cada <select data-seg> en una fila de botones (data-seg="col"
     los pone en columna). El <select> sigue existiendo, oculto, así que el
     resto del código lee y escribe su .value como siempre.
     Llamar después de haber cargado los ajustes guardados. */
  G.segmented = function (root = document) {
    root.querySelectorAll('select[data-seg]').forEach((sel) => {
      const box = document.createElement('div');
      box.className = 'seg' + (sel.dataset.seg === 'col' ? ' col' : '');
      box.setAttribute('role', 'radiogroup');
      if (sel.getAttribute('aria-label')) box.setAttribute('aria-label', sel.getAttribute('aria-label'));
      const btns = [...sel.options].map((opt) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.textContent = opt.textContent;
        b.addEventListener('click', () => {
          if (sel.value === opt.value) return;
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        });
        box.appendChild(b);
        return b;
      });
      const sync = () => btns.forEach((b, i) => {
        const on = sel.options[i].selected;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', on);
      });
      sel.addEventListener('change', sync);
      sync();
      // Vuelve a copiar el texto de las opciones (tras cambiar de idioma)
      sel._segRefresh = () => btns.forEach((b, i) => { b.textContent = sel.options[i].textContent; });
      sel.hidden = true;
      sel.after(box);
    });
  };

  /* ---------- Idioma (español / inglés) ----------
     Se elige en el menú de Tabú, Sound Charades y Just One y se recuerda
     para todos los juegos (clave 'lang').
     Cada página pone sus textos en G.T = { es: {...}, en: {...} } y marca
     los elementos con data-i18n="clave" (texto), data-i18n-aria (aria-label)
     o data-i18n-ph (placeholder). G.t('clave', {n: 3}) sustituye {n}. */
  G.lang = G.store.get('lang', 'es') === 'en' ? 'en' : 'es';
  G.T = { es: {}, en: {} };
  G.setLang = function (lang) {
    G.lang = lang === 'en' ? 'en' : 'es';
    G.store.set('lang', G.lang);
  };
  G.t = function (key, vars) {
    let s = G.T[G.lang][key];
    if (s == null) s = G.T.es[key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : ''));
    return s;
  };
  G.translate = function (root = document) {
    document.documentElement.lang = G.lang;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = G.t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', G.t(el.dataset.i18nAria)));
    root.querySelectorAll('[data-i18n-ph]').forEach((el) => el.setAttribute('placeholder', G.t(el.dataset.i18nPh)));
    root.querySelectorAll('select[data-seg]').forEach((sel) => sel._segRefresh && sel._segRefresh());
  };
  /** Conecta el <select id="langSelect"> del menú y traduce la página.
      Llamar ANTES de G.segmented(). onChange se ejecuta al cambiar de idioma. */
  G.initLang = function (onChange) {
    const sel = document.getElementById('langSelect');
    if (sel) {
      sel.value = G.lang;
      sel.addEventListener('change', () => {
        G.setLang(sel.value);
        G.translate();
        if (onChange) onChange(G.lang);
      });
    }
    G.translate();
  };

  window.G = G;
})();
