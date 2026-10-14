alter table public.student_question_comments
  add column if not exists parent_comment_id uuid null references public.student_question_comments(id) on delete cascade;

create index if not exists student_question_comments_parent_idx
  on public.student_question_comments(parent_comment_id);

create table if not exists public.student_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.student_question_comments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint student_comment_likes_unique unique(comment_id, student_id)
);

alter table public.student_comment_likes enable row level security;

drop policy if exists "authenticated read comment likes" on public.student_comment_likes;
create policy "authenticated read comment likes"
  on public.student_comment_likes for select to authenticated using (true);

drop policy if exists "students add own comment likes" on public.student_comment_likes;
create policy "students add own comment likes"
  on public.student_comment_likes for insert to authenticated
  with check (student_id = auth.uid() and exists (
    select 1 from public.student_question_comments c
    join public.questions q on q.id = c.question_id
    where c.id = comment_id and q.status = 'published'
  ));

drop policy if exists "students remove own comment likes" on public.student_comment_likes;
create policy "students remove own comment likes"
  on public.student_comment_likes for delete to authenticated using (student_id = auth.uid());

drop policy if exists "students add own question comments" on public.student_question_comments;
drop policy if exists "students add own replies to published questions" on public.student_question_comments;
create policy "students add own replies to published questions"
  on public.student_question_comments for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.questions q where q.id = question_id and q.status = 'published')
    and (
      parent_comment_id is null
      or exists (
        select 1 from public.student_question_comments parent
        where parent.id = parent_comment_id and parent.question_id = student_question_comments.question_id
      )
    )
  );