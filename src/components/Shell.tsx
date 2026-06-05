import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-rafael-faria.png";

const adminNav = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Alunos", to: "/alunos" },
  { label: "Biblioteca", to: "/biblioteca" },
  { label: "Agenda", to: "/agenda" },
];

const studentNav = [
  { label: "Meu Treino", to: "/aluno" },
  { label: "Agenda", to: "/aluno/agenda" },
  { label: "Progresso", to: "/aluno/progresso" },
];

export function Shell({ children, mode = "admin" }: { children: ReactNode; mode?: "admin" | "student" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const nav = mode === "admin" ? adminNav : studentNav;
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Guard de acesso por papel — separa estritamente o painel admin (treinador)
  // do portal do aluno.
  // - Sem login → /login
  // - Aluno tentando o painel admin → /aluno
  // - Treinador no portal do aluno → /dashboard
  const adminBlocked = mode === "admin" && role !== null && role !== "trainer";
  const studentBlocked = mode === "student" && role !== null && role !== "aluno";
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (adminBlocked) navigate({ to: "/aluno", replace: true });
    else if (studentBlocked) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, adminBlocked, studentBlocked, navigate]);

  // Enquanto resolve a sessão/papel, ou se o acesso não é permitido, não renderiza o conteúdo.
  const resolving = loading || !user || role === null;
  if (resolving || adminBlocked || studentBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  const initials = (user?.user_metadata?.display_name || user?.email || "")
    .toString()
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (mode === "admin" ? "PH" : "MS");

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-transparent">
      <nav className="sticky top-0 z-50 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-7xl items-center justify-between rounded-3xl border border-border bg-card/75 px-4 py-3 shadow-2xl backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-5 lg:gap-8">
          <Link to={mode === "admin" ? "/dashboard" : "/aluno"} className="flex flex-col items-start">
            <img src={logo} alt="Coach Rafael Faria" className="h-20 w-auto sm:h-24 lg:h-28" />
            <span className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">CREF 146790-G/SP</span>
          </Link>
          <div className="hidden md:flex gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? "rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg" : "rounded-full px-4 py-2 hover:bg-secondary hover:text-foreground transition-colors"}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-destructive hover:bg-secondary hover:text-destructive"
              >
                Sair
              </button>
              <div className="flex size-9 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-[10px] font-mono text-primary shadow-lg">
                {initials}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary sm:inline-flex"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">{children}</main>

      <footer className="mx-auto mb-6 mt-20 max-w-7xl rounded-3xl border border-border bg-card/60 px-6 py-10 backdrop-blur-xl">
        <div className="mx-auto flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="text-xs font-mono text-muted-foreground uppercase">© 2026 Rafael Faria PERFORMANCE SYSTEMS</div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-primary">Privacidade</a>
            <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-primary">Termos</a>
            <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-primary">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function MetricCard({ label, value, suffix, hint, highlight }: { label: string; value: string | number; suffix?: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl ${highlight ? "bg-primary/10 border-primary/40" : "hover:border-primary/40"} transition-all hover:-translate-y-1`}>
      <p className={`text-xs font-mono uppercase mb-4 ${highlight ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-extrabold tabular-nums">{value}</span>
        {suffix && <span className="text-2xl font-extrabold">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] mt-4 uppercase text-muted-foreground tracking-tight">{hint}</p>}
    </div>
  );
}
