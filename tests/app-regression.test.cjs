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

test('#5: com "Tocar nas pausas" desligado, pausar e reiniciar param a música; ligado, ela continua', () => {
  const app = createApp();
  assert.equal(app.get('#mus-breaks').checked, false);
  app.get('#main').click(); assert.equal(app.context().playing, true);
  app.get('#main').click(); assert.equal(app.context().playing, false, 'pausar para a música');
  app.get('#main').click(); assert.equal(app.context().playing, true, 'continuar volta a tocar');
  app.advance(3000); app.get('#reset').click();
  assert.equal(app.context().playing, false, 'reiniciar para a música');
  app.get('#mus-breaks').checked = true; app.get('#mus-breaks').emit('change');
  app.get('#main').click(); app.advance(2000);
  app.get('#main').click(); assert.equal(app.context().playing, true, 'ligado: pausar não para');
  app.get('#reset').click(); assert.equal(app.context().playing, true, 'ligado: reiniciar não para');
});

test('#4: salvar ajustes com o timer pausado no meio mantém o tempo; zerado aplica na hora', () => {
  const app = createApp();
  app.get('#main').click(); app.advance(7000); app.get('#main').click();
  assert.equal(app.get('#time').textContent, '24:53');
  app.get('#set-pomo').value = 40; app.get('#save-settings').click();
  assert.equal(app.get('#time').textContent, '24:53');
  assert.equal(app.get('#main').textContent, 'Começar');
  app.get('#reset').click(); assert.equal(app.get('#time').textContent, '40:00');
  app.get('#set-pomo').value = 15; app.get('#save-settings').click();
  assert.equal(app.get('#time').textContent, '15:00');
});

test('#3: controles de mídia do sistema mostram a estação e controlam a rádio', () => {
  const app = createApp();
  const ms = app.mediaSession;
  for (const action of ['play', 'pause', 'nexttrack', 'previoustrack']) assert.equal(typeof ms.handlers[action], 'function', action);
  assert.equal(ms.metadata.title, 'Lo-fi clássico');
  assert.equal(ms.metadata.artist, 'Capi Rádio · Capifocus');
  assert.equal(ms.playbackState, 'paused');
  app.get('#main').click();
  assert.equal(ms.playbackState, 'playing');
  assert.match(ms.metadata.album, /Pomodoro · timer rodando/);
  ms.handlers.nexttrack();
  assert.notEqual(ms.metadata.title, 'Lo-fi clássico');
  assert.equal(app.data('capi-snd2').station, 'anime');
  ms.handlers.previoustrack();
  assert.equal(ms.metadata.title, 'Lo-fi clássico');
  ms.handlers.pause();
  assert.equal(app.context().playing, false); assert.equal(ms.playbackState, 'paused');
  assert.equal(app.data('capi-snd2').lofi, false);
  ms.handlers.play();
  assert.equal(app.context().playing, true); assert.equal(ms.playbackState, 'playing');
});
