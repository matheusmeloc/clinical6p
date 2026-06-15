/**
 * Utilitários de formatação compartilhados entre as páginas.
 * Evita duplicação de lógica em PacientesPage, AgendamentosPage e MensagensPage.
 */

/** Formata uma string de data ISO (YYYY-MM-DD) para pt-BR (DD/MM/YYYY). */
export function formatDate(value) {
  if (!value) return "—";
  const iso = value.includes("T") ? value : value + "T00:00:00";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

/** Formata uma string ISO completa (com hora) para pt-BR com data e hora. */
export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/** Formata uma string de hora HH:MM:SS para HH:MM. */
export function formatTime(value) {
  return value?.slice(0, 5) || "—";
}

/** Formata um CPF (11 dígitos numéricos) para 000.000.000-00. */
export function formatCPF(cpf) {
  if (!cpf) return "—";
  const d = cpf.replace(/\D/g, "");
  return d.length === 11
    ? d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
    : cpf;
}

/** Formata um CEP (8 dígitos numéricos) para 00000-000. */
export function formatCEP(cep) {
  if (!cep) return "";
  const d = cep.replace(/\D/g, "");
  return d.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}
