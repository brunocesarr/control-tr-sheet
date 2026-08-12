/**
 * @param timestamp epoch ms of the event
 * @param now       epoch ms treated as "now". Injected by callers so the value
 *                  comes from useNow() rather than a render-time Date.now(),
 *                  keeping components pure and the label in sync with any
 *                  staleness styling derived from the same tick.
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  if (!timestamp) return 'agora';

  const seconds = Math.round((now - timestamp) / 1000);
  if (seconds < 60) return 'agora';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.round(hours / 24);
  return `há ${days} d`;
}
