// Tag das contas de teste, marcada só pelo super admin. Mesmo tamanho do
// CommunityBadge, em ciano para não confundir com as etiquetas de papel.
export function DevBadge() {
  return (
    <span
      title="Conta de teste"
      className="inline-flex shrink-0 items-center rounded-full border border-dev-badge-border bg-dev-badge-bg px-2 py-0.5 text-xs font-bold text-dev-badge-fg"
    >
      <span aria-hidden="true">Dev</span>
      <span className="sr-only">Dev, conta de teste</span>
    </span>
  );
}
