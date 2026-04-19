"use client";
import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
}
//TODO: CREATE HOVER | IDENTIFY POSTED STORIES
export default function Story({ src, alt, size = 40 }: AvatarProps) {
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col justify-center items-center gap-1.5 ">
      <div className="size-12 rounded-full outline-2 outline-offset-2 outline-purple-500/25 bg-purple-500/15 flex flex-col items-center justify-center text-purple-400  ">
        {!src || error ? (
          <User className="text-purple-400" size={size} />
        ) : (
          <Image
            className="h-full w-full object-cover rounded-full"
            height={size}
            width={size}
            alt={alt}
            src={src}
            onError={() => setError(true)}
          />
        )}
      </div>
      <span
        title="Whindersson Nunes"
        className="text-xs text-zinc-400 truncate min-w-full w-0 block"
      >
        Whindersson Nunes
      </span>
    </div>
  );
}
