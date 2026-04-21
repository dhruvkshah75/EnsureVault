from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from mysql.connector import MySQLConnection

from src.database import get_db
from src.models.common import APIResponse, ErrorResponse
from src.models.policy_request import (
    PolicyRequestApprovalRequest,
    PolicyRequestCreate,
    PolicyRequestRejectionRequest,
    PolicyRequestResponse,
)
from src.utils.validators import validate_date_range

router = APIRouter(prefix="/policies/requests", tags=["Policy Requests"])


@router.post(
    "/",
    response_model=APIResponse,
    status_code=201,
    summary="Customer requests a policy",
    description=(
        "Customer submits a request to purchase a policy. The request is created with "
        "status 'Pending' and automatically linked to the customer's assigned agent. "
        "If premium_amount is omitted, the server calculates it. "
        "Request fails if customer KYC status is not 'Verified'."
    ),
    responses={
        201: {"description": "Policy request created successfully", "model": APIResponse},
        400: {
            "description": "Validation error or database constraint violation",
            "model": ErrorResponse,
        },
        404: {"description": "Policy type not found or customer has no agent", "model": ErrorResponse},
    },
)
def request_policy(
    body: PolicyRequestCreate,
    db: MySQLConnection = Depends(get_db),
):
    """Customer requests to purchase a policy."""
    validate_date_range(body.start_date, body.end_date)

    cursor = db.cursor(dictionary=True)

    # Use customer_id from request body
    customer_id = body.customer_id

    # Verify customer exists
    cursor.execute("SELECT customer_id, agent_id, kyc_status FROM customer WHERE customer_id = %s", (customer_id,))
    customer = cursor.fetchone()
    if not customer:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    # Verify KYC status is Verified
    if customer["kyc_status"] != "Verified":
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"KYC verification required. Current status: {customer['kyc_status']}",
        )

    # Verify policy type exists
    cursor.execute("SELECT type_id FROM policy_type WHERE type_id = %s", (body.type_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy type {body.type_id} not found")

    # Auto-calculate premium if not provided
    premium = body.premium_amount
    if premium is None:
        cursor.execute("CALL calculate_premium(%s, %s)", (customer_id, body.type_id))
        result = cursor.fetchone()
        premium = result["calculated_premium"] if result else 0
        # Consume any remaining result sets
        while cursor.nextset():
            pass

    try:
        # Create the policy request
        cursor.execute(
            """
            INSERT INTO policy_request (customer_id, type_id, start_date, end_date, premium_amount)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (customer_id, body.type_id, body.start_date, body.end_date, premium),
        )
        db.commit()
        new_request_id = cursor.lastrowid

        # Log the creation
        cursor.execute(
            """
            INSERT INTO policy_request_log (request_id, action, performed_by)
            VALUES (%s, 'Created', NULL)
            """,
            (new_request_id,),
        )
        db.commit()

    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e)) from e

    cursor.close()

    return APIResponse(
        success=True,
        message="Policy request submitted successfully. Agent will review shortly.",
        data={
            "request_id": new_request_id,
            "status": "Pending",
            "premium_amount": premium,
            "agent_id": customer["agent_id"],
        },
    )


@router.get(
    "/pending",
    response_model=APIResponse,
    summary="List pending policy requests for agent",
    description=(
        "Retrieve all pending policy requests for the authenticated agent's customers. "
        "Only shows requests with status 'Pending'. Ordered by request date (newest first)."
    ),
    responses={
        200: {"description": "List of pending requests", "model": APIResponse},
        404: {"description": "Agent not found", "model": ErrorResponse},
    },
)
def list_pending_requests(
    agent_id: int = Query(..., gt=0, description="Agent ID"),
    db: MySQLConnection = Depends(get_db),
):
    """List pending policy requests for an agent."""
    cursor = db.cursor(dictionary=True)

    # Verify agent exists
    cursor.execute("SELECT agent_id FROM agent WHERE agent_id = %s", (agent_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    # Get pending requests
    cursor.execute(
        """
        SELECT
            pr.request_id, pr.customer_id, c.full_name AS customer_name, c.email AS customer_email,
            pr.agent_id, pr.type_id, pt.type_name,
            pr.start_date, pr.end_date, pr.premium_amount, pr.status,
            pr.requested_at
        FROM policy_request pr
        JOIN customer c ON pr.customer_id = c.customer_id
        JOIN policy_type pt ON pr.type_id = pt.type_id
        WHERE pr.agent_id = %s AND pr.status = 'Pending'
        ORDER BY pr.requested_at DESC
        """,
        (agent_id,),
    )
    rows = cursor.fetchall()
    cursor.close()

    return APIResponse(
        success=True,
        message=f"Found {len(rows)} pending policy requests",
        data=rows,
    )


@router.get(
    "/{request_id}",
    response_model=APIResponse,
    summary="Get policy request details",
    description="Retrieve details of a specific policy request including customer and policy type information.",
    responses={
        200: {"description": "Request found", "model": APIResponse},
        404: {"description": "Request not found", "model": ErrorResponse},
    },
)
def get_request_details(
    request_id: int = Path(..., gt=0, description="Policy request ID"),
    db: MySQLConnection = Depends(get_db),
):
    """Get details of a specific policy request."""
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            pr.request_id, pr.customer_id, c.full_name AS customer_name, c.email AS customer_email, c.kyc_status,
            pr.agent_id, a.name AS agent_name,
            pr.type_id, pt.type_name,
            pr.start_date, pr.end_date, pr.premium_amount, pr.status,
            pr.requested_at, pr.reviewed_at, pr.reviewed_by, pr.rejection_reason
        FROM policy_request pr
        JOIN customer c ON pr.customer_id = c.customer_id
        JOIN agent a ON pr.agent_id = a.agent_id
        JOIN policy_type pt ON pr.type_id = pt.type_id
        WHERE pr.request_id = %s
        """,
        (request_id,),
    )
    request = cursor.fetchone()
    cursor.close()

    if not request:
        raise HTTPException(status_code=404, detail=f"Policy request {request_id} not found")

    return APIResponse(
        success=True,
        message="Request found",
        data=request,
    )


@router.post(
    "/{request_id}/approve",
    response_model=APIResponse,
    summary="Agent approves a policy request",
    description=(
        "Agent approves a pending policy request. This creates the actual policy record "
        "and marks the request as 'Approved'. The policy status is set to 'Active'."
    ),
    responses={
        200: {"description": "Request approved and policy created", "model": APIResponse},
        400: {"description": "Request already processed or validation error", "model": ErrorResponse},
        404: {"description": "Request not found", "model": ErrorResponse},
    },
)
def approve_request(
    request_id: int,
    body: PolicyRequestApprovalRequest,
    db: MySQLConnection = Depends(get_db),
):
    """Agent approves a policy request and creates the policy."""
    cursor = db.cursor(dictionary=True)

    try:
        # Call the stored procedure
        cursor.callproc("approve_policy_request", (request_id, body.reviewed_by))

        # Fetch the result
        result = cursor.fetchone()
        created_policy_id = result["created_policy_id"] if result else None

        db.commit()

    except Exception as e:
        db.rollback()
        cursor.close()
        error_msg = str(e)
        if "45004" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Policy request not found or already processed",
            ) from e
        raise HTTPException(status_code=400, detail=error_msg) from e

    cursor.close()

    return APIResponse(
        success=True,
        message="Policy request approved successfully",
        data={
            "request_id": request_id,
            "status": "Approved",
            "created_policy_id": created_policy_id,
        },
    )


@router.post(
    "/{request_id}/reject",
    response_model=APIResponse,
    summary="Agent rejects a policy request",
    description=(
        "Agent rejects a pending policy request. This marks the request as 'Rejected' "
        "and stores the rejection reason for audit trail."
    ),
    responses={
        200: {"description": "Request rejected successfully", "model": APIResponse},
        400: {"description": "Request already processed or validation error", "model": ErrorResponse},
        404: {"description": "Request not found", "model": ErrorResponse},
    },
)
def reject_request(
    request_id: int,
    body: PolicyRequestRejectionRequest,
    db: MySQLConnection = Depends(get_db),
):
    """Agent rejects a policy request."""
    cursor = db.cursor()

    try:
        # Call the stored procedure
        cursor.callproc("reject_policy_request", (request_id, body.reviewed_by, body.rejection_reason))
        db.commit()

    except Exception as e:
        db.rollback()
        cursor.close()
        error_msg = str(e)
        if "45004" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Policy request not found or already processed",
            ) from e
        raise HTTPException(status_code=400, detail=error_msg) from e

    cursor.close()

    return APIResponse(
        success=True,
        message="Policy request rejected successfully",
        data={
            "request_id": request_id,
            "status": "Rejected",
            "rejection_reason": body.rejection_reason,
        },
    )
