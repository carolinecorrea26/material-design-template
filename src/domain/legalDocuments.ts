import type { LegalDocContent } from '../content/types';

/** The shared legal viewer accepts structured text, never authored HTML. */
export function isLegalDocContent(value: unknown): value is LegalDocContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const document = value as LegalDocContent;
  const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
  const lines = (value: unknown) => Array.isArray(value) && value.length > 0 && value.every(text);
  return text(document.title) && (document.revision === undefined || text(document.revision)) &&
    Array.isArray(document.sections) && document.sections.length > 0 && document.sections.every(section => {
      if (!section || typeof section !== 'object' || Array.isArray(section)) return false;
      if (section.type === 'heading') return [1, 2].includes(section.level) && text(section.text);
      if (section.type === 'paragraph' || section.type === 'note') return text(section.text);
      if (section.type === 'list') return lines(section.items);
      return section.type === 'address' && lines(section.lines);
    });
}
