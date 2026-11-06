-- Revalida a central no momento do acesso. Assim, uma eventual alteracao do
-- cadastro do grupo nunca reaproveita vinculos de fazendas incompatíveis.
create or replace function public.farm_role(target_fazenda_id uuid, target_user_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_user_id is null then null
    when exists (
      select 1 from public.fazendas f
      where f.id = target_fazenda_id and f.user_id = target_user_id
    ) then 'owner'
    when exists (
      select 1 from public.fazenda_membros m
      where m.fazenda_id = target_fazenda_id
        and m.user_id = target_user_id
        and m.role = 'admin'
    ) or exists (
      select 1
      from public.fazenda_grupos fg
      join public.grupos_acesso g on g.id = fg.grupo_id and g.ativo
      join public.fazendas f on f.id = fg.fazenda_id and (g.central = 'Urus' or g.central = f.central)
      join public.grupo_usuarios gu on gu.grupo_id = g.id and gu.user_id = target_user_id
      join public.profiles p on p.id = gu.user_id and p.ativo
      where fg.fazenda_id = target_fazenda_id
        and fg.role = 'admin'
        and (p.empresa_acesso = 'Urus' or p.empresa_acesso = g.central)
    ) then 'admin'
    when exists (
      select 1 from public.fazenda_membros m
      where m.fazenda_id = target_fazenda_id and m.user_id = target_user_id
    ) or exists (
      select 1
      from public.fazenda_grupos fg
      join public.grupos_acesso g on g.id = fg.grupo_id and g.ativo
      join public.fazendas f on f.id = fg.fazenda_id and (g.central = 'Urus' or g.central = f.central)
      join public.grupo_usuarios gu on gu.grupo_id = g.id and gu.user_id = target_user_id
      join public.profiles p on p.id = gu.user_id and p.ativo
      where fg.fazenda_id = target_fazenda_id
        and (p.empresa_acesso = 'Urus' or p.empresa_acesso = g.central)
    ) then 'viewer'
    else null
  end
$$;

revoke all on function public.farm_role(uuid, uuid) from public, anon;
grant execute on function public.farm_role(uuid, uuid) to authenticated;
