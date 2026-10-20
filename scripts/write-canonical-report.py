"""Generate Phase 4B accounting and a reviewable blocker inventory from migration export."""
import collections
import json
import pathlib
import sys

root = pathlib.Path('.')
directory = pathlib.Path(sys.argv[1])
report = json.loads((directory / 'mcr-coverage.json').read_text())
db = json.loads((directory / 'database.json').read_text())
counts = report['counts']
blocking = ['UNMAPPED_SEMANTIC', 'PARSER_GAP', 'MODEL_GAP', 'IDENTITY_CONFLICT']
unknowns = ['SOURCE_TBD', 'SOURCE_CONFLICT', 'REQUIRES_CLIENT_CONFIRMATION', 'REQUIRES_AM_CONFIRMATION', 'REQUIRES_UW_CONFIRMATION', 'REQUIRES_CONTRACTS_CONFIRMATION', 'REQUIRES_COMPLIANCE_CONFIRMATION', 'IMAGE_REVIEW_REQUIRED']
lines = ['# Phase 4B canonical MCR inventory', '',
         '**Phase 4B is incomplete.** `phase5Ready: ' + str(report['phase5Ready']).lower() + '`.', '',
         'Counts are source evidence records, not counts of executable business rules. One evidence cell can support several facts; several cells can support one fact. MAPPED alone is not a claim of site behavior equivalence for non-prototype clients.', '',
         '## Before and after', '', '| Classification | Before | After |', '|---|---:|---:|',
         f"| MAPPED | 6,634 | {counts['MAPPED']:,} |", f"| INTENTIONALLY_EXCLUDED | 19,462 | {counts['INTENTIONALLY_EXCLUDED']:,} |",
         '| Generic UNRESOLVED | 19,224 | 0 |']
for category in counts:
    if category not in ['MAPPED', 'INTENTIONALLY_EXCLUDED']:
        lines.append(f'| {category} | Not distinguished | {counts[category]:,} |')
lines += ['', 'The before snapshot is the previous archived validation report. Replacing UNRESOLVED with explicit categories does not resolve the underlying requirements.', '',
          f"Blocking evidence records: **{report['blockingCount']:,}**. Integrity errors: **{len(report['integrityErrors'])}**.", '',
          f"Workbook SHA-256: `{report['workbookSha256']}`", '', f"Checklist SHA-256: `{report['checklistSha256']}`", '',
          '## Every sheet', '', '| Sheet | Source cells | Mapped | Excluded / reference | Semantic gaps | Parser gaps | Model gaps | Identity conflicts | Source TBD | Source conflict | Confirmations | Images |',
          '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|']
for s in report['sheets']:
    values = [s['sourceCells'], s['MAPPED'], s['INTENTIONALLY_EXCLUDED'] + s['NON_FUNCTIONAL_OR_REFERENCE']] + [s[k] for k in blocking] + [s['SOURCE_TBD'], s['SOURCE_CONFLICT'], sum(v for k, v in s.items() if k.startswith('REQUIRES_')), s['IMAGE_REVIEW_REQUIRED']]
    lines.append('| ' + s['sheet'].strip() + ' | ' + ' | '.join(map(str, values)) + ' |')
lines += ['', 'All individual categories by sheet are available in [mcr-coverage.json](mcr-coverage.json). Source totals additionally include checklist-only cells and embedded-image records.', '',
          '## Typed semantic facts by domain', '', '| Domain | Facts |', '|---|---:|']
for domain, count in sorted(report['semanticDomains'].items()): lines.append(f'| {domain} | {count} |')
lines += ['', 'These facts supplement existing amount rules, bands, products, plans, questions, URLs, and relationships. Their counts are deliberately not added to source-cell counts.', '',
          '## Identity reconciliation', '', '| Strategy | Overlay rows |', '|---|---:|']
for strategy, count in report['identity'].items(): lines.append(f'| {strategy} | {count} |')
lines += ['', 'All candidate keys and matching explanations are in [canonical-identity-review.json](canonical-identity-review.json). URL owner conflicts are additional source-ledger blockers. QD identity resolution does not create base products or runnable Sites.', '',
          '## Remaining engineering blockers by sheet', '', 'The examples below are work still needed, not stakeholder TBDs. The machine-readable report includes **every** blocking cell, category, source reference, and explanation.', '',
          '| Sheet | Category | Count | Examples |', '|---|---|---:|---|']
by_sheet = collections.defaultdict(list)
for r in db['sourceRequirements']:
    if r['classification'] in blocking: by_sheet[(r['sheetKey'], r['classification'])].append(r)
for (sheet, category), rows in sorted(by_sheet.items()):
    examples = '; '.join(f"{r['cell']}: {str(r['value'])[:100].replace(chr(10), ' ').replace('|', '/')}" for r in rows[:3])
    lines.append(f'| {sheet} | {category} | {len(rows)} | {examples} |')
lines += ['', '## True source unknowns and stakeholder review', '', '| Category | Reference | Reason |', '|---|---|---|']
for r in db['sourceRequirements']:
    if r['classification'] in unknowns:
        lines.append(f"| {r['classification']} | {r['sheetKey']}!{r['cell']} | {r['reason'].replace('|', '/').replace(chr(10), ' ')} |")
lines += ['', '## Canonical table inventory', '', '| Table | Rows |', '|---|---:|']
for table, rows in db.items(): lines.append(f'| {table} | {len(rows)} |')
(root / 'docs/canonical-mcr-inventory.md').write_text('\n'.join(lines) + '\n')
(root / 'docs/mcr-coverage.json').write_text(json.dumps(report, indent=2) + '\n')
(root / 'docs/canonical-identity-review.json').write_text(json.dumps(db['identityResolutions'], indent=2) + '\n')
print(json.dumps({'counts': counts, 'blockingCount': report['blockingCount'], 'phase5Ready': report['phase5Ready']}))
