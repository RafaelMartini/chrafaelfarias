import { createFileRoute } from "@tanstack/react-router";
import { Shell, MetricCard } from "@/components/Shell";
import { TrendingUp, Award, CalendarCheck, Dumbbell, Target, Flame } from "lucide-react";

export const Route = createFileRoute("/aluno/progresso")({
  head: () => ({ meta: [{ title: "Meu Progresso — Rafael Faria" }] }),
  component: Progresso,
});

const milestones = [
  { icon: Flame, label: "Streak 7 dias", desc: "Treinou 7 dias seguidos", earned: true },
  { icon: Dumbbell, label: "100 treinos", desc: "Completou 100 sessões", earned: true },
  { icon: Target, label: "Meta de peso", desc: "Chegou ao peso alvo", earned: false },
  { icon: Award, label: "Campeão", desc: "Top 3 da semana", earned: false },
];

const weeklyData = [
  { day: "Seg", load: 120, max: 150 },
  { day: "Ter", load: 135, max: 150 },
  { day: "Qua", load: 90, max: 150 },
  { day: "Qui", load: 145, max: 150 },
  { day: "Sex", load: 110, max: 150 },
  { day: "Sáb", load: 60, max: 150 },
  { day: "Dom", load: 0, max: 150 },
];

function Progresso() {
  return (
    <Shell mode="student">
      <div className="mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Evolução</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Seu Progresso</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Acompanhe suas conquistas, cargas e composição corporal ao longo do tempo.
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-reveal [animation-delay:100ms]">
        <MetricCard label="Treinos Concluídos" value="48" hint="últimas 12 semanas" />
        <MetricCard label="Frequência" value="92" suffix="%" hint="meta: 85%" />
        <MetricCard label="Streak Atual" value="12" suffix="d" hint="recorde: 18d" highlight />
        <MetricCard label="Carga Total" value="2.4t" hint="esta semana" />
      </div>

      {/* Evolução de carga + Composição corporal */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-reveal [animation-delay:200ms]">
        {/* Gráfico de cargas */}
        <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extrabold uppercase">Evolução de Carga</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase text-primary">Esta semana</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {weeklyData.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full flex items-end justify-center">
                  <div
                     className="relative w-full max-w-8 rounded-t-md bg-primary/80 transition-all hover:bg-primary group"
                    style={{ height: `${(d.load / d.max) * 100}%` }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.load}kg
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-[10px] font-mono uppercase text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span>Carga (kg)</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="size-3 text-primary" />
              <span>+12% vs semana anterior</span>
            </div>
          </div>
        </div>

        {/* Composição corporal */}
        <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extrabold uppercase">Composição Corporal</h2>
            <span className="text-[10px] font-mono uppercase text-muted-foreground">Atualizado há 3 dias</span>
          </div>
          <div className="space-y-5">
            {[
              { label: "Peso", value: "84.2 kg", target: "80 kg", pct: 33, color: "bg-primary" },
              { label: "% Gordura", value: "18%", target: "14%", pct: 50, color: "bg-chart-3" },
              { label: "Massa Magra", value: "69 kg", target: "72 kg", pct: 60, color: "bg-chart-2" },
              { label: "IMC", value: "24.5", target: "22.0", pct: 70, color: "bg-chart-1" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between items-baseline mb-2">
                  <p className="text-xs font-mono uppercase text-muted-foreground">{m.label}</p>
                  <p className="text-sm font-extrabold">{m.value} <span className="text-muted-foreground font-mono text-[10px]">→ {m.target}</span></p>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conquistas */}
      <section className="mt-8 animate-reveal [animation-delay:300ms]">
        <h2 className="text-lg font-extrabold uppercase mb-4">Conquistas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className={`p-5 border rounded-2xl flex items-start gap-4 transition-all ${
                  m.earned
                    ? "bg-primary/10 border-primary/30 shadow-xl backdrop-blur-xl"
                    : "bg-card/75 border-border opacity-50 shadow-xl backdrop-blur-xl"
                }`}
              >
                <div className={`shrink-0 size-10 rounded-full flex items-center justify-center ${m.earned ? "bg-primary/20" : "bg-muted/20"}`}>
                  <Icon className={`size-5 ${m.earned ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${m.earned ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                  <p className="text-[10px] font-mono uppercase text-muted-foreground mt-1">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resumo do mês */}
      <section className="mt-8 animate-reveal [animation-delay:400ms]">
        <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold uppercase">Resumo do Mês</h2>
              <p className="text-sm text-muted-foreground mt-1">Maio de 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-4 text-primary" />
              <span className="text-sm font-bold">18 de 20 treinos realizados</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Treinos", value: "18", change: "+3" },
              { label: "Carga média", value: "1.2t", change: "+8%" },
              { label: "Duração média", value: "62min", change: "+5min" },
              { label: "Calorias", value: "8.4k", change: "+12%" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background/50 border border-border/30 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="mt-1 text-[10px] font-mono text-primary">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
