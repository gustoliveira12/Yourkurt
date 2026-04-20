import { Camera, Music, Pin, SmilePlus } from "lucide-react";
import Avatar from "./Avatar";
import { AvatarProps } from "./Avatar";

export default function Post({ src, alt, size }: AvatarProps) {
  return (
    <div className="flex flex-col w-full px-6 py-4 rounded-lg bg-zinc-950 border border-zinc-800 gap-4 ">
      <div className="flex gap-4">
        <div className="rounded-full bg-purple-500/25 flex items-start justify-center w-fit h-fit ">
          <Avatar size={size} src={src} alt={alt} />
        </div>
        <textarea
          placeholder="O que está passando pela sua órbita?"
          className="bg-zinc-900 w-full rouded-xl transition-all duration-100 border border-zinc-800 rounded-sm px-4 py-2 placeholder:text-zinc-600  "
        ></textarea>
      </div>
      <div className="flex justify-between">
        <div className="flex gap-4">
          <button className=" flex border border-zinc-800 text-zinc-400 rounded-sm px-4 py-1 gap-2 items-center hover:border-purple-400 hover:bg-purple-500/5 transition-all duration-150 ease-out">
            <Camera className="text-purple-400" />
            Foto
          </button>
          <button className=" flex border border-zinc-800 text-zinc-400 rounded-sm px-4 py-1 gap-2 items-center  hover:border-emerald-400 hover:bg-emerald-500/5 transition-all duration-150 ease-out ">
            <Music className="text-emerald-500" size={22} />
            Musica
          </button>
          <button className="flex border border-zinc-800 text-zinc-400 rounded-sm px-4 py-1 gap-2 items-center  hover:border-red-400 hover:bg-red-500/5 transition-all duration-150 ease-out ">
            <Pin className="text-red-400" size={22} />
            Local
          </button>
          <button className="flex border border-zinc-800 text-zinc-400 rounded-sm px-4 py-1 gap-2 items-center  hover:border-amber-400 hover:bg-amber-500/5 transition-all duration-150 ease-out ">
            <SmilePlus className="text-amber-400" size={22} />
            Humor
          </button>
        </div>
        <button className="px-6 py-2 bg-linear-to-r from-[#c892b8] via-[#9143e4] to-[#665BC5] rounded-sm font-bold text-white hover:brightness-80 ">
          Publicar
        </button>
      </div>
    </div>
  );
}
