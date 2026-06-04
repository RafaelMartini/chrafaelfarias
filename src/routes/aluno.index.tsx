import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, RotateCcw } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useWorkoutLog } from "@/lib/workout-log";
import { usePlan } from "@/lib/training-plan";
import { embedUrl } from "@/lib/video";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aluno/")({
  head: () => ({ meta: [{ title: "Meu Treino — Rafael Faria" }] }),
  component: AlunoPage,
});

function AlunoPage() {
  const { plan, trainingDaysCount } = usePlan();
  const { completedCount, isCompleted, toggle } = useWorkoutLog();
  const { user } = useAuth();
  const firstName =
    (user?.user_metadata?.display_name || user?.email || "").toString().split(/[\s@]/)[0] || "Aluno";

  // Dia selecionado: começa no primeiro dia com treino programado.
  const firstTrainingIdx = useMemo(() => {
    const i = plan.findIndex((d) => d.exercises.length > 0);
    return i === -1 ? 0 : i;
  }, [plan]);
  const [selectedIdx, setSelectedIdx] = useState(firstTrainingIdx);
  const selected = plan[selectedIdx] ?? plan[0];

  // Exercícios marcados como feitos na sessão atual (reseta ao trocar de dia).
  const [doneExercises, setDoneExercises] = useState<Set<string>>(new Set());
  const handleSelectDay = (idx: number) => {
    setSelectedIdx(idx);
    setDoneExercises(new Set());
  };
  const toggleExercise = (id: string) => {
    setDoneExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isRecovery = selected.exercises.length === 0;
  const dayCompleted = isCompleted(selected.dayId);

  const handleComplete = () => {
    const nowCompleted = toggle(selected.dayId);
    if (nowCompleted) {
      toast.success("Treino concluído! 🔥", {
        description: `${selected.dayName.charAt(0) + selected.dayName.slice(1).toLowerCase()} — ${selected.workoutName}`,
      });
    } else {
      toast("Conclusão desfeita", { description: "O treino voltou para pendente." });
    }
  };

  return (
    <Shell mode="student">
      <section className="space-y-8 animate-reveal">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Olá, {firstName}</p>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight">
              {selectedIdx === firstTrainingIdx ? "Treino do Dia" : "Programação"}
            </h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {plan.map((d, i) => {
              const active = i === selectedIdx;
              const done = isCompleted(d.dayId);
              const hasWorkout = d.exercises.length > 0;
              return (
                <button
                  key={d.dayId}
                  onClick={() => handleSelectDay(i)}
                  aria-pressed={active}
                  className={`relative rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground font-bold"
                      : hasWorkout
                        ? "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"
                        : "border-border/50 text-muted-foreground/50 hover:text-foreground"
                  }`}
                >
                  {d.dayName.slice(0, 3)}
                  {done && (
                    <span className={`absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border ${active ? "border-primary-foreground bg-primary-foreground text-primary" : "border-primary bg-primary text-primary-foreground"}`}>
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-reveal [animation-delay:100ms]">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-2xl font-extrabold uppercase tracking-tighter">
              <span className="text-muted-foreground">{selected.dayName}: </span>{selected.workoutName || "Sem treino"}
            </h2>
            {!isRecovery && (
              <span className="text-xs font-mono border border-border px-3 py-1 rounded-full">
                {doneExercises.size}/{selected.exercises.length} EXERCÍCIOS
              </span>
            )}
          </div>

          {isRecovery ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
              <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                Nenhum treino programado para este dia.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Dia de descanso / recuperação ativa.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selected.exercises.map((ex, idx) => {
                const done = doneExercises.has(ex.id);
                const embed = embedUrl(ex.videoUrl);
                return (
                  <div
                    key={ex.id}
                    className={`group grid rounded-3xl border bg-card/75 p-4 shadow-2xl backdrop-blur-xl transition-all md:grid-cols-[1fr_2fr] gap-6 ${
                      done ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/50">
                      {embed ? (
                        <iframe
                          src={embed}
                          title={ex.name}
                          className="aspect-video h-full w-full md:aspect-square"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
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
                            {String(idx + 1).padStart(2, "0")}. {ex.name}
                          </h3>
                          <span className="text-xs font-mono text-primary shrink-0">{ex.sets} SÉRIES</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{ex.description}</p>
                      </div>
                      <div className="mt-4 flex items-end gap-2">
                        <div className="grid flex-1 grid-cols-3 gap-2">
                          <Stat label="Reps" value={ex.reps} />
                          <Stat label="Carga" value={ex.load} />
                          <Stat label="Descanso" value={ex.rest} />
                        </div>
                        <button
                          onClick={() => toggleExercise(ex.id)}
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

          {!isRecovery && (
            <button
              onClick={handleComplete}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-4 text-xs font-extrabold uppercase tracking-widest transition-transform hover:scale-[1.01] ${
                dayCompleted ? "border border-primary bg-primary/10 text-primary" : "bg-primary text-primary-foreground"
              }`}
            >
              {dayCompleted ? (
                <>
                  <RotateCcw className="size-4" /> Treino concluído — desfazer
                </>
              ) : (
                <>
                  <Check className="size-4" strokeWidth={3} /> Marcar Treino como Concluído
                </>
              )}
            </button>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-extrabold uppercase mb-6">Próximos Agendamentos</h3>
            <div className="space-y-4">
              <p className="text-xs font-mono uppercase text-muted-foreground">Nenhum agendamento ainda.</p>
            </div>
            <Link to="/aluno/agenda" className="mt-6 block w-full rounded-full bg-primary py-3 text-center text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02]">
              Agendar Nova Aula
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-extrabold uppercase mb-6">Evolução</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Peso Atual</p>
                  <p className="text-3xl font-extrabold">84.2<small className="text-sm font-normal ml-1">KG</small></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">META: 80KG</p>
                  <div className="w-24 h-1 bg-border mt-1">
                    <div className="h-full bg-primary w-1/3" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background/50 border border-border/30 p-3 rounded-2xl">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Treinos / semana</p>
                  <p className="text-xl font-extrabold tabular-nums">
                    {completedCount}<span className="text-sm text-muted-foreground">/{trainingDaysCount}</span>
                  </p>
                </div>
                <div className="bg-background/50 border border-border/30 p-3 rounded-2xl">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Concluídos</p>
                  <p className="text-xl font-extrabold text-primary tabular-nums">{completedCount}</p>
                </div>
              </div>
              <Link to="/aluno/progresso" className="block text-center text-[10px] font-mono uppercase tracking-widest text-primary hover:underline">
                Ver progresso completo →
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </Shell>
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
