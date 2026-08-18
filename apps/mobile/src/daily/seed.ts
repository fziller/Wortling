export function hashSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function pickSeededIndex(seed: string, size: number): number {
  if (size <= 0) {
    throw new Error("Cannot pick from an empty list.");
  }

  return hashSeed(seed) % size;
}
