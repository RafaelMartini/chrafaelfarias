import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { MapPin, Video, CheckCircle2, Clock, Filter, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStudentBookings, slotKey } from "@/lib/student-bookings";

export const Route = createFileRoute("/aluno/agenda")({
  head: () => ({ meta: [{ title: "Minha Agenda — Rafael Faria" }] }),
  component: StudentAgenda,
});

type SlotStatus = "disponivel" | "ocupado" | "reservado";
type SlotTime = { time: string; location: string; type: "presencial" | "online"; status: SlotStatus };
type DaySlots = { date: string; day: string; times: SlotTime[] };

const slots: DaySlots[] = [
  { date: "MAI 28", day: "Quarta", times: [
    { time: "07:00", location: "Jardins", type: "presencial", status: "disponivel" },
    { time: "09:00", location: "Jardins", type: "presencial", status: "ocupado" },
    { time: "18:00", location: "Online", type: "online", status: "disponivel" },
  ]},
  { date: "MAI 29", day: "Quinta", times: [
    { time: "08:00", location: "Pinheiros", type: "presencial", status: "disponivel" },
    { time: "12:00", location: "Online", type: "online", status: "disponivel" },
    { time: "19:30", location: "Online", type: "online", status: "disponivel" },
  ]},
  { date: "MAI 30", day: "Sexta", times: [
    { time: "07:00", location: "Jardins", type: "presencial", status: "disponivel" },
    { time: "10:00", location: "Jardins", type: "presencial", status: "reservado" },
    { time: "17:00", location: "Pinheiros", type: "presencial", status: "ocupado" },
  ]},
  { date: "JUN 02", day: "Segunda", times: [
    { time: "07:30", location: "Jardins", type: "presencial", status: "disponivel" },
    { time: "15:00", location: "Pinheiros", type: "presencial", status: "disponivel" },
    { time: "20:00", location: "Online", type: "online", status: "ocupado" },
  ]},
  { date: "JUN 03", day: "Terça", times: [
    { time: "06:30", location: "Jardins", type: "presencial", status: "disponivel" },
    { time: "18:30", location: "Pinheiros", type: "presencial", status: "disponivel" },
  ]},
  { date: "JUN 05", day: "Quinta", times: [
    { time: "08:00", location: "Online", type: "online", status: "disponivel" },
    { time: "19:00", location: "Jardins", type: "presencial", status: "disponivel" },
  ]},
];

const filterOptions = ["todos", "presencial", "online"] as const;

function StudentAgenda() {
  const [filter, setFilter] = useState<(typeof filterOptions)[number]>("todos");
  const { isBooked, toggle } = useStudentBookings();

  const filteredSlots = slots
    .map((s) => ({ ...s, times: filter === "todos" ? s.times : s.times.filter((t) => t.type === filter) }))
    .filter((s) => s.times.length > 0);

  // Confirmados = reservados pelo personal (seed) + reservas do aluno (cancelável).
  const confirmados = slots.flatMap((s) =>
    s.times
      .filter((t) => t.status === "reservado" || isBooked(slotKey(s.date, t.time)))
      .map((t) => ({
        date: s.date,
        day: s.day,
        time: t.time,
        location: t.location,
        type: t.type,
        cancelable: isBooked(slotKey(s.date, t.time)),
      })),
  );

  const livresCount = slots.reduce((acc, s) => acc + s.times.filter((t) => t.status === "disponivel").length, 0);

  const handleBook = (date: string, day: string, time: string, location: string) => {
    const nowBooked = toggle(slotKey(date, time));
    if (nowBooked) toast.success("Horário reservado!", { description: `${day} às ${time} — ${location}` });
    else toast("Reserva cancelada", { description: `${day} às ${time}` });
  };

  return (
    <Shell mode="student">
      <div className="mb-6 sm:mb-8 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Agendamentos</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Horários Disponíveis</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm sm:text-base">
          Escolha modalidade, unidade e horário com o seu personal. Horários em verde estão livres.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{livresCount} horários livres</span>
          <span className="rounded-full bg-secondary px-3 py-1 text-foreground">{confirmados.length} confirmado(s)</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-8 animate-reveal [animation-delay:100ms]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
          <Filter className="size-3" />
          <span>Filtrar:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 text-[10px] font-mono uppercase tracking-widest border rounded-full transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary font-bold"
                  : "border-border hover:border-primary hover:bg-secondary hover:text-primary"
              }`}
            >
              {f === "todos" ? "Todos" : f === "presencial" ? "Presencial" : "Online"}
            </button>
          ))}
        </div>
      </div>

      {/* Próximos agendamentos confirmados */}
      <section className="mb-8 animate-reveal [animation-delay:150ms]">
        <h2 className="text-sm font-extrabold uppercase tracking-widest mb-4 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary" />
          Confirmados
        </h2>
        {confirmados.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border p-6 text-center text-xs font-mono uppercase text-muted-foreground">
            Nenhum horário confirmado. Reserve um horário livre abaixo.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {confirmados.map((a) => (
            <div key={`${a.date}-${a.time}`} className="flex items-center gap-3 sm:gap-4 rounded-3xl border border-primary/30 bg-primary/10 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex w-12 shrink-0 flex-col items-center rounded-2xl border border-primary/30 bg-background/50 py-2">
                <span className="text-[9px] font-mono text-primary uppercase">{a.date.split(" ")[0]}</span>
                <span className="text-base font-extrabold text-primary">{a.date.split(" ")[1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold uppercase truncate">{a.day} às {a.time}</p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground mt-1">
                  {a.type === "presencial" ? <MapPin className="size-3" /> : <Video className="size-3" />}
                  <span>{a.location}</span>
                </div>
              </div>
              {a.cancelable ? (
                <button
                  onClick={() => handleBook(a.date, a.day, a.time, a.location)}
                  title="Cancelar reserva"
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <X className="size-4" strokeWidth={3} />
                </button>
              ) : (
                <span className="shrink-0 text-[8px] font-mono uppercase text-primary/70">pelo<br />personal</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Grade de horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-reveal [animation-delay:200ms]">
        {filteredSlots.map((s) => (
          <div key={s.date} className="rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex flex-col items-center bg-background border border-border w-14 py-2 rounded-2xl shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.date.split(" ")[0]}</span>
                <span className="text-lg font-extrabold">{s.date.split(" ")[1]}</span>
              </div>
              <div>
                <p className="text-lg font-extrabold uppercase tracking-tight">{s.day}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">
                  {s.times.filter((t) => t.status === "disponivel").length} horários livres
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {s.times.map((t) => {
                const booked = t.status === "disponivel" && isBooked(slotKey(s.date, t.time));
                const effective: SlotStatus =
                  t.status === "ocupado" ? "ocupado" : t.status === "reservado" || booked ? "reservado" : "disponivel";
                const statusConfig = {
                  disponivel: { bg: "hover:bg-primary hover:text-primary-foreground", border: "hover:border-primary", icon: <Clock className="size-3" />, label: "Disponível" },
                  ocupado: { bg: "opacity-40 cursor-not-allowed", border: "", icon: <span className="size-3 rounded-full bg-destructive/50" />, label: "Ocupado" },
                  reservado: { bg: "bg-primary/10", border: "border-primary/30", icon: <CheckCircle2 className="size-3 text-primary" />, label: booked ? "Reservado — cancelar" : "Confirmado" },
                };
                const config = statusConfig[effective];
                const clickable = t.status === "disponivel";
                return (
                  <button
                    key={t.time}
                    disabled={t.status === "ocupado"}
                    onClick={clickable ? () => handleBook(s.date, s.day, t.time, t.location) : undefined}
                    aria-pressed={booked}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 border border-border font-mono text-xs uppercase transition-colors rounded-xl ${config.bg} ${config.border}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {config.icon}
                      <span className="font-bold">{t.time}</span>
                      <span className="text-muted-foreground hidden sm:inline">—</span>
                      <span className="text-muted-foreground truncate">{t.location}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {t.type === "presencial" ? (
                        <MapPin className="size-3 text-muted-foreground" />
                      ) : (
                        <Video className="size-3 text-muted-foreground" />
                      )}
                      <span className="text-[9px] uppercase hidden sm:inline">{config.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-[10px] font-mono uppercase text-muted-foreground animate-reveal [animation-delay:300ms]">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3 text-primary" />
          <span>Confirmado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-destructive/50" />
          <span>Ocupado</span>
        </div>
      </div>
    </Shell>
  );
}
