import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shell, MetricCard } from "@/components/Shell";
import { Dumbbell } from "lucide-react";
import { useWorkoutLog } from "@/lib/workout-log";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/aluno/progresso")({
  head: () => ({ meta: [{ title: "Meu Progresso — Rafael Faria" }] }),
  component: Progresso,
});

function Progresso() {
  const { user } = useAuth();
  const { completedCount } = useWorkoutLog();

  const { data: workoutCount = 0 } = useQuery({
    queryKey: ["my-workout-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("workouts")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });

  return (
    <Shell mode="student">
      <div className="mb-8 sm:mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Evolução</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Seu Progresso</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm sm:text-base">
          Acompanhe seus treinos concluídos. Mais métricas aparecem conforme você registra suas sessões.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 animate-reveal [animation-delay:100ms]">
        <MetricCard label="Treinos Concluídos" value={completedCount} />
        <MetricCard label="Meus Treinos" value={workoutCount} highlight />
      </div>

      <section className="mt-8 animate-reveal [animation-delay:200ms]">
        <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Dumbbell className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-sm font-mono uppercase tracking-widest text-muted-foreground">
            Métricas detalhadas em breve
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
            Evolução de carga, composição corporal e conquistas vão aparecer aqui conforme você
            registra seus treinos ao longo do tempo.
          </p>
        </div>
      </section>
    </Shell>
  );
}
