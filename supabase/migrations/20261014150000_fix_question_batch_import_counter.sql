create or replace function public.import_question_batch_v2(
  p_discipline_id uuid,
  p_subject_id uuid,
  p_questions jsonb,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  v_existing integer;
begin
  if v_user is null then raise exception 'Sessão expirada. Entre novamente.'; end if;
  if not exists(select 1 from public.profiles where id=v_user and role='admin' and coalesce(blocked,false)=false) then
    raise exception 'Somente administrador pode importar questões.';
  end if;
  if p_request_id is null then raise exception 'Identificador de importação ausente. Valide o lote novamente.'; end if;

  select id, imported_count, total_count
    into v_batch_id, v_count, v_existing
    from public.import_batches
    where request_id=p_request_id and admin_id=v_user;

  if v_batch_id is not null then
    return jsonb_build_object('batch_id',v_batch_id,'imported_count',coalesce(v_count,0),'total_count',coalesce(v_existing,0),'already_imported',true);
  end if;

  -- SELECT INTO sem resultados define as variáveis como NULL; restaure o contador antes de incrementá-lo.
  v_count := 0;

  if p_questions is null or jsonb_typeof(p_questions)<>'array' or jsonb_array_length(p_questions)=0 then
    raise exception 'O lote precisa conter ao menos uma questão.';
  end if;
  if jsonb_array_length(p_questions)>1000 then raise exception 'Limite de 1000 questões por lote. Divida o material em lotes menores.'; end if;
  if not exists(select 1 from public.subjects where id=p_subject_id and discipline_id=p_discipline_id and active=true) then
    raise exception 'O assunto não pertence à disciplina selecionada ou está inativo.';
  end if;

  for v_item in select value from jsonb_array_elements(p_questions) loop
    v_multi := v_item->>'modalidade'='multipla_escolha';
    if nullif(trim(v_item->>'enunciado'),'') is null then raise exception 'Questão %: enunciado ausente.',v_count+1; end if;
    if v_item->>'modalidade' not in ('multipla_escolha','certo_errado') then raise exception 'Questão %: modalidade inválida.',v_count+1; end if;
    if v_multi then
      if jsonb_typeof(v_item->'alternativas') is distinct from 'array' or jsonb_array_length(coalesce(v_item->'alternativas','[]'::jsonb))<2 then
        raise exception 'Questão %: alternativas incompletas.',v_count+1;
      end if;
      if exists(select 1 from (select upper(trim(value->>'letra')) k,count(*) c from jsonb_array_elements(v_item->'alternativas') group by 1) z where z.k is null or z.k='' or z.c>1) then
        raise exception 'Questão %: há letras de alternativas ausentes ou repetidas.',v_count+1;
      end if;
      if exists(select 1 from jsonb_array_elements(v_item->'alternativas') a where nullif(trim(a->>'texto'),'') is null) then
        raise exception 'Questão %: alternativa sem texto.',v_count+1;
      end if;
      v_key := upper(regexp_replace(trim(coalesce(v_item->>'gabarito','')), '^(alternativa[[:space:]]*)|[).:]$', '', 'i'));
      if v_key='' or not exists(select 1 from jsonb_array_elements(v_item->'alternativas') a where upper(trim(a->>'letra'))=v_key) then
        raise exception 'Questão %: gabarito ausente ou incompatível com as alternativas.',v_count+1;
      end if;
    else
      v_key := case lower(trim(coalesce(v_item->>'gabarito',''))) when 'certo' then 'Certo' when 'errado' then 'Errado' else null end;
      if v_key is null then raise exception 'Questão %: gabarito deve ser Certo ou Errado.',v_count+1; end if;
    end if;
    if jsonb_typeof(v_item->'comentarios') is distinct from 'array' then raise exception 'Questão %: campo comentarios deve ser uma lista.',v_count+1; end if;
    if jsonb_array_length(v_item->'comentarios')>1 then raise exception 'Questão %: mantenha no máximo um comentário original.',v_count+1; end if;
    if jsonb_array_length(v_item->'comentarios')=1 and nullif(trim(v_item->'comentarios'->0->>'conteudo'),'') is null then
      raise exception 'Questão %: comentário inválido; remova-o ou preencha o conteúdo.',v_count+1;
    end if;
    v_count := v_count + 1;
  end loop;

  v_count := 0;
  insert into public.import_batches(admin_id,discipline_id,subject_id,status,total_count,imported_count,error_count,request_id)
  values(v_user,p_discipline_id,p_subject_id,'importing',jsonb_array_length(p_questions),0,0,p_request_id)
  on conflict(request_id) where request_id is not null do nothing
  returning id into v_batch_id;

  if v_batch_id is null then
    select id, imported_count, total_count into v_batch_id, v_count, v_existing
    from public.import_batches where request_id=p_request_id and admin_id=v_user;
    if v_batch_id is not null then
      return jsonb_build_object('batch_id',v_batch_id,'imported_count',coalesce(v_count,0),'total_count',coalesce(v_existing,0),'already_imported',true);
    end if;
    raise exception 'Não foi possível reservar o identificador deste lote. Atualize e tente novamente.';
  end if;

  for v_item in select value from jsonb_array_elements(p_questions) loop
    v_multi := v_item->>'modalidade'='multipla_escolha';
    if v_multi then
      v_key := upper(regexp_replace(trim(v_item->>'gabarito'), '^(alternativa[[:space:]]*)|[).:]$', '', 'i'));
    else
      v_key := case lower(trim(v_item->>'gabarito')) when 'certo' then 'Certo' else 'Errado' end;
    end if;

    insert into public.questions(discipline_id,subject_id,modality,statement,status,source_id,reference_text,created_by)
    values(p_discipline_id,p_subject_id,case when v_multi then 'multiple_choice'::public.question_modality else 'true_false'::public.question_modality end,trim(v_item->>'enunciado'),'published',v_batch_id::text,nullif(trim(coalesce(v_item->>'referencia','')),''),v_user)
    returning id into v_question_id;

    if v_multi then
      v_pos := 0;
      for v_opt in select value from jsonb_array_elements(v_item->'alternativas') loop
        insert into public.question_options(question_id,option_key,option_text,position)
        values(v_question_id,upper(trim(v_opt->>'letra')),trim(v_opt->>'texto'),v_pos);
        v_pos := v_pos + 1;
      end loop;
    end if;

    insert into public.question_keys(question_id,correct_key) values(v_question_id,v_key);
    if jsonb_array_length(v_item->'comentarios')=1 then
      v_comment := v_item->'comentarios'->0;
      insert into public.question_comments(question_id,title,content,position,active)
      values(v_question_id,coalesce(nullif(trim(v_comment->>'titulo'),''),'Gabarito comentado'),trim(v_comment->>'conteudo'),0,true);
    end if;
    v_count := v_count + 1;
  end loop;

  update public.import_batches set status='completed',imported_count=v_count,error_count=0 where id=v_batch_id;
  return jsonb_build_object('batch_id',v_batch_id,'imported_count',v_count,'total_count',jsonb_array_length(p_questions),'already_imported',false);
end;
$function$;