/**
 * Funções de máscara para campos de formulário.
 * Cada função recebe o valor bruto e retorna o valor formatado.
 */

/** (11) 99999-9999 */
export function maskPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

/** 999.999.999-99 */
export function maskCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Apenas dígitos (para campos numéricos sem máscara visual) */
export function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

/** Apenas letras, números, barras e pontos (para CRP, CRM, etc.) */
export function maskRegister(value) {
  return value.replace(/[^a-zA-Z0-9/.\- ]/g, "").toUpperCase();
}
