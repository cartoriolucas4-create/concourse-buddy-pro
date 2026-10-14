drop policy if exists "students add own replies to published questions" on public.student_question_comments;
drop policy if exists "students add own question comments" on public.student_question_comments;

create or replace function public.can_read_student_question_comment(p_comment_id uuid, p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.student_question_comments c
    join public.questions q on q.id = c.question_id
    where c.id = p_comment_id
      and c.question_id = p_question_id
      and q.status = 'published'
  );
$$;

create policy "students add own question comments"
  on public.student_question_comments for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.questions q
      where q.id = student_question_comments.question_id
        and q.status = 'published'
    )
    and (
      parent_comment_id is null
      or public.can_read_student_question_comment(parent_comment_id, question_id)
    )
  );