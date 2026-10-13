# 🦫 Capifocus

**Capifocus** é um timer pomodoro minimalista com uma capivara street como companhia. Enquanto você foca, ela curte um lo-fi de fone; na pausa curta, toma um bubble tea; na pausa longa, relaxa no ofurô de óculos escuros.

A ideia é simples: deixar a técnica pomodoro mais leve e divertida, sem cadastro, sem anúncio e sem depender de nenhum serviço externo. É só abrir e focar.

---

## Sobre o projeto

A técnica pomodoro divide o trabalho em blocos de foco (normalmente 25 minutos) separados por pausas curtas. A cada quatro blocos, vem uma pausa mais longa. O Capifocus segue esse ciclo e cuida da parte chata para você: conta o tempo, avisa quando acaba, alterna entre foco e pausa e registra quantos pomodoros cada tarefa levou.

O projeto é feito em HTML, CSS e JavaScript puros, organizado em módulos ES. Não tem framework, build, back-end nem dependências para instalar, e funciona offline depois da primeira visita.

### Funcionalidades

- **Três modos:** Pomodoro, Pausa curta e Pausa longa, cada um com sua cor. A pausa longa entra automaticamente a cada 4 focos completos (configurável de 2 a 10 nos ajustes).
- **Início automático:** opções para começar pausas e focos sozinhos ao fim de cada etapa completa.
- **Timer salvo:** recarregar ou fechar a página não perde o timer. Ele continua contando, e se a etapa terminar com o app fechado ela é registrada ao abrir de novo.
- **Confirmação ao trocar de etapa:** com o timer rodando, trocar de aba pede confirmação antes de descartar o tempo.
- **Tela acesa no foco:** no celular, a tela não apaga enquanto um foco está rodando (onde o navegador suportar).
- **Notificação opcional:** aviso do navegador ao fim de cada etapa quando o app está em segundo plano, inclusive no Android (pelo service worker).
- **Seu progresso:** pomodoros de hoje, dias seguidos com pelo menos um pomodoro e um gráfico dos últimos 7 dias. Só focos completos contam.
- **Instalável e offline:** dá para instalar o Capifocus como app no celular ou no computador, e ele abre mesmo sem internet. As fontes ficam no próprio projeto.
- **Controles do timer:** começar, pausar, reiniciar e pular etapa. A barra de espaço também começa e pausa (exceto quando o foco está num campo ou seletor). Pular um foco não conta como pomodoro concluído nem aproxima a pausa longa.
- **Tempo na aba do navegador:** o título da aba mostra o tempo restante e o modo, por exemplo "18:42 · Foco | Capifocus".
- **Capivara animada:** cada modo tem uma cena própria, que só ganha movimento com o timer rodando.
- **Capi Rádio:** música gerada ao vivo no navegador, com cinco estações:
  - **Lo-fi clássico:** batida lenta com swing e acordes jazzy.
  - **Anime lo-fi:** progressões de J-pop e anime (como IVmaj7–III7–vim7 e a "progressão da estrada real"), piano elétrico com chorus, bateria boom-bap que "respira" junto com os acordes, melodia em frases que se repetem com variação e vocais "aah" picotados.
  - **Jazz café:** prato de condução, vassourinha, baixo caminhando e acordes de jazz.
  - **Noturna:** bem lenta, com acordes longos e eco amplo.
  - **8-bit:** chiptune com arpejos rápidos, no estilo de videogame antigo.

  Troque de estação pelas setas ao lado do nome. Pode tocar só durante o foco ou também nas pausas, e a estação escolhida fica salva.

  Com "Tocar nas pausas" desligado, a música acompanha o timer: para ao pausar ou reiniciar e volta ao continuar. Ligado, ela segue tocando mesmo com o timer pausado.
- **Controles de mídia do sistema:** a Capi Rádio aparece na notificação e na tela de bloqueio do celular (Android), na central de mídia do Windows e do macOS e nos botões dos fones, com o nome da estação, o modo atual e botões de tocar, pausar e trocar de estação. No Android, a música continua tocando com o navegador minimizado.
- **Alarme:** quatro sons (Sininho, Marimba, Capi jingle e Despertador), com número de repetições e volume próprios. A música abaixa sozinha enquanto o alarme toca.
- **Tarefas:** lista com estimativa de pomodoros, tarefa ativa e previsão de horário de término. Mude a ordem arrastando o cartão (no celular, segure um instante antes de arrastar) ou, pelo teclado, com Alt+↑ e Alt+↓. Ao concluir uma tarefa, a capivara comemora com confete, um balão de parabéns e um somzinho.
- **Temas de cor:** oito temas prontos (Lavanda, Menta, Oceano, Pôr do sol, Morango, Noite, Preto e Branco) ou qualquer cor personalizada, inclusive preto e branco. Em fundos claros, textos e botões ficam escuros automaticamente, escolhidos nos ajustes. Cada modo ganha um tom próprio a partir do tema.
- **Ajustes:** duração de cada modo, tema de cor e configurações do alarme.
- **Tudo salvo no navegador:** tarefas, ajustes, tema, estatísticas e preferências de som ficam no `localStorage`. Nada é enviado para servidor nenhum.

### Como o lo-fi funciona

A Capi Rádio não toca nenhum arquivo de áudio nem usa streaming. A música é sintetizada em tempo real com a **Web Audio API**, que vem em todo navegador moderno:

- **Bateria:** o bumbo é um tom grave que cai rápido; caixa e chimbal são ruído filtrado, com um leve swing.
- **Acordes:** progressões jazzy (como Fmaj7, Em7, Dm7, Cmaj7) que se alternam ao longo da música.
- **Baixo e melodia:** o baixo acompanha os acordes e notas soltas são sorteadas de uma escala pentatônica.
- **Textura:** reverb e uma leve oscilação de fita dão o clima lo-fi.

Como parte das notas é sorteada, a música nunca se repete exatamente igual. E, por não usar gravações, não há questões de direitos autorais.

---

## Como rodar localmente

### Pré-requisitos

- Um navegador moderno (Chrome, Edge, Firefox ou Safari).
- [Git](https://git-scm.com/), se quiser clonar o repositório.

### 1. Baixar o projeto

```bash
git clone https://github.com/00MOREIRA00/capifocus.git
cd capifocus
```

Ou, no GitHub, clique em **Code → Download ZIP** e extraia a pasta.

### 2. Rodar com um servidor local

O app usa módulos JavaScript e service worker, que os navegadores só carregam por `http://`. Por isso, abrir o `index.html` com dois cliques não funciona: rode um servidor local dentro da pasta do projeto e abra o endereço indicado.

Com Python:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000`.

Com Node.js:

```bash
npx serve .
```

Acesse o endereço que aparecer no terminal (normalmente `http://localhost:3000`).

Com VS Code: instale a extensão **Live Server**, clique com o botão direito no `index.html` e escolha **Open with Live Server**. A página recarrega sozinha sempre que você salvar o arquivo.

### Observações

- O som só começa depois de um clique na página. É uma regra dos navegadores para evitar áudio automático.
- As fontes Fredoka e Nunito ficam em `assets/fonts/`, então o app não depende de nenhum serviço externo.
- O service worker guarda o app para uso offline. Online, ele sempre busca a versão mais nova; para forçar uma limpeza, use "Limpar dados do site" no navegador.
- Para zerar tarefas e ajustes, limpe os dados do site no navegador (o `localStorage`).

---

## Estrutura do projeto

```text
capifocus/
├── index.html              página e marcação
├── manifest.json           dados do app instalável (nome, ícones, cores)
├── sw.js                   service worker: cache offline e notificações
├── css/
│   ├── app.css             estilos do app
│   └── mascot.css          estilos do mascote
├── js/
│   ├── app.js              módulo principal: liga tudo à página
│   ├── dom.js              seletor, armazenamento, criação de elementos e avisos
│   ├── timer.js            regras do ciclo Pomodoro (funções puras)
│   ├── stats.js            estatísticas por dia (funções puras)
│   ├── tasks.js            lista de tarefas e resumo
│   ├── lofi.js             Capi Rádio (Web Audio API)
│   ├── theme.js            temas de cor, carregado antes para evitar piscar a cor
│   └── components/mascot.js  componente do mascote
├── assets/
│   ├── mascot/             cinco poses da capivara (PNG)
│   ├── icons/              ícones do app instalável
│   └── fonts/              Fredoka e Nunito (woff2) com as licenças OFL
├── tests/                  testes de regressão (Node.js, sem dependências)
└── specs/                  especificações e notas de release
```

`js/app.js` é carregado como módulo (`<script type="module">`) e importa os demais. `js/theme.js` e `js/components/mascot.js` continuam como scripts comuns, carregados antes, para o tema e a capivara aparecerem antes do restante.

---

## Publicar no GitHub Pages

1. Envie o código para o GitHub:

   ```bash
   git add .
   git commit -m "Primeira versão do Capifocus"
   git push
   ```

2. No repositório, vá em **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site fica disponível em `https://00moreira00.github.io/capifocus/`.

---

## Personalizando

- **Tempos padrão:** procure `{pomo:25,short:5,long:15}` em `js/app.js`. As regras do ciclo ficam em `js/timer.js`.
- **Cores:** pelo app, em Ajustes → Tema. No código, edite ou adicione temas na lista `THEMES` (cada um define a cor de fundo e a cor de destaque de cada modo).
- **Estações:** cada estação fica no objeto `ST`, em `js/lofi.js`, com andamento (`bpm`), swing, efeitos, progressões de acordes (`progs`, em notas MIDI) e a função `play`, que define o que toca em cada passo do compasso. Para criar uma estação nova, copie uma existente e ajuste.

---

## Tecnologias

- HTML, CSS e JavaScript puros, com módulos ES
- SVG para a ilustração e as animações
- Web Audio API para o lo-fi e o alarme
- Service worker e Web App Manifest para uso offline e instalação
- Fontes [Fredoka](https://fonts.google.com/specimen/Fredoka) e [Nunito](https://fonts.google.com/specimen/Nunito), hospedadas no projeto (SIL Open Font License)

---

Feito com calma de capivara. 🦫

## Mascote 2.0

`js/components/mascot.js` expõe `CapiMascot.create(host, options)` e o resolvedor puro `CapiMascot.resolve(context)`. O componente aceita `size` (`sm`, `md`, `lg`), `animated` e `className`; a instância oferece `update({mode, running, playing})` e `complete()`. O mapa de imagens é centralizado em `CapiMascot.assets`.

Quando o timer está pausado ou reiniciado, a expressão é `radio` se a música continuar tocando, ou `default`. As imagens são decorativas para leitores de tela; o mascote é um botão com nome acessível, acionável por clique, Enter ou Espaço. As imagens são carregadas antecipadamente e exibidas após decodificação, em uma área com proporção fixa. O SVG anterior permanece como fallback para falha de carregamento. Caminhos relativos funcionam também no deploy em `/capifocus/`.

Animações: entrada suave na primeira imagem decodificada; transição de opacidade entre poses; respiração lenta no repouso, foco e pausa; balanço na rádio; pulo com aterrissagem na conclusão; reação breve ao clicar. `animated: false` desativa movimentos e transições. Movimento reduzido desativa também a entrada e a reação ao clique.

## Testes de regressão

Você precisa de Node.js 18 ou superior. Confira a versão no terminal:

```powershell
node --version
```

No terminal do VS Code, abra a pasta raiz do projeto (a que contém `index.html`) e execute:

```powershell
node tests/run.cjs
```

Não precisa executar `npm install`, iniciar o servidor do app ou abrir o navegador. O teste de caminhos inicia e encerra seu próprio servidor HTTP local.

Se tudo passar, o resultado termina com:

```text
7/7 test files passed
```

Se algum teste falhar, o terminal mostra o cenário, o resultado esperado e o resultado obtido. O comando termina com código de saída diferente de zero. Corrija a falha e execute novamente antes de publicar a alteração.

Para executar apenas uma parte:

```powershell
# Timer, tarefas, rádio, persistência e ajustes
node tests/app-regression.test.cjs

# Estados e animações do mascote
node tests/mascot.test.cjs

# Integração entre timer e mascote
node tests/timer-mascot.test.cjs

# Regras do timer (funções puras de js/timer.js)
node tests/timer-logic.test.cjs

# Estatísticas por dia (js/stats.js)
node tests/stats.test.cjs

# Caminhos, módulos, fontes, manifest e cache offline sob /capifocus/
node tests/static-paths.test.cjs
```

Se o terminal informar que `node` não foi reconhecido, instale o Node.js e reabra o terminal do VS Code.

Os testes verificam lógica, estados e persistência com DOM simulado. Layout, acessibilidade real e reprodução de áudio ainda precisam ser conferidos no navegador. Mais detalhes em [tests/README.md](tests/README.md).
