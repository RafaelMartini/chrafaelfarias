import { useRef, type ReactNode } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";

/**
 * Moldura de foto "tipo retrato" reutilizável (anamnese e comparação física).
 * Mostra a imagem (URL assinada) ou um placeholder clicável que abre o seletor
 * de arquivo. `readOnly` esconde os controles (usado na visão do admin).
 */
export function PhotoFrame({
  url,
  label,
  onPick,
  onRemove,
  uploading = false,
  readOnly = false,
  children,
}: {
  url: string | null;
  label: string;
  onPick?: (file: File) => void;
  onRemove?: () => void;
  uploading?: boolean;
  readOnly?: boolean;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {!readOnly && url && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
            title="Remover foto"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={readOnly || uploading}
        onClick={() => inputRef.current?.click()}
        className={`group relative aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-background/40 transition-colors ${
          url ? "border-border" : "border-dashed border-border"
        } ${readOnly ? "cursor-default" : "hover:border-primary"}`}
      >
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Camera className="size-7" />
            <span className="text-[10px] font-mono uppercase tracking-widest">
              {readOnly ? "Sem foto" : "Adicionar"}
            </span>
          </span>
        )}

        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-primary">
            <Loader2 className="size-6 animate-spin" />
          </span>
        )}
        {!readOnly && url && !uploading && (
          <span className="absolute inset-0 hidden items-center justify-center bg-background/60 text-[10px] font-mono uppercase tracking-widest text-foreground group-hover:flex">
            Trocar foto
          </span>
        )}
      </button>

      {children}

      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && onPick) onPick(f);
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
}
