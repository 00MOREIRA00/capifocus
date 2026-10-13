# Adicionando

- **Controles de mídia do sistema** (closes #3): a Capi Rádio aparece na notificação e na tela de bloqueio do Android, na central de mídia do Windows e do macOS e nos botões dos fones.
  - Mostra o nome da estação, o modo atual e o estado do timer, com a capivara da rádio como capa.
  - Botões de tocar, pausar e avançar ou voltar estação, que seguem as mesmas preferências do player do app.
- **Música com o navegador minimizado**: o lo-fi passa por um elemento de áudio reconhecido pelo sistema e continua tocando em segundo plano no Android. Sem suporte, volta automaticamente para a saída direta.
- **Testes de regressão** para os controles de mídia, para a música ao pausar e reiniciar e para os ajustes salvos com o timer pausado.

# Modificando

- **"Tocar nas pausas"** (closes #5): com a opção desligada, a música para ao pausar ou reiniciar o timer e volta ao continuar. Com ela ligada, segue tocando.
- **Salvar ajustes** (closes #4): o timer rodando ou pausado no meio mantém o tempo atual; os novos tempos valem ao reiniciar ou na próxima etapa.
- **Harness de testes**: simula a Media Session API do navegador.
- **README e documentação dos testes**: descrevem os controles de mídia e os novos cenários.

# Removendo

- **Silêncio ao minimizar o navegador no Android** durante a reprodução da Capi Rádio.
- **Ausência de controles da rádio** fora da página do app.

Validação: `node tests/run.cjs` aprovado em cinco arquivos de testes; controles de mídia e saída de áudio verificados no Chrome para desktop. Teste em aparelho Android real ainda pendente.
