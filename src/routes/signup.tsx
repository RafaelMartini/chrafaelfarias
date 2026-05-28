import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-rafael-faria.png";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — Rafael Faria" }] }),
  component: SignupPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, role: currentRole } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: currentRole === "trainer" ? "/" : "/aluno", replace: true });
  }, [user, currentRole, navigate]);

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
        data: { display_name: parsed.data.name, role: "aluno" },

      },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setInfo("Conta criada! Você já pode fazer login.");
  };

  const onGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <Link to="/" className="inline-block">
          <img src={logo} alt="Coach Rafael Faria" className="h-24 w-auto sm:h-28" />
        </Link>
        <h1 className="mt-10 text-4xl font-extrabold uppercase tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono uppercase">Comece sua jornada de performance</p>

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
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">E-mail</label>
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
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Esta conta é exclusiva para alunos.{" "}
            <Link to="/signup/personal" className="text-primary hover:underline">Sou personal trainer</Link>
          </p>




          {error && <p className="text-xs font-mono text-destructive uppercase">{error}</p>}
          {info && <p className="text-xs font-mono text-primary uppercase">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-4 text-sm font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-mono uppercase text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={onGoogle}
          className="w-full rounded-full border border-border py-4 text-sm font-bold uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary"
        >
          Continuar com Google
        </button>

        <p className="mt-8 text-xs font-mono uppercase text-muted-foreground text-center">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
