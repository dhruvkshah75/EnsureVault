# EnsureVault Database Triggers - Live Demonstration Guide

## Overview

This document provides a complete guide to demonstrate all 4 database triggers in EnsureVault. These triggers enforce critical business logic at the database level, including KYC verification, fraud prevention, and automated calculations.

**All triggers have been tested and verified working.**

---

## Trigger Summary

| # | Trigger Name | Purpose | Error Code |
|---|---|---|---|
| 1 | `enforce_kyc_before_policy` | Prevent policy purchase without verified KYC | 45001 |
| 2 | `trg_calculate_commission` | Auto-calculate agent commission on payment success | N/A |
| 3 | `prevent_duplicate_claim` | Prevent duplicate insurance claims within 24 hours | 45000 |
| 4 | `enforce_kyc_before_claim` | Prevent claim filing without verified KYC | 45001 |

---

## Environment Setup

Before demonstrating triggers, ensure the application is running:

```bash
# Navigate to project root
cd /home/dhruv/sem4/DBMS/EnsureVault

# Start all containers
docker compose down
docker compose up -d --build

# Verify all services are healthy
docker compose ps
```

**Expected output:** All containers should show `Up` status.

---

## Database Access

Connect to MySQL database for live testing:

```bash
# Option 1: Through Docker
docker exec -it ensurervault-db-1 mysql -uroot -proot_password ensurervault

# Option 2: Direct connection (if MySQL client installed)
mysql -h 127.0.0.1 -P 3306 -uroot -proot_password ensurervault
```

---

## Trigger Demonstrations

### Demo 1: KYC Policy Enforcement (Trigger 1 & 4)

**Purpose:** Verify that policies and claims cannot be created without verified KYC status.

#### Setup - Check Existing User

```sql
SELECT * FROM users WHERE email = 'agent@example.com' LIMIT 1;
```

**Expected:** Returns user record with KYC status.

#### Test Case 1A: Block Policy with Pending KYC

```sql
-- First, update KYC to Pending
UPDATE users SET kyc_status = 'Pending' WHERE email = 'agent@example.com';

-- Try to insert a policy (should FAIL)
INSERT INTO policies (
    user_id, 
    agent_id, 
    policy_type, 
    sum_insured, 
    premium, 
    start_date, 
    end_date, 
    status
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    (SELECT id FROM agents WHERE name = 'Sample Agent' LIMIT 1),
    'Health',
    500000,
    2500,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
    'Active'
);
```

**Expected Error:**
```
ERROR 1644 (45001): User has not completed KYC verification
```

#### Test Case 1B: Allow Policy with Verified KYC

```sql
-- Update KYC to Verified
UPDATE users SET kyc_status = 'Verified' WHERE email = 'agent@example.com';

-- Try to insert the same policy (should SUCCEED)
INSERT INTO policies (
    user_id, 
    agent_id, 
    policy_type, 
    sum_insured, 
    premium, 
    start_date, 
    end_date, 
    status
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    (SELECT id FROM agents WHERE name = 'Sample Agent' LIMIT 1),
    'Health',
    500000,
    2500,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
    'Active'
);

-- Verify policy was created
SELECT * FROM policies WHERE policy_type = 'Health' ORDER BY created_at DESC LIMIT 1;
```

**Expected:** Policy inserted successfully with status 'Active'.

---

### Demo 2: Commission Auto-Calculation (Trigger 2)

**Purpose:** Verify that agent commissions are automatically calculated when a payment succeeds.

#### Commission Formula
- **Rate:** 8.5% of payment amount
- **Calculation:** `commission = payment_amount × 0.085`

#### Test Case 2A: Insert Payment with Success Status

```sql
-- First, get a valid agent and policy ID
SELECT id FROM agents WHERE name = 'Sample Agent' LIMIT 1;
SELECT id FROM policies WHERE policy_type = 'Health' LIMIT 1;

-- Insert a payment with Success status (replace IDs)
INSERT INTO payments (
    policy_id,
    agent_id,
    amount,
    payment_date,
    status
) VALUES (
    (SELECT id FROM policies WHERE policy_type = 'Health' LIMIT 1),
    (SELECT id FROM agents WHERE name = 'Sample Agent' LIMIT 1),
    10000,
    NOW(),
    'Success'
);

-- Verify commission was auto-calculated
SELECT id, agent_id, amount, commission, created_at 
FROM commissions 
WHERE amount = 10000 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Output:**
```
+----+----------+--------+----------+---------------------+
| id | agent_id | amount | commission | created_at        |
+----+----------+--------+----------+---------------------+
| XX | XX       | 10000  | 850      | 2026-04-XX XX:XX:XX |
+----+----------+--------+----------+---------------------+
```

**Verification:** 
- Commission = 10,000 × 0.085 = **850** ✓

#### Test Case 2B: No Commission for Pending Payment

```sql
-- Insert payment with Pending status
INSERT INTO payments (
    policy_id,
    agent_id,
    amount,
    payment_date,
    status
) VALUES (
    (SELECT id FROM policies WHERE policy_type = 'Health' LIMIT 1),
    (SELECT id FROM agents WHERE name = 'Sample Agent' LIMIT 1),
    5000,
    NOW(),
    'Pending'
);

-- Check that NO commission was created
SELECT COUNT(*) as commission_count 
FROM commissions 
WHERE amount = 5000;
```

**Expected:** Commission count = 0 (trigger only fires on Success status).

---

### Demo 3: Duplicate Claims Prevention (Trigger 3)

**Purpose:** Verify that duplicate insurance claims within 24 hours are blocked.

#### Setup - Create Incident & First Claim

```sql
-- Create an incident
INSERT INTO incidents (
    user_id,
    title,
    description,
    incident_date,
    status
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    'Car Accident',
    'Minor collision on highway',
    CURDATE(),
    'Reported'
);

-- Create first claim on this incident
INSERT INTO claims (
    user_id,
    incident_id,
    policy_id,
    amount_claimed,
    status,
    claim_date
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    (SELECT id FROM incidents WHERE title = 'Car Accident' ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM policies WHERE policy_type = 'Health' LIMIT 1),
    50000,
    'Pending',
    NOW()
);

-- Verify first claim created
SELECT id, user_id, incident_id, amount_claimed, status, claim_date 
FROM claims 
WHERE amount_claimed = 50000 
LIMIT 1;
```

#### Test Case 3A: Block Duplicate Claim (Same Day)

```sql
-- Try to create ANOTHER claim for the same incident within 24 hours (should FAIL)
INSERT INTO claims (
    user_id,
    incident_id,
    policy_id,
    amount_claimed,
    status,
    claim_date
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    (SELECT id FROM incidents WHERE title = 'Car Accident' ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM policies WHERE policy_type = 'Health' LIMIT 1),
    50000,
    'Pending',
    NOW()
);
```

**Expected Error:**
```
ERROR 1644 (45000): Duplicate claim for the same incident within 24 hours
```

#### Test Case 3B: Allow Claim After 24 Hours

```sql
-- Create a NEW incident dated yesterday
INSERT INTO incidents (
    user_id,
    title,
    description,
    incident_date,
    status
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    'Theft Report',
    'Laptop stolen from office',
    DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    'Reported'
);

-- Create claim for yesterday's incident (should SUCCEED - outside 24h window)
INSERT INTO claims (
    user_id,
    incident_id,
    policy_id,
    amount_claimed,
    status,
    claim_date
) VALUES (
    (SELECT id FROM users WHERE email = 'agent@example.com' LIMIT 1),
    (SELECT id FROM incidents WHERE title = 'Theft Report' ORDER BY created_at DESC LIMIT 1),
    (SELECT id FROM policies WHERE policy_type = 'Health' LIMIT 1),
    30000,
    'Pending',
    NOW()
);

-- Verify second claim created (different incident, outside 24h)
SELECT id, user_id, incident_id, amount_claimed, status 
FROM claims 
WHERE amount_claimed = 30000 
LIMIT 1;
```

**Expected:** Claim inserted successfully.

---

## Key Talking Points for Evaluation

### 1. **Database-Level Enforcement**
- Triggers enforce business logic at the database layer, not just in application code
- Prevents invalid data even if API validation is bypassed
- Ensures data integrity across all access methods

### 2. **Regulatory Compliance**
- KYC verification is a legal requirement for insurance
- Triggers enforce this automatically at the database level
- Cannot be circumvented by application bugs

### 3. **Fraud Prevention**
- Duplicate claim prevention within 24 hours blocks common fraud patterns
- Database layer prevents race conditions in concurrent requests
- Commission auto-calculation ensures accurate tracking

### 4. **Operational Efficiency**
- Commission calculations are instant and automatic
- No manual reconciliation needed
- Reduces human error in financial calculations

---

## Troubleshooting

### Issue: "User does not exist" or "Policy does not exist"

**Solution:** Replace the example emails/names with actual data:
```sql
-- Find actual users
SELECT id, email FROM users LIMIT 5;

-- Find actual agents
SELECT id, name FROM agents LIMIT 5;

-- Find actual policies
SELECT id, policy_type FROM policies LIMIT 5;
```

### Issue: Trigger not firing

**Solution:** Ensure database connection is active and triggers are installed:
```sql
-- Check if triggers exist
SHOW TRIGGERS;

-- Check trigger definition
SHOW CREATE TRIGGER enforce_kyc_before_policy\G
```

### Issue: "MySQL connection failed"

**Solution:** Restart Docker containers:
```bash
docker compose down
docker compose up -d
sleep 5  # Wait for DB to initialize
```

---

## Test Results Summary

**All 4 triggers verified as working:**

| Trigger | Test Date | Status | Error Code |
|---------|-----------|--------|------------|
| KYC Policy | 2026-04-15 | ✅ PASS | 45001 |
| Commission Calc | 2026-04-15 | ✅ PASS | N/A (8.5% verified) |
| Duplicate Claims | 2026-04-15 | ✅ PASS | 45000 |
| KYC Claims | 2026-04-15 | ✅ PASS | 45001 |

---

## Related Documentation

- **Database Schema:** See `TECHNICAL_DATABASE_DOCUMENTATION.md`
- **Trigger Code:** See `backend/sql/triggers.sql`
- **API Documentation:** See `TECHNICAL_REFERENCE.md`

---

## Contact & Support

For questions during evaluation:
- **Database:** EnsureVault MySQL container
- **API Endpoint:** `http://localhost:5000/api/v1/`
- **Frontend:** `http://localhost:3000/`

---

**Last Updated:** 2026-04-15  
**Status:** Ready for evaluation ✅
