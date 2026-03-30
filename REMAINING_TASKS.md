# EnsureVault — Remaining Tasks

This document tracks the outstanding work needed to make EnsureVault fully functional. The blocking tasks are now done (triggers + Docker). The tasks below are ordered by priority.

---

## 🟡 High Priority

### Aayush Kushwaha — Backend Validation & Documentation

**Goal:** Harden the existing API routes so the frontend team can safely connect to them.

| # | Task | File(s) |
|---|------|---------|
| 1 | Add Pydantic models with field constraints (`gt=0`, `min_length`, etc.) for all request bodies | `backend/src/models/` (new files) |
| 2 | Add `response_model`, `summary`, and detailed `description` to all route decorators in your routers | `policies.py`, `policy_types.py`, `premium.py`, `risk_assessment.py` |
| 3 | Ensure all 4XX error cases return clean, descriptive `HTTPException` messages | Same router files |

**Branch naming convention:** `feat/Aayush-backend-validation`

---

### Divyam Agarwal — Frontend API Integration

**Goal:** Replace all static mock data with real `fetch` calls to the FastAPI backend.

| # | Task | File(s) |
|---|------|---------|
| 1 | Use `process.env.NEXT_PUBLIC_API_URL` as the base URL prefix for all API calls | All page components |
| 2 | Wire up the Customer Dashboard to real policy and claim data | `app/customer/dashboard/page.tsx` |
| 3 | Wire up the Claims submission form to `POST /api/v1/claims` | `app/customer/claims/new/page.tsx` |
| 4 | Wire up the Admin Policy creation form to `POST /api/v1/policy-types` | `app/admin/policies/create/page.tsx` |
| 5 | Add client-side validation with **Zod** + **React Hook Form** | `frontend/lib/validators.ts` (new file) |
| 6 | Add loading spinners and error toast notifications (ShadCN) on all forms | All form pages |

**Branch naming convention:** `feat/Divyam-api-integration`

---

## 🟢 Medium Priority

### Yash Singh — Authentication & RBAC

**Goal:** Build the user authentication flow and protect routes so only authorized roles can access certain pages.

| # | Task | File(s) |
|---|------|---------|
| 1 | Build Login and Registration UI forms (mock token storage in `localStorage` is fine for now) | `app/auth/login/page.tsx`, `app/auth/register/page.tsx` |
| 2 | Implement RBAC: wrap Admin routes so only `role === 'admin'` users can navigate to them | `middleware.ts` or layout wrappers |
| 3 | Build Customer Profile page with KYC document upload UI | `app/customer/profile/page.tsx` |
| 4 | Add Navbar links that show/hide based on user role (Customer vs. Agent vs. Admin) | `components/Navbar.tsx` |

**Branch naming convention:** `feat/Yash-auth-rbac`

---

## ✅ Already Done (Completed)

| Task | Owner | Status |
|------|-------|--------|
| Docker orchestration (`docker-compose.yml`, Dockerfiles) | Dhruv | ✅ Done |
| CORS + DB connection pooling | Dhruv | ✅ Done |
| GitHub Actions CI/CD pipeline | Dhruv | ✅ Done |
| Payouts & Finance API (atomic transactions) | Aaditya | ✅ Merged & Tested |
| Database triggers (`triggers.sql`) | Dhruv (on behalf of Pranav) | ✅ Done |

---

## Suggested Merge Order

```
Aayush (validation) ──► Divyam (API integration) ──► Yash (auth + RBAC)
```

> All PRs must pass the GitHub Actions CI check (lint + syntax) before being merged into `main`.
