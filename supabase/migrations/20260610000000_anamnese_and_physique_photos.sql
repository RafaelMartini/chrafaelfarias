-- ============ ANAMNESE ============
-- Uma anamnese por aluno (questionário em JSONB + 3 fotos de avaliação).
CREATE TABLE public.anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  photo_frente TEXT,
  photo_costas TEXT,
  photo_lado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese TO authenticated;
GRANT ALL ON public.anamnese TO service_role;
ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student manages own anamnese" ON public.anamnese FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Trainer views student anamnese" ON public.anamnese FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = anamnese.student_id AND p.trainer_id = auth.uid()));

CREATE TRIGGER trg_anamnese_updated BEFORE UPDATE ON public.anamnese
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMPARACAO FISICA (physique_photos) ============
-- 6 slots de foto por aluno (slot 0..5), cada um com data e rotulo opcionais.
CREATE TABLE public.physique_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot SMALLINT NOT NULL CHECK (slot >= 0 AND slot < 6),
  photo_path TEXT,
  taken_on DATE,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, slot)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.physique_photos TO authenticated;
GRANT ALL ON public.physique_photos TO service_role;
ALTER TABLE public.physique_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student manages own physique photos" ON public.physique_photos FOR ALL TO authenticated
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Trainer views student physique photos" ON public.physique_photos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = physique_photos.student_id AND p.trainer_id = auth.uid()));

CREATE TRIGGER trg_physique_updated BEFORE UPDATE ON public.physique_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE: student-photos (privado) ============
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Aluno gerencia (CRUD + leitura) apenas a propria pasta <uid>/...
CREATE POLICY "Student manages own student-photos" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'student-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'student-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Treinador le as fotos dos SEUS alunos (pasta nomeada pelo user_id do aluno).
CREATE POLICY "Trainer reads student-photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-photos' AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id::text = (storage.foldername(name))[1] AND p.trainer_id = auth.uid()
  ));
