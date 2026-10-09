const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the entire production app without exposing its private functions.
// DOM and audio are simulated; assertions use public events and saved data.
module.exports = function createApp(saved = new Map()) {
  const elements = new Map();
  const intervals = new Map();
  const timeouts = new Map();
  let now = 1000000, id = 0, celebrations = 0, context;
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
      querySelector(q) { if (!queries.has(q)) queries.set(q, element()); return queries.get(q); },
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
  function get(q) { if (!elements.has(q)) elements.set(q, element()); return elements.get(q); }
  const tabs = ['pomo', 'short', 'long'].map(mode => { const tab = element(); tab.dataset.mode = mode; return tab; });
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const document = {
    querySelector: get, querySelectorAll: q => q === '.tab' ? tabs : [], createElement: element,
    body: element(), documentElement: element(), activeElement: { tagName: 'BODY' }, addEventListener() {}
  };
  const window = { addEventListener() {} };
  const sandbox = {
    window, document, Date: Clock,
    localStorage: { getItem: k => saved.get(k) || null, setItem: (k, value) => saved.set(k, value) },
    CapiMascot: { create: () => ({ update: value => { context = value; }, complete: () => celebrations++ }) },
    matchMedia: () => ({ matches: true }), requestAnimationFrame: fn => fn(),
    setInterval(fn, ms) { intervals.set(++id, { fn, ms }); return id; }, clearInterval: key => intervals.delete(key),
    setTimeout(fn, ms) { timeouts.set(++id, { fn, at: now + ms }); return id; }, clearTimeout: key => timeouts.delete(key)
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../js/theme.js'), 'utf8'), sandbox);
  sandbox.CapiTheme = window.CapiTheme;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../js/app.js'), 'utf8'), sandbox);
  return {
    get, tabs, saved, context: () => context, celebrations: () => celebrations,
    data: key => JSON.parse(saved.get(key)),
    advance(ms) {
      now += ms;
      for (const { fn, ms: period } of [...intervals.values()]) if (period === 250) fn();
      for (const [key, timer] of [...timeouts]) if (timer.at <= now) { timeouts.delete(key); timer.fn(); }
    }
  };
};
