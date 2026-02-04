# EnsureVault 
**`EnsureVault` (Insurance Policy & Claims Processing System)** is a centralized database-driven application designed to automate the management of insurance policies, customer portfolios, and claim settlements. This project is built as part of the **CSF212 - Database Systems** course at **BITS Pilani, Goa Campus**.

---

### **1. Install uv**

If you haven't installed it yet, use one of the following commands:

* **Via pip:** `pip install uv`
* **Via Curl (macOS/Linux):** `curl -LsSf https://astral.sh/uv/install.sh | sh`

---

### **2. Initialize the Project**

Navigate to your project root and initialize the `uv` structure:

```bash
uv init
```

This creates a `pyproject.toml` file, which will act as the single source of truth for your project configuration.

---

### **3. Add Dependencies**

Instead of using a `requirements.txt`, add your packages directly. **uv** will automatically create a virtual environment and a `uv.lock` file to ensure consistency across all 6 team members.

```bash
# Core FastAPI dependencies
uv add fastapi uvicorn

# Raw SQL Database driver (No ORM as planned)
uv add mysql-connector-python
```

---

### **4. Synchronize the Environment**

Whenever a teammate pushes a change to the `pyproject.toml` or `uv.lock`, simply run:

```bash
uv sync
```

This ensures your local environment exactly matches the project's defined state.

---

### **5. Run the Application**

You do not need to "activate" the environment. Use `uv run` to execute commands within the context of your project's virtual environment:

```bash
uv run uvicorn src.main:app --reload
```

---

## Technology Stack

* **Frontend:** Next.js (React), Tailwind CSS, ShadCN UI.
* **Backend:** Python (FastAPI).
* **Database:** MySQL 8.0.

---

## System Architecture & Modules

The system is divided into functional modules designed to handle high-concurrency financial logic directly within the database layer:

* **Policy Management:** Defining insurance plans (Health, Car, Home) and coverage rules.
* **Customer Portfolio:** Managing KYC, personal details, and policy history.
* **Claims Submission:** Interface for reporting incidents and uploading documentation.
* **Risk Assessment:** Module for adjusters to investigate and approve/deny claims.
* **Premium Calculation:** Using Stored Procedures to automate cost analysis based on risk factors.
* **Payouts & Finance:** Handling transactions while ensuring strict ACID properties.

---

## Key DBMS Concepts Used

* **Normalization:** Strictly follows BCNF/3NF to eliminate data redundancy.
* **Triggers:** Enforces business constraints, such as preventing duplicate claims.
* **Stored Procedures:** Offloads complex financial calculations from the backend to the database.
* **Transactions:** Ensures Atomicity and Consistency during claim settlement and payment processing.
