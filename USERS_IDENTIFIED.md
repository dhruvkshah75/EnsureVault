# 👥 Users Identified

Based on the Entity-Relationship Diagram (ERD), the **EnsureVault** system defines four distinct user roles, each with specific access privileges to database entities.

### 1. Administrator (System Admin)
* **Role:** The superuser responsible for defining business rules and managing the system.
* **ERD Interaction:**
    * **Policy Types:** Creates and updates `Policy Type` rules (Base Premium, Max Coverage).
    * **Agents:** Manages the `Agent` entity (sets `commission_rate`, assigns regions).
    * **System Oversight:** Full CRUD access to all tables for maintenance.

### 2. Insurance Agent
* **Role:** The sales intermediary who brings users onto the platform.
* **ERD Interaction:**
    * **Customer:** `INSERT` privileges for the `Customer` table during onboarding.
    * **Policy:** `INSERT` privileges to create new `Policy` records linked via the `Sells` relationship.
    * **Sales Tracking:** `SELECT` access to view their specific sales history and commissions.

### 3. Customer (Policyholder)
* **Role:** The end-user who purchases insurance and utilizes the platform.
* **ERD Interaction:**
    * **Policy:** `SELECT` access to view their own `Policy` details and `Nominee` information.
    * **Claims:** `INSERT` privileges into the `Claim` table to report incidents.
    * **Payments:** `INSERT` privileges into the `Payment` table for premium transactions.
    * **Documents:** Uploads files to the `Document` table.

### 4. Claims Manager (Adjuster)
* **Role:** The operational user responsible for processing and verifying insurance claims.
* **ERD Interaction:**
    * **Verification:** accesses the `Document` table to validate proofs via the `Verified By` relationship.
    * **Decision Making:** `UPDATE` privileges on the `Claim` table to modify `status` (Approve/Reject) and add `rejection_reason`.