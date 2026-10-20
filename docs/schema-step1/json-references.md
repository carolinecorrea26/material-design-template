# Portal JSON reference register

Every JSON column is listed. Paths are reference candidates observed in current reviewed and local seed exports, including expressions and vocabulary; they are not claims of foreign keys. Array indexes are generalized to `[]`. Arbitrary JSON, expressions, URLs and unseeded RPC payloads can carry further references. Contracts and resolver validation must be considered alongside these paths. SQL CHECKs are in the table dictionary.

## site configurations value json

SQL source: `supabase/migrations/202609240001_initial_portal_schema.sql:27`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| coverages.hideSmokerQuestion | 2 | true (database:waepa--overrides) |
| features.homePageVariant | 2 | "hero-image" (database:waepa-gi--overrides) |

## change items current value json

SQL source: `supabase/migrations/202609240001_initial_portal_schema.sql:60`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## change items proposed value json

SQL source: `supabase/migrations/202609240001_initial_portal_schema.sql:60`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## site builder drafts draft data json

SQL source: `supabase/migrations/202609240001_initial_portal_schema.sql:70`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| clientLabel | 4 | "Portal template" (database:DRAFT-014); "New client (not assigned)" (database:DRAFT-011) |

## audit events old value json

SQL source: `supabase/migrations/202609240001_initial_portal_schema.sql:79`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## audit events new value json

SQL source: `supabase/migrations/202609240001_initial_portal_schema.sql:79`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## organization profiles definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:5`. Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/organizations").Tpa, "id">`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| administrationContacts[].clientKey | 98 | "mcr.client.achs" (database:tpa-asce); "mcr.client.achsgi" (database:tpa-asce); "mcr.client.achsncgi" (database:tpa-asce) |
| administrationContacts[].source | 98 | "Associations!D9" (database:tpa-asce); "Associations!D10" (database:tpa-asce); "Associations!D11" (database:tpa-asce) |

## associations definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:15`. Contract: `{ name: string; acronym?: string; logo?: string; logoAlt?: string; }`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## pages definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:24`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/pages").Page & { healthGate: boolean; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| flow | 30 | "application" (database:home); "resume" (database:resume); "advisor" (database:advisor-login) |
| groupId | 14 | "get-started" (database:membership); "coverage" (database:coverage); "profile" (database:contact) |
| id | 30 | "home" (database:home); "membership" (database:membership); "eligibility" (database:eligibility) |
| path | 30 | "/" (database:home); "/membership" (database:membership); "/eligibility" (database:eligibility) |

## page sections definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:32`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/config/pageSections/types").PageSectionConfig`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| applicant | 25 | "self" (database:coverage.selfCoverageQuestions); "spouse" (database:coverage.spouseCoverageQuestions); "child" (database:eligibility.childSection) |
| fieldIds[] | 133 | "gender" (database:coverage.selfCoverageQuestions); "smoker" (database:coverage.selfCoverageQuestions); "tobacco-last-used" (database:coverage.selfCoverageTobacco) |
| id | 30 | "selfCoverageQuestions" (database:coverage.selfCoverageQuestions); "selfCoverageTobacco" (database:coverage.selfCoverageTobacco); "selfCoverageWorkIncome" (database:coverage.selfCoverageWorkIncome) |
| pageId | 30 | "coverage" (database:coverage.selfCoverageQuestions); "membership" (database:membership.default); "eligibility" (database:eligibility.selfEligibility) |
| visibilityConditionId | 18 | "condition-member-smoker" (database:coverage.selfCoverageTobacco); "condition-spouse-selected" (database:coverage.spouseCoverageQuestions); "condition-spouse-smoker" (database:coverage.spouseCoverageTobacco) |

## fields definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:41`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| id | 321 | "child-unmarried" (database:child-unmarried); "child-full-time-student" (database:child-full-time-student); "membership" (database:membership) |
| phoneTypeFieldId | 1 | "spouse-phone-type" (database:spouse-phone) |
| required | 283 | true (database:child-unmarried); false (database:waepa-member-id) |

## coverage categories definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:60`. Contract: `{ label: string; shortLabel?: string; iconKey: string; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| iconKey | 25 | "LI" (database:LI); "AD" (database:AD); "DI" (database:DI) |

## products definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:68`. Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageDefinition, "riders" \| "gNumber" \| "planCode" \| "categoryId" \| "code"> & { categoryId: string; code: string \| null; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| applicants[] | 42 | "member" (database:li-term); "spouse" (database:li-term); "child" (database:li-term) |
| categoryId | 389 | "LI" (database:li-term); "AD" (database:li-add); "DI" (database:di-ltd-plus) |
| coverageAmounts[].scope.applicantType | 34 | "member" (database:li-term); "spouse" (database:li-term); "child" (database:li-term) |
| id | 389 | "li-term" (database:li-term); "li-10yr" (database:li-10yr); "li-15yr" (database:li-15yr) |
| options[].id | 36 | "amount" (database:li-term); "benefit-option" (database:di-ltd-plus); "waiting-period" (database:di-ltd-plus) |
| requirements.eligibility[].applicantType | 8 | "member" (database:di-ltd-plus) |

## riders definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:77`. Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").RiderDefinition, "premiumFactor"> & { premiumFactor: number \| null; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| applicants[] | 8 | "member" (database:rider.li-term.cir.191310427463680); "spouse" (database:rider.li-term.cir.191310427463680) |
| coverageAmounts[].scope.applicantType | 3 | "member" (database:rider.li-term.cir.191310427463680); "spouse" (database:rider.li-term.cir.191310427463680) |
| dependentApplicant | 2 | "spouse" (database:csea.spouse-accident); "child" (database:csea.child-outpatient) |
| id | 92 | "cir" (database:rider.li-term.cir.257833729694906); "add" (database:rider.li-20yr.add.12305572062537); "wop" (database:rider.li-20yr.wop.53710593017410) |
| premiumFactor | 92 | 0.05 (database:rider.li-term.cir.257833729694906); null (database:mcr.rider.r1-aafp) |

## product identifiers definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:99`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/persistence/types").Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## applicant types definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:114`. Contract: `{ label: string; applicantType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/coverage").CoverageApplicantId; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| applicantType | 3 | "member" (database:member); "spouse" (database:spouse); "child" (database:child) |

## conditions definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:122`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").ConditionDefinition`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| conditions[].fieldId | 24 | "dependents" (database:condition-spouse-selected); "smoker" (database:condition-member-smoker); "spouse-smoker" (database:condition-spouse-smoker) |
| id | 17 | "condition-spouse-selected" (database:condition-spouse-selected); "condition-child-selected" (database:condition-child-selected); "condition-member-smoker" (database:condition-member-smoker) |

## rules definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:130`. Contract: `Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/rules").RuleDefinition, "scope" \| "siteIds" \| "clientIds" \| "conditionIds">`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| dependsOn[] | 5 | "rule-application-flow-client-page-mode-none" (database:rule-application-flow-resolved-next-back-navigation); "rule-validation-page-advance" (database:rule-application-flow-resolved-next-back-navigation); "rule-coverage-per-applicant-product-selection" (database:rule-applicant-display-dependent-section-shown-only-when-applying) |
| id | 106 | "rule-application-flow-resolved-next-back-navigation" (database:rule-application-flow-resolved-next-back-navigation); "rule-application-flow-intermediate-step-next-interception" (database:rule-application-flow-intermediate-step-next-interception); "rule-application-flow-client-page-mode-none" (database:rule-application-flow-client-page-mode-none) |
| ref | 106 | "src/config/formFlow.ts; src/app/RoutePage.tsx" (database:rule-application-flow-resolved-next-back-navigation); "src/app/RoutePage.tsx; src/pages/Profile.tsx; src/pages/Coverage.tsx" (database:rule-application-flow-intermediate-step-next-interception); "src/config/flowGates.ts; src/config/client/getClientPageRequirement.ts" (database:rule-application-flow-client-page-mode-none) |
| rule | 106 | "Resolved next/back navigation" (database:rule-application-flow-resolved-next-back-navigation); "Intermediate-step Next interception" (database:rule-application-flow-intermediate-step-next-interception); "Client page mode = none" (database:rule-application-flow-client-page-mode-none) |

## rule actions definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:148`. Contract: `{ kind: "documented-behavior"; description: string; source: string; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| source | 95 | "src/config/formFlow.ts; src/app/RoutePage.tsx" (database:rule-application-flow-resolved-next-back-navigation.behavior); "src/app/RoutePage.tsx; src/pages/Profile.tsx; src/pages/Coverage.tsx" (database:rule-application-flow-intermediate-step-next-interception.behavior); "src/config/flowGates.ts; src/config/client/getClientPageRequirement.ts" (database:rule-application-flow-client-page-mode-none.behavior) |

## flows definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:157`. Contract: `Pick<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowDefinition, "id" \| "title" \| "intro">`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| id | 8 | "consumer" (database:global:*.consumer); "advisor" (database:global:*.advisor); "resume" (database:global:*.resume) |

## flow steps definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:165`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowNodeDef`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| id | 74 | "consumer-landing" (database:global:*.consumer.consumer-landing); "consumer-membership" (database:global:*.consumer.consumer-membership); "consumer-eligibility" (database:global:*.consumer.consumer-eligibility) |
| pageId | 34 | "home" (database:global:*.consumer.consumer-landing); "membership" (database:global:*.consumer.consumer-membership); "eligibility" (database:global:*.consumer.consumer-eligibility) |

## flow transitions definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:175`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/flows").FlowEdgeDef`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| condition | 33 | "Start" (database:global:*.advisor.advisor-e1); "Continue" (database:global:*.advisor.advisor-saved-entry); "Text / Call" (database:global:*.advisor.advisor-saved-delivery) |
| id | 77 | "consumer-e1" (database:global:*.consumer.consumer-e1); "consumer-e2" (database:global:*.consumer.consumer-e2); "consumer-e3" (database:global:*.consumer.consumer-e3) |
| source | 77 | "consumer-landing" (database:global:*.consumer.consumer-e1); "consumer-membership" (database:global:*.consumer.consumer-e2); "consumer-eligibility" (database:global:*.consumer.consumer-e3) |
| target | 77 | "consumer-membership" (database:global:*.consumer.consumer-e1); "consumer-eligibility" (database:global:*.consumer.consumer-e2); "consumer-coverage" (database:global:*.consumer.consumer-e3) |

## features definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:188`. Contract: `import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/features").FeatureDefinition`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## configuration definitions definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:196`. Contract: `{ path: string[] \| null; metadata: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/persistence/types").Json; target?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/persistence/types").ConfigurationTarget \| null; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| metadata.id | 34 | "config-branding-icons" (database:config-branding-icons); "config-features-singlepageartwork" (database:config-features-singlepageartwork); "config-features-applyingstepspresentation" (database:config-features-applyingstepspresentation) |
| metadata.key | 3 | "coverage.estimatedCost.showRateTable" (database:coverage.estimatedCost.showRateTable); "coverage.productCard.linkRateTable" (database:coverage.productCard.linkRateTable); "coverage.rateTable.presentation" (database:coverage.rateTable.presentation) |
| metadata.requiresInterpretation | 19 | true (database:mcr.product.application-form) |
| metadata.scope | 34 | "Client Configurable" (database:config-branding-icons) |
| metadata.source | 1 | "Riders!C29" (database:csea.di-ltd.included-rider-set) |
| metadata.sourcePath | 34 | "src/domain/configuration.ts / src/components/ui/ClientCategoryIcon.tsx" (database:config-branding-icons); "src/config/homepagePresentation.ts / src/pages/Home.tsx / src/components/layout/AppShell.tsx" (database:config-features-singlepageartwork); "src/config/homepagePresentation.ts" (database:config-features-applyingstepspresentation) |
| path | 544 | null (database:config-branding-icons) |
| path[] | 851 | "theme" (database:theme.type); "type" (database:theme.type); "preset" (database:theme.preset) |
| target | 136 | null (database:theme.type) |
| target.applicantKey | 1 | "member" (database:waepa-gi.li-group-term.military-exclusion) |
| target.productKey | 551 | "li-term" (database:coverages.overrides.li-term.featured); "li-10yr" (database:coverages.overrides.li-10yr.underwritingType); "li-20yr" (database:coverages.overrides.li-20yr.underwritingType) |

## content entries definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:204`. Contract: `{ path: string[] \| null; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| path | 86 | null (database:mcr.legal-disclosures.A2) |
| path[] | 786 | "home" (database:home.hero.tagline); "hero" (database:home.hero.tagline); "tagline" (database:home.hero.tagline) |

## email templates definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:212`. Contract: `{ rendererKey: string; source: string; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| rendererKey | 10 | "autosave" (database:autosave); "receipt" (database:receipt); "resume-magic-link" (database:resume-magic-link) |
| source | 10 | "src/utils/mockEmail.ts" (database:autosave) |

## document definitions definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:220`. Contract: `{ contentKey: string \| null; productKey: string \| null; source: string; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| contentKey | 8 | null (database:footer.termsOfUseContent); "mcr.electronic-consent.standard" (database:mcr.electronic-consent.standard) |
| productKey | 8 | null (database:footer.termsOfUseContent); "li-term" (database:product.li-term.brochure); "li-10yr" (database:product.li-10yr.brochure) |
| source | 8 | "footer.termsOfUseContent" (database:footer.termsOfUseContent); "footer.privacyNoticeContent" (database:footer.privacyNoticeContent); "brochureUrl" (database:product.li-term.brochure) |

## validation rules definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:228`. Contract: `{ required?: boolean; format?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["format"]; inputType: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition["inputType"]; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| required | 158 | true (database:child-unmarried.validation); false (database:waepa-member-id.validation) |

## site field configurations values

SQL source: `supabase/migrations/202609240003_portal_library.sql:259`. Contract: `Partial<Omit<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/fields").FieldDefinition, "id">>`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| optionExclusions[].conditionId | 1 | "condition-membership-ama-spouse" (database:ama.eligibility.dependents.authored.override) |
| visibilityConditionId | 15 | "condition-membership-ama-spouse" (database:site:ama.membership.ama-physician-type.override); "condition-membership-waepa-new" (database:site:waepa.membership.waepa-declaration.override); "condition-waepa-federal-active" (database:site:waepa.membership.waepa-employer.override) |

## configuration values value

SQL source: `supabase/migrations/202609240003_portal_library.sql:324`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| [].applicants[] | 2 | "member" (database:client:asce.coverages.overrides.li-term.riders); "spouse" (database:client:asce.coverages.overrides.li-term.riders) |
| [].applicantType | 13 | "member" (database:client:asce.applicantClassifications); "child" (database:client:asce.coverages.overrides.li-term.requirements.eligibility); "spouse" (database:client:asce.coverages.overrides.di-ltd.requirements.eligibility) |
| [].categoryId | 6 | "LI" (database:client:asce.coverages.overrides.li-term.requirements.dependencies) |
| [].conditionId | 1 | "condition-membership-ama-spouse" (database:client:ama.fields.eligibility.overrides.dependents.optionExclusions) |
| [].coverageAmounts[].scope.applicantType | 2 | "member" (database:client:asce.coverages.overrides.li-term.riders); "spouse" (database:client:asce.coverages.overrides.li-term.riders) |
| [].fact | 1 | "activeMilitary" (database:waepa-gi.li-group-term.military-exclusion) |
| [].facts.asce-member-id | 1 | "ASCE12345" (database:client:asce.tpaIntegration.prototypeRecords) |
| [].fields[] | 4 | "dividend-acknowledgement" (database:client:abe.reviewPolicy.blocks); "dividend-first-name" (database:client:abe.reviewPolicy.blocks); "dividend-last-name" (database:client:abe.reviewPolicy.blocks) |
| [].gate.categoryId | 2 | "LI" (database:global.routing.gates); "DI" (database:global.routing.gates) |
| [].gate.categoryIds[] | 2 | "LI" (database:global.routing.gates); "AD" (database:global.routing.gates) |
| [].gate.riderId | 1 | "cir" (database:global.routing.gates) |
| [].id | 21 | "cir" (database:client:abe.coverages.overrides.li-term.riders); "add" (database:client:ama.coverages.overrides.li-20yr.riders); "wop" (database:client:ama.coverages.overrides.li-20yr.riders) |
| [].key | 2 | "dividend-acknowledgement" (database:client:abe.reviewPolicy.blocks); "dividend-election" (database:client:abe.reviewPolicy.blocks) |
| [].pageId | 6 | "beneficiary" (database:global.routing.gates); "health-si" (database:global.routing.gates); "health-qd" (database:global.routing.gates) |
| [].premiumFactor | 16 | 0.05 (database:client:abe.coverages.overrides.li-term.riders) |
| [].requiredBenefitPeriod | 1 | "five-year" (database:client:asce.coverages.overrides.di-ltd.requirements.benefitLimit.caps) |
| [].requiredWaitingPeriod | 1 | "90" (database:client:asce.coverages.overrides.di-ltd.requirements.benefitLimit.caps) |
| [].requiresApplicant | 3 | "member" (database:client:asce.coverages.overrides.li-term.requirements.dependencies) |
| [].sameProduct | 3 | false (database:client:asce.coverages.overrides.li-term.requirements.dependencies) |
| [].scope.applicantType | 92 | "member" (database:client:demo.coverages.coverageAmounts.li-term); "spouse" (database:client:ama.coverages.coverageAmounts.li-premier-accident); "child" (database:client:asce.coverages.coverageAmounts.li-term) |
| [].source | 2 | "ASCE_Portal_Site_Rules.xlsx, Open Issues!C3; Life Products!E2" (database:client:asce.coverages.overrides.li-10yr.requirements.unresolved); "ASCE_Portal_Site_Rules.xlsx, Open Issues!C3; Life Products!E3" (database:client:asce.coverages.overrides.li-20yr.requirements.unresolved) |
| [].sourceReferences[] | 6 | "Read & Sign!C111" (database:client:abe.reviewPolicy.blocks); "User dividend screenshot" (database:client:abe.reviewPolicy.blocks); "User: required acknowledgement; always-visible optional identity fields; no election checkbox" (database:client:abe.reviewPolicy.blocks) |
| [].when.applicant | 2 | "member" (database:client:abe.reviewPolicy.blocks) |
| aggregate.productKeys[] | 10 | "di-ltd" (database:abe.di-ltd.reviewed-benefit-policy); "di-ltd-plus" (database:abe.di-ltd.reviewed-benefit-policy); "di-mtd" (database:abe.di-ltd.reviewed-benefit-policy) |
| applicants[] | 153 | "member" (database:demo.li-term.journey-policy); "spouse" (database:demo.li-term.journey-policy); "child" (database:demo.li-term.journey-policy) |
| applicants[].applicantClass | 4 | "practicing" (database:ama.di-level-rated.reviewed-benefit-policy); "resident" (database:ama.di-level-rated.reviewed-benefit-policy); "clerical" (database:csea.di-ltd.reviewed-benefit-policy) |
| applicants[].applicantKey | 24 | "member" (database:abe.di-ltd.reviewed-benefit-policy); "spouse" (database:abe.di-ltd.reviewed-benefit-policy) |
| applicants[].periodPairs[].waitingKey | 2 | "15-days" (database:avma.oo-professional.reviewed-benefit-policy); "30-days" (database:avma.oo-professional.reviewed-benefit-policy) |
| applicants[].requireMemberCoverage | 5 | true (database:abe.di-ltd.reviewed-benefit-policy) |
| applicants[].waitingPeriods[].accidentDays | 62 | 30 (database:abe.di-ltd.reviewed-benefit-policy); 60 (database:abe.di-ltd.reviewed-benefit-policy); 90 (database:abe.di-ltd.reviewed-benefit-policy) |
| applicants[].waitingPeriods[].key | 62 | "30-days" (database:abe.di-ltd.reviewed-benefit-policy); "60-days" (database:abe.di-ltd.reviewed-benefit-policy); "90-days" (database:abe.di-ltd.reviewed-benefit-policy) |
| associationChoices[].key | 250 | "akron-bar-association" (database:isitrust.li-10yr.journey-policy); "alabama-state-bar" (database:isitrust.li-10yr.journey-policy); "american-mountain-guides-association" (database:isitrust.li-10yr.journey-policy) |
| beneficiaryControls.fields[].fieldKey | 2 | "beneficiary-information-opt-in" (database:global.field-surfaces); "beneficiaryType" (database:global.field-surfaces) |
| beneficiaryControls.fields[].valueKey | 2 | "beneficiary-information-opt-in" (database:global.field-surfaces); "beneficiaryType" (database:global.field-surfaces) |
| beneficiaryControls.pageKey | 1 | "beneficiary" (database:global.field-surfaces) |
| beneficiaryIndividual.fields[].fieldKey | 4 | "beneficiary-firstName" (database:global.field-surfaces); "beneficiary-lastName" (database:global.field-surfaces); "beneficiary-relationship" (database:global.field-surfaces) |
| beneficiaryIndividual.fields[].grid | 2 | true (database:global.field-surfaces) |
| beneficiaryIndividual.fields[].valueKey | 4 | "firstName" (database:global.field-surfaces); "lastName" (database:global.field-surfaces); "relationship" (database:global.field-surfaces) |
| beneficiaryIndividual.pageKey | 1 | "beneficiary" (database:global.field-surfaces) |
| beneficiaryTrust.fields[].fieldKey | 2 | "beneficiary-trustName" (database:global.field-surfaces); "beneficiary-trustDate" (database:global.field-surfaces) |
| beneficiaryTrust.fields[].valueKey | 2 | "trustName" (database:global.field-surfaces); "trustDate" (database:global.field-surfaces) |
| beneficiaryTrust.pageKey | 1 | "beneficiary" (database:global.field-surfaces) |
| blocks[].fields[] | 4 | "dividend-acknowledgement" (database:abe.review-policy); "dividend-first-name" (database:abe.review-policy); "dividend-last-name" (database:abe.review-policy) |
| blocks[].key | 2 | "dividend-acknowledgement" (database:abe.review-policy); "dividend-election" (database:abe.review-policy) |
| blocks[].sourceReferences[] | 6 | "Read & Sign!C111" (database:abe.review-policy); "User dividend screenshot" (database:abe.review-policy); "User: required acknowledgement; always-visible optional identity fields; no election checkbox" (database:abe.review-policy) |
| blocks[].when.applicant | 2 | "member" (database:abe.review-policy) |
| children.fields[].fieldKey | 6 | "child-first-name" (database:global.field-collections); "child-last-name" (database:global.field-collections); "child-birth-date" (database:global.field-collections) |
| children.fields[].grid | 4 | true (database:global.field-collections); false (database:global.field-collections) |
| children.fields[].valueKey | 6 | "firstName" (database:global.field-collections); "lastName" (database:global.field-collections); "birthDate" (database:global.field-collections) |
| children.pageKey | 1 | "eligibility" (database:global.field-collections) |
| children.sectionId | 1 | "childSection" (database:global.field-collections) |
| columns[] | 9 | "Principal sum" (database:csea.li-add.reference-table); "Bi-weekly rate" (database:csea.li-add.reference-table); "Annual salary" (database:csea.di-ltd.provisional-reference-table) |
| defaultUnderwritingPathway | 69 | "FUW" (database:demo.li-term.journey-policy); "GI" (database:demo.li-50plus.journey-policy); "NA" (database:demo.li-add.journey-policy) |
| dependentElections[].applicantKey | 2 | "spouse" (database:csea.di-ltd.journey-policy); "child" (database:csea.di-ltd.journey-policy) |
| dependentElections[].key | 2 | "spouse-accident-disability" (database:csea.di-ltd.journey-policy); "child-outpatient-accident" (database:csea.di-ltd.journey-policy) |
| dependentElections[].signatureRequired | 2 | false (database:csea.di-ltd.journey-policy) |
| dimensions.applicant | 69 | "required" (database:demo.li-term.rate-input-policy) |
| exclusiveProducts[] | 2 | "di-ltd-plus" (database:abe.di-ltd.reviewed-benefit-policy); "di-ltd" (database:abe.di-ltd-plus.reviewed-benefit-policy) |
| existingPolicyRequired | 69 | true (database:demo.li-term.selection-policy) |
| factMappings.applicantClass.field | 1 | "csea-occupation-group" (database:csea.applicant-experience) |
| fraud.nyAccidentLifeProducts[] | 4 | "li-term" (database:avma.review-policy); "li-group-term" (database:isitrust.review-policy) |
| fraud.overrideText | 1 | "FRAUD NOTICE: For accident and health insurance only, any person who knowingly and with intent to defraud any insurance company or any other person files an application for insuran" (database:csea.review-policy) |
| fraud.sourceReferences[] | 11 | "Read & Sign!B53:C76" (database:demo.review-policy); "Main!H197" (database:avma.review-policy) |
| groups[].applicantKeys[] | 15 | "member" (database:abe.reviewed-life-aggregate); "spouse" (database:abe.reviewed-life-aggregate); "child" (database:abe.reviewed-life-aggregate) |
| groups[].key | 5 | "abe.life-per-person" (database:abe.reviewed-life-aggregate); "ama.life-per-person" (database:ama.reviewed-life-aggregate); "asce.life-per-person" (database:asce.reviewed-life-aggregate) |
| groups[].productKeys[] | 19 | "li-term" (database:abe.reviewed-life-aggregate); "li-10yr" (database:abe.reviewed-life-aggregate); "li-20yr" (database:abe.reviewed-life-aggregate) |
| healthDiq1Details.fields[].fieldKey | 4 | "health-di-q1-detail-assistanceType" (database:global.field-surfaces); "health-di-q1-detail-onset" (database:global.field-surfaces); "health-di-q1-detail-conditionsDetails" (database:global.field-surfaces) |
| healthDiq1Details.fields[].valueKey | 4 | "assistanceType" (database:global.field-surfaces); "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces) |
| healthDiq1Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthDiq2Details.fields[].fieldKey | 4 | "health-di-q2-detail-fallType" (database:global.field-surfaces); "health-di-q2-detail-onset" (database:global.field-surfaces); "health-di-q2-detail-conditionsDetails" (database:global.field-surfaces) |
| healthDiq2Details.fields[].valueKey | 4 | "fallType" (database:global.field-surfaces); "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces) |
| healthDiq2Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthDiq3Details.fields[].fieldKey | 3 | "health-di-q3-detail-onset" (database:global.field-surfaces); "health-di-q3-detail-conditionsDetails" (database:global.field-surfaces); "health-di-q3-detail-physicianAddress" (database:global.field-surfaces) |
| healthDiq3Details.fields[].valueKey | 3 | "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces); "physicianAddress" (database:global.field-surfaces) |
| healthDiq3Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthDiq4Details.fields[].fieldKey | 3 | "health-di-q4-detail-onset" (database:global.field-surfaces); "health-di-q4-detail-conditionsDetails" (database:global.field-surfaces); "health-di-q4-detail-physicianAddress" (database:global.field-surfaces) |
| healthDiq4Details.fields[].valueKey | 3 | "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces); "physicianAddress" (database:global.field-surfaces) |
| healthDiq4Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthDiq5Details.fields[].fieldKey | 3 | "health-di-q5-detail-onset" (database:global.field-surfaces); "health-di-q5-detail-conditionsDetails" (database:global.field-surfaces); "health-di-q5-detail-physicianAddress" (database:global.field-surfaces) |
| healthDiq5Details.fields[].valueKey | 3 | "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces); "physicianAddress" (database:global.field-surfaces) |
| healthDiq5Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthDiq6Details.fields[].fieldKey | 3 | "health-di-q6-detail-onset" (database:global.field-surfaces); "health-di-q6-detail-conditionsDetails" (database:global.field-surfaces); "health-di-q6-detail-physicianAddress" (database:global.field-surfaces) |
| healthDiq6Details.fields[].valueKey | 3 | "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces); "physicianAddress" (database:global.field-surfaces) |
| healthDiq6Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthDiq7Details.fields[].fieldKey | 1 | "health-di-q7-detail-details" (database:global.field-surfaces) |
| healthDiq7Details.fields[].valueKey | 1 | "details" (database:global.field-surfaces) |
| healthDiq7Details.pageKey | 1 | "health-di" (database:global.field-surfaces) |
| healthForRiderOnly | 69 | false (database:demo.li-term.selection-policy); true (database:asce.li-term.selection-policy) |
| healthLiDetails.fields[].fieldKey | 3 | "health-li-detail-onset" (database:global.field-surfaces); "health-li-detail-conditionsDetails" (database:global.field-surfaces); "health-li-detail-physicianAddress" (database:global.field-surfaces) |
| healthLiDetails.fields[].valueKey | 3 | "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces); "physicianAddress" (database:global.field-surfaces) |
| healthLiDetails.pageKey | 1 | "health-li" (database:global.field-surfaces) |
| healthSiDetails.fields[].fieldKey | 3 | "health-si-detail-onset" (database:global.field-surfaces); "health-si-detail-conditionsDetails" (database:global.field-surfaces); "health-si-detail-physicianAddress" (database:global.field-surfaces) |
| healthSiDetails.fields[].valueKey | 3 | "onset" (database:global.field-surfaces); "conditionsDetails" (database:global.field-surfaces); "physicianAddress" (database:global.field-surfaces) |
| healthSiDetails.pageKey | 1 | "health-si" (database:global.field-surfaces) |
| mappings[].riderCodes.csea.spouse-accident | 6 | "mock:csea.spouse-accident" (database:csea.di-ltd.journey-policy) |
| mappings[].when.applicantClass | 22 | "practicing" (database:ama.di-level-rated.journey-policy); "resident" (database:ama.di-level-rated.journey-policy); "clerical" (database:csea.di-ltd.journey-policy) |
| mappings[].when.applicantKey | 1838 | "member" (database:demo.li-term.journey-policy); "spouse" (database:demo.li-term.journey-policy); "child" (database:demo.li-term.journey-policy) |
| mappings[].when.associationKey | 1500 | "akron-bar-association" (database:isitrust.li-10yr.journey-policy); "alabama-state-bar" (database:isitrust.li-10yr.journey-policy); "american-mountain-guides-association" (database:isitrust.li-10yr.journey-policy) |
| membershipRequired | 69 | false (database:demo.li-term.journey-policy); true (database:abe.li-term.journey-policy) |
| needsCalculator.fields[].fieldKey | 4 | "needs-annual-income" (database:global.field-surfaces); "needs-years-to-replace" (database:global.field-surfaces); "needs-outstanding-debts" (database:global.field-surfaces) |
| needsCalculator.fields[].valueKey | 4 | "needs-annual-income" (database:global.field-surfaces); "needs-years-to-replace" (database:global.field-surfaces); "needs-outstanding-debts" (database:global.field-surfaces) |
| needsCalculator.pageKey | 1 | "home" (database:global.field-surfaces) |
| overrides[].sourceReferences[] | 6 | "Main!AO165" (database:asce.li-10yr.rate-input-policy); "Main!AP165" (database:asce.li-10yr.rate-input-policy); "Main!AR165" (database:asce.li-10yr.rate-input-policy) |
| payment.synchronizeAcrossProducts | 69 | true (database:demo.li-term.journey-policy) |
| paymentBank.fields[].fieldKey | 5 | "bank-name-on-account" (database:global.field-surfaces); "bank-institution" (database:global.field-surfaces); "bank-routing-number" (database:global.field-surfaces) |
| paymentBank.fields[].valueKey | 5 | "bank-name-on-account" (database:global.field-surfaces); "bank-institution" (database:global.field-surfaces); "bank-routing-number" (database:global.field-surfaces) |
| paymentBank.pageKey | 1 | "payment" (database:global.field-surfaces) |
| paymentControls.fields[].fieldKey | 5 | "payment-information-opt-in" (database:global.field-surfaces); "payment-method" (database:global.field-surfaces); "payment-frequency" (database:global.field-surfaces) |
| paymentControls.fields[].valueKey | 5 | "payment-information-opt-in" (database:global.field-surfaces); "payment-method" (database:global.field-surfaces); "payment-frequency" (database:global.field-surfaces) |
| paymentControls.pageKey | 1 | "payment" (database:global.field-surfaces) |
| questions[].applicantKey | 315 | "member" (database:demo.li-term.journey-policy); "spouse" (database:demo.li-term.journey-policy); "child" (database:demo.li-term.journey-policy) |
| questions[].attestationKey | 315 | "demo.li-term.member.new.attestation" (database:demo.li-term.journey-policy); "demo.li-term.member.increase.attestation" (database:demo.li-term.journey-policy); "demo.li-term.spouse.new.attestation" (database:demo.li-term.journey-policy) |
| questions[].financialFields[] | 114 | "average-monthly-income" (database:demo.di-ltd-plus.journey-policy); "hours-worked-per-week" (database:demo.di-ltd-plus.journey-policy); "monthly-business-expenses" (database:demo.oo-professional.journey-policy) |
| questions[].healthPage | 315 | "health-li" (database:demo.li-term.journey-policy); null (database:demo.li-term.journey-policy); "health-di" (database:demo.di-ltd-plus.journey-policy) |
| questions[].tobaccoFields[] | 486 | "smoker" (database:demo.li-term.journey-policy); "tobacco-last-used" (database:demo.li-term.journey-policy); "tobacco-products" (database:demo.li-term.journey-policy) |
| quoteInputs.fields[].fieldKey | 14 | "birth-date" (database:global.field-surfaces); "zip-postal-code" (database:global.field-surfaces); "state-province" (database:global.field-surfaces) |
| quoteInputs.fields[].valueKey | 14 | "birth-date" (database:global.field-surfaces); "zip-postal-code" (database:global.field-surfaces); "state-province" (database:global.field-surfaces) |
| quoteInputs.pageKey | 1 | "home" (database:global.field-surfaces) |
| rateClass.sourceReferences[] | 183 | "prototype:rate-class-assumption" (database:demo.li-term.rate-input-policy); "Main!AO39" (database:abe.li-term.rate-input-policy); "Main!AP39" (database:abe.li-term.rate-input-policy) |
| rateClass.sourceText | 69 | "" (database:demo.li-term.rate-input-policy); "2 Risk Classes:\n- Standard (Smoker)\n- Preferred (NonSmoker)\nYes to Smoking Question: Standard Rate\nNo to Smoking Question: Preferred Rate\nQD rate classes\nStandard for non smoker\nSt" (database:abe.li-term.rate-input-policy); "Initial Level Period - 3 Risk Classes\nNEW Effective 6/1/24:\nSAME 3 Risk Classes FULL Underwriting ages 65-69 for $500K and below\n- Preferred\n- Select (NonSmoker)\n- Standard (Smoker" (database:abe.li-10yr.rate-input-policy) |
| riderOnlyApplicants[] | 6 | "member" (database:asce.li-term.selection-policy); "spouse" (database:asce.li-term.selection-policy) |
| riders[].applicants[] | 35 | "member" (database:abe.li-term.selection-policy); "spouse" (database:abe.li-term.selection-policy) |
| riders[].included | 20 | false (database:abe.li-term.selection-policy) |
| riders[].key | 20 | "rider.li-term.cir.257833729694906" (database:abe.li-term.selection-policy); "rider.li-term.wop.53710593017410" (database:ama.li-term.selection-policy); "rider.li-10yr.add.12305572062537" (database:ama.li-10yr.selection-policy) |
| rules[].applicantKey | 35 | "spouse" (database:abe.li-term.reviewed-dependent-policy); "child" (database:abe.li-term.reviewed-dependent-policy) |
| rules[].derived.baseApplicantKey | 8 | "member" (database:ama.sh-hospital-income.reviewed-dependent-policy) |
| rules[].derived.siblingApplicantKey | 6 | "child" (database:ama.li-premier-accident.reviewed-dependent-policy); "spouse" (database:ama.li-premier-accident.reviewed-dependent-policy) |
| rules[].key | 19 | "non-member-fee" (database:ama.li-term.rate-modifier-policy); "member-credit" (database:ama.li-10yr.rate-modifier-policy); "monthly-eft-credit" (database:ama.li-premier-accident.rate-modifier-policy) |
| rules[].maximumPlans.productKeys[] | 30 | "li-term" (database:abe.li-term.reviewed-dependent-policy); "li-10yr" (database:abe.li-term.reviewed-dependent-policy); "li-20yr" (database:abe.li-term.reviewed-dependent-policy) |
| rules[].requires.applicantKeys[] | 32 | "member" (database:abe.li-term.reviewed-dependent-policy); "spouse" (database:avma.li-group-term.reviewed-dependent-policy) |
| rules[].sourceReferences[] | 19 | "Main!AR123" (database:ama.li-term.rate-modifier-policy); "Main!AR120" (database:ama.li-10yr.rate-modifier-policy); "Main!AR121" (database:ama.li-15yr.rate-modifier-policy) |
| selfDisabilityCompanies.fields[].fieldKey | 4 | "di-company-name" (database:global.field-collections); "di-company-monthly-benefit" (database:global.field-collections); "di-company-benefit-period" (database:global.field-collections) |
| selfDisabilityCompanies.fields[].valueKey | 4 | "company" (database:global.field-collections); "monthlyBenefitAmount" (database:global.field-collections); "benefitPeriod" (database:global.field-collections) |
| selfDisabilityCompanies.pageKey | 1 | "profile" (database:global.field-collections) |
| selfDisabilityCompanies.sectionId | 1 | "profileFinancialSelf" (database:global.field-collections) |
| sourceReferences[] | 181 | "prototype:rating-input-assumption" (database:demo.li-term.rate-input-policy); "Main!AO39" (database:abe.li-term.rate-input-policy); "Main!AP39" (database:abe.li-term.rate-input-policy) |
| spouseDisabilityCompanies.fields[].fieldKey | 4 | "di-company-name" (database:global.field-collections); "di-company-monthly-benefit" (database:global.field-collections); "di-company-benefit-period" (database:global.field-collections) |
| spouseDisabilityCompanies.fields[].valueKey | 4 | "company" (database:global.field-collections); "monthlyBenefitAmount" (database:global.field-collections); "benefitPeriod" (database:global.field-collections) |
| spouseDisabilityCompanies.pageKey | 1 | "profile" (database:global.field-collections) |
| spouseDisabilityCompanies.sectionId | 1 | "profileFinancialSpouse" (database:global.field-collections) |
| verificationControls.fields[].fieldKey | 1 | "verification-method" (database:global.field-surfaces) |
| verificationControls.fields[].valueKey | 1 | "verification-method" (database:global.field-surfaces) |
| verificationControls.pageKey | 1 | "eligibility" (database:global.field-surfaces) |
| verificationQuestions.fields[].fieldKey | 3 | "sq-1" (database:global.field-surfaces); "sq-2" (database:global.field-surfaces); "sq-3" (database:global.field-surfaces) |
| verificationQuestions.fields[].valueKey | 3 | "sq-1" (database:global.field-surfaces); "sq-2" (database:global.field-surfaces); "sq-3" (database:global.field-surfaces) |
| verificationQuestions.pageKey | 1 | "eligibility" (database:global.field-surfaces) |

## content values value

SQL source: `supabase/migrations/202609240003_portal_library.sql:338`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| [].source | 8 | "A.M. Best" (database:global:*.home.nylCredentials.ratings); "Fitch Ratings" (database:global:*.home.nylCredentials.ratings); "Moody's Investors Service" (database:global:*.home.nylCredentials.ratings) |

## branding profiles definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:352`. Contract: `Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientBranding>`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## support profiles definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:365`. Contract: `Partial<import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/configuration").ClientSupport>`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| website | 9 | "www.demo.com" (database:client:demo); "abendowment.org" (database:client:abe); "https://www.amainsure.com" (database:client:ama) |

## site policies definition

SQL source: `supabase/migrations/202609240003_portal_library.sql:399`. Contract: `{ associationSelection?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationSelection; associationBranding?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/associations").AssociationBranding; payment?: import("/Users/t98j0kt/Desktop/nyl/portal/templates/template-material/template-material-prototype/src/domain/paymentPolicy").PaymentPolicy; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| associationBranding.useAssociationLogo | 1 | true (database:asce) |
| associationSelection.fixedAssociationId | 5 | "american-medical-association" (database:ama); "american-society-of-civil-engineers" (database:asce); "american-veterinary-medical-association" (database:avma) |
| payment.synchronizeAcrossProducts | 2 | true (database:nso) |

## source sheets merged ranges

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:24`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## source requirements value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:38`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## source requirements active site keys

SQL source: `supabase/migrations/202609280002_source_promotion.sql:2`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## flag definitions allowed values

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:71`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## flag assignments value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:99`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## flag rules value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:118`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## rule flags value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:131`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## rule predicates value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:144`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## structured rule actions value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:158`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## product configuration values value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:171`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## pattern assignments configuration

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:245`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| lookupFields[] | 10 | "first-name" (database:ama.tpa-coverage-based-verification); "last-name" (database:ama.tpa-coverage-based-verification); "birth-date" (database:ama.tpa-coverage-based-verification) |
| requiresActiveCoverage | 2 | true (database:ama.tpa-coverage-based-verification) |
| requiresExistingMember | 2 | true (database:ama.tpa-coverage-based-verification) |

## semantic requirements value

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:758`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| applicants[] | 15 | "member" (database:mcr.waepa-cir-questions.A3.response-and-scope.162322006528520); "spouse" (database:mcr.waepa-cir-questions.A3.response-and-scope.162322006528520) |
| approvalReference | 6 | "docs/asce-business-decisions.md#approval-evidence" (database:business-decision.asce.li-10yr.base-eligibility-ages) |
| clauses[].applicants[] | 6 | "member" (database:application.has-underwritten-coverage.derivation.56779268739408); "spouse" (database:application.has-underwritten-coverage.derivation.56779268739408) |
| destinations[].column | 441 | "value" (database:migration-decision.abe.di-ltd.reviewed-benefit-policy); "definition" (database:provisional-decision.csea.li-add.mock-identity); "maximumAgeYears" (database:provisional-decision.csea.identity) |
| destinations[].key | 441 | "abe.di-ltd.reviewed-benefit-policy" (database:migration-decision.abe.di-ltd.reviewed-benefit-policy); "abe.di-ltd-plus.reviewed-benefit-policy" (database:migration-decision.abe.di-ltd-plus.reviewed-benefit-policy); "abe.di-mtd.reviewed-benefit-policy" (database:migration-decision.abe.di-mtd.reviewed-benefit-policy) |
| destinations[].table | 441 | "configurationValues" (database:migration-decision.abe.di-ltd.reviewed-benefit-policy); "productIdentifiers" (database:provisional-decision.csea.li-add.mock-identity); "eligibilityConstraints" (database:provisional-decision.csea.identity) |
| enabledProducts[] | 1 | "li-group-term" (database:migration-decision.waepa-gi.source-portfolio-and-payment) |
| existingLifeAmountRequired | 1 | true (database:migration-decision.nso.life-amounts-and-payment) |
| fact | 1 | "months-since-last-use" (database:mcr.smoker-question.B2.rate-classification.241766800395904) |
| fields[] | 14 | "gross-earned-income-share" (database:mcr.financial-questions.sole-proprietor-income.83316541146708); "business-expenses-share" (database:mcr.financial-questions.sole-proprietor-income.83316541146708); "annual-salary" (database:mcr.financial-questions.professional-corporation-income.269535594966049) |
| flagKey | 15 | "qd.decision" (database:mcr.standard-decision-wording.B2.decision-status.60454667843042) |
| followUp.explanation.include | 1 | "average-days-per-week-clients-seen" (database:mcr.financial-questions.work-from-home.239424356672373) |
| followUp.when | 1 | true (database:mcr.financial-questions.work-from-home.239424356672373) |
| followUpWhen | 6 | true (database:mcr.waepa-cir-questions.A3.response-and-scope.162322006528520) |
| otherActiveBusinessClientsPraseConfigured | 1 | true (database:migration-decision.rate-presentation) |
| payment.synchronizeAcrossProducts | 2 | true (database:migration-decision.waepa-gi.source-portfolio-and-payment) |
| predicate.left.fact | 12 | "applicant.monthlyEarnings" (database:mcr.plan.disability.d1.3.maximum-benefit-expression.81345576367865); "applicant.averageMonthlyIncome" (database:mcr.plan.disability.d31.40.maximum-benefit-expression.244620329540525) |
| productKey | 89 | "li-group-term" (database:migration-decision.waepa-gi.member-fixed-offer); "li-term" (database:migration-decision.abe.li-term.reviewed-numeric); "li-10yr" (database:migration-decision.abe.li-10yr.reviewed-numeric) |
| products[] | 4 | "li-term" (database:migration-decision.nso.life-amounts-and-payment); "li-50plus" (database:migration-decision.nso.life-amounts-and-payment); "li-10yr" (database:migration-decision.nso.life-amounts-and-payment) |
| readinessKey | 6 | "asce.li-10yr.base-eligibility-ages" (database:business-decision.asce.li-10yr.base-eligibility-ages); "asce.li-20yr.base-eligibility-ages" (database:business-decision.asce.li-20yr.base-eligibility-ages); "asce.li-10yr.underwriting.3" (database:business-decision.asce.li-10yr.underwriting.3) |
| reference | 26 | "docs/step3-provisional-decisions.md" (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| referenceTableAsset | 1 | "provisional HTML reference configured; authoritative rate asset pending" (database:migration-decision.rate-presentation) |
| required | 7 | true (database:mcr.waepa-cir-questions.A3.follow-up.107456720972696) |
| ruleKey | 2 | "rule-mcr.legal-disclosures.A3.visibility" (database:mcr.legal-disclosures.A3.visible-when-rule.205902783251741); "rule-mcr.legal-disclosures.A5.visibility" (database:mcr.legal-disclosures.A5.visible-when-rule.124684203213539) |
| selected.aggregate.productKeys[] | 9 | "di-ltd" (database:provisional-decision.abe.di-ltd.benefit-calculation); "di-ltd-plus" (database:provisional-decision.abe.di-ltd.benefit-calculation); "di-mtd" (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| selected.applicants[] | 131 | "member" (database:provisional-decision.isitrust.critical-illness-stage2); "spouse" (database:provisional-decision.isitrust.critical-illness-stage2); "child" (database:provisional-decision.abe.li-term.journey-policy) |
| selected.applicants[].applicantClass | 2 | "clerical" (database:provisional-decision.csea.di-ltd.reviewed-benefit-policy); "non-clerical" (database:provisional-decision.csea.di-ltd.reviewed-benefit-policy) |
| selected.applicants[].applicantKey | 14 | "member" (database:provisional-decision.abe.di-ltd.benefit-calculation); "spouse" (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| selected.applicants[].requireMemberCoverage | 4 | true (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| selected.applicants[].waitingPeriods[].accidentDays | 40 | 30 (database:provisional-decision.abe.di-ltd.benefit-calculation); 60 (database:provisional-decision.abe.di-ltd.benefit-calculation); 90 (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| selected.applicants[].waitingPeriods[].key | 40 | "30-days" (database:provisional-decision.abe.di-ltd.benefit-calculation); "60-days" (database:provisional-decision.abe.di-ltd.benefit-calculation); "90-days" (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| selected.associationChoices[].key | 250 | "akron-bar-association" (database:provisional-decision.isitrust.li-10yr.journey-policy); "alabama-state-bar" (database:provisional-decision.isitrust.li-10yr.journey-policy); "american-mountain-guides-association" (database:provisional-decision.isitrust.li-10yr.journey-policy) |
| selected.columns[] | 7 | "Annual salary" (database:provisional-decision.csea.di-ltd.provisional-reference-table); "Monthly benefit" (database:provisional-decision.csea.di-ltd.provisional-reference-table); "Age <30" (database:provisional-decision.csea.di-ltd.provisional-reference-table) |
| selected.defaultUnderwritingPathway | 58 | "QD" (database:provisional-decision.abe.li-term.journey-policy); "TELE" (database:provisional-decision.abe.li-50plus.journey-policy); "NA" (database:provisional-decision.abe.li-add.journey-policy) |
| selected.dependentElections[].applicantKey | 2 | "spouse" (database:provisional-decision.csea.di-ltd.journey-policy); "child" (database:provisional-decision.csea.di-ltd.journey-policy) |
| selected.dependentElections[].key | 2 | "spouse-accident-disability" (database:provisional-decision.csea.di-ltd.journey-policy); "child-outpatient-accident" (database:provisional-decision.csea.di-ltd.journey-policy) |
| selected.dependentElections[].signatureRequired | 2 | false (database:provisional-decision.csea.di-ltd.journey-policy) |
| selected.dimensions.applicant | 58 | "required" (database:provisional-decision.abe.li-term.rate-input-policy) |
| selected.exclusiveProducts[] | 2 | "di-ltd-plus" (database:provisional-decision.abe.di-ltd.benefit-calculation); "di-ltd" (database:provisional-decision.abe.di-ltd-plus.benefit-calculation) |
| selected.existingPolicyRequired | 58 | true (database:provisional-decision.abe.li-term.selection-policy) |
| selected.fullTimeStudentRequired | 1 | false (database:provisional-decision.ama.preferred-child-age) |
| selected.healthForRiderOnly | 58 | false (database:provisional-decision.abe.li-term.selection-policy); true (database:provisional-decision.asce.li-term.selection-policy) |
| selected.identifiers | 1 | "Explicit mock-only placeholders; exact standalone AD&D identifiers are unresolved" (database:provisional-decision.csea.li-add.mock-identity) |
| selected.mappings[].riderCodes.csea.spouse-accident | 6 | "mock:csea.spouse-accident" (database:provisional-decision.csea.di-ltd.journey-policy) |
| selected.mappings[].when.applicantClass | 22 | "practicing" (database:provisional-decision.ama.di-level-rated.journey-policy); "resident" (database:provisional-decision.ama.di-level-rated.journey-policy); "clerical" (database:provisional-decision.csea.di-ltd.journey-policy) |
| selected.mappings[].when.applicantKey | 1790 | "member" (database:provisional-decision.abe.li-term.journey-policy); "spouse" (database:provisional-decision.abe.li-term.journey-policy); "child" (database:provisional-decision.abe.li-term.journey-policy) |
| selected.mappings[].when.associationKey | 1500 | "akron-bar-association" (database:provisional-decision.isitrust.li-10yr.journey-policy); "alabama-state-bar" (database:provisional-decision.isitrust.li-10yr.journey-policy); "american-mountain-guides-association" (database:provisional-decision.isitrust.li-10yr.journey-policy) |
| selected.membershipRequired | 58 | true (database:provisional-decision.abe.li-term.journey-policy) |
| selected.overrides[].sourceReferences[] | 6 | "Main!AO165" (database:provisional-decision.asce.li-10yr.rate-input-policy); "Main!AP165" (database:provisional-decision.asce.li-10yr.rate-input-policy); "Main!AR165" (database:provisional-decision.asce.li-10yr.rate-input-policy) |
| selected.payment.synchronizeAcrossProducts | 58 | true (database:provisional-decision.abe.li-term.journey-policy) |
| selected.productKey | 1 | "di-ltd" (database:provisional-decision.csea.identity) |
| selected.productScope | 1 | "User-confirmed October 5 member-only optional AD&D" (database:provisional-decision.csea.li-add.mock-identity) |
| selected.questions[].applicantKey | 267 | "member" (database:provisional-decision.abe.li-term.journey-policy); "spouse" (database:provisional-decision.abe.li-term.journey-policy); "child" (database:provisional-decision.abe.li-term.journey-policy) |
| selected.questions[].attestationKey | 267 | "abe.li-term.member.new.attestation" (database:provisional-decision.abe.li-term.journey-policy); "abe.li-term.member.increase.attestation" (database:provisional-decision.abe.li-term.journey-policy); "abe.li-term.spouse.new.attestation" (database:provisional-decision.abe.li-term.journey-policy) |
| selected.questions[].financialFields[] | 96 | "average-monthly-income" (database:provisional-decision.abe.di-ltd-plus.journey-policy); "hours-worked-per-week" (database:provisional-decision.abe.di-ltd-plus.journey-policy); "spouse-average-monthly-income" (database:provisional-decision.abe.di-ltd-plus.journey-policy) |
| selected.questions[].healthPage | 267 | "health-qd" (database:provisional-decision.abe.li-term.journey-policy); null (database:provisional-decision.abe.li-term.journey-policy); "health-li" (database:provisional-decision.abe.li-50plus.journey-policy) |
| selected.questions[].tobaccoFields[] | 414 | "smoker" (database:provisional-decision.abe.li-term.journey-policy); "tobacco-last-used" (database:provisional-decision.abe.li-term.journey-policy); "tobacco-products" (database:provisional-decision.abe.li-term.journey-policy) |
| selected.rateClass.sourceReferences[] | 172 | "Main!AO39" (database:provisional-decision.abe.li-term.rate-input-policy); "Main!AP39" (database:provisional-decision.abe.li-term.rate-input-policy); "Main!AR39" (database:provisional-decision.abe.li-term.rate-input-policy) |
| selected.rateClass.sourceText | 58 | "2 Risk Classes:\n- Standard (Smoker)\n- Preferred (NonSmoker)\nYes to Smoking Question: Standard Rate\nNo to Smoking Question: Preferred Rate\nQD rate classes\nStandard for non smoker\nSt" (database:provisional-decision.abe.li-term.rate-input-policy); "Initial Level Period - 3 Risk Classes\nNEW Effective 6/1/24:\nSAME 3 Risk Classes FULL Underwriting ages 65-69 for $500K and below\n- Preferred\n- Select (NonSmoker)\n- Standard (Smoker" (database:provisional-decision.abe.li-10yr.rate-input-policy); "Initial Level Period - 3 Risk Classes:\nNEW Effective 6/1/24:\n3 Risk Classes FULL Underwriting ages 55-59:\n- Preferred (the best NonSmoker)\n- Select (NonSmoker)\n- Standard (Smoker)\n" (database:provisional-decision.abe.li-20yr.rate-input-policy) |
| selected.riderOnlyApplicants[] | 6 | "member" (database:provisional-decision.asce.li-term.selection-policy); "spouse" (database:provisional-decision.asce.li-term.selection-policy) |
| selected.riders[].applicants[] | 35 | "member" (database:provisional-decision.abe.li-term.selection-policy); "spouse" (database:provisional-decision.abe.li-term.selection-policy) |
| selected.riders[].included | 20 | false (database:provisional-decision.abe.li-term.selection-policy) |
| selected.riders[].key | 20 | "rider.li-term.cir.257833729694906" (database:provisional-decision.abe.li-term.selection-policy); "rider.li-term.wop.53710593017410" (database:provisional-decision.ama.li-term.selection-policy); "rider.li-10yr.add.12305572062537" (database:provisional-decision.ama.li-10yr.selection-policy) |
| selected.rules[].applicantKey | 4 | "spouse" (database:provisional-decision.isitrust.li-add.family-benefits); "child" (database:provisional-decision.isitrust.li-add.family-benefits) |
| selected.rules[].derived.baseApplicantKey | 4 | "member" (database:provisional-decision.isitrust.li-add.family-benefits) |
| selected.rules[].derived.siblingApplicantKey | 4 | "child" (database:provisional-decision.isitrust.li-add.family-benefits); "spouse" (database:provisional-decision.isitrust.li-add.family-benefits) |
| selected.rules[].requires.applicantKeys[] | 4 | "member" (database:provisional-decision.isitrust.li-add.family-benefits) |
| selected.siteVariant | 1 | "standard" (database:provisional-decision.csea.identity) |
| selected.sourceReferences[] | 170 | "Main!AO39" (database:provisional-decision.abe.li-term.rate-input-policy); "Main!AP39" (database:provisional-decision.abe.li-term.rate-input-policy); "Main!AR39" (database:provisional-decision.abe.li-term.rate-input-policy) |
| selected.sourceRow | 1 | 246 (database:provisional-decision.csea.identity) |
| sourceOwner | 15 | "global" (database:mcr.standard-decision-wording.B2.decision-status.60454667843042); "AAFP" (database:mcr.standard-decision-wording.B7.decision-status.154793688102389); "AMA QD Decision Wording Verification" (database:mcr.standard-decision-wording.B12.decision-status.126567369520854) |
| sourceReconciliation | 290 | "deferred" (database:provisional-decision.abe.di-ltd.benefit-calculation) |
| sourceReferences[] | 2484 | "Main!E386" (database:migration-decision.waepa-gi.member-fixed-offer); "Main!G386" (database:migration-decision.waepa-gi.member-fixed-offer); "Main!H386" (database:migration-decision.waepa-gi.member-fixed-offer) |
| sourceRow | 43 | 39 (database:migration-decision.abe.li-term.reviewed-numeric); 40 (database:migration-decision.abe.li-10yr.reviewed-numeric); 41 (database:migration-decision.abe.li-20yr.reviewed-numeric) |
| targets[].key | 8 | "asce.li-10yr.approved-eligibility.member" (database:business-decision.asce.li-10yr.base-eligibility-ages); "asce.li-10yr.approved-eligibility.spouse" (database:business-decision.asce.li-10yr.base-eligibility-ages); "asce.li-20yr.approved-eligibility.member" (database:business-decision.asce.li-20yr.base-eligibility-ages) |
| targets[].table | 8 | "eligibilityConstraints" (database:business-decision.asce.li-10yr.base-eligibility-ages); "underwritingBands" (database:business-decision.asce.li-10yr.underwriting.3) |
| targets[].values.applicantClass | 4 | null (database:business-decision.asce.li-10yr.underwriting.3) |
| targets[].values.applicantTypeKey | 8 | "member" (database:business-decision.asce.li-10yr.base-eligibility-ages); "spouse" (database:business-decision.asce.li-10yr.base-eligibility-ages) |
| targets[].values.conditionKey | 4 | null (database:business-decision.asce.li-10yr.underwriting.3) |
| targets[].values.mortalityMorbidity | 4 | null (database:business-decision.asce.li-10yr.underwriting.3) |
| targets[].values.pathway | 4 | "FUW" (database:business-decision.asce.li-10yr.underwriting.3) |
| targets[].values.productKey | 8 | "li-10yr" (database:business-decision.asce.li-10yr.base-eligibility-ages); "li-20yr" (database:business-decision.asce.li-20yr.base-eligibility-ages) |
| targets[].values.siteKey | 8 | "asce" (database:business-decision.asce.li-10yr.base-eligibility-ages) |
| visibleWhen | 5 | true (database:mcr.waepa-cir-questions.A5.follow-up.247992131698161); "yes" (database:mcr.waepa-cir-questions.explanation-default.70310987580795) |
| visibleWhen.fact | 4 | "income-sources" (database:mcr.financial-questions.sole-proprietor-section.69198864545446); "self-employed" (database:mcr.financial-questions.self-employed-follow-ups.176633073119582) |
| whenAnyOperandBlank | 1 | 0 (database:mcr.financial-questions.calculation-defaults.116791672287845) |
| whenFalse.fact | 12 | "applicant.monthlyEarnings" (database:mcr.plan.disability.d1.3.maximum-benefit-expression.81345576367865); "applicant.averageMonthlyIncome" (database:mcr.plan.disability.d31.40.maximum-benefit-expression.244620329540525) |
| whenFalse.hide[] | 3 | "income-sources" (database:mcr.financial-questions.self-employment.225602050811068); "self-employment-duration" (database:mcr.financial-questions.self-employment.225602050811068); "work-from-home" (database:mcr.financial-questions.self-employment.225602050811068) |
| whenTrue | 12 | 15000 (database:mcr.plan.disability.d1.3.maximum-benefit-expression.81345576367865); 20000 (database:mcr.plan.disability.d16.20.maximum-benefit-expression.204510235665851); 10000 (database:mcr.plan.disability.d28.37.maximum-benefit-expression.210221270122033) |

## identity resolutions candidate keys

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:773`. Contract: `Json`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## url definitions parameters

SQL source: `supabase/migrations/202609280001_canonical_normalization.sql:788`. Contract: `Json`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| association | 429 | "acronym" (database:mcr.url.94546514986785); "" (database:mcr.url.128309360599325); "Meyer" (database:mcr.url.33579535233109) |

## portal library drafts payload

SQL source: `supabase/migrations/202610020001_library_publication.sql:8`. Contract: `RPC payload / SQL only`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## portal library releases payload

SQL source: `supabase/migrations/202610020001_library_publication.sql:18`. Contract: `RPC payload / SQL only`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## migration schedules milestones

SQL source: `supabase/migrations/202610050001_migration_schedule.sql:2`. Contract: `Record<"requirements" \| "prototype" \| "uat" \| "preprod" \| "production", MigrationMilestone>`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## analytics tags events

SQL source: `supabase/migrations/202610050002_analytics_tags.sql:2`. Contract: `AnalyticsEvent[]`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## analytics tags sites

SQL source: `supabase/migrations/202610050002_analytics_tags.sql:2`. Contract: `string[]`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## analytics tags permitted properties

SQL source: `supabase/migrations/202610050002_analytics_tags.sql:2`. Contract: `readonly string[]`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## analytics tags adobe

SQL source: `supabase/migrations/202610050002_analytics_tags.sql:2`. Contract: `{ mapping: string \| null; status: "not-configured"; }`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## analytics tags contentsquare

SQL source: `supabase/migrations/202610050002_analytics_tags.sql:2`. Contract: `{ mapping: string \| null; status: "not-configured"; }`.

No candidate paths observed in these exports. This is not evidence that the JSON cannot contain references.

## components definition

SQL source: `supabase/migrations/202610120001_portal_components.sql:2`. Contract: `{ name: string; description: string; section: string; storyId: string; storybookPath: string; source: string; }`.

| Path | Occurrences | Sample value and row |
| --- | --- | --- |
| source | 67 | "src/components/layout/DetailsTable.tsx" (database:component-details-table); "src/components/forms/YesNoDetailList.tsx" (database:component-yes-no-detail-list); "src/components/ui/EstimatedRate.tsx" (database:component-estimated-rate) |
| storybookPath | 67 | "?path=/story/application-patterns-detailstable--confirmation-details" (database:component-details-table); "?path=/story/application-patterns-yesnodetaillist--interactive" (database:component-yes-no-detail-list); "?path=/story/components-estimated-rate--available" (database:component-estimated-rate) |
| storyId | 67 | "application-patterns-detailstable--confirmation-details" (database:component-details-table); "application-patterns-yesnodetaillist--interactive" (database:component-yes-no-detail-list); "components-estimated-rate--available" (database:component-estimated-rate) |

