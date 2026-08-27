# Falaê! — frontend

Interface web (React + TypeScript + Vite + Mantine + TanStack Query) para
cadastrar avaliações e acompanhar seu status e resultado de análise.

Este README cobre desenvolvimento local (frontend rodando fora do Docker,
apontando para uma API já disponível). Para subir tudo com um único
comando, veja o [`README.md` da raiz](../README.md).

## Requisitos

- Node.js 24+
- A API do backend acessível (localmente via `npm run dev` em
  [`backend/`](../backend/README.md), ou via
  `docker compose up backend-api backend-worker postgres redis mock-analysis-api`
  a partir da raiz do repositório).

## Configuração

Copie o `.env.example` e ajuste se necessário:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base da API do backend consumida pelo frontend (padrão `http://localhost:3000`) |

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em http://localhost:5173 com hot reload. A sidebar (responsiva —
colapsa em menu hambúrguer abaixo do breakpoint `sm`) tem duas seções:
"Área do cliente", com `/avaliar` para cadastrar, e "Painel interno", com
`/admin/avaliacoes` (padrão; `/` redireciona para lá) para a lista, com
filtros por status/nota/período e busca por empresa resolvidos no
back-end (`GET /reviews`), fazendo polling do status
(`pending`/`processing`/`completed`/`failed`) até o resultado da análise
ficar disponível.

Scripts de build/produção equivalentes: `npm run build` e `npm run preview`.

## Testes

```bash
# testes unitários/de componente (Vitest + Testing Library, sem backend real)
npm test

# testes e2e (Playwright)
npm run test:e2e

# testes e2e com a UI do Playwright (útil para debugar um fluxo específico)
npm run test:e2e:ui
```

O `test:e2e` espera a stack completa rodando — API, worker, Postgres,
Redis e a API fake de análise, além do próprio frontend servido em
http://localhost:5173. O jeito mais simples de garantir isso é subir tudo
via Docker Compose antes de rodar o teste:

```bash
docker compose up --build -d
npm run test:e2e
```

A suíte segue o padrão Page Object Model: cada página/componente da UI
tem seu próprio objeto Playwright em `e2e/pages/`/`e2e/components/`
(seletores e ações), com os specs organizados por página
(`e2e/pages/review-page/*.spec.ts`, `e2e/pages/review-form-page/*.spec.ts`,
além de `e2e/navigation.spec.ts`). Ela nunca acessa o Postgres
diretamente — todo dado de teste é criado através do fluxo real de UI
(cadastro de avaliação via formulário), e nada é limpo ao final. Vários
testes aceitam tanto "Concluído" quanto "Falhou" como resultado válido:
a API fake de análise tem falhas periódicas propositais (`FAIL_EVERY_N`
no `.env`) que persistem mesmo com a política de retry do worker, então
uma avaliação eventualmente terminar como "Falhou" é comportamento
esperado, não um bug do teste.
