// Carrega os módulos ES do app (js/*.js) dentro de um contexto vm do Node, sem bundler e sem
// depender de "type": "module". Cada módulo vira uma função isolada que devolve seus exports;
// os imports viram leituras desses exports. Suporta só a forma usada no projeto:
//   import {a, b as c} from "./x.js";   e   export function|const|let|class nome
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');

// Ordem de carregamento: dependências antes de quem as importa.
const APP_MODULES = ['js/dom.js', 'js/timer.js', 'js/stats.js', 'js/tasks.js', 'js/lofi.js', 'js/app.js'];

function transform(file) {
  let src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const names = [];
  src = src.replace(/^import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["'];?/gm, (_, list, from) => {
    const key = path.posix.normalize(path.posix.join(path.posix.dirname(file), from));
    return `const {${list.replace(/\s+as\s+/g, ': ')}} = __mods[${JSON.stringify(key)}];`;
  });
  src = src.replace(/^export\s+((?:async\s+)?(?:function\*?|const|let|class))\s+([A-Za-z_$][\w$]*)/gm, (_, kind, name) => {
    names.push(name); return `${kind} ${name}`;
  });
  if (/^\s*(import|export)\b/m.test(src)) throw new Error(`${file}: forma de import/export não suportada pelo carregador de testes`);
  return `__mods[${JSON.stringify(file)}] = (() => {\n${src}\nreturn { ${names.join(', ')} };\n})();\n`;
}

function bundle(files) { return 'const __mods = {};\n' + files.map(transform).join('') + '__mods;'; }

// Executa os módulos num sandbox e devolve { 'js/x.js': exports }.
function runModules(files, sandbox = {}) {
  const context = vm.isContext(sandbox) ? sandbox : vm.createContext(sandbox);
  return vm.runInContext(bundle(files), context, { filename: 'capifocus-modules.js' });
}

// Atalho para testar um módulo puro: loadModule('js/timer.js').nextStage(...)
function loadModule(file, sandbox = {}) { return runModules([file], sandbox)[file]; }

module.exports = { APP_MODULES, runModules, loadModule, transform };
