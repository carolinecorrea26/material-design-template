The Portal Application Template includes the following production pages and page states. Conditional pages are included in the resolved application flow only when their configured display rules are satisfied.
Page Family Pages Business Purpose
Entry and Resume Landing Page, Resume, Resume Code Start a new application or securely restore an incomplete application.
Core Application Membership, Eligibility, Coverage, Beneficiary, Contact, Profile, Review, Payment, E-Sign, Receipt Capture, validate, review, and submit application information.
Health Health SI, Health LI/TELE, Health QD, Health DI, Health CIR Capture coverage- and underwriting-specific health information based on selected products, underwriting types, and enabled riders.
Advisor Advisor Login, Advisor Send Confirmation Start or resume an advisor-assisted application and confirm that the application has been sent to the applicant for completion.
Utility and Error States Session Timeout, Expired Link, Verification Failure, Application Unavailable, Generic Error, Maintenance Provide recovery instructions, support guidance, or system-status information when the standard application flow cannot continue.

The Quote experience is not included in the page inventory because it is currently presented within a drawer or modal rather than as a standalone application page.
For advisor-assisted applications, Send Application is a popup action initiated from the last page the advisor is permitted to complete. After the action is successfully submitted, the advisor is routed to the Advisor Send Confirmation page.
The Utility and Error States listed above are planned production states but are not yet represented in the current prototype. Detailed content, routing, recovery actions, and display conditions remain to be defined.
Prototype-only reference routes, including Mock Email Preview and Information Architecture, are excluded from the production page inventory.

3.2 Consumer Application Flow
The consumer flow begins at the configured Landing Page and follows the resolved sequence of applicable application pages.
Page inclusion is determined by client configuration, applicant and eligibility data, selected coverage, underwriting requirements, enabled riders, and application state.
Sequence Page or State Functional Behavior
0 Landing Page Starts a new application, opens Quote, or resumes an application.
1 Membership Collects membership and applicant contact information. Successful submission establishes the application record and starts autosave.
2 Eligibility Collects ZIP/postal code, state, date of birth, dependent selection, and configured eligibility responses.
3 Coverage Collects coverage interests and selections, including eligible applicants, products, amounts, riders, and estimated premiums.
4 Beneficiary Included when selected coverage is configured for beneficiary designation. Required, Optional, or None mode controls completion.
5 Contact Collects configured applicant, mailing, business, and spouse contact information.
6 Profile Collects configured personal, employment, financial, existing-coverage, travel, residence, and spouse information.
7 Review Presents the application summary and required consent or acknowledgement sections.
8 Health Presents applicable health forms as separate routes grouped under one Health progress stage.
9 Payment Collects payment information when included by Required or Optional page mode.
10 E-Sign Completes the configured electronic-signature process.
11 Receipt Displays submission confirmation, decision information, and configured next steps. The decision section is always displayed.
ID Requirement Change Status Configuration
FLOW-CNS-001 The system must determine page sequence from the resolved flow and omit pages whose conditions are not met. Baseline Approved Not Configurable
FLOW-CNS-002 Beneficiary must be included only when selected coverage is configured for beneficiary designation and the page mode is not None. Modified Approved Client Configurable
FLOW-CNS-003 Beneficiary and Payment must support Required, Optional, and None modes. Optional mode asks whether information will be added; None removes the page from the flow. New Approved Client Configurable
FLOW-CNS-004 Applicable health forms must be separate routes grouped under one Health stage. Modified Approved Not Configurable
FLOW-CNS-005 Receipt must be the terminal successful state and must always include the decision section. Modified Approved Not Configurable
FLOW-CNS-006 Excluded pages must not appear in navigation, breadcrumbs, progress, or review status. Baseline Approved Not Configurable

3.3 Advisor-Assisted Flow
The advisor-assisted flow allows the advisor to complete the application through Profile and transfer it to the applicant for review and final completion.
Only one actor may access the application at a time. Ownership transfers between advisor and applicant through the send and return-for-edit actions.
Actor Sequence Page or Action Functional Behavior
Advisor 1 Advisor Login Starts a new application or resumes a saved application.
Advisor 2 Membership Begins a new advisor-assisted application.
Advisor 3 Eligibility Completes eligibility information.
Advisor 4 Coverage Completes coverage selections.
Advisor 5 Beneficiary Completes beneficiary information when included in the resolved flow.
Advisor 6 Contact Completes contact information.
Advisor 7 Profile Completes the final advisor page.
Advisor 8 Send Application Confirms handoff to the applicant.
Applicant 9 Resume and Verification Uses the secure resume flow to access the application.
Applicant 10 Advisor-Applicant Review Reviews advisor-entered information as read-only.
Applicant 11 Remaining Application Completes the next incomplete applicant-owned page through Receipt.
ID Requirement Change Status Configuration
FLOW-ADV-001 The advisor must complete Membership, Eligibility, Coverage, Beneficiary when applicable, Contact, and Profile; Profile is always the final advisor page. Modified Approved Not Configurable
FLOW-ADV-002 Send Application must open from Profile and transfer the application only after the advisor confirms the dialog. Modified Approved Not Configurable
FLOW-ADV-003 The applicant must enter through Resume and Verification and begin on Advisor-Applicant Review unless later applicant-owned pages were previously completed. Modified Approved Not Configurable
FLOW-ADV-004 Advisor-entered information must be read-only to the applicant. New Approved Not Configurable
FLOW-ADV-005 Requesting an advisor edit must display a confirmation dialog, email the advisor, transfer the application lock to the advisor, and end applicant access. The applicant destination and message after transfer require approval. New Needs Confirmation Not Configurable
FLOW-ADV-006 Only the actor currently assigned the application may access or edit it. New Approved Not Configurable

3.4 Autosave and Persistence Flow
Autosave begins after successful completion of Membership for both consumer and advisor applications. Portal form data is saved when a page is successfully submitted.
Field-level saving performed by external underwriting experiences is outside the Portal autosave scope.
ID Requirement Change Status Configuration
AUTO-001 Autosave must begin after successful Membership submission for consumer and advisor-assisted applications. Modified Approved Not Configurable
AUTO-002 Portal form data must be saved when a page is successfully submitted. Baseline Approved Not Configurable
AUTO-003 The saved indicator must appear only after the save is confirmed. Baseline Approved Not Configurable
AUTO-004 Save-failure scenarios and recovery behaviors must be documented and confirmed with Development and Integration, including user messaging, retry capabilities, draft retention, and any data-loss prevention measures. Baseline Needs Confirmation Not Configurable

Save failure scenarios:
• Network connectivity failure – User loses internet connectivity while an autosave request is being processed.
• Server/Application error – The application encounters an unexpected error and cannot save the draft.
• API or service unavailability – A dependent service required for saving data is unavailable or times out.
• Session expiration – The user's session expires before the autosave request is completed.
• Validation failure – Data does not meet save requirements and is rejected by the system.
• Database persistence failure – The application cannot create or update the draft record.
• Concurrent update conflict – The same draft is modified from multiple sessions/tabs, creating a conflict.
• Browser interruption – Browser crash, tab close, page refresh, or navigation away before save completion.
• Storage limit exceeded – Local or server-side storage limitations prevent saving.
• Partial save failure – Some fields are saved successfully while others fail.

3.5 Resume and Verification Flow
The resume flow restores an incomplete application through an email-based secure link and phone verification code.
Sequence State Functional Behavior
1 Resume Request User enters the application email address; reminder-email links prefill it.
2 Request Confirmation System shows the same confirmation whether or not a matching application is found.
3 Resume Link User opens the time-limited email link.
4 Resume Code System sends a text code by default; user may request delivery by voice call.
5 Verification Result Successful verification restores access; unsuccessful verification remains in the verification flow.
6 Restored Destination User is routed to the next incomplete page.

ID Requirement Change Status Configuration
RES-001 Resume must begin with the application email address; a reminder-email link must prefill the value. Modified Approved Not Configurable
RES-002 The request confirmation must not disclose whether a matching application exists. Baseline Approved Not Configurable
RES-003 Resume-link and verification-code pages must display the configured expiration countdown. New Approved Globally Configurable
RES-004 The verification code must be sent by text by default and the page must provide an option to resend by voice call. Automatic channel selection requires business and integration approval. Modified Needs Confirmation Globally Configurable
RES-005 Expiration, resend, retry, and lockout behavior must use approved configured limits. Baseline Needs Confirmation Globally Configurable
RES-006 Successful verification must route the user to the next incomplete page. An advisor-assisted applicant who has not progressed beyond Review must return to Advisor-Applicant Review. Modified Needs Confirmation Not Configurable
3.6 System-Generated Communications
System-generated communications support application persistence, advisor handoff, edit return, and submission confirmation. Detailed templates and delivery operations are defined outside the page flow.
ID Requirement Change Status Configuration
COMM-001 After Membership establishes the application record, the system must send the initial incomplete-application reminder communication. Modified Approved Not Configurable
COMM-002 After advisor handoff is confirmed, the system must send the applicant a secure application-access invitation. Modified Approved Not Configurable
COMM-003 When the applicant returns an application for advisor edits, the system must notify the advisor. New Approved Not Configurable
COMM-004 After successful submission, the system must send the configured confirmation communication. Baseline Approved Client Configurable
COMM-005 The communication inventory must define each trigger, recipient, channel, timing, template, and delivery-failure handling before implementation approval. New Needs Confirmation Client Configurable
3.7 Quote Flow
The Quote experience is available through configured entry points and is displayed within a drawer or modal. It is not a standalone production page.
The Quote experience collects the minimum information required to determine available products and estimated premiums for supported coverage categories. When the user proceeds into the application, applicable values may prepopulate corresponding application fields.
ID Requirement Change Status Configuration
QUOTE-001 Quote must be available from the Landing Page and Membership page. Modified Approved Client Configurable
QUOTE-002 Quote must calculate estimated premiums for all supported coverage categories: LI, AD, DI, OO, and SH. New Approved Client Configurable
QUOTE-003 Quote must collect only the common and category-specific inputs required to calculate estimates. Modified Approved Not Configurable
QUOTE-004 At least one product must be selected before the user can continue into the application. New Approved Not Configurable
QUOTE-005 Applicable quote inputs and selected products must carry into the application. New Approved Not Configurable
QUOTE-006 Quote results must identify premiums as estimates and display the applicable premium frequency. Baseline Approved Client Configurable
QUOTE-007 Business must approve whether Quote uses the full nicotine question or the current simplified question. Modified Needs Confirmation Globally Configurable
3.8 Health Routing
Health pages are displayed conditionally based on the underwriting type associated with selected products and enabled riders.
Each applicable health page must display no more than once within the resolved application flow.
ID Requirement Change Status Configuration
HLTH-001 Applicable health forms must be resolved from selected coverage, underwriting type, and enabled riders. Baseline Approved Client Configurable
HLTH-002 When multiple health forms apply, the sequence must be SI, LI/TELE, QD, CIR, then DI. Modified Approved Not Configurable
HLTH-003 Each applicable health form must appear no more than once. Baseline Approved Not Configurable
HLTH-004 Health forms must remain separate routed pages while appearing as one Health stage in user-facing progress. Modified Approved Not Configurable
HLTH-005 Final health question sets, follow-up schemas, mappings, and underwriting payloads require Business and Underwriting approval. Baseline Needs Confirmation Client Configurable
3.9 Review, Submission, and Receipt Flow
The final application flow allows the applicant to review entered information, correct incomplete or invalid sections, provide payment information, complete e-signature, submit the application, and receive confirmation.
ID Requirement Change Status Configuration
SUB-001 Review must present the application summary and required consent or acknowledgement sections. Modified Approved Not Configurable
SUB-002 Payment must follow the configured Required, Optional, or None mode before E-Sign. New Approved Client Configurable
SUB-003 E-Sign must complete before the application is submitted. Baseline Approved Not Configurable
SUB-004 Receipt must display only after successful submission and must include confirmation, decision information, and configured next steps. Modified Approved Client Configurable
SUB-005 The final editable point and post-Review correction behavior require approval. Modified Needs Confirmation Globally Configurable
