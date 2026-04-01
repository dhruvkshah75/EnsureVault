from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from typing import Any
from src.database import get_db
from src.models.payout import (
    ApproveClaimRequest,
    PremiumPaymentRequest,
    ApproveClaimResponse,
    PremiumPaymentResponse,
    PaymentRecord,
)
from src.models.common import APIResponse, ErrorResponse

router = APIRouter(prefix="/payouts", tags=["Payouts & Finance"])


@router.post(
    "/claims/{claim_id}/approve",
    response_model=APIResponse,
    summary="Approve a claim and issue payout",
    description=(
        "Atomically approve a claim and insert a payout payment record. "
        "Uses a database transaction — both the claim status update and "
        "payment insertion succeed together or neither is saved.\n\n"
        "**Constraints:**\n"
        "- Claim must be in `Pending` or `Under Review` status.\n"
        "- `payout_amount` must be > 0 and ≤ the policy type's `max_coverage`.\n"
        "- `payment_mode` must be one of: Credit Card, Debit Card, UPI, "
        "Net Banking, Cash."
    ),
    responses={
        200: {"description": "Claim approved and payout recorded", "model": APIResponse},
        400: {"description": "Claim not in reviewable state or payout exceeds coverage", "model": ErrorResponse},
        404: {"description": "Claim not found", "model": ErrorResponse},
        500: {"description": "Transaction failed and was rolled back", "model": ErrorResponse},
    },
)
def approve_claim(
    claim_id: int,
    body: ApproveClaimRequest,
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)

    # --- Pre-flight checks ---

    # 1. Verify claim exists and is in a reviewable state
    cursor.execute(
        "SELECT cl.claim_id, cl.status, cl.claim_amount, p.policy_id "
        "FROM claim cl "
        "JOIN policy p ON cl.policy_id = p.policy_id "
        "WHERE cl.claim_id = %s",
        (claim_id,),
    )
    claim: Any = cursor.fetchone()

    if claim is None:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    if claim["status"] not in ("Pending", "Under Review"):
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"Claim is already '{claim['status']}' and cannot be approved again",
        )

    # 2. Verify payout amount does not exceed max coverage for this policy
    cursor.execute(
        "SELECT pt.max_coverage FROM policy p "
        "JOIN policy_type pt ON p.type_id = pt.type_id "
        "WHERE p.policy_id = %s",
        (claim["policy_id"],),
    )
    coverage: Any = cursor.fetchone()

    if not coverage or body.payout_amount > coverage["max_coverage"]:
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"Payout amount exceeds max coverage of {coverage['max_coverage'] if coverage else 'N/A'}",
        )

    # --- ATOMIC TRANSACTION ---
    try:
        db.autocommit = False

        # Step 1: Update claim status to Approved
        cursor.execute(
            "UPDATE claim SET status = 'Approved' WHERE claim_id = %s",
            (claim_id,),
        )

        # Step 2: Insert payout record into payment table
        cursor.execute(
            """
            INSERT INTO payment (policy_id, amount, payment_date, payment_mode, status)
            VALUES (%s, %s, CURDATE(), %s, 'Success')
            """,
            (claim["policy_id"], body.payout_amount, body.payment_mode.value),
        )
        new_txn_id = cursor.lastrowid

        # Step 3: Deduct from Company Reserve
        cursor.execute(
            "UPDATE company_reserve SET balance = balance - %s WHERE id = 1",
            (body.payout_amount,),
        )

        db.commit()

    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(
            status_code=500,
            detail=f"Transaction failed and was rolled back: {str(e)}",
        )
    finally:
        db.autocommit = True

    cursor.close()

    return APIResponse(
        success=True,
        message=f"Claim {claim_id} approved and payout of {body.payout_amount} processed",
        data=ApproveClaimResponse(
            claim_id=claim_id,
            txn_id=new_txn_id,
            payout_amount=body.payout_amount,
        ),
    )


@router.post(
    "/policies/{policy_id}/pay-premium",
    response_model=APIResponse,
    summary="Record a premium payment",
    description=(
        "Record a premium payment for an active policy. "
        "The payment amount is derived from the policy's `premium_amount` field. "
        "Only active policies can receive premium payments.\n\n"
        "**Constraints:**\n"
        "- Policy must exist and be in `Active` status.\n"
        "- `payment_mode` must be one of: Credit Card, Debit Card, UPI, "
        "Net Banking, Cash."
    ),
    responses={
        200: {"description": "Premium payment recorded", "model": APIResponse},
        400: {"description": "Policy not active", "model": ErrorResponse},
        404: {"description": "Policy not found", "model": ErrorResponse},
        500: {"description": "Transaction failed", "model": ErrorResponse},
    },
)
def pay_premium(
    policy_id: int,
    body: PremiumPaymentRequest,
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)

    # Verify policy exists and is active
    cursor.execute(
        "SELECT policy_id, status, premium_amount FROM policy WHERE policy_id = %s",
        (policy_id,),
    )
    policy: Any = cursor.fetchone()

    if not policy:
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")

    if policy["status"] != "Active":
        cursor.close()
        raise HTTPException(
            status_code=400,
            detail=f"Policy is '{policy['status']}' — only Active policies can receive premium payments",
        )

    # --- ATOMIC TRANSACTION ---
    try:
        db.autocommit = False

        # Insert premium payment record
        cursor.execute(
            """
            INSERT INTO payment (policy_id, amount, payment_date, payment_mode, status)
            VALUES (%s, %s, CURDATE(), %s, 'Success')
            """,
            (policy_id, policy["premium_amount"], body.payment_mode.value),
        )
        new_txn_id = cursor.lastrowid

        db.commit()

    except Exception as e:
        db.rollback()
        cursor.close()
        raise HTTPException(
            status_code=500,
            detail=f"Transaction failed and was rolled back: {str(e)}",
        )
    finally:
        db.autocommit = True

    cursor.close()

    return APIResponse(
        success=True,
        message=f"Premium payment of {policy['premium_amount']} recorded for policy {policy_id}",
        data=PremiumPaymentResponse(
            policy_id=policy_id,
            txn_id=new_txn_id,
            amount=policy["premium_amount"],
        ),
    )


@router.get(
    "/policies/{policy_id}/payments",
    response_model=APIResponse,
    summary="List payment history for a policy",
    description=(
        "Retrieve all payment transactions (premiums and claim payouts) "
        "for a specific policy, ordered by most recent first."
    ),
    responses={
        200: {"description": "Payment records retrieved", "model": APIResponse},
        404: {"description": "Policy not found", "model": ErrorResponse},
    },
)
def get_policy_payments(policy_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT policy_id FROM policy WHERE policy_id = %s", (policy_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")

    cursor.execute(
        "SELECT * FROM payment WHERE policy_id = %s ORDER BY payment_date DESC",
        (policy_id,),
    )
    rows = cursor.fetchall()
    cursor.close()

    return APIResponse(
        success=True,
        message=f"Found {len(rows)} payment records",
        data=[PaymentRecord(**row) for row in rows],
    )