# Halloween: o que foi feito, como funciona e como voltar ao normal

Documento técnico da temporada de Halloween (v1.12.0, branch `develop`). A especificação do que a temporada faz está em [halloween.md](halloween.md); aqui está **como foi implementado** e **como desfazer**.

> **Resumo:** quase nada precisa ser feito para voltar ao normal. A temporada se desliga sozinha depois de 1º de novembro. Para tirar o Halloween do código, siga a seção "Como voltar ao normal".

---

## 1. Como funciona

Tudo gira em torno de uma ideia: **"existe uma temporada ativa agora?"**. A resposta vem de `js/seasonal.js`, e cada parte do app se ajusta a ela.

```
index.html
 ├─ js/seasonal.js   (1º) decide a temporada pela data e pela preferência; marca <html class="season-halloween">
 ├─ js/theme.js      (2º) pinta as cores antes da página aparecer; sem tema escolhido, usa a Abóbora
 ├─ css/seasonal.css      estilos que só valem com a classe .season-halloween no <html>
 └─ js/app.js             applySeason(): aplica e desfaz tudo o resto (textos, rádio, alarme, capivara, decoração)
```

### Regras

- **Data:** de 24/10 a 01/11, inclusive (`SEASONS` em `js/seasonal.js`).
- **Preferência:** a opção "Decoração de Halloween" nos ajustes grava `{"halloween": false}` em `localStorage` (`capi-seasonal`). Com ela desligada, a temporada não vale para aquela pessoa.
- **Prévia:** `?temporada=halloween` no endereço liga a temporada fora da data, só naquela visita.
- **Virada da data:** o app confere a cada minuto e ao voltar para a aba (`checkSeason()`); não precisa recarregar.
- **Sem a temporada, nada de Halloween aparece:** nem a estação, nem os alarmes, nem o tema na lista, e a fonte e as imagens nem são baixadas.

### O que `applySeason()` faz (js/app.js)

1. Mostra ou esconde a opção "Decoração de Halloween" (só aparece dentro da data).
2. Liga ou desliga a classe `season-halloween` no `<html>`.
3. Se a estação ou o alarme salvos forem de temporada e ela acabou, volta para "Lo-fi clássico" e "Sininho".
4. Troca a capivara (`mascot.setSkin`), o favicon e o logo do cabeçalho.
5. Liga ou desliga a decoração (teias e morcegos).
6. Redesenha a lista de temas e reaplica as cores.

---

## 2. O que foi feito, arquivo por arquivo

### Arquivos novos (exclusivos do Halloween ou das temporadas)

| Arquivo | Para quê |
|---|---|
| `js/seasonal.js` | Datas (`SEASONS`), textos, doces, easter egg, poses e favicon do Halloween; expõe `CapiSeason` |
| `css/seasonal.css` | Fonte "Capi Terror", teias, morcegos, doces no confete e balão escuro |
| `assets/fonts/CapiTerror.woff2` | Fonte de terror (versão da Creepster com números de largura igual) |
| `assets/fonts/OFL-CapiTerror.txt` | Licença e crédito da fonte (obrigatório enquanto a fonte existir) |
| `assets/mascot/halloween/*.png` | 6 poses de vampiro usadas pelo app (640 px) |
| `assets/mascot/halloween/originais/*.png` | Imagens originais de 1254 px, com nomes descritivos |
| `assets/icons/halloween/favicon-32.png`, `favicon-192.png` | Rostinho de vampiro (aba e logo) |
| `tests/seasonal.test.cjs` | Testes de datas, preferência, prévia, textos e imagens |
| `specs/halloween.md` | Especificação |
| `specs/halloween-implementacao.md` | Este documento |

### Arquivos alterados

| Arquivo | Mudança | Só do Halloween? |
|---|---|---|
| `index.html` | Carrega `js/seasonal.js` antes do tema e `css/seasonal.css`; opção "Decoração de Halloween" (`#season-row`); alarmes `meianoite` e `uivo` no seletor (com `data-season`) | sim |
| `js/theme.js` | Tema `abobora` (com `season:"halloween"`); `defaultId(season)`; `resolve(saved, season)`; id `"auto"` para quem nunca escolheu tema | parte: o `"auto"` e o `defaultId` são estrutura de temporadas |
| `js/app.js` | Textos centralizados em `NORMAL_TXT` + `TXT()`; `season`; alarmes `meianoite` e `uivo` (`howl`, `wolf`); `alarmAllowed`; `stationIds`; `themeId`; `radioArt`; confete com doces; bloco "temporadas" (`applySeason`, `checkSeason`, `setFavicon`, `decoration`, `flyBat`, `seasonEgg`) | quase tudo; ver item 3 |
| `js/lofi.js` | Estação `transilvania` (`season:"halloween"`) com `harpsi`, `violin`, `organ`, `wind`, `churchBell`; agendador aceita `steps` (valsa em 12) | a estação sim; `steps` é estrutura |
| `js/components/mascot.js` | Pose `long` (pausa longa, usa a imagem da curta) e `setSkin(poses)` | não: estrutura reaproveitável |
| `sw.js` | Cache `capifocus-v1.12.0`; `css/seasonal.css`, `js/seasonal.js` e `assets/fonts/CapiTerror.woff2` na lista | parte |
| `README.md` | Seção "Temporada de Halloween", estrutura de pastas, testes, fontes e licença | sim |
| `tests/*` | Cenários de Halloween em `app-regression`, `theme` e `mascot`; harness carrega `js/seasonal.js` e simula `setSkin` | parte |

### No mesmo commit, mas **não** é Halloween (não reverter)

- **Timer à prova de ajuste de relógio (v1.11.1):** `syncLeft` em `js/timer.js`, uso em `step()` de `js/app.js`, barra de progresso limitada a 0–100% e testes em `timer-logic` e `app-regression`.
- **"Limpar concluídas" legível:** `.tasks-head .btn-ghost` em `css/app.css`.

Por isso **não use `git revert` no commit inteiro**: ele desfaria essas correções junto.

### Dados salvos no navegador

| Chave | O que guarda | Impacto ao remover o Halloween |
|---|---|---|
| `capi-seasonal` | `{halloween: false}` e `egg` (dia do easter egg) | pode ficar; sem o código, é ignorada |
| `capi-theme` | `id: "auto"` para quem nunca escolheu tema; `"abobora"` para quem escolheu | `"abobora"` sem o tema cai na Lavanda sozinho |
| `capi-snd2` | `station: "transilvania"` | estação inexistente é ignorada: a rádio fica no Lo-fi clássico |
| `capi-alarm` | `sound: "meianoite"` ou `"uivo"` | alarme inexistente: o app toca o Sininho (o seletor fica vazio até a pessoa escolher outro) |

---

## 3. Como voltar ao normal

Escolha o nível. Do mais simples ao mais completo:

### 3.1. Não fazer nada (recomendado até o ano que vem)

A partir de **2 de novembro** a temporada se desliga sozinha para todo mundo: textos, cores, capivara, fonte, rádio, alarmes e decoração voltam ao normal. Quem estava na estação Transilvânia volta para o Lo-fi clássico; quem usava um alarme de temporada volta para o Sininho. O código fica pronto para o próximo Halloween.

Para desligar só para você, antes da data: Ajustes → Tema → desmarque "Decoração de Halloween".

### 3.2. Desligar para todos antes da data, sem apagar nada

Em `js/seasonal.js`, comente a temporada em `SEASONS`:

```js
const SEASONS = {
  // halloween: { nome: 'Halloween', from: [10, 24], to: [11, 1] }
};
```

Ajuste o teste correspondente (`tests/seasonal.test.cjs` e os cenários de Halloween em `app-regression`), suba a versão do cache em `sw.js` e publique. Sem temporada, nada do Halloween é ativado nem baixado.

### 3.3. Remover só o conteúdo do Halloween, mantendo a estrutura de temporadas

Bom para limpar o repositório e ainda poder criar Natal ou Carnaval depois.

**Apagar:**

```
assets/fonts/CapiTerror.woff2
assets/fonts/OFL-CapiTerror.txt
assets/mascot/halloween/            (pasta inteira, com originais/)
assets/icons/halloween/             (pasta inteira)
```

**Editar:**

1. `js/seasonal.js`: tirar `halloween` de `SEASONS` e de `CONTENT`.
2. `css/seasonal.css`: apagar o `@font-face` "Capi Terror" e todas as regras com `.season-halloween`. As regras genéricas (`.season-deco`, `.season-bats`, `.bat`, `.confetti.candy`) podem ficar.
3. `js/theme.js`: apagar o tema `abobora`.
4. `js/lofi.js`: apagar a estação `transilvania` e as funções `harpsi`, `violin`, `organ`, `wind` e `churchBell` (se nenhuma outra estação usar).
5. `js/app.js`: apagar os alarmes `meianoite` e `uivo` e as funções `howl` e `wolf`.
6. `index.html`: apagar as duas `<option>` com `data-season="halloween"`.
7. `sw.js`: tirar `assets/fonts/CapiTerror.woff2` da lista e subir a versão do cache.
8. `README.md`: tirar a seção "Temporada de Halloween" e as menções à Capi Terror.
9. Testes: em `tests/seasonal.test.cjs`, trocar os casos de Halloween por um teste de "nenhuma temporada"; em `tests/app-regression.test.cjs`, apagar os 5 cenários do bloco "temporada de Halloween"; em `tests/theme.test.cjs`, apagar o bloco `bootSeason`.

### 3.4. Remover tudo, inclusive a estrutura de temporadas

Faça o item 3.3 e, além disso:

1. Apague `js/seasonal.js`, `css/seasonal.css` e `tests/seasonal.test.cjs`.
2. `index.html`: tire `<script src="js/seasonal.js">`, `<link href="css/seasonal.css">` e a opção `#season-row`.
3. `js/app.js`: apague o bloco `// ---------- temporadas` (de `const calm=` até o `visibilitychange` do `checkSeason`), a chamada `seasonEgg()` dentro de `finish`, `season`, `seasonContent`, `alarmAllowed`, `stationIds` (volte a usar `Object.keys(Lofi.ST)`), `themeId` e `radioArt`. Mantenha `NORMAL_TXT` e `TXT()`: funcionam igual sem temporada.
4. `js/theme.js`: tire `defaultId` e o parâmetro `season` de `resolve`, e o trecho que lê `window.CapiSeason`.
5. `tests/helpers/app-harness.cjs`: tire o carregamento de `js/seasonal.js`.
6. `js/components/mascot.js` e o `steps` de `js/lofi.js` podem ficar; não fazem nada sozinhos.

### Depois de qualquer remoção

```
node tests/run.cjs
```

Todos os arquivos de teste precisam passar. Depois, suba a versão do cache em `sw.js` para os apps instalados receberem a mudança e confira no navegador: sem decoração, a capivara normal, o tema Lavanda para quem nunca escolheu tema e o Lo-fi clássico na rádio.

---

## 4. No ano que vem

1. Em `js/seasonal.js`, confira as datas em `SEASONS.halloween`.
2. Teste antes com `?temporada=halloween` no endereço.
3. Suba a versão do cache em `sw.js`.

Para outra data comemorativa, siga o mesmo caminho: uma entrada em `SEASONS`, o conteúdo em `CONTENT` (textos, `theme`, `poses`, `favicon`, `candy`), um tema com `season` em `js/theme.js` e regras com `.season-<id>` em `css/seasonal.css`.
