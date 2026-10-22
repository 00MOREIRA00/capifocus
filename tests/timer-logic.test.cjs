// #24: regras do timer como funções puras (js/timer.js), sem DOM.
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadModule } = require('./helpers/esm.cjs');
const T = loadModule('js/timer.js');
const plain = value => JSON.parse(JSON.stringify(value));   // objetos criados no vm têm outro protótipo

test('foco completo conta pomodoro e alterna pausas curtas e longa', () => {
  let count = 1; const seen = [];
  for (let i = 0; i < 8; i++) {
    const r = T.nextStage({ mode: 'pomo', completed: true, count, longEvery: 4 });
    assert.equal(r.credit, true); assert.equal(r.count, count + 1);
    seen.push(r.mode); count = r.count;
  }
  assert.deepEqual(seen, ['short', 'short', 'short', 'long', 'short', 'short', 'short', 'long']);
});

test('pausa longa a cada N focos configurável', () => {
  const modes = n => { let count = 1; return Array.from({ length: n * 2 }, () => { const r = T.nextStage({ mode: 'pomo', completed: true, count, longEvery: n }); count = r.count; return r.mode; }); };
  assert.deepEqual(modes(2), ['short', 'long', 'short', 'long']);
  assert.deepEqual(modes(3), ['short', 'short', 'long', 'short', 'short', 'long']);
  assert.equal(T.clampLongEvery('1'), 2); assert.equal(T.clampLongEvery(99), 10); assert.equal(T.clampLongEvery('x'), 4);
});

test('foco pulado não conta nem avança o ciclo; pausa sempre volta ao foco', () => {
  assert.deepEqual(plain(T.nextStage({ mode: 'pomo', completed: false, count: 4, longEvery: 4 })), { mode: 'short', count: 4, credit: false });
  assert.deepEqual(plain(T.nextStage({ mode: 'short', completed: true, count: 3, longEvery: 4 })), { mode: 'pomo', count: 3, credit: false });
  assert.deepEqual(plain(T.nextStage({ mode: 'long', completed: false, count: 5, longEvery: 4 })), { mode: 'pomo', count: 5, credit: false });
});

test('tempo restante, formatação, minutos e título', () => {
  assert.equal(T.remaining(10500, 1000), 10); assert.equal(T.remaining(1000, 5000), 0);
  assert.equal(T.fmt(0), '00:00'); assert.equal(T.fmt(65), '01:05'); assert.equal(T.fmt(25 * 60), '25:00');
  assert.equal(T.clampMinutes('-3', 25), 1); assert.equal(T.clampMinutes(500, 25), 120); assert.equal(T.clampMinutes('', 5), 5);
  assert.equal(T.titleFor({ running: false, left: 1500, total: 1500, mode: 'pomo' }), 'Capifocus');
  assert.equal(T.titleFor({ running: true, left: 1122, total: 1500, mode: 'pomo' }), '18:42 · Foco | Capifocus');
  assert.equal(T.titleFor({ running: false, left: 60, total: 300, mode: 'short' }), '⏸ 01:00 · Pausa curta | Capifocus');
});

test('restaura timer salvo: rodando, pausado, zerado, expirado e inválido', () => {
  const mins = { pomo: 25, short: 5, long: 15 }, now = 1_000_000;
  assert.deepEqual(plain(T.restoreState({ mode: 'pomo', total: 1500, left: 1400, running: true, endAt: now + 600000 }, mins, now)),
    { mode: 'pomo', total: 1500, left: 600, running: true, endAt: now + 600000, expired: false });
  assert.deepEqual(plain(T.restoreState({ mode: 'short', total: 300, left: 120, running: false, endAt: 0 }, mins, now)),
    { mode: 'short', total: 300, left: 120, running: false, endAt: 0, expired: false });
  assert.deepEqual(plain(T.restoreState({ mode: 'long', total: 600, left: 600, running: false }, mins, now)),
    { mode: 'long', total: 900, left: 900, running: false, endAt: 0, expired: false }, 'zerado usa os minutos atuais');
  assert.equal(T.restoreState({ mode: 'pomo', total: 1500, left: 10, running: true, endAt: now - 5000 }, mins, now).expired, true);
  for (const bad of [null, 'x', { mode: 'turbo', total: 10, left: 5 }, { mode: 'pomo', total: 0, left: 0 }, { mode: 'pomo', total: 100, left: 200 }, { mode: 'pomo', total: 100, left: -1 }])
    assert.equal(T.restoreState(bad, mins, now), null, JSON.stringify(bad));
});

test('moveItem reordena sem alterar a lista original', () => {
  const { moveItem } = require('./helpers/esm.cjs').runModules(['js/dom.js', 'js/tasks.js'])['js/tasks.js'];
  const list = ['A', 'B', 'C', 'D'];
  assert.deepEqual([...moveItem(list, 0, 2)], ['B', 'C', 'A', 'D']);
  assert.deepEqual([...moveItem(list, 3, 0)], ['D', 'A', 'B', 'C']);
  assert.deepEqual([...moveItem(list, 1, 99)], ['A', 'C', 'D', 'B'], 'destino além do fim vai para o fim');
  assert.deepEqual([...moveItem(list, 9, 0)], list, 'origem inválida não muda nada');
  assert.deepEqual(list, ['A', 'B', 'C', 'D']);
});

test('#28: pausa curta não passa do Pomodoro e é menor que a longa', () => {
  const fields = m => T.validateDurations(m).map(e => e.field).join(',');
  assert.equal(fields({ pomo: 25, short: 5, long: 15 }), '');
  assert.equal(fields({ pomo: 25, short: 25, long: 30 }), '', 'curta igual ao foco é permitida');
  assert.equal(fields({ pomo: 10, short: 20, long: 30 }), 'short');
  assert.equal(fields({ pomo: 25, short: 15, long: 15 }), 'long', 'longa igual à curta não serve');
  assert.equal(fields({ pomo: 10, short: 20, long: 5 }), 'short,long');
  assert.match(T.validateDurations({ pomo: 10, short: 20, long: 30 })[0].message, /pausa curta/);
});

test('relógio do sistema que volta não aumenta o tempo restante', () => {
  const now = 10_000_000, endAt = now + 600_000;            // 10 min restantes
  assert.deepEqual(plain(T.syncLeft({ endAt, now: now + 1000, total: 1500, left: 600 })), { left: 599, endAt });
  // relógio voltou 2h22: continua em 10:00 e o fim é recalculado
  const back = now - 8_520_000;
  assert.deepEqual(plain(T.syncLeft({ endAt, now: back, total: 1500, left: 600 })), { left: 600, endAt: back + 600_000 });
  // fim salvo além da duração da etapa também é corrigido
  assert.equal(T.syncLeft({ endAt: now + 9_000_000, now, total: 1500, left: 1500 }).left, 1500);
  const r = T.restoreState({ mode: 'pomo', total: 1500, left: 1200, running: true, endAt: now + 10_000_000 }, { pomo: 25 }, now);
  assert.equal(r.left, 1200); assert.equal(r.endAt, now + 1_200_000); assert.equal(r.running, true);
});
