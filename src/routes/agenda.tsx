import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, MapPin, Video, Trash2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { listMySlots, createSlot, deleteSlot, assignSlot, listMyStudents } from "@/lib/admin.functions";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Rafael Faria" }] }),
  component: AgendaPage,
});

type Slot = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  location: string | null;
  modality: string;
  booked_by: string | null;
  student_name: string | null;
};
type Student = { user_id: string; display_name: string | null };

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function startOfWeek(offsetWeeks: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - dow + offsetWeeks * 7);
  return d;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function sameDay(iso: string, d: Date): boolean {
  const a = new Date(iso);
  return a.getFullYear() === d.getFullYear() && a.getMonth() === d.getMonth() && a.getDate() === d.getDate();
}

function AgendaPage() {
  const { user, role } = useRequireTrainer();
  const listSlots = useServerFn(listMySlots);
  const listStudents = useServerFn(listMyStudents);
  const enabled = !!user && role === "trainer";
  const [weekOffset, setWeekOffset] = useState(0);
  const [editTarget, setEditTarget] = useState<{ day: Date; slot: Slot | null } | null>(null);

  const { data: slots = [] } = useQuery({ queryKey: ["my-slots"], queryFn: () => listSlots() as Promise<Slot[]>, enabled });
  const { data: students = [] } = useQuery({ queryKey: ["my-students"], queryFn: () => listStudents() as Promise<Student[]>, enabled });

  const weekStart = useMemo(() => startOfWeek(weekOffset), [weekOffset]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = addDays(weekStart, 6);

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-6 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Gestão</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Agenda</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Clique num dia para adicionar horário (livre ou aula com aluno).</p>
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
            <div key={i} className={`rounded-2xl border bg-card/60 p-3 min-h-44 flex flex-col ${today ? "border-primary/50" : "border-border"}`}>
              <div className="mb-2">
                <p className="text-[10px] font-mono uppercase text-muted-foreground">{DAYS[i]}</p>
                <p className={`text-lg font-extrabold tabular-nums ${today ? "text-primary" : ""}`}>{day.getDate()}</p>
              </div>
              <div className="space-y-1.5 flex-1">
                {daySlots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setEditTarget({ day, slot: s })}
                    className={`w-full text-left rounded-lg border px-2 py-1.5 transition-colors ${
                      s.booked_by
                        ? "border-primary bg-primary/15 hover:bg-primary/25"
                        : "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20"
                    }`}
                  >
                    <p className="text-[11px] font-extrabold tabular-nums leading-tight">{fmtTime(s.starts_at)}</p>
                    {s.booked_by ? (
                      <p className="text-[9px] font-mono uppercase text-primary truncate leading-tight">{s.student_name}</p>
                    ) : (
                      <p className="text-[9px] font-mono uppercase text-emerald-500 leading-tight">Livre</p>
                    )}
                    <p className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground truncate leading-tight">
                      {s.modality === "online" ? <Video className="size-2.5" /> : <MapPin className="size-2.5" />}
                      {s.location || (s.modality === "online" ? "Online" : "—")}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEditTarget({ day, slot: null })}
                className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-[9px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-3" /> Horário
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-emerald-500/40 bg-emerald-500/10" /> Livre (aluno agenda)</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-primary bg-primary/15" /> Aula marcada</span>
      </div>

      {editTarget && (
        <SlotModal
          day={editTarget.day}
          slot={editTarget.slot}
          students={students}
          onClose={() => setEditTarget(null)}
        />
      )}
    </Shell>
  );
}

function SlotModal({ day, slot, students, onClose }: { day: Date; slot: Slot | null; students: Student[]; onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createSlot);
  const assign = useServerFn(assignSlot);
  const del = useServerFn(deleteSlot);
  const editing = !!slot;

  const [form, setForm] = useState({
    time: slot ? fmtTime(slot.starts_at) : "",
    duration: slot?.duration_minutes ?? 60,
    location: slot?.location ?? "",
    modality: (slot?.modality as "presencial" | "online") ?? "presencial",
    studentId: slot?.booked_by ?? "",
  });
  const [err, setErr] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["my-slots"] });

  const createMut = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${isoDate(day)}T${form.time}`).toISOString();
      return create({ data: { startsAt, durationMinutes: Number(form.duration), location: form.location, modality: form.modality, studentId: form.studentId || "" } });
    },
    onSuccess: () => { invalidate(); toast.success("Horário adicionado"); onClose(); },
    onError: (e: Error) => setErr(e.message),
  });
  const assignMut = useMutation({
    mutationFn: () => assign({ data: { id: slot!.id, studentId: form.studentId || null } }),
    onSuccess: () => { invalidate(); toast.success(form.studentId ? "Aula marcada" : "Horário liberado"); onClose(); },
    onError: (e: Error) => setErr(e.message),
  });
  const delMut = useMutation({
    mutationFn: () => del({ data: { id: slot!.id } }),
    onSuccess: () => { invalidate(); toast.success("Horário removido"); onClose(); },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-extrabold uppercase tracking-tight">
          {editing ? "Editar horário" : "Novo horário"}
        </h2>
        <p className="mt-1 text-xs font-mono uppercase text-muted-foreground">
          {day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
        </p>

        <div className="mt-5 space-y-3">
          {!editing && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Hora</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Duração (min)</label>
                <input type="number" min={15} max={480} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
              </div>
            </div>
          )}
          {editing && (
            <p className="rounded-md border border-border bg-background/40 px-3 py-2 text-sm font-mono">{fmtTime(slot!.starts_at)} · {slot!.duration_minutes}min</p>
          )}

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Para qual aluno?</label>
            <select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary">
              <option value="">Deixar livre (o aluno agenda)</option>
              {students.map((s) => <option key={s.user_id} value={s.user_id}>Aula com {s.display_name}</option>)}
            </select>
          </div>

          {!editing && (
            <>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Modalidade</label>
                <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as "presencial" | "online" })} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary">
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Unidade / Local</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={form.modality === "online" ? "Link / Zoom" : "Ex.: NG 10 Academia"} className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary" />
              </div>
            </>
          )}

          {err && <p className="text-xs font-mono text-destructive uppercase">{err}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Fechar</button>
            {editing ? (
              <>
                <button type="button" onClick={() => delMut.mutate()} disabled={delMut.isPending} className="grid place-items-center rounded-full border border-border px-4 text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50" title="Remover horário">
                  <Trash2 className="size-4" />
                </button>
                <button type="button" onClick={() => { setErr(null); assignMut.mutate(); }} disabled={assignMut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
                  {assignMut.isPending ? "Salvando..." : "Salvar"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setErr(null); if (!form.time) { setErr("Informe a hora"); return; } createMut.mutate(); }} disabled={createMut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
                {createMut.isPending ? "Adicionando..." : "Adicionar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
