# ASCE team handoff

Status: **Ready for team development and testing in the local mock prototype**, 2026-10-05. This status does not authorize insurer submission, production publication or rate use. Real PRASE is excluded.

Start with [acceptance and owners](asce-handoff-acceptance.md), [follow-up backlog](asce-follow-up-backlog.md), and [mock contracts](asce-mock-service-contracts.md). Existing approved rules remain in [ASCE business decisions](../asce-business-decisions.md); older parity notes are historical, not a replacement for those decisions.

## Startup

Verified runtime: Node 24.21.0 and npm 11.19.0. Use the repository lockfile. Install dependencies with `npm ci` if absent, then run:

```sh
npm run mock:dev
```

This generates reviewed mock data, starts Vite on `http://127.0.0.1:5180` and the mock API on port 8787. Open `http://127.0.0.1:5180/?site=asce-default`. `?client=asce` is also supported; `?site=asce` is not the canonical Site key. Stop with Ctrl-C. Keep both ports free. `npm run dev:catalog` is a separate catalog mode and does not demonstrate persisted Library cutover.

Server drafts, fixture payments and submissions persist in `.mock-platform/server-state.json`. Applicant data remains in this browser tab's session storage. Preserve that file and tab when verifying reload/restart. Do not reset shared state to run acceptance: integration tests create isolated temporary stores.

```sh
npm run build
npm run lint
npm test -- --maxWorkers=1 --testTimeout=15000
```

Tests that bind localhost require local socket access. Four PostgreSQL tests require their separate configured database and are skipped in the ordinary local suite. Build currently reports large generated catalog chunks; performance optimization remains open.

## Browser scenarios and expected results

Use synthetic people and payment fixtures. Ages below are evaluated on the test date; adjust DOB to maintain the boundary on later dates.

| Scenario | Inputs/actions | Expected result |
|---|---|---|
| Household Life + DI | Member 40, spouse 38, child 10/unmarried/not student, NY, member and spouse work 30 hours, income $10,000/$5,000, not self-employed | Select `li-term` $10,000 for each; `di-ltd` member $150 with 30-days/5-years, spouse $500 with 30-days/2-years. Five elections survive Review, payment and receipt. |
| Details and Review | Fill beneficiaries totaling 100%, contact/employer, profiles and the displayed required answers; accept both displayed mock Review consents | Required fields block incomplete pages. Review identifies applicants, amounts and DI periods. Exact legal forms and full medical questionnaires remain pending. |
| Declined payment | Bill me/Monthly, use declined fixture, then Next | Declined status; submission blocked. No funds move. |
| Approved payment | Use approved fixture, then Next and continue the signature placeholder | Recorded `MOCK-…` receipt with five elections; PDFs disabled and decisions explicitly simulated. No insurer submission or real signature. |
| DI age | Day before 17th birthday, then exactly 17 | First is excluded; second can select benefits after work/income/self-employment answers. |
| DI work | 29 then 30 hours/week | 29 excluded and Next blocked; 30 meets work boundary. |
| Short self-employment | 30 hours, income $5,000, self-employed Yes, 0.5 years | Maximum $1,050; 90-days and 5-years are locked. A valid selection continues. |
| Other canonical boundaries | DI ages 65–69/70, income cap, spouse age 59/60 and NH, child 14 days and 22/24 student bounds; ten-/twenty-year underwriting bands | Run domain/integration matrix; exclusions and unresolved bands fail closed. These cases were covered by automated tests, not all manually witnessed in this browser run. |
| Dependent selection | Select child Life or spouse DI before member coverage | Dependency prevents positive dependent coverage. Child maximum one Life plan; banded child Life without a supported band stays unavailable. |
| Save/reload/resume | Save valid DI choice; reload same tab; request mock email link; visit resume-method, choose SMS, reject 000000, accept 123456 | Existing identity, DOB, work answers and selected $1,050/90-days/5-years remain. Cross-device recovery and real identity verification are pending. |
| Library control | Follow instructions below using an authorized mock admin | New label and pricing/billing configuration appear after applicant reload. Catalog files and other Sites remain unchanged. |

The browser household fixture was Taylor Acceptance, spouse Morgan Acceptance and child Casey Acceptance; email `asce.acceptance@example.invalid`, phone `2025550123`, fake SSN `000001234`. Never use real personal or payment information in this prototype.

## Library editing

Open Admin Center → Site Builder. Sign in with the existing mock admin account and TOTP; credentials do not belong in docs or chat. Select Existing Site `asce-default`, then **Draft persisted Library** (not a newly proposed Site). Resume/edit the existing draft where appropriate.

Choose the Eligibility page. Change the birth-date label to `ASCE acceptance DOB` and optionally its Required setting; validate the preview. Choose Pricing product `li-term`; toggle Homepage quote tool or Coverage estimates. The legacy label “Rates configured in PRASE” controls mock rate presentation only in this runtime and does not connect to PRASE. Set Bill me fee per collection to `2`, then **Save Library draft** and wait for success. Reload the applicant prototype: the field label/validation, estimate visibility and fee must reflect the saved revision. With the standard $10,000 Term Life synthetic monthly base $2.50, Bill me monthly becomes $4.50 with a $2 fee. Restore the baseline in Library and save when the demonstration is done.

Edits create Site-scoped configuration values. They do not require edits to field/product/rate catalogs. Save updates the prototype draft; production release heads remain gated. A version conflict means another save won: reopen the current draft and reapply the intended change. Do not force an old version over it.

The user deferred live admin sign-in for this handoff. Authenticated save → reload → process restart → resolved field, pricing and billing behavior was instead checked against an isolated ASCE mock server. The live UI save demonstration remains a named team follow-up.

## Implementation handoff

Applicant pricing and the coverage drawer now use the same Library-backed synthetic rate resolver, including child DOB/gender and membership. Required DI periods use normalized policy identifiers. Payment authorization no longer resets current form choices; only approved authorizations for the current elections may submit. Mock submission records persist and receipts show the actual mock confirmation. Resume preserves existing saved values and rejects wrong/expired fixture codes. Numeric fields expose their accessible labels.

Advanced flows remain incomplete: actual QuickDecision/FUW questionnaires and decisions, DocuSign/signature evidence, exact PDFs and state forms, server-side durable applicant resume and notifications, multiple-child individual pricing, in-force increase/primary policy lookup, rider-only/CIR reconciliation, and production release acceptance. See the backlog for owners and exit criteria.
