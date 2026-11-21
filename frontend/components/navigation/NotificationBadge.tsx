// Nome acessível do link do sino: o número entra no rótulo, e a bolinha fica
// escondida do leitor de tela para não ser lida duas vezes.
export function unreadLabel(count: number): string {
  if (count <= 0) return "Notificações";
  if (count === 1) return "Notificações, 1 não lida";
  return `Notificações, ${count} não lidas`;
}

/**
 * Bolinha vermelha com a quantidade de não lidas, no canto do ícone do sino.
 * O ícone precisa estar dentro de um elemento `relative`.
 * Branco sobre #c62828: contraste de 5,6:1, nos dois temas.
 */
export function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c62828] px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
