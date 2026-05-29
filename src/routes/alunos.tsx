import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout da área de alunos (/alunos).
 *
 * Renderiza as rotas filhas: índice (lista de alunos) e "/alunos/$studentId"
 * (detalhe). Cada página filha já usa seu próprio <Shell>, então o layout só
 * expõe o <Outlet/>. (Antes faltava o Outlet e o detalhe não renderizava.)
 */
export const Route = createFileRoute("/alunos")({
  component: AlunosLayout,
});

function AlunosLayout() {
  return <Outlet />;
}
