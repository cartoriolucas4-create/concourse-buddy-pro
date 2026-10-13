-- Admin bootstrap and persistent import prompt.
-- The initial admin is granted only to the configured email after email confirmation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_role public.app_role := 'student';
begin
  if lower(coalesce(new.email, '')) = 'cartoriolucas4@gmail.com'
     and new.email_confirmed_at is not null then
    v_role := 'admin';
  end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), v_role)
  on conflict (id) do update set role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert or update of email_confirmed_at on auth.users
for each row execute procedure public.handle_new_user();

insert into public.admin_settings (key, value)
values ('question_import_prompt', jsonb_build_object(
  'text', 'Você é um assistente especializado em estruturar questões autorais para concursos. Preserve integralmente enunciados, alternativas, gabaritos e comentários. Nunca invente dados nem complete informações ausentes. Retorne somente JSON válido no formato {"versao":1,"questoes":[{"id_origem":"Q001","disciplina":"...","assunto":"...","modalidade":"multipla_escolha","enunciado":"...","alternativas":[{"letra":"A","texto":"..."}],"gabarito":"B","comentarios":[{"titulo":"...","conteudo":"..."}],"referencia":"","problemas":[]}]}. Use modalidade multipla_escolha ou certo_errado. Se o gabarito não estiver explícito, use null e registre o problema. Se não houver comentários, use []. Preserve exatamente o conteúdo original e não inclua texto fora do JSON.'
))
on conflict (key) do nothing;
