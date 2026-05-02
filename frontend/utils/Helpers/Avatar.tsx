export function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0).toUpperCase();
}

export type AvatarSize = "lg" | "xl" | "2xl" | "3xl";
export const SIZE_MAP: Record<
  AvatarSize,
  {
    px: number;
    text: string;
    ring: string;
    statusSize: string;
    statusPos: string;
  }
> = {
  lg: {
    px: 56,
    text: "text-base",
    ring: "ring-[2.5px]",
    statusSize: "w-3.5 h-3.5",
    statusPos: "bottom-0.5 right-0.5",
  },
  xl: {
    px: 72,
    text: "text-lg",
    ring: "ring-[3px]",
    statusSize: "w-4 h-4",
    statusPos: "bottom-1 right-1",
  },
  "2xl": {
    px: 96,
    text: "text-xl",
    ring: "ring-[3.5px]",
    statusSize: "w-5 h-5",
    statusPos: "bottom-1 right-1",
  },
  "3xl": {
    px: 128,
    text: "text-2xl",
    ring: "ring-4",
    statusSize: "w-6 h-6",
    statusPos: "bottom-1.5 right-1.5",
  },
};

export interface FallbackProps {
  name?: string;
  textClass: string;
}

export function AvatarFallback({ name, textClass }: FallbackProps) {
  const initials = getInitials(name);
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-0 flex items-center justify-center font-semibold select-none ${textClass}`}
    >
      {initials}
    </span>
  );
}
