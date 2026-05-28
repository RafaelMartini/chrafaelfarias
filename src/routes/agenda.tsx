import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Trash2, CheckCircle2, X, Plus } from "lucide-react";
import {
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  listMyStudents,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Rafael Faria" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchAppts = useServerFn(listAppointments);
  const fetchStudents = useServerFn(listMyStudents);
  const createFn = useServerFn(createAppointment);
  const updateFn = useServerFn(updateAppointmentStatus);
  const deleteFn = useServerFn(deleteAppointment);

  useEffect(() => {
    if (!loading && (!user || role !== "trainer")) navigate({ to: "/login", replace: true });
  }, [loading, user, role, navigate]);

  const enabled = !!user && role === "trainer";
  const { data: appts = [], isLoading } = useQuery({ queryKey: ["admin-appts"], queryFn: () => fetchAppts(), enabled });
  const { data: students = [] } = useQuery({ queryKey: ["admin-students"], queryFn: () => fetchStudents(), enabled });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: "", date: "", time: "", duration: 60, notes: "" });

  const createMut = useMutation({
    mutationFn: (input: { studentId: string; scheduled_at: string; duration_minutes: number; notes: string }) =>
      createFn({ data: input }),
    onSuccess: () => {
      toast.success("Agendamento criado");
      qc.invalidateQueries({ queryKey: ["admin-appts"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      setShowForm(false);
      setForm({ studentId: "", date: "", time: "", duration: 60, notes: "" });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; status: "scheduled" | "confirmed" | "completed" | "cancelled" }) => updateFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-appts"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Agendamento removido");
      qc.invalidateQueries({ queryKey: ["admin-appts"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.date || !form.time) {
      toast.error("Preencha aluno, data e hora");
      return;
    }
    const scheduled_at = new Date(`${form.date}T${form.time}:00`).toISOString();
    createMut.mutate({ studentId: form.studentId, scheduled_at, duration_minutes: Number(form.duration) || 60, notes: form.notes });
  };

  const grouped = appts.reduce<Record<string, typeof appts>>((acc, a) => {
    const k = new Date(a.scheduled_at).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
    (acc[k] ||= []).push(a);
    return acc;
  }, {});

  return (
    <Shell mode="admin">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Calendário</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Agenda</h1>
          <p className="text-muted-foreground mt-2 text-sm">Agende e acompanhe sessões com seus alunos.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-primary-foreground shadow-lg hover:scale-[1.02] transition-transform"
        >
          <Plus className="size-3" /> {showForm ? "Fechar" : "Novo Agendamento"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-8 rounded-3xl border border-border bg-card/75 p-5 sm:p-6 shadow-xl backdrop-blur-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-reveal">
          <select
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Selecione o aluno</option>
            {students.map((s) => (
              <option key={s.user_id} value={s.user_id}>{s.display_name ?? "Sem nome"}</option>
            ))}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input type="number" min={15} max={480} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} placeholder="Duração (min)" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas (local, modalidade...)" className="rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
          <button disabled={createMut.isPending} className="rounded-xl bg-primary px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-primary-foreground disabled:opacity-50">
            {createMut.isPending ? "Salvando…" : "Agendar"}
          </button>
        </form>
      )}

      <section className="space-y-4 animate-reveal [animation-delay:100ms]">
        {isLoading && <p className="text-xs font-mono uppercase text-muted-foreground">Carregando agenda…</p>}
        {!isLoading && appts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-xs font-mono uppercase text-muted-foreground">
            Nenhum agendamento ainda. Crie o primeiro acima.
          </div>
        )}
        {Object.entries(grouped).map(([day, items]) => (
          <div key={day} className="rounded-3xl border border-border bg-card/75 p-4 sm:p-6 shadow-xl backdrop-blur-xl">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">{day}</p>
            <div className="space-y-2">
              {items.map((a) => (
                <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border bg-background py-2">
                      <span className="text-[9px] font-mono uppercase text-muted-foreground">{new Date(a.scheduled_at).toLocaleDateString("pt-BR", { month: "short" })}</span>
                      <span className="text-base font-extrabold">{new Date(a.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit" })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold uppercase tracking-tight truncate">{a.student_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} • {a.duration_minutes} min
                        {a.notes ? ` • ${a.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[9px] font-mono uppercase ${a.status === "confirmed" || a.status === "completed" ? "bg-primary/10 text-primary" : a.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"}`}>
                      {a.status}
                    </span>
                    {a.status !== "confirmed" && a.status !== "completed" && (
                      <button onClick={() => updateMut.mutate({ id: a.id, status: "confirmed" })} className="rounded-full border border-border p-2 hover:border-primary hover:text-primary" title="Confirmar">
                        <CheckCircle2 className="size-3" />
                      </button>
                    )}
                    {a.status !== "cancelled" && (
                      <button onClick={() => updateMut.mutate({ id: a.id, status: "cancelled" })} className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive" title="Cancelar">
                        <X className="size-3" />
                      </button>
                    )}
                    <button onClick={() => delMut.mutate(a.id)} className="rounded-full border border-border p-2 hover:border-destructive hover:text-destructive" title="Excluir">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </Shell>
  );
}
