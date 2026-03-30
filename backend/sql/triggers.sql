-- ============================================================
-- EnsureVault — Business Logic Triggers
-- Run AFTER schema.sql, seed.sql, and stored_procedures.sql
-- Enforces data integrity at the database level (BCNF safety net)
-- ============================================================

USE ensurevault;

-- ============================================================
-- TRIGGER 1: Duplicate Claims Prevention
-- Fires BEFORE inserting a new claim.
-- Blocks a customer from filing more than one claim on the
-- same policy within a 24-hour window to prevent spam/fraud.
-- ============================================================
DROP TRIGGER IF EXISTS prevent_duplicate_claim;

DELIMITER $$

CREATE TRIGGER prevent_duplicate_claim
BEFORE INSERT ON claim
FOR EACH ROW
BEGIN
    DECLARE recent_claim_count INT;

    SELECT COUNT(*) INTO recent_claim_count
    FROM claim
    WHERE policy_id = NEW.policy_id
      AND incident_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY);

    IF recent_claim_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'DUPLICATE_CLAIM: A claim for this policy has already been filed within the last 24 hours. Please wait before submitting another.';
    END IF;
END$$

DELIMITER ;


-- ============================================================
-- TRIGGER 2: KYC Verification Constraint
-- Fires BEFORE inserting a new policy.
-- Ensures that only customers with kyc_status = 'Verified'
-- are allowed to purchase a policy. Unverified customers
-- are blocked at the database level.
-- ============================================================
DROP TRIGGER IF EXISTS enforce_kyc_before_policy;

DELIMITER $$

CREATE TRIGGER enforce_kyc_before_policy
BEFORE INSERT ON policy
FOR EACH ROW
BEGIN
    DECLARE customer_kyc_status ENUM('Verified', 'Pending', 'Rejected');

    SELECT kyc_status INTO customer_kyc_status
    FROM customer
    WHERE customer_id = NEW.customer_id;

    IF customer_kyc_status IS NULL THEN
        SIGNAL SQLSTATE '45001'
            SET MESSAGE_TEXT = 'KYC_ERROR: Customer not found.';
    END IF;

    IF customer_kyc_status != 'Verified' THEN
        SIGNAL SQLSTATE '45001'
            SET MESSAGE_TEXT = 'KYC_UNVERIFIED: Customer must complete KYC verification before purchasing a policy.';
    END IF;
END$$

DELIMITER ;
