from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.auth import LoginRequest, LoginResponse
from src.models.common import APIResponse, ErrorResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=APIResponse,
    summary="Authenticate user by email",
    description=(
        "Resolve a user's identity and role from their email address. "
        "The lookup order is:\n"
        "1. **Customer table** — match by `email` column.\n"
        "2. **Agent table** — match by derived email "
        "(`lowercase(name).replace(' ', '.') + '@ensurevault.com'`).\n"
        "3. **Admin** — hardcoded demo account `admin@ensurevault.com`.\n\n"
        "Returns the user's name, role, and ID so the frontend can gate "
        "access accordingly."
    ),
    responses={
        200: {"description": "Login successful", "model": APIResponse},
        401: {"description": "No account found for this email", "model": ErrorResponse},
    },
)
def login(body: LoginRequest, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    # 1. Check if email belongs to a customer
    cursor.execute(
        "SELECT customer_id AS user_id, full_name AS name FROM customer WHERE email = %s",
        (body.email,),
    )
    customer = cursor.fetchone()
    if customer:
        cursor.close()
        return APIResponse(
            success=True,
            message="Login successful",
            data=LoginResponse(
                name=customer["name"],
                role="customer",
                user_id=customer["user_id"],
                customer_id=customer["user_id"],
            ),
        )

    # 2. Check if email belongs to an agent
    cursor.execute("SELECT agent_id AS user_id, name FROM agent", [])
    agents = cursor.fetchall()
    cursor.close()

    for agent in agents:
        derived_email = agent["name"].lower().replace(" ", ".") + "@ensurevault.com"
        if body.email.lower() == derived_email:
            return APIResponse(
                success=True,
                message="Login successful",
                data=LoginResponse(
                    name=agent["name"],
                    role="agent",
                    user_id=agent["user_id"],
                ),
            )

    # 3. Check for admin (hardcoded for demo)
    if body.email.lower() == "admin@ensurevault.com":
        return APIResponse(
            success=True,
            message="Login successful",
            data=LoginResponse(name="Admin", role="admin", user_id=0),
        )

    raise HTTPException(status_code=401, detail="No account found with this email address.")
