# Phase 5 — Repository access with compatibility resolution

Phase 4C is closed successfully. The six ASCE decisions are now explicitly approved in canonical records. Readiness is re-evaluated against those records and approval evidence; compatibility runtime transport remains unchanged.

## Read boundaries

- `repositories/siteRepository.ts` owns Site, Client, TPA, Association, relationship and alias reads, and the existing `ClientConfig` compatibility projection. Application Site lookup and domain resolvers read this repository; `data/registry.ts` remains a compatibility export for existing consumers.
- `staticSiteAdapter.ts` supplies the current authored snapshot. It is the application default, preserving the ten prototype Sites and legacy URL/session aliases.
- `persistedSiteAdapter.ts` asynchronously hydrates the same repository contract through `PersistenceAdapter`. It maps database IDs to semantic keys and reconstructs scoped compatibility configuration, branding, support and flow overrides. It reads neither normalized underwriting/eligibility tables nor MCR source evidence. Missing required data rejects hydration; it does not fall back to static data. Archived Sites and unassigned archival Clients are not activated.
- `persistedRepositories.ts` supplies current, uncached foundational reads through either the existing local-storage or Supabase adapter. Admin Home, Sites, Applications, Changes and SiteService use these repositories for foundation data. Service mutation and audit behavior is retained.
- `libraryRepository.ts` provides curated catalog reads to Portal Library and its foundational detail panels. Its static snapshot preserves React-rich descriptions and existing resolvers. It does not load migration fixtures, source-only records, pattern candidates or New UX sheets. Replacing these display definitions with normalized runtime data is not part of Phase 5.
- `canonicalMetadataRepository.ts` transports persisted eligibility and underwriting rows for inspection, including approved ASCE eligibility and FUW pathways. It has no decision API and does not feed the compatibility projection.

The application's default remains the static compatibility adapter. The persisted adapter is available through `await loadPersistedSiteAdapter(adapter)` followed by `createSiteRepository(...)`; it is verified against the same contract. This does not automatically switch a running browser's configuration when administrative records change. Phase 5 introduced no final `EffectiveSite` implementation or normalized-rule runtime consumer. The subsequent [Phase 6A candidate resolver](phase6a-effective-site.md) is opt-in and leaves this runtime boundary intact.

## Readiness

The report retains `blockers`, `blockingCount`, `phase5Blockers`, `phase5BlockingCount`, and `phase6Ready`, and adds `businessDecisions` inspection results. Each of the six historical ASCE unknowns clears only when its approved canonical values and persisted approval evidence match. The old six-key deferral list is removed. New unknowns, missing or changed approvals/rules, unresolved promotions, missing Site relationships and integrity errors still block. `migration:semantic-gate` checks Phase 5 readiness; Canonical Review displays both counts.

Readiness is conditional on compatibility preservation. It is not permission to execute the incomplete normalized rules. Repository tests prove that changing normalized underwriting or eligibility rows cannot change repository-backed `ClientConfig` behavior across all ten Sites. A guarded adapter rejects reads outside an explicit compatibility table allowlist, so new normalized decision tables are isolated by default. A separate invariant removes every non-compatibility table and checks effective configuration, coverage, fields, pages and flows for every Site. Changing this allowlist requires deliberate architecture review; it must not be derived from the implementation's reads.

The [approved ASCE decision register](../asce-business-decisions.md) records the six exact readiness keys, approved answers, superseded conflicts and canonical target keys. Approval does not activate the runtime.

## Validation

Current approved-decision pass:

- Full suite: **606 passed**, one PostgreSQL test conditionally skipped; no database deployment or fresh PostgreSQL readback was performed.
- Production build (including TypeScript), lint and `git diff --check` passed; the existing Vite bundle-size warning remains.
- Fresh migration export and semantic gate passed: **Phase 5 ready, Phase 6 ready, zero blockers, zero integrity errors**, six approved decisions. The export initially timed out while running alongside the full suite, then passed standalone with the unchanged five-second timeout.
- Updated [machine-readable report](mcr-coverage.json); regenerated `migration-artifacts/database.json`, `seed.sql`, and `mcr-coverage.json`. The older PostgreSQL readback artifact predates these decisions and is not evidence for the updated rows.
- Approval-loss, rule-change, scope/value, provenance, age-boundary, idempotence and ten-Site compatibility tests pass. No runtime resolver or adapter activation was introduced.

Historical validation before business approval follows.

Repository tests compare all ten Sites against the independent legacy configurations, including coverage, fields, pages and flows. Persisted readback tests compare the same results after adapter hydration, plus association relationships. Additional tests cover injected data, fresh reads after updates, missing IDs, transport failure propagation, incomplete hydration, all four unspecified older-age underwriting bands, retained eligibility unknowns, and new-unknown gate failures. Existing migration equivalence tests continue to cover content, routing, rules, support and branding.

PostgreSQL validation remains a real row-readback test through Supabase column mapping with a stubbed transport; it is not a hosted PostgREST end-to-end test.

Validation on 2026-09-28:

- Full suite: 592 passed, one PostgreSQL test conditionally skipped.
- That PostgreSQL test then passed separately using the existing `migration-artifacts/postgres.json` row-readback artifact, including the new repository hydration assertions: 593 distinct passing tests across both runs. The database seed was not re-applied in this pass.
- Production build, TypeScript, lint and `git diff --check` passed. The existing Vite bundle-size warning remains.
- Regenerated migration export and semantic gate passed: Phase 5 ready, zero Phase 5 blockers, six Phase 6 blockers, zero integrity errors.
- Source boundary counts remain 43,576 source-only records, 1,742 pattern candidates and two deliberate canonical promotions.

Completion hardening validation on 2026-09-28:

- Full suite: 595 passed, one PostgreSQL test conditionally skipped; PostgreSQL was not rerun in this pass.
- Production build (including TypeScript), lint and `git diff --check` passed. The existing Vite bundle-size warning remains.
- Repository readiness assertions still confirm Phase 5 ready and six Phase 6 blockers. No runtime adapter, resolver, business decision or persisted record was changed.
