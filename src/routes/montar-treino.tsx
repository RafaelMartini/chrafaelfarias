import { createFileRoute, redirect } from "@tanstack/react-router";

// O fluxo real de montar treino é por aluno: /alunos → escolher o aluno →
// criar treinos e adicionar exercícios da biblioteca. Esta rota antiga
// (plano mockado global) foi aposentada e redireciona para a lista de alunos.
export const Route = createFileRoute("/montar-treino")({
  beforeLoad: () => {
    throw redirect({ to: "/alunos" });
  },
});
