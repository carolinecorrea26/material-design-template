# Reuse review: Home, Membership and Eligibility

Scope: the standard-quote and hero-image Home variants, Membership and Eligibility. This is the cross-page reuse register. The user approved the existing Layout / Forms / Pages / Dialogs / Content / Reusable components organization and the manual State behavior on October 26, 2026. The final Reusable components section derives its list from canonical source placements. Shared pieces keep one definition, with page and section references. Additional cleanup suggestions remain for review.

## Comparison

Repeated placement is often reuse of the same implementation. The important distinction is whether a piece already has a shared owner or whether its code/content is maintained separately.

| Piece or section | Home | Membership | Eligibility | What is shared or repeated | Documentation / review action |
| --- | --- | --- | --- | --- | --- |
| App header, help strip and footer | Shared chrome | Shared chrome | Shared chrome | Same `AppShell`, `AppHeader`, `ClientHelpBanner` and `AppFooter` implementations | Keep their reference stories under Layout. Page reviews link to those references. |
| Application page frame and navigation | Marketing composition | `FormRoutePage` | `FormRoutePage` | Membership and Eligibility already share form layout, heading, validation summary, transitions and Next handling through the application page template | Document the template once; list each page's sections and continuation rules in its page review. |
| Page title and description | Hero-specific heading | `PageHeader`, with help chips | `PageHeader` | Membership and Eligibility share [PageHeader](http://localhost:6006/?path=/story/layout-pageheader--default); their content differs. The Home hero is a different composition | One PageHeader reference. Page examples show the actual wording and surrounding content. |
| Inputs and field errors | Quote group → `ControlledFieldRenderer` → `FieldRenderer` | `FieldRenderer` | `FieldRenderer`, including child-dialog fields | The input controls already have one [FieldRenderer reference](http://localhost:6006/?path=/story/forms-fieldrenderer--playground). Field definitions supply labels, options and validation | Keep input examples under Forms. Page docs identify the configured fields and when they appear. |
| Name rows | — | Applicant name, physician name and associated-member name | Spouse name and names in child dialog | `FieldGrid` and `FieldRenderer` are already shared. Small name-row arrangements are repeated; field IDs and applicant ownership differ | Record the common layout and differences. Keep existing pieces for now; review again when more pages use the same group. |
| DOB, ZIP and State | Quote entry | Within quote help drawer | Your information section | Home, Membership’s quote drawer and Eligibility use the same `EligibilityFields` component, including ZIP lookup, the inferred-State message and reserved feedback space | Approved: both derive State when ZIP changes and preserve manual State choices. Keep their existing adapters for quote and application form state. |
| Quote calculator | Prefilled drawer from the quote card | Help drawer collects eligibility | — | Same [QuoteCalculator](http://localhost:6006/?path=/story/coverage-commerce-quotecalculator--collects-eligibility); different entry modes | Document both modes once under Forms → QuoteCalculator. Page docs describe the trigger and values passed. |
| How applying works | Full section and menu drawer | Help drawer | — | Same [HowApplyingWorksPanel](http://localhost:6006/?path=/story/coverage-commerce-howapplyingworkspanel--page-variant), with page/drawer variants | One pattern reference, with contextual examples under Pages where useful. |
| Coverage options | Full section and menu drawer | Help drawer | — | Same [CoverageOptionsPanel](http://localhost:6006/?path=/story/coverage-commerce-coverageoptionspanel--page-variant), with page/drawer variants. Home adds a section heading/description | Document the panel once; the Home section documents its surrounding content. |
| Drawers and dialogs | Help/quote drawers and legal dialogs | Help/quote drawers | Child add/edit/remove dialogs | Existing `AppDrawer` and `AppModal` are reused. Trigger, content and completion actions belong to their page or pattern | One reference for each overlay component; contextual stories cover the real interaction. |
| Section labels | Marketing headings | `SectionDivider` for additional information | `ApplicantSectionDivider` for spouse/children | Different existing components serving different purposes | Document section headings and applicant labels separately. Similar text does not imply the same component. |
| Notices and warnings | Quote errors and configured entry notice | Membership guidance and ineligibility | Child notices, eligibility feedback and resume feedback | Shared MUI feedback primitives; page/site-specific messages and rules | Reuse the feedback presentation; document each message's trigger and content owner in its page review. |
| New York Life credentials and ratings | Home credentials plus shared footer | Shared footer | Shared footer | Home and footer use different layouts and separate content properties. Their default ratings arrays repeat the same values | Review a shared content source before creating any additional UI component. Preserve section-specific copy and formatting. |
| Story review form and spacing | Home frame/provider helper | Membership form helper | Eligibility form helper | The two form helpers repeat the review button, result message and container styling. Their field/site/collection setup differs | Low-priority documentation-support cleanup. A small shared review frame may help later; no generalized form framework is needed. |

## DOB / ZIP / State: agreed behavior

| Detail | Quote input group used by Home and Membership | Eligibility page section |
| --- | --- | --- |
| Source | [EligibilityFields](../../src/components/forms/EligibilityFields.tsx) | [EligibilityFields](../../src/components/forms/EligibilityFields.tsx), called by EligibilitySections |
| Field configuration | `quoteInputs` surface | Configured Eligibility page fields |
| Value ownership | Parent-owned `birthday`, `zipCode`, `state` values mapped to configured fields | Application form values such as `birth-date`, `zip-postal-code`, `state-province` |
| State lookup | Shared `deriveStateProvinceFromZipOrPostalCode` utility | Same utility |
| Manual State change after ZIP lookup | Retained until ZIP changes | Retained until ZIP changes |
| Feedback | Shared reserved helper space, ZIP-derived State confirmation, quote field errors and quote-level age validation | Same reserved helper space and confirmation, with application validation and configured residency restrictions |
| Layout | ZIP → State → Birthday | ZIP → State → Birthday |

Approved October 26: derive State when ZIP changes, allow manual State selection, and retain that selection until ZIP changes again. Eligibility also hides the ZIP-derived confirmation after a manual selection. The existing controls and ZIP lookup utility remain shared; quote and application wrappers retain their field configuration and validation rules.

## Documentation approach

Use [application frame → page sections → shared pieces](component-documentation.md) to describe primary ownership and composition. The saved component JSON records each role, direct component dependencies and internal parts. The existing Layout / Forms / Pages / Dialogs / Feedback / Transitions hierarchy remains the browsing organization, with the reusable index projected from the same definitions.

- **Application frame:** common shell, page surfaces, steps/breadcrumbs, heading/Back, help slot, form handling, notices, transitions and Next.
- **Page sections:** the main page-specific compositions in page order, with their own rules and content.
- **Shared pieces:** fields, product cards, repeatable records, help compositions, content, feedback and overlays used inside frames and sections.

Give each shared component or pattern one reference location. A page section can still render that same implementation: it is a usage example, rather than a second component definition. Keep contextual stories when they demonstrate different content, layout, configuration or behavior. Avoid repeating the shared component's prop documentation under every page.

The standard Docs addon is currently unavailable in this project. Use the existing CSF descriptions for short visual context and repository review tables for the reuse register and decisions. No custom Storybook documentation interface is proposed.

### Shared reference record

| Field | What to record |
| --- | --- |
| Piece / pattern | Familiar visible name and actual implementation |
| Purpose | What the user does or sees |
| Role | Application frame, page section or shared piece; independent of browsing category and reuse count |
| Contains / internal parts | Canonical component references plus owned exports, native elements, actions and slots |
| Used in | Page → section references |
| Variations | Differences in layout, configuration or behavior |
| Examples | Existing Storybook examples for meaningful states |
| Review status | Already shared; similar composition; repeated behavior/content; or page-specific |

For example, **Quote calculator** has one implementation (`QuoteCalculator`), appears in **Home → Hero** and **Membership → Contextual help**, and has two relevant entry modes: eligibility already known and eligibility collected inside the drawer.

### Page section record

Use this compact table as we review further pages:

| Section | Pieces | Shared reference | Page-specific behavior | Review status |
| --- | --- | --- | --- | --- |
| Home → Hero, quote card | Heading, DOB/ZIP/State, quote button | EligibilityFields; QuoteCalculator | Validate the card, show loading, pass eligibility into the drawer | Shared patterns in a Home section |
| Membership → Contextual help | Help chips, drawers in the frame help slot | MembershipHelp; HelpChips; AppDrawer; coverage/applying/quote patterns | Chips choose the help content; quote tool collects eligibility | Already shared pieces |
| Eligibility → Your information | ZIP/State/DOB and feedback | FieldRenderer; ZIP lookup utility | Derived-State behavior, confirmation and site residency rules | Shared EligibilityFields group and reserved feedback space |
| Eligibility → Spouse information | Applicant divider, membership question, name, DOB | ApplicantSectionDivider; FieldGrid; FieldRenderer | Visible after spouse selection; separate spouse field IDs | Shared pieces in a page-specific section |

## Recorded decisions and follow-ups

1. **Approved and implemented:** Eligibility follows the quote group: ZIP changes derive State; manual State changes persist. Keep the existing simple organization and document shared components once, with page-specific section examples.
2. Review the insurer ratings content used by Home and the footer. Consider one shared content owner while keeping their presentation distinct.
3. Continue noting repeated name layouts as further pages are reviewed. The current FieldGrid/FieldRenderer reuse is sufficient for these three pages.
4. Consolidate Storybook helper presentation only if it becomes a maintenance burden. This is separate from product components.

## Evidence and limits

Inspected the three page implementations, their extracted section components, shared field/layout/overlay implementations, help-content compositions, content defaults and Storybook sources. Story reference IDs in this review were checked against the existing story inventory/build. The accepted manual-State correction is implemented in Eligibility. The wider reuse comparison is a source/documentation review and does not establish visual/accessibility acceptance.

Related page inventories: [Home](home-component-review.md), [Membership](membership-component-review.md), [Eligibility](eligibility-component-review.md), [Coverage](coverage-component-review.md).

## October 27 structure reconciliation

The prior page reviews now state their frame explicitly. Eligibility has four content sections; its duplicate Introduction heading example was removed because PageHeader belongs to the frame. Membership’s contextual help is page-supplied content within that frame; its existing story ID is retained. Home keeps its marketing composition, Coverage keeps exactly two content sections, and Beneficiary keeps its participation and applicant/product records with dialogs owned by the page. Whole-page examples demonstrate composition without creating additional component identities.

See the [reviewed-page structure checkpoint](reviewed-page-structure.md) and the next [Contact review](contact-component-review.md).
