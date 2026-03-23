Project Name: Municipal Helpdesk System
Type: Full-Stack Web Application (Web Portal)
Goal: Build a functional prototype of an AI-assisted civic issue reporting and resolution system.

1. Tech Stack Requirements
Frontend: React.js (or Next.js), Tailwind CSS.

Backend: Node.js with Express.js.

Database: PostgreSQL (Relational). Use Prisma or Sequelize as the ORM.

AI Integration: Use a simple Image Classification service (e.g., Google Cloud Vision API, or a lightweight pre-trained TensorFlow.js model) to categorize uploaded images into basic municipal categories (e.g., Water, Electricity, Sanitation, Roads).

Authentication: JWT (JSON Web Tokens) for session management, bcrypt for password hashing.

Security: crypto module for AES-256 encryption/decryption of highly sensitive fields.

2. User Roles & Permissions (RBAC)
The system has four distinct roles. The frontend UI and backend API routes must be strictly protected based on these roles:

Citizen: Can create tickets, view their own tickets, and track progress.

Admin: The central router. Manages master data (Departments, Employees). Reviews AI recommendations and officially assigns tickets. Handles worker escalations.

Dept Worker (Emp): Assigned to a specific Department. Only sees tickets assigned to them/their department. Executes tasks, uploads proof of resolution, or flags false reports.

Officer: Executive viewer. Cannot edit tickets. Has a highly informative analytics dashboard (Charts, KPIs, SLA tracking).

3. Core Workflows (The State Machine)
Workflow A: Citizen Reporting

Citizen logs in.

Citizen uploads an Image of the issue.

System automatically captures their GPS Geolocation (Lat/Long).

System automatically attaches the Citizen's contact info from their profile.

Ticket status becomes PENDING_AI.

Workflow B: AI Routing & Admin Approval

The AI analyzes the image and updates the ticket with a recommended_department_id.

Ticket status becomes PENDING_ADMIN.

Admin views the ticket on their dashboard.

Admin can either accept the AI's recommendation OR override it by selecting a different department.

Admin assigns the ticket to a specific Worker in that department.

Ticket status becomes ASSIGNED. Email notification sent to Citizen.

Workflow C: Worker Execution & Edge Cases

Happy Path: Worker completes the job, uploads an "After" photo as proof, and clicks "Resolve". Ticket status becomes RESOLVED. Email sent to Citizen.

Rejection/False Report Path: Worker arrives and sees it's a prank or invalid. Worker selects "Flag as False", provides written proof/reasoning. Ticket status becomes ESCALATED_TO_ADMIN.

Admin Resolution: Admin reviews the escalated ticket and either marks it REJECTED (closes it) or re-assigns it.

4. Specific Feature Requirements to Implement
Auth System: Standard Email/Password login. Include an endpoint for an optional Email OTP verification (can mock the actual email sending for prototype if needed, but logic must exist).

Dynamic Master Data: Admin must have CRUD pages for Departments and Users (to create worker accounts and map them).

Notifications: Hook up a basic notification service (like Nodemailer) to send emails when a Ticket's status changes.

Officer Analytics: Build API endpoints that return aggregated data for the frontend (e.g., GET /api/analytics/tickets-by-department, GET /api/analytics/average-resolution-time, GET /api/analytics/ai-accuracy-rate).

5. Development Instructions for the AI Agent
Start by initializing the Node.js backend and setting up the PostgreSQL database connection and ORM models.

Implement the Authentication middleware (JWT) and RBAC middleware (e.g., requireRole('ADMIN')).

Ensure the AES-256 encryption utility is built before the Citizen registration endpoint.

Build out the REST APIs for the Ticket lifecycle sequentially, following the state machine described above.

Keep the code modular, well-commented, and ready for a production-like environment.