# Homepage section review

Current component/application ownership is defined by the [standalone boundary audit](standalone-component-boundaries.md). Section examples receive explicit inputs; whole-page and workflow examples retain application rules.

Documentation follows [application frame → page sections → shared pieces](component-documentation.md). Shared definitions retain one owner and canonical reference. Current Storybook examples use [global template capabilities](global-template-review.md); earlier Site-specific verification below is historical source evidence.

## Application frame

`AppShell` owns `AppHeader`, `ClientHelpBanner`, `AppBody` and `AppFooter`. Home supplies its marketing sections; it does not use `FormRoutePage`. Hero headings and entry actions belong to `HomeHero`. Shared references: [application page template](http://localhost:6006/?path=/story/application-patterns-application-page-template--standard-form-page), [PageHeader](http://localhost:6006/?path=/story/layout-pageheader--default).

## Page sections and shared pieces

Shared pieces and documentation proposals: [cross-page reuse review](page-reuse-review.md).

Scope: standard quote (`default`) and hero image (`hero-image`) homepages. Review sections in page order under **Pages → Home** in Storybook. Pieces stay within their section unless later page reviews establish a reason to share them separately.

| Section | Pieces included | Storybook example |
| --- | --- | --- |
| Hero — standard quote | Member badge, heading, description, entry actions, resume link; quote card with ZIP, State, Birthday, validation, loading and prefilled calculator drawer | [Standard quote](http://localhost:6006/?path=/story/pages-home-hero--standard-quote) |
| Hero — image | Same introduction/actions alongside the association photograph | [Hero image](http://localhost:6006/?path=/story/pages-home-hero--hero-image) |
| How applying works | Heading, three steps, illustrations and working application-review/QuickDecision help drawers | [How applying works](http://localhost:6006/?path=/story/pages-home-how-applying-works--default) |
| Coverage options | Heading, description, category tabs and product information | [Coverage options](http://localhost:6006/?path=/story/pages-home-coverage-options--default) |
| Association introduction | Optional association logo, tagline and descriptive paragraphs; uses existing AMA content to show this section | [Association introduction](http://localhost:6006/?path=/story/pages-home-association-introduction--default) |
| New York Life credentials | Logo, name, tagline, description, ratings and footnote | [New York Life credentials](http://localhost:6006/?path=/story/pages-home-new-york-life-credentials--default) |

Header and footer are reviewed through the shared stories under **Layout → AppHeader / AppFooter**; they are not duplicated in the Home group.

## Implementation

The live Home page and section stories use the same implementations. The existing inline hero, coverage section, association introduction and insurer credentials were moved into section files in `src/components/home/`. The quote-entry card remains a local piece of the hero. Existing header, applying-steps panel, footer and shared components are reused.

Shared component stories retain their existing locations and IDs. The Home group provides a page-ordered review of their homepage use. The theme toolbar changes colors; it does not switch the active site's product configuration.

Hero Apply and Learn more actions report their selection within the isolated story. In the actual page, Home continues to own routing, notice handling and scrolling. Quote validation and the quote drawer use the real components. Other homepage variants, single-page application sections and their supporting interactions are outside this review scope.

## Verification

- TypeScript compilation and targeted ESLint checks.
- Storybook production build; all six Home section examples present in the generated index.
- Existing Home entry-notice and applying-steps tests: eight tests passed.
- Storybook source/build audit: zero invalid component examples.
- Browser checks from the initial section review: all section examples render; quote required errors, ZIP-derived State, prefilled calculator drawer, review-to-QuickDecision help flow and shared footer legal modal verified.

These checks establish source/build coverage. Section content, responsive layout and interactions remain reviewable in Storybook; they are not a completed accessibility acceptance review.
