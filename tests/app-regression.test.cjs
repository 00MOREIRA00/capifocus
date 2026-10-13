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

const flush = () => new Promise(resolve => setImmediate(resolve));

test('#15: timer salvo continua após recarregar, pausado ou rodando', () => {
  const app = createApp();
  app.get('#main').click(); app.advance(60000);
  const reloaded = createApp(app.saved, { now: app.now() + 10000 });
  assert.equal(reloaded.get('#time').textContent, '23:50', 'desconta o tempo com a página fechada');
  assert.equal(reloaded.context().running, true);
  assert.equal(reloaded.get('#main').textContent, 'Pausar');
  reloaded.get('#main').click(); reloaded.advance(3000);
  const again = createApp(reloaded.saved, { now: reloaded.now() + 600000 });
  assert.equal(again.get('#time').textContent, '23:50', 'pausado não perde tempo');
  assert.equal(again.context().running, false);
  again.tabs[1].click();
  assert.equal(createApp(again.saved).context().mode, 'short', 'modo também é salvo');
});

test('#15: etapa que terminou com o app fechado é registrada sem alarme', () => {
  const app = createApp();
  app.get('#nt-name').value = 'Ler'; app.get('#newtask').emit('submit');
  app.get('#main').click(); app.advance(1000);
  const later = createApp(app.saved, { now: app.now() + 40 * 60000 });
  assert.equal(later.context().mode, 'short');
  assert.equal(later.context().running, false);
  assert.equal(later.data('capi-tasks')[0].act, 1);
  assert.equal(later.celebrations(), 0, 'sem comemoração nem alarme');
  assert.match(later.get('#toast').textContent, /terminou enquanto o Capifocus estava fechado/);
});

test('#10: trocar de aba com o timer rodando pede confirmação', () => {
  const app = createApp();
  assert.equal(app.get('#confirm').hidden, true);
  app.get('#main').click(); app.advance(5000);
  app.tabs[1].click();
  assert.equal(app.get('#confirm').hidden, false, 'mostra a confirmação');
  assert.match(app.get('#cf-text').textContent, /Foco.*24:55.*Pausa curta/);
  assert.equal(app.context().mode, 'pomo'); assert.equal(app.context().running, true);
  app.get('#cf-cancel').click();
  assert.equal(app.get('#confirm').hidden, true);
  assert.equal(app.context().mode, 'pomo', 'cancelar mantém tudo');
  assert.equal(app.context().running, true);
  app.tabs[0].click(); assert.equal(app.get('#confirm').hidden, true, 'mesma aba não pergunta');
  app.tabs[2].click(); app.get('#cf-ok').click();
  assert.equal(app.context().mode, 'long'); assert.equal(app.context().running, false);
  app.tabs[1].click();
  assert.equal(app.get('#confirm').hidden, true, 'parado troca direto');
  assert.equal(app.context().mode, 'short');
});

test('#17: pausa longa configurável e início automático das etapas', () => {
  const app = createApp();
  app.get('#set-every').value = 2; app.get('#save-settings').click();
  assert.equal(app.data('capi-flow').longEvery, 2);
  assert.equal(app.get('#every-hint').textContent, '1 pausa curta e depois 1 pausa longa');
  assert.equal(createApp().get('#every-hint').textContent, '3 pausas curtas e depois 1 pausa longa', 'padrão: a cada 4 focos');
  app.get('#main').click(); app.advance(25 * 60000);
  assert.equal(app.context().mode, 'short');
  app.get('#main').click(); app.advance(5 * 60000);
  app.get('#main').click(); app.advance(25 * 60000);
  assert.equal(app.context().mode, 'long', 'pausa longa depois de 2 focos');
  assert.equal(app.context().running, false, 'sem início automático');
  app.get('#auto-break').checked = true; app.get('#auto-pomo').checked = true; app.get('#save-settings').click();
  app.get('#main').click(); app.advance(15 * 60000);
  assert.equal(app.context().mode, 'pomo');
  app.advance(2000);
  assert.equal(app.context().running, true, 'foco começa sozinho');
  app.advance(25 * 60000); app.advance(2000);
  assert.equal(app.context().mode, 'short'); assert.equal(app.context().running, true, 'pausa começa sozinha');
  app.get('#skip').click(); app.advance(2000);
  assert.equal(app.context().mode, 'pomo'); assert.equal(app.context().running, false, 'pular não inicia sozinho');
  const restored = createApp(app.saved);
  assert.equal(restored.get('#set-every').value, 2);
  assert.equal(restored.get('#auto-break').checked, true);
});

test('#16: tela fica acesa só durante o foco rodando', async () => {
  const app = createApp();
  app.get('#main').click(); await flush();
  assert.equal(app.locks.length, 1); assert.equal(app.locks[0].type, 'screen');
  app.get('#main').click(); await flush();
  assert.equal(app.locks[0].released, true, 'pausar solta a tela');
  app.get('#main').click(); await flush();
  assert.equal(app.locks.length, 2, 'continuar pede de novo');
  app.advance(25 * 60000); await flush();
  assert.equal(app.locks[1].released, true, 'fim do foco solta');
  app.get('#main').click(); app.advance(1000); await flush();
  assert.equal(app.locks.length, 2, 'pausa não prende a tela');
});

test('#14: notificação ao fim da etapa, com permissão pedida no clique', async () => {
  const app = createApp(new Map(), { focused: false });
  app.get('#notify-on').checked = true; app.get('#notify-on').emit('change'); await flush();
  assert.equal(app.data('capi-flow').notify, true);
  app.get('#main').click(); app.advance(25 * 60000);
  assert.equal(app.notifications.length, 1);
  assert.match(app.notifications[0].body, /pausa curta/);
  app.get('#main').click(); app.get('#skip').click();
  assert.equal(app.notifications.length, 1, 'pular não notifica');
  const denied = createApp(new Map(), { focused: false, grantNotifications: false });
  denied.get('#notify-on').checked = true; denied.get('#notify-on').emit('change'); await flush();
  assert.equal(denied.get('#notify-on').checked, false, 'sem permissão a opção volta a desligar');
  denied.get('#main').click(); denied.advance(25 * 60000);
  assert.equal(denied.notifications.length, 0);
  const focused = createApp(new Map(), { notificationPermission: 'granted' });
  focused.get('#notify-on').checked = true; focused.get('#notify-on').emit('change');
  focused.get('#main').click(); focused.advance(25 * 60000);
  assert.equal(focused.notifications.length, 0, 'com o app na frente basta o alarme');
});
