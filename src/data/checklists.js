export const checklistTemplates = [
  {
    id: 'instalar-nova-base',
    title: 'Instalar nova base',
    subtitle: 'Fluxo operacional para instalar uma base/gateway com segurança. Conteúdo fino será preenchido com manual oficial.',
    icon: 'gateway',
    priority: 'Manual necessário',
    estimatedTime: '30 a 60 min',
    sourceStatus: 'Estrutura pronta — aguardando manual Nedap/Base para validar distâncias, LEDs e testes oficiais.',
    sections: [
      { title: '1. Antes de sair / antes de iniciar', items: [
        'Confirmar fazenda, responsável, local de instalação e objetivo da visita.',
        'Separar base/gateway, fonte, antena, cabo, suporte, ferramentas e materiais de fixação.',
        'Confirmar se haverá internet disponível no local: cabo, roteador, chip ou outro meio.',
        'Abrir a fazenda no app e preparar o registro do ponto de instalação.',
        'Registrar qualquer informação que precisa ser confirmada no manual antes de executar.'
      ]},
      { title: '2. Local físico da base', items: [
        'Escolher local protegido contra água, impacto, calor excessivo e acesso indevido.',
        'Avaliar altura, visada, obstáculos e proximidade das áreas de circulação dos animais.',
        'Conferir possibilidade de fixação segura sem forçar cabos ou conectores.',
        'Registrar foto do local antes da instalação.',
        'Capturar coordenada GPS do ponto, quando possível.'
      ]},
      { title: '3. Energia e cabos', items: [
        'Conferir tomada, fonte e tensão conforme orientação do equipamento/manual.',
        'Conectar cabos sem deixar em área de pisoteio, dobra forte ou umidade.',
        'Conferir firmeza dos conectores antes de energizar.',
        'Energizar a base e observar padrão inicial de luzes.',
        'Anotar qualquer LED ou comportamento diferente para diagnóstico.'
      ]},
      { title: '4. Rede / internet', items: [
        'Conectar o cabo de rede ou configurar a conexão disponível.',
        'Conferir se a base recebeu IP quando aplicável.',
        'Validar gateway, DNS, máscara e rota de saída quando houver IP fixo.',
        'Testar se a internet funciona no mesmo ponto/rede.',
        'Registrar IP, tipo de rede e observações.'
      ]},
      { title: '5. Validação no sistema / Nedap Now', items: [
        'Confirmar se a base aparece no sistema correto e na fazenda correta.',
        'Validar status online/offline conforme tela disponível.',
        'Conferir identificação/serial da base antes de finalizar.',
        'Registrar evidências: foto, print ou anotação do status.',
        'Abrir pendência se a base não aparecer ou não comunicar.'
      ]},
      { title: '6. Finalização', items: [
        'Explicar ao responsável o que foi instalado e onde ficou instalado.',
        'Registrar coordenada, local, código do equipamento e observações.',
        'Criar registro de campo com itens concluídos e pendências.',
        'Marcar equipamento como Instalado, Testado, Pendente ou Com problema.',
        'Encerrar somente depois de revisar instalação, rede e status no sistema.'
      ]}
    ]
  },
  {
    id: 'diagnostico-luzes-base',
    title: 'Diagnóstico de luzes da base',
    subtitle: 'Checklist para observar LEDs e registrar evidências sem inventar interpretação fora do manual.',
    icon: 'gateway',
    priority: 'Alta prioridade',
    estimatedTime: '5 a 15 min',
    sourceStatus: 'Aguardando manual oficial com tabela de LEDs. A tela de diagnóstico já está preparada.',
    sections: [
      { title: 'Observação inicial', items: [
        'Registrar se a base está ligada ou totalmente apagada.',
        'Anotar cor da luz: verde, vermelha, laranja/amarela, azul ou outra.',
        'Anotar comportamento: fixa, piscando lento, piscando rápido, alternando ou sem padrão.',
        'Tirar foto ou vídeo curto do padrão de luzes.',
        'Conferir no app o diagnóstico de luzes correspondente.'
      ]},
      { title: 'Conferências seguras', items: [
        'Não reiniciar várias vezes sem registrar o comportamento anterior.',
        'Conferir fonte, tomada, cabo e conexão de rede.',
        'Conferir se o equipamento aparece no sistema/Nedap Now.',
        'Comparar o padrão visto com a tabela oficial quando ela estiver cadastrada.',
        'Se a luz não estiver documentada, registrar como padrão desconhecido.'
      ]}
    ]
  },
  {
    id: 'instalar-vp-coleira',
    title: 'Instalar VP / coleira',
    subtitle: 'Fluxo de instalação e conferência de VPs/coleiras em vacas de leite.',
    icon: 'cow',
    priority: 'Operação em campo',
    estimatedTime: 'Por lote',
    sourceStatus: 'Estrutura pronta — ajustar posição, identificação e validação conforme manual enviado.',
    sections: [
      { title: 'Preparação do lote', items: [
        'Confirmar lote, quantidade prevista e sequência de instalação com o responsável.',
        'Separar VPs/coleiras por sequência ou lista de animais.',
        'Conferir se os códigos estão legíveis antes de iniciar.',
        'Abrir a fazenda e escolher o local/lote no app.',
        'Definir como serão registradas pendências e equipamentos com problema.'
      ]},
      { title: 'Instalação no animal', items: [
        'Conferir código da VP/coleira antes de instalar.',
        'Conferir identificação do animal antes de vincular.',
        'Instalar sem deixar frouxo demais e sem apertar excessivamente.',
        'Observar posição do sensor conforme orientação do fabricante.',
        'Registrar animal/equipamento que não pôde ser instalado.'
      ]},
      { title: 'Validação', items: [
        'Conferir se a VP/coleira aparece na fazenda correta.',
        'Conferir se o animal/código ficou vinculado corretamente.',
        'Observar se há comunicação inicial ou janela de sincronização.',
        'Marcar status como Instalado, Testado, Pendente ou Com problema.',
        'Registrar pendências antes de trocar de lote.'
      ]}
    ]
  },
  {
    id: 'validar-nedap-now',
    title: 'Validação no Nedap Now',
    subtitle: 'Guia rápido para conferir se a instalação ficou visível e coerente no sistema.',
    icon: 'book',
    priority: 'Validação final',
    estimatedTime: '10 a 20 min',
    sourceStatus: 'Aguardando prints/manual do Nedap Now para transformar em guia fiel de navegação.',
    sections: [
      { title: 'Checagem no sistema', items: [
        'Confirmar acesso ao Nedap Now ou painel usado na operação.',
        'Localizar a fazenda correta.',
        'Conferir base/gateway e status online/offline.',
        'Conferir equipamentos instalados quando aplicável.',
        'Registrar print ou observação do status final.'
      ]},
      { title: 'Fechamento com cliente', items: [
        'Mostrar ao responsável o que foi validado.',
        'Anotar pendências que dependem de sincronização, suporte ou nova visita.',
        'Registrar horário da validação.',
        'Salvar registro de campo com conclusão objetiva.',
        'Não marcar como finalizado se ainda houver dúvida crítica de comunicação.'
      ]}
    ]
  },
  {
    id: 'rede-internet-campo',
    title: 'Rede e internet no campo',
    subtitle: 'Fluxo para separar problema de energia, cabo, IP, DNS, DHCP e bloqueio de rede.',
    icon: 'wifi',
    priority: 'Muito comum',
    estimatedTime: '10 a 30 min',
    sourceStatus: 'Conteúdo geral de rede. Ajustar portas/endereços específicos conforme manual/suporte oficial.',
    sections: [
      { title: 'Básico primeiro', items: [
        'Conferir se modem/roteador está ligado.',
        'Testar internet em outro dispositivo na mesma rede.',
        'Trocar cabo ou porta quando possível.',
        'Conferir LEDs da porta de rede.',
        'Evitar culpar o equipamento antes de separar problema da rede.'
      ]},
      { title: 'Configuração', items: [
        'Verificar se o equipamento recebeu IP.',
        'Conferir se IP está na mesma faixa da rede.',
        'Conferir máscara, gateway padrão e DNS.',
        'Verificar se existe bloqueio de rede do cliente.',
        'Registrar IP, rede, horário e teste feito.'
      ]}
    ]
  }
];
