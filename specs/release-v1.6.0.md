# Adicionando

- **Tempo restante no título da aba** (closes #13): a aba mostra o tempo e o modo, como "18:42 · Foco | Capifocus". Com o timer pausado no meio aparece "⏸" antes do tempo; parado e zerado, volta a ser só "Capifocus".
- **Relógio do lo-fi em segundo plano**: o agendador da Capi Rádio passa a receber o "tique" de um Web Worker, que o navegador desacelera menos, com volta automática para o timer da página quando o worker não está disponível.
- **Testes de regressão** para pular etapa, atalho da barra de espaço, título da aba, classes de estado da página e dados salvos no navegador. O harness ganhou simulação de teclado, título e busca dos elementos criados pelo app.

# Modificando

- **Pular etapa** (closes #9): pular um foco leva à pausa curta sem contar pomodoro na tarefa e sem avançar o ciclo. A pausa longa só chega depois de quatro focos completos.
- **Lo-fi com a aba minimizada** (closes #11): com a aba oculta, a música é agendada 1,5 s à frente (0,2 s com ela visível), e o agendador retoma o compasso atual quando atrasa, sem travar nem despejar notas atrasadas.
- **Atalho da barra de espaço** (closes #12): não inicia nem pausa o timer com o foco em seletores, campos de texto, botões ou áreas editáveis.
- **Classes de estado da página** (closes #22): modo, `running` e `on-light` são ligados e desligados individualmente com `classList.toggle`, preservando as classes do alarme e da comemoração.
- **Montagem da interface** (closes #23): lista de tarefas, resumo e seletor de temas são criados com `createElement` e `textContent`. A cor personalizada salva é validada antes do uso.
- **README e documentação dos testes**: descrevem o título da aba, o comportamento de pular etapa e os novos cenários.

# Removendo

- **Variáveis globais** `window.__ring`, `window.__cele` e `window.__isLight`.
- **Uso de `innerHTML`** com dados salvos no navegador.
- **Travadas e atraso da música** quando a aba fica em segundo plano.

Validação: `node tests/run.cjs` aprovado em cinco arquivos de testes, com 13 cenários no teste do app; atalho, pular etapa, título, temas e lista de tarefas verificados no Chrome para desktop; agendamento em segundo plano verificado com aba oculta simulada. Escuta prolongada com o navegador minimizado em aparelho real ainda pendente.
