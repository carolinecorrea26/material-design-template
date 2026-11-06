# Components

> **Parked draft.** We are working page by page first (see [membership.md](membership.md)).
> This list is a starting point only. Each page's sections will live in its own page file,
> `requirements/global/pages/<page>.json`, so the section lists below will move there.

Data: [components.json](../../requirements/global/components.json) (frame and section
definitions, draft).

The structure is **frame → pages → sections**:

- **Application frame**: components that wrap every page.
- **Pages**: each page, with its description and the sections it is made of.
- **Sections**: the components that make up a page. Each is described once.

The 73 smaller shared pieces (Button, Link, FieldRenderer, AppModal, DynamicList, cards,
alerts and so on) are the design system. They stay in Storybook and are not listed here.

## 1. Application frame (on every page)

| Component | What it does |
|---|---|
| AppShell | Chooses which header, menu and footer a page shows (application form, advisor, error). |
| AppHeader | Brand, help actions, application menu, cart and the step bar. |
| AppMenu | Application navigation and informational drawers. |
| AppBody | Main content container with responsive spacing. |
| AppFooter | Administrator, insurer, support and legal details. |
| ClientHelpBanner | Client phone, chat and other support actions. |
| OfflineBanner | Connection notice shown above the header. |
| ProgressStep | The steps and the breadcrumbs within the current step. |
| FormRoutePage | Wraps each consumer form page: title, steps, breadcrumbs, back, help, validation, saving and Next. |
| FormShell | The visual surface a form sits on. |
| PageShell | Shared page container and layout. |
| PageHeader | Page title, supporting copy, back action and contextual help. |
| PageTitle | Page heading, subtitle and supporting actions. |
| PageNav | The page's Next or Submit action. |

## 2. Pages and their sections

| Step | Page | What the page is | Sections |
|---|---|---|---|
| | Home | Starts a new application, opens Quote, or resumes a saved application. | HomeHero, AssociationIntroduction, HomeCoverageSection, UnderwriterCredentials |
| **Getting started** | Membership | Collects membership status and applicant contact details. Creates the application record and starts autosave. | MembershipStatus, MemberInformation, AdditionalMembershipInformation, MembershipHelp |
| | Eligibility | Collects ZIP/postal code, state, date of birth, dependent selection and eligibility responses. | EligibilitySections |
| **Choose your coverage** | Coverage | Collects eligible applicants, products, amounts, riders and estimated premiums. | CoverageQuestions, ProductCatalog |
| **Your application details** | Beneficiary | Collects beneficiary designations for the selected coverage. | BeneficiaryProductRecords |
| | Contact | Collects applicant, mailing, business and spouse contact information. | ContactSections, ResidentialAddress, BusinessInformation, SpouseContact |
| | Profile | Collects personal, employment, financial, existing-coverage, travel, residence and spouse information. | ProfileSections |
| **Review your application** | Review | Summarizes the application and collects the required consents and acknowledgements. | ReviewSections |
| | Health: Simplified Issue | Asks the Simplified Issue health questions for each covered applicant. | HealthInformationHelp, HealthQuestionList |
| | Health: Life | Asks the life insurance health questions for each covered applicant. | HealthInformationHelp, HealthQuestionList |
| | Health: QuickDecision | Loads the externally hosted QuickDecision underwriting questions. | HealthInformationHelp, ProcessingStatusPage |
| | Health: Disability | Asks the disability insurance health questions for each covered applicant. | HealthInformationHelp, HealthQuestionList |
| | Health: Critical Illness | Asks the critical illness health questions for each covered applicant. | HealthInformationHelp, HealthQuestionList |
| | Health: Chronic Illness Rider | Asks the chronic illness rider health questions for each covered applicant. | HealthInformationHelp, HealthQuestionList |
| | Payment | Collects payment elections and banking details. | PaymentSections |
| **E-sign and submit** | E-signature | Completes the electronic-signature process. | ESignInstructions, ProcessingStatusPage |
| | Receipt | Confirms the submission and shows decision information and next steps. | ReceiptConfirmation, ReceiptDecisions, ReceiptApplicationSummary, ReceiptNextSteps |
| Resume | Resume | Applicant enters the application email address to resume a saved application. | ResumeEmailRequest, ExpiringCodeAlert, ResendCountdownRow |
| | Resume: Delivery Method | Applicant chooses Text or Call to receive a verification code. | ResumeDeliveryMethod |
| | Resume: Verification Code | Applicant enters the verification code. The saved application loads and returns to Eligibility. | ResumeCodeEntry, ExpiringCodeAlert, ResendCountdownRow |
| Advisor | Advisor Login | Advisor starts a new application or continues a saved one. | AdvisorLoginTabs |
| | Advisor Send Confirmation | Confirms the application was sent to the applicant, showing the applicant email, send time and purge date. The advisor can start a new application. | ConfirmationAlert, DetailsTable |
| | Application Edit Confirmation | Confirms the edit request was sent to the advisor. The application lock returns to the advisor and applicant access ends. | ConfirmationAlert, DetailsTable |
| Errors | Page Not Found | The requested address does not exist. | ApplicationErrorState |
| | Application Unavailable | The saved application cannot be opened: it was submitted, expired or removed, or it is in use by another person. | ApplicationErrorState |
| | Technical Error | A system fault interrupted the application. | ApplicationErrorState |
| | Maintenance | The portal is temporarily unavailable for maintenance. | ApplicationErrorState |
| | Session Expired | The applicant's session timed out. | ApplicationErrorState |
| | Unconfirmed Result | A payment or submission was sent but its result could not be confirmed. The applicant must not resubmit. | ApplicationErrorState |

## 3. Sections

| Section | What it shows |
|---|---|
| HomeHero | Introduction, start and resume actions, with a quote card or association image. |
| AssociationIntroduction | Association logo, tagline and introductory paragraphs. |
| HomeCoverageSection | Coverage heading, description, category choices and product information. |
| UnderwriterCredentials | Insurer logo, name, ratings, description and footnote. |
| MembershipStatus | The membership question, with its link, eligibility and non-member feedback. |
| MemberInformation | Applicant name, email and phone, collected once membership is confirmed. |
| AdditionalMembershipInformation | Conditional membership follow-up questions. |
| MembershipHelp | Coverage, applying and estimate help actions. |
| EligibilitySections | Personal information, covered applicants, spouse details and repeated children. |
| CoverageQuestions | Category questions with their member and spouse follow-ups. |
| ProductCatalog | Product choices with coverage and rider options per applicant, and the combined cost. |
| BeneficiaryProductRecords | Beneficiary records per product, with add, edit and remove. |
| ContactSections | Lays out the contact sections below. |
| ResidentialAddress | Residential address and any mailing-address control. |
| BusinessInformation | Business address, with a same-as-home option. |
| SpouseContact | Spouse contact details. |
| ProfileSections | Personal, employment, financial, existing-coverage, travel, residence and spouse sections, in order. |
| ReviewSections | Application summary, legal disclosures and the required consents. |
| PaymentSections | Payment elections, banking fields and cost display. |
| HealthInformationHelp | Help chip and explanation drawer. |
| HealthQuestionList | Questions one at a time, answered separately for member and spouse, with Yes/No answers and follow-up details. |
| ProcessingStatusPage | A progress state: loading the externally hosted QuickDecision questions, or the signature in progress. |
| ESignInstructions (new) | Tells the applicant what happens next in the electronic-signature process. |
| ReceiptConfirmation | Submission confirmation, security notice and document downloads. |
| ReceiptDecisions | Decision letters, with the application receipt and help alongside. |
| ReceiptApplicationSummary | Summary of the selected coverage and payment instructions. |
| ReceiptNextSteps | Acknowledgement with payment and welcome-kit guidance. |
| ResumeEmailRequest (new) | Application email address and the action to send a secure link. |
| ResumeDeliveryMethod (new) | Choice of Text or Call to receive the verification code. |
| ResumeCodeEntry (new) | Verification code entry and the Next action. |
| ExpiringCodeAlert | Shows whether a secure link or code is active or expired, and confirms a send or resend. |
| ResendCountdownRow | Resend countdown and action. |
| AdvisorLoginTabs (new) | Start and Continue tabs, each with its fields and action. |
| ConfirmationAlert (new) | Success message that a request was sent. |
| DetailsTable | Labeled values with a follow-up action: applicant email, send time and purge date, or the edit request details. |
| ApplicationErrorState | The one layout for every error page: icon or number, heading, message, guidance and actions. |

**(new)**: the content exists on the page today but is not a separate component yet.
