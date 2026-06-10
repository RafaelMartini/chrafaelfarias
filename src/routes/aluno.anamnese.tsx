import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { PhotoFrame } from "@/components/PhotoFrame";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import {
  ANAMNESE_FIELDS,
  ANAMNESE_PHOTOS,
  ANAMNESE_PHOTO_INSTRUCTIONS,
  type AnamneseAnswers,
} from "@/lib/anamnese";
import { uploadStudentPhoto, removeStudentPhoto, useSignedPhotoUrls } from "@/lib/student-photos";

export const Route = createFileRoute("/aluno/anamnese")({
  head: () => ({ meta: [{ title: "Anamnese — Rafael Faria" }] }),
  component: Anamnese,
});

type AnamneseRow = {
  answers: AnamneseAnswers | null;
  photo_frente: string | null;
  photo_costas: string | null;
  photo_lado: string | null;
};

function Anamnese() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: row, isLoading } = useQuery({
    queryKey: ["anamnese", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AnamneseRow | null> => {
      const { data, error } = await supabase
        .from("anamnese")
        .select("answers, photo_frente, photo_costas, photo_lado")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as AnamneseRow) ?? null;
    },
  });

  const [answers, setAnswers] = useState<AnamneseAnswers>({});
  useEffect(() => {
    if (row?.answers) setAnswers(row.answers as AnamneseAnswers);
  }, [row]);

  const paths = [row?.photo_frente, row?.photo_costas, row?.photo_lado];
  const urls = useSignedPhotoUrls(paths);

  const saveAnswers = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("anamnese")
        .upsert({ student_id: user.id, answers }, { onConflict: "student_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anamnese"] });
      toast.success("Anamnese salva");
    },
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const savePhoto = async (key: string, file: File) => {
    if (!user) return;
    setUploadingKey(key);
    try {
      const oldPath = (row as Record<string, string | null> | null)?.[key] ?? null;
      const path = await uploadStudentPhoto(user.id, "anamnese", file);
      const { error } = await supabase
        .from("anamnese")
        .upsert({ student_id: user.id, [key]: path } as TablesInsert<"anamnese">, {
          onConflict: "student_id",
        });
      if (error) throw new Error(error.message);
      if (oldPath) await removeStudentPhoto(oldPath);
      await qc.invalidateQueries({ queryKey: ["anamnese"] });
      toast.success("Foto enviada");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally {
      setUploadingKey(null);
    }
  };

  const deletePhoto = async (key: string) => {
    if (!user) return;
    const oldPath = (row as Record<string, string | null> | null)?.[key] ?? null;
    const { error } = await supabase
      .from("anamnese")
      .upsert({ student_id: user.id, [key]: null } as TablesInsert<"anamnese">, {
        onConflict: "student_id",
      });
    if (error) {
      toast.error("Erro ao remover", { description: error.message });
      return;
    }
    if (oldPath) await removeStudentPhoto(oldPath);
    await qc.invalidateQueries({ queryKey: ["anamnese"] });
  };

  return (
    <Shell mode="student">
      <div className="mb-8 sm:mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">
          Avaliação inicial
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Anamnese</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm sm:text-base">
          Responda com calma o questionário abaixo e envie as 3 fotos. Isso é a base para montar e
          ajustar o seu protocolo.
        </p>
        <p className="mt-3 inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-primary">
          🚨 Protocolos são entregues aos sábados
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs font-mono uppercase text-muted-foreground">Carregando…</p>
      ) : (
        <>
          {/* Questionário */}
          <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-8 animate-reveal">
            <h2 className="text-lg font-extrabold uppercase mb-6">Questionário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ANAMNESE_FIELDS.map((f) => (
                <div key={f.id} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {f.label}
                  </label>
                  {f.type === "textarea" ? (
                    <textarea
                      value={answers[f.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                      rows={2}
                      placeholder={f.placeholder}
                      className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                    />
                  ) : (
                    <input
                      value={answers[f.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.id]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => saveAnswers.mutate()}
              disabled={saveAnswers.isPending}
              className="mt-6 w-full rounded-full bg-primary py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {saveAnswers.isPending ? "Salvando…" : "Salvar respostas"}
            </button>
          </section>

          {/* Fotos */}
          <section className="mt-8 rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-8 animate-reveal [animation-delay:100ms]">
            <h2 className="text-lg font-extrabold uppercase mb-2">Fotos de avaliação</h2>
            <p className="text-xs text-muted-foreground mb-6 max-w-2xl">
              {ANAMNESE_PHOTO_INSTRUCTIONS}
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xl">
              {ANAMNESE_PHOTOS.map((p) => {
                const path = (row as Record<string, string | null> | null)?.[p.key] ?? null;
                return (
                  <PhotoFrame
                    key={p.key}
                    label={p.label}
                    url={path ? (urls[path] ?? null) : null}
                    uploading={uploadingKey === p.key}
                    onPick={(file) => savePhoto(p.key, file)}
                    onRemove={() => deletePhoto(p.key)}
                  />
                );
              })}
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}
