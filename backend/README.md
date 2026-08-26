# Falaê! — backend

API Express + worker BullMQ, escritos em TypeScript, com Prisma sobre
Postgres para persistência e Redis para a fila de processamento assíncrono.

Este README cobre desenvolvimento local (rodando os processos fora do
Docker). Para subir tudo (Postgres, Redis, API, worker, mock-api e
frontend) com um único comando, veja o [`README.md` da raiz](../README.md).

## Requisitos

- Node.js 20+
- Um Postgres e um Redis acessíveis (o jeito mais simples é rodar
  `docker compose up postgres redis mock-analysis-api` a partir da raiz do
  repositório e apontar as variáveis de ambiente abaixo para eles).

## Configuração

Copie o `.env.example` e ajuste se necessário:

```bash
cp .env.example .env
```

Variáveis esperadas:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | connection string do Postgres usada pelo Prisma |
| `PORT` | porta em que a API HTTP escuta (padrão `3000`) |
| `REDIS_URL` | connection string do Redis usada pela fila BullMQ |
| `MOCK_ANALYSIS_API_URL` | URL base da API fake de análise |

Antes do primeiro `dev`, aplique as migrations do Prisma:

```bash
npx prisma migrate deploy
# ou, em desenvolvimento, para criar/atualizar migrations:
npx prisma migrate dev
```

## Rodando localmente

```bash
npm install

# API HTTP (porta $PORT, com hot reload via tsx watch)
npm run dev

# Worker que consome a fila e chama a API de análise (processo separado)
npm run dev:worker
```

Os dois processos precisam rodar ao mesmo tempo: a API só grava a review e
publica o job; quem chama a API de análise e atualiza o status é o worker.

Scripts de build/produção equivalentes: `npm run build`, `npm start` e
`npm run start:worker`.

## Testes

```bash
# testes unitários (sem dependências externas)
npm test

# testes de integração (precisam de Postgres, Redis e mock-api de pé —
# use as variáveis de ambiente do .env apontando para eles)
npm run test:integration

# tudo junto
npm run test:all
```

Os testes de integração compartilham um único banco Postgres real entre
vários arquivos (`test/integration/*.test.ts`), então o
`vitest.config.ts` desativa o paralelismo de arquivos
(`fileParallelism: false`). Isso evita que a limpeza (`deleteMany`) de um
arquivo apague dados que outro arquivo, rodando em paralelo, ainda estava
usando — o efeito colateral é que `npm run test:integration` roda mais
devagar que se fosse paralelo, o que é intencional.

## Nota sobre versões

`prisma` e `@prisma/client` estão fixados em `6.19.3` (não `latest`) — uma
escolha deliberada para não expor o projeto a mudanças de breaking change
das versões 7+/8+ do Prisma no meio do desenvolvimento. Ao atualizar o
Prisma neste projeto, atualize as duas dependências juntas e rode a suíte
de testes de integração antes de aceitar a mudança.
