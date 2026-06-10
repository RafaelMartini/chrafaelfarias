/**
 * Definição do questionário de anamnese (compartilhada entre o formulário do
 * aluno e a visualização do admin). As respostas são guardadas num JSONB
 * `answers` na tabela `anamnese`, indexado por `id` — assim dá pra adicionar/
 * remover perguntas só mexendo aqui, sem migração.
 */
export type AnamneseField = {
  id: string;
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
};

export const ANAMNESE_FIELDS: AnamneseField[] = [
  { id: "nome", label: "Nome", type: "text" },
  { id: "idade", label: "Idade", type: "text" },
  { id: "altura", label: "Altura", type: "text", placeholder: "Ex: 1,75 m" },
  { id: "peso", label: "Peso", type: "text", placeholder: "Ex: 78 kg" },
  { id: "objetivo", label: "Objetivo", type: "textarea" },
  { id: "qualidade_estetica", label: "Você busca qualidade de vida ou estética?", type: "text" },
  { id: "profissao", label: "Profissão", type: "text" },
  {
    id: "local_treino",
    label: "Você irá treinar em casa OU em alguma academia? (os 2 não pode)",
    type: "text",
  },
  { id: "ja_fez_dieta", label: "Já fez dieta alguma vez?", type: "textarea" },
  { id: "ja_treina", label: "Já treina? Se sim, quanto tempo sem pausa?", type: "textarea" },
  { id: "sabe_treinar", label: "Sabe treinar?", type: "text" },
  { id: "sabe_nome_aparelhos", label: "Sabe o nome dos aparelhos da academia?", type: "text" },
  {
    id: "sabe_funcao_aparelhos",
    label: "Sabe para que serve cada aparelho da academia?",
    type: "text",
  },
  { id: "lesao", label: "Tem alguma lesão?", type: "textarea" },
  { id: "cirurgia_recente", label: "Tem cirurgia recente?", type: "textarea" },
  { id: "limitacao", label: "Tem alguma limitação?", type: "textarea" },
  { id: "problema_saude", label: "Tem problema de saúde?", type: "textarea" },
  { id: "medicamento", label: "Toma algum medicamento?", type: "textarea" },
  { id: "anticoncepcional", label: "Faz uso do anticoncepcional?", type: "text" },
  { id: "intolerancia", label: "Tem intolerância a algum alimento?", type: "textarea" },
  { id: "alimento_nao_gosta", label: "Tem algum alimento que você não gosta?", type: "textarea" },
  {
    id: "alimento_gases",
    label: "Tem algum alimento que te causa gases e sensação de dilatação abdominal?",
    type: "textarea",
  },
  { id: "esteroides", label: "Já fez uso de esteroides? Caso sim, quais?", type: "textarea" },
  { id: "hora_acorda", label: "Hora que acorda", type: "text" },
  { id: "hora_primeira_refeicao", label: "Hora da primeira refeição", type: "text" },
  { id: "hora_treina", label: "Hora que treina", type: "text" },
  { id: "hora_dorme", label: "Hora que dorme", type: "text" },
];

export type AnamneseAnswers = Record<string, string>;

/** Fotos da anamnese — frente, costas e lado. */
export const ANAMNESE_PHOTOS = [
  { key: "photo_frente", label: "Frente" },
  { key: "photo_costas", label: "Costas" },
  { key: "photo_lado", label: "Lado" },
] as const;

export const ANAMNESE_PHOTO_INSTRUCTIONS =
  "Fotos de biquíni ou short e top (homens de sunga, sem camisa) de frente, costas e de lado. " +
  "Precisam ser nítidas e sem o celular na mão, para uma boa avaliação. " +
  "Se possível, fotografe com uma parede de fundo branca ou fosca.";
