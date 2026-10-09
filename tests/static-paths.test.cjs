const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const server = http.createServer(async (req, res) => {
  try {
    const relative = new URL(req.url, 'http://localhost').pathname.replace(/^\/capifocus\//, '');
    const filename = path.resolve(root, relative || 'index.html');
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.end(await fs.readFile(filename));
  } catch { res.writeHead(404).end(); }
});
async function run() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/capifocus/`;
    const page = await fetch(base);
    assert.equal(page.status, 200);
    const html = await page.text();
    const urls = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+)"/g)].map(match => match[1]);
    for (const state of ['default', 'focus', 'break', 'completed', 'radio']) urls.push(`assets/mascot/capy-${state}.png`);
    for (const relative of urls) {
      const response = await fetch(new URL(relative, base));
      assert.equal(response.status, 200, relative);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), await fs.readFile(path.join(root, relative)));
    }
    console.log('OK: HTTP under /capifocus/, scripts, styles and five PNGs');
  } finally { server.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
