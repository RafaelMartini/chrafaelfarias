import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell, MetricCard } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { getAdminOverview } from "@/lib/admin.functions";

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
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const loadOverview = useServerFn(getAdminOverview);

  useEffect(() => {
    if (!loading && (!user || role !== "trainer")) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, role, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => loadOverview(),
    enabled: !!user && role === "trainer",
  });

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Shell mode="admin">
      <section className="space-y-8 animate-reveal">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Admin Performance</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase">Visão Geral do Ecossistema</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-mono text-muted-foreground uppercase">{today}</p>
            <p className="text-xl font-extrabold">Ao vivo</p>
          </div>
        </div>

        {error && <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-mono uppercase text-destructive">{(error as Error).message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="Alunos Vinculados" value={isLoading ? "…" : data?.studentsCount ?? 0} hint="Lista real do admin" />
          <MetricCard label="Exercícios" value={isLoading ? "…" : data?.exercisesCount ?? 0} hint="Biblioteca cadastrada" />
          <MetricCard label="Treinos Criados" value={isLoading ? "…" : data?.workoutsCount ?? 0} hint="Planos montados" />
          <div className="rounded-3xl border border-primary/40 bg-primary/10 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-mono uppercase text-primary mb-4">Próxima Sessão</p>
            {data?.upcomingAppointments?.[0] ? (
              <>
                <div className="text-xl font-extrabold uppercase leading-none">
                  {new Date(data.upcomingAppointments[0].scheduled_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <p className="text-sm mt-2 text-foreground/80">Status: {data.upcomingAppointments[0].status}</p>
              </>
            ) : (
              <>
                <div className="text-xl font-extrabold uppercase leading-none">Sem agenda</div>
                <p className="text-sm mt-2 text-foreground/80">Nenhum agendamento futuro</p>
              </>
            )}
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
            {isLoading && <p className="text-xs font-mono uppercase text-muted-foreground">Carregando alunos…</p>}
            {!isLoading && (data?.recentStudents ?? []).length === 0 && (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center text-xs font-mono uppercase text-muted-foreground">
                Nenhum aluno vinculado ainda. Abra Alunos para cadastrar ou montar o primeiro treino.
              </div>
            )}
            {(data?.recentStudents ?? []).map((s) => {
              const initials = (s.display_name || "AL").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link key={s.id} to="/alunos/$studentId" params={{ studentId: s.user_id }} className="group flex items-center justify-between rounded-3xl border border-border bg-card/75 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-xs text-primary">{initials}</div>
                  <div>
                    <p className="font-bold uppercase tracking-tight">{s.display_name ?? "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.goal ?? "Sem objetivo informado"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase text-primary">
                    Montar treino
                  </span>
                </div>
              </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Agenda Hoje</h2>
          <div className="space-y-5 rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl">
            {(data?.upcomingAppointments ?? []).length === 0 && <p className="text-xs font-mono uppercase text-muted-foreground">Nenhum agendamento futuro.</p>}
            {(data?.upcomingAppointments ?? []).map((a) => (
              <div key={a.id} className="flex gap-4">
                <div className="flex flex-col items-center bg-background border border-border w-14 py-2 shrink-0 rounded-2xl">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{new Date(a.scheduled_at).toLocaleDateString("pt-BR", { weekday: "short" })}</span>
                  <span className="text-lg font-extrabold">{new Date(a.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit" })}</span>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase">Aluno vinculado</p>
                  <p className="text-xs text-muted-foreground font-mono">{new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} • {a.duration_minutes} min</p>
                  <span className="inline-block mt-1 text-[9px] font-mono uppercase text-primary">{a.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}
