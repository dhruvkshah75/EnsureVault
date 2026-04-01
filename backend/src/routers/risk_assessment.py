from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from mysql.connector import MySQLConnection

from src.database import get_db
from src.models.claim import (
    ClaimAssessmentResponse,
    ClaimCreate,
    ClaimDecisionRequest,
    ClaimResponse,
    ClaimStatus,
    DocumentCreate,
    DocumentResponse,
)
from src.models.common import APIResponse, ErrorResponse

router = APIRouter(prefix="/claims", tags=["Risk Assessment"])


@router.get(
    "/",
    response_model=APIResponse,
    summary="List all claims",
    description=(
        "Retrieve all insurance claims with optional filtering by customer. "
        "Includes joined customer name and policy type for each claim. "
        "Ordered by most recent first."
    ),
    responses={
        200: {"description": "List of claims", "model": APIResponse},
    },
)
def list_claims(
    customer_id: Optional[int] = Query(None, gt=0, description="Filter by customer ID"),
    agent_id: Optional[int] = Query(None, gt=0, description="Filter by agent ID"),
    region: Optional[str] = Query(None, description="Filter by agent region"),
    policy_type: Optional[str] = Query(None, description="Filter by policy type name"),
    start_date: Optional[date] = Query(None, description="Start of incident date range"),
    end_date: Optional[date] = Query(None, description="End of incident date range"),
    status: Optional[str] = Query(None, description="Filter by claim status"),
    db: MySQLConnection = Depends(get_db),
):
    query = """
        SELECT
            cl.claim_id, cl.policy_id, c.full_name AS customer_name,
            pt.type_name AS policy_type, cl.incident_date,
            cl.claim_amount, cl.status, cl.rejection_reason
        FROM claim cl
        JOIN policy p ON cl.policy_id = p.policy_id
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
    if region:
        query += " AND a.region = %s"
        params.append(region)
    if policy_type:
        query += " AND pt.type_name = %s"
        params.append(policy_type)
    if start_date:
        query += " AND cl.incident_date >= %s"
        params.append(start_date)
    if end_date:
        query += " AND cl.incident_date <= %s"
        params.append(end_date)
    if status:
        query += " AND cl.status = %s"
        params.append(status)

    query += " ORDER BY cl.claim_id DESC"

    cursor = db.cursor(dictionary=True)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    return APIResponse(
        success=True,
        message=f"Found {len(rows)} claims",
        data=[ClaimResponse(**row) for row in rows],
    )


@router.post(
    "/",
    response_model=APIResponse,
    status_code=201,
    summary="Submit a new insurance claim",
    description=(
        "File a new claim against an active policy. "
        "The claim starts in `Pending` status.\n\n"
        "**Constraints:**\n"
        "- `policy_id` — must reference an existing, **Active** policy.\n"
        "- `incident_date` — date the incident occurred (YYYY-MM-DD).\n"
        "- `claim_amount` — must be > 0 and ≤ 100,000,000."
    ),
    responses={
        201: {"description": "Claim submitted successfully", "model": APIResponse},
        400: {"description": "Policy is not active or validation error", "model": ErrorResponse},
        404: {"description": "Policy not found", "model": ErrorResponse},
    },
)
def create_claim(body: ClaimCreate, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT policy_id, status FROM policy WHERE policy_id = %s", (body.policy_id,))
    policy = cursor.fetchone()
    if not policy:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy {body.policy_id} not found")
    if policy["status"] != "Active":
        cursor.close()
        raise HTTPException(status_code=400, detail="Claims can only be filed on Active policies")

    try:
        cursor.execute(
            "INSERT INTO claim (policy_id, incident_date, claim_amount, status) VALUES (%s, %s, %s, 'Pending')",
            (body.policy_id, body.incident_date, body.claim_amount),
        )
        db.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e)) from e

    cursor.close()
    return APIResponse(success=True, message="Claim submitted successfully", data={"claim_id": new_id})


@router.get(
    "/pending",
    response_model=APIResponse,
    summary="List pending / under-review claims",
    description=(
        "Return all claims that are still awaiting adjuster review "
        "(status = Pending or Under Review). Ordered by incident date "
        "ascending so oldest claims appear first."
    ),
    responses={
        200: {"description": "Pending claims list", "model": APIResponse},
    },
)
def list_pending_claims(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        """
        SELECT
            cl.claim_id, cl.policy_id, c.full_name AS customer_name,
            pt.type_name AS policy_type, cl.incident_date,
            cl.claim_amount, cl.status, cl.rejection_reason
        FROM claim cl
        JOIN policy p ON cl.policy_id = p.policy_id
        JOIN customer c ON p.customer_id = c.customer_id
        JOIN policy_type pt ON p.type_id = pt.type_id
        WHERE cl.status IN ('Pending', 'Under Review')
        ORDER BY cl.incident_date ASC
        """
    )
    rows = cursor.fetchall()
    cursor.close()

    return APIResponse(
        success=True,
        message=f"Found {len(rows)} pending claims",
        data=[ClaimResponse(**row) for row in rows],
    )


@router.get(
    "/{claim_id}/assess",
    response_model=APIResponse,
    summary="Run automated risk assessment on a claim",
    description=(
        "Call the `assess_claim_risk` stored procedure to compute a risk "
        "score for the given claim. The response includes the coverage "
        "ratio, historical claim count, days since policy start, computed "
        "risk level (LOW / MEDIUM / HIGH), and a recommended action."
    ),
    responses={
        200: {"description": "Risk assessment completed", "model": APIResponse},
        404: {"description": "Claim not found", "model": ErrorResponse},
        500: {"description": "Stored procedure execution failed", "model": ErrorResponse},
    },
)
def assess_claim_risk(claim_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    # Verify claim exists
    cursor.execute("SELECT claim_id FROM claim WHERE claim_id = %s", (claim_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    try:
        cursor.execute("CALL assess_claim_risk(%s)", (claim_id,))
        result = cursor.fetchone()
        # Consume remaining result sets
        while cursor.nextset():
            pass
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}") from e

    cursor.close()

    if not result:
        raise HTTPException(status_code=500, detail="Stored procedure returned no data")

    return APIResponse(
        success=True,
        message="Risk assessment completed",
        data=ClaimAssessmentResponse(**result),
    )


@router.get(
    "/{claim_id}/documents",
    response_model=APIResponse,
    summary="Get documents for a claim",
    description=(
        "Retrieve all supporting documents uploaded for a specific claim. "
        "Each document includes its type and file URL."
    ),
    responses={
        200: {"description": "Documents retrieved", "model": APIResponse},
        404: {"description": "Claim not found", "model": ErrorResponse},
    },
)
def get_claim_documents(claim_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT claim_id FROM claim WHERE claim_id = %s", (claim_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    cursor.execute(
        "SELECT * FROM document WHERE claim_id = %s ORDER BY doc_id",
        (claim_id,),
    )
    rows = cursor.fetchall()
    cursor.close()

    return APIResponse(
        success=True,
        message=f"Found {len(rows)} documents",
        data=[DocumentResponse(**row) for row in rows],
    )


@router.post(
    "/{claim_id}/documents",
    response_model=APIResponse,
    status_code=201,
    summary="Add a document to a claim",
    description="Link a supporting document (type and URL) to an existing claim.",
)
def add_claim_document(claim_id: int, body: DocumentCreate, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    
    # Verify claim exists
    cursor.execute("SELECT claim_id FROM claim WHERE claim_id = %s", (claim_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    try:
        cursor.execute(
            "INSERT INTO document (claim_id, doc_type, file_url) VALUES (%s, %s, %s)",
            (claim_id, body.doc_type, body.file_url)
        )
        db.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=str(e)) from e

    cursor.close()
    return APIResponse(success=True, message="Document added successfully", data={"doc_id": new_id})


@router.put(
    "/{claim_id}/decision",
    response_model=APIResponse,
    summary="Approve or reject a claim",
    description=(
        "Record a decision on a claim. Only claims in `Pending` or "
        "`Under Review` status can be decided.\n\n"
        "**Rules:**\n"
        "- `status` must be `Approved` or `Rejected`.\n"
        "- `rejection_reason` is **required** when rejecting (1–500 chars).\n"
        "- Already-decided claims cannot be reviewed again."
    ),
    responses={
        200: {"description": "Decision recorded", "model": APIResponse},
        400: {"description": "Invalid decision or claim not in reviewable state", "model": ErrorResponse},
        404: {"description": "Claim not found", "model": ErrorResponse},
    },
)
def decide_claim(
    claim_id: int,
    body: ClaimDecisionRequest,
    db: MySQLConnection = Depends(get_db),
):
    # Validate decision
    if body.status not in (ClaimStatus.APPROVED, ClaimStatus.REJECTED):
        raise HTTPException(
            status_code=400,
            detail="Decision must be 'Approved' or 'Rejected'",
        )

    if body.status == ClaimStatus.REJECTED and not body.rejection_reason:
        raise HTTPException(
            status_code=400,
            detail="rejection_reason is required when rejecting a claim",
        )

    cursor = db.cursor(dictionary=True)

    # Verify claim is in reviewable state
    cursor.execute(
        "SELECT status FROM claim WHERE claim_id = %s",
        (claim_id,),
    )
    row = cursor.fetchone()

    if not row:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    if row["status"] not in ("Pending", "Under Review"):
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"Claim is already '{row['status']}' and cannot be reviewed again",
        )

    # --- ATOMIC TRANSACTION ---
    try:
        db.autocommit = False

        # Check if we should deduct from reserve
        target_status = str(body.status.value if hasattr(body.status, "value") else body.status).strip()
        if target_status == "Approved":
            # Fetch claim amount BEFORE updating status (cleaner)
            cursor.execute("SELECT claim_amount FROM claim WHERE claim_id = %s", (claim_id,))
            amt_row = cursor.fetchone()
            claim_amt = float(amt_row["claim_amount"]) if amt_row else 0.0

            # Deduct from reserve (id=1)
            cursor.execute(
                "UPDATE company_reserve SET balance = balance - %s WHERE id = 1",
                (claim_amt,)
            )

            # Check for insufficient funds
            cursor.execute("SELECT balance FROM company_reserve WHERE id = 1")
            res_bal = cursor.fetchone()
            if res_bal and res_bal["balance"] < 0:
                raise Exception("Insufficient funds in company reserve")

        # Update claim status
        cursor.execute(
            """
            UPDATE claim
            SET status = %s, rejection_reason = %s
            WHERE claim_id = %s
            """,
            (body.status.value, body.rejection_reason, claim_id),
        )

        db.commit()

    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(status_code=400, detail=f"Decision failed and was rolled back: {str(e)}") from e
    finally:
        db.autocommit = True

    cursor.close()
    action = "approved" if body.status == ClaimStatus.APPROVED else "rejected"
    return APIResponse(success=True, message=f"Claim {claim_id} has been {action}")
