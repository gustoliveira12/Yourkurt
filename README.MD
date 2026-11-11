# Yourkurt

Yourkurt é uma rede social interna inspirada no Orkut, focada em perfis, posts e interações entre usuários de um mesmo ambiente organizacional. O projeto está em desenvolvimento ativo.

## Funcionalidades

**Conta e autenticação**
- Cadastro com verificação de e-mail e login.
- Recuperação de senha por e-mail e troca de senha nas configurações.
- Exclusão da própria conta.

**Perfis**
- Perfil com avatar, imagem de capa e dados editáveis.
- Perfis públicos em `/perfil/<username>`, com contagem de seguidores e seguindo.

**Posts e interações**
- Feed de posts com até 2.500 caracteres e várias imagens por post (comprimidas no navegador antes do envio).
- Página de detalhe do post com comentários de até 2.500 caracteres.
- Curtidas e contagem de comentários e reposts.
- Aba de respostas no perfil.

**Páginas de equipe e administração**
- Páginas de equipe: membros autorizados podem publicar em nome da equipe.
- Painel de gerenciamento de usuários e permissões (`/gerenciamento-usuarios`), restrito ao super admin.

**Outros**
- Notificações (por exemplo, novos seguidores), com marcação de lidas.
- Tema claro e escuro, com a preferência salva no navegador.
- Navegação mobile e página 404 personalizada.

## Stack

| Camada                 | Tecnologia                                 |
|------------------------|--------------------------------------------|
| Framework              | Next.js 16 (App Router)                    |
| Interface              | React 19                                   |
| Linguagem              | TypeScript                                 |
| Estilização            | Tailwind CSS 4                             |
| Componentes de UI      | Radix UI                                   |
| Ícones                 | Lucide React e Phosphor Icons              |
| Backend as a Service   | Supabase (Auth, PostgreSQL, Storage)       |
| Gerenciador de pacotes | pnpm                                       |
| Hospedagem             | Vercel                                     |

O frontend fala direto com o Supabase. As regras de acesso ficam no banco, em policies de RLS, triggers e funções definidas nas migrations de `supabase/migrations`.

## Estrutura do repositório

```text
Yourkurt/
├── frontend/          Aplicação Next.js
│   ├── app/           Rotas (App Router)
│   ├── components/    Componentes de interface
│   └── lib/           Hooks, cliente Supabase e utilitários
├── supabase/
│   ├── migrations/    Schema, policies, triggers e buckets
│   ├── seed.sql       Dados falsos para o ambiente local
│   └── config.toml    Configuração do Supabase CLI
└── backend/           Reservado para um backend próprio (vazio)
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20.9 ou superior.
- pnpm 10 (`corepack enable` instala a versão definida no `package.json`).
- Um projeto no Supabase **ou** o [Supabase CLI](https://supabase.com/docs/guides/local-development) com Docker, para rodar o banco localmente.

### 1. Instalar as dependências

As dependências ficam em `frontend/`:

```bash
git clone <url-do-repositorio>
cd Yourkurt/frontend
pnpm install
```

### 2. Configurar as variáveis de ambiente

Crie o arquivo `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<url-do-projeto-no-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anon-do-supabase>
```

Com um projeto na nuvem, os valores ficam em **Project Settings → API**. Com o banco local, veja o passo 3.

### 3. (Opcional) Subir o Supabase localmente

Na raiz do repositório:

```bash
supabase start      # sobe o Supabase local com Docker
supabase db reset   # aplica todas as migrations e o seed.sql
supabase status     # mostra a URL e a chave anon para o .env.local
```

O `seed.sql` cria os usuários `dev1@yourkurt.test` e `dev2@yourkurt.test`, ambos com a senha `dev123`.

### 4. Rodar a aplicação

```bash
cd frontend
pnpm dev
```

Ou, a partir da raiz, `pnpm dev:front`. A aplicação abre em `http://localhost:3000`.

### Outros comandos (em `frontend/`)

| Comando      | O que faz                          |
|--------------|------------------------------------|
| `pnpm build` | Gera o build de produção           |
| `pnpm start` | Roda o build de produção           |
| `pnpm lint`  | Roda o ESLint                      |

## Banco de dados e migrations

Toda alteração no banco entra como um novo arquivo em `supabase/migrations/`, nomeado com o timestamp na frente (`AAAAMMDDHHMMSS_descricao.sql`).

Para aplicar as migrations pendentes no projeto remoto:

```bash
supabase link --project-ref <ref-do-projeto>   # só na primeira vez
supabase db push
```

Commite o arquivo da migration logo depois do `db push`. Se o banco remoto tiver uma migration que não existe no repositório, o próximo `db push` de outra pessoa falha.

## Status do projeto

| Área                                         | Status          |
|----------------------------------------------|-----------------|
| Autenticação, recuperação de senha e conta   | Concluído       |
| Perfil e perfis públicos                     | Concluído       |
| Feed, posts com imagens e comentários        | Concluído       |
| Curtidas e interações                        | Concluído       |
| Notificações                                 | Concluído       |
| Páginas de equipe e gestão de usuários       | Concluído       |
| Navegação mobile e tema claro/escuro         | Concluído       |
| Seguir usuários                              | Em andamento    |
| Comunidades                                  | Em andamento    |
| Amigos                                       | Em andamento    |
| Mensagens                                    | Não iniciado    |
| Backend próprio                              | Não iniciado    |

## Próximos passos

- Botão de seguir e deixar de seguir nos perfis públicos (o banco e as notificações de "seguir" já existem).
- Telas de comunidades: listagem, criação e página da comunidade (o schema já existe, as rotas ainda são esqueletos).
- Fluxo de amizades (enviar e aceitar pedidos).
- Mensagens entre usuários.
- Definir as responsabilidades do backend próprio.
- Refinar detalhes visuais (stories, menu, interações de hover).
