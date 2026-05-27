import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [loading, user, navigate]);

  const initials = (user?.user_metadata?.display_name || user?.email || "")
    .toString()
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || (mode === "admin" ? "PH" : "MS");

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-8">
          <Link to={mode === "admin" ? "/dashboard" : "/aluno"} className="flex items-center">
            <img src={logo} alt="Coach Rafael Faria" className="h-20 w-auto" />
          </Link>
          <div className="hidden md:flex gap-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? "text-foreground" : "hover:text-foreground transition-colors"}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={mode === "admin" ? "/aluno" : "/dashboard"}
            className="text-[10px] font-mono uppercase tracking-widest border border-border px-3 py-1.5 hover:border-accent hover:text-accent transition-colors rounded-full"
          >
            {mode === "admin" ? "Ver portal aluno" : "Painel admin"}
          </Link>
          <button
            onClick={() => signOut()}
            className="text-[10px] font-mono uppercase tracking-widest border border-border px-3 py-1.5 hover:border-destructive hover:text-destructive transition-colors rounded-full"
          >
            Sair
          </button>
          <div className="size-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-[10px] font-mono text-accent">
            {initials}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>

      <footer className="border-t border-border mt-20 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
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
    <div className={`bg-surface p-6 border border-border ${highlight ? "bg-accent/5 border-accent/30" : "hover:border-accent/40"} transition-colors`}>
      <p className={`text-xs font-mono uppercase mb-4 ${highlight ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-extrabold tabular-nums">{value}</span>
        {suffix && <span className="text-2xl font-extrabold">{suffix}</span>}
      </div>
      {hint && <p className="text-[10px] mt-4 uppercase text-muted-foreground tracking-tight">{hint}</p>}
    </div>
  );
}
