from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.admin import AdminDashboardResponse, AdminKPIs, LeaderboardEntry
from src.models.common import APIResponse

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
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
