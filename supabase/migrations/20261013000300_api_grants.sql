-- Explicit API grants; row-level security policies remain the authorization boundary.
grant usage on schema public to anon, authenticated;
grant select on public.disciplines, public.subjects, public.questions, public.question_options to authenticated;
grant select, insert, update, delete on public.profiles, public.disciplines, public.subjects, public.questions, public.question_options, public.question_keys, public.question_comments, public.question_notes, public.import_batches, public.admin_settings to authenticated;
grant select on public.question_attempts to authenticated;
grant usage, select on all sequences in schema public to authenticated;
