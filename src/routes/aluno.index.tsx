import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, RotateCcw } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useWorkoutLogs } from "@/lib/workout-logs";
import { embedUrl } from "@/lib/video";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aluno/")({
  head: () => ({ meta: [{ title: "Meu Treino — Rafael Faria" }] }),
  component: AlunoPage,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type PlanItem = {
  id: string;
  sets: number;
  reps: string;
  load_kg: number | null;
  rest_seconds: number | null;
  order_index: number;
  exercise: { id: string; name: string; description: string | null; video_url: string | null } | null;
};
type PlanWorkout = {
  id: string;
  name: string;
  notes: string | null;
  day_of_week: number | null;
  workout_exercises: PlanItem[];
};

function AlunoPage() {
  const { user } = useAuth();
  const firstName =
    (user?.user_metadata?.display_name || user?.email || "").toString().split(/[\s@]/)[0] || "Aluno";
  const { completedCount, isCompletedToday, toggle } = useWorkoutLogs();

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["my-plan", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PlanWorkout[]> => {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          "id, name, notes, day_of_week, workout_exercises(id, sets, reps, load_kg, rest_seconds, order_index, exercise:exercises(id, name, description, video_url))",
        )
        .order("day_of_week", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as PlanWorkout[];
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && workouts.length) setSelectedId(workouts[0].id);
  }, [workouts, selectedId]);

  const selected = useMemo(
    () => workouts.find((w) => w.id === selectedId) ?? workouts[0] ?? null,
    [workouts, selectedId],
  );

  const [doneExercises, setDoneExercises] = useState<Set<string>>(new Set());
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDoneExercises(new Set());
  };
  const toggleExercise = (id: string) =>
    setDoneExercises((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const items = useMemo(
    () => (selected ? [...selected.workout_exercises].sort((a, b) => a.order_index - b.order_index) : []),
    [selected],
  );
  const dayCompleted = selected ? isCompletedToday(selected.id) : false;

  const handleComplete = async () => {
    if (!selected) return;
    const nowCompleted = await toggle(selected.id);
    if (nowCompleted) toast.success("Treino concluído! 🔥", { description: selected.name });
    else toast("Conclusão desfeita", { description: "O treino voltou para pendente." });
  };

  return (
    <Shell mode="student">
      <AnamneseBanner />
      <section className="space-y-8 animate-reveal">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Olá, {firstName}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight">Meu Treino</h1>
          </div>
          {workouts.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {workouts.map((w) => {
                const active = selected?.id === w.id;
                const done = isCompletedToday(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => handleSelect(w.id)}
                    aria-pressed={active}
                    title={w.name}
                    className={`relative rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground font-bold"
                        : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {w.day_of_week !== null ? DAYS[w.day_of_week].slice(0, 3) : w.name.slice(0, 8)}
                    {done && (
                      <span className={`absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border ${active ? "border-primary-foreground bg-primary-foreground text-primary" : "border-primary bg-primary text-primary-foreground"}`}>
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-reveal [animation-delay:100ms]">
        <div className="lg:col-span-8 space-y-6">
          {isLoading ? (
            <p className="text-xs font-mono uppercase text-muted-foreground">Carregando seu treino…</p>
          ) : !selected ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                Seu treinador ainda não montou seu treino.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Assim que ele cadastrar, ele aparece aqui.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-extrabold uppercase tracking-tighter">
                  {selected.day_of_week !== null && <span className="text-muted-foreground">{DAYS[selected.day_of_week]}: </span>}
                  {selected.name}
                </h2>
                <span className="text-xs font-mono border border-border px-3 py-1 rounded-full">
                  {doneExercises.size}/{items.length} EXERCÍCIOS
                </span>
              </div>
              {selected.notes && <p className="text-xs font-mono text-muted-foreground">{selected.notes}</p>}

              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
                  <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Sem exercícios neste treino ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((it, idx) => {
                    const done = doneExercises.has(it.id);
                    const ex = it.exercise;
                    const embed = embedUrl(ex?.video_url ?? "");
                    return (
                      <div
                        key={it.id}
                        className={`group grid rounded-3xl border bg-card/75 p-4 shadow-2xl backdrop-blur-xl transition-all md:grid-cols-[1fr_2fr] gap-6 ${
                          done ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/50">
                          {embed ? (
                            <iframe src={embed} title={ex?.name} className="aspect-video h-full w-full md:aspect-square" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                          ) : ex?.video_url ? (
                            <video src={ex.video_url} controls playsInline preload="metadata" className="aspect-video h-full w-full bg-black md:aspect-square" />
                          ) : (
                            <div className="grid aspect-video place-items-center md:aspect-square">
                              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">sem vídeo</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-between py-2">
                          <div>
                            <div className="flex justify-between items-start mb-2 gap-3">
                              <h3 className={`text-xl font-extrabold uppercase tracking-tight ${done ? "text-muted-foreground line-through decoration-primary/60" : ""}`}>
                                {String(idx + 1).padStart(2, "0")}. {ex?.name ?? "Exercício"}
                              </h3>
                              <span className="text-xs font-mono text-primary shrink-0">{it.sets} SÉRIES</span>
                            </div>
                            {ex?.description && <p className="text-sm text-muted-foreground">{ex.description}</p>}
                          </div>
                          <div className="mt-4 flex items-end gap-2">
                            <div className="grid flex-1 grid-cols-3 gap-2">
                              <Stat label="Reps" value={it.reps} />
                              <Stat label="Carga" value={it.load_kg != null ? `${it.load_kg}kg` : "—"} />
                              <Stat label="Descanso" value={it.rest_seconds != null ? `${it.rest_seconds}s` : "—"} />
                            </div>
                            <button
                              onClick={() => toggleExercise(it.id)}
                              aria-pressed={done}
                              title={done ? "Desmarcar exercício" : "Marcar exercício como feito"}
                              className={`grid size-10 shrink-0 place-items-center rounded-2xl border transition-colors ${
                                done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                              }`}
                            >
                              <Check className="size-4" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <button
                  onClick={handleComplete}
                  className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-extrabold uppercase tracking-widest transition-transform hover:scale-[1.01] ${
                    dayCompleted ? "border border-primary bg-primary/10 text-primary" : "bg-primary text-primary-foreground"
                  }`}
                >
                  {dayCompleted ? (
                    <><RotateCcw className="size-4" /> Treino concluído — desfazer</>
                  ) : (
                    <><Check className="size-4" strokeWidth={3} /> Marcar Treino como Concluído</>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-extrabold uppercase mb-6">Próximos Agendamentos</h3>
            <p className="text-xs font-mono uppercase text-muted-foreground">Nenhum agendamento ainda.</p>
            <Link to="/aluno/agenda" className="mt-6 block w-full rounded-full bg-primary py-3 text-center text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02]">
              Agendar Nova Aula
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-extrabold uppercase mb-6">Resumo</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/50 border border-border/30 p-3 rounded-2xl">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Meus treinos</p>
                <p className="text-xl font-extrabold tabular-nums">{workouts.length}</p>
              </div>
              <div className="bg-background/50 border border-border/30 p-3 rounded-2xl">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Concluídos</p>
                <p className="text-xl font-extrabold text-primary tabular-nums">{completedCount}</p>
              </div>
            </div>
            <Link to="/aluno/progresso" className="mt-6 block text-center text-[10px] font-mono uppercase tracking-widest text-primary hover:underline">
              Ver progresso completo →
            </Link>
          </div>
        </aside>
      </section>
    </Shell>
  );
}

function AnamneseBanner() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["anamnese-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("anamnese").select("answers").maybeSingle();
      if (error) throw new Error(error.message);
      return data as { answers: Record<string, string> | null } | null;
    },
  });

  // Considera preenchida se já há pelo menos uma resposta.
  const filled = !!data?.answers && Object.values(data.answers).some((v) => v && String(v).trim() !== "");
  if (isLoading || filled) return null;

  return (
    <Link
      to="/aluno/anamnese"
      className="mb-6 flex items-center justify-between gap-4 rounded-3xl border border-primary/40 bg-primary/10 px-5 py-4 transition-colors hover:bg-primary/15 animate-reveal"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Preencha sua anamnese</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Responda o questionário e envie suas fotos para o coach montar seu protocolo.
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-primary px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground">
        Começar →
      </span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/50 border border-border/30 p-2 rounded-2xl">
      <p className="text-[9px] font-mono text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}
