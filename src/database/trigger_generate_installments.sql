create or replace function generate_installments_for_loan()
returns trigger as $$
declare
  v_total_interest numeric;
  v_total_amount numeric;
  v_installment_amount numeric;
  v_capital_per_installment numeric;
  v_interest_per_installment numeric;
  v_current_date date;
  i integer;
begin
  v_total_interest := new.capital * (new.interest_rate / 100.0);
  v_total_amount := new.capital + v_total_interest;
  v_installment_amount := v_total_amount / new.installments_count;
  v_capital_per_installment := new.capital / new.installments_count;
  v_interest_per_installment := v_total_interest / new.installments_count;
  
  v_current_date := new.start_date;

  for i in 1..new.installments_count loop
    insert into installments (
      loan_id,
      number,
      amount,
      capital_amount,
      interest_amount,
      due_date,
      status,
      paid_amount
    ) values (
      new.id,
      i,
      v_installment_amount,
      v_capital_per_installment,
      v_interest_per_installment,
      v_current_date,
      'PENDING',
      0
    );

    if new.payment_type = 'DAILY' then
      v_current_date := v_current_date + interval '1 day';
      if extract(dow from v_current_date) = 0 then -- Sunday
        v_current_date := v_current_date + interval '1 day';
      end if;
    elsif new.payment_type = 'WEEKLY' then
      v_current_date := v_current_date + interval '1 week';
    elsif new.payment_type = 'MONTHLY' then
      v_current_date := v_current_date + interval '1 month';
    end if;
  end loop;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_generate_installments on loans;
create trigger trg_generate_installments
after insert on loans
for each row
execute function generate_installments_for_loan();
