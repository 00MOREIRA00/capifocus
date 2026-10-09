const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
process.chdir(path.join(__dirname, '..'));

async function run() {
  const timers = new Map();
  const images = [];
  let reduced = false;
  let timerId = 0;
  function element() {
    const classes = new Set();
    return {
      dataset: {}, style: {}, children: [], events: {}, animations: [], attributes: {},
      classList: { add(...names) { names.forEach(n => classes.add(n)); },
        toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
        contains(name) { return classes.has(name); } },
      setAttribute(name, value) { this.attributes[name] = value; },
      removeAttribute(name) { delete this.attributes[name]; },
      appendChild(child) { this.children.push(child); },
      addEventListener(name, handler) { this.events[name] = handler; },
      animate(frames, options) { const animation = { frames, options, cancel() { this.cancelled = true; } }; this.animations.push(animation); return animation; }
    };
  }
  const sandbox = {
    window: {}, document: { createElement: element },
    matchMedia: () => ({ matches: reduced }),
    Image: function () { const img = element(); img.decode = async () => {}; images.push(img); return img; },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(fs.readFileSync('js/components/mascot.js', 'utf8'), sandbox);
  const M = sandbox.window.CapiMascot;
  for (const mode of ['pomo', 'short', 'long']) {
    for (const playing of [false, true]) {
      assert.equal(M.resolve({ mode, running: true, playing }), mode === 'pomo' ? 'focus' : 'break');
      assert.equal(M.resolve({ mode, running: false, playing }), playing ? 'radio' : 'default');
      assert.equal(M.resolve({ mode, running: true, playing, completed: true }), 'completed');
    }
  }
  let view;
  const mascot = M.create({ querySelector: () => null, insertBefore: v => { view = v; } });
  await images[0].onload();
  assert.equal(view.dataset.state, 'default');
  mascot.update({ running: true, mode: 'pomo' });
  assert.equal(view.dataset.state, 'default', 'retain decoded pose while loading');
  await images[1].onload();
  assert.equal(view.dataset.state, 'focus');
  for (const img of images) await img.onload();
  const entryCount = view.animations.length;
  mascot.update({ running: true, mode: 'pomo' });
  assert.equal(view.animations.length, entryCount, 'renders do not repeat entry');
  mascot.complete();
  assert.equal(view.dataset.state, 'completed');
  mascot.complete();
  assert.equal(timers.size, 1, 'repeated events replace the expiration timer');
  mascot.update({ playing: true });
  assert.equal(view.dataset.state, 'completed');
  [...timers.values()][0]();
  assert.equal(view.dataset.state, 'radio');
  assert.equal(images.filter(img => img.classList.contains('is-visible')).length, 1);
  view.events.click(); view.events.click();
  assert(view.animations.at(-2).cancelled, 'repeated clicks cancel the previous reaction');
  reduced = true;
  const count = view.animations.length;
  view.events.click();
  assert.equal(view.animations.length, count, 'reduced motion disables click reaction');
  const initialCount = images.length;
  let failedView;
  M.create({ querySelector: () => null, insertBefore(v) { failedView = v; } });
  images[initialCount].onerror();
  assert.equal(failedView.children.length, 5, 'only the five new poses exist after network failure');
  assert.equal(failedView.dataset.state, undefined, 'no old mascot appears on failure');
  await images[initialCount].onload();
  assert.equal(failedView.dataset.state, 'default', 'new pose appears after successful retry');
  const decodeIndex = images.length;
  let decodeView;
  M.create({ querySelector: () => null, insertBefore(v) { decodeView = v; } });
  images[decodeIndex].decode = async () => { throw new Error('invalid image'); };
  await images[decodeIndex].onload();
  assert.equal(decodeView.children.length, 5);
  assert.equal(decodeView.dataset.state, undefined, 'no old mascot appears on decoding failure');
  for (const src of Object.values(M.assets)) assert(fs.existsSync(src));
  const html = fs.readFileSync('index.html', 'utf8');
  assert(!/<svg class="capy"/.test(html), 'old mascot removed from HTML');
  assert(!/<style>|<script>/.test(html), 'app code is external');
  for (const [, src] of html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+)"/g)) assert(fs.existsSync(src), src);
  console.log('OK: priorities, loading, completion, interaction, reduced motion and file paths');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
