# School ERP — Phase 7 Complete Plan

Updated: 2026-09-03
Baseline: `main` after Phase 6 production release
Phase: 7 — Parent / Student / Teacher Portals
Status: `PLANNING_COMPLETE`

## 1. Phase objective

Turn the verified Phase 6 backend capabilities into three safe, role-specific user experiences without weakening the existing tenant, ownership, RBAC, academic-year, financial, document or audit boundaries.

Phase 7 is primarily an experience and workflow phase, not a new-domain phase. Reuse the existing APIs and domain models wherever possible. New backend work is allowed only where an existing portal workflow cannot be implemented correctly with the current contracts.

The target result is:

```text
One ERP backend
      |
      +-- Principal/Admin experience (existing)
      +-- Teacher workspace
      +-- Student workspace
      +-- Parent workspace
```

All four experiences continue to use the same authenticated tenant context and server-side authorization.

## 2. Source-of-truth inputs

Phase 7 planning is grounded in:

- `prd.md` — product vision and role capabilities;
- `architecture.md` — modular-monolith, tenant, auth, API and frontend architecture;
- `rules.md` — mandatory security, validation, audit, testing and documentation rules;
- `design.md` — current UI system and interaction principles;
- `phases.md` — delivery sequencing;
- `memory.md` — operational context;
- `frontend-design_skill.md` — mandatory visual-design process for distinctive, intentional frontend work.

The repository implementation is authoritative when it differs from older documentation. Legacy claims that still describe Phase 6 features as unimplemented must be reconciled during Phase 7 documentation maintenance.

## 3. Phase 7 product scope

### 3.1 Shared portal foundation

Build a reusable portal shell rather than three unrelated applications.

Required capabilities:
- role-aware navigation;
- permission-aware route guards for UX;
- backend authorization as the security boundary;
- responsive shell;
- consistent loading/error/empty states;
- profile/account access;
- logout/session handling;
- accessible keyboard/focus behavior;
- shared query and API patterns;
- clear page titles and task-oriented copy.

### 3.2 Teacher workspace

Primary job: complete daily teaching tasks quickly.

Initial screens/workflows:
- teacher dashboard;
- today's/weekly timetable;
- assigned classes and students;
- attendance marking and permitted correction visibility;
- homework create/list/detail with private attachments;
- notices relevant to the teacher;
- marks/exam access where Phase 5 contracts support it;
- student detail limited to assigned/authorized students;
- account/profile.

The teacher must never gain administrative access merely because a route is visible in the UI.

### 3.3 Student workspace

Primary job: see the student's own academic information.

Initial screens/workflows:
- student dashboard;
- today's/weekly timetable;
- own attendance summary/history;
- homework assigned to the student;
- notices applicable to the student;
- own exams/results/marks where available;
- own fee status without unauthorized financial administration;
- authorized own documents/profile information;
- account/profile and logout.

No student-to-student visibility, class-wide private data, teacher administration or write access to protected academic/financial records.

### 3.4 Parent workspace

Primary job: understand and act on each linked child's school activity.

Initial screens/workflows:
- child selector when multiple children are linked;
- child overview;
- child's attendance;
- child's homework;
- child's notices;
- child's timetable;
- child's exams/results;
- child's fee status and receipt access where authorized;
- authorized child documents;
- parent account/profile and logout.

Every child switch must change the server-authorized resource scope. The client must never treat the selected child ID as sufficient authorization.

## 4. Deliberate exclusions

Do not expand Phase 7 into:
- native mobile application;
- SMS/email/push provider integration;
- WhatsApp automation;
- subscription/billing;
- library/transport/inventory;
- payroll/staff module;
- speculative AI features;
- microservices or a new frontend framework;
- a second UI component library.

Those remain later phases unless a verified dependency blocks a portal workflow.

## 5. Portal information architecture

### Shared shell

```text
+-------------------------------------------------------------+
| School identity | Page title/context | Profile | Sign out   |
+-----------------+-------------------------------------------+
| role navigation | Main task area                            |
|                 |                                           |
| Overview        | Today / next action first                 |
| Academics       |                                           |
| Attendance      |                                           |
| Homework        |                                           |
| Notices         |                                           |
| Timetable       |                                           |
| Results         |                                           |
| Fees            |                                           |
| Profile         |                                           |
+-----------------+-------------------------------------------+
```

Navigation must be generated from permissions/modules and must not expose irrelevant administrative modules to portal roles.

### Teacher home

```text
Today
  next class / class context
  attendance action
  homework action
  notices

This week
  timetable

Teaching
  assigned classes
  students
  marks/results
```

### Student home

```text
Today
  timetable
  homework due
  important notices

My academics
  attendance
  results
  fees
```

### Parent home

```text
Children
  child selector

Selected child
  attendance
  homework
  notices
  timetable
  results
  fees
```

## 6. UX rules for Phase 7

The portal experience must be task-oriented, not a reduced copy of the principal dashboard.

- Put the user's next useful action/information first.
- Prefer lists and timelines over administrative tables when the user is consuming information.
- Keep primary actions obvious and sentence-case.
- Use plain language from the user's perspective.
- Empty states should explain what the user can do next.
- Errors should explain the failure and recovery action without vague apologies.
- Preserve form input after validation errors.
- Do not use browser `alert()` for application feedback.
- Use consistent toast/success/error behavior.
- Respect reduced-motion preferences.
- Maintain visible keyboard focus and semantic controls.
- Keep touch targets comfortable on small screens.

## 7. Frontend design direction

`frontend-design_skill.md` is now part of the repository and is mandatory for Phase 7 frontend work.

The design process must happen before implementation of each major portal surface:

1. Define the concrete audience and single job of the screen.
2. Produce a compact token system for color, typography, layout and signature treatment.
3. Use an intentional type pairing and clear hierarchy rather than generic dashboard defaults.
4. Create an ASCII wireframe before building complex screens.
5. Critique the proposal against the existing School ERP design system and remove generic/decorative choices.
6. Choose one memorable signature element for the portal family; keep the rest restrained.
7. Build responsive, accessible implementation.
8. Re-check screenshots in Chromium and revise before calling the screen complete.

The existing `Button`, `Input`, `Select`, `Card`, `Modal`, `Table`, `Tabs`, `Badge`, `Toaster`, `Header` and `Sidebar` foundations remain the base. Extend them when repeated portal patterns emerge instead of introducing another component framework.

A likely visual direction should be discovered from the school's actual context rather than imposed as a generic SaaS template. The final palette/type/signature must be documented in `design.md` after the first portal family is implemented and verified.

## 8. Backend/API strategy

Start with an API inventory before writing portal-specific endpoints.

For each screen, classify existing endpoints as:
- directly reusable;
- reusable with a query/response improvement;
- missing and requiring a new endpoint.

Prefer role-specific server queries over fetching broad admin datasets and filtering them in React.

Potential missing backend contracts to evaluate:
- teacher assigned-class summary;
- teacher dashboard summary;
- student dashboard summary;
- parent dashboard summary across linked children;
- role-specific result/fee/document read models if current endpoints are too admin-oriented.

New endpoints must use:

```text
authenticate
  -> permission
  -> tenant scope
  -> ownership/assignment relationship
  -> validated query
  -> service/repository
```

Do not add an endpoint simply to make frontend code shorter.

## 9. Parent-child authorization model

The existing parent relationship is `Student.parentIds` and is already part of the Phase 2 security foundation.

Phase 7 must preserve:
- linked-child-only reads;
- cross-school denial;
- no arbitrary child switching through URL/query manipulation;
- consistent authorization for attendance, homework, notices, timetable, results, fees and documents;
- correct behavior when a parent has zero, one or multiple linked children.

If a new parent endpoint is introduced, its E2E test must include an unauthorized/unlinked child case.

## 10. Teacher authorization model

Teacher data access must remain assignment-driven.

At minimum verify:
- teacher sees only assigned classes/students where required;
- teacher timetable is limited to authorized entries;
- teacher homework write access is restricted to permitted academic relationships;
- teacher cannot access principal/accountant administration;
- teacher cannot access another school's resources;
- teacher cannot use IDs from the browser to expand scope.

Any mismatch between teacher permissions and required academic lookup endpoints must be fixed deliberately rather than hidden by UI error suppression.

## 11. Student authorization model

Student access remains own-record oriented.

Verify:
- own attendance only;
- own homework only;
- own results only;
- own fee visibility only;
- own timetable based on enrollment/class/section;
- notices based on applicable targeting;
- no teacher/principal/accountant operations;
- no cross-tenant access.

## 12. Role-specific dashboard strategy

Do not build three large analytics dashboards.

Use compact action-oriented summaries:

Teacher:
- next class;
- today's attendance task;
- homework requiring attention;
- relevant notices;
- weekly timetable.

Student:
- next class;
- upcoming homework;
- attendance snapshot;
- latest result;
- important notices.

Parent:
- selected child;
- attendance snapshot;
- pending homework;
- fee balance;
- latest result;
- important notices.

Server-side aggregation should be used where multiple cards would otherwise cause repeated queries.

## 13. Data loading and performance

Portal screens must remain responsive on the project's initial scale.

Rules:
- paginate long lists;
- avoid fetching thousands of records to filter client-side;
- use TanStack Query for server state;
- keep derived UI state local;
- use query keys that include tenant-independent resource identity and relevant filters;
- invalidate only affected queries after mutations;
- avoid N+1 API/database calls;
- prefer one role-specific dashboard endpoint over many serial card requests when justified.

The existing dashboard loop-query performance debt should not be copied into new portal endpoints.

## 14. Security and privacy acceptance gates

Every portal release must prove:

### Tenant
- School A cannot read School B portal data.
- School A cannot modify School B data.

### Role
- teacher cannot access principal/accountant operations;
- student cannot access teacher/admin operations;
- parent cannot access unrelated student data.

### Ownership
- student -> self only;
- parent -> linked children only;
- teacher -> assigned/authorized academic scope only.

### Files
- private documents/attachments remain behind authorization and short-lived signed delivery;
- no permanent public URL bypass.

### Auth
- logout/session expiration remain correct;
- unauthorized route access redirects safely;
- frontend permission hiding never substitutes for backend authorization.

## 15. Testing plan

### Shared/schema
Add or update Zod contracts for new dashboard/query DTOs where needed.

### Unit/service
Cover:
- parent child-scope resolution;
- teacher assignment scope;
- role dashboard aggregation;
- edge cases for zero/multiple children;
- empty datasets;
- academic-year boundaries where relevant.

### API/E2E
Minimum Phase 7 matrix:

```text
Principal/admin baseline       existing Phase 1–6 gates remain green
Teacher portal                 login + assigned data + write/read boundaries
Student portal                 login + self data + write denial
Parent portal                  login + linked child + unlinked denial
Cross-tenant                   each portal role blocked across schools
Session                        logout + expired/invalid session handling
Files                          authorized signed access + unauthorized denial
```

### Chromium UI
For each role:
- login;
- navigation visibility;
- dashboard loads;
- each major portal screen loads;
- empty/error/loading states;
- primary workflow interaction;
- no application error;
- no unexpected failed requests;
- keyboard focus where applicable;
- mobile viewport behavior.

Parent UI must test child switching when the fixture has multiple linked children, or explicitly document why a fixture cannot provide it.

## 16. Browser verification matrix

Desktop baseline: Chromium around 1440×900.

Mobile baseline: 390×844.

Additional useful width: tablet around 768px.

For each role, inspect:
- sidebar/navigation;
- header/profile;
- page hierarchy;
- card/list density;
- long content wrapping;
- dialogs/drawers if used;
- horizontal overflow;
- focus states;
- touch target size;
- reduced-motion behavior where practical.

Take screenshots at major milestones and use them for self-critique.

## 17. Delivery sequence

### Stage 0 — Baseline and discovery
- sync local `main` with GitHub;
- verify production remains healthy after Phase 6;
- inspect portal-related routes/models/controllers/UI;
- inventory reusable API contracts;
- identify permission/ownership gaps;
- reconcile stale documentation claims.

### Stage 1 — Portal architecture foundation
- define shared portal shell;
- define route/permission matrix;
- define shared portal data/loading/error primitives;
- define portal dashboard DTO strategy;
- update architecture/design decisions before implementation.

### Stage 2 — Teacher portal
- teacher dashboard;
- timetable;
- assigned classes/students;
- attendance;
- homework + attachments;
- notices;
- supported results/marks;
- profile.

### Stage 3 — Student portal
- student dashboard;
- timetable;
- attendance;
- homework;
- notices;
- results;
- fee status;
- authorized documents/profile.

### Stage 4 — Parent portal
- parent dashboard;
- child selector;
- linked-child data views;
- attendance;
- homework;
- notices;
- timetable;
- results;
- fee status/receipts;
- authorized documents/profile.

### Stage 5 — Cross-portal consistency pass
- navigation consistency;
- copy consistency;
- loading/error/empty states;
- accessibility;
- responsive behavior;
- shared component extraction;
- query/cache review;
- security regression.

### Stage 6 — Full verification
- Phase 1 security gate;
- Phase 2 security/ownership gates;
- Phase 3 acceptance;
- Phase 4 finance gates;
- Phase 5 exams/results gates;
- Phase 6 Homework/Notices/Timetable gates;
- Phase 7 API/E2E;
- Phase 7 Chromium desktop/mobile;
- production build.

### Stage 7 — Release
- update living docs;
- consolidate feature branch;
- one PR to `main`;
- review diff/security/evidence;
- merge once approved;
- verify Vercel/Render production smoke;
- mark Phase 7 complete only after exit criteria pass.

## 18. Definition of Done

Phase 7 is complete only when:

- teacher, student and parent have usable role-specific portal experiences;
- each role sees only authorized tenant/ownership data;
- parent child switching is server-authorized;
- teacher assignment boundaries are verified;
- student self boundaries are verified;
- Phase 6 features are consumed through portal experiences without bypassing their security rules;
- shared UI patterns are used consistently;
- frontend design skill process has been applied and the resulting visual direction is documented;
- responsive and accessible behavior is verified;
- critical workflows have API/E2E and Chromium coverage;
- existing Phase 1–6 regression gates remain green;
- production build succeeds;
- living documentation is synchronized;
- no secrets or machine-specific artifacts are committed.

## 19. Expected risk register

| Risk | Mitigation |
|---|---|
| Admin APIs expose too much data | Add role-specific read DTOs/endpoints instead of client filtering |
| Parent child switching leaks data | Authorize selected child on every server request |
| Teacher permissions do not match lookup endpoints | Map permission-to-workflow matrix before UI implementation |
| Portal becomes a smaller admin dashboard | Design each role around its single daily job |
| UI becomes visually inconsistent | Reuse primitives and apply `frontend-design_skill.md` before each major surface |
| Too many API calls on dashboards | Server-side summary endpoints / aggregation |
| Mobile becomes an afterthought | Verify 390×844 during each portal stage |
| Phase 6 security regresses | Keep Phase 1–6 gates mandatory |
| Documentation drifts again | Update affected living docs in the same release |

## 20. Quota/deployment policy

Follow the established development workflow:

- make source/documentation changes directly on GitHub;
- use Desktop Commander only for local commands, ignored files, environment checks and browser/test execution;
- batch coherent Phase 7 work on one feature branch;
- do not push intermediate deployment-worthy states;
- do not use Vercel preview deployments unless local verification cannot validate a behavior;
- consolidate to one release commit before the final PR where practical;
- keep `main` untouched until the Phase 7 release is reviewed and approved.
