from fastapi import APIRouter, Depends, HTTPException
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.policy_type import (
    PolicyTypeCreate,
    PolicyTypeUpdate,
    PolicyTypeResponse,
)
from src.models.common import APIResponse, ErrorResponse

router = APIRouter(prefix="/policy-types", tags=["Policy Types"])


@router.get(
    "/",
    response_model=APIResponse,
    summary="List all policy types",
    description=(
        "Return every insurance plan category (Health, Car, Home) with its "
        "base premium and maximum coverage. No authentication required."
    ),
    responses={
        200: {"description": "All policy types returned", "model": APIResponse},
    },
)
def list_policy_types(db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM policy_type ORDER BY type_id")
    rows = cursor.fetchall()
    cursor.close()
    return APIResponse(
        success=True,
        message=f"Found {len(rows)} policy types",
        data=[PolicyTypeResponse(**row) for row in rows],
    )


@router.get(
    "/{type_id}",
    response_model=APIResponse,
    summary="Get a policy type by ID",
    description=(
        "Retrieve a single insurance plan type including its base premium and "
        "maximum coverage limit."
    ),
    responses={
        200: {"description": "Policy type found", "model": APIResponse},
        404: {"description": "Policy type not found", "model": ErrorResponse},
    },
)
def get_policy_type(type_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM policy_type WHERE type_id = %s", (type_id,))
    row = cursor.fetchone()
    cursor.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Policy type {type_id} not found")

    return APIResponse(
        success=True,
        message="Policy type found",
        data=PolicyTypeResponse(**row),
    )


@router.post(
    "/",
    response_model=APIResponse,
    status_code=201,
    summary="Create a new policy type",
    description=(
        "Add a new insurance plan category. "
        "`type_name` must be one of Health, Car, or Home. "
        "`base_premium` must be > 0 and ≤ 1,000,000. "
        "`max_coverage` must be > 0 and ≤ 100,000,000. "
        "Admin-only operation."
    ),
    responses={
        201: {"description": "Policy type created", "model": APIResponse},
        400: {"description": "Validation error or duplicate entry", "model": ErrorResponse},
        422: {"description": "Request body failed Pydantic validation", "model": ErrorResponse},
    },
)
def create_policy_type(
    body: PolicyTypeCreate,
    db: MySQLConnection = Depends(get_db),
):
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO policy_type (type_name, base_premium, max_coverage)
            VALUES (%s, %s, %s)
            """,
            (body.type_name.value, body.base_premium, body.max_coverage),
        )
        db.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()

    return APIResponse(
        success=True,
        message="Policy type created successfully",
        data={"type_id": new_id},
    )


@router.put(
    "/{type_id}",
    response_model=APIResponse,
    summary="Update an existing policy type",
    description=(
        "Partially update an insurance plan type. Only supplied fields are "
        "changed; omitted fields remain unchanged. "
        "Admin-only operation."
    ),
    responses={
        200: {"description": "Policy type updated", "model": APIResponse},
        400: {"description": "No fields provided or DB error", "model": ErrorResponse},
        404: {"description": "Policy type not found", "model": ErrorResponse},
    },
)
def update_policy_type(
    type_id: int,
    body: PolicyTypeUpdate,
    db: MySQLConnection = Depends(get_db),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "type_name" in updates:
        updates["type_name"] = updates["type_name"].value

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [type_id]

    cursor = db.cursor()
    try:
        cursor.execute(
            f"UPDATE policy_type SET {set_clause} WHERE type_id = %s",
            values,
        )
        db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Policy type {type_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()

    return APIResponse(success=True, message="Policy type updated successfully")


@router.delete(
    "/{type_id}",
    response_model=APIResponse,
    summary="Delete a policy type",
    description=(
        "Permanently remove an insurance plan type. "
        "Will fail if existing policies reference this type. "
        "Admin-only operation."
    ),
    responses={
        200: {"description": "Policy type deleted", "model": APIResponse},
        400: {"description": "Foreign key constraint — policies still reference this type", "model": ErrorResponse},
        404: {"description": "Policy type not found", "model": ErrorResponse},
    },
)
def delete_policy_type(type_id: int, db: MySQLConnection = Depends(get_db)):
    cursor = db.cursor()
    try:
        cursor.execute("DELETE FROM policy_type WHERE type_id = %s", (type_id,))
        db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Policy type {type_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()

    return APIResponse(success=True, message="Policy type deleted successfully")
