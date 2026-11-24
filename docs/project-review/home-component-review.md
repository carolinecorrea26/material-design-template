# Homepage review checkpoint

Current global/effective-Site requirements and retained decisions are recorded in
[the Home specification](../requirements-spec/page-review.md#home). This checkpoint
records the CHG-040 documentation fixes and CHG-041 storage reconciliation. ASCE
inherits the same effective settings; no other real Site is rolled out.

## Components and ownership

`AppShell` owns shared header/menu, support, cookie notice and footer/legal content.
Home supplies four global marketing section groups; it does not use `FormRoutePage`.

| Group | Components | Canonical Storybook examples |
|---|---|---|
| Hero | `HomeHero`, shared eligibility field controls; quote/image presentation and Start/Continue actions | `pages-home-hero--standard-quote`, `pages-home-hero--hero-image` |
| How applying works | `HowApplyingWorksPanel`, illustrations/preview, application-review and QuickDecision help | `pages-home-how-applying-works--default`; existing panel variations |
| Coverage options | `HomeCoverageSection`, `CoverageOptionsPanel`, category/product readouts, `QuickDecisionInfoBox` | `pages-home-coverage-options--default` |
| About | Optional `AssociationIntroduction`; `UnderwriterCredentials` | `pages-home-association-introduction--default`, `pages-home-new-york-life-credentials--default` |

Whole-page examples are `pages-home-whole-page--default` and `--entry-notice`.
The shared `HowApplyingWorksPanel` owns both landing-page and drawer steps.
The page supplies its shaded container and responsive layout; the drawer uses
the same illustrations, numbering, headings and bodies in the small-viewport
layout at every browser width, with each image above its text. Drawer chrome,
introductory copy and nested help state remain contextual responsibilities of
the existing drawer variant. This is global component behavior, with no Site
assignment or separate drawer step implementation.

The overlay example `pages-home-whole-page--landing-notice` reuses the entry-notice
scenario and opens its real Start link. Notice content is a detached synthetic
assignment; no notice is enabled for ASCE. Section actions remain local callbacks;
whole-page examples exercise real page navigation and the shared quote workflow
has its own integration checks.

## Fresh-start source and gap closure

- `requirements/parked/home.json` owns the global page, content slots and tool
  surfaces. Global content, field definitions and configuration defaults compile
  through the same projection for Library, prototype and Storybook. Effective-Site
  files supply assignments and overrides; other real Sites remain out of scope.
- Home applicability now includes `applying-steps-presentation`, `form-template`
  and `field-definition-checks` for Get an instant quote, alongside the existing
  required/date checks. This records existing behavior, not a second validator.
- `global/content/help.json` owns QuickDecision availability and Show more/less.
  Content bindings expose them in the Library and resolved content; the shared
  information panel reads that content, including in standalone examples.
- `quoteEligibilityPresentation` accepts an installed or detached compiled Library.
  The real Hero and its standalone story use its effective fields/options and no
  separate age-80 limit. Product eligibility remains a separate policy decision.
- The global quote-flow description names Home only. Membership has no quote helper.
  The specification no longer describes transferred Home fields/content or confirmed
  workflows as awaiting their initial rollout.

## Storage reconciliation (CHG-041)

- The four section groups compile from one Home composition and ordered mapping,
  including component membership and multi/single/legacy-preview participation.
  The prototype renders that projection; Library Pages shows its ordered sections.
- Quote/needs surface fields, order, aliases and inspection metadata are Home-owned.
  The generic `fieldSurfaces` contract belongs to shared application definitions.
  Hosted tool fields are excluded from inline Home additions and the card inventory.
- Entry-notice enablement defaults off; title/text use a typed content slot. Sites
  assign both through their Home requirements. Superseded notice configuration and
  stale saved values are ignored; ASCE remains without an enabled notice.
- Hero images have an explicit source/alternative-text slot. The missing inferred
  ASCE `hero.png` path is replaced by the inherited shared `/hero.svg` asset.
  `global/content/insurer.json` owns the insurer logo, identical Home/footer name,
  ratings and dated footnote once. Existing wording and ratings were preserved.
- Template and optional single-page artwork settings have global defaults and Site
  assignments. Template values also project into `Site.templateType`; they no longer
  depend on independently authored Site identity values for the reviewed scope.
- Runtime URL values come from global contracts for `variant` and `template`.
  Legacy preview modes are explicitly recorded without adding Site configuration options.
- The user confirmed that Home/About Coverage QuickDecision information requires an
  assigned QuickDecision product. Empty and non-QD offerings suppress that panel.
- Additional checks exposed old Library tests editing generated records and loading
  dormant clients. Active tests now use the deployment bundle; dormant-client cases
  stay parked. The theme reference also uses the real canonical assistance field.

## Verification and boundary

Run `npm run test:fresh-start` for reconstruction, Site inheritance, stale-record
replacement and Library/prototype/Storybook agreement. Focused Home, quote handoff,
field, applying-steps, coverage-panel and Storybook tests cover existing behavior,
including the standalone older-applicant quote entry and real notice overlay action.
The QuickDecision panel test checks supplied copy and expansion in both directions.
Requirements mapping, catalog drift, TypeScript and Storybook builds provide the
remaining source/build checks.

Verified 2026-11-12: 40 fresh-start and 78 focused regression tests passed, plus the
checker regression for section order, tool placement and missing assets. Four
dormant-client cases remain parked. The source suite yields between synchronous
cases so test-report IPC completes without changing assertions or time limits.
Requirements, catalog/component/handoff drift, TypeScript and targeted ESLint checks
passed. Prototype and Storybook production builds passed; both artifacts contain
matching Home section projections and all nine Home examples are in the Storybook index.

The identified documentation and storage gaps are implemented. Retained draft configurations, fictional
pricing and deferred product policies are listed in the specification; no business
values or wording are newly approved merely by this source reconciliation.


## Client configuration and copy review (CHG-076)

User decisions November 14, 2026. Content definitions/defaults stay global. A client supplies effective-Site overrides only for the declared slots in `requirements/parked/home.json#contentSlots`. ASCE currently inherits all Home defaults; no ASCE Home file or duplicate copy is needed. Library Configurations derives its Home content rows from this allowlist, and the prototype/Storybook use the same compiled content bindings.

| Home copy or asset | Client configurable | Source keys / boundary |
| --- | --- | --- |
| Hero tagline, heading and description | Yes | `home.hero.tagline`, `home.hero.title`, `home.hero.description` |
| Hero image and alternative text | Yes | `home.hero.image` as `{ src, alt }` |
| How applying works heading and introduction | Yes | `home.how-applying-works.title`, `home.how-applying-works.description` |
| Coverage options heading and introduction | Yes | `home.coverage-options.title`, `home.coverage-options.description` |
| Quote introduction heading and description | Yes | `home.quote-section.title`, `home.quote-section.description` |
| About-client tagline and paragraphs | Yes | `home.client-section` as `{ tagline, paragraphs }`; empty content hides the introduction |
| Entry-notice title and text | Yes | `home.landing-notice` as `{ title, text }`; enabled separately through `home-landing-notice` |
| Three applying-step titles/descriptions | No | `home.applying-steps` remains global, along with its three-step structure and behavior |
| Start my application, Continue application, Get an instant quote | No | `home.hero.cta-label`, `home.hero.secondary-cta-label`, `home.quote-section.action` remain global |
| Other Home-owned wording | No | All remaining Home content keys retain global defaults without Site content slots, including quote helper/loading/validation text, availability labels, notice action labels and legacy URL-preview wording |
| Product/category names and descriptions | Through the shared product presentation contract | `parked/sites/<site>/products.json` overrides global product/category definitions; the same values appear in Home, Coverage and other shared listings |
| Quote-field labels/options | Through the shared field contract | Supported Site field overrides under `parked/sites/<site>/fields.json`; no Home-only field copy model. Field helper and validation wording retains its global owner |
| QuickDecision/review help and insurer credentials | Global shared content | `global/content/help.json`, `global/content/insurer.json` and Home credential copy retain their shared owners |
| Association identity, logo and contact copy | Through shared branding/support configuration | Effective branding/support resolution; these are not duplicate Home text slots |

There are **12** permitted Home content/asset slots (five existing, seven added). Effective-Site assignments use `parked/sites/<site>/pages/home.json` → `content` → the exact source key. Omission inherits the global value. Strings must remain strings; structured values must retain their declared shape. Hero images need an allowed source and nonempty alternative text; enabled entry notices require title/text. Unsupported keys, including the protected process/action keys, are rejected by the compiler. A copy override does not enable a section or tool, change navigation, alter quote eligibility or change assigned products. The seven new slots reuse the current components and bindings.

Home’s non-copy configuration is unchanged: quote/image variant; static/animated applying steps; entry-notice enablement; existing form-template/artwork settings; effective residency options; and shared product/category presentation and ordering. These retain their existing definitions, defaults and recorded statuses. Rate availability and product assignment determine whether quoting can appear; URL preview parameters retain their separate global contract.

This checkpoint resolves the three Home copy decisions. It does not grant a blanket client override for copy on other pages; their configurability review continues page by page.

CHG-076 verification: all 67 fresh-start checks and four actual Home Storybook checks pass, plus TypeScript, focused lint, requirement mappings and prototype/Storybook production builds. Source checks cover all seven new values, isolated synthetic Site overrides, all 12 Library slots, rejected action/process overrides and invalid value shapes.


## Global mockup copy and interactions (CHG-086/088)

November 15, 2026. The supplied mockup is the global Home wording default in `global/content/home.json`: hero, quote card/action, three applying steps, coverage introduction and underwriter description. Client-name/acronym placeholders render effective branding, including ASCE, without Site-owned copies. The twelve previously approved Site content slots remain unchanged; new action prompts and step wording remain global.

HomeHero and the quote-first composition use one primary action plus a paragraph/link below. Default entry starts a new application; Continue opens Resume; welcome-back reverses the primary/secondary destinations while preserving the established reset and notice-gating rules. Shared MUI Link carries the global weight-600/no-underline presentation.

Home opts into QuickDecisionInfoBox's shared `animateOnReveal` capability through CoverageOptionsPanel. At 50% intersection, its existing icon scales/jiggles slightly for 1000ms and returns to normal, once per mounted notice. It honors reduced motion, preserves custom icon artwork and changes no layout or availability rule. No Home-specific notice/help/animation component is added.

The shared EligibilityFields group now renders real helper/error/derived-state text only, without empty reserved helper paragraphs. Its ZIP/state/DOB ordering, normal gap, date guidance, derivation, manual choice and validation remain shared by Home, quote tools and application Eligibility.


CHG-086–088 final verification: **78 Fresh-start checks and 97 focused checks passed**. TypeScript, focused ESLint, requirements mapping and component/Storybook/icon/handoff checks pass. Prototype and Storybook production bundles build successfully; public, prototype and Storybook catalogs have identical SHA-256 `51ff0996bcb99a2ac4cef20e3583c03e99e35df05cf0ac81323b0b527c7a7e57`. All 110 canonical component owners remain covered. HomeHero and QuickDecisionExplainer explicitly declare their existing shared MUI Link dependency in the global component inventory.

Browser verification confirmed global Home wording with synthetic effective branding, the primary action/continuation link, no blank helpers, 16px ZIP/state/DOB gaps at desktop and 390px width, no mobile horizontal overflow, a 1s QD reveal transform and weight-600/no-underline controls, including shared recovery/support/footer links. The shared expiration page uses the generic session wording. Timer, late-response and inline link/code expiry behavior is covered by focused integration tests. ASCE has no new Site-owned copy or configuration assignment.

## Quote eligibility boundary (CHG-133)

The quote tool previously called the application coverage resolver without a quote
context. WAEPA's military exclusion consequently produced a residency diagnostic
and disabled product selection even though military status is not a quote input.
Apply also ran full application checks and injected application-only operand fields.

The existing shared coverage and rider resolvers now accept an explicit quote
purpose. Quote fields, product/amount selections and riders remain validated, while
application eligibility, residency, verification and underwriting do not gate an
estimate or its handoff to Membership. Application callers retain the default
application context. Classification-specific configured amount schedules are
combined for quotation without fabricating a class answer. This is a global
behavior correction; no Site assignment or WAEPA-specific branch is added.

The regression checks use the authored WAEPA, WAEPA GI and AMA projections and an
actual WAEPA quote-to-Membership render. They verify enabled selections and amounts,
no military diagnostic or generated application fact fields, successful handoff,
and retained application eligibility checks.
