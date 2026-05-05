{{
  config(
    materialized='table',
    indexes=[
      {'columns': ['invoice_id'], 'unique': true},
      {'columns': ['status']},
      {'columns': ['vendor_id']},
      {'columns': ['is_overdue']},
    ]
  )
}}

with enriched as (
    select * from {{ ref('int_invoices_enriched') }}
)

select
    invoice_id,
    vendor_name,
    vendor_id,
    invoice_date,
    due_date,
    amount,
    currency,
    status,
    description,
    is_overdue,
    days_past_due,
    days_until_due,
    amount_category,
    created_at
from enriched
order by invoice_date desc, invoice_id asc
