import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = path.resolve('scripts/check-requirements.mjs');

function editRequirement(dir, kind, name, edit) {
  const file = path.join(dir, 'requirements/global', kind, `${name}.json`);
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  edit(document);
  fs.writeFileSync(file, JSON.stringify(document));
}

test('Home review includes fresh-start settings, rules and validations with their status', () => withRequirements(dir => {
  const result = check(dir, '--page', 'home');
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /home-variant \[draft\]/);
  assert.match(result.output, /home-quote-entry-handoff \[confirmed\]/);
  assert.match(result.output, /date-value-format \[draft\]/);
  assert.match(result.output, /not proof of calendar-date validity or age eligibility/);
}));

test('configuration defaults and options are checked', () => withRequirements(dir => {
  editRequirement(dir, 'configurations', 'presentation', document => {
    document.configurations[0].default = 'missing-variant';
    document.configurations[0].options.push('default');
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /default must be an authored option/);
  assert.match(result.output, /duplicate configuration option/);
}));

test('fresh-start references, review status and evidence are checked', () => withRequirements(dir => {
  editRequirement(dir, 'rules', 'address', document => {
    const entry = document.rules[0];
    entry.page = 'missing-page';
    entry.component = 'missing-component';
    entry.fields = ['missing-field', 'missing-field'];
    entry.status = 'approved';
    entry.source = '';
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  for (const message of [/unexpected property page/, /unexpected property component/,
    /unknown field missing-field/, /duplicate field reference/, /status must be draft or confirmed/,
    /source must be a non-empty string/]) assert.match(result.output, message);
}));

test('validation records reject duplicates, unknown checks and extra required settings', () => withRequirements(dir => {
  editRequirement(dir, 'validations', 'fields', document => {
    document.validations[0].check = 'unknown-check';
    document.validations[0].required = true;
    document.validations.push({ ...document.validations[0] });
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate validations id required-fields/);
  assert.match(result.output, /unknown validation check unknown-check/);
  assert.match(result.output, /unexpected property required/);
}));

test('fresh-start documents reject malformed record arrays and entries', () => withRequirements(dir => {
  editRequirement(dir, 'configurations', 'presentation', document => { document.configurations = null; });
  editRequirement(dir, 'rules', 'address', document => { document.rules = [null]; });
  editRequirement(dir, 'validations', 'fields', document => {
    document.validations[0].fields = 'birth-date';
    document.validations[0].statement = '';
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /configurations must be an array/);
  assert.match(result.output, /rules entry must be an object/);
  assert.match(result.output, /unexpected property fields/);
  assert.match(result.output, /statement must be a non-empty string/);
}));

function editRequirementMapping(dir, component, edit) {
  const file = path.join(dir, 'requirements/mappings/requirements', `${component}.json`);
  const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
  edit(mapping);
  fs.writeFileSync(file, JSON.stringify(mapping));
}

test('one shared address rule is reviewed from Home and Eligibility without duplication', () => withRequirements(dir => {
  for (const page of ['home', 'eligibility']) {
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /state-province-from-postal-code \[draft\]/);
    if (page === 'eligibility') {
      assert.doesNotMatch(result.output, /home-quote-entry-handoff/);
      assert.match(result.output, /page-validation-callback \[draft\]/);
    }
  }
  assert.equal(fs.existsSync(path.join(dir, 'requirements/global/rules/home.json')), false);
}));

test('definitions need no page or component and validation fields belong to mappings', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/global/validations/dates.json');
  const entry = JSON.parse(fs.readFileSync(file, 'utf8')).validations[0];
  for (const key of ['page', 'component', 'fields']) assert.equal(Object.hasOwn(entry, key), false);
  const result = check(dir, '--page', 'home');
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /date-value-format \[draft\][^\n]*\[home\]\n      fields: birth-date/);
  assert.match(result.output, /trigger: get-quote/);
}));

test('requirement mappings reject unknown references and duplicate bindings', () => withRequirements(dir => {
  editRequirementMapping(dir, 'home', mapping => {
    mapping.configurations.push('missing-setting', 'home-variant');
    mapping.rules.push('missing-rule');
    mapping.validations.push({ validation: 'missing-check', fields: ['birth-date'] });
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  for (const message of [/unknown configurations reference missing-setting/,
    /duplicate configurations reference home-variant/, /unknown rules reference missing-rule/,
    /unknown validations reference missing-check/]) assert.match(result.output, message);
}));

test('validation mappings reject unknown or unrelated fields and malformed bindings', () => withRequirements(dir => {
  editRequirementMapping(dir, 'home', mapping => {
    mapping.validations = [
      { validation: 'required-fields', fields: ['missing-field', 'email', 'email'], required: true },
      { validation: 'date-value-format', fields: [] },
      null,
    ];
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  for (const message of [/unknown field missing-field/, /field email is not mapped to component home/,
    /duplicate field reference/, /unexpected validation binding property required/,
    /validation binding fields must be a non-empty array/, /validation binding must be an object/,
    /validation trigger must be a lowercase hyphenated event id/]) assert.match(result.output, message);
}));

test('requirement mapping identity and list shapes are checked', () => withRequirements(dir => {
  editRequirementMapping(dir, 'home', mapping => {
    mapping.component = 'missing-component';
    mapping.page = 'home';
    mapping.rules = null;
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  for (const message of [/unknown component missing-component/, /file name does not match the component id/,
    /unexpected property page/, /rules must be an array/]) assert.match(result.output, message);
}));

test('duplicate definitions are rejected across subject files', () => withRequirements(dir => {
  editRequirement(dir, 'rules', 'coverage', document => {
    document.rules.push({
      id: 'state-province-from-postal-code', name: 'Duplicate', status: 'draft',
      statement: 'Duplicate definition.', source: 'test',
    });
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate rules id state-province-from-postal-code/);
}));

test('quoting requirements expand through the Home component reference only (CHG-003)', () => withRequirements(dir => {
  const membership = check(dir, '--page', 'membership');
  assert.equal(membership.status, 0, membership.output);
  assert.doesNotMatch(membership.output, /\[quote-calculator\]/);
  for (const page of ['home']) {
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    for (const id of ['coverage-question-participation', 'estimated-rate-states', 'quote-apply-carry-forward']) {
      assert.match(result.output, new RegExp(`${id} \\[draft\\][^\\n]*\\[quote-calculator\\]`));
    }
    assert.match(result.output, /estimated-rate-frequency-toggle \[draft\]/);
    assert.match(result.output, /default: false/);
    assert.match(result.output, /scope: visible-fields/);
    assert.match(result.output, /trigger: inline-category-continue/);
  }
}));

test('quote mappings include applicant tobacco follow-ups and riders without dependent fields', () => withRequirements(dir => {
  const mapping = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/mappings/components/quote-calculator.json'), 'utf8'));
  for (const id of ['tobacco-last-used', 'tobacco-products', 'rider', 'rider-amount']) {
    assert.deepEqual(mapping.fields.find(field => field.field === id)?.people, ['self']);
  }
  assert.ok(mapping.fields.every(field => field.people.every(person => person === 'self')));
  const coverage = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/mappings/page-fields/coverage.json'), 'utf8'));
  for (const id of ['tobacco-last-used', 'tobacco-products']) {
    assert.deepEqual(coverage.fields.find(field => field.field === id)?.people, ['self', 'spouse']);
  }
  for (const page of ['home']) {
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    for (const id of ['tobacco-last-used', 'tobacco-products', 'rider', 'rider-amount']) {
      assert.match(result.output, new RegExp(`${id}\\s+[^\\n]*self\\s+\\[quote-calculator\\]`));
    }
  }
}));

test('confirmed product selection validation applies on quote Apply', () => withRequirements(dir => {
  const validations = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/global/validations/quoting.json'), 'utf8')).validations;
  assert.deepEqual(validations.find(entry => entry.id === 'quote-product-required'), {
    id: 'quote-product-required', name: 'Select a product before Apply', status: 'confirmed',
    check: 'product-selection', statement: 'At least one product must be selected before Apply.',
    source: 'docs/requirements-spec/page-review.md; src/domain/coverageRuntime.ts',
  });
  for (const page of ['home']) {
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /quote-product-required \[confirmed\][^\n]*\[quote-calculator\]\n\s+fields: add-coverage\n\s+trigger: apply/);
    assert.match(result.output, /field-definition-checks \[draft\][^\n]*\[quote-calculator\]\n\s+trigger: apply\n\s+scope: applicable-quote-fields/);
  }
}));

test('validation bindings allow distinct triggers but reject duplicate triggers', () => withRequirements(dir => {
  editRequirementMapping(dir, 'quote-calculator', mapping => {
    mapping.validations.push({ validation: 'field-definition-checks', trigger: 'apply', scope: 'visible-fields' });
  });
  assert.match(check(dir).output, /duplicate validations reference field-definition-checks/);
}));

test('shared Next requirements are mapped once across form pages and not Home', () => withRequirements(dir => {
  for (const page of ['membership', 'eligibility', 'payment', 'docusign']) {
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /form-next-save \[draft\][^\n]*\[form-route-page\]/);
    assert.match(result.output, /scope: registered-fields/);
    assert.match(result.output, /scope: page/);
    assert.match(result.output, /remain with errors if validation fails/);
  }
  const home = check(dir, '--page', 'home');
  assert.equal(home.status, 0, home.output);
  assert.doesNotMatch(home.output, /form-next-save/);
}));

test('shared form applicability rejects unknown, duplicate and empty page lists', () => withRequirements(dir => {
  editRequirementMapping(dir, 'form-route-page', mapping => { mapping.pages = ['membership', 'membership', 'missing-page']; });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate page membership/);
  assert.match(result.output, /unknown page missing-page/);
  editRequirementMapping(dir, 'form-route-page', mapping => { mapping.pages = []; });
  assert.match(check(dir).output, /pages must be a non-empty array/);
}));

test('validation scopes reject unknown and ambiguous bindings', () => withRequirements(dir => {
  editRequirementMapping(dir, 'form-route-page', mapping => {
    mapping.validations[0].scope = 'all-data';
    mapping.validations[0].fields = ['birth-date'];
    delete mapping.validations[1].scope;
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /unknown validation scope all-data/);
  assert.match(result.output, /validation binding must declare fields or scope, not both/);
}));

test('boolean configurations reject string defaults and enum options', () => withRequirements(dir => {
  editRequirement(dir, 'configurations', 'quoting', document => {
    document.configurations[1].default = 'false';
    document.configurations[1].options = ['true', 'false'];
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /boolean default must be true or false/);
  assert.match(result.output, /boolean configuration must not declare options/);
}));

test('eligible-state settings are reusable across application and quote entry', () => withRequirements(dir => {
  for (const page of ['home', 'eligibility', 'contact']) {
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    assert.match(result.output, /eligible-states-only \[draft\]/);
    assert.match(result.output, /eligible-states \[draft\]/);
    assert.match(result.output, /eligible-state-options \[draft\]/);
    assert.match(result.output, /filtered by eligible state codes/);
  }
}));

test('Coverage references shared quoting policies without calculator-only behavior', () => withRequirements(dir => {
  const result = check(dir, '--page', 'coverage');
  assert.equal(result.status, 0, result.output);
  for (const id of ['coverage-category-availability', 'coverage-question-participation', 'coverage-product-reveal', 'coverage-product-selection', 'estimated-rate-states', 'coverage-selection-policy', 'estimated-rate-frequency']) {
    assert.match(result.output, new RegExp(`${id} \\[draft\\][^\\n]*\\[coverage\\]`));
  }
  for (const id of ['calculator-question-and-reveal-details', 'quote-apply-carry-forward', 'home-quote-entry-handoff']) {
    assert.doesNotMatch(result.output, new RegExp(id));
  }
}));

test('Membership no longer offers the quote calculator (CHG-003)', () => withRequirements(dir => {
  for (const kind of ['components', 'requirements']) {
    assert.equal(fs.existsSync(path.join(dir, `requirements/mappings/${kind}/membership-quote-helper.json`)), false);
  }
  const navigation = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/global/workflows/navigation.json'), 'utf8')).workflows;
  assert.equal(navigation.some(rule => rule.id === 'membership-estimate-helper'), false);
  const result = check(dir, '--page', 'membership');
  assert.equal(result.status, 0, result.output);
  assert.doesNotMatch(result.output, /quote-calculator|membership-quote-helper|zip-postal-code/);
}));

test('shared quoting definitions are classified and mapped separately from quote workflows', () => withRequirements(dir => {
  const rules = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/global/rules/coverage.json'), 'utf8')).rules;
  const quoteWorkflows = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/global/workflows/quoting.json'), 'utf8')).workflows;
  assert.deepEqual(quoteWorkflows.map(rule => rule.id), [
    'home-quote-entry-handoff', 'quote-entry-open-calculator', 'quote-apply-carry-forward',
  ]);
  assert.equal(quoteWorkflows[0].status, 'confirmed');
  assert.ok(quoteWorkflows.slice(1).every(entry => entry.status === 'draft'));
  assert.match(quoteWorkflows[2].statement, /tobacco answers and selected riders/);
  const core = ['coverage-category-availability', 'coverage-question-participation', 'coverage-selection-policy'];
  assert.equal(rules.some(rule => rule.id.startsWith('quote-')), false);
  for (const id of core) {
    const rule = rules.find(entry => entry.id === id);
    assert.ok(rule, id);
    assert.doesNotMatch(rule.statement, /Membership|Coverage-page|calculator|share the|each usage/i);
  }
  for (const component of ['coverage', 'quote-calculator']) {
    const mapping = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/mappings/requirements', `${component}.json`), 'utf8'));
    assert.deepEqual(mapping.rules.filter(id => core.includes(id)).sort(), [...core].sort());
    assert.deepEqual(mapping.workflows.filter(id => id.startsWith('coverage-')).sort(),
      ['coverage-product-reveal', 'coverage-product-selection']);
    assert.ok(mapping.presentation.includes('estimated-rate-states'));
  }
  assert.equal(rules.some(entry => ['quote-rate-presentation', 'calculator-question-and-reveal-details'].includes(entry.id)), false);
  const result = check(dir);
  assert.equal(result.status, 0, result.output);
}));

test('new classifications reject wrong references, duplicates and invalid workflow fields', () => withRequirements(dir => {
  editRequirementMapping(dir, 'coverage', mapping => {
    mapping.rules.push('estimated-rate-states');
    mapping.presentation.push('estimated-rate-states', 'missing-display');
    mapping.workflows.push('missing-workflow');
  });
  editRequirement(dir, 'workflows', 'quoting', document => {
    document.workflows[0].fields = ['missing-field', 'missing-field'];
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  for (const message of [/unknown rules reference estimated-rate-states/,
    /duplicate presentation reference estimated-rate-states/, /unknown presentation reference missing-display/,
    /unknown workflows reference missing-workflow/, /unknown field missing-field/, /duplicate field reference/]) {
    assert.match(result.output, message);
  }
}));

test('requirement IDs cannot be duplicated across classifications', () => withRequirements(dir => {
  editRequirement(dir, 'presentation', 'coverage', document => {
    document.presentation[0].id = 'coverage-question-participation';
  });
  assert.match(check(dir).output, /duplicate requirement id coverage-question-participation/);
}));

test('state-code configurations reject invalid and duplicate codes', () => withRequirements(dir => {
  editRequirement(dir, 'configurations', 'address', document => {
    document.configurations[1].default = ['NY', 'ny', 'US-NY'];
  });
  assert.match(check(dir).output, /state-code default must be an array of two-letter uppercase codes/);
  editRequirement(dir, 'configurations', 'address', document => {
    document.configurations[1].default = ['NY', 'NY'];
    document.configurations[1].options = ['NY'];
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate state code/);
  assert.match(result.output, /string-list configuration must not declare options/);
}));

test('state-code configurations allow an unassigned list but reject invalid types and formats', () => withRequirements(dir => {
  let result = check(dir);
  assert.equal(result.status, 0, result.output);
  editRequirement(dir, 'configurations', 'address', document => {
    document.configurations[1].default = 'NY';
    document.configurations[1].format = 'unknown';
    document.configurations[0].format = 'state-code';
  });
  result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /state-code default must be an array/);
  assert.match(result.output, /string-list format must be state-code/);
  assert.match(result.output, /format is only supported on string-list configurations/);
}));

function withRequirements(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'requirements-check-'));
  try {
    fs.cpSync('requirements', path.join(dir, 'requirements'), { recursive: true });
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
}

function check(dir, ...args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

function editMapping(dir, page, edit) {
  const file = path.join(dir, 'requirements/mappings/page-fields', `${page}.json`);
  const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
  edit(mapping.fields);
  fs.writeFileSync(file, JSON.stringify(mapping));
}

test('shared component relationships preserve the quote entry points and menu', () => withRequirements(dir => {
  const expected = {
    home: { calculators: ['quote-calculator'] },
    eligibility: { drawers: ['member-verification'] },
    'app-header': { menus: ['app-menu'] },
    'app-menu': { calculators: ['needs-calculator'] },
  };
  for (const [component, roles] of Object.entries(expected)) {
    const file = path.join(dir, 'requirements/mappings/components', `${component}.json`);
    const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(mapping.component, component);
    for (const [role, children] of Object.entries(roles)) assert.deepEqual(mapping[role], children);
    assert.equal(Object.hasOwn(mapping, 'components'), false);
  }
  const result = check(dir);
  assert.equal(result.status, 0, result.output);
}));

test('component mappings reject unknown, duplicate and cyclic relationships', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/components/app-menu.json');
  fs.writeFileSync(file, JSON.stringify({
    component: 'app-menu',
    calculators: ['needs-calculator', 'needs-calculator', 'missing-component'],
    menus: ['app-header'],
  }));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /unknown component missing-component/);
  assert.match(result.output, /duplicate component needs-calculator/);
  assert.match(result.output, /component relationship cycle involving/);
}));

test('component mapping rejects an unknown parent and incorrect filename', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/components/app-menu.json');
  fs.writeFileSync(file, JSON.stringify({ component: 'unknown-parent', calculators: [] }));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /unknown component unknown-parent/);
  assert.match(result.output, /file name does not match the component id/);
}));

test('one mapping can hold fields and role-based relationships', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/components/eligibility.json');
  const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(Object.hasOwn(mapping, 'field-groups'), false);
  assert.deepEqual(mapping.drawers, ['member-verification']);
  assert.deepEqual(mapping.fields, [
    { field: 'membership', people: ['spouse'] },
    { field: 'first-name', people: ['spouse', 'child'] },
    { field: 'last-name', people: ['spouse', 'child'] },
    { field: 'zip-postal-code', people: ['self'] },
    { field: 'state-province', people: ['self'] },
    { field: 'birth-date', people: ['self', 'spouse', 'child'] },
    { field: 'dependents', people: ['self'] },
    { field: 'gender', people: ['child'] },
    { field: 'child-full-time-student', people: ['child'] },
  ]);
}));

test('component mapping rejects malformed optional lists and empty shape', () => withRequirements(dir => {
  const folder = path.join(dir, 'requirements/mappings/components');
  fs.writeFileSync(path.join(folder, 'home.json'), JSON.stringify({ component: 'home', calculators: null }));
  fs.writeFileSync(path.join(folder, 'membership.json'), JSON.stringify({ component: 'membership', fields: 'membership' }));
  fs.writeFileSync(path.join(folder, 'eligibility.json'), JSON.stringify({ component: 'eligibility' }));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /calculators must be an array/);
  assert.match(result.output, /fields must be an array/);
  assert.match(result.output, /mapping must contain fields or role-based relationships/);
}));

test('rejects duplicate relationships across roles and generic child lists', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/components/home.json');
  fs.writeFileSync(file, JSON.stringify({
    component: 'home',
    calculators: ['quote-calculator'],
    drawers: ['quote-calculator'],
    components: ['quote-calculator'],
    'field-groups': ['quote-calculator'],
  }));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate component quote-calculator/);
  assert.match(result.output, /unexpected property components/);
  assert.match(result.output, /unexpected property field-groups/);
}));

test('page mappings validate and print each person', () => withRequirements(dir => {
  const result = check(dir, '--page', 'coverage');
  assert.equal(result.status, 0, result.output);
  for (const person of ['self', 'spouse', 'child']) {
    assert.match(result.output, new RegExp(`coverage-amount\\s+\\S+\\s+\\S+\\s+${person}\\b`));
  }
  assert.match(result.output, /gender\s+\S+\s+\S+\s+self\b/);
  assert.match(result.output, /gender\s+\S+\s+\S+\s+spouse\b/);
}));

test('maps review, payment, resume and advisor fields', () => withRequirements(dir => {
  const expected = {
    coverage: ['rate-frequency'],
    review: ['dividend-acknowledgement', 'dividend-first-name', 'dividend-last-name', 'dividend-birth-date'],
    payment: ['payment-information-opt-in', 'payment-method', 'payment-frequency', 'payment-shared-method', 'payment-shared-frequency', 'bank-name-on-account', 'bank-institution', 'bank-routing-number', 'bank-account-number', 'bank-authorization'],
    resume: ['resume-email'],
    'resume-method': ['resume-delivery-method'],
    'resume-code': ['resume-security-code'],
    'advisor-login': ['advisor-flow-type', 'advisor-email', 'advisor-phone', 'advisor-code', 'applicant-email'],
  };
  for (const [page, fields] of Object.entries(expected)) {
    const file = path.join(dir, 'requirements/mappings/page-fields', `${page}.json`);
    const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const field of fields) {
      assert.deepEqual(mapping.fields.find(row => row.field === field), { field, people: ['self'] }, `${page}: ${field}`);
    }
  }
}));

test('component fields derive possible home and membership fields without including app-menu fields', () => withRequirements(dir => {
  const expected = {
    home: ['zip-postal-code', 'state-province', 'birth-date'],
    'needs-calculator': ['needs-annual-income', 'needs-years-to-replace', 'needs-outstanding-debts', 'needs-existing-coverage'],
    'quote-calculator': ['coverage-categories', 'zip-postal-code', 'state-province', 'birth-date', 'gender', 'smoker', 'tobacco-last-used', 'tobacco-products', 'average-monthly-income', 'hours-worked-per-week', 'actively-at-work', 'monthly-business-expenses', 'business-expense-responsibility', 'is-self-employed', 'years-self-employed', 'add-coverage', 'rider', 'rider-amount', 'coverage-amount', 'monthly-benefit-amount', 'rate-frequency'],
    membership: ['membership', 'title', 'first-name', 'last-name', 'email', 'phone', 'phone-type', 'member-id'],
  };
  for (const [component, ids] of Object.entries(expected)) {
    const file = path.join(dir, 'requirements/mappings/components', `${component}.json`);
    const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(mapping.fields.map(row => row.field), ids);
    for (const row of mapping.fields) assert.deepEqual(row.people, ['self']);
  }
  for (const page of ['home', 'membership']) {
    assert.equal(fs.existsSync(path.join(dir, 'requirements/mappings/page-fields', `${page}.json`)), false);
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    assert.doesNotMatch(result.output, /needs-annual-income/);
    if (page === 'home') {
      for (const field of ['zip-postal-code', 'state-province', 'birth-date']) {
        assert.match(result.output, new RegExp(`${field}\\s+.*self\\s+\\[home\\]`));
      }
      assert.match(result.output, /monthly-benefit-amount\s+.*self\s+\[quote-calculator\]/);
    } else {
      assert.match(result.output, /member-id\s+.*self\s+\[membership\]/);
      assert.doesNotMatch(result.output, /zip-postal-code|quote-calculator/);
    }
  }
}));

test('Eligibility derives its original field and person pairs from components', () => withRequirements(dir => {
  const expected = {
    membership: ['spouse'], 'first-name': ['spouse', 'child'], 'last-name': ['spouse', 'child'],
    'zip-postal-code': ['self'], 'state-province': ['self'], 'birth-date': ['self', 'spouse', 'child'],
    dependents: ['self'], gender: ['child'], 'child-full-time-student': ['child'], 'verification-method': ['self'],
  };
  const result = check(dir, '--page', 'eligibility');
  assert.equal(result.status, 0, result.output);
  const rows = [...result.output.matchAll(/^\s+(\S+)\s+\S+\s+(?:required|optional)\s+(\S+)\s+\[([^\]]+)\]$/gm)];
  const actual = {};
  for (const [, field, person] of rows) (actual[field] ??= []).push(person);
  for (const people of Object.values(actual)) people.sort();
  for (const people of Object.values(expected)) people.sort();
  assert.deepEqual(actual, expected);
  assert.match(result.output, /verification-method\s+.*self\s+\[member-verification\]/);
  assert.doesNotMatch(result.output, /\bsq-[123]\b/);
  assert.equal(fs.existsSync(path.join(dir, 'requirements/mappings/page-fields/eligibility.json')), false);
}));

test('component field mappings reject invalid people and unknown fields or components', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/components/home.json');
  const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
  mapping.fields[0].people.push('child');
  mapping.fields.push({ field: 'unknown-field', people: ['self'] });
  fs.writeFileSync(file, JSON.stringify(mapping));
  const other = path.join(dir, 'requirements/mappings/components/unknown.json');
  fs.writeFileSync(other, JSON.stringify({ component: 'unknown', fields: [] }));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /zip-postal-code is not available for child/);
  assert.match(result.output, /unknown field unknown-field/);
  assert.match(result.output, /unknown component unknown/);
}));

test('section mappings preserve home order and report unmapped sections separately', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/page-sections/home.json');
  const home = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(home.sections, ['hero', 'how-applying-works', 'coverage-options', 'about']);
  const result = check(dir, '--page', 'home');
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /sections\s+hero\s+how-applying-works\s+coverage-options\s+about/);
  fs.unlinkSync(path.join(dir, 'requirements/mappings/page-sections/resume.json'));
  const unmapped = check(dir, '--page', 'resume');
  assert.equal(unmapped.status, 0, unmapped.output);
  assert.match(unmapped.output, /sections not yet mapped/);
}));

test('all pages have section mappings', () => withRequirements(dir => {
  const pages = JSON.parse(fs.readFileSync(path.join(dir, 'requirements/global/pages.json'), 'utf8')).pages;
  for (const { id } of pages) {
    const file = path.join(dir, 'requirements/mappings/page-sections', `${id}.json`);
    const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(mapping.page, id);
    assert.ok(mapping.sections.length > 0, id);
  }
}));

test('payment and receipt expose their section mappings', () => withRequirements(dir => {
  for (const [page, sections] of [
    ['payment', ['opt-in', 'payment-elections', 'banking-credit-card-information']],
    ['receipt', ['confirmation', 'coverage-decisions', 'application-summary', 'client-help']],
  ]) {
    const file = path.join(dir, 'requirements/mappings/page-sections', `${page}.json`);
    const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(mapping, { page, sections });
    const result = check(dir, '--page', page);
    assert.equal(result.status, 0, result.output);
    for (const section of sections) assert.match(result.output, new RegExp(`\\b${section}\\b`));
  }
}));

test('invalid and duplicate section IDs are rejected', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/page-sections/home.json');
  const mapping = JSON.parse(fs.readFileSync(file, 'utf8'));
  mapping.sections.push('hero', 'Invalid ID');
  fs.writeFileSync(file, JSON.stringify(mapping));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate section hero/);
  assert.match(result.output, /invalid section id Invalid ID/);
}));

test('section mappings must reference the correct page and contain an array', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/mappings/page-sections/home.json');
  fs.writeFileSync(file, JSON.stringify({ page: 'missing-page', sections: 'hero' }));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /unknown page missing-page/);
  assert.match(result.output, /file name does not match the page id/);
  assert.match(result.output, /sections must be an array/);
}));

test('people must be a non-empty array', () => withRequirements(dir => {
  editMapping(dir, 'coverage', rows => { rows[0].people = []; });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /gender must have a non-empty people array/);
}));

test('duplicate people and duplicate fields are rejected', () => withRequirements(dir => {
  editMapping(dir, 'coverage', rows => {
    const coverage = rows.find(row => row.field === 'coverage-amount');
    coverage.people.push('self');
    rows.push({ ...coverage, people: ['spouse'] });
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /duplicate person self for coverage-amount/);
  assert.match(result.output, /duplicate field coverage-amount/);
}));

test('unknown or unavailable people are rejected', () => withRequirements(dir => {
  editMapping(dir, 'coverage', rows => {
    rows.find(row => row.field === 'coverage-amount').people.push('unknown');
    rows.find(row => row.field === 'rider').people.push('child');
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /unknown person unknown/);
  assert.match(result.output, /rider is not available for child/);
}));

test('legacy placement properties and unknown fields are rejected', () => withRequirements(dir => {
  editMapping(dir, 'coverage', rows => {
    rows[0].section = 'self-personal';
    rows.push({ field: 'unknown-field', people: ['self'] });
  });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /gender has unexpected property section/);
  assert.match(result.output, /unknown field unknown-field/);
}));

test('change log entries are numbered in order with only a description and reason', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/changelog.json');
  const log = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(log.changes.length >= 6);
  assert.equal(check(dir).status, 0);
  log.changes[1].id = 'CHG-009';
  log.changes[2].reason = ' ';
  log.changes[3].date = '2026-11-06';
  fs.writeFileSync(file, JSON.stringify(log));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /entry 2 must have id CHG-002/);
  assert.match(result.output, /CHG-003 needs a reason/);
  assert.match(result.output, /CHG-004 has unexpected property date/);
}));

test('choice fields must name their options or an option source', () => withRequirements(dir => {
  const file = path.join(dir, 'requirements/parked/field-details.json');
  const document = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete document.fields.find(field => field.id === 'monthly-benefit-amount').options;
  fs.writeFileSync(file, JSON.stringify(document));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /monthly-benefit-amount is a dropdown with no options or option source/);
}));

test('formula records declare authority, a known type and valid values', () => withRequirements(dir => {
  editRequirement(dir, 'formulas', 'pricing', document => {
    document.formulas[0].authority = 'guess';
    document.formulas[1].type = 'surcharge';
    document.formulas[2].extra = true;
  });
  editRequirementMapping(dir, 'coverage', mapping => { mapping.formulas.push('missing-formula'); });
  const result = check(dir);
  assert.notEqual(result.status, 0);
  for (const message of [/authority must be mock or requirement/, /Expected one rider-factor formula/, /unknown formula type surcharge/,
    /unexpected property extra/, /unknown formulas reference missing-formula/]) {
    assert.match(result.output, message);
  }
}));
