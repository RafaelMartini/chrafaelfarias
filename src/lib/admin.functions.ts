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

// ============ WORKOUTS ============

export const getStudentWithWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertTrainer(userId);

    const { data: student, error: sErr } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, display_name, phone, goal")
      .eq("user_id", data.studentId)
      .eq("trainer_id", userId)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!student) throw new Error("Aluno não encontrado");

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
