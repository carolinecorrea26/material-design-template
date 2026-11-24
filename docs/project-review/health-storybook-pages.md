# Health Storybook pages

November 13, 2026 — CHG-066. Exactly five whole-page families live under **Components → Pages → Health → Whole page**. See the [final Health model](health-component-review.md).

| Page | Route | Examples |
| --- | --- | --- |
| SI | `/health-si` | Member only; member and spouse |
| TELE | `/health-tele` | Member only; member and spouse; configured questionnaire; restored details; CI variant; California CI wording |
| QD | `/health-qd` | External questionnaire image handoff |
| DI SUPP | `/health-di-supp` | Member only; member and spouse; configured supplemental questionnaire |
| CIR | `/health-cir` | Member only; member and spouse |

Self and spouse share each page and corresponding question headings, with independent answer controls and detail records. Active elections select participating adults; a spouse-only questionnaire has no member controls. TELE can resolve LI, DI, CI and combined questionnaires per adult; CI is a product variant, not a page family. The four internal page compositions use real fresh-start fields, shared components and source-compiled synthetic assignments. Fictional selections stay local; no additional real Site is enabled. QD uses ASCE’s effective two-image sequence and the shared final-click save/transition contract.

The source-form previews below are provenance/examples of supplied medical forms; they do not add application routes or effective-Site assignments.

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

`src/dev/storybook/sourceHealthForms.test.tsx` verifies the workbook digest, all source sections/rows, every form story, adult answer independence, state/pathway examples, conditional TELE-SUPP details and the current QD image handoff beyond the old loader timeout. Existing recovery tests retain bounded pending-to-timeout behavior for regular application processing.

CHG-067: Health routes and source-form previews show no contextual help chips. The Health-specific help component and standalone help/drawer examples are removed. QD retains its configured external image handoff.
