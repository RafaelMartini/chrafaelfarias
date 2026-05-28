import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { exercises } from "@/lib/mock-data";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de Exercícios — Rafael Faria" }] }),
  component: BibliotecaPage,
});

function BibliotecaPage() {
  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-10 animate-reveal">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-2">Acervo</p>
          <h1 className="text-4xl font-extrabold uppercase tracking-tight">Biblioteca de Exercícios</h1>
        </div>
        <button className="rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]">
          + Cadastrar Exercício
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal [animation-delay:100ms]">
        {exercises.map((e) => (
          <div key={e.id} className="group overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
            <div className="relative grid aspect-video place-items-center border-b border-border bg-background/50">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">▶ Vídeo: {e.videoPrompt}</span>
              <div className="absolute right-3 top-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[9px] font-mono uppercase text-primary">
                {e.category}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-extrabold uppercase tracking-tight mb-2">{e.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{e.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary">Editar</button>
                <button className="flex-1 rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary">Usar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
