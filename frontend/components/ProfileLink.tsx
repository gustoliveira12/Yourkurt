import Link from "next/link";
import type { ComponentProps } from "react";

type ProfileLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string | null;
};

// Link para um perfil quando há destino; sem destino (ex.: post de equipe),
// mostra o conteúdo sem link.
export function ProfileLink({ href, children, className, ...rest }: ProfileLinkProps) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}
