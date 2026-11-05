# Membership page section review

Current component/application ownership is defined by the [standalone boundary audit](standalone-component-boundaries.md). Section examples receive explicit inputs; whole-page and workflow examples retain application rules.

Documentation follows [application frame → page sections → shared pieces](component-documentation.md). Shared definitions retain one owner and canonical reference. Current Storybook examples use [global template capabilities](global-template-review.md); earlier Site-specific verification below is historical source evidence.

## Application frame

`AppShell` provides site chrome. `FormRoutePage` owns the form surface, progress, `PageHeader` (title, Back and help slot), validation feedback, transitions and Next. `MembershipHelp` supplies the page-specific help slot; the heading is frame context in that example. Shared references: [application page template](http://localhost:6006/?path=/story/application-patterns-application-page-template--standard-form-page), [PageHeader](http://localhost:6006/?path=/story/layout-pageheader--default).

## Page sections and shared pieces

Shared pieces and documentation proposals: [cross-page reuse review](page-reuse-review.md).

Review the page's own sections under **Pages → Membership**, in page order, without numbering. Shared app header/footer, form layout, progress navigation and Next action remain in their existing component/template stories.

| Main section | Pieces | Implementation / Storybook |
| --- | --- | --- |
| Contextual help (frame help slot) | Coverage-options chip, applying-steps chip, estimate chip and their drawers | Existing `PageHeader`, `HelpChips`, `AppDrawer` and `QuoteCalculator`; the page's help composition is now `MembershipHelp`. [Review](http://localhost:6006/?path=/story/pages-membership-introduction-and-help--default) |
| Membership status | Membership question, association/professional/member-status choices, eligibility feedback and non-member guidance | Existing page markup moved into `MembershipStatus`, using `FieldRenderer`. [Review](http://localhost:6006/?path=/story/pages-membership-membership-status--default) |
| Member information | Title when configured, first/last name, email, phone and phone type; field validation | Existing page markup moved into `MemberInformation`, using `FieldGrid` and `FieldRenderer`. [Review](http://localhost:6006/?path=/story/pages-membership-member-information--default) |
| Additional membership information | Section divider, configured notes, membership ID or professional questions; conditional physician and WAEPA details | Existing page markup moved into `AdditionalMembershipInformation`. [Review](http://localhost:6006/?path=/story/pages-membership-additional-membership-information--member-id) |

## Section examples

- **Membership status:** standard question, non-member guidance, association selector, physician selection, new/current WAEPA member choices.
- **Member information:** standard fields and configured Title field.
- **Additional membership information:** member ID, veterinary/professional information, physician-spouse details, WAEPA new-member declaration/qualification, federal employee details, associate-member details.
- **Contextual help:** all three chips open their actual existing help/calculator content.

## Removed lookup step

The applicant-facing AMA record lookup dialog and its Storybook examples were removed following the user's October 26 review. Membership continues through the normal form flow without this extra DOB/lookup step.

## Reuse and behavior

The live Membership page uses these same section implementations. Membership still owns association selection, follow-up visibility, eligibility gating, saved values and navigation. WAEPA answer-clearing behavior is preserved. The additional-information section keeps its existing conditional pieces together rather than introducing a separate component for every field group.

Section stories use the site's resolved field registry, visibility conditions and real form validation. Without an installed saved prototype library, Storybook uses the registry's fallback configuration. They demonstrate representative section configurations; they do not certify every client's stored requirements or the complete Next/navigation flow.

## Verification

- Storybook production build and source/build audit passed; 14 Membership section examples are indexed.
- TypeScript and targeted ESLint checks passed.
- Membership collection and saved-configuration tests passed. Regression checks confirm AMA continues without a lookup dialog or an extra DOB step, while required-field validation still applies.
- Browser checks covered section rendering, member/non-member feedback, required-field validation, and help drawers.

Layout, wording and reuse decisions remain open for review. This is not a completed accessibility acceptance pass.
