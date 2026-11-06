-- Funcoes SECURITY DEFINER de autorizacao nao devem ser chamadas por usuarios anonimos.
revoke all on function public.farm_role(uuid, uuid) from public, anon;
revoke all on function public.can_view_fazenda(uuid, uuid) from public, anon;
revoke all on function public.can_write_fazenda(uuid, uuid) from public, anon;
revoke all on function public.is_fazenda_owner(uuid, uuid) from public, anon;
revoke all on function public.user_empresa_acesso(uuid) from public, anon;
revoke all on function public.user_app_role(uuid) from public, anon;
revoke all on function public.user_profile_active(uuid) from public, anon;
revoke all on function public.is_app_admin(uuid) from public, anon;
revoke all on function public.can_access_central(text, uuid) from public, anon;
revoke all on function public.promote_first_admin() from public, anon;
revoke all on function public.save_fazenda(jsonb) from public, anon;

grant execute on function public.farm_role(uuid, uuid) to authenticated;
grant execute on function public.can_view_fazenda(uuid, uuid) to authenticated;
grant execute on function public.can_write_fazenda(uuid, uuid) to authenticated;
grant execute on function public.is_fazenda_owner(uuid, uuid) to authenticated;
grant execute on function public.user_empresa_acesso(uuid) to authenticated;
grant execute on function public.user_app_role(uuid) to authenticated;
grant execute on function public.user_profile_active(uuid) to authenticated;
grant execute on function public.is_app_admin(uuid) to authenticated;
grant execute on function public.can_access_central(text, uuid) to authenticated;
grant execute on function public.promote_first_admin() to authenticated;
grant execute on function public.save_fazenda(jsonb) to authenticated;

alter function public.set_updated_at() set search_path = public;

create index if not exists grupos_acesso_created_by_idx on public.grupos_acesso(created_by);
create index if not exists grupo_usuarios_created_by_idx on public.grupo_usuarios(created_by);
create index if not exists fazenda_grupos_created_by_idx on public.fazenda_grupos(created_by);
