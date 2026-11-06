# ASCE corrective pass before Phase 5

Historical corrective-pass record. The six eligibility/older-age underwriting unknowns below have since been [explicitly approved in canonical records](../asce-business-decisions.md). Compatibility authoring remains unchanged pending Phase 6.

Source: `ASCE_Portal_Site_Rules.xlsx` supplied from Downloads; its source is
`Master Client Requirements-08.27.2025_v77.xlsx`. The inventory is requirements
input, not an instruction to deploy or resolve its open issues.

## Requirements and persistence

The canonical `CoverageDefinition` and Client override shape now carry scoped
eligibility requirements, category-level applicant dependencies, maximum plan
counts, an ordered income/cap policy, mandatory benefit/waiting-period options,
and underwriting bands. Requirements replace as a complete product override;
amount assignments and identifiers retain their existing scoped merge behavior.
The existing Phase 1–4 fixture compiler serializes these values through
configuration definitions/values. The independent database resolver reconstructs
them without importing source configuration.

- Child Life: unmarried, at least 14 days old, through completed age 22, or
  completed age 24 if a full-time student. Member Life on any Life product is
  required; only one child Life plan is allowed. No spouse same-product
  dependency is added.
- Ten-year Life: Core QD ages 18–64 through $500,000; Expanded QD Fluidless ages
  18–60 over $500,000 through $2 million; Expanded QD FUW ages 61–64 over
  $500,000 through $2 million. Ages 65–69 are retained with unspecified
  underwriting. Source: Life Products!E2.
- Twenty-year Life: Core QD ages 18–54 through $500,000; Expanded QD Fluidless
  ages 18–54 over $500,000 through $2 million. Ages 55–59 retain unspecified
  underwriting and the source's Expanded QD FUW N/A. Source: Life Products!E3.
- DI: $150 increments; maximum is lesser of 60% of average monthly income and
  the first applicable cap: self-employed under one year $1,050; otherwise ages
  65–69 $4,200; otherwise $8,550. Under one year self-employed mandates the
  Five-Year Plan and 90 days. Member ages 17–69 and 30 hours/week; spouse ages
  17–59 with $500, 30 days, and two years.

`coverageRequirements.ts` evaluates eligibility, benefit limits, relationships,
and underwriting band matching from these declarations. Missing eligibility
facts return `needs-information`. Coverage navigation enforces child/member and
one-plan dependencies; its member work threshold now reads the declaration.
The consumer continues to use source configuration and its existing form/routing
architecture. The scalar underwriting type remains a compatibility routing
value; no disputed base eligibility or older-age underwriting is inferred from it.

## Intentionally unresolved

- Twenty-year plan: summary 121 versus detailed 102. Retain current **121**.
- Base Life eligibility: summary 17–64 / 17–54 conflicts with bands beginning
  at 18 and additional older-age treatment. Preserved as unresolved product
  metadata; detailed underwriting bands do not establish base eligibility.
- Older-age underwriting is unspecified; no type is assigned to those bands.
- Rate finality and current authoritative actuarial rate source.
- Campaign landing-page mismatch to an AMA/Majesco path. Preserve the documented
  campaign URL as inactive metadata pending confirmation.
- ASCEGI/ASCENCGI purpose, products, flows, and eligibility. No functional Sites
  were created for these names.
- ASCE-specific beneficiary, decision, consent, payment, autosave/resume, MFA,
  and reminder-email behavior. Existing generic behavior is preserved.
- The no-save/returning variation's behavior is unconfirmed; its link is inactive.

## Site environment links

`site_environment_links` has stable IDs/keys, a foreign key to `sites.key`, an
explicit environment and link type, label, URL, active flag, and position.
Supported environments: prototype, test/UAT, pre-production, production,
automation. Only configured active launch links appear as compact external
launch actions. No prototype URL was invented from the inventory.

The ASCE TPA label is now Pearl Insurance, as documented in Overview!B3,
while preserving its existing stable ownership key.

The additive fourth SQL migration enables RLS and a read-only prototype policy
for public URL metadata. It does not open access to the other library tables or
switch the consumer repository. The local seed, Supabase demo seed, migration
fixture/export, and existing-storage additive fallback contain the ASCE links.
The migration gate validates ownership, enums, URL scheme, idempotence, and real
PostgreSQL readback through the adapter.

Reference-only variant URLs from URLs!A9:D16:

| Reference | Production | Pre-production | Test/model | Automation |
| --- | --- | --- | --- | --- |
| ASCEGI | https://ascegi.nylinsure.com | https://ascegipreview.nylinsure2.com | https://ascegi.nylinsure2.com | https://ascegipreview2.nylinsure2.com |
| ASCENCGI | https://ascencgi.nylinsure.com | https://ascencgipreview.nylinsure2.com | https://ascencgi.nylinsure2.com | https://ascencgipreview2.nylinsure2.com |

## Admin Center information architecture

Persistent tabs replace the card landing page: Pages & Fields (including
validation), Coverage (identifiers, amounts, riders, underwriting, requirements,
notes/options), Rules & Flows, Features & Configuration (including URL
parameters), Content, Communications (email and documents), Branding & Design.

Global mode has no Client/Site scope selector. Effective Site has one shared
TPA → Client → Site selector, canonical `?site=`, a summary with identity,
association, support, and branding, and an interactive mobile preview. Scope and
Site remain selected across tabs. Former library URLs map into the consolidated
domain; the old Site Details components and standalone implementation remain
compatibility references, not top-level Portal Library destinations.

Sites filters follow TPA/Organization → Client → Site → Status. Parent selection
resets dependent filters. The table shows TPA, Client, Site/key, environment
launch icons, status, and Admin Center actions. Home's Site inspection also stays
inside Admin Center. Existing edit/archive/restore actions remain available.

Storybook is exposed both under Portal navigation and as **Open Storybook** in
Branding & Design, using `getStorybookUrl()`.

`WorkspaceHeader` owns optional breadcrumbs and back destination; nested paths
receive parent breadcrumbs automatically. The compact accessible back icon sits
beside the heading. Changes, Releases, and Applications no longer duplicate a
large right-side back button. Portal Library provides its domain breadcrumb.

## Validation

Focused ASCE tests run against both independently resolved source and database
products, with explicit age/amount/income boundaries, relationship failures,
spouse independence, package values, and missing-data behavior. Environment
integrity and browser-facing scope/filter/navigation tests supplement the
existing migration equivalence, mutation, and export checks.

Final validation: 467/467 tests passed including real PostgreSQL readback; four
SQL migrations applied, seed applied twice without changes, seven invalid writes
rejected, and all 40 library tables have RLS. Production build and targeted lint
passed. Vite reports a bundle-size warning. Browser checks covered Global scope,
Site retention, dependent filters, Storybook links, the selected-Site mobile
preview, and 320/390/1440px layouts. See `migration-artifacts/gate-summary.json`
and its companion reports for saved evidence.
