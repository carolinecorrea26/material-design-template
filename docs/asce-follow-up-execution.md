# ASCE follow-up execution

October 8, 2026. This register reflects the user’s clarified prototype scope and supersedes the earlier production-oriented requirements. The MCR is the authority for ASCE configuration, with the six previously approved age/FUW decisions retained. The new template collects application data; external application forms, actual rates, real verification services and document/signature providers are not required.

| ID | Required prototype work | Status |
|---|---|---|
| ASCE-01 | Compare the effective ASCE template’s products, fields, rules and notices directly with MCR cells. | [MCR comparison](asce-mcr-template-check.md) records checked settings and corrected mismatches. Complete page-by-page comparison remains. No additional application forms requested. |
| ASCE-02 | Use synthetic mock rates consistently. | Real rates and rate services excluded; no source request remains. |
| ASCE-03 | Match CIR amounts, increments, eligibility, limits to MCR Main row 167 and Riders row 43. CIR is a normal rider only; the CIR-only election was removed by an ASCE update (CHG-007). Use provided health wording where MCR assigns it. | Engineering parity work only. “Crosswalk” meant mapping MCR values to template settings; no additional business packet is required. |
| ASCE-04 | Use the MCR plan code. | Resolved: Main!G166 specifies 121 for 20-Year Term. No further decision needed. |
| ASCE-05 | Retain QD loading/iframe placeholder. Render other applicable health forms according to MCR and supplied health catalog. | QD questions/decisions excluded. Supplementary and other health mapping remains a template comparison task. |
| ASCE-06 | Download PDFs of collected application data using the Review preview’s sections. QD data remains blank. | Application-data PDF downloads implemented on Review and Receipt, with payment-data download and blank QD history. Browser download and three-page rendering verified; external documents/signatures excluded. |
| ASCE-07 | Finish durable local mock save/resume. | Separate persistent applicant store and expiring links/codes implemented; automated and fresh-tab browser checks pass. See [contract](applicant-save-resume.md). Real notification delivery is not a requirement. |
| ASCE-08 | Collect existing-coverage facts as defined in the application. | Real-time policy lookup, insurer checking and additional service journeys excluded. |
| ASCE-09 | Collect children, enforce MCR child eligibility and disable mutually exclusive child coverage after selection. | Existing eligibility/maximum-plan rules retained. Corrected child Life to bypass adult QD according to MCR No-medical-underwriting values. No additional per-child pricing model requested. |
| ASCE-10 | Turn off account sign-in until the user asks to restore it. | Local development server disables account sign-in; existing credentials are preserved. The preview was restarted and browser access verified. |
| ASCE-11 | Keep builds reliable and improve maintainability when useful. | Performance/refactoring work is supporting engineering, not an ASCE business prerequisite. |
| ASCE-12 | Keep the local application internally consistent. | Production release/security/integration checklists excluded from this prototype backlog. Existing mock regression checks remain. |

## Verification recorded in this increment

Save/resume tests cover persisted household/coverage/billing restoration after restart, application/Site/recipient isolation, expiry, revoked/replayed links, incorrect codes and attempt limits, rotated write capabilities, revision changes and failed writes. The browser exercise used synthetic ASCE member Avery Mock: saved Membership, requested a local link, opened it in a fresh tab, rejected an incorrect code and recovered the correct Membership values. No unrelated sample household or administrator sign-in was used.

The supplied global health catalog is preserved byte-for-byte and divided into 18 source sections. [Health migration comparison](global-health-form-migration.md) records current defaults and missing variants/follow-ups. MCR assignments determine which of those are relevant to ASCE; absence of ASCE in the attachment’s summary table does not negate the MCR.

Historical full-suite evidence and prior implementation records remain in the handoff documents. They describe earlier states and should not be read as requests for additional sources under the clarified scope.

Final verification for this increment: full ordinary suite **1,017 passed, four PostgreSQL-only skipped, zero failures** (104 passing files). Build, lint, scope-audit check and regenerated adoption-review check pass. Browser recovery and application-data PDF download/render checks pass. Large application/catalog chunk warnings remain supporting refactoring work.
