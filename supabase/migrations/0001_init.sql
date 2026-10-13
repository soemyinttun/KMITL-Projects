-- SSM Travel Ops — Supabase database, version 1.
-- Run once in Supabase → SQL Editor (or `supabase db push`). Safe to read top to bottom:
--   1. profiles + roles (pending / staff / admin)
--   2. business tables the app syncs (money = whole kyat)
--   3. import history
--   4. Row Level Security: who may read and change what
--   5. realtime notifications
-- Rollback: drop the tables and functions created below (this deletes the data in them).

-- ── 1. Profiles and roles ────────────────────────────────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text,
  role         text not null default 'pending' check (role in ('pending', 'staff', 'admin')),
  created_at   timestamptz not null default now()
);

-- Every new account starts as 'pending' and sees nothing until an admin approves it.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, '')) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('staff', 'admin'), false)
$$;
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

-- Never leave the company without an admin.
create function public.keep_one_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'admin' and new.role <> 'admin'
     and not exists (select 1 from public.profiles where role = 'admin' and id <> old.id) then
    raise exception 'At least one admin is required.';
  end if;
  return new;
end $$;

create trigger profiles_keep_one_admin before update of role on public.profiles
  for each row execute function public.keep_one_admin();

-- ── 2. Business tables ───────────────────────────────────────────────────────
-- updated_at / updated_by are always set by the database (clients cannot fake them); the app
-- downloads changes in (updated_at, id) order. Rows are never hard-deleted: deleted = true.

create function public.touch_row() returns trigger
language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end $$;

create table public.customers (
  id              uuid primary key,
  name            text not null,
  phone           text not null default '',
  township        text not null default '',
  passport_expiry date,
  updated_at      timestamptz not null default clock_timestamp(),
  updated_by      uuid,
  deleted         boolean not null default false
);

create table public.packages (
  id         text primary key,                 -- package code, e.g. IN8
  name       text not null,
  country    text not null,
  days       integer not null check (days > 0),
  price      bigint not null check (price >= 0),  -- kyat per person
  cost       bigint not null check (cost >= 0),   -- kyat per person
  stops      text[] not null default '{}',
  updated_at timestamptz not null default clock_timestamp(),
  updated_by uuid,
  deleted    boolean not null default false
);

create table public.bookings (
  id          uuid primary key,
  customer_id uuid not null references public.customers (id),
  package_id  text not null references public.packages (id),
  destination text not null default '',
  depart_date date not null,
  pax         integer not null check (pax > 0),
  status      text not null check (status in ('enquiry', 'confirmed', 'completed', 'cancelled')),
  created_on  date not null,                      -- sale date
  updated_at  timestamptz not null default clock_timestamp(),
  updated_by  uuid,
  deleted     boolean not null default false
);

create table public.visas (
  id          uuid primary key,
  customer_id uuid not null references public.customers (id),
  kind        text not null,
  stage       text not null check (stage in ('Enquiry', 'Documents', 'Submitted', 'Approved', 'Rejected', 'Delivered')),
  applied_on  date not null,
  decided_on  date,
  deadline    date,
  fee         bigint not null check (fee >= 0),
  cost        bigint not null check (cost >= 0),
  updated_at  timestamptz not null default clock_timestamp(),
  updated_by  uuid,
  deleted     boolean not null default false
);

create table public.passports (
  id          uuid primary key,
  customer_id uuid not null references public.customers (id),
  kind        text not null,
  stage       text not null check (stage in ('Enquiry', 'Documents', 'Submitted', 'Ready', 'Collected')),
  applied_on  date not null,
  decided_on  date,
  deadline    date,
  fee         bigint not null check (fee >= 0),
  cost        bigint not null check (cost >= 0),
  updated_at  timestamptz not null default clock_timestamp(),
  updated_by  uuid,
  deleted     boolean not null default false
);

create table public.tickets (
  id          uuid primary key,
  customer_id uuid not null references public.customers (id),
  direction   text not null check (direction in ('Inbound', 'Outbound')),
  from_place  text not null,
  to_place    text not null,
  airline     text not null default '',
  ticket_date date not null,
  fare        bigint not null check (fare >= 0),
  commission  bigint not null check (commission >= 0),
  updated_at  timestamptz not null default clock_timestamp(),
  updated_by  uuid,
  deleted     boolean not null default false
);

do $$
declare t text;
begin
  foreach t in array array['customers', 'packages', 'bookings', 'visas', 'passports', 'tickets'] loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.touch_row()', t || '_touch', t);
    execute format('create index %I on public.%I (updated_at, id)', t || '_changes', t);
  end loop;
end $$;

-- ── 3. Import history ────────────────────────────────────────────────────────

create table public.import_log (
  id          uuid primary key default gen_random_uuid(),
  imported_by uuid not null default auth.uid() references public.profiles (id),
  imported_at timestamptz not null default now(),
  file_name   text not null,
  mode        text not null check (mode in ('add', 'replace')),
  counts      jsonb not null
);

-- ── 4. Row Level Security ────────────────────────────────────────────────────
-- Not signed in: nothing. Pending: only their own profile. Staff: read and write business
-- data. Admin: also manage roles and imports. No one can hard-delete business rows.

alter table public.profiles   enable row level security;
alter table public.customers  enable row level security;
alter table public.packages   enable row level security;
alter table public.bookings   enable row level security;
alter table public.visas      enable row level security;
alter table public.passports  enable row level security;
alter table public.tickets    enable row level security;
alter table public.import_log enable row level security;

revoke all on public.profiles, public.customers, public.packages, public.bookings, public.visas,
  public.passports, public.tickets, public.import_log from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.customers, public.packages, public.bookings, public.visas,
  public.passports, public.tickets to authenticated;
grant select, insert on public.import_log to authenticated;

create policy "see own profile, admins see all" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "admins change profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
declare t text;
begin
  foreach t in array array['customers', 'packages', 'bookings', 'visas', 'passports', 'tickets'] loop
    execute format('create policy "staff read" on public.%I for select to authenticated using (public.is_staff())', t);
    execute format('create policy "staff add" on public.%I for insert to authenticated with check (public.is_staff())', t);
    execute format('create policy "staff change" on public.%I for update to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

create policy "admins read imports" on public.import_log
  for select to authenticated using (public.is_admin());
create policy "admins log imports" on public.import_log
  for insert to authenticated with check (public.is_admin() and imported_by = auth.uid());

-- ── 5. Realtime: tell other devices when data changes ────────────────────────

alter publication supabase_realtime add table public.customers, public.packages, public.bookings,
  public.visas, public.passports, public.tickets;
