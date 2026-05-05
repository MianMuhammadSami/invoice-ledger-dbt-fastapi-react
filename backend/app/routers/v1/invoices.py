from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.schemas.invoice import InvoiceListResponse, InvoiceResponse, InvoiceSummaryResponse

router = APIRouter(prefix="/v1/invoices", tags=["invoices"])

_MART = "marts.mart_invoice_ledger"
_VALID_STATUSES = {"paid", "pending", "overdue"}


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    status: Optional[str] = Query(None, description="Filter: paid | pending | overdue"),
    search: Optional[str] = Query(None, description="Vendor name substring match"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if status is not None and status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Must be one of: {sorted(_VALID_STATUSES)}",
        )

    where_clauses: list[str] = []
    params: dict = {}

    if status == "paid":
        where_clauses.append("status = 'paid'")
    elif status == "pending":
        where_clauses.append("status = 'pending' AND is_overdue = false")
    elif status == "overdue":
        where_clauses.append("is_overdue = true")

    if search:
        where_clauses.append("vendor_name ILIKE :search")
        params["search"] = f"%{search}%"

    where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
    params["limit"] = page_size
    params["offset"] = (page - 1) * page_size

    total: int = db.execute(
        text(f"SELECT COUNT(*) FROM {_MART} {where_sql}"), params
    ).scalar_one()

    rows = db.execute(
        text(
            f"SELECT * FROM {_MART} {where_sql}"
            " ORDER BY invoice_date DESC, invoice_id ASC"
            " LIMIT :limit OFFSET :offset"
        ),
        params,
    ).mappings().all()

    return InvoiceListResponse(
        data=[InvoiceResponse.model_validate(dict(r)) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/summary", response_model=InvoiceSummaryResponse)
def get_summary(db: Session = Depends(get_db)):
    row = db.execute(
        text(f"""
            SELECT
                COUNT(*)                                                             AS total_invoices,
                COALESCE(SUM(amount), 0)                                             AS total_amount,
                COUNT(*) FILTER (WHERE status = 'paid')                              AS paid_count,
                COUNT(*) FILTER (WHERE status = 'pending' AND is_overdue = false)    AS pending_count,
                COUNT(*) FILTER (WHERE is_overdue = true)                            AS overdue_count,
                COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)              AS paid_amount,
                COALESCE(SUM(amount) FILTER (WHERE status = 'pending'
                                              AND is_overdue = false), 0)            AS pending_amount,
                COALESCE(SUM(amount) FILTER (WHERE is_overdue = true), 0)            AS overdue_amount
            FROM {_MART}
        """)
    ).mappings().one()
    return InvoiceSummaryResponse(**dict(row))


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    row = db.execute(
        text(f"SELECT * FROM {_MART} WHERE invoice_id = :invoice_id"),
        {"invoice_id": invoice_id},
    ).mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail=f"Invoice '{invoice_id}' not found")
    return InvoiceResponse.model_validate(dict(row))
