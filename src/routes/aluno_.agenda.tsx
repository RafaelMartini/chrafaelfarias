import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, X, Plus, Clock } from "lucide-react";

export const Route = createFileRoute("/aluno_/agenda")({
  head: () => ({ meta: [{ title: "Minha Agenda — Rafael Faria" }] }),
  component: StudentAgenda,
});

function StudentAgenda() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("trainer_id").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: appts = [], isLoading } = useQuery({
    queryKey: ["my-appts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, duration_minutes, status, notes")
        .eq("student_id", user!.id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: "", time: "", duration: 60, notes: "" });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!profile?.trainer_id) throw new Error("Você ainda não está vinculado a um personal");
      const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        student_id: user!.id,
        trainer_id: profile.trainer_id,
        scheduled_at,
        duration_minutes: Number(form.duration) || 60,
        notes: form.notes || null,
        status: "scheduled",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Solicitação enviada");
      qc.invalidateQueries({ queryKey: ["my-appts"] });
      setShowForm(false);
      setForm({ date: "", time: "", duration: 60, notes: "" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id).eq("student_id", user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado");
      qc.invalidateQueries({ queryKey: ["my-appts"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const upcoming = appts.filter((a) => new Date(a.scheduled_at) >= new Date() && a.status !== "cancelled");
  const past = appts.filter((a) => new Date(a.scheduled_at) < new Date() || a.status === "cancelled");

  return (
    <Shell mode="student">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Agendamentos</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Minha Agenda</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-lg">Solicite horários ao seu personal e acompanhe seu calendário.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-primary-foreground shadow-lg"
        >
          <Plus className="size-3" /> {showForm ? "Fechar" : "Solicitar Horário"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (!form.date || !form.time) { toast.error("Preencha data e hora"); return; } createMut.mutate(); }}
          className="mb-8 rounded-3xl border border-border bg-card/75 p-5 sm:p-6 shadow-xl backdrop-blur-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-reveal"
        >
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input type="number" min={15} max={240} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} placeholder="Duração (min)" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observação (modalidade, local...)" className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-3" />
          <button disabled={createMut.isPending} className="rounded-xl bg-primary px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-primary-foreground disabled:opacity-50">
            {createMut.isPending ? "Enviando…" : "Solicitar"}
          </button>
        </form>
      )}

      <section className="space-y-3 animate-reveal [animation-delay:100ms]">
        <h2 className="text-sm font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" /> Próximos
        </h2>
        {isLoading && <p className="text-xs font-mono uppercase text-muted-foreground">Carregando…</p>}
        {!isLoading && upcoming.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-6 text-center text-xs font-mono uppercase text-muted-foreground">
            Nenhum agendamento futuro
          </div>
        )}
        {upcoming.map((a) => (
          <ApptCard key={a.id} a={a} onCancel={() => cancelMut.mutate(a.id)} />
        ))}
      </section>

      {past.length > 0 && (
        <section className="mt-10 space-y-3 animate-reveal [animation-delay:200ms]">
          <h2 className="text-sm font-extrabold uppercase tracking-widest mb-2 flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" /> Histórico
          </h2>
          {past.map((a) => (
            <ApptCard key={a.id} a={a} muted />
          ))}
        </section>
      )}
    </Shell>
  );
}

type Appt = { id: string; scheduled_at: string; duration_minutes: number; status: string; notes: string | null };

function ApptCard({ a, onCancel, muted }: { a: Appt; onCancel?: () => void; muted?: boolean }) {
  const d = new Date(a.scheduled_at);
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between ${muted ? "border-border bg-card/40 opacity-70" : "border-border bg-card/75"}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border bg-background py-2">
          <span className="text-[9px] font-mono uppercase text-muted-foreground">{d.toLocaleDateString("pt-BR", { month: "short" })}</span>
          <span className="text-base font-extrabold">{d.toLocaleDateString("pt-BR", { day: "2-digit" })}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold uppercase tracking-tight">{d.toLocaleDateString("pt-BR", { weekday: "long" })} às {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-[10px] font-mono text-muted-foreground">{a.duration_minutes} min{a.notes ? ` • ${a.notes}` : ""}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-[9px] font-mono uppercase ${a.status === "confirmed" || a.status === "completed" ? "bg-primary/10 text-primary" : a.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"}`}>
          {a.status === "scheduled" ? "pendente" : a.status}
        </span>
        {onCancel && a.status !== "cancelled" && (
          <button onClick={onCancel} className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive" title="Cancelar">
            <X className="size-3" />
          </button>
        )}
        {(a.status === "confirmed" || a.status === "completed") && <CheckCircle2 className="size-4 text-primary" />}
      </div>
    </div>
  );
}
