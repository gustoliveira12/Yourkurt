"use client";

import { AvatarFallback, AvatarSize, SIZE_MAP } from "@/utils/Helpers/Avatar";
import Image from "next/image";
import { useState } from "react";

export interface AvatarProps {
  src?: string | null;
  name?: string;
  sizes?: AvatarSize;
  className?: string;
  quality?: number;
}

export function Avatar({
  src,
  name,
  sizes = "lg",
  className = "",
  quality = 95,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!src && !imgError;

  const { px, text, ring, statusSize, statusPos } = SIZE_MAP[sizes];

  return (
    <span
      role="img"
      aria-label={name ?? "User avatar"}
      className={`
        relative inline-flex shrink-0 items-center justify-center
        overflow-hidden rounded-full
        ${ring} ring-white/10 dark:ring-white/10
        bg-zinc-200 dark:bg-zinc-700
        ${className}
      `}
      style={{ width: px, height: px }}
    >
      <AvatarFallback name={name} textClass={text} />

      {showImage && (
        <div className="rounded-full">
          <Image
            src={src}
            alt={name ?? "User avatar"}
            fill
            sizes={`${px}px`}
            quality={quality}
            className="object-cover "
            onError={() => setImgError(true)}
          />
        </div>
      )}
    </span>
  );
}
