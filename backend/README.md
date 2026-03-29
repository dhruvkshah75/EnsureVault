# EnsureVault — Backend API

FastAPI backend for the **EnsureVault** Insurance Policy & Claims Processing System.

**Stack:** Python 3.12 · FastAPI · MySQL 8.0 · Raw SQL (no ORM)

---

## Quick Start

```bash
# 1. Install dependencies
uv sync

# 2. Set up the database
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/stored_procedures.sql
mysql -u root -p < sql/seed.sql          # optional — dev data

# 3. Configure environment
cp .env.example .env                     # then edit DB credentials

# 4. Run the server
uv run uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`  
Interactive docs (Swagger UI) at `http://localhost:8000/docs`

---

## Project Structure

```
backend/
├── sql/
│   ├── schema.sql              # 8 tables (Agent, Customer, PolicyType, Policy, Claim, Payment, Nominee, Document)
│   ├── stored_procedures.sql   # calculate_premium, assess_claim_risk
│   └── seed.sql                # Sample data for development
├── src/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── config.py               # .env loader
│   ├── database.py             # MySQL connection pool
│   ├── models/                 # Pydantic request/response schemas
│   │   ├── common.py
│   │   ├── policy_type.py
│   │   ├── policy.py
│   │   └── claim.py
│   ├── routers/                # API route handlers
│   │   ├── policy_types.py     # CRUD for insurance plans
│   │   ├── policies.py         # Policy lifecycle
│   │   ├── risk_assessment.py  # Adjuster claim investigation
│   │   └── premium.py          # Premium calculation
│   └── utils/
│       └── validators.py       # Shared validation helpers
├── .env.example
└── pyproject.toml
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Policy Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/policy-types` | List all plan types (Health, Car, Home) |
| `GET` | `/policy-types/{id}` | Get a specific plan type |
| `POST` | `/policy-types` | Create a new plan type |
| `PUT` | `/policy-types/{id}` | Update plan rules |
| `DELETE` | `/policy-types/{id}` | Remove a plan type |

### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/policies` | List policies (filterable by customer, agent, status, type) |
| `GET` | `/policies/{id}` | Get policy details with nominees |
| `POST` | `/policies` | Create a new policy (premium auto-calculated if omitted) |
| `PUT` | `/policies/{id}/status` | Update policy status (Active, Expired, Cancelled) |

### Risk Assessment (Claims Manager)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/claims/pending` | List claims awaiting review |
| `GET` | `/claims/{id}/assess` | Get automated risk assessment |
| `GET` | `/claims/{id}/documents` | View uploaded documents |
| `PUT` | `/claims/{id}/decision` | Approve or reject a claim |

### Premium Calculation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/premium/calculate` | Calculate premium for a customer + type |
| `GET` | `/premium/factors/{type_id}` | Get risk factors for a policy type |

---

## Stored Procedures

### `calculate_premium(customer_id, type_id)`

Computes: `base_premium × type_multiplier × risk_multiplier`

- **Type multipliers:** Health = 1.0x, Car = 1.2x, Home = 0.9x
- **Risk multipliers:** Based on customer claim history (0 claims → 1.0x, up to 6+ claims → 1.6x)

### `assess_claim_risk(claim_id)`

Returns a risk score (LOW / MEDIUM / HIGH) based on:
- **Coverage ratio** — claim amount vs. max coverage
- **Claim frequency** — customer's total past claims
- **Policy age** — flags early claims (< 90 days) as suspicious

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | _(empty)_ | MySQL password |
| `DB_NAME` | `ensurevault` | Database name |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allowed origin |

---

## Module Ownership

| Module | Owner |
|--------|-------|
| Policy Management | Aayush Kushwaha |
| Risk Assessment | Aayush Kushwaha |
| Premium Calculation | Aayush Kushwaha |
| Claims Submission | Aaditya Lahori |
| Payouts & Finance | Aaditya Lahori |
| DB Connection & Architecture | Dhruv Shah |
| Triggers & Data Integrity | Pranav Lorekar |
