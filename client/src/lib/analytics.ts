// src/lib/analytics.ts
export type QIAction = 'start' | 'complete' | 'resume' | 'import' | 'export' | 'loop_up' | 'award';
export type QIEvent = {
  ts: string;       // ISO timestamp
  loop: number;
  biome?: string;
  lessonId?: string;
  action: QIAction;
  meta?: Record<string, unknown>;
};

const KEY = 'qi_events';

export function logEvent(evt: QIEvent) {
  try {
    const arr: QIEvent[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    arr.push(evt);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
  // Always echo to console for dev visibility
  // eslint-disable-next-line no-console
  console.log('[QI]', evt);
}

export function getEvents(): QIEvent[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function clearEvents() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function downloadEventsCSV(filename = 'quest_island_events.csv') {
  const rows = getEvents();
  const header = ['ts','loop','biome','lessonId','action','meta'];
  const toRow = (e: QIEvent) => [
    e.ts, e.loop, e.biome ?? '', e.lessonId ?? '', e.action, JSON.stringify(e.meta ?? {})
  ];
  const csv = [header, ...rows.map(toRow)]
    .map(r => r.map(x => String(x).replaceAll('"','""')).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}