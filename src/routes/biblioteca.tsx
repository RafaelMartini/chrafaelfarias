import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { exercises } from "@/lib/mock-data";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de Exercícios — KINETIC+" }] }),
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
        <button className="bg-accent text-background px-5 py-3 text-xs font-extrabold uppercase tracking-widest hover:brightness-110 transition">
          + Cadastrar Exercício
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal [animation-delay:100ms]">
        {exercises.map((e) => (
          <div key={e.id} className="group bg-surface border border-border hover:border-accent transition-all rounded-2xl">
            <div className="aspect-video bg-background border-b border-border grid place-items-center relative">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">▶ Vídeo: {e.videoPrompt}</span>
              <div className="absolute top-2 right-2 text-[9px] font-mono uppercase bg-background/80 border border-border px-2 py-0.5 text-accent rounded-2xl">
                {e.category}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-extrabold uppercase tracking-tight mb-2">{e.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{e.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 text-[10px] font-mono uppercase tracking-widest border border-border py-2 hover:border-accent hover:text-accent transition-colors rounded-2xl">Editar</button>
                <button className="flex-1 text-[10px] font-mono uppercase tracking-widest border border-border py-2 hover:border-accent hover:text-accent transition-colors rounded-2xl">Usar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
