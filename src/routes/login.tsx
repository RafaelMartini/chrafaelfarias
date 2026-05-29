import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-rafael-faria.png";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Rafael Faria" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate({ to: role === "trainer" ? "/" : "/aluno", replace: true });
    }
  }, [user, role, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (err) setError(err.message);
    else router.invalidate();
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
        <h1 className="mt-10 text-4xl font-extrabold uppercase tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono uppercase">Acesse seu painel de performance</p>

        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-border bg-card/70 px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Senha</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-border bg-card/70 px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          {error && <p className="text-xs font-mono text-destructive uppercase">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-4 text-sm font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
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
      </div>
    </div>
  );
}
