import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Dumbbell, PlayCircle, CalendarDays, LineChart, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-rafael-faria.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rafael Faria — Treinos personalizados com seu personal" },
      { name: "description", content: "Plataforma exclusiva com treinos montados manualmente, vídeos demonstrativos e acompanhamento real da sua performance." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Dumbbell, title: "Treinos personalizados", text: "Montados manualmente para o seu objetivo, semana a semana." },
  { icon: PlayCircle, title: "Vídeos demonstrativos", text: "Execução correta direto do seu personal, em cada exercício." },
  { icon: CalendarDays, title: "Treinos por dia", text: "Saiba exatamente o que fazer em cada dia da sua semana." },
  { icon: LineChart, title: "Evolução real", text: "Acompanhe sua frequência e cargas com métricas claras." },
];

function Landing() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: role === "trainer" ? "/dashboard" : "/aluno", replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,_color-mix(in_oklab,var(--primary)_18%,transparent),_transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <header className="relative z-10 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-7xl items-center justify-between rounded-3xl border border-border bg-card/70 px-4 py-3 shadow-2xl backdrop-blur-xl sm:px-6">
        <Link to="/" className="flex flex-col items-start">
          <img src={logo} alt="Coach Rafael Faria" className="h-20 w-auto sm:h-24 lg:h-28" />
          <span className="mt-0.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">CREF 146790-G/SP</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center animate-reveal md:pb-32 md:pt-24">
          <div className="mb-6 inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            Novo painel integrado
          </div>
          <h1 className="text-5xl font-extrabold leading-[0.96] tracking-tight md:text-7xl lg:text-8xl">
            Seu treino,<br />
            sua evolução,<br />
            <span className="text-primary drop-shadow-[0_0_34px_color-mix(in_oklab,var(--primary)_45%,transparent)]">minha entrega.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Plataforma exclusiva com treinos montados manualmente, vídeos demonstrativos
            e acompanhamento real da sua performance.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.02] md:text-base"
            >
              Acessar minha conta
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/aluno"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-4 text-sm font-bold uppercase tracking-wide transition-colors hover:border-primary hover:bg-secondary hover:text-primary md:text-base"
            >
              Entrar como aluno
            </Link>
          </div>
          <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Modo demonstração · acesso livre, sem login</p>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40"
              >
                <Icon className="mb-5 size-7 text-primary transition-transform group-hover:scale-110" />
                <h3 className="text-base font-extrabold tracking-tight mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECONDARY CTA */}
        <section className="mx-auto max-w-4xl px-6 pb-32 text-center">
          <div className="rounded-3xl border border-border bg-card/70 p-10 shadow-2xl backdrop-blur-xl md:p-16">
            <p className="mb-4 text-xs font-mono uppercase tracking-[0.3em] text-primary">Pronto para começar?</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Vou te ajudar a chegar na sua melhor versão
            </h2>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                to="/dashboard"
                className="rounded-full bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                Acessar o sistema
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mx-auto mb-6 max-w-7xl rounded-3xl border border-border bg-card/60 px-6 py-8 text-center backdrop-blur-xl">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          © 2026 Rafael Faria Performance Systems
        </p>
      </footer>
    </div>
  );
}
