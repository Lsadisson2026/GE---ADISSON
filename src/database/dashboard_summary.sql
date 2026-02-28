create or replace view dashboard_summary as
select
  (select coalesce(sum(amount - paid_amount), 0) from installments where due_date = current_date and status != 'PAID') as today_expected,
  (select coalesce(sum(amount), 0) from payments where date::date = current_date) as today_paid,
  (select coalesce(sum(amount - paid_amount), 0) from installments where due_date < current_date and status != 'PAID') as total_late_amount,
  (select coalesce(sum(capital), 0) from loans where status = 'ACTIVE') as total_emprestado,
  (select coalesce(sum(paid_amount), 0) from installments where status = 'PAID') as total_recebido,
  (select coalesce(sum(amount - paid_amount), 0) from installments where status != 'PAID') as total_em_aberto,
  (select coalesce(sum(interest_amount), 0) from installments) as lucro_projetado,
  (select count(distinct client_id) from loans where status = 'ACTIVE') as active_clients,
  (select count(distinct l.client_id) from loans l join installments i on l.id = i.loan_id where l.status = 'ACTIVE' and i.status != 'PAID' and i.due_date < current_date) as late_clients,
  (select count(*) from loans where status = 'ACTIVE') as loan_count;
