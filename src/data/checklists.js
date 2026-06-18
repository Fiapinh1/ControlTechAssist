export const checklistTemplates = [
  {
    id: 'instalacao-coleiras',
    title: 'Instalação de coleiras',
    subtitle: 'Passo a passo para instalar e validar coleiras em vacas de leite.',
    icon: 'cow',
    priority: 'Alta prioridade',
    estimatedTime: 'Operação em campo',
    sections: [
      {
        title: 'Antes de iniciar',
        items: [
          'Confirmar com o responsável da fazenda o local de manejo e o lote de animais.',
          'Usar os EPIs orientados pela empresa e pela fazenda.',
          'Não entrar sozinho em áreas de contenção ou manejo sem autorização.',
          'Separar coleiras, ferramentas, carregadores, abraçadeiras e etiquetas necessárias.',
          'Conferir se as coleiras estão identificadas e vinculadas ao lote correto.'
        ]
      },
      {
        title: 'Durante a instalação',
        items: [
          'Conferir o número/ID da coleira antes de instalar no animal.',
          'Confirmar identificação do animal conforme o padrão da fazenda.',
          'Ajustar a coleira sem deixar frouxa demais e sem apertar excessivamente.',
          'Verificar se o sensor ficou posicionado corretamente conforme orientação do fabricante.',
          'Registrar qualquer animal que não pôde receber a coleira.'
        ]
      },
      {
        title: 'Validação',
        items: [
          'Conferir no sistema se a coleira aparece como cadastrada/ativa.',
          'Verificar se há comunicação ou sincronização inicial.',
          'Conferir se não houve troca de identificação entre animal e coleira.',
          'Separar a lista de pendências para revisão no fim do lote.',
          'Comunicar ao responsável da fazenda os animais pendentes ou com restrição.'
        ]
      }
    ]
  },
  {
    id: 'gateway-base',
    title: 'Gateway / Base',
    subtitle: 'Implantação, energia, rede e comunicação da base.',
    icon: 'gateway',
    priority: 'Essencial',
    estimatedTime: '30 a 60 min',
    sections: [
      {
        title: 'Instalação física',
        items: [
          'Definir ponto de instalação com melhor cobertura e proteção possível.',
          'Confirmar tomada, fonte, nobreak ou alimentação disponível.',
          'Fixar a base/gateway com segurança, evitando umidade e impacto direto.',
          'Conferir cabos, conectores, antena e vedação antes de energizar.',
          'Registrar foto do local de instalação para histórico.'
        ]
      },
      {
        title: 'Rede',
        items: [
          'Confirmar se a rede será via cabo, roteador, chip ou outro meio disponível.',
          'Verificar se o equipamento recebeu IP corretamente.',
          'Testar se há acesso à internet na mesma rede.',
          'Conferir gateway padrão, DNS e máscara quando houver IP fixo.',
          'Realizar teste simples de comunicação antes de finalizar.'
        ]
      },
      {
        title: 'Finalização',
        items: [
          'Confirmar se a base/gateway aparece online no sistema.',
          'Validar horário, identificação e localização da base.',
          'Anotar IP, rede, local físico e observações importantes.',
          'Explicar ao responsável o que foi instalado e como acionar suporte.',
          'Salvar registro de campo com problema, solução e pendências.'
        ]
      }
    ]
  },
  {
    id: 'rede-internet',
    title: 'Rede e internet',
    subtitle: 'Checklist rápido para evitar erro de IP, DNS, DHCP e cabo.',
    icon: 'wifi',
    priority: 'Muito comum',
    estimatedTime: '10 a 20 min',
    sections: [
      {
        title: 'Checagem básica',
        items: [
          'Conferir se o roteador/modem está ligado.',
          'Verificar se outros dispositivos navegam na internet.',
          'Testar outro cabo de rede quando possível.',
          'Confirmar se o equipamento está conectado na porta correta.',
          'Reiniciar roteador/gateway apenas quando for seguro e autorizado.'
        ]
      },
      {
        title: 'Endereço de rede',
        items: [
          'Verificar se o equipamento recebeu IP.',
          'Confirmar se o IP está na mesma faixa da rede local.',
          'Conferir máscara de rede.',
          'Conferir gateway padrão.',
          'Conferir DNS quando o problema for acesso a nomes/sites.'
        ]
      },
      {
        title: 'Testes rápidos',
        items: [
          'Testar ping no gateway/roteador.',
          'Testar ping em um endereço externo quando possível.',
          'Verificar se há bloqueio por firewall ou rede do cliente.',
          'Anotar evidências: IP, horário, mensagem de erro e teste realizado.',
          'Registrar conclusão no histórico.'
        ]
      }
    ]
  },
  {
    id: 'antenas-sinal',
    title: 'Antenas e sinal',
    subtitle: 'Validação de antena, posicionamento, cabos e cobertura.',
    icon: 'antenna',
    priority: 'Cobertura',
    estimatedTime: '15 a 40 min',
    sections: [
      {
        title: 'Instalação',
        items: [
          'Conferir tipo de antena e compatibilidade com o equipamento.',
          'Verificar se os conectores estão firmes e sem oxidação visível.',
          'Evitar dobras fortes ou danos no cabo coaxial.',
          'Posicionar a antena em local alto e livre de barreiras quando possível.',
          'Registrar posição e orientação da antena.'
        ]
      },
      {
        title: 'Teste de cobertura',
        items: [
          'Confirmar se a base recebe dados após a instalação da antena.',
          'Verificar distância aproximada entre animais, base e obstáculos.',
          'Observar se há falhas por região específica da fazenda.',
          'Anotar áreas de sombra ou pontos sem cobertura.',
          'Validar se ajuste de posição melhora o sinal.'
        ]
      }
    ]
  },
  {
    id: 'entrega-cliente',
    title: 'Entrega ao cliente',
    subtitle: 'Checklist final antes de sair da fazenda.',
    icon: 'checklist',
    priority: 'Obrigatório',
    estimatedTime: '10 min',
    sections: [
      {
        title: 'Validação final',
        items: [
          'Confirmar com o responsável quais equipamentos foram instalados.',
          'Mostrar status geral no sistema ou painel disponível.',
          'Informar pendências de forma clara e objetiva.',
          'Conferir se o cliente sabe como acionar suporte.',
          'Salvar registro final da visita.'
        ]
      },
      {
        title: 'Resumo da visita',
        items: [
          'Registrar fazenda, cliente, lote e quantidade executada.',
          'Registrar problemas encontrados.',
          'Registrar soluções aplicadas.',
          'Registrar itens pendentes.',
          'Confirmar se há próxima visita necessária.'
        ]
      }
    ]
  },
  {
    id: 'operacao-lote-grande',
    title: 'Operação com lote grande',
    subtitle: 'Controle para instalação de muitas coleiras sem se perder.',
    icon: 'chart',
    priority: 'Produtividade',
    estimatedTime: 'Dia todo',
    sections: [
      {
        title: 'Organização do lote',
        items: [
          'Definir meta do dia com quantidade prevista de coleiras.',
          'Separar animais por lote, curral ou sequência definida pela fazenda.',
          'Criar controle de instaladas, pendentes e com problema.',
          'Revisar pendências a cada pausa ou troca de lote.',
          'Evitar confiar apenas na memória: registrar tudo no app.'
        ]
      },
      {
        title: 'Fechamento do dia',
        items: [
          'Conferir total de coleiras instaladas.',
          'Conferir total de pendências.',
          'Conferir coleiras com possível falha.',
          'Registrar observações importantes do manejo.',
          'Gerar resumo final para acompanhamento.'
        ]
      }
    ]
  }
];
