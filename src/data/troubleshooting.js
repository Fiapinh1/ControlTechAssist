export const troubleshootingFlows = [
  {
    id: 'sem-internet',
    title: 'Sem internet',
    icon: 'wifi',
    severity: 'Alta frequência',
    symptom: 'Equipamento ou rede não navega, não sincroniza ou não conecta ao servidor.',
    checks: [
      {
        question: 'O roteador/modem está ligado e com sinal?',
        why: 'Sem alimentação ou sem link, nenhum equipamento da rede vai comunicar.',
        action: 'Conferir energia, LEDs do equipamento e cabo de alimentação.'
      },
      {
        question: 'Outro celular ou notebook navega na mesma rede?',
        why: 'Isso separa problema da internet geral de problema do equipamento específico.',
        action: 'Testar navegação em outro dispositivo conectado à mesma rede.'
      },
      {
        question: 'O gateway recebeu IP?',
        why: 'Sem IP, ele não entrou corretamente na rede local.',
        action: 'Verificar DHCP ou configuração de IP fixo.'
      },
      {
        question: 'O cabo ou porta de rede foi testado?',
        why: 'Cabo ruim e porta errada são causas simples e muito comuns.',
        action: 'Trocar cabo, testar outra porta e observar LEDs da porta LAN.'
      },
      {
        question: 'DNS e gateway padrão estão corretos?',
        why: 'Com IP errado, máscara errada ou DNS ruim, a rede pode parecer conectada mas não acessar serviços.',
        action: 'Conferir IP, máscara, gateway e DNS antes de acionar suporte.'
      }
    ],
    result: 'Se energia, cabo, IP, gateway e DNS estiverem corretos, registre as evidências e acione o suporte com prints/fotos dos testes.'
  },
  {
    id: 'gateway-offline',
    title: 'Gateway offline',
    icon: 'gateway',
    severity: 'Crítico',
    symptom: 'Base/gateway aparece offline no sistema ou não envia dados.',
    checks: [
      {
        question: 'A base está energizada?',
        why: 'Sem energia, não há comunicação, mesmo que a instalação física esteja correta.',
        action: 'Conferir fonte, tomada, nobreak e LEDs.'
      },
      {
        question: 'A base está conectada à internet?',
        why: 'Gateway offline muitas vezes é falha de rede, não falha do equipamento.',
        action: 'Executar checklist de Rede e Internet.'
      },
      {
        question: 'A identificação da base está correta no sistema?',
        why: 'Base instalada com ID incorreto pode parecer ausente no painel esperado.',
        action: 'Conferir serial, ID, cadastro e fazenda vinculada.'
      },
      {
        question: 'A antena está conectada corretamente?',
        why: 'Sem antena ou com cabo ruim, a cobertura pode cair muito.',
        action: 'Conferir conector, cabo, posição e integridade visual.'
      },
      {
        question: 'Há bloqueio de rede do cliente?',
        why: 'Algumas redes corporativas ou rurais bloqueiam portas e serviços.',
        action: 'Anotar rede usada e pedir liberação/validação ao responsável de TI ou suporte.'
      }
    ],
    result: 'Registre energia, IP, rede, ID da base, foto da instalação e horário do teste antes de encerrar ou escalar.'
  },
  {
    id: 'ip-nao-responde',
    title: 'IP não responde',
    icon: 'terminal',
    severity: 'Rede',
    symptom: 'Ping não responde ou equipamento não abre pelo endereço IP.',
    checks: [
      {
        question: 'Você está na mesma rede do equipamento?',
        why: 'Dispositivos em redes diferentes podem não se enxergar.',
        action: 'Comparar o IP do seu notebook/celular com o IP do equipamento.'
      },
      {
        question: 'A máscara de rede está correta?',
        why: 'Máscara errada pode separar equipamentos que deveriam estar na mesma rede.',
        action: 'Conferir se IP e máscara pertencem à mesma faixa.'
      },
      {
        question: 'O IP pode ter mudado?',
        why: 'Quando usa DHCP, o roteador pode entregar outro IP após reinício.',
        action: 'Consultar a lista de clientes conectados no roteador ou scanner de rede autorizado.'
      },
      {
        question: 'O equipamento bloqueia ping?',
        why: 'Alguns equipamentos não respondem ping, mas funcionam em outra porta ou sistema.',
        action: 'Testar o acesso pelo serviço correto, conforme orientação técnica.'
      },
      {
        question: 'Há conflito de IP?',
        why: 'Dois dispositivos com o mesmo IP causam falhas intermitentes.',
        action: 'Desconectar um por vez ou revisar reserva DHCP/IP fixo.'
      }
    ],
    result: 'Ao registrar o problema, salve IP do equipamento, IP do seu dispositivo, máscara, gateway e resultado do teste.'
  },
  {
    id: 'coleira-sem-comunicacao',
    title: 'Coleira sem comunicação',
    icon: 'cow',
    severity: 'Campo',
    symptom: 'Coleira instalada, mas sem aparecer, sem atualizar ou com dados ausentes.',
    checks: [
      {
        question: 'A coleira está cadastrada e vinculada ao animal correto?',
        why: 'Erro de cadastro pode parecer falha de comunicação.',
        action: 'Conferir ID da coleira, ID do animal e fazenda/lote no sistema.'
      },
      {
        question: 'A base/gateway está online?',
        why: 'Se a base está offline, as coleiras podem não transmitir dados ao sistema.',
        action: 'Executar fluxo Gateway offline.'
      },
      {
        question: 'O animal está em área de cobertura?',
        why: 'Distância, relevo e barreiras podem gerar sombra de sinal.',
        action: 'Comparar posição do lote com a posição da antena/base.'
      },
      {
        question: 'A coleira foi instalada corretamente?',
        why: 'Posicionamento inadequado pode prejudicar leitura ou funcionamento.',
        action: 'Conferir ajuste e posição conforme procedimento do fabricante.'
      },
      {
        question: 'Existe atraso normal de sincronização?',
        why: 'Alguns sistemas não atualizam imediatamente após a instalação.',
        action: 'Aguardar janela mínima recomendada e registrar horário da instalação.'
      }
    ],
    result: 'Evite trocar equipamento sem antes validar cadastro, gateway, cobertura e tempo de sincronização.'
  },
  {
    id: 'sinal-fraco',
    title: 'Sinal fraco',
    icon: 'antenna',
    severity: 'Cobertura',
    symptom: 'Comunicação instável, perda de dados ou falha em regiões específicas.',
    checks: [
      {
        question: 'A antena está em local alto e livre?',
        why: 'Obstáculos físicos prejudicam sinal.',
        action: 'Avaliar reposicionamento com segurança e autorização.'
      },
      {
        question: 'Cabos e conectores estão íntegros?',
        why: 'Cabo danificado ou conector frouxo reduz muito o desempenho.',
        action: 'Conferir visualmente sem forçar conectores.'
      },
      {
        question: 'A falha acontece em uma área específica?',
        why: 'Isso indica sombra de sinal, distância ou barreira localizada.',
        action: 'Mapear área com problema e anotar distância aproximada.'
      },
      {
        question: 'Há barreiras como galpões, morros ou estruturas metálicas?',
        why: 'Ambiente rural também pode ter bloqueios importantes.',
        action: 'Registrar obstáculos e testar melhor posição se possível.'
      }
    ],
    result: 'Salve fotos do ponto da antena, posição da base e região sem sinal para facilitar análise técnica.'
  },
  {
    id: 'cliente-sem-acesso',
    title: 'Cliente sem acesso',
    icon: 'user',
    severity: 'Suporte',
    symptom: 'Cliente não consegue acessar o sistema, painel ou aplicativo.',
    checks: [
      {
        question: 'O usuário, e-mail ou telefone está correto?',
        why: 'Erro simples de cadastro impede login.',
        action: 'Conferir dados com o cliente antes de alterar qualquer coisa.'
      },
      {
        question: 'O cliente tem internet no celular/computador?',
        why: 'Problema local de internet pode parecer falha do sistema.',
        action: 'Testar navegação em outro site ou rede.'
      },
      {
        question: 'A senha foi digitada corretamente?',
        why: 'Caps Lock, teclado e caracteres especiais causam erro comum.',
        action: 'Orientar recuperação de senha pelo canal oficial.'
      },
      {
        question: 'O perfil do cliente tem permissão para acessar a fazenda?',
        why: 'Usuário sem vínculo com fazenda não visualiza dados.',
        action: 'Conferir permissões no painel administrativo ou com suporte.'
      }
    ],
    result: 'Nunca peça senha do cliente. Oriente recuperação pelos canais oficiais e registre o erro apresentado.'
  }
];
