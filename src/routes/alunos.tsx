import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { students } from "@/lib/mock-data";

export const Route = createFileRoute("/alunos")({
  head: () => ({ meta: [{ title: "Alunos — KINETIC+" }] }),
  component: AlunosPage,
});

function AlunosPage() {
  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Gestão</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Alunos</h1>
        </div>
        <button className="bg-accent text-background px-5 py-3 text-xs font-extrabold uppercase tracking-widest hover:brightness-110 transition">
          + Novo Aluno
        </button>
      </div>

      <div className="bg-surface border border-border overflow-hidden animate-reveal [animation-delay:100ms] rounded-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <th className="px-6 py-4">Aluno</th>
              <th className="px-6 py-4">Plano</th>
              <th className="px-6 py-4">Último Treino</th>
              <th className="px-6 py-4">Adesão</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-background/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 bg-background border border-border flex items-center justify-center font-mono text-[10px] text-accent rounded-2xl">{s.initials}</div>
                    <span className="font-bold uppercase tracking-tight">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.plan}</td>
                <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.lastWorkout}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-border">
                      <div className={`h-full ${s.compliance > 85 ? "bg-accent" : "bg-muted-foreground"}`} style={{ width: `${s.compliance}%` }} />
                    </div>
                    <span className="text-xs font-mono">{s.compliance}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-mono uppercase px-2 py-1 ${s.status === "active" ? "text-accent bg-accent/10" : s.status === "missed" ? "text-destructive bg-destructive/10" : "text-foreground bg-secondary"}`}>
                    {s.status === "active" ? "ativo" : s.status === "missed" ? "faltou" : "novo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[10px] font-mono uppercase text-accent hover:underline">Montar Treino</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
