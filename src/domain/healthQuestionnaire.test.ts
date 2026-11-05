import { expect, it } from 'vitest';
import { validateHealthFollowUps } from './healthQuestionnaire';
import { detailsMapping, createAnswerFields } from '../config/fields/healthSiFields';

const question = { answer: createAnswerFields('self')[0], collection: 'health-si-q1-details', ...detailsMapping };
it('blocks a Yes answer with missing or incomplete restored detail rows', () => {
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'yes' })).toContain('Add details');
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'yes', 'health-si-q1-details': [{ onset: '01/2020', conditionsDetails: 'Medication' }] })).toContain('Physician');
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'yes', 'health-si-q1-details': [{ onset: '01/2020', conditionsDetails: 'Medication', physicianAddress: 'Local mock physician' }] })).toBeUndefined();
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'yes', 'health-si-q1-details': [{ onset: 'invalid', conditionsDetails: 'Medication', physicianAddress: 'Local mock physician' }] })).toContain('month and year');
});
it('does not validate inactive details and keeps applicant follow-ups separate', () => {
  const spouse = { ...question, answer: createAnswerFields('spouse')[0], collection: 'health-si-q1-spouse-details' };
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'no', 'health-si-q1-details': [{}] })).toBeUndefined();
  expect(validateHealthFollowUps([spouse], { 'health-si-q1-spouse': 'yes', 'health-si-q1-details': [{ onset: '01/2020', conditionsDetails: 'Member', physicianAddress: 'Member physician' }] })).toContain('Add details');
  expect(validateHealthFollowUps([question], {})).toContain('Answer');
});
it('preserves the source albumin condition in the existing SI question', () => {
  expect(createAnswerFields('self')[1].label).toContain('albumin, blood, pus or sugar');
  expect(createAnswerFields('self')[1].label).not.toContain('blood disorder, allergies');
});

it('rejects impossible months and malformed restored details before advancing', () => {
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'yes', 'health-si-q1-details': [{ onset: '13/2020', conditionsDetails: 'Medication', physicianAddress: 'Local physician' }] })).toContain('valid month');
  expect(validateHealthFollowUps([question], { 'health-si-q1': 'yes', 'health-si-q1-details': [{ onset: '01/2020', conditionsDetails: '   ', physicianAddress: 'Local physician' }] })).toContain('required');
});
