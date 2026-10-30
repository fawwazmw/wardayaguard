export function formatMoney(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = String(absolute % 100).padStart(2, '0');
  return `${sign}$${dollars}.${remainder}`;
}

export function formatDate(iso: string): string {
  // SQLite returns "YYYY-MM-DD HH:MM:SS" in UTC. Render the date only.
  const date = new Date(iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().slice(0, 10);
}
