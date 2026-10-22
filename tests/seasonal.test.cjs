// Temporadas (specs/halloween.md): datas, preferência e classe no <html> antes da primeira pintura.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/seasonal.js'), 'utf8');

function boot(now, saved = null, search = '') {
  const classes = new Set();
  class Clock extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } }
  const window = {};
  const sandbox = { window, Date: Clock, URLSearchParams, location: { search }, localStorage: { getItem: () => saved },
    document: { documentElement: { classList: { add: c => classes.add(c) } } } };
  vm.runInNewContext(source, sandbox);
  return { S: window.CapiSeason, classes };
}
const day = (m, d) => new Date(2026, m - 1, d, 12).getTime();

test('Halloween vale de 24/10 a 01/11, inclusive', () => {
  const { S } = boot(day(6, 1));
  const at = (m, d) => S.inSeason(new Date(2026, m - 1, d, 12));
  assert.equal(at(10, 23), null);
  assert.equal(at(10, 24), 'halloween');
  assert.equal(at(10, 31), 'halloween');
  assert.equal(at(11, 1), 'halloween');
  assert.equal(at(11, 2), null);
  assert.equal(at(12, 25), null);
});

test('desligar nos ajustes tira a temporada, mas a opção continua na data', () => {
  const { S } = boot(day(10, 28), JSON.stringify({ halloween: false }));
  assert.equal(S.inSeason(new Date(2026, 9, 28)), 'halloween');
  assert.equal(S.active(new Date(2026, 9, 28)), null);
  assert.equal(S.active(new Date(2026, 9, 28), {}), 'halloween');
  assert.equal(S.active(new Date(2026, 9, 28), { halloween: true }), 'halloween');
});

test('classe da temporada no <html> sai cedo, só quando está ativa', () => {
  assert.equal(boot(day(10, 30)).classes.has('season-halloween'), true);
  assert.equal(boot(day(10, 30), JSON.stringify({ halloween: false })).classes.has('season-halloween'), false);
  assert.equal(boot(day(11, 5)).classes.size, 0);
  assert.equal(boot(day(10, 30), '{json quebrado').classes.has('season-halloween'), true, 'preferência inválida não quebra');
});

test('conteúdo do Halloween tem todos os textos que o app usa', () => {
  const c = boot(day(10, 30)).S.content('halloween');
  for (const m of ['pomo', 'short', 'long']) { assert.ok(c.msg[m]); assert.ok(c.doing[m]); assert.ok(c.notify[m]); }
  assert.ok(c.cheers.length && c.grumbles.length && c.candy.length);
  assert.ok(c.plus && c.idle && c.radio && c.theme);
  assert.deepEqual({ ...c.egg }, { month: 10, day: 31, count: 3, text: 'Doces ou travessuras?' });
  assert.equal(boot(day(10, 30)).S.content('natal'), null);
});

test('prévia com ?temporada=halloween fora da data', () => {
  const { S, classes } = boot(day(6, 1), null, '?temporada=halloween');
  assert.equal(S.inSeason(new Date(2026, 5, 1)), 'halloween');
  assert.equal(classes.has('season-halloween'), true);
  assert.equal(boot(day(6, 1), null, '?temporada=natal').classes.size, 0, 'temporada desconhecida é ignorada');
  assert.equal(boot(day(6, 1), JSON.stringify({ halloween: false }), '?temporada=halloween').classes.size, 0, 'preferência desligada vale também na prévia');
});

test('imagens da capivara de vampiro e do favicon existem e estão leves', () => {
  const c = boot(day(10, 30)).S.content('halloween');
  const files = [...Object.values(c.poses), ...Object.values(c.favicon)];
  for (const pose of ['default', 'focus', 'break', 'long', 'completed', 'radio', 'rabugenta']) assert.ok(c.poses[pose], pose);
  for (const f of files) {
    const full = path.join(__dirname, '..', f);
    assert.ok(fs.existsSync(full), f);
    assert.ok(fs.statSync(full).size < 600 * 1024, f + ' com menos de 600 KB');
  }
});
