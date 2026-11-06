-- Permissao individual dos membros dentro dos grupos de acesso.
-- Os membros existentes comecam como administradores para preservar o acesso
-- que ja recebiam quando um grupo era ligado como administrador a uma fazenda.
alter table public.grupo_usuarios
  add column if not exists role text;

update public.grupo_usuarios
set role = 'admin'
where role is null;

alter table public.grupo_usuarios
  alter column role set default 'viewer',
  alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.grupo_usuarios'::regclass
      and conname = 'grupo_usuarios_role_check'
  ) then
    alter table public.grupo_usuarios
      add constraint grupo_usuarios_role_check
      check (role in ('viewer', 'admin'));
  end if;
end
$$;

grant update (role) on table public.grupo_usuarios to authenticated;

drop policy if exists "grupo_usuarios_update_admin" on public.grupo_usuarios;
create policy "grupo_usuarios_update_admin"
on public.grupo_usuarios for update to authenticated
using (
  public.is_app_admin()
  and exists (
    select 1
    from public.grupos_acesso g
    where g.id = grupo_id
      and public.can_access_central(g.central)
  )
)
with check (
  public.is_app_admin()
  and exists (
    select 1
    from public.grupos_acesso g
    join public.profiles p on p.id = user_id
    where g.id = grupo_id
      and public.can_access_central(g.central)
      and g.ativo
      and p.ativo
      and (p.empresa_acesso = 'Urus' or p.empresa_acesso = g.central)
  )
);

-- A permissao administrativa so e efetiva quando tanto o vinculo da fazenda
-- quanto o membro do grupo permitem administracao.
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
        and gu.role = 'admin'
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
