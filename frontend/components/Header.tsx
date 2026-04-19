import { Search, Bell } from "lucide-react";

export default function HeaderBar() {
  return (
    <header className="flex justify-between px-16 h-16 border-b border-zinc-800 w-dvw items-center py-2">
      <div>
        <span className="text-xl font-black">
          <span className="font-mono font-light">E</span> sprokurt
        </span>
      </div>
      <div className="flex gap-2 px-4 rounded-lg border-zinc-800 border w-xl h-full items-center bg-zinc-950 ">
        <Search />
        <input
          type="text"
          className="text-sm font-medium"
          placeholder="Buscar pessoas..."
        />
      </div>
      <div className="flex gap-2 h-full items-center">
        <div className="rounded-full bg-zinc-950 h-full size-12 flex justify-center items-center border border-zinc-800 relative">
          <Bell width={20} />
          <div className="size-2.5 rounded-full absolute top-1 right-1 bg-red-400"></div>
        </div>
      </div>
    </header>
  );
}
