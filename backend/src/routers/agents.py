from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.agent import AgentCreate, AgentResponse
from src.models.common import APIResponse

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get(
    "/{agent_id}",
    response_model=APIResponse,
    summary="Get Agent Details",
    description="Fetch details of a specific agent including total commission earned.",
)
def get_agent(agent_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    
    # Get basic agent info
    cursor.execute(
        "SELECT agent_id, name, commission_rate, region FROM agent WHERE agent_id = %s",
        (agent_id,)
    )
    agent = cursor.fetchone()
    if not agent:
        cursor.close()
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # Calculate commission from all their sold policies
    cursor.execute(
        "SELECT SUM(premium_amount) as total_premium FROM policy WHERE agent_id = %s",
        (agent_id,)
    )
    result = cursor.fetchone()
    total_premium = result["total_premium"] if result and result["total_premium"] else 0
    
    total_earned = total_premium * (agent["commission_rate"] / 100)
    agent["total_commission_earned"] = total_earned
    
    cursor.close()
    return APIResponse(
        success=True,
        message="Agent details retrieved",
        data=AgentResponse(**agent)
    )

@router.get(
    "/{agent_id}/customers",
    response_model=APIResponse,
    summary="Get Agent Customers",
    description="Fetch a list of all customers onboarded by this agent.",
)
def get_agent_customers(agent_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT customer_id, full_name, email, kyc_status FROM customer WHERE agent_id = %s",
        (agent_id,)
    )
    customers = cursor.fetchall()
    cursor.close()
    
    return APIResponse(
        success=True,
        message=f"Found {len(customers)} customers",
        data=customers
    )

@router.post(
    "/",
    response_model=APIResponse,
    summary="Create a new agent",
    description="Allows an admin to add a new agent to the system.",
    responses={
        200: {"description": "Agent created successfully", "model": APIResponse},
        500: {"description": "Failed to create agent"},
    },
)
def create_agent(body: AgentCreate, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    try:
        cursor.execute(
            "INSERT INTO agent (name, commission_rate, region) VALUES (%s, %s, %s)",
            (body.name, body.commission_rate, body.region)
        )
        db.commit()
    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=500, detail="Failed to create agent.")
        
    cursor.close()
    return APIResponse(
        success=True,
        message="Agent created successfully"
    )
