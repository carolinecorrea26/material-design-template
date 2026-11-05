import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../../migration/fixtures';

it('keeps saved CI source wording aligned with the reviewed compiler', () => {
  const db = createReviewedMigrationDatabase();
  const rows = {
    fields: db.fields.filter(row => row.key.startsWith('health-abe-')),
    configurationValues: db.configurationValues.filter(row => row.key === 'abe.health-ci.source-questionnaire'),
    semanticRequirements: db.semanticRequirements.filter(row => row.key === 'business-decision.rules-review.abe-source-health-forms'),
  };
  const saved = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data;
  for (const row of rows.fields.filter(row => row.key.endsWith('-ca'))) expect(saved.fields.find((field: { key: string }) => field.key === row.key)?.definition).toEqual(row.definition);
  expect(saved.configurationValues.find((row: { key: string }) => row.key === 'abe.health-ci.source-questionnaire').value).toEqual(rows.configurationValues[0].value);
});
