import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type CalendarPhoto = { taken_on: string; url: string | null; label?: string | null };

/**
 * Calendário mensal que mostra a própria foto no dia em que ela foi tirada
 * (campo `taken_on`). Usado na Comparação Física. Datas vêm como "YYYY-MM-DD";
 * normalizamos para o meio-dia local pra não escorregar de dia por fuso.
 */
export function PhotoCalendar({ photos }: { photos: CalendarPhoto[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const vYear = viewMonth.getFullYear();
  const vMonth = viewMonth.getMonth();
  const daysInMonth = new Date(vYear, vMonth + 1, 0).getDate();
  const startWeekday = new Date(vYear, vMonth, 1).getDay();

  // Mapa dia-do-mês -> foto (a primeira encontrada para aquele dia).
  const byDay = useMemo(() => {
    const map = new Map<number, CalendarPhoto>();
    for (const p of photos) {
      if (!p.taken_on) continue;
      const d = new Date(`${p.taken_on}T12:00:00`);
      if (d.getFullYear() === vYear && d.getMonth() === vMonth && !map.has(d.getDate())) {
        map.set(d.getDate(), p);
      }
    }
    return map;
  }, [photos, vYear, vMonth]);

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
          const photo = byDay.get(day);
          return (
            <div
              key={day}
              title={photo ? `${photo.label ?? ""}`.trim() || undefined : undefined}
              className={`relative aspect-square overflow-hidden rounded-xl border text-sm font-bold tabular-nums ${
                photo ? "border-primary" : "border-border/50 bg-background/30"
              } ${isToday(day) ? "ring-2 ring-primary/50" : ""}`}
            >
              {photo?.url && (
                <img
                  src={photo.url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <span
                className={`absolute left-1 top-0.5 z-10 text-[11px] ${
                  photo
                    ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                    : "text-muted-foreground"
                }`}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-mono uppercase text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-primary bg-primary" /> Foto
        </span>
        <span className="font-bold text-foreground">
          {byDay.size} foto(s) em {viewMonth.toLocaleDateString("pt-BR", { month: "long" })}
        </span>
      </div>
    </div>
  );
}
