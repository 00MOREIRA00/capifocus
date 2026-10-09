// Exercise the actual timer functions with a small DOM and controlled clock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const nodes = new Map();
const contexts = [];
let celebrations = 0;
let now = 0;
let tick;
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, {
    style: {}, classList: { toggle() {} }, textContent: '', hidden: false
  });
  return nodes.get(selector);
}
const sandbox = {
  CapiMascot: { create: () => ({ update: context => contexts.push(context), complete: () => celebrations++ }) },
  document: { querySelector: node, querySelectorAll: () => [], body: {} },
  window: {}, localStorage: { getItem: () => null, setItem() {} },
  Date: { now: () => now },
  setInterval(fn) { tick = fn; return 1; }, clearInterval() { tick = null; }
};
const prefix = app.slice(0, app.indexOf('  let ctx;'));
vm.runInNewContext(prefix + `
  let skipping=false;
  function chime() {}
  window.test={render,start,stop,setMode,finish,
    skip(){skipping=true;finish()},
    radio(value){playing=value;render()}
  };
})();`, sandbox);
const timer = sandbox.window.test;
const latest = () => contexts.at(-1);
timer.render(); assert.equal(latest().running, false);
timer.start(); assert.equal(latest().mode, 'pomo'); assert.equal(latest().running, true);
timer.radio(true); assert.equal(latest().playing, true); assert.equal(latest().running, true);
timer.stop(); assert.equal(latest().running, false); assert.equal(latest().playing, true);
timer.setMode('short'); timer.start(); assert.equal(latest().mode, 'short');
timer.setMode('long'); timer.start(); assert.equal(latest().mode, 'long');
timer.skip(); assert.equal(celebrations, 0); assert.equal(latest().mode, 'pomo');
timer.start(); now += 25 * 60 * 1000; tick();
assert.equal(celebrations, 1); assert.equal(latest().mode, 'short'); assert.equal(latest().running, false);
timer.radio(false); assert.equal(latest().playing, false);
console.log('OK: actual timer integration, pause, radio context, both breaks, skip and natural completion');
