with source as (
    select * from {{ ref('raw_invoices') }}
)

select
    invoice_id::text                            as invoice_id,
    trim(vendor_name::text)                     as vendor_name,
    vendor_id::text                             as vendor_id,
    invoice_date::date                          as invoice_date,
    due_date::date                              as due_date,
    amount::numeric(14, 2)                      as amount,
    upper(trim(currency::text))                 as currency,
    lower(trim(status::text))                   as status,
    nullif(trim(description::text), '')         as description,
    created_at::timestamptz                     as created_at
from source
