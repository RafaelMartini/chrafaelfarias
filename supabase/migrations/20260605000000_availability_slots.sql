-- ============ DISPONIBILIDADE / AGENDA ============
-- Horários que o treinador disponibiliza. booked_by = aluno que agendou
-- (null = horário aberto). O agendamento em si é feito por server function
-- (service_role) de forma atômica para evitar dois alunos no mesmo horário.

CREATE TABLE IF NOT EXISTS public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  location TEXT,
  modality TEXT NOT NULL DEFAULT 'presencial', -- presencial | online
  booked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;
GRANT ALL ON public.availability_slots TO service_role;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_avail_trainer ON public.availability_slots (trainer_id, starts_at);

-- Treinador gerencia (CRUD) os próprios horários.
CREATE POLICY "Trainer manages own slots" ON public.availability_slots FOR ALL TO authenticated
  USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

-- Aluno vê os horários do SEU treinador (abertos e agendados).
CREATE POLICY "Students view trainer slots" ON public.availability_slots FOR SELECT TO authenticated
  USING (trainer_id IN (SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid()));
