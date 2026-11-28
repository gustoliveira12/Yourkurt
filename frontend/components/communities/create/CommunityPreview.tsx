import { themeLabel, type CommunityTheme } from "@/lib/communities";

type Props = {
  name: string;
  slug: string;
  description: string;
  theme: CommunityTheme | "";
  avatarUrl: string | null;
  headerUrl: string | null;
};

// Miniatura do cabeçalho de /c/[slug], atualizada enquanto a pessoa preenche.
export function CommunityPreview({ name, slug, description, theme, avatarUrl, headerUrl }: Props) {
  const cleanName = name.trim();
  const cleanDescription = description.trim();
  return (
    <aside aria-label="Prévia da comunidade" className="min-w-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-subtitle">Prévia</p>
      <div className="overflow-hidden rounded-card border border-border-base bg-surface shadow-card">
        {headerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={headerUrl} alt="" className="h-20 w-full object-cover" />
        ) : (
          <div aria-hidden="true" className="h-20 w-full bg-linear-to-l from-purple-600 to-purple-300" />
        )}
        <div className="flex flex-col gap-2 px-4 pb-4">
          <div className="-mt-6">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="size-14 rounded-full border-4 border-surface object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex size-14 items-center justify-center rounded-full border-4 border-surface bg-foreground-muted text-xl font-bold text-foreground-inverted"
              >
                {cleanName ? Array.from(cleanName)[0].toUpperCase() : "?"}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className={`break-words text-lg font-black ${cleanName ? "text-foreground" : "text-subtitle"}`}>
              {cleanName || "Nome da comunidade"}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-subtitle">
              <span className="break-all">c/{slug || "endereco"}</span>
              {theme && (
                <span className="rounded-full border border-border-base bg-background-raised px-2 py-0.5 text-xs font-bold text-foreground-brand">
                  {themeLabel(theme)}
                </span>
              )}
              <span>1 membro</span>
            </p>
          </div>
          <p
            className={`break-words text-sm ${cleanDescription ? "text-foreground" : "text-subtitle"} line-clamp-4`}
          >
            {cleanDescription || "A descrição aparece aqui."}
          </p>
        </div>
      </div>
    </aside>
  );
}
