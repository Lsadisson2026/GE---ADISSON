create or replace view daily_collection_list as
select
  i.id as installment_id,
  c.name as client_name,
  c.phone as client_phone,
  c.address as client_address,
  i.amount as total_amount,
  i.paid_amount,
  (i.amount - i.paid_amount) as pending_value,
  l.payment_type,
  i.status,
  i.due_date,
  l.capital as loan_capital,
  (select coalesce(sum(amount - paid_amount), 0) from installments where loan_id = l.id and status != 'PAID') as loan_debt
from installments i
join loans l on i.loan_id = l.id
join clients c on l.client_id = c.id
where i.due_date = current_date
  and l.status = 'ACTIVE';
