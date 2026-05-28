import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/aluno")({
  head: () => ({ meta: [{ title: "Meu Treino — Rafael Faria" }] }),
  component: AlunoPage,
});

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type WorkoutItem = {
  id: string;
  workout_id: string;
  sets: number;
  reps: string;
  load_kg: number | null;
  rest_seconds: number | null;
  order_index: number;
  exercise: { id: string; name: string; description: string | null; video_url: string | null; muscle_group: string | null } | null;
};

type Workout = {
  id: string;
  name: string;
  notes: string | null;
  day_of_week: number | null;
};

function embedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return null;
  }
}

function AlunoPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-workouts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: workouts, error } = await supabase
        .from("workouts")
        .select("id, name, notes, day_of_week")
        .eq("student_id", user!.id)
        .order("day_of_week", { ascending: true });
      if (error) throw error;
      const ids = (workouts ?? []).map((w) => w.id);
      let items: WorkoutItem[] = [];
      if (ids.length > 0) {
        const { data: rows, error: e2 } = await supabase
          .from("workout_exercises")
          .select("id, workout_id, sets, reps, load_kg, rest_seconds, order_index, exercise:exercises(id, name, description, video_url, muscle_group)")
          .in("workout_id", ids)
          .order("order_index", { ascending: true });
        if (e2) throw e2;
        items = (rows ?? []) as unknown as WorkoutItem[];
      }
      return { workouts: (workouts ?? []) as Workout[], items };
    },
  });

  const workouts = data?.workouts ?? [];
  const items = data?.items ?? [];

  const todayWorkouts = useMemo(
    () => workouts.filter((w) => w.day_of_week === selectedDay),
    [workouts, selectedDay],
  );

  const availableDays = useMemo(() => {
    const s = new Set(workouts.map((w) => w.day_of_week).filter((d): d is number => d !== null));
    return s;
  }, [workouts]);

  return (
    <Shell mode="student">
      <section className="space-y-8 animate-reveal">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Olá</p>
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight">Treino do Dia</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((d, i) => {
              const has = availableDays.has(i);
              const active = i === selectedDay;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(i)}
                  className={`relative rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${active ? "border-primary bg-primary text-primary-foreground font-bold" : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"}`}
                >
                  {d.slice(0, 3)}
                  {has && !active && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-12 space-y-10 animate-reveal [animation-delay:100ms]">
        {isLoading && <p className="text-xs font-mono text-muted-foreground">Carregando treinos…</p>}

        {!isLoading && todayWorkouts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum treino programado para {DAYS[selectedDay]}.</p>
            <p className="mt-2 text-xs font-mono text-muted-foreground">Fale com seu instrutor para receber o seu treino.</p>
          </div>
        )}

        {todayWorkouts.map((w) => {
          const workoutItems = items.filter((it) => it.workout_id === w.id);
          return (
            <div key={w.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold uppercase tracking-tighter">
                  <span className="text-muted-foreground">{DAYS[selectedDay]}: </span>{w.name}
                </h2>
                <span className="text-xs font-mono border border-border px-3 py-1 rounded-full">{workoutItems.length} EXERCÍCIOS</span>
              </div>
              {w.notes && <p className="text-sm text-muted-foreground italic">{w.notes}</p>}

              <div className="space-y-4">
                {workoutItems.map((we, idx) => {
                  const ex = we.exercise;
                  const embed = embedUrl(ex?.video_url ?? null);
                  return (
                    <div key={we.id} className="group grid rounded-3xl border border-border bg-card/75 p-4 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40 md:grid-cols-[1.2fr_2fr] gap-6">
                      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/50 bg-background/50">
                        {embed ? (
                          <iframe
                            src={embed}
                            title={ex?.name ?? "Vídeo do exercício"}
                            className="h-full w-full"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-center px-4">
                            <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                              ▶ Vídeo não disponível
                            </span>
                          </div>
                        )}
                        {ex?.muscle_group && (
                          <div className="absolute right-2 top-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-mono uppercase text-primary">
                            {ex.muscle_group}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between py-2">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-3">
                            <h3 className="text-xl font-extrabold uppercase tracking-tight">
                              {String(idx + 1).padStart(2, "0")}. {ex?.name ?? "Exercício"}
                            </h3>
                            <span className="text-xs font-mono text-primary whitespace-nowrap">{we.sets} SÉRIES</span>
                          </div>
                          {ex?.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{ex.description}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <Stat label="Reps" value={we.reps} />
                          <Stat label="Carga" value={we.load_kg != null ? `${we.load_kg}kg` : "—"} />
                          <Stat label="Descanso" value={we.rest_seconds != null ? `${we.rest_seconds}s` : "—"} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {workoutItems.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                    <p className="text-xs font-mono uppercase text-muted-foreground">Este treino ainda não possui exercícios.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4">
          <Link to="/aluno/agenda" className="block w-full rounded-full bg-primary py-3 text-center text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.01]">
            Ver Agenda
          </Link>
        </div>
      </section>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/50 border border-border/30 p-2 rounded-2xl">
      <p className="text-[9px] font-mono text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-extrabold">{value}</p>
    </div>
  );
}
