import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  addExerciseToWorkoutForAdmin,
  createAppointmentForAdmin,
  createExerciseForAdmin,
  createStudentForAdmin,
  createWorkoutForAdmin,
  deleteAppointmentForAdmin,
  deleteExerciseForAdmin,
  deleteWorkoutForAdmin,
  getAdminOverviewForAdmin,
  getStudentWorkoutsForAdmin,
  listAppointmentsForAdmin,
  listExercisesForAdmin,
  listStudentsForAdmin,
  removeExerciseFromWorkoutForAdmin,
  updateAppointmentStatusForAdmin,
} from "./admin.server";

const studentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  goal: z.string().trim().max(200).optional().or(z.literal("")),
});

const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  muscle_group: z.string().trim().max(60).optional().or(z.literal("")),
  video_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

const workoutSchema = z.object({
  studentId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  day_of_week: z.number().int().min(0).max(6).nullable(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const workoutItemSchema = z.object({
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  sets: z.number().int().min(1).max(20),
  reps: z.string().trim().min(1).max(30),
  load_kg: z.number().min(0).max(1000).nullable(),
  rest_seconds: z.number().int().min(0).max(900).nullable(),
});

export const listMyStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listStudentsForAdmin(context.userId));

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => getAdminOverviewForAdmin(context.userId));

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => studentSchema.parse(input))
  .handler(async ({ data, context }) => createStudentForAdmin(context.userId, data));

export const listMyExercises = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => listExercisesForAdmin(context.userId));

export const createExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => exerciseSchema.parse(input))
  .handler(async ({ data, context }) => createExerciseForAdmin(context.userId, data));

export const deleteExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => deleteExerciseForAdmin(context.userId, data.id));

export const getStudentWithWorkouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ studentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => getStudentWorkoutsForAdmin(context.userId, data.studentId));

export const createWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => workoutSchema.parse(input))
  .handler(async ({ data, context }) => createWorkoutForAdmin(context.userId, data));

export const deleteWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => deleteWorkoutForAdmin(context.userId, data.id));

export const addExerciseToWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => workoutItemSchema.parse(input))
  .handler(async ({ data, context }) => addExerciseToWorkoutForAdmin(context.userId, data));

export const removeExerciseFromWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => removeExerciseFromWorkoutForAdmin(context.userId, data.id));
