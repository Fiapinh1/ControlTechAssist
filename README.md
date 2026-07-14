# ControlTech Assist 3.0 — Field Experience

Aplicativo de apoio técnico de campo para cadastro de fazendas, equipamentos VP8002/VP4102, mapas, checklists, visitas, diagnósticos e relatórios.

## Destaques da versão 3.0

- Nova experiência de equipamentos com edição dividida em **Dados** e **Localização**.
- Mapa de localização separado do formulário para evitar modal quebrado e rolagem confusa.
- Confirmação visual antes de substituir uma coordenada GPS existente.
- Marcadores personalizados para fazendas, VP8002 e VP4102.
- Mapa técnico mostra todos os equipamentos cadastrados e permite filtrar por tipo.
- Controles para exibir ou ocultar nomes e raios de cobertura.
- Dashboard com filtros por central, status, pendências, GPS e equipamentos.
- Pesquisa também encontra equipamentos por código e apelido.
- Interface otimizada para celular e uso com uma mão.

## Instalação

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

## Supabase

Crie um arquivo `.env.local`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

No Vercel, cadastre as mesmas variáveis em **Settings > Environment Variables**.

## Banco de dados

Execute `supabase/schema.sql` no SQL Editor do Supabase. Esta versão continua compatível com o schema da V2.3 e utiliza `raio_metros` em `equipamentos`.
