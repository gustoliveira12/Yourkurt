"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useId, useState, type ReactNode } from "react";

type CollapsibleCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

// Cartão das Configurações que abre e fecha pelo cabeçalho. O conteúdo fica
// montado quando fechado (só escondido), para os cartões carregarem as
// preferências uma vez e não perderem o estado ao fechar.
export default function CollapsibleCard({
  icon,
  title,
  description,
  children,
  defaultOpen = false,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="rounded-card border border-border-base bg-surface">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-start gap-3 rounded-card p-4 text-left hover:bg-background-raised transition-colors cursor-pointer"
        >
          <span className="mt-0.5 rounded-lg bg-background p-2 text-foreground-brand">{icon}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-semibold text-foreground">{title}</span>
            <span className="text-sm text-subtitle">{description}</span>
          </span>
          <CaretDownIcon
            size={18}
            weight="bold"
            aria-hidden="true"
            className={clsx(
              "mt-2 shrink-0 text-subtitle transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <div id={contentId} hidden={!open} className="flex flex-col gap-4 px-4 pb-4">
        {children}
      </div>
    </div>
  );
}
