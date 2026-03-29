-- ============================================================
-- EnsureVault — Seed Data for Development & Testing
-- Run AFTER schema.sql and stored_procedures.sql
-- ============================================================

USE ensurevault;

-- --------------------------------------------------------
-- Agents
-- --------------------------------------------------------
INSERT INTO agent (name, commission_rate, region) VALUES
('Rajesh Sharma',  8.50, 'Maharashtra'),
('Priya Menon',    7.25, 'Karnataka');

-- --------------------------------------------------------
-- Policy Types (Health, Car, Home)
-- --------------------------------------------------------
INSERT INTO policy_type (type_name, base_premium, max_coverage) VALUES
('Health', 5000.00,  500000.00),
('Car',    3500.00,  300000.00),
('Home',   8000.00, 1000000.00);

-- --------------------------------------------------------
-- Customers (Onboarded by Agents)
-- --------------------------------------------------------
INSERT INTO customer (full_name, email, kyc_status, agent_id) VALUES
('Amit Patel',      'amit.patel@email.com',      'Verified', 1),
('Sneha Iyer',      'sneha.iyer@email.com',       'Verified', 1),
('Rohan Deshmukh',  'rohan.deshmukh@email.com',   'Verified', 2),
('Kavya Nair',      'kavya.nair@email.com',        'Pending',  2),
('Vikram Joshi',    'vikram.joshi@email.com',      'Verified', 1);

-- --------------------------------------------------------
-- Policies
-- --------------------------------------------------------
INSERT INTO policy (customer_id, type_id, agent_id, start_date, end_date, status, premium_amount) VALUES
(1, 1, 1, '2025-01-01', '2026-01-01', 'Active',    5000.00),
(1, 2, 1, '2025-03-15', '2026-03-15', 'Active',    4200.00),
(2, 1, 1, '2025-06-01', '2026-06-01', 'Active',    5750.00),
(2, 3, 1, '2025-02-01', '2026-02-01', 'Active',    7200.00),
(3, 2, 2, '2025-04-01', '2026-04-01', 'Active',    4200.00),
(3, 1, 2, '2025-07-01', '2026-07-01', 'Expired',   5000.00),
(5, 1, 1, '2025-09-01', '2026-09-01', 'Active',    5000.00),
(5, 3, 1, '2026-01-01', '2027-01-01', 'Active',    7200.00);

-- --------------------------------------------------------
-- Claims
-- --------------------------------------------------------
INSERT INTO claim (policy_id, incident_date, claim_amount, status, rejection_reason) VALUES
(1, '2025-06-15', 25000.00,  'Approved', NULL),
(2, '2025-08-20', 150000.00, 'Pending',  NULL),
(3, '2025-09-10', 35000.00,  'Pending',  NULL),
(5, '2025-05-22', 80000.00,  'Rejected', 'Insufficient documentation for incident'),
(7, '2025-12-01', 45000.00,  'Under Review', NULL);

-- --------------------------------------------------------
-- Payments
-- --------------------------------------------------------
INSERT INTO payment (policy_id, amount, payment_date, payment_mode, status) VALUES
(1, 5000.00,  '2025-01-01', 'UPI',         'Success'),
(2, 4200.00,  '2025-03-15', 'Credit Card', 'Success'),
(3, 5750.00,  '2025-06-01', 'Net Banking', 'Success'),
(4, 7200.00,  '2025-02-01', 'Debit Card',  'Success'),
(5, 4200.00,  '2025-04-01', 'UPI',         'Success'),
(7, 5000.00,  '2025-09-01', 'Credit Card', 'Success'),
(8, 7200.00,  '2026-01-01', 'UPI',         'Pending');

-- --------------------------------------------------------
-- Nominees
-- --------------------------------------------------------
INSERT INTO nominee (policy_id, nominee_name, relation, share_percent) VALUES
(1, 'Meera Patel',    'Spouse',  60.00),
(1, 'Arjun Patel',    'Son',     40.00),
(3, 'Ravi Iyer',      'Father',  100.00),
(5, 'Anita Deshmukh', 'Mother',  100.00),
(7, 'Pooja Joshi',    'Spouse',  50.00),
(7, 'Rahul Joshi',    'Son',     50.00);

-- --------------------------------------------------------
-- Documents (for claims)
-- --------------------------------------------------------
INSERT INTO document (claim_id, doc_type, file_url) VALUES
(1, 'Medical Report',   '/uploads/claims/1/medical_report.pdf'),
(1, 'Hospital Bill',    '/uploads/claims/1/hospital_bill.pdf'),
(2, 'FIR Copy',         '/uploads/claims/2/fir_copy.pdf'),
(2, 'Repair Estimate',  '/uploads/claims/2/repair_estimate.pdf'),
(3, 'Prescription',     '/uploads/claims/3/prescription.pdf'),
(4, 'Repair Invoice',   '/uploads/claims/4/repair_invoice.pdf'),
(5, 'Police Report',    '/uploads/claims/5/police_report.pdf');
