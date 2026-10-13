create or replace function public.import_question_batch(
  p_discipline_id uuid,
  p_subject_id uuid,
  p_questions jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_batch_id uuid;
  v_item jsonb;
  v_question_id uuid;
  v_multi boolean;
  v_key text;
  v_count integer := 0;
  v_opt jsonb;
  v_comment jsonb;
  v_pos integer;
begin
  if v_user is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
  if not exists (select 1 from public.profiles where id = v_user and role = 'admin' and coalesce(blocked,false) = false) then
    raise exception 'Somente administrador pode importar questões.';
  end if;
  if p_questions is null or jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) = 0 then
    raise exception 'O lote precisa conter ao menos uma questão.';
  end if;
  if not exists (select 1 from public.subjects where id=p_subject_id and discipline_id=p_discipline_id and active=true) then
    raise exception 'O assunto não pertence à disciplina selecionada ou está inativo.';
  end if;
  for v_item in select value from jsonb_array_elements(p_questions) loop
    v_multi := v_item->>'modalidade' = 'multipla_escolha';
    if nullif(trim(v_item->>'enunciado'),'') is null then raise exception 'Questão %: enunciado ausente.',v_count+1; end if;
    if v_item->>'modalidade' not in ('multipla_escolha','certo_errado') then raise exception 'Questão %: modalidade inválida.',v_count+1; end if;
    if jsonb_typeof(v_item->'comentarios') is distinct from 'array' or jsonb_array_length(coalesce(v_item->'comentarios','[]'::jsonb)) <> 1 or nullif(trim(v_item->'comentarios'->0->>'conteudo'),'') is null then
      raise exception 'Questão %: é obrigatório exatamente um gabarito comentado não vazio.',v_count+1;
    end if;
    if v_multi then
      if jsonb_typeof(v_item->'alternativas') is distinct from 'array' or jsonb_array_length(coalesce(v_item->'alternativas','[]'::jsonb)) < 2 then raise exception 'Questão %: alternativas incompletas.',v_count+1; end if;
      v_key := upper(regexp_replace(trim(coalesce(v_item->>'gabarito','')), '^(alternativa[[:space:]]*)|[).:]$', '', 'i'));
      if not exists (select 1 from jsonb_array_elements(v_item->'alternativas') a where upper(trim(a->>'letra'))=v_key) then raise exception 'Questão %: gabarito não corresponde a uma alternativa.',v_count+1; end if;
    else
      v_key := case lower(trim(coalesce(v_item->>'gabarito',''))) when 'certo' then 'Certo' when 'errado' then 'Errado' else null end;
      if v_key is null then raise exception 'Questão %: gabarito deve ser Certo ou Errado.',v_count+1; end if;
    end if;
  end loop;
  insert into public.import_batches(admin_id,discipline_id,subject_id,status,total_count,imported_count,error_count)
  values(v_user,p_discipline_id,p_subject_id,'importing',jsonb_array_length(p_questions),0,0)
  returning id into v_batch_id;
  for v_item in select value from jsonb_array_elements(p_questions) loop
    v_multi := v_item->>'modalidade' = 'multipla_escolha';
    if v_multi then
      v_key := upper(regexp_replace(trim(v_item->>'gabarito'), '^(alternativa[[:space:]]*)|[).:]$', '', 'i'));
    else
      v_key := case lower(trim(v_item->>'gabarito')) when 'certo' then 'Certo' else 'Errado' end;
    end if;
    insert into public.questions(discipline_id,subject_id,modality,statement,status,source_id,reference_text,created_by)
    values(p_discipline_id,p_subject_id,case when v_multi then 'multiple_choice'::public.question_modality else 'true_false'::public.question_modality end,trim(v_item->>'enunciado'),'published',v_batch_id::text,nullif(trim(coalesce(v_item->>'referencia','')),''),v_user)
    returning id into v_question_id;
    if v_multi then
      v_pos:=0;
      for v_opt in select value from jsonb_array_elements(v_item->'alternativas') loop
        insert into public.question_options(question_id,option_key,option_text,position)
        values(v_question_id,upper(trim(v_opt->>'letra')),trim(v_opt->>'texto'),v_pos);
        v_pos:=v_pos+1;
      end loop;
    end if;
    insert into public.question_keys(question_id,correct_key) values(v_question_id,v_key);
    v_comment:=v_item->'comentarios'->0;
    insert into public.question_comments(question_id,title,content,position,active)
    values(v_question_id,coalesce(nullif(trim(v_comment->>'titulo'),''),'Gabarito comentado'),trim(v_comment->>'conteudo'),0,true);
    v_count:=v_count+1;
  end loop;
  update public.import_batches set status='completed',imported_count=v_count,error_count=0 where id=v_batch_id;
  return jsonb_build_object('batch_id',v_batch_id,'imported_count',v_count,'total_count',jsonb_array_length(p_questions));
end;
$$;
revoke all on function public.import_question_batch(uuid,uuid,jsonb) from public;
grant execute on function public.import_question_batch(uuid,uuid,jsonb) to authenticated;