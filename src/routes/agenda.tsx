import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Plus, MapPin, Video } from "lucide-react";
import { Shell } from "@/components/Shell";
import {
  useAppointments,
  WEEK_DAYS,
  dayLabel,
  type Modality,
} from "@/lib/appointments-store";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Rafael Faria" }] }),
  component: AgendaPage,
});

function AgendaPage() {
  const { appointments, byDay, add, setStatus, remove } = useAppointments();
  const [view, setView] = useState<"semana" | "mes">("semana");
  const [showNew, setShowNew] = useState(false);

  const confirm = (id: string, student: string) => {
    setStatus(id, "confirmed");
    toast.success("Agendamento confirmado", { description: student });
  };
  const cancel = (id: string, student: string) => {
    remove(id);
    toast("Agendamento cancelado", { description: student });
  };

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Calendário</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Agenda {view === "semana" ? "Semanal" : "Mensal"}</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">{appointments.length} agendamento(s)</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-full border border-border bg-card/70 p-1 shadow-xl backdrop-blur-xl">
            {(["semana", "mes"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                  view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {v === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Plus className="size-4" /> Novo
          </button>
        </div>
      </div>

      {view === "semana" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 animate-reveal [animation-delay:100ms]">
          {WEEK_DAYS.map((d) => {
            const daySlots = byDay(d.index);
            const isHighlight = daySlots.length > 0;
            return (
              <div key={d.index} className="flex flex-col gap-3">
                <span className={`text-[10px] font-mono text-center uppercase tracking-tighter ${isHighlight ? "text-primary" : "text-muted-foreground"}`}>
                  {d.label}
                </span>
                <div className={`flex min-h-40 flex-col gap-2 rounded-3xl border bg-card/75 p-3 shadow-xl backdrop-blur-xl ${isHighlight ? "border-primary/50" : "border-border"}`}>
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-2xl p-2 text-[10px] font-mono ${
                        s.status === "confirmed"
                          ? s.modality === "presencial"
                            ? "bg-primary text-primary-foreground font-bold"
                            : "bg-secondary text-foreground"
                          : "border border-dashed border-primary/40 text-muted-foreground"
                      }`}
                    >
                      {s.time} {s.student.split(" ")[0]}
                      {s.status === "pending" && <span className="block text-[8px] uppercase opacity-70">pendente</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl animate-reveal [animation-delay:100ms]">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">Maio / Junho 2026 — visão consolidada</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {appointments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-background/40 p-3">
                <div className="flex w-12 shrink-0 flex-col items-center rounded-xl border border-border bg-background py-1">
                  <span className="text-[8px] font-mono text-muted-foreground uppercase">{dayLabel(a.dayIndex).split(" ")[0]}</span>
                  <span className="text-base font-extrabold">{dayLabel(a.dayIndex).split(" ")[1]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase truncate">{a.time} — {a.student}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{a.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="mt-16 animate-reveal [animation-delay:200ms]">
        <h2 className="text-2xl font-extrabold uppercase tracking-tighter mb-6">Próximos Agendamentos</h2>
        {appointments.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum agendamento. Clique em “Novo” para criar.</p>
          </div>
        )}
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a.id} className="flex flex-col gap-4 rounded-3xl border border-border bg-card/75 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center bg-background border border-border w-14 py-2 rounded-2xl shrink-0">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{dayLabel(a.dayIndex).split(" ")[0]}</span>
                  <span className="text-lg font-extrabold">{dayLabel(a.dayIndex).split(" ")[1]}</span>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-tight">{a.student}</p>
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    {a.modality === "presencial" ? <MapPin className="size-3" /> : <Video className="size-3" />}
                    {a.time} • {a.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase ${a.status === "confirmed" ? "text-primary bg-primary/10" : "text-foreground bg-secondary"}`}>
                  {a.status === "confirmed" ? "confirmado" : "pendente"}
                </span>
                {a.status === "pending" && (
                  <button
                    onClick={() => confirm(a.id, a.student)}
                    title="Confirmar"
                    className="grid size-8 place-items-center rounded-full border border-primary/40 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </button>
                )}
                <button
                  onClick={() => cancel(a.id, a.student)}
                  title="Cancelar"
                  className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <X className="size-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showNew && <NewAppointmentModal onClose={() => setShowNew(false)} onCreate={add} />}
    </Shell>
  );
}

function NewAppointmentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: ReturnType<typeof useAppointments>["add"];
}) {
  const [form, setForm] = useState({
    student: "",
    dayIndex: 1,
    time: "07:00",
    modality: "presencial" as Modality,
    location: "Unidade Jardins",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ ...form, status: "pending" });
    toast.success("Agendamento criado", { description: `${form.student} — ${dayLabel(form.dayIndex)} ${form.time}` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">Novo Agendamento</h2>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Aluno *</label>
            <input required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })} placeholder="Nome do aluno" className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Dia</label>
              <select value={form.dayIndex} onChange={(e) => setForm({ ...form, dayIndex: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary">
                {WEEK_DAYS.map((d) => <option key={d.index} value={d.index}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Horário</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Modalidade</label>
              <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as Modality })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Local</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Cancelar</button>
            <button type="submit" className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground">Criar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
