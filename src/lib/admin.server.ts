import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CreateStudentInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  goal?: string;
};

export type CreateExerciseInput = {
  name: string;
  description?: string;
  muscle_group?: string;
  video_url?: string;
};

export type CreateWorkoutInput = {
  studentId: string;
  name: string;
  day_of_week: number | null;
  notes?: string;
};

export type AddExerciseToWorkoutInput = {
  workoutId: string;
  exerciseId: string;
  sets: number;
  reps: string;
  load_kg: number | null;
  rest_seconds: number | null;
};

export type CreateAppointmentInput = {
  studentId: string;
  scheduled_at: string;
  duration_minutes: number;
  notes?: string;
};

type StudentProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  goal: string | null;
  birthdate?: string | null;
  trainer_id?: string | null;
  created_at?: string;
};

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "trainer")
    .maybeSingle();

  if (error) throw new Error("Não foi possível validar o acesso admin");
  if (!data) throw new Error("Acesso restrito a administradores");
}

export async function listStudentsForAdmin(userId: string) {
  await assertAdmin(userId);

  const { data: roleRows, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "aluno");

  if (rolesError) throw new Error("Não foi possível carregar os alunos");

  const studentIds = (roleRows ?? []).map((row) => row.user_id).filter((id) => id !== userId);
  if (studentIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, display_name, phone, goal, birthdate, created_at")
    .in("user_id", studentIds)
    .or(`trainer_id.is.null,trainer_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Não foi possível carregar os alunos");
  return data ?? [];
}

export async function getAdminOverviewForAdmin(userId: string) {
  await assertAdmin(userId);

  const students = await listStudentsForAdmin(userId);

  const [{ count: exercisesCount }, { count: workoutsCount }, { data: appointments }] = await Promise.all([
    supabaseAdmin
      .from("exercises")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userId),
    supabaseAdmin
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", userId),
    supabaseAdmin
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, status, student_id")
      .eq("trainer_id", userId)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(3),
  ]);

  return {
    studentsCount: students.length,
    exercisesCount: exercisesCount ?? 0,
    workoutsCount: workoutsCount ?? 0,
    recentStudents: students.slice(0, 5),
    upcomingAppointments: appointments ?? [],
  };
}

export async function createStudentForAdmin(userId: string, data: CreateStudentInput) {
  await assertAdmin(userId);

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("user_id, trainer_id")
    .eq("display_name", data.name)
    .maybeSingle();

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { display_name: data.name, role: "aluno" },
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes("already")) {
      throw new Error("Este e-mail já possui uma conta. Use outro e-mail para cadastrar o aluno.");
    }
    throw new Error("Não foi possível criar a conta do aluno");
  }

  const newUserId = created.user?.id;
  if (!newUserId) throw new Error("Falha ao criar usuário");

  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: newUserId, role: "aluno" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error("Não foi possível definir o acesso do aluno");

  const { error: upsertErr } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: newUserId,
        trainer_id: userId,
        display_name: data.name,
        phone: data.phone || null,
        goal: data.goal || null,
      },
      { onConflict: "user_id" },
    );

  if (upsertErr) throw new Error("Aluno criado, mas não foi possível vinculá-lo ao admin");
  return { ok: true, user_id: newUserId, existing: !!existing };
}

export async function listExercisesForAdmin(userId: string) {
  await assertAdmin(userId);

  const { data, error } = await supabaseAdmin
    .from("exercises")
    .select("id, name, description, muscle_group, video_url, created_at")
    .eq("trainer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Não foi possível carregar a biblioteca");
  return data ?? [];
}

export async function createExerciseForAdmin(userId: string, data: CreateExerciseInput) {
  await assertAdmin(userId);

  const { error } = await supabaseAdmin.from("exercises").insert({
    trainer_id: userId,
    name: data.name,
    description: data.description || null,
    muscle_group: data.muscle_group || null,
    video_url: data.video_url || null,
  });

  if (error) throw new Error("Não foi possível cadastrar o exercício");
  return { ok: true };
}

export async function deleteExerciseForAdmin(userId: string, id: string) {
  await assertAdmin(userId);

  const { error } = await supabaseAdmin
    .from("exercises")
    .delete()
    .eq("id", id)
    .eq("trainer_id", userId);

  if (error) throw new Error("Não foi possível excluir o exercício");
  return { ok: true };
}

export async function getStudentWorkoutsForAdmin(userId: string, studentId: string) {
  await assertAdmin(userId);

  const { data: student, error: studentErr } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, display_name, phone, goal, trainer_id")
    .eq("user_id", studentId)
    .maybeSingle();

  if (studentErr) throw new Error("Não foi possível carregar o aluno");
  if (!student) throw new Error("Aluno não encontrado");
  if ((student as StudentProfile).trainer_id && (student as StudentProfile).trainer_id !== userId) {
    throw new Error("Aluno vinculado a outro admin");
  }

  const { data: workouts, error: workoutErr } = await supabaseAdmin
    .from("workouts")
    .select("id, name, notes, day_of_week, created_at")
    .eq("student_id", studentId)
    .eq("trainer_id", userId)
    .order("day_of_week", { ascending: true });

  if (workoutErr) throw new Error("Não foi possível carregar os treinos");

  const ids = (workouts ?? []).map((workout) => workout.id);
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

  if (ids.length > 0) {
    const { data: rows, error: itemErr } = await supabaseAdmin
      .from("workout_exercises")
      .select("id, workout_id, exercise_id, sets, reps, load_kg, rest_seconds, order_index, exercise:exercises(id, name, video_url, muscle_group)")
      .in("workout_id", ids)
      .order("order_index", { ascending: true });

    if (itemErr) throw new Error("Não foi possível carregar os exercícios do treino");
    items = (rows ?? []) as typeof items;
  }

  return { student, workouts: workouts ?? [], items };
}

export async function createWorkoutForAdmin(userId: string, data: CreateWorkoutInput) {
  await assertAdmin(userId);

  const { data: student, error: studentErr } = await supabaseAdmin
    .from("profiles")
    .select("user_id, trainer_id")
    .eq("user_id", data.studentId)
    .maybeSingle();

  if (studentErr) throw new Error("Não foi possível validar o aluno");
  if (!student) throw new Error("Aluno não encontrado");
  if ((student as StudentProfile).trainer_id && (student as StudentProfile).trainer_id !== userId) {
    throw new Error("Aluno vinculado a outro admin");
  }

  if (!(student as StudentProfile).trainer_id) {
    const { error: linkErr } = await supabaseAdmin
      .from("profiles")
      .update({ trainer_id: userId })
      .eq("user_id", data.studentId)
      .is("trainer_id", null);
    if (linkErr) throw new Error("Não foi possível vincular o aluno a este admin");
  }

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

  if (error) throw new Error("Não foi possível criar o treino");
  return { ok: true, id: row.id };
}

export async function deleteWorkoutForAdmin(userId: string, id: string) {
  await assertAdmin(userId);

  const { error } = await supabaseAdmin
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("trainer_id", userId);

  if (error) throw new Error("Não foi possível excluir o treino");
  return { ok: true };
}

export async function addExerciseToWorkoutForAdmin(userId: string, data: AddExerciseToWorkoutInput) {
  await assertAdmin(userId);

  const { data: workout, error: workoutErr } = await supabaseAdmin
    .from("workouts")
    .select("id")
    .eq("id", data.workoutId)
    .eq("trainer_id", userId)
    .maybeSingle();

  if (workoutErr) throw new Error("Não foi possível validar o treino");
  if (!workout) throw new Error("Treino não encontrado");

  const { data: exercise, error: exerciseErr } = await supabaseAdmin
    .from("exercises")
    .select("id")
    .eq("id", data.exerciseId)
    .eq("trainer_id", userId)
    .maybeSingle();

  if (exerciseErr) throw new Error("Não foi possível validar o exercício");
  if (!exercise) throw new Error("Exercício não encontrado na sua biblioteca");

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

  if (error) throw new Error("Não foi possível adicionar o exercício ao treino");
  return { ok: true };
}

export async function removeExerciseFromWorkoutForAdmin(userId: string, id: string) {
  await assertAdmin(userId);

  const { data: row, error: rowErr } = await supabaseAdmin
    .from("workout_exercises")
    .select("id, workout:workouts!inner(trainer_id)")
    .eq("id", id)
    .maybeSingle();

  if (rowErr) throw new Error("Não foi possível validar o item do treino");
  const trainerId = (row as { workout?: { trainer_id?: string } } | null)?.workout?.trainer_id;
  if (!row || trainerId !== userId) throw new Error("Não autorizado");

  const { error } = await supabaseAdmin.from("workout_exercises").delete().eq("id", id);
  if (error) throw new Error("Não foi possível remover o exercício do treino");
  return { ok: true };
}

export async function listAppointmentsForAdmin(userId: string) {
  await assertAdmin(userId);

  const { data: appts, error } = await supabaseAdmin
    .from("appointments")
    .select("id, scheduled_at, duration_minutes, status, notes, student_id")
    .eq("trainer_id", userId)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error("Não foi possível carregar a agenda");

  const ids = Array.from(new Set((appts ?? []).map((a) => a.student_id)));
  let profilesMap = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", ids);
    profilesMap = new Map((profs ?? []).map((p) => [p.user_id, p.display_name ?? "Aluno"]));
  }

  return (appts ?? []).map((a) => ({ ...a, student_name: profilesMap.get(a.student_id) ?? "Aluno" }));
}

export async function createAppointmentForAdmin(userId: string, data: CreateAppointmentInput) {
  await assertAdmin(userId);

  const { data: student, error: sErr } = await supabaseAdmin
    .from("profiles")
    .select("user_id, trainer_id")
    .eq("user_id", data.studentId)
    .maybeSingle();
  if (sErr) throw new Error("Não foi possível validar o aluno");
  if (!student) throw new Error("Aluno não encontrado");
  if ((student as StudentProfile).trainer_id && (student as StudentProfile).trainer_id !== userId) {
    throw new Error("Aluno vinculado a outro admin");
  }
  if (!(student as StudentProfile).trainer_id) {
    await supabaseAdmin.from("profiles").update({ trainer_id: userId }).eq("user_id", data.studentId).is("trainer_id", null);
  }

  const { error } = await supabaseAdmin.from("appointments").insert({
    trainer_id: userId,
    student_id: data.studentId,
    scheduled_at: data.scheduled_at,
    duration_minutes: data.duration_minutes,
    notes: data.notes || null,
    status: "scheduled",
  });
  if (error) throw new Error("Não foi possível criar o agendamento");
  return { ok: true };
}

export async function updateAppointmentStatusForAdmin(userId: string, id: string, status: string) {
  await assertAdmin(userId);
  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .eq("trainer_id", userId);
  if (error) throw new Error("Não foi possível atualizar o agendamento");
  return { ok: true };
}

export async function deleteAppointmentForAdmin(userId: string, id: string) {
  await assertAdmin(userId);
  const { error } = await supabaseAdmin
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("trainer_id", userId);
  if (error) throw new Error("Não foi possível excluir o agendamento");
  return { ok: true };
}
