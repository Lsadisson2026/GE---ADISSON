create or replace view financial_indicators as
select
  l.id as loan_id,
  l.created_at,
  l.capital as "totalLoaned",
  coalesce((select sum(paid_amount) from installments where loan_id = l.id and status = 'PAID'), 0) as "totalReceived",
  coalesce((select sum(interest_amount) from installments where loan_id = l.id and status = 'PAID'), 0) as "totalInterest",
  coalesce((select sum(amount - paid_amount) from installments where loan_id = l.id and status != 'PAID'), 0) as "openCapital",
  1 as "loanCount",
  l.client_id as "client_id",
  (case when exists (select 1 from installments where loan_id = l.id and status = 'LATE') then 1 else 0 end) as "isLate"
from loans l
where l.status = 'ACTIVE';
