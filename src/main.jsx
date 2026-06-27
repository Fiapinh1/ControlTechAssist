import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Home, MapPinned, ClipboardCheck, Stethoscope, FileText, Plus, Search, Save, Pencil,
  Trash2, Cpu, RadioTower, Map as MapIcon, CalendarDays, BarChart3, LogOut, User,
  Navigation, Satellite, Layers, CheckCircle2, AlertTriangle, ClipboardList, Building2,
  Phone, MapPin, Hash, BadgeCheck, Wrench, X, Download, Database, Wifi, BookOpen,
  ChevronLeft, Sparkles, Route, HelpCircle, ShieldCheck, Tags, Ruler, Send, Target,
  ClipboardX, CircleAlert, Cable, Zap, Settings, Clock, Check, PlayCircle, Info,
  ClipboardPenLine, LifeBuoy, FileDown, Antenna, Gauge, ScanLine, Globe2, Filter, LocateFixed
} from 'lucide-react';
import './styles.css';

const APP_VERSION = '1.6.0';
const LOCAL_MODE_KEY = 'cta_allow_local_mode';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const uid = () => crypto.randomUUID?.() || String(Date.now() + Math.random());
const nowISO = () => new Date().toISOString();
const brDate = (v) => v ? new Date(v).toLocaleDateString('pt-BR') : '-';
const num = (v) => Number(v || 0);

const FARM_STATUS = ['Não iniciada', 'Em andamento', 'Instalação concluída', 'Aguardando validação', 'Com pendência', 'Finalizada'];
const CENTRAIS = ['Alta Genetics', 'Genex Brasil', 'Outra / Não informado'];
const EQUIP_TYPES = ['VP8002 — Processador/Base', 'VP4102 — Antena', 'Outro equipamento'];
const EQUIP_STATUS = ['Planejado', 'Instalado', 'Configurado', 'Validado', 'Com problema', 'Removido'];
const VISIT_TYPES = ['Instalação', 'Manutenção', 'Diagnóstico', 'Retorno', 'Validação', 'Treinamento', 'Suporte'];
const LOCAL_SUGGESTIONS = ['Ordenha', 'Sala de leite', 'Curral', 'Galpão 01', 'Galpão 02', 'Compost barn', 'Free stall', 'Piquete', 'Bezerreiro', 'Pré-parto', 'Pós-parto', 'Casa de máquinas', 'Escritório', 'Sala técnica', 'Torre', 'Caixa d’água', 'Barracão', 'Cocho', 'Pista de trato', 'Outro'];

const UF_CODES = {
  11:'RO',12:'AC',13:'AM',14:'RR',15:'PA',16:'AP',17:'TO',21:'MA',22:'PI',23:'CE',24:'RN',25:'PB',26:'PE',27:'AL',28:'SE',29:'BA',
  31:'MG',32:'ES',33:'RJ',35:'SP',41:'PR',42:'SC',43:'RS',50:'MS',51:'MT',52:'GO',53:'DF'
};
const UF_NAMES = {
  AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'
};
const STATE_CENTER = { MG:[-18.5122,-44.5550], SP:[-22.2569,-48.4804], RJ:[-22.2500,-42.6600], ES:[-19.1834,-40.3089], PR:[-24.89,-51.55], SC:[-27.33,-49.44], RS:[-30.03,-51.23], GO:[-16.64,-49.31], DF:[-15.78,-47.93], MS:[-20.51,-54.54], MT:[-12.64,-55.42], BA:[-12.97,-38.51], PE:[-8.05,-34.9], CE:[-3.73,-38.52], PA:[-1.45,-48.5] };
const STATE_COLORS = { 'Alta Genetics':'#22c55e', 'Genex Brasil':'#2563eb', 'Outra / Não informado':'#14b8a6', mixed:'#8b5cf6', none:'#e5e7eb' };
function getFarmUF(f){ return (f.estado_uf || parseUF(f.cidade) || '').toUpperCase(); }
function parseUF(city=''){ const m=String(city).match(/\b([A-Z]{2})\b$/); return m?.[1] || ''; }
function farmLatLng(f){ if(f.latitude && f.longitude) return [Number(f.latitude), Number(f.longitude)]; const uf=getFarmUF(f); return STATE_CENTER[uf] || [-14.2350,-51.9253]; }
function centralForUF(fazendas, uf){ const list=fazendas.filter(f=>getFarmUF(f)===uf); if(!list.length) return 'none'; const counts={}; list.forEach(f=>{ const c=f.central||'Outra / Não informado'; counts[c]=(counts[c]||0)+1; }); const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]); return sorted.length>1 && sorted[0][1]===sorted[1][1] ? 'mixed' : sorted[0][0]; }
function getGeoUF(feature){ const p=feature?.properties||{}; const raw=p.sigla || p.SIGLA || p.uf || p.UF || p.codarea || p.CD_UF || p.id || p.ID; if(String(raw||'').length===2 && /[A-Z]{2}/.test(String(raw))) return String(raw).toUpperCase(); const str=String(raw||'').replace(/\D/g,''); return UF_CODES[Number(str)] || ''; }
function flattenCoords(coords, out=[]){ if(!Array.isArray(coords)) return out; if(typeof coords[0]==='number' && typeof coords[1]==='number'){ out.push(coords); return out; } coords.forEach(c=>flattenCoords(c,out)); return out; }
function centroidOfGeoJSON(geo){ const feature = geo?.type==='FeatureCollection' ? geo.features?.[0] : geo?.type==='Feature' ? geo : null; const pts = flattenCoords(feature?.geometry?.coordinates || []); if(!pts.length) return null; let lon=0, lat=0; pts.forEach(([x,y])=>{lon+=Number(x); lat+=Number(y)}); return [lat/pts.length, lon/pts.length]; }
async function fetchCityCentroid(codigo){ if(!codigo) return null; const url=`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigo}?formato=application/vnd.geo+json&qualidade=minima`; const res=await fetch(url); if(!res.ok) return null; const geo=await res.json(); return centroidOfGeoJSON(geo); }


const SOURCES = {
  vp8002: 'Fonte: Manual VP8002 v6.0 PT — Nedap, out/2024.',
  set: 'Fonte: Manual VP8002-VP4102 set v2.0 EN — Nedap, ago/2022. Conteúdo traduzido e adaptado para português no app.',
  now: 'Fonte: Manual Nedap Now — Configuração da fazenda v4.0 PT — Nedap, abr/2024.'
};

const INSTALL_GUIDES = [
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

const SYMPTOMS = [
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

const LED_DIAGNOSTICS = [
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

const CAN_ERRORS = [
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

const SUPPORT_CHECKS = [
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

const QUICK_CHECKLISTS = [
  { id:'pre', title:'Pré-instalação', icon: ClipboardList, source:SOURCES.vp8002, items:['Área livre de animais e obstáculos', 'Tomada próxima e acessível', 'Roteador disponível', 'DHCP definido', 'Cabo Ethernet blindado mínimo CAT5', 'Colares previstos anotados'] },
  { id:'base', title:'VP8002', icon: Cpu, source:SOURCES.vp8002, items:['V-box fechada e protegida', 'Alimentação correta', 'LAN 1 no roteador', 'Power/Vin verde', 'IP localizado', 'Velos acessível', 'Checklist de serviço realizado'] },
  { id:'antena', title:'VP4102 / Antena', icon: RadioTower, source:SOURCES.set, items:['Posição planejada', 'Fora do alcance dos animais', 'Cabo da antena firme', 'Cabo não encurtado', 'Ponto registrado no mapa', 'Reader/Tags analysis validado'] },
  { id:'nedap', title:'Nedap Now', icon: Wifi, source:SOURCES.now, items:['Conta/login OK', 'Empresa cadastrada', 'Fazenda criada', 'VPU conectada', 'Setup no Velos concluído', 'Tags adicionadas/vinculadas'] },
  { id:'suporte', title:'Antes de chamar suporte', icon: LifeBuoy, source:'Checklist operacional interno baseado nos manuais.', items: SUPPORT_CHECKS }
];

function saveLocal(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function loadLocal(k){ try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } }

function useData(user, localMode=false){
  const [fazendas,setFazendas]=useState([]), [equipamentos,setEquipamentos]=useState([]), [visitas,setVisitas]=useState([]), [checklists,setChecklists]=useState([]), [diagnosticos,setDiagnosticos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [dbStatus,setDbStatus]=useState({
    mode: supabase ? 'supabase' : 'local',
    connected: false,
    lastError: supabase ? 'Aguardando autenticação/teste do Supabase.' : 'Supabase não configurado no .env.local.',
    lastSync: null,
    details: {}
  });
  const cloud = Boolean(supabase && user && !localMode);

  const setError = (message, details={}) => setDbStatus(prev => ({...prev, connected:false, lastError:message || 'Erro desconhecido no banco.', details}));
  const setOk = (message='Supabase conectado') => setDbStatus(prev => ({...prev, mode: cloud?'supabase':'local', connected:cloud, lastError: cloud ? '' : prev.lastError, lastSync:new Date().toLocaleString('pt-BR')}));

  async function testConnection(){
    if(!supabase) { setError('Supabase não configurado. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'); return false; }
    if(!user) { setError('Usuário não autenticado. Faça login para usar o banco.'); return false; }
    const { error } = await supabase.from('fazendas').select('id').limit(1);
    if(error){ setError(`Falha ao acessar tabela fazendas: ${error.message}`, error); return false; }
    setOk(); return true;
  }

  useEffect(()=>{
    let alive = true;
    async function load(){
      setLoading(true);
      if(cloud){
        const tables = await Promise.all([
          supabase.from('fazendas').select('*').order('created_at',{ascending:false}),
          supabase.from('equipamentos').select('*').order('created_at',{ascending:false}),
          supabase.from('visitas').select('*').order('data_visita',{ascending:false}),
          supabase.from('checklists_fazenda').select('*').order('created_at',{ascending:false}),
          supabase.from('diagnosticos_realizados').select('*').order('created_at',{ascending:false})
        ]);
        if(!alive) return;
        const firstError = tables.find(t=>t.error)?.error;
        if(firstError){
          setError(firstError.message, firstError);
          setLoading(false);
          return;
        }
        setFazendas(tables[0].data||[]); setEquipamentos(tables[1].data||[]); setVisitas(tables[2].data||[]); setChecklists(tables[3].data||[]); setDiagnosticos(tables[4].data||[]);
        setOk();
      } else {
        setFazendas(loadLocal('cta_fazendas')); setEquipamentos(loadLocal('cta_equipamentos')); setVisitas(loadLocal('cta_visitas')); setChecklists(loadLocal('cta_checklists')); setDiagnosticos(loadLocal('cta_diagnosticos'));
        setDbStatus({mode:'local',connected:false,lastError: supabase ? 'Modo local de emergência ativado manualmente.' : 'Supabase não configurado no .env.local.', lastSync:new Date().toLocaleString('pt-BR'), details:{}});
      }
      setLoading(false);
    }
    load(); return ()=>{alive=false};
  },[cloud,user?.id,localMode]);

  async function upsert(table, setter, key, row){
    const clean = {...row, updated_at: nowISO()};
    if(cloud){
      const { error } = await supabase.from(table).upsert(clean);
      if(error){
        setError(`Erro ao salvar em ${table}: ${error.message}`, error);
        alert(`Não foi possível salvar no Supabase.\n\n${error.message}`);
        return {ok:false,error};
      }
      setOk();
    }
    setter(prev => { const exists=prev.some(x=>x.id===clean.id); const next=exists?prev.map(x=>x.id===clean.id?clean:x):[clean,...prev]; if(!cloud) saveLocal(key,next); return next; });
    return {ok:true};
  }
  async function remove(table, setter, key, id){
    if(!confirm('Remover este registro?')) return {ok:false};
    if(cloud){
      const { error } = await supabase.from(table).delete().eq('id',id);
      if(error){
        setError(`Erro ao remover de ${table}: ${error.message}`, error);
        alert(`Não foi possível remover no Supabase.\n\n${error.message}`);
        return {ok:false,error};
      }
      setOk();
    }
    setter(prev => { const next=prev.filter(x=>x.id!==id); if(!cloud) saveLocal(key,next); return next; });
    return {ok:true};
  }
  return {
    cloud, loading, dbStatus, testConnection,
    fazendas, equipamentos, visitas, checklists, diagnosticos,
    saveFazenda: r => upsert('fazendas', setFazendas, 'cta_fazendas', {...r, user_id:user?.id}),
    saveEquipamento: r => upsert('equipamentos', setEquipamentos, 'cta_equipamentos', {...r, user_id:user?.id}),
    saveVisita: r => upsert('visitas', setVisitas, 'cta_visitas', {...r, user_id:user?.id}),
    saveChecklist: r => upsert('checklists_fazenda', setChecklists, 'cta_checklists', {...r, user_id:user?.id}),
    saveDiagnostico: r => upsert('diagnosticos_realizados', setDiagnosticos, 'cta_diagnosticos', {...r, user_id:user?.id}),
    delFazenda: id => remove('fazendas', setFazendas, 'cta_fazendas', id),
    delEquipamento: id => remove('equipamentos', setEquipamentos, 'cta_equipamentos', id),
    delVisita: id => remove('visitas', setVisitas, 'cta_visitas', id)
  };
}

function useAppUpdate(){
  const [updateAvailable,setUpdateAvailable]=useState(false);
  const [registration,setRegistration]=useState(null);
  useEffect(()=>{
    if(!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('/sw.js').then(reg=>{
      setRegistration(reg);
      reg.addEventListener('updatefound',()=>{
        const worker = reg.installing;
        if(!worker) return;
        worker.addEventListener('statechange',()=>{
          if(worker.state === 'installed' && navigator.serviceWorker.controller){
            setUpdateAvailable(true);
          }
        });
      });
      if(reg.waiting) setUpdateAvailable(true);
    }).catch(()=>{});
  },[]);
  const applyUpdate = async()=>{
    const worker = registration?.waiting;
    if(worker){ worker.postMessage({type:'SKIP_WAITING'}); return; }
    await forceRefreshApp();
  };
  return {updateAvailable, applyUpdate};
}

async function forceRefreshApp(){
  if('serviceWorker' in navigator){
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r=>r.update().catch(()=>{})));
  }
  if('caches' in window){
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('controltech-assist')).map(k=>caches.delete(k)));
  }
  window.location.reload();
}

function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(Boolean(supabase));
  const [view,setView]=useState('fazendas');
  const [selectedFarmId,setSelectedFarmId]=useState(null);
  const [localMode,setLocalMode]=useState(localStorage.getItem(LOCAL_MODE_KEY)==='true');
  const update = useAppUpdate();
  const data=useData(user, localMode);
  const selectedFarm=data.fazendas.find(f=>f.id===selectedFarmId);
  useEffect(()=>{ if(!supabase) { setAuthLoading(false); return; } supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null); setAuthLoading(false)}); const {data:sub}=supabase.auth.onAuthStateChange((_e,session)=>setUser(session?.user||null)); return ()=>sub.subscription.unsubscribe(); },[]);
  if(authLoading) return <Splash/>;
  if(!supabase && !localMode) return <SupabaseSetup onUseLocal={()=>{localStorage.setItem(LOCAL_MODE_KEY,'true'); setLocalMode(true)}}/>;
  if(supabase && !user && !localMode) return <Login onUseLocal={()=>{localStorage.setItem(LOCAL_MODE_KEY,'true'); setLocalMode(true)}}/>;
  const goFarm = id => { setSelectedFarmId(id); setView('fazenda'); };
  const setMainView = v => { setView(v); if(v!=='fazenda') setSelectedFarmId(null); };
  return <div className="app"><Sidebar view={view} setView={setMainView} user={user} cloud={data.cloud} localMode={localMode} onExitLocal={()=>{localStorage.removeItem(LOCAL_MODE_KEY); setLocalMode(false)}}/><main className="main">
    <UpdateBanner update={update}/>
    <SystemStatus data={data} localMode={localMode} onDisableLocal={()=>{localStorage.removeItem(LOCAL_MODE_KEY); setLocalMode(false)}}/>
    {view==='fazendas' && <Fazendas data={data} onOpen={goFarm}/>} 
    {view==='instalacao' && <Instalacao data={data}/>} 
    {view==='diagnostico' && <Diagnostico data={data}/>} 
    {view==='guia' && <Guia/>} 
    {view==='relatorios' && <Relatorios data={data} onOpen={goFarm}/>} 
    {view==='fazenda' && selectedFarm && <FazendaDetalhe farm={selectedFarm} data={data} onBack={()=>setMainView('fazendas')}/>} 
  </main><BottomNav view={view} setView={setMainView}/></div>;
}

function Splash(){return <div className="splash"><Logo/><p>Carregando ambiente técnico...</p></div>}
function Logo(){return <div className="logo"><div className="logoIcon"><ClipboardCheck size={25}/><Wifi size={15} className="wifi"/></div><div><b>ControlTech</b><span>Assist</span></div></div>}
function Login({onUseLocal}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState('login'),[msg,setMsg]=useState('');
  const submit=async(e)=>{e.preventDefault();setMsg(''); const fn=mode==='login'?supabase.auth.signInWithPassword:supabase.auth.signUp; const {error}=await fn({email,password}); setMsg(error?error.message:(mode==='login'?'Entrando...':'Cadastro criado. Verifique o e-mail se necessário.'))};
  return <div className="loginPage"><section className="loginCard"><Logo/><h1>Seu copiloto técnico de campo</h1><p>Fazendas, visitas, equipamentos, mapa, checklists e diagnóstico baseado em manual oficial.</p><form onSubmit={submit} className="form"><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="seu@email.com"/></label><label>Senha<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="mínimo 6 caracteres"/></label><button className="btn primary">{mode==='login'?'Entrar':'Criar conta'}</button></form><button className="linkBtn" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?'Criar uma conta':'Já tenho conta'}</button>{msg&&<div className="notice">{msg}</div>}<button type="button" className="linkBtn dangerText" onClick={onUseLocal}>Usar modo local de emergência</button></section></div>
}

function SupabaseSetup({onUseLocal}){
  return <div className="loginPage"><section className="loginCard"><Logo/><h1>Supabase não configurado</h1><p>O app agora usa o banco como padrão. Crie um arquivo <b>.env.local</b> na raiz do projeto e reinicie o servidor.</p><pre className="codeBox">VITE_SUPABASE_URL=https://zczqkiffjnracgopczkk.supabase.co{`\n`}VITE_SUPABASE_ANON_KEY=sua_chave_anon_public</pre><p>Depois rode novamente <b>npm run dev</b>.</p><button className="btn primary full" onClick={()=>window.location.reload()}>Tentar novamente</button><button type="button" className="linkBtn dangerText" onClick={onUseLocal}>Usar modo local de emergência</button></section></div>
}

function UpdateBanner({update}){
  if(!update.updateAvailable) return null;
  return <div className="updateBanner"><div><b>Nova versão disponível</b><span>Atualize para carregar a versão mais recente do ControlTech Assist.</span></div><button className="btn primary" onClick={update.applyUpdate}>Atualizar agora</button></div>
}

function SystemStatus({data, localMode, onDisableLocal}){
  const [open,setOpen]=useState(false);
  const s=data.dbStatus || {};
  const statusText = data.cloud ? 'Supabase conectado' : localMode ? 'Modo local de emergência' : 'Banco não conectado';
  const cls = data.cloud ? 'ok' : 'warn';
  return <section className={`systemStatus ${cls}`}><button className="systemSummary" onClick={()=>setOpen(!open)}><Database size={17}/><b>{statusText}</b><span>v{APP_VERSION}</span>{s.lastSync&&<small>Última sincronização: {s.lastSync}</small>}</button><button className="linkBtn" onClick={async()=>{await data.testConnection();}}>Testar Supabase</button><button className="linkBtn" onClick={forceRefreshApp}>Atualizar app/cache</button>{localMode&&<button className="linkBtn dangerText" onClick={onDisableLocal}>Sair do modo local</button>}{open&&<div className="systemDetails"><p><b>URL configurada:</b> {supabaseUrl ? 'sim' : 'não'}</p><p><b>Chave configurada:</b> {supabaseKey ? 'sim' : 'não'}</p><p><b>Usuário logado:</b> {supabase && !localMode ? 'sim' : localMode ? 'modo local' : 'não'}</p><p><b>Modo atual:</b> {data.cloud ? 'Supabase' : 'Local'}</p>{s.lastError&&<p><b>Último aviso:</b> {s.lastError}</p>}</div>}</section>
}

function Sidebar({view,setView,user,cloud,localMode,onExitLocal}){const items=[['fazendas',MapPinned,'Fazendas'],['instalacao',Route,'Instalação'],['diagnostico',Stethoscope,'Diagnóstico'],['guia',BookOpen,'Guia'],['relatorios',BarChart3,'Relatórios']];return <aside className="sidebar"><Logo/><nav>{items.map(([id,Icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={20}/>{label}</button>)}</nav><div className="sideFoot"><span className={cloud?'cloud on':'cloud'}><Database size={15}/>{cloud?'Supabase ativo':'Modo local'}</span>{localMode&&<button className="logout" onClick={onExitLocal}><Database size={16}/> Voltar ao Supabase</button>}{user&&<button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sair</button>}</div></aside>}
function BottomNav({view,setView}){const items=[['fazendas',Home,'Início'],['instalacao',Route,'Instalar'],['diagnostico',Stethoscope,'Diag.'],['guia',BookOpen,'Guia'],['relatorios',BarChart3,'Rel.']];return <nav className="bottomNav">{items.map(([id,Icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={20}/><span>{label}</span></button>)}</nav>}
function PageHead({eyebrow,title,desc,children}){return <header className="pageHead"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{desc&&<p>{desc}</p>}</div><div className="headActions">{children}</div></header>}
function Stat({icon:Icon,label,value,tone=''}){return <div className={`stat ${tone}`}><Icon size={22}/><div><b>{value}</b><span>{label}</span></div></div>}
function Empty({icon:Icon=Info,title,text}){return <div className="empty"><Icon size={42}/><h3>{title}</h3><p>{text}</p></div>}


function BrasilAtuacaoMap({fazendas,onOpen}){
  const [geo,setGeo]=useState(null), [filter,setFilter]=useState('Todas'), [err,setErr]=useState('');
  useEffect(()=>{ let alive=true; fetch('https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF').then(r=>r.json()).then(g=>alive&&setGeo(g)).catch(()=>alive&&setErr('Não foi possível carregar a malha dos estados pelo IBGE. Os pontos continuam disponíveis no mapa.')); return()=>{alive=false}; },[]);
  const farms = fazendas.filter(f=>filter==='Todas'||(f.central||'Outra / Não informado')===filter);
  const statesActive = new Set(farms.map(getFarmUF).filter(Boolean));
  const styleFeature = (feature) => { const uf=getGeoUF(feature); const central=centralForUF(farms,uf); const active=statesActive.has(uf); return { color:'#ffffff', weight:1.2, fillColor: active ? (STATE_COLORS[central]||STATE_COLORS.mixed) : STATE_COLORS.none, fillOpacity: active ? .82 : .65 }; };
  return <section className="panel coveragePanel"><div className="sectionTitle"><h2><Globe2 size={21}/> Mapa de atuação</h2><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></div>
    <p className="mutedLine">Estados ficam cinza até você cadastrar uma fazenda naquele UF. Os pontos mostram as cidades/fazendas visitadas.</p>
    <div className="legend"><span><i style={{background:STATE_COLORS['Alta Genetics']}}/> Alta Genetics</span><span><i style={{background:STATE_COLORS['Genex Brasil']}}/> Genex Brasil</span><span><i style={{background:STATE_COLORS.mixed}}/> Mais de uma central</span><span><i style={{background:STATE_COLORS.none}}/> Sem atendimento</span></div>
    <div className="brMap"><MapContainer center={[-15.8,-47.9]} zoom={4} minZoom={3} className="bigMap" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
      {geo && <GeoJSON key={filter+fazendas.length} data={geo} style={styleFeature} onEachFeature={(feature,layer)=>{const uf=getGeoUF(feature); const count=farms.filter(f=>getFarmUF(f)===uf).length; layer.bindTooltip(`${uf || 'UF'} • ${count} fazenda(s)`);}} />}
      {farms.map(f=><Marker key={f.id} position={farmLatLng(f)} eventHandlers={{click:()=>onOpen(f.id)}}><Popup><b>{f.nome}</b><br/>{f.cidade||'-'} {getFarmUF(f)&&`/ ${getFarmUF(f)}`}<br/>Central: {f.central||'-'}<br/>Regional: {f.regional_nome||'-'}<br/>Colares: {num(f.qtd_colares_instalada)} / {num(f.qtd_colares_prevista)}</Popup></Marker>)}
    </MapContainer></div>{err&&<p className="sourceText">{err}</p>}</section>
}

function Fazendas({data,onOpen}){
  const [q,setQ]=useState(''),[modal,setModal]=useState(false),[central,setCentral]=useState('Todas');
  const farms=data.fazendas.filter(f=>{
    const matchesText=[f.nome,f.cidade,f.responsavel,f.central,f.regional_nome,f.veterinario_apoio].join(' ').toLowerCase().includes(q.toLowerCase());
    const matchesCentral=central==='Todas'||(f.central||'Outra / Não informado')===central;
    return matchesText&&matchesCentral;
  });
  const emAndamento=data.fazendas.filter(f=>f.status==='Em andamento').length;
  const finalizadas=data.fazendas.filter(f=>f.status==='Finalizada'||f.status==='Instalação concluída').length;
  const alta=data.fazendas.filter(f=>f.central==='Alta Genetics').length;
  const genex=data.fazendas.filter(f=>f.central==='Genex Brasil').length;
  return <div><PageHead eyebrow="Controle de visitas" title="Minhas fazendas" desc="Agora você pode separar as fazendas por central, regional e apoio veterinário."><button className="btn primary" onClick={()=>setModal(true)}><Plus size={18}/> Nova fazenda</button></PageHead>
    <div className="statsGrid"><Stat icon={MapPinned} label="fazendas" value={data.fazendas.length}/><Stat icon={Building2} label="Alta Genetics" value={alta} tone="green"/><Stat icon={ShieldCheck} label="Genex Brasil" value={genex}/><Stat icon={Hash} label="colares previstos" value={data.fazendas.reduce((a,f)=>a+num(f.qtd_colares_prevista),0)}/></div>
    <BrasilAtuacaoMap fazendas={data.fazendas} onOpen={onOpen}/><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar fazenda, central, regional, veterinário ou cidade..."/></div></div>
    <div className="filterChips"><button className={central==='Todas'?'active':''} onClick={()=>setCentral('Todas')}>Todas</button>{CENTRAIS.map(c=><button key={c} className={central===c?'active':''} onClick={()=>setCentral(c)}>{c}</button>)}</div>
    {farms.length===0?<Empty title="Nenhuma fazenda encontrada" text="Altere o filtro ou cadastre uma nova fazenda."/>:<div className="farmGrid">{farms.map(f=><FarmCard key={f.id} farm={f} data={data} onOpen={()=>onOpen(f.id)}/>)}</div>}
    {modal&&<FazendaModal onClose={()=>setModal(false)} onSave={(r)=>{data.saveFazenda(r);setModal(false)}}/>}</div>
}
function FarmCard({farm,data,onOpen}){const eq=data.equipamentos.filter(e=>e.fazenda_id===farm.id).length; const visits=data.visitas.filter(v=>v.fazenda_id===farm.id); const pct=num(farm.qtd_colares_prevista)?Math.round(num(farm.qtd_colares_instalada)/num(farm.qtd_colares_prevista)*100):0; return <article className="farmCard" onClick={onOpen}><div className="cardTop"><div className="badgeIcon"><Building2 size={20}/></div><span className={`status ${farm.status?.includes('pend')?'warn':farm.status?.includes('Final')||farm.status?.includes('conclu')?'ok':''}`}>{farm.status||'Não iniciada'}</span></div><div className="farmCentral"><span>{farm.central||'Central não informada'}</span></div><h3>{farm.nome}</h3><p><MapPin size={15}/>{farm.cidade||'Cidade não informada'}{getFarmUF(farm)?` / ${getFarmUF(farm)}`:''}</p><p><User size={15}/>{farm.responsavel||'Responsável não informado'}</p><p><ShieldCheck size={15}/>{farm.regional_nome||'Regional não informado'}</p>{farm.veterinario_apoio&&<p><Stethoscope size={15}/>{farm.veterinario_apoio}</p>}<div className="progress"><span style={{width:`${Math.min(pct,100)}%`}}/></div><div className="miniStats"><span><b>{num(farm.qtd_colares_instalada)}</b> instalados</span><span><b>{num(farm.qtd_colares_prevista)}</b> previstos</span><span><b>{eq}</b> equips.</span></div><footer>Última visita: {visits[0]?brDate(visits[0].data_visita):'sem visita'}<ChevronLeft className="rotate" size={17}/></footer></article>}
function FazendaModal({farm={},onClose,onSave}){
  const [ufs,setUfs]=useState([]),[cities,setCities]=useState([]),[loadingCities,setLoadingCities]=useState(false);
  const [form,setForm]=useState({id:farm.id||uid(),nome:farm.nome||'',central:farm.central||'',regional_nome:farm.regional_nome||'',veterinario_apoio:farm.veterinario_apoio||'',responsavel:farm.responsavel||'',telefone:farm.telefone||'',estado_uf:farm.estado_uf||parseUF(farm.cidade)||'',estado_nome:farm.estado_nome||'',cidade:farm.cidade?.replace(/\s*\/\s*[A-Z]{2}$/,'')||'',codigo_ibge_cidade:farm.codigo_ibge_cidade||'',latitude:farm.latitude||'',longitude:farm.longitude||'',localizacao_origem:farm.localizacao_origem||'',endereco:farm.endereco||'',qtd_colares_prevista:farm.qtd_colares_prevista||'',qtd_colares_instalada:farm.qtd_colares_instalada||'',status:farm.status||'Não iniciada',observacoes:farm.observacoes||'',created_at:farm.created_at||nowISO()});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  useEffect(()=>{ let alive=true; fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(r=>r.json()).then(list=>alive&&setUfs(list)).catch(()=>{}); return()=>{alive=false}; },[]);
  useEffect(()=>{ if(!form.estado_uf){setCities([]);return;} let alive=true; setLoadingCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado_uf}/municipios?orderBy=nome`).then(r=>r.json()).then(list=>{if(alive)setCities(list)}).catch(()=>alive&&setCities([])).finally(()=>alive&&setLoadingCities(false)); return()=>{alive=false}; },[form.estado_uf]);
  async function chooseCity(code){ const city=cities.find(c=>String(c.id)===String(code)); setForm(prev=>({...prev,codigo_ibge_cidade:code,cidade:city?.nome||prev.cidade,localizacao_origem:'cidade'})); try{ const c=await fetchCityCentroid(code); if(c) setForm(prev=>({...prev,latitude:c[0],longitude:c[1],localizacao_origem:'cidade'})); }catch{} }
  function useGPS(){ if(!navigator.geolocation){alert('GPS não disponível neste navegador.');return;} navigator.geolocation.getCurrentPosition(pos=>setForm(prev=>({...prev,latitude:pos.coords.latitude,longitude:pos.coords.longitude,localizacao_origem:'gps'})),()=>alert('Não foi possível obter GPS. No iPhone, verifique permissão e HTTPS.'),{enableHighAccuracy:true,timeout:12000}); }
  return <Modal title={farm.id?'Editar fazenda':'Nova fazenda'} onClose={onClose}><form className="form modern" onSubmit={e=>{e.preventDefault();onSave({...form,qtd_colares_prevista:num(form.qtd_colares_prevista),qtd_colares_instalada:num(form.qtd_colares_instalada),latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null})}}><Field label="Nome da fazenda *" icon={Building2}><input value={form.nome} onChange={e=>set('nome',e.target.value)} required placeholder="Ex: Fazenda Santa Maria"/></Field><div className="grid2"><Field label="Central / empresa atendida" icon={ShieldCheck}><select value={form.central} onChange={e=>set('central',e.target.value)}><option value="">Selecione...</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Nome do regional" icon={User}><input value={form.regional_nome} onChange={e=>set('regional_nome',e.target.value)} placeholder="Ex: nome do regional"/></Field></div><Field label="Veterinário / apoio em campo" icon={Stethoscope}><input value={form.veterinario_apoio} onChange={e=>set('veterinario_apoio',e.target.value)} placeholder="Nome do veterinário, se estiver junto"/></Field><div className="grid2"><Field label="Responsável da fazenda" icon={User}><input value={form.responsavel} onChange={e=>set('responsavel',e.target.value)} placeholder="Nome"/></Field><Field label="Telefone" icon={Phone}><input value={form.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="(00) 00000-0000"/></Field></div><div className="grid2"><Field label="Estado" icon={MapPin}><select value={form.estado_uf} onChange={e=>{const uf=e.target.value; const st=ufs.find(u=>u.sigla===uf); setForm(prev=>({...prev,estado_uf:uf,estado_nome:st?.nome||UF_NAMES[uf]||'',cidade:'',codigo_ibge_cidade:'',latitude:'',longitude:'',localizacao_origem:''}))}}><option value="">Selecione o estado...</option>{ufs.map(u=><option key={u.id} value={u.sigla}>{u.nome} — {u.sigla}</option>)}</select></Field><Field label="Cidade" icon={MapPin}><select value={form.codigo_ibge_cidade} onChange={e=>chooseCity(e.target.value)} disabled={!form.estado_uf||loadingCities}><option value="">{loadingCities?'Carregando cidades...':'Selecione a cidade...'}</option>{cities.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field></div><div className="grid2"><Field label="Latitude" icon={LocateFixed}><input value={form.latitude} onChange={e=>set('latitude',e.target.value)} placeholder="Automático pela cidade, GPS ou manual"/></Field><Field label="Longitude" icon={LocateFixed}><input value={form.longitude} onChange={e=>set('longitude',e.target.value)} placeholder="Automático pela cidade, GPS ou manual"/></Field></div><button type="button" className="btn light" onClick={useGPS}><Navigation size={17}/> Usar GPS atual da fazenda</button><small className="sourceText">Origem da localização: {form.localizacao_origem||'não definida'}. Ao selecionar cidade, o app tenta estimar o ponto pelo mapa oficial do IBGE; para maior precisão, use GPS ou marque equipamentos no mapa.</small><div className="grid2"><Field label="Status" icon={BadgeCheck}><select value={form.status} onChange={e=>set('status',e.target.value)}>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Endereço"><input value={form.endereco} onChange={e=>set('endereco',e.target.value)} placeholder="Endereço ou referência"/></Field></div><div className="grid2"><Field label="Colares previstos" icon={Hash}><input type="number" value={form.qtd_colares_prevista} onChange={e=>set('qtd_colares_prevista',e.target.value)}/></Field><Field label="Colares instalados" icon={CheckCircle2}><input type="number" value={form.qtd_colares_instalada} onChange={e=>set('qtd_colares_instalada',e.target.value)}/></Field></div><Field label="Observações"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Informações importantes da fazenda"/></Field><button className="btn primary full"><Save size={18}/> Salvar</button></form></Modal>}
function FazendaDetalhe({farm,data,onBack}){const [tab,setTab]=useState('resumo'),[edit,setEdit]=useState(false),[equipModal,setEquipModal]=useState(false),[visitModal,setVisitModal]=useState(false); const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id), visits=data.visitas.filter(v=>v.fazenda_id===farm.id), checks=data.checklists.filter(c=>c.fazenda_id===farm.id), diags=data.diagnosticos.filter(d=>d.fazenda_id===farm.id); const tabs=[['resumo','Resumo',Building2],['checklists','Checklists',ClipboardCheck],['equipamentos','Equipamentos',Cpu],['mapa','Mapa técnico',MapIcon],['visitas','Visitas',CalendarDays],['relatorio','Relatório',FileText]]; const pct=num(farm.qtd_colares_prevista)?Math.round(num(farm.qtd_colares_instalada)/num(farm.qtd_colares_prevista)*100):0;
  return <div><button className="back" onClick={onBack}><ChevronLeft size={18}/> Voltar para fazendas</button><section className="farmHero"><div><span className="eyebrow">Dossiê técnico</span><h1>{farm.nome}</h1><p><MapPin size={16}/>{farm.cidade||'Cidade não informada'} <span>•</span> <Building2 size={16}/>{farm.central||'Central não informada'} <span>•</span> <User size={16}/>{farm.regional_nome||farm.responsavel||'Regional não informado'}</p></div><div className="heroActions"><button className="btn light" onClick={()=>setEdit(true)}><Pencil size={17}/> Editar</button><button className="btn primary" onClick={()=>setVisitModal(true)}><Plus size={17}/> Nova visita</button></div></section><div className="tabs">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={tab===id?'active':''}><Icon size={17}/>{label}</button>)}</div>
    {tab==='resumo'&&<section className="panel"><div className="statsGrid"><Stat icon={Hash} label="colares previstos" value={num(farm.qtd_colares_prevista)}/><Stat icon={CheckCircle2} label="instalados" value={num(farm.qtd_colares_instalada)} tone="green"/><Stat icon={Gauge} label="progresso" value={`${pct}%`}/><Stat icon={Cpu} label="equipamentos" value={equips.length}/></div><div className="grid2"><InfoCard title="Dados da fazenda" rows={[['Central',farm.central],['Regional',farm.regional_nome],['Veterinário / apoio',farm.veterinario_apoio],['Responsável',farm.responsavel],['Telefone',farm.telefone],['Cidade',farm.cidade],['Endereço',farm.endereco],['Status',farm.status],['Observações',farm.observacoes]]}/><InfoCard title="Atalhos de campo" rows={[['Última visita',visits[0]?brDate(visits[0].data_visita):'Sem visita'],['Checklists salvos',checks.length],['Diagnósticos registrados',diags.length],['Equipamentos mapeados',equips.filter(e=>e.latitude&&e.longitude).length]]}/></div></section>}
    {tab==='checklists'&&<ChecklistsFazenda farm={farm} data={data}/>} {tab==='equipamentos'&&<EquipamentosFazenda farm={farm} data={data} openNew={()=>setEquipModal(true)}/>} {tab==='mapa'&&<MapaFazenda farm={farm} data={data}/>} {tab==='visitas'&&<VisitasFazenda farm={farm} data={data} openNew={()=>setVisitModal(true)}/>} {tab==='relatorio'&&<RelatorioFazenda farm={farm} data={data}/>} 
    {edit&&<FazendaModal farm={farm} onClose={()=>setEdit(false)} onSave={async(r)=>{await data.saveFazenda(r);setEdit(false)}}/>}{equipModal&&<EquipModal farm={farm} onClose={()=>setEquipModal(false)} onSave={async(r)=>{await data.saveEquipamento(r);setEquipModal(false)}}/>}{visitModal&&<VisitModal farm={farm} onClose={()=>setVisitModal(false)} onSave={async(r)=>{await data.saveVisita(r);setVisitModal(false)}}/>}</div>}
function InfoCard({title,rows}){return <div className="infoCard"><h3>{title}</h3>{rows.map(([a,b])=><div className="infoRow" key={a}><span>{a}</span><b>{b||'-'}</b></div>)}</div>}

function ChecklistsFazenda({farm,data}){const [template,setTemplate]=useState(QUICK_CHECKLISTS[0].id),[values,setValues]=useState({}),[obs,setObs]=useState(''); const tpl=QUICK_CHECKLISTS.find(t=>t.id===template); const saved=data.checklists.filter(c=>c.fazenda_id===farm.id); const toggle=i=>setValues({...values,[i]:!values[i]}); const save=()=>{const items=tpl.items.map((label,i)=>({label,ok:Boolean(values[i])})); data.saveChecklist({id:uid(),fazenda_id:farm.id,tipo:tpl.id,titulo:tpl.title,itens_json:items,status:items.every(i=>i.ok)?'Completo':'Parcial',observacoes:obs,created_at:nowISO()}); setValues({});setObs('')}; return <section className="panel"><div className="sectionTitle"><h2>Checklist por fazenda</h2><select value={template} onChange={e=>{setTemplate(e.target.value);setValues({})}}>{QUICK_CHECKLISTS.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></div><div className="checkPanel"><div className="manualSource">{tpl.source}</div>{tpl.items.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(values[i])} onChange={()=>toggle(i)}/><span>{item}</span></label>)}<textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações do checklist"/><button className="btn primary" onClick={save}><Save size={17}/> Salvar checklist</button></div><h3 className="mt">Histórico</h3><div className="list">{saved.map(c=><div className="listItem" key={c.id}><ClipboardCheck size={19}/><div><b>{c.titulo}</b><span>{brDate(c.created_at)} • {c.status} • {c.observacoes||'sem observações'}</span></div></div>)}</div></section>}

function EquipamentosFazenda({farm,data,openNew}){const [edit,setEdit]=useState(null); const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id); return <section className="panel"><div className="sectionTitle"><h2>Equipamentos instalados</h2><button className="btn primary" onClick={openNew}><Plus size={17}/> Adicionar</button></div><div className="equipGrid">{equips.map(e=><div className="equipCard" key={e.id}><div className="equipIcon">{e.tipo?.includes('4102')?<RadioTower/>:<Cpu/>}</div><div><h3>{e.apelido||e.codigo_original||e.tipo}</h3><p>{e.tipo}</p><span>{e.local_nome||'Local não informado'} • {e.status}</span>{e.latitude&&<small>{Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}</small>}</div><button className="iconBtn" onClick={()=>setEdit(e)}><Pencil size={17}/></button><button className="iconBtn danger" onClick={()=>data.delEquipamento(e.id)}><Trash2 size={17}/></button></div>)}</div>{equips.length===0&&<Empty icon={Cpu} title="Nenhum equipamento" text="Cadastre VP8002, VP4102 ou outro equipamento da fazenda."/>}{edit&&<EquipModal farm={farm} equip={edit} onClose={()=>setEdit(null)} onSave={async(r)=>{await data.saveEquipamento(r);setEdit(null)}}/>}</section>}
function EquipModal({farm,equip={},onClose,onSave}){const [form,setForm]=useState({id:equip.id||uid(),fazenda_id:farm.id,tipo:equip.tipo||EQUIP_TYPES[0],codigo_original:equip.codigo_original||'',apelido:equip.apelido||'',local_nome:equip.local_nome||'',latitude:equip.latitude||'',longitude:equip.longitude||'',status:equip.status||'Planejado',instalado_em:equip.instalado_em||new Date().toISOString().slice(0,10),observacoes:equip.observacoes||'',created_at:equip.created_at||nowISO()}); const set=(k,v)=>setForm({...form,[k]:v}); const gps=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(pos=>setForm({...form,latitude:pos.coords.latitude,longitude:pos.coords.longitude}),()=>alert('Não foi possível usar GPS. Marque no mapa ou preencha manualmente.')):alert('GPS não disponível neste navegador.'); return <Modal title={equip.id?'Editar equipamento':'Adicionar equipamento'} onClose={onClose}><form className="form modern" onSubmit={e=>{e.preventDefault();onSave({...form,latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null})}}><div className="grid2"><Field label="Tipo" icon={Cpu}><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{EQUIP_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Status" icon={BadgeCheck}><select value={form.status} onChange={e=>set('status',e.target.value)}>{EQUIP_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field></div><div className="grid2"><Field label="Código original" icon={Hash}><input value={form.codigo_original} onChange={e=>set('codigo_original',e.target.value)} placeholder="Ex: VP8002 / 60"/></Field><Field label="Apelido" icon={Pencil}><input value={form.apelido} onChange={e=>set('apelido',e.target.value)} placeholder="Ex: 61 - Antena Galpão 01"/></Field></div><Field label="Local na fazenda" icon={MapPin}><input list="locais" value={form.local_nome} onChange={e=>set('local_nome',e.target.value)} placeholder="Ex: Galpão 01"/><datalist id="locais">{LOCAL_SUGGESTIONS.map(l=><option key={l} value={l}/>)}</datalist></Field><div className="grid2"><Field label="Latitude"><input value={form.latitude} onChange={e=>set('latitude',e.target.value)}/></Field><Field label="Longitude"><input value={form.longitude} onChange={e=>set('longitude',e.target.value)}/></Field></div><button type="button" className="btn light" onClick={gps}><Navigation size={17}/> Usar GPS atual</button><div className="miniMap"><MapPicker lat={form.latitude} lng={form.longitude} onPick={(lat,lng)=>setForm({...form,latitude:lat,longitude:lng})}/></div><Field label="Data de instalação"><input type="date" value={form.instalado_em} onChange={e=>set('instalado_em',e.target.value)}/></Field><Field label="Observações"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Pendências, configuração, cabo, rede, validação..."/></Field><button className="btn primary full"><Save size={18}/> Salvar equipamento</button></form></Modal>}
function MapPicker({lat,lng,onPick}){const center=[Number(lat)||-19.7483,Number(lng)||-47.9319]; function Clicker(){useMapEvents({click(e){onPick(e.latlng.lat,e.latlng.lng)}}); return null;} return <MapContainer center={center} zoom={lat?17:13} className="map"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles Esri"/>{lat&&lng&&<Marker position={[Number(lat),Number(lng)]}/>}<Clicker/></MapContainer>}
function MapaFazenda({farm,data}){
  const [layer,setLayer]=useState('mapa');
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id&&e.latitude&&e.longitude);
  const center=equips[0]?[Number(equips[0].latitude),Number(equips[0].longitude)]:farm.latitude&&farm.longitude?[Number(farm.latitude),Number(farm.longitude)]:[-19.7483,-47.9319];
  const base = layer==='satelite'||layer==='hibrido' ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  return <section className="panel"><div className="sectionTitle"><h2>Mapa técnico da instalação</h2><select value={layer} onChange={e=>setLayer(e.target.value)}><option value="mapa">Mapa com nomes</option><option value="satelite">Satélite</option><option value="hibrido">Híbrido</option></select></div><div className="mapWrap"><MapContainer center={center} zoom={equips.length?17:13} className="bigMap"><TileLayer url={base} attribution={layer==='mapa'?'OpenStreetMap':'Tiles Esri'}/>{layer==='hibrido'&&<TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="CARTO"/>}{farm.latitude&&farm.longitude&&<Marker position={[Number(farm.latitude),Number(farm.longitude)]}><Popup><b>{farm.nome}</b><br/>{farm.cidade} / {getFarmUF(farm)}<br/>Ponto da fazenda</Popup></Marker>}{equips.map(e=><React.Fragment key={e.id}><Marker position={[Number(e.latitude),Number(e.longitude)]}><Popup><b>{e.apelido||e.codigo_original}</b><br/>{e.tipo}<br/>{e.local_nome}<br/>{e.status}</Popup></Marker>{e.tipo?.includes('4102')&&<Circle center={[Number(e.latitude),Number(e.longitude)]} radius={e.observacoes?.toLowerCase().includes('extern')?250:75} pathOptions={{color:'#22c55e',fillColor:'#22c55e',fillOpacity:.12}}/>}</React.Fragment>)}</MapContainer></div><p className="sourceText">Use “Mapa com nomes” para localizar cidades/estradas e “Satélite/Híbrido” para posicionar galpões, curral, ordenha e antenas.</p><div className="list compact">{equips.map(e=><div className="listItem" key={e.id}>{e.tipo?.includes('4102')?<RadioTower/>:<Cpu/>}<div><b>{e.apelido||e.codigo_original}</b><span>{e.local_nome||'-'} • {Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}</span></div></div>)}</div></section>}
function VisitasFazenda({farm,data,openNew}){const visits=data.visitas.filter(v=>v.fazenda_id===farm.id); return <section className="panel"><div className="sectionTitle"><h2>Visitas e registros</h2><button className="btn primary" onClick={openNew}><Plus size={17}/> Nova visita</button></div><div className="timeline">{visits.map(v=><div className="visit" key={v.id}><div className="dot"/><h3>{v.tipo} • {brDate(v.data_visita)}</h3><p><b>Resumo:</b> {v.resumo||'-'}</p><p><b>Problemas:</b> {v.problemas||'-'}</p><p><b>Solução:</b> {v.solucao||'-'}</p><p><b>Pendências:</b> {v.pendencias||'-'}</p><button className="iconBtn danger" onClick={()=>data.delVisita(v.id)}><Trash2 size={16}/></button></div>)}</div>{visits.length===0&&<Empty icon={CalendarDays} title="Nenhuma visita registrada" text="Registre instalação, diagnóstico, retorno ou suporte."/>}</section>}
function VisitModal({farm,onClose,onSave}){const [form,setForm]=useState({id:uid(),fazenda_id:farm.id,tipo:'Instalação',data_visita:new Date().toISOString().slice(0,10),resumo:'',problemas:'',solucao:'',pendencias:'',proxima_acao:'',created_at:nowISO()}); const set=(k,v)=>setForm({...form,[k]:v}); return <Modal title="Nova visita" onClose={onClose}><form className="form modern" onSubmit={e=>{e.preventDefault();onSave(form)}}><div className="grid2"><Field label="Tipo"><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{VISIT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Data"><input type="date" value={form.data_visita} onChange={e=>set('data_visita',e.target.value)}/></Field></div><Field label="Resumo"><textarea value={form.resumo} onChange={e=>set('resumo',e.target.value)} placeholder="O que foi feito?"/></Field><Field label="Problemas encontrados"><textarea value={form.problemas} onChange={e=>set('problemas',e.target.value)}/></Field><Field label="Solução aplicada"><textarea value={form.solucao} onChange={e=>set('solucao',e.target.value)}/></Field><Field label="Pendências"><textarea value={form.pendencias} onChange={e=>set('pendencias',e.target.value)}/></Field><Field label="Próxima ação"><textarea value={form.proxima_acao} onChange={e=>set('proxima_acao',e.target.value)}/></Field><button className="btn primary full"><Save size={18}/> Salvar visita</button></form></Modal>}
function RelatorioFazenda({farm,data}){const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id), visits=data.visitas.filter(v=>v.fazenda_id===farm.id), checks=data.checklists.filter(c=>c.fazenda_id===farm.id); const exportTsv=()=>{const rows=[['Relatório da fazenda',farm.nome],['Responsável',farm.responsavel||''],['Cidade',farm.cidade||''],['Status',farm.status||''],['Colares previstos',farm.qtd_colares_prevista||0],['Colares instalados',farm.qtd_colares_instalada||0],[],['Equipamentos'],['Tipo','Código','Apelido','Local','Status','Latitude','Longitude'],...equips.map(e=>[e.tipo,e.codigo_original,e.apelido,e.local_nome,e.status,e.latitude,e.longitude]),[],['Visitas'],['Data','Tipo','Resumo','Problemas','Solução','Pendências'],...visits.map(v=>[v.data_visita,v.tipo,v.resumo,v.problemas,v.solucao,v.pendencias])]; download(`${farm.nome}-relatorio.tsv`, rows.map(r=>r.join('\t')).join('\n'));}; return <section className="panel"><div className="sectionTitle"><h2>Relatório técnico</h2><button className="btn primary" onClick={exportTsv}><FileDown size={17}/> Exportar TSV</button></div><div className="reportBox"><h3>{farm.nome}</h3><p>{farm.cidade||''} • {farm.status}</p><div className="grid3"><Stat icon={Hash} label="previstos" value={num(farm.qtd_colares_prevista)}/><Stat icon={CheckCircle2} label="instalados" value={num(farm.qtd_colares_instalada)}/><Stat icon={Cpu} label="equipamentos" value={equips.length}/></div><h4>Resumo</h4><p>{farm.observacoes||'Sem observações da fazenda.'}</p><h4>Pendências recentes</h4><ul>{visits.filter(v=>v.pendencias).slice(0,5).map(v=><li key={v.id}>{brDate(v.data_visita)} — {v.pendencias}</li>)}</ul><h4>Checklists</h4><p>{checks.length} checklists salvos nesta fazenda.</p></div></section>}

function Instalacao({data}){const [guideId,setGuideId]=useState('vp8002'),[phase,setPhase]=useState(0),[checked,setChecked]=useState({}); const guide=INSTALL_GUIDES.find(g=>g.id===guideId); const Icon=guide.icon; const total=guide.phases.reduce((a,p)=>a+p.items.length,0); const done=Object.values(checked).filter(Boolean).length; const pct=Math.round(done/total*100); const key=(p,i)=>`${guide.id}-${p}-${i}`; return <div><PageHead eyebrow="Modo operacional" title="Instalação guiada" desc="Passo a passo prático baseado nos manuais oficiais, em português e pensado para uso no campo."/><div className="guideChooser">{INSTALL_GUIDES.map(g=>{const I=g.icon;return <button key={g.id} className={guideId===g.id?'active':''} onClick={()=>{setGuideId(g.id);setPhase(0);setChecked({})}}><I size={20}/><b>{g.title}</b><span>{g.desc}</span></button>})}</div><section className="panel guidePanel"><div className="guideHeader"><div><Icon size={28}/><h2>{guide.title}</h2><p>{guide.source}</p></div><div className="circleProgress"><b>{pct}%</b><span>{done}/{total}</span></div></div><div className="phaseTabs">{guide.phases.map((p,i)=><button key={p.title} className={phase===i?'active':''} onClick={()=>setPhase(i)}>{i+1}. {p.title}</button>)}</div><div className="checkPanel">{guide.phases[phase].items.map((item,i)=><label key={item} className="checkItem"><input type="checkbox" checked={Boolean(checked[key(phase,i)])} onChange={()=>setChecked({...checked,[key(phase,i)]:!checked[key(phase,i)]})}/><span>{item}</span></label>)}</div><div className="guideActions"><button className="btn light" disabled={phase===0} onClick={()=>setPhase(Math.max(0,phase-1))}>Voltar</button><button className="btn primary" disabled={phase===guide.phases.length-1} onClick={()=>setPhase(Math.min(guide.phases.length-1,phase+1))}>Próxima etapa</button></div></section><CoberturaAssist/></div>}
function CoberturaAssist(){const [tipo,setTipo]=useState('interna'),[comp,setComp]=useState(120),[larg,setLarg]=useState(40),[obst,setObst]=useState('medio'); const raio=tipo==='externa'?250:75; const diam=raio*2; const precisa=Math.max(1,Math.ceil(num(comp)/diam)*Math.ceil(num(larg)/diam)); const risco=obst==='alto'?'Alto':obst==='medio'?'Médio':'Baixo'; return <section className="panel"><div className="sectionTitle"><h2><Ruler size={20}/> Planejador rápido de antena</h2><span className="pill">apoio de campo</span></div><div className="grid4"><Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="interna">Interna</option><option value="externa">Externa</option></select></Field><Field label="Comprimento aproximado (m)"><input type="number" value={comp} onChange={e=>setComp(e.target.value)}/></Field><Field label="Largura aproximada (m)"><input type="number" value={larg} onChange={e=>setLarg(e.target.value)}/></Field><Field label="Obstáculos"><select value={obst} onChange={e=>setObst(e.target.value)}><option value="baixo">Baixo</option><option value="medio">Médio</option><option value="alto">Alto/metálico</option></select></Field></div><div className="coverageResult"><RadioTower size={28}/><div><b>Estimativa inicial: {precisa} antena(s)</b><span>Raio usado: {raio} m • risco de interferência: {risco}. Validar com Reader/Tags analysis antes de encerrar.</span></div></div></section>}

function Diagnostico({data}){const [tab,setTab]=useState('sintomas'); const tabs=[['sintomas',HelpCircle,'Sintomas'],['leds',Cpu,'LEDs'],['can',AlertTriangle,'CAN bus'],['suporte',LifeBuoy,'Antes do suporte']]; return <div><PageHead eyebrow="Diagnóstico técnico" title="Resolver problema no campo" desc="Fluxos práticos baseados nos manuais VP8002, VP4102 e Nedap Now."/><div className="tabs">{tabs.map(([id,Icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>{tab==='sintomas'&&<Sintomas data={data}/>} {tab==='leds'&&<LedDiag/>} {tab==='can'&&<CanDiag/>} {tab==='suporte'&&<AntesSuporte data={data}/>}</div>}
function Sintomas({data}){const [q,setQ]=useState(''),[selected,setSelected]=useState(SYMPTOMS[0]),[farm,setFarm]=useState(''),[obs,setObs]=useState(''); const list=SYMPTOMS.filter(s=>[s.title,s.category,s.cause].join(' ').toLowerCase().includes(q.toLowerCase())); const save=()=>{data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:selected.category,sintoma:selected.title,resultado:selected.cause,acoes_realizadas:selected.action,observacoes:obs,created_at:nowISO()}); setObs(''); alert('Diagnóstico registrado.')}; return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar sintoma..."/></div></div><div className="diagLayout"><div className="diagList">{list.map(s=>{const I=s.icon;return <button key={s.id} className={selected.id===s.id?'active':''} onClick={()=>setSelected(s)}><I size={18}/><span><b>{s.title}</b><small>{s.category}</small></span></button>})}</div><div className="diagDetail"><span className="pill">{selected.category}</span><h2>{selected.title}</h2><p className="cause">{selected.cause}</p><h3>O que verificar</h3><ol>{selected.checks.map(c=><li key={c}>{c}</li>)}</ol><div className="callout"><b>Próxima ação:</b> {selected.action}</div><p className="sourceText">{selected.source}</p><div className="saveDiag"><select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="O que você fez no campo?"/><button className="btn primary" onClick={save}><Save size={17}/> Registrar diagnóstico</button></div></div></div></section>}
function LedDiag(){const [q,setQ]=useState(''); const list=LED_DIAGNOSTICS.filter(l=>[l.led,l.cor,l.modo,l.estado,l.acao].join(' ').toLowerCase().includes(q.toLowerCase())); return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar LED, cor ou modo..."/></div></div><div className="ledGrid">{list.map((l,i)=><div className="ledCard" key={i}><div className={`ledDot ${l.cor.toLowerCase().includes('verde')?'green':l.cor.toLowerCase().includes('vermelho')?'red':l.cor.toLowerCase().includes('laranja')?'orange':l.cor.toLowerCase().includes('azul')?'blue':''}`}/><h3>{l.led}</h3><p><b>{l.cor}</b> • {l.modo}</p><span>{l.estado}</span><small>{l.acao}</small></div>)}</div><p className="sourceText">{SOURCES.vp8002}</p></section>}
function CanDiag(){const [q,setQ]=useState(''); const list=CAN_ERRORS.filter(c=>[c.code,c.bus,c.desc,c.solution].join(' ').toLowerCase().includes(q.toLowerCase())); return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Digite código, ex: 02, 09, 16..."/></div></div><div className="canGrid">{list.map(c=><div className="canCard" key={c.code}><b>{c.code}</b><span>{c.bus}</span><h3>{c.desc}</h3><p>{c.solution}</p></div>)}</div><p className="sourceText">{SOURCES.vp8002}</p></section>}
function AntesSuporte({data}){const [checked,setChecked]=useState({}),[farm,setFarm]=useState(''),[obs,setObs]=useState(''); const done=SUPPORT_CHECKS.filter((_,i)=>checked[i]).length; const save=()=>{data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:'Antes de chamar suporte',sintoma:'Checklist de suporte',resultado:`${done}/${SUPPORT_CHECKS.length} itens conferidos`,acoes_realizadas:SUPPORT_CHECKS.filter((_,i)=>checked[i]).join('; '),observacoes:obs,created_at:nowISO()}); alert('Checklist de suporte registrado.')}; return <section className="panel"><div className="supportHead"><LifeBuoy size={28}/><div><h2>Antes de chamar suporte</h2><p>Use isso para chegar no suporte com informação organizada e não perder tempo no campo.</p></div><div className="circleProgress"><b>{done}</b><span>/{SUPPORT_CHECKS.length}</span></div></div><div className="checkPanel">{SUPPORT_CHECKS.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(checked[i])} onChange={()=>setChecked({...checked,[i]:!checked[i]})}/><span>{item}</span></label>)}</div><div className="saveDiag"><select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Resumo para enviar ao suporte"/><button className="btn primary" onClick={save}><Save size={17}/> Registrar checklist</button></div></section>}

function Guia(){return <div><PageHead eyebrow="Base técnica offline" title="Guia rápido" desc="Conteúdo prático extraído dos manuais enviados e traduzido para uso no campo."/><div className="knowledgeGrid">{INSTALL_GUIDES.map(g=>{const I=g.icon;return <article className="knowledge" key={g.id}><I size={28}/><h3>{g.title}</h3><p>{g.desc}</p><span>{g.source}</span>{g.phases.map(p=><details key={p.title}><summary>{p.title}</summary><ul>{p.items.map(i=><li key={i}>{i}</li>)}</ul></details>)}</article>})}</div></div>}
function Relatorios({data,onOpen}){const [central,setCentral]=useState('Todas'); const fazendas=data.fazendas.filter(f=>central==='Todas'||(f.central||'Outra / Não informado')===central); const exportGeral=()=>{const rows=[['Central','Fazenda','Cidade','Regional','Veterinário/Apoio','Responsável','Status','Colares previstos','Colares instalados','Equipamentos','Visitas'],...fazendas.map(f=>[f.central,f.nome,f.cidade,f.regional_nome,f.veterinario_apoio,f.responsavel,f.status,f.qtd_colares_prevista,f.qtd_colares_instalada,data.equipamentos.filter(e=>e.fazenda_id===f.id).length,data.visitas.filter(v=>v.fazenda_id===f.id).length])]; download('relatorio-geral-fazendas.tsv', rows.map(r=>r.join('\t')).join('\n'));}; const alta=data.fazendas.filter(f=>f.central==='Alta Genetics').length, genex=data.fazendas.filter(f=>f.central==='Genex Brasil').length; return <div><PageHead eyebrow="Relatórios" title="Relatório geral" desc="Visualize e exporte por central, regional e apoio técnico/veterinário."><button className="btn primary" onClick={exportGeral}><Download size={18}/> Exportar geral</button></PageHead><div className="statsGrid"><Stat icon={Building2} label="Alta Genetics" value={alta} tone="green"/><Stat icon={ShieldCheck} label="Genex Brasil" value={genex}/><Stat icon={MapPinned} label="filtro atual" value={fazendas.length}/><Stat icon={Hash} label="colares instalados" value={fazendas.reduce((a,f)=>a+num(f.qtd_colares_instalada),0)}/></div><div className="filterChips"><button className={central==='Todas'?'active':''} onClick={()=>setCentral('Todas')}>Todas</button>{CENTRAIS.map(c=><button key={c} className={central===c?'active':''} onClick={()=>setCentral(c)}>{c}</button>)}</div><div className="tableWrap"><table><thead><tr><th>Fazenda</th><th>Central</th><th>Regional</th><th>Status</th><th>Colares</th><th>Equip.</th><th>Visitas</th><th></th></tr></thead><tbody>{fazendas.map(f=><tr key={f.id}><td><b>{f.nome}</b><span>{f.cidade||'-'}</span></td><td>{f.central||'-'}</td><td>{f.regional_nome||'-'}</td><td>{f.status}</td><td>{num(f.qtd_colares_instalada)} / {num(f.qtd_colares_prevista)}</td><td>{data.equipamentos.filter(e=>e.fazenda_id===f.id).length}</td><td>{data.visitas.filter(v=>v.fazenda_id===f.id).length}</td><td><button className="btn light" onClick={()=>onOpen(f.id)}>Abrir</button></td></tr>)}</tbody></table></div></div>}


function Field({label,icon:Icon,children}){return <label className="field"><span>{Icon&&<Icon size={15}/>} {label}</span>{children}</label>}
function Modal({title,onClose,children}){return <div className="modalBackdrop"><div className="modal"><header><h2>{title}</h2><button onClick={onClose}><X size={20}/></button></header>{children}</div></div>}
function download(filename, text){const blob=new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);}

createRoot(document.getElementById('root')).render(<App/>);
