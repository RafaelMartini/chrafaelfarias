import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Film, Eye, RotateCcw } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePlan, type PlanExercise } from "@/lib/training-plan";
import { embedUrl } from "@/lib/video";

export const Route = createFileRoute("/montar-treino")({
  head: () => ({ meta: [{ title: "Montar Treino — Rafael Faria" }] }),
  component: MontarTreinoPage,
});

const emptyForm = { name: "", videoUrl: "", description: "", sets: 3, reps: "10-12", load: "", rest: "60s" };

function MontarTreinoPage() {
  const { plan, setWorkoutName, addExercise, removeExercise, reset } = usePlan();
  const [selectedIdx, setSelectedIdx] = useState(1); // Segunda
  const [form, setForm] = useState(emptyForm);
  const [confirmReset, setConfirmReset] = useState(false);

  const day = plan[selectedIdx];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addExercise(day.dayId, {
      name: form.name.trim(),
      videoUrl: form.videoUrl.trim(),
      description: form.description.trim(),
      sets: Number(form.sets),
      reps: form.reps.trim() || "—",
      load: form.load.trim() || "—",
      rest: form.rest.trim() || "—",
    });
    toast.success("Exercício adicionado", { description: `${form.name} — ${day.dayName.toLowerCase()}` });
    setForm(emptyForm);
  };

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-8 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Treinador · Demonstração</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Montar Plano de Treino</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Monte o treino de cada dia, com vídeo de cada exercício. O aluno vê em “Meu Treino”.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <RotateCcw className="size-3.5" /> Restaurar exemplo
          </button>
          <Link
            to="/aluno"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Eye className="size-4" /> Ver como aluno
          </Link>
        </div>
      </div>

      {/* Seletor de dia */}
      <div className="flex gap-2 flex-wrap mb-8 animate-reveal [animation-delay:100ms]">
        {plan.map((d, i) => {
          const active = i === selectedIdx;
          return (
            <button
              key={d.dayId}
              onClick={() => setSelectedIdx(i)}
              className={`rounded-full border px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground font-bold" : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"
              }`}
            >
              {d.dayName.slice(0, 3)}
              {d.exercises.length > 0 && <span className="ml-1 opacity-70">· {d.exercises.length}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-reveal [animation-delay:150ms]">
        {/* Coluna: treino do dia */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nome do treino — {day.dayName}</label>
            <input
              value={day.workoutName}
              onChange={(e) => setWorkoutName(day.dayId, e.target.value)}
              placeholder="Ex: Lower Body Alpha (deixe vazio para dia de descanso)"
              className="mt-1 w-full rounded-2xl border border-border bg-card/70 px-4 py-3 font-extrabold uppercase tracking-tight outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            {day.exercises.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum exercício neste dia. Adicione ao lado →</p>
              </div>
            )}
            {day.exercises.map((ex, i) => (
              <ExerciseRow key={ex.id} index={i} exercise={ex} onRemove={() => {
                removeExercise(day.dayId, ex.id);
                toast("Exercício removido");
              }} />
            ))}
          </div>
        </div>

        {/* Coluna: adicionar exercício */}
        <div className="lg:col-span-5">
          <form onSubmit={submit} className="sticky top-24 space-y-3 rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="text-lg font-extrabold uppercase tracking-tight flex items-center gap-2">
              <Plus className="size-4 text-primary" /> Adicionar exercício
            </h2>

            <Field label="Nome do exercício *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Ex: Agachamento Livre" />
            <Field label="URL do vídeo (YouTube/Vimeo)" value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} placeholder="https://youtube.com/watch?v=..." />
            {form.videoUrl && (
              embedUrl(form.videoUrl) ? (
                <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-primary"><Film className="size-3" /> vídeo válido — o aluno verá o player</p>
              ) : (
                <p className="text-[10px] font-mono uppercase text-destructive">URL de vídeo não reconhecida</p>
              )
            )}

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Instruções</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Dica de execução…"
                className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumField label="Séries" value={form.sets} onChange={(v) => setForm({ ...form, sets: v })} />
              <Field label="Reps" value={form.reps} onChange={(v) => setForm({ ...form, reps: v })} placeholder="10-12" />
              <Field label="Carga" value={form.load} onChange={(v) => setForm({ ...form, load: v })} placeholder="60kg" />
              <Field label="Descanso" value={form.rest} onChange={(v) => setForm({ ...form, rest: v })} placeholder="60s" />
            </div>

            <button type="submit" className="w-full rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02]">
              Adicionar ao treino de {day.dayName.toLowerCase()}
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Restaurar plano de exemplo"
        description="Isto descarta as alterações e volta ao plano de demonstração."
        confirmLabel="Restaurar"
        destructive
        onConfirm={() => {
          reset();
          toast("Plano restaurado");
          setConfirmReset(false);
        }}
      />
    </Shell>
  );
}

function ExerciseRow({ index, exercise, onRemove }: { index: number; exercise: PlanExercise; onRemove: () => void }) {
  const hasVideo = !!embedUrl(exercise.videoUrl);
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background/40 p-3 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] font-mono text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <p className="font-bold uppercase tracking-tight text-sm truncate flex items-center gap-2">
            {exercise.name}
            {hasVideo && <Film className="size-3 shrink-0 text-primary" />}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground">
            {exercise.sets}x{exercise.reps}
            {exercise.load && exercise.load !== "—" && ` · ${exercise.load}`}
            {exercise.rest && exercise.rest !== "—" && ` · ${exercise.rest}`}
          </p>
        </div>
      </div>
      <button onClick={onRemove} title="Remover" className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
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

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type="number"
        min={1}
        max={20}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
