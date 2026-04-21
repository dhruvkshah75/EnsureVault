# 🚀 EnsureVault Deployment Guide

This guide provides instructions for deploying the EnsureVault application using Docker Compose. This setup is suitable for local evaluation and small-scale production environments.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd EnsureVault
   ```

2. **Launch the stack:**
   ```bash
   docker-compose up -d --build
   ```
   This command starts three containers:
   - `ensurevault-db`: MySQL 8.0 database (Port 3307)
   - `ensurevault-backend`: FastAPI application (Port 8000)
   - `ensurevault-frontend`: Next.js application (Port 3000)

3. **Verify running services:**
   ```bash
   docker-compose ps
   ```

## Database Initialization

The database is automatically initialized on the first boot. SQL scripts in `backend/sql/` are executed in alphabetical order:
1. `schema.sql`: Core table structures.
2. `seed.sql`: Initial demo data.
3. `stored_procedures.sql`: Business logic procedures.
4. `triggers.sql`: Data integrity triggers.
5. `v2_advanced_features.sql`: Company reserve, commissions, and leaderboard.
6. `v3_roles_and_users.sql`: RBAC profiles (`dba_admin`, `data_analyst`, `claims_processor`).

## Accessing the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database:** `localhost:3307` (User: `root`, Password: `password`)

## Role-Based Access Control (RBAC)

The system is configured with following database users for evaluation:
- `dba_admin`: Full administrative access.
- `data_analyst`: View-only access to all tables.
- `claims_processor`: View access, with update permissions on the `claim` table.

## Troubleshooting

- **Logs:** View service logs with `docker-compose logs -f <service_name>`.
- **Restarting:** `docker-compose restart`.
- **Clean Slate:** To reset the database, run `docker-compose down -v` followed by `docker-compose up -d`.

---
**Evaluation Note:** Ensure that `v3_roles_and_users.sql` is present in `backend/sql/` to ensure RBAC is provisioned correctly.
