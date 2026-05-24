-- Выполни этот скрипт в Supabase: SQL Editor → New query → Run
-- Проект: Dashboard → SQL Editor

-- 1. Политики RLS для таблицы user_profiles (чтение/запись с anon-ключом)
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_anon" on public.user_profiles;
drop policy if exists "user_profiles_insert_anon" on public.user_profiles;
drop policy if exists "user_profiles_update_anon" on public.user_profiles;

create policy "user_profiles_select_anon"
  on public.user_profiles for select
  to anon, authenticated
  using (true);

create policy "user_profiles_insert_anon"
  on public.user_profiles for insert
  to anon, authenticated
  with check (true);

create policy "user_profiles_update_anon"
  on public.user_profiles for update
  to anon, authenticated
  using (true)
  with check (true);

-- 2. Функции входа/регистрации (обходят RLS, если политики ещё не сработали)
create or replace function public.login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.user_profiles%rowtype;
begin
  select * into r from public.user_profiles where username = p_username;
  if not found then
    return null;
  end if;
  if r.password is distinct from p_password then
    raise exception 'wrong_password';
  end if;
  return r.state;
end;
$$;

create or replace function public.register(p_username text, p_password text, p_state jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (username, password, state)
  values (p_username, p_password, p_state);
  return true;
exception
  when unique_violation then
    return false;
end;
$$;

grant execute on function public.login(text, text) to anon, authenticated;
grant execute on function public.register(text, text, jsonb) to anon, authenticated;
