with staged as (
    select * from {{ ref('stg_invoices') }}
),

enriched as (
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
        created_at,

        -- Overdue: pending invoices whose due date has passed
        case
            when status = 'paid' then false
            when current_date > due_date then true
            else false
        end                                         as is_overdue,

        -- Days past due (positive = overdue, null if paid)
        case
            when status = 'paid' then null
            when current_date > due_date
                then (current_date - due_date)
            else null
        end                                         as days_past_due,

        -- Days until due (positive = future, null if paid or already overdue)
        case
            when status = 'paid' then null
            when current_date <= due_date
                then (due_date - current_date)
            else null
        end                                         as days_until_due,

        -- Amount tier for UI grouping and analytics
        case
            when amount < 10000 then 'small'
            when amount < 50000 then 'medium'
            else 'large'
        end                                         as amount_category

    from staged
)

select * from enriched
