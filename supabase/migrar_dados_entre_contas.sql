-- Execute somente após substituir os dois UUIDs abaixo.
-- Use Authentication > Users para localizar os UIDs antigo e novo.
begin;

-- Exemplo:
-- \set old_uid '00000000-0000-0000-0000-000000000000'
-- \set new_uid '11111111-1111-1111-1111-111111111111'

-- No SQL Editor do Supabase, substitua diretamente OLD_UID e NEW_UID:
update public.fazendas set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.equipamentos set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.visitas set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.checklists_fazenda set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.diagnosticos_realizados set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.planejamentos_antena set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.obstaculos_cobertura set user_id = 'NEW_UID' where user_id = 'OLD_UID';
update public.testes_cobertura set user_id = 'NEW_UID' where user_id = 'OLD_UID';

commit;
