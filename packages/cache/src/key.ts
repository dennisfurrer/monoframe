const MAX_INLINE_LENGTH = 120;

// FNV-1a, 32 bit. Not cryptographic.
export function hashString(input: string): string {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(
      ([entryKey, entryValue]) => `${entryKey}:${stableStringify(entryValue)}`,
    );

  return `{${entries.join(",")}}`;
}

// Param order does not affect the key. Long param sets collapse to a hash.
export function cacheKey(
  name: string,
  params?: Record<string, unknown>,
): string {
  if (params === undefined) return name;

  const serialized = stableStringify(params);
  if (serialized === "{}") return name;

  return serialized.length > MAX_INLINE_LENGTH
    ? `${name}#${hashString(serialized)}`
    : `${name}#${serialized}`;
}
