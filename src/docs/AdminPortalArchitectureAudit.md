# Portal administration architecture audit

## Existing architecture reviewed

- **Portal Admin:** `/portal-admin` renders `src/pages/PortalAdmin.tsx` inside `InternalPageShell`. It is a documentation and project hub, not an operational application. Existing child/reference routes include Site Features, Site Details, Design System, CMS, email preview, and project pages.
- **Site Details:** `/site-details` renders the existing authoritative global/client site workspace. Client/site selection is resolved through the canonical registry and the `site`/legacy `client` query parameters. The Admin Center links to it; it is not duplicated.
- **TPA Admin:** no working TPA Admin page or route exists in this repository. `portal-tpa-admin-project` is a future project record and TPA approval is referenced by the documented member-verification flow. This task preserves that as a separate future experience.
- **Advisor:** existing routes support advisor login, advisor-to-applicant handoff, resume/review behavior, and confirmation. Application form state includes advisor-flow concepts, but there is no standalone advisor portal, advisor application list, or durable ownership model.
- **Application records:** the repository models an in-progress browser application form/session, not a cross-client operational application store. Admin Center prototype records therefore reference canonical site/client IDs and stay separate from application form state.

## Existing shared domain foundation

The current registry already provides canonical TPA, client, site, association, and site-coverage relationships. Site resolvers combine client defaults, site overrides, content, fields, pages, flows, coverage, and branding. Existing documentation inventories provide stable IDs for configurations, rules, features, CMS entries, pages, fields, emails, content, themes, documents, products, coverage, and riders.

Reusable UI includes Material UI tables/filters/layout, `ResponsiveTableContainer`, `SearchField`, `EmptyState`, status chips, reference lists, and the current Site Details panels. Whole page layouts should not be shared across the three experiences.

## Boundary decisions

### Internal-only

- Cross-client site lookup and technical site configuration
- Global configuration/rule/library management
- Internal change implementation, review, QA, release assignment, and release administration
- Site Builder/provisioning
- Cross-client application support and troubleshooting
- Internal users, roles, permissions, integrations, and system settings

### Client-facing (future TPA Admin)

- Applications at permitted TPA/client/sites, review/action, downstream status
- Permitted site visibility and client-relevant release information
- Reports/downloads and separate external user/settings administration

Internal configuration libraries, technical controls, cross-client release administration, and internal implementation workflow remain excluded.

### Advisor-facing

- Advisor-owned/submitted applications, start/continue, applicant handoff, status, documents, resources, and help
- The key model is application status plus current action owner; site administration is excluded

### Shared across portals

- Canonical site/client/TPA identity and links
- Application summary, status, current action owner, and dates
- Status chips, date display, search/filter/table/empty-state primitives
- Permission and scope vocabulary

## Duplication and hardcoded assumptions found

- The legacy `client` query parameter and one-site-per-client assumptions remain as a compatibility bridge; WAEPA already demonstrates why Site must be a first-class identity.
- Current active site/client resolution uses URL and session storage and is global to the browser session, not a user authorization boundary.
- Application data is browser form/session data; no durable application ID, advisor owner, TPA scope, or action-owner record exists.
- Advisor behavior is detected through URL/form flags in several application-flow locations rather than a portal experience context.
- TPA identities for most legacy clients are provisional compatibility records pending authoritative business data.
- Statuses existed in separate project, milestone, application-result, and documentation contexts without one operational vocabulary. The Admin Center centralizes only its new change/release/application vocabularies and does not silently rename existing business statuses.
- Several documentation panels have their own local table/filter composition. Shared low-level controls are reusable, but broad migration is intentionally deferred.

## New boundary

`src/admin/access.ts` models the outcome as `experience + permissions + scope`. The three experiences are `internal-admin`, `tpa-admin`, and `advisor`. Internal personas are separate from external personas and can change emphasis/actions without changing the Admin Center information architecture.

Prototype permission checks are UI architecture aids, not authentication or backend enforcement. Scope supports global, TPA, client, site, advisor, and application boundaries and is deliberately replaceable by a real identity/access service.

## Deferred work

- Real authentication/authorization and server-side scope enforcement
- Durable application records, advisor ownership/submission identity, and TPA assignments
- Complete TPA Admin and Advisor Portal shells/pages
- Change mutation, before/after diff, approval, audit history, Jira, and AI-assisted creation
- Release calendar and release-note authoring
- Full Site Builder wizard and persistence
- Analytics data contracts and real charts
- External user administration
- Migration of current Portal Admin references into the new shell
