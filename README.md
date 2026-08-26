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

## Decisões técnicas

- **Idempotência:** `external_id` é a chave única de deduplicação no banco
  (constraint `UNIQUE` no Postgres via Prisma). Se o header `Idempotency-Key`
  for enviado, ele precisa ser igual ao `external_id` do corpo — do
  contrário a API responde `400`. Um `POST` repetido com o mesmo
  `external_id` retorna a review já existente em vez de criar uma nova.
- **Fila:** BullMQ + Redis. O worker roda em um processo separado
  (`npm run dev:worker` / `start:worker`, e um serviço próprio no
  Docker Compose) e consome os jobs publicados pela API. Backoff
  exponencial com teto de 30s, exceto quando o `Retry-After` do serviço
  externo pede um valor maior — nesse caso, respeitamos o valor externo
  (`computeBackoffDelayMs` em `backend/src/lib/retry.ts`), com até 5
  tentativas antes de marcar a review como `failed`.
- **Atualização de status na UI:** polling (TanStack Query) a cada 3
  segundos enquanto houver avaliações `pending`/`processing`, tanto na
  lista quanto no painel de detalhe; SSE/WebSocket ficou de fora por tempo
  — ver limitações abaixo.
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
- **`/health` verifica dependências reais:** o endpoint testa `SELECT 1`
  no Postgres e `PING` no Redis (`backend/src/services/healthService.ts`)
  em vez de responder `{status:"ok"}` de forma estática — retorna `503` e
  `status:"degraded"` se qualquer um dos dois estiver fora do ar. É esse
  mesmo endpoint que o `healthcheck` do `backend-api` no `compose.yaml`
  usa, então agora ele reflete o estado real das dependências.
- **Teste e2e tolera falha simulada:** o teste Playwright aceita tanto
  "Concluído" quanto "Falhou" como status terminal válido, porque a API
  fake de análise tem falhas periódicas propositais (`FAIL_EVERY_N`) que
  persistem mesmo com a política de retry — não é um bug do teste, é o
  comportamento esperado de uma dependência que às vezes falha de verdade.
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
  `backend/src/services/reconciliationService.ts`) que roda a cada 60s no
  processo do worker, varre reviews `pending` há mais de 2 minutos sem job
  correspondente na fila e as reenfileira. Não é uma garantia
  transacional de verdade (isso exigiria um outbox pattern), mas cobre o
  caso real de crash entre os dois passos sem a complexidade de uma
  tabela de outbox.
- Sem SSE/WebSocket — a atualização de status na tela depende de polling.
- Sem alertas para avaliações negativas.
- Sem endpoint de reprocessamento manual para reviews `failed`.
- `VITE_API_URL` é definida em build time da imagem Docker do frontend
  (`http://localhost:3000`, veja `compose.yaml`), não em runtime. Isso
  funciona bem para rodar tudo localmente, mas significa que a UI só fala
  corretamente com a API quando acessada via `localhost` na mesma máquina
  que fez o build da imagem — acessar o frontend a partir de outro host/IP
  exigiria rebuildar a imagem com um `VITE_API_URL` diferente (ou passar a
  injetar a URL em runtime, ex. via um `env.js` gerado na inicialização do
  container).
- Backend e worker não implementam desligamento gracioso (não há handler de
  `SIGTERM`): em produção isso pode interromper uma requisição ou um job em
  andamento no meio da execução durante um deploy/restart.
