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
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(html.indexOf('<script src="js/theme.js"></script>') < html.indexOf('<body>'));
assert(html.indexOf('<script src="js/theme.js"></script>') < html.indexOf('href="css/app.css"'));
console.log('OK: saved theme before body, custom colors, defaults and unavailable storage');
