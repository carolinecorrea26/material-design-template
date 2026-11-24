# Pages

The global template defines 28 application, recovery and advisor pages in [the page inventory](../../requirements/global/pages.json). Page structure lives in `requirements/parked/<page>.json`; defaults are in `requirements/parked/pages.json`. Effective assignments and overrides live in `requirements/parked/sites/<site>/pages/`. ASCE is the first effective Site; this inventory does not enable other real Sites.

Page requirements are `required`, `optional` or `none`. The effective Site inherits global defaults and overrides only what differs. ASCE beneficiaries are optional. For Health, ASCE enables only QD; SI, TELE, DI SUPP and CIR remain disabled. See [the Health contract](../project-review/health-component-review.md).

## Application (the breadcrumbs, grouped into steps)

| Step | Page | Path | Description |
|---|---|---|---|
| | Home | `/` | Starts a new application, opens Quote, or resumes a saved application. |
| **Getting started** | Membership | `/membership` | Collects membership status and applicant contact details. Creates the application record and starts autosave. |
| | Eligibility | `/eligibility` | Collects ZIP/postal code, state, date of birth, dependent selection and eligibility responses. |
| **Choose your coverage** | Coverage | `/coverage` | Collects eligible applicants, products, amounts, riders and estimated premiums. |
| **Your application details** | Beneficiary | `/beneficiary` | Collects beneficiary designations for the selected coverage. |
| | Contact | `/contact` | Collects applicant, mailing, business and spouse contact information. |
| | Profile | `/profile` | Collects personal, employment, financial, existing-coverage, travel, residence and spouse information. |
| **Review your application** | Review | `/review` | Summarizes the application and collects the required consents and acknowledgements. |
| | Health: Simplified Issue | `/health-si` | Asks the Simplified Issue health questions for each covered applicant. |
| | Health TELE | `/health-tele` | Resolves LI/DI/CI telesupplement questions for each participating adult. |
| | Health: QuickDecision | `/health-qd` | Displays the configured external QD image handoff in the prototype. |
| | Health DI SUPP | `/health-di-supp` | Collects the explicitly assigned supplemental disability questionnaire. |
| | Health: Chronic Illness Rider | `/health-cir` | Asks the chronic illness rider health questions for each covered applicant. |
| | Payment | `/payment` | Collects payment elections and banking details. |
| **E-sign and submit** | E-signature | `/docusign` | Completes the electronic-signature process. |
| | Receipt | `/receipt` | Confirms the submission and shows decision information and next steps. |

The five Health types share the "Health" breadcrumb. Each type has one page for self/spouse with independent answers; there are no separate person routes. CI is a TELE questionnaire variant. In `pages.json`, an
application page that belongs to a step has a `step`; every other page has an `area`.

## Resume

| Page | Path | Description |
|---|---|---|
| Resume | `/resume` | Applicant enters the application email address to resume a saved application. |
| Resume: Delivery Method | `/resume-method` | Applicant chooses Text or Call to receive a verification code. |
| Resume: Verification Code | `/resume-code` | Applicant enters the verification code. The saved application loads and returns to Eligibility. |

## Advisor

| Page | Path | Description |
|---|---|---|
| Advisor Login | `/advisor-login` | Advisor starts a new application or continues a saved one. |
| Advisor Send Confirmation | `/advisor-send-confirmation` | Confirms the application was sent to the applicant, showing the applicant email, send time and purge date. The advisor can start a new application. |
| Application Edit Confirmation | `/application-edit-confirmation` | Confirms the edit request was sent to the advisor. The application lock returns to the advisor and applicant access ends. |

## Errors

| Page | Path | Description |
|---|---|---|
| Bad Request | `/400` | The requested page encountered a technical issue. |
| Server Error | `/500` | The requested page encountered a technical issue. |
| Page Not Found | `/404` | The requested address does not exist. |
| Technical Error | `/technical-error` | A system fault interrupted the application. |
| Maintenance | `/maintenance` | The portal is temporarily unavailable for maintenance. |
| Session Expired | `/session-expired` | The applicant's session timed out. |

Admin Center and internal pages are not part of the site requirements.
