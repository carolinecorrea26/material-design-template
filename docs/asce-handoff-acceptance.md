# ASCE handoff acceptance record

Date: **2026-10-05**. Disposition: **READY FOR TEAM DEVELOPMENT / TESTING — LOCAL MOCK SCOPE**.

This is engineering acceptance evidence, not a carrier, legal or business sign-off. Production release remains gated. Exact forms/consents, authoritative rates, CIR/document reconciliation and the 20-Year 121/102 discrepancy remain assigned follow-ups. Real PRASE is excluded.

## Results

| Requirement | Evidence/result | Status |
|---|---|---|
| Member Life, spouse Life, child Life, member DI and spouse DI through Review, payment, mock submission | One combined household journey carried all five elections through Review and receipt. Term Life $10,000 each; DI member $150/30-days/5-years, spouse $500/30-days/2-years. Mock receipt `MOCK-f08bc3f5-5410-4ecc-b14e-236aa4db8159`. | PASS, witnessed browser |
| Declined and approved payment | Declined fixture blocked Next; approved fixture authorized all entries and recorded a mock submission. Bill me/Monthly choices remained selected. Total synthetic estimate $9.50 ($7.50 Life + $2 DI). | PASS, witnessed browser |
| Eligibility, exclusion and dependent boundaries | Browser: DI day before 17 excluded; exactly 17 offered; 29 work hours excluded and Next blocked; 30 hours plus 0.5 self-employed years capped $1,050 with locked 90-days/5-years; child Life and spouse DI member dependencies observed. Expanded age/income/jurisdiction/child/underwriting matrix is automated. | PASS with browser/automated evidence distinguished |
| Save/resume | Request displayed a mock email confirmation; simulated resume-method route and Text choice; 000000 rejected, 123456 accepted; same-tab DOB 10/05/2009, 30 hours, $5,000, Yes/0.5 years and $1,050/90-days/5-years retained. Revisited Coverage verified the selection and synthetic estimate. | PASS for same-tab mock scope |
| Persisted ASCE Library field, pricing and billing edits | Isolated authenticated mock-server test saved birth-date label, homepage/coverage rate presentation and Bill me fee; reload and process restart retained hash/draft id and runtime results ($4.50 monthly for $10,000 Life with $2 fee). Another Site's revision, published head and source catalog databases stayed unchanged. | PASS, integration |
| Live Library editor save/reload demonstration | Existing account sign-in/TOTP required; user explicitly replied “skip sign in for now.” Authentication was preserved and no shared credentials were changed. | DEFERRED BY USER; ASCE-10 |
| Handoff package and backlog | Startup, browser scenarios/expected results, Library editing, contracts, limitations, acceptance, role owners and exit criteria linked from README. | COMPLETE |

Browser artifacts: [household receipt](asce-handoff-evidence/receipt.jpg), [receipt DOM](asce-handoff-evidence/receipt.txt), [resumed DI](asce-handoff-evidence/resumed-di.jpg), [resumed DI DOM](asce-handoff-evidence/resumed-di.txt). These are synthetic test fixtures. The receipt's member/spouse/child decisions are demo outcomes, not live underwriting results.

## Resolved handoff blockers

- Payment form restored itself on fixture-status rerenders, losing billing choices. Route form restoration now reads the current callback without rerunning solely because callback identity changed.
- Drawer and payment totals used different legacy premiums. They now resolve current Library synthetic rates and current watched billing choices.
- Child pricing omitted collection DOB/gender, and membership used an obsolete key. Current applicant facts now supply both.
- Short self-employment periods mixed legacy `90`/`five-year` values with normalized `90-days`/`5-years`. Normalized Library required periods now drive selection and validation.
- Submission lacked a concrete service record. It now requires matching approved fixture authorizations, persists a minimal mock record and shows its confirmation on receipt. Wrong/declined/duplicate/extra-field requests are rejected; identical replay persists across restart.
- Resume replaced saved identity with a sample returning applicant and accepted arbitrary codes. Existing values are preserved; wrong/expired codes are rejected.
- Numeric fields lost their accessible labels when their input props were overridden. Number inputs now carry their field labels; the resumed self-employment input exposes its name.
- Receipt implied usable PDFs and live decisions. Mock PDFs are disabled, decisions labeled simulated, and follow-up copy identifies pending document generation.

No crash remained in the exercised household, restricted DI or resume paths. This does not establish acceptance of every advanced branch.

## Verification

`npm run build`: PASS, TypeScript and Vite. Large generated catalog bundle warning remains (ASCE-11).

`npm run lint`: PASS.

Full ordinary suite (`--maxWorkers=1`): **932 passed, 4 failed, 4 skipped** out of 940 tests. Three failures were five-second timeouts in Library navigation/active Site adoption; those same assertions passed focused rerun with `--testTimeout=15000` (52 navigation and 9 adoption tests passed). The fourth was an ABE compatibility fixture incorrectly assuming monthly Bill me availability; the test now selects that Site's configured frequency. Both ABE and ASCE cutover tests passed after correction. These are follow-up runs, not a claim of a second complete green suite.

Final combined domain/Library/service regression: **86/86 passed across six test files** with the corrected compatibility fixture and 15-second execution budget. Earlier focused run: 85 passed with the now-corrected cutover fixture failure; separate final cutover rerun 2/2 passed. Final mock-service rerun 7/7 passed, including persisted submission replay after restart. Domain prototype Library 13/13 and Library draft 3/3 passed. The full suite included the 31-case coverage runtime integration matrix and 75 ASCE requirement tests. Four PostgreSQL-only tests were not run in this local scope.

Text logs copied to `asce-handoff-evidence/` (including [final combined regression](asce-handoff-evidence/focused-final.txt)) preserve the complete-suite result and final focused/build/lint results. No shared Library sign-in or catalog mutation was used to obtain isolated persistence evidence.

## Remaining owners and acceptance boundary

| Remaining work | Accountable owner | Effect on handoff |
|---|---|---|
| Exact forms, consents and state documents | Product owner + Legal/Compliance | Blocks production/form acceptance; ASCE-01/06 |
| Authoritative rates and billing verification | Rating/Actuarial | Synthetic amounts only; ASCE-02 |
| CIR rider/document crosswalk; 20-Year code 121/102 | Product owner + Document operations/Actuarial | Reconciliation pending; ASCE-03/04 |
| QD/FUW questionnaires, signatures, PDFs | Underwriting + Integration engineering | Placeholder advanced journey; ASCE-05/06 |
| Durable/cross-device resume and notifications | Platform engineering | Same-tab fixture only; ASCE-07 |
| In-force increases, primary-policy references, rider-only and multiple-child pricing | Coverage/Rating engineering | Advanced flows incomplete; ASCE-08/09 |
| Live Library UI demonstration | QA + Library administrator | Deferred by user's sign-in choice; ASCE-10 |
| Large bundle/slow setup and release hardening | Frontend + QA/Platform | ASCE-11/12; production gate remains |

Team development/testing can begin against the documented mock behavior, with the deferred live Library demonstration recorded as an explicit exception. The team should assign named individuals to these role owners at intake; no human sign-off is fabricated by this record.

## Follow-up engineering verification, October 5

The [execution register](asce-follow-up-execution.md) tracks all twelve follow-ups and their missing inputs. The browser migration-compiler dependency was removed from aggregate inspection, and ordinary test worker/time budgets are committed. Mock submission now checks current Library/quote revision, quote expiry, supplied applicant and previously used payment IDs. Saved payload revisions are cached without carrying a stale revision across a save.

Final complete ordinary suite: **958 passed, 4 PostgreSQL-only skipped, zero failures** across 90 files, with approved localhost-port access. Build and lint pass. The remaining application/catalog chunks still generate a size warning. This extends engineering evidence; it does not close source-dependent forms/rates/CIR/code decisions, durable applicant recovery, advanced browser journeys, live sign-in demonstration or production readiness.
