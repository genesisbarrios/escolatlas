/** Client-side compare list persisted in localStorage. Cap: 4 schools. */

const KEY = "escolatlas.compare";
export const COMPARE_LIMIT = 4;

const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((l) => l());
}

export function getCompareIds(): string[] {
  return read();
}

export function isInCompare(id: string): boolean {
  return read().includes(id);
}

export function addToCompare(id: string) {
  const ids = read();
  if (ids.includes(id) || ids.length >= COMPARE_LIMIT) return;
  write([...ids, id]);
}

export function removeFromCompare(id: string) {
  write(read().filter((x) => x !== id));
}

export function clearCompare() {
  write([]);
}

export function subscribeCompare(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
