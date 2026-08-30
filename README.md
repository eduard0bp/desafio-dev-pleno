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

- **Idempotência:** deduplicação pela constraint `UNIQUE(company_id,
  external_id)` no Postgres, checada no `INSERT` em vez de um `SELECT`
  prévio — resolve corretamente mesmo sob `POST`s concorrentes reais
  (testado com `Promise.all`). Duas empresas podem usar o mesmo
  `external_id` sem colidir. `Idempotency-Key` é aceito mas ignorado: a
  constraint já cobre a garantia sozinha. Um `POST` repetido retorna a
  review existente em vez de criar outra.
- **Fila e retries:** BullMQ + Redis, worker em processo separado.
  Backoff exponencial com teto de 30s, respeitando um `Retry-After` maior
  do serviço externo até um teto próprio de 60s (`computeBackoffDelayMs`
  em `backend/src/lib/retry.ts`). Até `REVIEW_MAX_ATTEMPTS` tentativas
  (padrão 5) antes de marcar `failed` — coberto por testes de ponta a
  ponta reais (worker + fila + API fake) que forçam esgotamento e
  recuperação via retry, não só o caminho de sucesso.
- **Atualização de status na UI:** polling a cada 3s enquanto há
  `pending`/`processing`, caindo para 15s quando ocioso em vez de parar —
  reviews criadas fora do fluxo da própria aba (outro cliente batendo em
  `POST /reviews`) ainda precisam ser descobertas. SSE/WebSocket ficou de
  fora por tempo — ver limitações.
- **Filtros, paginação e busca:** `GET /reviews` aceita `page`,
  `pageSize`, `status`, `minRating`, `search`, `dateFrom`, `dateTo` e
  responde `{ data, pagination, counts }`; `counts` ignora o próprio
  filtro de `status` para os chips continuarem com a contagem correta de
  cada estado mesmo com um deles selecionado.
- **Testes de integração:** rodam contra Postgres/Redis reais, sem
  paralelismo entre arquivos (`fileParallelism: false`) para não haver
  disputa por dados, e num banco Redis lógico dedicado (`/1`) para não
  competir por jobs com o worker do `docker compose` caso a stack esteja
  no ar ao mesmo tempo. Detalhado em [`backend/README.md`](backend/README.md).
- **Confiabilidade operacional:** `/health` testa Postgres e Redis de
  verdade (exposto pela API e pelo worker, cada um com sua porta), e o
  `request_id` de cada requisição é propagado até os logs do worker —
  dá pra seguir uma review do `POST` até o processamento assíncrono.
- **Reconciliação:** sem garantia transacional entre persistir a review e
  publicar o job, um job a cada 60s reenfileira reviews `pending` sem job
  correspondente há mais de 2 minutos — cobre o caso de crash entre os
  dois passos. Ver limitações para o que ainda não fecha.
- **Sino de notificações e reprocessamento manual:** a UI faz polling de
  reviews negativas não lidas e marca como lida ao abrir uma; reviews
  `failed` podem ser reenviadas para a fila por um botão de retry, sem
  esperar a reconciliação.
- **Testes e2e (Playwright, Page Object Model):** cada página/componente
  tem seu objeto em `frontend/e2e/pages/`/`frontend/e2e/components/`; a
  suíte nunca toca o Postgres diretamente — todo dado de teste é criado
  pelo fluxo real de UI.
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
