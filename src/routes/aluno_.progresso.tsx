import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell, MetricCard } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, CalendarCheck, Dumbbell, Flame, Plus } from "lucide-react";

export const Route = createFileRoute("/aluno_/progresso")({
  head: () => ({ meta: [{ title: "Meu Progresso — Rafael Faria" }] }),
  component: Progresso,
});

function Progresso() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  const { data: workouts = [] } = useQuery({
    queryKey: ["my-workouts-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("workouts").select("id, name").eq("student_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["my-logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, workout_id, completed_at, duration_minutes, notes")
        .eq("student_id", user!.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const [form, setForm] = useState({ workoutId: "", duration: 60, notes: "" });

  const logMut = useMutation({
    mutationFn: async () => {
      if (!form.workoutId) throw new Error("Selecione o treino");
      const { error } = await supabase.from("workout_logs").insert({
        student_id: user!.id,
        workout_id: form.workoutId,
        duration_minutes: Number(form.duration) || null,
        notes: form.notes || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Treino registrado!");
      qc.invalidateQueries({ queryKey: ["my-logs"] });
      setForm({ workoutId: "", duration: 60, notes: "" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);

    const week = logs.filter((l) => new Date(l.completed_at) >= weekAgo);
    const month = logs.filter((l) => new Date(l.completed_at) >= monthAgo);

    // streak: consecutive days from today
    const daySet = new Set(logs.map((l) => new Date(l.completed_at).toDateString()));
    let streak = 0;
    const cur = new Date(now);
    while (daySet.has(cur.toDateString())) { streak++; cur.setDate(cur.getDate() - 1); }

    const avgDuration = month.length ? Math.round(month.reduce((s, l) => s + (l.duration_minutes ?? 0), 0) / month.length) : 0;

    // weekly bars (last 7 days, by duration)
    const weekly = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i));
      const ls = logs.filter((l) => new Date(l.completed_at).toDateString() === d.toDateString());
      const total = ls.reduce((s, l) => s + (l.duration_minutes ?? 0), 0);
      return { day: d.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3), value: total };
    });
    const maxVal = Math.max(60, ...weekly.map((w) => w.value));

    return {
      total: logs.length, weekCount: week.length, monthCount: month.length,
      streak, avgDuration, weekly, maxVal,
    };
  }, [logs]);

  return (
    <Shell mode="student">
      <div className="mb-8 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Evolução</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Seu Progresso</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm">Registre seus treinos concluídos e acompanhe sua consistência.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-reveal [animation-delay:100ms]">
        <MetricCard label="Treinos totais" value={isLoading ? "…" : stats.total} hint="histórico completo" />
        <MetricCard label="Esta semana" value={isLoading ? "…" : stats.weekCount} hint="últimos 7 dias" />
        <MetricCard label="Streak atual" value={isLoading ? "…" : stats.streak} suffix="d" hint="dias consecutivos" highlight />
        <MetricCard label="Duração média" value={isLoading ? "…" : stats.avgDuration} suffix="min" hint="últimos 30 dias" />
      </div>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-reveal [animation-delay:200ms]">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card/75 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h2 className="text-lg font-extrabold uppercase">Últimos 7 dias</h2>
            <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground">
              <TrendingUp className="size-3 text-primary" /> minutos por dia
            </span>
          </div>
          <div className="flex h-44 items-end justify-between gap-1 sm:gap-2">
            {stats.weekly.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className="w-full max-w-10 rounded-t-md bg-primary/80 hover:bg-primary transition-all group relative"
                    style={{ height: `${Math.max(4, (d.value / stats.maxVal) * 100)}%` }}
                  >
                    {d.value > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap">{d.value}m</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card/75 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-extrabold uppercase mb-4 flex items-center gap-2"><Plus className="size-4 text-primary" />Registrar treino</h2>
          <form onSubmit={(e) => { e.preventDefault(); logMut.mutate(); }} className="space-y-3">
            <select value={form.workoutId} onChange={(e) => setForm({ ...form, workoutId: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="">Selecione o treino</option>
              {workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input type="number" min={1} max={300} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} placeholder="Duração (min)" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações (opcional)" rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            <button disabled={logMut.isPending || workouts.length === 0} className="w-full rounded-xl bg-primary px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-primary-foreground disabled:opacity-50">
              {logMut.isPending ? "Salvando…" : workouts.length === 0 ? "Nenhum treino disponível" : "Registrar"}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-8 animate-reveal [animation-delay:300ms]">
        <h2 className="text-lg font-extrabold uppercase mb-4 flex items-center gap-2"><CalendarCheck className="size-4 text-primary" />Histórico</h2>
        <div className="space-y-2">
          {logs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center text-xs font-mono uppercase text-muted-foreground">
              Nenhum treino registrado ainda
            </div>
          )}
          {logs.slice(0, 15).map((l) => {
            const w = workouts.find((x) => x.id === l.workout_id);
            return (
              <div key={l.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card/75 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Dumbbell className="size-4" /></div>
                  <div className="min-w-0">
                    <p className="font-bold uppercase tracking-tight truncate">{w?.name ?? "Treino"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {new Date(l.completed_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {l.duration_minutes ? ` • ${l.duration_minutes} min` : ""}
                    </p>
                    {l.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{l.notes}</p>}
                  </div>
                </div>
                <Flame className="size-4 text-primary shrink-0 self-start sm:self-center" />
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
