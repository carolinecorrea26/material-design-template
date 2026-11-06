# Steps 4–5: builder and prototype publication

Implemented October 5, 2026 within the agreed provisional prototype scope. Step 6 published-data activation remains gated.

## Workflow

1. In **Site Builder → Build new site**, select a starting Library Site and choose **Start site build**. Select an existing TPA and one of its clients, add a client, or create a new TPA and client. Provide names, acronyms and required contact name/email/phone for new TPAs and clients. IDs are assigned automatically. Enter the Site name and select the single-page or multi-page template. New organization/client identities become selectable in subsequent builds.
2. Configure the copied Site Library. Page/product participation, field labels and required flags, child/state collection, optional benefits, reference rate tables, billing, branding/support overrides, structured content/configuration values and derived benefit formulas are editable. The same executable resolver validates edits and provides applicant previews. Feature inventory is descriptive; runtime behavior is edited through configuration controls.
3. Save, then use **Site review / Launch**. Open the full working journey or individual applicant pages. Record desktop/mobile acceptance with notes for every applicable page. Internal documentation pages are excluded; health-page applicability follows the source Site catalog. Run approved/declined mock payment tests per rated product, or confirm a reference-only preview where PRASE is disabled. Opening applicant pages supplies sanitized analytics with the actual saved revision.
4. **Run readiness review** records server-checked evidence for the exact payload hash and optimistic draft version. A changed draft invalidates the previous acceptance. Review notes and scenario IDs reopen with matching reviews. Browser checkboxes alone cannot satisfy service, revision or analytics checks.
5. Stage the accepted immutable snapshot in **prototype UAT**, preview it, and schedule its launch against the next upcoming release (the earliest release is selected initially). On the scheduled date, **Releases** can move that same UAT snapshot into **prototype production**. Future dates, changed UAT/production pointers, duplicate pending launches and stale drafts are rejected. Cancelled launches remain visible. Previously launched prototype snapshots are available for optimistic rollback.
6. Track each built Site's actual implementation separately in **Migration schedule**, including Majesco UAT, Preprod and Production. These planning statuses do not constitute activation or deployment evidence.

## Persistence and activation boundary

Mock builder records live in the server store and reference versioned Library drafts; full snapshots are not duplicated into localStorage. This avoids the browser quota failure encountered and repaired during acceptance. Existing non-mock persistence remains available. Mock release scheduling and execution live in the server store, independently of the release calendar's planning records.

Explicit preview links choose UAT/production snapshots and retain that environment through journey navigation and reload. Quotes, fixture payments, submission linkage and analytics resolve the matching snapshot revision. The default mock prototype still resolves its working Library. `/library/read`, the production publication head, Supabase activation and Majesco environments are not changed by prototype release operations. A production preview is a test environment, not step 6 activation.

Human visual review is an explicit per-Site gate. This implementation does not declare every Site visually accepted. Copied branding, legal content, product rules and labels must be reviewed for the new client. Existing provisional business decisions and mock limitations remain in force; no insurer integration, real payment or outbound email was added. Live vendor analytics acceptance remains outside this local mock scope.

## Verification

- Full regression suite: **972 passed; 4 PostgreSQL tests skipped**, across 92 passing test files. PostgreSQL was not revalidated in this pass.
- Additional focused checks after subsequent refinements: real-snapshot builder persistence/organization catalog/analytics acceptance, new Site isolation, template assignment and existing persisted applicant resolver regressions: **16 passed**.
- Release integration coverage: missing evidence, matching visual/service/analytics evidence, immutable UAT staging, future-date refusal, scheduled production release, stale revision refusal, rollback conflicts, restored production previews and an unchanged activation head.
- TypeScript/Vite production build and ESLint checked after implementation.
- Isolated browser acceptance: new TPA/client/Site creation; quota repair; reopen saved Site; copied applicant Home and Membership navigation; review UI at 1440px and 390px; release controls remain gated without Site acceptance. Test account/store were separate from the shared mock account and shared drafts.
- Evidence: `step45-evidence/review-desktop.jpg`, `step45-evidence/review-mobile.jpg`, `step45-evidence/releases-desktop.jpg`.

The browser checks verify the builder and release UI. They do not replace each Site's required visual signoff or claim full insurer application/service acceptance.

## Builder and Library refinement

- Site Builder has **Build new site** and **Sites in progress** tabs. All users can see builds; only the creator can edit, archive, review or change a build's release. Both the UI and mock API enforce ownership, including direct Library saves. Existing builds are resumed from the in-progress list.
- Portal Library opens on **Client information**, with the actual configured logo, client identity/support and a TPA directory. MCR Associations columns B–D supply TPA identity and client-specific administration contacts; missing source details are shown explicitly. New build contacts use persisted organization and client profiles.
- Site search is grouped and sorted by client acronym. WAEPA's standard and GI Sites share the WAEPA group.
- **Rules** contains Business rules, Configurations, URL parameters, Patterns, Flags and Validations. Existing deep links remain usable.
- **Coverage** exposes Categories, Products and Riders as tabs, plus detailed coverage tables. Effective views use enabled product/rider assignments, including scoped replacements; All exposes the complete catalog.
- The stale development backend was restarted to load the new builder routes. Restart `npm run dev` after backend script changes; Vite's front-end refresh does not reload the Node mock API.
