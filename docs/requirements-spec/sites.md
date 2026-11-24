# Effective Sites

All ten business Sites are enrolled by user instruction November 23, 2026:
ABE, AMA, AMA-GI, ASCE, AVMA, CSEA, NSO, ISI Trust, WAEPA and WAEPA GI.
The synthetic Demo fixture is excluded from deployment and Library Site selection.

The global template owns page structure, fields, components, rules, defaults and
URL contracts. Each Site's assignments and supported overrides live under
`requirements/parked/sites/<site>/`. Library, prototype and Storybook consume the
same compiled projection. No Site has its own page implementation.

The five newly transferred portfolios retain the previously reviewed captured
product, rider, eligibility, underwriting, Association and questionnaire values.
Existing approved exceptions and explicitly provisional policies are preserved;
source transfer does not turn provisional values into confirmed policies.
Shared pages inherit the current reviewed composition rather than old snapshots.
ASCE and WAEPA retain optional Beneficiary participation; ASCE Payment remains
optional. AMA-GI retains individual product limits only, without an aggregate cap.

Routine verification enumerates every effective Site and groups application
journeys by meaningful configuration differences. Shared behavior runs once.
`?dev` opens internal scenario and product selection plus page jumps, using those
same resolved rules and scenario builders. No external service is required.
