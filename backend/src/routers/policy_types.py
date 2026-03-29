from fastapi import APIRouter, Depends, HTTPException, Query
from mysql.connector import MySQLConnection
from src.database import get_db
from src.models.policy_type import (
    PolicyTypeCreate,
    PolicyTypeUpdate,
    PolicyTypeResponse,
)
from src.models.common import APIResponse

router = APIRouter(prefix="/policy-types", tags=["Policy Types"])


@router.get("/", response_model=APIResponse)
def list_policy_types(db: MySQLConnection = Depends(get_db)):
    """List all available insurance plan types (Health, Car, Home)."""
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM policy_type ORDER BY type_id")
    rows = cursor.fetchall()
    cursor.close()
    return APIResponse(
        success=True,
        message=f"Found {len(rows)} policy types",
        data=[PolicyTypeResponse(**row) for row in rows],
    )


@router.get("/{type_id}", response_model=APIResponse)
def get_policy_type(type_id: int, db: MySQLConnection = Depends(get_db)):
    """Get a specific insurance plan type by ID."""
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


@router.post("/", response_model=APIResponse, status_code=201)
def create_policy_type(
    body: PolicyTypeCreate,
    db: MySQLConnection = Depends(get_db),
):
    """Create a new insurance plan type. (Admin only)"""
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


@router.put("/{type_id}", response_model=APIResponse)
def update_policy_type(
    type_id: int,
    body: PolicyTypeUpdate,
    db: MySQLConnection = Depends(get_db),
):
    """Update an existing insurance plan type. (Admin only)"""
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


@router.delete("/{type_id}", response_model=APIResponse)
def delete_policy_type(type_id: int, db: MySQLConnection = Depends(get_db)):
    """Delete an insurance plan type. (Admin only)"""
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
