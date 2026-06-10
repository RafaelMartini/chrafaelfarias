import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fotos do aluno (anamnese e comparação física) ficam num bucket PRIVADO
 * `student-photos`. No banco guardamos só o caminho (`path`); a exibição usa
 * URLs assinadas temporárias. A pasta é nomeada pelo user_id do aluno, o que
 * permite à RLS liberar leitura pro próprio aluno e pro treinador dele.
 */
export const STUDENT_PHOTOS_BUCKET = "student-photos";

const SIGNED_URL_TTL = 60 * 60; // 1 hora

/** Envia uma imagem e devolve o caminho salvo no bucket. */
export async function uploadStudentPhoto(
  userId: string,
  folder: string,
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STUDENT_PHOTOS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });
  if (error) throw new Error(error.message);
  return path;
}

/** Remove uma foto do bucket (ignora erro se já não existir). */
export async function removeStudentPhoto(path: string): Promise<void> {
  await supabase.storage.from(STUDENT_PHOTOS_BUCKET).remove([path]);
}

/** Gera uma URL assinada (temporária) para um caminho. */
export async function signStudentPhoto(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STUDENT_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/**
 * Hook que resolve um conjunto de caminhos em URLs assinadas. Retorna um mapa
 * { path -> url } e reconsulta quando a lista de caminhos muda.
 */
export function useSignedPhotoUrls(paths: Array<string | null | undefined>) {
  const present = paths.filter(Boolean) as string[];
  const key = present.slice().sort().join("|");
  const { data } = useQuery({
    queryKey: ["signed-photos", key],
    enabled: present.length > 0,
    staleTime: (SIGNED_URL_TTL - 60) * 1000,
    queryFn: async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        present.map(async (p) => {
          const url = await signStudentPhoto(p);
          if (url) map[p] = url;
        }),
      );
      return map;
    },
  });
  return data ?? {};
}
