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

test('#9: pular o foco não conta pomodoro nem aproxima a pausa longa', () => {
  const app = createApp();
  app.get('#nt-name').value = 'Ler'; app.get('#nt-est').value = 3; app.get('#newtask').emit('submit');
  app.get('#main').click(); app.advance(5000); app.get('#skip').click();
  assert.equal(app.context().mode, 'short');
  assert.equal(app.data('capi-tasks')[0].act, 0, 'tarefa não ganha pomodoro');
  assert.equal(app.get('#count').textContent, '#1', 'ciclo não avança');
  app.get('#main').click(); app.get('#skip').click();          // pula a pausa: volta ao foco
  assert.equal(app.context().mode, 'pomo');
  for (let i = 1; i <= 3; i++) {                                 // três focos completos
    app.get('#main').click(); app.advance(25 * 60000);
    app.get('#main').click(); app.advance(5 * 60000);
  }
  assert.equal(app.get('#count').textContent, '#4');
  app.get('#main').click(); app.advance(1000); app.get('#skip').click();
  assert.equal(app.context().mode, 'short', 'pular o 4º foco não libera a pausa longa');
  assert.equal(app.get('#count').textContent, '#4');
  app.get('#main').click(); app.get('#skip').click();
  app.get('#main').click(); app.advance(25 * 60000);
  assert.equal(app.context().mode, 'long', 'o 4º foco completo libera a pausa longa');
  assert.equal(app.data('capi-tasks')[0].act, 4);
});

test('#12: barra de espaço não controla o timer com foco em campos e seletores', () => {
  const app = createApp();
  for (const tagName of ['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON']) {
    assert.equal(app.key('Space', { tagName }), false, tagName);
    assert.equal(app.context().running, false, tagName);
  }
  assert.equal(app.key('Space', { tagName: 'DIV', isContentEditable: true }), false);
  assert.equal(app.context().running, false);
  assert.equal(app.key('Space'), true);
  assert.equal(app.context().running, true, 'fora de campos o espaço inicia o timer');
});

test('#13: título da aba mostra o tempo restante e o modo', () => {
  const app = createApp();
  assert.equal(app.document.title, 'Capifocus');
  app.get('#main').click(); app.advance(5000);
  assert.equal(app.document.title, '24:55 · Foco | Capifocus');
  app.get('#main').click();
  assert.equal(app.document.title, '⏸ 24:55 · Foco | Capifocus');
  app.get('#reset').click();
  assert.equal(app.document.title, 'Capifocus');
  app.tabs[1].click(); app.get('#main').click(); app.advance(1000);
  assert.equal(app.document.title, '04:59 · Pausa curta | Capifocus');
});

test('#22: render liga e desliga só as classes de estado do body', () => {
  const app = createApp();
  const body = app.document.body.classList;
  body.add('classe-externa');
  app.get('#main').click(); app.advance(1000);
  assert.ok(body.contains('pomo') && body.contains('running'));
  assert.ok(body.contains('classe-externa'), 'outras classes sobrevivem ao render');
  app.get('#nt-name').value = 'Teste'; app.get('#newtask').emit('submit');
  app.get('#tasks').children[0].querySelector('.chk').click();
  app.advance(500);
  assert.ok(body.contains('celebrate'), 'comemoração não é apagada pelo próximo render');
  app.get('#main').click(); app.tabs[2].click();
  assert.ok(body.contains('long') && !body.contains('pomo') && !body.contains('running'));
});

test('#23: textos e cores do localStorage não viram HTML', () => {
  const evil = '<img src=x onerror="alert(1)">';
  const saved = new Map([
    ['capi-tasks', JSON.stringify([{ id: 1, name: evil, est: 2, act: 0, done: false }])],
    ['capi-theme', JSON.stringify({ id: 'custom', custom: 'red;"><script>alert(1)</script>' })]
  ]);
  const app = createApp(saved);
  const li = app.get('#tasks').children[0];
  assert.equal(li.querySelector('.nt').textContent, evil, 'nome aparece como texto');
  assert.equal(li.innerHTML, '', 'nenhum HTML montado por string');
  const custom = app.get('#themes').children[0];
  assert.equal(custom.children[0].children[0].value, '#a28bd4', 'cor inválida volta ao padrão');
  assert.equal(app.get('#summary').innerHTML, '');
});
