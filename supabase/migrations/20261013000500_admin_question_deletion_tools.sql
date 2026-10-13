create or replace function public.delete_question(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid := auth.uid(); v_exists boolean;
begin
 if v_user is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not exists(select 1 from public.profiles where id=v_user and role='admin' and coalesce(blocked,false)=false) then raise exception 'Somente administrador pode excluir questões.'; end if;
 select exists(select 1 from public.questions where id=p_question_id) into v_exists;
 if not v_exists then raise exception 'Questão não encontrada.'; end if;
 delete from public.question_attempts where question_id=p_question_id;
 delete from public.question_notes where question_id=p_question_id;
 delete from public.questions where id=p_question_id;
 return jsonb_build_object('deleted',true,'question_id',p_question_id);
end;
$$;
create or replace function public.delete_all_questions()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid := auth.uid(); v_count integer;
begin
 if v_user is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not exists(select 1 from public.profiles where id=v_user and role='admin' and coalesce(blocked,false)=false) then raise exception 'Somente administrador pode excluir todas as questões.'; end if;
 select count(*) into v_count from public.questions;
 delete from public.question_attempts where question_id in (select id from public.questions);
 delete from public.question_notes where question_id in (select id from public.questions);
 delete from public.questions;
 update public.import_batches set status='deleted',imported_count=0,error_count=total_count where true;
 return jsonb_build_object('deleted_questions',v_count,'deleted_all',true);
end;
$$;
create or replace function public.delete_import_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid := auth.uid(); v_count integer;
begin
 if v_user is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
 if not exists(select 1 from public.profiles where id=v_user and role='admin' and coalesce(blocked,false)=false) then raise exception 'Somente administrador pode excluir lotes.'; end if;
 if not exists(select 1 from public.import_batches where id=p_batch_id) then raise exception 'Lote não encontrado.'; end if;
 select count(*) into v_count from public.questions where source_id=p_batch_id::text;
 delete from public.question_attempts where question_id in (select id from public.questions where source_id=p_batch_id::text);
 delete from public.question_notes where question_id in (select id from public.questions where source_id=p_batch_id::text);
 delete from public.questions where source_id=p_batch_id::text;
 delete from public.import_batches where id=p_batch_id;
 return jsonb_build_object('deleted_questions',v_count,'deleted_batch',true);
end;
$$;
revoke all on function public.delete_question(uuid) from public;
revoke all on function public.delete_all_questions() from public;
revoke all on function public.delete_import_batch(uuid) from public;
grant execute on function public.delete_question(uuid) to authenticated;
grant execute on function public.delete_all_questions() to authenticated;
grant execute on function public.delete_import_batch(uuid) to authenticated;