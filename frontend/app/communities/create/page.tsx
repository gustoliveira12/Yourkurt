"use client";

import MobileHeader from "@/components/navigation/MobileHeader";
import MobileNav from "@/components/navigation/MobileNav";
import PageAside from "@/components/navigation/NavBar";
import ProfileSidebar from "@/components/navigation/ProfileSidebar";
import { CommunityPreview } from "@/components/communities/create/CommunityPreview";
import { ImageDropzone, useImagePreview } from "@/components/communities/create/ImageDropzone";
import { StepIndicator } from "@/components/communities/create/StepIndicator";
import { ThemePicker } from "@/components/communities/create/ThemePicker";
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  NAME_MIN,
  SLUG_MAX,
  SLUG_MIN,
  SLUG_PATTERN,
  type CommunityTheme,
  communityHref,
  slugify,
  themeLabel,
} from "@/lib/communities";
import { useCurrentProfile } from "@/lib/hooks/useCurrentProfile";
import { createClient } from "@/lib/supabase/client";
import { removeUserFiles } from "@/lib/storage";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const supabase = createClient();

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const SLUG_ERROR = `Use de ${SLUG_MIN} a ${SLUG_MAX} letras minúsculas, números ou hífens.`;

type FieldErrors = { name?: string; slug?: string; theme?: string; description?: string };

// O banco conta caracteres (não unidades UTF-16), então emoji vale 1.
const charCount = (text: string) => Array.from(text).length;

const STEPS = ["Nome e descrição", "Tema", "Visual", "Revisar"] as const;
const STEP_TITLES = ["Nome e descrição", "Escolha um tema", "Foto e capa", "Revise e envie"] as const;
const LAST_STEP = STEPS.length;

const inputClass =
  "w-full rounded-control border border-border-base bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand";

export default function CommunitiesCreatePage() {
  const router = useRouter();
  const { profile } = useCurrentProfile();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState<CommunityTheme | "">("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [header, setHeader] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<FieldErrors>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ao trocar de etapa, o foco vai para o título dela.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    titleRef.current?.focus();
  }, [step]);

  function changeName(value: string) {
    const nextSlug = slugEdited ? slug : slugify(value);
    setName(value);
    setSlug(nextSlug);
    recheck({ name: value, slug: nextSlug });
  }

  // Um erro já exibido é revalidado a cada alteração: some assim que o valor
  // fica válido e nunca aparece sobre um valor válido.
  function recheck(next: Partial<{ name: string; slug: string; description: string; theme: CommunityTheme | "" }>) {
    setErrors((current) => {
      const shown = (Object.keys(current) as (keyof FieldErrors)[]).filter((key) => current[key]);
      if (shown.length === 0) return current;
      const found = validate(shown, { name, slug, description, theme, ...next });
      const updated: FieldErrors = { ...current };
      for (const key of shown) updated[key] = found[key];
      return updated;
    });
  }

  function validate(
    fields: (keyof FieldErrors)[] = ["name", "slug", "theme", "description"],
    values: { name: string; slug: string; description: string; theme: CommunityTheme | "" } = {
      name,
      slug,
      description,
      theme,
    },
  ): FieldErrors {
    const { name, slug, description, theme } = values;
    const found: FieldErrors = {};
    const nameLength = charCount(name.trim());
    if (nameLength < NAME_MIN || nameLength > NAME_MAX) {
      found.name = `Use de ${NAME_MIN} a ${NAME_MAX} caracteres.`;
    }
    if (slug.length < SLUG_MIN || slug.length > SLUG_MAX || !SLUG_PATTERN.test(slug)) {
      found.slug = SLUG_ERROR;
    }
    if (!theme) found.theme = "Escolha um tema.";
    if (charCount(description.trim()) > DESCRIPTION_MAX) {
      found.description = `A descrição pode ter até ${DESCRIPTION_MAX} caracteres.`;
    }
    for (const key of Object.keys(found) as (keyof FieldErrors)[]) {
      if (!fields.includes(key)) delete found[key];
    }
    return found;
  }

  function goNext() {
    const found = validate(step === 1 ? ["name", "slug", "description"] : step === 2 ? ["theme"] : []);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  function goTo(target: number) {
    setFormError("");
    setStep(target);
  }

  async function uploadImage(communityId: string, kind: "avatar" | "header", original: File) {
    const compressed = await imageCompression(original, {
      maxSizeMB: kind === "avatar" ? 0.5 : 1,
      maxWidthOrHeight: kind === "avatar" ? 512 : 1920,
      useWebWorker: true,
    });
    const extension = EXTENSION_BY_MIME[compressed.type] ?? "jpg";
    const path = `${communityId}/${kind}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("community-images")
      .upload(path, compressed, { upsert: false, contentType: compressed.type });
    if (error) throw new Error(error.message);
    return supabase.storage.from("community-images").getPublicUrl(path).data.publicUrl;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (step < LAST_STEP) {
      goNext();
      return;
    }
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStep(found.name || found.slug || found.description ? 1 : 2);
      return;
    }

    setSubmitting(true);
    const cleanName = name.trim();
    const { data: created, error: insertError } = await supabase
      .from("communities")
      .insert({ name: cleanName, slug, description: description.trim() || null, theme })
      .select("id, slug")
      .single();

    if (insertError || !created) {
      if (insertError?.code === "23505") {
        setErrors({ slug: "Esse endereço já está em uso. Escolha outro." });
        setStep(1);
      } else if (insertError?.message.includes("too_many_pending_requests")) {
        setFormError("Você já tem 3 pedidos aguardando aprovação. Espere a análise de algum deles.");
      } else if (insertError?.message.includes("reserved_slug")) {
        setErrors({ slug: "Esse endereço é reservado." });
        setStep(1);
      } else {
        console.error("Erro ao criar o pedido da comunidade:", insertError);
        setFormError("Não foi possível enviar o pedido. Tente de novo.");
      }
      setSubmitting(false);
      return;
    }

    if (avatar || header) {
      let imagesSaved = false;
      try {
        // allSettled: se uma imagem falha, a outra ainda pode estar subindo; a
        // limpeza só pode listar a pasta depois que as duas terminarem.
        const [avatarResult, headerResult] = await Promise.allSettled([
          avatar ? uploadImage(created.id, "avatar", avatar) : Promise.resolve(null),
          header ? uploadImage(created.id, "header", header) : Promise.resolve(null),
        ]);
        if (avatarResult.status === "rejected") throw avatarResult.reason;
        if (headerResult.status === "rejected") throw headerResult.reason;

        const changes: { avatar_url?: string; header_url?: string } = {};
        if (avatarResult.value) changes.avatar_url = avatarResult.value;
        if (headerResult.value) changes.header_url = headerResult.value;
        const { data: updated, error: updateError } = await supabase
          .from("communities")
          .update(changes)
          .eq("id", created.id)
          .select("id");
        if (updateError) throw new Error(updateError.message);
        // A RLS não gera erro quando filtra: 0 linhas significa que não salvou.
        if (updated.length !== 1) throw new Error("Nenhuma linha atualizada.");
        imagesSaved = true;
      } catch (imageError) {
        console.error("Erro ao enviar as imagens da comunidade:", imageError);
      }

      if (!imagesSaved) {
        // Sem as imagens o pedido não deve existir: desfaz arquivos e linha.
        try {
          await removeUserFiles(supabase, "community-images", created.id);
        } catch (cleanupError) {
          console.error("Erro ao limpar as imagens:", cleanupError);
        }
        const { data: deleted, error: deleteError } = await supabase
          .from("communities")
          .delete()
          .eq("id", created.id)
          .select("id");
        if (deleteError || deleted?.length !== 1) {
          console.error("Erro ao apagar o pedido:", deleteError);
          setFormError(
            "As imagens não foram enviadas e não foi possível desfazer o pedido. Cancele-o em Comunidades → Seus pedidos.",
          );
        } else {
          setFormError("Não foi possível enviar as imagens. O pedido não foi criado; tente de novo.");
        }
        setSubmitting(false);
        return;
      }
    }

    router.push(communityHref(created.slug));
  }

  function describedBy(field: keyof FieldErrors, hint?: string) {
    return [errors[field] ? `${field}-error` : null, hint].filter(Boolean).join(" ") || undefined;
  }

  const fieldError = (field: keyof FieldErrors) =>
    errors[field] && (
      <p id={`${field}-error`} role="alert" className="mt-1 text-sm text-red-600">
        {errors[field]}
      </p>
    );

  const labelClass = "mb-1 block text-sm font-bold text-foreground";
  const avatarPreview = useImagePreview(avatar);
  const headerPreview = useImagePreview(header);
  const hasImage = Boolean(avatar || header);
  const secondary =
    "rounded-full border border-border-base px-5 py-2 text-sm font-bold text-foreground hover:bg-background-raised";

  const summary: { key: string; label: string; step: number; value: React.ReactNode }[] = [
    { key: "name", label: "Nome", step: 1, value: name.trim() },
    { key: "slug", label: "Endereço", step: 1, value: `c/${slug}` },
    { key: "description", label: "Descrição", step: 1, value: description.trim() || "Sem descrição" },
    { key: "theme", label: "Tema", step: 2, value: theme ? themeLabel(theme) : "" },
    {
      key: "images",
      label: "Imagens",
      step: 3,
      value: (
        <span className="flex items-center gap-3">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Foto escolhida" className="size-12 rounded-full object-cover" />
          ) : (
            <span>Sem foto</span>
          )}
          {headerPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={headerPreview} alt="Capa escolhida" className="h-12 w-24 rounded-control object-cover" />
          ) : (
            <span>Sem capa</span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="w-dvw min-h-dvh overflow-hidden relative flex h-screen items-center justify-center bg-background font-sans gap-4">
      <PageAside />
      <MobileHeader />
      <main className="overflow-auto h-dvh flex-1 w-full flex items-start justify-center pt-20 gap-4 sm:pt-12">
        <ProfileSidebar
          alt="Foto de perfil"
          size={1}
          name={profile?.name ?? "Carregando..."}
          at={profile?.username ?? "usuario"}
          src={profile?.avatarUrl ?? null}
          headerUrl={profile?.headerUrl}
        />
        <section className="w-full min-w-0 max-w-4xl px-3 md:px-4 pb-24 sm:pb-10">
          <div className="rounded-card overflow-hidden border border-border-base bg-surface shadow-card">
            <div className="border-b border-border-base px-5 py-5">
              <h1 className="text-xl font-black text-foreground">Criar comunidade</h1>
              <p className="mt-1 text-sm text-subtitle">
                Sua comunidade será analisada por um administrador antes de aparecer para todos.
              </p>
              <div className="mt-4">
                <StepIndicator current={step} steps={STEPS} />
              </div>
            </div>

            <form
              onSubmit={submit}
              noValidate
              onKeyDown={(event) => {
                // Enter num campo de uma etapa intermediária avança, sem enviar.
                if (event.key === "Enter" && event.target instanceof HTMLInputElement && step < LAST_STEP) {
                  event.preventDefault();
                  goNext();
                }
              }}
              className={`grid gap-6 px-5 py-5 ${step < LAST_STEP ? "md:grid-cols-[minmax(0,1fr)_18rem]" : ""}`}
            >
              <div className="min-w-0 space-y-5">
                <h2
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-lg font-black text-foreground focus:outline-none"
                >
                  {STEP_TITLES[step - 1]}
                </h2>

                {step === 1 && (
                  <>
                    <div>
                      <label htmlFor="community-name" className={labelClass}>Nome</label>
                      <input
                        id="community-name"
                        type="text"
                        value={name}
                        onChange={(event) => changeName(event.target.value)}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={describedBy("name")}
                        className={inputClass}
                      />
                      {fieldError("name")}
                    </div>

                    <div>
                      <label htmlFor="community-slug" className={labelClass}>Endereço</label>
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-sm font-semibold text-subtitle">c/</span>
                        <input
                          id="community-slug"
                          type="text"
                          value={slug}
                          onChange={(event) => {
                            setSlugEdited(true);
                            setSlug(event.target.value);
                            recheck({ slug: event.target.value });
                          }}
                          aria-invalid={Boolean(errors.slug)}
                          aria-describedby={describedBy("slug", "slug-hint")}
                          className={inputClass}
                        />
                      </div>
                      <p id="slug-hint" className="mt-1 text-xs text-subtitle">
                        Sugerido a partir do nome. Você pode editar.
                      </p>
                      {fieldError("slug")}
                    </div>

                    <div>
                      <label htmlFor="community-description" className={labelClass}>Descrição</label>
                      <textarea
                        id="community-description"
                        rows={4}
                        value={description}
                        onChange={(event) => {
                          setDescription(event.target.value);
                          recheck({ description: event.target.value });
                        }}
                        aria-invalid={Boolean(errors.description)}
                        aria-describedby={describedBy("description", "description-count")}
                        className={inputClass}
                      />
                      <p id="description-count" className="mt-1 text-right text-xs text-subtitle">
                        {charCount(description)}/{DESCRIPTION_MAX}
                      </p>
                      {fieldError("description")}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <ThemePicker
                    value={theme}
                    onChange={(value) => {
                      setTheme(value);
                      recheck({ theme: value });
                    }}
                    error={errors.theme}
                  />
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <p className="text-sm text-subtitle">Esta etapa é opcional. Você pode pular.</p>
                    <ImageDropzone label="Foto" file={avatar} onChange={setAvatar} aspect="square" />
                    <ImageDropzone label="Capa" file={header} onChange={setHeader} aspect="wide" />
                  </div>
                )}

                {step === LAST_STEP && (
                  <>
                    <dl className="divide-y divide-border-base rounded-card border border-border-base">
                      {summary.map((item) => (
                        <div key={item.key} className="px-4 py-3">
                          <dt className="text-xs font-bold uppercase tracking-wide text-subtitle">{item.label}</dt>
                          <dd className="mt-1 flex items-start justify-between gap-3 text-sm text-foreground">
                            <span className="min-w-0 break-words">{item.value}</span>
                            <button
                              type="button"
                              onClick={() => goTo(item.step)}
                              disabled={submitting}
                              className="shrink-0 font-semibold text-foreground-brand underline disabled:opacity-50"
                            >
                              Editar<span className="sr-only"> {item.label.toLowerCase()}</span>
                            </button>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="rounded-sm border border-border-base bg-background-raised p-3 text-sm text-foreground">
                      Sua comunidade será analisada por um administrador antes de aparecer para todos.
                    </p>
                    {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
                  </>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {step > 1 ? (
                    <button type="button" onClick={() => goTo(step - 1)} disabled={submitting} className={secondary}>
                      Voltar
                    </button>
                  ) : (
                    <Link href="/communities" className={secondary}>
                      Cancelar
                    </Link>
                  )}
                  {step < LAST_STEP ? (
                    <button
                      key="next"
                      type="button"
                      onClick={goNext}
                      className="rounded-full px-5 py-2 text-sm font-bold btn-gradient hover:brightness-110"
                    >
                      {step === 3 && !hasImage ? "Pular" : "Próximo"}
                    </button>
                  ) : (
                    <button
                      key="send"
                      type="submit"
                      disabled={submitting}
                      className="rounded-full px-5 py-2 text-sm font-bold btn-gradient hover:brightness-110 disabled:opacity-60"
                    >
                      {submitting ? "Enviando..." : "Enviar pedido"}
                    </button>
                  )}
                </div>
              </div>

              {step < LAST_STEP && (
                <div className="min-w-0 md:sticky md:top-4 md:self-start">
                  <CommunityPreview
                    name={name}
                    slug={slug}
                    description={description}
                    theme={theme}
                    avatarUrl={avatarPreview}
                    headerUrl={headerPreview}
                  />
                </div>
              )}
            </form>
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
