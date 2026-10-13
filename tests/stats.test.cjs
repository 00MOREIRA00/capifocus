// #18: estatísticas por dia (js/stats.js), sem DOM.
const assert = require('node:assert/strict');
const test = require('node:test');
const { loadModule } = require('./helpers/esm.cjs');
const S = loadModule('js/stats.js', { Date });
const day = (y, m, d, h = 12) => new Date(y, m - 1, d, h);

test('conta pomodoros por dia local', () => {
  let s = S.sanitizeStats(null);
  s = S.addPomodoro(s, day(2026, 10, 13, 9)); s = S.addPomodoro(s, day(2026, 10, 13, 23));
  s = S.addPomodoro(s, day(2026, 10, 14, 0));
  assert.deepEqual(JSON.parse(JSON.stringify(s.days)), { '2026-10-13': 2, '2026-10-14': 1 });
});

test('últimos 7 dias em ordem, com zeros', () => {
  const s = { days: { '2026-10-13': 3, '2026-10-10': 1, '2026-10-01': 9 } };
  const week = S.lastDays(s, day(2026, 10, 13), 7);
  assert.deepEqual([...week].map(d => d.key), ['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13']);
  assert.deepEqual([...week].map(d => d.count), [0, 0, 0, 1, 0, 0, 3]);
  assert.equal(S.lastDays(s, day(2026, 3, 1), 3)[0].key, '2026-02-27', 'atravessa o mês');
});

test('sequência de dias seguidos', () => {
  const s = { days: { '2026-10-10': 1, '2026-10-11': 2, '2026-10-12': 1 } };
  assert.equal(S.streak(s, day(2026, 10, 12)), 3);
  assert.equal(S.streak(s, day(2026, 10, 13)), 3, 'hoje sem pomodoro ainda mantém a sequência de ontem');
  assert.equal(S.streak(s, day(2026, 10, 14)), 0, 'um dia inteiro sem pomodoro zera');
  assert.equal(S.streak({ days: { '2026-10-13': 1 } }, day(2026, 10, 13)), 1);
  assert.equal(S.streak({ days: {} }, day(2026, 10, 13)), 0);
});

test('limpa dados salvos inválidos ou antigos', () => {
  const s = S.sanitizeStats({ days: { '2026-10-13': 2, '2026-10-12': -1, 'ontem': 3, '2026-10-11': 'x', '2020-01-01': 5, '2026-10-10': 2.7 } }, day(2026, 10, 13));
  assert.deepEqual(JSON.parse(JSON.stringify(s.days)), { '2026-10-13': 2, '2026-10-10': 2 });
  assert.deepEqual(JSON.parse(JSON.stringify(S.sanitizeStats('lixo').days)), {});
});
