import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
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
  const { user, signOut } = useAuth();

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
          <Link to={mode === "admin" ? "/dashboard" : "/aluno"} className="flex items-center">
            <img src={logo} alt="Coach Rafael Faria" className="h-20 w-auto sm:h-24 lg:h-28" />
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
              <Link
                to={mode === "admin" ? "/aluno" : "/dashboard"}
                className="hidden rounded-full border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-accent hover:bg-secondary hover:text-accent sm:inline-flex"
              >
                {mode === "admin" ? "Ver portal aluno" : "Painel admin"}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-full border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-destructive hover:bg-secondary hover:text-destructive"
              >
                Sair
              </button>
              <div className="flex size-9 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-[10px] font-mono text-accent shadow-lg">
                {initials}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-accent hover:bg-secondary hover:text-accent"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-primary px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03] sm:px-4"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">{children}</main>

      <footer className="mx-auto mb-6 mt-20 max-w-7xl rounded-3xl border border-border bg-card/60 px-6 py-10 backdrop-blur-xl">
        <div className="mx-auto flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="text-xs font-mono text-muted-foreground uppercase">© 2026 Rafael Faria PERFORMANCE SYSTEMS</div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-accent">Privacidade</a>
            <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-accent">Termos</a>
            <a href="#" className="text-xs font-extrabold uppercase tracking-widest hover:text-accent">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function MetricCard({ label, value, suffix, hint, highlight }: { label: string; value: string | number; suffix?: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur-xl ${highlight ? "bg-accent/10 border-accent/40" : "hover:border-accent/40"} transition-all hover:-translate-y-1`}>
      <p className={`text-xs font-mono uppercase mb-4 ${highlight ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-extrabold tabular-nums">{value}</span>
        {suffix && <span className="text-2xl font-extrabold">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] mt-4 uppercase text-muted-foreground tracking-tight">{hint}</p>}
    </div>
  );
}
