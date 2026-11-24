# Review MCR reconciliation

November 13, 2026 — CHG-061. Scope: the global Review model and ASCE effective
Site. Evidence: normalized Master Client Requirements v78,
`src/migration/sources/mcr-v78.json`, Read & Sign and ElectrConsent sheets.

The user confirmed that the MCR product-based underwriting flag supersedes the
earlier ASCE health-question-participation exception. The user also confirmed
placing the CT warning directly above the member Review checkbox. No decision
from this reconciliation is deferred.

## State and product matrix

| Segment | Applicability and order | MCR evidence | Status |
|---|---|---|---|
| Underwriting flag | Any active member/spouse Life, DI or Office/Professional Overhead. Child-only Life, AD&D and supplemental-health-only do not set it. Independent of online health-page participation. | Read & Sign B3:B4 | Implemented as global source rules; ASCE inherits. |
| Premium contribution | First legal segment, including non-underwritten applications. ASCE uses the standard statement. | B7 | Implemented; exact source wording checked. |
| Medical introduction | After premium/introduction, only when the underwriting flag is true. | B35:B36 | Implemented; exact source wording checked. |
| Authorization | Underwriting flag true. Jurisdiction variant takes precedence over processing variant, then standard. | B40:B41 | Implemented; exact source wording checked. |
| Minnesota | MN authorization replaces standard; its HIV/bloodborne exclusion follows Consent. Fraud remains between authorization and Consent. | C43 | Implemented; split/order checked against source. |
| Virginia QD | VA QD authorization and VA QD consent; non-QD selections use standard wording. | B48:C48, B90:C90 | Implemented; missing consent variant added. |
| QD DI/combo | QD DI or QD Life plus DI uses processing authorization; MN/VA variants retain precedence. No online-health requirement. | B52:C52 | Implemented; mixed member/spouse and disabled-health-page checks. |
| Fraud | Member residence selects exact state wording; unlisted states use standard. NY Life-only omits fraud; any active non-Life election or applicable accident rider includes it. | B53:C76 | Implemented; all authored jurisdiction/default wording and NY combinations checked. |
| Consent | Underwritten wording when flag true; otherwise non-underwritten wording. VA QD variant precedes standard. Exactly one Consent segment. | B78, C90, B93 | Implemented; exact wording checked, with IMPORTANT NOTICE placeholder resolved to its viewer link. |
| Supplemental health | HI/CI attestation, 14pt, above signature/acknowledgement area. Does not itself set underwriting flag. | B115:B116 | Global source and renderer implemented; ASCE has no enabled SH product. |
| CT warning | CT residence and underwriting flag true. Immediately above member Review checkbox, outside legal-text panels. | B118:B119; November 13 user decision | Review implemented and rendered placement checked. Production DocuSign/PDF must also place it immediately above member e-signature; service execution is outside this prototype. |
| Important Notice | Standard, NM protected-person extension, or VA residence document. VA notice selection does not depend on QD. | B142:B162, B187 | Implemented in shared viewer; earlier deferral retired. |
| Electronic Consent | Shared disclosure, with linked Important Notice and existing Privacy Notice. No state/product fork. | ElectrConsent A2:A69 | Retains established disclosure content and common Privacy Notice display name; links use the same viewer. |

ASCE's enabled base products are Term/10-year/20-year Life, AD&D and LTD. Disabled
catalog products are not enabled to demonstrate shared capabilities. Synthetic
source assignments exercise global conditions without rolling out another real
Site. Other Sites' custom legal wording remains their own effective assignments.

## Source, storage and implementation boundary

`requirements/global/application.json` owns the underwriting-flag rules, legal
segments, variants and block placement. ASCE explicitly inherits
`shared.review-policy` using `{"$default": true}`. Rules, category/product selectors
and empty-rule effective overrides are validated; no Site-name branch or copied
page policy selects the flag. `global/rules/review.json` documents these conditions.

`ReviewSections` honors each supported source placement instead of appending all
blocks to Read & Sign. Review remains two legal sections plus its existing adult
acknowledgements. The CT warning adds no checkbox or stored answer. The flag,
selected legal wording, blocks and documents are derived from current answers and
effective configuration. Existing acknowledgement and policy-field answer keys
remain unchanged.

The compiler removes superseded ASCE medical-authorization, shared-consent and
jurisdiction-notice decision records from the current fresh-start projection;
historical migration evidence remains available. Other effective-Site policies
retain explicit supported conditions. Real signature capture and generated
production-document placement are recorded requirements, not executed services.

## Verification

`reviewExperience.mcr.test.ts` compares the effective model directly with MCR
cells for product/applicant combinations, every authored fraud jurisdiction,
NY exceptions, state/processing precedence, disabled-health routing and global
supplemental-health capability. Negative cases cover child-only selections, stale
adult elections and invalid flag definitions. Restoration and whole-page Storybook
checks verify CT placement beside the member acknowledgement and non-underwritten
NY scenarios. Fresh-start checks reconstruct the policy without superseded authored
records and preserve global inheritance plus independent effective overrides.

Final build and verification results are recorded in the
[Review checkpoint](review-component-review.md).
