# Adicionando

- **Mascote 2.0**: nova capivara com cinco expressões para repouso, foco, pausa, conclusão e rádio.
- **Animações do mascote**: entrada suave, transição entre poses, respiração discreta, balanço ao ouvir rádio, pulo de comemoração e reação ao clique ou teclado. Os efeitos respeitam a preferência por movimento reduzido.
- **Componente reutilizável** com tamanhos configuráveis, mapa centralizado de imagens e mascote anterior como fallback.
- **Testes de regressão** para timer, ciclo de Pomodoro, tarefas, preferências da rádio, persistência, ajustes e mascote. Execute `node tests/run.cjs`, sem instalar dependências.

# Modificando

- **Organização do projeto**: HTML em `index.html`, estilos em `css/`, lógica em `js/` e imagens em `assets/mascot/`.
- **Expressões contextuais**: foco e pausa têm prioridade sobre rádio. Com o timer parado ou pausado, a capivara acompanha a rádio quando ela continua tocando.
- **Comemoração**: acionada por 1,9 segundo ao concluir naturalmente uma sessão ou marcar uma tarefa como concluída. Pular etapa não dispara a comemoração.
- **Textos do mascote e README** atualizados para a nova arte, estrutura e execução dos testes.

# Removendo

- **Concentração dos estilos e scripts no HTML**, agora separados em arquivos próprios.
- **Dependência das cenas de bubble tea e ofurô** na apresentação principal do mascote; o SVG antigo continua disponível como fallback.

Validação: quatro arquivos de testes aprovados e sintaxe JavaScript verificada. Aparência no celular aprovada pelo usuário; revisão no desktop, fluxos completos no navegador e validação da publicação real ainda pendentes.
