// Dados iniciais do app. Tudo começa VAZIO — o treinador cadastra alunos,
// exercícios, treinos e agendamentos pelo próprio painel. Os tipos abaixo
// definem a forma dos dados consumidos pelos stores (localStorage) e telas.

export type Student = {
  id: string;
  name: string;
  initials: string;
  plan: string;
  week: string;
  status: "active" | "missed" | "new";
  compliance: number;
  lastWorkout: string;
};

export const students: Student[] = [];

export type Exercise = {
  id: string;
  name: string;
  category: string;
  description: string;
  videoPrompt: string;
};

export const exercises: Exercise[] = [];

export type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  load: string;
  rest: string;
};

export type DayWorkout = {
  id: string;
  day: string;
  name: string;
  exercises: WorkoutExercise[];
};

export const weekWorkouts: DayWorkout[] = [];

// Total de treinos com exercícios na semana (dias de recovery não contam).
export const trainingDaysCount = weekWorkouts.filter((w) => w.exercises.length > 0).length;

export type Appointment = {
  id: string;
  date: string;
  time: string;
  student: string;
  modality: "presencial" | "online";
  location: string;
  status: "confirmed" | "pending";
};

export const appointments: Appointment[] = [];
