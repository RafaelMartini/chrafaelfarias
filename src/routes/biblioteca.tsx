import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Film } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { embedUrl } from "@/lib/video";
import { useExercises, type MockExercise } from "@/lib/exercises-store";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de Exercícios — Rafael Faria" }] }),
  component: BibliotecaPage,
});

function BibliotecaPage() {
  const { exercises, remove } = useExercises();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MockExercise | null>(null);

  const groups = useMemo(() => ["Todos", ...Array.from(new Set(exercises.map((e) => e.muscleGroup).filter(Boolean)))], [exercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) => (group === "Todos" || e.muscleGroup === group) && (q === "" || e.name.toLowerCase().includes(q)),
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

      {/* Busca + filtro por grupo */}
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

      {filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum exercício encontrado.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal [animation-delay:100ms]">
        {filtered.map((e) => {
          const embed = embedUrl(e.videoUrl);
          return (
            <div key={e.id} className="group overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
              <div className="relative aspect-video border-b border-border bg-background/50">
                {embed ? (
                  <iframe src={embed} title={e.name} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sem vídeo</div>
                )}
                {e.muscleGroup && (
                  <div className="absolute right-3 top-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[9px] font-mono uppercase text-primary backdrop-blur-md">
                    {e.muscleGroup}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-extrabold uppercase tracking-tight mb-2 flex items-center gap-2">
                  {e.name}
                  {embed && <Film className="size-3.5 shrink-0 text-primary" />}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{e.description || "—"}</p>
                <div className="mt-4">
                  <button
                    onClick={() => setToDelete(e)}
                    className="w-full rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-destructive hover:bg-secondary hover:text-destructive"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && <NewExerciseModal onClose={() => setOpen(false)} />}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir exercício"
        description={toDelete ? `"${toDelete.name}" será removido da sua biblioteca.` : ""}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete.id);
            toast.success("Exercício excluído", { description: toDelete.name });
          }
          setToDelete(null);
        }}
      />
    </Shell>
  );
}

function NewExerciseModal({ onClose }: { onClose: () => void }) {
  const { add } = useExercises();
  const [form, setForm] = useState({ name: "", muscleGroup: "", description: "", videoUrl: "" });
  const embed = embedUrl(form.videoUrl);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">Novo Exercício</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(form);
            toast.success("Exercício cadastrado", { description: form.name });
            onClose();
          }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Grupo muscular" value={form.muscleGroup} onChange={(v) => setForm({ ...form, muscleGroup: v })} placeholder="Ex: Peitoral" />
          <Field label="URL do vídeo (YouTube/Vimeo)" value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} placeholder="https://youtube.com/watch?v=..." />
          {form.videoUrl && (
            embed ? (
              <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-primary"><Film className="size-3" /> vídeo válido</p>
            ) : (
              <p className="text-[10px] font-mono uppercase text-destructive">URL de vídeo não reconhecida</p>
            )
          )}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descrição / instruções</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Cancelar</button>
            <button type="submit" className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground">Cadastrar</button>
          </div>
        </form>
      </div>
    </div>
  );
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
