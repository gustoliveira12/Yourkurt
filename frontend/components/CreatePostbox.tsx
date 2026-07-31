"use client";

import { Camera, Music, Pin, Send, SmilePlus } from "lucide-react";
import { Avatar } from "./Avatar";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/hooks/usePosts";

type CreatePostboxProps = {
  avatarUrl: string | null;
  userId: string;
  profile: { name: string; username: string; avatar_url: string | null } | null;
  onPostCreated: (post: Post) => void;
};

export default function CreatePostbox({
  avatarUrl,
  userId,
  profile,
  onPostCreated,
}: CreatePostboxProps) {
  const MAX_IMAGES = 4;
  const [content, setContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (files.length === 0) return;

    const remaining = Math.max(0, MAX_IMAGES - selectedImages.length);
    if (remaining === 0) {
      setError(`Voce pode enviar no maximo ${MAX_IMAGES} imagens por post.`);
      return;
    }

    const acceptedFiles = files.slice(0, remaining);
    setSelectedImages((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImages(supabase: ReturnType<typeof createClient>) {
    if (selectedImages.length === 0) return [] as string[];

    const uploadedUrls = await Promise.all(
      selectedImages.map(async (file, index) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/${Date.now()}-${index}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(
          `Erro ao enviar imagem (${uploadError.statusCode ?? "sem status"}): ${uploadError.message}`,
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(filePath);

      return publicUrl;
    }),
    );

    return uploadedUrls;
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if ((!trimmed && selectedImages.length === 0) || submitting) return;

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    let imageUrls: string[] = [];

    try {
      imageUrls = await uploadImages(supabase);
    } catch (uploadErr) {
      setError(
        uploadErr instanceof Error ? uploadErr.message : "Erro ao enviar imagens.",
      );
      setSubmitting(false);
      return;
    }

    const payload = {
      user_id: userId,
      content: trimmed || "[midia]",
      is_public: true,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
    };

    const buildPostSelect = (supportsMultipleImages: boolean) =>
      supportsMultipleImages
        ? "id, user_id, content, image_url, image_urls, created_at, likes_count"
        : "id, user_id, content, image_url, created_at, likes_count";

    let data: Post | null = null;
    let submitError: { message: string } | null = null;

    const primaryInsert = await supabase
      .from("posts")
      .insert(payload)
      .select(buildPostSelect(true))
      .single();

    data = primaryInsert.data as Post | null;
    submitError = primaryInsert.error;

    if (submitError && submitError.message.toLowerCase().includes("image_urls")) {
      const fallbackInsert = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: trimmed || "[midia]",
          is_public: true,
          image_url: imageUrls[0] ?? null,
        })
        .select(buildPostSelect(false))
        .single();

      data = fallbackInsert.data as Post | null;
      submitError = fallbackInsert.error;
    }

    if (submitError) {
      setError(submitError.message || "Erro ao publicar post");
    } else if (data) {
      onPostCreated({
        ...data,
        image_urls: Array.isArray(data.image_urls)
          ? data.image_urls
          : data.image_url
            ? [data.image_url]
            : [],
        profiles: profile,
      } as Post);
      setContent("");
      setSelectedImages([]);
      setError(null);
    }
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      void handleSubmit();
    }
  }

  return (
    <div className=" flex-col w-full px-6 py-4 rounded-lg bg-background-raised gap-4 max-w-lg hidden sm:flex">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-4">
        <div className="rounded-full flex items-start justify-center w-fit h-fit mt-1">
          <Avatar src={avatarUrl} />
        </div>
        <textarea
          placeholder="O que está passando pela sua órbita?"
          className="bg-background w-full rounded-xl transition-all duration-100 border border-border-base rounded-sm px-4 py-2 placeholder:text-foreground-muted text-foreground resize-none min-h-[80px] disabled:opacity-50"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          disabled={submitting}
        />
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
        accept="image/*"
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
