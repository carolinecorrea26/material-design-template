# ASCE local mock contracts

Implementation: `scripts/mock-platform.mjs`, client `src/mock/client.ts`, applicant adapter `src/pages/Payment.tsx`. These contracts are local test scaffolding, not insurer APIs.

POST JSON to `/api/mock/*`, with `Content-Type: application/json` and `X-Portal-Mock: 1`. The server checks loopback origin/host rules and rejects unknown request keys. Errors are JSON with a message and HTTP 400 (invalid fixture/input), 401 (admin authentication), 404 (unavailable resource) or 409 (version/idempotency conflict). No real email, payment processor, insurer or PRASE is called.

## Library

`/prototype/library`: `{siteKey:"asce-default"}` returns `{mode:"mock",revision:"prototype:<hash>",payload,draft}`. The payload is the Site's latest persisted draft or reviewed seed; clients validate it before installation. `draft` includes id/version/baseReleaseId where saved.

`/library/save`: authenticated admin cookie required. `{id?,expectedVersion,payload}` returns a persisted versioned draft and audit entry. Stale versions conflict. `/library/read` exposes the published head, distinct from prototype drafts. Publication/rollback remain readiness gated; saving an ASCE prototype does not publish production or mutate catalogs/other Sites.

Admin setup/login/TOTP are local mock fixtures. Existing accounts must use their current credentials; integration tests use a fresh temporary store and generated TOTP. Never change shared credentials to run acceptance.

## Quotes

`/rates/quote` accepts `{siteKey,productKey,amount,frequency,dimensions?,paymentMethod?,revision?}`. Amount is a positive integer; frequency is `monthly`, `quarterly`, `semiannual` or `annual`. Dimension keys are restricted to supported rating metadata; this scaffold does not fully validate dimension values. An applicant dimension, when supplied, must be member/spouse/child. A supplied revision must match the current Site Library. The response captures that revision and includes `mode:"mock"`, quoteId, premiumCents, USD, frequency, expiresAt and explicit synthetic authority.

The synthetic base is amount × 0.00025 dollars/month rounded up to cents with a $1 minimum, not actuarial pricing. Without paymentMethod, frequency scales the base for the rate adapter. When paymentMethod is supplied, the server requires that method/frequency in the current persisted Library journey policy and applies its annual credit, factor and collection fee. Quotes expire after 15 minutes and live in memory; restarting invalidates unsubmitted quotes.

## Payment fixtures

`/payments/authorize`: `{quoteId,paymentToken:"mock-approved"|"mock-declined",idempotencyKey}`. Keys are 8–100 letters/digits/hyphens. Returns `{mode:"mock",paymentId,quoteId,status:"authorized"|"declined",amountCents,currency:"USD",fundsMoved:false}`. Unknown/expired quotes and real card/bank fields are rejected. Identical replay returns the original response; changed request with the same key conflicts. Payment records persist.

The UI requests a quote and fixture authorization for each positive product/applicant election. Changing elections, method or frequency requires reauthorization; declined fixtures cannot continue. Browser payment calculations resolve the same saved Library policy.

## Submission

`/applications/submit` accepts:

```json
{
  "siteKey": "asce-default",
  "revision": "prototype:<hash>",
  "entries": [{"productKey":"li-term","applicant":"member","amount":10000}],
  "paymentIds": ["<approved-fixture-payment-id>"],
  "idempotencyKey": "<unique-fixture-key>"
}
```

Each unique product/applicant entry needs its own unique approved payment matching an unexpired quote for the Site/product/amount. Applicants are member/spouse/child. Missing/declined authorizations, duplicate entries, invalid amounts and extra personal-information keys are rejected. Successful response: `{mode:"mock",contract:"mock-applicant-v1",submissionId:"MOCK-<uuid>",status:"submitted",insurerSubmitted:false,fundsMoved:false,entryCount}`. Minimal non-personal election records persist. Exact replay returns the original response even after restart; changed request with the same key returns 409.

New submissions require the current Site Library revision and quote revision, matching applicant when supplied in the quote, and an unexpired quote. New payment authorization rejects quotes from an older Library revision. A successful submission reserves its payment IDs against use by another submission; identical submission replay still returns the original record after restart. Payment's quote requests supply its captured revision and applicant.

This endpoint validates fixture linkage, not the complete application. Complete applicant-dimension binding, health answers, legal consents, signatures and PDFs are absent. Production server-side validation is ASCE-12. The current mock records submission on leaving Payment, before the signature placeholder; this is explicitly not a legally signed application.

## Save/resume and documents

Applicant autosave is browser session storage, scoped to the current tab. Email previews are local templates/records; no mail is sent. `/resume`, `/resume-method` and `/resume-code` simulate navigation. Code `123456` works while the local countdown is active; a wrong/expired code is rejected. These routes are not an authentication service and do not prove email ownership. An empty session can load a demonstration returning applicant fixture; cross-device saved applications are not supported.

QuickDecision/FUW and DocuSign are placeholders. Receipt decisions are simulated. Application, Payment and QuickDecision PDF buttons are disabled in mock mode until document generation is implemented.
