# Shared legacy health catalog intake

October 8, 2026. The user confirmed that the supplied health questions are a **shared legacy catalog for global Sites**. They are evidence to review, not an instruction to activate every questionnaire or an independent ASCE assignment. The MCR supplies Site/product applicability.

## Preserved evidence

The [original pasted text](../health-source/legacy-health-catalog.txt) is preserved byte-for-byte. The [source register](../../src/migration/sources/legacy-health-catalog.json) records its SHA-256 digest, 18 questionnaire sections, exact source lines and the final assignment table. Form boundaries and assignment rows were reconciled against the two supplied screenshots. Tests check the digest, complete question-section coverage and distinct variants. This register is migration-only and is not imported into the applicant runtime.

The supplied material identifies GPA-DI-EZ-1/3, EZ-1/2/3/4, PR1/PRS1, CI-2014, CHR, amended GPA/GMA forms, GMA-L/H-TELE-SUPP, Supp DI, GPA-DI-EZ-3 variants, WAEPAWL and AKC variants. It includes prescribed-medication/treatment questions, time-bounded conditions and procedures, disability and daily-living questions, tobacco, measurements, state notices and extensive repeatable follow-ups.

The supplied text has no effective-date metadata; this does not create an additional source requirement for the requested prototype. The attachment’s assignment table does not identify ASCE; MCR assignments must still be reviewed. Its labels are preserved as evidence, including the distinct `ISTrust`/`ISITrust` spellings; they must be resolved through an explicit identity crosswalk. `adoptedLegacyHealthAssignments` remains empty.

## Comparison with the current template

| Area | Current implementation and remaining work |
|---|---|
| Simplified issue | The five-question default overlaps GPA-DI-EZ-3. Corrected the existing erroneous “allergies” wording to the supplied “albumin” condition. This is a transcription correction, not approval of the form for every Site. Amended forms, omitted questions and alternate tobacco wording still need scoped assignments. |
| Life | The 15-question default overlaps WAEPAWL. The source specifies SI omissions of questions 1, 4 and 14 and TELE-SUPP detail collection for Yes answers. The current common detail rows do not capture all question-specific medications, diagnoses, physician records, tests, treatment, status and dates. |
| Disability | The seven-question default covers part of CHR. CHR also includes bed confinement, amputation and Medicaid/Medicare and dwelling questions that are not fully represented. Supp DI includes occupation/work status, income, employer and additional detailed follow-ups; the generic DI page is not equivalent. |
| Critical illness | CI-2014 includes its own conditions and state wording. It requires a separate product/form assignment and should not be replaced with the general Life or SI questionnaire. |
| States and applicant scope | California substance wording, Virginia statement and other state variations belong to specific forms. Resolve by Site, product, pathway, member/spouse/child and state. A shared default cannot express all of these safely. |
| Follow-up validation | Health LI/SI/DI now block advancement for an applicable Yes answer with no detail row or incomplete required row fields, including restored values. Member and spouse collections are checked independently. Hidden/inactive questions retain data and do not block. Complete form-specific row schemas, limits and date validation remain to be migrated. |
| Documents and decisions | No source-derived underwriting decisions, legal acknowledgements or document clauses were activated. Online/PDF question order, notices, omitted questions and signatures need comparison against the collected-data preview. |

## Next migration increment

Create immutable questionnaire versions with MCR references, question IDs, exact wording, answer types, repeatable detail schemas, state variants and document mappings. Use a reviewed assignment record keyed by Site/product/pathway/applicant/state, with effective dates and an explicit supersession relationship. Keep answer-to-underwriting decisions separate from question rendering.

Before activating each assignment, compare every question and follow-up to its MCR assignment and supplied wording, test Yes/No and applicant/state boundaries, test restored answers against the same validator, and verify the rendered application document. Do not select an ASCE form merely because its wording resembles the current template.

For ASCE, use the MCR to select applicable non-QD forms from the supplied catalog. QD is an external iframe/loading placeholder and requires no in-project questions or underwriting decisions. The six existing approved eligibility/FUW business decisions remain the baseline. Downloads are PDFs of collected application data, not carrier application documents; no additional forms or signature provider are required.

For current ASCE, `SUP DI Health questions!E19:F19` explicitly specifies TELE-Supp No and SUP DI No. Do not add those shared questionnaires to ASCE. See [the MCR template check](asce-mcr-template-check.md).
