import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Dumbbell, PlayCircle, CalendarDays, LineChart, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo-rafael-faria.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KINETIC+ — Treinos personalizados com seu personal" },
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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_50%)] opacity-[0.08]" />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Coach Rafael Faria" className="h-12 md:h-14 w-auto" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Entrar
          </Link>
          <Link
            to="/signup"
            className="text-xs font-extrabold uppercase tracking-widest bg-accent text-background px-4 py-2 hover:bg-accent/90 transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center max-w-5xl mx-auto animate-reveal">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.02]">
            Seu treino,<br />
            sua evolução,<br />
            <span className="text-accent">minha entrega.</span>
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            Plataforma exclusiva com treinos montados manualmente, vídeos demonstrativos
            e acompanhamento real da sua performance.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-3 bg-accent text-background font-extrabold uppercase tracking-wide px-8 py-4 text-sm md:text-base rounded-full hover:scale-[1.02] transition-transform shadow-[0_0_60px_-10px_var(--accent)]"
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
          © 2026 KINETIC+ Performance Systems
        </p>
      </footer>
    </div>
  );
}
