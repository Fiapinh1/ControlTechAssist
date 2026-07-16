import {
  AlertTriangle, Cable, CircleAlert, ClipboardList, Cpu, LifeBuoy, RadioTower,
  Settings, Tags, Wifi, Zap
} from 'lucide-react';

export const SOURCES = {
  vp8002: 'Fonte: Manual VP8002 v6.0 PT — Nedap, out/2024.',
  set: 'Fonte: Manual VP8002-VP4102 set v2.0 EN — Nedap, ago/2022. Conteúdo traduzido e adaptado para português no app.',
  now: 'Fonte: Manual Nedap Now — Configuração da fazenda v4.0 PT — Nedap, abr/2024.'
};

export const INSTALL_GUIDES = [
  {
    id: 'vp8002',
    title: 'Instalação guiada VP8002',
    icon: Cpu,
    desc: 'Fluxo completo para montar, ligar, localizar IP, configurar e validar a VPU.',
    source: SOURCES.vp8002,
    phases: [
      { title: 'Segurança e ambiente', items: ['Desligar alimentação antes de trabalhar na instalação elétrica.', 'Usar proteção adequada durante instalação/manutenção.', 'Manter a área livre de obstáculos e animais.', 'Instalar componentes fora do alcance dos animais.', 'Proteger cabos para evitar tropeço e danos.'] },
      { title: 'Requisitos antes de montar', items: ['Confirmar tomada próxima e acessível.', 'Confirmar terra de proteção quando aplicável.', 'Confirmar roteador para conexão da VP8002 à internet.', 'Preferir DHCP ativo no roteador.', 'Usar cabo Ethernet blindado mínimo CAT5/FTP CAT5e ou superior.', 'Se distância passar de 100 m ou houver alto risco de raios, avaliar fibra óptica.'] },
      { title: 'Montagem', items: ['Instalar VP8002 em caixa protegida contra poeira e respingos, preferencialmente V-box.', 'Fixar a VP8002 na calha DIN corretamente.', 'Fechar a V-box e conferir vedação/tampa.', 'Registrar local físico onde a VP8002 foi instalada.'] },
      { title: 'Cabeamento', items: ['Ligar alimentação 25 V CC conforme padrão Nedap.', 'Conectar LAN 1 à rede externa/roteador.', 'Reservar LAN 2 para V-packs Velos, quando aplicável.', 'Não ligar VPU secundária na LAN 2 da VPU principal.', 'Conferir se cabos CAN/Ethernet estão protegidos e organizados.'] },
      { title: 'Primeira inicialização', items: ['Ligar a alimentação.', 'Durante arranque, aguardar o display finalizar.', 'Confirmar LED Power verde.', 'Confirmar Vin1/Vin2 conforme alimentação usada.', 'Verificar LINK + ACT se houver rede conectada.'] },
      { title: 'Configuração', items: ['Localizar IP pelo Find my VPU ou pelo botão/display.', 'Acessar o IP pelo navegador no mesmo ambiente de rede.', 'Definir endereço lógico e seção conforme instalação.', 'Entrar no Velos com usuário de serviço quando aplicável.', 'Completar checklist de serviço do Velos.', 'Verificar atualizações de software/firmware.'] }
    ]
  },
  {
    id: 'vp4102',
    title: 'Instalação guiada VP4102 / Antena',
    icon: RadioTower,
    desc: 'Planejamento de posição, cobertura, conexão e validação do leitor/antena.',
    source: SOURCES.set,
    phases: [
      { title: 'Planejamento da cobertura', items: ['Definir área que precisa de leitura em tempo real.', 'Para antena interna, considerar cerca de 75 m ao redor como referência prática.', 'Para antena externa, considerar até cerca de 250 m com visada livre.', 'Avaliar obstáculos, paredes metálicas, telhados e layout do barracão.', 'Quando uma antena não cobre tudo, planejar segunda antena com sobreposição.'] },
      { title: 'Posicionamento físico', items: ['Instalar antena fora do alcance dos animais.', 'Evitar sol direto sobre a V-box.', 'Manter distância adequada de teto e obstáculos.', 'Instalar preferencialmente na vertical.', 'Evitar instalação invertida por risco de entrada de água.', 'Proteger tomada/adaptador contra umidade e respingos.'] },
      { title: 'Cabeamento e fixação', items: ['Fixar suporte/antena com segurança.', 'Conectar cabo da antena firmemente.', 'Não encurtar o cabo da antena.', 'Enrolar sobra de cabo apenas se necessário.', 'Registrar equipamento no mapa com apelido e local.'] },
      { title: 'Validação', items: ['Abrir página do leitor VP4102.', 'Verificar Reader check.', 'Conferir mensagens recebidas nas últimas 24 h.', 'Observar força de sinal das tags.', 'Usar teste com tag e afastamento para validar alcance.'] }
    ]
  },
  {
    id: 'nedap-now',
    title: 'Configuração guiada Nedap Now',
    icon: Wifi,
    desc: 'Passo a passo para empresa, fazenda, VPU, Velos, SmartTags e vínculos.',
    source: SOURCES.now,
    phases: [
      { title: 'Antes de começar', items: ['Confirmar hardware CowControl instalado.', 'Ter chave de licença Velos.', 'Ter código da empresa Nedap Now.', 'Garantir conta de usuário Nedap Now ativa.', 'Confirmar acesso à internet.'] },
      { title: 'Empresa e fazenda', items: ['Fazer login no Nedap Now.', 'Adicionar empresa usando o código recebido.', 'Criar fazenda principal.', 'Conferir nome, endereço e fuso horário da fazenda.', 'Aguardar exibição do aplicativo Farm setup quando necessário.'] },
      { title: 'Conectar à VPU', items: ['Garantir VP8002 ligada e pronta.', 'No Farm setup, usar Connect installation.', 'Inserir código de licença Velos.', 'Definir nome da instalação, por exemplo VPU1 + nome da fazenda.', 'Salvar e conferir VPU vinculada à fazenda.'] },
      { title: 'Configurar Velos', items: ['Acessar Velos pelo IP da VPU.', 'Usar usuário service quando aplicável.', 'Atualizar Velos se a opção Setup Nedap Now não aparecer.', 'Executar Setup Nedap Now.', 'Registrar usuários, domínio e usuário de serviço.', 'Finalizar e entrar no Nedap Now.'] },
      { title: 'Tags e animais', items: ['Adicionar SmartTags individualmente ou em caixa de 10.', 'Adicionar tags de terceiros quando aplicável.', 'Usar Quick input para vincular tag ao animal.', 'Para SmartTags, usar QR quando disponível.', 'Para entrada manual, considerar prefixo 98400000 em SmartTags.'] }
    ]
  },
  {
    id: 'colas',
    title: 'Operação de colares / SmartTags',
    icon: Tags,
    desc: 'Controle de quantidade, lote, pendências e vínculo das tags no sistema.',
    source: SOURCES.now,
    phases: [
      { title: 'Controle de campo', items: ['Registrar quantidade prevista de colares na fazenda.', 'Atualizar quantidade instalada ao longo do dia.', 'Registrar lote/equipe em observações da visita.', 'Anotar animais ou tags com problema.', 'Registrar pendências antes de sair da fazenda.'] },
      { title: 'Entrada de tags', items: ['Adicionar SmartTags no aplicativo Tag.', 'Usar caixa de tags para inserir lote de 10 quando aplicável.', 'Usar Quick input para vincular tag e animal juntos.', 'Conferir se todos os vínculos foram salvos.', 'Evitar alterar método de entrada depois de iniciar uma lista.'] }
    ]
  }
];

export const SYMPTOMS = [
  { id:'ip-nao-achado', category:'VP8002 / Rede', title:'Não encontro o IP da VP8002', icon: Wifi, cause:'A VPU pode estar sem rede, fora da mesma rede do dispositivo, sem DHCP ou com cabo/porta com problema.', checks:['Confirmar VP8002 ligada e Power verde.', 'Conferir se o cabo está na LAN 1 para rede externa.', 'Verificar LED LINK + ACT.', 'Testar Find my VPU na mesma rede.', 'Pressionar botão da VP8002 para ver o IP no display.', 'Se aparecer 0.0.0.0, tratar como sem ligação de rede.', 'Se aparecer 169.254.xx, tratar como falha de DHCP.'], action:'Corrigir rede/cabo/DHCP antes de tentar configurar Velos/Nedap Now.', source:SOURCES.vp8002 },
  { id:'sem-link', category:'VP8002 / Rede', title:'LINK + ACT apagado', icon: Cable, cause:'Sem ligação LAN física.', checks:['Trocar cabo Ethernet.', 'Testar outra porta do roteador/switch.', 'Confirmar se o roteador está ligado.', 'Conferir se está usando LAN 1 para rede externa.', 'Observar se LINK + ACT volta a acender ou piscar.'], action:'Não seguir para Nedap Now enquanto a rede física não estiver estabelecida.', source:SOURCES.vp8002 },
  { id:'169', category:'VP8002 / Rede', title:'Display mostra 169.254.xx', icon: AlertTriangle, cause:'A VP8002 não recebeu endereço IP do roteador.', checks:['Ativar/verificar DHCP no roteador.', 'Reiniciar VP8002 após corrigir DHCP.', 'Conectar PC/celular na mesma rede.', 'Se roteador não tiver DHCP, configurar IP manual conforme menu.', 'Acionar especialista de rede se persistir.'], action:'Resolver DHCP ou configurar IP manual antes de conectar ao Velos.', source:SOURCES.vp8002 },
  { id:'can-erro', category:'VP8002 / CAN', title:'LED CAN vermelho piscando', icon: CircleAlert, cause:'Há erro no barramento CAN ou alimentação/cablagem associada.', checks:['Abrir opção dE no menu para ler código.', 'Consultar diagnóstico CAN no app.', 'Verificar cabos, conectores e corrosão.', 'Verificar sobrecarga/curto nos V-packs.', 'Após correção, limpar erros no Velos ou sair do menu.'], action:'Não finalizar instalação com CAN em erro.', source:SOURCES.vp8002 },
  { id:'power-ups', category:'Energia', title:'POWER piscando lento ou alerta de UPS', icon: Zap, cause:'A VP8002 pode estar usando alimentação interna/UPS ou com baixa tensão.', checks:['Conferir alimentação principal.', 'Conferir fonte VP2001/adaptador.', 'Verificar tomada e estabilidade de energia.', 'Observar Vin1/Vin2.', 'Se vermelho persistente, escalar suporte.'], action:'Prioridade é estabilizar energia antes dos demais testes.', source:SOURCES.vp8002 },
  { id:'vpack-missing', category:'VP8002 / V-pack', title:'STATUS com 1 flash curto', icon: Cpu, cause:'V-pack em falta.', checks:['Conferir dispositivos esperados.', 'Verificar cabo/conector entre VP8002 e V-packs.', 'Verificar alimentação do V-pack.', 'Confirmar se o V-pack aparece no Velos.', 'Registrar equipamento afetado.'], action:'Resolver comunicação com V-pack antes de validar sistema.', source:SOURCES.vp8002 },
  { id:'antena-cobertura', category:'VP4102 / Antena', title:'Área sem cobertura de tags', icon: RadioTower, cause:'Posição da antena, obstáculos ou alcance insuficiente para o layout.', checks:['Confirmar se antena está fora do alcance dos animais.', 'Verificar se há paredes/telhado metálico ou obstáculos.', 'Conferir se precisa de segunda antena.', 'Usar Tags analysis e caminhar com tag de teste.', 'Observar força de sinal de 1 a 80.'], action:'Reposicionar antena ou planejar antena adicional com sobreposição.', source:SOURCES.set },
  { id:'nedap-setup', category:'Nedap Now', title:'Setup Nedap Now não aparece no Velos', icon: Settings, cause:'Licença/configuração incorreta, Velos desatualizado ou necessidade de reinício.', checks:['Confirmar licença correta no Nedap Now.', 'Atualizar Velos via internet.', 'Reiniciar VPU.', 'Fazer login novamente no Velos.', 'Confirmar que é nova instalação quando o assistente remover dados.'], action:'Não avançar sem opção de setup e conexão correta.', source:SOURCES.now },
  { id:'tag-vinculo', category:'SmartTags', title:'Tag não vincula ao animal', icon: Tags, cause:'Número digitado incorretamente, método de entrada inconsistente ou tag já vinculada.', checks:['Conferir número da tag.', 'Usar QR para SmartTag quando disponível.', 'Na entrada manual, considerar prefixo correto.', 'Verificar se a opção de sobrescrever vínculo existente é necessária.', 'Salvar a lista ao finalizar.'], action:'Registrar tag problemática e revisar vínculo no aplicativo Tag/Cow.', source:SOURCES.now }
];

export const LED_DIAGNOSTICS = [
  { led:'POWER', cor:'Verde', modo:'Aceso', estado:'Ligado / alimentação de reserva interna carregada', acao:'Condição normal de alimentação.' },
  { led:'POWER', cor:'Verde', modo:'Pisca rapidamente', estado:'Carregamento do UPS interno', acao:'Aguardar estabilização; se persistir, verificar alimentação.' },
  { led:'POWER', cor:'Verde', modo:'Pisca lentamente', estado:'UPS interno funcionando', acao:'Verificar alimentação principal, tomada e fonte.' },
  { led:'POWER', cor:'Laranja', modo:'Aceso', estado:'Baixa tensão do UPS', acao:'Verificar fonte de alimentação e estabilidade da energia.' },
  { led:'POWER', cor:'Vermelho', modo:'Piscando', estado:'Tensão do UPS muito baixa', acao:'Prioridade: conferir alimentação e escalar se persistir.' },
  { led:'STATUS', cor:'Azul', modo:'Pisca lentamente', estado:'Funcionamento OK', acao:'Condição normal.' },
  { led:'STATUS', cor:'Azul', modo:'Pisca rapidamente', estado:'Transferindo ou erro ao transferir', acao:'Aguardar; se persistir, verificar atualização/rede.' },
  { led:'STATUS', cor:'Azul', modo:'Pisca muito rapidamente', estado:'Modo de serviço ativo', acao:'Confirmar se foi ativado intencionalmente.' },
  { led:'STATUS', cor:'Azul', modo:'1 flash curto', estado:'V-pack em falta', acao:'Verificar V-packs, cabos, alimentação e comunicação.' },
  { led:'STATUS', cor:'Azul', modo:'2 flashes curtos', estado:'Firmware presente, mas não ativo', acao:'Verificar atualização/ativação de firmware.' },
  { led:'STATUS', cor:'Azul', modo:'3 flashes curtos', estado:'Sem firmware', acao:'Atualizar firmware pelo Velos.' },
  { led:'STATUS / Ecrã', cor:'Vermelho', modo:'Piscando', estado:'Menu ou erro CAN bus', acao:'Abrir dE e consultar código CAN.' },
  { led:'Vin1 / Vin2', cor:'Verde', modo:'Aceso', estado:'Alimentação ligada', acao:'Condição normal.' },
  { led:'Vin1 / Vin2', cor:'Laranja', modo:'Aceso', estado:'Aviso de baixa potência', acao:'Verificar fonte, bitola/comprimento do cabo e tensão.' },
  { led:'Vin1 / Vin2', cor:'Vermelho', modo:'Piscando', estado:'Erro', acao:'Verificar alimentação de entrada e fonte.' },
  { led:'Vout1 / Vout2', cor:'Verde', modo:'Aceso', estado:'Saída ligada', acao:'Normal quando saída está ativa.' },
  { led:'Vout1 / Vout2', cor:'Vermelho', modo:'Piscando', estado:'Erro', acao:'Verificar sobrecarga, curto ou dispositivo conectado.' },
  { led:'CAN1 / CAN2', cor:'Verde', modo:'Aceso', estado:'CAN bus OK', acao:'Condição normal.' },
  { led:'CAN1 / CAN2', cor:'Branco', modo:'Apagado', estado:'CAN bus desligado', acao:'Verificar se CAN está habilitado e há V-packs.' },
  { led:'CAN1 / CAN2', cor:'Vermelho', modo:'Piscando', estado:'Erro do CAN bus', acao:'Consultar código CAN e verificar cabos/conectores.' },
  { led:'LINK + ACT', cor:'Branco', modo:'Apagado', estado:'Sem ligação LAN', acao:'Verificar cabo, porta do roteador/switch e rede.' },
  { led:'LINK + ACT', cor:'Verde', modo:'Aceso', estado:'Ligação LAN 100 Mbps', acao:'Rede conectada em 100 Mbps.' },
  { led:'LINK + ACT', cor:'Branco/Verde', modo:'Piscando', estado:'Atividade de rede', acao:'Condição normal quando há tráfego.' },
  { led:'USB1 / USB2', cor:'Verde', modo:'Aceso', estado:'Ativo', acao:'USB ativo; USB1 pode ser usado para backup.' }
];

export const CAN_ERRORS = [
  ['01','CAN 1','Alimentação desligada','Verifique se o software Velos está desligado no CAN 1.'],
  ['02','CAN 1','Corrente máxima acima do nível máximo','Verifique cablagem, conectores, corrosão e excesso de V-packs/dispositivos.'],
  ['03','CAN 1','Erro do fusível / sobrecarga ou curto','Verifique cablagem, conectores e dispositivos conectados.'],
  ['04','CAN 1','Erro de tensão','Verificar códigos 09, 10, 11 e/ou 12.'],
  ['05','CAN 2','Alimentação desligada','Verifique se o software Velos está desligado no CAN 2.'],
  ['06','CAN 2','Corrente máxima acima do nível máximo','Verifique cablagem, conectores, corrosão e excesso de V-packs/dispositivos.'],
  ['07','CAN 2','Erro do fusível / sobrecarga ou curto','Verifique cablagem, conectores e dispositivos conectados.'],
  ['08','CAN 2','Erro de tensão','Verificar códigos 13, 14, 15 e/ou 16.'],
  ['09','CAN 1','Vout abaixo do mínimo (<15 V CC)','Fonte fraca, cabo fino ou cabo longo demais.'],
  ['10','CAN 1','Vout acima do máximo (>30 V CC)','Fonte defeituosa ou tipo errado de fonte. Substituir fonte.'],
  ['11','CAN 1','Vin abaixo do mínimo (<20 V CC)','Fonte fraca, cabo fino ou cabo longo demais.'],
  ['12','CAN 1','Erro CAN1 e/ou CAN2','Verifique cablagem CAN.'],
  ['13','CAN 2','Vout abaixo do mínimo (<15 V CC)','Fonte fraca, cabo fino ou cabo longo demais.'],
  ['14','CAN 2','Vout acima do máximo (>30 V CC)','Fonte defeituosa ou tipo errado de fonte. Substituir fonte.'],
  ['15','CAN 2','Vin abaixo do mínimo (<20 V CC)','Fonte fraca, cabo fino ou cabo longo demais.'],
  ['16','CAN 2','Erro na fonte interna','Possível fonte interna defeituosa.']
].map(([code,bus,desc,solution])=>({code,bus,desc,solution}));

export const SUPPORT_CHECKS = [
  'Fazenda e equipamento identificados no app',
  'Energia e tomada conferidas',
  'LED Power/Vin conferidos',
  'LINK + ACT conferido',
  'IP localizado ou código 0.0.0.0 / 169.254.xx anotado',
  'PC/celular na mesma rede da VP8002',
  'Cabo LAN testado ou porta trocada',
  'Código CAN verificado se houver LED vermelho',
  'Nedap Now/Velos acessado ou erro registrado',
  'Print/foto/anotação do problema salva na visita',
  'Pendência e próxima ação registradas'
];

export const QUICK_CHECKLISTS = [
  { id:'pre', title:'Pré-instalação', icon: ClipboardList, source:SOURCES.vp8002, items:['Área livre de animais e obstáculos', 'Tomada próxima e acessível', 'Roteador disponível', 'DHCP definido', 'Cabo Ethernet blindado mínimo CAT5', 'Colares previstos anotados'] },
  { id:'base', title:'VP8002', icon: Cpu, source:SOURCES.vp8002, items:['V-box fechada e protegida', 'Alimentação correta', 'LAN 1 no roteador', 'Power/Vin verde', 'IP localizado', 'Velos acessível', 'Checklist de serviço realizado'] },
  { id:'antena', title:'VP4102 / Antena', icon: RadioTower, source:SOURCES.set, items:['Posição planejada', 'Fora do alcance dos animais', 'Cabo da antena firme', 'Cabo não encurtado', 'Ponto registrado no mapa', 'Reader/Tags analysis validado'] },
  { id:'nedap', title:'Nedap Now', icon: Wifi, source:SOURCES.now, items:['Conta/login OK', 'Empresa cadastrada', 'Fazenda criada', 'VPU conectada', 'Setup no Velos concluído', 'Tags adicionadas/vinculadas'] },
  { id:'suporte', title:'Antes de chamar suporte', icon: LifeBuoy, source:'Checklist operacional interno baseado nos manuais.', items: SUPPORT_CHECKS }
];
