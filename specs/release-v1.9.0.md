# Adicionando

- **Validação dos tempos** (closes #28): ao salvar os ajustes, a pausa curta não pode passar do Pomodoro e a pausa longa precisa ser maior que a curta. Se a regra não for cumprida, nada é salvo, o painel continua aberto, o campo com problema fica destacado e uma mensagem diz o que corrigir. O aviso some assim que você edita os tempos.
- **Opção "Mesma cor no Pomodoro e nas pausas"** (closes #29): deixa qualquer tema, inclusive "Sua cor", com uma única cor nos três modos. A escolha fica salva e já vale na abertura do app, sem piscar a cor.
- **Licença MIT** (closes #26): arquivo `LICENSE` na raiz do repositório.
- **Testes de regressão** para as regras de tempo, os temas de cor única e a opção "mesma cor".

# Modificando

- **Temas Preto e Branco** (closes #29): passam a usar a mesma cor em Pomodoro, pausa curta e pausa longa.
- **README** (closes #25): link do app publicado, seção de publicação no lugar das instruções antigas do GitHub Pages, temas e ajustes atualizados, caminhos do "Personalizando" corrigidos e seção de licença.
- **Repositório** (closes #27): campo Website apontando para o app publicado, além de descrição e tópicos.
- **Ícones do app**: metadados embutidos removidos dos PNGs, sem mudança na imagem.
- **Cache offline**: versão do service worker atualizada para `capifocus-v1.9.0`.

# Removendo

- **Tempos incoerentes** nos ajustes, como pausa curta maior que o foco ou pausa longa menor que a curta.
- **Instruções de publicação no GitHub Pages** e menções antigas a SVG no README.

Validação: `node tests/run.cjs` aprovado nos sete arquivos de testes, com 23 cenários no teste do app e 7 nas regras do timer; validação dos tempos e opção "mesma cor" verificadas no Chromium para desktop, sem erros no console. Uso em aparelho real ainda pendente.
