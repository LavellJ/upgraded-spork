// Prefer same-origin if VITE_API_URL is not set
const base = (import.meta.env.VITE_API_URL ?? "").trim();
const API_BASE = base ? base.replace(/\/$/, "") : ""; // "" => same-origin

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const pingHealth = () => api<{ ok: boolean; ts: number }>("/api/health");