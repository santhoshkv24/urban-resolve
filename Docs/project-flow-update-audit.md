# Project Update and Flow Audit

Date: 2026-04-24

## 1. Scope of Review
This audit was prepared by reading the current codebase state (frontend + backend), focusing on:
- Role-based flow and route wiring
- Ticket lifecycle changes
- Officer-role enhancements
- Notification and directive systems
- Flow consistency between UI and APIs

## 2. Major Updates Detected

### 2.1 Officer role expanded from monitoring to intervention
Implemented:
- Officer interventions model and APIs
- Officer Intervention Queue page
- Active intervention visibility in ticket query responses

Evidence:
- server/prisma/schema.prisma
- server/src/routes/officer.routes.js
- client/src/pages/officer/InterventionQueue.jsx
- server/src/routes/ticket.routes.js

### 2.2 Executive directives introduced
Implemented:
- Officer/Admin can post active directives
- Directive banner visible to Admin and Worker dashboards

Evidence:
- server/src/routes/directive.routes.js
- client/src/components/shared/DirectiveBanner.jsx
- client/src/pages/admin/Dashboard.jsx
- client/src/pages/worker/Dashboard.jsx

### 2.3 Notification center is now real (not mock)
Implemented:
- Notification APIs (fetch, mark one read, mark all read)
- Bell + drawer integration with unread counters
- Notification log now includes isRead state

Evidence:
- server/src/routes/notification.routes.js
- client/src/components/shared/NotificationsDrawer.jsx
- server/prisma/schema.prisma

### 2.4 Citizen duplicate-report nudge added
Implemented:
- Nearby open-ticket endpoint
- Duplicate nudge in new ticket flow

Evidence:
- server/src/routes/ticket.routes.js (GET /api/tickets/nearby)
- client/src/components/ui/DuplicateNudge.jsx
- client/src/pages/citizen/NewTicket.jsx

### 2.5 SLA visibility added at UI level
Implemented:
- Dynamic SLA chip component
- Used in ticket cards and intervention queue

Evidence:
- client/src/components/ui/SlaChip.jsx
- client/src/components/ui/TicketCard.jsx
- client/src/pages/officer/InterventionQueue.jsx

## 3. Updated End-to-End Flow

## 3.1 Authentication and role routing
1. User logs in via JWT flow.
2. Frontend redirects by role:
   - Citizen -> /citizen
   - Admin -> /admin
   - Worker -> /worker
   - Officer -> /officer

## 3.2 Citizen reporting flow
1. Citizen opens New Ticket page.
2. Location picker updates coordinates.
3. System calls nearby endpoint to detect similar open tickets.
4. Duplicate nudge is shown if related reports exist.
5. Citizen submits image + location + optional description.
6. Ticket starts as PENDING_AI and transitions to PENDING_ADMIN after AI classification.

## 3.3 Admin operational flow
1. Admin monitors pending and escalated queues.
2. Admin assigns PENDING_ADMIN tickets to a department worker.
3. Admin resolves escalations by either:
   - reject
   - reassign
4. Admin sees directive banner and receives notification updates.

## 3.4 Worker execution flow
1. Worker sees ASSIGNED tasks.
2. Worker can:
   - resolve with proof image + notes
   - flag false (escalate to admin)
3. Worker dashboard shows active directive banner.
4. Worker receives in-app notifications from notification center.

## 3.5 Officer governance flow
1. Officer enters Command Center and Intervention Queue.
2. Officer can flag open tickets with high/critical priority and an intervention note.
3. Active interventions appear in officer list and in ticket payloads.
4. Officer can post executive directives for all staff.
5. Officer dashboard consumes anomalies + impact metrics.

## 4. API Surface Additions Confirmed
- POST /api/officer/interventions
- GET /api/officer/interventions
- DELETE /api/officer/interventions/:id
- GET /api/directives/active
- POST /api/directives
- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- GET /api/tickets/nearby
- GET /api/analytics/anomalies
- GET /api/analytics/officer-impact

## 5. Flow Gaps and Risks Found

### Critical
1. Secret key material committed in repository.
- File detected: server/urban-resolve-491219-f69b92791335.json
- Risk: service-account private key exposure.
- Action: rotate key immediately, remove file from repo history, move to secure secret management.

### High
2. Officer dashboard calls endpoint not implemented on backend.
- Frontend call: GET /api/analytics/overview
- Backend route: missing
- Result: officer dashboard KPI fetch fails and falls back to empty state.

3. Citizen reopen action exists in UI but endpoint is missing.
- Frontend call: PUT /api/tickets/:id/reopen
- Backend route: missing in current ticket routes
- Result: reopen workflow from citizen ticket detail fails.

4. Officer notification click path is not routed.
- Notifications drawer maps officer ticket links to /officer/tickets/:id
- Route is not defined in current frontend router.
- Result: notification deep-link for officer leads to not-found.

### Medium
5. Uploaded files are appearing as git-tracked changes under server/uploads.
- Suggestion: enforce upload exclusion in git ignore and avoid binary artifacts in commits.

## 6. Current Architecture Quality Snapshot
- Strengths:
  - Role expansion is meaningful and mostly well-integrated.
  - Novelty features now affect real user decisions (interventions, directives, duplicate nudge).
  - Notification system moved from mock behavior to persistent state.
- Weaknesses:
  - A few endpoint-route mismatches break key flows.
  - Security hygiene needs immediate correction for credential handling.

## 7. Ship-Ready Priority Fix Order
1. Security incident response for exposed service-account key.
2. Implement GET /api/analytics/overview or update officer dashboard to existing endpoints.
3. Restore or remove citizen reopen feature consistently across UI/API.
4. Fix officer notification deep-link routing.
5. Keep uploads and generated artifacts out of git.

## 8. Conclusion
Your project now has strong novelty and clearer role value, especially for officers.
The new governance layer (interventions + directives + anomaly awareness) is a major functional upgrade.
Before next release, close the four high-impact flow breaks and the credential exposure issue to stabilize production readiness.
