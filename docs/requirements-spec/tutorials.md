# Admin Center tutorials

Tutorial navigation, explanations and example access indicators are global Admin
Center authoring in `requirements/global/tutorials/advisor.json`. They do not
configure the applicant workflow. The inventory's Advisor tab is provenance.

The contents menu groups independent actions: Start an application, Complete an
application, Revise a saved application, Email notifications and
Troubleshooting. Actions are unnumbered; Previous/Next stays within an action.
The shared global tutorial source `requirements/global/tutorials/application-access.json`
owns chip labels, availability by stage and explanatory wording. Each guide step
identifies its active user and stage; shared MFA steps resolve the stage for the
person authenticating. Chips distinguish **in application**, **can access** and
**locked**. Can access requires authentication and does not imply a signed-in
session. Before DocuSign, the advisor can sign in and take over even while the
applicant is completing the application. At and after DocuSign, advisor access is
locked; only the applicant can resume through the application email. Preparation
and edit-request handback keep applicant access locked until the advisor sends
the application. These indicators document the confirmed guidance; they do not
implement service authorization or session takeover.

The applicant invitation is distinct from the subsequent MFA email. Its link
opens Resume; secure email link and phone verification follow. The advisor edit
notification uses the existing message renderer, including the applicant email.
Edit, pending and deletion messages reuse `getMockEmailSamples`; no parallel email
wording or scheduling rules are introduced. Example-email links are intercepted
inside a script-disabled frame and open the appropriate example entry page.

Page previews reuse SitePreview's viewport frame and the canonical applicant page
registry. The dedicated internal preview entry boots the same effective Site and
fresh-start projection as the prototype. The existing application-page example
harness is shared from `src/dev/preview/`; existing Storybook imports are a
compatibility re-export. No tutorial or Applicant Admin component, story, Library
record, configuration setting or approval round is added to Library/Storybook.
The harness relocation preserves the existing story behavior.

The preview owns isolated answers and fictional recovery proofs. Preview recovery
storage is namespaced; production/mock application-service requests are blocked
from the internal preview document. A local demonstration adapter permits form
interaction without sending messages, saving applicant records or submitting an
application. The valid example code is explicitly shown and owned by a global
prototype fixture. It does not alter the real recovery policy or verifier.

Troubleshooting is a shared question-and-answer FAQ authored once in
`requirements/global/tutorials/troubleshooting.json` for both guides. It has no
step navigation, actor/access badges, page previews or missing-screen placeholders.
Questions and answer labels use normal body font weight; answers use the theme's
`text.disabled` color, as requested.
The confirmed November 16 guidance distinguishes recovery before DocuSign
(applicant uses the advisor email link, or advisor reopens and resends) from during
or after DocuSign (only the applicant resumes through the existing advisor email;
the advisor cannot reopen/resend). It also covers updating the browser and retrying
authentication, checking spam/junk for application emails, and advisor technical
issues before DocuSign. This documents the user's recovery instructions; it does
not change service locking, authentication or the applicant journey. Superseded
troubleshooting step records have been removed from both guide definitions.

Verification covers action navigation, invitation/edit email content, live-frame
URLs, recovery links, preview isolation, existing advisor stories, TypeScript,
fresh-start invariants and browser interaction. Screenshots from the initial
illustrated guide are historical assets and are no longer used by Tutorials.

## Notification catalogue

Email notifications is a reference catalogue, not a workflow action. Its
horizontal type tabs cover sent, pending, deleted, completed and edit-requested
messages. Each type exposes Type, Description, When notified and Content;
recipient tabs distinguish advisor and applicant messages. It has no actor/lock
banner, topic step list or Previous/Next workflow controls.

`requirements/global/tutorials/email-notifications.json` owns the grouping and
explanatory descriptions. It references existing email-template IDs.
`src/domain/tutorialNotifications.ts` resolves their existing metadata, including
notification timing, without copying the pending-email schedule. The existing
email renderer still owns new-template message HTML, subjects and recipients.
No template records, Library entries or Storybook examples are added.

## Current-template reference

The Tutorials landing page offers separate Advisor model (new template) and
Advisor model (current template) guides. The latter means the portal before the
redesign, as clarified by the user. Its global reference definition is
`requirements/global/tutorials/advisor-current.json`; it uses the same tutorial
shell and notification categories. It is never an applicant runtime fallback,
Site assignment or a second implementation of the application.

The supplied advisor-flow PNGs and existing current-template DocuSign reference
live once under `public/tutorials/advisor-current/`. The November 16 screenshot
batch adds 15 original captures; five matching earlier email/dialog references
reuse their existing assets. Source filenames and SHA-256 hashes are recorded
with captions in the global reference definition. Original branding is provenance.
Images remain unmodified, with a bounded scroll area and a full-size link for
long pages.

The workbook Advisor tab and the Advisor Walk-Through + Troubleshooting Guide
supply the documented existing flow. The PDF export contains no usable captured
screens, so it is not used to substitute blank pages or redesigned forms for
current-portal evidence. A labeled placeholder marks each step without a supplied
capture. Preparation, applicant email/phone MFA, sent and edit confirmations,
and the advisor Saved App lookup now have captures. Advisor-specific MFA screens
(other than the secure-link email), reopened/revised application screens, health
questions, spouse signing/signature completion and the final receipt still need
captures. Missing current-template notification captures are likewise
explicit placeholders. No new-template live page or email is silently used in
this reference guide.

The user’s supplied table identifies the advisor’s “Your saved insurance request”
message as the email received after sending. That capture is reused under Start
an application and the Advisor recipient in Application sent. The Applicant
recipient shows the invitation email. Pending/deleted/completed current-template
email captures remain explicit placeholders.

`exampleParticipants` in the current-template definition owns the example identities
once: applicant John Doe uses `caroline_correa@newyorklife.com`; the advisor uses
`location-central@ox6dxosw.mailosaur.net`. The guide and email catalogue display
these same values. The Saved App lookup uses the applicant email; subsequent
advisor MFA uses the advisor’s own email and phone. Applicant MFA captures are
not substituted for missing advisor MFA evidence. The email client display name
Correa, Caroline does not change John Doe’s applicant role. This is global tutorial
reference content, with no effective-Site overrides or applicant runtime changes.
