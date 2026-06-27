# ControlTech Assist V1.6 — Mapa de atuação

Versão com mapa do Brasil na página inicial, cadastro de Estado/Cidade via IBGE, localização automática por malha municipal, mapa interno com camadas e correção do erro de componente indefinido.

## Novidades

- Mapa de atuação na Home com estados cinza/coloridos conforme fazendas cadastradas.
- Filtro do mapa por central: Alta Genetics, Genex Brasil ou Outra.
- Marcadores de fazendas no mapa do Brasil.
- Cadastro de fazenda com Estado e Cidade carregados pela API do IBGE.
- Ao selecionar cidade, o app tenta buscar a malha do município no IBGE e calcular uma coordenada aproximada.
- Opção de usar GPS atual para deixar a localização mais precisa.
- Mapa técnico da fazenda com camadas: Mapa com nomes, Satélite e Híbrido.
- Correção do erro do componente Empty sem ícone.
- Supabase continua como modo principal.

## Atualização do banco

Execute `supabase/schema.sql` ou rode este complemento:

```sql
alter table public.fazendas
add column if not exists estado_uf text,
add column if not exists estado_nome text,
add column if not exists codigo_ibge_cidade text,
add column if not exists latitude numeric,
add column if not exists longitude numeric,
add column if not exists localizacao_origem text;
```

## Rodar

```bash
npm install
npm run dev
```
