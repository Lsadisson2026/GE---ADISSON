create or replace view clients_summary as
select
  c.id,
  c.name,
  c.cpf,
  c.phone,
  c.address,
  c.notes,
  c.score,
  c.status,
  c.created_by,
  c.created_at,
  coalesce(
    (select sum(l.capital) from loans l where l.client_id = c.id and l.status = 'ACTIVE'),
    0
  ) as "totalLoaned",
  coalesce(
    (select sum(i.amount - i.paid_amount)
     from loans l
     join installments i on l.id = i.loan_id
     where l.client_id = c.id and l.status = 'ACTIVE' and i.status != 'PAID'),
    0
  ) as "totalDebt",
  coalesce(
    (select sum(i.interest_amount)
     from loans l
     join installments i on l.id = i.loan_id
     where l.client_id = c.id and i.status = 'PAID'),
    0
  ) as "totalProfit"
from clients c;

