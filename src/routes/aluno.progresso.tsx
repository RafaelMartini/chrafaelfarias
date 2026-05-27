import { createFileRoute } from "@tanstack/react-router";
import { Shell, MetricCard } from "@/components/Shell";

export const Route = createFileRoute("/aluno/progresso")({
  head: () => ({ meta: [{ title: "Meu Progresso — KINETIC+" }] }),
  component: Progresso,
});

function Progresso() {
  return (
    <Shell mode="student">
      <div className="mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Evolução</p>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight">Seu Progresso</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-reveal [animation-delay:100ms]">
        <MetricCard label="Treinos Concluídos" value="48" hint="últimas 12 semanas" />
        <MetricCard label="Frequência" value="92" suffix="%" hint="meta: 85%" />
        <MetricCard label="Streak Atual" value="12" suffix="d" hint="recorde: 18d" highlight />
        <MetricCard label="Carga Total" value="2.4t" hint="esta semana" />
      </div>

      <section className="mt-12 grid lg:grid-cols-2 gap-6 animate-reveal [animation-delay:200ms]">
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-lg font-extrabold uppercase mb-6">Evolução de Carga</h2>
          <div className="aspect-[2/1] bg-background/30 border border-border/50 grid place-items-center font-mono text-xs text-muted-foreground uppercase rounded-2xl">
            histórico de cargas
          </div>
        </div>
        <div className="bg-surface border border-border p-8 rounded-2xl">
          <h2 className="text-lg font-extrabold uppercase mb-6">Composição Corporal</h2>
          <div className="space-y-5">
            {[
              { label: "Peso", value: "84.2 kg", target: "80 kg", pct: 33 },
              { label: "% Gordura", value: "18%", target: "14%", pct: 50 },
              { label: "Massa Magra", value: "69 kg", target: "72 kg", pct: 60 },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between items-baseline mb-2">
                  <p className="text-xs font-mono uppercase text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-extrabold">{m.value} <span className="text-muted-foreground font-mono text-[10px]">→ {m.target}</span></p>
                </div>
                <div className="h-1 bg-border">
                  <div className="h-full bg-accent" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
