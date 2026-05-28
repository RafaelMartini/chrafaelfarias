import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { weekWorkouts, exercises, appointments } from "@/lib/mock-data";

export const Route = createFileRoute("/aluno")({
  head: () => ({ meta: [{ title: "Meu Treino — Rafael Faria" }] }),
  component: AlunoPage,
});

function AlunoPage() {
  const today = weekWorkouts[0]; // Segunda
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e]));

  return (
    <Shell mode="student">
      <section className="space-y-8 animate-reveal">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Olá, Mariana</p>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight">Treino do Dia</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {weekWorkouts.map((w, i) => (
              <button
                key={w.day}
                className={`rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-widest ${i === 0 ? "border-primary bg-primary text-primary-foreground font-bold" : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"} transition-colors`}
              >
                {w.day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-reveal [animation-delay:100ms]">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold uppercase tracking-tighter">
              <span className="text-muted-foreground">{today.day}: </span>{today.name}
            </h2>
            <span className="text-xs font-mono border border-border px-3 py-1 rounded-full">{today.exercises.length} EXERCÍCIOS</span>
          </div>

          <div className="space-y-3">
            {today.exercises.map((we, idx) => {
              const ex = exMap[we.exerciseId];
              return (
                <div key={idx} className="group grid rounded-3xl border border-border bg-card/75 p-4 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40 md:grid-cols-[1fr_2fr] gap-6">
                  <div className="relative grid aspect-video place-items-center rounded-3xl border border-border/50 bg-background/50 transition-colors group-hover:border-primary/30 md:aspect-square">
                    <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">▶ {ex.videoPrompt}</span>
                  </div>
                  <div className="flex flex-col justify-between py-2">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-extrabold uppercase tracking-tight">
                          {String(idx + 1).padStart(2, "0")}. {ex.name}
                        </h3>
                        <span className="text-xs font-mono text-primary">{we.sets} SÉRIES</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{ex.description}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <Stat label="Reps" value={we.reps} />
                      <Stat label="Carga" value={we.load} />
                      <Stat label="Descanso" value={we.rest} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="w-full rounded-full bg-primary py-4 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]">
            Marcar Treino como Concluído
          </button>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-extrabold uppercase mb-6">Próximos Agendamentos</h3>
            <div className="space-y-4">
              {appointments.slice(0, 2).map((a) => (
                <div key={a.id} className="flex gap-4">
                  <div className="flex flex-col items-center bg-background border border-border w-12 py-2 shrink-0 rounded-2xl">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{a.date.split(" ")[0]}</span>
                    <span className="text-lg font-extrabold">{a.date.split(" ")[1]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase">{a.modality === "presencial" ? "Treino presencial" : "Consultoria online"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{a.location} • {a.time}</p>
                    <button className="mt-1 text-[9px] font-mono uppercase text-primary hover:underline">Confirmar Presença</button>
                  </div>
                </div>
              ))}
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
                  <p className="text-xl font-extrabold">4.2</p>
                </div>
                <div className="bg-background/50 border border-border/30 p-3 rounded-2xl">
                  <p className="text-[9px] font-mono text-muted-foreground uppercase">Streak</p>
                  <p className="text-xl font-extrabold text-primary">12d</p>
                </div>
              </div>
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
