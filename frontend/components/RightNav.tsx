"use client";
import { User, LucideIcon } from "lucide-react";
import Link from "next/link";
import type { UrlObject } from "url";
import { ArrowRight } from "lucide-react";
import Avatar from "./Avatar";
import clsx from "clsx";

interface CommunityItems {
  text: string;
  redirect: UrlObject | string;
  icon: LucideIcon;
  color: string;
}

type NavlinkProps = {
  prop: CommunityItems[];
};

const ColorMap: Record<string, string> = {
  rose: "bg-rose-500/10 text-rose-500",
  sky: "bg-sky-500/10 text-sky-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
};
function getColorClass(color: string) {
  return ColorMap[color] ?? "hover:bg-zinc-500/10 text-zinc-500";
}

export default function RightNavbar({ prop }: NavlinkProps) {
  return (
    <div className="flex flex-col gap-8 max-w-96 ">
      <div className="flex flex-col rounded-xl bg-zinc-950 overflow-hidden h-fit border border-zinc-800 px-6 py-4 gap-2">
        <div className="flex justify-between">
          <h2 className=" flex items-center uppercase font-bold tracking-wide text-sm text-zinc-400 ">
            Seus amigos
          </h2>
          <button className="flex items-center justify-center  text-purple-400 font-medium text-sm hover:bg-purple-500/15 px-2 py-1 rounded-sm transition-all duration-150 gap-1 ">
            300
            <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16 bg-purple-500/15 items-center justify-center ">
              <Avatar size={32} alt="" src="" />
            </div>
            <span
              title=" HingleMcGringleBerry"
              className="w-full min-w-0 truncate"
            >
              HingleMcGringleBerry
            </span>
          </div>
        </div>
      </div>
      <nav className="flex flex-col py-4 px-6 gap-2 bg-zinc-950 rounded-xl border border-zinc-800">
        <div className="flex justify-between">
          <h2 className=" flex items-center uppercase font-bold tracking-wide text-sm text-zinc-400 ">
            Comunidades
          </h2>
          <button className="flex items-center justify-center  text-purple-400 font-medium text-sm hover:bg-purple-500/15 px-2 py-1 rounded-sm transition-all duration-150 gap-1 ">
            explorar
            <ArrowRight size={12} />
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {prop.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text}>
                <Link
                  href={item.redirect}
                  className={clsx(
                    `flex gap-4 items-center justify-start py-2.5 px-4 rounded-lg transition-colors duration-150 ease-out text-zinc-200 hover:bg-zinc-900`,
                  )}
                >
                  <div
                    className={clsx(
                      `flex items-center justify-start rounded-sm transition-colors duration-150 ease-out p-2  `,
                      getColorClass(item.color),
                    )}
                  >
                    <Icon />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-zinc-100 ">
                      {item.text}
                    </h2>
                    <span className="text-sm text-zinc-400 tracking-tight">
                      48 membros
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
