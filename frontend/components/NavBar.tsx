import { useReducer } from "react";

import {
  type Icon,
  AlignLeftIcon,
  AlignTopSimpleIcon,
} from "@phosphor-icons/react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AsideState = {
  isExpanded: boolean;
  isPinned: boolean;
  isKeepMinimized: boolean;
};

type AsideAction =
  | { type: "ENTER" }
  | { type: "LEAVE" }
  | { type: "KEEP_PINNED" }
  | { type: "KEEP_MINIMIZED" };

function asideReducer(state: AsideState, action: AsideAction): AsideState {
  switch (action.type) {
    case "ENTER":
      return state.isKeepMinimized ? state : { ...state, isExpanded: true };
    case "LEAVE":
      return { ...state, isExpanded: false };
    case "KEEP_PINNED":
      return { ...state, isPinned: !state.isPinned, isKeepMinimized: false };
    case "KEEP_MINIMIZED":
      return {
        ...state,
        isKeepMinimized: !state.isKeepMinimized,
        isPinned: false,
      };
    default:
      return state;
  }
}

export type NavItem = {
  to: string;
  icon: Icon;
  label: string;
  exact?: boolean;
};

export type PageAsideProps = {
  items: NavItem[];
};

const PageAside = ({ items }: PageAsideProps) => {
  const [state, dispatch] = useReducer(asideReducer, {
    isExpanded: false,
    isPinned: false,
    isKeepMinimized: false,
  });

  const isOpen = state.isExpanded || state.isPinned;
  const pathname = usePathname();

  return (
    <div className="top-0 left-0 fixed flex h-dvh z-40 bg-background shadow-overflow-light dark:shadow-overflow-dark">
      <aside
        className={clsx(
          "transition-all duration-200 ease-in-out flex flex-col relative",
          isOpen ? "w-64" : "w-16",
        )}
        onMouseEnter={() => dispatch({ type: "ENTER" })}
        onMouseLeave={() => dispatch({ type: "LEAVE" })}
      >
        <div className="flex items-center justify-center h-14 px-2.5 shrink-0 overflow-hidden">
          <h1 className="text-2xl font-black gradient-to-l text-transparent bg-clip-text">
            E
          </h1>
        </div>
        <nav className="flex flex-col justify-center flex-1 p-2">
          <ul className="flex flex-col gap-1">
            {items.map(({ to, icon: Icon, label, exact }) => {
              const isActive = exact
                ? pathname === to
                : pathname.startsWith(to);
              return (
                <li key={to}>
                  <Link
                    href={to}
                    className={clsx(
                      "hover:bg-background-raised flex items-center w-full py-4 px-2.5 gap-3 font-bold uppercase rounded-lg text-subtitle",
                      isActive ? "" : "",
                    )}
                  >
                    {" "}
                    {/* TODO: MUDAR COR DE TEXTO PARA USAR VARIAVEIS */}
                    <Icon
                      color={isActive ? "var(--foreground)" : "var(--subtitle)"}
                      className="shrink-0"
                      size={28}
                      weight={isActive ? "fill" : "bold"}
                    />
                    <span
                      className={clsx(
                        "transition-all duration-300 whitespace-nowrap",
                        isOpen ? "opacity-100 visible" : "opacity-0 invisible",
                        isActive ? "text-foreground" : "text-subtitle",
                      )}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col items-center justify-center w-14 dark:text-gray-400 pb-4 gap-1">
          <button
            title="Manter minimizado"
            className={clsx("p-2 hover:bg-background-raised rounded-lg", {
              "text-foreground bg-background-raised": state.isKeepMinimized,
            })}
            onClick={() => dispatch({ type: "KEEP_MINIMIZED" })}
          >
            <AlignLeftIcon weight="fill" size={28} />
          </button>
          <button
            title="Fixar aberta"
            className={clsx("p-2 hover:bg-background-raised rounded-lg", {
              "text-foreground bg-background-raised": state.isPinned,
            })}
            onClick={() => dispatch({ type: "KEEP_PINNED" })}
          >
            <AlignTopSimpleIcon weight="fill" size={28} />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PageAside;
