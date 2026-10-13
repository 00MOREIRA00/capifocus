// Integração entre o timer real do app e o contexto entregue ao mascote.
const assert = require('node:assert/strict');
const createApp = require('./helpers/app-harness.cjs');

const app = createApp();
const latest = () => app.context();
assert.equal(latest().running, false);
app.get('#main').click(); assert.equal(latest().mode, 'pomo'); assert.equal(latest().running, true);
assert.equal(latest().playing, true, 'a rádio acompanha o foco');
app.get('#main').click(); assert.equal(latest().running, false);
app.get('#mus-breaks').checked = true; app.get('#mus-breaks').emit('change');
app.get('#reset').click(); app.tabs[1].click(); app.get('#main').click(); assert.equal(latest().mode, 'short');
app.get('#main').click(); app.get('#reset').click(); app.tabs[2].click(); app.get('#main').click(); assert.equal(latest().mode, 'long');
const before = app.celebrations();
app.get('#skip').click(); assert.equal(app.celebrations(), before); assert.equal(latest().mode, 'pomo');
app.get('#main').click(); app.advance(25 * 60000);
assert.equal(app.celebrations(), before + 1); assert.equal(latest().mode, 'short'); assert.equal(latest().running, false);
app.get('#mus-play').click(); assert.equal(latest().playing, false);
console.log('OK: actual timer integration, pause, radio context, both breaks, skip and natural completion');
