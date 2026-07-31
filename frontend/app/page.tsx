"use client";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { usePosts } from "@/lib/hooks/usePosts";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import PostCard from "@/components/UserPost";
import RightNavbar from "@/components/PostComposer";
import Story from "@/components/Stories";
import {
  HouseIcon,
  UsersIcon,
  UserIcon,
  UsersFourIcon,
  ChatIcon,
  GearSixIcon,
  GameControllerIcon,
  MusicNotesIcon,
  BookIcon,
  AirplaneIcon,
} from "@phosphor-icons/react";
import MobileNav from "@/components/navigation/MobileNav";
import MobileHeader from "@/components/navigation/MobileHeader";

const NAV_ITEMS = [
  {
    label: "Feed",
    to: "/",
    icon: HouseIcon,
  },
  {
    label: "Perfil",
    to: "/perfil",
    icon: UserIcon,
  },
  {
    label: "Amigos",
    to: "/friends",
    icon: UsersIcon,
  },
  {
    label: "Comunidade",
    to: "/communities",
    icon: UsersFourIcon,
  },
  {
    label: "Mensagens",
    to: "/messages",
    icon: ChatIcon,
  },
  {
    label: "Configurações",
    to: "/settings",
    icon: GearSixIcon,
  },
];

export default function Home() {
  const { profile } = useCurrentProfile();
  const { posts, loading, error, addPost, deletePost, deletingPostId } = usePosts();

  const feedStoryNames = Array.from(
    new Set(
      posts
        .map((post) => post.profiles?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  )
    .filter((name) => name !== profile?.name)
    .slice(0, 6);

  const Comunnities = [
    {
      text: "GamersBr",
      redirect: "/",
      icon: GameControllerIcon,
      color: "rose",
    },
    {
      text: "Indie Music",
      redirect: "/",
      icon: MusicNotesIcon,
      color: "emerald",
    },
    {
      text: "Clube do livro",
      redirect: "/",
      icon: BookIcon,
      color: "sky",
    },
    {
      text: "Mochileiros",
      redirect: "/",
      icon: AirplaneIcon,
      color: "amber",
    },
  ];

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside items={NAV_ITEMS} />
      <MobileHeader />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="string"
          size={1}
          prop={NAV_ITEMS}
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />
        <div className="flex flex-col md:gap-12 items-center md:min-w-152 md:px-4">
          <div className="flex flex-col w-full ">
            <div className="flex md:gap-6 justify-start items-center max-w-dvw lg:max-w-176 overflow-hidden px-2">
              <Story
                key={`story-${profile?.id}`}
                hasStory
                name={profile?.name ?? "Usuário"}
                src={profile?.avatarUrl ?? null}
              />
              {feedStoryNames.map((name, index) => (
                <Story
                  key={`story-feed-${index}`}
                  hasStory
                  name={name}
                  src={null}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col w-full gap-4 max-w-xl">
            {loading && (
              <p className="text-center text-foreground-muted py-8">Carregando posts...</p>
            )}
            {error && (
              <p className="text-center text-red-600 py-2 text-sm">{error}</p>
            )}
            {!loading && posts.length === 0 && (
              <p className="text-center text-foreground-muted py-8">Nenhum post ainda. Seja o primeiro!</p>
            )}
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                canDelete={post.user_id === profile?.id}
                deleting={deletingPostId === post.id}
                onDelete={deletePost}
                detailHref={`/post/${post.id}`}
              />
            ))}
          </div>
        </div>
        <RightNavbar prop={Comunnities} onPostCreated={addPost} />
      </main>
      <MobileNav />
    </div>
  );
}
