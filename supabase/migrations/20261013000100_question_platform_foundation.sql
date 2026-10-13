-- Question platform foundation: secure roles, question catalog, answers and attempt history.
-- Apply through the project's Supabase migration workflow after reviewing the target database.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'student');
create type public.question_status as enum ('draft', 'published', 'archived');
create type public.question_modality as enum ('multiple_choice', 'true_false');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'student',
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.disciplines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (discipline_id, name)
);

-- Public question content deliberately excludes the answer key and official comments.
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references public.disciplines(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  modality public.question_modality not null,
  statement text not null,
  status public.question_status not null default 'draft',
  source_id text,
  reference_text text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(trim(statement)) > 0)
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_key text not null,
  option_text text not null,
  position integer not null default 0,
  unique (question_id, option_key),
  unique (question_id, position)
);

create table if not exists public.question_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_key text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.question_comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  title text,
  content text not null,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_key text not null,
  is_correct boolean not null,
  attempt_number integer not null,
  created_at timestamptz not null default now(),
  request_id uuid not null default gen_random_uuid(),
  unique (student_id, request_id),
  unique (student_id, question_id, attempt_number)
);

create table if not exists public.question_notes (
  student_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  note text not null default '',
  updated_at timestamptz not null default now(),
  primary key (student_id, question_id)
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete restrict,
  discipline_id uuid references public.disciplines(id) on delete restrict,
  subject_id uuid references public.subjects(id) on delete restrict,
  status text not null default 'validated',
  total_count integer not null default 0,
  imported_count integer not null default 0,
  error_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists questions_public_filter_idx on public.questions(status, discipline_id, subject_id, modality, created_at);
create index if not exists attempts_student_date_idx on public.question_attempts(student_id, created_at desc);
create index if not exists attempts_student_question_idx on public.question_attempts(student_id, question_id, attempt_number desc);
create index if not exists comments_question_position_idx on public.question_comments(question_id, position);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.blocked = false
  );
$$;

create or replace function public.is_active_student()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student' and p.blocked = false
  );
$$;

-- New signups are always students; users cannot self-assign admin privileges.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.disciplines enable row level security;
alter table public.subjects enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_keys enable row level security;
alter table public.question_comments enable row level security;
alter table public.question_attempts enable row level security;
alter table public.question_notes enable row level security;
alter table public.import_batches enable row level security;
alter table public.admin_settings enable row level security;

drop policy if exists "profile owner or admin reads profiles" on public.profiles;
create policy "profile owner or admin reads profiles" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());
drop policy if exists "admin manages profiles" on public.profiles;
create policy "admin manages profiles" on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "active users read active disciplines" on public.disciplines;
create policy "active users read active disciplines" on public.disciplines for select to authenticated
using ((active and (public.is_active_student() or public.is_admin())) or public.is_admin());
drop policy if exists "admin manages disciplines" on public.disciplines;
create policy "admin manages disciplines" on public.disciplines for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "active users read active subjects" on public.subjects;
create policy "active users read active subjects" on public.subjects for select to authenticated
using ((active and (public.is_active_student() or public.is_admin())) or public.is_admin());
drop policy if exists "admin manages subjects" on public.subjects;
create policy "admin manages subjects" on public.subjects for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "students read published questions" on public.questions;
create policy "students read published questions" on public.questions for select to authenticated
using ((status = 'published' and public.is_active_student()) or public.is_admin());
drop policy if exists "admin manages questions" on public.questions;
create policy "admin manages questions" on public.questions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read options for accessible questions" on public.question_options;
create policy "read options for accessible questions" on public.question_options for select to authenticated
using (exists (select 1 from public.questions q where q.id = question_id and ((q.status = 'published' and public.is_active_student()) or public.is_admin())));
drop policy if exists "admin manages options" on public.question_options;
create policy "admin manages options" on public.question_options for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Answer keys have no student read policy.
drop policy if exists "admin manages answer keys" on public.question_keys;
create policy "admin manages answer keys" on public.question_keys for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Official comments are only readable by admins directly; students receive them through submit_answer.
drop policy if exists "admin manages official comments" on public.question_comments;
create policy "admin manages official comments" on public.question_comments for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "students read own attempts" on public.question_attempts;
create policy "students read own attempts" on public.question_attempts for select to authenticated
using (student_id = auth.uid() or public.is_admin());
drop policy if exists "admin reads all attempts" on public.question_attempts;
create policy "admin reads all attempts" on public.question_attempts for select to authenticated
using (public.is_admin());

drop policy if exists "students manage own notes" on public.question_notes;
create policy "students manage own notes" on public.question_notes for all to authenticated
using (student_id = auth.uid() and public.is_active_student())
with check (student_id = auth.uid() and public.is_active_student());
drop policy if exists "admin reads import batches" on public.import_batches;
create policy "admin reads import batches" on public.import_batches for select to authenticated using (public.is_admin());
drop policy if exists "admin manages import batches" on public.import_batches;
create policy "admin manages import batches" on public.import_batches for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin manages settings" on public.admin_settings;
create policy "admin manages settings" on public.admin_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- All answer checking occurs server-side. A request UUID makes retries idempotent.
create or replace function public.submit_answer(p_question_id uuid, p_selected_key text, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  v_correct_key text;
  v_modality public.question_modality;
  v_next_attempt integer;
  v_is_correct boolean;
  v_result jsonb;
begin
  if auth.uid() is null or not public.is_active_student() then
    raise exception 'Acesso não autorizado';
  end if;
  if p_request_id is null or coalesce(trim(p_selected_key), '') = '' then
    raise exception 'Resposta inválida';
  end if;

  select k.correct_key, q.modality into v_correct_key, v_modality
  from public.questions q
  join public.question_keys k on k.question_id = q.id
  where q.id = p_question_id and q.status = 'published';

  if v_correct_key is null then
    raise exception 'Questão indisponível ou sem gabarito';
  end if;
  if v_modality = 'true_false' and p_selected_key not in ('Certo', 'Errado') then
    raise exception 'Alternativa inválida';
  end if;
  if v_modality = 'multiple_choice' and not exists (
    select 1 from public.question_options o
    where o.question_id = p_question_id and o.option_key = p_selected_key
  ) then
    raise exception 'Alternativa inválida';
  end if;

  select is_correct into v_is_correct from public.question_attempts
  where student_id = auth.uid() and request_id = p_request_id;
  if found then
    select jsonb_build_object(
      'attempt_id', a.id, 'is_correct', a.is_correct, 'selected_key', a.selected_key,
      'correct_key', v_correct_key,
      'comments', coalesce((select jsonb_agg(jsonb_build_object('title', c.title, 'content', c.content) order by c.position)
        from public.question_comments c where c.question_id = p_question_id and c.active), '[]'::jsonb)
    ) into v_result from public.question_attempts a
    where a.student_id = auth.uid() and a.request_id = p_request_id;
    return v_result;
  end if;

  v_is_correct := p_selected_key = v_correct_key;
  select coalesce(max(attempt_number), 0) + 1 into v_next_attempt
  from public.question_attempts where student_id = auth.uid() and question_id = p_question_id;

  insert into public.question_attempts(student_id, question_id, selected_key, is_correct, attempt_number, request_id)
  values (auth.uid(), p_question_id, p_selected_key, v_is_correct, v_next_attempt, p_request_id);

  select jsonb_build_object(
    'attempt_id', a.id, 'is_correct', a.is_correct, 'selected_key', a.selected_key,
    'correct_key', v_correct_key,
    'comments', coalesce((select jsonb_agg(jsonb_build_object('title', c.title, 'content', c.content) order by c.position)
      from public.question_comments c where c.question_id = p_question_id and c.active), '[]'::jsonb)
  ) into v_result from public.question_attempts a
  where a.student_id = auth.uid() and a.request_id = p_request_id;
  return v_result;
end;
$$;

revoke all on function public.submit_answer(uuid, text, uuid) from public, anon;
grant execute on function public.submit_answer(uuid, text, uuid) to authenticated;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.is_active_student() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_student() to authenticated;

-- No direct writes to attempts: only the secure correction function may create them.
revoke insert, update, delete on public.question_attempts from anon, authenticated;
revoke all on public.question_keys from anon, authenticated;
grant select, insert, update, delete on public.question_keys to authenticated;
