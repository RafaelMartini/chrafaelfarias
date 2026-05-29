import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useRequireTrainer } from "@/hooks/use-require-role";
import {
  getStudentWithWorkouts,
  createWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  removeExerciseFromWorkout,
  listMyExercises,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/alunos/$studentId")({
  head: () => ({ meta: [{ title: "Treinos do Aluno — Rafael Faria" }] }),
  component: StudentDetailPage,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function StudentDetailPage() {
  const { studentId } = Route.useParams();
  const { user, role } = useRequireTrainer();
  const get = useServerFn(getStudentWithWorkouts);
  const listEx = useServerFn(listMyExercises);

  const { data, isLoading, error } = useQuery({
    queryKey: ["student-workouts", studentId],
    queryFn: () => get({ data: { studentId } }),
    enabled: !!user && role === "trainer",
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: () => listEx(),
    enabled: !!user && role === "trainer",
  });

  const [showNew, setShowNew] = useState(false);

  if (isLoading) return <Shell mode="admin"><p className="text-xs font-mono">Carregando…</p></Shell>;
  if (error) return <Shell mode="admin"><p className="text-xs font-mono text-destructive">{(error as Error).message}</p></Shell>;
  if (!data) return null;

  const { student, workouts, items } = data;

  return (
    <Shell mode="admin">
      <Link to="/alunos" className="text-[10px] font-mono uppercase text-muted-foreground hover:text-primary">← Alunos</Link>

      <div className="mt-4 flex items-end justify-between flex-wrap gap-4 mb-10 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Aluno</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">{student.display_name}</h1>
          {student.goal && <p className="mt-2 text-xs font-mono uppercase text-muted-foreground">Objetivo: {student.goal}</p>}
        </div>
        <button onClick={() => setShowNew(true)} className="rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]">
          + Novo Treino
        </button>
      </div>

      {workouts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum treino criado. Comece adicionando um treino e atribuindo um dia da semana.</p>
        </div>
      )}

      <div className="space-y-6">
        {workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            items={items.filter((i) => i.workout_id === w.id)}
            exercises={exercises}
          />
        ))}
      </div>

      {showNew && <NewWorkoutModal studentId={studentId} onClose={() => setShowNew(false)} />}
    </Shell>
  );
}

function WorkoutCard({
  workout,
  items,
  exercises,
}: {
  workout: { id: string; name: string; notes: string | null; day_of_week: number | null };
  items: Array<{
    id: string;
    sets: number;
    reps: string;
    load_kg: number | null;
    rest_seconds: number | null;
    exercise: { id: string; name: string; video_url: string | null; muscle_group: string | null } | null;
  }>;
  exercises: Array<{ id: string; name: string }>;
}) {
  const qc = useQueryClient();
  const del = useServerFn(deleteWorkout);
  const removeItem = useServerFn(removeExerciseFromWorkout);
  const addItem = useServerFn(addExerciseToWorkout);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState({ exerciseId: "", sets: 3, reps: "10", load_kg: "", rest_seconds: 60 });

  const delMut = useMutation({
    mutationFn: () => del({ data: { id: workout.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-workouts"] });
      toast.success("Treino excluído", { description: workout.name });
    },
    onError: (e: Error) => toast.error("Erro ao excluir treino", { description: e.message }),
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => removeItem({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-workouts"] });
      toast.success("Exercício removido do treino");
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });
  const addMut = useMutation({
    mutationFn: () =>
      addItem({
        data: {
          workoutId: workout.id,
          exerciseId: form.exerciseId,
          sets: Number(form.sets),
          reps: form.reps,
          load_kg: form.load_kg === "" ? null : Number(form.load_kg),
          rest_seconds: Number(form.rest_seconds),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-workouts"] });
      toast.success("Exercício adicionado ao treino");
      setAdding(false);
      setForm({ exerciseId: "", sets: 3, reps: "10", load_kg: "", rest_seconds: 60 });
    },
  });

  return (
    <div className="rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-extrabold uppercase tracking-tight">{workout.name}</h2>
            {workout.day_of_week !== null && (
              <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[10px] font-mono uppercase text-primary">
                {DAYS[workout.day_of_week]}
              </span>
            )}
          </div>
          {workout.notes && <p className="mt-2 text-xs font-mono text-muted-foreground">{workout.notes}</p>}
        </div>
        <button
          onClick={() => setConfirmDel(true)}
          className="text-[10px] font-mono uppercase text-destructive hover:underline"
        >
          Excluir treino
        </button>
      </div>

      <div className="mt-6 space-y-2">
        {items.length === 0 && <p className="text-xs font-mono text-muted-foreground">Nenhum exercício adicionado.</p>}
        {items.map((it, i) => (
          <div key={it.id} className="flex items-center justify-between rounded-2xl border border-border bg-background/40 p-3 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <p className="font-bold uppercase tracking-tight text-sm truncate">{it.exercise?.name ?? "—"}</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {it.sets}x{it.reps}
                  {it.load_kg != null && ` · ${it.load_kg}kg`}
                  {it.rest_seconds != null && ` · ${it.rest_seconds}s descanso`}
                  {it.exercise?.video_url && (
                    <> · <a href={it.exercise.video_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">vídeo</a></>
                  )}
                </p>
              </div>
            </div>
            <button onClick={() => removeMut.mutate(it.id)} className="text-[10px] font-mono uppercase text-muted-foreground hover:text-destructive shrink-0">
              Remover
            </button>
          </div>
        ))}
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} className="mt-4 w-full rounded-full border border-dashed border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:border-primary hover:text-primary">
          + Adicionar exercício
        </button>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); addMut.mutate(); }}
          className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2 items-end rounded-2xl border border-border bg-background/40 p-3"
        >
          <div className="col-span-2 md:col-span-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Exercício</label>
            <select required value={form.exerciseId} onChange={(e) => setForm({ ...form, exerciseId: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-sm font-mono">
              <option value="">Selecionar…</option>
              {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <NumField label="Séries" value={form.sets} onChange={(v) => setForm({ ...form, sets: v })} />
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Reps</label>
            <input value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Carga (kg)</label>
            <input value={form.load_kg} onChange={(e) => setForm({ ...form, load_kg: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-sm font-mono" />
          </div>
          <NumField label="Descanso (s)" value={form.rest_seconds} onChange={(v) => setForm({ ...form, rest_seconds: v })} />
          <div className="col-span-2 md:col-span-6 flex gap-2 mt-2">
            <button type="button" onClick={() => setAdding(false)} className="flex-1 rounded-full border border-border py-2 text-[10px] font-mono uppercase">Cancelar</button>
            <button type="submit" disabled={addMut.isPending} className="flex-1 rounded-full bg-primary py-2 text-[10px] font-extrabold uppercase text-primary-foreground disabled:opacity-50">
              {addMut.isPending ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
          {addMut.error && <p className="col-span-full text-xs text-destructive font-mono">{(addMut.error as Error).message}</p>}
        </form>
      )}

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Excluir treino"
        description={`"${workout.name}" e todos os seus exercícios serão removidos.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          delMut.mutate();
          setConfirmDel(false);
        }}
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase text-muted-foreground">{label}</label>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-sm font-mono" />
    </div>
  );
}

function NewWorkoutModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createWorkout);
  const [form, setForm] = useState<{ name: string; day_of_week: number | null; notes: string }>({ name: "", day_of_week: 1, notes: "" });
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => create({ data: { studentId, name: form.name, day_of_week: form.day_of_week, notes: form.notes } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-workouts", studentId] });
      toast.success("Treino criado", { description: form.name });
      onClose();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">Novo Treino</h2>
        <form
          onSubmit={(e) => { e.preventDefault(); setErr(null); mut.mutate(); }}
          className="mt-6 space-y-3"
        >
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Nome do treino *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Treino A — Peito e Tríceps" className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Dia da semana</label>
            <select
              value={form.day_of_week ?? ""}
              onChange={(e) => setForm({ ...form, day_of_week: e.target.value === "" ? null : Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 text-sm font-mono"
            >
              <option value="">Sem dia fixo</option>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">Observações</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 text-sm font-mono" />
          </div>
          {err && <p className="text-xs font-mono text-destructive uppercase">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase">Cancelar</button>
            <button type="submit" disabled={mut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase text-primary-foreground disabled:opacity-50">
              {mut.isPending ? "Criando..." : "Criar treino"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
