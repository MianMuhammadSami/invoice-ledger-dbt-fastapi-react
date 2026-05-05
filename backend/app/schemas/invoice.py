from decimal import Decimal
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    invoice_id: str
    vendor_name: str
    vendor_id: str
    invoice_date: date
    due_date: date
    amount: Decimal
    currency: str
    status: str
    description: Optional[str]
    is_overdue: bool
    days_past_due: Optional[int]
    days_until_due: Optional[int]
    amount_category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceListResponse(BaseModel):
    data: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


class InvoiceSummaryResponse(BaseModel):
    total_invoices: int
    total_amount: Decimal
    paid_count: int
    pending_count: int
    overdue_count: int
    paid_amount: Decimal
    pending_amount: Decimal
    overdue_amount: Decimal
