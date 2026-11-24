# Components

The global template owns component definitions in [components.json](../../requirements/global/components.json). Each canonical owner has one registration (implementation source, role, canonical Storybook ID and category), its registered dependencies, and any internal exports/native elements/actions/slots. Site filters do not turn shared definitions into Site-owned copies.

`requirementComponents.mjs` reconstructs these definitions for Library, prototype and Storybook, including older catalogs with no component records. Build analysis checks each registration and dependency against the actual implementation and story. Source usage/example annotations are generated; the deployment catalog is a projection.

The hierarchy is **application frame → page sections → shared pieces**. A page uses a named part through `partOf` (for example, FieldGroup belongs to SectionDivider). Parts appear within their owner's Library record, without invented canonical component identities. Inline page arrangements are documented through actual controllers, fields, content and the shared page-content slot.

Form spacing is a global presentation rule (CHG-138). Existing FieldGrid,
FieldGroup and ConditionalGroup own a 24px gap between stacked fields/rows and
16px between columns. FieldRenderer is a real layout item with no default control
margins; its controlled adapter shares the same behavior. Helper/error text stays
inside its field and has no additional trailing margin. Home/quote, application
sections and record dialogs reuse these layouts. Name/address columns and the
paired height controls retain their responsive compositions; section headings,
selection options and action rows keep their distinct spacing. No Site spacing
overrides, page wrappers or duplicate component stories are introduced.

## 1. Application frame

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
| StandaloneFormPage | Presentational PageShell/FormShell/PageHeader composition; controllers own form and security behavior. |
| FormShell | The visual surface a form sits on. |
| PageShell | Shared page container and layout. |
| PageHeader | Page title, supporting copy, back action and contextual help. |
| PageTitle | Page heading, subtitle and supporting actions. |
| PageNav | The page's Next or Submit action. |

## 2. Pages and their sections

| Step | Page | What the page is | Sections |
|---|---|---|---|
| | Home | Starts a new application, opens Quote, or resumes a saved application. | HomeHero, AssociationIntroduction, HomeCoverageSection, UnderwriterCredentials |
| **Getting started** | Membership | Collects membership status and applicant contact details. Creates the application record and starts autosave. | MembershipStatus, MemberInformation, AdditionalMembershipInformation, PageHelp |
| | Eligibility | Collects ZIP/postal code, state, date of birth, dependent selection and eligibility responses. | EligibilitySections |
| **Choose your coverage** | Coverage | Collects eligible applicants, products, amounts, riders and estimated premiums. | CoverageQuestions, ProductCatalog |
| **Your application details** | Beneficiary | Collects beneficiary designations for the selected coverage. | BeneficiaryProductRecords |
| | Contact | Collects applicant, mailing, business and spouse contact information. | ContactSections, ResidentialAddress, BusinessInformation (spouse fields use the shared field-section path) |
| | Profile | Collects personal, employment, financial, existing-coverage, travel, residence and spouse information. | ProfileSections |
| **Review your application** | Review | Summarizes the application and collects the required consents and acknowledgements. | ReviewSections |
| | Health: Simplified Issue | Asks the Simplified Issue health questions for each covered applicant. | HealthQuestionList |
| | Health TELE | Resolves LI/DI/CI telesupplement health questions for each covered applicant. | HealthQuestionList |
| | Health: QuickDecision | Loads the externally hosted QuickDecision underwriting questions. | PrototypeHandoffPage |
| | Health DI SUPP | Asks the supplemental disability health questions for each covered applicant. | HealthQuestionList |
| | Health: Chronic Illness Rider | Asks the chronic illness rider health questions for each covered applicant. | HealthQuestionList |
| | Payment | Collects payment elections and banking details. | PaymentSections |
| **E-sign and submit** | E-signature | Completes the electronic-signature process. | PrototypeHandoffPage |
| | Receipt | Confirms the submission and shows decision information and next steps. | ReceiptConfirmation, ReceiptDecisions, ReceiptCoverageDecision, InformationAlert, SiteSupport |
| Resume | Resume | Applicant enters the application email address to resume a saved application. | StandaloneFormPage, FieldRenderer, ExpiringCodeAlert, ResendCountdownRow |
| | Resume: Delivery Method | Applicant chooses Text or Call to receive a verification code. | StandaloneFormPage, FieldRenderer |
| | Resume: Verification Code | Applicant enters the verification code. The saved application loads and returns to Eligibility. | StandaloneFormPage, FieldRenderer, ExpiringCodeAlert, ResendCountdownRow |
| Advisor | Advisor Login | Advisor starts a new application or continues a saved one. | FormRoutePage with page-owned native Tabs and configured fields |
| | Advisor Send Confirmation | Confirms the application was sent to the applicant, showing the applicant email, send time and purge date. The advisor can start a new application. | FormRoutePage with page-owned MUI success Alert, DetailsTable |
| | Application Edit Confirmation | Confirms the edit request was sent to the advisor. The application lock returns to the advisor and applicant access ends. | FormRoutePage with page-owned MUI success Alert, DetailsTable |
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
| PageHelp | Shared topic selection and drawer state for configured page help. |
| PageHelpChips | Generic chip row with supplied labels and selection handler. |
| PageHelpDrawer | Generic help title/content in the shared AppDrawer shell. |
| EligibilitySections | Personal information, covered applicants, spouse details and repeated children. |
| CoverageQuestions | Category questions with their member and spouse follow-ups. |
| ProductCatalog | Product choices with coverage and rider options per applicant, and the combined cost. |
| BeneficiaryProductRecords | Beneficiary records per product, with add, edit and remove. |
| ContactSections | Lays out the contact sections below. |
| ResidentialAddress | Residential address and any mailing-address control. |
| BusinessInformation | Business address, with a same-as-home option. |
| ContactSections spouse fields | Supplied fields through FieldGroup and FieldRenderer, with configured applicant headings. |
| ProfileSections | Configured personal information, physician details, other coverage and member financial questions. Adult disability lists share a record dialog with separate storage. |
| ReviewSections | Application summary, legal disclosures and the required consents. |
| PaymentSections | Payment elections, banking fields and cost display. |
| HealthQuestionList | Questions one at a time, answered separately for member and spouse, with Yes/No answers and follow-up details. |
| PrototypeHandoffPage | Full-viewport prototype image sequence for QuickDecision and DocuSign; the final click uses normal saving and page transitions. |
| ReceiptConfirmation | Submission confirmation, security notice and document downloads. |
| ReceiptDecisions | Product decisions with coverage and payment details in each card; shared support aligns alongside and stacks below on small screens. |
| ReceiptCoverageDecision | One product/applicant decision, followed by requested coverage, estimated payment and payment method. |
| InformationAlert | Shared supplied heading, description and content in a MUI info alert; Receipt is one consumer. |
| ExpiringCodeAlert | Shows whether a secure link or code is active or expired, and confirms a send or resend. |
| ResendCountdownRow | Resend countdown and action. |
| DetailsTable | Labeled values with a follow-up action: applicant email, send time and purge date, or the edit request details. |
| ApplicationErrorState | The one layout for every error page: icon or number, heading, message, guidance and actions. |

**(new)**: the content exists on the page today but is not a separate component yet.

## Owned parts and handoff examples

- FieldGroup is SectionDivider's named export. EligibilitySections and BeneficiaryProductRecords own their inline SectionNote parts (native MUI Alert).
- AppSnackbar owns its native Snackbar; PageHelpChips owns the repeated native HelpChip (MUI Chip).
- Confirmation pages supply native success Alerts in FormRoutePage's content slot. Resume's three controllers use StandaloneFormPage with actual field definitions. AdvisorLogin owns the native Tabs arrangement. These are not separately exported components.
- ESignInstructions is obsolete. Health QD and DocuSign use the same PrototypeHandoffPage, with canonical single/multiple-screen examples and separate whole-page examples for effective images. Screens come from global prototype defaults or effective-Site assignments. No external service is introduced.
