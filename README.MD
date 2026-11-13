# Yourkurt

Yourkurt é uma rede social interna inspirada no Orkut, focada em perfis, posts e interações entre usuários de um mesmo ambiente organizacional. É um projeto da turma 17256 dos aprendizes do Espro e está em desenvolvimento ativo.

## Funcionalidades

**Conta e autenticação**
- Cadastro com verificação de e-mail e login.
- Recuperação de senha por e-mail e troca de senha nas configurações.
- Exclusão da própria conta.

**Perfis e seguidores**
- Perfil com avatar, imagem de capa e dados editáveis.
- Perfis públicos em `/perfil/<username>`, com botão de seguir e contagem de seguidores e seguindo.
- Perfil privado: seguir vira um pedido que o dono aceita ou recusa, e só seguidores aprovados veem posts, bio, localização, site e aniversário.
- Do aniversário, as outras pessoas veem só o dia e o mês.

**Posts e interações**
- Feed de posts com até 2.500 caracteres e várias imagens por post (comprimidas no navegador antes do envio).
- Página de detalhe do post com comentários de até 2.500 caracteres.
- Curtidas e contagem de comentários e reposts.
- Aba de respostas no perfil.

**Páginas de equipe e administração**
- Páginas de equipe: membros autorizados podem publicar em nome da equipe.
- Painel de gerenciamento de usuários e permissões (`/gerenciamento-usuarios`), restrito ao super admin.

**Privacidade (LGPD)**
- Política de Privacidade em `/privacidade`.
- Em Configurações: perfil privado, consentimento para receber novidades e "Baixar meus dados" (exporta tudo em JSON).
- Excluir a conta apaga também foto, capa e imagens dos posts.

**Outros**
- Notificações (novos seguidores e pedidos para seguir), com marcação de lidas.
- Tema claro e escuro, com a preferência salva no navegador.
- Acessibilidade segundo a WCAG 2.1 nível AA: contraste, navegação por teclado e nomes para leitores de tela.
- Navegação mobile e página 404 personalizada.

## Stack

| Camada                 | Tecnologia                                 |
|------------------------|--------------------------------------------|
| Framework              | Next.js 16 (App Router)                    |
| Interface              | React 19                                   |
| Linguagem              | TypeScript                                 |
| Estilização            | Tailwind CSS 4                             |
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

## Rodando localmente

As dependências e o `.env.local` ficam em `frontend/`, não na raiz:

```bash
cd frontend
pnpm install
pnpm dev        # http://localhost:3000
```

O `frontend/.env.local` precisa de:

```bash
NEXT_PUBLIC_SUPABASE_URL=<url-do-projeto-no-supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave-anon-do-supabase>
```

Para usar um banco local, rode `supabase start` e `supabase db reset` na raiz e coloque a URL e a chave anon mostradas por `supabase status` em `frontend/.env.development.local` (no `pnpm dev`, ele tem prioridade sobre o `.env.local`). O seed cria os usuários `dev1@yourkurt.test` (super admin, perfil público) e `dev2@yourkurt.test` (perfil privado), com a senha `dev123`.

## Migrations

Alterações no banco entram como novos arquivos em `supabase/migrations/` e são aplicadas com `supabase db push`. Commite a migration logo depois do push: se o banco remoto tiver uma migration que não está no repositório, o próximo `db push` de outra pessoa falha.

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
| Seguir usuários e perfil privado             | Concluído       |
| Privacidade (LGPD) e acessibilidade          | Concluído       |
| Amigos                                       | Em andamento    |
| Comunidades                                  | Em andamento    |
| Backend próprio                              | Não iniciado    |

## Próximos passos

- Amigos: página `/friends` com amigos (quem você segue e segue você de volta), seguidores e seguindo.
- Telas de comunidades: listagem, criação e página da comunidade (o schema já existe, as rotas ainda são esqueletos).
- Preferências de notificação, e repost e salvar gravados no banco (hoje ficam só no navegador).
- Imagens em buckets privados, com URLs assinadas.
- Definir as responsabilidades do backend próprio.

## Licença

Código aberto sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).
