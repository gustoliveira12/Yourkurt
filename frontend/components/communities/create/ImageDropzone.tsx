"use client";

import { ImageIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// Prévia local do arquivo. A URL nasce e é revogada no mesmo efeito: assim o
// ciclo montar/desmontar/montar do StrictMode não deixa uma URL já revogada
// em uso.
export function useImagePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

type Props = {
  label: string;
  file: File | null;
  onChange(file: File | null): void;
  aspect: "square" | "wide";
};

export function ImageDropzone({ label, file, onChange, aspect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const preview = useImagePreview(file);

  function accept(candidate: File | undefined) {
    if (!candidate) return;
    if (!ACCEPTED.includes(candidate.type)) {
      setError("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    setError("");
    onChange(candidate);
  }

  function open() {
    inputRef.current?.click();
  }

  return (
    <div>
      <p className="mb-1 text-sm font-bold text-foreground">{label}</p>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}: ${file ? "trocar imagem" : "escolher ou soltar uma imagem"}`}
        aria-describedby={error ? errorId : undefined}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files[0]);
        }}
        className={`group relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground-brand ${
          aspect === "square" ? "mx-auto size-36 rounded-full" : "h-32 w-full rounded-card"
        } ${dragging ? "border-foreground-brand bg-background-raised" : "border-border-base bg-surface hover:bg-background-raised"}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`Prévia: ${label}`} className="size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 px-3 text-center text-xs text-subtitle">
            <ImageIcon size={28} aria-hidden="true" />
            <span className="font-bold text-foreground">Arraste ou clique</span>
            <span>JPG, PNG ou WebP</span>
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            accept(event.target.files?.[0]);
            // Permite escolher o mesmo arquivo de novo depois de remover.
            event.target.value = "";
          }}
        />
      </div>
      {file && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setError("");
              onChange(null);
            }}
            className="rounded-full border border-border-base px-3 py-1 text-xs font-bold text-foreground hover:bg-background-raised"
          >
            Remover<span className="sr-only"> {label.toLowerCase()}</span>
          </button>
        </div>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
