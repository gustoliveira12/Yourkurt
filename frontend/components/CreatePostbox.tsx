"use client";

import { Camera, Music, Pin, Send, SmilePlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import type { Post, PostMedia } from "@/lib/hooks/usePosts";

type CreatePostboxProps = {
  avatarUrl: string | null;
  userId: string;
  profile: { name: string; username: string; avatar_url: string | null } | null;
  onPostCreated: (post: Post) => void;
};

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type PostingIdentity = {
  id: string;
  type: "profile" | "team";
  name: string;
  username: string;
  avatar_url: string | null;
};

type RawMembership = {
  team_page_id: string;
  can_post: boolean;
  team_pages:
    | {
        id: string;
        name: string;
        slug: string;
        avatar_url: string | null;
      }
    | {
        id: string;
        name: string;
        slug: string;
        avatar_url: string | null;
      }[]
    | null;
};

export default function CreatePostbox({
  avatarUrl,
  userId,
  profile,
  onPostCreated,
}: CreatePostboxProps) {
  const MAX_IMAGES = 4;
  const profileIdentity = useMemo<PostingIdentity | null>(() => {
    if (!profile) return null;

    return {
      id: userId,
      type: "profile",
      name: profile.name,
      username: profile.username || "usuario",
      avatar_url: profile.avatar_url,
    };
  }, [profile, userId]);

  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [teamIdentities, setTeamIdentities] = useState<PostingIdentity[]>([]);
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const imagePreviews = useMemo(
    () => selectedImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [selectedImages],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

  useEffect(() => {
    async function loadPostingIdentities() {
      if (!userId) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("team_memberships")
        .select("team_page_id, can_post, team_pages(id, name, slug, avatar_url)")
        .eq("user_id", userId)
        .eq("can_post", true);

      if (error || !data) {
        setTeamIdentities([]);
        return;
      }

      const mapped: PostingIdentity[] = [];

      (data as unknown as RawMembership[]).forEach((membership) => {
        const rawTeam = Array.isArray(membership.team_pages)
          ? membership.team_pages[0]
          : membership.team_pages;

        if (!rawTeam) return;

        mapped.push({
          id: rawTeam.id,
          type: "team",
          name: rawTeam.name,
          username: rawTeam.slug,
          avatar_url: rawTeam.avatar_url,
        });
      });

      setTeamIdentities(mapped);
    }

    void loadPostingIdentities();
  }, [userId]);

  const postingIdentities = useMemo(() => {
    const identities: PostingIdentity[] = [];
    if (profileIdentity) identities.push(profileIdentity);
    identities.push(...teamIdentities);
    return identities;
  }, [profileIdentity, teamIdentities]);

  const selectedIdentity = useMemo(
    () =>
      postingIdentities.find((identity) => identity.id === selectedIdentityId) ??
      postingIdentities[0] ??
      null,
    [postingIdentities, selectedIdentityId],
  );

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (files.length === 0) return;

    const remaining = Math.max(0, MAX_IMAGES - selectedImages.length);
    if (remaining === 0) {
      setError(`Você pode enviar no máximo ${MAX_IMAGES} imagens por post.`);
      return;
    }

    const acceptedFiles = files.slice(0, remaining);
    setSelectedImages((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadPostMedia(
    supabase: ReturnType<typeof createClient>,
    postId: string,
  ) {
    const results = await Promise.allSettled(
      selectedImages.map(async (original, index) => {
        const compressed = await imageCompression(original, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        const extension = EXTENSION_BY_MIME[compressed.type] ?? "jpg";
        const storagePath = `${userId}/${postId}/${Date.now()}-${index}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(storagePath, compressed, {
            upsert: false,
            contentType: compressed.type,
          });

        if (uploadError) throw new Error(uploadError.message);
        return storagePath;
      }),
    );

    const paths = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    let failed = results.length - paths.length;
    let media: PostMedia[] = [];

    if (paths.length > 0) {
      const { data, error: mediaError } = await supabase
        .from("post_media")
        .insert(
          paths.map((storage_path) => ({
            post_id: postId,
            storage_path,
            media_type: "image" as const,
          })),
        )
        .select("id, post_id, storage_path, media_type, created_at");

      if (mediaError || !data) {
        // Files were uploaded but not registered: remove them to avoid orphans.
        await supabase.storage.from("post-images").remove(paths);
        failed = results.length;
      } else {
        media = data as PostMedia[];
      }
    }

    return { media, failed };
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if ((!trimmed && selectedImages.length === 0) || submitting || !selectedIdentity) return;

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    // 1) Save the post first (text only) so nothing is uploaded for a failed post.
    const { data, error: submitError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        author_team_page_id: selectedIdentity.type === "team" ? selectedIdentity.id : null,
        content: trimmed || "[midia]",
        is_public: true,
      })
      .select("id, user_id, author_team_page_id, content, created_at, likes_count")
      .single();

    if (submitError || !data) {
      setError(submitError?.message || "Erro ao publicar post");
      setSubmitting(false);
      return;
    }

    // 2) + 3) Upload compressed images, then register them in post_media.
    let media: PostMedia[] = [];
    let uploadFailed = false;
    if (selectedImages.length > 0) {
      try {
        const result = await uploadPostMedia(supabase, data.id);
        media = result.media;
        uploadFailed = result.failed > 0;
      } catch {
        uploadFailed = true;
      }
    }

    if (uploadFailed) {
      const { error: rollbackError } = await supabase
        .from("posts")
        .delete()
        .eq("id", data.id);

      if (rollbackError) {
        setError(
          `Falha ao enviar mídia e ao desfazer o post: ${rollbackError.message}`,
        );
      } else {
        setError("Falha ao enviar mídia. O post foi removido automaticamente.");
      }

      setSubmitting(false);
      return;
    }

    onPostCreated({
      ...(data as Omit<Post, "community_id" | "media" | "profiles">),
      community_id: null,
      media: media.map((item) => ({
        ...item,
        public_url: supabase.storage.from("post-images").getPublicUrl(item.storage_path)
          .data.publicUrl,
      })),
      profiles: {
        name: selectedIdentity.name,
        username: selectedIdentity.username,
        avatar_url: selectedIdentity.avatar_url,
      },
    });

    setContent("");
    setSelectedImages([]);
    setError(null);
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      void handleSubmit();
    }
  }

  return (
    <div className=" flex-col w-full px-6 py-4 rounded-card bg-surface shadow-card gap-4 max-w-lg hidden sm:flex">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <div className="rounded-full flex items-start justify-center w-fit h-fit mt-1">
          <Avatar src={selectedIdentity?.avatar_url ?? avatarUrl} />
        </div>
        <div className="w-full flex flex-col gap-2">
          {postingIdentities.length > 1 && (
            <label className="flex items-center gap-2 text-xs text-subtitle">
              <span>Publicar como</span>
              <select
                className="rounded-md border border-border-base bg-background px-2 py-1 text-sm text-foreground"
                value={selectedIdentity?.id ?? ""}
                onChange={(e) => setSelectedIdentityId(e.target.value)}
                disabled={submitting}
              >
                {postingIdentities.map((identity) => (
                  <option key={identity.id} value={identity.id}>
                    {identity.type === "team" ? `Equipe: ${identity.name}` : `Perfil: ${identity.name}`}
                  </option>
                ))}
              </select>
            </label>
          )}
          <textarea
            placeholder="O que está passando pela sua órbita?"
            className="bg-background-raised w-full rounded-control transition-all duration-100 border border-border-base px-4 py-2 placeholder:text-foreground-muted text-foreground resize-none min-h-[80px] disabled:opacity-50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            disabled={submitting}
          />
        </div>
      </div>

      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {imagePreviews.map(({ file, url }, index) => (
            <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-border-base bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Preview ${index + 1}`} className="h-32 w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs font-bold text-white"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleImageSelect}
      />

      <div className="flex gap-4 h-10">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:bg-purple-200 hover:border-purple-600  dark:hover:border-purple-400 dark:hover:bg-purple-500/10 transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera
              size={18}
              className="dark:text-purple-400 text-purple-600"
            />
            <span className="hidden md:flex">Foto</span>
          </button>
          <button
            disabled={submitting}
            className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:bg-emerald-100 hover:border-emerald-600 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/10 transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Music
              className="dark:text-emerald-500 text-emerald-600"
              size={16}
            />
            <span className="hidden md:flex">Música</span>
          </button>
          <button
            disabled={submitting}
            className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:border-red-500 hover:bg-red-200 dark:hover:border-red-400 dark:hover:bg-red-500/10 transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pin className="dark:text-red-400 text-red-600" size={16} />
            <span className="hidden md:flex">Local</span>
          </button>
          <button
            disabled={submitting}
            className="justify-center aspect-square md:aspect-auto text-sm font-medium flex border border-border-base text-foreground rounded-sm px-2 h-full gap-2 items-center hover:border-yellow-700 dark:hover:border-yellow-500 hover:bg-yellow-200 dark:hover:bg-yellow-500/10 transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SmilePlus
              strokeWidth={3}
              className="text-yellow-600 dark:text-yellow-400"
              size={16}
            />
            <span className="hidden md:flex">Humor</span>
          </button>
        </div>
        <button
          onClick={() => void handleSubmit()}
          disabled={(!content.trim() && selectedImages.length === 0) || submitting}
          className="aspect-square md:aspect-auto brightness-90 flex justify-center items-center h-full w-12 gradient-to-l rounded-sm font-bold text-foreground hover:brightness-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-150"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
