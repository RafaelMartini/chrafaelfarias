import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, MetricCard } from "@/components/Shell";
import { students, appointments } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Rafael Faria — Painel do Personal" },
      { name: "description", content: "Plataforma de gestão de alta performance para personal trainers." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const nextAppt = appointments[0];
  return (
    <Shell mode="admin">
      <section className="space-y-8 animate-reveal">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Admin Performance</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase">Visão Geral do Ecossistema</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono text-muted-foreground">SEG, 27 MAIO 2026</p>
            <p className="text-xl font-extrabold">14:32</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="Alunos Ativos" value="42" hint="+12% este mês" />
          <MetricCard label="Frequência Semanal" value="88" suffix="%" hint="156 check-ins registrados" />
          <MetricCard label="Taxa de Conclusão" value="94" suffix="%" hint="Retenção acima da média" />
          <div className="rounded-3xl border border-primary/40 bg-primary/10 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-mono uppercase text-primary mb-4">Próxima Sessão</p>
            <div className="text-xl font-extrabold uppercase leading-none">{nextAppt.time} — {nextAppt.student.split(" ")[0]}</div>
            <p className="text-sm mt-2 text-foreground/80">{nextAppt.location}</p>
            <Link to="/agenda" className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-[10px] font-mono font-bold uppercase text-primary-foreground">Ver Agenda</Link>
          </div>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-reveal [animation-delay:150ms]">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Roster de Alunos</h2>
              <Link to="/alunos" className="rounded-full border border-border px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {students.slice(0, 5).map((s) => (
                <div key={s.id} className="group flex items-center justify-between rounded-3xl border border-border bg-card/75 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-xs text-primary">{s.initials}</div>
                  <div>
                    <p className="font-bold uppercase tracking-tight">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.plan} • {s.week}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Adesão</p>
                    <p className={`text-sm font-extrabold ${s.compliance > 85 ? "text-primary" : s.compliance > 70 ? "text-foreground" : "text-destructive"}`}>{s.compliance}%</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase ${s.status === "active" ? "text-primary bg-primary/10" : s.status === "missed" ? "text-destructive bg-destructive/10" : "text-foreground bg-secondary"}`}>
                    {s.status === "active" ? "ativo" : s.status === "missed" ? "faltou" : "novo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Agenda Hoje</h2>
          <div className="space-y-5 rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            {appointments.slice(0, 3).map((a) => (
              <div key={a.id} className="flex gap-4">
                <div className="flex flex-col items-center bg-background border border-border w-14 py-2 shrink-0 rounded-2xl">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{a.date.split(" ")[0]}</span>
                  <span className="text-lg font-extrabold">{a.date.split(" ")[1]}</span>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase">{a.student}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.location} • {a.time}</p>
                  <span className={`inline-block mt-1 text-[9px] font-mono uppercase ${a.modality === "presencial" ? "text-primary" : "text-foreground"}`}>
                    {a.modality}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
