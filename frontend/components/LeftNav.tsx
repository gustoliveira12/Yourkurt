import { User, LucideIcon } from "lucide-react";
import Link from "next/link";
import type { UrlObject } from "url";

interface NavlinksItem {
  text: string;
  redirect: UrlObject | string;
  icon: LucideIcon;
}

type NavlinkProps = {
  prop: NavlinksItem[];
};

export default function LeftNavbar({ prop }: NavlinkProps) {
  return (
    <div className="flex flex-col gap-8 max-w-96 ">
      <div className="flex flex-col rounded-xl bg-zinc-950 overflow-hidden h-fit border border-zinc-800">
        <div className="w-full h-16 bg-linear-to-l from-[#c892b8] via-[#9143e4] to-[#665BC5] relative ">
          <div className="size-16 rounded-full border-4 border-zinc-950 flex items-center justify-center mb-3 bg-purple-500  absolute -bottom-10 left-4 ">
            <User size={32} />
          </div>
        </div>
        <div className="flex flex-col px-6 py-4 gap-4 relative pt-10">
          <div className="flex flex-col">
            <h2 className="text-lg text-purple-400 font-bold">Luciano Hulk</h2>
            <span className="text-zinc-400">@Luciano.hulk</span>
          </div>
          <div className="border-t border-zinc-800 flex justify-between py-2 px-2 gap-2">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">67</h3>
              <span>Amigos</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">18</h3>
              <span>Comunidades</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">6</h3>
              <span>Mensagens</span>
            </div>
          </div>
        </div>
      </div>
      <nav className="flex flex-col py-4 px-6 gap-2 bg-zinc-950 rounded-xl border border-zinc-800">
        <h2 className="font-bold tracking-widest text-zinc-400">Navegação</h2>
        <ul className="flex flex-col gap-0.5">
          {prop.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.text}>
                <Link
                  href={item.redirect}
                  className="flex gap-4 items-center justify-start py-2.5 px-4   hover:bg-purple-500/15 rounded-lg transition-colors duration-150 ease-out text-zinc-200 hover:text-purple-400"
                >
                  <Icon />
                  <span>{item.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
