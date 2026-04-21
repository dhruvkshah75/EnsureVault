from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from mysql.connector import MySQLConnection

from src.database import get_db
from src.models.common import APIResponse, ErrorResponse
from src.models.policy import (
    NomineeResponse,
    NomineeCreate,
    PolicyCreate,
    PolicyDetailResponse,
    PolicyResponse,
    PolicyStatusUpdate,
)
from src.utils.validators import validate_date_range

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get(
    "/",
    response_model=APIResponse,
    summary="List all policies",
    description=(
        "Retrieve a paginated list of insurance policies with optional filters. "
        "Agents see their own book of business; admins see everything. "
        "Returned policies include joined customer, type, and agent names."
    ),
    responses={
        200: {
            "description": "List of policies matching the applied filters",
            "model": APIResponse,
        },
    },
)
def list_policies(
    customer_id: Optional[int] = Query(None, gt=0, description="Filter by customer ID"),
    agent_id: Optional[int] = Query(None, gt=0, description="Filter by agent ID"),
    status: Optional[str] = Query(
        None,
        description="Filter by lifecycle status (Active, Expired, Cancelled, Pending)",
    ),
    type_id: Optional[int] = Query(None, gt=0, description="Filter by policy type ID"),
    db: MySQLConnection = Depends(get_db),
):
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


@router.get(
    "/{policy_id}",
    response_model=APIResponse,
    summary="Get policy details with nominees",
    description=(
        "Retrieve a single policy by its ID together with all linked nominees. "
        "Returns a `PolicyDetailResponse` containing the policy record and a "
        "list of nominee entries."
    ),
    responses={
        200: {"description": "Policy found", "model": APIResponse},
        404: {"description": "Policy not found", "model": ErrorResponse},
    },
)
def get_policy(policy_id: int, db: MySQLConnection = Depends(get_db)):
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


@router.post(
    "/",
    response_model=APIResponse,
    status_code=201,
    summary="Create a new insurance policy",
    description=(
        "Create a new insurance policy for a customer. "
        "If `premium_amount` is omitted, the server calls the "
        "`calculate_premium` stored procedure to derive the premium "
        "based on the customer's risk profile and policy type. "
        "All foreign-key references (customer, type, agent) are validated "
        "before insertion."
    ),
    responses={
        201: {"description": "Policy created successfully", "model": APIResponse},
        400: {"description": "Validation error or DB constraint violation", "model": ErrorResponse},
        404: {"description": "Referenced customer, type, or agent not found", "model": ErrorResponse},
    },
)
def create_policy(
    body: PolicyCreate,
    db: MySQLConnection = Depends(get_db),
):
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
        raise HTTPException(status_code=400, detail=str(e)) from e

    cursor.close()

    return APIResponse(
        success=True,
        message="Policy created successfully",
        data={"policy_id": new_id, "premium_amount": premium},
    )


@router.put(
    "/{policy_id}/status",
    response_model=APIResponse,
    summary="Update policy lifecycle status",
    description=(
        "Change the lifecycle status of an existing policy. "
        "Valid transitions: Active → Cancelled, Active → Expired, etc. "
        "Admin-only operation."
    ),
    responses={
        200: {"description": "Status updated successfully", "model": APIResponse},
        400: {"description": "Invalid status value", "model": ErrorResponse},
        404: {"description": "Policy not found", "model": ErrorResponse},
    },
)
def update_policy_status(
    policy_id: int,
    body: PolicyStatusUpdate,
    db: MySQLConnection = Depends(get_db),
):
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
        raise HTTPException(status_code=400, detail=str(e)) from e
    finally:
        cursor.close()

    return APIResponse(success=True, message=f"Policy status updated to {body.status.value}")


@router.get(
    "/nominees/all",
    response_model=APIResponse,
    summary="List all nominees for a customer",
    description="Retrieve all nominees linked to any policy owned by the specified customer.",
)
def list_customer_nominees(
    customer_id: int = Query(..., gt=0),
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT n.nom_id, n.policy_id, n.nominee_name, n.relation, n.share_percent, pt.type_name as policy_type
        FROM nominee n
        JOIN policy p ON n.policy_id = p.policy_id
        JOIN policy_type pt ON p.type_id = pt.type_id
        WHERE p.customer_id = %s
        """,
        (customer_id,),
    )
    rows = cursor.fetchall()
    cursor.close()
    
    return APIResponse(
        success=True,
        message=f"Found {len(rows)} nominees",
        data=rows
    )


@router.post(
    "/nominees/",
    response_model=APIResponse,
    status_code=201,
    summary="Add a nominee to a policy",
    description="Add a beneficiary (nominee) to an existing policy with specified share percentage.",
    responses={
        201: {"description": "Nominee added successfully", "model": APIResponse},
        400: {"description": "Validation error or shares exceed 100%", "model": ErrorResponse},
        404: {"description": "Policy not found", "model": ErrorResponse},
    },
)
def add_nominee(
    body: NomineeCreate,
    db: MySQLConnection = Depends(get_db),
):
    """Add a nominee to a policy."""
    cursor = db.cursor(dictionary=True)

    # Verify policy exists
    cursor.execute("SELECT policy_id, customer_id FROM policy WHERE policy_id = %s", (body.policy_id,))
    policy = cursor.fetchone()
    if not policy:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy {body.policy_id} not found")

    # Check total share percentage doesn't exceed 100%
    cursor.execute(
        "SELECT COALESCE(SUM(share_percent), 0) as total_share FROM nominee WHERE policy_id = %s",
        (body.policy_id,),
    )
    result = cursor.fetchone()
    total_share = float(result["total_share"]) if result else 0
    
    if total_share + body.share_percent > 100:
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"Total share would exceed 100%. Current: {total_share}%, Adding: {body.share_percent}%"
        )

    try:
        # Add the nominee
        cursor.execute(
            """
            INSERT INTO nominee (policy_id, nominee_name, relation, share_percent)
            VALUES (%s, %s, %s, %s)
            """,
            (body.policy_id, body.nominee_name, body.relation, body.share_percent),
        )
        db.commit()
        nominee_id = cursor.lastrowid

    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e)) from e

    cursor.close()

    return APIResponse(
        success=True,
        message="Nominee added successfully",
        data={
            "nom_id": nominee_id,
            "policy_id": body.policy_id,
            "nominee_name": body.nominee_name,
            "relation": body.relation,
            "share_percent": body.share_percent,
        },
    )


@router.delete(
    "/nominees/{nom_id}",
    response_model=APIResponse,
    summary="Delete a nominee from a policy",
    description="Remove a beneficiary from a policy.",
    responses={
        200: {"description": "Nominee deleted successfully", "model": APIResponse},
        404: {"description": "Nominee not found", "model": ErrorResponse},
    },
)
def delete_nominee(
    nom_id: int,
    db: MySQLConnection = Depends(get_db),
):
    """Delete a nominee."""
    cursor = db.cursor()

    # Verify nominee exists
    cursor.execute("SELECT nom_id FROM nominee WHERE nom_id = %s", (nom_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Nominee {nom_id} not found")

    try:
        # Delete the nominee
        cursor.execute("DELETE FROM nominee WHERE nom_id = %s", (nom_id,))
        db.commit()
    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e)) from e

    cursor.close()

    return APIResponse(
        success=True,
        message="Nominee deleted successfully",
        data={"nom_id": nom_id},
    )
