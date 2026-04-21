from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.common import APIResponse
from src.models.premium import (
    PremiumCalculateRequest,
    PremiumCalculateResponse,
    RiskFactorsResponse,
)

router = APIRouter(prefix="/premium", tags=["Premium Calculation"])


@router.post(
    "/calculate",
    response_model=APIResponse[PremiumCalculateResponse],
    summary="Calculate Policy Premium",
    description="Calculate the premium for a customer and policy type combination using the `calculate_premium` stored procedure. Restricted to Agent and Admin roles."
)
def calculate_premium(
    body: PremiumCalculateRequest,
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor(dictionary=True)

    # Verify customer exists
    cursor.execute("SELECT customer_id FROM customer WHERE customer_id = %s", (body.customer_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Customer {body.customer_id} not found")

    # Verify policy type exists
    cursor.execute("SELECT type_id FROM policy_type WHERE type_id = %s", (body.type_id,))
    if not cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=404, detail=f"Policy type {body.type_id} not found")

    try:
        cursor.execute("CALL calculate_premium(%s, %s)", (body.customer_id, body.type_id))
        result = cursor.fetchone()
        # Consume remaining result sets
        while cursor.nextset():
            pass
    except Exception as e:
        cursor.close()
        raise HTTPException(status_code=500, detail=f"Premium calculation failed: {str(e)}")

    cursor.close()

    if not result:
        raise HTTPException(status_code=500, detail="Stored procedure returned no data")

    return APIResponse(
        success=True,
        message="Premium calculated successfully",
        data=PremiumCalculateResponse(**result),
    )


@router.get(
    "/factors/{type_id}",
    response_model=APIResponse[RiskFactorsResponse],
    summary="Get Risk Factors",
    description="Retrieve the risk factors and multipliers for a specific policy type."
)
def get_risk_factors(type_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM policy_type WHERE type_id = %s",
        (type_id,),
    )
    row = cursor.fetchone()
    cursor.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Policy type {type_id} not found")

    # Define type-specific multipliers and descriptions
    type_multipliers = {
        "Health": {"multiplier": 1.0, "desc": "Base rate. Adjusted by customer claim history."},
        "Car": {"multiplier": 1.2, "desc": "20% surcharge for vehicle risk. Adjusted by claim history."},
        "Home": {"multiplier": 0.9, "desc": "10% discount for property stability. Adjusted by claim history."},
    }

    info = type_multipliers.get(
        row["type_name"],
        {"multiplier": 1.0, "desc": "Standard rate."},
    )

    return APIResponse(
        success=True,
        message="Risk factors retrieved",
        data=RiskFactorsResponse(
            type_id=row["type_id"],
            type_name=row["type_name"],
            base_premium=row["base_premium"],
            max_coverage=row["max_coverage"],
            type_multiplier=info["multiplier"],
            description=info["desc"],
        ),
    )
