# 🦫 Capifocus

**Capifocus** é um timer pomodoro minimalista com uma capivara street como companhia. Enquanto você foca, ela curte um lo-fi de fone; na pausa curta, toma um bubble tea; na pausa longa, relaxa no ofurô de óculos escuros.

A ideia é simples: deixar a técnica pomodoro mais leve e divertida, sem cadastro, sem anúncio e sem depender de nenhum serviço externo. É só abrir e focar.

---

## Sobre o projeto

A técnica pomodoro divide o trabalho em blocos de foco (normalmente 25 minutos) separados por pausas curtas. A cada quatro blocos, vem uma pausa mais longa. O Capifocus segue esse ciclo e cuida da parte chata para você: conta o tempo, avisa quando acaba, alterna entre foco e pausa e registra quantos pomodoros cada tarefa levou.

O projeto foi feito em HTML, CSS e JavaScript puros, num único arquivo. Não tem framework, build, back-end nem dependências para instalar.

### Funcionalidades

- **Três modos:** Pomodoro, Pausa curta e Pausa longa, cada um com sua cor. A pausa longa entra automaticamente a cada 4 pomodoros.
- **Controles do timer:** começar, pausar, reiniciar e pular etapa. A barra de espaço também começa e pausa.
- **Capivara animada:** cada modo tem uma cena própria, que só ganha movimento com o timer rodando.
- **Capi Rádio:** música gerada ao vivo no navegador, com cinco estações:
  - **Lo-fi clássico:** batida lenta com swing e acordes jazzy.
  - **Anime lo-fi:** progressões de J-pop e anime (como IVmaj7–III7–vim7 e a "progressão da estrada real"), piano elétrico com chorus, bateria boom-bap que "respira" junto com os acordes, melodia em frases que se repetem com variação e vocais "aah" picotados.
  - **Jazz café:** prato de condução, vassourinha, baixo caminhando e acordes de jazz.
  - **Noturna:** bem lenta, com acordes longos e eco amplo.
  - **8-bit:** chiptune com arpejos rápidos, no estilo de videogame antigo.

  Troque de estação pelas setas ao lado do nome. Pode tocar só durante o foco ou também nas pausas, e a estação escolhida fica salva.
- **Alarme:** quatro sons (Sininho, Marimba, Capi jingle e Despertador), com número de repetições e volume próprios. A música abaixa sozinha enquanto o alarme toca.
- **Tarefas:** lista com estimativa de pomodoros, tarefa ativa e previsão de horário de término.
- **Temas de cor:** seis temas prontos (Lavanda, Menta, Oceano, Pôr do sol, Morango e Noite) ou uma cor personalizada, escolhidos nos ajustes. Cada modo ganha um tom próprio a partir do tema.
- **Ajustes:** duração de cada modo, tema de cor e configurações do alarme.
- **Tudo salvo no navegador:** tarefas, ajustes, tema e preferências de som ficam no `localStorage`. Nada é enviado para servidor nenhum.

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

### 2. Abrir no navegador

**Opção A: abrir o arquivo direto**

Dê dois cliques no `index.html`. Pronto, o app já funciona.

**Opção B: rodar com um servidor local** (recomendado para desenvolver)

Escolha uma das opções abaixo, rode o comando dentro da pasta do projeto e abra o endereço indicado no navegador.

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
- As fontes vêm do Google Fonts. Sem internet, o app funciona normalmente com uma fonte padrão do sistema.
- Para zerar tarefas e ajustes, limpe os dados do site no navegador (o `localStorage`).

---

## Estrutura do projeto

```
capifocus/
├── index.html   # o app inteiro: HTML, CSS, SVG da capivara e JavaScript
└── README.md
```

Dentro do `index.html`, as partes principais são:

| Parte | O que faz |
| --- | --- |
| `<style>` | Cores de cada modo, layout e as animações da capivara |
| `<svg class="capy">` | Ilustração da capivara e os objetos de cada cena |
| Timer | Contagem, troca de modos, ciclo de 4 pomodoros |
| Tarefas | Lista, estimativas e previsão de término |
| `Lofi` | Motor do lo-fi com a Web Audio API |
| Alarme | Sons de fim de ciclo e configurações |

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

- **Tempos padrão:** procure `{pomo:25,short:5,long:15}` no JavaScript.
- **Cores:** pelo app, em Ajustes → Tema. No código, edite ou adicione temas na lista `THEMES` (cada um define a cor de fundo e a cor de destaque de cada modo).
- **Estações:** cada estação fica no objeto `ST`, dentro do bloco `Lofi`, com andamento (`bpm`), swing, efeitos, progressões de acordes (`progs`, em notas MIDI) e a função `play`, que define o que toca em cada passo do compasso. Para criar uma estação nova, copie uma existente e ajuste.

---

## Tecnologias

- HTML, CSS e JavaScript puros
- SVG para a ilustração e as animações
- Web Audio API para o lo-fi e o alarme
- Fontes [Fredoka](https://fonts.google.com/specimen/Fredoka) e [Nunito](https://fonts.google.com/specimen/Nunito)

---

Feito com calma de capivara. 🦫
