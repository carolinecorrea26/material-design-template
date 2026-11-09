# Membership (ASCE)

Status: complete for the reviewed ASCE scope. Coverage is the next application page
to review; Eligibility has already been reviewed.

Membership is a required form page in Getting started, at `/membership`.
Its component tree uses the same frame and section structure as Eligibility:
FormRoutePage, progress, page header/help, page alerts, MembershipStatus and
MemberInformation in a FieldGroup, AdditionalMembershipInformation, and PageNav.

| Fact | Authoritative requirements |
|---|---|
| Components | `requirements/parked/membership.json` |
| Available fields | `requirements/mappings/components/membership.json` |
| Field definitions and attestation configurations | `requirements/parked/field-details.json` |
| ASCE field wording, attestation configuration and requiredness | `requirements/parked/sites/asce/fields.json` |
| ASCE inclusion and page note | `requirements/parked/sites/asce/pages/membership.json` |
| Rules and workflow applicability | `requirements/mappings/requirements/membership.json` |
| Member-only browser autofill | `requirements/global/rules/fields.json`; mapped through the shared form wrapper |
| Membership behavior | `requirements/global/rules/membership.json` |
| Autosave start | `requirements/global/workflows/application.json` |
| Nightly abandoned-lead batches | `requirements/global/rules/application.json` |
| Page wording and note | `requirements/global/content/membership.json` |

ASCE selects the shared yes/no membership attestation, with the question “Are you
a member of the American Society of Civil Engineers?” No immediately displays
non-member feedback and disables Next. This is the sole field-answer exception
to normal submission validation. An unanswered question and other invalid inputs
are reported on submission using the page error alert.

Yes reveals required first name, last name, email, phone and phone type, followed
by required Membership ID under Additional Membership Information. Member ID is
off by default in the component mapping; ASCE includes it and hides Title. ASCE
configures digits-only text with a minimum length of six, retaining leading zeroes.
The shared field remains unrestricted text so other Sites can use alphanumeric IDs.
Site page include/hide settings control mapped field participation; site field
overrides control requiredness, labels, options, format, keyboard hints and length limits.

Browser autocomplete uses authored field tokens for self/member only, wherever
those fields appear. Date of birth uses `bday`, including on Eligibility and quote
entry. Spouse and child fields receive autocomplete off. Input type and keyboard
hints are separate, and suggestions depend on browser availability.

ASCE's page note is “Throughout this site you will be referred to as a Member of
the Civil Engineering profession.” It appears below Membership's header. It no
longer appears on Eligibility. The prototype, Library content view and Storybook
resolve the same content key selected by ASCE's page file.

Successful validated Membership submission and saving starts the saved-application
and autosave lifecycle. Subsequent successful page submissions save before
advancing. That milestone makes applicant name, email and phone available for
abandoned-lead processing. Applications still incomplete at nightly batch
preparation are included in files for the site's TPA.

The initial autosave email is triggered as soon as Membership has been successfully
validated, submitted and saved. It confirms the start of saved progress. The
`membership-initial-autosave-email` rule records this requirement only: there is no
email delivery service and submission does not automatically create a mock email
preview. Invalid, unsubmitted or unsuccessfully saved pages do not trigger it.

Confirmed rules and workflows appear in the Library directly from the requirements
JSON and its applicability mappings. These lifecycle records do not execute an
XML export, nightly schedule or TPA transmission.

The runtime now enforces the initial save boundary: only a successful Membership
submission may create the saved application. Email-containing drafts remain in
the browser cache; loading, editing, Back, unmount and reload do not submit them
to the mock save service. After Membership, successful page submissions save
progress. Restored saved applications retain their existing save identity.

Membership's title, subhead, breadcrumb, loading message, non-member feedback,
additional-section title and help labels now read from the fresh-start content
JSON. Its help actions are referenced by the page JSON. The nested Phone Type
selector reads its mapped field definition through the same loader as other
Membership fields. Library content and field views, prototype pages and Storybook
examples share these definitions, even when the older catalog contains different
copy or options. The reviewed tree describes the structure; React owns rendering.

## Fresh-start ownership (CHG-026)

The page definition, route/order, main and additional field groups and nested phone
type binding now compile from `parked/membership.json` and its mappings. The shared
compiler replaces old page structure instead of overlaying saved fields. Header,
notes and help content use fresh content keys. The superseded authored records and
legacy Membership page file have been removed; the same projection serves Library,
prototype and Storybook, including older saved snapshots.
