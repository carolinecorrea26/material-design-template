import { expect, it } from 'vitest';
import { pageNotesFor, validatePageNotes } from './pageNotes.mjs';
it('keeps shared copy separate from product-specific copy without duplicating a shared note', () => {
  const notes = [{ id: 'shared', text: 'Tax note', productKeys: [] }, { id: 'fees', text: 'Billing fees', productKeys: ['li-term', 'di-ltd'] }];
  expect(pageNotesFor(notes).map(note => note.id)).toEqual(['shared']);
  expect(pageNotesFor(notes, 'li-term').map(note => note.id)).toEqual(['fees']);
  expect(pageNotesFor(notes, 'li-add')).toEqual([]);
  expect(validatePageNotes([])).toEqual([]);
});
it.each([
  [{ id: 'same', text: 'a', productKeys: [] }, { id: 'same', text: 'b', productKeys: [] }],
  [{ id: 'blank', text: ' ', productKeys: [] }],
  [{ id: 'product', text: 'Valid copy', productKeys: ['not-assigned'] }],
  [{ id: 'duplicate', text: 'Valid copy', productKeys: ['li-term', 'li-term'] }],
])('rejects invalid or unassigned note content', notes => {
  expect(() => validatePageNotes(notes, ['li-term'])).toThrow('Invalid configurable page notes');
});
