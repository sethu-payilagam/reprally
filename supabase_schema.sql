-- ============================================================
--  RepRally — Supabase Database Setup
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE
--    Extends Supabase's built-in auth.users
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  display_name  text not null,
  email         text,
  group_id      integer,           -- 1, 2, 3, or 4
  is_admin      boolean default false,
  approved      boolean default false,
  avatar_emoji  text default '💪',
  created_at    timestamptz default now()
);

-- 2. LOGS TABLE
--    One row per workout entry
create table if not exists public.logs (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  exercise_id   text not null,      -- e.g. "pushups", "steps", "bicep_curl"
  reps          integer not null check (reps > 0),
  note          text,
  logged_at     timestamptz default now()
);

-- 3. ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.logs enable row level security;

-- Profiles: users can read approved profiles; only update their own
create policy "Read approved profiles"
  on public.profiles for select
  using (approved = true or auth.uid() = id);

create policy "Update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Logs: approved users can read all logs; only insert/update their own
create policy "Read all logs"
  on public.logs for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and approved = true
    )
  );

create policy "Insert own logs"
  on public.logs for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and approved = true
    )
  );

create policy "Delete own logs"
  on public.logs for delete
  using (auth.uid() = user_id);

-- Admin override: admins can read/write everything
create policy "Admin full access profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admin full access logs"
  on public.logs for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 4. AUTO-CREATE PROFILE ON SIGNUP
--    Runs whenever a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, display_name, approved)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  5. CREATE YOUR ADMIN ACCOUNT
--     After running the above, sign up normally on the app,
--     then run THIS query replacing the email below:
-- ============================================================

-- update public.profiles
-- set is_admin = true, approved = true
-- where email = 'your-admin-email@example.com';

-- ============================================================
--  6. PRE-APPROVE KNOWN MEMBERS (optional)
--     Run after Sanjay, Arun, Karthi, Sethu sign up:
-- ============================================================

-- update public.profiles
-- set approved = true
-- where email in (
--   'sanjay@example.com',
--   'arun@example.com',
--   'karthi@example.com',
--   'sethu@example.com'
-- );
