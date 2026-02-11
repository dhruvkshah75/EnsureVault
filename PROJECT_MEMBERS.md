# EnsureVault - Project Members & Roles
Insurance Policy and Claims Proccessing System   
**Database Systems Course (CSF212) - Group Project**  
**BITS Pilani, Goa Campus**

---

## Team Structure

### Project Leader: Dhruv Shah (Member 1)
**Role:** Project Coordinator & Full-Stack Integration Lead

**Responsibilities:**
- **Project Management:** Coordinating team activities, sprint planning, and deadline management
- **Architecture Design:** Defining overall system architecture and integration between frontend and backend
- **Database Schema Design:** Leading the normalization process (BCNF/3NF) and ER diagram creation
- **Backend Development:** FastAPI application structure and API endpoint design
- **Frontend Integration:** Ensuring seamless communication between Next.js frontend and FastAPI backend
- **Docker & Deployment:** Managing docker-compose setup and environment configuration
- **Git & Version Control:** Repository management, branch strategy, and code review coordination
- **Database Connection Management:** Implementing MySQL connection pooling and database session handling
- **API Gateway Design:** Creating centralized API routing and middleware configuration
- **Cross-Origin Resource Sharing (CORS):** Configuring secure communication between frontend and backend
- **Code Review & Quality Assurance:** Reviewing all pull requests and ensuring code quality standards

**Technical Focus:**
- Backend: FastAPI, Python, MySQL connector, uvicorn
- Frontend: Next.js, React, TypeScript integration
- DevOps: Docker, docker-compose, uv package management
- Database: Connection pooling, session management

---

### Divyam Agarwal (Member 2)
**Role:** Frontend Developer & UI/UX Designer

**Responsibilities:**
- **User Interface Design:** Creating intuitive interfaces using Next.js, Tailwind CSS, and ShadCN UI
- **Customer Portal:** Building customer-facing pages for policy viewing and claims submission
- **Policy Management UI:** Developing admin interfaces for policy creation and management
- **Form Validation:** Client-side validation for KYC, claims, and policy forms
- **Responsive Design:** Ensuring mobile-friendly and cross-browser compatibility
- **State Management:** Managing application state and data flow in React components
- **API Integration:** Connecting frontend components to backend APIs

**Technical Focus:**
- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS, ShadCN UI components
- User experience optimization

---

### Pranav Lorekar (Member 3)
**Role:** Database Administrator & Triggers Specialist

**Responsibilities:**
- **Database Triggers:** Designing and implementing triggers for business constraint enforcement (duplicate claims prevention, data validation)
- **Claims Submission Module:** Database layer for incident reporting and documentation management
- **Data Integrity:** Ensuring referential integrity and constraint validation
- **Database Security:** Implementing access controls and data protection measures
- **Backup & Recovery:** Database backup strategies and disaster recovery planning
- **Schema Maintenance:** Managing database migrations and schema versioning
- **Performance Monitoring:** Tracking query performance and database health

**Technical Focus:**
- Database: MySQL triggers, constraints, indexes
- Backend: Python database connectivity
- Data validation and business rules enforcement

---

### Aaditya Lahori (Member 4)
**Role:** Backend Developer & Database Transaction Specialist

**Responsibilities:**
- **Transaction Management:** Implementing ACID-compliant transactions for claim settlements and payments
- **Stored Procedures:** Developing complex stored procedures for premium calculation and risk assessment
- **Payouts & Finance Module:** Building the financial transaction handling system with atomicity guarantees
- **Backend API Development:** Creating RESTful endpoints for claims processing and policy management
- **Database Optimization:** Query optimization and indexing strategies
- **Error Handling:** Implementing robust error handling and rollback mechanisms
- **Testing:** Backend unit testing and integration testing for financial modules

**Technical Focus:**
- Backend: FastAPI, Python
- Database: MySQL stored procedures, transactions, triggers
- Financial logic implementation

---

### Aayush Kushwaha (Member 5)
**Role:** Backend Developer & Risk Assessment Module Lead

**Responsibilities:**
- **Risk Assessment Module:** Building the adjuster interface for claim investigation and approval/denial
- **Premium Calculation Logic:** Implementing stored procedures for cost analysis based on risk factors
- **Policy Management Backend:** Developing APIs for defining insurance plans (Health, Car, Home) and coverage rules
- **Business Logic:** Translating insurance domain requirements into backend code
- **Data Validation:** Server-side validation for policy and claims data
- **API Documentation:** Creating comprehensive API documentation for frontend team
- **Code Quality:** Writing clean, maintainable, and well-documented code

**Technical Focus:**
- Backend: FastAPI, Python
- Database: Stored procedures, complex queries
- Business logic and domain modeling

---

### Yash Singh (Member 6)
**Role:** Frontend Developer & Customer Portfolio Specialist

**Responsibilities:**
- **Customer Portfolio Module:** Building the UI for managing KYC, personal details, and policy history
- **Authentication & Authorization:** Implementing user login, registration, and role-based access control
- **Dashboard Development:** Creating interactive dashboards for customers and administrators
- **Data Visualization:** Implementing charts and reports for policy analytics and claim statistics
- **Component Library:** Building reusable React components with ShadCN UI
- **Frontend Testing:** Writing tests for React components and user flows
- **Accessibility:** Ensuring WCAG compliance and accessible UI design

**Technical Focus:**
- Frontend: Next.js, React, TypeScript
- UI Libraries: ShadCN UI, Tailwind CSS
- User authentication and dashboard design

---

## Team Collaboration Areas

### Frontend Team
**Members:** Divyam Agarwal (Lead), Yash Singh  
**Stack:** Next.js, React, TypeScript, Tailwind CSS, ShadCN UI  
**Key Deliverables:**
- User interfaces for all modules
- Responsive and accessible design
- Client-side validation and state management

### Backend Team
**Members:** Dhruv Shah (Lead), Aaditya Lahori, Aayush Kushwaha  
**Stack:** Python, FastAPI, MySQL Connector  
**Key Deliverables:**
- RESTful APIs for all modules
- Business logic implementation
- Integration with database layer

### Database Team
**Members:** Dhruv Shah (Lead), Pranav Lorekar, Aaditya Lahori  
**Stack:** MySQL 8.0  
**Key Deliverables:**
- Normalized schema (BCNF/3NF)
- Triggers for constraint enforcement
- Stored procedures for complex calculations
- Transaction management for financial operations

---

## Module Ownership Matrix

| Module | Frontend Owner | Backend Owner | Database Owner |
|--------|---------------|---------------|----------------|
| **Policy Management** | Divyam Agarwal | Aayush Kushwaha | Dhruv Shah |
| **Customer Portfolio** | Yash Singh | Dhruv Shah | Pranav Lorekar |
| **Claims Submission** | Divyam Agarwal | Aaditya Lahori | Pranav Lorekar |
| **Risk Assessment** | Yash Singh | Aayush Kushwaha | Aayush Kushwaha |
| **Premium Calculation** | Divyam Agarwal | Aayush Kushwaha | Aayush Kushwaha |
| **Payouts & Finance** | Yash Singh | Aaditya Lahori | Aaditya Lahori |

---

## Technology Stack Summary

### Frontend
- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** ShadCN UI
- **Owners:** Divyam Agarwal, Yash Singh

### Backend
- **Framework:** FastAPI
- **Language:** Python
- **Package Manager:** uv
- **Owners:** Dhruv Shah, Aaditya Lahori, Aayush Kushwaha

### Database
- **DBMS:** MySQL 8.0
- **Driver:** mysql-connector-python
- **Key Features:** Triggers, Stored Procedures, Transactions
- **Owners:** Dhruv Shah, Pranav Lorekar, Aaditya Lahori

### DevOps
- **Containerization:** Docker, docker-compose
- **Version Control:** Git
- **Owner:** Dhruv Shah

---

## Key DBMS Concepts - Team Contributions

| Concept | Primary Owner | Implementation |
|---------|---------------|----------------|
| **Normalization (BCNF/3NF)** | Dhruv Shah | Database schema design |
| **Triggers** | Pranav Lorekar | Business constraint enforcement |
| **Stored Procedures** | Aayush Kushwaha, Aaditya Lahori | Premium calculation, risk assessment |
| **Transactions (ACID)** | Aaditya Lahori | Claim settlement, payment processing |
| **Indexing & Optimization** | Pranav Lorekar | Query performance tuning |
| **Referential Integrity** | Pranav Lorekar | Foreign key constraints |

---

