# Advisor component review

October 29, 2026. Prepares Advisor login, sent-to-applicant confirmation and applicant edit-request confirmation after the accepted Resume composition. Follows the [component documentation contract](component-documentation.md). Advisor login layout and wording were accepted on October 30 after visible review. Both the sent-to-applicant and edit-request confirmations were then shown; the user requested the next item without changes after each on October 30. The visible review has moved to utility/error pages. Production service integration remains outside this component review.

## Application frame

All three pages use FormRoutePage, including its saved fields, restoration, validation, form, page surfaces and navigation plumbing. AdvisorLogin supplies `formMaxWidth={500}`, `noTitle` and `hideActions`. Its `formHeader` slot contains the title/subhead on the theme's dark primary background with contrasting text. The shared surface clips the banner at its rounded corners and retains the padded body. AdvisorLoginFields owns the Start/Continue tabs, mode instructions and Log in submit action. The confirmation pages use the shared heading and suppress the normal Next action. Utility chrome is selected by the router's advisorLogin/advisorSend layout variants.

These are page compositions of existing components. The title banner, tabs and submit/confirmation actions are internal parts of their page owners, not new canonical component identities. No new Site policy or field binding is introduced for this review.

## Sections and shared owners

| Page / section | Shared owners | Page-specific behavior |
| --- | --- | --- |
| Login identity and mode | FormRoutePage surface-header slot; native title/tabs | Saved title/subhead, dark primary banner, 500px form width, Start/Continue tabs bound to `advisor-flow-type`. The previous icons are removed. |
| Mode instructions | Native text within AdvisorLoginFields | Saved page section notes explain a new Membership-through-Profile application and applicant handoff versus reopening an existing application with verification. The tab group references this text through `aria-describedby`. |
| Start fields | FieldRenderer → shared input/PhoneField controls | Saved `advisor-email`, `advisor-phone` and `advisor-code`, stacked with floating labels and existing validation. Advisor phone has no phone-type selector. |
| Continue field | FieldRenderer | Independent `applicant-email` binding and helper text. Saved section conditions choose which field set appears. |
| Log in | Native MUI submit button | Invokes the shared form's validation. Start resolves to Membership; Continue resolves to Resume. The current implementation performs no advisor authentication request. |
| Sent-to-applicant feedback | Native success alert; DetailsTable | Applicant name/email from saved answers, mount-time sent date and a displayed deletion date nine days later. Missing identity uses em dashes. |
| Start new application | Native action | Navigates to Advisor login. This action currently does not clear application answers. |
| Edit-request feedback | Native success alert; DetailsTable; polite live region | Existing `advisor@example.com` placeholder and local request timestamp. A delayed announcement covers navigation from Review outside the normal Next flow. |
| Return to Home | Native action | Navigates to the saved Home route. |

Saved page/section/field definitions continue to own placement and conditions. Controllers resolve active content, rules, navigation and application values. Shared controls carry their canonical review forward.

## Send dialog and workflow placement

SendApplicationDialog is the existing shared AppModal composition: title/intro, recipient details, Send and Cancel actions. Canonical examples remain under Dialogs → SendApplicationDialog, with their existing IDs. They are standalone local examples and only close the dialog on confirmation.

Profile opens the applicant variant before continuing an advisor-prepared application. Send releases the pending continuation; Cancel leaves the applicant on Profile. Review uses the advisor variant for an edit request, hides the recipient-name row and navigates to ApplicationEditConfirmation after Send. The pages supply the copy and recipient; the dialog performs no transport. These placements were already accounted for in the Profile/Review composition reviews.

Advisor route correction: Start followed by Log in enters Membership and uses the consumer portal pages through Profile. Profile now explicitly routes an advisor's confirmed Send to AdvisorSendConfirmation; it previously fell through to the ordinary Review route. Consumer Profile continues to Review. Both new and saved advisor modes require Send, with Cancel retaining Profile. The confirmation page's separate Start new application action still returns to Advisor login; it is distinct from the Start tab at login.

## Whole-page examples

Storybook → Pages → Advisor → Whole page renders the actual controllers with a detached generic template and fictional local answers. Review metadata stays outside the canvas.

| Example | Review focus |
| --- | --- |
| Start | Empty advisor fields, validation, mode tabs and submit placement |
| Restored advisor details | Independent restored email, phone and code |
| Continue saved | Applicant-email field, helper text and alternate routing mode |
| Sent to applicant | Success wording, applicant details, local dates and action |
| Missing applicant details | Existing em-dash fallbacks |
| Edit request sent | Advisor recipient, feedback, announcement and Return to Home |

October 30 label revision requested during visible review: Start uses Advisor email, Advisor phone number and Advisor code. Continue uses Applicant email. These labels are saved in the shared field definitions and authored defaults; field identities, conditions and Site assignments remain the same. The user accepted the revised labels with the login page.

October 30 presentation revision: the requested dark primary title banner replaces the icon treatment. Saved, mode-specific instructions appear between the tabs and fields. Both revised modes were shown in the visible preview. The user approved the revised login layout and wording before moving to the sent-to-applicant confirmation.

The three page identities have explicit saved Storybook references for contextual links in Portal Library → Pages. Components are browsed in Storybook; no separate Library Components section is introduced. The existing 106 canonical component records are reused without adding another page/frame/field identity.

## Service and review boundaries

The Log in screen currently validates fields and routes locally. Confirmation wording is existing presentation; it is not a delivery receipt. Sent and deletion dates are computed locally for display rather than read from a delivery service, and no deletion schedule is created by rendering the page. The advisor recipient is still a placeholder. Production advisor identity, email delivery, durable handoff status and enforced retention remain integration work. The action labeled Start new application currently navigates only; whether it should clear answers is a workflow follow-up.

Accept page wording, field placement, mode behavior and the shared-component arrangement through the whole-page examples. Canonical field, frame, details-table and modal reviews do not need repeated approval.

## Verification

All six actual-story checks pass, covering required-field feedback, switching modes, independent restored bindings, confirmation fallbacks, return/start navigation, no network requests and fixture cleanup. The Storybook router accepts per-example starting paths so confirmation actions leave their page instead of accidentally matching the preview's initial Home path. Storybook TypeScript, scoped ESLint, the production Storybook build and catalog/handoff checks pass. The source/build audit resolves all 493 examples with zero errors or invalid catalog references. A browser check confirmed the complete Start form at its 500px width.
