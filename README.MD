# Esprokurt

Esprokurt é uma rede social interna inspirada no Orkut, focada em perfis, posts e interações entre usuários de um mesmo ambiente organizacional. O projeto está em desenvolvimento ativo e já oferece autenticação, perfil, feed de posts, curtidas e navegação mobile.

## Funcionalidades Principais

- Autenticação (login e cadastro de usuários).
- Perfis com avatar e imagem de capa.
- Feed de posts com limite de 500 caracteres.
- Curtidas, contagem de interações e exibição de dados do autor.
- Navegação mobile integrada ao layout principal.
- Alternância entre tema claro e escuro, com persistência local de preferências visuais.

## Stack Tecnológica

O projeto utiliza a seguinte stack:

| Camada                 | Tecnologia                                |
|------------------------|-------------------------------------------|
| Framework              | Next.js 16.2.4 (App Router)               |
| Interface              | React 19.2.4                              |
| Linguagem              | TypeScript                                |
| Estilização            | Tailwind CSS 4                            |
| Componentes de UI      | Radix UI                                  |
| Ícones                 | Lucide React e Phosphor Icons             |
| Backend as a Service   | Supabase (Supabase JS e Supabase SSR)     |
| Gerenciador de pacotes | pnpm                                      |
| Hospedagem             | Vercel                                    |

Supabase é utilizado como Backend as a Service, fornecendo autenticação, banco de dados PostgreSQL, armazenamento de arquivos e consultas.

## Estrutura do Repositório

A estrutura de alto nível do monorepo é:

```text
Esprokurt/
├── frontend/   Aplicação Next.js
├── backend/    Reservado para backend próprio
├── supabase/   Migrations e configuração do Supabase
├── package.json
└── pnpm-lock.yaml
```

- `frontend/`: código da aplicação web (App Router, componentes, hooks).
- `backend/`: diretório reservado para um backend próprio futuro.
- `supabase/`: scripts de migrations, configuração de buckets, triggers e policies.

## Como rodar localmente

### Pré-requisitos

- Node.js (versão compatível com Next.js 16.x).
- pnpm instalado globalmente.
- Conta e projeto no Supabase configurados.

### Passos

1. Clonar o repositório:

   ```bash
   git clone <url-do-repositorio>
   cd Esprokurt
   ```

2. Instalar dependências:

   ```bash
   pnpm install
   ```

3. Configurar as variáveis de ambiente (por exemplo em `.env.local`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=<url-do-projeto-no-supabase>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anon-do-supabase>
   ```

   A aplicação depende dessas variáveis para se conectar ao backend de dados.

4. Subir o ambiente de desenvolvimento:

   ```bash
   cd frontend
   pnpm dev
   ```

5. Acessar no navegador:

   - `http://localhost:3000`

## Status do Projeto

O status atual das principais áreas é:

| Área                                   | Status        |
|----------------------------------------|---------------|
| Autenticação (login e cadastro)        | Concluído     |
| Feed e criação de posts                | Concluído     |
| Perfil de usuário                      | Concluído     |
| Curtidas e interações                  | Concluído     |
| Upload de arquivos (Supabase Storage)  | Concluído     |
| Navegação mobile                       | Concluído     |
| Amigos                                 | Não iniciado  |
| Comunidades                            | Não iniciado  |
| Mensagens                              | Não iniciado  |
| Backend próprio                        | Não iniciado  |

Essas informações são detalhadas na Documentação Técnica do projeto.

## Roadmap (Próximos Passos)

- Implementar páginas de amigos, comunidades e mensagens.
- Implementar o backend próprio e definir suas responsabilidades.
- Aplicar migrations pendentes no ambiente Supabase.
- Refinar detalhes visuais (stories, menu, interações de hover).
- Finalizar a funcionalidade completa de comunidades.
