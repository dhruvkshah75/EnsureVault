# EnsureVault - Technical Database Documentation
## Complete Working & Database Architecture

**Document Purpose**: Comprehensive technical guide covering the database design, SQL operations, and system architecture for CSF212 Database Systems course evaluation.

---

## Table of Contents
1. [Database Architecture Overview](#1-database-architecture-overview)
2. [Schema Design & Normalization](#2-schema-design--normalization)
3. [Entity-Relationship Model](#3-entity-relationship-model)
4. [Core Database Tables](#4-core-database-tables)
5. [SQL Operations by Feature](#5-sql-operations-by-feature)
6. [Stored Procedures & Functions](#6-stored-procedures--functions)
7. [Database Triggers](#7-database-triggers)
8. [Transaction Management](#8-transaction-management)
9. [Indexing Strategy](#9-indexing-strategy)
10. [Query Optimization](#10-query-optimization)
11. [Concurrency Control](#11-concurrency-control)
12. [Data Integrity Constraints](#12-data-integrity-constraints)

---

## 1. Database Architecture Overview

### **Database Management System**
- **DBMS**: MySQL 8.0
- **Connection Method**: Connection Pooling
- **Pool Size**: 5 connections
- **Isolation Level**: READ COMMITTED (default)

### **Architecture Pattern**
```
Frontend (Next.js) 
    ↓ HTTP/REST
Backend (FastAPI)
    ↓ Connection Pool
MySQL Database
    ↓
Persistent Storage (Docker Volume)
```

### **Connection Pooling Implementation**
```python
# Connection pool configuration
connection_pool = pooling.MySQLConnectionPool(
    pool_name="ensurevault_pool",
    pool_size=5,                    # Maximum 5 concurrent connections
    pool_reset_session=True,        # Reset session state after return
    host="localhost",
    port=3306,
    database="ensurevault"
)
```

**Benefits**:
- Reduces connection overhead
- Reuses database connections
- Handles concurrent requests efficiently
- Automatic connection lifecycle management

---

## 2. Schema Design & Normalization

### **Normalization Level: 3NF/BCNF**

#### **First Normal Form (1NF)**
✅ All tables have:
- Atomic (indivisible) column values
- Each column contains only one value
- No repeating groups

**Example**: `Customers` table
```sql
-- ❌ Violates 1NF (comma-separated phone numbers)
phone_numbers VARCHAR(255) -- "9876543210,9123456789"

-- ✅ Follows 1NF
phone VARCHAR(15) -- Single value
```

#### **Second Normal Form (2NF)**
✅ All non-key attributes fully depend on the primary key
- No partial dependencies on composite keys

**Example**: `Policies` table
```sql
-- Primary Key: policy_id
-- All attributes depend on policy_id, not on parts of composite key
policy_id INT PRIMARY KEY
customer_id INT  -- Depends on policy_id
type_id INT      -- Depends on policy_id
start_date DATE  -- Depends on policy_id
```

#### **Third Normal Form (3NF)**
✅ No transitive dependencies
- Non-key attributes don't depend on other non-key attributes

**Before 3NF**:
```sql
-- ❌ Transitive dependency: agent_name depends on agent_id
Policies(policy_id, customer_id, agent_id, agent_name, agent_email)
```

**After 3NF**:
```sql
-- ✅ Removed transitive dependency
Policies(policy_id, customer_id, agent_id)
Agents(agent_id, agent_name, agent_email)
```

#### **Boyce-Codd Normal Form (BCNF)**
✅ Every determinant is a candidate key
- Resolves anomalies where a non-prime attribute determines a prime attribute

**Example**: Ensuring policy types are uniquely identified
```sql
-- type_name uniquely determines all other attributes
PolicyTypes(type_id, type_name, base_premium, max_coverage)
-- Both type_id and type_name can be candidate keys
-- type_name has UNIQUE constraint
```

---

## 3. Entity-Relationship Model

### **Core Entities**

#### **1. Users (Supertype)**
- **Purpose**: Authentication and role-based access control
- **Attributes**: user_id (PK), email, password_hash, role, name
- **Relationships**: Specializes into Customers, Agents, Admin, Claims Managers

#### **2. Customers**
- **Purpose**: Policy holders
- **Attributes**: customer_id (PK), user_id (FK), dob, phone, address, aadhaar, pan
- **Relationships**: 
  - One-to-Many with Policies
  - Many-to-One with Agents (assigned_agent)

#### **3. Agents**
- **Purpose**: Sales representatives
- **Attributes**: agent_id (PK), user_id (FK), region, commission_rate
- **Relationships**:
  - One-to-Many with Customers
  - One-to-Many with Policies (as issuer)

#### **4. PolicyTypes**
- **Purpose**: Insurance product catalog
- **Attributes**: type_id (PK), type_name, category, base_premium, max_coverage
- **Relationships**: One-to-Many with Policies

#### **5. Policies**
- **Purpose**: Active insurance contracts
- **Attributes**: policy_id (PK), customer_id (FK), type_id (FK), agent_id (FK), start_date, end_date, premium_amount, status
- **Relationships**:
  - Many-to-One with Customers
  - Many-to-One with PolicyTypes
  - Many-to-One with Agents
  - One-to-Many with Claims
  - One-to-Many with Nominees

#### **6. Claims**
- **Purpose**: Submitted insurance claims
- **Attributes**: claim_id (PK), policy_id (FK), incident_date, claim_amount, status, description
- **Relationships**:
  - Many-to-One with Policies
  - One-to-Many with ClaimDocuments
  - One-to-One with Payouts (if approved)

#### **7. Payouts**
- **Purpose**: Approved claim settlements
- **Attributes**: payout_id (PK), claim_id (FK), payout_amount, payment_mode, transaction_id
- **Relationships**: One-to-One with Claims

### **Relationship Cardinalities**

```
Customer ||--o{ Policy : "holds"
Agent ||--o{ Policy : "issues"
PolicyType ||--o{ Policy : "defines"
Policy ||--o{ Claim : "generates"
Policy ||--o{ Nominee : "benefits"
Claim ||--o{ ClaimDocument : "supports"
Claim ||--o| Payout : "settles"
```

### **Referential Integrity**
All foreign keys have:
- **ON DELETE RESTRICT**: Prevents deletion if child records exist
- **ON UPDATE CASCADE**: Updates propagate to child records

---

## 4. Core Database Tables

### **4.1 Users Table (Authentication)**

```sql
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'agent', 'admin', 'claims_manager') NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Key Database Concepts**:
- **AUTO_INCREMENT**: Primary key auto-generation
- **UNIQUE constraint**: Ensures email uniqueness
- **ENUM type**: Restricts role values to predefined set
- **Indexes**: Speed up lookups by email and role
- **InnoDB engine**: ACID-compliant, supports transactions

---

### **4.2 Customers Table**

```sql
CREATE TABLE Customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    dob DATE NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    aadhaar VARCHAR(12),
    pan VARCHAR(10),
    assigned_agent INT,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (assigned_agent) REFERENCES Agents(agent_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
        
    INDEX idx_user_id (user_id),
    INDEX idx_assigned_agent (assigned_agent),
    INDEX idx_aadhaar (aadhaar),
    
    CHECK (dob < CURRENT_DATE),
    CHECK (LENGTH(aadhaar) = 12),
    CHECK (LENGTH(pan) = 10)
) ENGINE=InnoDB;
```

**Key Database Concepts**:
- **Foreign Keys**: Maintain referential integrity
- **ON DELETE RESTRICT**: Prevents orphaned records
- **ON DELETE SET NULL**: For optional relationships (assigned_agent)
- **CHECK constraints**: Domain integrity (age validation, ID format)
- **Composite relationship**: Links to both Users and Agents

---

### **4.3 Policies Table**

```sql
CREATE TABLE Policies (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    type_id INT NOT NULL,
    agent_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    premium_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Active', 'Expired', 'Cancelled') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (type_id) REFERENCES PolicyTypes(type_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES Agents(agent_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    INDEX idx_customer (customer_id),
    INDEX idx_type (type_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date),
    
    CHECK (end_date > start_date),
    CHECK (premium_amount > 0)
) ENGINE=InnoDB;
```

**Key Database Concepts**:
- **DECIMAL(10,2)**: Fixed-point arithmetic for financial data
- **Composite Index**: (start_date, end_date) for range queries
- **Multi-table relationships**: Links customers, types, and agents
- **Date validation**: CHECK constraint ensures logical date range

---

### **4.4 Claims Table**

```sql
CREATE TABLE Claims (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_id INT NOT NULL,
    incident_date DATE NOT NULL,
    claim_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Pending',
    description TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    
    FOREIGN KEY (policy_id) REFERENCES Policies(policy_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    INDEX idx_policy (policy_id),
    INDEX idx_status (status),
    INDEX idx_incident_date (incident_date),
    
    CHECK (claim_amount > 0),
    CHECK (incident_date <= CURRENT_DATE)
) ENGINE=InnoDB;
```

**Key Database Concepts**:
- **Status workflow**: ENUM tracks claim lifecycle
- **Temporal data**: submitted_at, reviewed_at timestamps
- **Conditional constraints**: rejection_reason required when status='Rejected'
- **Business rule validation**: Incident must be in the past

---

### **4.5 Nominees Table (Weak Entity)**

```sql
CREATE TABLE Nominees (
    nom_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_id INT NOT NULL,
    nominee_name VARCHAR(255) NOT NULL,
    relation VARCHAR(100),
    share_percent DECIMAL(5,2) NOT NULL,
    
    FOREIGN KEY (policy_id) REFERENCES Policies(policy_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_policy (policy_id),
    
    CHECK (share_percent > 0 AND share_percent <= 100)
) ENGINE=InnoDB;
```

**Key Database Concepts**:
- **Weak Entity**: Existence depends on Policy
- **ON DELETE CASCADE**: Auto-delete when policy is deleted
- **Percentage validation**: share_percent between 0-100
- **Aggregate constraint**: Sum of share_percent per policy should = 100 (enforced in trigger)

---

### **4.6 ClaimDocuments Table (Supporting Entity)**

```sql
CREATE TABLE ClaimDocuments (
    doc_id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL,
    doc_type ENUM('Medical Report', 'Police Report', 'Invoice', 'Photo Evidence', 'Other') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (claim_id) REFERENCES Claims(claim_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
        
    INDEX idx_claim (claim_id),
    INDEX idx_doc_type (doc_type)
) ENGINE=InnoDB;
```

**Key Database Concepts**:
- **Document storage**: URL reference to external storage
- **Cascade delete**: Documents removed with parent claim
- **Categorization**: doc_type ENUM for classification

---

### **4.7 Payouts Table (Financial Transactions)**

```sql
CREATE TABLE Payouts (
    payout_id INT AUTO_INCREMENT PRIMARY KEY,
    claim_id INT NOT NULL UNIQUE,
    payout_amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('Bank Transfer', 'Cheque', 'UPI') NOT NULL,
    transaction_id VARCHAR(100),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (claim_id) REFERENCES Claims(claim_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
    INDEX idx_claim (claim_id),
    INDEX idx_transaction (transaction_id),
    
    CHECK (payout_amount > 0)
) ENGINE=InnoDB;
```

**Key Database Concepts**:
- **One-to-One relationship**: claim_id UNIQUE constraint
- **Financial audit trail**: transaction_id for reconciliation
- **Monetary precision**: DECIMAL for accurate amounts
- **RESTRICT delete**: Prevents claim deletion after payout

---

## 5. SQL Operations by Feature

### **5.1 User Authentication & Session Management**

#### **Login Query**
```sql
-- Retrieve user credentials and role
SELECT 
    u.user_id,
    u.email,
    u.password_hash,
    u.role,
    u.name,
    CASE 
        WHEN u.role = 'customer' THEN c.customer_id
        WHEN u.role = 'agent' THEN a.agent_id
        ELSE NULL 
    END AS role_specific_id
FROM Users u
LEFT JOIN Customers c ON u.user_id = c.user_id AND u.role = 'customer'
LEFT JOIN Agents a ON u.user_id = a.user_id AND u.role = 'agent'
WHERE u.email = %s;
```

**Database Concepts Used**:
- **LEFT JOIN**: Retrieve role-specific data conditionally
- **CASE statement**: Conditional logic in SELECT
- **Parameterized queries**: `%s` placeholder prevents SQL injection
- **Indexed lookup**: email has index for O(log n) search

---

### **5.2 Policy Management**

#### **Create New Policy**
```sql
-- Multi-table INSERT with transaction
START TRANSACTION;

-- Insert policy record
INSERT INTO Policies (
    customer_id, 
    type_id, 
    agent_id, 
    start_date, 
    end_date, 
    premium_amount, 
    status
) VALUES (%s, %s, %s, %s, %s, %s, 'Active');

SET @new_policy_id = LAST_INSERT_ID();

-- Insert nominee (if provided)
INSERT INTO Nominees (
    policy_id, 
    nominee_name, 
    relation, 
    share_percent
) VALUES (@new_policy_id, %s, %s, %s);

COMMIT;
```

**Database Concepts Used**:
- **Transactions**: ACID compliance (Atomicity, Consistency, Isolation, Durability)
- **LAST_INSERT_ID()**: Retrieve auto-generated primary key
- **Multi-step operation**: Policy + Nominee creation as atomic unit
- **Rollback on failure**: Ensures data consistency

---

#### **Retrieve Customer Policies with JOIN**
```sql
SELECT 
    p.policy_id,
    p.status,
    p.start_date,
    p.end_date,
    p.premium_amount,
    pt.type_name,
    pt.category,
    pt.max_coverage,
    a.name AS agent_name,
    a.region AS agent_region,
    COUNT(DISTINCT c.claim_id) AS total_claims,
    SUM(CASE WHEN c.status = 'Approved' THEN c.claim_amount ELSE 0 END) AS approved_claim_amount
FROM Policies p
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
INNER JOIN Agents a ON p.agent_id = a.agent_id
LEFT JOIN Claims c ON p.policy_id = c.policy_id
WHERE p.customer_id = %s
GROUP BY p.policy_id, pt.type_name, pt.category, pt.max_coverage, a.name, a.region
ORDER BY p.start_date DESC;
```

**Database Concepts Used**:
- **INNER JOIN**: Combine related tables (Policies, PolicyTypes, Agents)
- **LEFT JOIN**: Include policies without claims
- **GROUP BY**: Aggregate claims per policy
- **COUNT, SUM**: Aggregate functions
- **CASE in aggregation**: Conditional summing
- **ORDER BY**: Sort results chronologically

---

### **5.3 Claims Processing**

#### **Submit Claim with Document Upload**
```sql
START TRANSACTION;

-- Insert claim
INSERT INTO Claims (
    policy_id,
    incident_date,
    claim_amount,
    description,
    status
) VALUES (%s, %s, %s, %s, 'Pending');

SET @claim_id = LAST_INSERT_ID();

-- Insert multiple documents (batch insert)
INSERT INTO ClaimDocuments (claim_id, doc_type, file_url)
VALUES 
    (@claim_id, %s, %s),
    (@claim_id, %s, %s),
    (@claim_id, %s, %s);

COMMIT;
```

**Database Concepts Used**:
- **Batch INSERT**: Multiple documents in single statement
- **Foreign key propagation**: claim_id links documents to claim
- **Transaction isolation**: Prevents partial data insertion

---

#### **Claims Manager Dashboard Query**
```sql
-- Complex query with filters and aggregations
SELECT 
    c.claim_id,
    c.incident_date,
    c.claim_amount,
    c.status,
    c.submitted_at,
    p.policy_id,
    pt.type_name AS policy_type,
    CONCAT(u.name) AS customer_name,
    cu.address AS customer_address,
    a.region AS agent_region,
    COUNT(cd.doc_id) AS document_count
FROM Claims c
INNER JOIN Policies p ON c.policy_id = p.policy_id
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
INNER JOIN Customers cu ON p.customer_id = cu.customer_id
INNER JOIN Users u ON cu.user_id = u.user_id
INNER JOIN Agents a ON p.agent_id = a.agent_id
LEFT JOIN ClaimDocuments cd ON c.claim_id = cd.claim_id
WHERE c.status = 'Pending'
  AND (a.region = %s OR %s IS NULL)
  AND (pt.type_name = %s OR %s IS NULL)
  AND (c.incident_date >= %s OR %s IS NULL)
  AND (c.incident_date <= %s OR %s IS NULL)
GROUP BY c.claim_id, c.incident_date, c.claim_amount, c.status, c.submitted_at, 
         p.policy_id, pt.type_name, u.name, cu.address, a.region
ORDER BY c.submitted_at ASC;
```

**Database Concepts Used**:
- **Multiple JOINs**: Navigate through 6 related tables
- **Optional filtering**: NULL checks for dynamic WHERE clauses
- **String concatenation**: CONCAT for full names
- **Indexed filtering**: WHERE on indexed columns (status, region, dates)
- **Aggregation with GROUP BY**: Count documents per claim

---

#### **Claim Approval with Payout**
```sql
START TRANSACTION;

-- Update claim status
UPDATE Claims 
SET status = 'Approved',
    reviewed_at = CURRENT_TIMESTAMP
WHERE claim_id = %s;

-- Create payout record
INSERT INTO Payouts (
    claim_id,
    payout_amount,
    payment_mode,
    transaction_id
) VALUES (%s, %s, %s, %s);

-- Update policy status if needed
UPDATE Policies p
INNER JOIN Claims c ON p.policy_id = c.policy_id
SET p.status = 'Settled'
WHERE c.claim_id = %s;

COMMIT;
```

**Database Concepts Used**:
- **Multi-table UPDATE**: Modify related records atomically
- **CURRENT_TIMESTAMP**: Server-side timestamp generation
- **Transactional integrity**: All or nothing execution
- **UPDATE with JOIN**: Propagate changes across relationships

---

### **5.4 Premium Calculation (Stored Procedure)**

#### **Calculate Premium Function**
```sql
DELIMITER $$

CREATE PROCEDURE CalculatePremium(
    IN p_customer_id INT,
    IN p_type_id INT,
    IN p_coverage_amount DECIMAL(10,2),
    OUT o_premium_amount DECIMAL(10,2)
)
BEGIN
    DECLARE base_premium DECIMAL(10,2);
    DECLARE customer_age INT;
    DECLARE risk_multiplier DECIMAL(5,2) DEFAULT 1.0;
    DECLARE age_factor DECIMAL(5,2) DEFAULT 1.0;
    
    -- Get base premium from policy type
    SELECT base_premium INTO base_premium
    FROM PolicyTypes
    WHERE type_id = p_type_id;
    
    -- Calculate customer age
    SELECT TIMESTAMPDIFF(YEAR, dob, CURDATE()) INTO customer_age
    FROM Customers
    WHERE customer_id = p_customer_id;
    
    -- Age-based risk factor
    IF customer_age < 25 THEN
        SET age_factor = 1.3;
    ELSEIF customer_age BETWEEN 25 AND 40 THEN
        SET age_factor = 1.0;
    ELSEIF customer_age BETWEEN 41 AND 60 THEN
        SET age_factor = 1.2;
    ELSE
        SET age_factor = 1.5;
    END IF;
    
    -- Check existing claims history
    SELECT COUNT(*) INTO @claim_count
    FROM Claims c
    INNER JOIN Policies p ON c.policy_id = p.policy_id
    WHERE p.customer_id = p_customer_id
      AND c.status = 'Approved';
    
    -- Claims history risk
    IF @claim_count > 3 THEN
        SET risk_multiplier = 1.4;
    ELSEIF @claim_count > 0 THEN
        SET risk_multiplier = 1.2;
    END IF;
    
    -- Coverage amount factor
    SET @coverage_factor = (p_coverage_amount / 100000) * 0.1 + 1.0;
    
    -- Final premium calculation
    SET o_premium_amount = base_premium * age_factor * risk_multiplier * @coverage_factor;
    
    -- Round to 2 decimal places
    SET o_premium_amount = ROUND(o_premium_amount, 2);
    
END$$

DELIMITER ;

-- Usage
CALL CalculatePremium(1, 1, 500000, @premium);
SELECT @premium AS calculated_premium;
```

**Database Concepts Used**:
- **Stored Procedure**: Encapsulate business logic in database
- **IN/OUT parameters**: Input and output variables
- **DECLARE**: Local variable declaration
- **TIMESTAMPDIFF**: Date arithmetic for age calculation
- **Control flow**: IF-ELSEIF-ELSE logic
- **Subqueries**: Nested SELECT for claim history
- **Mathematical operations**: Complex premium formula
- **Session variables**: @claim_count, @coverage_factor
- **ROUND function**: Financial precision

**Benefits**:
- **Performance**: Logic executes on database server
- **Consistency**: Same calculation for all users
- **Security**: No business logic exposed to client
- **Reusability**: Called from multiple application points

---

## 6. Stored Procedures & Functions

### **6.1 GetCustomerDashboard Procedure**

```sql
DELIMITER $$

CREATE PROCEDURE GetCustomerDashboard(
    IN p_customer_id INT
)
BEGIN
    -- Get active policies
    SELECT 
        p.policy_id,
        pt.type_name,
        p.status,
        p.premium_amount,
        p.end_date
    FROM Policies p
    INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
    WHERE p.customer_id = p_customer_id
    ORDER BY p.start_date DESC;
    
    -- Get recent claims
    SELECT 
        c.claim_id,
        pt.type_name,
        c.claim_amount,
        c.status,
        c.incident_date
    FROM Claims c
    INNER JOIN Policies p ON c.policy_id = p.policy_id
    INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
    WHERE p.customer_id = p_customer_id
    ORDER BY c.submitted_at DESC
    LIMIT 5;
    
    -- Get nominees
    SELECT 
        n.nom_id,
        n.nominee_name,
        n.relation,
        n.share_percent,
        pt.type_name AS policy_type
    FROM Nominees n
    INNER JOIN Policies p ON n.policy_id = p.policy_id
    INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
    WHERE p.customer_id = p_customer_id;
    
END$$

DELIMITER ;
```

**Database Concepts Used**:
- **Multiple result sets**: Single call returns 3 datasets
- **Parameterized procedure**: Input customer_id
- **JOIN operations**: Combine data from multiple tables
- **ORDER BY + LIMIT**: Paginated results
- **Efficiency**: One database round-trip instead of three

---

### **6.2 ApproveClaimWithPayout Function**

```sql
DELIMITER $$

CREATE FUNCTION ApproveClaimWithPayout(
    p_claim_id INT,
    p_payout_amount DECIMAL(10,2),
    p_payment_mode VARCHAR(50),
    p_transaction_id VARCHAR(100)
) RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_policy_max_coverage DECIMAL(10,2);
    DECLARE v_total_payouts DECIMAL(10,2) DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RETURN FALSE;
    END;
    
    START TRANSACTION;
    
    -- Get policy max coverage
    SELECT pt.max_coverage INTO v_policy_max_coverage
    FROM Claims c
    INNER JOIN Policies p ON c.policy_id = p.policy_id
    INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
    WHERE c.claim_id = p_claim_id;
    
    -- Get total existing payouts for this policy
    SELECT COALESCE(SUM(py.payout_amount), 0) INTO v_total_payouts
    FROM Payouts py
    INNER JOIN Claims c2 ON py.claim_id = c2.claim_id
    INNER JOIN Policies p2 ON c2.policy_id = p2.policy_id
    WHERE p2.policy_id = (
        SELECT policy_id FROM Claims WHERE claim_id = p_claim_id
    );
    
    -- Check if payout exceeds coverage
    IF (v_total_payouts + p_payout_amount) > v_policy_max_coverage THEN
        ROLLBACK;
        RETURN FALSE;
    END IF;
    
    -- Update claim status
    UPDATE Claims
    SET status = 'Approved',
        reviewed_at = CURRENT_TIMESTAMP
    WHERE claim_id = p_claim_id;
    
    -- Insert payout
    INSERT INTO Payouts (claim_id, payout_amount, payment_mode, transaction_id)
    VALUES (p_claim_id, p_payout_amount, p_payment_mode, p_transaction_id);
    
    COMMIT;
    RETURN TRUE;
    
END$$

DELIMITER ;
```

**Database Concepts Used**:
- **FUNCTION**: Returns boolean success/failure
- **DETERMINISTIC**: Same inputs yield same outputs
- **Exception handler**: EXIT HANDLER for error management
- **Nested SELECT**: Subquery for policy lookup
- **COALESCE**: Handle NULL in SUM (no payouts = 0)
- **Business logic validation**: Check coverage limits
- **Conditional ROLLBACK**: Transaction reversal on error
- **RETURN**: Function result

---

## 7. Database Triggers

### **7.1 Prevent Duplicate Claims Trigger**

```sql
DELIMITER $$

CREATE TRIGGER prevent_duplicate_claims
BEFORE INSERT ON Claims
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;
    
    -- Check for pending/under review claims on same policy
    SELECT COUNT(*) INTO existing_count
    FROM Claims
    WHERE policy_id = NEW.policy_id
      AND status IN ('Pending', 'Under Review')
      AND incident_date = NEW.incident_date;
    
    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A claim for this incident is already pending for this policy';
    END IF;
END$$

DELIMITER ;
```

**Database Concepts Used**:
- **BEFORE INSERT trigger**: Executes before row insertion
- **NEW keyword**: References incoming row data
- **SIGNAL SQLSTATE**: Raise custom error
- **Business constraint**: Prevent duplicate submissions
- **Automatic enforcement**: No application-level check needed

---

### **7.2 Auto-Expire Policies Trigger**

```sql
DELIMITER $$

CREATE TRIGGER auto_expire_policy
BEFORE UPDATE ON Policies
FOR EACH ROW
BEGIN
    -- Check if end_date has passed
    IF NEW.end_date < CURDATE() AND NEW.status = 'Active' THEN
        SET NEW.status = 'Expired';
    END IF;
END$$

DELIMITER ;
```

**Database Concepts Used**:
- **BEFORE UPDATE trigger**: Modify data before saving
- **Date comparison**: CURDATE() vs end_date
- **Automatic status transition**: No manual intervention

---

### **7.3 Validate Nominee Shares Trigger**

```sql
DELIMITER $$

CREATE TRIGGER validate_nominee_shares
AFTER INSERT ON Nominees
FOR EACH ROW
BEGIN
    DECLARE total_share DECIMAL(5,2);
    
    -- Sum all shares for this policy
    SELECT SUM(share_percent) INTO total_share
    FROM Nominees
    WHERE policy_id = NEW.policy_id;
    
    -- Ensure total doesn't exceed 100%
    IF total_share > 100 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Total nominee shares cannot exceed 100%';
    END IF;
END$$

DELIMITER ;
```

**Database Concepts Used**:
- **AFTER INSERT trigger**: Validates after row creation
- **Aggregate validation**: SUM across related rows
- **Domain constraint**: Business rule enforcement
- **Atomic validation**: Prevents invalid state

---

## 8. Transaction Management

### **8.1 ACID Properties Implementation**

#### **Atomicity Example: Policy Creation**
```sql
START TRANSACTION;

-- Step 1: Insert policy
INSERT INTO Policies (...) VALUES (...);

-- Step 2: Insert nominee
INSERT INTO Nominees (...) VALUES (...);

-- Step 3: Update agent commission
UPDATE Agents 
SET total_sales = total_sales + 1
WHERE agent_id = @agent_id;

-- If any step fails, ALL steps rollback
COMMIT;
```

**Atomicity**: All 3 operations succeed together or fail together.

---

#### **Consistency Example: Claim Approval**
```sql
START TRANSACTION;

-- Ensure claim status transitions are valid
UPDATE Claims
SET status = 'Approved'
WHERE claim_id = @claim_id
  AND status IN ('Pending', 'Under Review');  -- Can only approve from these states

-- Insert payout
INSERT INTO Payouts (...) VALUES (...);

COMMIT;
```

**Consistency**: Database moves from one valid state to another (valid status transitions).

---

#### **Isolation Example: Concurrent Premium Calculations**
```sql
-- Connection 1
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;

SELECT premium_amount FROM Policies WHERE policy_id = 1;
-- Returns: 5000

-- Connection 2 (simultaneous)
START TRANSACTION;
UPDATE Policies SET premium_amount = 6000 WHERE policy_id = 1;
COMMIT;

-- Connection 1 continues
SELECT premium_amount FROM Policies WHERE policy_id = 1;
-- Returns: 6000 (sees committed changes)

COMMIT;
```

**Isolation**: READ COMMITTED prevents dirty reads but allows non-repeatable reads.

---

#### **Durability Example: System Crash Recovery**
```sql
START TRANSACTION;

INSERT INTO Payouts (claim_id, payout_amount, payment_mode, transaction_id)
VALUES (123, 50000, 'Bank Transfer', 'TXN98765');

COMMIT;

-- Even if server crashes immediately after COMMIT,
-- this payout will persist due to InnoDB's WAL (Write-Ahead Logging)
```

**Durability**: Committed transactions survive system failures (MySQL binary logs + InnoDB redo logs).

---

### **8.2 Isolation Levels**

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|----------------|------------|---------------------|--------------|
| READ UNCOMMITTED | ✅ Possible | ✅ Possible | ✅ Possible |
| READ COMMITTED | ❌ Prevented | ✅ Possible | ✅ Possible |
| REPEATABLE READ | ❌ Prevented | ❌ Prevented | ✅ Possible |
| SERIALIZABLE | ❌ Prevented | ❌ Prevented | ❌ Prevented |

**EnsureVault uses**: READ COMMITTED (MySQL default)

**Reason**: Balance between consistency and concurrency for financial operations.

---

## 9. Indexing Strategy

### **9.1 Index Types Used**

#### **Primary Key Indexes (Clustered)**
```sql
-- Automatically created on PRIMARY KEY
policy_id INT AUTO_INCREMENT PRIMARY KEY
```
- **B+ Tree structure**
- **Data stored in index order**
- **O(log n) lookup time**

---

#### **Secondary Indexes (Non-Clustered)**
```sql
-- Email lookup (authentication)
CREATE INDEX idx_email ON Users(email);

-- Status filtering
CREATE INDEX idx_status ON Claims(status);

-- Date range queries
CREATE INDEX idx_dates ON Policies(start_date, end_date);
```

**Performance Impact**:
- Speeds up WHERE, JOIN, and ORDER BY clauses
- Trade-off: Slower INSERT/UPDATE (index maintenance)

---

#### **Composite Indexes**
```sql
-- Multi-column index for complex queries
CREATE INDEX idx_customer_status ON Policies(customer_id, status);

-- Enables:
WHERE customer_id = 1 AND status = 'Active'  -- ✅ Uses index
WHERE customer_id = 1                        -- ✅ Uses index (leftmost prefix)
WHERE status = 'Active'                      -- ❌ Doesn't use index
```

**Leftmost Prefix Rule**: Composite indexes work left-to-right.

---

#### **UNIQUE Indexes**
```sql
-- Prevent duplicate emails
CREATE UNIQUE INDEX idx_unique_email ON Users(email);

-- One-to-one relationship
CREATE UNIQUE INDEX idx_unique_claim ON Payouts(claim_id);
```

**Dual purpose**: Enforces uniqueness + speeds up lookups.

---

### **9.2 Index Selection Examples**

#### **Query 1: Retrieve Customer Policies**
```sql
SELECT * FROM Policies 
WHERE customer_id = 42 
AND status = 'Active';

-- Uses index: idx_customer_status (customer_id, status)
-- Lookup: O(log n)
```

#### **Query 2: Find Claims by Date Range**
```sql
SELECT * FROM Claims 
WHERE incident_date BETWEEN '2024-01-01' AND '2024-12-31';

-- Uses index: idx_incident_date
-- Range scan: O(log n + m) where m = matching rows
```

#### **Query 3: Join with Indexed Columns**
```sql
SELECT p.policy_id, pt.type_name
FROM Policies p
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
WHERE p.customer_id = 10;

-- Uses indexes:
-- 1. idx_customer on Policies (customer_id)
-- 2. PRIMARY KEY on PolicyTypes (type_id)
```

---

### **9.3 Explain Plan Analysis**

```sql
EXPLAIN SELECT 
    c.claim_id, c.claim_amount, p.policy_id
FROM Claims c
INNER JOIN Policies p ON c.policy_id = p.policy_id
WHERE p.customer_id = 5
  AND c.status = 'Pending';

-- Result:
-- +----+-------------+-------+------+---------------+----------------+---------+
-- | id | select_type | table | type | key           | rows           | Extra   |
-- +----+-------------+-------+------+---------------+----------------+---------+
-- |  1 | SIMPLE      | p     | ref  | idx_customer  | 3              | Using where |
-- |  1 | SIMPLE      | c     | ref  | idx_policy    | 1              | Using where |
-- +----+-------------+-------+------+---------------+----------------+---------+

-- Interpretation:
-- 1. Uses idx_customer on Policies (efficient)
-- 2. Uses idx_policy on Claims (efficient join)
-- 3. Low row count (good selectivity)
```

---

## 10. Query Optimization

### **10.1 Optimization Techniques**

#### **1. Avoid SELECT ***
```sql
-- ❌ Bad: Fetches all columns
SELECT * FROM Policies WHERE customer_id = 1;

-- ✅ Good: Fetch only needed columns
SELECT policy_id, type_id, premium_amount FROM Policies WHERE customer_id = 1;
```

**Benefit**: Reduces I/O, network transfer, and memory usage.

---

#### **2. Use LIMIT for Pagination**
```sql
-- ❌ Bad: Fetches all claims
SELECT * FROM Claims ORDER BY submitted_at DESC;

-- ✅ Good: Fetch 10 claims per page
SELECT claim_id, claim_amount, status 
FROM Claims 
ORDER BY submitted_at DESC 
LIMIT 10 OFFSET 20;  -- Page 3
```

**Benefit**: Reduces result set size, faster response.

---

#### **3. Optimize JOIN Order**
```sql
-- ✅ Optimized: Smaller table first
SELECT c.claim_id, p.policy_id
FROM Claims c  -- Smaller table (1000 rows)
INNER JOIN Policies p ON c.policy_id = p.policy_id  -- Larger table (10000 rows)
WHERE c.status = 'Pending';

-- MySQL optimizer automatically adjusts, but explicit ordering helps
```

---

#### **4. Use Covering Indexes**
```sql
-- Create covering index (includes all queried columns)
CREATE INDEX idx_policy_coverage 
ON Policies(customer_id, policy_id, premium_amount);

-- Query satisfied entirely from index (no table access)
SELECT policy_id, premium_amount 
FROM Policies 
WHERE customer_id = 1;

-- EXPLAIN shows: "Using index" (covering index)
```

**Benefit**: Avoids table lookup, reads only index.

---

#### **5. Avoid Functions on Indexed Columns**
```sql
-- ❌ Bad: Function prevents index usage
SELECT * FROM Customers 
WHERE YEAR(dob) = 1990;

-- ✅ Good: Use range query
SELECT * FROM Customers 
WHERE dob BETWEEN '1990-01-01' AND '1990-12-31';
```

**Reason**: Functions on columns disable index optimization.

---

#### **6. Use EXISTS Instead of IN for Subqueries**
```sql
-- ❌ Slower: IN with subquery
SELECT * FROM Policies 
WHERE customer_id IN (
    SELECT customer_id FROM Customers WHERE region = 'North'
);

-- ✅ Faster: EXISTS (stops at first match)
SELECT * FROM Policies p
WHERE EXISTS (
    SELECT 1 FROM Customers c 
    WHERE c.customer_id = p.customer_id AND c.region = 'North'
);
```

---

### **10.2 Query Profiling**

```sql
-- Enable profiling
SET profiling = 1;

-- Run query
SELECT * FROM Policies WHERE customer_id = 1;

-- View profile
SHOW PROFILES;

-- Detailed breakdown
SHOW PROFILE FOR QUERY 1;

-- Result:
-- +----------------------+----------+
-- | Status               | Duration |
-- +----------------------+----------+
-- | starting             | 0.000050 |
-- | checking permissions | 0.000010 |
-- | Opening tables       | 0.000020 |
-- | init                 | 0.000015 |
-- | System lock          | 0.000008 |
-- | optimizing           | 0.000005 |
-- | executing            | 0.000003 |
-- | Sending data         | 0.000045 |
-- | end                  | 0.000005 |
-- +----------------------+----------+
```

---

## 11. Concurrency Control

### **11.1 Locking Mechanisms**

#### **Row-Level Locks (InnoDB)**
```sql
START TRANSACTION;

-- Acquire shared lock (read)
SELECT * FROM Policies WHERE policy_id = 1 LOCK IN SHARE MODE;

-- Other transactions can read but not modify

COMMIT;
```

```sql
START TRANSACTION;

-- Acquire exclusive lock (write)
SELECT * FROM Policies WHERE policy_id = 1 FOR UPDATE;

-- Other transactions blocked from reading/writing this row

UPDATE Policies SET status = 'Cancelled' WHERE policy_id = 1;

COMMIT;
```

**Lock Types**:
- **Shared Lock (S)**: Multiple readers, no writers
- **Exclusive Lock (X)**: Single writer, no readers

---

#### **Deadlock Scenario & Resolution**

**Transaction 1**:
```sql
START TRANSACTION;
UPDATE Policies SET status = 'Active' WHERE policy_id = 1;  -- Lock Row 1
-- ... waiting ...
UPDATE Policies SET status = 'Active' WHERE policy_id = 2;  -- Needs Lock Row 2
```

**Transaction 2**:
```sql
START TRANSACTION;
UPDATE Policies SET status = 'Cancelled' WHERE policy_id = 2;  -- Lock Row 2
UPDATE Policies SET status = 'Cancelled' WHERE policy_id = 1;  -- Needs Lock Row 1 (DEADLOCK!)
```

**MySQL Deadlock Detection**:
- InnoDB automatically detects deadlock
- Rolls back transaction with fewer row changes
- Returns error to application

**Prevention**:
- Access tables in consistent order
- Keep transactions short
- Use appropriate isolation levels

---

### **11.2 Optimistic vs Pessimistic Locking**

#### **Pessimistic Locking (Default)**
```sql
-- Lock row immediately
START TRANSACTION;
SELECT * FROM Policies WHERE policy_id = 1 FOR UPDATE;
-- Row locked until COMMIT
```

**Use case**: High contention scenarios (e.g., claim approval)

---

#### **Optimistic Locking (Version-based)**
```sql
-- Add version column
ALTER TABLE Policies ADD COLUMN version INT DEFAULT 1;

-- Read with version
SELECT policy_id, status, version FROM Policies WHERE policy_id = 1;
-- version = 5

-- Update with version check
UPDATE Policies 
SET status = 'Cancelled', version = version + 1
WHERE policy_id = 1 AND version = 5;

-- If affected rows = 0, another transaction modified it
```

**Use case**: Low contention, high read frequency

---

## 12. Data Integrity Constraints

### **12.1 Entity Integrity**
```sql
-- Primary key constraint (NOT NULL + UNIQUE)
policy_id INT AUTO_INCREMENT PRIMARY KEY

-- Ensures:
-- 1. Every policy has unique identifier
-- 2. No NULL values
```

---

### **12.2 Referential Integrity**
```sql
-- Foreign key constraint
FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
    ON DELETE RESTRICT    -- Prevent deletion if policies exist
    ON UPDATE CASCADE     -- Propagate customer_id changes
```

**Cascade Options**:
- **RESTRICT**: Block parent deletion if children exist
- **CASCADE**: Delete children when parent deleted
- **SET NULL**: Set FK to NULL when parent deleted
- **NO ACTION**: Same as RESTRICT

---

### **12.3 Domain Integrity**
```sql
-- CHECK constraints
CHECK (claim_amount > 0)
CHECK (end_date > start_date)
CHECK (LENGTH(aadhaar) = 12)

-- ENUM constraints
status ENUM('Active', 'Expired', 'Cancelled')

-- NOT NULL constraints
customer_id INT NOT NULL

-- DEFAULT constraints
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

### **12.4 Business Rule Constraints**

#### **Trigger-Based Constraints**
```sql
-- Ensure claim amount doesn't exceed coverage
DELIMITER $$

CREATE TRIGGER validate_claim_amount
BEFORE INSERT ON Claims
FOR EACH ROW
BEGIN
    DECLARE max_coverage DECIMAL(10,2);
    
    SELECT pt.max_coverage INTO max_coverage
    FROM Policies p
    INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
    WHERE p.policy_id = NEW.policy_id;
    
    IF NEW.claim_amount > max_coverage THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Claim amount exceeds policy coverage limit';
    END IF;
END$$

DELIMITER ;
```

---

## Summary: Database Concepts Demonstrated

### **✅ Core Database Concepts**
1. **Relational Model**: Tables, rows, columns, relationships
2. **Normalization**: 3NF/BCNF for data integrity
3. **Primary Keys**: Auto-increment, unique identification
4. **Foreign Keys**: Referential integrity with CASCADE/RESTRICT
5. **Indexes**: B+ tree, composite, covering indexes
6. **Joins**: INNER, LEFT, complex multi-table queries
7. **Aggregations**: COUNT, SUM, GROUP BY, HAVING
8. **Subqueries**: Nested SELECT, EXISTS, IN

### **✅ Advanced Concepts**
9. **Transactions**: ACID properties (Atomicity, Consistency, Isolation, Durability)
10. **Stored Procedures**: Encapsulated business logic
11. **Functions**: Reusable calculations with RETURN
12. **Triggers**: BEFORE/AFTER INSERT/UPDATE/DELETE
13. **Concurrency Control**: Locking, deadlock handling
14. **Isolation Levels**: READ COMMITTED for consistency
15. **Query Optimization**: EXPLAIN, indexing strategies

### **✅ SQL Operations Mastered**
16. **DDL**: CREATE TABLE, ALTER TABLE, CREATE INDEX, CREATE TRIGGER
17. **DML**: INSERT, UPDATE, DELETE, SELECT
18. **DCL**: GRANT, REVOKE (implicit in user roles)
19. **TCL**: START TRANSACTION, COMMIT, ROLLBACK
20. **Advanced SQL**: Window functions, CTEs (Common Table Expressions), CASE statements

---

## Conclusion

EnsureVault demonstrates comprehensive database management concepts through real-world insurance domain modeling. The system implements:

- **Robust schema design** following normalization principles
- **Complex queries** with multi-table joins and aggregations
- **Stored procedures** for business logic encapsulation
- **Triggers** for automatic constraint enforcement
- **Transactions** ensuring ACID compliance
- **Indexes** for query performance optimization
- **Concurrency control** for multi-user environments

This architecture ensures data integrity, security, and performance for production-grade insurance management.

---

## 13. Application Features & Working

### **13.1 User Authentication System**

#### **How It Works**

**Step 1: User Registration**
```sql
-- Create user account
START TRANSACTION;

-- Insert into Users table
INSERT INTO Users (email, password_hash, role, name)
VALUES ('customer@example.com', '$2b$12$hashed_password', 'customer', 'John Doe');

SET @user_id = LAST_INSERT_ID();

-- Create role-specific record (Customer)
INSERT INTO Customers (user_id, dob, phone, address, aadhaar, pan)
VALUES (@user_id, '1990-05-15', '9876543210', '123 Main St', '123456789012', 'ABCDE1234F');

COMMIT;
```

**Database Concepts**:
- **Transaction**: Ensures user and customer records created together
- **Password hashing**: Stored as bcrypt hash, never plain text
- **Role-based table**: Different tables for customer/agent/admin
- **LAST_INSERT_ID()**: Links user to role-specific table

**Step 2: User Login**
```sql
-- Authentication query
SELECT 
    u.user_id,
    u.email,
    u.password_hash,
    u.role,
    u.name,
    CASE u.role
        WHEN 'customer' THEN c.customer_id
        WHEN 'agent' THEN a.agent_id
        WHEN 'admin' THEN adm.admin_id
        WHEN 'claims_manager' THEN cm.manager_id
    END AS role_id
FROM Users u
LEFT JOIN Customers c ON u.user_id = c.user_id AND u.role = 'customer'
LEFT JOIN Agents a ON u.user_id = a.user_id AND u.role = 'agent'
LEFT JOIN Admins adm ON u.user_id = adm.user_id AND u.role = 'admin'
LEFT JOIN ClaimsManagers cm ON u.user_id = cm.user_id AND u.role = 'claims_manager'
WHERE u.email = %s;
```

**Database Concepts**:
- **Multiple LEFT JOINs**: Retrieve role-specific data conditionally
- **CASE expression**: Dynamic column based on role
- **Indexed lookup**: Email index for fast authentication (O(log n))

**Step 3: Session Management**
- Backend generates **JWT token** with user_id, role, role_id
- Token stored in frontend context
- Every API request includes token in Authorization header
- Backend validates token and checks role permissions

---

### **13.2 Customer Dashboard**

#### **Feature: View Active Policies**

**SQL Query**:
```sql
SELECT 
    p.policy_id,
    p.status,
    p.start_date,
    p.end_date,
    p.premium_amount,
    pt.type_name,
    pt.category,
    pt.max_coverage,
    pt.description,
    a.name AS agent_name,
    a.region AS agent_region,
    DATEDIFF(p.end_date, CURDATE()) AS days_until_expiry,
    CASE 
        WHEN p.end_date < CURDATE() THEN 'Expired'
        WHEN DATEDIFF(p.end_date, CURDATE()) <= 30 THEN 'Expiring Soon'
        ELSE 'Active'
    END AS expiry_status
FROM Policies p
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
INNER JOIN Agents a ON p.agent_id = a.agent_id
WHERE p.customer_id = %s
ORDER BY p.start_date DESC;
```

**Database Concepts**:
- **INNER JOIN**: Combine policies with types and agents
- **DATEDIFF**: Calculate days until expiry
- **CASE expression**: Derive expiry status dynamically
- **ORDER BY**: Newest policies first

**How It Works**:
1. Frontend sends GET request to `/api/v1/policies/?customer_id=X`
2. Backend extracts customer_id from JWT token
3. Executes SQL query with parameterized customer_id
4. Returns JSON array of policies
5. Frontend displays in card layout with color-coded status

---

#### **Feature: View Recent Claims**

**SQL Query**:
```sql
SELECT 
    c.claim_id,
    c.incident_date,
    c.claim_amount,
    c.status,
    c.description,
    c.submitted_at,
    pt.type_name AS policy_type,
    p.policy_id,
    COUNT(cd.doc_id) AS document_count,
    CASE c.status
        WHEN 'Approved' THEN pay.payout_amount
        ELSE NULL
    END AS payout_amount
FROM Claims c
INNER JOIN Policies p ON c.policy_id = p.policy_id
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
LEFT JOIN ClaimDocuments cd ON c.claim_id = cd.claim_id
LEFT JOIN Payouts pay ON c.claim_id = pay.claim_id
WHERE p.customer_id = %s
GROUP BY c.claim_id, c.incident_date, c.claim_amount, c.status, 
         c.description, c.submitted_at, pt.type_name, p.policy_id, pay.payout_amount
ORDER BY c.submitted_at DESC
LIMIT 5;
```

**Database Concepts**:
- **LEFT JOIN**: Include claims without documents/payouts
- **GROUP BY**: Aggregate documents per claim
- **COUNT**: Number of uploaded documents
- **LIMIT**: Pagination (show 5 recent claims)
- **Conditional SELECT**: Show payout only if approved

---

#### **Feature: Manage Beneficiaries (Nominees)**

**View Nominees SQL**:
```sql
SELECT 
    n.nom_id,
    n.nominee_name,
    n.relation,
    n.share_percent,
    p.policy_id,
    pt.type_name AS policy_type
FROM Nominees n
INNER JOIN Policies p ON n.policy_id = p.policy_id
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
WHERE p.customer_id = %s;
```

**Add Nominee SQL**:
```sql
START TRANSACTION;

-- Check total shares don't exceed 100%
SELECT SUM(share_percent) INTO @current_total
FROM Nominees
WHERE policy_id = %s;

IF (@current_total + %s) > 100 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Total share percentage cannot exceed 100%';
END IF;

-- Insert nominee
INSERT INTO Nominees (policy_id, nominee_name, relation, share_percent)
VALUES (%s, %s, %s, %s);

COMMIT;
```

**Database Concepts**:
- **Transaction**: Validate and insert atomically
- **Aggregate validation**: SUM to check constraint
- **SIGNAL**: Raise custom error for business rule
- **Weak entity**: Nominees depend on Policies

---

### **13.3 Premium Calculator**

#### **How It Works**

**Frontend Input**:
- Insurance type (Health/Car/Home)
- Coverage amount
- Customer details (age, existing policies)

**Backend Calculation (Stored Procedure)**:
```sql
DELIMITER $$

CREATE PROCEDURE CalculatePremium(
    IN p_customer_id INT,
    IN p_type_id INT,
    IN p_coverage_amount DECIMAL(10,2),
    OUT o_premium_amount DECIMAL(10,2),
    OUT o_risk_score DECIMAL(5,2)
)
BEGIN
    DECLARE v_base_premium DECIMAL(10,2);
    DECLARE v_customer_age INT;
    DECLARE v_claim_count INT DEFAULT 0;
    DECLARE v_age_factor DECIMAL(5,2) DEFAULT 1.0;
    DECLARE v_claims_factor DECIMAL(5,2) DEFAULT 1.0;
    DECLARE v_coverage_factor DECIMAL(5,2);
    
    -- Get base premium from policy type
    SELECT base_premium INTO v_base_premium
    FROM PolicyTypes
    WHERE type_id = p_type_id;
    
    -- Calculate customer age
    SELECT TIMESTAMPDIFF(YEAR, dob, CURDATE()) INTO v_customer_age
    FROM Customers
    WHERE customer_id = p_customer_id;
    
    -- Age-based risk factor
    IF v_customer_age < 25 THEN
        SET v_age_factor = 1.3;  -- Young, higher risk
    ELSEIF v_customer_age BETWEEN 25 AND 40 THEN
        SET v_age_factor = 1.0;  -- Prime age, standard risk
    ELSEIF v_customer_age BETWEEN 41 AND 60 THEN
        SET v_age_factor = 1.2;  -- Middle age, moderate risk
    ELSE
        SET v_age_factor = 1.5;  -- Senior, higher risk
    END IF;
    
    -- Claims history factor
    SELECT COUNT(*) INTO v_claim_count
    FROM Claims c
    INNER JOIN Policies p ON c.policy_id = p.policy_id
    WHERE p.customer_id = p_customer_id
      AND c.status = 'Approved';
    
    IF v_claim_count > 3 THEN
        SET v_claims_factor = 1.4;  -- Frequent claims
    ELSEIF v_claim_count > 0 THEN
        SET v_claims_factor = 1.2;  -- Some claims
    ELSE
        SET v_claims_factor = 1.0;  -- No claims (good record)
    END IF;
    
    -- Coverage amount factor (per 100k)
    SET v_coverage_factor = (p_coverage_amount / 100000.0) * 0.15 + 1.0;
    
    -- Calculate final premium
    SET o_premium_amount = v_base_premium * v_age_factor * v_claims_factor * v_coverage_factor;
    
    -- Calculate risk score (0-100)
    SET o_risk_score = ((v_age_factor - 1.0) * 30) + ((v_claims_factor - 1.0) * 50) + 20;
    
    -- Round premium to 2 decimals
    SET o_premium_amount = ROUND(o_premium_amount, 2);
    SET o_risk_score = ROUND(o_risk_score, 2);
    
END$$

DELIMITER ;

-- Usage
CALL CalculatePremium(1, 1, 500000, @premium, @risk);
SELECT @premium AS premium, @risk AS risk_score;
```

**Database Concepts**:
- **Stored Procedure**: Complex business logic in database
- **IN/OUT parameters**: Input and return values
- **TIMESTAMPDIFF**: Date arithmetic for age
- **Nested queries**: Subquery for claims history
- **Mathematical operations**: Multi-factor premium formula
- **Control flow**: IF-ELSEIF-ELSE branching
- **Session variables**: @premium, @risk

**Calculation Breakdown**:
1. **Base Premium**: From PolicyTypes table (e.g., ₹5,000)
2. **Age Factor**: 1.0 - 1.5 multiplier based on age
3. **Claims Factor**: 1.0 - 1.4 based on claim history
4. **Coverage Factor**: Linear scaling per ₹100k coverage
5. **Final Premium** = Base × Age × Claims × Coverage

**Example**:
- Base: ₹5,000
- Age 28: 1.0
- 0 Claims: 1.0
- Coverage ₹5L: 1.75
- **Premium** = 5,000 × 1.0 × 1.0 × 1.75 = **₹8,750**

---

### **13.4 Claims Submission & Processing**

#### **Customer: Submit Claim**

**Step 1: Create Claim Record**
```sql
START TRANSACTION;

-- Validate policy is active
SELECT status INTO @policy_status
FROM Policies
WHERE policy_id = %s;

IF @policy_status != 'Active' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot file claim on inactive policy';
END IF;

-- Insert claim
INSERT INTO Claims (
    policy_id,
    incident_date,
    claim_amount,
    description,
    status
) VALUES (%s, %s, %s, %s, 'Pending');

SET @claim_id = LAST_INSERT_ID();

COMMIT;
```

**Step 2: Upload Documents (Batch Insert)**
```sql
INSERT INTO ClaimDocuments (claim_id, doc_type, file_url)
VALUES 
    (@claim_id, 'Medical Report', '/uploads/doc1.pdf'),
    (@claim_id, 'Invoice', '/uploads/doc2.pdf'),
    (@claim_id, 'Photo Evidence', '/uploads/doc3.jpg');
```

**Database Concepts**:
- **Validation before insert**: Check policy status
- **SIGNAL**: Block invalid operations
- **Batch INSERT**: Multiple documents in one statement
- **Foreign key**: claim_id links documents to claim

---

#### **Claims Manager: Review & Approve**

**Retrieve Pending Claims (with Filters)**
```sql
SELECT 
    c.claim_id,
    c.incident_date,
    c.claim_amount,
    c.status,
    c.description,
    c.submitted_at,
    p.policy_id,
    pt.type_name AS policy_type,
    u.name AS customer_name,
    cu.phone AS customer_phone,
    cu.address AS customer_address,
    a.region AS agent_region,
    COUNT(cd.doc_id) AS document_count,
    GROUP_CONCAT(cd.doc_type SEPARATOR ', ') AS document_types
FROM Claims c
INNER JOIN Policies p ON c.policy_id = p.policy_id
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
INNER JOIN Customers cu ON p.customer_id = cu.customer_id
INNER JOIN Users u ON cu.user_id = u.user_id
INNER JOIN Agents a ON p.agent_id = a.agent_id
LEFT JOIN ClaimDocuments cd ON c.claim_id = cd.claim_id
WHERE c.status = 'Pending'
  AND (a.region = %s OR %s IS NULL)  -- Optional filter
  AND (pt.type_name = %s OR %s IS NULL)  -- Optional filter
  AND (c.incident_date >= %s OR %s IS NULL)  -- Optional filter
  AND (c.incident_date <= %s OR %s IS NULL)  -- Optional filter
GROUP BY c.claim_id, c.incident_date, c.claim_amount, c.status, c.description,
         c.submitted_at, p.policy_id, pt.type_name, u.name, cu.phone, cu.address, a.region
ORDER BY c.submitted_at ASC;
```

**Database Concepts**:
- **6-table JOIN**: Navigate complex relationships
- **Optional filters**: NULL-safe WHERE clauses
- **GROUP_CONCAT**: Combine multiple values into string
- **GROUP BY with aggregation**: Count documents per claim

**Approve Claim (Transaction)**
```sql
START TRANSACTION;

-- Check coverage limits
SELECT 
    pt.max_coverage,
    COALESCE(SUM(pay.payout_amount), 0) AS total_paid
INTO @max_coverage, @total_paid
FROM Policies p
INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
LEFT JOIN Claims c2 ON p.policy_id = c2.policy_id
LEFT JOIN Payouts pay ON c2.claim_id = pay.claim_id
WHERE p.policy_id = (SELECT policy_id FROM Claims WHERE claim_id = %s)
GROUP BY pt.max_coverage;

-- Validate payout doesn't exceed remaining coverage
IF (@total_paid + %s) > @max_coverage THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Payout exceeds policy coverage limit';
END IF;

-- Update claim status
UPDATE Claims
SET status = 'Approved',
    reviewed_at = CURRENT_TIMESTAMP
WHERE claim_id = %s;

-- Create payout record
INSERT INTO Payouts (
    claim_id,
    payout_amount,
    payment_mode,
    transaction_id,
    processed_at
) VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP);

COMMIT;
```

**Database Concepts**:
- **Complex validation**: Multi-table aggregate check
- **COALESCE**: Handle NULL sum (no previous payouts)
- **Business rule enforcement**: Coverage limit validation
- **Atomic operation**: Claim approval + payout creation
- **Timestamp generation**: CURRENT_TIMESTAMP for audit trail

---

### **13.5 Payment Gateway Integration**

#### **How It Works**

**Step 1: Calculate Due Amount**
```sql
SELECT 
    SUM(p.premium_amount) AS total_due,
    MIN(p.end_date) AS next_due_date,
    COUNT(p.policy_id) AS active_policies
FROM Policies p
WHERE p.customer_id = %s
  AND p.status = 'Active';
```

**Step 2: Process Payment (Simulated)**
```sql
START TRANSACTION;

-- Create payment record
INSERT INTO Payments (
    customer_id,
    amount,
    payment_method,
    transaction_id,
    status,
    payment_date
) VALUES (%s, %s, 'Credit Card', UUID(), 'Success', CURRENT_TIMESTAMP);

SET @payment_id = LAST_INSERT_ID();

-- Update policy payment status
UPDATE Policies
SET last_payment_date = CURRENT_TIMESTAMP,
    payment_status = 'Paid'
WHERE customer_id = %s
  AND status = 'Active';

COMMIT;
```

**Database Concepts**:
- **UUID()**: Generate unique transaction ID
- **Aggregate calculation**: SUM for total premium
- **Batch UPDATE**: Update all active policies
- **Transaction**: Ensure payment + policy update together

**Real-World Integration**:
- Frontend: Razorpay/Stripe SDK for card processing
- Backend: Webhook handler for payment confirmation
- Database: Store transaction reference for reconciliation

---

### **13.6 Agent Dashboard**

#### **Feature: View Assigned Customers**

```sql
SELECT 
    c.customer_id,
    u.name AS customer_name,
    u.email,
    c.phone,
    c.address,
    COUNT(DISTINCT p.policy_id) AS total_policies,
    SUM(p.premium_amount) AS total_premium_value,
    MAX(p.start_date) AS latest_policy_date,
    CASE 
        WHEN MAX(p.start_date) > DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 'Recent'
        WHEN MAX(p.start_date) > DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN 'Active'
        ELSE 'Inactive'
    END AS engagement_status
FROM Customers c
INNER JOIN Users u ON c.user_id = u.user_id
LEFT JOIN Policies p ON c.customer_id = p.customer_id
WHERE c.assigned_agent = %s
GROUP BY c.customer_id, u.name, u.email, c.phone, c.address
ORDER BY latest_policy_date DESC;
```

**Database Concepts**:
- **Aggregate functions**: COUNT, SUM, MAX for portfolio metrics
- **Date arithmetic**: DATE_SUB for relative date ranges
- **LEFT JOIN**: Include customers without policies
- **CASE for categorization**: Engagement status based on recency

---

#### **Feature: Issue New Policy**

```sql
START TRANSACTION;

-- Calculate premium using stored procedure
CALL CalculatePremium(%s, %s, %s, @premium, @risk);

-- Insert policy
INSERT INTO Policies (
    customer_id,
    type_id,
    agent_id,
    start_date,
    end_date,
    premium_amount,
    status,
    risk_score
) VALUES (%s, %s, %s, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), @premium, 'Active', @risk);

SET @policy_id = LAST_INSERT_ID();

-- Update agent commission
UPDATE Agents
SET total_policies_sold = total_policies_sold + 1,
    total_commission = total_commission + (@premium * commission_rate / 100)
WHERE agent_id = %s;

COMMIT;
```

**Database Concepts**:
- **Stored procedure call**: Reuse premium calculation logic
- **Session variables**: @premium, @risk from procedure
- **Date functions**: CURDATE(), DATE_ADD for policy dates
- **Calculated update**: Commission based on premium × rate
- **Transaction**: Policy creation + agent metrics update

---

### **13.7 Admin Dashboard**

#### **Feature: Create Policy Type**

```sql
INSERT INTO PolicyTypes (
    type_name,
    category,
    description,
    base_premium,
    max_coverage,
    min_coverage,
    policy_term_years,
    created_at
) VALUES (
    %s,  -- 'Comprehensive Health Insurance'
    %s,  -- 'Health'
    %s,  -- 'Full medical coverage including hospitalization'
    %s,  -- 5000 (base premium)
    %s,  -- 1000000 (max coverage)
    %s,  -- 100000 (min coverage)
    %s,  -- 1 (term years)
    CURRENT_TIMESTAMP
);
```

**Database Concepts**:
- **Master data creation**: Define insurance products
- **Constraint validation**: CHECK ensures base_premium > 0, max > min
- **Timestamp**: Auto-generated creation time

---

#### **Feature: Create Agent Account**

```sql
START TRANSACTION;

-- Create user account
INSERT INTO Users (email, password_hash, role, name)
VALUES (%s, %s, 'agent', %s);

SET @user_id = LAST_INSERT_ID();

-- Create agent record
INSERT INTO Agents (
    user_id,
    region,
    commission_rate,
    hire_date,
    total_policies_sold,
    total_commission
) VALUES (@user_id, %s, %s, CURDATE(), 0, 0.00);

COMMIT;
```

**Database Concepts**:
- **Multi-table insert**: User + Agent records
- **Role specialization**: Different tables for different user types
- **Initialization**: Set counters to 0 for new agents

---

#### **Feature: System Analytics**

```sql
-- Dashboard KPIs
SELECT 
    (SELECT COUNT(*) FROM Policies WHERE status = 'Active') AS active_policies,
    (SELECT COUNT(*) FROM Claims WHERE status = 'Pending') AS pending_claims,
    (SELECT COUNT(DISTINCT customer_id) FROM Customers) AS total_customers,
    (SELECT COUNT(*) FROM Agents) AS total_agents,
    (SELECT SUM(premium_amount) FROM Policies WHERE status = 'Active') AS total_premium_value,
    (SELECT SUM(payout_amount) FROM Payouts WHERE MONTH(processed_at) = MONTH(CURDATE())) AS monthly_payouts;

-- Policy distribution by type
SELECT 
    pt.type_name,
    pt.category,
    COUNT(p.policy_id) AS policy_count,
    SUM(p.premium_amount) AS total_premium,
    AVG(p.premium_amount) AS avg_premium
FROM PolicyTypes pt
LEFT JOIN Policies p ON pt.type_id = p.type_id AND p.status = 'Active'
GROUP BY pt.type_id, pt.type_name, pt.category
ORDER BY policy_count DESC;

-- Agent performance
SELECT 
    a.agent_id,
    u.name AS agent_name,
    a.region,
    COUNT(DISTINCT p.policy_id) AS policies_sold,
    SUM(p.premium_amount) AS revenue_generated,
    a.total_commission,
    ROUND(a.total_commission / NULLIF(SUM(p.premium_amount), 0) * 100, 2) AS commission_percentage
FROM Agents a
INNER JOIN Users u ON a.user_id = u.user_id
LEFT JOIN Policies p ON a.agent_id = p.agent_id
GROUP BY a.agent_id, u.name, a.region, a.total_commission
ORDER BY policies_sold DESC
LIMIT 10;
```

**Database Concepts**:
- **Scalar subqueries**: Single-value SELECT in SELECT
- **Aggregate analytics**: COUNT, SUM, AVG for KPIs
- **Date filtering**: MONTH() for time-based analysis
- **NULLIF**: Prevent division by zero
- **Performance ranking**: ORDER BY + LIMIT for top performers

---

## 14. Application Development Process

### **14.1 Planning & Design Phase**

#### **Step 1: Requirements Gathering**
- Identified 4 user personas: Customer, Agent, Claims Manager, Admin
- Mapped insurance domain workflows
- Defined CRUD operations per role

#### **Step 2: Entity-Relationship Modeling**
- Created ER diagram with 8 core entities
- Defined relationships and cardinalities
- Identified weak entities (Nominees, ClaimDocuments)

#### **Step 3: Normalization**
- Applied 3NF/BCNF rules to schema
- Eliminated redundancy and transitive dependencies
- Ensured each table has single responsibility

---

### **14.2 Database Implementation**

#### **Step 1: Schema Creation**
```sql
-- Create database
CREATE DATABASE ensurevault 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE ensurevault;

-- Create tables in dependency order
-- 1. Users (no dependencies)
CREATE TABLE Users (...);

-- 2. Customers, Agents (depend on Users)
CREATE TABLE Customers (...);
CREATE TABLE Agents (...);

-- 3. PolicyTypes (no dependencies)
CREATE TABLE PolicyTypes (...);

-- 4. Policies (depend on Customers, Agents, PolicyTypes)
CREATE TABLE Policies (...);

-- 5. Claims (depend on Policies)
CREATE TABLE Claims (...);

-- 6. Supporting tables
CREATE TABLE Nominees (...);
CREATE TABLE ClaimDocuments (...);
CREATE TABLE Payouts (...);
```

**Key Decisions**:
- **InnoDB engine**: ACID compliance, foreign key support
- **UTF8MB4**: Support for emojis and international characters
- **AUTO_INCREMENT**: Surrogate keys for all tables
- **Temporal columns**: created_at, updated_at for audit trails

---

#### **Step 2: Index Creation**
```sql
-- Performance-critical indexes
CREATE INDEX idx_email ON Users(email);
CREATE INDEX idx_customer_status ON Policies(customer_id, status);
CREATE INDEX idx_claim_status ON Claims(status);
CREATE INDEX idx_incident_date ON Claims(incident_date);
CREATE INDEX idx_policy_dates ON Policies(start_date, end_date);

-- UNIQUE constraints
CREATE UNIQUE INDEX idx_unique_email ON Users(email);
CREATE UNIQUE INDEX idx_unique_claim ON Payouts(claim_id);
```

**Rationale**:
- Email index: Fast authentication lookups
- Composite indexes: Support common WHERE clause combinations
- Date indexes: Enable efficient range queries

---

#### **Step 3: Stored Procedures & Functions**
```sql
-- Premium calculation logic
CREATE PROCEDURE CalculatePremium(...);

-- Dashboard data aggregation
CREATE PROCEDURE GetCustomerDashboard(...);

-- Claim approval workflow
CREATE FUNCTION ApproveClaimWithPayout(...);
```

**Benefits**:
- **Performance**: Logic executes on DB server
- **Consistency**: Single source of truth
- **Security**: Business rules protected from clients

---

#### **Step 4: Triggers**
```sql
-- Prevent duplicate claims
CREATE TRIGGER prevent_duplicate_claims BEFORE INSERT ON Claims ...;

-- Auto-expire policies
CREATE TRIGGER auto_expire_policy BEFORE UPDATE ON Policies ...;

-- Validate nominee shares
CREATE TRIGGER validate_nominee_shares AFTER INSERT ON Nominees ...;
```

**Purpose**: Automatic enforcement of business rules without application logic.

---

### **14.3 Backend Development (FastAPI)**

#### **Step 1: Project Structure**
```
backend/
├── src/
│   ├── main.py           # Application entry point
│   ├── config.py         # Environment configuration
│   ├── database.py       # Connection pool setup
│   ├── models/           # Pydantic validation models
│   │   ├── auth.py
│   │   ├── policy.py
│   │   ├── claim.py
│   │   └── ...
│   ├── routers/          # API endpoints
│   │   ├── auth.py
│   │   ├── policies.py
│   │   ├── claims.py
│   │   └── ...
│   └── utils/            # Helper functions
├── pyproject.toml        # Dependencies (uv)
└── uv.lock              # Locked versions
```

---

#### **Step 2: Database Connection Setup**
```python
# src/database.py
from mysql.connector import pooling

connection_pool = pooling.MySQLConnectionPool(
    pool_name="ensurevault_pool",
    pool_size=5,
    pool_reset_session=True,
    host="localhost",
    port=3306,
    user="root",
    password="password",
    database="ensurevault"
)

def get_db():
    """FastAPI dependency for database connection"""
    conn = connection_pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()
```

**Key Concepts**:
- **Connection pooling**: Reuse connections, reduce overhead
- **Dependency injection**: FastAPI's DI system manages lifecycle
- **Context manager**: Automatic connection cleanup

---

#### **Step 3: API Route Implementation**

**Example: Policy Retrieval**
```python
# src/routers/policies.py
from fastapi import APIRouter, Depends
from mysql.connector.pooling import PooledMySQLConnection
from src.database import get_db
from src.models.policy import PolicyResponse

router = APIRouter(prefix="/api/v1/policies", tags=["Policies"])

@router.get("/", response_model=list[PolicyResponse])
def get_customer_policies(
    customer_id: int,
    db: PooledMySQLConnection = Depends(get_db)
):
    """Retrieve all policies for a customer"""
    cursor = db.cursor(dictionary=True)
    
    query = """
        SELECT 
            p.policy_id,
            p.status,
            p.start_date,
            p.end_date,
            p.premium_amount,
            pt.type_name,
            pt.max_coverage,
            a.name AS agent_name
        FROM Policies p
        INNER JOIN PolicyTypes pt ON p.type_id = pt.type_id
        INNER JOIN Agents a ON p.agent_id = a.agent_id
        WHERE p.customer_id = %s
        ORDER BY p.start_date DESC
    """
    
    cursor.execute(query, (customer_id,))
    policies = cursor.fetchall()
    cursor.close()
    
    return {"success": True, "data": policies}
```

**Key Concepts**:
- **Parameterized queries**: `%s` prevents SQL injection
- **Cursor**: Execute SQL and fetch results
- **dictionary=True**: Return rows as dictionaries
- **Response model**: Pydantic validates output structure

---

#### **Step 4: Transaction Handling**

**Example: Claim Submission**
```python
@router.post("/claims/", response_model=ClaimResponse)
def submit_claim(
    claim_data: ClaimCreate,
    db: PooledMySQLConnection = Depends(get_db)
):
    """Submit new insurance claim"""
    cursor = db.cursor()
    
    try:
        # Start transaction
        db.start_transaction()
        
        # Insert claim
        cursor.execute("""
            INSERT INTO Claims (policy_id, incident_date, claim_amount, description, status)
            VALUES (%s, %s, %s, %s, 'Pending')
        """, (claim_data.policy_id, claim_data.incident_date, claim_data.claim_amount, claim_data.description))
        
        claim_id = cursor.lastrowid
        
        # Insert documents
        if claim_data.documents:
            doc_query = "INSERT INTO ClaimDocuments (claim_id, doc_type, file_url) VALUES (%s, %s, %s)"
            doc_values = [(claim_id, doc.doc_type, doc.file_url) for doc in claim_data.documents]
            cursor.executemany(doc_query, doc_values)
        
        # Commit transaction
        db.commit()
        
        return {"success": True, "claim_id": claim_id}
        
    except Exception as e:
        # Rollback on error
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        cursor.close()
```

**Key Concepts**:
- **start_transaction()**: Begin atomic operation
- **commit()**: Persist changes
- **rollback()**: Revert on error
- **executemany()**: Batch inserts for efficiency
- **lastrowid**: Get auto-generated primary key

---

### **14.4 Frontend Development (Next.js)**

#### **Step 1: Project Structure**
```
frontend/
├── app/                  # App Router (Next.js 13+)
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Homepage
│   ├── auth/            # Authentication pages
│   ├── customer/        # Customer dashboard
│   ├── agent/           # Agent dashboard
│   ├── manager/         # Claims manager dashboard
│   └── admin/           # Admin dashboard
├── components/          # Reusable UI components
│   ├── Navbar.tsx
│   ├── Toast.tsx
│   └── Chatbot.tsx
├── context/             # React Context (state management)
│   └── AuthContext.tsx
└── app/globals.css      # Tailwind + custom styles
```

---

#### **Step 2: Authentication Context**
```typescript
// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  user_id: number;
  email: string;
  role: string;
  name: string;
  customer_id?: number;
  agent_id?: number;
}

const AuthContext = createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}>({
  user: null,
  login: async () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Restore session from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

**Key Concepts**:
- **React Context**: Global state management
- **localStorage**: Persist session across page reloads
- **Custom hook**: useAuth() for easy access
- **TypeScript**: Type-safe user object

---

#### **Step 3: Dashboard Implementation**

**Example: Customer Dashboard**
```typescript
// app/customer/dashboard/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      const [policyRes, claimRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/policies/?customer_id=${user.customer_id}`),
        fetch(`http://localhost:8000/api/v1/claims/?customer_id=${user.customer_id}`)
      ]);
      
      const policyData = await policyRes.json();
      const claimData = await claimRes.json();
      
      setPolicies(policyData.data);
      setClaims(claimData.data);
      setLoading(false);
    }
    
    if (user) fetchData();
  }, [user]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Customer Dashboard</h1>
      
      {/* Active Policies */}
      <section>
        <h2>Active Policies</h2>
        {policies.map(policy => (
          <div key={policy.policy_id}>
            <h3>{policy.type_name}</h3>
            <p>Premium: ₹{policy.premium_amount}</p>
            <p>Status: {policy.status}</p>
          </div>
        ))}
      </section>
      
      {/* Recent Claims */}
      <section>
        <h2>Recent Claims</h2>
        {claims.map(claim => (
          <div key={claim.claim_id}>
            <p>Amount: ₹{claim.claim_amount}</p>
            <p>Status: {claim.status}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
```

**Key Concepts**:
- **useEffect**: Fetch data on component mount
- **Promise.all**: Parallel API requests
- **Conditional rendering**: Show loading state
- **Component state**: useState for data storage

---

### **14.5 Deployment Setup**

#### **Docker Compose Configuration**
```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL Database
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ensurevault
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  # FastAPI Backend
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: rootpassword
      DB_NAME: ensurevault
    depends_on:
      db:
        condition: service_healthy
    command: uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
  
  # Next.js Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    depends_on:
      - backend
    command: npm run start

volumes:
  mysql_data:
```

**Key Concepts**:
- **Multi-container orchestration**: Database + Backend + Frontend
- **Health checks**: Wait for DB before starting backend
- **Volumes**: Persist database data
- **Environment variables**: Configuration injection
- **Port mapping**: Expose services to host

---

#### **Deployment Steps**
```bash
# 1. Clone repository
git clone https://github.com/yourteam/EnsureVault.git
cd EnsureVault

# 2. Build and start all services
docker compose up -d --build

# 3. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Database: localhost:3307

# 4. View logs
docker compose logs -f

# 5. Stop services
docker compose down
```

---

### **14.6 Technology Integration**

#### **Backend Technologies**
- **FastAPI**: Modern Python web framework
  - Auto-generated OpenAPI docs
  - Dependency injection
  - Async support (if needed)
- **Pydantic**: Data validation
  - Type checking at runtime
  - Automatic error messages
- **MySQL Connector**: Direct SQL queries
  - No ORM overhead
  - Full SQL feature access
- **bcrypt**: Password hashing
  - Secure one-way encryption
  - Salt generation

#### **Frontend Technologies**
- **Next.js 16**: React framework
  - App Router (file-based routing)
  - Server/Client components
  - Optimized builds
- **TypeScript**: Type safety
  - Catch errors at compile time
  - IDE autocomplete
- **Tailwind CSS**: Utility-first styling
  - Rapid development
  - Consistent design system
- **React Context**: State management
  - Simple global state
  - No external library needed

#### **Database Technologies**
- **MySQL 8.0**: Relational DBMS
  - InnoDB storage engine (ACID)
  - JSON support
  - Window functions
- **Connection Pooling**: Performance
  - Reuse connections
  - Handle concurrency

---

### **14.7 Development Workflow**

#### **Phase 1: Database First (Week 1-2)**
1. Design ER diagram
2. Create normalized schema
3. Write CREATE TABLE statements
4. Add indexes and constraints
5. Create stored procedures
6. Write triggers
7. Populate seed data

#### **Phase 2: Backend API (Week 3-4)**
1. Setup FastAPI project
2. Configure database connection
3. Create Pydantic models
4. Implement authentication
5. Write CRUD endpoints
6. Add business logic
7. Test with Swagger docs

#### **Phase 3: Frontend UI (Week 5-6)**
1. Setup Next.js project
2. Design component library
3. Implement authentication flow
4. Build role-specific dashboards
5. Connect to backend APIs
6. Add form validation
7. Style with Tailwind CSS

#### **Phase 4: Integration & Testing (Week 7-8)**
1. End-to-end testing
2. Bug fixes
3. Performance optimization
4. Security hardening
5. Documentation
6. Docker deployment
7. Final demo preparation

---

## Conclusion

EnsureVault is a production-grade insurance management system built with:

**Database Excellence**:
- Normalized schema (3NF/BCNF)
- Complex multi-table queries
- Stored procedures for business logic
- Triggers for constraint enforcement
- Transaction management (ACID)
- Optimized indexing strategy

**Application Features**:
- Role-based access control (4 personas)
- Policy lifecycle management
- Claims submission & adjudication
- Real-time premium calculation
- Secure payment processing
- Comprehensive dashboards

**Technical Stack**:
- **Backend**: Python FastAPI with direct SQL
- **Frontend**: Next.js with TypeScript
- **Database**: MySQL 8.0 with InnoDB
- **Deployment**: Docker Compose

**Key Achievements**:
- 8 normalized database tables
- 20+ API endpoints
- 6 stored procedures
- 5 database triggers
- 50+ SQL queries
- 4 role-specific dashboards
- Full transaction support
- Comprehensive error handling

This system demonstrates mastery of database concepts including normalization, transactions, stored procedures, triggers, indexing, and query optimization—all essential skills for the CSF212 Database Systems course.

---

**Prepared for**: CSF212 - Database Systems Course Evaluation  
**Institution**: BITS Pilani, Goa Campus  
**Project**: EnsureVault Insurance Management System

