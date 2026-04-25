# Urban Resolve Frontend Revamp Plan

Date: 2026-04-14
Owner: Frontend Team
Status: In Progress

## 1) Why this revamp
The current frontend delivers core flows, but product quality is limited by:
- Incomplete CRUD on admin screens (edit/deactivate workflows missing or partial)
- Inconsistent visual language across pages and components
- Placeholder interactions that reduce trust (fake filter/sort, weak validation and feedback)
- Uneven responsiveness and accessibility patterns

Goal: deliver a credible civic product experience for citizens, workers, officers, and admins while preserving existing backend contracts.

## 2) Product principles
- Trustworthy civic tone: calm, clear, high-contrast, no novelty UI gimmicks
- Action clarity: every major task should be obvious and one-click reachable
- Data-first surfaces: readable tables, state badges, explicit empty/error/loading states
- Mobile-ready: all key task flows are usable on smaller screens
- Consistent interactions: forms, buttons, badges, and cards behave predictably

## 3) Phased roadmap

### Phase 1 - Foundation + Admin CRUD completion (current sprint)
Scope:
- Define and enforce shared visual tokens in existing Tailwind setup
- Complete Admin Users CRUD UI
- Complete Admin Departments CRUD UI
- Improve table/search/filter/action patterns on admin data screens

Deliverables:
- Users page: Create, Read, Update, Deactivate
- Departments page: Create, Read, Update, Delete (with guards)
- Better success/error feedback and confirmation interactions

Acceptance:
- All admin CRUD actions callable from UI and wired to existing APIs
- No dead buttons or placeholder controls on touched pages
- Lint/build passes for client app

### Phase 2 - Citizen workflow polish
Scope:
- Real filter/sort/search on citizen dashboard
- Better report timeline and status readability
- Improve new ticket flow feedback and image upload UX
- Allow citizens to reopen a `RESOLVED` report with a mandatory reason when work is incomplete

Acceptance:
- Citizen dashboard controls are functional
- Ticket list/detail views support efficient tracking
- Reopened citizen reports move back into admin review/escalation flow

### Phase 3 - Public + Auth redesign
Scope:
- Modern civic landing page with stronger value narrative
- Auth screens with cleaner hierarchy, validation and helper text
- Responsive and accessibility improvements

Acceptance:
- Public and auth pages share consistent visual language
- Keyboard and screen-reader basics validated

### Phase 4 - Worker and Officer parity
Scope:
- Worker task execution UX consistency
- Officer analytics presentation cleanup (chart readability + data summaries)

Acceptance:
- Worker/officer pages align with shared design patterns and states

### Phase 5 - Quality hardening
Scope:
- End-to-end regression checks for role flows
- Accessibility pass (color contrast, focus visibility, semantics)
- Copy cleanup and final visual QA

Acceptance:
- Critical role journeys pass manual QA checklist
- No P0/P1 visual or flow regressions

## 4) API contract map (already available)
- Admin Users: GET/POST/PUT/DELETE `/api/admin/users`
- Admin Departments: GET/POST/PUT/DELETE `/api/admin/departments`
- Tickets lifecycle: GET/PUT actions under `/api/tickets`

## 5) Current implementation focus
This revamp starts with Phase 1 implementation:
- Admin Users page full CRUD UI
- Admin Departments edit/update completion
- Shared interaction polish on these pages

## 6) Risks and mitigations
- Risk: design drift while many pages are untouched
  - Mitigation: apply shared component/tokens first, then page-by-page migration
- Risk: role-specific regressions
  - Mitigation: smoke test each role entry route after each milestone
- Risk: backend validation mismatch
  - Mitigation: preserve payload shapes and handle API errors explicitly

## 7) Done checklist for current PR
- [ ] Users page has complete CRUD controls
- [ ] Departments page edit flow works end-to-end
- [ ] Loading, empty, error states improved for touched views
- [ ] Client lint/build passes
- [ ] Manual role checks: admin/citizen/worker basic navigation
