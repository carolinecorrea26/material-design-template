# Approved ASCE business decisions before Phase 6

Status: all six decisions approved by the user in this conversation. Canonical records now carry these approved requirements. The compatibility prototype and its unresolved historical authoring snapshot are unchanged; canonical approval does not activate runtime behavior.

## Approval evidence

The user explicitly stated “These six ASCE business decisions are now resolved” and supplied:

1. **10-Year Level Term eligibility:** ages **18–69**.
2. **20-Year Level Term eligibility:** ages **18–59**.
3. **10-Year member, ages 65–69:** **FUW**.
4. **10-Year spouse, ages 65–69:** **FUW**.
5. **20-Year member, ages 55–59:** **FUW**.
6. **20-Year spouse, ages 55–59:** **FUW**.

**FUW = Fully Underwritten / normal underwriting process.**

Authority: the user's explicit approval and implementation instruction in the ASCE business-decisions conversation. This versioned register is the durable transcription of that approval; no separate named UW/Contracts sign-off or deployment effective date has been asserted. The two product eligibility answers apply to member and spouse, as scoped in the decision packet. Ages are inclusive completed years under the existing age-years convention. Child requirements remain unchanged. Older-age amounts retain their existing inclusive $100,000–$2,000,000 range; the approval changes the pathway to FUW and does not change amounts.

## Approved decision register

All rows apply to Site `asce-default`. Each exact readiness key links to a persisted approval record with key `business-decision.<readiness key>` in `semanticRequirements`. That record has domain `approved-business-decision`, predicate `approved-canonical-site-rule`, storage status `documented`, and payload `approvalStatus: approved`. The payload retains the answer, authority, approval reference, target keys and expected canonical values. `runtimeActivation: pending-phase-6` explicitly separates approval from execution.

<a id="asce-default.li-10yr.base-eligibility-ages"></a>
### 10-Year eligibility

- Readiness key: `asce-default.li-10yr.base-eligibility-ages`.
- Approved rule: member and spouse ages **18–69**, inclusive.
- Canonical targets: `eligibilityConstraints` keys `asce-default.li-10yr.approved-eligibility.member` and `asce-default.li-10yr.approved-eligibility.spouse`.
- Superseded conflict: summary 17–64 versus underwriting starting at 18 and older-age bands; ASCE_Portal_Site_Rules.xlsx, Open Issues!C3; Life Products!E2.

<a id="asce-default.li-20yr.base-eligibility-ages"></a>
### 20-Year eligibility

- Readiness key: `asce-default.li-20yr.base-eligibility-ages`.
- Approved rule: member and spouse ages **18–59**, inclusive.
- Canonical targets: `eligibilityConstraints` keys `asce-default.li-20yr.approved-eligibility.member` and `asce-default.li-20yr.approved-eligibility.spouse`.
- Superseded conflict: summary 17–54 versus underwriting starting at 18 and older-age bands; Open Issues!C3; Life Products!E3.

<a id="asce-default.li-10yr.underwriting.3"></a>
### 10-Year member underwriting

- Readiness key: `asce-default.li-10yr.underwriting.3`.
- Approved rule: member ages **65–69**, **FUW**.
- Canonical target: `underwritingBands` key `asce-default.li-10yr.3`.
- Supersedes unspecified treatment in Life Products!E2.

<a id="asce-default.li-10yr.underwriting.7"></a>
### 10-Year spouse underwriting

- Readiness key: `asce-default.li-10yr.underwriting.7`.
- Approved rule: spouse ages **65–69**, **FUW**.
- Canonical target: `underwritingBands` key `asce-default.li-10yr.7`.
- Supersedes unspecified treatment in Life Products!E2.

<a id="asce-default.li-20yr.underwriting.2"></a>
### 20-Year member underwriting

- Readiness key: `asce-default.li-20yr.underwriting.2`.
- Approved rule: member ages **55–59**, **FUW**.
- Canonical target: `underwritingBands` key `asce-default.li-20yr.2`.
- Supersedes unspecified treatment and “Expanded QD FUW N/A” in Life Products!E3.

<a id="asce-default.li-20yr.underwriting.5"></a>
### 20-Year spouse underwriting

- Readiness key: `asce-default.li-20yr.underwriting.5`.
- Approved rule: spouse ages **55–59**, **FUW**.
- Canonical target: `underwritingBands` key `asce-default.li-20yr.5`.
- Supersedes unspecified treatment and “Expanded QD FUW N/A” in Life Products!E3.

## Readiness and runtime boundary

The fixture/export compiler applies these approvals after source extraction, to canonical tables only. Extracted workbook cells remain historical evidence. Existing source promotion counts are unchanged. Approval records and rule rows carry references to this register; no provider identity is invented.

The readiness inspector requires exactly one matching approval and each exact canonical target, including scope, values and provenance. It clears only that decision's exact historical blocker key. Missing or modified approvals/rules reopen blockers even if the compatibility snapshot's unknowns are removed. The former six-key Phase 5 deferral list has been removed; new unknowns, integrity errors and unresolved adopted source requirements still block readiness.

With the approved fixture: `phase5Ready: true`, `phase6Ready: true`, zero blockers, zero integrity errors. This authorizes planning the separately reviewed Phase 6 implementation; it does not switch repositories or activate normalized rules. The intended later path remains persisted approved data → normalized domain model → EffectiveSite → application runtime.

Other source issues in [the corrective pass](asce-corrective-pass.md) remain recorded. This approval resolves these six requirements only.
