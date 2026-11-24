# Shared page help

November 13, 2026 — CHG-067. Page help is a global capability. No page-specific help component owns chip selection or drawer behavior.

| Shared component | Responsibility |
| --- | --- |
| PageHelp | Receives explicit topics, owns the selected topic and composes the two views. Empty topics render nothing. |
| PageHelpChips | Receives topic IDs/labels and a selection callback; preserves the shared responsive chip row. |
| PageHelpDrawer | Receives the selected title/content and close callback; uses AppDrawer for responsive layout and closing. |

Membership selects coverage options and applying; Beneficiary selects definition and percentage share; Payment selects payment-information handling. Their global page files own `help` topic IDs, order and label/title content references. The compiler validates and resolves those records into `pages.definition.help`. Library, prototype and Storybook read the same projection; installed projections cannot fall back to stale or parallel page-help lists. `helpContent.tsx` binds supported topic IDs to reusable content or generic paragraph/section renderers, using the current effective content when rendered. Topic content can be shared with menu tools; it does not own page-help state. ASCE inherits these global choices; no other real Site is enabled.

All five Health routes and the supplied source-form previews have no help chips. HealthInformationHelp, MembershipHelp and ConfiguredMembershipHelp are removed. Old component records and unused Health explanation content are explicitly retired during source compilation. The chip component has one canonical name, PageHelpChips. Analytics help labels/selections come from the same global page definitions.

Home/menu tools, coverage carts, calculators, document viewers and other task drawers retain their purpose-specific content within the existing shared AppDrawer or dialog shell. They are not separate implementations of page-help chip/drawer behavior. Header/footer support remains its shared support component.

Canonical Storybook examples cover the chip row, controlled drawer, multiple/single/no topics, using explicit fresh-start content. Focused verification covers source projection/retirement, Site-independent opening/closing, removal from every Health example, and the three remaining page compositions. Verification passed: 73 focused checks, all 57 fresh-start checks, application/Storybook TypeScript, scoped lint, requirements mapping, component/icon audits and both builds. Browser checks confirmed a Health page without chips and a generic help topic opening the correct shared drawer. The public, application-build and Storybook catalogs share SHA-1 `4198fe689ce1d65d21a7f67f97e98fa309d5dcf6`. This shared change does not complete the remaining Payment, DocuSign or Receipt final page audits.
