# Capifocus — Especificação técnica: Mascote 2.0 (MVP)

> **Status:** implementação técnica e verificações automatizadas concluídas localmente. Aparência no celular aprovada pelo usuário. Revisão de desktop, fluxos completos no navegador e publicação real ainda pendentes.
> **Destinatário:** Codex.  
> **Aplicação:** https://rneto.dev.br/capifocus/  
> **Repositório:** https://github.com/00MOREIRA00/capifocus  
> **Objetivo:** substituir o mascote atual por uma nova capivara oficial, reativa ao contexto do aplicativo, com animações simples e componente reutilizável.

## 1. Contexto e direção visual

O Capifocus é uma aplicação de produtividade com temporizador Pomodoro, tarefas e rádio. A nova capivara deve ser um mascote **original, 2D e de corpo inteiro**, com uma identidade mais marcante e menos infantil que a versão anterior. O conceito visual explorado e bem recebido inclui:

- Contornos escuros e fortes, estilo cartoon/sticker, sem copiar literalmente a imagem usada como referência.
- Sorriso largo, expressivo e levemente malandro.
- Corpo inteiro, com proporções estilizadas e postura descontraída.
- Moletom roxo-escuro, headphone rosa e tênis claros com detalhes rosa como **aparência padrão fixa**.
- Expressões reconhecíveis em tamanhos diferentes, inclusive em telas pequenas.

**Importante:** a prancha visual gerada durante a concepção continua sendo apenas uma **referência conceitual**. Entretanto, **cinco PNGs individuais já foram gerados**, um por estado, conforme a seção 3.1. O Codex deve verificar sua presença e adequação no repositório antes de integrar, sem recortar a prancha. Preservar o mascote atual até validar as novas imagens em contexto no app.

## 2. Escopo fechado desta versão

Implementar somente os quatro itens a seguir:

1. **Nova capivara oficial:** integrar e exibir o novo personagem no aplicativo, substituindo o atual após aprovação dos assets.
2. **Expressões por contexto:** apresentar uma expressão coerente com o estado atual do Capifocus.
3. **Animações simples:** pequenos movimentos sutis e não intrusivos.
4. **Uso em várias telas:** disponibilizar uma implementação reutilizável, configurável por tamanho, estado e contexto.

### Fora do escopo (não implementar)

- Cosméticos, slots, inventário, lojas, moedas, conquistas, desbloqueios ou personalização pelo usuário.
- Persistência de itens e cadastro de acessórios.
- Sistema de camadas para roupas/fones/tênis intercambiáveis.
- Backend ou novas APIs dedicadas ao mascote.
- Rive, Lottie, Canvas, 3D ou novas dependências pesadas sem justificativa e aprovação.
- Redesenho global da aplicação ou mudanças nas regras de negócio do Pomodoro.

**Princípio:** priorizar uma implementação pequena, sustentável e funcional; não antecipar a arquitetura de cosméticos.

## 3. Comportamentos e expressões

| Contexto | Expressão/pose esperada | Quando utilizar |
|---|---|---|
| `default` | Sorriso marcante, expressão tranquila | Estado inicial ou contexto não especificado |
| `focus` | Olhar concentrado, postura discreta | Sessão de foco em andamento |
| `break` | Expressão relaxada | Intervalo curto ou longo em andamento |
| `completed` | Sorriso mais aberto e gesto breve de comemoração | Evento de conclusão de sessão |
| `radio` | Expressão curtindo a música, com reação sutil | Rádio ativa, quando não houver estado de maior prioridade |

### 3.1. Assets visuais já gerados (entrega inicial)

Os cinco PNGs individuais abaixo **já foram produzidos**. O Codex deve usá-los como ponto de partida para o MVP; **não gerar novos desenhos por conta própria** nem recortar poses da prancha. Antes de executar, confirmar que os arquivos foram adicionados ao repositório. Caso o usuário tenha inserido os arquivos com os nomes originais, copiá-los/renomeá-los para a convenção sugerida na coluna de destino, sem substituir o conteúdo da imagem.

| Estado | Arquivo original entregue | Nome recomendado no projeto | Uso |
|---|---|---|---|
| `default` | `capivara_confiante_de_fones_rosa.png` | `capy-default.png` | Inicial/repouso; sorriso característico |
| `focus` | `capivara_focada_com_fones_rosa.png` | `capy-focus.png` | Sessão de foco ativa; olhar determinado |
| `break` | `capivara_relaxando_com_fones_rosa.png` | `capy-break.png` | Pausa; olhos fechados, sorriso leve |
| `completed` | `capivara_comemorando_a_vitória.png` | `capy-completed.png` | Conclusão; braços levantados em comemoração |
| `radio` | `capivara_dançarina_com_fones_rosa.png` | `capy-radio.png` | Rádio ativa; expressão animada, notas musicais |

**Propriedades técnicas identificadas nesta entrega:** PNG em **RGBA**, com prancheta de **1254 × 1254 px** em todos os cinco arquivos. A transparência deve ser testada sobre os fundos reais do aplicativo. Embora tenham o mesmo tamanho, as poses ocupam áreas diferentes do quadro; verificar enquadramento visual, tamanho percebido e alinhamento dos pés durante as transições.

**Local sugerido de destino:** `assets/mascot/` ou equivalente às convenções existentes no repositório. Exemplos de URLs e imports devem ser adaptados ao caminho real e ao sistema atual de publicação, inclusive quando o site é hospedado em `/capifocus/`.

**Cuidados de implementação:**

- Manter **nomes de arquivos estáveis**, centralizados em um único mapa de estados → asset.
- Usar o mesmo contêiner responsivo para todos os estados e preservar a razão de aspecto, com `object-fit: contain` (ou equivalente), para não causar saltos na interface.
- Pré-carregar ou pré-decodificar as imagens necessárias quando fizer sentido, evitando piscadas na primeira troca de estado; preferir carregamento leve e cache do navegador.
- Considerar a conversão para **WebP** posteriormente, **sem perder transparência**, se o peso dos PNGs for alto. Não exigir SVG: os arquivos fornecidos são rasterizados.
- **Piscar real** não está representado por imagens intermediárias: não prometer esse efeito usando apenas os cinco PNGs. Nesta fase, priorizar respiração/balanço/celebração por CSS e tratar piscar como melhoria condicionada a arte apropriada.
- Não presumir que a troca de expressão implica troca de estados de negócio: o mascote apenas observa os eventos já existentes.
- Testar visibilidade, contraste e dimensionamento em desktop/mobile antes de remover a versão antiga.

### Regras de prioridade

1. `completed` representa **um evento transitório**; não deve ficar permanente após o término do efeito.
2. Enquanto uma sessão de foco está em andamento, `focus` prevalece sobre `radio`.
3. Durante o intervalo, `break` prevalece sobre `radio`.
4. `radio` aparece quando a rádio está ativa e nenhum contexto prioritário está presente.
5. Na ausência de contexto, usar `default`.
6. Em condições ambíguas (timer pausado, reiniciado ou conclusão dispensada), seguir o comportamento real da aplicação e documentar a decisão; não inventar novos estados de negócio.

As expressões poderão ser arquivos completos da capivara em diferentes estados (SVG ou WebP/PNG com transparência), sem exigir separação física de olhos, boca e corpo. O formato final depende dos assets disponíveis. Evitar troca brusca de layout entre imagens.

## 4. Animações simples

Implementar preferencialmente usando recursos já existentes no projeto e CSS:

- **Respiração suave:** oscilação mínima do personagem em estado padrão ou relaxado.
- **Piscar:** quando a arte permitir, piscar ocasionalmente; se exigir redesenho ou recortes artificiais, aguardar os assets apropriados.
- **Comemoração:** pequena animação acionada uma única vez no evento `completed`.
- **Rádio (opcional conforme arte):** balanço muito sutil, sem desviar a atenção durante o foco.

### Requisitos de animação

- Priorizar performance e evitar animações contínuas intensas.
- Honrar `prefers-reduced-motion`: exibir a expressão correta sem movimento.
- Não causar deslocamentos de layout (CLS).
- Não interferir no clique dos controles ou na acessibilidade da interface.
- Garantir que o evento de conclusão não reinicie a animação indevidamente a cada renderização.

## 5. Componente reutilizável

Implementar conforme o framework e os padrões **realmente encontrados** no repositório. Não pressupor que o projeto utiliza React.

Contrato conceitual (adaptar à stack existente):

```ts
type MascotState = 'default' | 'focus' | 'break' | 'completed' | 'radio';

interface MascotOptions {
  state: MascotState;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}
```

- Manter lógica de resolução do estado isolada da renderização visual.
- Receber estados normalizados e/ou criar um adaptador para os estados reais do temporizador e rádio.
- Centralizar caminhos dos assets para evitar referências duplicadas entre telas.
- Permitir escala responsiva preservando proporções e transparência.
- Definir texto alternativo adequado ou marcar como decorativo quando não acrescentar informação; não anunciar mudanças repetidas a leitores de tela.
- Aproveitar o sistema atual de estilos, componentes e testes; evitar introduzir framework novo.

## 6. Integração com o aplicativo

1. Inspecionar a árvore do projeto, as dependências, o timer, a rádio e os locais em que o mascote atual é renderizado.
2. Identificar pontos de integração **já existentes**, sem alterar o fluxo do Pomodoro.
3. Exibir a nova capivara nos pontos relevantes onde a atual aparece, com ajustes de tamanho e layout por contexto.
4. Conectar expressões aos estados reais. Não associar `completed` apenas a um valor visual do contador: usar o evento de conclusão já existente ou o sinal mais confiável disponível.
5. Verificar comportamentos quando a rádio toca durante foco/pausa, quando a sessão é interrompida e quando o usuário navega entre telas.
6. Confirmar a presença dos cinco PNGs da seção 3.1; se algum arquivo estiver ausente no repositório, documentar o impedimento, manter o mascote antigo ou um fallback aprovado e não fabricar uma nova ilustração.

## 7. Organização sugerida de arquivos

**Exemplo ilustrativo, não uma estrutura obrigatória:** adequar os nomes ao projeto real.

```text
src/
  components/
    mascot/
      Mascot.(extensão da stack)
      mascot-states.(ts|js)
      mascot-styles.(css|module.css)
      mascot-assets.(ts|js)
public/
  assets/
    mascot/
      capy-default.png
      capy-focus.png
      capy-break.png
      capy-completed.png
      capy-radio.png
```

As cinco imagens entregues têm a mesma dimensão de prancheta, mas exigem revisão do enquadramento percebido quando exibidas na mesma área. Preservar o fundo transparente e não adicionar fundo sólido aos assets.

## 8. Plano de execução para o Codex

### Etapa A — Diagnóstico
- [x] Identificar stack, componentes existentes, estilos e infraestrutura de testes.
- [x] Localizar mascote atual, pontos de exibição e fontes dos estados de foco, pausa, conclusão e rádio.
- [x] Localizar os cinco PNGs listados na seção 3.1; mapear nomes originais para os nomes de produção e verificar integridade/transparência.
- [x] Resumir as descobertas e eventuais impedimentos antes de alterações relevantes.

### Etapa B — Componente base
- [x] Criar componente reutilizável compatível com a stack.
- [x] Definir estado padrão, resolução de assets, tamanhos e acessibilidade.
- [x] Garantir fallback para eventual asset ausente durante desenvolvimento, sem apresentar placeholder como design aprovado.

### Etapa C — Estados e animações
- [x] Integrar contextos `default`, `focus`, `break`, `completed` e `radio`.
- [x] Aplicar prioridades e tratamento de conclusão transitória.
- [x] Adicionar animações simples pertinentes aos assets, respeitando movimento reduzido.

### Etapa D — Integração e validação
- [ ] Substituir o mascote nas áreas acordadas após validar os cinco assets fornecidos e obter aceite visual no app.
- [x] Validar aparência no celular — usuário confirmou: “No celular ficou bom”.
- [ ] Testar em desktop e concluir a validação funcional em dispositivos móveis.
- [ ] Confirmar que Pomodoro, tarefas e rádio continuam funcionando.
- [x] Rodar lint, testes e build já existentes, registrando resultados e limitações.

## 9. Critérios de aceite

- [ ] Os cinco PNGs fornecidos estão corretamente nomeados, mapeados, renderizados e com fundo transparente nas áreas definidas, mantendo qualidade visual em diferentes tamanhos.
- [ ] As expressões refletem corretamente os estados de foco, pausa, conclusão, rádio e padrão.
- [x] Foco e pausa têm prioridade sobre rádio; a comemoração é temporária.
- [ ] As animações são suaves, não atrapalham a interface e respeitam `prefers-reduced-motion`.
- [x] A solução é reutilizável e evita duplicação desnecessária de lógica e de assets.
- [ ] Não houve regressão perceptível nas funcionalidades existentes.
- [x] Não foi implementado nenhum sistema de cosméticos ou personalização.
- [x] Os testes/build pertinentes passam, ou suas falhas são documentadas com precisão.

## 10. Instrução direta para o Codex

> Leia esta especificação e analise o repositório do Capifocus **antes de escrever código**. Confirme a stack real, identifique os pontos onde o mascote aparece e como os estados de Pomodoro e rádio são representados. Proponha uma implementação mínima do novo mascote 2.0 com expressões contextuais, animações discretas e componente reutilizável, respeitando as convenções do projeto. Não implemente cosméticos, inventário nem infraestrutura especulativa. **Utilize os cinco PNGs individuais descritos na seção 3.1**, verificando se estão presentes e mapeando-os para os nomes de produção. Não recorte a prancha de conceito nem redesenhe os personagens. Se algum asset faltar no repositório, explique qual e avance apenas nas partes técnicas independentes dele. Preserve o comportamento existente e execute as verificações disponíveis.


## 11. Checklist rápido para começar com os PNGs

- [x] Adicionar os cinco arquivos individuais ao repositório (não apenas a prancha visual).
- [x] Padronizar os nomes `capy-default.png`, `capy-focus.png`, `capy-break.png`, `capy-completed.png` e `capy-radio.png`.
- [x] Conferir como a aplicação resolve o caminho-base de assets no deploy em `/capifocus/` (teste HTTP local com esse prefixo; publicação real ainda pendente).
- [x] Implementar o componente e integrar ao estado existente sem alterar a lógica do timer/rádio.
- [x] Obter aprovação da aparência no celular pelo usuário.
- [ ] Revisar todos os estados no desktop e conferir escala/alinhamento entre as poses.
- [ ] Aprovar a substituição do mascote atual após os testes visuais e funcionais.

## 12. Registro da implementação — 09/10/2026

### Concluído

- [x] Adicionar suíte de regressão executável com `node tests/run.cjs`: quatro arquivos de testes aprovados, incluindo cinco cenários do app inteiro para timer, tarefas, rádio, persistência e ajustes. Cobertura e limites documentados em `tests/README.md`; DOM e áudio real não são validados por essa suíte.

- [x] Separar HTML (`index.html`), estilos do app (`css/app.css`) e lógica (`js/app.js`).
- [x] Criar componente em `js/components/mascot.js`, estilos em `css/mascot.css` e mapa centralizado dos cinco PNGs de `assets/mascot/`.
- [x] Implementar tamanhos `sm`, `md` e `lg`, opção `animated`, classe adicional e botão acessível por clique, Enter ou Espaço.
- [x] Preservar o SVG antigo como fallback e manter área com proporção fixa.
- [x] Carregar e decodificar poses antecipadamente; conservar a pose anterior enquanto a próxima carrega.
- [x] Adicionar entrada suave, transição de opacidade, respiração lenta, balanço da rádio, pulo com aterrissagem e reação ao clique.
- [x] Respeitar movimento reduzido nos efeitos CSS, entrada e reação ao clique.
- [x] Comemorar por 1,9 segundo na conclusão natural de sessão e ao concluir tarefa; não comemorar ao pular etapa.
- [x] Resolver timer pausado/reiniciado como `radio` se a música continuar tocando, ou `default` caso contrário.
- [x] Aprovar sintaxe dos scripts com `node --check` e testes em `node tests/mascot.test.cjs`: prioridades, carregamento, expiração, interação, movimento reduzido e caminhos.
- [x] Verificar CRC, dimensões 1254 × 1254, RGBA e pixels transparentes/opacos nos cinco PNGs.
- [x] Corrigir a integração ausente em `render()`: repassar `mode`, `running` e `playing` para `mascot.update()`.
- [x] Atualizar mensagens de foco/pausa para corresponder às novas poses.
- [x] Executar `node tests/timer-mascot.test.cjs` usando funções reais do timer, DOM simulado e relógio controlado: início, pausa, rádio, duas pausas, salto e conclusão natural aprovados.
- [x] Executar `node tests/static-paths.test.cjs`: HTTP local sob `/capifocus/`, scripts, estilos e cinco PNGs aprovados.
- [x] Registrar aprovação visual do usuário no celular: “No celular ficou bom”. Essa confirmação se refere à aparência; não comprova testes de todos os estados e fluxos.

### Pendências e limites

- [ ] Revisar enquadramento, alinhamento dos pés, contraste, escala e suavidade nos fundos reais do app.
- [ ] Validar desktop e concluir testes de toque, teclado e movimento reduzido no celular; a aparência no celular já foi aprovada.
- [ ] Testar fluxos completos de Pomodoro, tarefas e rádio no navegador e confirmar ausência de regressões.
- [ ] Validar publicação real sob `/capifocus/`; caminhos relativos já passaram no teste HTTP local com esse prefixo.
- [x] Obter aceite visual do usuário para a aparência no celular.
- [ ] Obter aceite final após revisão de desktop e testes funcionais; o SVG anterior permanece como fallback.

Na sessão de validação automatizada, a ferramenta de navegação retornou `apps: []` e `browsers: []`. Posteriormente, o usuário aprovou a aparência no celular. A revisão de desktop e os fluxos completos no navegador continuam pendentes. Testes com DOM simulado não validam layout, áudio real ou interação em celular. Não há lint ou build configurados. Os assets continuam PNG: não houve conversão para SVG, novos desenhos nem animação independente de olhos ou membros. Os critérios dependentes dessas verificações permanecem desmarcados.
