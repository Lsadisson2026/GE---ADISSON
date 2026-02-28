-- Function to create a new collector user
create or replace function create_new_collector(
  p_email text,
  p_password text,
  p_name text,
  p_phone text
) returns uuid as $$
declare
  v_user_id uuid;
begin
  -- Check if user already exists in auth.users
  select id into v_user_id from auth.users where email = p_email;
  
  if v_user_id is null then
    -- Create user in auth.users if it doesn't exist
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('name', p_name, 'phone', p_phone, 'role', 'COLLECTOR'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) returning id into v_user_id;
  end if;
  
  -- Upsert into profiles (Create or Update)
  insert into public.profiles (id, name, phone, login, role)
  values (v_user_id, p_name, p_phone, p_email, 'COLLECTOR')
  on conflict (id) do update
  set 
    name = excluded.name,
    phone = excluded.phone,
    login = excluded.login,
    role = excluded.role;
    
  return v_user_id;
end;
$$ language plpgsql security definer;
