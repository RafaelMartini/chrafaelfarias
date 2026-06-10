type StudentOption = { user_id: string; display_name: string | null };

/**
 * Seletor de aluno (linha de pílulas) usado nas páginas de admin de Anamnese e
 * Comparação. Mantém o app consistente com o resto da navegação por pílulas.
 */
export function StudentPicker({
  students,
  value,
  onChange,
}: {
  students: StudentOption[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  if (students.length === 0) {
    return (
      <p className="text-xs font-mono uppercase text-muted-foreground">Nenhum aluno cadastrado.</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {students.map((s) => {
        const active = value === s.user_id;
        return (
          <button
            key={s.user_id}
            onClick={() => onChange(s.user_id)}
            className={
              active
                ? "rounded-full bg-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-primary-foreground shadow-lg"
                : "rounded-full border border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            }
          >
            {s.display_name || "Aluno"}
          </button>
        );
      })}
    </div>
  );
}
