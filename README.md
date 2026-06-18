# ControlTech Assist — V1.1

Sistema facilitador para técnico de campo com foco em fazendas, instalação de VPs/coleiras, gateways, redes, checklists, diagnóstico guiado e registros.

## O que mudou na V1.1

- Navegação mobile corrigida com barra inferior fixa.
- Cada módulo virou uma tela real: Fazendas, Checklists, Diagnóstico, Guia e Registros.
- Cadastro de fazendas com apenas nome obrigatório.
- Cadastro de locais por fazenda.
- Cadastro de equipamentos/VPs por fazenda e local.
- Captura de coordenadas pelo GPS do celular.
- Mapa por fazenda usando Leaflet + OpenStreetMap.
- Integração com Supabase.
- RLS preparado para cada usuário ver apenas os próprios dados.
- Fontes Inter + Poppins e visual mais profissional.
- Área futura de IA mantida como “Em breve”.

## Tecnologias

- React
- Vite
- Supabase
- Leaflet / OpenStreetMap
- CSS puro
- PWA básico

## Como rodar localmente

```bash
npm install
npm run dev
```

## Configurar Supabase

1. No Supabase, abra SQL Editor.
2. Execute o arquivo:

```text
supabase/schema.sql
```

3. Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLIC
```

4. Rode o projeto:

```bash
npm run dev
```

## Variáveis na Vercel

Na Vercel, adicione:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Depois faça o deploy.

## Observação sobre GPS

A captura de localização funciona melhor em HTTPS. Em produção na Vercel funciona normalmente, desde que o usuário permita localização no navegador.

## Observação sobre login

Esta versão usa e-mail e senha pelo Supabase Auth. Se o Supabase estiver exigindo confirmação de e-mail, confirme o e-mail ou desative a confirmação em Authentication > Providers > Email, se for apenas uso pessoal.
