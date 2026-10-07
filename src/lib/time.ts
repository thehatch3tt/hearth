/**
 * Times are saved as "HH:MM" (24-hour) and days as "YYYY-MM-DD", both in the phone's own time zone.
 * They're chosen with pickers (components/Select.tsx) rather than typed.
 */

const pad = (n: number) => String(n).padStart(2, '0');

export type Option = { value: string; label: string };

/** Today as "YYYY-MM-DD". */
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "14:00" → "2:00 pm" */
export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const half = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${half}`;
}

/** "14:00" → "2 pm", "19:30" → "7:30 pm": for small tags. */
export function shortTime(time: string) {
  return formatTime(time).replace(':00', '');
}

/** Minutes from now until a time today (negative if it has passed). */
export function minutesUntil(time: string, now = new Date()) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m - (now.getHours() * 60 + now.getMinutes());
}

function toDate(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-10-09" → { weekday: "Thu", date: 9, month: "Oct" } */
export function dayParts(day: string) {
  const date = toDate(day);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    date: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}

/** "Thu, Oct 9" */
export function longDay(day: string) {
  const { weekday, date, month } = dayParts(day);
  return `${weekday}, ${month} ${date}`;
}

/** Whole days from today until a day (0 = today, negative = past). */
export function daysUntil(day: string, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((toDate(day).getTime() - start.getTime()) / 86_400_000);
}

/** "Today", "Tomorrow", "Thu" within a week, else "Oct 9". */
export function relativeDay(day: string, today = new Date()) {
  const ahead = daysUntil(day, today);
  if (ahead === 0) return 'Today';
  if (ahead === 1) return 'Tomorrow';
  const { weekday, date, month } = dayParts(day);
  return ahead > 1 && ahead < 7 ? weekday : `${month} ${date}`;
}

/** The clock time of a moment, e.g. "8:12 am". */
export function clockTime(ms: number) {
  const date = new Date(ms);
  return formatTime(`${pad(date.getHours())}:${pad(date.getMinutes())}`);
}

/** "Good morning" / "Good afternoon" / "Good evening" */
export function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}
