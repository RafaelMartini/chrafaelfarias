import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Calendário mensal que marca os dias em que houve treino concluído.
 * Recebe os logs (com completed_at) e navega por mês (sem passar do atual).
 */
export function TrainingCalendar({
  logs,
  legend = "Treinou",
}: {
  logs: { completed_at: string }[];
  legend?: string;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const vYear = viewMonth.getFullYear();
  const vMonth = viewMonth.getMonth();
  const daysInMonth = new Date(vYear, vMonth + 1, 0).getDate();
  const startWeekday = new Date(vYear, vMonth, 1).getDay();

  const trainedDays = useMemo(() => {
    const set = new Set<number>();
    for (const l of logs) {
      const d = new Date(l.completed_at);
      if (d.getFullYear() === vYear && d.getMonth() === vMonth) set.add(d.getDate());
    }
    return set;
  }, [logs, vYear, vMonth]);

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isToday = (day: number) => monthOffset === 0 && day === now.getDate();

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3">
        <span className="text-xs font-mono uppercase capitalize text-muted-foreground">
          {viewMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((m) => m - 1)}
            className="grid size-8 place-items-center rounded-full border border-border hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setMonthOffset((m) => Math.min(0, m + 1))}
            disabled={monthOffset >= 0}
            className="grid size-8 place-items-center rounded-full border border-border hover:border-primary hover:text-primary disabled:opacity-30"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-mono uppercase text-muted-foreground pb-1"
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const trained = trainedDays.has(day);
          return (
            <div
              key={day}
              className={`relative aspect-square rounded-xl border flex items-center justify-center text-sm font-bold tabular-nums transition-colors ${
                trained
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/50 bg-background/30 text-muted-foreground"
              } ${isToday(day) ? "ring-2 ring-primary/50" : ""}`}
            >
              {day}
              {trained && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-primary bg-background text-primary">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-primary bg-primary" /> {legend}
        </span>
        <span className="font-bold text-foreground">
          {trainedDays.size} dia(s) em {viewMonth.toLocaleDateString("pt-BR", { month: "long" })}
        </span>
      </div>
    </div>
  );
}
