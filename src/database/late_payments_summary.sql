create or replace view late_payments_summary as
select
  c.id as "clientId",
  c.name as "clientName",
  c.phone as "clientPhone",
  sum(i.amount - i.paid_amount) as "totalPending",
  min(i.due_date) as "oldestDueDate",
  max(p.date) as "lastPaymentDate"
from clients c
join loans l on c.id = l.client_id
join installments i on l.id = i.loan_id
left join payments p on i.id = p.installment_id
where l.status = 'ACTIVE'
  and i.status != 'PAID'
  and (i.status = 'LATE' or (i.status = 'PENDING' and i.due_date < current_date))
group by c.id, c.name, c.phone;
