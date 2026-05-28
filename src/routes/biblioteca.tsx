import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { listMyExercises, createExercise, deleteExercise } from "@/lib/admin.functions";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de Exercícios — Rafael Faria" }] }),
  component: BibliotecaPage,
});

function embedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return null;
  }
}

function BibliotecaPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const list = useServerFn(listMyExercises);
  const remove = useServerFn(deleteExercise);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  if (!loading && (!user || role !== "trainer")) {
    navigate({ to: "/login", replace: true });
  }

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: () => list(),
    enabled: !!user && role === "trainer",
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-exercises"] }),
  });

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Acervo</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Biblioteca de Exercícios</h1>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]">
          + Cadastrar Exercício
        </button>
      </div>

      {isLoading && <p className="text-xs font-mono text-muted-foreground">Carregando…</p>}
      {!isLoading && exercises.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum exercício cadastrado.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal [animation-delay:100ms]">
        {exercises.map((e) => {
          const embed = embedUrl(e.video_url);
          return (
            <div key={e.id} className="group overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
              <div className="relative aspect-video border-b border-border bg-background/50">
                {embed ? (
                  <iframe src={embed} title={e.name} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sem vídeo</div>
                )}
                {e.muscle_group && (
                  <div className="absolute right-3 top-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[9px] font-mono uppercase text-primary">
                    {e.muscle_group}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-extrabold uppercase tracking-tight mb-2">{e.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{e.description ?? "—"}</p>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (confirm(`Excluir "${e.name}"?`)) del.mutate(e.id);
                    }}
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
    </Shell>
  );
}

function NewExerciseModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createExercise);
  const [form, setForm] = useState({ name: "", muscle_group: "", description: "", video_url: "" });
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-exercises"] });
      onClose();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">Novo Exercício</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            mut.mutate();
          }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Grupo muscular" value={form.muscle_group} onChange={(v) => setForm({ ...form, muscle_group: v })} />
          <Field label="URL do vídeo (YouTube/Vimeo)" value={form.video_url} onChange={(v) => setForm({ ...form, video_url: v })} placeholder="https://youtube.com/watch?v=..." />
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descrição / instruções</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          {err && <p className="text-xs font-mono text-destructive uppercase">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
              {mut.isPending ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
