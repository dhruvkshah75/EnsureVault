-- EnsureVault RBAC Evaluation Implementation

-- 1. DBA / Administrator User (All rights)
CREATE USER IF NOT EXISTS 'dba_admin'@'%' IDENTIFIED BY 'AdminPass123!';
GRANT ALL PRIVILEGES ON ensurevault.* TO 'dba_admin'@'%' WITH GRANT OPTION;

-- 2. View Only User (e.g. Data Analyst or Auditor)
CREATE USER IF NOT EXISTS 'data_analyst'@'%' IDENTIFIED BY 'ViewOnlyPass123!';
GRANT SELECT ON ensurevault.* TO 'data_analyst'@'%';

-- 3. View and Update User, No Create Right (e.g. Claims Processor)
CREATE USER IF NOT EXISTS 'claims_processor'@'%' IDENTIFIED BY 'ProcessPass123!';
GRANT SELECT ON ensurevault.* TO 'claims_processor'@'%';
-- Grant UPDATE only on specific operational tables where they need to make decisions
GRANT UPDATE ON ensurevault.claim TO 'claims_processor'@'%';

FLUSH PRIVILEGES;
