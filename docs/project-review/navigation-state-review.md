# Main steps and breadcrumbs: state review

October 27, 2026. Main steps show overall application stages; breadcrumbs show pages within the current main step. Both belong to the application frame and use the production `ProgressStep` and `Breadcrumbs` implementations. There is one canonical component owner, with Breadcrumbs recorded as a named export in its internal parts.

The examples under **Layout → Main steps and breadcrumbs** use saved ASCE flow configuration and fictional values. Completed entries precede the current page/step; current and upcoming entries remain distinct. Completion still follows the existing flow and transient submit event, rather than introducing a new persisted completion model.

| Example | States and behavior |
| --- | --- |
| [Main steps: completed, active and upcoming](http://localhost:6010/?path=/story/navigation-progressstep--main-steps-states) | Completed stages show checks and permit back navigation, the current stage is active, upcoming stages are inactive. Breadcrumbs show the same states within the current stage. |
| [Main steps: first active](http://localhost:6010/?path=/story/navigation-progressstep--main-steps-first-active) | No completed stages; the first stage is current. |
| [Standalone page](http://localhost:6010/?path=/story/navigation-progressstep--main-steps-hidden) | Real FormRoutePage omits both main steps and breadcrumbs outside the application flow. |
| [Breadcrumb states](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumb-states) | Beneficiary completed/clickable, Contact current, Profile upcoming/non-interactive. |
| [First breadcrumb active](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-first-active) | Beneficiary current; no completed breadcrumb. |
| [Earlier breadcrumbs completed](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-earlier-completed) | Profile current; Beneficiary and Contact completed. |
| [Breadcrumbs hidden](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-hidden) | Coverage is a main step with one applicable entry. Main steps stay visible; the redundant breadcrumb trail renders nothing. |
| [Submission locks](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-locked) | Completed indicators remain visible; completed main steps and breadcrumbs cannot navigate. |
| [Advisor handoff locks](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-advisor-locked) | Earlier advisor-completed stages and breadcrumbs retain their indicators but cannot navigate. |
| [Pending navigation](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-navigation-pending) | Completed breadcrumbs temporarily stop accepting navigation while a single-page section transition is pending. |
| [Transient completion](http://localhost:6010/?path=/story/navigation-progressstep--breadcrumbs-pending-completion) | Story controls dispatch the actual completion/reset event. The current breadcrumb can show completion before navigation; reset or a page change clears the transient state. |
| [Mobile states](http://localhost:6010/?path=/story/navigation-progressstep--mobile-states) | The same current/completed/upcoming states in the real mobile accordion layout. |

Existing health consolidation, skipped-page filtering, mobile and lock examples remain available with stable story IDs. Main steps and breadcrumbs now expose named navigation landmarks; current entries retain `aria-current`. Permitted story navigation stops at a local completion message without saving application answers.

Seven focused production-component tests cover current/completed/upcoming semantics, completed navigation, first/last entry states, both session locks, pending-navigation lock, hidden/showing breadcrumbs and transient completion/reset/page changes. Contact’s existing six regression tests cover its extracted section renderer through the real page. Broader Site-wide and accessibility acceptance remains separate; these examples close the explicit navigation state-example gap.

Validation: 38 focused tests passed, along with TypeScript and targeted ESLint. Catalog and handoff drift checks pass. The Storybook source/build audit found all 334 current exports and zero invalid saved examples. Browser checks verified completed/current/upcoming breadcrumb presentation, the live transient completion/reset actions and Contact’s isolated business-address copying.
