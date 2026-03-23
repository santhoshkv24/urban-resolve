# Frontend Developer Context — Municipal Helpdesk System

> **Everything a frontend developer needs to build the Municipal Helpdesk System UI.**
> Backend API is live at `http://localhost:5000/api`.

---

## Table of Contents

1. [Tech Stack & Setup](#1-tech-stack--setup)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [User Roles & Routing Matrix](#3-user-roles--routing-matrix)
4. [API Reference](#4-api-reference)
5. [Ticket State Machine](#5-ticket-state-machine)
6. [UI Pages & Components Spec](#6-ui-pages--components-spec)
7. [Design Tokens](#7-design-tokens)
8. [File Upload Handling](#8-file-upload-handling)
9. [Error Handling](#9-error-handling)
10. [Seed Data & Test Accounts](#10-seed-data--test-accounts)

---

## 1. Tech Stack & Setup

| Layer | Technology |
|-------|-----------|
| Framework | React.js or Next.js |
| Styling | Tailwind CSS |
| HTTP Client | Axios or Fetch |
| State Mgmt | React Context / Zustand / Redux Toolkit |
| Charts | Chart.js / Recharts / Nivo |
| Maps | Leaflet / Google Maps (for GPS pin display) |
| Icons | Lucide React / Heroicons |

**Backend API Base URL:** `http://localhost:5000/api`

Configure CORS origin in the backend `.env` via `FRONTEND_URL`.

---

## 2. Authentication & Session Management

### How It Works

1. User registers/logs in → backend returns a **JWT token**
2. Store token in `localStorage` or a secure cookie
3. Attach to every request: `Authorization: Bearer <token>`
4. JWT payload contains: `{ userId, email, role }` — decode client-side to determine user role and route access
5. Token expires in **24 hours** — redirect to login on `401`

### JWT Payload Structure (decoded)

```json
{
  "userId": 1,
  "email": "admin@municipal.com",
  "role": "ADMIN",
  "iat": 1774248288,
  "exp": 1774334688
}
```

### Protected Route Pattern

```jsx
// Pseudo-code: ProtectedRoute wrapper
function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();  // decoded JWT
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
}
```

---

## 3. User Roles & Routing Matrix

### Roles

| Role | Value | Description |
|------|-------|-------------|
| Citizen | `CITIZEN` | Reports issues, tracks own tickets |
| Admin | `ADMIN` | Manages everything — users, departments, tickets, escalations |
| Department Worker | `DEPT_WORKER` | Resolves assigned tickets, flags false reports |
| Officer | `OFFICER` | Read-only analytics dashboard |

### Page Access Matrix

| Page/Section | CITIZEN | ADMIN | DEPT_WORKER | OFFICER |
|-------------|---------|-------|-------------|---------|
| Login / Register | ✅ | ✅ | ✅ | ✅ |
| Create Ticket | ✅ | ❌ | ❌ | ❌ |
| My Tickets (own) | ✅ | ❌ | ❌ | ❌ |
| Ticket Detail | ✅ (own) | ✅ (all) | ✅ (assigned) | ✅ (all) |
| Admin — Pending Queue | ❌ | ✅ | ❌ | ❌ |
| Admin — Escalation Queue | ❌ | ✅ | ❌ | ❌ |
| Admin — Departments CRUD | ❌ | ✅ | ❌ | ❌ |
| Admin — Users CRUD | ❌ | ✅ | ❌ | ❌ |
| Worker — My Tasks | ❌ | ❌ | ✅ | ❌ |
| Analytics Dashboard | ❌ | ✅ | ❌ | ✅ |

### Suggested Frontend Routes

```
/login
/register
/verify-otp

/citizen/dashboard          → My Tickets list
/citizen/tickets/new        → Create ticket form
/citizen/tickets/:id        → Ticket detail + timeline

/admin/dashboard            → Overview + pending queue
/admin/tickets              → All tickets list
/admin/tickets/:id          → Ticket detail + assign/escalation actions
/admin/departments          → Departments CRUD table
/admin/users                → Users CRUD table

/worker/dashboard           → My assigned tasks
/worker/tickets/:id         → Ticket detail + resolve/flag actions

/officer/dashboard          → Analytics charts + KPIs
```

---

## 4. API Reference

### Response Envelope

Every response follows this format:

**Success:**
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

### Pagination (when applicable)

Requests accept `?page=1&limit=20`. Response includes:
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 142,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 4.1 Auth Endpoints

---

#### `POST /api/auth/register`

**Auth:** None (public)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "phone": "9876543210",         // optional
  "address": "123 Main Street"   // optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CITIZEN",
      "emailVerified": false,
      "createdAt": "2026-03-23T06:30:00.000Z"
    }
  }
}
```

**Error Codes:** `DUPLICATE_EMAIL (409)`, `VALIDATION_ERROR (400)`

**Validation Rules:**
- `name`: min 2 chars, required
- `email`: valid email format, required
- `password`: min 6 chars, required

---

#### `POST /api/auth/login`

**Auth:** None (public)

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CITIZEN",
      "emailVerified": false,
      "departmentId": null
    }
  }
}
```

**Error Codes:** `INVALID_CREDENTIALS (401)`, `ACCOUNT_DEACTIVATED (403)`

> **Frontend Note:** After login, store `token` and `user` object. Use `user.role` to determine which dashboard to redirect to.

---

#### `POST /api/auth/send-otp`

**Auth:** Bearer Token

**Request Body:** None (uses authenticated user's email)

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

> **Note:** In dev mode, OTP is logged to the server console (mock email). Check server terminal output.

---

#### `POST /api/auth/verify-otp`

**Auth:** Bearer Token

**Request Body:**
```json
{
  "otp": "847293"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Codes:** `INVALID_OTP (400)`, `VALIDATION_ERROR (400)`

---

### 4.2 Ticket Endpoints

---

#### `POST /api/tickets`

**Auth:** Bearer Token | **Role:** `CITIZEN`

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | File (JPEG/PNG) | ✅ | Issue photo, max 10MB |
| `latitude` | Number | ✅ | GPS latitude from browser Geolocation API |
| `longitude` | Number | ✅ | GPS longitude from browser Geolocation API |
| `description` | String | ❌ | Optional description of the issue |

**Frontend Implementation Notes:**
- Use `navigator.geolocation.getCurrentPosition()` to capture GPS
- Upload via `FormData` object
- Show loading state — AI classification runs asynchronously after creation

**Success Response (201):**
```json
{
  "success": true,
  "message": "Ticket created successfully. AI classification in progress.",
  "data": {
    "ticket": {
      "id": 1,
      "citizenId": 5,
      "description": "Broken pipe on main road",
      "imageUrl": "/uploads/image-1711234567890-123456789.jpg",
      "latitude": "12.9716000",
      "longitude": "77.5946000",
      "status": "PENDING_AI",
      "recommendedDepartmentId": null,
      "aiConfidenceScore": null,
      "assignedDepartmentId": null,
      "assignedWorkerId": null,
      "createdAt": "2026-03-23T06:30:00.000Z",
      "updatedAt": "2026-03-23T06:30:00.000Z"
    }
  }
}
```

> **Note:** Status will change from `PENDING_AI` → `PENDING_ADMIN` within seconds as AI classifies the image in the background. Poll or refresh to see updated status.

---

#### `GET /api/tickets`

**Auth:** Bearer Token | **Role:** All (results filtered by role)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | String | Filter by ticket status (e.g., `ASSIGNED`) |
| `departmentId` | Number | Filter by assigned department |
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20, max: 100) |

**Role-Based Filtering (automatic):**
- `CITIZEN` → only their own tickets
- `DEPT_WORKER` → tickets assigned to them or their department
- `ADMIN` / `OFFICER` → all tickets

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "tickets": [
      {
        "id": 1,
        "citizenId": 5,
        "description": "Broken pipe",
        "imageUrl": "/uploads/image-123.jpg",
        "latitude": "12.9716000",
        "longitude": "77.5946000",
        "status": "PENDING_ADMIN",
        "recommendedDepartmentId": 1,
        "aiConfidenceScore": "0.8742",
        "assignedDepartmentId": null,
        "assignedWorkerId": null,
        "aiRecommendationAccepted": null,
        "resolutionImageUrl": null,
        "resolutionNotes": null,
        "escalationReason": null,
        "adminResolutionNotes": null,
        "assignedAt": null,
        "resolvedAt": null,
        "createdAt": "2026-03-23T06:30:00.000Z",
        "updatedAt": "2026-03-23T06:30:05.000Z",
        "citizen": { "id": 5, "name": "John Doe", "email": "john@example.com" },
        "recommendedDepartment": { "id": 1, "name": "Water Supply" },
        "assignedDepartment": null,
        "assignedWorker": null
      }
    ],
    "pagination": {
      "page": 1, "limit": 20, "total": 1, "totalPages": 1,
      "hasNext": false, "hasPrev": false
    }
  }
}
```

---

#### `GET /api/tickets/:id`

**Auth:** Bearer Token | **Role:** All (authorization enforced)

Same shape as a single ticket in the list response, plus:
```json
{
  "data": {
    "ticket": {
      ...allTicketFields,
      "notifications": [
        {
          "id": 1,
          "subject": "Your ticket #1 has been assigned",
          "status": "MOCKED",
          "sentAt": "2026-03-23T07:00:00.000Z"
        }
      ]
    }
  }
}
```

---

#### `PUT /api/tickets/:id/assign`

**Auth:** Bearer Token | **Role:** `ADMIN`

**Request Body:**
```json
{
  "departmentId": 1,
  "workerId": 3
}
```

**Business Rules:**
- Only tickets with status `PENDING_ADMIN` can be assigned
- Worker must belong to the specified department
- System auto-detects if admin accepted or overrode AI recommendation

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ticket assigned successfully",
  "data": {
    "ticket": {
      ...allTicketFields,
      "status": "ASSIGNED",
      "assignedDepartmentId": 1,
      "assignedWorkerId": 3,
      "aiRecommendationAccepted": true,
      "assignedAt": "2026-03-23T07:00:00.000Z",
      "citizen": { "id": 5, "name": "John", "email": "john@example.com" },
      "assignedDepartment": { "id": 1, "name": "Water Supply" },
      "assignedWorker": { "id": 3, "name": "Worker 1" }
    }
  }
}
```

**Error Codes:** `INVALID_STATE_TRANSITION (400)`, `WORKER_NOT_FOUND (404)`, `WORKER_DEPT_MISMATCH (400)`

---

#### `PUT /api/tickets/:id/resolve`

**Auth:** Bearer Token | **Role:** `DEPT_WORKER`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resolutionImage` | File (JPEG/PNG) | ✅ | "After" photo proof |
| `resolutionNotes` | String | ❌ | Optional notes |

**Business Rules:**
- Only tickets with status `ASSIGNED` can be resolved
- Only the assigned worker can resolve the ticket

**Success Response (200):** Ticket with `status: "RESOLVED"`, `resolutionImageUrl`, `resolvedAt` populated.

---

#### `PUT /api/tickets/:id/flag-false`

**Auth:** Bearer Token | **Role:** `DEPT_WORKER`

**Request Body:**
```json
{
  "escalationReason": "Location inspected — no issue found. Appears to be a duplicate/prank report."
}
```

**Business Rules:**
- Only `ASSIGNED` tickets can be flagged
- `escalationReason` is mandatory
- Only the assigned worker can flag

**Success Response (200):** Ticket with `status: "ESCALATED_TO_ADMIN"`.

---

#### `PUT /api/tickets/:id/resolve-escalation`

**Auth:** Bearer Token | **Role:** `ADMIN`

**Request Body (Option A — Reject):**
```json
{
  "action": "reject",
  "adminResolutionNotes": "Confirmed as invalid report after investigation."
}
```

**Request Body (Option B — Re-assign):**
```json
{
  "action": "reassign",
  "departmentId": 2,
  "workerId": 4,
  "adminResolutionNotes": "Re-assigning to correct department after review."
}
```

**Business Rules:**
- Only `ESCALATED_TO_ADMIN` tickets can be handled
- `action` must be `"reject"` or `"reassign"`
- For `"reassign"`, `departmentId` and `workerId` are required

---

### 4.3 Admin Endpoints

All require `ADMIN` role.

---

#### Departments CRUD

**`GET /api/admin/departments`** → list all departments + worker count + ticket count

```json
{
  "data": {
    "departments": [
      {
        "id": 1,
        "name": "Water Supply",
        "description": "Water supply, pipelines, and drainage issues",
        "aiLabel": "Water",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "...",
        "_count": { "workers": 2, "assignedTickets": 5 }
      }
    ]
  }
}
```

**`GET /api/admin/departments/:id`** → single department + its workers list

```json
{
  "data": {
    "department": {
      ...departmentFields,
      "workers": [
        { "id": 3, "name": "Worker 1", "email": "w1@test.com", "isActive": true }
      ],
      "_count": { "assignedTickets": 5, "recommendedTickets": 8 }
    }
  }
}
```

**`POST /api/admin/departments`** — Body: `{ "name": "...", "description": "...", "aiLabel": "..." }`

**`PUT /api/admin/departments/:id`** — Body: any subset of `{ name, description, aiLabel, isActive }`

**`DELETE /api/admin/departments/:id`** — Guarded: fails if active tickets reference it (`DEPARTMENT_IN_USE`)

---

#### Users CRUD

**`GET /api/admin/users`** → paginated list, filterable

Query params: `?role=DEPT_WORKER&departmentId=1&page=1&limit=20`

```json
{
  "data": {
    "users": [
      {
        "id": 3,
        "name": "Worker 1",
        "email": "worker1@test.com",
        "role": "DEPT_WORKER",
        "departmentId": 1,
        "department": { "id": 1, "name": "Water Supply" },
        "emailVerified": true,
        "isActive": true,
        "createdAt": "..."
      }
    ],
    "pagination": { ... }
  }
}
```

**`GET /api/admin/users/:id`** → single user with **decrypted** phone and address

```json
{
  "data": {
    "user": {
      "id": 3,
      "name": "Worker 1",
      "email": "worker1@test.com",
      "phone": "9876543210",         // decrypted
      "address": "123 Main Street",  // decrypted
      "role": "DEPT_WORKER",
      "departmentId": 1,
      "department": { "id": 1, "name": "Water Supply" },
      "emailVerified": true,
      "isActive": true
    }
  }
}
```

**`POST /api/admin/users`** — Create worker/officer account

```json
{
  "name": "New Worker",
  "email": "worker@test.com",
  "password": "worker123",
  "role": "DEPT_WORKER",
  "departmentId": 1,
  "phone": "1234567890",    // optional
  "address": "456 Oak Ave"  // optional
}
```

> Role must be `DEPT_WORKER` or `OFFICER`. Workers require `departmentId`.

**`PUT /api/admin/users/:id`** — Body: any subset of `{ name, departmentId, isActive, phone, address }`

**`DELETE /api/admin/users/:id`** — Soft-delete (sets `isActive: false`). Cannot self-deactivate.

---

### 4.4 Analytics Endpoints

All require `OFFICER` or `ADMIN` role.

---

#### `GET /api/analytics/tickets-by-department`

```json
{
  "data": {
    "ticketsByDepartment": [
      { "departmentId": 1, "departmentName": "Water Supply", "ticketCount": 15 },
      { "departmentId": 2, "departmentName": "Electricity Board", "ticketCount": 8 }
    ]
  }
}
```

**Chart type:** Bar chart or horizontal bar

---

#### `GET /api/analytics/tickets-by-status`

```json
{
  "data": {
    "ticketsByStatus": [
      { "status": "PENDING_AI", "ticketCount": 2 },
      { "status": "PENDING_ADMIN", "ticketCount": 5 },
      { "status": "ASSIGNED", "ticketCount": 12 },
      { "status": "RESOLVED", "ticketCount": 45 },
      { "status": "ESCALATED_TO_ADMIN", "ticketCount": 3 },
      { "status": "REJECTED", "ticketCount": 1 }
    ]
  }
}
```

**Chart type:** Pie chart or donut chart (use status colors from Design Tokens)

---

#### `GET /api/analytics/average-resolution-time`

```json
{
  "data": {
    "averageResolutionTime": [
      {
        "departmentId": 1,
        "departmentName": "Water Supply",
        "averageResolutionTimeHours": 18.50,
        "ticketsResolved": 12
      }
    ]
  }
}
```

**Chart type:** Bar chart. **KPI card:** Overall average across all depts.

---

#### `GET /api/analytics/ai-accuracy-rate`

```json
{
  "data": {
    "aiAccuracyRate": {
      "totalAssigned": 50,
      "aiAccepted": 42,
      "aiOverridden": 8,
      "accuracyPercentage": 84.00
    }
  }
}
```

**Chart type:** KPI card with a gauge or percentage ring.

---

#### `GET /api/analytics/sla-compliance`

Query param: `?slaHours=48` (default: 48)

```json
{
  "data": {
    "slaCompliance": {
      "slaThresholdHours": 48,
      "totalResolved": 45,
      "withinSla": 38,
      "breachedSla": 7,
      "compliancePercentage": 84.44
    }
  }
}
```

**Chart type:** Gauge or progress bar. Red/green color coding.

---

#### `GET /api/analytics/monthly-trend`

```json
{
  "data": {
    "monthlyTrend": [
      { "month": "2025-04", "ticketCount": 12 },
      { "month": "2025-05", "ticketCount": 18 },
      ...
      { "month": "2026-03", "ticketCount": 25 }
    ]
  }
}
```

**Chart type:** Line chart (12-month rolling window).

---

## 5. Ticket State Machine

### States

```
PENDING_AI → PENDING_ADMIN → ASSIGNED → RESOLVED      ✅ (terminal)
                                       → ESCALATED_TO_ADMIN → REJECTED  ✅ (terminal)
                                                             → ASSIGNED  🔄 (re-assigned)
```

### Transition Table

| From | To | Triggered By | API Endpoint |
|------|----|-------------|-------------|
| `PENDING_AI` | `PENDING_ADMIN` | System (AI) | Automatic after `POST /api/tickets` |
| `PENDING_ADMIN` | `ASSIGNED` | Admin | `PUT /api/tickets/:id/assign` |
| `ASSIGNED` | `RESOLVED` | Worker | `PUT /api/tickets/:id/resolve` |
| `ASSIGNED` | `ESCALATED_TO_ADMIN` | Worker | `PUT /api/tickets/:id/flag-false` |
| `ESCALATED_TO_ADMIN` | `REJECTED` | Admin | `PUT /api/tickets/:id/resolve-escalation` (action: reject) |
| `ESCALATED_TO_ADMIN` | `ASSIGNED` | Admin | `PUT /api/tickets/:id/resolve-escalation` (action: reassign) |

### UI Actions Per Status & Role

| Status | Citizen Can | Admin Can | Worker Can |
|--------|-----------|----------|-----------|
| `PENDING_AI` | View, wait | View | — |
| `PENDING_ADMIN` | View | **Assign** to worker | — |
| `ASSIGNED` | View | View | **Resolve** or **Flag False** |
| `RESOLVED` | View | View | View |
| `ESCALATED_TO_ADMIN` | View | **Reject** or **Re-assign** | View |
| `REJECTED` | View | View | — |

---

## 6. UI Pages & Components Spec

### 6.1 Auth Pages

**Login Page:**
- Email + password inputs
- "Login" button
- Link to registration page
- On success: store token, redirect based on role

**Registration Page:**
- Name, email, password, phone (optional), address (optional)
- "Register" button
- Link to login page
- On success: redirect to login or auto-login

**OTP Verification Page:**
- 6-digit code input (individual boxes or single input)
- "Verify" button
- "Resend OTP" link (calls `POST /api/auth/send-otp`)
- Timer showing OTP expiry (10 min)

---

### 6.2 Citizen Dashboard

**My Tickets List:**
- Table or card view
- Columns: ID, Status (color-coded badge), Department, Description (truncated), Created Date
- Sort by newest first
- Click → navigate to ticket detail
- "Create New Ticket" button (prominent)

**Create Ticket Form:**
- Image upload area (drag-and-drop + click to browse)
  - Preview uploaded image
  - Validate: JPEG/PNG only, max 10MB
- GPS auto-capture indicator
  - Show "📍 Location captured" with lat/lng
  - Handle permission denied gracefully
- Optional description textarea
- "Submit" button
- Use `FormData` for multipart upload

**Ticket Detail Page:**
- Image preview (full size)
- Map pin showing GPS location (Leaflet/Google Maps)
- Status badge (color-coded)
- Status timeline / progress tracker
- All ticket metadata
- Resolution image (if resolved)
- Notification history

---

### 6.3 Admin Dashboard

**Pending Review Queue:**
- List of `PENDING_ADMIN` tickets
- Each card shows: image thumbnail, AI recommended department, confidence score (%), citizen info
- "Assign" button → opens Assignment Modal

**Assignment Modal:**
- Department dropdown (pre-filled with AI recommendation, highlighted)
- Worker dropdown (dynamically filtered by selected department)
  - Fetch workers: `GET /api/admin/users?role=DEPT_WORKER&departmentId=X`
- AI confidence indicator
- "Assign" button

**Escalation Queue:**
- List of `ESCALATED_TO_ADMIN` tickets
- Shows worker's escalation reason
- Two action buttons: "Reject" and "Re-assign"
- Re-assign opens Assignment Modal (same as above)
- Reject asks for admin resolution notes

**Departments CRUD Page:**
- Table: Name, Description, AI Label, Workers Count, Status (Active/Inactive), Actions
- "Add Department" button → modal/form
- Edit and Delete actions per row
- Delete shows warning if department has active tickets

**Users CRUD Page:**
- Table: Name, Email, Role, Department, Status, Created Date, Actions
- Filters: Role dropdown, Department dropdown
- "Add User" button → creates DEPT_WORKER or OFFICER
  - Role selector
  - Department dropdown (shown only for DEPT_WORKER)
- Edit and Deactivate actions per row

---

### 6.4 Worker Dashboard

**My Tasks:**
- List of `ASSIGNED` tickets for the logged-in worker
- Each card: ticket ID, image thumbnail, citizen info, department, assigned date
- Click → ticket detail with actions

**Resolve Modal:**
- Image upload for "After" photo (required)
- Resolution notes textarea (optional)
- "Mark Resolved" button

**Flag False Report Modal:**
- Reasoning textarea (required, clearly labelled)
- Warning: "This will escalate the ticket to Admin for review"
- "Flag as False Report" button

---

### 6.5 Officer Analytics Dashboard

**KPI Cards (top row):**
- Total Tickets (count)
- Resolved Tickets (count)
- Average Resolution Time (hours)
- AI Accuracy Rate (%)
- SLA Compliance (%)

**Charts:**
- Tickets by Department → Bar Chart
- Tickets by Status → Pie/Donut Chart (use status colors)
- Monthly Trend → Line Chart (12 months)
- Average Resolution Time by Dept → Horizontal Bar Chart
- SLA Compliance → Gauge or Progress Bar

**Filters (optional):**
- Date range picker
- Department filter dropdown

---

## 7. Design Tokens

### Status Colors

| Status | Label | Color | Hex | CSS Class Suggestion |
|--------|-------|-------|-----|---------------------|
| `PENDING_AI` | Pending AI | Yellow | `#F59E0B` | `status-pending-ai` |
| `PENDING_ADMIN` | Pending Review | Orange | `#F97316` | `status-pending-admin` |
| `ASSIGNED` | Assigned | Blue | `#3B82F6` | `status-assigned` |
| `RESOLVED` | Resolved | Green | `#10B981` | `status-resolved` |
| `ESCALATED_TO_ADMIN` | Escalated | Red | `#EF4444` | `status-escalated` |
| `REJECTED` | Rejected | Gray | `#6B7280` | `status-rejected` |

### Status Badge Component

```jsx
const STATUS_CONFIG = {
  PENDING_AI:          { label: 'Pending AI',    color: '#F59E0B', bg: '#FEF3C7' },
  PENDING_ADMIN:       { label: 'Pending Review', color: '#F97316', bg: '#FFEDD5' },
  ASSIGNED:            { label: 'Assigned',       color: '#3B82F6', bg: '#DBEAFE' },
  RESOLVED:            { label: 'Resolved',       color: '#10B981', bg: '#D1FAE5' },
  ESCALATED_TO_ADMIN:  { label: 'Escalated',      color: '#EF4444', bg: '#FEE2E2' },
  REJECTED:            { label: 'Rejected',       color: '#6B7280', bg: '#F3F4F6' },
};
```

### Role Colors (for badges/chips)

| Role | Color | Hex |
|------|-------|-----|
| CITIZEN | Teal | `#14B8A6` |
| ADMIN | Purple | `#8B5CF6` |
| DEPT_WORKER | Indigo | `#6366F1` |
| OFFICER | Amber | `#F59E0B` |

---

## 8. File Upload Handling

### Ticket Image Upload

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);       // field name: "image"
formData.append('latitude', latitude.toString());
formData.append('longitude', longitude.toString());
formData.append('description', description);

const response = await fetch('/api/tickets', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },  // NO Content-Type header — browser sets it
  body: formData,
});
```

### Resolution Image Upload

```javascript
const formData = new FormData();
formData.append('resolutionImage', fileInput.files[0]);  // field name: "resolutionImage"
formData.append('resolutionNotes', notes);

const response = await fetch(`/api/tickets/${ticketId}/resolve`, {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

### Image Display

All uploaded images are served at: `http://localhost:5000/uploads/<filename>`

The `imageUrl` and `resolutionImageUrl` fields from the API already contain `/uploads/...` paths. Prepend the backend URL:

```javascript
const fullImageUrl = `http://localhost:5000${ticket.imageUrl}`;
```

### Constraints

- Accepted formats: JPEG, PNG only
- Max file size: 10 MB
- **Do NOT** set `Content-Type` header manually for FormData — let the browser handle `multipart/form-data` boundary

---

## 9. Error Handling

### Error Codes Reference

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Missing/invalid fields |
| `INVALID_STATE_TRANSITION` | 400 | Ticket status doesn't allow this action |
| `DEPARTMENT_IN_USE` | 400 | Can't delete dept with active tickets |
| `WORKER_DEPT_MISMATCH` | 400 | Worker not in specified department |
| `SELF_DEACTIVATION` | 400 | Admin tried to deactivate self |
| `INVALID_OTP` | 400 | OTP wrong or expired |
| `AUTH_REQUIRED` | 401 | No token provided |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `TOKEN_EXPIRED` | 401 | JWT expired → redirect to login |
| `INVALID_TOKEN` | 401 | JWT malformed → redirect to login |
| `FORBIDDEN` | 403 | Role not authorized for this action |
| `ACCOUNT_DEACTIVATED` | 403 | User account is inactive |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `DUPLICATE_NAME` | 409 | Department name already exists |
| `FILE_TOO_LARGE` | 400 | Upload exceeds 10MB |
| `UPLOAD_ERROR` | 400 | Invalid file type or upload problem |

### Recommended Error Handling Pattern

```javascript
// API call wrapper
async function apiCall(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`http://localhost:5000${url}`, { ...options, headers });
  const data = await res.json();

  if (!data.success) {
    // Handle auth errors globally
    if (['TOKEN_EXPIRED', 'INVALID_TOKEN', 'AUTH_REQUIRED'].includes(data.error.code)) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    throw data.error;  // { code, message, details }
  }

  return data;
}
```

---

## 10. Seed Data & Test Accounts

### Pre-Seeded Departments

| ID | Name | AI Label |
|----|------|----------|
| 1 | Water Supply | Water |
| 2 | Electricity Board | Electricity |
| 3 | Sanitation Department | Sanitation |
| 4 | Roads & Infrastructure | Roads |

### Default Admin Account

| Field | Value |
|-------|-------|
| Email | `admin@municipal.com` |
| Password | `admin123` |
| Role | `ADMIN` |

### Getting Workers for Assignment UI

To populate the worker dropdown when assigning tickets:

```javascript
// 1. Get all departments
const depts = await apiCall('/api/admin/departments');

// 2. When admin selects a department, fetch its workers
const workers = await apiCall(`/api/admin/users?role=DEPT_WORKER&departmentId=${selectedDeptId}`);
```

### GPS Capture Pattern

```javascript
function captureLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
```

---

## Quick Reference Card

```
Backend URL:   http://localhost:5000/api
Auth Header:   Authorization: Bearer <jwt_token>
Image Uploads: multipart/form-data (field: "image" or "resolutionImage")
Static Files:  http://localhost:5000/uploads/<filename>
JWT Expiry:    24 hours
Max Upload:    10 MB (JPEG/PNG only)
Admin Login:   admin@municipal.com / admin123
```
