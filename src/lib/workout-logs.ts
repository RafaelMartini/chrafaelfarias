import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Conclusões de treino do aluno, persistidas na tabela `workout_logs` do
 * Supabase (RLS: o aluno gerencia só os próprios logs). Cada log é uma sessão
 * concluída com `completed_at` (timestamp), o que permite o Progresso real
 * por período (semana/mês).
 */

export type WorkoutLog = { id: string; workout_id: string; completed_at: string };

function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.toDateString() === ref.toDateString();
}

export function useWorkoutLogs() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["workout-logs", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WorkoutLog[]> => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, workout_id, completed_at")
        .order("completed_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const toggleMut = useMutation({
    mutationFn: async (workoutId: string): Promise<boolean> => {
      if (!user) throw new Error("Não autenticado");
      const now = new Date();
      const todays = logs.filter((l) => l.workout_id === workoutId && isSameDay(l.completed_at, now));
      if (todays.length) {
        const { error } = await supabase.from("workout_logs").delete().in("id", todays.map((t) => t.id));
        if (error) throw new Error(error.message);
        return false;
      }
      const { error } = await supabase.from("workout_logs").insert({ workout_id: workoutId, student_id: user.id });
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workout-logs"] }),
  });

  const isCompletedToday = (workoutId: string) =>
    logs.some((l) => l.workout_id === workoutId && isSameDay(l.completed_at, new Date()));

  return {
    logs,
    isLoading,
    completedCount: logs.length,
    isCompletedToday,
    toggle: (workoutId: string) => toggleMut.mutateAsync(workoutId),
  };
}
