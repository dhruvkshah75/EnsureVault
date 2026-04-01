from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection

from src.database import get_db
from src.models.auth import LoginRequest, LoginResponse, RegisterRequest
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

    # 4. Check for claims manager (hardcoded for demo)
    if body.email.lower() == "manager@ensurevault.com":
        return APIResponse(
            success=True,
            message="Login successful",
            data=LoginResponse(name="Claims Manager", role="claims_manager", user_id=0),
        )

    raise HTTPException(status_code=401, detail="No account found with this email address.")

@router.post(
    "/register",
    response_model=APIResponse,
    summary="Register a new customer",
    description="Creates a new customer record with the given name and email, assigned to a default agent.",
    responses={
        200: {"description": "Registration successful", "model": APIResponse},
        400: {"description": "Email already exists", "model": ErrorResponse},
    },
)
def register(body: RegisterRequest, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    
    # Check if user is trying to register an internal email
    if body.email.strip().lower().endswith("@ensurevault.com"):
        raise HTTPException(status_code=400, detail="Cannot register customer accounts with the @ensurevault.com domain.")
        
    # Check if email already exists
    cursor.execute("SELECT customer_id FROM customer WHERE email = %s", (body.email,))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    # Get a default agent (e.g., the first agent)
    if body.agent_id:
        default_agent = body.agent_id
    else:
        cursor.execute("SELECT MIN(agent_id) AS default_agent FROM agent")
        agent_row = cursor.fetchone()
        default_agent = agent_row["default_agent"] if agent_row and agent_row["default_agent"] else 1
    
    # Insert new customer
    try:
        cursor.execute(
            "INSERT INTO customer (full_name, email, kyc_status, agent_id) VALUES (%s, %s, 'Pending', %s)",
            (body.name, body.email, default_agent)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=500, detail="Failed to create account.") from e
        
    cursor.close()
    return APIResponse(
        success=True,
        message="Registration successful"
    )
