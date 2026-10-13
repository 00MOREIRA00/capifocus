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
    // tudo que a página referencia, mais os módulos importados por js/app.js
    const urls = [...html.matchAll(/(?:src|href)="((?:css|js|assets)\/[^"?]+|manifest\.json)"/g)].map(match => match[1]);
    for (const state of ['default', 'focus', 'break', 'completed', 'radio']) urls.push(`assets/mascot/capy-${state}.png`);
    const seen = new Set();
    for (let i = 0; i < urls.length; i++) {
      const relative = urls[i];
      if (seen.has(relative)) continue; seen.add(relative);
      const response = await fetch(new URL(relative, base));
      assert.equal(response.status, 200, relative);
      const body = Buffer.from(await response.arrayBuffer());
      assert.deepEqual(body, await fs.readFile(path.join(root, relative)));
      if (relative.endsWith('.js')) for (const m of body.toString().matchAll(/from\s*["'](\.\/[^"']+)["']/g))
        urls.push(path.posix.normalize(path.posix.join(path.posix.dirname(relative), m[1])));
      if (relative.endsWith('.css')) for (const m of body.toString().matchAll(/url\("?([^")]+)"?\)/g))
        if (!/^(data:|https?:)/.test(m[1])) urls.push(path.posix.normalize(path.posix.join(path.posix.dirname(relative), m[1])));
    }
    for (const mod of ['js/dom.js', 'js/timer.js', 'js/stats.js', 'js/tasks.js', 'js/lofi.js', 'assets/fonts/Nunito.woff2', 'assets/fonts/Fredoka.woff2'])
      assert.ok(seen.has(mod), `${mod} não foi alcançado a partir da página`);
    // nenhum recurso externo: o app funciona offline
    assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic/);
    // manifest e service worker
    const manifest = JSON.parse(await (await fetch(new URL('manifest.json', base))).text());
    assert.equal(manifest.start_url, './'); assert.equal(manifest.display, 'standalone');
    for (const icon of manifest.icons) { const r = await fetch(new URL(icon.src, base)); assert.equal(r.status, 200, icon.src); }
    const sw = await (await fetch(new URL('sw.js', base))).text();
    const cached = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
    for (const asset of cached) { const r = await fetch(new URL(asset, base)); assert.equal(r.status, 200, `sw.js: ${asset}`); }
    for (const needed of seen) assert.ok(cached.includes(needed), `sw.js não guarda ${needed} para uso offline`);
    console.log(`OK: HTTP under /capifocus/, ${seen.size} files reached from the page, manifest and ${cached.length} offline assets`);
  } finally { server.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
