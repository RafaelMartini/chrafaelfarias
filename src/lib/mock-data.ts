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

export const students: Student[] = [
  { id: "1", name: "Mariana Silva", initials: "MS", plan: "Hipertrofia", week: "Semana 4/12", status: "active", compliance: 94, lastWorkout: "Hoje, 07:30" },
  { id: "2", name: "Ricardo Almeida", initials: "RA", plan: "Emagrecimento", week: "Semana 2/8", status: "missed", compliance: 62, lastWorkout: "3 dias atrás" },
  { id: "3", name: "Beatriz Santos", initials: "BS", plan: "Hipertrofia A2", week: "Semana 6/12", status: "active", compliance: 88, lastWorkout: "Ontem, 18:15" },
  { id: "4", name: "Lucas Oliveira", initials: "LO", plan: "Powerlifting", week: "Semana 8/16", status: "active", compliance: 97, lastWorkout: "Hoje, 06:00" },
  { id: "5", name: "Ana Costa", initials: "AC", plan: "Condicionamento", week: "Semana 1/8", status: "new", compliance: 100, lastWorkout: "—" },
  { id: "6", name: "Rodrigo Silva", initials: "RS", plan: "HIIT", week: "Semana 3/6", status: "active", compliance: 80, lastWorkout: "Ontem, 19:00" },
];

export type Exercise = {
  id: string;
  name: string;
  category: string;
  description: string;
  videoPrompt: string;
};

export const exercises: Exercise[] = [
  { id: "e1", name: "Agachamento Livre", category: "Inferiores", description: "Core ativado, calcanhares firmes, descida controlada.", videoPrompt: "agachamento" },
  { id: "e2", name: "Leg Press 45º", category: "Inferiores", description: "Amplitude máxima sem tirar a lombar do encosto.", videoPrompt: "leg press" },
  { id: "e3", name: "Supino Reto", category: "Peitoral", description: "Escápulas retraídas, controle na descida.", videoPrompt: "supino" },
  { id: "e4", name: "Pulley Frente", category: "Costas", description: "Puxe com os cotovelos, não com as mãos.", videoPrompt: "pulley" },
  { id: "e5", name: "Rosca Direta", category: "Bíceps", description: "Cotovelos fixos ao lado do corpo.", videoPrompt: "rosca" },
  { id: "e6", name: "Tríceps Corda", category: "Tríceps", description: "Abra a corda no final do movimento.", videoPrompt: "triceps" },
  { id: "e7", name: "Stiff", category: "Posterior", description: "Quadril para trás, lombar neutra.", videoPrompt: "stiff" },
  { id: "e8", name: "Desenvolvimento", category: "Ombros", description: "Sem hiperestender a lombar.", videoPrompt: "desenvolvimento" },
];

export type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  load: string;
  rest: string;
};

export type DayWorkout = {
  day: string;
  name: string;
  exercises: WorkoutExercise[];
};

export const weekWorkouts: DayWorkout[] = [
  {
    day: "SEGUNDA",
    name: "Lower Body Alpha",
    exercises: [
      { exerciseId: "e1", sets: 4, reps: "10-12", load: "60kg", rest: "90s" },
      { exerciseId: "e2", sets: 4, reps: "15", load: "120kg", rest: "60s" },
      { exerciseId: "e7", sets: 3, reps: "12", load: "40kg", rest: "60s" },
    ],
  },
  {
    day: "TERÇA",
    name: "Push Day",
    exercises: [
      { exerciseId: "e3", sets: 4, reps: "8-10", load: "80kg", rest: "90s" },
      { exerciseId: "e8", sets: 3, reps: "10", load: "20kg", rest: "60s" },
      { exerciseId: "e6", sets: 3, reps: "12-15", load: "25kg", rest: "45s" },
    ],
  },
  {
    day: "QUARTA",
    name: "Recovery / Mobilidade",
    exercises: [],
  },
  {
    day: "QUINTA",
    name: "Pull Day",
    exercises: [
      { exerciseId: "e4", sets: 4, reps: "10", load: "55kg", rest: "75s" },
      { exerciseId: "e5", sets: 3, reps: "12", load: "14kg", rest: "45s" },
    ],
  },
  {
    day: "SEXTA",
    name: "Full Body Power",
    exercises: [
      { exerciseId: "e1", sets: 5, reps: "5", load: "80kg", rest: "120s" },
      { exerciseId: "e3", sets: 5, reps: "5", load: "90kg", rest: "120s" },
    ],
  },
];

export type Appointment = {
  id: string;
  date: string;
  time: string;
  student: string;
  modality: "presencial" | "online";
  location: string;
  status: "confirmed" | "pending";
};

export const appointments: Appointment[] = [
  { id: "a1", date: "MAI 28", time: "08:30", student: "Beatriz Santos", modality: "presencial", location: "Unidade Jardins", status: "confirmed" },
  { id: "a2", date: "MAI 28", time: "15:00", student: "Rodrigo Silva", modality: "presencial", location: "Unidade Pinheiros", status: "confirmed" },
  { id: "a3", date: "MAI 30", time: "19:00", student: "Mariana Silva", modality: "online", location: "Via Zoom", status: "pending" },
  { id: "a4", date: "JUN 01", time: "07:00", student: "Lucas Oliveira", modality: "presencial", location: "Unidade Jardins", status: "confirmed" },
];
