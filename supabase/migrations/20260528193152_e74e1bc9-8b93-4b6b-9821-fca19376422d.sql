-- Harden role and profile access rules
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Trainer updates student profile" ON public.profiles;

CREATE POLICY "Users update own unassigned profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND trainer_id IS NULL);

CREATE POLICY "Admins update assigned student profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = trainer_id AND public.has_role(auth.uid(), 'trainer'))
WITH CHECK (auth.uid() = trainer_id AND public.has_role(auth.uid(), 'trainer'));

-- Harden appointment ownership checks
DROP POLICY IF EXISTS "Student updates own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Student creates own appointments" ON public.appointments;

CREATE POLICY "Student creates own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.trainer_id = appointments.trainer_id
  )
);

CREATE POLICY "Student updates own appointments safely"
ON public.appointments
FOR UPDATE
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.trainer_id = appointments.trainer_id
  )
);

-- Harden workout log ownership checks
DROP POLICY IF EXISTS "Student manages own logs" ON public.workout_logs;

CREATE POLICY "Student manages own workout logs"
ON public.workout_logs
FOR ALL
TO authenticated
USING (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_logs.workout_id
      AND w.student_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.workouts w
    WHERE w.id = workout_logs.workout_id
      AND w.student_id = auth.uid()
  )
);

-- Do not let public clients call internal database functions directly
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- Prevent public listing of exercise video files
UPDATE storage.buckets
SET public = false
WHERE id = 'exercise-videos';

DROP POLICY IF EXISTS "Public read exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read exercise videos" ON storage.objects;

CREATE POLICY "Authenticated read exercise videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'exercise-videos');