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
          <button className="text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:bg-purple-200 hover:border-purple-600  dark:hover:border-purple-400 dark:hover:bg-purple-500/10 transition-all duration-150 ease-out">
            <Camera
              size={18}
              className="dark:text-purple-400 text-purple-600"
            />
            Foto
          </button>
          <button className="text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:bg-emerald-100 hover:border-emerald-600 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/10 transition-all duration-150 ease-out">
            <Music
              className="dark:text-emerald-500 text-emerald-600"
              size={16}
            />
            Musica
          </button>
          <button className="text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:border-red-500 hover:bg-red-200 dark:hover:border-red-400 dark:hover:bg-red-500/10 transition-all duration-150 ease-out">
            <Pin className="dark:text-red-400 text-red-600" size={16} />
            Local
          </button>
          <button className="text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:border-yellow-700 dark:hover:border-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-500/10 transition-all duration-150 ease-out">
            <SmilePlus
              strokeWidth={3}
              className="text-yellow-600 dark:text-yellow-400"
              size={16}
            />
            Humor
          </button>
        </div>
        <button className="brightness-90 flex justify-center items-center h-full w-12 gradient-to-l rounded-sm font-bold text-foreground hover:brightness-80">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
