# Pages

ASCE has 29 pages. Data: [requirements/global/pages.json](../../requirements/global/pages.json),
a plain list. Each page's detail (sections, fields, content) is in its own file under
`requirements/global/pages/`; Membership is the first
([membership.md](membership.md)).

## Page requirement (the default)

Each page states how it is treated by default:

| Requirement | Meaning |
|---|---|
| **required** | The page is part of the application and must be completed. |
| **optional** | The page is shown, but the applicant may skip it. |
| **none** | The page is not used. |

Every page is **required** except **Health: Critical Illness**, which is **none** by default
(nine of the ten current sites do not use it). A site only overrides what differs, in
[sites/asce/pages.json](../../requirements/sites/asce/pages.json):

```json
{ "pages": { "beneficiary": { "requirement": "optional" } } }
```

**ASCE has no page overrides.** It uses every default. Checked against all ten current sites,
the only site that needs overrides is ABE (five: Beneficiary and Payment optional, Simplified
Issue and Chronic Illness Rider none, Critical Illness required).

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
| | Health: Life | `/health-li` | Asks the life insurance health questions for each covered applicant. |
| | Health: QuickDecision | `/health-qd` | Loads the externally hosted QuickDecision underwriting questions. |
| | Health: Disability | `/health-di` | Asks the disability insurance health questions for each covered applicant. |
| | Health: Critical Illness | `/health-ci` | Asks the critical illness health questions for each covered applicant. |
| | Health: Chronic Illness Rider | `/health-cir` | Asks the chronic illness rider health questions for each covered applicant. |
| | Payment | `/payment` | Collects payment elections and banking details. |
| **E-sign and submit** | E-signature | `/docusign` | Completes the electronic-signature process. |
| | Receipt | `/receipt` | Confirms the submission and shows decision information and next steps. |

The six Health pages are separate pages shown as one "Health" breadcrumb. In `pages.json`, an
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
| Page Not Found | `/404` | The requested address does not exist. |
| Application Unavailable | `/application-unavailable` | The saved application cannot be opened: it was submitted, expired or removed, or it is in use by another person. |
| Technical Error | `/technical-error` | A system fault interrupted the application. |
| Maintenance | `/maintenance` | The portal is temporarily unavailable for maintenance. |
| Session Expired | `/session-expired` | The applicant's session timed out. |
| Unconfirmed Result | `/unconfirmed-result` | A payment or submission was sent but its result could not be confirmed. The applicant must not resubmit. |

Admin Center and internal pages are not part of the site requirements.
