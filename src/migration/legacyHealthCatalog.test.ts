// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { adoptedLegacyHealthAssignments, legacyHealthCatalog, legacyHealthForm, legacyHealthApplicabilityEvidence } from './legacyHealthCatalog';

it('preserves exact source bytes and all question/instruction lines under named form boundaries', () => {
  const source = readFileSync(legacyHealthCatalog.source.path);
  expect(createHash('sha256').update(source).digest('hex')).toBe(legacyHealthCatalog.source.sha256);
  const lines = source.toString('utf8').split(/\r?\n/);
  expect(legacyHealthCatalog.forms).toHaveLength(18);
  const accounted = new Map<number, number>();
  for (const form of legacyHealthCatalog.forms) {
    expect(form.text).toBe(lines.slice(form.startLine - 1, form.endLine).join('\n'));
    for (let i = form.startLine; i <= form.endLine; i++) accounted.set(i, (accounted.get(i) ?? 0) + 1);
  }
  for (let i = 3; i <= 1017; i++) if (lines[i - 1].trim()) expect(accounted.get(i), `source line ${i}`).toBe(1);
});
it('retains state and pathway variants without treating association labels as active Site assignments', () => {
  expect(legacyHealthForm('GPA-DI-EZ-3').text).toContain('Omit G when a VA Application');
  expect(legacyHealthForm('WAEPAWL').text).toContain('Questions 1, 4, 14 do not get displayed');
  expect(legacyHealthForm('CI-2014').text).toContain('CA only');
  expect(legacyHealthForm('CI-2014 - CI only applications').text).toContain('online and on the PDF');
  expect(legacyHealthForm('GMA-L/H-TELE-SUPP').text).toContain('300 char limit');
  expect(legacyHealthForm('Supp DI').text).toContain('option to add row');
  expect(adoptedLegacyHealthAssignments).toEqual([]);
  expect(legacyHealthApplicabilityEvidence.flatMap(row => row.associations as readonly string[])).not.toContain('ASCE');
  expect(() => legacyHealthForm('missing')).toThrow();
});
