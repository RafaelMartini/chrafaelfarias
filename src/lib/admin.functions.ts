import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertTrainer(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "trainer")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

// ============ STUDENTS ============

export const listMyStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, display_name, phone, goal, birthdate, created_at")
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(255),
        password: z.string().min(6).max(72),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        goal: z.string().trim().max(200).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.name, role: "aluno" },
    });
    if (createErr) throw new Error(createErr.message);
    const newUserId = created.user?.id;
    if (!newUserId) throw new Error("Falha ao criar usuário");

    // Trigger criou profile + role. Vincula trainer e atualiza dados.
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .update({
        trainer_id: userId,
        display_name: data.name,
        phone: data.phone || null,
        goal: data.goal || null,
      })
      .eq("user_id", newUserId);
    if (updErr) throw new Error(updErr.message);

    return { ok: true, user_id: newUserId };
  });

export const resetStudentPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        studentId: z.string().uuid(),
        password: z.string().min(6).max(72),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);

    // Garante que o aluno pertence a este treinador.
    const { data: student, error: sErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", data.studentId)
      .eq("trainer_id", userId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!student) throw new Error("Aluno não encontrado");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.studentId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ EXERCISES ============

export const listMyExercises = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { data, error } = await supabaseAdmin
      .from("exercises")
      .select("id, name, description, muscle_group, video_url, created_at")
      .eq("trainer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(1000).optional().or(z.literal("")),
        muscle_group: z.string().trim().max(60).optional().or(z.literal("")),
        video_url: z.string().trim().url().max(500).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { error } = await supabaseAdmin.from("exercises").insert({
      trainer_id: userId,
      name: data.name,
      description: data.description || null,
      muscle_group: data.muscle_group || null,
      video_url: data.video_url || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().max(1000).optional().or(z.literal("")),
        muscle_group: z.string().trim().max(60).optional().or(z.literal("")),
        video_url: z.string().trim().url().max(500).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { error } = await supabaseAdmin
      .from("exercises")
      .update({
        name: data.name,
        description: data.description || null,
        muscle_group: data.muscle_group || null,
        video_url: data.video_url || null,
      })
      .eq("id", data.id)
      .eq("trainer_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { error } = await supabaseAdmin
      .from("exercises")
      .delete()
      .eq("id", data.id)
      .eq("trainer_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getStudentProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    await assertOwnsStudent(userId, data.studentId);
    const { data: logs, error } = await supabaseAdmin
      .from("workout_logs")
      .select("id, workout_id, completed_at")
      .eq("student_id", data.studentId)
      .order("completed_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (logs ?? []) as Array<{ id: string; workout_id: string; completed_at: string }>;
  });

// ============ ANAMNESE / COMPARAÇÃO FÍSICA ============

const STUDENT_PHOTOS_BUCKET = "student-photos";

async function signStudentPhoto(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from(STUDENT_PHOTOS_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export const getStudentAnamnese = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    await assertOwnsStudent(userId, data.studentId);
    const { data: row, error } = await supabaseAdmin
      .from("anamnese")
      .select("answers, photo_frente, photo_costas, photo_lado, updated_at")
      .eq("student_id", data.studentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      answers: (row.answers ?? {}) as Record<string, string>,
      updated_at: row.updated_at as string,
      photos: {
        frente: await signStudentPhoto(row.photo_frente),
        costas: await signStudentPhoto(row.photo_costas),
        lado: await signStudentPhoto(row.photo_lado),
      },
    };
  });

export const getStudentPhysiquePhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    await assertOwnsStudent(userId, data.studentId);
    const { data: rows, error } = await supabaseAdmin
      .from("physique_photos")
      .select("slot, photo_path, taken_on, label")
      .eq("student_id", data.studentId)
      .order("slot", { ascending: true });
    if (error) throw new Error(error.message);
    return Promise.all(
      (rows ?? []).map(async (r) => ({
        slot: r.slot as number,
        taken_on: r.taken_on as string | null,
        label: r.label as string | null,
        url: await signStudentPhoto(r.photo_path),
      })),
    );
  });

// ============ WORKOUTS ============

export const getStudentWithWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);

    const { data: profile, error: sErr } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, display_name, phone, goal")
      .eq("user_id", data.studentId)
      .eq("trainer_id", userId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!profile) throw new Error("Aluno não encontrado");

    // E-mail de login (fica em auth.users, não em profiles).
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.studentId);
    const student = { ...profile, email: authUser?.user?.email ?? null };

    const { data: workouts, error: wErr } = await supabaseAdmin
      .from("workouts")
      .select("id, name, notes, day_of_week, created_at")
      .eq("student_id", data.studentId)
      .eq("trainer_id", userId)
      .order("day_of_week", { ascending: true });
    if (wErr) throw new Error(wErr.message);

    const ids = (workouts ?? []).map((w) => w.id);
    let items: Array<{
      id: string;
      workout_id: string;
      exercise_id: string;
      sets: number;
      reps: string;
      load_kg: number | null;
      rest_seconds: number | null;
      order_index: number;
      exercise: { id: string; name: string; video_url: string | null; muscle_group: string | null } | null;
    }> = [];
    if (ids.length) {
      const { data: rows, error: iErr } = await supabaseAdmin
        .from("workout_exercises")
        .select(
          "id, workout_id, exercise_id, sets, reps, load_kg, rest_seconds, order_index, exercise:exercises(id, name, video_url, muscle_group)",
        )
        .in("workout_id", ids)
        .order("order_index", { ascending: true });
      if (iErr) throw new Error(iErr.message);
      items = (rows ?? []) as typeof items;
    }

    return { student, workouts: workouts ?? [], items };
  });

export const createWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        studentId: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        day_of_week: z.number().int().min(0).max(6).nullable(),
        notes: z.string().trim().max(1000).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { data: row, error } = await supabaseAdmin
      .from("workouts")
      .insert({
        trainer_id: userId,
        student_id: data.studentId,
        name: data.name,
        day_of_week: data.day_of_week,
        notes: data.notes || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: row.id };
  });

export const deleteWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { error } = await supabaseAdmin
      .from("workouts")
      .delete()
      .eq("id", data.id)
      .eq("trainer_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addExerciseToWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        workoutId: z.string().uuid(),
        exerciseId: z.string().uuid(),
        sets: z.number().int().min(1).max(20),
        reps: z.string().trim().min(1).max(30),
        load_kg: z.number().min(0).max(1000).nullable(),
        rest_seconds: z.number().int().min(0).max(900).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    // verify workout ownership
    const { data: w, error: wErr } = await supabaseAdmin
      .from("workouts")
      .select("id")
      .eq("id", data.workoutId)
      .eq("trainer_id", userId)
      .maybeSingle();
    if (wErr) throw new Error(wErr.message);
    if (!w) throw new Error("Treino não encontrado");

    const { count } = await supabaseAdmin
      .from("workout_exercises")
      .select("id", { count: "exact", head: true })
      .eq("workout_id", data.workoutId);

    const { error } = await supabaseAdmin.from("workout_exercises").insert({
      workout_id: data.workoutId,
      exercise_id: data.exerciseId,
      sets: data.sets,
      reps: data.reps,
      load_kg: data.load_kg,
      rest_seconds: data.rest_seconds,
      order_index: count ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeExerciseFromWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    // ensure parent workout owned by trainer
    const { data: row, error: rErr } = await supabaseAdmin
      .from("workout_exercises")
      .select("id, workout:workouts!inner(trainer_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr) throw new Error(rErr.message);
    const trainerId = (row as { workout?: { trainer_id?: string } } | null)?.workout?.trainer_id;
    if (!row || trainerId !== userId) throw new Error("Não autorizado");
    const { error } = await supabaseAdmin.from("workout_exercises").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ AGENDA / DISPONIBILIDADE ============

type SlotRow = {
  id: string;
  starts_at: string;
  duration_minutes: number;
  location: string | null;
  modality: string;
  booked_by: string | null;
};

async function assertOwnsStudent(trainerId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("user_id", studentId)
    .eq("trainer_id", trainerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Aluno não encontrado");
}

export const createSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        startsAt: z.string().min(1),
        durationMinutes: z.number().int().min(15).max(480),
        location: z.string().trim().max(120).optional().or(z.literal("")),
        modality: z.enum(["presencial", "online"]),
        studentId: z.string().uuid().optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const studentId = data.studentId || null;
    if (studentId) await assertOwnsStudent(userId, studentId);
    const { error } = await supabaseAdmin.from("availability_slots").insert({
      trainer_id: userId,
      starts_at: data.startsAt,
      duration_minutes: data.durationMinutes,
      location: data.location || null,
      modality: data.modality,
      booked_by: studentId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin atribui/desatribui um aluno a um horário existente.
export const assignSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        studentId: z.string().uuid().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    if (data.studentId) await assertOwnsStudent(userId, data.studentId);
    const { error } = await supabaseAdmin
      .from("availability_slots")
      .update({ booked_by: data.studentId })
      .eq("id", data.id)
      .eq("trainer_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMySlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { data: slots, error } = await supabaseAdmin
      .from("availability_slots")
      .select("id, starts_at, duration_minutes, location, modality, booked_by")
      .eq("trainer_id", userId)
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    const list = (slots ?? []) as SlotRow[];
    const ids = [...new Set(list.map((s) => s.booked_by).filter(Boolean))] as string[];
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      names = Object.fromEntries((profs ?? []).map((p) => [p.user_id, p.display_name ?? "Aluno"]));
    }
    return list.map((s) => ({ ...s, student_name: s.booked_by ? names[s.booked_by] ?? "Aluno" : null }));
  });

export const deleteSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);
    const { error } = await supabaseAdmin
      .from("availability_slots")
      .delete()
      .eq("id", data.id)
      .eq("trainer_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Lado do aluno ----

export const listStudentSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("trainer_id")
      .eq("user_id", userId)
      .maybeSingle();
    const trainerId = (prof as { trainer_id: string | null } | null)?.trainer_id;
    if (!trainerId) return [];
    const { data: slots, error } = await supabaseAdmin
      .from("availability_slots")
      .select("id, starts_at, duration_minutes, location, modality, booked_by")
      .eq("trainer_id", trainerId)
      .order("starts_at", { ascending: true });
    if (error) throw new Error(error.message);
    return ((slots ?? []) as SlotRow[])
      .filter((s) => !s.booked_by || s.booked_by === userId)
      .map((s) => ({ ...s, mine: s.booked_by === userId }));
  });

export const bookSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Atômico: só agenda se ainda estiver aberto (booked_by IS NULL).
    const { data: row, error } = await supabaseAdmin
      .from("availability_slots")
      .update({ booked_by: userId })
      .eq("id", data.id)
      .is("booked_by", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Esse horário já foi agendado.");
    return { ok: true };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("availability_slots")
      .update({ booked_by: null })
      .eq("id", data.id)
      .eq("booked_by", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
