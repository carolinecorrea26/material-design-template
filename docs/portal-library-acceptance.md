# Portal Library acceptance criteria

Updated October 22, 2026 from the user's explicit corrections in this chat.

## Fields catalog decision — October 22, 2026

The user approved a catalog table with usage and rules separate. This supersedes the October 9 Fields columns below. Fields shows one saved definition per ID: ID, label, input type, format and options. Labels retain their Storybook links, and long option lists remain collapsed. Page and section usage is a separate expandable table. Required status and visibility belong under Business rules and Validation; neither requirement nor order is a field catalog column.

Generated product/applicant control IDs are usage instances, not extra database field records. Repeated payment, quote and collection controls reference their saved definition. Coverage controls generated from product configuration remain in usage. ABE's CI and supplemental DI questionnaire references must also appear. The ABE document uses these same projections; regenerate its field and usage tables with `node scripts/build-abe-fields-document.mjs` and verify parity with `fieldCatalogRows.test.ts`.

## Change boundary

Only change the UI element or data behavior specifically requested. Do not combine a correction with changes to other tabs, columns, column widths, typography, colors, labels, filters, preview controls, or layout. A request to remove the table above the Flow tabs authorizes removing that table; it does not authorize redesigning Flows or the Library.

Do not replace an interactive preview, diagram, editor, or purpose-specific table with a generic database-record view. Do not turn a data-correctness fix into a presentation rewrite. Record any necessary additional change and its concrete reason before implementing it.

The current display has been rejected by the user. Passing tests does not establish visual acceptance. The exact latest display regression remains open until identified and corrected; do not mark the Library display complete based on the earlier test results.

## Required behavior

| ID | Acceptance criterion | Verification |
| --- | --- | --- |
| LIB-01 | Canonical Review, Template Standards and Components are absent from Library navigation. Branding & Design remains available. Analytics is the last domain, including when Site Preview is present. | Navigation regression test; check All and a selected Site. |
| LIB-02 | Validation is its own domain tab, not a dataset inside Pages or Fields. It shows understandable validation rules and error messages by page and field, required status and conditions. It has no generic Records selector or raw-record presentation. | Validation navigation and rule/message assertions; visually inspect a conditional AMA field. |
| LIB-03 | Search is the first control, at the far left of every table's filter section. Additional view selectors and categorical filters follow it. Export actions stay separate. | Assert first filter control in Pages, Fields, Validation and Analytics; check desktop and wrapped layout. |
| LIB-04 | Page listings and page-based field views follow Home → Membership → Eligibility → Coverage → the remaining configured application sequence. Fields on each page follow their configured order. Pages includes fields without section relationships, including Home inputs. | Model ordering test; browser check of the first three page rows and their field links. |
| LIB-05 | A selected Site shows its effective fields and definitions, including scoped additions and overrides. Hidden or excluded fields do not appear as collected inputs. Definitions must be resolved per page, not borrowed from another page's occurrence of the same field. | Compare each active Site/page with its resolved included fields; check field link destinations. |
| LIB-06 | ASCE Membership includes the required Membership ID field (`asce-member-id`) under its additional membership information. AMA Membership includes all six physician fields for the Spouse of Physician member type, with that condition visible. Both appear in Pages and Fields and in applicable Validation rows. | ASCE/AMA model and navigation tests; browser spot checks. |
| LIB-07 | Effective client page lists exclude internal reference pages such as Design System, Site Details, Portal Admin and the old mock email page. Related section/field listings use the same scope. | All-active-Site scope tests; browser check. |
| LIB-08 | Eligibility child collection inputs link to their actual field rows. A Site configured for notice-only child eligibility does not list child detail inputs as collected. Do not reintroduce the removed child explanation banner. | WAEPA/CSEA collection tests and link round trip. |
| LIB-09 | Flows retains its flow selection tabs and diagrams, with the selected flow in the URL. There is no Flow table above the tabs. | Flow navigation test; visual diagram check. |
| LIB-10 | Branding & Design retains its interactive previews and controls; it is not replaced with a generic table. | Existing branding navigation test; visual check. |
| LIB-11 | Communications retains working email mockup and HTML previews for All and a selected Site. Older email-preview links reach the current Library preview with Site context retained. | Email navigation tests; open an actual preview. |
| LIB-12 | CSEA is configured as a single-page Site in the source configuration, persisted Library export and applicant configuration. Its existing no-PRASE pricing policy stays in force. | Registry and persisted applicant tests; exported Site assignment; Templates browser check. |
| LIB-13 | Stored Library read failures produce a clear error, not an empty or substituted catalog. Saving or regenerating data must preserve unrelated Site settings and drafts. | Existing read-error test; inspect change scope. |
| LIB-14 | Admin Center uses normal responsive breakpoints even when the applicant Site uses a single-page template. At 1200px and above, Library tabs form a narrow left rail with content beside it; below 1200px, horizontal tabs sit above content. Tab orientation and layout use the same theme breakpoint. Vertical tabs must never span the full width and push content below the rail. | Regression test through AdminCenterShell with a forced-mobile outer theme; browser checks at 2054×1167 and 900×900. |

## Verification before reporting completion

1. List the requested criteria being changed and the files affected. Check that unrelated presentation has not changed.
2. Run the relevant regression tests, TypeScript/build checks and lint for changed files. Data audits must cover the selected Site's actual scoped configuration, not only baseline catalog placements.
3. Inspect the affected view in the browser. Check the specified control and nearby unchanged layout at the same viewport; include All and a selected Site when scope matters.
4. Distinguish data/test results from visual verification. Never describe a passing build or DOM assertion as proof that the whole Library display is correct.
5. Report exactly what changed and any unresolved regression. Leave failed or unverified criteria open.

## Screenshot regression and verification

The October 5 screenshot shows CSEA's vertical Library tabs spanning the entire width and pushing Pages below the fold. CSEA's single-page applicant theme had forced the global desktop breakpoints to 1,000,000px, while Library tab orientation used a separate 1200px media query. AdminCenterShell now supplies its own normal responsive theme, and Library orientation uses the same theme breakpoint as its layout. This fixes the specific mismatch without changing CSEA's single-page applicant assignment.

Verified CSEA Pages at 2054×1167: narrow left tab rail, Pages content alongside it, search first, Home → Membership → Eligibility. At 900×900, horizontal tabs appear above Pages. Desktop evidence: `migration-artifacts/portal-library-layout-desktop.jpg`. The regression suite passes 54 targeted tests, including the Admin shell boundary, active Site/page field parity, ASCE/AMA fields, validation, preview routing and flow-table removal. These checks establish the stated behaviors; they do not designate unrelated Library presentation as user-approved.

## Regression check locations

- `src/pages/admin/libraryNavigation.test.ts`: navigation, rich previews, search placement, scope and field link behavior.
- `src/pages/admin/library/storedLibraryModel.test.ts`: page order, active Site/page field parity, scoped membership fields, child collection behavior and internal-page exclusions.
- `src/data/model.test.ts`: CSEA's Site template assignment.
- `src/domain/prototypeLibrary.test.ts`: persisted CSEA single-page configuration and suppressed calculated pricing.
- `src/utils/fieldValidation.test.ts`: validation descriptions and executable form checks share the same source.

Earlier notes in `portal-library-refinement.md` are historical where they conflict with these explicit corrections.

## Fields presentation follow-up — October 9, 2026

The latest Fields request supersedes earlier requirements to expose collection keys or display conditions in Fields. Pages is accepted and remains unchanged. Fields now shows Field (label linked to its Storybook control, plus field ID), Input type, Where it appears, Order within that area, Requirement (Required/Optional), and Options. Page and section are combined into a named surface; shared quote and needs calculator drawers are separate surfaces. When shown and raw Details are removed from this view. Conditions remain available in Validation. Lists longer than five options start collapsed.

Saved page definitions remain authoritative. Shared-tool placement metadata and tool-only definitions come from the existing inspection inventory, gated by the saved Site page/product and quote policy. Product-dependent options without a fixed definition are identified as determined by selected products; they are not invented as fixed options. No catalog data is written.

Browser checks: All option lists collapse and expand; ASCE shows page and quote drawer placements at 2054×1167; the 900×900 view retains horizontal Library tabs and wrapped filters. These checks verify the requested change, pending user review.

### Field completeness and source-driven headings

The October 9 follow-up confirms spouse contact is present and requests a complete inspection inventory independent of journey selections. Field and section visibility conditions are not evaluated by this table. The existing renderer inventory supplements component-owned and repeated inputs using the selected saved Library setup, including phone-type selectors, health detail records, beneficiary editors and product controls. Static Site exclusions and notice-only child sections remain distinct from journey-dependent visibility.

Coverage headings follow the configured applicant and section description. Unnamed conditional groups inherit the preceding named subsection for that applicant, so tobacco follow-ups appear under Member/Spouse Personal Details. Work & Income and Business Details retain their actual configured headings. Ordering follows section placement and field position, including nested phone selectors. There is no separate Coverage label map in the Library. Regression tests change setup headings and positions and verify that the Library follows those changes, and check all saved section-field relationships.

### Internal applicant terminology

Library placement headings use the shared applicant mapping in `libraryApplicants.ts`: You/Self/Member → Member; Your Spouse/Spouse → Spouse; child/children/Your Child(ren) → Child. Section applicant metadata remains authoritative, and descriptive component headings use the same mapping. Applicant-facing form titles, actual field label copy, persisted applicant keys and field IDs are preserved. Regression tests cover aliases, embedded IDs, section headings and unchanged applicant-facing setup titles.
