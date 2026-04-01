# Remaining Implementation Tasks
**Assignee:** Yash

The following features from the dashboard design and advanced database requirements are not yet implemented in the EnsureVault application. Please complete these to satisfy the final project requirements.

## 1. The Administrator Dashboard
- [ ] **Admin KPIs:** Build out the top-level metrics section to show:
  - Total company revenue
  - Total active policies
  - Total amount paid out in claims
  - Breakdown of claims (Approved vs. Rejected)
- [ ] **Product Manager (Edit Mode):** We have the "Create" form, but we need a table/view to **Edit** existing `Policy Types` (updating Base Premium and Max Coverage).
- [ ] **Agent Management (View/Edit):** We have the "Add Agent" form, but need a table to view all active agents and adjust their `commission_rate` or `region` dynamically.
- [ ] **System Audit Log:** Create a read-only view tracking recent high-level transactions across the system (e.g., policy creations, claim payouts).

## 2. The Insurance Agent Dashboard
- [ ] **Advanced Agent KPIs:** Update the agent portal to show "Total commission earned *this month*" (currently shows all-time) and "Recent policies sold".
- [ ] **Customer Onboarding:** Build a form for the Agent to input KYC details and add a brand new `Customer` directly to the database.
- [ ] **Policy Issuance:** Create a workflow allowing the Agent to link one of their customers to a `Policy Type` and generate a new active policy.
- [ ] **My Roster Enhancements:** Update the existing "Your Customers" list to clearly show which specific policies are up for renewal soon.

## 3. The Customer Dashboard
- [ ] **Customer KPIs:** Add an aggregate metric for "Total premiums paid" across all their policies.
- [ ] **Nominee Management:** Add a form in the "My Policies" view allowing the customer to update their assigned `Nominees`.
- [ ] **Payment Gateway:** Build an interface to record a `Payment` against a specific policy to keep it active.
- [ ] **Claim Center (Document Upload):** We have the basic claims form, but we need to implement the ability to upload `Documents` (proof) directly to the database when filing.

## 4. The Claims Manager Dashboard
*(Note: This persona/role does not currently exist. We only have Customer, Agent, and Admin).*
- [ ] **Claims Manager Role:** Add a new RBAC role for `claims_manager` in the system.
- [ ] **Claims Manager KPIs:** Track number of pending claims, average processing time, and total value of claims in the queue.
- [ ] **The Review Queue & Verification Portal:** Build a table displaying all `Pending` claims. Clicking a claim should reveal a detailed view showing policy rules, the customer's history, and a viewer for the uploaded `Documents`.
- [ ] **Decision Engine:** Move the 'Approve/Reject' buttons (currently on the Agent dashboard) to this new dedicated Claims Manager dashboard.

## Advanced Database Features (Critical for Evaluation)
- [ ] **Automated Triggers:** Add a MySQL `TRIGGER` where the system automatically calculates and inserts a commission record for the Agent the moment a Customer makes their first `Payment`.
- [ ] **Atomic Transactions:** Wrap the "Approve Claim" functionality in a transaction (`START TRANSACTION`). It must update the claim status AND deduct the claim amount from a central "Company Reserve" table simultaneously. If one fails, the whole thing `ROLLBACK`s.
- [ ] **Complex Views (Leaderboard):** Create a SQL `VIEW` that ranks Agents based on the total premium value they brought in (using `JOINs` and `GROUP BY`). Display this leaderboard on the Admin dashboard.
- [ ] **Search and Filter:** Add a dynamic search bar for the Claims Manager to filter claims by region, date range, or policy type (translating to complex `WHERE` clauses in the backend).
