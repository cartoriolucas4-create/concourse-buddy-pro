drop policy if exists "students add own replies to published questions" on public.student_question_comments;
create policy "students add own replies to published questions"
  on public.student_question_comments for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.questions q
      where q.id = student_question_comments.question_id
        and q.status = 'published'
    )
    and (
      student_question_comments.parent_comment_id is null
      or exists (
        select 1 from public.student_question_comments parent
        where parent.id = student_question_comments.parent_comment_id
          and parent.question_id = student_question_comments.question_id
      )
    )
  );