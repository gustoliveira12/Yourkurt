import { Camera, Music, Pin, Send, SmilePlus } from "lucide-react";
import Avatar from "./Avatar";
import { AvatarProps } from "./Avatar";

export default function Post({ src, alt, size }: AvatarProps) {
  return (
    <div className="flex flex-col w-full px-6 py-4 rounded-lg bg-background-raised gap-4 ">
      <div className="flex gap-4">
        <div className="rounded-full flex items-start justify-center w-fit h-fit mt-1">
          <Avatar size={size} src={src} alt={alt} />
        </div>
        <textarea
          placeholder="O que está passando pela sua órbita?"
          className="bg-background w-full rouded-xl transition-all duration-100 border border-border-base rounded-sm px-4 py-2 placeholder:text-foreground-muted text-foreground"
        ></textarea>
      </div>
      <div className="flex gap-4 h-10">
        <div className="flex gap-2">
          <button className="text-sm font-medium flex border border-zinc-800 text-zinc-400 rounded-sm px-2 h-full gap-2 items-center hover:border-purple-400 hover:bg-purple-500/5 transition-all duration-150 ease-out">
            <Camera size={18} className="text-purple-400" />
            Foto
          </button>
          <button className="text-sm font-medium flex border border-zinc-800 text-zinc-400 rounded-sm px-2 h-full gap-2 items-center  hover:border-emerald-400 hover:bg-emerald-500/5 transition-all duration-150 ease-out">
            <Music className="text-emerald-500" size={16} />
            Musica
          </button>
          <button className="text-sm font-medium flex border border-zinc-800 text-zinc-400 rounded-sm px-2 h-full gap-2 items-center  hover:border-red-400 hover:bg-red-500/5 transition-all duration-150 ease-out">
            <Pin className="text-red-400" size={16} />
            Local
          </button>
          <button className="text-sm font-medium flex border border-zinc-800 text-zinc-400 rounded-sm px-2 h-full gap-2 items-center  hover:border-amber-400 hover:bg-amber-500/5 transition-all duration-150 ease-out">
            <SmilePlus className="text-amber-400" size={16} />
            Humor
          </button>
        </div>
        <button className="brightness-90 flex justify-center items-center h-full w-12 bg-linear-to-r from-[#eabe76] via-[#d97a34] to-[#a740a0] rounded-sm font-bold text-foreground hover:brightness-80">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
