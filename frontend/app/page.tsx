import HeaderBar from "@/components/Header";
import {
  House,
  User,
  Group,
  MessageCircle,
  Settings,
  Handshake,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const NavLinks = [
    {
      text: "Feed",
      redirect: "/",
      icon: House,
    },
    {
      text: "Perfil",
      redirect: "/",
      icon: User,
    },
    {
      text: "Amigos",
      redirect: "/",
      icon: Group,
    },
    {
      text: "Comunidade",
      redirect: "/",
      icon: Handshake,
    },
    {
      text: "Mensagens",
      redirect: "/",
      icon: MessageCircle,
    },
    {
      text: "Configurações",
      redirect: "/",
      icon: Settings,
    },
  ];
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black gap-4">
      <HeaderBar />
      <main className="h-dvh w-full">
        <div className="flex flex-col gap-8 max-w-96">
          <div className="flex flex-col rounded-xl bg-zinc-950 overflow-hidden h-fit">
            <div className="w-full h-16 bg-purple-500 relative ">
              <div className="size-16 rounded-full border-4 border-zinc-950 flex items-center justify-center mb-3 bg-purple-500  absolute -bottom-10 left-4 ">
                <User size={32} />
              </div>
            </div>
            <div className="flex flex-col px-6 py-4 gap-4 relative pt-10">
              <div className="flex flex-col">
                <h2 className="text-lg text-purple-400 font-bold">
                  Nate higgers
                </h2>
                <span className="text-zinc-400">@Higgers_kfcnumber1</span>
              </div>
              <div className="border-t border-zinc-800 flex justify-between py-2 px-6">
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-bold">67</h3>
                  <span>Amigos</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-bold">18</h3>
                  <span>Comunidades</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-bold">6</h3>
                  <span>Mensagens</span>
                </div>
              </div>
            </div>
          </div>
          <nav className="flex flex-col py-4 px-6 gap-2 bg-zinc-950 rounded-xl">
            <h2 className="font-bold tracking-widest text-zinc-400">
              Navegação
            </h2>
            <ul className="flex flex-col gap-0.5">
              {NavLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li>
                    <Link
                      href={item.redirect}
                      className="flex gap-4 items-center justify-start py-2.5 px-4   hover:bg-purple-500/15 rounded-lg transition-colors duration-150 ease-out text-zinc-200 hover:text-purple-400"
                    >
                      <Icon />
                      <span>{item.text}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </main>
    </div>
  );
}
