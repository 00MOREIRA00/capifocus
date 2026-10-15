# v1.11.0

- **Nomes de tarefas limitados a 120 caracteres** (closes #30): contador no formulário, limite ao salvar e ajuste de nomes antigos ao abrir o app. Na lista e abaixo da capivara, os nomes aparecem em até duas linhas com reticências, inclusive palavras sem espaços.
- **Limpar concluídas (N)** (closes #31): botão disponível quando há tarefas concluídas, com confirmação e opção de desfazer por 8 segundos. Preserva as estatísticas e seleciona a próxima tarefa pendente quando a ativa é removida. Desfazer restaura as tarefas sem perder novas inclusões.
- **Cache offline** atualizado para `capifocus-v1.11.0`.

Validação: `node tests/run.cjs` aprovado nos sete arquivos de testes, incluindo três novos cenários para limite de nomes, limpeza, cancelamento, persistência e desfazer. `git diff --check` sem erros. Conferência visual no navegador ainda pendente.
