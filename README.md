# Falaê! | Desafio técnico — Full Stack Pleno

> Feedback bom vira ação. Este desafio é sobre garantir que ele chegue lá —
> mesmo quando alguma coisa falha pelo caminho.

## Falaê! Que bom ter você por aqui 👋

No Falaê, feedback não é só dado: é o ponto de partida para melhorar a
experiência do cliente. Neste desafio, você vai construir uma pequena aplicação
full stack que percorre esse caminho — da tela em que a avaliação chega até o
resultado da análise, sem perder dados nem travar a operação.

O recorte é proposital. Não esperamos um sistema completo nem uma arquitetura
cheia de camadas só para impressionar. Queremos entender como você organiza uma
solução enxuta, reage quando o caminho feliz deixa de ser feliz e explica as
decisões que tomou.

## Seu desafio

Construa uma aplicação full stack que:

1. permita cadastrar avaliações por uma interface web;
2. persista cada avaliação;
3. agende seu processamento assíncrono;
4. consulte a API fake de análise deste repositório;
5. armazene o resultado da análise;
6. exiba na interface o status e o resultado de cada avaliação.

## O caminho da avaliação

```text
Pessoa
  │
  ▼
Frontend
  │
  ├── POST /reviews ───────▶ API
  │                            ├── persiste a avaliação
  │                            ├── responde sem aguardar a análise
  │                            └── agenda o processamento
  │                                       │
  │                                       ▼
  │                                    Worker
  │                                       ├── chama POST /v1/analyze
  │                                       ├── trata erros temporários
  │                                       └── salva o resultado
  │
  └── GET /reviews ◀─────── status e análise atualizados
```

O ponto mais importante desse fluxo: a API deve continuar recebendo avaliações
mesmo quando o serviço externo estiver lento ou indisponível. Enquanto isso, a
tela precisa comunicar com clareza o que está pendente, o que deu certo e o que
falhou. A voz do cliente não pode ficar esperando outra API voltar.

## O contrato que esperamos

Os nomes exatos dos campos e status podem mudar, desde que o contrato continue
coerente, previsível e bem documentado.

### Receber uma avaliação

```http
POST /reviews
Content-Type: application/json
Idempotency-Key: review-order-123
```

```json
{
  "external_id": "review-order-123",
  "company_id": "company-456",
  "rating": 2,
  "comment": "O pedido demorou muito e chegou frio."
}
```

Como a análise acontece depois, esperamos uma resposta assíncrona:

```http
HTTP/1.1 202 Accepted
```

```json
{
  "id": "identificador-interno",
  "external_id": "review-order-123",
  "status": "pending"
}
```

O mesmo feedback pode chegar mais de uma vez. Sua solução deve reconhecer essa
duplicidade e evitar tanto novos registros quanto processamentos indevidos.

### Listar as avaliações

```http
GET /reviews
```

Retorne os dados necessários para montar a visão principal. O formato pode ser
ajustado, mas deve permitir identificar cada avaliação e entender seu estado:

```json
{
  "data": [
    {
      "id": "identificador-interno",
      "external_id": "review-order-123",
      "rating": 2,
      "status": "processing",
      "created_at": "2026-08-21T12:00:00.000Z"
    }
  ]
}
```

### Acompanhar uma avaliação

```http
GET /reviews/:id
```

Depois do processamento, a resposta pode seguir este formato:

```json
{
  "id": "identificador-interno",
  "external_id": "review-order-123",
  "company_id": "company-456",
  "rating": 2,
  "comment": "O pedido demorou muito e chegou frio.",
  "status": "completed",
  "analysis": {
    "sentiment": "negative",
    "category": "delivery",
    "confidence": 0.91
  },
  "attempts": 2,
  "created_at": "2026-08-21T12:00:00.000Z",
  "processed_at": "2026-08-21T12:00:04.000Z"
}
```

### Colocar o fluxo na tela

A interface é parte obrigatória da entrega. Não precisa ser um dashboard
completo: uma única página bem resolvida já é suficiente. Ela deve permitir:

- cadastrar uma avaliação com os campos do contrato;
- visualizar as avaliações já criadas;
- diferenciar estados como pendente, processando, concluído e falha;
- consultar o resultado da análise quando ele estiver disponível;
- perceber estados de carregamento, lista vazia e erro de comunicação.

A atualização do status pode ser manual ou automática, desde que a experiência
seja coerente e a decisão esteja documentada. Não buscamos uma interface
pixel-perfect; queremos ver frontend e backend funcionando juntos de verdade,
sem dados fixos para simular a integração.

## O que não pode faltar

- TypeScript no frontend e no backend;
- interface web integrada à API;
- API HTTP;
- banco de dados relacional;
- processamento assíncrono;
- execução completa de frontend, API, worker, banco e mock com Docker Compose;
- proteção contra duplicidade;
- tratamento de timeout, `429` e erros temporários `5xx`;
- política de retry limitada;
- status de processamento persistido;
- testes automatizados dos fluxos mais importantes;
- README com instruções de execução e decisões técnicas.

React, Vue, Svelte ou outra solução no frontend; Express, Fastify, NestJS,
BullMQ, RabbitMQ ou outro caminho no backend: a escolha é sua. O que queremos
ver é uma solução consistente com o problema e uma explicação clara dos
trade-offs.

## Extras que somam

Se o essencial estiver bem resolvido e ainda fizer sentido para o seu recorte,
você pode incluir:

- backoff exponencial;
- fila de mensagens mortas ou tratamento equivalente;
- endpoint para reprocessamento;
- criação de alerta para avaliações negativas;
- atualização de status em tempo real com SSE ou WebSocket;
- filtros ou busca na lista de avaliações;
- métricas ou logs estruturados;
- healthchecks separados para API, banco e worker;
- mecanismo para lidar com a falha entre persistir a avaliação e publicar o job;
- testes de integração com banco e fila reais.

Extras são realmente extras. Uma base confiável vale mais do que várias
funcionalidades pela metade.

## A API fake de análise

Este repositório já traz uma API externa simulada em TypeScript. Ela não chama
nenhum serviço real; seu papel é reproduzir o tipo de instabilidade que uma
integração de verdade pode apresentar.

### Coloque o ambiente de pé

```bash
cp .env.example .env
docker compose up --build
```

Confira se a API está saudável:

```bash
curl http://localhost:4000/health
```

### Envie uma avaliação para análise

```bash
curl --request POST 'http://localhost:4000/v1/analyze' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "review_id": "review-order-123",
    "company_id": "company-456",
    "rating": 2,
    "text": "O pedido demorou muito e chegou frio."
  }'
```

Se sua aplicação estiver no mesmo Docker Compose, use o endereço interno:

```text
http://mock-analysis-api:4000/v1/analyze
```

### Quando tudo dá certo

```json
{
  "request_id": "8a7c00f3-7a06-4809-b6fa-faf1267f7230",
  "review_id": "review-order-123",
  "analysis": {
    "sentiment": "negative",
    "category": "delivery",
    "confidence": 0.91,
    "matched_keywords": ["demorou", "frio"]
  },
  "processing_time_ms": 718,
  "processed_at": "2026-08-21T12:00:00.000Z"
}
```

### Quando o caminho feliz deixa de ser feliz

Sem headers especiais, a API fake aplica atrasos, rate limit e falhas periódicas
de acordo com o `.env`. Isso é intencional: sua aplicação precisa estar pronta
para uma dependência que nem sempre coopera.

Quando precisar de um cenário previsível nos testes, envie
`x-mock-scenario`:

| Valor | O que acontece |
|---|---|
| `success` | a análise termina com sucesso |
| `slow` | a análise termina com sucesso, mas demora mais |
| `server-error` | a API retorna `503` com `Retry-After` |
| `rate-limit` | a API retorna `429` com `Retry-After` |

O header `x-client-id` permite isolar o rate limit entre clientes de teste.
Outros exemplos prontos para uso estão em
[`examples/requests.http`](examples/requests.http).

## Alguns combinados

- IA, documentação e mecanismos de busca estão liberados. Conte brevemente no
  seu README como essas ferramentas participaram do trabalho.
- Não altere o comportamento da API fake para contornar as falhas. Elas fazem
  parte do desafio.
- O frontend faz parte do desafio, mas pode ser uma tela única. Não é necessário
  criar autenticação, um design system completo ou infraestrutura em nuvem.
- Não existe uma única biblioteca, arquitetura ou resposta considerada correta.

## Cuide do seu tempo

Este desafio foi pensado para cerca de **4 horas de dedicação**, com limite
recomendado de **6 horas**. Se alguma coisa ficar de fora, tudo bem — registre:

- o que ficou pendente;
- por que você priorizou dessa forma;
- como concluiria essa parte em um cenário real.

Saber recortar, priorizar e comunicar também faz parte do trabalho de engenharia.

## Antes de compartilhar

Envie um repositório Git com:

- código-fonte do frontend e do backend;
- migrations ou outra estrutura necessária para o banco;
- Docker Compose;
- testes;
- README com comandos, URL da interface, decisões, limitações e próximos passos.

Quando o projeto estiver pronto, envie o link do repositório pelo
[formulário de entrega](https://forms.gle/E1QYX6gk9ZLTbej29).

Queremos conseguir iniciar o projeto, de preferência, com um único comando:

```bash
docker compose up --build
```

Depois que os containers subirem, deve estar claro em qual endereço local
podemos abrir a tela e percorrer o fluxo completo.

## O que vamos observar

- clareza da arquitetura;
- confiabilidade do processamento;
- integração entre frontend e backend;
- clareza dos estados e da experiência na interface;
- qualidade e legibilidade do código;
- estratégia contra duplicidade;
- tratamento de falhas e retries;
- qualidade dos testes;
- facilidade para executar o projeto;
- capacidade de explicar decisões e trade-offs.

---

# Falaê! — implementação entregue

O que segue documenta a implementação real: como rodar, decisões técnicas e
limitações conhecidas.

## Como rodar

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3000
- API fake de análise: http://localhost:4000

Depois que os containers subirem, abra o frontend: a sidebar leva a "Nova
Avaliação" (cadastro) e "Avaliações" (lista/monitoramento, tela inicial).
Cadastre uma avaliação e acompanhe o status mudar de `pending` →
`processing` → `completed`/`failed` na lista (a tela consulta a API por
polling a cada 3 segundos), com filtros por status/nota/período e busca
por empresa.

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
- **Navegação por rotas:** `react-router` separa o cadastro (`/nova-avaliacao`)
  do monitoramento (`/`, padrão), com a sidebar dirigindo a navegação real
  (inclusive com fallback SPA no `serve` do container do frontend, para
  acessar `/nova-avaliacao` direto pela URL funcionar). Filtros (status,
  nota mínima, período), busca por empresa e paginação da lista de
  avaliações são resolvidos inteiramente client-side, sem mudar o contrato
  de `GET /reviews` além de incluir `analysis` na listagem.
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
  publicar o job no Redis (se o processo cair entre os dois passos, a
  review fica presa em `pending`). Próximo passo: outbox pattern ou um job
  de reconciliação que varre reviews `pending` antigas e republica o job.
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

