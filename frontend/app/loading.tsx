export default function Loading() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-background">
      <span className="gradient-to-l bg-clip-text text-4xl font-black tracking-wide text-transparent">
        Yourkurt
      </span>
      <div className="flex items-center gap-2">
        <span className="size-3 animate-bounce rounded-full bg-background-brand [animation-delay:-0.3s]" />
        <span className="size-3 animate-bounce rounded-full bg-background-brand [animation-delay:-0.15s]" />
        <span className="size-3 animate-bounce rounded-full bg-background-brand" />
      </div>
      <span className="text-sm text-subtitle">Carregando sua experiência...</span>
    </div>
  );
}
