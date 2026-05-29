import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

/**
 * Protege uma rota exigindo o papel "trainer".
 *
 * Faz o redirect dentro de useEffect (não no corpo do render) — corrige o
 * anti-pattern de chamar navigate() durante a renderização. A proteção real
 * dos dados continua no servidor (assertTrainer nas server functions); este
 * guard é apenas de navegação/UX.
 */
export function useRequireTrainer() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "trainer")) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, role, navigate]);

  return { user, role, loading, isTrainer: !loading && !!user && role === "trainer" };
}
