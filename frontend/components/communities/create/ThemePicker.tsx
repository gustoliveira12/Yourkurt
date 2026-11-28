"use client";

import { COMMUNITY_THEMES, type CommunityTheme } from "@/lib/communities";
import {
  BookOpenIcon,
  BriefcaseIcon,
  CpuIcon,
  GameControllerIcon,
  MegaphoneIcon,
  MusicNotesIcon,
  SoccerBallIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useRef } from "react";

const ICONS: Record<CommunityTheme, Icon> = {
  estudos: BookOpenIcon,
  tecnologia: CpuIcon,
  games: GameControllerIcon,
  esportes: SoccerBallIcon,
  musica: MusicNotesIcon,
  carreira: BriefcaseIcon,
  avisos_espro: MegaphoneIcon,
};

type Props = {
  value: CommunityTheme | "";
  onChange(theme: CommunityTheme): void;
  error?: string;
};

export function ThemePicker({ value, onChange, error }: Props) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const count = COMMUNITY_THEMES.length;
  const selectedIndex = COMMUNITY_THEMES.findIndex((item) => item.value === value);

  function move(index: number) {
    const next = (index + count) % count;
    onChange(COMMUNITY_THEMES[next].value);
    refs.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(index - 1);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onChange(COMMUNITY_THEMES[index].value);
    }
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Tema da comunidade"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "theme-error" : undefined}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      >
        {COMMUNITY_THEMES.map((item, index) => {
          const ThemeIcon = ICONS[item.value];
          const checked = item.value === value;
          // Só um cartão entra na ordem do Tab: o escolhido, ou o primeiro.
          const tabbable = selectedIndex === -1 ? index === 0 : checked;
          return (
            <div
              key={item.value}
              ref={(element) => {
                refs.current[index] = element;
              }}
              role="radio"
              aria-checked={checked}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 px-3 py-4 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand ${
                checked
                  ? "border-foreground-brand bg-background-raised"
                  : "border-border-base bg-surface hover:bg-background-raised"
              }`}
            >
              <span
                aria-hidden="true"
                className={`inline-flex size-11 items-center justify-center rounded-full ${
                  checked ? "btn-gradient" : "bg-background-raised text-foreground"
                }`}
              >
                <ThemeIcon size={22} weight={checked ? "fill" : "regular"} />
              </span>
              <span className="text-sm font-bold text-foreground">{item.label}</span>
            </div>
          );
        })}
      </div>
      {error && (
        <p id="theme-error" role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
