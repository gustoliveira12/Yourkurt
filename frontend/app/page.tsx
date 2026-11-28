"use client";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { usePosts } from "@/lib/hooks/usePosts";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import PostCard from "@/components/UserPost";
import RightNavbar from "@/components/PostComposer";
import MobileNav from "@/components/navigation/MobileNav";
import MobileHeader from "@/components/navigation/MobileHeader";

export default function Home() {
  const { profile } = useCurrentProfile();
  const { posts, loading, error, addPost, deletePost, deletingPostId } = usePosts();

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-2">
      <PageAside />
      <MobileHeader />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-6 sm:pt-12 xl:pr-4">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />
        <div className="flex min-w-0 max-w-174 flex-1 flex-col items-center md:gap-12 md:px-3">
          <div className="flex w-full flex-col gap-4">
            <h1 className="sr-only">Feed</h1>
            {/* Abaixo de xl (1280px) não cabem três colunas: a caixa de post vai para o topo do feed, na largura dele. */}
            <RightNavbar onPostCreated={addPost} className="flex px-2 md:px-0 xl:hidden" fullWidth />
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
                canDelete={
                  post.user_id === profile?.id ||
                  (Boolean(profile?.isAdmin) && post.community_id !== null)
                }
                deleting={deletingPostId === post.id}
                onDelete={deletePost}
                detailHref={`/post/${post.id}`}
              />
            ))}
          </div>
        </div>
        <RightNavbar onPostCreated={addPost} className="hidden w-80 shrink-0 xl:flex" />
      </main>
      <MobileNav />
    </div>
  );
}
