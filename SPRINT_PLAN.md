# EnsureVault: Next Steps & Sprint Plan

This document outlines the detailed, ordered plan for the upcoming sprint. Tasks are ordered by dependencies—database layer and constraints must be established before backend logic consumes them, and backend APIs must be secured, validated, and documented before frontend clients connect to them.

Please read your section carefully, understand your role, and use the provided deliverables as a checklist for your upcoming Pull Request.

---

## 1. Pranav Lorekar (Database Administrator & Triggers Specialist)
**Priority: High (Blocking Backend)**

**Current State:** The foundational schema (tables, foreign keys) and seed data are successfully merged and running in our Dockerized MySQL container. 
**Goal:** We need strict database-level business rules enforced via Triggers before the backend begins pumping in real, high-volume data.

**Specific Tasks:**
1. **Duplicate Claims Prevention:** Write a `BEFORE INSERT` trigger on the `claim` table. If a customer tries to file a claim on the exact same `policy_id` within a very short timeframe (e.g., 24 hours), the trigger should `SIGNAL SQLSTATE` to abort the insertion and prevent spam.
2. **KYC Verification Constraint:** Write a `BEFORE INSERT` trigger on the `policy` table. Ensure that the `customer_id` associated with the new policy has a `kyc_status = 'Verified'`. If not, abort the transaction. Keep unverified customers from buying policies!

**Deliverable:**
* Create a new file: `backend/sql/triggers.sql`. 
* Once merged, Dhruv will update the `docker-compose.yml` volumes to automatically execute this file on database initialization.

---

## 2. Aaditya Lahori (Backend Transactions & Finance)
**Priority: High (Blocking Frontend Finance UI)**

**Current State:** Aayush has completed the core Risk Assessment and Premium Stored Procedures. However, the final execution of claim payouts and premium payments requires strict ACID properties.
**Goal:** Build the FastAPI endpoints for Payouts and Payments using robust SQL transaction blocks (`START TRANSACTION`, `COMMIT`, `ROLLBACK`).

**Specific Tasks:**
1. **Payouts & Finance API:** Create the router file for processing payments and updating claim statuses.
2. **Atomic Claims Execution:** Design an endpoint (e.g., `POST /api/v1/claims/{id}/approve`) that uses a single database transaction to:
    * Update the `claim` status to `'Approved'`.
    * Insert a calculated payout record into the `payment` table.
    * Roll back everything if any step fails (e.g., database connection loss mid-query).

**Deliverable:**
* A new FastAPI module: `backend/src/routers/payouts.py`.
* Registration of this new router in `backend/src/main.py`.

---

## 3. Aayush Kushwaha (Backend Refinement & Risk Assessment)
**Priority: Medium (Enabling Frontend Integration)**

**Current State:** You have successfully built the heavy-lifting logic via `stored_procedures.sql` for Premium Calculation and Risk Assessment. The endpoints are working, but they lack strict input validation and clean frontend documentation.
**Goal:** Harden your FastAPI routes and create robust Swagger documentation.

**Specific Tasks:**
1. **Pydantic Validation:** Create strict Pydantic schemas/models in the `backend/src/models/` folder. Ensure all incoming API requests (like creating a policy type or assessing a claim) define constraints (e.g., `max_coverage > 0`, `base_premium >= 0`). 
2. **Swagger Polish:** Update your route decorators in `policies.py`, `policy_types.py`, `premium.py`, and `risk_assessment.py`. Add explicit `response_model` definitions, `summary`, `# tags`, and detailed endpoint descriptions so the frontend team knows precisely what data structures to send and expect.

**Deliverable:**
* Updated Pydantic models in `backend/src/models/`.
* Hardened endpoints in your existing router files.

---

## 4. Yash Singh (Frontend Customer Portfolio & Auth)
**Priority: Medium (Unblocking User Flow)**

**Current State:** The core Next.js routing and component library are set up, but there is no entry point for users, nor is there a dedicated Customer Portfolio view.
**Goal:** Build the Authentication gateways and reporting dashboards.

**Specific Tasks:**
1. **Authentication Flow:** Build the Login and Registration screens. For now, you can mock the backend auth token generation, but ensure the UI form state is properly managed.
2. **Role-Based Access Control (RBAC):** Implement layout wrappers or middleware to ensure a logged-in `Customer` cannot navigate to the Admin `/policies/create` routes or Adjuster dashboards.
3. **Customer Portfolio UI:** Build pages for customers to view their profile, upload mock KYC documents, and see charts displaying their policy history and claim statistics.

**Deliverable:**
* New Next.js pages under `/app/auth/login`, `/app/auth/register`, and `/app/customer/profile`.
* Basic Next.js middleware or wrapper components for RBAC.

---

## 5. Divyam Agarwal (Frontend Integration)
**Priority: Medium-High (Connecting the Full Stack)**

**Current State:** You've built an excellent, visually appealing UI framework. However, the components currently rely on static mock data.
**Goal:** Connect your beautifully designed pages to the real FastAPI backend using the newly injected Docker environment variables.

**Specific Tasks:**
1. **API Integration:** Use the standard `fetch` API (or `axios`) to connect your Dashboard, Policy Management, and Claims Submission pages to the real API endpoints. Ensure you prefix all requests with `process.env.NEXT_PUBLIC_API_URL`.
2. **Client-Side Validation:** Implement React Hook Form and Zod to validate forms on the client-side *before* making the API call (e.g., ensure the claim amount is a valid number, incident date is in the past).
3. **Error Handling & Loading States:** Add loading spinners and error toast notifications (from ShadCN) for when the backend takes time to respond or an API call fails.

**Deliverable:**
* Dynamic data fetching implemented across your existing Next.js pages.
* Client-side validation schemas in `frontend/lib/validators.ts`.

---

## 6. Dhruv Shah (Project Leader & Integrator)
**Priority: Ongoing**

**Current State:** Full-Stack Docker orchestration is fully deployed, and the database, backend, and frontend are correctly communicating on local machines.
**Goal:** System management and quality control.

**Specific Tasks:**
1. **Code Review:** Review and merge the incoming Pull Requests from Pranav, Aaditya, Aayush, Yash, and Divyam. Ensure their code strictly aligns with the guidelines outlined above.
2. **CI/CD Integration (Optional):** Define a GitHub Actions workflow (`.github/workflows/main.yml`) that automatically runs testing and linting whenever anyone pushes to their branches, enforcing a strong level of quality control before merging into `main`.

**Deliverable:**
* Maintained stability of the `main` branch.
