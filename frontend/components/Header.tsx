import { Search, Bell } from "lucide-react";

export default function HeaderBar() {
  return (
    <header className="flex justify-between px-16 h-16 border-b border-zinc-800 w-dvw items-center py-2">
      <div>
        <span className="items-end inline-flex text-xl bg-linear-to-r text-transparent bg-clip-text from-[#c892b8] via-[#9143e4] to-[#665BC5] font-black ">
          <span className="font-mono text-2xl">E</span> sprokurt
        </span>
      </div>
      <div className="flex gap-2 px-4 rounde  d-full border-zinc-800 border w-xl h-full items-center bg-zinc-950 ">
        <Search />
        <input
          type="text"
          className="text-sm font-medium w-full outline-none"
          placeholder="Buscar pessoas..."
        />
      </div>
      <div className="flex gap-2 h-full items-center">
        <div className="rounded-full bg-zinc-950 h-full size-12 flex justify-center items-center border border-zinc-800 relative hover:bg-zinc-900">
          <Bell width={20} />
          <div className="size-2.5 rounded-full absolute top-1 right-1 bg-red-400"></div>
        </div>
      </div>
    </header>
  );
}
