export const knowledgeBase = [
  {
    id: 'manual-status',
    category: 'Manual',
    title: 'Como este guia deve ser usado',
    icon: 'shield',
    summary: 'A V1.2 está preparada para receber manuais oficiais e transformar tudo em fluxo de campo.',
    content: 'Itens críticos como LEDs, distâncias, sequência oficial e telas do Nedap Now devem ser preenchidos com base nos manuais/prints enviados. Onde aparecer “aguardando manual”, não use como diagnóstico definitivo.',
    source: 'ControlTech Assist — regra operacional interna'
  },
  {
    id: 'nedap-now-fazenda',
    category: 'Nedap Now',
    title: 'Localizar fazenda correta',
    icon: 'farm',
    summary: 'Primeiro passo antes de validar qualquer equipamento no sistema.',
    content: 'Sempre confirme nome da fazenda, cliente e contexto antes de validar base, VP ou alerta. Isso evita concluir instalação no ambiente errado.',
    source: 'Aguardando manual/prints Nedap Now'
  },
  {
    id: 'nedap-now-base',
    category: 'Nedap Now',
    title: 'Validar base/gateway',
    icon: 'gateway',
    summary: 'Conferência de status, identificação e vínculo da base.',
    content: 'Validar se a base aparece no sistema, se está vinculada à fazenda correta e se o identificador físico bate com o cadastro. Registrar status e horário.',
    source: 'Aguardando manual/prints Nedap Now'
  },
  {
    id: 'nedap-now-alertas',
    category: 'Nedap Now',
    title: 'Registrar alerta exatamente como aparece',
    icon: 'wrench',
    summary: 'Alertas devem ser anotados sem interpretação livre.',
    content: 'Quando houver erro ou alerta no sistema, copie a mensagem ou registre print. Isso facilita suporte e evita perda de contexto.',
    source: 'Aguardando manual/prints Nedap Now'
  },
  {
    id: 'ip',
    category: 'Rede',
    title: 'IP',
    icon: 'terminal',
    summary: 'Endereço que identifica um equipamento dentro de uma rede.',
    content: 'Pense no IP como o endereço da casa do equipamento dentro da rede. Sem IP correto, roteador, notebook e gateway podem não se encontrar.',
    source: 'Conhecimento geral de rede'
  },
  {
    id: 'mascara',
    category: 'Rede',
    title: 'Máscara de rede',
    icon: 'network',
    summary: 'Define quem está na mesma rede local.',
    content: 'Máscara errada pode separar equipamentos que deveriam se comunicar. Uma máscara comum em rede local é 255.255.255.0.',
    source: 'Conhecimento geral de rede'
  },
  {
    id: 'gateway-padrao',
    category: 'Rede',
    title: 'Gateway padrão',
    icon: 'gateway',
    summary: 'Saída da rede local para internet, normalmente o roteador.',
    content: 'Se o gateway padrão estiver errado, o equipamento pode ter IP mas não conseguir acessar serviços externos.',
    source: 'Conhecimento geral de rede'
  },
  {
    id: 'dns',
    category: 'Rede',
    title: 'DNS',
    icon: 'cloud',
    summary: 'Traduz nomes de serviços/sites para endereços IP.',
    content: 'Quando DNS falha, a internet pode parecer conectada, mas serviços por nome não abrem. É uma checagem importante em campo.',
    source: 'Conhecimento geral de rede'
  },
  {
    id: 'dhcp',
    category: 'Rede',
    title: 'DHCP',
    icon: 'network',
    summary: 'Entrega IP automaticamente aos dispositivos.',
    content: 'Se DHCP falhar, a base ou notebook pode ficar sem IP válido. Em campo, conferir clientes conectados no roteador ajuda muito.',
    source: 'Conhecimento geral de rede'
  },
  {
    id: 'gps-iphone',
    category: 'Campo',
    title: 'GPS no iPhone',
    icon: 'gps',
    summary: 'O GPS funciona no navegador, mas exige permissão e HTTPS.',
    content: 'Use o app publicado em HTTPS, permita localização no Safari/Chrome e ative Localização Precisa. Se falhar, registre coordenadas manualmente.',
    source: 'Regra prática do app'
  }
];
