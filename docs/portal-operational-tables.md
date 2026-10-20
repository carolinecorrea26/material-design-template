# Portal operational tables and relationships

This document describes the original applicant-relationship increment. Subsequent canonical Association, actor, answer, coverage and immutable snapshot migrations are summarized in [the current ASCE setup](asce-database-setup.md), with complete installed relationships in [the PostgreSQL dictionary](schema-validation/table-dictionary.json). The browser mock service and normalized SQL application storage remain separate boundaries.

The portal schema separates organization accounts, sites, applicants, applications, and sign-in users. Applicants are people within a client and can participate in multiple applications. A person does not need a user account to be an applicant. Customer account tracking and editing workflows remain TBD.

## Table ownership

| Table | Purpose | Relationships |
| --- | --- | --- |
| `organizations` | Organizations, currently seeded as TPAs | One organization has many clients |
| `clients` | Client organization accounts | Belongs to an organization; has many sites and associations |
| `sites` | Portal application experiences | Belongs to a client |
| `associations` | Membership organizations | Belongs to a client through its stable key |
| `site_associations` | Associations available on each site | Joins sites and associations; unique site and association pair |
| `applicants` | People applying for coverage | Belongs to a client; independent of sign-in users |
| `applications` | Operational application records | Belongs to a site; retains status and action owner |
| `application_applicants` | People covered by an application | Joins applications and applicants with an applicant type |
| `applicant_types` | Catalog metadata such as member, spouse, and child | Referenced by application applicants; contains no person records |
| `application_associations` | Association selected for an application | Optional single selection; references the application's site and an assigned association |
| `application_participants` | People participating in the workflow, such as advisors | Belongs to an application; optionally references a user |
| `application_events` | Application workflow history | Belongs to an application |
| `users` | User account profiles | Referenced by participants and user role/scope assignments |
| `roles`, `user_roles`, `user_scopes` | Existing access assignments | Role and scope assignments reference users; account integration is deferred |
| `audit_events` | Operational change history | Records entity identity, actor, and changes |

Client accounts and applicants have separate meanings. Use “Client” for the organization account and “Applicant” for the person. Future customer accounts use the identity model; they do not become client organization rows. Dev, QA, account management, Majesco, security, and automation do not each need a separate user table. Their identity and access design will be finalized with the account work.

## Enforced applicant relationships

Migration `202610120002_application_relationships.sql` adds `applicants`, `application_applicants`, and `application_associations`. Existing application and participant rows are preserved. No applicant identity is inferred from names or email addresses, and no sign-in users are manufactured from application records.

An application applicant references an application, its site, the site's client, and an applicant in that client. Composite foreign keys prevent cross-client links and prevent callers from substituting another site. The additional site and client columns serve these constraints; the application still gets its ownership from its site. A person can be linked to multiple applications, while each application/person pair is unique. The applicant type belongs to the relationship because a person's role can vary between applications. Multiple people may share a type, such as child.

An application association references an existing site/association pair and must match the application's site. This preserves the current single-association selection model. The relationship identifies the assigned association; runtime eligibility checks still determine whether that assignment is enabled when selected. Removing a referenced assignment requires resolving its application references first.

Person records have an opaque primary key, optional email, status, and timestamps. Email is neither an identity key nor globally unique. Client ownership keeps people isolated across clients; future deduplication or verified account linking requires an explicit workflow. Referenced people and ownership relationships cannot be deleted or reassigned in ways that break foreign keys. Archive records instead when history must remain.

## Storage and workflow boundary

The three new tables are registered in the TypeScript database contract and Supabase table map. Seeds initialize them empty. The local storage adapter adds empty collections when reading older saved databases and preserves their applications. They are operational data and remain outside published site configuration snapshots and Library seed exports.

The migration is ready to apply but is not applied to a running portal database by editing this repository. The new tables enable row level security without browser access policies. Account authorization, mock operational endpoints, applicant administration screens, and submission integration are separate work. The public saved-application mock store and mock submission receipts currently remain separate from operational applications.

Application answer storage, submission snapshots, multiple selected products, verified customer access, post-submission edits, and workflow transitions remain TBD. The existing application `product_key`, action-owner ID, audit actor, and user scope target do not all have typed foreign keys. Those existing compatibility fields are retained; this change does not claim that the entire legacy schema is fully normalized or that the existing user scopes enforce authorization.

## Validation

`npm run db:verify-application-relationships` uses the disposable `portal-migration-review` PostgreSQL container. It verifies valid relationships, rejects cross-client and incorrect-site links, unknown applicant types, duplicate links, invalid association selections, and destructive changes to referenced records. It also verifies anonymous reads and writes are blocked and existing applications survive the upgrade. The broader PostgreSQL migration gate includes the same relationship checks.
