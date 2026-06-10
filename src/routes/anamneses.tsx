import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/Shell";
import { PhotoFrame } from "@/components/PhotoFrame";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { ANAMNESE_FIELDS, ANAMNESE_PHOTOS } from "@/lib/anamnese";
import { listMyStudents, getStudentAnamnese } from "@/lib/admin.functions";
import { StudentPicker } from "@/components/StudentPicker";

export const Route = createFileRoute("/anamneses")({
  head: () => ({ meta: [{ title: "Anamnese dos Alunos — Rafael Faria" }] }),
  component: AnamnesesPage,
});

function AnamnesesPage() {
  const { user, role } = useRequireTrainer();
  const list = useServerFn(listMyStudents);
  const getAnamnese = useServerFn(getStudentAnamnese);

  const { data: students = [] } = useQuery({
    queryKey: ["my-students"],
    queryFn: () => list(),
    enabled: !!user && role === "trainer",
  });

  const [studentId, setStudentId] = useState<string | null>(null);

  const { data: anamnese, isFetching } = useQuery({
    queryKey: ["student-anamnese", studentId],
    queryFn: () => getAnamnese({ data: { studentId: studentId! } }),
    enabled: !!studentId && role === "trainer",
  });

  return (
    <Shell mode="admin">
      <div className="mb-8 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Avaliação</p>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight">Anamnese dos Alunos</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm">
          Selecione um aluno para ver as respostas e as fotos da anamnese.
        </p>
      </div>

      <StudentPicker students={students} value={studentId} onChange={setStudentId} />

      {!studentId ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">
            Escolha um aluno acima.
          </p>
        </div>
      ) : isFetching ? (
        <p className="mt-8 text-xs font-mono uppercase text-muted-foreground">Carregando…</p>
      ) : !anamnese ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">
            Esse aluno ainda não preencheu a anamnese.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8 space-y-8 animate-reveal">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {ANAMNESE_FIELDS.map((f) => {
              const v = anamnese.answers?.[f.id];
              return (
                <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 text-sm whitespace-pre-wrap">
                    {v ? v : <span className="text-muted-foreground">—</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
          <div>
            <h3 className="text-lg font-extrabold uppercase mb-4">Fotos de avaliação</h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {ANAMNESE_PHOTOS.map((p) => {
                const url =
                  anamnese.photos?.[
                    p.label === "Frente" ? "frente" : p.label === "Costas" ? "costas" : "lado"
                  ];
                return <PhotoFrame key={p.key} label={p.label} url={url ?? null} readOnly />;
              })}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
