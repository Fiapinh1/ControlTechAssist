alter table public.visitas
  add column if not exists responsavel_tecnico text;

update public.visitas as visita
set responsavel_tecnico = fazenda.servico_responsavel
from public.fazendas as fazenda
where visita.fazenda_id = fazenda.id
  and nullif(btrim(visita.responsavel_tecnico), '') is null
  and nullif(btrim(fazenda.servico_responsavel), '') is not null;

comment on column public.visitas.responsavel_tecnico is
  'Tecnico ou equipe responsavel por este atendimento especifico.';
