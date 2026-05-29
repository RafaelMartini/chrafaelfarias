import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout do portal do aluno (/aluno).
 *
 * Apenas renderiza as rotas filhas (índice "Meu Treino", "/aluno/agenda" e
 * "/aluno/progresso"). Cada página filha já envolve seu conteúdo no <Shell>,
 * por isso o layout não adiciona casca aqui — só o <Outlet/>.
 */
export const Route = createFileRoute("/aluno")({
  component: AlunoLayout,
});

function AlunoLayout() {
  return <Outlet />;
}
