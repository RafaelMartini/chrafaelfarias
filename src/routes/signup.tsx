import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta — KINETIC+" }] }),
  component: SignupPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
  role: z.enum(["trainer", "aluno"]),
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, role: currentRole } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "aluno" as "trainer" | "aluno" });
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
        data: { display_name: parsed.data.name, role: parsed.data.role },
      },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setInfo("Conta criada! Verifique seu e-mail para confirmar e fazer login.");
  };

  const onGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="text-2xl font-extrabold tracking-tighter uppercase italic">
          KINETIC<span className="text-accent">+</span>
        </Link>
        <h1 className="mt-10 text-4xl font-extrabold uppercase tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono uppercase">Comece sua jornada de performance</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nome completo</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full bg-surface border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full bg-surface border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Senha</label>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 w-full bg-surface border border-border px-4 py-3 font-mono text-sm focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Eu sou</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["aluno", "trainer"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-3 text-xs font-extrabold uppercase tracking-widest border transition-colors ${
                    form.role === r
                      ? "bg-accent text-background border-accent"
                      : "border-border hover:border-accent"
                  }`}
                >
                  {r === "trainer" ? "Personal" : "Aluno"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs font-mono text-destructive uppercase">{error}</p>}
          {info && <p className="text-xs font-mono text-accent uppercase">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-background font-extrabold uppercase tracking-widest py-4 text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors"
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
          className="w-full border border-border font-bold uppercase tracking-widest py-4 text-sm hover:border-accent hover:text-accent transition-colors"
        >
          Continuar com Google
        </button>

        <p className="mt-8 text-xs font-mono uppercase text-muted-foreground text-center">
          Já tem conta?{" "}
          <Link to="/login" className="text-accent hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
