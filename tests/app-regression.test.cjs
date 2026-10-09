const assert = require('node:assert/strict');
const test = require('node:test');
const createApp = require('./helpers/app-harness.cjs');

test('timer counts elapsed time, pauses, resumes and resets', () => {
  const app = createApp();
  assert.equal(app.get('#time').textContent, '25:00');
  app.get('#main').click(); app.advance(5000);
  assert.equal(app.get('#time').textContent, '24:55');
  app.get('#main').click(); app.advance(9000);
  assert.equal(app.get('#time').textContent, '24:55');
  app.get('#main').click(); app.advance(2000);
  assert.equal(app.get('#time').textContent, '24:53');
  app.get('#reset').click();
  assert.equal(app.get('#time').textContent, '25:00');
  assert.equal(app.context().running, false);
});

test('four focus sessions lead to long break; skip does not celebrate', () => {
  const app = createApp();
  for (let i = 1; i <= 4; i++) {
    app.get('#main').click(); app.advance(25 * 60000);
    assert.equal(app.context().mode, i === 4 ? 'long' : 'short');
    if (i < 4) { app.get('#main').click(); app.advance(5 * 60000); }
  }
  assert.equal(app.data('capi-count'), 5);
  const before = app.celebrations();
  app.get('#main').click(); app.get('#skip').click();
  assert.equal(app.context().mode, 'pomo');
  assert.equal(app.celebrations(), before);
});

test('tasks: reject blank, create, credit focus, complete, restore and delete', () => {
  const app = createApp();
  app.get('#nt-name').value = '   '; app.get('#newtask').emit('submit');
  assert.equal(app.get('#tasks').children.length, 0);
  app.get('#nt-name').value = 'Estudar'; app.get('#nt-est').value = 2;
  app.get('#newtask').emit('submit');
  assert.equal(app.data('capi-tasks')[0].name, 'Estudar');
  app.get('#main').click(); app.advance(25 * 60000);
  assert.equal(app.data('capi-tasks')[0].act, 1);
  app.get('#tasks').children[0].querySelector('.chk').click();
  assert.equal(app.data('capi-tasks')[0].done, true);
  assert.equal(app.celebrations(), 2);
  const restored = createApp(app.saved);
  assert.equal(restored.get('#tasks').children.length, 1);
  restored.get('#tasks').children[0].querySelector('.del').click();
  assert.deepEqual(restored.data('capi-tasks'), []);
  assert.equal(restored.data('capi-active'), null);
});

test('radio follows timer, supports pauses, station and volume persistence', () => {
  const app = createApp();
  app.get('#main').click(); assert.equal(app.context().playing, true);
  app.get('#main').click(); assert.equal(app.context().playing, false);
  app.get('#mus-breaks').checked = true; app.get('#mus-breaks').emit('change');
  app.get('#main').click(); app.get('#main').click();
  assert.equal(app.context().playing, true);
  app.get('#mus-play').click(); assert.equal(app.context().playing, false);
  app.get('#st-next').click();
  const station = app.data('capi-snd2').station;
  assert.notEqual(station, 'classico');
  app.get('#snd-vol').value = 30; app.get('#snd-vol').emit('input');
  const restored = createApp(app.saved);
  assert.equal(restored.get('#snd-vol').value, 30);
  assert.equal(restored.get('#mus-breaks').checked, true);
  restored.get('#st-prev').click();
  assert.equal(restored.data('capi-snd2').station, 'classico');
});

test('settings clamp durations and preserve the current running session', () => {
  const app = createApp();
  app.get('#main').click(); app.advance(1000);
  app.get('#set-pomo').value = 10; app.get('#set-short').value = -2; app.get('#set-long').value = 999;
  app.get('#save-settings').click();
  assert.equal(app.get('#time').textContent, '24:59');
  assert.deepEqual(app.data('capi-mins'), { pomo: 10, short: 1, long: 120 });
  app.get('#reset').click(); assert.equal(app.get('#time').textContent, '10:00');
  const restored = createApp(app.saved);
  assert.equal(restored.get('#time').textContent, '10:00');
});
