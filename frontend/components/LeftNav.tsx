import { User, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { UrlObject } from "url";
import { Avatar, AvatarProps } from "./Avatar";
import Image from "next/image";
import { useState } from "react";
import { type Icon, UserIcon, ArrowRightIcon } from "@phosphor-icons/react";

export interface NavlinksItem {
  text: string;
  redirect: UrlObject | string;
  icon: Icon;
}

type NavlinkProps = {
  prop: NavlinksItem[];
  avatar: AvatarProps;
  size: number;
  alt: string;
};

export default function LeftNavbar({ prop, avatar, size, alt }: NavlinkProps) {
  const [error, setError] = useState(false);
  return (
    <div className="flex flex-col gap-8 max-w-80 ">
      <div className="flex flex-col rounded-xl bg-background-raised overflow-hidden h-fit ">
        <div className="w-full h-16 gradient-to-l relative ">
          <div className="size-16 rounded-full border-4 border-background-raised flex items-center justify-center mb-3 bg-purple-500  absolute -bottom-10 left-4 ">
            {!avatar.src! || error ? (
              <UserIcon className="text-purple-400" size={avatar.sizes!} />
            ) : (
              <Image
                className="h-full w-full object-cover rounded-full"
                height={size!}
                width={size!}
                alt={alt!}
                src={avatar.src!}
                onError={() => setError(true)}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col px-6 py-4 gap-4 relative pt-10">
          <div className="flex flex-col w-full">
            <div className="flex w-full justify-between">
              <h2 className="text-xl text-foreground font-bold">Lucas Silva</h2>
              <button className="text-sm text-foreground-brand cursor-pointer">
                trocar
              </button>
            </div>
            <span className="text-subtitle">@Lucas.Silva</span>
          </div>
          <div className="border-t border-zinc-800 flex justify-between p-2 gap-2">
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">67</h3>
              <span className="text-sm text-subtitle font-medium ">Amigos</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">18</h3>
              <span className="text-sm text-subtitle font-medium ">
                Comunidades
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold">6</h3>
              <span className="text-sm text-subtitle font-medium ">
                Mensagens
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col rounded-xl bg-background-raised overflow-hidden h-fit  px-6 py-4 gap-2">
        <div className="flex justify-between">
          <h2 className=" flex items-center uppercase font-bold tracking-wide text-sm text-foreground ">
            Seus amigos
          </h2>
          <button className="flex items-center justify-center  text-foreground-brand font-medium text-sm hover:bg-foreground-brand/15 px-2 py-1 rounded-sm transition-all duration-150 gap-1 cursor-pointer ">
            300
            <ArrowRightIcon size={12} />
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col justify-center items-center gap-2 text-xs text-zinc-400 truncate max-w-16 ">
            <div className="flex flex-col rounded-full size-16  items-center justify-center ">
              <Avatar src="" />
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
    </div>
  );
}
