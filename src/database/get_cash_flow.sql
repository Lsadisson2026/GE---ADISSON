create or replace function get_cash_flow(days int)
returns table (
  date date,
  received numeric,
  expected numeric
) as $$
begin
  return query
  select
    d.date,
    (select coalesce(sum(amount), 0) from payments where date::date = d.date) as received,
    (select coalesce(sum(amount), 0) from installments where due_date::date = d.date) as expected
  from (
    select generate_series(current_date - days + 1, current_date, '1 day'::interval)::date as date
  ) d
  order by d.date;
end;
$$ language plpgsql;
