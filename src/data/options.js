export const farmStatuses = ['Não iniciada', 'Em andamento', 'Instalação concluída', 'Aguardando validação', 'Com pendência', 'Finalizada']
export const equipmentTypes = ['VP8002 — Processador/Base', 'VP4102 — Antena', 'Outro equipamento']
export const equipmentStatuses = ['Planejado', 'Instalado', 'Configurado', 'Validado', 'Com problema', 'Removido']
export const visitTypes = ['Instalação', 'Manutenção', 'Diagnóstico', 'Retorno', 'Validação', 'Treinamento', 'Suporte']
export const dairyLocations = ['Ordenha', 'Sala de leite', 'Curral', 'Galpão 01', 'Galpão 02', 'Galpão compost barn', 'Free stall', 'Piquete', 'Bezerreiro', 'Pré-parto', 'Pós-parto', 'Casa de máquinas', 'Escritório', 'Sala técnica', 'Torre', 'Caixa d’água', 'Barracão', 'Cocho', 'Pista de trato', 'Outro']

export const checklistTemplates = [
  {
    tipo: 'pré-instalação', titulo: 'Pré-instalação da fazenda',
    itens: ['Confirmar quantidade prevista de colares', 'Confirmar energia disponível para base/processador', 'Confirmar internet/roteador disponível no local', 'Separar equipamentos VP8002/VP4102', 'Definir pontos prováveis de antena', 'Registrar observações iniciais da fazenda']
  },
  {
    tipo: 'base-vp8002', titulo: 'Instalação VP8002 — Processador/Base',
    itens: ['Escolher local protegido e acessível', 'Conferir alimentação elétrica', 'Conectar rede conforme padrão da fazenda', 'Registrar código original e apelido', 'Registrar coordenada GPS ou marcar no mapa', 'Validar LEDs conforme manual oficial', 'Registrar pendências se houver']
  },
  {
    tipo: 'antena-vp4102', titulo: 'Instalação VP4102 — Antena',
    itens: ['Definir local de cobertura', 'Fixar antena com segurança', 'Registrar código original', 'Definir apelido operacional', 'Registrar local na fazenda', 'Registrar coordenada ou marcar no mapa', 'Validar comunicação conforme manual oficial']
  },
  {
    tipo: 'finalização', titulo: 'Finalização da visita',
    itens: ['Conferir equipamentos cadastrados', 'Conferir mapa da fazenda', 'Atualizar quantidade de colares instalados', 'Registrar problemas encontrados', 'Registrar solução aplicada', 'Registrar próxima ação', 'Gerar relatório da fazenda']
  }
]

export const diagnosticSections = [
  { title: 'Base / VP8002', items: ['Sem energia', 'Não comunica', 'Luzes fora do padrão', 'Internet ok mas base offline', 'Não aparece no Nedap Now'] },
  { title: 'Antena / VP4102', items: ['Sem sinal', 'Cobertura fraca', 'Ponto mal posicionado', 'Comunicação instável'] },
  { title: 'VP / Coleira', items: ['Não aparece', 'Sem leitura', 'Animal sem dados', 'Código divergente'] },
  { title: 'Rede / Internet', items: ['Sem internet', 'IP não responde', 'DHCP não entrega IP', 'DNS com falha'] }
]
