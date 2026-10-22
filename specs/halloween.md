# Capifocus de Halloween 🎃

Estilização sazonal para o Dia das Bruxas. Fica ligada automaticamente **de 24 de outubro a 1º de novembro**, com opção nos ajustes para desligar ("Decoração de Halloween"). Quando a data passa, tudo volta ao normal sozinho, sem apagar nada do app.

---

## Objetivo

- Dar uma cara especial ao Capifocus na época do Halloween, sem atrapalhar o foco.
- Não mexer em dados salvos (tarefas, estatísticas, tema escolhido, estação da rádio).
- Respeitar acessibilidade: contraste dos textos e "reduzir movimento" do sistema.
- Deixar a estrutura pronta para outras datas (Natal, Carnaval) no futuro.

---

## 1. Tema "Abóbora"

| Modo | Fundo | Destaque |
|---|---|---|
| Pomodoro | laranja abóbora | marrom escuro |
| Pausa curta | roxo bruxa | roxo profundo |
| Pausa longa | verde-musgo escuro | verde-musgo |

- Durante a data, vira o tema padrão para quem **não escolheu** nenhum tema; quem escolheu um tema continua com o seu e encontra a "Abóbora" na lista.
- Fundo com teias bem sutis nos cantos, feitas em CSS (sem imagem nova).
- Contraste de textos e botões calculado automaticamente, como nos outros temas.

**Esforço:** baixo, só código.

---

## 2. Capivara fantasiada

Poses no mesmo estilo das atuais (PNG 1254×1254, fundo transparente). **As imagens são geradas por fora** e entram em `assets/mascot/halloween/`.

| Situação | Pose atual | Fantasia sugerida | Arquivo |
|---|---|---|---|
| Esperando | `capy-default` | chapéu de bruxa, de fone | `capy-default.png` |
| Foco | `capy-focus` | chapéu de bruxa, concentrada | `capy-focus.png` |
| Pausa curta | `capy-break` | balde de abóbora com doces no lugar do bubble tea | `capy-break.png` |
| Pausa longa | `capy-break` | enrolada num lençol de fantasma | `capy-long.png` |
| Rádio | `capy-radio` | chapéu de bruxa curtindo música | `capy-radio.png` |
| Concluída | `capy-completed` | comemorando com doces | `capy-completed.png` |
| Rabugenta | `capy-rabugenta` | capa de vampiro | `capy-rabugenta.png` |
| Rostinho / favicon | `rostinho` | rosto com chapéu de bruxa ou abóbora | `rostinho.png` |

- Pose que não existir em `halloween/` usa a pose normal, então dá para lançar com só algumas fantasias.
- Versão mínima: só a de chapéu de bruxa, usada em todos os modos.
- Antes de subir, remover os metadados embutidos dos PNGs e gerar o favicon em 32 e 192 px.

**Esforço:** baixo no código; depende das imagens.

---

## 3. Decoração animada

- Morcegos voando devagar pelo fundo de vez em quando (2 ou 3 por vez, atrás do conteúdo, sem bloquear cliques).
- O confete de tarefa concluída vira doces 🍬 e morcegos 🦇.
- Tudo desligado com "reduzir movimento" do sistema.
- Animações pausadas com a aba em segundo plano, para não gastar bateria.

**Esforço:** baixo, só código.

---

## 4. Estação "Transilvânia" na Capi Rádio

Sexta estação, que só aparece durante a data. Uma valsa gótica de castelo de vampiro, gerada ao vivo com Web Audio, como as outras, sem arquivo de áudio.

- Compasso de valsa (3 tempos), lenta e calma, cerca de 66 BPM, em ré menor.
- Cravo macio no "um-dois-três" e um arpejo descendo devagar no fim de cada frase.
- Órgão de igreja grave segurando os acordes (Dm, Gm, A7, Bb, Eb).
- Violino cigano com arco lento e vibrato, em frases longas, improvisando na escala menor húngara (as segundas aumentadas dão o sotaque do Leste Europeu).
- Coro grave "aah" no começo de cada volta.
- Bem ao fundo: vento e, de vez em quando, o sino da meia-noite (sem trovão, para não assustar).
- Tudo original; nenhuma melodia de trilha conhecida.
- Integra com os controles de mídia do sistema, como as outras estações.
- Se a pessoa estiver na "Transilvânia" quando a data acabar, volta para o Lo-fi clássico.

**Esforço:** médio, só código.

---

## 5. Textos e sons

**Ao concluir tarefas**
- "Feitiço concluído!"
- "Mais uma pro caldeirão!"
- "Travessura feita!"
- "Capivara assombrada aprova!"

**Mensagens dos modos**
- Pomodoro: "Hora de enfeitiçar o foco!"
- Pausa curta: "Pausa pra um docinho!"
- Pausa longa: "Pausa longa. Descansa, fantasminha."

**Capivara bolada**
- "Me cutuca de novo e eu viro abóbora!"
- "Tô num feitiço de concentração!"
- "Vou te assombrar, hein!"
- Easter egg do Plus: "Paga o plano Plus que eu tiro a maldição."

**Notificações**
- Fim do foco: "O feitiço acabou! Hora da pausa."
- Fim da pausa: "A meia-noite chegou. Bora focar?"

**Alarmes extras** (só durante a data)
- "Sino da meia-noite": badaladas graves com eco.
- "Uivo de lobo": glissando sintetizado.

**Esforço:** baixo, só código.

---

## 6. Easter egg do dia 31

No dia **31 de outubro**, ao completar 3 pomodoros, a capivara solta um **"Doces ou travessuras?"** no balão, com uma chuva de doces. Acontece uma vez por dia.

**Esforço:** baixo, só código.

---

## Como implementar

- Novo módulo `js/seasonal.js` com a lista de datas especiais e uma função pura que diz qual temporada está ativa num dia, testável sem DOM.
- O app consulta essa função ao abrir e à meia-noite (como já faz com as estatísticas).
- Preferência salva em `capi-seasonal` (`{halloween: true|false}`).
- Estilos em `css/seasonal.css`, todos dentro de `body.season-halloween`, sem tocar no CSS atual.
- Novos arquivos incluídos no cache offline do service worker.
- No ano que vem, basta mudar as datas.

---

## Testes de regressão

- A temporada liga só entre 24/10 e 01/11, inclusive na virada do dia com o app aberto.
- Desligar nos ajustes some com tudo e fica salvo.
- O tema escolhido pela pessoa não muda; a "Abóbora" só é padrão para quem nunca escolheu.
- A estação "Transilvânia" some depois da data e a rádio volta para o Lo-fi clássico.
- Pose de Halloween que não existir usa a pose normal.
- Com "reduzir movimento", não há morcegos nem chuva de doces.
- O easter egg do dia 31 aparece uma vez só.

---

## Entrega sugerida

1. **Até 24/10:** a versão só com código (itens 1, 3, 4, 5 e 6).
2. **Assim que as imagens estiverem prontas:** a capivara fantasiada e o favicon (item 2).
3. **01/11:** confirmar que tudo voltou ao normal sozinho.

## Andamento (branch `develop`)

- [x] Tema Abóbora, padrão para quem nunca escolheu tema, e só na lista durante a data
- [x] Teias nos cantos, morcegos voando e doces no lugar do confete (desligados com "reduzir movimento")
- [x] Estação "Transilvânia": valsa gótica lenta com cravo, órgão, violino cigano, coro e fundo de vento e sino
- [x] Alarmes "Sino da meia-noite" e "Uivo de lobo"
- [x] Frases de Halloween (comemoração, modos, notificações, capivara bolada e plano Plus)
- [x] Easter egg do dia 31
- [x] Opção "Decoração de Halloween" nos ajustes, salva em `capi-seasonal`
- [x] Estrutura para a capivara fantasiada: `poses` e `favicon` em `js/seasonal.js`; pausa longa com pose própria (`long`)
- [x] Fonte de terror "Capi Terror" nos títulos e no timer
- [x] Testes: `tests/seasonal.test.cjs`, cenários novos em `app-regression`, `theme` e `mascot`
- [x] Capivara de vampiro: 6 poses em `assets/mascot/halloween/` (640 px, sem metadados), originais em `assets/mascot/halloween/originais/` e rostinho como favicon e logo em `assets/icons/halloween/`. A pausa curta e a longa usam a mesma pose (relaxada).

## Fonte de Halloween

- "Capi Terror": versão da Creepster (SIL OFL) com subconjunto latino, números de largura igual (o timer não "dança") e nome novo, porque "Creepster" é nome reservado pela licença. Licença em `assets/fonts/OFL-CapiTerror.txt`.
- Usada no logo, no timer, nas abas dos modos, nos títulos das seções e no balão da capivara. Textos menores continuam em Nunito.
- Só é baixada durante a temporada (cerca de 26 KB).

## Pendências

- [ ] Subir antes a correção do tempo que passava da duração da etapa (v1.11.1).
- [ ] Decidir se a "Abóbora" continua disponível na lista de temas depois da data.
