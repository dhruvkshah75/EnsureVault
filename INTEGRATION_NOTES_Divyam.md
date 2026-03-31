# Pending Changes for Other Team Members

This document lists changes that other team members need to be aware of or implement to ensure smooth integration with the frontend.

---

## For Aayush Kushwaha (Backend Validation)

### 1. Add `description` field to `claims/` response
The frontend Customer Dashboard displays claims with a `policy_type` field. Ensure the `GET /api/v1/claims/` endpoint reliably returns `policy_type` (from the `policy_type.type_name` join) in every claim object.

**Status:** Currently working — just ensure this doesn't regress during Pydantic hardening.

### 2. Consistent error response format
The frontend expects all 4XX/5XX errors to return:
```json
{ "detail": "Human-readable error message" }
```
Please ensure all HTTPException responses in `policies.py`, `policy_types.py`, `premium.py`, and `risk_assessment.py` follow this convention (most already do).

### 3. Policy-Type `POST /api/v1/policy-types/` validation
The frontend sends:
```json
{
  "type_name": "Health" | "Car" | "Home",
  "base_premium": 5000.00,
  "max_coverage": 500000.00
}
```
The `PolicyTypeCreate` Pydantic model already enforces `gt=0` on both numeric fields and restricts `type_name` to the `PolicyTypeName` enum. No changes needed — just be aware if you modify these models.

---

## For Yash Singh (Auth & RBAC)

### 1. `AuthContext` integration
The `AuthProvider` in `frontend/context/AuthContext.tsx` stores user info in `localStorage` under the key `ev_user`. When you build the Login/Register pages, use the `useAuth()` hook:

```tsx
import { useAuth } from "@/context/AuthContext";

const { login, logout, user } = useAuth();

// After successful login:
login("customer", { name: "Amit Patel", user_id: 1, customer_id: 1 });

// After successful logout:
logout();
```

### 2. Role-based route guarding
`app/admin/layout.tsx` already blocks `customer` role from accessing `/admin/*` routes. You may want to add similar guards for other restricted routes.

### 3. `DEMO_CUSTOMER_ID` replacement
Several pages (Dashboard, Claims, Premium Calculator) use a hardcoded `DEMO_CUSTOMER_ID = 1`. Once real auth is in place, replace these with the actual `user.customer_id` from the auth context:

```tsx
const { user } = useAuth();
const customerId = user?.customer_id ?? 1;
```

**Files to update:**
- `app/customer/dashboard/page.tsx` — line using `DEMO_CUSTOMER_ID`
- `app/customer/claims/new/page.tsx` — line using `DEMO_CUSTOMER_ID`
- `app/premium-calculator/page.tsx` — line using `DEMO_CUSTOMER_ID`

### 4. Toast system is available globally
A `useToast()` hook is available from `@/components/Toast`. Use it in your auth pages:

```tsx
import { useToast } from "@/components/Toast";

const { toast } = useToast();
toast("Login successful!", "success");
toast("Invalid credentials.", "error");
```

---

## For Dhruv Shah (Integration Lead)

### 1. Environment variable
Ensure `NEXT_PUBLIC_API_URL` is set in the Docker/production environment. The frontend falls back to `http://localhost:8000/api/v1` if not set. In `docker-compose.yml`, add:

```yaml
frontend:
  environment:
    - NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
```

### 2. New dependencies added
- `@types/jest` was added to `devDependencies` (fixes TypeScript compilation errors in test files)

No new runtime dependencies were added — `react-hook-form`, `@hookform/resolvers`, `zod`, and `framer-motion` were already in `package.json`.

### 3. New files added by Divyam
- `frontend/lib/validators.ts` — Zod validation schemas
- `frontend/components/Toast.tsx` — Toast notification component + provider

### 4. Modified files
- `frontend/app/layout.tsx` — Added `<ToastProvider>` wrapper
- `frontend/app/admin/policies/create/page.tsx` — Wired to API with validation
- `frontend/app/customer/claims/new/page.tsx` — Added RHF + Zod + Toast
- `frontend/app/premium-calculator/page.tsx` — Added Toast notifications
- `frontend/app/customer/dashboard/page.tsx` — Added Toast notifications
