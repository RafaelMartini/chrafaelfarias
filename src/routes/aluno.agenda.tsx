import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, MapPin, Video, Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { listStudentSlots, bookSlot, cancelBooking } from "@/lib/admin.functions";

export const Route = createFileRoute("/aluno/agenda")({
  head: () => ({ meta: [{ title: "Minha Agenda — Rafael Faria" }] }),
  component: StudentAgenda,
});

type Slot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  location: string | null;
  modality: string;
  mine: boolean;
};

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfWeek(offsetWeeks: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow + offsetWeeks * 7);
  return d;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function sameDay(iso: string, d: Date): boolean {
  const a = new Date(iso);
  return a.getFullYear() === d.getFullYear() && a.getMonth() === d.getMonth() && a.getDate() === d.getDate();
}

function StudentAgenda() {
  const { user } = useAuth();
  const list = useServerFn(listStudentSlots);
  const book = useServerFn(bookSlot);
  const cancel = useServerFn(cancelBooking);
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [sel, setSel] = useState<Slot | null>(null);

  const { data: slots = [] } = useQuery({ queryKey: ["student-slots", user?.id], queryFn: () => list() as Promise<Slot[]>, enabled: !!user });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["student-slots"] });
  const bookMut = useMutation({
    mutationFn: (id: string) => book({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Aula agendada!"); setSel(null); },
    onError: (e: Error) => { invalidate(); toast.error("Não foi possível agendar", { description: e.message }); setSel(null); },
  });
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => { invalidate(); toast("Agendamento cancelado"); setSel(null); },
    onError: (e: Error) => toast.error("Erro ao cancelar", { description: e.message }),
  });

  const weekStart = useMemo(() => startOfWeek(weekOffset), [weekOffset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = addDays(weekStart, 6);

  return (
    <Shell mode="student">
      <div className="flex items-end justify-between mb-6 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Agendamentos</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Minha Agenda</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Toque num horário livre para agendar. Suas aulas aparecem em destaque.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="grid size-9 place-items-center rounded-full border border-border hover:border-primary hover:text-primary"><ChevronLeft className="size-4" /></button>
          <div className="text-center min-w-40">
            <p className="text-xs font-mono uppercase text-muted-foreground">
              {weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – {weekEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </p>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-[10px] font-mono uppercase text-primary hover:underline">hoje</button>}
          </div>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="grid size-9 place-items-center rounded-full border border-border hover:border-primary hover:text-primary"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 animate-reveal [animation-delay:100ms]">
        {days.map((day, i) => {
          const daySlots = slots.filter((s) => sameDay(s.starts_at, day)).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
          const today = sameDay(new Date().toISOString(), day);
          return (
            <div key={i} className={`rounded-2xl border bg-card/60 p-3 min-h-44 ${today ? "border-primary/50" : "border-border"}`}>
              <div className="mb-2">
                <p className="text-[10px] font-mono uppercase text-muted-foreground">{DAYS[i]}</p>
                <p className={`text-lg font-extrabold tabular-nums ${today ? "text-primary" : ""}`}>{day.getDate()}</p>
              </div>
              <div className="space-y-1.5">
                {daySlots.length === 0 && <p className="text-[9px] font-mono uppercase text-muted-foreground/50">—</p>}
                {daySlots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSel(s)}
                    className={`w-full text-left rounded-lg border px-2 py-1.5 transition-colors ${
                      s.mine
                        ? "border-primary bg-primary/15 hover:bg-primary/25"
                        : "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold tabular-nums leading-tight flex items-center gap-1">
                      {s.mine && <Check className="size-2.5 text-primary" strokeWidth={3} />}
                      {fmtTime(s.starts_at)}
                    </p>
                    <p className={`text-[9px] font-mono uppercase leading-tight ${s.mine ? "text-primary" : "text-emerald-500"}`}>{s.mine ? "Minha aula" : "Livre"}</p>
                    <p className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground truncate leading-tight">
                      {s.modality === "online" ? <Video className="size-2.5" /> : <MapPin className="size-2.5" />}
                      {s.location || (s.modality === "online" ? "Online" : "—")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-emerald-500/40 bg-emerald-500/10" /> Livre</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-primary bg-primary/15" /> Minha aula</span>
      </div>

      {sel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold uppercase tracking-tight">{sel.mine ? "Minha aula" : "Agendar horário"}</h2>
            <p className="mt-2 text-sm font-mono">
              {new Date(sel.starts_at).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })} · {fmtTime(sel.starts_at)}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-mono text-muted-foreground">
              {sel.modality === "online" ? <Video className="size-3" /> : <MapPin className="size-3" />}
              {sel.location || (sel.modality === "online" ? "Online" : "Presencial")} · {sel.duration_minutes}min
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setSel(null)} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Fechar</button>
              {sel.mine ? (
                <button onClick={() => cancelMut.mutate(sel.id)} disabled={cancelMut.isPending} className="flex-1 rounded-full border border-border py-3 text-[10px] font-extrabold uppercase tracking-widest text-destructive hover:bg-secondary disabled:opacity-50">
                  {cancelMut.isPending ? "..." : "Cancelar aula"}
                </button>
              ) : (
                <button onClick={() => bookMut.mutate(sel.id)} disabled={bookMut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
                  {bookMut.isPending ? "..." : "Agendar"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
