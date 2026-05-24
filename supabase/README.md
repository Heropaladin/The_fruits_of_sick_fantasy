# Настройка Supabase для входа

Если при входе появляется сообщение про RLS / «аккаунт есть, но прочитать нельзя»:

1. Открой [Supabase Dashboard](https://supabase.com/dashboard) → свой проект.
2. **SQL Editor** → **New query**.
3. Скопируй весь файл [`setup_rls.sql`](./setup_rls.sql) и нажми **Run**.
4. Обнови сайт (Ctrl+F5) и войди снова.

Скрипт включает чтение/запись для `user_profiles` и функции `login` / `register`.
