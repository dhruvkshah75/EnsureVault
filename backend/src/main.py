from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.database import close_pool, init_pool
from src.routers import (
    admin,
    agents,
    ai,
    auth,
    payouts,
    policies,
    policy_requests,
    policy_types,
    premium,
    risk_assessment,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown of the application."""
    init_pool()
    yield
    close_pool()


app = FastAPI(
    title="EnsureVault API",
    description=(
        "Insurance Policy & Claims Processing System — "
        "Backend API for Policy Management, Risk Assessment, and Premium Calculation."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "EnsureVault API", "version": "0.1.0"}


app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
app.include_router(policy_types.router, prefix=settings.API_V1_PREFIX)
app.include_router(policies.router, prefix=settings.API_V1_PREFIX)
app.include_router(policy_requests.router, prefix=settings.API_V1_PREFIX)
app.include_router(risk_assessment.router, prefix=settings.API_V1_PREFIX)
app.include_router(premium.router, prefix=settings.API_V1_PREFIX)
app.include_router(payouts.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(agents.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
