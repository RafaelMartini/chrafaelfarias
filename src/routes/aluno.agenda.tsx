import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { CalendarDays, MapPin, Video, CheckCircle2, Clock, Filter } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/aluno/agenda")({
  head: () => ({ meta: [{ title: "Minha Agenda — Rafael Faria" }] }),
  component: StudentAgenda,
});

const slots = [
  { date: "MAI 28", day: "Quarta", times: [
    { time: "07:00", location: "Jardins", type: "presencial", status: "disponivel" as const },
    { time: "09:00", location: "Jardins", type: "presencial", status: "ocupado" as const },
    { time: "18:00", location: "Online", type: "online", status: "disponivel" as const },
  ]},
  { date: "MAI 29", day: "Quinta", times: [
    { time: "08:00", location: "Pinheiros", type: "presencial", status: "disponivel" as const },
    { time: "19:30", location: "Online", type: "online", status: "disponivel" as const },
  ]},
  { date: "MAI 30", day: "Sexta", times: [
    { time: "07:00", location: "Jardins", type: "presencial", status: "disponivel" as const },
    { time: "10:00", location: "Jardins", type: "presencial", status: "reservado" as const },
  ]},
  { date: "JUN 02", day: "Segunda", times: [
    { time: "07:30", location: "Jardins", type: "presencial", status: "disponivel" as const },
    { time: "15:00", location: "Pinheiros", type: "presencial", status: "disponivel" as const },
    { time: "20:00", location: "Online", type: "online", status: "ocupado" as const },
  ]},
];

const filterOptions = ["todos", "presencial", "online"] as const;

function StudentAgenda() {
  const [filter, setFilter] = useState<typeof filterOptions[number]>("todos");

  const filteredSlots = slots.map((s) => ({
    ...s,
    times: filter === "todos" ? s.times : s.times.filter((t) => t.type === filter),
  })).filter((s) => s.times.length > 0);

  return (
    <Shell mode="student">
      <div className="mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Agendamentos</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Horários Disponíveis</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Escolha modalidade, unidade e horário com o seu personal. Horários em verde estão livres.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 animate-reveal [animation-delay:100ms]">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-muted-foreground">
          <Filter className="size-3" />
          <span>Filtrar:</span>
        </div>
        <div className="flex gap-2">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest border rounded-full transition-colors ${
                filter === f
                  ? "bg-accent text-background border-accent font-bold"
                  : "border-border hover:border-accent hover:text-accent"
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
          <CheckCircle2 className="size-4 text-accent" />
          Confirmados
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { date: "MAI 28", day: "Quarta", time: "07:00", location: "Jardins", type: "presencial" as const },
            { date: "MAI 30", day: "Sexta", time: "10:00", location: "Jardins", type: "presencial" as const },
          ].map((a) => (
            <div key={`${a.date}-${a.time}`} className="bg-accent/5 border border-accent/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="flex flex-col items-center bg-background border border-accent/30 w-12 py-2 rounded-xl shrink-0">
                <span className="text-[9px] font-mono text-accent uppercase">{a.date.split(" ")[0]}</span>
                <span className="text-base font-extrabold text-accent">{a.date.split(" ")[1]}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase truncate">{a.day} às {a.time}</p>
                <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground mt-1">
                  {a.type === "presencial" ? <MapPin className="size-3" /> : <Video className="size-3" />}
                  <span>{a.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grade de horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-reveal [animation-delay:200ms]">
        {filteredSlots.map((s) => (
          <div key={s.date} className="bg-surface border border-border p-5 sm:p-6 rounded-2xl">
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
                const statusConfig = {
                  disponivel: { bg: "hover:bg-accent hover:text-background", border: "hover:border-accent", icon: <Clock className="size-3" />, label: "Disponível" },
                  ocupado: { bg: "opacity-40 cursor-not-allowed", border: "", icon: <span className="size-3 rounded-full bg-destructive/50" />, label: "Ocupado" },
                  reservado: { bg: "bg-accent/10", border: "border-accent/30", icon: <CheckCircle2 className="size-3 text-accent" />, label: "Confirmado" },
                };
                const config = statusConfig[t.status];
                return (
                  <button
                    key={t.time}
                    disabled={t.status === "ocupado"}
                    className={`w-full flex items-center justify-between px-4 py-3 border border-border font-mono text-xs uppercase transition-colors rounded-xl ${config.bg} ${config.border}`}
                  >
                    <div className="flex items-center gap-3">
                      {config.icon}
                      <span className="font-bold">{t.time}</span>
                      <span className="text-muted-foreground hidden sm:inline">—</span>
                      <span className="text-muted-foreground hidden sm:inline">{t.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
          <CheckCircle2 className="size-3 text-accent" />
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
