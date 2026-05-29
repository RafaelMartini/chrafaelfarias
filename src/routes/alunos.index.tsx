import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Trash2, SlidersHorizontal } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useStudents, type MockStudent } from "@/lib/students-store";

export const Route = createFileRoute("/alunos/")({
  head: () => ({ meta: [{ title: "Alunos — Rafael Faria" }] }),
  component: AlunosPage,
});

type StatusFilter = "all" | MockStudent["status"];
const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "missed", label: "Faltaram" },
  { key: "new", label: "Novos" },
];

function AlunosPage() {
  const { students, remove } = useStudents();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MockStudent | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter(
      (s) => (filter === "all" || s.status === filter) && (q === "" || s.name.toLowerCase().includes(q)),
    );
  }, [students, query, filter]);

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-8 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Gestão</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Alunos</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">{students.length} aluno(s) vinculado(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          <Plus className="size-4" /> Novo Aluno
        </button>
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-col gap-3 mb-6 animate-reveal [animation-delay:75ms] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aluno…"
            className="w-full rounded-full border border-border bg-card/70 py-2.5 pl-9 pr-4 font-mono text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? students.length : students.filter((s) => s.status === f.key).length;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                  filter === f.key
                    ? "border-primary bg-primary text-primary-foreground font-bold"
                    : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl animate-reveal [animation-delay:100ms]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <th className="px-4 py-4 sm:px-6">Aluno</th>
              <th className="px-4 py-4 hidden md:table-cell">Telefone</th>
              <th className="px-4 py-4 hidden sm:table-cell">Objetivo</th>
              <th className="px-4 py-4 hidden lg:table-cell">Adesão</th>
              <th className="px-4 py-4 text-right sm:px-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-mono text-muted-foreground">Nenhum aluno encontrado.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-background/40 transition-colors">
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">{s.initials}</div>
                    <div className="min-w-0">
                      <span className="font-bold uppercase tracking-tight block truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground sm:hidden">{s.goal} · {s.compliance}%</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground font-mono text-xs hidden md:table-cell">{s.phone}</td>
                <td className="px-4 py-4 text-muted-foreground font-mono text-xs hidden sm:table-cell">{s.goal}</td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className={`font-mono text-xs font-extrabold ${s.compliance > 85 ? "text-primary" : s.compliance > 70 ? "text-foreground" : "text-destructive"}`}>{s.compliance}%</span>
                </td>
                <td className="px-4 py-4 text-right sm:px-6">
                  <div className="flex items-center justify-end gap-3">
                    <Link to="/montar-treino" className="text-[10px] font-mono uppercase text-primary hover:underline whitespace-nowrap">
                      Montar Treino →
                    </Link>
                    <button
                      onClick={() => setToDelete(s)}
                      title="Remover aluno"
                      className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <NewStudentModal onClose={() => setOpen(false)} />}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Remover aluno"
        description={toDelete ? `${toDelete.name} será desvinculado da sua lista.` : ""}
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (toDelete) {
            remove(toDelete.id);
            toast.success("Aluno removido", { description: toDelete.name });
          }
          setToDelete(null);
        }}
      />
    </Shell>
  );
}

function NewStudentModal({ onClose }: { onClose: () => void }) {
  const { add } = useStudents();
  const [form, setForm] = useState({ name: "", phone: "", goal: "", plan: "Hipertrofia" });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-primary" /> Novo Aluno
        </h2>
        <p className="mt-1 text-xs font-mono uppercase text-muted-foreground">Adiciona um aluno à sua lista (demo).</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(form);
            toast.success("Aluno criado", { description: form.name });
            onClose();
          }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(11) 90000-0000" />
          <Field label="Objetivo" value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} placeholder="Ex: Ganho de massa" />
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Plano</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none focus:border-primary"
            >
              {["Hipertrofia", "Emagrecimento", "Powerlifting", "Condicionamento", "HIIT"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Cancelar</button>
            <button type="submit" className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground">Criar aluno</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</label>
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
