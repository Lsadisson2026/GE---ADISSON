-- Function to renegotiate debt
create or replace function renegotiate_loan(
  p_client_id bigint,
  p_total_renegotiated numeric,
  p_interest_rate numeric,
  p_payment_type text,
  p_installments_count integer,
  p_start_date date
) returns bigint as $$
declare
  v_new_loan_id bigint;
  v_installment_amount numeric;
  v_capital_per_installment numeric;
  v_interest_per_installment numeric;
  v_total_interest numeric;
  v_total_amount numeric;
begin
  -- 1. Mark old active loans as RENEGOTIATED
  update loans
  set status = 'RENEGOTIATED'
  where client_id = p_client_id and status = 'ACTIVE';

  -- 2. Calculate new values
  v_total_interest := p_total_renegotiated * (p_interest_rate / 100.0);
  v_total_amount := p_total_renegotiated + v_total_interest;
  v_installment_amount := v_total_amount / p_installments_count;
  v_capital_per_installment := p_total_renegotiated / p_installments_count;
  v_interest_per_installment := v_total_interest / p_installments_count;

  -- 3. Create new loan
  insert into loans (
    client_id,
    capital,
    interest_rate,
    payment_type,
    installments_count,
    start_date,
    status,
    late_fee_enabled,
    late_fee_rate
  ) values (
    p_client_id,
    p_total_renegotiated,
    p_interest_rate,
    p_payment_type,
    p_installments_count,
    p_start_date,
    'ACTIVE',
    true,
    1.0
  ) returning id into v_new_loan_id;

  -- 4. Generate new installments
  insert into installments (
    loan_id,
    number,
    amount,
    capital_amount,
    interest_amount,
    due_date,
    status,
    paid_amount
  )
  select
    v_new_loan_id,
    s.i,
    v_installment_amount,
    v_capital_per_installment,
    v_interest_per_installment,
    case
      when p_payment_type = 'DAILY' then p_start_date + (s.i - 1) * interval '1 day'
      when p_payment_type = 'WEEKLY' then p_start_date + (s.i - 1) * interval '1 week'
      when p_payment_type = 'MONTHLY' then p_start_date + (s.i - 1) * interval '1 month'
    end,
    'PENDING',
    0
  from generate_series(1, p_installments_count) as s(i);

  -- 5. Update client score (Reset to 50 due to renegotiation)
  update clients
  set score = 50,
      status = 'ACTIVE'
  where id = p_client_id;

  return v_new_loan_id;
end;
$$ language plpgsql;
