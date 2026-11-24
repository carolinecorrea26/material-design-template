/** Optional shared or product-scoped copy. Empty productKeys means one page-level note. */
export function validatePageNotes(value, productKeys) {
  const registered = productKeys ? new Set(productKeys) : null;
  const ids = new Set();
  if (!Array.isArray(value)) throw new Error('Invalid configurable page notes');
  for (const note of value) {
    if (!note || typeof note !== 'object' || Array.isArray(note) || Object.keys(note).some(key => !['id', 'text', 'productKeys'].includes(key))
      || typeof note.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(note.id) || ids.has(note.id)
      || typeof note.text !== 'string' || !note.text.trim() || !Array.isArray(note.productKeys)
      || note.productKeys.some(key => typeof key !== 'string' || !key.trim() || registered && !registered.has(key))
      || new Set(note.productKeys).size !== note.productKeys.length) throw new Error('Invalid configurable page notes');
    ids.add(note.id);
  }
  return value;
}
export function pageNotesFor(notes, productKey) {
  validatePageNotes(notes);
  return notes.filter(note => productKey === undefined ? !note.productKeys.length : note.productKeys.includes(productKey));
}
