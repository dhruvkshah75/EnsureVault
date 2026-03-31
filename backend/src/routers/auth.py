from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.common import APIResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str


class LoginResponse(BaseModel):
    name: str
    role: str          # "customer" | "agent" | "admin"
    user_id: int
    customer_id: int | None = None


@router.post("/login", response_model=APIResponse)
def login(body: LoginRequest, db: MySQLConnection = Depends(get_db)):
    """
    Resolve a user's role from their email address.
    Checks the customer table first, then the agent table.
    Returns user info and role so the frontend can gate access accordingly.
    """
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
    cursor.execute("SELECT agent_id AS user_id, name FROM agent WHERE email = %s", (body.email,),)
    agent = cursor.fetchone()
    cursor.close()

    if agent:
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
