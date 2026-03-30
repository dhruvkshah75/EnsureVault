from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from mysql.connector import MySQLConnection
from typing import Optional
from datetime import date
from src.database import get_db
from src.models.claim import (
    ClaimDecisionRequest,
    ClaimResponse,
    ClaimAssessmentResponse,
    DocumentResponse,
    ClaimStatus,
)
from src.models.common import APIResponse

router = APIRouter(prefix="/claims", tags=["Risk Assessment"])


class ClaimCreate(BaseModel):
    policy_id: int = Field(..., gt=0)
    incident_date: date
    claim_amount: float = Field(..., gt=0)


@router.get("/", response_model=APIResponse)
def list_claims(
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    db: MySQLConnection = Depends(get_db),
):
    """List all claims, optionally filtered by customer. (Customer, Agent, Admin)"""
    query = """
        SELECT
            cl.claim_id, cl.policy_id, c.full_name AS customer_name,
            pt.type_name AS policy_type, cl.incident_date,
            cl.claim_amount, cl.status, cl.rejection_reason
        FROM claim cl
        JOIN policy p ON cl.policy_id = p.policy_id
        JOIN customer c ON p.customer_id = c.customer_id
        JOIN policy_type pt ON p.type_id = pt.type_id
        WHERE 1=1
    """
    params = []
    if customer_id:
        query += " AND p.customer_id = %s"
        params.append(customer_id)
    query += " ORDER BY cl.claim_id DESC"

    cursor = db.cursor(dictionary=True)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    return APIResponse(success=True, message=f"Found {len(rows)} claims", data=rows)


@router.post("/", response_model=APIResponse, status_code=201)
def create_claim(body: ClaimCreate, db: MySQLConnection = Depends(get_db)):
    """Submit a new insurance claim for a given policy. (Customer)"""
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
        raise HTTPException(status_code=400, detail=str(e))

    cursor.close()
    return APIResponse(success=True, message="Claim submitted successfully", data={"claim_id": new_id})


@router.get("/pending", response_model=APIResponse)
def list_pending_claims(db: MySQLConnection = Depends(get_db)):
    """List all claims awaiting adjuster review. (Claims Manager)"""
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


@router.get("/{claim_id}/assess", response_model=APIResponse)
def assess_claim_risk(claim_id: int, db: MySQLConnection = Depends(get_db)):
    """
    Get an automated risk assessment for a claim by calling the
    assess_claim_risk stored procedure. (Claims Manager)
    """
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
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")

    cursor.close()

    if not result:
        raise HTTPException(status_code=500, detail="Stored procedure returned no data")

    return APIResponse(
        success=True,
        message="Risk assessment completed",
        data=ClaimAssessmentResponse(**result),
    )


@router.get("/{claim_id}/documents", response_model=APIResponse)
def get_claim_documents(claim_id: int, db: MySQLConnection = Depends(get_db)):
    """Retrieve all documents uploaded for a claim. (Claims Manager)"""
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


@router.put("/{claim_id}/decision", response_model=APIResponse)
def decide_claim(
    claim_id: int,
    body: ClaimDecisionRequest,
    db: MySQLConnection = Depends(get_db),
):
    """
    Approve or reject a claim. Rejection requires a reason. (Claims Manager)
    """
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

    try:
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
        raise HTTPException(status_code=400, detail=str(e))

    cursor.close()

    action = "approved" if body.status == ClaimStatus.APPROVED else "rejected"
    return APIResponse(success=True, message=f"Claim {claim_id} has been {action}")
