import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Yourkurt",
};

// Dados do controlador (LGPD, art. 9º, III). Atualize aqui se mudar.
const CONTROLLER_NAME = "Gustavo Oliveira";
const CONTROLLER_EMAIL = "gustavo.hmoliveira@proton.me";
const LAST_UPDATED = "11 de novembro de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh w-full bg-background px-4 py-10 sm:py-16">
      <article className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/" className="text-sm font-black tracking-wide text-foreground-brand">
            Yourkurt
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            Política de Privacidade
          </h1>
          <p className="text-sm text-subtitle">Última atualização: {LAST_UPDATED}</p>
        </header>

        <p className="leading-relaxed text-foreground">
          O Yourkurt é uma rede social interna criada pela turma 17256 dos aprendizes do Espro.
          Esta política explica, de forma direta, quais dados pessoais usamos, para quê e quais
          são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
        </p>

        <Section title="1. Quem é responsável pelos seus dados">
          <p>
            O controlador dos dados é <strong>{CONTROLLER_NAME}</strong>. Para qualquer pedido ou
            dúvida sobre seus dados pessoais, escreva para{" "}
            <a href={`mailto:${CONTROLLER_EMAIL}`} className="font-semibold text-foreground-brand underline">
              {CONTROLLER_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="2. Quais dados usamos">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>Cadastro:</strong> nome, nome de usuário (@), e-mail e senha. A senha é
              guardada de forma cifrada; ninguém consegue lê-la.
            </li>
            <li>
              <strong>Perfil (opcional):</strong> foto, imagem de capa, bio, localização, site e
              data de aniversário.
            </li>
            <li>
              <strong>O que você publica:</strong> posts, imagens, comentários, curtidas, quem você
              segue e quem segue você.
            </li>
            <li>
              <strong>Preferências:</strong> privacidade do perfil, tema (claro ou escuro) e se
              você quer receber novidades por e-mail.
            </li>
            <li>
              <strong>Dados técnicos:</strong> um cookie de sessão, necessário para manter você
              conectado, e a preferência de tema guardada no seu navegador. Não usamos cookies de
              publicidade nem ferramentas de rastreamento.
            </li>
          </ul>
        </Section>

        <Section title="3. Para que usamos e com qual base legal">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>Fazer a rede funcionar</strong> (criar sua conta, mostrar seu perfil e suas
              publicações, avisar sobre novos seguidores): é necessário para prestar o serviço que
              você pediu ao se cadastrar (art. 7º, V).
            </li>
            <li>
              <strong>Proteger a conta e a rede</strong> (login, recuperação de senha, controle de
              permissões e registro de ações de administração): legítimo interesse em manter o
              serviço seguro (art. 7º, IX).
            </li>
            <li>
              <strong>Enviar novidades por e-mail:</strong> só com o seu consentimento, dado ao
              marcar a opção. Você pode retirá-lo a qualquer momento (art. 7º, I).
            </li>
          </ul>
          <p>Não vendemos dados e não usamos seus dados para publicidade.</p>
        </Section>

        <Section title="4. Quem vê o quê">
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>Só pessoas com conta no Yourkurt veem perfis, posts e comentários.</li>
            <li>
              As imagens (foto, capa e imagens dos posts, inclusive de perfis privados) ficam em
              endereços públicos: quem tiver o link de uma imagem consegue abri-la sem estar
              conectado. Não publique imagens que você não mostraria a qualquer pessoa.
            </li>
            <li>
              Nome, @, foto e capa aparecem para todas as pessoas com conta.
            </li>
            <li>
              <strong>Perfil público:</strong> bio, localização, site, aniversário e posts aparecem
              para todas as pessoas com conta.
            </li>
            <li>
              <strong>Perfil privado:</strong> bio, localização, site, aniversário e posts só
              aparecem para quem você aprovar como seguidor.
            </li>
            <li>
              Do aniversário, as outras pessoas veem só o dia e o mês, nunca o ano.
            </li>
            <li>Seu e-mail não aparece para outras pessoas.</li>
          </ul>
        </Section>

        <Section title="5. Com quem compartilhamos">
          <p>
            Usamos dois serviços para hospedar o Yourkurt, que tratam os dados apenas para isso,
            seguindo nossas instruções:
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>Supabase:</strong> banco de dados, login e armazenamento das imagens.
            </li>
            <li>
              <strong>Vercel:</strong> hospedagem do site.
            </li>
          </ul>
          <p>
            Os servidores desses serviços podem ficar fora do Brasil. Nesse caso, a transferência
            segue as garantias previstas na LGPD (art. 33).
          </p>
        </Section>

        <Section title="6. Por quanto tempo guardamos">
          <p>
            Enquanto sua conta existir. Ao excluir a conta, apagamos seu perfil, posts, imagens,
            comentários, curtidas, seguidores e notificações. Nos registros de administração, seu
            nome é desvinculado. Cópias de segurança mantidas pelos provedores podem levar alguns
            dias para serem substituídas.
          </p>
        </Section>

        <Section title="7. Seus direitos">
          <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
          <ul className="flex list-disc flex-col gap-2 pl-5">
            <li>
              <strong>Acessar e levar seus dados:</strong> em Configurações, use{" "}
              <em>Baixar meus dados</em> para receber um arquivo com tudo o que temos sobre você.
            </li>
            <li>
              <strong>Corrigir:</strong> edite seu perfil a qualquer momento.
            </li>
            <li>
              <strong>Excluir:</strong> em Configurações, use <em>Excluir conta</em>.
            </li>
            <li>
              <strong>Retirar o consentimento</strong> para receber novidades, nas Configurações.
            </li>
            <li>
              <strong>Pedir informações</strong> sobre o uso dos seus dados ou fazer uma
              reclamação, pelo e-mail acima ou à Autoridade Nacional de Proteção de Dados (ANPD).
            </li>
          </ul>
        </Section>

        <Section title="8. Adolescentes">
          <p>
            O Yourkurt é feito para aprendizes, que podem ter a partir de 14 anos. Por isso,
            coletamos o mínimo necessário, não usamos dados para publicidade e não mostramos o ano
            de nascimento, sempre no melhor interesse de quem usa (art. 14).
          </p>
        </Section>

        <Section title="9. Segurança">
          <p>
            O acesso aos dados é controlado no próprio banco: cada pessoa só lê e altera o que
            tem permissão. As senhas são cifradas e a conexão com o site é protegida (HTTPS).
          </p>
        </Section>

        <Section title="10. Mudanças nesta política">
          <p>
            Se esta política mudar, a data no topo será atualizada. Mudanças importantes serão
            avisadas no próprio Yourkurt.
          </p>
        </Section>
      </article>
    </main>
  );
}
