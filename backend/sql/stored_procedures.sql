-- ============================================================
-- EnsureVault — Stored Procedures
-- MySQL 8.0  |  Aayush Kushwaha's modules
-- ============================================================

USE ensurevault;

DELIMITER //

-- ============================================================
-- 1. calculate_premium
--    Computes premium for a customer + policy type pair.
--    Factors: base_premium, type multiplier, claim history.
-- ============================================================
CREATE PROCEDURE calculate_premium(
    IN p_customer_id INT,
    IN p_type_id     INT
)
BEGIN
    DECLARE v_base_premium  DECIMAL(12,2);
    DECLARE v_type_name     VARCHAR(20);
    DECLARE v_type_mult     DECIMAL(4,2);
    DECLARE v_claim_count   INT DEFAULT 0;
    DECLARE v_total_claimed DECIMAL(14,2) DEFAULT 0;
    DECLARE v_risk_mult     DECIMAL(4,2) DEFAULT 1.00;
    DECLARE v_final_premium DECIMAL(12,2);

    -- Fetch base premium and type name
    SELECT base_premium, type_name
      INTO v_base_premium, v_type_name
      FROM policy_type
     WHERE type_id = p_type_id;

    -- Type-specific multiplier
    SET v_type_mult = CASE v_type_name
        WHEN 'Health' THEN 1.00
        WHEN 'Car'    THEN 1.20
        WHEN 'Home'   THEN 0.90
        ELSE 1.00
    END;

    -- Get customer claim history across all their policies
    SELECT COUNT(*), COALESCE(SUM(cl.claim_amount), 0)
      INTO v_claim_count, v_total_claimed
      FROM claim cl
      JOIN policy p ON cl.policy_id = p.policy_id
     WHERE p.customer_id = p_customer_id;

    -- Risk multiplier based on claim history
    -- 0 claims  -> 1.00 (no adjustment)
    -- 1-2 claims -> 1.15 (15% surcharge)
    -- 3-5 claims -> 1.35 (35% surcharge)
    -- 6+ claims  -> 1.60 (60% surcharge)
    SET v_risk_mult = CASE
        WHEN v_claim_count = 0 THEN 1.00
        WHEN v_claim_count <= 2 THEN 1.15
        WHEN v_claim_count <= 5 THEN 1.35
        ELSE 1.60
    END;

    -- Final premium = base × type multiplier × risk multiplier
    SET v_final_premium = ROUND(v_base_premium * v_type_mult * v_risk_mult, 2);

    -- Return result set
    SELECT
        p_customer_id   AS customer_id,
        p_type_id       AS type_id,
        v_type_name     AS type_name,
        v_base_premium  AS base_premium,
        v_risk_mult     AS risk_multiplier,
        v_final_premium AS calculated_premium;
END //


-- ============================================================
-- 2. assess_claim_risk
--    Evaluates risk level for a specific claim.
--    Returns risk score and recommended action.
-- ============================================================
CREATE PROCEDURE assess_claim_risk(
    IN p_claim_id INT
)
BEGIN
    DECLARE v_claim_amount    DECIMAL(14,2);
    DECLARE v_policy_id       INT;
    DECLARE v_max_coverage    DECIMAL(14,2);
    DECLARE v_coverage_ratio  DECIMAL(6,4);
    DECLARE v_customer_id     INT;
    DECLARE v_claim_count     INT DEFAULT 0;
    DECLARE v_days_since_start INT DEFAULT 0;
    DECLARE v_risk_score      VARCHAR(10);
    DECLARE v_recommended     VARCHAR(100);
    DECLARE v_risk_points     INT DEFAULT 0;

    -- Get claim details
    SELECT cl.claim_amount, cl.policy_id, p.customer_id
      INTO v_claim_amount, v_policy_id, v_customer_id
      FROM claim cl
      JOIN policy p ON cl.policy_id = p.policy_id
     WHERE cl.claim_id = p_claim_id;

    -- Get max coverage for this policy's type
    SELECT pt.max_coverage
      INTO v_max_coverage
      FROM policy p
      JOIN policy_type pt ON p.type_id = pt.type_id
     WHERE p.policy_id = v_policy_id;

    -- Coverage ratio (how much of max coverage is being claimed)
    SET v_coverage_ratio = ROUND(v_claim_amount / v_max_coverage, 4);

    -- Days since policy start
    SELECT DATEDIFF(CURDATE(), p.start_date)
      INTO v_days_since_start
      FROM policy p
     WHERE p.policy_id = v_policy_id;

    -- Customer's total claim count
    SELECT COUNT(*)
      INTO v_claim_count
      FROM claim cl
      JOIN policy p ON cl.policy_id = p.policy_id
     WHERE p.customer_id = v_customer_id;

    -- === RISK SCORING ===
    -- Coverage ratio points
    SET v_risk_points = v_risk_points + CASE
        WHEN v_coverage_ratio > 0.80 THEN 3
        WHEN v_coverage_ratio > 0.50 THEN 2
        WHEN v_coverage_ratio > 0.25 THEN 1
        ELSE 0
    END;

    -- Claim frequency points
    SET v_risk_points = v_risk_points + CASE
        WHEN v_claim_count >= 5 THEN 3
        WHEN v_claim_count >= 3 THEN 2
        WHEN v_claim_count >= 2 THEN 1
        ELSE 0
    END;

    -- Early claim points (claim within first 90 days is suspicious)
    SET v_risk_points = v_risk_points + CASE
        WHEN v_days_since_start < 30  THEN 3
        WHEN v_days_since_start < 90  THEN 2
        WHEN v_days_since_start < 180 THEN 1
        ELSE 0
    END;

    -- Map points to risk level
    -- 0-2  -> LOW
    -- 3-5  -> MEDIUM
    -- 6-9  -> HIGH
    SET v_risk_score = CASE
        WHEN v_risk_points <= 2 THEN 'LOW'
        WHEN v_risk_points <= 5 THEN 'MEDIUM'
        ELSE 'HIGH'
    END;

    SET v_recommended = CASE
        WHEN v_risk_points <= 2 THEN 'Approve — low risk indicators'
        WHEN v_risk_points <= 5 THEN 'Review documents carefully before decision'
        ELSE 'Investigate thoroughly — high risk indicators detected'
    END;

    -- Return result set
    SELECT
        p_claim_id          AS claim_id,
        v_claim_amount      AS claim_amount,
        v_max_coverage      AS max_coverage,
        v_coverage_ratio    AS coverage_ratio,
        v_claim_count       AS customer_claim_count,
        v_days_since_start  AS days_since_policy_start,
        v_risk_score        AS risk_score,
        v_recommended       AS recommended_action;
END //

DELIMITER ;
