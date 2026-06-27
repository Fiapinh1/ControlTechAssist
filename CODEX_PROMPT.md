# ControlTech Assist V1.6

Atualize/mantenha esta versão com foco em mapa de atuação e localização por cidade.

## Pontos importantes
- Supabase é o modo principal.
- O cadastro de fazenda usa API de localidades do IBGE para estados e municípios.
- Ao selecionar município, o app busca a malha municipal do IBGE e calcula uma coordenada aproximada.
- O mapa de atuação usa malha de UFs do IBGE e colore estados conforme fazendas cadastradas.
- Corrigir sempre erros de componentes Lucide undefined importando o ícone ou usando fallback no componente.
