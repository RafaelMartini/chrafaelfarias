import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/Shell";
import { useAuth } from "@/hooks/use-auth";
import { listMyStudents, createStudent } from "@/lib/admin.functions";

export const Route = createFileRoute("/alunos")({
  head: () => ({ meta: [{ title: "Alunos — Rafael Faria" }] }),
  component: AlunosPage,
});

function AlunosPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const list = useServerFn(listMyStudents);
  const [open, setOpen] = useState(false);

  if (!loading && (!user || role !== "trainer")) {
    navigate({ to: "/login", replace: true });
  }

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["my-students"],
    queryFn: () => list(),
    enabled: !!user && role === "trainer",
  });

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Gestão</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Alunos</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">{students.length} aluno(s) vinculado(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          + Novo Aluno
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl animate-reveal [animation-delay:100ms]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
              <th className="px-6 py-4">Aluno</th>
              <th className="px-6 py-4">Telefone</th>
              <th className="px-6 py-4">Objetivo</th>
              <th className="px-6 py-4">Cadastro</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {isLoading && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-mono text-muted-foreground">Carregando…</td></tr>
            )}
            {!isLoading && students.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-mono text-muted-foreground">Nenhum aluno cadastrado ainda.</td></tr>
            )}
            {students.map((s) => {
              const initials = (s.display_name || "AL")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr key={s.id} className="hover:bg-background/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">{initials}</div>
                      <span className="font-bold uppercase tracking-tight">{s.display_name ?? "Sem nome"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.phone ?? "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{s.goal ?? "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to="/alunos/$studentId" params={{ studentId: s.user_id }} className="text-[10px] font-mono uppercase text-primary hover:underline">
                      Montar Treino →
                    </Link>
                  </td>
                </tr>
              );
            })}
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
      onClose();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight">Novo Aluno</h2>
        <p className="mt-1 text-xs font-mono uppercase text-muted-foreground">Será criado um usuário vinculado a você.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            mut.mutate();
          }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
          <Field label="Senha provisória" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Objetivo" value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} />
          {err && <p className="text-xs font-mono text-destructive uppercase">{err}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
              {mut.isPending ? "Criando..." : "Criar aluno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
