# EnsureVault — Remaining Tasks

This document tracks the outstanding work needed to make EnsureVault fully functional. The blocking tasks are now done (triggers + Docker). The tasks below are ordered by priority.

---

## 🟡 High Priority

**✨ All high-priority tasks and sprint deliverables have been successfully completed! ✨**

---

## ✅ Already Done (Completed)

| Task | Owner | Status |
|------|-------|--------|
| Docker orchestration (`docker-compose.yml`, Dockerfiles) | Dhruv | ✅ Done |
| CORS + DB connection pooling | Dhruv | ✅ Done |
| GitHub Actions CI/CD pipeline | Dhruv | ✅ Done |
| Payouts & Finance API (atomic transactions) | Aaditya | ✅ Merged & Tested |
| Database triggers (`triggers.sql`) | Dhruv (on behalf of Pranav) | ✅ Done |
| Authentication, RBAC, & Customer Profile | Yash | ✅ Done |
| Backend Validation & Documentation | Aayush | ✅ Done |
| Frontend API Integration | Divyam | ✅ Done |

---

## Suggested Merge Order

```
Aayush (validation) ──► Divyam (API integration) ──► Yash (auth + RBAC)
```

> All PRs must pass the GitHub Actions CI check (lint + syntax) before being merged into `main`.
