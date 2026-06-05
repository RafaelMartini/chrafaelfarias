import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shell, MetricCard } from "@/components/Shell";
import { TrainingCalendar } from "@/components/TrainingCalendar";
import { useWorkoutLogs } from "@/lib/workout-logs";

export const Route = createFileRoute("/aluno/progresso")({
  head: () => ({ meta: [{ title: "Meu Progresso — Rafael Faria" }] }),
  component: Progresso,
});

type Period = "semana" | "mes" | "trimestre";
const periodLabels: Record<Period, string> = { semana: "Semana", mes: "Mês", trimestre: "3 meses" };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function Progresso() {
  const { logs, completedCount, isLoading } = useWorkoutLogs();
  const [period, setPeriod] = useState<Period>("semana");
  const now = new Date();

  const periodDays = period === "semana" ? 7 : period === "mes" ? 30 : 90;
  const inPeriod = useMemo(() => {
    const since = startOfDay(now);
    since.setDate(since.getDate() - (periodDays - 1));
    return logs.filter((l) => new Date(l.completed_at) >= since);
  }, [logs, periodDays]);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const inMonth = useMemo(() => logs.filter((l) => new Date(l.completed_at) >= monthStart), [logs, monthStart]);

  return (
    <Shell mode="student">
      <div className="mb-8 sm:mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Evolução</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Seu Progresso</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm sm:text-base">
          Os dias em que você treinou aparecem marcados no calendário.
        </p>
      </div>

      <div className="mb-6 flex rounded-full border border-border bg-background/50 p-1 w-fit animate-reveal">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
              period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-reveal [animation-delay:100ms]">
        <MetricCard label={`Concluídos (${periodLabels[period].toLowerCase()})`} value={inPeriod.length} />
        <MetricCard label="Este mês" value={inMonth.length} highlight />
        <MetricCard label="Total geral" value={completedCount} hint="desde o início" />
      </div>

      <section className="mt-8 animate-reveal [animation-delay:200ms]">
        <div className="rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <h2 className="text-lg font-extrabold uppercase mb-6">Calendário de treinos</h2>
          {isLoading ? <p className="text-xs font-mono uppercase text-muted-foreground">Carregando…</p> : <TrainingCalendar logs={logs} />}
        </div>
      </section>
    </Shell>
  );
}
