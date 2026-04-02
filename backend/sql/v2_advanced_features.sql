-- ============================================================
-- EnsureVault — V2 Advanced Database Features
-- ============================================================

USE ensurevault;

-- 1. Company Reserve Table
CREATE TABLE IF NOT EXISTS company_reserve (
    id              INT PRIMARY KEY DEFAULT 1,
    balance         DECIMAL(16,2) NOT NULL DEFAULT 10000000.00, -- Default 10M
    last_updated    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize balance if empty
INSERT IGNORE INTO company_reserve (id, balance) VALUES (1, 10000000.00);

-- 2. Commission Ledger (Tracking Agent Earnings)
CREATE TABLE IF NOT EXISTS commission_ledger (
    entry_id        INT AUTO_INCREMENT PRIMARY KEY,
    agent_id        INT NOT NULL,
    policy_id       INT NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    earned_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agent(agent_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES policy(policy_id) ON DELETE CASCADE
);

-- 3. Agent Leaderboard View
CREATE OR REPLACE VIEW v_agent_leaderboard AS
SELECT 
    a.agent_id,
    a.name as agent_name,
    a.region,
    COUNT(p.policy_id) as total_policies_sold,
    COALESCE(SUM(p.premium_amount), 0) as total_premium_value,
    COALESCE(SUM(c.amount), 0) as total_commission_earned
FROM agent a
LEFT JOIN policy p ON a.agent_id = p.agent_id
LEFT JOIN commission_ledger c ON a.agent_id = c.agent_id
GROUP BY a.agent_id, a.name, a.region
ORDER BY total_premium_value DESC;

-- ============================================================
-- 4. Commission Trigger
-- ============================================================
-- Purpose: Automatically calculate and record agent commissions when a payment succeeds
-- 
-- Trigger Event: AFTER UPDATE ON payment table
-- Trigger Timing: Fires after a payment record is modified
-- 
-- Logic Flow:
-- 1. Detects when a payment status changes from any state to 'Success'
--    (Prevents duplicate commission entries for already-successful payments)
-- 2. Retrieves the agent_id who sold the policy from the policy table
-- 3. Looks up the agent's commission_rate percentage from the agent table
-- 4. Calculates commission: payment_amount × (commission_rate / 100)
--    Example: $1000 payment × 5% = $50 commission
-- 5. Inserts a record into commission_ledger with:
--    - agent_id: Which agent earned this commission
--    - policy_id: Which policy generated this commission
--    - amount: Calculated commission value
--    - earned_at: Auto-timestamped to current time
-- 
-- Business Rule: Agents earn commission only on successful premium payments
-- This ensures agents are credited immediately when customers pay their premiums
-- ============================================================

DROP TRIGGER IF EXISTS trg_calculate_commission;

DELIMITER $$

CREATE TRIGGER trg_calculate_commission
AFTER UPDATE ON payment
FOR EACH ROW
BEGIN
    DECLARE v_agent_id INT;
    DECLARE v_commission_rate DECIMAL(5,2);
    DECLARE v_commission_amount DECIMAL(12,2);

    -- Only fire when a payment transitions to 'Success'
    IF NEW.status = 'Success' AND OLD.status != 'Success' THEN
        -- Link back to the agent who sold the policy
        SELECT agent_id INTO v_agent_id FROM policy WHERE policy_id = NEW.policy_id;
        SELECT commission_rate INTO v_commission_rate FROM agent WHERE agent_id = v_agent_id;

        -- Calculate: payment amount * commission rate%
        SET v_commission_amount = NEW.amount * (v_commission_rate / 100);

        -- Record the commission
        INSERT INTO commission_ledger (agent_id, policy_id, amount)
        VALUES (v_agent_id, NEW.policy_id, v_commission_amount);
    END IF;
END$$

DELIMITER ;
