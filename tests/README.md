# Testes de regressão

Na raiz do projeto, execute com Node.js 18 ou superior:

```powershell
node tests/run.cjs
```

O comando executa todos os arquivos `*.test.cjs` desta pasta e retorna código de saída diferente de zero quando algum teste falha. Não é necessário instalar dependências. Rode antes de publicar mudanças; acrescente cenários ao alterar funcionalidades.

## Cobertura

| Arquivo | Verificações |
| --- | --- |
| `app-regression.test.cjs` | App inteiro: contagem com relógio controlado, pausa, retomada, reinício, ciclo de quatro focos, salto sem comemoração, criação/conclusão/exclusão de tarefas, crédito de Pomodoro, restauração de dados, rádio e ajustes, música ao pausar e reiniciar (#5), ajustes com timer pausado (#4) e controles de mídia do sistema (#3), pular etapa sem contar pomodoro (#9), atalho do espaço em campos (#12), título da aba (#13), classes de estado do body (#22) dados do localStorage tratados como texto (#23), timer salvo ao recarregar (#15), confirmação de troca de aba (#10), ciclo configurável e início automático (#17), Wake Lock (#16), notificação (#14) estatísticas na tela (#18) e reordenação de tarefas pelo teclado |
| `mascot.test.cjs` | Prioridades, carregamento de poses, comemoração transitória, reação ao clique e movimento reduzido |
| `timer-mascot.test.cjs` | Integração entre o timer real do app e o contexto do mascote |
| `timer-logic.test.cjs` | Regras puras de `js/timer.js` (#24): ciclo com pausa longa a cada N focos, foco pulado, tempo restante, formatação, título, restauração do timer salvo e reordenação de itens (`moveItem`) |
| `stats.test.cjs` | Funções puras de `js/stats.js` (#18): contagem por dia, últimos 7 dias, sequência de dias e limpeza de dados inválidos |
| `static-paths.test.cjs` | Servidor HTTP temporário sob `/capifocus/`: tudo que a página referencia, módulos importados por `js/app.js`, fontes locais, manifest, ícones e lista de cache offline do `sw.js` (nada externo) |
| `theme.test.cjs` | Tema salvo aplicado antes do conteúdo, cores personalizadas e armazenamento ausente ou inválido |

O helper `helpers/esm.cjs` carrega os módulos ES de `js/` no Node sem bundler: cada módulo vira uma função isolada e os `import` viram leituras dos `export`. O helper `helpers/app-harness.cjs` usa esse carregador para executar o app de produção inteiro sem expor suas funções privadas. Simula o DOM, o relógio e o armazenamento; os cenários acionam eventos dos controles e verificam resultados visíveis ou persistidos. Cada cenário começa com uma instância isolada.

Os testes de rádio validam controles, estados e preferências; não verificam síntese ou reprodução de áudio. A suíte não substitui revisão de layout, interação real em navegador, acessibilidade por leitor de tela ou testes em aparelhos. O teste HTTP valida uma publicação local com prefixo, não o servidor de produção.
