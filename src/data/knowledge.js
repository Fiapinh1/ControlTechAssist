export const knowledgeBase = [
  {
    id: 'ip',
    title: 'IP',
    icon: 'terminal',
    summary: 'Endereço que identifica um equipamento dentro de uma rede.',
    content: 'Pense no IP como o endereço da casa do equipamento dentro da rede. Sem IP correto, o roteador, o notebook e o gateway podem não se encontrar.'
  },
  {
    id: 'mascara',
    title: 'Máscara de rede',
    icon: 'network',
    summary: 'Define qual parte do IP é a rede e qual parte identifica o equipamento.',
    content: 'Na prática, a máscara ajuda a saber quem está na mesma rede. Uma máscara comum é 255.255.255.0, usada em muitas redes locais.'
  },
  {
    id: 'gateway',
    title: 'Gateway padrão',
    icon: 'gateway',
    summary: 'É a saída da rede local para outras redes, normalmente o roteador.',
    content: 'Quando o equipamento precisa acessar a internet, ele usa o gateway padrão como caminho de saída. Se estiver errado, pode ter IP mas não navegar.'
  },
  {
    id: 'dns',
    title: 'DNS',
    icon: 'cloud',
    summary: 'Traduz nomes de sites e serviços para endereços IP.',
    content: 'Quando o DNS falha, a internet pode parecer conectada, mas sites e serviços por nome não abrem. Testar DNS ajuda a separar problema de navegação e problema de rede.'
  },
  {
    id: 'dhcp',
    title: 'DHCP',
    icon: 'network',
    summary: 'Serviço que entrega IP automaticamente aos dispositivos da rede.',
    content: 'Se o DHCP não entregar IP, o equipamento pode ficar sem endereço ou com IP inválido. Em campo, é comum verificar se o roteador está distribuindo IP.'
  },
  {
    id: 'ping',
    title: 'Ping',
    icon: 'terminal',
    summary: 'Teste simples para saber se um endereço responde na rede.',
    content: 'O ping é útil para testar comunicação básica. Porém, alguns equipamentos podem bloquear ping e ainda assim funcionar por outro serviço.'
  },
  {
    id: 'lora',
    title: 'LoRa / LoRaWAN',
    icon: 'antenna',
    summary: 'Tecnologia de comunicação sem fio para longas distâncias e baixo consumo.',
    content: 'É comum em IoT rural porque prioriza alcance e bateria. O desempenho depende de antena, distância, relevo, obstáculos e qualidade da instalação.'
  },
  {
    id: 'antena',
    title: 'Antena',
    icon: 'antenna',
    summary: 'Elemento que melhora transmissão e recepção de sinal.',
    content: 'Antena mal posicionada, cabo danificado ou conector frouxo pode causar sinal fraco. Local alto e com menos obstáculos costuma ajudar.'
  },
  {
    id: 'gateway-base',
    title: 'Base / Gateway',
    icon: 'gateway',
    summary: 'Equipamento que recebe dados dos sensores e envia ao sistema.',
    content: 'No contexto de coleiras, a base/gateway é o ponto que concentra comunicação. Se ele estiver offline, as coleiras podem não aparecer corretamente.'
  },
  {
    id: 'ip-fixo',
    title: 'IP fixo',
    icon: 'terminal',
    summary: 'IP configurado manualmente ou reservado para não mudar.',
    content: 'Ajuda quando você precisa acessar sempre o mesmo equipamento pelo mesmo endereço. Exige cuidado com máscara, gateway, DNS e conflito de IP.'
  },
  {
    id: 'checklist-campo',
    title: 'Checklist de campo',
    icon: 'checklist',
    summary: 'Lista de conferência para reduzir erro e esquecimento.',
    content: 'Checklist é ferramenta de segurança. Ele evita confiar só na memória quando você está cansado, sob pressão ou lidando com muitos animais/equipamentos.'
  },
  {
    id: 'registro',
    title: 'Registro de atendimento',
    icon: 'records',
    summary: 'Histórico do que foi feito, onde, quando e qual foi a solução.',
    content: 'Um bom registro protege o técnico, ajuda o suporte e facilita voltar na fazenda depois sabendo o que aconteceu.'
  }
];
