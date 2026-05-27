import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/aluno/agenda")({
  head: () => ({ meta: [{ title: "Minha Agenda — KINETIC+" }] }),
  component: StudentAgenda,
});

const slots = [
  { date: "MAI 28", day: "Quarta", times: ["07:00 — Jardins", "09:00 — Jardins", "18:00 — Online"] },
  { date: "MAI 29", day: "Quinta", times: ["08:00 — Pinheiros", "19:30 — Online"] },
  { date: "MAI 30", day: "Sexta", times: ["07:00 — Jardins"] },
  { date: "JUN 02", day: "Segunda", times: ["07:30 — Jardins", "15:00 — Pinheiros"] },
];

function StudentAgenda() {
  return (
    <Shell mode="student">
      <div className="mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Agendamentos</p>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight">Horários Disponíveis</h1>
        <p className="text-muted-foreground mt-3">Escolha modalidade, unidade e horário com o seu personal.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 animate-reveal [animation-delay:100ms]">
        {slots.map((s) => (
          <div key={s.date} className="bg-surface border border-border p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="flex flex-col items-center bg-background border border-border w-14 py-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{s.date.split(" ")[0]}</span>
                <span className="text-lg font-extrabold">{s.date.split(" ")[1]}</span>
              </div>
              <p className="text-lg font-extrabold uppercase tracking-tight">{s.day}</p>
            </div>
            <div className="space-y-2">
              {s.times.map((t) => (
                <button key={t} className="w-full text-left px-4 py-3 border border-border font-mono text-xs uppercase hover:border-accent hover:bg-accent hover:text-background transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
