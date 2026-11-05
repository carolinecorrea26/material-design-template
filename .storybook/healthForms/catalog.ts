import source from '../../src/migration/sources/health-forms-questions.json';
import legacy from '../../src/migration/sources/legacy-health-catalog.json';
import type { FieldDefinition } from '../../src/domain/fields';

export const sourceHealthForms = legacy.forms.map((form, index) => ({
  key: form.key, section: String(index + 1),
  rows: source.questions.filter(row => row.section === String(index + 1)),
  sourceText: form.text,
}));
export type SourceHealthForm = typeof sourceHealthForms[number];
export type SourceRow = SourceHealthForm['rows'][number];
export type FormPreviewOptions = { jurisdiction: string; gender: string; simplifiedIssue: boolean; omitTobacco: boolean };
export const defaultPreviewOptions: FormPreviewOptions = { jurisdiction: 'PA', gender: 'female', simplifiedIssue: false, omitTobacco: false };
export function sourceHealthForm(key: string): SourceHealthForm {
  const form = sourceHealthForms.find(form => form.key === key);
  if (!form || !form.rows.length) throw new Error(`Missing source health form: ${key}`);
  return form;
}

const options = (labels: string[]) => labels.map(label => ({ value: label, label }));
const detail = (id: string, label: string, extra: Partial<FieldDefinition> = {}): FieldDefinition => ({ id, label, inputType: 'text', required: true, labelVariant: 'standard', multiline: true, minRows: 2, maxLength: 300, ...extra });
const month = (id: string, label: string) => detail(id, label, { format: 'month-year', multiline: false });
const medical = () => [month('onset', 'Date of onset (MM/YYYY)'), detail('illness', 'Illness or injury'), detail('symptoms', 'Symptoms'), month('last-treatment', 'Last date of treatment (MM/YYYY)'), detail('episodes', 'Number of attacks'), detail('treatment-results', 'Treatment and results'), detail('physician', 'Name and address of physician and hospital')];
export type SourceQuestion = { key: string; row: number; label: string; field?: FieldDefinition; details: FieldDefinition[]; repeat: boolean; showDetailsOn: string; notes: string | null };

/** Source headings and instructions remain text, never fabricated Yes/No questions. */
export function sourceFormQuestions(form: SourceHealthForm, preview: FormPreviewOptions): SourceQuestion[] {
  const questions = form.rows.filter(row => visible(row, preview)).map(row => {
    const key = `source-health-${row.row}`;
    let label = row.text ?? '';
    if (preview.jurisdiction === 'CA' && [91, 209].includes(row.row)) label = 'i. Substance Abuse?';
    if (preview.jurisdiction === 'IN' && [28, 196].includes(row.row)) {
      const wording = row.notes?.match(/“([^”]+)”/)?.[1];
      if (wording) label = label.slice(0, label.indexOf('or been treated for:')) + wording;
    }
    // The workbook's WAEPAWL ids include the introductory row; omissions refer to printed question numbers.
    const heading = [35, 55, 70, 82, 94, 133, 156, 162, 200, 212].includes(row.row) || label === '[Form introduction / instruction]';
    const externalWording = row.row === 69;
    const field: FieldDefinition | undefined = heading || externalWording || row.row === 132 ? undefined : {
      id: key, label, inputType: row.row === 108 ? 'dropdown' : 'radio', required: true, labelVariant: 'standard',
      options: row.row === 108 ? options(['Private Home', 'Apartment', 'Retirement Home', 'Congregate Care Community', 'Nursing Care Facility', 'Mobile Home', 'Continuing Care/Care Community', 'Retirement Community', 'Assisted Living Unit', 'Personal Care Home or an Adult Care Home', 'Other']) : [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    };
    if (row.row === 69) label = 'Standard AIDS question — source refers to an attached page; its wording was not supplied.';
    if (row.row === 71) label = `${form.rows.find(row => row.row === 70)?.notes ?? ''} ${label}`;
    if (field) field.label = label;
    const { fields, repeat } = sourceDetails(row);
    return { key, row: row.row, label: label === '[Form introduction / instruction]' ? row.notes ?? '' : label, field, details: fields, repeat, showDetailsOn: row.row === 108 ? 'Other' : 'yes', notes: row.notes };
  });
  // These questions occur inside the workbook's notes rather than its question column.
  if (form.section === '13') {
    const first = questions.findIndex(question => question.row === 126);
    const note = form.rows.find(row => row.row === 126)!.notes!;
    const label = note.slice(note.indexOf('a)Have'), note.indexOf(' Yes/No', note.indexOf('a)Have')));
    questions.splice(first + 1, 0, { key: 'source-health-126-insurance', row: 126, label, field: { id: 'source-health-126-insurance', label, inputType: 'radio', required: true, labelVariant: 'standard', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }, details: [detail('details', 'Details', { maxLength: 500 })], repeat: false, showDetailsOn: 'yes', notes: null });
    const physician = questions.findIndex(question => question.row === 132);
    const testLabel = 'Have you had an EKG, blood tests, x-rays or other diagnostic tests in the past 5 years?';
    questions.splice(physician + 1, 0, { key: 'source-health-132-tests', row: 132, label: testLabel, field: { id: 'source-health-132-tests', label: testLabel, inputType: 'radio', required: true, labelVariant: 'standard', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }, details: [detail('details', 'Details', { maxLength: 500 })], repeat: false, showDetailsOn: 'yes', notes: null });
  }
  return questions;
}

function visible(row: SourceRow, preview: FormPreviewOptions) {
  const region = preview.jurisdiction, mnCt = ['MN', 'CT'].includes(region);
  if ([13, 175].includes(row.row) && (mnCt || region === 'VA')) return false;
  if ([14, 78, 119, 154, 176].includes(row.row) && !mnCt) return false;
  if ([77, 118, 153].includes(row.row) && mnCt) return false;
  if (row.row === 74 && region === 'MD') return false;
  if ([130, 131].includes(row.row) && preview.gender !== 'female') return false;
  if ([178, 181, 191].includes(row.row) && preview.simplifiedIssue) return false;
  if (row.section === '15' && row.id === 'f' && preview.omitTobacco) return false;
  return true;
}

/** Only explicit source follow-ups get controls; unmodeled wording stays visible in source notes. */
function sourceDetails(row: SourceRow): { fields: FieldDefinition[]; repeat: boolean } {
  const n = row.row;
  let fields: FieldDefinition[] = [], repeat = false;
  if ([12, 174].includes(n)) fields = [month('last-used', 'When did you last use tobacco or nicotine products? (MM/YYYY)'), detail('products', 'Product used')];
  if (n === 75) fields = [detail('license', 'Driver’s license number', { multiline: false }), detail('license-state', 'State in which issued', { multiline: false })];
  if (n === 98) fields = [detail('activities', 'Activities requiring assistance or supervision', { inputType: 'multi-select', options: options(['Bathing', 'Dressing', 'Eating', 'Walking', 'Moving in/out of a bed or chair or wheel chair', 'Toileting', 'Bowel or bladder control']), multiline: false })];
  if (n === 108) fields = [detail('other-dwelling', 'Please specify', { multiline: false })];
  if (n === 126) fields = [detail('amount', 'Amount (lbs)', { inputType: 'number', multiline: false }), detail('reason', 'Reason', { maxLength: 500 })];
  if ([127, 131, 168].includes(n)) fields = [detail('details', 'Details', { maxLength: n === 168 ? 300 : 500 })];
  if ([128, 160].includes(n)) { fields = [n === 128 ? month('date', 'Date (MM/YYYY)') : detail('date', 'Date', { inputType: 'date', multiline: false }), detail('treatment', 'Treatment'), detail('condition', 'Condition'), detail('physician', 'Name and address of physician and hospital')]; repeat = true; }
  if ([129, 161].includes(n)) { fields = [detail('medication', 'Medication/Treatment'), detail('dosage', 'Dosage'), detail('frequency', 'Frequency'), detail('reason', 'Reason for use of medication'), detail('physician', 'Name and address of physician and hospital')]; repeat = true; }
  if (n === 132) fields = [
    detail('name', 'Name of regular attending physician', { maxLength: 500 }), detail('street', 'Street address or P.O. box', { maxLength: 500 }),
    detail('street2', 'Street address 2', { required: false }), detail('city', 'City'), detail('state', 'State/Province'), detail('zip', 'Zip code'), detail('phone', 'Phone number'), detail('extension', 'Extension', { required: false }),
    month('consult-date', 'Date of last consult (MM/YYYY)'), detail('consult-reason', 'Reason for last consult', { maxLength: 500 }), detail('diagnosis', 'Diagnosis, results, treatment given or medications prescribed', { maxLength: 500 }),
  ];
  if (n === 130) fields = [detail('due-date', 'Expected due date', { inputType: 'date', multiline: false })];
  if (n >= 134 && n <= 145 || n >= 157 && n <= 159 || n >= 163 && n <= 166 || n >= 178 && n <= 192) { fields = medical(); repeat = true; }
  if (n === 146) fields = [detail('frequency', 'Frequency', { inputType: 'dropdown', options: options(['Daily', 'Weekly', 'Monthly']), multiline: false }), ...['Wine', 'Beer', 'Liquor'].map(label => detail(label.toLowerCase(), label, { inputType: 'number', multiline: false }))];
  if (n === 147) fields = [detail('date', 'Date', { inputType: 'date', multiline: false }), detail('details', 'Details', { maxLength: 500 })];
  if ([148, 149, 167].includes(n)) { fields = [n === 167 ? detail('last-use', 'Date of last use', { inputType: 'date', multiline: false }) : month('last-use', 'Date of last use (MM/YYYY)'), detail('frequency', 'Frequency'), detail('drug', 'Drug'), detail('details', 'Details')]; repeat = true; }
  if (n === 150) fields = [detail('last-use', 'When did you last use tobacco or nicotine products?', { inputType: 'date', multiline: false }), detail('products', 'Product(s) used')];
  if (n === 151) fields = [month('date', 'Date (MM/YYYY)'), detail('details', 'Details', { maxLength: 500 }), detail('physician', 'Name and address of physician and hospital', { maxLength: 500 })];
  if (n === 152) fields = [detail('details', 'Describe (include frequency)', { maxLength: 500 })];
  if (n === 154) { fields = [month('date', 'Date (MM/YYYY)'), detail('details', 'Details')]; repeat = true; }
  if (n === 155) fields = [detail('family-member', 'Family member', { inputType: 'dropdown', options: options(['Father', 'Mother', 'Brother', 'Sister']), multiline: false }), detail('onset-age', 'Age of onset', { inputType: 'number', multiline: false }), detail('status', 'Status', { inputType: 'dropdown', options: options(['Living', 'Deceased']), multiline: false })];
  return { fields, repeat };
}
