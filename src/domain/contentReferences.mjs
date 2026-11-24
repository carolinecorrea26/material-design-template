/** References share authored copy; consumer bindings are read-only projections. */
export function canonicalContentKey(key, references = {}) {
  const seen = new Set();
  while (Object.hasOwn(references, key)) {
    if (seen.has(key)) throw new Error(`Circular content reference: ${key}`);
    seen.add(key);
    const target = references[key];
    if (typeof target !== 'string' || !target.trim()) throw new Error(`Invalid content reference: ${key}`);
    key = target;
  }
  return key;
}
export function resolveContentReferences(content, references = {}) {
  const output = { ...content };
  for (const key of Object.keys(references)) {
    if (Object.hasOwn(content, key)) throw new Error(`Referenced content cannot have a second authored value: ${key}`);
    const owner = canonicalContentKey(key, references);
    if (!Object.hasOwn(content, owner)) throw new Error(`Missing content reference: ${key} -> ${owner}`);
    output[key] = content[owner];
  }
  return output;
}
