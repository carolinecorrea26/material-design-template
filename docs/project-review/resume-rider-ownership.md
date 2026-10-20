# Rider ownership checkpoint — October 19, 2026

Resumed at the user's request after the restart pause. Stable rider identities/scoped properties, rider choice-amount ownership, shared routing rules, Site page participation and shared field control/format ownership are implemented. Quote prefill now transfers actual collected answers into the rendered application controls. The current decision register is [ownership-and-cleanup-plan.md](ownership-and-cleanup-plan.md); **Step 1 remains open**.

## Implemented

- `src/migration/riderOwnership.ts` compiles the explicit program/source crosswalk into 14 active global identities and 23 relationships across 59 business Site/product contexts. All contexts have the relational rider-set marker, including empty sets. Original definitions, source-only rows and decision evidence remain preserved.
- `src/domain/riderOverrides.ts` validates effective definitions and allowed per-property overrides. `product-rider-override` values belong to Products & riders, with Client inheritance and Site precedence. Identity and premium factors stay outside this override contract.
- Effective configuration, product projection and compatibility client views read the relational relationships. An explicit empty GI set stays empty even when the shared Client has rider property values.
- Draft edits update only scoped properties, availability and order. Copies retain stable rider keys and independent scoped values. Nullable pricing is preserved.
- Executable selection-policy references and journey rider-code mappings use stable keys. Journey reapplication preserves archived decision snapshots. Older captured revisions keep legacy whole-array precedence.
- The reviewed seed export and [product ownership comparison](product-ownership-comparison.md) are regenerated. Saved drafts/releases, private mock state, applicant records and data-bearing databases are not rewritten.

Verification passed: 201 distinct focused tests across 17 files, including 16 rider ownership regressions and the full 1,834-case persisted journey matrix. TypeScript/build, targeted lint, reviewed seed integrity and comparison generation passed. The existing Vite bundle-size warning remains.

## Subsequent rider amount batch

Seven selection policies now link 12 exact rider amount assignments rather than storing independent choice arrays. Structured patterns/bands/options own choices; selection policies own caps, defaults, dependencies and applicability. Mapped ASCE, AMA and AVMA choices/caps are checked against pinned `Riders!C43/D43`, `C45/D45`, `C46/D46` and `C36`; CSEA retains its accepted separate attached-benefit choices. Existing amount controls derive choices from the same records as election reconciliation. Original presentation metadata remains evidence, with no fallback over broken references.

Site copies clone/remap referenced assignments and patterns. Descriptive draft edits remain available; linked amount/default edits belong to Rules records. Captured v1 policies and saved records retain historical behavior. Journey reapplication preserves linked policies. Reviewed seed exports and the comparison are regenerated; restart an already-running mock service to load them.

Verification passed: **113 distinct tests across 12 focused files**, including 13 rider amount ownership regressions and all **1,834 persisted journey mapping cases**. Checks cover source drift, unchanged candidate policies, edited controls/elections, broken references, copy isolation, descriptive draft edits, archived policies, journey reapplication, existing rider identities, structured product amounts, Coverage rendering and runtime decisions. TypeScript/application build, targeted lint, reviewed export integrity and comparison regeneration passed. The existing Vite bundle-size warning remains; live database/backend parity and complete release/history acceptance remain separate work.

## Subsequent reusable routing rule batch

Six existing template page gates now execute from five shared rule definitions. Existing rule assignments own applicability; `routing.gates` selects exact rule keys. Installed navigation and compatibility settings derive the same gates. The Library distinguishes executable routing from documented/planned behavior. Source-only imported actions and planned routes remain inactive.

The compiler preserves the original arrays/rule definitions as evidence. Broken, ambiguous, conditional, planned and unsupported routing references fail; new arrays cannot override linked routing. Scoped reference selections and copied assignments are supported. Historical array-based payloads stay readable with their original semantics; no new snapshot table or SQL schema is required. Reviewed seed/comparison regeneration does not rewrite saved records or data-bearing databases.

Verification passed: **148 distinct focused tests across 13 files**, including 15 routing ownership regressions, the Library execution-display regression and all **1,834 persisted journey mapping cases**. Checks cover unchanged six-gate behavior, shared identities, scoped references/copies, missing/ambiguous/planned/conditional/unsupported rules, archived arrays, source preservation, installed routing, condition evaluation, Coverage runtime, rider ownership and snapshot immutability. TypeScript/application build, targeted lint, reviewed seed integrity and comparison regeneration passed. The existing Vite bundle-size warning remains; live database/backend parity and full release/history acceptance remain separate work.

## Subsequent page participation batch

The nine business Sites now use a version 2 participation marker: `sitePages` owns all 270 existing assignments, and 16 repeated configuration values are retired with evidence preserved. Compatibility page modes/lists derive from those same rows, including disabled unassigned pages. ABE Beneficiary stays optional; current health assignments stay required and retain independent routing gates. Explicit stored health exclusions now agree across navigation, the page catalog and marked visibility summaries. WAEPA Contact behavior is preserved.

The compiler rejects malformed/conflicting copies before mutation. New reads reject ambiguous markers, wrong scopes, competing copies and invalid relationships. Copied Site assignments and subsequent draft edits stay independent. Old payloads keep their legacy settings and health summaries. No new table/SQL schema, saved-record rewrite or data-bearing database update is performed. Reviewed seed/comparison regeneration is separate from restarting an existing mock service.

Verification passed: **95 distinct focused tests across 14 files**, including 14 page-participation ownership regressions and all **1,834 persisted journey mapping cases**. Checks cover all 270 assignments, zero remaining business configuration copies, legacy array precedence, installed navigation, health exclusions, optional modes, malformed/conflicting source values, broken ownership markers, copy/draft isolation, historical payload preservation, WAEPA Contact and snapshot immutability. TypeScript/application build, targeted lint, reviewed seed integrity and comparison regeneration passed. The existing Vite bundle-size warning remains; live database/backend parity and full release/history acceptance remain separate work.

## Subsequent shared field ownership and quote prefill batch

Global `fields` owns shared input control type and format through the version 2 `field-definition-ownership` contract. The compiler preserves the original validation rows as evidence and retires 186 copied control types and 37 copied formats. The 159 required constraints keep their previous validation precedence for now. Pages, quote/calculator surfaces and repeated fields share one definition resolver; scoped overrides still apply afterward. Source conflicts and duplicate properties fail before mutation. Marked reads reject competing presentation properties, including on unplaced fields. Unmarked historical captures retain their original validation precedence without being rewritten. No table or SQL schema change is needed.

The requested quote prefill check is implemented through the central quote transition. Actual collected fields, including Site additions, govern transfer. Applicable contextual answers transfer too; blank inputs preserve previous answers and current canonical quote answers take precedence. Existing answers initialize quote inputs. Selected products, applicants and amounts still transfer together, and Eligibility location carries into empty Contact controls.

Three rendered regressions use the installed reviewed prototype, real form/session providers and actual Membership, Eligibility, Coverage and Contact pages. They check Life DOB/ZIP/state/gender/nicotine, Disability income/hours/self-employment/years, Office Overhead expenses/responsibility and contextual facts, plus selected products/applicants/amounts. A discovered decimal-input defect is fixed in the shared eligible-expense fraction definition: `0.75` now stays `0.75` in the quote and corresponding Coverage control.

Reviewed seed/comparison regeneration preserves saved drafts/releases, private mock state, applicants and data-bearing databases. Restart an existing mock service to load the new reviewed seed; saved releases need an explicitly migrated/new draft.

Verification passed: **200 distinct focused tests across 19 files**, including the three rendered quote scenarios, six shared-field ownership regressions and all **1,834 persisted journey mapping cases**. TypeScript/application build, targeted lint, reviewed seed integrity and comparison regeneration passed. One optional SQL-export test remains conditionally skipped. The existing Vite bundle-size warning remains; live database/backend parity and full release/history acceptance remain separate work.

## Next Step 1 work

User follow-up: the decimal statement refers specifically to preserving the decimal point in an existing Office Overhead fraction input (`0.75`), not a new business requirement. The user rejected the unsolicited saved-revision warning banner and automatic "Jurisdiction or military status is excluded" alerts. Those automatic displays are removed from the application shell and Coverage/quote cards. Saved-revision tracking, submission revalidation and stored eligibility enforcement remain intact; this presentation correction does not approve new eligibility rules or change source restrictions.

Next concrete Step 1 batch: reconcile remaining required constraints and field/configuration properties across shared `fields`, `validationRules` and scoped `siteFieldConfigurations`. Shared control types/formats are consolidated above; do not reintroduce validation copies. Continue source mapping for currently unmodeled/source-only rider amounts and modifiers and remaining provisional source gaps. The seven choice-policy ownership boundaries above are implemented; empty dependency/incompatibility lists and unavailable rates are not certified by that consolidation. Continue the other reusable rules/conditions, remaining page/flow exceptions, field validation/configuration, settings and content reconciliation. The six routing gates above are consolidated, but do not close those broader subjects. Remaining membership/configuration reader migration is Step 2.

Preserve the accepted AMA DI sharing and R38 identity, distinguish R39/R40, keep program CIR identities separate, and retain CSEA attached-benefit identities separately from standalone AD&D. Do not merge identities by labels or definition hashes.

St. Louis remains provisional. Lifecycle workflows, Site Builder design and detailed PDF/XML remain deferred. Do not reopen accepted business decisions without new contradictory evidence. Restart an already-running mock service to load regenerated seed files; preserve private saved state and use an explicitly migrated/new draft for existing releases.

The many other workspace changes belong to earlier work; do not reset or discard them.
