export function getFifteenDaysDueDateFormatted(): string {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toLocaleDateString('pt-BR');
}

export function calculateDaysRemaining(dueDateStr?: string): number {
  if (!dueDateStr) return 15;
  const due = new Date(dueDateStr).getTime();
  const now = new Date().getTime();
  return Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
}
