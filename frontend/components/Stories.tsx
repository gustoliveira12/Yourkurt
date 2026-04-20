"use client";
import Avatar, { AvatarProps } from "./Avatar";

//TODO: CREATE HOVER | IDENTIFY POSTED STORIES
export default function Story({ src, alt, size = 40 }: AvatarProps) {
  return (
    <div className="flex flex-col justify-center items-center gap-1.5 ">
      <Avatar size={size} src={src} alt={alt} />
      <span
        title="Whindersson Nunes"
        className="text-xs text-zinc-400 truncate min-w-full w-0 block"
      >
        Whindersson Nunes
      </span>
    </div>
  );
}
