# Applicant Admin and Fast Track

Status: **initial prototype; connected Fast Track requirements remain planned**.
This records the November 16, 2026 request without activating another applicant
application template or changing ASCE policy. Shared ownership is global; no Site
assignment/override is added. No corresponding Library or Storybook entries are
created for the internal workspace or its demonstration mechanics.

## Implemented prototype

Applicant Admin is available in Admin Center. A synthetic submitted-application
selector demonstrates Member Review, Underwriting and Approved. One global
workspace definition (`requirements/global/admin/applicant-admin.json`) owns the
stage labels, explanations, owners and approved actions. Synthetic records live
in `requirements/global/prototype-fixtures/applicant-admin.json`.

The vertical timeline describes the TPA reviewing membership/eligibility, New
York Life reviewing detailed financial/medical records when required, and final
decision. An approved example shows welcome-kit information. Payment and
beneficiary actions are disabled before approval. Once approved, they open the
existing fresh-start Payment and Beneficiary pages in an isolated preview. Next
validates and saves only the fictional example's details for this browser session.
The receiver checks the frame origin, source window, record and page. The demo
store rejects saves for examples that are not approved. It does not write live
operational applications, charge a bank account or change a policy.

## Planned service requirements

- Applicant authentication and ownership checks for each submitted application.
- Trusted TPA/NYL status events, stage history and final-decision mappings.
- Durable approved-member payment and beneficiary updates with service validation,
  auditing and confirmation.
- Fast Track applicant journey and template requirements, recorded and reviewed
  before activation; this prototype does not imply Fast Track is implemented.
- Service enforcement of advisor/applicant exclusive access and secure handoffs.

No processing SLA, underwriting outcome rules, production permissions, new
insurance policy values or additional real-site rollout is inferred here.
