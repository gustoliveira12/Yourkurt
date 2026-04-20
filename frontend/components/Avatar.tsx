"use client";
import { User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
export interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
}

export default function Avatar({ src, alt, size = 40 }: AvatarProps) {
  const [error, setError] = useState(false);
  return (
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
  );
}
