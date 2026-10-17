/** Client-side compare list — in-memory only; resets on page refresh. Cap: 4. */

export const COMPARE_LIMIT = 4;

let ids: string[] = [];
const listeners = new Set<() => void>();

function write(next: string[]) {
  ids = next;
  listeners.forEach((l) => l());
}

export function getCompareIds(): string[] {
  return ids;
}

export function isInCompare(id: string): boolean {
  return ids.includes(id);
}

export function addToCompare(id: string) {
  if (ids.includes(id) || ids.length >= COMPARE_LIMIT) return;
  write([...ids, id]);
}

export function removeFromCompare(id: string) {
  write(ids.filter((x) => x !== id));
}

export function clearCompare() {
  write([]);
}

export function subscribeCompare(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
