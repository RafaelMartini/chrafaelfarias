import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { appointments } from "@/lib/mock-data";

export const Route = createFileRoute("/agenda")({
  head: () => ({ meta: [{ title: "Agenda — KINETIC+" }] }),
  component: AgendaPage,
});

const days = ["DOM 26", "SEG 27", "TER 28", "QUA 29", "QUI 30", "SEX 31", "SÁB 01"];
const slots: Record<string, { time: string; student: string; modality: "presencial" | "online" }[]> = {
  "SEG 27": [
    { time: "07:30", student: "Beatriz", modality: "presencial" },
    { time: "15:00", student: "Rodrigo", modality: "presencial" },
  ],
  "TER 28": [{ time: "18:00", student: "Lucas", modality: "presencial" }],
  "QUI 30": [
    { time: "08:00", student: "Pedro", modality: "presencial" },
    { time: "19:30", student: "Ana", modality: "online" },
  ],
};

function AgendaPage() {
  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Calendário</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Agenda Semanal</h1>
        </div>
        <div className="flex border border-border">
          <button className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-accent text-background">Semana</button>
          <button className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">Mês</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 animate-reveal [animation-delay:100ms]">
        {days.map((d) => {
          const daySlots = slots[d] || [];
          const isHighlight = daySlots.length > 0;
          return (
            <div key={d} className="flex flex-col gap-3">
              <span className={`text-[10px] font-mono text-center uppercase tracking-tighter ${isHighlight ? "text-accent" : "text-muted-foreground"}`}>
                {d}
              </span>
              <div className={`aspect-[3/4] bg-surface border p-2 flex flex-col gap-1.5 ${isHighlight ? "border-accent/50" : "border-border"}`}>
                {daySlots.map((s, i) => (
                  <div key={i} className={`text-[10px] p-1.5 font-mono ${s.modality === "presencial" ? "bg-accent text-background font-bold" : "bg-secondary text-foreground"}`}>
                    {s.time} {s.student}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-16 animate-reveal [animation-delay:200ms]">
        <h2 className="text-2xl font-extrabold uppercase tracking-tighter mb-6">Próximos Agendamentos</h2>
        <div className="space-y-2">
          {appointments.map((a) => (
            <div key={a.id} className="bg-surface border border-border p-4 flex items-center justify-between hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center bg-background border border-border w-14 py-2">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{a.date.split(" ")[0]}</span>
                  <span className="text-lg font-extrabold">{a.date.split(" ")[1]}</span>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-tight">{a.student}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.time} • {a.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-mono uppercase ${a.modality === "presencial" ? "text-accent" : "text-foreground"}`}>{a.modality}</span>
                <span className={`text-[10px] font-mono uppercase px-2 py-1 ${a.status === "confirmed" ? "text-accent bg-accent/10" : "text-foreground bg-secondary"}`}>
                  {a.status === "confirmed" ? "confirmado" : "pendente"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
