# DocuSign fresh-start page review

November 14, 2026 · CHG-073. Complete for the global template and effective ASCE Site. Both production policy questions are resolved; no DocuSign decision is deferred. Receipt remains for its final page review.

## Ownership and composition

`requirements/parked/docusign.json` owns the shared page definition, route, order, component placement and content references. The page has no portal form sections or applicant-entry fields: signing is external. It uses the existing PrototypeHandoffPage with FormRoutePage for form submission, draft saving, pending protection, feedback and transitions. DocuSign is an adapter to that shared owner, not a second handoff implementation. Canonical single/multiple-screen examples belong to PrototypeHandoffPage; the DocuSign whole-page story shows the effective image assignment.

Global prototype defaults are in `global/prototype-fixtures/handoffs.json`. Each effective Site may assign its ordered screens in `parked/sites/<site>/prototype-handoffs.json`; ASCE assigns `/prototype/docusign.png`. The image is illustrative, including its displayed sample answers, signatures, controls and demonstration document. It neither reflects current applicant answers nor defines production content or rules. Source compilation validates nonempty sequences, alternative text, local asset paths and placeholders. Library, prototype and Storybook use the same effective projection. The globally inherited DocuSign page requirement is Required for ASCE.

| Area | Behavior and source |
| --- | --- |
| Frame and controls | Full-screen shared handoff; one native click/keyboard action advances each screen. Portal title/Back/help/Next are not duplicated over the external-screen illustration. |
| Intermediate screens | Click advances local image position only. No save, signature or completion is recorded. |
| Final screen | Click submits the shared form. It uses the normal draft-save path, then the configured transition and Receipt destination. This is prototype completion simulation, without a signing or application-submission service call. |
| Pending / local save failure | Disable repeated advancement while saving or navigating. A failed local save retains the current image and shared page feedback; retry remains possible. No new error page or service redirect is wired. |
| Missing / failed image | Global defaults use Image TBD. Failed image loading shows the configured placeholder or shared Image unavailable text and retains the continue action. |
| Content | Global page title/subhead/navigation wording and shared continue/unavailable messages. Screen paths/alt/placeholder text are configured fixture values; no separate page-specific support/help component. Obsolete inline DocuSign simulator instructions/actions are retired and cannot return from older records. |

## Production document requirements and MCR reconciliation

Production signing documents must use the same effective answers, active product/applicant participation and legal policy as Review. Their state/product wording is not copied into a second DocuSign content system. Review checkbox acknowledgements remain separate from electronic signatures.

| Evidence | Requirement |
| --- | --- |
| MCR Read & Sign!B115:B116 | Applicable supplemental-health attestation: 14pt and above the signature area. ASCE has no enabled supplemental-health product. |
| MCR Read & Sign!B118:B119; confirmed November 13 decision | Connecticut warning for the reviewed product-based underwriting flag, immediately above the member e-signature, as well as its approved placement above the Review checkbox. |
| Existing shared Review legal policy | Preserve jurisdiction/processing precedence and configured before/after-signature document placements. Do not derive underwriting from whether online health questions appeared. |
| MCR ElectrConsent!A13, A23, A29 | Electronic consent and signature application are production signing requirements. The prototype performs neither electronic signature capture nor binding consent execution. |
| User decisions November 14, 2026, supplementing MCR ASCE Main!165:169 and New UX Multi-page Requirements!21 | Member/application owner always signs, including dependent-only applications. An actively applying spouse also signs; no separate child signature. Use current active coverage participation, including applicable attached benefits, rather than retained spouse answers or Eligibility intent alone. |
| User completion decision November 14, 2026 | Completing all required signing submits the production application and proceeds to Receipt, without a separate portal Submit action. Partial/canceled/declined/expired/failed signing does not satisfy completion and cannot produce a successful Receipt. The existing final-image click simulates this boundary. |

Real signing and document generation are production requirements. The current prototype intentionally uses the supplied image sequence. No actual envelope creation, signature/date entry, document signing, delivery or production submission is implemented.

## Configuration, validation and storage

The global page requirement/order and handoff capability are inherited; Site image assignments remain Site-owned. No ASCE-only signing implementation or visibility gate is introduced. Screen configuration is separate from applicant answers.

There are no portal signature fields to validate on this page. Shared page/save validation and source image validation still apply. Application answers and ordinary draft progress use the existing application save contract. Image index and failed-image state remain local and restart on remount. The prototype does not collect/store signer text, signing dates, envelope IDs, signed PDFs or verified completion status. Review acknowledgement booleans, a page save, Receipt navigation and prototype confirmation numbers are not production signature evidence.

Rules are mapped through `mappings/requirements/docusign.json` into Library documentation. Shared legal, applicant, error/session and form workflows retain their existing owners. The global signer and completion rules are recorded in that same model; ASCE inherits them. No additional signer-selection input, signature field, separate portal Submit action or error-page type is added.

## Verification

Existing handoff checks cover global defaults, effective assignments, ordered advancement, explicit final-click submission, pending suppression, save-error feedback, failed images and malformed configuration. The real application integration check covers the configured DocuSign image and normal transition to Receipt. Fresh-start reconstruction injects and removes obsolete simulator content, rebuilds the page without superseded records, and compares Library, prototype and Storybook fields, sections, requirement, definition, rules and effective images. Final checks verify the confirmed signer/completion rules are included once on both global and ASCE Library views.

Verification covers source reconstruction and consumer parity, the shared handoff/DocuSign stories and the real-image-to-Receipt integration. Production signer/submission rules are normative requirements; actual signing evidence and service execution are outside this prototype.

Final verification: all 64 fresh-start checks, seven focused handoff/DocuSign/story checks, requirements mapping, lint, TypeScript and both production builds pass. The real-image-to-Receipt integration remains covered. Library, prototype and Storybook catalog artifacts match; component evidence remains current with 110 canonical owners and no uncovered sources. Both user decisions are recorded and no DocuSign question remains open.


## Client configuration and copy review (CHG-083)

User decision November 15, 2026: DocuSign portal title/introduction and shared handoff messages remain global. There are no DocuSign Site page-copy slots. The default adapter now reads the global application content directly. Full-screen external images continue to cover the host frame; no extra portal header is added to them.

Effective Site image/alternative-text assignments remain in the existing prototype-handoff configuration. Production signed-document wording retains the shared Review/legal/document definitions and effective policy selection; it is not reauthored as DocuSign page copy. The existing PrototypeHandoffPage composition is reused. This completes DocuSign copy classification without changing signers, completion/submission rules, evidence storage or the external-service boundary.


## Non-copy configuration review (CHG-109)

November 17, 2026: no new policy decisions are needed. The settled configuration boundaries are:

| Area | Ownership and supported configuration |
| --- | --- |
| Page inclusion, requirement, order and route | Global and fixed. DocuSign remains required; only Beneficiary and Payment have Site page-participation options. |
| Portal fields and copy | No portal signature fields. Title/introduction, navigation and shared handoff messages remain global without Site copy slots. |
| Prototype screens | Global shared configuration definition/defaults; effective Sites may assign an ordered sequence separately for DocuSign and QuickDecision. Omitted page assignments inherit the complete global sequence. Each nonempty sequence requires screen alt text plus a local image source or placeholder. ASCE retains its one supplied DocuSign image. |
| Signers and completion | Global owner-always/applying-spouse/no-child signer rule. All required signing completes production submission and proceeds to Receipt; partial/canceled/failed signing is not completion. No Site override or additional portal Submit action. |
| Production document content | The existing shared Review/legal/document definitions and effective policy selections own state/product wording and signature placement. Prototype illustrations are not another document-content configuration. |
| Storage and failures | Existing shared save/transition and error/session contracts. Screen index/load failures are local display state; no signature evidence is stored by this prototype. |

The audit found that the screen configuration's Library row had no authored global metadata. Its canonical definition is now in `requirements/global/application.json`; defaults stay in `global/prototype-fixtures/handoffs.json` and Site selections stay in `parked/sites/<site>/prototype-handoffs.json`. The Library states the global scope, prototype-only purpose, applicable pages, sequence shape and inheritance. It remains visible as a global definition under all, ASCE and an unconfigured synthetic Site filter. Superseded saved definitions/values with an aliased `prototypeHandoffs` path are retired before projection.

PrototypeHandoffPage and FormRoutePage remain the shared composition for DocuSign and QuickDecision. No new wrapper, duplicate canonical story, effective-Site implementation, live signing, document-generation or production submission service is added.

CHG-109 verification: **91 Fresh-start checks and eight focused checks passed**, including the shared single/multiple-screen stories, pending/failure behavior and supplied-image-to-Receipt integration. The integration now reads the current Fresh-start Home action instead of its superseded label. The stale-definition fixture passed its focused rerun after adding the required nullable metadata field; TypeScript and focused ESLint pass. Requirements, component-reuse, Storybook organization, icon and handoff gates pass. Prototype and Storybook production bundles build successfully; their catalogs and the public catalog share SHA-256 `f0f56e40e83f73d00f2905da2e68380aaab26f88d4f948a4e4697cdd3381d90a`. Reconstruction and global Library visibility are verified without superseded handoff records. DocuSign configuration review is complete with no open decisions.
