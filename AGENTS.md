# Fresh-start model

This is an established architecture, not an open design question.

- There is one global template. Shared page structure, fields, components,
  content definitions, rules, configuration definitions/defaults and URL
  parameter contracts belong to it.
- An effective Site is the global template plus assigned products, values,
  content selections and overrides. Site-specific data belongs under
  `requirements/parked/sites/<site>/`; do not add Site-specific implementations
  or visibility gates for shared capabilities.
- ASCE is the first effective Site being reviewed and rolled out. That does not
  make shared behavior ASCE-owned. ABE, AMA, AMA-GI, AVMA, CSEA, NSO, ISI Trust, WAEPA and WAEPA GI are also
  authorized for enrollment (user instruction November 23, 2026). Demo is not a
  business Site. Synthetic Sites are appropriate for inheritance checks.
- For each change, identify its owner: global definition/default or effective-Site
  assignment/override. Source references to ASCE or its MCR are provenance, not scope.
- Library, prototype and Storybook must use the same fresh-start source/projection.
  Do not add parallel constants, editable generated output, or legacy fallbacks
  for reviewed surfaces. Shared Library definitions remain global under Site filters.
- Storybook examples must use real fresh-start fields and supported components.
  Keep variations only for meaningful differences in structure, configuration or
  behavior. Do not duplicate the same name layout by page or person; the Name
  group has only with-Title and without-Title examples.
- Component reuse is a required part of every page audit. Check existing shared
  components and repeated structure/interaction before adding or retaining a
  page-specific wrapper. Differences in wording, topic, applicant, product or Site
  values should use data, configuration or slots when the behavior is shared.
  Keep distinct components for meaningful composition or behavior, and document
  that boundary. Check page integration and shared variations without duplicating
  canonical components, stories or approval rounds.
- Keep confirmed user exceptions intact. Ask unresolved policy questions during the
  migration; do not defer them or call a reviewed page complete while they remain open. Use the MCR for
  effective-Site policy values. Record planned requirements separately from
  implemented behavior. Prototype rates are fictional; no real service is implied.
- The animated Home illustration and Fast Track are excluded from requirements
  and content-hardcoding audits. Leave their demonstration implementations out of
  these source migrations.

## Checks and reporting

- Run `npm run test:fresh-start` when changing ownership, inheritance, shared
  configuration, Library scope or the fresh-start compiler. It is also a build gate.
- Run focused tests for other affected behavior. Do not run every suite for every edit.
- Before calling a reviewed surface complete, verify it works without superseded
  authored records, that its consumers agree on the fresh-start projection, and
  that component reuse and any justified page-specific boundaries are accounted for.
- Report ownership, implementation status and relevant verification briefly.
  Do not reopen settled architecture or restart the page review.

Ownership reference: `docs/requirements-spec/README.md`.
Coverage definitions and effective-site evidence: `docs/requirements-spec/coverage.md`.
