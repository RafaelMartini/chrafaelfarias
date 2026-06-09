import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Plus, Film, Upload, Loader2, Pencil, Check, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { embedUrl } from "@/lib/video";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { listMyExercises, createExercise, updateExercise, deleteExercise } from "@/lib/admin.functions";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de Exercícios — Rafael Faria" }] }),
  component: BibliotecaPage,
});

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  video_url: string | null;
  created_at: string;
};

function BibliotecaPage() {
  const { user, role } = useRequireTrainer();
  const list = useServerFn(listMyExercises);
  const del = useServerFn(deleteExercise);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Exercise | null>(null);
  const [toDelete, setToDelete] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: () => list() as Promise<Exercise[]>,
    enabled: !!user && role === "trainer",
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-exercises"] });
      toast.success("Exercício excluído");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const groups = useMemo(
    () => ["Todos", ...Array.from(new Set(exercises.map((e) => e.muscle_group).filter(Boolean) as string[]))],
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) => (group === "Todos" || e.muscle_group === group) && (q === "" || e.name.toLowerCase().includes(q)),
    );
  }, [exercises, query, group]);

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-8 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Acervo</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Biblioteca de Exercícios</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">{exercises.length} exercício(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          <Plus className="size-4" /> Cadastrar Exercício
        </button>
      </div>

      <div className="flex flex-col gap-3 mb-6 animate-reveal [animation-delay:75ms] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar exercício…"
            className="w-full rounded-full border border-border bg-card/70 py-2.5 pl-9 pr-4 font-mono text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                group === g
                  ? "border-primary bg-primary text-primary-foreground font-bold"
                  : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-xs font-mono uppercase text-muted-foreground">Carregando…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum exercício ainda. Clique em “Cadastrar Exercício”.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal [animation-delay:100ms]">
        {filtered.map((e) => {
          const embed = embedUrl(e.video_url ?? "");
          return (
            <div key={e.id} className="group overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
              <div className="relative aspect-video border-b border-border bg-background/50">
                {embed ? (
                  <iframe src={embed} title={e.name} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : e.video_url ? (
                  <video src={e.video_url} controls className="h-full w-full bg-black" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sem vídeo</div>
                )}
                {e.muscle_group && (
                  <div className="absolute right-3 top-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[9px] font-mono uppercase text-primary backdrop-blur-md">
                    {e.muscle_group}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-extrabold uppercase tracking-tight mb-2 flex items-center gap-2">
                  {e.name}
                  {(embed || e.video_url) && <Film className="size-3.5 shrink-0 text-primary" />}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{e.description || "—"}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setToEdit(e)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary"
                  >
                    <Pencil className="size-3" /> Editar
                  </button>
                  <button
                    onClick={() => setToDelete(e)}
                    className="flex flex-1 items-center justify-center rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-destructive hover:bg-secondary hover:text-destructive"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && <ExerciseModal onClose={() => setOpen(false)} />}
      {toEdit && <ExerciseModal exercise={toEdit} onClose={() => setToEdit(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir exercício"
        description={toDelete ? `"${toDelete.name}" será removido da sua biblioteca.` : ""}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (toDelete) delMut.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </Shell>
  );
}

function ExerciseModal({ exercise, onClose }: { exercise?: Exercise; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const create = useServerFn(createExercise);
  const update = useServerFn(updateExercise);
  const isEdit = !!exercise;
  const [form, setForm] = useState({
    name: exercise?.name ?? "",
    muscle_group: exercise?.muscle_group ?? "",
    description: exercise?.description ?? "",
    video_url: exercise?.video_url ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  // Todo vídeo agora é arquivo enviado pra nuvem (sem mais colar link de YouTube/Vimeo).
  const isUploaded = !!form.video_url;

  const mut = useMutation({
    mutationFn: () =>
      isEdit ? update({ data: { id: exercise!.id, ...form } }) : create({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-exercises"] });
      toast.success(isEdit ? "Exercício atualizado" : "Exercício cadastrado", { description: form.name });
      onClose();
    },
    onError: (e: Error) => toast.error(isEdit ? "Erro ao salvar" : "Erro ao cadastrar", { description: e.message }),
  });

  const onUpload = async (file: File) => {
    if (!user) return;
    // Aceita por mime OU por extensão — alguns .mov/.mp4 chegam com file.type vazio.
    const okType = file.type.startsWith("video/");
    const okExt = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|qt|ogv|hevc)$/i.test(file.name);
    if (!okType && !okExt) {
      toast.error("Selecione um arquivo de vídeo");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const APIKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const contentType = file.type || mimeForExt(ext);
      const path = `${user.id}/${Date.now()}.${ext}`;

      // XHR direto no Storage pra ter evento de progresso (o supabase.upload não expõe %).
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${SUPA_URL}/storage/v1/object/exercise-videos/${path}`);
        xhr.setRequestHeader("authorization", `Bearer ${token}`);
        xhr.setRequestHeader("apikey", APIKEY);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("content-type", contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(
                xhr.status === 413
                  ? "Vídeo muito grande — reduza o tamanho ou aumente o limite no Supabase"
                  : `Upload falhou (${xhr.status})`,
              ));
        xhr.onerror = () => reject(new Error("Erro de rede no upload"));
        xhr.send(file);
      });

      const { data } = supabase.storage.from("exercise-videos").getPublicUrl(path);
      setForm((f) => ({ ...f, video_url: data.publicUrl }));
      setProgress(100);
      toast.success("Vídeo enviado");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">{isEdit ? "Editar Exercício" : "Novo Exercício"}</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Grupo muscular" value={form.muscle_group} onChange={(v) => setForm({ ...form, muscle_group: v })} placeholder="Ex: Peitoral" />

          {/* Vídeo: upload de arquivo (.mp4, .mov, etc.) */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Vídeo de execução</label>
            <input ref={fileRef} type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
            {isUploaded ? (
              // Arquivo já enviado: mostra status + preview, sem expor a URL do banco.
              <div className="mt-1 space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-primary">
                    <Check className="size-3.5" /> Vídeo enviado
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, video_url: "" }))}
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" /> Remover
                  </button>
                </div>
                <div className="overflow-hidden rounded-md border border-border bg-black aspect-video">
                  <video src={form.video_url} controls className="h-full w-full" />
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {uploading ? <><Loader2 className="size-3.5 animate-spin" /> Enviando… {progress}%</> : <><Upload className="size-3.5" /> Enviar arquivo de vídeo</>}
                </button>
                {uploading && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descrição / instruções</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={mut.isPending || uploading} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
              {mut.isPending ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Fallback de content-type quando o navegador não informa file.type (comum em .mov).
function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    qt: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    "3gp": "video/3gpp",
    ogv: "video/ogg",
    hevc: "video/mp4",
  };
  return map[ext] || "video/mp4";
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</label>
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
