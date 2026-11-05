# Resume component review

October 29, 2026. Covers the saved-application recovery flow after Receipt using the [component documentation contract](component-documentation.md). The user accepted the page composition and shared-component/container arrangement on October 29. Production delivery and Site-wide acceptance remain separate.

## Application frame

Resume, ResumeMethod and ResumeCode use the utility layout: PageShell at 600px, FormShell and PageHeader with Back. They own local react-hook-form state and their submit buttons rather than using FormRoutePage, main steps or breadcrumbs. ResumeCode returns to the delivery-method page with its recovery query; the first two pages use browser history for Back.

## Sections in page order

| Page / section | Shared owners | Page-specific behavior |
| --- | --- | --- |
| Email request | FieldRenderer; PageHeader | Saved `resume-email` definition, optional session-saved recipient, email validation, disabled field/button while requesting, inline request failure. |
| Link sent | ExpiringCodeAlert; ResendCountdownRow | Replaces email entry after a successful request; normalized recipient, service-provided expiry, resend and resend-failure feedback. |
| Delivery method | FieldRenderer; native error alert/button | Saved `resume-delivery-method` options. Missing recovery parameters prevent Next. Call maps to the service's `phone` method; the service returns the delivery target and code expiry. |
| Verification guidance | PageHeader | Email recipient or supplied masked phone target; missing-link error appears within the form. |
| Verification code | ExpiringCodeAlert; FieldRenderer; ResendCountdownRow | Saved `resume-security-code` binding, six-digit submission check, countdown, expiry, resend confirmation, inline verification failure and busy state. |
| Verified state | Native button/check icon | Restores the recovered application, resets application-session flags, shows success, then replaces the route with Eligibility after 1.2 seconds. |
| Local delivery preview | ApplicantMockOutbox | Only appears with the mock platform enabled on the demo Site. It fetches simulated messages on an explicit refresh action. |

These fields retain separate saved identities; the countdown and resend controls are shared by the link and code pages. Service requests, query interpretation, application restoration and navigation remain in the page controllers. No new section identity is needed for these small form compositions.

## Canonical components and reuse

| Owner | Role / parts | Examples and acceptance boundary |
| --- | --- | --- |
| ExpiringCodeAlert | Shared piece; active-link, expired-link/code and resend-confirmation alerts; inline resend action | Feedback → Resume expiration: Active link, Expired code, Resent confirmation. Reuse its canonical presentation review. |
| ResendCountdownRow | Shared piece; formatted time remaining, expired label, resend button and disabled state | Demonstrated beside ExpiringCodeAlert in its existing canonical examples. |
| FieldRenderer | Shared piece; saved email, delivery radio choices and security-code field | Existing field control review carries forward; this flow reviews bindings and placement. |
| PageShell / FormShell / PageHeader | Application frame; width/surface/title/subhead/Back | Existing frame examples carry forward. Utility pages own their form and submit action. |
| ApplicantMockOutbox | Demo delivery inspection | Existing mock-only boundary; not an actual email/SMS/call sender. |

## Whole-page review entry points

Storybook → Pages → Resume → Whole page uses the actual page implementations and a detached generic template. Review guidance stays in metadata outside the canvas.

| Example | Review focus |
| --- | --- |
| Email request | Single email field, heading, Back and validation |
| Delivery method | Saved choices and disabled Next before selection |
| Missing method link | Missing-parameter guidance and disabled submission |
| Email code | Recipient, code field, countdown and resend placement |
| Phone code | Masked phone target with the same code field |
| Expired code | Expired alert, disabled code/Next and available resend presentation |
| Missing code link | Guidance and blocked verification without recovery parameters |

The query tokens in these examples are fictional. They establish presentation inputs, not an authorized recovery session. Actual request, resend, busy/error, link-sent and verified transitions require the local mock service and a saved application; the focused flow tests cover existing request/loading and verified/restoration behavior. The examples do not patch services, send messages on mount or write saved application data. The email page retains its production session-prefill behavior.

## Service and review boundaries

Recovery uses applicantSaveService → mockRequest. Client-side query checks establish the presence of parameters; the service must validate the recovery token. Link/code lifetime comes from service expiry, with a five-minute fallback on code entry. Delivery/verification are gated by VITE_MOCK_PLATFORM_ENABLED. These examples do not establish production identity verification or email/phone transport.

Page acceptance covers the three pages' wording, field bindings, missing/expired feedback, loading and successful restore transitions. Shared controls do not require repeat approval. Site-wide accessibility and production delivery remain separate.

Verification: eight existing flow/client recovery tests and seven actual-story rendering checks pass. The story checks verify saved controls, masked/emailed targets, missing-link submission guards, expired-code disabling, no requests on mount, and fixture cleanup. Storybook TypeScript, scoped ESLint, the production Storybook build and catalog/handoff consistency checks pass. A browser check confirmed the email-request page renders. The shared PageTitle currently renders an h2 on these utility pages; heading-level consolidation remains a frame follow-up.

Catalog follow-through: the shared CSF renderer is explicit so the source audit recognizes the real pages. All three Resume page identities have saved whole-page example references, surfaced through contextual Storybook links in the Pages table. Page-only stories do not create duplicate component identities. The user subsequently removed the separate Components section in favor of Storybook; navigation checks cover its removal, legacy bookmarks opening Pages and direct Storybook linking.
