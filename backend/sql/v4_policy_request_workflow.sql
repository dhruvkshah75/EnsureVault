-- ============================================================
-- v4_policy_request_workflow.sql
-- Policy Request Approval Workflow
-- Enables customers to REQUEST policies and agents to APPROVE/REJECT
-- ============================================================

USE ensurevault;

-- --------------------------------------------------------
-- 1. POLICY_REQUEST Table
-- Tracks customer policy requests pending agent approval
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_request (
    request_id      INT           AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT           NOT NULL,
    agent_id        INT           NOT NULL,
    type_id         INT           NOT NULL,
    start_date      DATE          NOT NULL,
    end_date        DATE          NOT NULL,
    premium_amount  DECIMAL(12,2),
    status          ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    requested_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     DATETIME      DEFAULT NULL,
    reviewed_by     INT           DEFAULT NULL,  -- agent_id who reviewed
    rejection_reason VARCHAR(500)  DEFAULT NULL,
    
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agent(agent_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (type_id) REFERENCES policy_type(type_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES agent(agent_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    
    CHECK (end_date > start_date),
    CHECK (premium_amount IS NULL OR premium_amount > 0),
    
    INDEX idx_customer_status (customer_id, status),
    INDEX idx_agent_status (agent_id, status),
    INDEX idx_requested_at (requested_at)
);

-- --------------------------------------------------------
-- 2. Trigger: Auto-set agent_id on request creation
-- When customer requests, auto-link to their assigned agent
-- --------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_auto_set_agent_on_policy_request
BEFORE INSERT ON policy_request
FOR EACH ROW
BEGIN
    DECLARE customer_agent_id INT;
    
    -- Get agent_id from customer record
    SELECT agent_id INTO customer_agent_id
    FROM customer
    WHERE customer_id = NEW.customer_id;
    
    -- If no agent found, raise error
    IF customer_agent_id IS NULL THEN
        SIGNAL SQLSTATE '45003' 
        SET MESSAGE_TEXT = 'Customer has no assigned agent';
    END IF;
    
    -- Set NEW.agent_id to customer's agent
    SET NEW.agent_id = customer_agent_id;
END$$
DELIMITER ;

-- --------------------------------------------------------
-- 3. Trigger: Enforce KYC before policy request
-- Prevent requests from unverified customers
-- --------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_enforce_kyc_before_policy_request
BEFORE INSERT ON policy_request
FOR EACH ROW
BEGIN
    DECLARE customer_kyc_status VARCHAR(20);
    
    -- Get KYC status
    SELECT kyc_status INTO customer_kyc_status
    FROM customer
    WHERE customer_id = NEW.customer_id;
    
    -- Block if not Verified
    IF customer_kyc_status != 'Verified' THEN
        SIGNAL SQLSTATE '45001' 
        SET MESSAGE_TEXT = 'User has not completed KYC verification';
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------
-- 4. Trigger: Auto-calculate premium on request if not provided
-- Uses same calculation as policy creation
-- --------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_calculate_premium_on_request
BEFORE INSERT ON policy_request
FOR EACH ROW
BEGIN
    IF NEW.premium_amount IS NULL THEN
        -- Call calculate_premium stored procedure
        CALL calculate_premium(NEW.customer_id, NEW.type_id);
    END IF;
END$$
DELIMITER ;

-- --------------------------------------------------------
-- 5. Log Table (optional): Track approval workflow history
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS policy_request_log (
    log_id          INT           AUTO_INCREMENT PRIMARY KEY,
    request_id      INT           NOT NULL,
    action          ENUM('Created','Approved','Rejected') NOT NULL,
    performed_by    INT,  -- NULL for system, agent_id for manual
    timestamp       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes           VARCHAR(500),
    
    FOREIGN KEY (request_id) REFERENCES policy_request(request_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    
    INDEX idx_request (request_id),
    INDEX idx_timestamp (timestamp)
);

-- --------------------------------------------------------
-- 6. Helper Stored Procedure: Approve Request and Create Policy
-- When agent approves, auto-creates policy record
-- --------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE approve_policy_request(
    IN p_request_id INT,
    IN p_reviewed_by INT
)
BEGIN
    DECLARE p_customer_id INT;
    DECLARE p_agent_id INT;
    DECLARE p_type_id INT;
    DECLARE p_start_date DATE;
    DECLARE p_end_date DATE;
    DECLARE p_premium_amount DECIMAL(12,2);
    DECLARE new_policy_id INT;
    
    START TRANSACTION;
    
    -- Fetch request details
    SELECT customer_id, agent_id, type_id, start_date, end_date, premium_amount
    INTO p_customer_id, p_agent_id, p_type_id, p_start_date, p_end_date, p_premium_amount
    FROM policy_request
    WHERE request_id = p_request_id AND status = 'Pending';
    
    IF p_customer_id IS NULL THEN
        SIGNAL SQLSTATE '45004' 
        SET MESSAGE_TEXT = 'Policy request not found or already processed';
    END IF;
    
    -- If premium not set, calculate it
    IF p_premium_amount IS NULL THEN
        CALL calculate_premium(p_customer_id, p_type_id);
    END IF;
    
    -- Create the actual policy
    INSERT INTO policy (customer_id, type_id, agent_id, start_date, end_date, status, premium_amount)
    VALUES (p_customer_id, p_type_id, p_agent_id, p_start_date, p_end_date, 'Active', COALESCE(p_premium_amount, 0));
    
    SET new_policy_id = LAST_INSERT_ID();
    
    -- Update request status to Approved
    UPDATE policy_request
    SET status = 'Approved', reviewed_at = NOW(), reviewed_by = p_reviewed_by
    WHERE request_id = p_request_id;
    
    -- Log the action
    INSERT INTO policy_request_log (request_id, action, performed_by, notes)
    VALUES (p_request_id, 'Approved', p_reviewed_by, CONCAT('Policy created: ', new_policy_id));
    
    COMMIT;
    
    -- Return the created policy ID
    SELECT new_policy_id AS created_policy_id;
END$$
DELIMITER ;

-- --------------------------------------------------------
-- 7. Helper Stored Procedure: Reject Request
-- When agent rejects, mark as rejected with reason
-- --------------------------------------------------------
DELIMITER $$
CREATE PROCEDURE reject_policy_request(
    IN p_request_id INT,
    IN p_reviewed_by INT,
    IN p_rejection_reason VARCHAR(500)
)
BEGIN
    START TRANSACTION;
    
    -- Verify request exists and is pending
    IF NOT EXISTS (SELECT 1 FROM policy_request WHERE request_id = p_request_id AND status = 'Pending') THEN
        SIGNAL SQLSTATE '45004' 
        SET MESSAGE_TEXT = 'Policy request not found or already processed';
    END IF;
    
    -- Update status to Rejected
    UPDATE policy_request
    SET status = 'Rejected', 
        reviewed_at = NOW(), 
        reviewed_by = p_reviewed_by,
        rejection_reason = p_rejection_reason
    WHERE request_id = p_request_id;
    
    -- Log the action
    INSERT INTO policy_request_log (request_id, action, performed_by, notes)
    VALUES (p_request_id, 'Rejected', p_reviewed_by, p_rejection_reason);
    
    COMMIT;
    
    SELECT 'Request rejected successfully' AS message;
END$$
DELIMITER ;

-- ========================================================
-- Verification Queries (for testing)
-- ========================================================

-- View pending requests for an agent
-- SELECT * FROM policy_request WHERE agent_id = ? AND status = 'Pending' ORDER BY requested_at DESC;

-- View request history with log
-- SELECT pr.*, prl.action, prl.timestamp FROM policy_request pr
-- LEFT JOIN policy_request_log prl ON pr.request_id = prl.request_id
-- WHERE pr.request_id = ? ORDER BY prl.timestamp DESC;

-- View approved requests that became policies
-- SELECT pr.*, p.policy_id FROM policy_request pr
-- JOIN policy p ON pr.customer_id = p.customer_id AND pr.type_id = p.type_id
-- WHERE pr.status = 'Approved';
