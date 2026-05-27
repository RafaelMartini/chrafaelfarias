import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, MetricCard } from "@/components/Shell";
import { students, appointments } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "KINETIC+ — Painel do Personal" },
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
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Admin Performance</p>
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
          <div className="bg-surface p-6 border border-accent/30 bg-accent/5">
            <p className="text-xs font-mono uppercase text-accent mb-4">Próxima Sessão</p>
            <div className="text-xl font-extrabold uppercase leading-none">{nextAppt.time} — {nextAppt.student.split(" ")[0]}</div>
            <p className="text-sm mt-2 text-foreground/80">{nextAppt.location}</p>
            <Link to="/agenda" className="inline-block mt-4 text-[10px] font-mono uppercase bg-accent text-background px-3 py-1 font-bold">Ver Agenda</Link>
          </div>
        </div>
      </section>

      <section className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-reveal [animation-delay:150ms]">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Roster de Alunos</h2>
            <Link to="/alunos" className="text-[10px] font-mono uppercase tracking-widest border border-border px-3 py-1.5 hover:border-accent hover:text-accent transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {students.slice(0, 5).map((s) => (
              <div key={s.id} className="bg-surface p-4 border border-border flex items-center justify-between group hover:border-accent/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-background border border-border flex items-center justify-center font-mono text-xs text-accent">{s.initials}</div>
                  <div>
                    <p className="font-bold uppercase tracking-tight">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.plan} • {s.week}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">Adesão</p>
                    <p className={`text-sm font-extrabold ${s.compliance > 85 ? "text-accent" : s.compliance > 70 ? "text-foreground" : "text-destructive"}`}>{s.compliance}%</p>
                  </div>
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 ${s.status === "active" ? "text-accent bg-accent/10" : s.status === "missed" ? "text-destructive bg-destructive/10" : "text-foreground bg-secondary"}`}>
                    {s.status === "active" ? "ativo" : s.status === "missed" ? "faltou" : "novo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Agenda Hoje</h2>
          <div className="bg-surface border border-border p-6 space-y-5">
            {appointments.slice(0, 3).map((a) => (
              <div key={a.id} className="flex gap-4">
                <div className="flex flex-col items-center bg-background border border-border w-14 py-2 shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{a.date.split(" ")[0]}</span>
                  <span className="text-lg font-extrabold">{a.date.split(" ")[1]}</span>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase">{a.student}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.location} • {a.time}</p>
                  <span className={`inline-block mt-1 text-[9px] font-mono uppercase ${a.modality === "presencial" ? "text-accent" : "text-foreground"}`}>
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
