import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import { Shell } from "@/components/Shell";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { listMyStudents, createStudent } from "@/lib/admin.functions";

export const Route = createFileRoute("/alunos/")({
  head: () => ({ meta: [{ title: "Alunos — Rafael Faria" }] }),
  component: AlunosPage,
});

type Student = {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  goal: string | null;
  created_at: string;
};

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "AL";
}

function AlunosPage() {
  const { user, role } = useRequireTrainer();
  const list = useServerFn(listMyStudents);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["my-students"],
    queryFn: () => list() as Promise<Student[]>,
    enabled: !!user && role === "trainer",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => q === "" || (s.display_name ?? "").toLowerCase().includes(q));
  }, [students, query]);

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
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl animate-reveal [animation-delay:100ms]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <th className="px-4 py-4 sm:px-6">Aluno</th>
              <th className="px-4 py-4 hidden md:table-cell">Telefone</th>
              <th className="px-4 py-4 hidden sm:table-cell">Objetivo</th>
              <th className="px-4 py-4 text-right sm:px-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {isLoading && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-xs font-mono text-muted-foreground">Carregando…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-xs font-mono text-muted-foreground">Nenhum aluno ainda. Clique em “Novo Aluno”.</td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-background/40 transition-colors">
                <td className="px-4 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">{initials(s.display_name ?? "")}</div>
                    <div className="min-w-0">
                      <span className="font-bold uppercase tracking-tight block truncate">{s.display_name ?? "—"}</span>
                      {s.goal && <span className="text-[10px] font-mono text-muted-foreground sm:hidden">{s.goal}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted-foreground font-mono text-xs hidden md:table-cell">{s.phone ?? "—"}</td>
                <td className="px-4 py-4 text-muted-foreground font-mono text-xs hidden sm:table-cell">{s.goal ?? "—"}</td>
                <td className="px-4 py-4 text-right sm:px-6">
                  <Link
                    to="/alunos/$studentId"
                    params={{ studentId: s.user_id }}
                    className="text-[10px] font-mono uppercase text-primary hover:underline whitespace-nowrap"
                  >
                    Montar Treino →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && <NewStudentModal onClose={() => setOpen(false)} />}
    </Shell>
  );
}

function NewStudentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const create = useServerFn(createStudent);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", goal: "" });
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-students"] });
      toast.success("Aluno criado", { description: `${form.name} já pode entrar com o e-mail e senha definidos.` });
      onClose();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight flex items-center gap-2">
          <Plus className="size-5 text-primary" /> Novo Aluno
        </h2>
        <p className="mt-1 text-xs font-mono uppercase text-muted-foreground">Cria o aluno e a credencial de login dele.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); setErr(null); mut.mutate(); }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Nome do aluno" />
          <Field label="E-mail de acesso" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required placeholder="aluno@email.com" />
          <Field label="Senha" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required placeholder="Mínimo 6 caracteres" />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="(11) 90000-0000" />
          <Field label="Objetivo" value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} placeholder="Ex: Ganho de massa" />
          {err && <p className="text-xs font-mono text-destructive uppercase">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={mut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
              {mut.isPending ? "Criando..." : "Criar aluno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
