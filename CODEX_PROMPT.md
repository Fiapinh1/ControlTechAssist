# Prompt para continuar o ControlTech Assist V1.5

Você está trabalhando no projeto ControlTech Assist, um PWA em React + Vite para técnicos de campo em instalações Nedap/CowControl.

## Objetivo do app

O app tem dois pilares:

1. Controle de visitas/fazendas.
2. Diagnóstico e instalação guiada baseados em manuais oficiais.

## Stack

- React + Vite
- Supabase Auth + Postgres + RLS
- Leaflet / React Leaflet
- Lucide React
- LocalStorage fallback

## Regras importantes

- Fazenda é o centro do sistema.
- Não existe módulo separado de locais. Local é campo do equipamento.
- Equipamentos principais: VP8002 e VP4102.
- Roteador não é equipamento vendido; aparece em checklist/rede.
- Todo diagnóstico técnico deve ter base em manual ou observação prática claramente marcada.
- Não inventar significado de LED/código.
- Conteúdo do app deve estar em português.

## Próximas melhorias sugeridas

- Gerar PDF de relatório com logo.
- Adicionar fotos/anexos em visitas.
- Permitir assinatura do cliente.
- Criar cadastro detalhado de colares/tags por lote.
- Criar importação/exportação CSV para animais/tags.
- Criar modo offline mais robusto com sincronização posterior.
- Criar assistente IA futuramente, mas mantendo diagnóstico manual como fonte confiável.
