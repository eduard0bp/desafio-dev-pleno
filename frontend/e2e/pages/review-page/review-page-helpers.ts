const MONTHS_PT_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function dayButtonName(date: Date): string {
  return `${date.getDate()} ${MONTHS_PT_BR[date.getMonth()]} ${date.getFullYear()}`;
}
