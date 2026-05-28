import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { students } from "@/lib/mock-data";

export const Route = createFileRoute("/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Rafael Faria" }] }),
  component: AlunosPage,
});

function AlunosPage() {
  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Gestão</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Alunos</h1>
        </div>
        <button className="rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]">
          + Novo Aluno
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl animate-reveal [animation-delay:100ms]">
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
                    <div className="flex size-9 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">{s.initials}</div>
                    <span className="font-bold uppercase tracking-tight">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.plan}</td>
                <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.lastWorkout}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-border">
                      <div className={`h-full ${s.compliance > 85 ? "bg-primary" : "bg-muted-foreground"}`} style={{ width: `${s.compliance}%` }} />
                    </div>
                    <span className="text-xs font-mono">{s.compliance}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-mono uppercase ${s.status === "active" ? "text-primary bg-primary/10" : s.status === "missed" ? "text-destructive bg-destructive/10" : "text-foreground bg-secondary"}`}>
                    {s.status === "active" ? "ativo" : s.status === "missed" ? "faltou" : "novo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[10px] font-mono uppercase text-primary hover:underline">Montar Treino</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
