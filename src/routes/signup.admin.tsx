import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-rafael-faria.png";

export const Route = createFileRoute("/signup/admin")({
  head: () => ({ meta: [{ title: "Cadastro Admin — Rafael Faria" }] }),
  component: SignupAdminPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  inviteCode: z.string().trim().min(1, "Código de acesso é obrigatório"),
});

function SignupAdminPage() {
  const navigate = useNavigate();
  const { user, role: currentRole, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", inviteCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && currentRole) navigate({ to: currentRole === "trainer" ? "/dashboard" : "/aluno", replace: true });
  }, [authLoading, user, currentRole, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: parsed.data.name,
          role: "trainer",
          invite_code: parsed.data.inviteCode,
        },
      },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setInfo("Conta criada! Você já pode fazer login.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <Link to="/" className="inline-block">
          <img src={logo} alt="Coach Rafael Faria" className="h-24 w-auto sm:h-28" />
        </Link>
        <div className="mt-10 inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
          Área restrita · Admin
        </div>
        <h1 className="mt-4 text-4xl font-extrabold uppercase tracking-tight">Cadastro Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono uppercase">
          Acesso exclusivo para administradores autorizados
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nome completo</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full border border-border bg-card/70 px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">E-mail profissional</label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full border border-border bg-card/70 px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Senha</label>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 w-full border border-border bg-card/70 px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Código de acesso</label>
            <input
              value={form.inviteCode}
              onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
              placeholder="Fornecido pela equipe Rafael Faria"
              className="mt-2 w-full border border-border bg-card/70 px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          {error && <p className="text-xs font-mono text-destructive uppercase">{error}</p>}
          {info && <p className="text-xs font-mono text-primary uppercase">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-4 text-sm font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Criando..." : "Solicitar acesso"}
          </button>
        </form>

        <p className="mt-8 text-xs font-mono uppercase text-muted-foreground text-center">
          É aluno?{" "}
          <Link to="/signup" className="text-primary hover:underline">Cadastro de aluno</Link>
        </p>
        <p className="mt-2 text-xs font-mono uppercase text-muted-foreground text-center">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
