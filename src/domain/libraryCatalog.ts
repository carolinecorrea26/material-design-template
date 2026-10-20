/** Canonical design catalog. Review definitions only; no runtime activation. */
export const patternCatalog = [
  {
    "key": "tpa-integration",
    "name": "Global TPA Integration Framework",
    "category": "integration",
    "summary": "Lookup after initial application page; resolve membership/coverage status; execute client-configured decision path.",
    "variations": [
      "coverage-based-verification",
      "membership-based-auto-approval"
    ],
    "relatedTables": [
      "patterns",
      "pattern_assignments",
      "rules",
      "conditions",
      "flags",
      "flows",
      "configuration_definitions"
    ]
  },
  {
    "key": "tpa-coverage-based-verification",
    "name": "TPA Coverage-Based Verification",
    "category": "integration",
    "summary": "Standard / AMA: lookup First Name, Last Name and DOB. ASCE additionally requires Membership ID. Existing member + active coverage runs LexisNexis; pass enables portfolio and auto-approval; fail/skipped falls back to TPA admin manual review without portfolio.",
    "relatedTables": [
      "patterns",
      "rules",
      "conditions",
      "flags",
      "flows"
    ]
  },
  {
    "key": "tpa-membership-based-auto-approval",
    "name": "TPA Membership-Based Auto Approval",
    "category": "integration",
    "summary": "WAEPA variation: lookup First Name, Last Name and DOB. New member auto-approves; existing member goes to TPA admin manual review regardless of coverage status. Neither branch runs LexisNexis or displays a portfolio.",
    "relatedTables": [
      "patterns",
      "rules",
      "conditions",
      "flags",
      "flows"
    ]
  },
  {
    "key": "di-income-replacement",
    "name": "Disability Income Replacement Formula",
    "category": "calculation",
    "summary": "Maximum Benefit = MIN(Monthly Income \u00d7 Replacement %, Policy Cap), with age/plan/class exceptions, tiered percentages, fixed increments, existing-coverage offsets, and fixed/age-based exceptions.",
    "relatedTables": [
      "patterns",
      "coverage_amount_patterns",
      "product_amount_rules",
      "conditions",
      "rules"
    ]
  },
  {
    "key": "coverage-amount-options",
    "name": "Coverage Amount Option Families",
    "category": "coverage-amount",
    "summary": "Covers fixed, set/list, range+increment, tiered ranges, range+fixed, conditional, calculated, named/code, N/A, attribute-mapped, formula-capped, base-reference, multiplier, election-only and unspecified-increment patterns.",
    "relatedTables": [
      "patterns",
      "coverage_amount_patterns",
      "product_amount_rules",
      "rider_amount_rules",
      "conditions"
    ]
  }
] as const;
export const flagCatalog = [
  {
    "key": "site.has-product-rates",
    "name": "Site has product rates",
    "level": "site",
    "valueType": "boolean",
    "persistence": "configuration",
    "behavior": "When false, all rate displays must be hidden; enforced by rule."
  },
  {
    "key": "site.product-rates-in-prase",
    "name": "Site product rates are in PRASE",
    "level": "site",
    "valueType": "boolean",
    "persistence": "configuration"
  },
  {
    "key": "site.offers-qd",
    "name": "Site offers QD",
    "level": "site",
    "valueType": "boolean",
    "persistence": "derived-runtime",
    "derivation": "True when at least one enabled product supports QD."
  },
  {
    "key": "applicant.applying-for-qd",
    "name": "Applicant applying for QD",
    "level": "applicant",
    "valueType": "boolean",
    "persistence": "derived-runtime",
    "derivation": "True when selected product/path is QD for applicant."
  },
  {
    "key": "product.has-qd",
    "name": "Product has QD",
    "level": "product",
    "valueType": "boolean",
    "persistence": "derived-runtime",
    "derivation": "Depends on configured QD pathway and current applicant selections/amount bands."
  },
  {
    "key": "qd.decision",
    "name": "QD decision",
    "level": "application",
    "valueType": "enum",
    "allowedValues": [
      "approve",
      "reject",
      "refer",
      "error"
    ],
    "persistence": "application-record"
  }
] as const;
