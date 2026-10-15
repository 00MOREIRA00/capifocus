const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { APP_MODULES, runModules } = require('./esm.cjs');

// Execute the entire production app without exposing its private functions.
// DOM and audio are simulated; assertions use public events and saved data.
module.exports = function createApp(saved = new Map(), options = {}) {
  const elements = new Map();
  const docEvents = {};
  const intervals = new Map();
  const timeouts = new Map();
  let now = options.now ?? 1000000, id = 0, celebrations = 0, context;
  function element() {
    const classes = new Set(), queries = new Map();
    let html = '';
    const el = {
      style: { setProperty() {} }, dataset: {}, attributes: {}, children: [], events: {},
      value: '', checked: false, hidden: false, scrollWidth: 400, clientWidth: 300, scrollLeft: 0,
      classList: { add: n => classes.add(n), remove: n => classes.delete(n), contains: n => classes.has(n),
        toggle(n, on) { if (on === undefined) on = !classes.has(n); on ? classes.add(n) : classes.delete(n); } },
      setAttribute(n, v) { this.attributes[n] = v; },
      appendChild(child) { this.children.push(child); },
      append(...nodes) { this.children.push(...nodes); },
      replaceChildren(...nodes) { this.children = [...nodes]; },
      querySelector(q) {
        // ".classe" procura entre os filhos criados pelo app; outros seletores continuam simulados
        if (q.startsWith('.')) { const found = findByClass(this, q.slice(1)); if (found) return found; }
        if (!queries.has(q)) queries.set(q, element()); return queries.get(q);
      },
      addEventListener(event, fn) { (this.events[event] ||= []).push(fn); },
      emit(event, details = {}) {
        const e = { preventDefault() {}, stopPropagation() {}, currentTarget: this, target: this, ...details };
        for (const fn of this.events[event] || []) fn(e);
      },
      click() { this.emit('click'); }, focus() {}, scrollBy() {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 24, height: 24 }),
      animate: () => ({}), remove() {}
    };
    Object.defineProperty(el, 'innerHTML', { get: () => html, set(value) { html = value; el.children = []; queries.clear(); } });
    return el;
  }
  function findByClass(root, cls) {
    for (const child of root.children || []) {
      if (child && typeof child === 'object') {
        if (String(child.className || '').split(/\s+/).includes(cls)) return child;
        const deep = findByClass(child, cls); if (deep) return deep;
      }
    }
    return null;
  }
  function get(q) { if (!elements.has(q)) elements.set(q, element()); return elements.get(q); }
  const tabs = ['pomo', 'short', 'long'].map(mode => { const tab = element(); tab.dataset.mode = mode; return tab; });
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const document = {
    querySelector: get, querySelectorAll: q => q === '.tab' ? tabs : [], createElement: element, createElementNS: (ns, tag) => element(), title: '',
    body: element(), documentElement: element(), activeElement: { tagName: 'BODY' }, hidden: false, hasFocus: () => options.focused !== false,
    addEventListener(event, fn) { (docEvents[event] ||= []).push(fn); }
  };
  const window = { addEventListener() {}, confirm: () => options.confirm !== false };
  // Controles de mídia do sistema simulados (Media Session API)
  const mediaSession = { metadata: null, playbackState: 'none', handlers: {}, setActionHandler(name, fn) { this.handlers[name] = fn; } };
  class MediaMetadata { constructor(data) { Object.assign(this, data); } }
  // Wake Lock e notificações simulados
  const locks = [];
  const wakeLock = { request: async type => { const lock = { type, released: false, async release() { lock.released = true; }, addEventListener() {} }; locks.push(lock); return lock; } };
  const notifications = [];
  class Notification { constructor(title, opts) { notifications.push({ title, ...opts }); } close() {} }
  Notification.permission = options.notificationPermission || 'default';
  Notification.requestPermission = async () => (Notification.permission = options.grantNotifications === false ? 'denied' : 'granted');
  let onGrumpy;
  const sandbox = {
    window, document, Date: Clock, navigator: { mediaSession, wakeLock }, MediaMetadata, Notification,
    localStorage: { getItem: k => saved.get(k) || null, setItem: (k, value) => saved.set(k, value) },
    CapiMascot: { GRUMPY_TIME: 3200, create: (host, opts = {}) => { onGrumpy = opts.onGrumpy; return { update: value => { context = value; }, complete: () => celebrations++ }; } },
    matchMedia: () => ({ matches: true }), requestAnimationFrame: fn => fn(),
    setInterval(fn, ms) { intervals.set(++id, { fn, ms }); return id; }, clearInterval: key => intervals.delete(key),
    setTimeout(fn, ms) { timeouts.set(++id, { fn, at: now + ms }); return id; }, clearTimeout: key => timeouts.delete(key)
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../js/theme.js'), 'utf8'), sandbox);
  sandbox.CapiTheme = window.CapiTheme;
  runModules(APP_MODULES, sandbox);
  return {
    document,
    // pressiona uma tecla com o foco no elemento indicado (tagName e, opcionalmente, isContentEditable)
    key(code, active = { tagName: 'BODY' }) {
      document.activeElement = active; let prevented = false;
      for (const fn of docEvents.keydown || []) fn({ code, key: code === 'Space' ? ' ' : code, preventDefault() { prevented = true; } });
      document.activeElement = { tagName: 'BODY' }; return prevented;
    },
    grumpy: () => onGrumpy(), now: () => now, locks, notifications, Notification,
    get, tabs, saved, mediaSession, context: () => context, celebrations: () => celebrations,
    data: key => JSON.parse(saved.get(key)),
    advance(ms) {
      now += ms;
      for (const { fn, ms: period } of [...intervals.values()]) if (period === 250) fn();
      for (const [key, timer] of [...timeouts]) if (timer.at <= now) { timeouts.delete(key); timer.fn(); }
    }
  };
};
