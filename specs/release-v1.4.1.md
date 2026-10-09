# Adicionando

- **Carregamento antecipado do tema salvo**: a página já começa com a cor escolhida, incluindo cores personalizadas.
- **Testes de regressão** para inicialização do tema e falhas de carregamento ou decodificação das imagens do mascote.
- **Pré-carregamento da pose padrão** para antecipar a exibição da nova capivara.

# Modificando

- **Balão de comemoração** (closes #6): fica acima da capivara, evitando que a imagem cubra o texto durante a animação.
- **Ícone do cabeçalho e favicon**: passam a usar a nova capivara.
- **Temas**: definições e cálculos compartilhados em `js/theme.js`, utilizado na inicialização e pelo painel de ajustes.
- **README e documentação dos testes**: atualizados para a suíte com cinco arquivos de testes.

# Removendo

- **Capivara antiga do HTML e do fallback** (closes #7): não aparece ao atualizar a página nem quando uma imagem falha. A pose nova anterior permanece visível durante a troca de imagens.
- **Flash do fundo roxo padrão** antes da aplicação do tema salvo.

Validação: `node tests/run.cjs` aprovado em cinco arquivos de testes; sintaxe JavaScript e `git diff --check` verificados. Correção do balão e carregamento do tema confirmados pelo usuário.
