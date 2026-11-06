-- Grupos de acesso reutilizaveis para compartilhamento de fazendas.
-- O identificador e apenas um atalho de compartilhamento, nao uma conta de login.
create table if not exists public.grupos_acesso (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  identificador text not null unique,
  central text not null,
  descricao text,
  ativo boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grupos_acesso_nome_check check (length(trim(nome)) between 2 and 80),
  constraint grupos_acesso_identificador_check check (
    identificador = lower(trim(identificador))
    and identificador ~ '^[a-z0-9][a-z0-9._@-]{2,79}$'
  ),
  constraint grupos_acesso_central_check check (central in ('Alta Genetics', 'Genex Brasil', 'Urus'))
);

create table if not exists public.grupo_usuarios (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos_acesso(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (grupo_id, user_id)
);

create table if not exists public.fazenda_grupos (
  id uuid primary key default gen_random_uuid(),
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  grupo_id uuid not null references public.grupos_acesso(id) on delete cascade,
  role text not null default 'viewer',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fazenda_grupos_role_check check (role in ('viewer', 'admin')),
  unique (fazenda_id, grupo_id)
);

create index if not exists grupos_acesso_central_idx on public.grupos_acesso(central, ativo, nome);
create index if not exists grupo_usuarios_user_idx on public.grupo_usuarios(user_id, grupo_id);
create index if not exists fazenda_grupos_grupo_idx on public.fazenda_grupos(grupo_id, fazenda_id);
create index if not exists fazenda_grupos_fazenda_idx on public.fazenda_grupos(fazenda_id, grupo_id);

alter table public.grupos_acesso enable row level security;
alter table public.grupo_usuarios enable row level security;
alter table public.fazenda_grupos enable row level security;

revoke all on table public.grupos_acesso from anon;
revoke all on table public.grupo_usuarios from anon;
revoke all on table public.fazenda_grupos from anon;
grant select, insert, update on table public.grupos_acesso to authenticated;
grant select, insert, delete on table public.grupo_usuarios to authenticated;
grant select, insert, update, delete on table public.fazenda_grupos to authenticated;

drop policy if exists "grupos_acesso_select_central" on public.grupos_acesso;
drop policy if exists "grupos_acesso_insert_admin" on public.grupos_acesso;
drop policy if exists "grupos_acesso_update_admin" on public.grupos_acesso;
create policy "grupos_acesso_select_central"
on public.grupos_acesso for select to authenticated
using (
  public.can_access_central(central)
  and (ativo or public.is_app_admin())
);
create policy "grupos_acesso_insert_admin"
on public.grupos_acesso for insert to authenticated
with check (
  public.is_app_admin()
  and public.can_access_central(central)
  and created_by = (select auth.uid())
);
create policy "grupos_acesso_update_admin"
on public.grupos_acesso for update to authenticated
using (public.is_app_admin() and public.can_access_central(central))
with check (public.is_app_admin() and public.can_access_central(central));

drop policy if exists "grupo_usuarios_select_central" on public.grupo_usuarios;
drop policy if exists "grupo_usuarios_insert_admin" on public.grupo_usuarios;
drop policy if exists "grupo_usuarios_delete_admin" on public.grupo_usuarios;
create policy "grupo_usuarios_select_central"
on public.grupo_usuarios for select to authenticated
using (
  exists (
    select 1
    from public.grupos_acesso g
    where g.id = grupo_id
      and public.can_access_central(g.central)
      and (g.ativo or public.is_app_admin())
  )
);
create policy "grupo_usuarios_insert_admin"
on public.grupo_usuarios for insert to authenticated
with check (
  public.is_app_admin()
  and created_by = (select auth.uid())
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
create policy "grupo_usuarios_delete_admin"
on public.grupo_usuarios for delete to authenticated
using (
  public.is_app_admin()
  and exists (
    select 1
    from public.grupos_acesso g
    where g.id = grupo_id
      and public.can_access_central(g.central)
  )
);

-- Um grupo so pode ser ligado a uma fazenda da mesma central. Grupos URUS podem
-- ser usados nas duas centrais, preservando o comportamento administrativo atual.
drop policy if exists "fazenda_grupos_select_access" on public.fazenda_grupos;
drop policy if exists "fazenda_grupos_insert_owner" on public.fazenda_grupos;
drop policy if exists "fazenda_grupos_update_owner" on public.fazenda_grupos;
drop policy if exists "fazenda_grupos_delete_owner" on public.fazenda_grupos;
create policy "fazenda_grupos_select_access"
on public.fazenda_grupos for select to authenticated
using (public.can_view_fazenda(fazenda_id));
create policy "fazenda_grupos_insert_owner"
on public.fazenda_grupos for insert to authenticated
with check (
  public.is_fazenda_owner(fazenda_id)
  and created_by = (select auth.uid())
  and exists (
    select 1
    from public.fazendas f
    join public.grupos_acesso g on g.id = grupo_id
    where f.id = fazenda_id
      and g.ativo
      and (g.central = 'Urus' or g.central = f.central)
  )
);
create policy "fazenda_grupos_update_owner"
on public.fazenda_grupos for update to authenticated
using (public.is_fazenda_owner(fazenda_id))
with check (
  public.is_fazenda_owner(fazenda_id)
  and exists (
    select 1
    from public.fazendas f
    join public.grupos_acesso g on g.id = grupo_id
    where f.id = fazenda_id
      and g.ativo
      and (g.central = 'Urus' or g.central = f.central)
  )
);
create policy "fazenda_grupos_delete_owner"
on public.fazenda_grupos for delete to authenticated
using (public.is_fazenda_owner(fazenda_id));

-- Permissao efetiva: proprietario > administrador (direto ou grupo) > visualizador.
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
      join public.grupo_usuarios gu on gu.grupo_id = g.id and gu.user_id = target_user_id
      join public.profiles p on p.id = gu.user_id and p.ativo
      where fg.fazenda_id = target_fazenda_id
        and (p.empresa_acesso = 'Urus' or p.empresa_acesso = g.central)
    ) then 'viewer'
    else null
  end
$$;

revoke all on function public.farm_role(uuid, uuid) from public;
grant execute on function public.farm_role(uuid, uuid) to authenticated;
