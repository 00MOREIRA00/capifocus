# Testes de regressão

Na raiz do projeto, execute com Node.js 18 ou superior:

```powershell
node tests/run.cjs
```

O comando executa todos os arquivos `*.test.cjs` desta pasta e retorna código de saída diferente de zero quando algum teste falha. Não é necessário instalar dependências. Rode antes de publicar mudanças; acrescente cenários ao alterar funcionalidades.

## Cobertura

| Arquivo | Verificações |
| --- | --- |
| `app-regression.test.cjs` | App inteiro: contagem com relógio controlado, pausa, retomada, reinício, ciclo de quatro focos, salto sem comemoração, criação/conclusão/exclusão de tarefas, crédito de Pomodoro, restauração de dados, rádio e ajustes |
| `mascot.test.cjs` | Prioridades, carregamento de poses, comemoração transitória, reação ao clique e movimento reduzido |
| `timer-mascot.test.cjs` | Integração entre funções reais do timer e contexto do mascote |
| `static-paths.test.cjs` | Servidor HTTP temporário: caminhos de scripts, CSS e PNGs sob `/capifocus/` |
| `theme.test.cjs` | Tema salvo aplicado antes do conteúdo, cores personalizadas e armazenamento ausente ou inválido |

O helper `helpers/app-harness.cjs` executa o script de produção inteiro sem expor suas funções privadas. Simula o DOM, o relógio e o armazenamento; os cenários acionam eventos dos controles e verificam resultados visíveis ou persistidos. Cada cenário começa com uma instância isolada.

Os testes de rádio validam controles, estados e preferências; não verificam síntese ou reprodução de áudio. A suíte não substitui revisão de layout, interação real em navegador, acessibilidade por leitor de tela ou testes em aparelhos. O teste HTTP valida uma publicação local com prefixo, não o servidor de produção.
