create table if not exists public.student_error_notebook (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, question_id)
);

create index if not exists student_error_notebook_student_created_idx
  on public.student_error_notebook (student_id, created_at desc);

alter table public.student_error_notebook enable row level security;

drop policy if exists "Students manage their own error notebook" on public.student_error_notebook;
create policy "Students manage their own error notebook"
  on public.student_error_notebook
  for all
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

grant select, insert, delete on public.student_error_notebook to authenticated;
