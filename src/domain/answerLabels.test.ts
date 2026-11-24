import { expect, it } from 'vitest';
import { booleanAnswerLabel } from './answerLabels';
import { freshStartSource } from './freshStartCatalog';
it('uses shared field choices for boolean display without document-preview CMS records', () => {
  expect(booleanAnswerLabel(true)).toBe('Yes');
  expect(booleanAnswerLabel(false)).toBe('No');
  const source = freshStartSource();
  for (const key of ['application.document-preview.prepared-on', 'application.document-preview.yes', 'application.document-preview.no']) expect(Object.hasOwn(source.content, key)).toBe(false);
});
