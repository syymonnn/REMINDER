import { addDays, startOfDay as _startOfDay, format, startOfWeek, endOfWeek, endOfMonth, startOfMonth, addMonths } from "date-fns";

export const startOfDay = (d: Date) => _startOfDay(d);

export function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function fromISODate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function rangeForDay(day: Date) {
  const start = _startOfDay(day);
  const end = addDays(start, 1);
  return { start, end };
}

export function rangeForWeek(day: Date, weekStartsOn: 1 | 0 = 1) {
  const start = startOfWeek(day, { weekStartsOn });
  const end = addDays(endOfWeek(day, { weekStartsOn }), 1);
  return { start, end };
}

export function rangeForMonth(day: Date) {
  const start = startOfMonth(day);
  const end = addDays(endOfMonth(day), 1);
  return { start, end };
}

export function monthGridStart(day: Date) {
  // start from week start containing the 1st of month
  const first = startOfMonth(day);
  return startOfWeek(first, { weekStartsOn: 1 });
}

export function monthGridDays(day: Date) {
  const start = monthGridStart(day);
  // 6 weeks grid
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function fmtDayLabel(d: Date) {
  return format(d, "EEE dd MMM");
}

export function fmtTime(d: Date) {
  return format(d, "HH:mm");
}

export function addMonth(day: Date, delta: number) {
  return addMonths(day, delta);
}
