export const troubleshootingFlows = [
  {
    id: 'base-luzes',
    equipment: 'Base / Gateway',
    title: 'Diagnóstico de luzes',
    icon: 'gateway',
    severity: 'Manual obrigatório',
    symptom: 'A base apresenta uma luz/padrão de LED e você precisa saber o próximo passo seguro.',
    manualStatus: 'Tabela oficial de LEDs ainda não cadastrada. Use este fluxo para registrar evidência e evitar diagnóstico inventado.',
    checks: [
      { question: 'A base está apagada ou existe alguma luz acesa?', why: 'A primeira separação é energia/fonte versus comportamento operacional.', action: 'Registrar: apagada, ligada com luz fixa, piscando ou alternando.' },
      { question: 'Qual é a cor da luz?', why: 'A cor normalmente indica estado do equipamento, mas precisa ser interpretada pela tabela oficial.', action: 'Anotar cor exata e tirar foto/vídeo curto.' },
      { question: 'A luz está fixa ou piscando?', why: 'O mesmo LED pode ter significado diferente conforme o padrão.', action: 'Anotar se pisca lento, rápido, alterna cores ou fica fixa.' },
      { question: 'Rede e energia estão conferidas?', why: 'Muitos alertas de LED podem ser consequência de fonte, cabo, roteador ou internet.', action: 'Conferir fonte, tomada, cabo de rede e internet antes de escalar.' },
      { question: 'A base aparece no Nedap Now/sistema?', why: 'O LED deve ser comparado com o status real do equipamento no sistema.', action: 'Registrar status online/offline, horário e fazenda vinculada.' }
    ],
    result: 'Sem a tabela oficial cadastrada, não interpretar a luz como defeito definitivo. Registrar evidências e comparar com manual/suporte.'
  },
  {
    id: 'base-instalada-nao-aparece',
    equipment: 'Base / Gateway',
    title: 'Base instalada não aparece no sistema',
    icon: 'gateway',
    severity: 'Crítico',
    symptom: 'A base foi instalada, mas não aparece ou não fica online no Nedap Now/sistema.',
    manualStatus: 'Fluxo estrutural. Complementar com telas oficiais do Nedap Now e manual de instalação.',
    checks: [
      { question: 'O serial/ID da base está correto?', why: 'Cadastro errado faz o equipamento aparecer ausente ou em fazenda errada.', action: 'Conferir etiqueta/serial físico com o cadastro.' },
      { question: 'A base está energizada e com LED ativo?', why: 'Sem energia não existe comunicação.', action: 'Conferir fonte, tomada, nobreak e padrão de luz.' },
      { question: 'A rede local está funcionando?', why: 'Base offline quase sempre precisa separar problema de rede e problema do equipamento.', action: 'Rodar checklist de Rede e Internet no campo.' },
      { question: 'O equipamento recebeu IP?', why: 'Sem IP válido ele não entra na rede.', action: 'Verificar DHCP, IP fixo, máscara, gateway e DNS.' },
      { question: 'O cadastro está vinculado à fazenda correta?', why: 'O técnico pode procurar no local errado dentro do sistema.', action: 'Conferir fazenda, local e nome do equipamento.' }
    ],
    result: 'Registrar serial, fazenda, IP, status no sistema, padrão de luzes e foto da instalação antes de acionar suporte.'
  },
  {
    id: 'vp-nao-comunica',
    equipment: 'VP / Coleira',
    title: 'VP/Coleira sem comunicação',
    icon: 'cow',
    severity: 'Campo',
    symptom: 'A VP/coleira foi instalada, mas não aparece, não atualiza ou não envia dados.',
    manualStatus: 'Fluxo aguardando manual de VP/coleira para validação de posição, janela de sincronização e comportamento esperado.',
    checks: [
      { question: 'O código da VP foi conferido antes de instalar?', why: 'Erro de identificação parece falha de comunicação.', action: 'Comparar código físico com cadastro no sistema.' },
      { question: 'A VP está vinculada ao animal correto?', why: 'Vínculo incorreto gera dado ausente ou dado em animal errado.', action: 'Conferir animal, lote e fazenda.' },
      { question: 'A base/gateway está online?', why: 'Se a base está offline, a VP pode estar correta e mesmo assim não aparecer.', action: 'Rodar diagnóstico da base.' },
      { question: 'O animal está em área de cobertura?', why: 'Distância e barreiras podem impedir leitura.', action: 'Comparar posição do lote com base/antena.' },
      { question: 'Existe tempo mínimo de sincronização?', why: 'Alguns sistemas não atualizam imediatamente.', action: 'Registrar horário da instalação e aguardar a janela oficial quando estiver cadastrada.' }
    ],
    result: 'Não trocar VP antes de validar cadastro, animal, base online, cobertura e tempo de sincronização.'
  },
  {
    id: 'nedap-validacao',
    equipment: 'Nedap Now',
    title: 'Validação no Nedap Now',
    icon: 'book',
    severity: 'Sistema',
    symptom: 'Você precisa conferir se a instalação ficou certa dentro do Nedap Now.',
    manualStatus: 'Aguardando manual/prints do Nedap Now para guiar tela por tela.',
    checks: [
      { question: 'Você está na fazenda correta?', why: 'Em sistemas com várias fazendas, é comum validar no ambiente errado.', action: 'Conferir nome da fazenda e cliente.' },
      { question: 'O equipamento aparece com identificação correta?', why: 'Serial/código errado compromete o histórico.', action: 'Comparar código físico com o que aparece no sistema.' },
      { question: 'O status aparece online, ativo ou equivalente?', why: 'A validação final depende do status mostrado pelo sistema.', action: 'Registrar print/status e horário.' },
      { question: 'Há alertas ou pendências visíveis?', why: 'Uma instalação pode aparecer, mas ainda com aviso.', action: 'Anotar o alerta exatamente como aparece.' },
      { question: 'O registro de campo foi salvo?', why: 'Sem registro, você perde evidência do que foi feito.', action: 'Salvar fazenda, local, equipamento, status e observação.' }
    ],
    result: 'Validação boa é a que deixa evidência: equipamento certo, fazenda certa, status registrado e pendência clara.'
  },
  {
    id: 'rede-internet',
    equipment: 'Rede / Internet',
    title: 'Sem internet / IP não responde',
    icon: 'wifi',
    severity: 'Muito comum',
    symptom: 'Base, notebook ou equipamento não conecta, não sincroniza ou não responde IP.',
    manualStatus: 'Fluxo geral de rede. Complementar depois com portas/URLs oficiais se existirem no manual.',
    checks: [
      { question: 'Outro dispositivo navega na mesma rede?', why: 'Se nada navega, o problema é internet geral, não só a base.', action: 'Testar celular/notebook na mesma rede.' },
      { question: 'O cabo/porta foi testado?', why: 'Cabo ruim e porta errada são causas muito comuns.', action: 'Trocar cabo e testar outra porta LAN.' },
      { question: 'O equipamento recebeu IP?', why: 'Sem IP não há comunicação local.', action: 'Verificar DHCP ou configuração manual.' },
      { question: 'IP, máscara, gateway e DNS estão coerentes?', why: 'Configuração errada pode parecer equipamento defeituoso.', action: 'Anotar valores e comparar com a rede local.' },
      { question: 'Existe bloqueio da rede do cliente?', why: 'Redes corporativas podem bloquear serviços.', action: 'Registrar evidências e solicitar liberação ao responsável/suporte.' }
    ],
    result: 'Antes de escalar, registrar IP do equipamento, IP do seu dispositivo, gateway, DNS, teste de cabo e status da internet.'
  }
];
