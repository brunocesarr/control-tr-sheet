const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** "agora mesmo" · "há 2 minutos" · "há 3 horas" */
export function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const absolute = Math.abs(seconds);

  if (absolute < 45) return 'agora mesmo';
  if (absolute < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (absolute < 86_400) return formatter.format(Math.round(seconds / 3600), 'hour');
  return formatter.format(Math.round(seconds / 86_400), 'day');
}
