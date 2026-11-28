import { CheckIcon } from "@phosphor-icons/react";

type Props = { current: number; steps: readonly string[] };

export function StepIndicator({ current, steps }: Props) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-subtitle">
        Etapa {current} de {steps.length}
      </p>
      <ol className="mt-3 flex items-start gap-2">
        {steps.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          return (
            <li
              key={label}
              aria-current={active ? "step" : undefined}
              className="flex min-w-0 flex-1 flex-col gap-2"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 rounded-full ${done || active ? "btn-gradient" : "bg-border-base"}`}
              />
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    done || active
                      ? "btn-gradient"
                      : "border border-border-base text-subtitle"
                  }`}
                >
                  {done ? <CheckIcon size={12} weight="bold" /> : number}
                </span>
                <span
                  className={`truncate text-xs sm:text-sm ${active ? "font-bold text-foreground" : "text-subtitle max-sm:sr-only"}`}
                >
                  {label}
                </span>
                {done && <span className="sr-only">(concluída)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
