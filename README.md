# Falaê! — implementação entregue

Este documento cobre a implementação real deste repositório: como rodar,
decisões técnicas e limitações conhecidas. O enunciado original do desafio
está em [`INSTRUCTIONS.md`](INSTRUCTIONS.md), sem alterações.

## Como rodar

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3000
- API fake de análise: http://localhost:4000

> Todas as variáveis em `compose.yaml` têm um valor padrão, então
> `docker compose up --build` funciona mesmo sem copiar `.env` primeiro —
> o `cp .env.example .env` só é necessário se você quiser customizar algo
> (portas, `FAIL_EVERY_N`, etc.).

Depois que os containers subirem, abra o frontend: a sidebar tem duas
seções — "Área do cliente", com "Enviar Avaliação" (`/avaliar`, cadastro),
e "Painel interno", com "Monitoramento" (`/admin/avaliacoes`, lista, tela
inicial). Cadastre uma avaliação e acompanhe o status mudar de `pending` →
`processing` → `completed`/`failed` na lista (a tela consulta a API por
polling a cada 3 segundos), com filtros por status/nota/período e busca
por empresa. Não há autenticação nem controle de acesso real entre as
duas áreas — a separação é só de navegação, como o desafio permite.

Para desenvolvimento local sem Docker (backend e frontend rodando fora de
container, mas dependendo de Postgres/Redis/mock-api), veja
[`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md).

### Popular o banco com dados de teste

Com a stack no ar, `scripts/seed-reviews.sh` cria um lote de avaliações via
`POST /reviews` — a maioria segue o fluxo normal (sujeita às falhas
periódicas naturais da API fake, que o worker tenta recuperar sozinho), e
algumas são forçadas a falhar permanentemente (`x-mock-scenario:
server-error`, esgotando as 5 tentativas), úteis para testar o botão de
reprocessar, o alerta de avaliação negativa e os estados de erro na UI.

```bash
./scripts/seed-reviews.sh
# ou, para customizar:
COUNT=50 FAIL_COUNT=5 API_URL=http://localhost:3000 ./scripts/seed-reviews.sh
```

## Decisões técnicas

- **Idempotência:** a chave única de deduplicação no banco é o par
  `(company_id, external_id)` (constraint `UNIQUE` composta no Postgres via
  Prisma), não `external_id` isolado — duas empresas diferentes podem usar
  o mesmo esquema de identificador de pedido sem colidir. A checagem é
  feita no nível do banco (tenta o `INSERT`, trata a violação de
  unicidade), não com um `SELECT` prévio na aplicação, então dois `POST`s
  concorrentes com o mesmo par são resolvidos de forma correta mesmo sob
  concorrência real (coberto por teste com `Promise.all`, não só POSTs
  sequenciais). O header `Idempotency-Key` é aceito mas ignorado: validar
  igualdade com `external_id` não acrescentaria proteção nenhuma além da
  que a constraint do banco já garante sozinha. Um `POST` repetido com o
  mesmo par retorna a review já existente em vez de criar uma nova.
- **Fila:** BullMQ + Redis. O worker roda em um processo separado
  (`npm run dev:worker` / `start:worker`, e um serviço próprio no
  Docker Compose) e consome os jobs publicados pela API. Backoff
  exponencial com teto de 30s, exceto quando o `Retry-After` do serviço
  externo pede um valor maior — nesse caso, respeitamos o valor externo, com
  um teto próprio de 60s para não deixar uma resposta externa
  mal-comportada travar a próxima tentativa por tempo arbitrário
  (`computeBackoffDelayMs` em `backend/src/lib/retry.ts`). Até
  `REVIEW_MAX_ATTEMPTS` tentativas (padrão 5, validado em
  `backend/src/config.ts` como as demais variáveis de ambiente) antes de
  marcar a review como `failed` — coberto por um teste de ponta a ponta
  real (worker + fila + API fake) que força o esgotamento das tentativas, e
  por outro que força uma falha real seguida de recuperação real via
  retry, não só o caminho de sucesso ou a lógica isolada.
- **Atualização de status na UI:** polling (TanStack Query) a cada 3
  segundos enquanto houver avaliações `pending`/`processing`, tanto na
  lista quanto no painel de detalhe. Sem nenhuma em andamento, a lista
  recua para um polling de 15 segundos em vez de parar por completo —
  reviews criadas fora do fluxo da própria UI (ex.: `POST /reviews` vindo
  de outro cliente) ainda precisam ser descobertas de algum jeito, já que
  não há invalidação de cache para algo que a aba não sabe que existe;
  SSE/WebSocket ficou de fora por tempo — ver limitações abaixo.
- **Navegação por rotas:** `react-router` separa o cadastro (`/avaliar`) do
  monitoramento (`/admin/avaliacoes`, padrão; `/` redireciona para lá), com
  a sidebar dirigindo a navegação real (inclusive com fallback SPA no
  `serve` do container do frontend, para acessar qualquer rota direto pela
  URL funcionar).
- **Filtros e paginação no back-end:** `GET /reviews` aceita `page`,
  `pageSize`, `status`, `minRating`, `search`, `dateFrom` e `dateTo` como
  query params e responde `{ data, pagination, counts }` — `counts` reflete
  os demais filtros aplicados, mas ignora o próprio `status`, para que os
  chips de status continuem mostrando a contagem correta de cada estado
  mesmo com um deles selecionado. Decisão: aproximar o comportamento de uma
  aplicação real (lista grande, filtro que não depende de carregar tudo no
  cliente) em vez de filtrar em memória no frontend.
- **Layout responsivo:** `AppShell` do Mantine com sidebar colapsável em
  menu hambúrguer abaixo do breakpoint `sm`, tabela com scroll horizontal
  em telas estreitas e filtros que empilham em vez de espremer.
- **Versão do Prisma mantida na major 6:** `@prisma/client`/`prisma` foram
  fixados em `^6.19.3` em vez de "latest" — decisão deliberada para evitar
  as mudanças de breaking change do Prisma 7+/8+ no meio do desafio.
  Detalhado também em [`backend/README.md`](backend/README.md).
- **Testes de integração sequenciais:** os testes de integração do backend
  compartilham um único Postgres real, então rodam sem paralelismo de
  arquivo (`fileParallelism: false` no `vitest.config.ts`) para evitar que
  a limpeza de um arquivo apague dados que outro arquivo está usando.
  Detalhado em [`backend/README.md`](backend/README.md).
- **Fila isolada nos testes de integração:** a suíte enfileira jobs reais
  na fila real (`review-processing`) para exercitar o worker de verdade,
  mas conecta num banco Redis lógico dedicado (`/1`, via
  `test/integration/setup.ts`) em vez do banco padrão (`/0`) usado pelo
  worker do `docker compose`. Assim os testes continuam confiáveis mesmo
  rodando com a stack completa no ar, sem o worker do container disputar
  os mesmos jobs com o worker do teste.
- **`/health` verifica dependências reais:** o endpoint testa `SELECT 1`
  no Postgres e `PING` no Redis (`backend/src/lib/health.ts`) em vez de
  responder `{status:"ok"}` de forma estática — retorna `503` e
  `status:"degraded"` se qualquer um dos dois estiver fora do ar. Tanto a
  API quanto o worker expõem esse endpoint (o worker numa porta HTTP
  própria, `WORKER_PORT`, sem depender do Express), e é isso que os
  `healthcheck` de ambos os serviços no `compose.yaml` usam — refletindo o
  estado real das dependências dos dois processos, não só da API.
- **Configuração centralizada e validada:** variáveis de ambiente são lidas
  uma única vez, na subida do processo, e validadas com Zod
  (`backend/src/config.ts`) — em vez de `process.env.X` espalhado pelas
  rotas/worker. Um valor inválido ou ausente falha rápido, na subida, em
  vez de gerar um erro obscuro no meio de uma requisição.
- **Erros HTTP tipados:** as rotas lançam `ValidationError`,
  `NotFoundError` e `ConflictError` (`backend/src/errors.ts`), capturados
  de forma centralizada pelo middleware de erro do Express — em vez de
  cada rota montar sua própria resposta de erro manualmente. O formato da
  resposta JSON (`{error, message}` com o status correspondente) não
  mudou, só a forma como é produzido.
- **Correlação de logs entre API e worker:** o `request_id` gerado pelo
  middleware de log da API é propagado no payload do job da fila
  (`ReviewJobData.requestId`) e aparece nos logs do worker — dá pra seguir
  uma review específica do `POST /reviews` até o processamento assíncrono
  olhando um único identificador nos dois processos.
- **Desligamento gracioso (`SIGTERM`):** tanto a API quanto o worker
  tratam `SIGTERM` — a API para de aceitar novas conexões e espera as em
  andamento terminarem (`server.close()`); o worker fecha a conexão com a
  fila, limpa o intervalo de reconciliação e fecha seu servidor de health
  antes de sair. Evita interromper uma requisição ou um job no meio da
  execução durante um deploy/restart.
- **Organização por camada no backend:** `lib/` para infraestrutura
  (Prisma, Redis, health, retry), `jobs/` para processos de background
  (reconciliação), `services/` para lógica de domínio (reviews, alertas),
  `mappers/` para tradução entre modelo do banco e resposta da API. Os
  testes unitários ficam ao lado do arquivo que testam
  (`src/**/*.test.ts`), no mesmo padrão do frontend, em vez de uma árvore
  `test/unit/` espelhada — só os testes de integração (que dependem de
  Postgres/Redis reais) ficam em `test/integration/`.
- **Sino de notificações:** a UI faz polling de reviews com sentimento
  negativo e ainda não lidas (`is_read` no banco); o sino mostra a
  contagem e, ao abrir um item, marca a review como lida
  (`POST /reviews/:id/read`) para que ela saia da lista — sem exigir
  SSE/WebSocket, já que o polling existente já traz a informação
  necessária.
- **Reprocessamento manual:** reviews `failed` podem ser reenviadas para a
  fila por um botão de retry na lista (endpoint dedicado no backend), sem
  esperar o job de reconciliação — útil quando o usuário já sabe que a
  causa da falha foi resolvida (ex.: instabilidade temporária da API
  externa).
- **Filtro por sentimento/nota mínima e ação por status:** a coluna Ações
  mostra um botão de "ver detalhes" (ícone de olho) só para reviews
  `completed`, e o botão de retry só para `failed` — nunca os dois ao
  mesmo tempo, já que cada review só está em um dos dois estados
  terminais.
- **pt-BR nos componentes de data:** o `DatesProvider` do Mantine é
  configurado com o locale `dayjs` `pt-br`, então o calendário de filtro
  por período usa nomes de mês/dia em português em vez do padrão em
  inglês da biblioteca.
- **Testes e2e seguindo Page Object Model, sem tocar no banco:** cada
  página/componente da UI tem seu próprio objeto Playwright em
  `frontend/e2e/pages/`/`frontend/e2e/components/` (rotas, seletores,
  ações), com os specs organizados por página em vez de por
  funcionalidade. A suíte nunca acessa o Postgres diretamente — todo dado
  de teste é criado através do fluxo real de UI (`POST /reviews` via
  formulário), e nada é limpo ao final; ela tolera tanto "Concluído"
  quanto "Falhou" como status terminal válido para os casos que dependem
  do resultado da API fake de análise, cujas falhas periódicas
  (`FAIL_EVERY_N`) são propositais.
- **Uso de IA:** o Claude Code (Anthropic) foi usado do início ao fim deste
  desafio — para discutir a arquitetura, escrever a spec técnica, planejar
  as tasks, gerar a base de código (rotas, worker, fila, testes unitários,
  de integração e e2e, frontend) e escrever esta documentação. Todo o
  código gerado foi lido, revisado e ajustado manualmente antes de cada
  commit; nenhuma parte foi aceita sem revisão.

## Limitações conhecidas / próximos passos

- Não há garantia transacional entre gravar a review no Postgres e
  publicar o job no Redis — se o processo cair entre os dois passos, a
  review ficaria presa em `pending`. Mitigado por um job de reconciliação
  (`reconcileStuckReviews`/`startReconciliationLoop` em
  `backend/src/jobs/reconciliationService.ts`) que roda a cada 60s no
  processo do worker, varre reviews `pending` há mais de 2 minutos sem job
  correspondente na fila e as reenfileira. Não é uma garantia
  transacional de verdade (isso exigiria um outbox pattern), mas cobre o
  caso real de crash entre os dois passos sem a complexidade de uma
  tabela de outbox.
- **Efeito duplicado em job "stalled" — parcialmente coberto.**
  `processReviewJob` ignora um job reentregue para uma review que já
  está `completed`/`failed` (guarda contra o BullMQ redespachar um job cujo
  efeito colateral — chamada externa, gravação no banco, alerta de review
  negativa — já aconteceu de verdade). Isso **não** fecha a janela mais
  estreita em que o processo cai exatamente entre a análise externa
  retornar sucesso e essa gravação persistir: nesse instante a review ainda
  está `processing` sem análise salva, indistinguível de uma review que
  nunca foi processada, então uma reentrega nesse ponto específico ainda
  chama a API externa de novo e pode disparar o alerta de negativa outra
  vez. Fechar esse caso por completo exigiria persistir um marcador antes
  da chamada externa (ex.: um `analysis_started_at`), não implementado.
- Sem SSE/WebSocket — a atualização de status na tela depende de polling.
- `VITE_API_URL` é definida em build time da imagem Docker do frontend
  (`http://localhost:3000`, veja `compose.yaml`), não em runtime. Isso
  funciona bem para rodar tudo localmente, mas significa que a UI só fala
  corretamente com a API quando acessada via `localhost` na mesma máquina
  que fez o build da imagem — acessar o frontend a partir de outro host/IP
  exigiria rebuildar a imagem com um `VITE_API_URL` diferente (ou passar a
  injetar a URL em runtime, ex. via um `env.js` gerado na inicialização do
  container).

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/reviews` | Cria uma review e enfileira o job de análise. Deduplicação é por `(company_id, external_id)`; o header `Idempotency-Key` é aceito mas ignorado. |
| `GET` | `/reviews` | Lista reviews com paginação e filtros (`page`, `pageSize`, `status`, `minRating`, `search`, `dateFrom`, `dateTo`). Responde `{ data, pagination, counts }`. |
| `GET` | `/reviews/:id` | Detalhe de uma review. |
| `POST` | `/reviews/:id/retry` | Reenfileira uma review `failed` para reprocessamento manual. |
| `POST` | `/reviews/:id/read` | Marca uma review como lida (usado pelo sino de notificações). |
| `GET` | `/health` | Checagem de saúde (Postgres + Redis). Exposto tanto pela API quanto pelo worker (`WORKER_PORT`). |

## Scripts disponíveis

Veja [`backend/README.md`](backend/README.md) e
[`frontend/README.md`](frontend/README.md) para a lista completa de
scripts de cada pacote (dev, build, testes unitários/integração/e2e).
Alguns dos mais usados:

```bash
# backend/
npm run dev            # API em modo watch
npm run dev:worker      # worker em modo watch
npm run test            # testes unitários
npm run test:integration # testes de integração (requer Postgres/Redis)

# frontend/
npm run dev             # Vite dev server
npm run test             # testes unitários (Vitest)
npm run test:e2e         # testes e2e (Playwright, requer stack no ar)
npm run test:e2e:ui      # testes e2e com a UI do Playwright
```
