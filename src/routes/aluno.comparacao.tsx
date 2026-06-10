import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { PhotoFrame } from "@/components/PhotoFrame";
import { PhotoCalendar } from "@/components/PhotoCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadStudentPhoto, removeStudentPhoto, useSignedPhotoUrls } from "@/lib/student-photos";

export const Route = createFileRoute("/aluno/comparacao")({
  head: () => ({ meta: [{ title: "Comparação Física — Rafael Faria" }] }),
  component: Comparacao,
});

type PhotoRow = {
  slot: number;
  photo_path: string | null;
  taken_on: string | null;
  label: string | null;
};

const SLOTS = [0, 1, 2, 3, 4, 5];

function Comparacao() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["physique-photos", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PhotoRow[]> => {
      const { data, error } = await supabase
        .from("physique_photos")
        .select("slot, photo_path, taken_on, label")
        .order("slot", { ascending: true });
      if (error) throw new Error(error.message);
      return (data as PhotoRow[]) ?? [];
    },
  });

  const bySlot = (slot: number) => rows.find((r) => r.slot === slot) ?? null;
  const urls = useSignedPhotoUrls(rows.map((r) => r.photo_path));

  const saveMeta = useMutation({
    mutationFn: async (payload: {
      slot: number;
      taken_on?: string | null;
      label?: string | null;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("physique_photos")
        .upsert({ student_id: user.id, ...payload }, { onConflict: "student_id,slot" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["physique-photos"] }),
    onError: (e: Error) => toast.error("Erro ao salvar", { description: e.message }),
  });

  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const savePhoto = async (slot: number, file: File) => {
    if (!user) return;
    setUploadingSlot(slot);
    try {
      const oldPath = bySlot(slot)?.photo_path ?? null;
      const path = await uploadStudentPhoto(user.id, "comparacao", file);
      const { error } = await supabase
        .from("physique_photos")
        .upsert({ student_id: user.id, slot, photo_path: path }, { onConflict: "student_id,slot" });
      if (error) throw new Error(error.message);
      if (oldPath) await removeStudentPhoto(oldPath);
      await qc.invalidateQueries({ queryKey: ["physique-photos"] });
      toast.success("Foto enviada");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally {
      setUploadingSlot(null);
    }
  };

  const deletePhoto = async (slot: number) => {
    if (!user) return;
    const oldPath = bySlot(slot)?.photo_path ?? null;
    const { error } = await supabase
      .from("physique_photos")
      .update({ photo_path: null })
      .eq("student_id", user.id)
      .eq("slot", slot);
    if (error) {
      toast.error("Erro ao remover", { description: error.message });
      return;
    }
    if (oldPath) await removeStudentPhoto(oldPath);
    await qc.invalidateQueries({ queryKey: ["physique-photos"] });
  };

  const calendarPhotos = rows
    .filter((r) => r.taken_on)
    .map((r) => ({
      taken_on: r.taken_on as string,
      url: r.photo_path ? (urls[r.photo_path] ?? null) : null,
      label: r.label,
    }));

  return (
    <Shell mode="student">
      <div className="mb-8 sm:mb-10 animate-reveal">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Evolução</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">
          Comparação Física
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-sm sm:text-base">
          Envie até 6 fotos com a data de cada uma para acompanhar sua evolução lado a lado.
        </p>
      </div>

      {isLoading ? (
        <p className="text-xs font-mono uppercase text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-8 animate-reveal">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {SLOTS.map((slot) => {
                const r = bySlot(slot);
                const path = r?.photo_path ?? null;
                return (
                  <SlotCard
                    key={slot}
                    slot={slot}
                    url={path ? (urls[path] ?? null) : null}
                    uploading={uploadingSlot === slot}
                    initialDate={r?.taken_on ?? ""}
                    initialLabel={r?.label ?? ""}
                    onPick={(file) => savePhoto(slot, file)}
                    onRemove={() => deletePhoto(slot)}
                    onSave={(payload) => saveMeta.mutate({ slot, ...payload })}
                  />
                );
              })}
            </div>
          </section>

          <section className="mt-8 animate-reveal [animation-delay:100ms]">
            <div className="rounded-3xl border border-border bg-card/75 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
              <h2 className="text-lg font-extrabold uppercase mb-6">Calendário das fotos</h2>
              <PhotoCalendar photos={calendarPhotos} />
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

/**
 * Cartão de um slot. Mantém estado local da data e do rótulo para que digitar
 * não seja interrompido pelos refetches (a data salva ao escolher; o rótulo
 * salva ao sair do campo).
 */
function SlotCard({
  slot,
  url,
  uploading,
  initialDate,
  initialLabel,
  onPick,
  onRemove,
  onSave,
}: {
  slot: number;
  url: string | null;
  uploading: boolean;
  initialDate: string;
  initialLabel: string;
  onPick: (file: File) => void;
  onRemove: () => void;
  onSave: (payload: { taken_on?: string | null; label?: string | null }) => void;
}) {
  const [date, setDate] = useState(initialDate);
  const [label, setLabel] = useState(initialLabel);

  return (
    <PhotoFrame
      label={`Foto ${slot + 1}`}
      url={url}
      uploading={uploading}
      onPick={onPick}
      onRemove={onRemove}
    >
      <input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          onSave({ taken_on: e.target.value || null });
        }}
        className="mt-2 w-full rounded-md border border-border bg-card/70 px-2 py-1.5 text-[11px] font-mono outline-none transition-colors focus:border-primary"
      />
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => onSave({ label: label.trim() || null })}
        placeholder="Rótulo (ex: Mês 1)"
        className="mt-1.5 w-full rounded-md border border-border bg-card/70 px-2 py-1.5 text-[11px] outline-none transition-colors focus:border-primary"
      />
    </PhotoFrame>
  );
}
