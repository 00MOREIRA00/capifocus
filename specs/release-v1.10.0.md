# Adicionando

- **Capivara bolada** (closes #8): clicar muitas vezes seguidas na capivara (6 cliques em menos de 2,5 s) a deixa rabugenta. Ela troca de pose, treme por um instante e reclama num balão com frases como "Tô focando aqui, pô!" e "Capivara também tem limite!". Depois de cerca de 3 segundos volta ao normal. Com movimento reduzido, a pose e a frase aparecem sem a animação.
- **Easter egg do plano Plus** (closes #8): a cada três reclamações, a capivara propõe as pazes: "Paga o plano Plus que talvez eu reclame menos."
- **Pose rabugenta** em `assets/mascot/capy-rabugenta.png`, incluída no cache offline.
- **Rostinho da capivara** como ícone da aba do navegador (favicon), logo do cabeçalho e imagem no topo do README, em versões leves geradas a partir da arte original.
- **Testes de regressão** para a capivara bolada (cliques rápidos e espaçados, pausa entre reclamações, movimento reduzido, frase do plano Plus), para o tema "Sua cor" e para os novos arquivos servidos em `/capifocus/`.

# Modificando

- **Tema "Sua cor"** (closes #29): a cor escolhida à mão passa a valer igual para Pomodoro, pausa curta e pausa longa, mantendo o contraste automático de textos e botões.
- **README**: rostinho no topo, dica da capivara bolada, temas atualizados e estrutura de pastas com as seis poses e os novos ícones.
- **Cache offline**: versão do service worker atualizada para `capifocus-v1.10.0`.

# Removendo

- **Tons diferentes por modo no tema "Sua cor"**.
- **Pose de corpo inteiro no logo do cabeçalho**, substituída pelo rostinho.

Validação: `node tests/run.cjs` aprovado nos sete arquivos de testes, com 24 cenários no teste do app; capivara bolada, frase do plano Plus, favicon, logo e tema "Sua cor" verificados no Chromium em tamanho de celular, sem erros no console. Cliques rápidos em aparelho real ainda pendentes.
