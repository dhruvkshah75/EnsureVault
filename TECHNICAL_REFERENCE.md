# Technical Reference — EnsureVault Architecture

This document provides a comprehensive overview of the EnsureVault codebase, detailing the purpose and function of key files and directories to assist in maintenance, evaluation, and future development.

## 1. Project Overview
EnsureVault is a modern insurance management system built with a decoupled architecture:
- **Backend**: FastAPI (Python 3.12) with MySQL 8.0.
- **Frontend**: Next.js 14+ (App Router) with Tailwind CSS and Lucide React.
- **Orchestration**: Docker Compose and GitHub Actions (CI).

---

## 2. Backend Architecture (`/backend`)
The backend follows a modular design centered around FastAPI's dependency injection system.

### Core Files
- **`src/main.py`**: The application entry point. It handles CORS configuration, middleware setup, and registers all feature routers.
- **`src/database.py`**: Manages the MySQL connection pool. It provides the `get_db` dependency used throughout the API.
- **`src/config.py`**: Centralized configuration management using Pydantic Settings, handling environment variables (e.g., `GEMINI_API_KEY`).

### Feature Routers (`src/routers/`)
- **`ai.py`**: Integrates with Google Gemini AI for the assistant feature.
- **`auth.py`**: Handles user login and registration for customers and internal staff.
- **`policies.py`**: Core CRUD for insurance policies and nominee management.
- **`payouts.py`**: Manages claim approvals and financial transactions with atomic reserve deduction.
- **`risk_assessment.py`**: Interfaces with SQL stored procedures for complex insurance risk logic.
- **`admin.py`**: Provides high-performance analytics and leaderboard metrics for the executive view.

### Data Models (`src/models/`)
Contains Pydantic schemas that enforce strict type checking and validation for all API requests and responses.

### Testing (`tests/`)
- **`conftest.py`**: Sets up the TestClient and mocks database connections to ensure tests can run in CI without a live database.
- **`test_main.py`**: Sanity and health-check tests for the FastAPI application.

---

## 3. Frontend Architecture (`/frontend`)
The frontend is a React-based Single Page Application (SPA) leveraging Next.js for routing and server-side rendering where appropriate.

### App Structure (`app/`)
- **`layout.tsx`**: Defines the global UI wrapper, including the Navbar, Chatbot, and Toast notifications.
- **`page.tsx`**: The home page, which serves as a role-based portal (different views for Admin, Agent, and Customer).
- **`globals.css`**: The "Elite UI" design system, containing custom Tailwind layers for glassmorphism and the premium color palette.

### Context & State (`context/`)
- **`AuthContext.tsx`**: Manages the global authentication state, tracking the logged-in user's role and ID.

### Components (`components/`)
- **`Chatbot.tsx`**: The "Elite" AI widget featuring glassmorphism and concierge-style animations.
- **`Navbar.tsx`**: Responsive navigation bar with role-based visibility.

---

## 4. Database & SQL (`/backend/sql`)
The database logic is heavily optimized using MySQL features to ensure performance and data integrity.

- **`schema.sql`**: Definitive table structures and foreign key relationships.
- **`triggers.sql`**: Automated business rules (e.g., preventing claim filing on expired policies, auto-calculating agent commissions).
- **`v2_advanced_features.sql`**: Defines the `v_agent_leaderboard` view and the `company_reserve` table for financial management.

---

## 5. Infrastructure & CI/CD
- **`docker-compose.yml`**: Orchestrates the multi-container environment (db, backend, frontend).
- **`.github/workflows/main.yml`**: The CI pipeline that automatically runs Ruff (linting), Pytest (backend tests), and Jest (frontend tests) on every push.
- **`DEPLOYMENT.md`**: Step-by-step instructions for production deployment.
