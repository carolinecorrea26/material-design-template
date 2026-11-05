# Health Storybook pages

October 28, 2026. Each of the six implemented Health routes now has a separate entry under **Pages → Health**. These are production page compositions in the existing application frame. The completed [Health component/documentation review](health-component-review.md) records shared ownership, corrections, verification and deferred source/service boundaries.

| Storybook page | Route | Examples |
| --- | --- | --- |
| Simplified Issue | `health-si` | Member only; member and spouse |
| QuickDecision | `health-qd` | External questions loading |
| Life | `health-li` | Member only; member and spouse; full configured source form |
| Disability | `health-di` | Member only; member and spouse; configured supplemental form |
| Critical Illness | `health-ci` | Member only; member and spouse; California wording |
| Chronic Illness Rider | `health-cir` | Member only; member and spouse |

The five questionnaires use real field configuration and validation, with fictional coverage selections and answers held in React state. Member and spouse answers remain independent. Answering Yes reveals the applicable detail controls. Back and Next stop at a local destination message. Changing examples remounts their local answers.

Simplified Issue uses the saved association-scoped SI pathway. Life and Disability demonstrate the standard question sets. Critical Illness uses its configured source questionnaire. Chronic Illness Rider explicitly enables the supported rider page on a detached preview fixture and selects the rider; the underlying saved catalog is unchanged. These examples do not exhaust all source questionnaire variants.

QuickDecision retains its own page and loader while the externally hosted questions load. The Storybook example stays pending without a timer-generated error, simulated questions or a Next action. The application keeps its existing timeout/recovery behavior. No external QD questions were supplied.

`src/dev/storybook/healthStories.test.tsx` renders all fourteen production-page examples, checks the expected question/applicant counts, exercises independent Yes selections, verifies that the source catalog stays unchanged, and confirms fixture cleanup after unmount. The existing standalone-story regression suite also covers the shared application example's neighboring page components.

## Supplied form pages

**Pages → Health → Forms** contains a separate page for every supplied source section: 17 named workbook labels plus the separately recorded GPA-DI-EZ-3 variants section. There are 18 pages and 41 examples, with member-only and member-and-spouse examples for every form, plus WAEPAWL Simplified Issue, GPA without tobacco, California CI examples, and restored supplemental details.

These standalone form previews use the shared page/form surfaces, HealthQuestion, field renderer, applicant divider and repeatable detail editor. They keep answers local and preserve the original source wording and notes in an expandable reference. They do not install or modify a Site, activate questionnaire assignments, or implement underwriting decisions.

State controls demonstrate the specified GPA/PRS/TELE conviction alternatives, Maryland family-history omission, California CI wording and Indiana EZ-4 amendment. WAEPAWL Simplified Issue omits printed questions 1, 4 and 14. The GPA variant can omit tobacco. TELE-SUPP and Supp DI include the supplied detail controls and repeated records; TELE-SUPP questions embedded in the notes are included separately. Headings/instructions are rendered as text, not answer questions.

The source is not a complete executable specification for every case. In particular, PRS1 refers to an attached Standard AIDS question and the amended GMA-EZ1 form calls for insertion of a QD tobacco question whose wording is absent. These references remain visible without invented questions. Exact source notes retain remaining placement and variant instructions for further form review; these previews do not establish production or PDF parity.

| Source section | Storybook page |
| --- | --- |
| 1 | GPA-DI-EZ-1 |
| 2 | GPA-DI-EZ-3 |
| 3 | EZ-1 |
| 4 | EZ-2 |
| 5 | EZ-3 |
| 6 | EZ-4 |
| 7 | PR1 |
| 8 | PRS1 |
| 9 | CI-2014 |
| 10 | CHR |
| 11 | GPA-DI EZ-3 as amended by GMA-EZ-4 |
| 12 | GMA-EZ1 as amended by GPA-DI-EZ-3 |
| 13 | GMA-L/H-TELE-SUPP |
| 14 | Supp DI |
| 15 | GPA-DI-EZ-3 variants |
| 16 | WAEPAWL |
| 17 | EZ-4 for AKC |
| 18 | CI-2014 - CI only applications |

`src/dev/storybook/sourceHealthForms.test.tsx` verifies the workbook digest, all source sections/rows, every form story, adult answer independence, state/pathway examples, conditional TELE-SUPP details and persistent QD loading beyond the normal timeout. Existing recovery tests retain bounded pending-to-timeout behavior for regular application processing.

All six Health routes and every source-form preview share the same health-information chip and drawer. The existing prototype explanation is maintained once, with its standalone example under Forms → Health information help.
