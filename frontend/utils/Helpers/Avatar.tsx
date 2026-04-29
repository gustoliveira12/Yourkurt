export function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0).toUpperCase();
}

export type AvatarSize = "sm" | "md" | "lg";
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
  sm: {
    px: 32,
    text: "text-xs",
    ring: "ring-2",
    statusSize: "w-2.5 h-2.5",
    statusPos: "bottom-0 right-0",
  },
  md: {
    px: 40,
    text: "text-sm",
    ring: "ring-2",
    statusSize: "w-3 h-3",
    statusPos: "bottom-0 right-0",
  },
  lg: {
    px: 56,
    text: "text-base",
    ring: "ring-[2.5px]",
    statusSize: "w-3.5 h-3.5",
    statusPos: "bottom-0.5 right-0.5",
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
