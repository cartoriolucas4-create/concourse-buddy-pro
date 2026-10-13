create or replace function public.delete_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_question_count integer := 0;
begin
  if v_user is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
  if not exists (select 1 from public.profiles where id=v_user and role='admin' and coalesce(blocked,false)=false) then
    raise exception 'Somente administrador pode excluir lotes.';
  end if;
  if not exists (select 1 from public.import_batches where id=p_batch_id) then
    raise exception 'Lote não encontrado.';
  end if;
  select count(*) into v_question_count from public.questions where source_id=p_batch_id::text;
  delete from public.question_attempts where question_id in (select id from public.questions where source_id=p_batch_id::text);
  delete from public.question_notes where question_id in (select id from public.questions where source_id=p_batch_id::text);
  delete from public.questions where source_id=p_batch_id::text;
  delete from public.import_batches where id=p_batch_id;
  return jsonb_build_object('deleted_questions',v_question_count,'deleted_batch',true);
end;
$$;
revoke all on function public.delete_import_batch(uuid) from public;
grant execute on function public.delete_import_batch(uuid) to authenticated;