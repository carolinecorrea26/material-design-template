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
  make shared behavior ASCE-owned. Keep other real-site rollouts out of scope;
  synthetic Sites are appropriate for inheritance checks.
- For each change, identify its owner: global definition/default or effective-Site
  assignment/override. Source references to ASCE or its MCR are provenance, not scope.
- Library, prototype and Storybook must use the same fresh-start source/projection.
  Do not add parallel constants, editable generated output, or legacy fallbacks
  for reviewed surfaces. Shared Library definitions remain global under Site filters.
- Keep confirmed user exceptions and deferred decisions intact. Use the MCR for
  effective-Site policy values. Record planned requirements separately from
  implemented behavior. Prototype rates are fictional; no real service is implied.

## Checks and reporting

- Run `npm run test:fresh-start` when changing ownership, inheritance, shared
  configuration, Library scope or the fresh-start compiler. It is also a build gate.
- Run focused tests for other affected behavior. Do not run every suite for every edit.
- Before calling a reviewed surface complete, verify it works without superseded
  authored records and that its consumers agree on the fresh-start projection.
- Report ownership, implementation status and relevant verification briefly.
  Do not reopen settled architecture or restart the page review.

Ownership reference: `docs/requirements-spec/README.md`.
Coverage definitions and effective-site evidence: `docs/requirements-spec/coverage.md`.
