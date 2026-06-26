# ControlTech Assist V1.5 — Operação de Campo

Versão focada em transformar o app em um facilitador real de instalação, diagnóstico e controle de visitas.

## Principais recursos

- Fazendas como centro do sistema
- Cadastro/edição de fazendas com quantidade de colares prevista e instalada
- Dossiê técnico por fazenda
- Equipamentos VP8002, VP4102 e outros
- GPS ou marcação manual no mapa
- Mapa satélite com raio visual de cobertura para VP4102
- Visitas/registros por fazenda
- Checklists por fazenda
- Relatório geral e individual em TSV
- Instalação guiada baseada nos manuais oficiais
- Diagnóstico por sintomas
- Diagnóstico de LEDs VP8002
- Diagnóstico de códigos CAN bus
- Checklist “Antes de chamar suporte”
- Guia técnico offline em português
- Módulo operacional de colares/SmartTags
- Supabase com RLS e fallback LocalStorage

## Manuais usados como base

- VP8002 — Manual de instalação v6.0 PT, outubro/2024
- Nedap Now — Configuração da fazenda v4.0 PT, abril/2024
- VP8002-VP4102 set — Installation manual v2.0 EN, agosto/2022

O conteúdo em inglês foi traduzido e adaptado para português de uso técnico no campo.

## Rodar localmente

```bash
npm install
npm run dev
```

## Supabase

1. Abra o Supabase > SQL Editor.
2. Execute `supabase/schema.sql`.
3. Crie `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

4. Rode novamente:

```bash
npm run dev
```

## Observações

- A chave anon public pode ficar no frontend, desde que RLS esteja ativo.
- O mapa satélite usa camada Esri/Leaflet.
- O raio de cobertura é visual e serve para apoio técnico, não como garantia de cobertura real.
- O app compila com `npm run build`.
