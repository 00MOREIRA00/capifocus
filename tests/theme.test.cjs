const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/theme.js'), 'utf8');
function boot(value, blocked = false) {
  const properties = {}, meta = {};
  const sandbox = { window: {}, localStorage: { getItem() { if (blocked) throw new Error('blocked'); return value; } },
    document: { documentElement: { style: { setProperty(key, val) { properties[key] = val; } } },
      querySelector: () => ({ setAttribute(key, val) { meta[key] = val; } }) } };
  vm.runInNewContext(source, sandbox);
  return { properties, meta };
}
for (const [value, expected] of [[JSON.stringify({id:'preto'}),'#111111'],
  [JSON.stringify({id:'branco'}),'#ffffff'], [JSON.stringify({id:'custom',custom:'#123456'}),'#123456'],
  ['invalid JSON','#a28bd4'], [null,'#a28bd4'], [JSON.stringify({id:'missing'}),'#a28bd4'],
  [JSON.stringify({id:'custom',custom:'invalid'}),'#a28bd4']]) {
  const { properties, meta } = boot(value);
  assert.equal(properties['--bg'], expected);
  assert.equal(properties['--bg-pomo'], expected);
  assert.equal(meta.content, expected);
}
assert.equal(boot(null, true).properties['--bg'], '#a28bd4');
// #29: Preto e Branco usam a mesma cor em todos os modos; "mesma cor" vale para qualquer tema
for (const id of ['preto', 'branco']) {
  const { properties } = boot(JSON.stringify({ id }));
  assert.equal(properties['--bg-short'], properties['--bg-pomo']);
  assert.equal(properties['--bg-long'], properties['--bg-pomo']);
  assert.equal(properties['--acc-long'], properties['--acc-pomo']);
}
const same = boot(JSON.stringify({ id: 'lavanda', same: true })).properties;
assert.equal(same['--bg-short'], same['--bg-pomo']); assert.equal(same['--bg-long'], same['--bg-pomo']);
const mixed = boot(JSON.stringify({ id: 'lavanda' })).properties;
assert.notEqual(mixed['--bg-short'], mixed['--bg-pomo'], 'sem a opção, cada modo tem sua cor');
const sameCustom = boot(JSON.stringify({ id: 'custom', custom: '#2a7a5b', same: true })).properties;
assert.equal(sameCustom['--bg-long'], '#2a7a5b');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(html.indexOf('<script src="js/theme.js"></script>') < html.indexOf('<body>'));
assert(html.indexOf('<script src="js/theme.js"></script>') < html.indexOf('href="css/app.css"'));
console.log('OK: saved theme before body, custom colors, defaults and unavailable storage');
