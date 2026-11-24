import { expect, it } from 'vitest';
import { canonicalContentKey, resolveContentReferences } from './contentReferences.mjs';
import { requirementText } from './requirementContent';
import { freshStartSource } from './freshStartCatalog';

it('resolves shared copy through explicit references and rejects ambiguous or broken authoring', () => {
  expect(resolveContentReferences({ 'action.cancel': 'Cancel' }, { 'dialog.cancel': 'action.cancel' })).toEqual({ 'action.cancel': 'Cancel', 'dialog.cancel': 'Cancel' });
  expect(() => resolveContentReferences({ a: 'copy', b: 'copy' }, { b: 'a' })).toThrow('second authored value');
  expect(() => resolveContentReferences({}, { b: 'missing' })).toThrow('Missing content reference');
  expect(() => canonicalContentKey('a', { a: 'b', b: 'a' })).toThrow('Circular');
});
it('authors common actions and technical-error wording once while preserving independent copy slots', () => {
  const source = freshStartSource();
  for (const [alias, owner] of Object.entries(source.contentReferences!)) {
    expect(Object.hasOwn(source.content, alias)).toBe(false);
    expect(requirementText(alias)).toBe(source.content[canonicalContentKey(owner, source.contentReferences)]);
  }
  expect(source.content['receipt.email.subject']).toBe(source.content['receipt.email.title']);
  expect(Object.hasOwn(source.pages.receipt.contentSlots!, 'receipt.email.subject')).toBe(true);
  expect(Object.hasOwn(source.pages.receipt.contentSlots!, 'receipt.email.title')).toBe(true);
});
