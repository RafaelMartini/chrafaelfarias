import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell, MetricCard } from "@/components/Shell";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { listMyStudents, listMyExercises } from "@/lib/admin.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Rafael Faria — Painel do Personal" },
      { name: "description", content: "Plataforma de gestão de alta performance para personal trainers." },
    ],
  }),
  component: AdminDashboard,
});

type Student = { id: string; user_id: string; display_name: string | null; goal: string | null };

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "AL";
}

function AdminDashboard() {
  const { user, role } = useRequireTrainer();
  const listStudents = useServerFn(listMyStudents);
  const listExercises = useServerFn(listMyExercises);
  const enabled = !!user && role === "trainer";

  const { data: students = [] } = useQuery({
    queryKey: ["my-students"],
    queryFn: () => listStudents() as Promise<Student[]>,
    enabled,
  });
  const { data: exercises = [] } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: () => listExercises() as Promise<unknown[]>,
    enabled,
  });

  return (
    <Shell mode="admin">
      <section className="space-y-8 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Admin Performance</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase">Visão Geral</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Alunos" value={students.length} hint="vinculados a você" highlight />
          <MetricCard label="Exercícios na Biblioteca" value={exercises.length} hint="disponíveis para montar treinos" />
          <div className="rounded-3xl border border-primary/40 bg-primary/10 p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
            <p className="text-xs font-mono uppercase text-primary mb-4">Ações rápidas</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/alunos" className="rounded-full bg-primary px-4 py-2 text-[10px] font-mono font-bold uppercase text-primary-foreground">+ Aluno</Link>
              <Link to="/biblioteca" className="rounded-full border border-border px-4 py-2 text-[10px] font-mono font-bold uppercase hover:border-primary hover:text-primary">+ Exercício</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 animate-reveal [animation-delay:150ms]">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h2 className="text-2xl font-extrabold uppercase tracking-tighter">Meus Alunos</h2>
          <Link to="/alunos" className="rounded-full border border-border px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary">
            Ver todos →
          </Link>
        </div>

        <div className="space-y-2">
          {students.length === 0 && (
            <p className="rounded-3xl border border-dashed border-border p-8 text-center text-xs font-mono uppercase text-muted-foreground">
              Nenhum aluno ainda. Cadastre em <Link to="/alunos" className="text-primary hover:underline">Alunos</Link>.
            </p>
          )}
          {students.map((s) => (
            <Link
              key={s.id}
              to="/alunos/$studentId"
              params={{ studentId: s.user_id }}
              className="group flex items-center justify-between rounded-3xl border border-border bg-card/75 p-4 shadow-xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-xs text-primary">{initials(s.display_name ?? "")}</div>
                <div>
                  <p className="font-bold uppercase tracking-tight">{s.display_name ?? "—"}</p>
                  {s.goal && <p className="text-xs text-muted-foreground font-mono">{s.goal}</p>}
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase text-primary group-hover:underline">Montar treino →</span>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
