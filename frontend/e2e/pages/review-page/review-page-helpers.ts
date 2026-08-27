// Matches the lowercase month names dayjs's pt-br locale renders in the
// DatePickerInput calendar's day-button accessible names (e.g. "26 agosto
// 2026"), so picking a date the calendar already has open (no month
// navigation) can target the right button by its accessible name.
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
