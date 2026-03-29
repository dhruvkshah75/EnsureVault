from fastapi import APIRouter, Depends, HTTPException, Query
from mysql.connector import MySQLConnection
from typing import Optional
from src.database import get_db
from src.models.policy import (
    PolicyCreate,
    PolicyStatusUpdate,
    PolicyResponse,
    PolicyDetailResponse,
    NomineeResponse,
)
from src.models.common import APIResponse
from src.utils.validators import validate_date_range

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("/", response_model=APIResponse)
def list_policies(
    customer_id: Optional[int] = Query(None, description="Filter by customer"),
    agent_id: Optional[int] = Query(None, description="Filter by agent"),
    status: Optional[str] = Query(None, description="Filter by status"),
    type_id: Optional[int] = Query(None, description="Filter by policy type"),
    db: MySQLConnection = Depends(get_db),
):
    """List policies with optional filters. (Agent, Admin)"""
    query = """
        SELECT
            p.policy_id, p.customer_id, c.full_name AS customer_name,
            p.type_id, pt.type_name, p.agent_id, a.name AS agent_name,
            p.start_date, p.end_date, p.status, p.premium_amount
        FROM policy p
        JOIN customer c ON p.customer_id = c.customer_id
        JOIN policy_type pt ON p.type_id = pt.type_id
        JOIN agent a ON p.agent_id = a.agent_id
        WHERE 1=1
    """
    params = []

    if customer_id:
        query += " AND p.customer_id = %s"
        params.append(customer_id)
    if agent_id:
        query += " AND p.agent_id = %s"
        params.append(agent_id)
    if status:
        query += " AND p.status = %s"
        params.append(status)
    if type_id:
        query += " AND p.type_id = %s"
        params.append(type_id)

    query += " ORDER BY p.policy_id DESC"

    cursor = db.cursor(dictionary=True)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()

    return APIResponse(
        success=True,
        message=f"Found {len(rows)} policies",
        data=[PolicyResponse(**row) for row in rows],
    )


@router.get("/{policy_id}", response_model=APIResponse)
def get_policy(policy_id: int, db: MySQLConnection = Depends(get_db)):
    """Get a policy with its nominees."""
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            p.policy_id, p.customer_id, c.full_name AS customer_name,
            p.type_id, pt.type_name, p.agent_id, a.name AS agent_name,
            p.start_date, p.end_date, p.status, p.premium_amount
        FROM policy p
        JOIN customer c ON p.customer_id = c.customer_id
        JOIN policy_type pt ON p.type_id = pt.type_id
        JOIN agent a ON p.agent_id = a.agent_id
        WHERE p.policy_id = %s
        """,
        (policy_id,),
    )
    policy_row = cursor.fetchone()

    if not policy_row:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")

    cursor.execute(
        "SELECT * FROM nominee WHERE policy_id = %s ORDER BY nom_id",
        (policy_id,),
    )
    nominee_rows = cursor.fetchall()
    cursor.close()

    return APIResponse(
        success=True,
        message="Policy found",
        data=PolicyDetailResponse(
            policy=PolicyResponse(**policy_row),
            nominees=[NomineeResponse(**n) for n in nominee_rows],
        ),
    )


@router.post("/", response_model=APIResponse, status_code=201)
def create_policy(
    body: PolicyCreate,
    db: MySQLConnection = Depends(get_db),
):
    """Create a new policy. Premium is auto-calculated if not provided. (Agent)"""
    validate_date_range(body.start_date, body.end_date)

    cursor = db.cursor(dictionary=True)

    # Verify foreign keys exist
    cursor.execute("SELECT type_id FROM policy_type WHERE type_id = %s", (body.type_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy type {body.type_id} not found")

    cursor.execute("SELECT customer_id FROM customer WHERE customer_id = %s", (body.customer_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Customer {body.customer_id} not found")

    cursor.execute("SELECT agent_id FROM agent WHERE agent_id = %s", (body.agent_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Agent {body.agent_id} not found")

    # Auto-calculate premium if not provided
    premium = body.premium_amount
    if premium is None:
        cursor.execute("CALL calculate_premium(%s, %s)", (body.customer_id, body.type_id))
        result = cursor.fetchone()
        premium = result["calculated_premium"] if result else 0
        # Consume any remaining result sets from the stored procedure
        while cursor.nextset():
            pass

    try:
        cursor.execute(
            """
            INSERT INTO policy (customer_id, type_id, agent_id, start_date, end_date, status, premium_amount)
            VALUES (%s, %s, %s, %s, %s, 'Active', %s)
            """,
            (body.customer_id, body.type_id, body.agent_id, body.start_date, body.end_date, premium),
        )
        db.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e))

    cursor.close()

    return APIResponse(
        success=True,
        message="Policy created successfully",
        data={"policy_id": new_id, "premium_amount": premium},
    )


@router.put("/{policy_id}/status", response_model=APIResponse)
def update_policy_status(
    policy_id: int,
    body: PolicyStatusUpdate,
    db: MySQLConnection = Depends(get_db),
):
    """Change the status of a policy (activate, cancel, expire). (Admin)"""
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE policy SET status = %s WHERE policy_id = %s",
            (body.status.value, policy_id),
        )
        db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()

    return APIResponse(success=True, message=f"Policy status updated to {body.status.value}")
