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
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Coach Rafael Faria" className="h-20 w-auto sm:h-24 lg:h-28" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-primary px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Criar conta
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
          <div className="mt-10 flex justify-center">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-primary-foreground transition-transform hover:scale-[1.02] md:text-base"
            >
              Acessar minha conta
              <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="bg-surface/60 backdrop-blur-sm border border-border p-6 rounded-lg hover:border-accent/40 transition-colors group"
              >
                <Icon className="size-7 text-accent mb-5 group-hover:scale-110 transition-transform" />
                <h3 className="text-base font-extrabold tracking-tight mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECONDARY CTA */}
        <section className="px-6 pb-32 max-w-4xl mx-auto text-center">
          <div className="border border-border bg-surface/40 rounded-2xl p-10 md:p-16">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent mb-4">Pronto para começar?</p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Comece agora sua jornada de performance.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                to="/signup"
                className="bg-accent text-background font-extrabold uppercase tracking-wide px-6 py-3 text-sm rounded-full hover:bg-accent/90 transition-colors"
              >
                Criar conta grátis
              </Link>
              <Link
                to="/login"
                className="border border-border font-bold uppercase tracking-wide px-6 py-3 text-sm rounded-full hover:border-accent hover:text-accent transition-colors"
              >
                Já tenho acesso
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border py-8 px-6 text-center">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          © 2026 Rafael Faria Performance Systems
        </p>
      </footer>
    </div>
  );
}
