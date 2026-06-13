import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Plus, Film, Upload, Loader2, Pencil, Check, X } from "lucide-react";
import { Shell } from "@/components/Shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { embedUrl } from "@/lib/video";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRequireTrainer } from "@/hooks/use-require-role";
import { listMyExercises, createExercise, updateExercise, deleteExercise } from "@/lib/admin.functions";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca de Exercícios — Rafael Faria" }] }),
  component: BibliotecaPage,
});

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  video_url: string | null;
  created_at: string;
};

function BibliotecaPage() {
  const { user, role } = useRequireTrainer();
  const list = useServerFn(listMyExercises);
  const del = useServerFn(deleteExercise);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Exercise | null>(null);
  const [toDelete, setToDelete] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["my-exercises"],
    queryFn: () => list() as Promise<Exercise[]>,
    enabled: !!user && role === "trainer",
  });

  const delMut = useMutation({
    mutationFn: async (ex: Exercise) => {
      await del({ data: { id: ex.id } });
      // Apaga também o arquivo do Storage pra não acumular vídeo órfão.
      await removeVideoFromStorage(ex.video_url);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-exercises"] });
      toast.success("Exercício excluído");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const groups = useMemo(
    () => ["Todos", ...Array.from(new Set(exercises.map((e) => e.muscle_group).filter(Boolean) as string[]))],
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter(
      (e) => (group === "Todos" || e.muscle_group === group) && (q === "" || e.name.toLowerCase().includes(q)),
    );
  }, [exercises, query, group]);

  return (
    <Shell mode="admin">
      <div className="flex items-end justify-between mb-8 animate-reveal flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Acervo</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight">Biblioteca de Exercícios</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">{exercises.length} exercício(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          <Plus className="size-4" /> Cadastrar Exercício
        </button>
      </div>

      <div className="flex flex-col gap-3 mb-6 animate-reveal [animation-delay:75ms] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar exercício…"
            className="w-full rounded-full border border-border bg-card/70 py-2.5 pl-9 pr-4 font-mono text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                group === g
                  ? "border-primary bg-primary text-primary-foreground font-bold"
                  : "border-border text-muted-foreground hover:border-primary hover:bg-secondary hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-xs font-mono uppercase text-muted-foreground">Carregando…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <p className="text-sm font-mono uppercase text-muted-foreground">Nenhum exercício ainda. Clique em “Cadastrar Exercício”.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-reveal [animation-delay:100ms]">
        {filtered.map((e) => {
          const embed = embedUrl(e.video_url ?? "");
          return (
            <div key={e.id} className="group overflow-hidden rounded-3xl border border-border bg-card/75 shadow-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40">
              <div className="relative aspect-video border-b border-border bg-background/50">
                {embed ? (
                  <iframe src={embed} title={e.name} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                ) : e.video_url ? (
                  <video src={e.video_url} controls playsInline preload="metadata" className="h-full w-full bg-black" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Sem vídeo</div>
                )}
                {e.muscle_group && (
                  <div className="absolute right-3 top-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[9px] font-mono uppercase text-primary backdrop-blur-md">
                    {e.muscle_group}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-extrabold uppercase tracking-tight mb-2 flex items-center gap-2">
                  {e.name}
                  {(embed || e.video_url) && <Film className="size-3.5 shrink-0 text-primary" />}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{e.description || "—"}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setToEdit(e)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-primary hover:bg-secondary hover:text-primary"
                  >
                    <Pencil className="size-3" /> Editar
                  </button>
                  <button
                    onClick={() => setToDelete(e)}
                    className="flex flex-1 items-center justify-center rounded-full border border-border py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:border-destructive hover:bg-secondary hover:text-destructive"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && <ExerciseModal onClose={() => setOpen(false)} />}
      {toEdit && <ExerciseModal exercise={toEdit} onClose={() => setToEdit(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Excluir exercício"
        description={toDelete ? `"${toDelete.name}" será removido da sua biblioteca.` : ""}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (toDelete) delMut.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </Shell>
  );
}

function ExerciseModal({ exercise, onClose }: { exercise?: Exercise; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const create = useServerFn(createExercise);
  const update = useServerFn(updateExercise);
  const isEdit = !!exercise;
  const draftKey = !isEdit && user ? `exercise-draft:${user.id}` : null;
  const restoredDraft = useRef(false);
  const [form, setForm] = useState(() => {
    // No celular o navegador pode recarregar a página ao abrir a câmera/galeria;
    // o rascunho em localStorage garante que nada se perde no caminho.
    if (draftKey) {
      try {
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const d = JSON.parse(raw);
          if (d?.form?.name || d?.form?.video_url) {
            restoredDraft.current = true;
            return d.form as { name: string; muscle_group: string; description: string; video_url: string };
          }
        }
      } catch { /* rascunho corrompido: ignora */ }
    }
    return {
      name: exercise?.name ?? "",
      muscle_group: exercise?.muscle_group ?? "",
      description: exercise?.description ?? "",
      video_url: exercise?.video_url ?? "",
    };
  });
  // Caminho no Storage do vídeo enviado nesta sessão e ainda não salvo no banco
  // (usado pra apagar o arquivo se o cadastro for descartado).
  const [unsavedPath, setUnsavedPath] = useState<string | null>(() => {
    if (draftKey && restoredDraft.current) {
      try {
        return (JSON.parse(localStorage.getItem(draftKey) ?? "{}").unsavedPath as string) ?? null;
      } catch { return null; }
    }
    return null;
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // O vídeo pode ser um link (YouTube/Vimeo) OU um arquivo enviado pra nuvem.
  const isUploaded = !!form.video_url;
  const embedPreview = embedUrl(form.video_url);

  // Limpa o vídeo atual (e apaga do Storage se foi um arquivo ainda não salvo).
  const clearVideo = () => {
    if (unsavedPath) {
      void supabase.storage.from(BUCKET).remove([unsavedPath]).catch(() => {});
      setUnsavedPath(null);
    }
    setForm((f) => ({ ...f, video_url: "" }));
  };

  // Aceita um link do YouTube/Vimeo colado pelo treinador.
  const applyLink = () => {
    const v = link.trim();
    if (!v) return;
    if (!embedUrl(v)) {
      toast.error("Link inválido", { description: "Cole o endereço de um vídeo do YouTube ou Vimeo." });
      return;
    }
    clearVideo();
    setForm((f) => ({ ...f, video_url: v }));
    setLink("");
    toast.success("Link do vídeo adicionado");
  };

  useEffect(() => {
    if (restoredDraft.current) toast.info("Rascunho recuperado", { description: "Continuando o cadastro de onde você parou." });
  }, []);

  useEffect(() => {
    if (!draftKey) return;
    const empty = !form.name && !form.muscle_group && !form.description && !form.video_url;
    if (empty) localStorage.removeItem(draftKey);
    else localStorage.setItem(draftKey, JSON.stringify({ form, unsavedPath }));
  }, [draftKey, form, unsavedPath]);

  const clearDraft = () => draftKey && localStorage.removeItem(draftKey);

  const mut = useMutation({
    mutationFn: () =>
      isEdit ? update({ data: { id: exercise!.id, ...form } }) : create({ data: form }),
    onSuccess: () => {
      // Vídeo agora está referenciado pelo exercício; se trocou o vídeo de um
      // exercício existente, o arquivo antigo vira lixo e pode ser removido.
      if (isEdit && exercise?.video_url && exercise.video_url !== form.video_url) {
        void removeVideoFromStorage(exercise.video_url);
      }
      clearDraft();
      qc.invalidateQueries({ queryKey: ["my-exercises"] });
      toast.success(isEdit ? "Exercício atualizado" : "Exercício cadastrado", { description: form.name });
      onClose();
    },
    onError: (e: Error) => toast.error(isEdit ? "Erro ao salvar" : "Erro ao cadastrar", { description: e.message }),
  });

  const handleCancel = () => {
    // Descarte explícito: apaga o vídeo que subiu mas não foi salvo em exercício.
    if (unsavedPath) void supabase.storage.from(BUCKET).remove([unsavedPath]).catch(() => {});
    clearDraft();
    onClose();
  };

  const onUpload = async (file: File) => {
    if (!user) return;
    // Aceita por mime OU por extensão — alguns .mov/.mp4 chegam com file.type vazio.
    const okType = file.type.startsWith("video/");
    const okExt = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|qt|ogv|hevc)$/i.test(file.name);
    if (!okType && !okExt) {
      toast.error("Selecione um arquivo de vídeo");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Vídeo muito grande para upload direto", {
        description: `O arquivo tem ${Math.round(file.size / 1024 / 1024)} MB (limite de ${MAX_VIDEO_BYTES / 1024 / 1024} MB). Suba no YouTube e cole o link — sem limite de tamanho.`,
      });
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const APIKEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const contentType = file.type || mimeForExt(ext);
      const path = `${user.id}/${Date.now()}.${ext}`;

      // Rede de celular oscila: tenta até 3 vezes antes de desistir.
      const MAX_ATTEMPTS = 3;
      let forceRefresh = false; // vira true depois de uma falha de autenticação
      for (let attempt = 1; ; attempt++) {
        try {
          // Garante um token VÁLIDO a cada tentativa. No celular o app vai pra
          // segundo plano e o auto-refresh do Supabase não dispara, então o
          // getSession devolve um token vencido — aí o auth.uid() some e o
          // Storage rejeita o upload com "row-level security" (HTTP 400/403).
          const token = await getValidAccessToken(forceRefresh);
          if (!token) {
            throw Object.assign(new Error("Sessão expirada — saia e entre de novo, depois repita o envio"), { fatal: true });
          }
          // XHR direto no Storage pra ter evento de progresso (o supabase.upload não expõe %).
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${SUPA_URL}/storage/v1/object/${BUCKET}/${path}`);
            xhr.setRequestHeader("authorization", `Bearer ${token}`);
            xhr.setRequestHeader("apikey", APIKEY);
            // Numa retentativa o arquivo pode ter chegado inteiro sem a resposta
            // chegar até nós; upsert evita erro de "já existe".
            xhr.setRequestHeader("x-upsert", attempt > 1 ? "true" : "false");
            xhr.setRequestHeader("content-type", contentType);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) return resolve();
              // O Storage devolve falha de RLS/permissão como HTTP 400 ou 403,
              // mas é resolvível renovando o token — não é fatal de cara.
              const isAuth = [400, 401, 403].includes(xhr.status) && /row-level security|jwt|token|unauthorized/i.test(xhr.responseText || "");
              reject(Object.assign(
                new Error(
                  xhr.status === 413
                    ? "Vídeo muito grande — reduza o tamanho ou aumente o limite no Supabase"
                    : isAuth
                      ? "Sessão expirada durante o envio"
                      : `Upload falhou (${xhr.status})`,
                ),
                { fatal: xhr.status === 413, auth: isAuth },
              ));
            };
            xhr.onerror = () => reject(new Error("Erro de rede no upload"));
            xhr.ontimeout = () => reject(new Error("Tempo esgotado no upload"));
            xhr.send(file);
          });
          break;
        } catch (err) {
          const e = err as { fatal?: boolean; auth?: boolean };
          // Falha de autenticação: força renovar o token e tenta de novo.
          if (e.auth) forceRefresh = true;
          if (e.fatal || attempt >= MAX_ATTEMPTS) throw err;
          setProgress(0);
          toast.info(e.auth ? "Renovando sessão e reenviando…" : `Conexão instável — tentando de novo (${attempt + 1}/${MAX_ATTEMPTS})…`);
          await new Promise((r) => setTimeout(r, e.auth ? 300 : 1500 * attempt));
        }
      }

      // Substituiu um vídeo que ainda não tinha sido salvo? Apaga o anterior.
      if (unsavedPath && unsavedPath !== path) {
        void supabase.storage.from(BUCKET).remove([unsavedPath]).catch(() => {});
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUnsavedPath(path);
      setForm((f) => ({ ...f, video_url: data.publicUrl }));
      setProgress(100);
      toast.success("Vídeo enviado");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  return (
    // Tocar fora NÃO fecha o modal: no celular era fácil demais perder o
    // cadastro inteiro (vídeo já enviado) com um toque acidental.
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-extrabold uppercase tracking-tight">{isEdit ? "Editar Exercício" : "Novo Exercício"}</h2>
          <button type="button" onClick={handleCancel} aria-label="Fechar" className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
            <X className="size-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="mt-6 space-y-3"
        >
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Grupo muscular" value={form.muscle_group} onChange={(v) => setForm({ ...form, muscle_group: v })} placeholder="Ex: Peitoral" />

          {/* Vídeo: link do YouTube/Vimeo (recomendado) ou upload de arquivo */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Vídeo de execução</label>
            <input ref={fileRef} type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
            {isUploaded ? (
              // Vídeo definido: mostra status + preview, sem expor a URL do banco.
              <div className="mt-1 space-y-2">
                <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-primary">
                    <Check className="size-3.5" /> {embedPreview ? "Link do vídeo adicionado" : "Vídeo enviado"}
                  </span>
                  <button
                    type="button"
                    onClick={clearVideo}
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" /> Remover
                  </button>
                </div>
                <div className="overflow-hidden rounded-md border border-border bg-black aspect-video">
                  {embedPreview ? (
                    <iframe src={embedPreview} title="Prévia do vídeo" className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  ) : (
                    <video src={form.video_url} controls playsInline preload="metadata" className="h-full w-full" />
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-1 space-y-3">
                {/* Opção recomendada: colar link do YouTube */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      inputMode="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
                      placeholder="Cole o link do YouTube…"
                      className="min-w-0 flex-1 rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={applyLink}
                      disabled={!link.trim()}
                      className="shrink-0 rounded-md bg-primary px-4 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground transition-opacity disabled:opacity-40"
                    >
                      Usar
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                    Suba o vídeo no YouTube (pode ser “não listado”) e cole o link aqui.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Opção secundária: upload direto (até ~50 MB) */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {uploading ? <><Loader2 className="size-3.5 animate-spin" /> Enviando… {progress}%</> : <><Upload className="size-3.5" /> Enviar arquivo (vídeo curto, até 50 MB)</>}
                </button>
                {uploading && (
                  <>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      Mantenha esta tela aberta até o envio terminar.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Descrição / instruções</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 rounded-full border border-border py-3 text-[10px] font-mono uppercase tracking-widest hover:bg-secondary">Cancelar</button>
            <button type="submit" disabled={mut.isPending || uploading} className="flex-1 rounded-full bg-primary py-3 text-[10px] font-extrabold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
              {mut.isPending ? "Salvando..." : uploading ? "Enviando vídeo…" : isEdit ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const BUCKET = "exercise-videos";
// Limite real do plano do Supabase: arquivos acima de 50 MB são recusados
// (HTTP 400 "Payload too large"). Barrar aqui dá uma mensagem clara na hora,
// em vez de deixar o envio rodar minutos e falhar no fim. Para vídeos maiores,
// use o link do YouTube.
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

// Extrai o caminho dentro do bucket a partir da URL pública salva no banco.
function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

// Devolve um access_token válido, renovando a sessão se já venceu ou está
// perto de vencer (ou se `force` for true após uma rejeição de auth). Resolve
// o gargalo nº1 de upload pelo celular: token vencido em segundo plano.
async function getValidAccessToken(force = false): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  // Margem de 2 min: uploads em 4G podem levar um tempo até o token ser checado.
  const expiringSoon = expiresAt > 0 && expiresAt < Date.now() + 120_000;
  if (session && !force && !expiringSoon) return session.access_token;
  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (error || !refreshed.session) return session?.access_token ?? null;
  return refreshed.session.access_token;
}

async function removeVideoFromStorage(url: string | null | undefined) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Limpeza é melhor esforço — nunca bloqueia o fluxo principal.
  }
}

// Fallback de content-type quando o navegador não informa file.type (comum em .mov).
function mimeForExt(ext: string): string {
  const map: Record<string, string> = {
    mp4: "video/mp4",
    m4v: "video/mp4",
    mov: "video/quicktime",
    qt: "video/quicktime",
    webm: "video/webm",
    mkv: "video/x-matroska",
    avi: "video/x-msvideo",
    "3gp": "video/3gpp",
    ogv: "video/ogg",
    hevc: "video/mp4",
  };
  return map[ext] || "video/mp4";
}

function Field({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}{required && " *"}</label>
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-card/70 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
