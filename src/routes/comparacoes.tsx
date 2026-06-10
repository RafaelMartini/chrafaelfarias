import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shell } from "@/components/Shell";
import { PhotoFrame } from "@/components/PhotoFrame";
import { PhotoCalendar } from "@/components/PhotoCalendar";
import { StudentPicker } from "@/components/StudentPicker";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { listMyStudents, getStudentPhysiquePhotos } from "@/lib/admin.functions";

export const Route = createFileRoute("/comparacoes")({
  head: () => ({ meta: [{ title: "Comparação dos Alunos — Rafael Faria" }] }),
  component: ComparacoesPage,
});

function ComparacoesPage() {
  const { user, role } = useRequireTrainer();
  const list = useServerFn(listMyStudents);
  const getPhysique = useServerFn(getStudentPhysiquePhotos);

  const { data: students = [] } = useQuery({
    queryKey: ["my-students"],
    queryFn: () => list(),
    enabled: !!user && role === "trainer",
  });

  const [studentId, setStudentId] = useState<string | null>(null);

  const { data: physique = [], isFetching } = useQuery({
    queryKey: ["student-physique", studentId],
    queryFn: () => getPhysique({ data: { studentId: studentId! } }),
    enabled: !!studentId && role === "trainer",
  });

  const withPhoto = physique.filter((p) => p.url);
  const calendarPhotos = physique
    .filter((p) => p.taken_on)
    .map((p) => ({ taken_on: p.taken_on as string, url: p.url, label: p.label }));

  return (
    <Shell mode="admin">
      <div className="mb-8 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Evolução</p>
        <h1 className="text-4xl font-extrabold uppercase tracking-tight">Comparação dos Alunos</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm">
          Selecione um aluno para ver as fotos de comparação e o calendário.
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
      ) : withPhoto.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">
            Esse aluno ainda não enviou fotos de comparação.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8 animate-reveal">
          <div className="rounded-3xl border border-border bg-card/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {withPhoto.map((p) => (
                <PhotoFrame
                  key={p.slot}
                  label={p.label || `Foto ${p.slot + 1}`}
                  url={p.url}
                  readOnly
                >
                  {p.taken_on && (
                    <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {new Date(`${p.taken_on}T12:00:00`).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </PhotoFrame>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
            <h2 className="text-lg font-extrabold uppercase mb-6">Calendário das fotos</h2>
            <PhotoCalendar photos={calendarPhotos} />
          </div>
        </div>
      )}
    </Shell>
  );
}
