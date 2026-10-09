const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const files = fs.readdirSync(__dirname).filter(name => name.endsWith('.test.cjs')).sort();
let failures = 0;
for (const file of files) {
  console.log('\n' + file);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) failures++;
}
console.log(`\n${files.length - failures}/${files.length} test files passed`);
process.exitCode = failures ? 1 : 0;
