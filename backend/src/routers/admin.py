from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from pydantic import BaseModel

from src.database import get_db
from src.models.admin import AdminDashboardResponse, AdminKPIs, LeaderboardEntry
from src.models.common import APIResponse

class ClaimsManagerCreate(BaseModel):
    name: str
    region: str
    specialization: str

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/dashboard",
    response_model=APIResponse,
    summary="Get Admin dashboard data",
    description="Retrieve aggregate KPIs and the agent leaderboard for the main admin view.",
)
def get_admin_dashboard(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    try:
        # 1. Fetch KPIs
        # Total Revenue (Successful payments)
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payment WHERE status = 'Success'")
        total_revenue = cursor.fetchone()["total_revenue"]

        # Active Policies
        cursor.execute("SELECT COUNT(*) as active_count FROM policy WHERE status = 'Active'")
        active_policies = cursor.fetchone()["active_count"]

        # Payouts & Claim Counts
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'Approved' THEN claim_amount ELSE 0 END), 0) as total_payouts,
                COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count
            FROM claim
        """)
        claim_stats = cursor.fetchone()

        # Company Reserve
        cursor.execute("SELECT balance FROM company_reserve WHERE id = 1")
        reserve_row = cursor.fetchone()
        reserve_balance = reserve_row["balance"] if reserve_row else 0.0

        kpis = AdminKPIs(
            total_revenue=float(total_revenue),
            active_policies=int(active_policies),
            total_payouts=float(claim_stats["total_payouts"]),
            approved_claims_count=int(claim_stats["approved_count"]),
            rejected_claims_count=int(claim_stats["rejected_count"]),
            reserve_balance=float(reserve_balance)
        )

        # 2. Fetch Leaderboard from View
        cursor.execute("SELECT * FROM v_agent_leaderboard LIMIT 10")
        leaderboard_rows = cursor.fetchall()
        
        leaderboard = [LeaderboardEntry(**row) for row in leaderboard_rows]

        return APIResponse(
            success=True,
            message="Dashboard data retrieved",
            data=AdminDashboardResponse(kpis=kpis, leaderboard=leaderboard)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
        cursor.close()


@router.post(
    "/claims-managers/",
    response_model=APIResponse,
    summary="Create a new claims manager",
    description="Admin endpoint to create a new claims manager.",
)
def create_claims_manager(body: ClaimsManagerCreate, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    try:
        # Check if claims_manager table exists, if not create it
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS claims_manager (
                manager_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                region VARCHAR(100),
                specialization VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Insert new claims manager
        cursor.execute(
            "INSERT INTO claims_manager (name, region, specialization) VALUES (%s, %s, %s)",
            (body.name, body.region, body.specialization)
        )
        db.commit()
        
        manager_id = cursor.lastrowid
        
        return APIResponse(
            success=True,
            message="Claims Manager created successfully",
            data={"manager_id": manager_id, "name": body.name}
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create claims manager: {str(e)}") from e
    finally:
        cursor.close()

