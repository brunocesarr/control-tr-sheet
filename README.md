# Controle de ITR's

Painel administrativo interno para acompanhar a entrega de declarações do
**ITR — Imposto sobre a Propriedade Territorial Rural**.

Os dados vivem em uma planilha do Google Sheets (aba `Lista de ITR's`), que
continua sendo a fonte da verdade para a equipe contábil. Esta aplicação
oferece uma interface segura, filtrável e paginada sobre ela, com autenticação
e controle de acesso por função.

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Autenticação e autorização](#autenticação-e-autorização)
- [Começando](#começando)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Configurando o Google Sheets](#configurando-o-google-sheets)
- [Configurando o Appwrite](#configurando-o-appwrite)
- [Scripts](#scripts)
- [API](#api)
- [Deploy](#deploy)
- [Notas de segurança](#notas-de-segurança)

---

## Funcionalidades

- 🔐 Login, cadastro e gestão de perfil via Appwrite
- 👥 Controle de acesso por função (label `admin` no Appwrite)
- 📊 Tabela de ITRs com busca por nome, CPF, CIB, imóvel e observações
- ✅ Alternância de status por linha, com atualização otimista
- ⚡ Ação em massa que compara antes de gravar (economiza cota da API)
- 📄 Paginação com tamanho de página configurável e persistido
- 🇧🇷 Interface em português, com validação de CPF por dígito verificador

---

## Stack

| Camada          | Tecnologia                          |
| --------------- | ----------------------------------- |
| Framework       | Next.js 15 (App Router) · React 19  |
| Linguagem       | TypeScript (strict)                 |
| Estilo          | Tailwind CSS v4                     |
| Autenticação    | Appwrite Cloud                      |
| Dados           | Google Sheets API (service account) |
| Estado servidor | TanStack React Query v5             |
| Tokens          | `jose` (HS256, compatível com Edge) |
| Testes          | Vitest                              |

---

## Arquitetura

Separação em camadas — cada uma só conhece a camada imediatamente abaixo:

```
text
Componente (client)
↓
Context  (React Query: cache, filtro, paginação)
↓
Service  (regra de apresentação, ordenação)
↓
Repository client (Axios)
↓  HTTP + cookie httpOnly
Route Handler  ← requireAdmin()
↓
Repository Google (server-only, service account)
↓
Google Sheets
```

`src/repositories/google.repository.ts` e `src/helpers/jwt.ts` importam
`server-only`. Qualquer tentativa de usá-los em um componente `'use client'`
quebra o build — é assim que garantimos que o segredo nunca vá para o browser.

### Estrutura de pastas

```
text
src/
├─ app/                 rotas, layouts, route handlers
├─ components/          UI reutilizável
├─ configs/             env (client/server), Appwrite, chaves de cache
├─ contexts/            AuthProvider, SheetProvider
├─ helpers/             jwt (server), validators (puro), utils
├─ interfaces/          tipos de domínio
├─ providers/           QueryProvider
├─ repositories/        acesso a dados (client + Google)
├─ services/            regras de aplicação
└─ middleware.ts        proteção de rota na borda
```

---

## Autenticação e autorização

O fluxo é um handshake em duas etapas. **O browser nunca assina um token e
nunca lê o cookie de sessão.**

```
text
1. account.createEmailPasswordSession(email, senha)  → Appwrite valida
2. account.createJWT()                               → JWT curto do Appwrite
3. POST /api/v1/auth/session { jwt }
└─ servidor chama o Appwrite com o JWT e obtém o usuário autoritativo
└─ assina nosso token HS256 com JWT_SECRET
└─ grava cookie httpOnly + secure + sameSite=lax
4. middleware.ts verifica a ASSINATURA em toda requisição protegida
```

Pontos importantes:

- A label `admin` é lida do registro devolvido pelo Appwrite, **nunca** do
  corpo da requisição — portanto não é falsificável.
- `/home` exige `admin`; a checagem acontece no middleware, então usuários
  comuns são redirecionados para `/profile` antes de qualquer renderização.
- Os route handlers repetem `requireAdmin()` (defesa em profundidade).
- O cookie é renovado automaticamente a cada 45 min enquanto a aba estiver
  aberta.

---

## Começando

**Pré-requisitos:** Node 20.11+, uma conta Appwrite Cloud e uma service
account do Google Cloud com a Sheets API habilitada.

```
bash
git clone https://github.com/brunocesarr/control-tr-sheet.git
cd control-tr-sheet

npm ci
cp .env.example .env.local   # preencha os valores

npm run dev                  # http://localhost:3000
```

Gere o `JWT_SECRET` com:

```
bash
openssl rand -base64 48
```

O servidor **aborta na inicialização** se alguma variável obrigatória estiver
ausente ou se o `JWT_SECRET` tiver menos de 32 caracteres. Isso é intencional:
um deploy mal configurado falha imediatamente, em vez de silenciosamente
aceitar tokens inseguros.

---

## Variáveis de ambiente

Consulte [`.env.example`](./.env.example) para a lista completa e comentada.

| Variável                                  | Escopo   | Obrigatória |
| ----------------------------------------- | -------- | :---------: |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`           | browser  |     ⬜      |
| `NEXT_PUBLIC_APP_WRITE_PROJECT_ID`        | browser  |     ✅      |
| `NEXT_PUBLIC_URL_AMBIENTE_SERVER`         | browser  |     ✅      |
| `NEXT_PUBLIC_AMBIENTE_TR_MANAGER_WEB_APP` | browser  |     ⬜      |
| `NEXT_PUBLIC_STORAGE_OBFUSCATION_KEY`     | browser  |     ⬜      |
| `JWT_SECRET`                              | servidor |     ✅      |
| `SESSION_TTL_SECONDS`                     | servidor |     ⬜      |
| `GOOGLE_SERVICE_SHEET_ID`                 | servidor |     ✅      |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`            | servidor |     ✅      |
| `GOOGLE_PRIVATE_KEY`                      | servidor |     ✅      |
| `GOOGLE_SHEET_TAB_NAME`                   | servidor |     ⬜      |

---

## Configurando o Google Sheets

1. No Google Cloud Console, crie um projeto e habilite a **Google Sheets API**.
2. Crie uma **service account** e gere uma chave JSON.
3. Copie `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `private_key` →
   `GOOGLE_PRIVATE_KEY`.
4. **Compartilhe a planilha** com o `client_email` como **Editor**. Sem esse
   passo a API devolve 403.
5. Copie o id da planilha da URL → `GOOGLE_SERVICE_SHEET_ID`.

### Colunas

Os cabeçalhos são resolvidos de forma **insensível a maiúsculas, acentos,
pontuação e espaços múltiplos**. Todas estas grafias apontam para a mesma
coluna:

```
text
OBSERVAÇÕES  ·  Observações  ·  observacoes  ·  OBSERVACOES
IMOVEL RURAL ·  Imóvel Rural ·  imóvel rural ·  Imovel  Rural
```

Cabeçalhos atuais da planilha:

| Coluna | Cabeçalho      | Campo                |
| :----: | -------------- | -------------------- |
|   A    | `Coluna 1`     | _(ignorada)_         |
|   B    | `STATUS`       | `hasDone` / `status` |
|   C    | `CPF`          | `cpf`                |
|   D    | `NOME`         | `name`               |
|   E    | `CIB`          | `cib`                |
|   F    | `IMOVEL RURAL` | `imovelRural`        |
|   G    | `OBSERVAÇÕES`  | `observations`       |

> ⚠️ **A letra da coluna de STATUS NÃO é fixa no código.** Ela é derivada da
> linha de cabeçalho em tempo de execução (`HeaderResolver`). Reordenar ou
> renomear colunas na planilha não exige alteração no código — apenas garanta
> que o cabeçalho de status continue reconhecível (`STATUS`, `ENTREGUE`,
> `SITUAÇÃO`…). Uma versão anterior assumia a coluna `F` e teria sobrescrito
> todos os nomes de imóveis rurais.

Para aceitar novas grafias, edite `COLUMN_ALIASES` em
[`src/helpers/sheet-headers.ts`](./src/helpers/sheet-headers.ts) — nenhuma
outra camada precisa mudar.

### Valores de status

A coluna `STATUS` pode conter caixa de seleção (`TRUE`/`FALSE`) ou texto livre.
São reconhecidos automaticamente:

| Interpretado como entregue                                  | Interpretado como pendente                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `TRUE`, `1`, `SIM`, `S`, `X`, `OK`, `ENTREGUE`, `CONCLUÍDO` | `FALSE`, `0`, vazio, `-`, `NÃO`, `N`, `NÃO ENTREGUE`, `PENDENTE`, `EM ABERTO`, `ATRASADO` |

Ao gravar, o formato original da célula é preservado: uma caixa de seleção
recebe booleano, uma coluna de texto recebe `GOOGLE_SHEET_STATUS_DONE` /
`GOOGLE_SHEET_STATUS_PENDING`. Além disso,
`assertRangeTargetsStatusColumn()` bloqueia qualquer escrita fora da coluna de
status resolvida.

```
`

---

# ✅ What This Buys You

| Before | After |
|---|---|
| `STATUS_COLUMN = 'F'` — **would corrupt `IMOVEL RURAL`** | Column letter derived from header index at runtime |
| `row.get('Imóvel Rural')` → `undefined` | Accent-insensitive match finds `IMOVEL RURAL` |
| `row.get('hasDone')` → `undefined` (column doesn't exist) | `STATUS` resolved via alias list |
| Renaming a header silently returns blanks | Missing required column throws with the full header list |
| A stray `cellRange` could write anywhere | `assertRangeTargetsStatusColumn()` rejects it |
| Boolean written into a text column | Cell type preserved via `detectWriteFormat()` |

Run `npm run test:run` — the header tests assert against your exact `_headerValues` array, so they'll catch any future sheet reshuffle in CI rather than in production.

One thing worth confirming: **is `STATUS` a checkbox or text in the sheet?** Click a cell in column B — if it shows a tickbox, `auto` mode will write booleans; if it shows `ENTREGUE`, it writes text. Either works, but knowing tells you whether the `GOOGLE_SHEET_STATUS_*` labels matter for you.

Want me to add a `scripts/inspect-sheet.ts` one-off that prints the resolved header→column map plus a sample of parsed rows, so you can verify the mapping without booting the whole app?

---

## Configurando o Appwrite

1. Crie um projeto no Appwrite Cloud.
2. Em **Settings → Platforms**, adicione uma _Web App_ com os hostnames
   `localhost` e o domínio de produção.
3. Habilite o provedor **Email/Password** em _Auth_.
4. Para conceder acesso ao dashboard, adicione a label `admin` ao usuário em
   _Auth → Users → (usuário) → Labels_.

---

## Scripts

| Comando              | Descrição                               |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Servidor de desenvolvimento (Turbopack) |
| `npm run build`      | Build de produção                       |
| `npm start`          | Servidor de produção                    |
| `npm run lint`       | ESLint                                  |
| `npm run typecheck`  | `tsc --noEmit`                          |
| `npm run format`     | Verifica formatação                     |
| `npm run format:fix` | Corrige formatação                      |
| `npm test`           | Vitest em modo watch                    |
| `npm run test:run`   | Vitest com cobertura                    |
| `npm run verify`     | Roda tudo (usado no CI)                 |

---

## API

Todas as rotas exigem o cookie de sessão. Rotas de planilha exigem `admin`.

| Método   | Rota                              | Corpo                    | Resposta                 |
| -------- | --------------------------------- | ------------------------ | ------------------------ |
| `POST`   | `/api/v1/auth/session`            | `{ jwt }`                | `{ user, expiresAt }`    |
| `DELETE` | `/api/v1/auth/session`            | —                        | `{ message }`            |
| `GET`    | `/api/v1/sheet`                   | —                        | `SheetRowData[]`         |
| `PATCH`  | `/api/v1/sheet`                   | `{ cellRange, hasDone }` | `{ cellRange, hasDone }` |
| `POST`   | `/api/v1/sheet/update-all-status` | `{ hasDone }`            | `{ updated, skipped }`   |

Códigos: `400` payload inválido · `401` sem sessão · `403` sem permissão ·
`500` erro interno (mensagem genérica, sem detalhes internos).

---

## Deploy

Recomendado: **Vercel**.

1. Importe o repositório.
2. Cadastre todas as variáveis em _Settings → Environment Variables_. No
   `GOOGLE_PRIVATE_KEY`, cole a chave com `\n` literais.
3. Faça o deploy. Se algo estiver faltando, o build falha com a mensagem
   `[env] Missing or invalid required environment variable: …`.

---

## Notas de segurança

- ✅ Cookie de sessão `httpOnly`, `secure`, `sameSite=lax` — inacessível a JS.
- ✅ Assinatura verificada com `jose` e algoritmo fixado em `HS256`.
- ✅ Referências A1 validadas por whitelist antes de ir para a planilha.
- ✅ Mensagens de erro genéricas nas respostas; detalhes só nos logs.
- ⚠️ `localStorage.service.ts` faz **obfuscação**, não criptografia — a chave
  está no bundle. Nunca guarde credenciais ou dados pessoais ali.
- 🔁 Rotacione o `JWT_SECRET` se suspeitar de exposição; isso invalida todas
  as sessões ativas.

> **Migrando de uma versão anterior a 0.2.0?** Os tokens antigos eram
> assinados com segredo vazio e serão rejeitados. Todos os usuários precisarão
> fazer login novamente — comportamento esperado e desejável.

```

`

---

# 🧹 Cleanup Commands

```bash
# Priority #7 — remove the unused create-next-app assets
git rm public/next.svg public/vercel.svg public/window.svg public/file.svg public/globe.svg

# Keep one lockfile only (npm chosen to match packageManager + CI cache)
git rm yarn.lock

# Swap dependencies
npm uninstall jwt-simple jwt-decode js-cookie @types/js-cookie
npm install jose
npm install -D vitest @vitest/coverage-v8 @types/node

# Verify everything
npm run verify
```

Add to `.gitignore` if not already present:

```gitignore
.env
.env.local
.env*.local
coverage/
.vercel
*.pem
```

---

# ⚠️ Two Things to Verify on Your Side

1. **`STATUS_COLUMN = 'F'`** in `google.repository.ts` — I inferred this from the field order. Open the sheet and confirm which column holds `hasDone`, plus the exact header strings (`Imóvel Rural`, `Observações`), since `row.get()` is case- and accent-sensitive.

2. **`Table.tsx`, `FilterSection.tsx`, `Pagination.tsx`, `CustomModals.tsx`, `Sidebar.tsx`** are full rewrites against the new `SheetContext` / `AuthContext` APIs. I could read their behaviour but not every original Tailwind class, so swap yours back in if the visuals drift.

Want me to also add a hard-delete `/api/v1/auth/account` route using `node-appwrite` (needs a server API key), or a migration checklist for rolling this out without locking out your current users?
