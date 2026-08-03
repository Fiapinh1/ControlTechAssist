import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, GeoJSON, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Home, MapPinned, ClipboardCheck, Stethoscope, FileText, Plus, Search, Save, Pencil,
  Trash2, Cpu, RadioTower, Map as MapIcon, CalendarDays, BarChart3, LogOut, User,
  Navigation, Satellite, Layers, CheckCircle2, AlertTriangle, ClipboardList, Building2,
  Phone, MapPin, Hash, BadgeCheck, Wrench, X, Download, Database, Wifi, BookOpen,
  ChevronLeft, Sparkles, Route, HelpCircle, ShieldCheck, Tags, Ruler, Send, Target,
  ClipboardX, CircleAlert, Cable, Zap, Settings, Clock, Check, PlayCircle, Info,
  ClipboardPenLine, LifeBuoy, FileDown, Antenna, Gauge, ScanLine, Globe2, Filter, LocateFixed, Printer, Share2,
  BrickWall, Trees, Mountain, Warehouse, Signal, SignalLow, SignalZero, CloudOff, RefreshCw, Copy, UserCheck,
  Image as ImageIcon, Camera, Upload, Eye, Link2, Milk
} from 'lucide-react';
import './styles.css';
import { SOURCES, INSTALL_GUIDES, SYMPTOMS, LED_DIAGNOSTICS, CAN_ERRORS, SUPPORT_CHECKS, QUICK_CHECKLISTS } from './data/manualContent.js';

const APP_VERSION = '3.0.0';
const LOCAL_MODE_KEY = 'cta_allow_local_mode';
const APP_CONTEXT_KEY = 'cta_last_context';
const readAppContext = () => {
  try { return JSON.parse(localStorage.getItem(APP_CONTEXT_KEY) || '{}') || {}; } catch { return {}; }
};
const saveAppContext = (view, farmId = null) => {
  try { localStorage.setItem(APP_CONTEXT_KEY, JSON.stringify({ view, farmId })); } catch {}
};

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
const todayInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const brDate = (v) => {
  if (!v) return '-';
  const text = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-');
    return `${day}/${month}/${year}`;
  }
  return new Date(v).toLocaleDateString('pt-BR');
};
const dateTimeInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 16);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const toIsoOrNull = (v) => v ? new Date(v).toISOString() : null;
const brDateTime = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('pt-BR');
};
const serviceHours = (farm) => {
  if (!farm?.servico_inicio_em) return 0;
  const start = new Date(farm.servico_inicio_em);
  const end = farm.servico_fim_em ? new Date(farm.servico_fim_em) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return (end - start) / 36e5;
};
const serviceDurationLabel = (farm) => {
  const hours = serviceHours(farm);
  if (!hours) return '-';
  return hours < 24 ? `${Math.max(hours, 0.1).toFixed(1)} h` : `${(hours / 24).toFixed(1)} dias`;
};
const DEFAULT_WORKDAY = { start: '08:00', end: '17:00', lunchMinutes: 60, includeWeekends: false };
const timeToMinutes = (value, fallback) => {
  const [rawHour, rawMinute = '0'] = String(value || fallback).split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : Number(String(fallback).slice(0, 2)) || 8;
  const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0;
  return (safeHour * 60) + safeMinute;
};
const workdayWindows = (config = DEFAULT_WORKDAY) => {
  const start = timeToMinutes(config.start, DEFAULT_WORKDAY.start);
  const end = timeToMinutes(config.end, DEFAULT_WORKDAY.end);
  if (end <= start) return [];
  const span = end - start;
  const lunch = Math.min(Math.max(0, num(config.lunchMinutes)), Math.max(0, span - 1));
  if (!lunch) return [[start, end]];
  const activeMinutes = span - lunch;
  const lunchStart = start + Math.floor(activeMinutes / 2);
  return [[start, lunchStart], [lunchStart + lunch, end]].filter(([a, b]) => b > a);
};
const workdayHours = (config = DEFAULT_WORKDAY) => workdayWindows(config).reduce((total, [start, end]) => total + (end - start), 0) / 60;
const minuteOfDay = (date) => date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
const sameCalendarDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const businessHoursBetween = (startValue, endValue, config = DEFAULT_WORKDAY) => {
  if (!startValue) return 0;
  const start = new Date(startValue);
  const end = endValue ? new Date(endValue) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  const windows = workdayWindows(config);
  if (!windows.length) return 0;
  let totalMinutes = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last) {
    const weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    if (config.includeWeekends || !weekend) {
      const from = sameCalendarDay(cursor, start) ? minuteOfDay(start) : 0;
      const to = sameCalendarDay(cursor, end) ? minuteOfDay(end) : 1440;
      windows.forEach(([windowStart, windowEnd]) => {
        totalMinutes += Math.max(0, Math.min(to, windowEnd) - Math.max(from, windowStart));
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return totalMinutes / 60;
};
const workDurationLabel = (hours, config = DEFAULT_WORKDAY) => {
  if (!hours) return '-';
  const daily = Math.max(workdayHours(config), 0.1);
  return `${hours.toFixed(1)} h úteis (${(hours / daily).toFixed(1)} dias)`;
};
const num = (v) => Number(v || 0);
const mapsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${Number(lat)},${Number(lng)}`;
const openMaps = (lat, lng) => window.open(mapsUrl(lat, lng), '_blank', 'noopener,noreferrer');
const notify = (message, type='success') => window.dispatchEvent(new CustomEvent('cta-notify',{detail:{message,type,id:uid()}}));
function NotificationCenter(){const [items,setItems]=useState([]);useEffect(()=>{const h=e=>{setItems(v=>[...v,e.detail]);setTimeout(()=>setItems(v=>v.filter(x=>x.id!==e.detail.id)),3600)};window.addEventListener('cta-notify',h);return()=>window.removeEventListener('cta-notify',h)},[]);return <div className="toastStack">{items.map(i=><div key={i.id} className={`toast ${i.type}`}><div>{i.type==='error'?<CircleAlert size={20}/>:i.type==='warning'?<AlertTriangle size={20}/>:<CheckCircle2 size={20}/>}</div><span>{i.message}</span></div>)}</div>}
function equipmentMarkerIcon(e, opts={}){const antenna=e?.tipo?.includes('4102'), other=!antenna&&!e?.tipo?.includes('8002'), ghost=opts.ghost;const label=String(e?.apelido||e?.local_nome||e?.tipo||'').slice(0,10);return L.divIcon({className:'equipment-marker-wrap',html:`<div class="equipment-marker ${ghost?'ghost':antenna?'antenna':other?'other':'processor'}"><span>${antenna?'A':other?'O':'B'}</span></div>${label?`<b>${label}</b>`:''}`,iconSize:[48,42],iconAnchor:[24,34],popupAnchor:[0,-30]});}
function farmMarkerIcon(f){const short=String(f?.nome||'Fazenda').replace(/^Fazenda\s+/i,'').slice(0,16);const glyph='<svg class="farm-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 6l8 5.2V20H4z"/><path d="M8 20v-5.2h8V20"/><path d="M8.6 11.5h6.8"/><path d="M10.2 8.9h3.6"/></svg>';return L.divIcon({className:'farm-marker-wrap modern-farm-marker-wrap',html:`<div class="farm-marker farm-location">${glyph}</div><b>${short}</b>`,iconSize:[76,48],iconAnchor:[38,36],popupAnchor:[0,-34]});}

const FARM_STATUS = ['Não iniciada', 'Em andamento', 'Com pendência', 'Aguardando validação', 'Instalação concluída'];
const FARM_STATUS_DONE = 'Instalação concluída';
const normalizeText = (value='') => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
function normalizeFarmStatus(value){
  const raw = String(value || '').trim();
  const text = normalizeText(raw);
  if(!text) return FARM_STATUS[0];
  if(text.includes('pend')) return 'Com pendência';
  if(text.includes('valid')) return 'Aguardando validação';
  if(text.includes('andamento')) return 'Em andamento';
  if(text.includes('final') || text.includes('conclu')) return FARM_STATUS_DONE;
  if(text.includes('nao') && text.includes('inici')) return 'Não iniciada';
  return FARM_STATUS.includes(raw) ? raw : FARM_STATUS[0];
}
function farmStatus(farm){
  const current = normalizeFarmStatus(farm?.status);
  return autoServiceStatus(farm?.servico_inicio_em, farm?.servico_fim_em, current);
}
const normalizeFarmRow = row => ({...row, qtd_colares_entregue_cliente:num(row?.qtd_colares_entregue_cliente), status: farmStatus(row)});
const statusTone = status => status === 'Com pendência' ? 'warn' : status === FARM_STATUS_DONE ? 'ok' : '';
const isOpenFarmStatus = status => ['Não iniciada','Em andamento','Com pendência','Aguardando validação'].includes(normalizeFarmStatus(status));
const COLLAR_REASONS = ['Entregue ao cliente / reserva', 'Cliente pediu para não instalar', 'Animal indisponível', 'Pendente de retorno', 'Perda / defeito', 'Outro'];
const NON_PENDING_COLLAR_REASONS = new Set(['Entregue ao cliente / reserva', 'Cliente pediu para não instalar', 'Animal indisponível']);
const collarInstalled = farm => num(farm?.qtd_colares_instalada);
const collarDelivered = farm => num(farm?.qtd_colares_entregue_cliente);
const collarHandled = farm => collarInstalled(farm) + collarDelivered(farm);
const collarRemaining = farm => Math.max(num(farm?.qtd_colares_prevista) - collarHandled(farm), 0);
const collarProgress = farm => {
  const planned = num(farm?.qtd_colares_prevista);
  return planned ? Math.min(100, Math.round((collarHandled(farm) / planned) * 100)) : 0;
};
const collarHasPending = farm => {
  const touched = Boolean(farm?.servico_inicio_em || farm?.servico_fim_em || collarInstalled(farm) || collarDelivered(farm));
  return touched && collarRemaining(farm) > 0 && !NON_PENDING_COLLAR_REASONS.has(farm?.motivo_colares_restantes || '');
};
const collarBreakdown = farm => {
  const installed = collarInstalled(farm), delivered = collarDelivered(farm), planned = num(farm?.qtd_colares_prevista);
  return delivered ? `${installed} instalados • ${delivered} entregues • ${planned} previstos` : `${installed} / ${planned || '-'}`;
};
const CENTRAIS = ['Alta Genetics', 'Genex Brasil', 'Outra / Não informado'];
const EQUIP_TYPES = ['VP8002 — Processador/Base', 'VP4102 — Antena', 'Outro equipamento'];
const EQUIP_STATUS = ['Planejado', 'Instalado', 'Com problema', 'Removido'];
const dateOnlyMs = value => value ? new Date(`${String(value).slice(0,10)}T00:00:00`).getTime() : 0;
const isFutureInstallDate = value => Boolean(value && dateOnlyMs(value) > dateOnlyMs(todayInput()));
const normalizeEquipStatus = status => ['Configurado','Validado'].includes(status) ? 'Instalado' : EQUIP_STATUS.includes(status) ? status : 'Planejado';
const isEquipmentPendingInstall = e => normalizeEquipStatus(e?.status) !== 'Removido' && (normalizeEquipStatus(e?.status) !== 'Instalado' || isFutureInstallDate(e?.instalado_em));
const equipmentStatusLabel = e => isFutureInstallDate(e?.instalado_em) ? 'Instalação pendente' : normalizeEquipStatus(e?.status);
const VISIT_TYPES = ['Instalação', 'Manutenção', 'Diagnóstico', 'Retorno', 'Validação', 'Treinamento', 'Suporte'];
const VISIT_STATUS_OPEN = 'Aberta';
const VISIT_STATUS_DONE = 'Concluída';
const VISIT_STATUS_PENDING = 'Com pendência';
const visitHasPending = v => Boolean(String(v?.pendencias||'').trim() || String(v?.proxima_acao||'').trim());
const visitSummaryText = v => String(v?.resumo||'').trim() || `${v?.tipo||'Visita'} registrada em ${brDate(v?.data_visita)} sem pendências.`;
const isOpenVisit = v => String(v?.status||'').trim() === VISIT_STATUS_OPEN || (v?.iniciada_em && !v?.finalizada_em && String(v?.status||'').trim() !== VISIT_STATUS_DONE && String(v?.status||'').trim() !== VISIT_STATUS_PENDING);
const visitDisplayStatus = v => isOpenVisit(v) ? VISIT_STATUS_OPEN : visitHasPending(v) ? VISIT_STATUS_PENDING : VISIT_STATUS_DONE;
const visitStatusTone = v => isOpenVisit(v) ? 'open' : visitHasPending(v) ? 'pending' : 'ok';
const closeVisitPayload = visit => ({...visit,status:visitHasPending(visit)?VISIT_STATUS_PENDING:VISIT_STATUS_DONE,finalizada_em:visit.finalizada_em||nowISO(),resumo:String(visit.resumo||'').trim()||visitSummaryText(visit),updated_at:nowISO()});
const LOCAL_SUGGESTIONS = ['Ordenha', 'Sala de leite', 'Curral', 'Galpão 01', 'Galpão 02', 'Compost barn', 'Free stall', 'Piquete', 'Bezerreiro', 'Pré-parto', 'Pós-parto', 'Casa de máquinas', 'Escritório', 'Sala técnica', 'Torre', 'Caixa d’água', 'Barracão', 'Cocho', 'Pista de trato', 'Outro'];
const OBSTACLE_TYPES = ['Parede de alvenaria','Parede de concreto','Estrutura metálica','Telhado metálico','Barracão/galpão','Mata densa','Desnível/relevo','Outro'];
const COVERAGE_RESULTS = ['Leitura boa','Leitura instável','Sem leitura'];
const COVERAGE_COLORS = {'Leitura boa':'#22c55e','Leitura instável':'#f59e0b','Sem leitura':'#ef4444'};
const EVIDENCE_BUCKET = 'fazenda-evidencias';
const EVIDENCE_CATEGORIES = ['Instalação finalizada','Antes da instalação','VP8002 / base','Antena VP4102','Rede e cabeamento','Registro de visita','Pendência encontrada','Local da fazenda','Outro'];
const evidenceCategoryFor = ({equipamento, visita}={}) => {
  if(equipamento?.tipo?.includes('8002')) return 'VP8002 / base';
  if(equipamento?.tipo?.includes('4102')) return 'Antena VP4102';
  if(visita) return 'Registro de visita';
  return EVIDENCE_CATEGORIES[0];
};
const safeFileName = (name='foto.jpg') => String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90) || 'foto.jpg';
const evidenceSrc = item => item?.url || item?.arquivo_url || '';
const fileToDataUrl = file => new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
const prepareEvidenceFile = async (file) => {
  if(!file?.type?.startsWith('image/')) throw new Error('Arquivo não é uma imagem.');
  if(file.size > 18 * 1024 * 1024) throw new Error('Imagem acima de 18 MB.');
  try {
    const sourceUrl = URL.createObjectURL(file);
    const img = await new Promise((resolve,reject)=>{
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = sourceUrl;
    });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(img.width || maxSide, img.height || maxSide));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((img.width || maxSide) * scale));
    canvas.height = Math.max(1, Math.round((img.height || maxSide) * scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    URL.revokeObjectURL(sourceUrl);
    const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.84));
    return blob || file;
  } catch {
    return file;
  }
};

const UF_CODES = {
  11:'RO',12:'AC',13:'AM',14:'RR',15:'PA',16:'AP',17:'TO',21:'MA',22:'PI',23:'CE',24:'RN',25:'PB',26:'PE',27:'AL',28:'SE',29:'BA',
  31:'MG',32:'ES',33:'RJ',35:'SP',41:'PR',42:'SC',43:'RS',50:'MS',51:'MT',52:'GO',53:'DF'
};
const UF_NAMES = {
  AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins'
};
const STATE_CENTER = { MG:[-18.5122,-44.5550], SP:[-22.2569,-48.4804], RJ:[-22.2500,-42.6600], ES:[-19.1834,-40.3089], PR:[-24.89,-51.55], SC:[-27.33,-49.44], RS:[-30.03,-51.23], GO:[-16.64,-49.31], DF:[-15.78,-47.93], MS:[-20.51,-54.54], MT:[-12.64,-55.42], BA:[-12.97,-38.51], PE:[-8.05,-34.9], CE:[-3.73,-38.52], PA:[-1.45,-48.5] };
const STATE_COLORS = { 'Alta Genetics':'#2563eb', 'Genex Brasil':'#22c55e', 'Outra / Não informado':'#14b8a6', mixed:'#8b5cf6', none:'#e5e7eb' };
function getFarmUF(f){ return (f.estado_uf || parseUF(f.cidade) || '').toUpperCase(); }
function parseUF(city=''){ const m=String(city).match(/\b([A-Z]{2})\b$/); return m?.[1] || ''; }
function farmLatLng(f){ if(f.latitude && f.longitude) return [Number(f.latitude), Number(f.longitude)]; const uf=getFarmUF(f); return STATE_CENTER[uf] || [-14.2350,-51.9253]; }
function centralForUF(fazendas, uf){ const list=fazendas.filter(f=>getFarmUF(f)===uf); if(!list.length) return 'none'; const counts={}; list.forEach(f=>{ const c=f.central||'Outra / Não informado'; counts[c]=(counts[c]||0)+1; }); const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]); return sorted.length>1 && sorted[0][1]===sorted[1][1] ? 'mixed' : sorted[0][0]; }
function getGeoUF(feature){ const p=feature?.properties||{}; const raw=p.sigla || p.SIGLA || p.uf || p.UF || p.codarea || p.CD_UF || p.id || p.ID; if(String(raw||'').length===2 && /[A-Z]{2}/.test(String(raw))) return String(raw).toUpperCase(); const str=String(raw||'').replace(/\D/g,''); return UF_CODES[Number(str)] || ''; }
function flattenCoords(coords, out=[]){ if(!Array.isArray(coords)) return out; if(typeof coords[0]==='number' && typeof coords[1]==='number'){ out.push(coords); return out; } coords.forEach(c=>flattenCoords(c,out)); return out; }
function centroidOfGeoJSON(geo){ const feature = geo?.type==='FeatureCollection' ? geo.features?.[0] : geo?.type==='Feature' ? geo : null; const pts = flattenCoords(feature?.geometry?.coordinates || []); if(!pts.length) return null; let lon=0, lat=0; pts.forEach(([x,y])=>{lon+=Number(x); lat+=Number(y)}); return [lat/pts.length, lon/pts.length]; }
async function fetchCityCentroid(codigo){ if(!codigo) return null; const url=`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigo}?formato=application/vnd.geo+json&qualidade=minima`; const res=await fetch(url); if(!res.ok) return null; const geo=await res.json(); return centroidOfGeoJSON(geo); }

function saveLocal(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function loadLocal(k){ try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } }
const personName = person => person?.nome || person?.name || person?.email?.split('@')[0] || '';
const phoneDigits = value => String(value || '').replace(/\D/g, '').slice(0, 11);
const formatPhoneBR = value => {
  const d = phoneDigits(value);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const autoServiceStatus = (inicio, fim, fallback = 'Não iniciada') => {
  const manual = normalizeFarmStatus(fallback);
  if (manual === 'Com pendência' || manual === 'Aguardando validação') return manual;
  if (inicio && fim) return FARM_STATUS_DONE;
  if (inicio && !fim) return 'Em andamento';
  return 'Não iniciada';
};

function useData(user, localMode=false){
  const [fazendas,setFazendas]=useState([]), [equipamentos,setEquipamentos]=useState([]), [visitas,setVisitas]=useState([]), [checklists,setChecklists]=useState([]), [diagnosticos,setDiagnosticos]=useState([]), [planejamentos,setPlanejamentos]=useState([]), [obstaculos,setObstaculos]=useState([]), [testesCobertura,setTestesCobertura]=useState([]), [evidencias,setEvidencias]=useState([]), [fazendaMembros,setFazendaMembros]=useState([]), [dadosRestritos,setDadosRestritos]=useState([]);
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

  async function signEvidenceRows(rows){
    if(!cloud || !rows?.length) return rows || [];
    const paths = rows.map(r=>r.arquivo_path).filter(Boolean);
    if(!paths.length) return rows;
    const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrls(paths, 60 * 60);
    if(error){ console.warn('Evidências sem URL assinada:', error.message); return rows; }
    const urlByPath = Object.fromEntries((data || []).map(item=>[item.path, item.signedUrl]));
    return rows.map(row=>({...row, url:urlByPath[row.arquivo_path] || row.arquivo_url || ''}));
  }

  async function signEvidenceRow(row){
    const [signed] = await signEvidenceRows([row]);
    return signed || row;
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
          supabase.from('diagnosticos_realizados').select('*').order('created_at',{ascending:false}),
          supabase.from('planejamentos_antena').select('*').order('created_at',{ascending:false}),
          supabase.from('obstaculos_cobertura').select('*').order('created_at',{ascending:false}),
          supabase.from('testes_cobertura').select('*').order('created_at',{ascending:false})
        ]);
        if(!alive) return;
        const firstError = tables.find(t=>t.error)?.error;
        if(firstError){
          setError(firstError.message, firstError);
          setLoading(false);
          return;
        }
        setFazendas((tables[0].data||[]).map(normalizeFarmRow)); setEquipamentos(tables[1].data||[]); setVisitas(tables[2].data||[]); setChecklists(tables[3].data||[]); setDiagnosticos(tables[4].data||[]); setPlanejamentos(tables[5].data||[]); setObstaculos(tables[6].data||[]); setTestesCobertura(tables[7].data||[]);
        const evidenciasResult = await supabase.from('evidencias_fazenda').select('*').order('created_at',{ascending:false});
        if(!evidenciasResult.error)setEvidencias(await signEvidenceRows(evidenciasResult.data||[]));else{console.warn('Evidências não carregadas:',evidenciasResult.error.message);setEvidencias([]);}
        const membros = await supabase.from('fazenda_membros').select('*, profiles:user_id(id,email,nome)').order('created_at',{ascending:true});
        if(!membros.error)setFazendaMembros(membros.data||[]);else{console.warn('Compartilhamento não carregado:',membros.error.message);setFazendaMembros([]);}
        const restritos = await supabase.from('fazenda_dados_restritos').select('*').order('updated_at',{ascending:false});
        if(!restritos.error)setDadosRestritos(restritos.data||[]);else{console.warn('Dados restritos não carregados:',restritos.error.message);setDadosRestritos([]);}
        setOk();
      } else {
        setFazendas(loadLocal('cta_fazendas').map(normalizeFarmRow)); setEquipamentos(loadLocal('cta_equipamentos')); setVisitas(loadLocal('cta_visitas')); setChecklists(loadLocal('cta_checklists')); setDiagnosticos(loadLocal('cta_diagnosticos')); setPlanejamentos(loadLocal('cta_planejamentos')); setObstaculos(loadLocal('cta_obstaculos')); setTestesCobertura(loadLocal('cta_testes_cobertura')); setEvidencias(loadLocal('cta_evidencias')); setFazendaMembros([]); setDadosRestritos(loadLocal('cta_dados_restritos'));
        setDbStatus({mode:'local',connected:false,lastError: supabase ? 'Modo local de emergência ativado manualmente.' : 'Supabase não configurado no .env.local.', lastSync:new Date().toLocaleString('pt-BR'), details:{}});
      }
      setLoading(false);
    }
    load(); return ()=>{alive=false};
  },[cloud,user?.id,localMode]);

  async function activeUserId(){
    if(!cloud) return user?.id || null;
    const { data, error } = await supabase.auth.getSession();
    const id = data?.session?.user?.id;
    if(error || !id){
      const message = 'Sessão expirada. Entre novamente para salvar no Supabase.';
      setError(message, error || {});
      notify(message, 'error');
      return null;
    }
    return id;
  }
  async function saveFazendaRpc(row){
    const { data, error } = await supabase.rpc('save_fazenda', { payload: row });
    if(!error) return {data,error:null,handled:true};
    const message = String(error.message || '');
    const missingFunction = error.code === 'PGRST202' || message.includes('save_fazenda') || message.includes('Could not find the function');
    return missingFunction ? {handled:false} : {data:null,error,handled:true};
  }
  async function upsert(table, setter, key, row){
    const clean = {...row, updated_at: nowISO()};
    let savedRow = clean;
    if(cloud){
      const authUserId = await activeUserId();
      if(!authUserId) return {ok:false,error:new Error('Sessão inválida')};
      const currentList = {
        fazendas,
        equipamentos,
        visitas,
        checklists_fazenda: checklists,
        diagnosticos_realizados: diagnosticos,
        planejamentos_antena: planejamentos,
        obstaculos_cobertura: obstaculos,
        testes_cobertura: testesCobertura
      }[table] || [];
      const existsInState = currentList.some(item=>item.id===clean.id);
      if(!clean.user_id || clean.user_id === 'local-user' || (table === 'fazendas' && !existsInState)){
        clean.user_id = authUserId;
      }
      if(table === 'fazendas'){
        const rpcResult = await saveFazendaRpc(clean);
        if(rpcResult.handled){
          if(rpcResult.error){
            setError(`Erro ao salvar em ${table}: ${rpcResult.error.message}`, rpcResult.error);
            notify(`Não foi possível salvar no Supabase: ${rpcResult.error.message}`,'error');
            return {ok:false,error:rpcResult.error};
          }
          savedRow = normalizeFarmRow(rpcResult.data || clean);
          setOk();
          setter(prev => { const exists=prev.some(x=>x.id===savedRow.id); const next=exists?prev.map(x=>x.id===savedRow.id?savedRow:x):[savedRow,...prev]; return next; });
          return {ok:true};
        }
      }
      const query = existsInState
        ? supabase.from(table).update(clean).eq('id', clean.id)
        : supabase.from(table).insert(clean);
      const { data:saved, error } = await query.select('*').single();
      if(error){
        setError(`Erro ao salvar em ${table}: ${error.message}`, error);
        notify(`Não foi possível salvar no Supabase: ${error.message}`,'error');
        return {ok:false,error};
      }
      savedRow = table === 'fazendas' ? normalizeFarmRow(saved || clean) : (saved || clean);
      setOk();
    }
    setter(prev => { const exists=prev.some(x=>x.id===savedRow.id); const next=exists?prev.map(x=>x.id===savedRow.id?savedRow:x):[savedRow,...prev]; if(!cloud) saveLocal(key,next); return next; });
    return {ok:true};
  }
  async function remove(table, setter, key, id){
    if(!confirm('Remover este registro?')) return {ok:false};
    if(cloud){
      const { error } = await supabase.from(table).delete().eq('id',id);
      if(error){
        setError(`Erro ao remover de ${table}: ${error.message}`, error);
        notify(`Não foi possível remover no Supabase: ${error.message}`,'error');
        return {ok:false,error};
      }
      setOk();
    }
    setter(prev => { const next=prev.filter(x=>x.id!==id); if(!cloud) saveLocal(key,next); return next; });
    return {ok:true};
  }
  const withExistingOwner = (list, row) => ({...row, user_id:list.find(x=>x.id===row.id)?.user_id || row.user_id || user?.id});
  const cleanEvidenceForDb = (row) => {
    const {url, ...clean} = row;
    return {
      ...clean,
      categoria: clean.categoria || EVIDENCE_CATEGORIES[0],
      descricao: clean.descricao || '',
      equipamento_id: clean.equipamento_id || null,
      visita_id: clean.visita_id || null,
      inclui_relatorio: clean.inclui_relatorio !== false,
      updated_at: nowISO()
    };
  };
  async function uploadEvidencias(farm, files, meta={}){
    const selected = Array.from(files || []).filter(file=>file?.type?.startsWith('image/'));
    if(!farm?.id || !selected.length){ notify('Selecione uma ou mais imagens.','warning'); return {ok:false}; }
    const savedRows = [];
    for(const file of selected){
      try{
        const prepared = await prepareEvidenceFile(file);
        const id = uid();
        const baseRow = {
          id,
          user_id: user?.id,
          fazenda_id: farm.id,
          equipamento_id: meta.equipamento_id || null,
          visita_id: meta.visita_id || null,
          categoria: meta.categoria || EVIDENCE_CATEGORIES[0],
          descricao: meta.descricao || '',
          arquivo_nome: file.name,
          mime_type: prepared.type || file.type || 'image/jpeg',
          tamanho_bytes: prepared.size || file.size || 0,
          inclui_relatorio: meta.inclui_relatorio !== false,
          created_at: nowISO(),
          updated_at: nowISO()
        };
        if(cloud){
          const path = `${farm.id}/${Date.now()}-${id}-${safeFileName(file.name)}`;
          const { error: uploadError } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, prepared, {contentType:baseRow.mime_type, upsert:false});
          if(uploadError) throw uploadError;
          const dbRow = {...baseRow, arquivo_path:path, arquivo_url:null};
          const { data:saved, error } = await supabase.from('evidencias_fazenda').insert(cleanEvidenceForDb(dbRow)).select('*').single();
          if(error){
            await supabase.storage.from(EVIDENCE_BUCKET).remove([path]).catch(()=>{});
            throw error;
          }
          savedRows.push(await signEvidenceRow(saved));
        } else {
          const arquivo_url = await fileToDataUrl(prepared);
          savedRows.push({...baseRow, arquivo_path:null, arquivo_url, url:arquivo_url});
        }
      } catch(error){
        notify(`Não foi possível salvar ${file.name}: ${error.message || error}`,'error');
      }
    }
    if(savedRows.length){
      setEvidencias(prev=>{const next=[...savedRows,...prev]; if(!cloud) saveLocal('cta_evidencias',next); return next;});
      if(cloud) setOk();
      notify(`${savedRows.length} evidência(s) salva(s).`);
      return {ok:true,data:savedRows};
    }
    return {ok:false};
  }
  async function saveEvidencia(row){
    const clean = cleanEvidenceForDb(row);
    if(cloud){
      const { data:saved, error } = await supabase.from('evidencias_fazenda').update(clean).eq('id',row.id).select('*').single();
      if(error){ notify(`Não foi possível atualizar evidência: ${error.message}`,'error'); return {ok:false,error}; }
      const signed = await signEvidenceRow(saved);
      setEvidencias(prev=>prev.map(item=>item.id===row.id?signed:item));
      setOk();
      notify('Evidência atualizada.');
      return {ok:true,data:signed};
    }
    setEvidencias(prev=>{const next=prev.map(item=>item.id===row.id?{...item,...clean,url:item.url||item.arquivo_url}:item); saveLocal('cta_evidencias',next); return next;});
    notify('Evidência atualizada.');
    return {ok:true};
  }
  async function delEvidencia(item){
    if(!confirm('Remover esta evidência?')) return {ok:false};
    if(cloud){
      const { error } = await supabase.from('evidencias_fazenda').delete().eq('id',item.id);
      if(error){ notify(`Não foi possível remover evidência: ${error.message}`,'error'); return {ok:false,error}; }
      if(item.arquivo_path) await supabase.storage.from(EVIDENCE_BUCKET).remove([item.arquivo_path]).catch(()=>{});
      setOk();
    }
    setEvidencias(prev=>{const next=prev.filter(row=>row.id!==item.id); if(!cloud) saveLocal('cta_evidencias',next); return next;});
    notify('Evidência removida.');
    return {ok:true};
  }
  async function saveDadosRestritos(row){
    if(!row?.fazenda_id){ notify('Fazenda não informada para dados restritos.','error'); return {ok:false}; }
    const clean = {
      id: row.id || uid(),
      user_id: user?.id,
      fazenda_id: row.fazenda_id,
      sistema: row.sistema || 'Nedap',
      usuario_service: row.usuario_service || '',
      senha_service: row.senha_service || '',
      numero_licenca: row.numero_licenca || '',
      observacoes_restritas: row.observacoes_restritas || '',
      updated_at: nowISO(),
      created_at: row.created_at || nowISO()
    };
    let saved = clean;
    if(cloud){
      const authUserId = await activeUserId();
      if(!authUserId) return {ok:false,error:new Error('Sessão inválida')};
      clean.user_id = authUserId;
      const { data:savedRow, error } = await supabase.from('fazenda_dados_restritos').upsert(clean,{onConflict:'fazenda_id'}).select('*').single();
      if(error){ notify(`Não foi possível salvar dados restritos: ${error.message}`,'error'); return {ok:false,error}; }
      saved = savedRow || clean;
      setOk();
    }
    setDadosRestritos(prev=>{
      const next = prev.some(item=>item.fazenda_id===saved.fazenda_id)
        ? prev.map(item=>item.fazenda_id===saved.fazenda_id?saved:item)
        : [saved,...prev];
      if(!cloud) saveLocal('cta_dados_restritos',next);
      return next;
    });
    notify('Dados restritos salvos.');
    return {ok:true,data:saved};
  }
  async function shareFarm(farm, email, role='viewer'){
    if(!cloud){ notify('Compartilhamento exige Supabase ativo.','warning'); return {ok:false}; }
    const cleanEmail=String(email||'').trim().toLowerCase();
    if(!cleanEmail){ notify('Informe o e-mail do usuário.','warning'); return {ok:false}; }
    const {data:profile,error:profileError}=await supabase.from('profiles').select('id,email,nome').eq('email',cleanEmail).maybeSingle();
    if(profileError){ notify(`Não foi possível buscar o usuário: ${profileError.message}`,'error'); return {ok:false,error:profileError}; }
    if(!profile){ notify('Usuário não encontrado. Ele precisa criar uma conta e entrar no app pelo menos uma vez.','warning'); return {ok:false}; }
    if(profile.id===farm.user_id){ notify('Este usuário já é o proprietário da fazenda.','warning'); return {ok:false}; }
    const row={fazenda_id:farm.id,user_id:profile.id,role,created_by:user?.id,updated_at:nowISO()};
    const {data:saved,error}=await supabase.from('fazenda_membros').upsert(row,{onConflict:'fazenda_id,user_id'}).select('*, profiles:user_id(id,email,nome)').single();
    if(error){ notify(`Não foi possível compartilhar: ${error.message}`,'error'); return {ok:false,error}; }
    setFazendaMembros(prev=>{const next=prev.filter(m=>!(m.fazenda_id===farm.id&&m.user_id===profile.id));return [...next,saved];});
    notify('Acesso liberado para a fazenda.');
    return {ok:true,data:saved};
  }
  async function updateFarmMember(member, role){
    if(!cloud)return {ok:false};
    const {data:saved,error}=await supabase.from('fazenda_membros').update({role,updated_at:nowISO()}).eq('id',member.id).select('*, profiles:user_id(id,email,nome)').single();
    if(error){ notify(`Não foi possível alterar permissão: ${error.message}`,'error'); return {ok:false,error}; }
    setFazendaMembros(prev=>prev.map(m=>m.id===member.id?saved:m));
    notify('Permissão atualizada.');
    return {ok:true,data:saved};
  }
  async function removeFarmMember(memberId){
    if(!cloud)return {ok:false};
    if(!confirm('Remover acesso deste usuário?')) return {ok:false};
    const {error}=await supabase.from('fazenda_membros').delete().eq('id',memberId);
    if(error){ notify(`Não foi possível remover acesso: ${error.message}`,'error'); return {ok:false,error}; }
    setFazendaMembros(prev=>prev.filter(m=>m.id!==memberId));
    notify('Acesso removido.');
    return {ok:true};
  }
  return {
    cloud, loading, dbStatus, testConnection,
    userId:user?.id, currentUser:user ? {id:user.id,email:user.email,nome:personName(user.user_metadata)||user.email?.split('@')[0]||'Usuário atual'} : null, fazendas, equipamentos, visitas, checklists, diagnosticos, planejamentos, obstaculos, testesCobertura, evidencias, fazendaMembros, dadosRestritos,
    shareFarm, updateFarmMember, removeFarmMember, uploadEvidencias, saveEvidencia, delEvidencia, saveDadosRestritos,
    saveFazenda: r => upsert('fazendas', setFazendas, 'cta_fazendas', normalizeFarmRow(withExistingOwner(fazendas,r))),
    saveEquipamento: r => upsert('equipamentos', setEquipamentos, 'cta_equipamentos', withExistingOwner(equipamentos,r)),
    saveVisita: r => upsert('visitas', setVisitas, 'cta_visitas', withExistingOwner(visitas,r)),
    saveChecklist: r => upsert('checklists_fazenda', setChecklists, 'cta_checklists', withExistingOwner(checklists,r)),
    saveDiagnostico: r => upsert('diagnosticos_realizados', setDiagnosticos, 'cta_diagnosticos', withExistingOwner(diagnosticos,r)),
    savePlanejamento: r => upsert('planejamentos_antena', setPlanejamentos, 'cta_planejamentos', withExistingOwner(planejamentos,r)),
    saveObstaculo: r => upsert('obstaculos_cobertura', setObstaculos, 'cta_obstaculos', withExistingOwner(obstaculos,r)),
    saveTesteCobertura: r => upsert('testes_cobertura', setTestesCobertura, 'cta_testes_cobertura', withExistingOwner(testesCobertura,r)),
    delFazenda: id => remove('fazendas', setFazendas, 'cta_fazendas', id),
    delEquipamento: id => remove('equipamentos', setEquipamentos, 'cta_equipamentos', id),
    delVisita: id => remove('visitas', setVisitas, 'cta_visitas', id),
    delChecklist: id => remove('checklists_fazenda', setChecklists, 'cta_checklists', id),
    delPlanejamento: id => remove('planejamentos_antena', setPlanejamentos, 'cta_planejamentos', id),
    delObstaculo: id => remove('obstaculos_cobertura', setObstaculos, 'cta_obstaculos', id),
    delTesteCobertura: id => remove('testes_cobertura', setTestesCobertura, 'cta_testes_cobertura', id)
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
  const [view,setView]=useState(()=>readAppContext().view || 'fazendas');
  const [selectedFarmId,setSelectedFarmId]=useState(()=>readAppContext().farmId || null);
  const [localMode,setLocalMode]=useState(localStorage.getItem(LOCAL_MODE_KEY)==='true');
  const [recoveryMode,setRecoveryMode]=useState(()=> window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery'));
  const updateHandled=useRef(false);
  const update = useAppUpdate();
  const data=useData(user, localMode);
  const selectedFarm=data.fazendas.find(f=>f.id===selectedFarmId);
  useEffect(()=>{
    if(view==='fazenda' && !selectedFarmId){
      saveAppContext('fazendas', null);
      setView('fazendas');
      return;
    }
    if(view==='fazenda' && selectedFarmId && data.dbStatus.lastSync && !selectedFarm){
      saveAppContext('fazendas', null);
      setSelectedFarmId(null);
      setView('fazendas');
    }
  },[view, selectedFarmId, selectedFarm, data.dbStatus.lastSync]);
  useEffect(()=>{
    if(!supabase||!user||localMode)return;
    const email=String(user.email||'').trim().toLowerCase();
    supabase.from('profiles').upsert({id:user.id,email,nome:user.user_metadata?.name||email.split('@')[0]||'Usuário',updated_at:nowISO()}).then(({error})=>{if(error)console.warn('Profile sync:',error.message)});
  },[user?.id,localMode]);
  useEffect(()=>{
    if(!update.updateAvailable || updateHandled.current) return;
    updateHandled.current=true;
    notify('Nova versão encontrada. O app será atualizado automaticamente.','warning');
    const timer=setTimeout(()=>update.applyUpdate(),1400);
    return ()=>clearTimeout(timer);
  },[update.updateAvailable]);
  useEffect(()=>{
    if(!supabase) { setAuthLoading(false); return; }
    let active = true;
    supabase.auth.getSession().then(({data,error})=>{
      if(!active) return;
      if(error) console.warn('Auth session:', error.message);
      setUser(data?.session?.user||null);
      setAuthLoading(false);
    });
    const {data:sub}=supabase.auth.onAuthStateChange((event,session)=>{
      setUser(session?.user||null);
      if(event==='PASSWORD_RECOVERY') setRecoveryMode(true);
      if(event==='SIGNED_OUT') setRecoveryMode(false);
    });
    return ()=>{ active=false; sub?.subscription?.unsubscribe?.(); };
  },[]);
  if(authLoading) return <Splash/>;
  if(!supabase && !localMode) return <SupabaseSetup onUseLocal={()=>{localStorage.setItem(LOCAL_MODE_KEY,'true'); setLocalMode(true)}}/>;
  if(supabase && recoveryMode && user && !localMode) return <PasswordRecovery onDone={()=>{setRecoveryMode(false); window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);}}/>;
  if(supabase && !user && !localMode) return <Login onUseLocal={()=>{localStorage.setItem(LOCAL_MODE_KEY,'true'); setLocalMode(true)}}/>;
  const goFarm = id => { setSelectedFarmId(id); setView('fazenda'); saveAppContext('fazenda', id); };
  const setMainView = v => { setView(v); if(v!=='fazenda') setSelectedFarmId(null); saveAppContext(v, v==='fazenda'?selectedFarmId:null); };
  const exitLocalMode = () => { localStorage.removeItem(LOCAL_MODE_KEY); saveAppContext('fazendas', null); setLocalMode(false); setSelectedFarmId(null); setView('fazendas'); };
  const logout = async () => { if(localMode){ exitLocalMode(); return; } await supabase?.auth.signOut(); };
  return <div className="app"><NotificationCenter/><Sidebar view={view} setView={setMainView} user={user} cloud={data.cloud} localMode={localMode} onExitLocal={exitLocalMode}/><main className="main">
    {(!data.cloud || localMode) && <SystemStatus data={data} localMode={localMode} onDisableLocal={()=>{localStorage.removeItem(LOCAL_MODE_KEY); setLocalMode(false)}}/>}
    {view==='fazendas' && <Fazendas data={data} onOpen={goFarm}/>}
    {view==='diagnostico' && <Diagnostico data={data}/>}
    {view==='guia' && <Guia/>}
    {view==='produtividade' && <Produtividade data={data} onOpen={goFarm}/>}
    {view==='relatorios' && <Relatorios data={data} onOpen={goFarm}/>}
    {view==='fazenda' && selectedFarm && <FazendaDetalhe farm={selectedFarm} data={data} onBack={()=>setMainView('fazendas')}/>}
  </main>{view!=='fazenda'&&<BottomNav view={view} setView={setMainView} user={user} localMode={localMode} onLogout={logout}/>}</div>;
}

function Splash(){return <div className="splash"><Logo/><p>Carregando ambiente técnico...</p></div>}
function Logo(){return <div className="logo"><div className="logoIcon"><ClipboardCheck size={25}/><Wifi size={15} className="wifi"/></div><div><b>ControlTech</b><span>Assist</span></div></div>}
function translateAuthError(message=''){
  const m = String(message || '').toLowerCase();
  if(m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if(m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if(m.includes('user already registered')) return 'Este e-mail já possui cadastro. Use entrar ou recupere a senha.';
  if(m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return message || 'Não foi possível concluir a ação.';
}

function Login({onUseLocal}){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[mode,setMode]=useState('login'),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  const content={
    login:['Acesso seguro','Entrar no ControlTech Assist','Acesse suas fazendas, mapas técnicos, visitas e relatórios em um ambiente único.'],
    signup:['Criar conta','Começar no ControlTech Assist','Crie seu acesso para cadastrar fazendas e liberar visualização para sua equipe.'],
    forgot:['Recuperar senha','Recuperar acesso','Informe seu e-mail para receber um link seguro de redefinição de senha.']
  }[mode];
  const submit=async(e)=>{
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try{
      if(!supabase) throw new Error('Supabase não configurado.');
      const cleanEmail = email.trim();
      let result;
      if(mode==='forgot'){
        result = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin });
        if(result.error) throw result.error;
        setMsg('Enviamos um link para redefinir sua senha. Abra o e-mail neste mesmo navegador ou no domínio do app.');
        return;
      }
      if(password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      if(mode==='login'){
        result = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if(result.error) throw result.error;
        setMsg('Entrando...');
      } else {
        result = await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: window.location.origin } });
        if(result.error) throw result.error;
        setMsg('Cadastro criado. Se o Supabase pedir confirmação, verifique seu e-mail antes de entrar.');
      }
    } catch(err){
      console.error('Erro de autenticação:', err);
      setMsg(translateAuthError(err?.message));
    } finally { setBusy(false); }
  };
  return <AuthShell eyebrow={content[0]} title={content[1]} desc={content[2]}>{mode!=='forgot'&&<div className="authModeTabs"><button type="button" className={mode==='login'?'active':''} onClick={()=>{setMsg('');setMode('login')}}>Entrar</button><button type="button" className={mode==='signup'?'active':''} onClick={()=>{setMsg('');setMode('signup')}}>Criar conta</button></div>}<form onSubmit={submit} className="authForm"><label className="authField"><span>E-mail</span><div className="authInput"><User size={18}/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="seu@email.com" autoComplete="email"/></div></label>{mode!=='forgot'&&<label className="authField"><span>Senha</span><div className="authInput"><ShieldCheck size={18}/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="mínimo 6 caracteres" autoComplete={mode==='login'?'current-password':'new-password'}/></div></label>}<button className="btn primary authSubmit" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar no app':mode==='signup'?'Criar minha conta':'Enviar link de recuperação'}</button></form><div className="authLinks">{mode==='forgot'?<button className="linkBtn" onClick={()=>{setMsg('');setMode('login')}}>Voltar para entrar</button>:<button className="linkBtn" onClick={()=>{setMsg('');setMode('forgot')}}>Esqueci minha senha</button>}<button type="button" className="linkBtn dangerText localModeBtn" onClick={onUseLocal}>Usar modo local de emergência</button></div>{msg&&<div className="notice authNotice">{msg}</div>}</AuthShell>
}

function AuthShell({eyebrow,title,desc,children}){
  const features=[['Fazendas',MapPinned,'Cadastro, status e responsáveis por operação.'],['Campo',Stethoscope,'Visitas, checklists e diagnóstico técnico.'],['Equipamentos',Cpu,'VP8002, VP4102, antenas e coordenadas.'],['Acesso',ShieldCheck,'Compartilhamento com permissões por fazenda.']];
  return <div className="loginPage authPage"><div className="authShell"><aside className="authAside"><Logo/><div className="authHeroCopy"><span className="eyebrow">Operação técnica</span><h1>Controle de campo com dados, mapa e relatório no mesmo lugar.</h1><p>Um painel pensado para assistência técnica em fazendas, instalação de equipamentos e acompanhamento de visitas.</p></div><div className="authFeatureGrid">{features.map(([label,Icon,text])=><div className="authFeature" key={label}><Icon size={18}/><b>{label}</b><span>{text}</span></div>)}</div><div className="authTrust"><ShieldCheck size={18}/><span>Dados protegidos por conta e acesso liberado por fazenda.</span></div></aside><section className="loginCard authCard"><div className="authCardBrand"><Logo/></div><div className="authCardHead"><span>{eyebrow}</span><h2>{title}</h2><p>{desc}</p></div>{children}</section></div></div>
}

function PasswordRecovery({onDone}){
  const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  const submit=async(e)=>{
    e.preventDefault(); setMsg('');
    if(password.length<6){ setMsg('A nova senha precisa ter pelo menos 6 caracteres.'); return; }
    if(password!==confirm){ setMsg('As senhas não conferem.'); return; }
    setBusy(true);
    try{
      const {error}=await supabase.auth.updateUser({ password });
      if(error) throw error;
      setMsg('Senha atualizada com sucesso. Você já pode usar o sistema.');
      setTimeout(onDone, 900);
    }catch(err){ setMsg(translateAuthError(err?.message)); }
    finally{ setBusy(false); }
  };
  return <AuthShell eyebrow="Recuperação de acesso" title="Definir nova senha" desc="Crie uma senha nova para voltar ao ControlTech Assist com segurança."><form onSubmit={submit} className="authForm"><label className="authField"><span>Nova senha</span><div className="authInput"><ShieldCheck size={18}/><input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="mínimo 6 caracteres" autoComplete="new-password"/></div></label><label className="authField"><span>Confirmar senha</span><div className="authInput"><ShieldCheck size={18}/><input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" required placeholder="repita a nova senha" autoComplete="new-password"/></div></label><button className="btn primary authSubmit" disabled={busy}>{busy?'Salvando...':'Atualizar senha'}</button></form>{msg&&<div className="notice authNotice">{msg}</div>}</AuthShell>
}

function SupabaseSetup({onUseLocal}){
  return <AuthShell eyebrow="Configuração" title="Supabase não configurado" desc="Configure o banco para usar login, sincronização e permissões por fazenda."><div className="setupBox"><p>Crie um arquivo <b>.env.local</b> na raiz do projeto e reinicie o servidor.</p><pre className="codeBox">VITE_SUPABASE_URL=https://zczqkiffjnracgopczkk.supabase.co{`\n`}VITE_SUPABASE_ANON_KEY=sua_chave_anon_public</pre><p>Depois rode novamente <b>npm run dev</b>.</p></div><button className="btn primary authSubmit" onClick={()=>window.location.reload()}>Tentar novamente</button><button type="button" className="linkBtn dangerText localModeBtn" onClick={onUseLocal}>Usar modo local de emergência</button></AuthShell>
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

function Sidebar({view,setView,user,cloud,localMode,onExitLocal}){const items=[['fazendas',MapPinned,'Fazendas'],['produtividade',Gauge,'Produtividade'],['diagnostico',Stethoscope,'Diagnóstico'],['guia',BookOpen,'Guia'],['relatorios',FileText,'Relatórios']];return <aside className="sidebar"><Logo/><nav>{items.map(([id,Icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={20}/>{label}</button>)}</nav><div className="sideFoot"><span className={cloud?'cloud on':'cloud'}><Database size={15}/>{cloud?'Supabase ativo':'Modo local'}</span>{localMode&&<button className="logout" onClick={onExitLocal}><Database size={16}/> Voltar ao Supabase</button>}{user&&<button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sair</button>}</div></aside>}
function BottomNav({view,setView,user,localMode,onLogout}){const items=[['fazendas',Home,'Início'],['produtividade',BarChart3,'Prod.'],['diagnostico',Stethoscope,'Diag.'],['guia',BookOpen,'Guia'],['relatorios',FileText,'Rel.']];const columns=items.length+(user||localMode?1:0);return <nav className="bottomNav" style={{gridTemplateColumns:`repeat(${columns},1fr)`}}>{items.map(([id,Icon,label])=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={20}/><span>{label}</span></button>)}{(user||localMode)&&<button className="mobileLogout" onClick={onLogout}><LogOut size={20}/><span>Sair</span></button>}</nav>}
function FarmBottomNav({farm,tabs,tab,setTab,onBack,access,serviceActive,serviceDone,onStart,onFinish,onEdit,onNewVisit}){const [open,setOpen]=useState(false);const mainIds=['resumo','mapa','visitas','relatorio'];const mainTabs=tabs.filter(([id])=>mainIds.includes(id));const moreTabs=tabs.filter(([id])=>!mainIds.includes(id));const go=id=>{setTab(id);setOpen(false)};return <><nav className="farmBottomNav"><button onClick={onBack}><Home size={20}/><span>Início</span></button>{mainTabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>go(id)}><Icon size={20}/><span>{label.replace(' técnico','').replace('Relatório','Rel.')}</span></button>)}<button className={open?'active':''} onClick={()=>setOpen(v=>!v)}><Layers size={20}/><span>Mais</span></button></nav>{open&&<><button className="farmMoreBackdrop" aria-label="Fechar menu da fazenda" onClick={()=>setOpen(false)}/><div className="farmMoreSheet"><div className="farmMoreTitle"><span>Mais opções</span><button type="button" aria-label="Fechar menu" onClick={()=>setOpen(false)}><X size={16}/></button></div><div className="farmMoreGrid">{moreTabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span></button>)}</div></div></>}</>}
function PageHead({eyebrow,title,children}){return <header className="pageHead"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><div className="headActions">{children}</div></header>}
function Stat({icon:Icon,label,value,tone=''}){return <div className={`stat ${tone}`}><Icon size={22}/><div><b>{value}</b><span>{label}</span></div></div>}
function Empty({icon:Icon=Info,title,text}){return <div className="empty"><Icon size={42}/><h3>{title}</h3><p>{text}</p></div>}
const ACCESS_LABELS={owner:'Proprietário',admin:'Administrador',viewer:'Visualizador'};
function farmAccess(farm,data){
  if(!farm)return {role:'viewer',label:'Visualizador',canEdit:false,canManageAccess:false,isShared:false};
  if(!data.cloud)return {role:'owner',label:'Proprietário',canEdit:true,canManageAccess:true,isShared:false};
  const isOwner=farm.user_id===data.userId;
  const member=data.fazendaMembros?.find(m=>m.fazenda_id===farm.id&&m.user_id===data.userId);
  const role=isOwner?'owner':(member?.role||'viewer');
  return {role,label:ACCESS_LABELS[role]||'Visualizador',canEdit:['owner','admin'].includes(role),canManageAccess:role==='owner',isShared:!isOwner};
}
function AccessBadge({access}){return <span className={`accessBadge ${access.role}`}>{access.label}</span>}
function PermissionNotice(){return <div className="permissionNotice"><ShieldCheck size={18}/><span>Você está como visualizador. Pode consultar informações e relatórios, mas não alterar dados desta fazenda.</span></div>}


function BrasilAtuacaoMap({fazendas,onOpen}){
  const [geo,setGeo]=useState(null), [filter,setFilter]=useState('Todas'), [err,setErr]=useState('');
  useEffect(()=>{ let alive=true; fetch('https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF').then(r=>r.json()).then(g=>alive&&setGeo(g)).catch(()=>alive&&setErr('Não foi possível carregar a malha dos estados pelo IBGE. Os pontos continuam disponíveis no mapa.')); return()=>{alive=false}; },[]);
  const farms = fazendas.filter(f=>filter==='Todas'||(f.central||'Outra / Não informado')===filter);
  const statesActive = new Set(farms.map(getFarmUF).filter(Boolean));
  const styleFeature = (feature) => { const uf=getGeoUF(feature); const central=centralForUF(farms,uf); const active=statesActive.has(uf); return { color:'#ffffff', weight:1.2, fillColor: active ? (STATE_COLORS[central]||STATE_COLORS.mixed) : STATE_COLORS.none, fillOpacity: active ? .82 : .65 }; };
  return <section className="panel coveragePanel"><div className="sectionTitle"><h2><Globe2 size={21}/> Mapa de atuação</h2><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="legend"><span><i style={{background:STATE_COLORS['Alta Genetics']}}/> Alta Genetics</span><span><i style={{background:STATE_COLORS['Genex Brasil']}}/> Genex Brasil</span><span><i style={{background:STATE_COLORS.mixed}}/> Mais de uma central</span><span><i style={{background:STATE_COLORS.none}}/> Sem atendimento</span></div>
    <div className="brMap"><MapContainer center={[-15.8,-47.9]} zoom={4} minZoom={3} className="bigMap" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
      {geo && <GeoJSON key={filter+fazendas.length} data={geo} style={styleFeature} onEachFeature={(feature,layer)=>{const uf=getGeoUF(feature); const count=farms.filter(f=>getFarmUF(f)===uf).length; layer.bindTooltip(`${uf || 'UF'} • ${count} fazenda(s)`);}} />}
      {farms.map(f=><Marker key={f.id} position={farmLatLng(f)} icon={farmMarkerIcon(f)} eventHandlers={{click:()=>onOpen(f.id)}}><Popup><b>{f.nome}</b><br/>{f.cidade||'-'} {getFarmUF(f)&&`/ ${getFarmUF(f)}`}<br/>Central: {f.central||'-'}<br/>Regional: {f.regional_nome||'-'}<br/>Colares: {collarBreakdown(f)}</Popup></Marker>)}
    </MapContainer></div>{err&&<p className="sourceText">{err}</p>}</section>
}

const centralTone = (central) => {
  const text = String(central || '').toLowerCase();
  if (text.includes('alta')) return 'alta';
  if (text.includes('genex')) return 'genex';
  return 'other';
};
const centralDisplay = (central) => {
  const tone = centralTone(central);
  if (tone === 'alta') return 'Alta Genetics';
  if (tone === 'genex') return 'Genex Brasil';
  return central || 'Sem central';
};
const centralMatches = (farm, value) => {
  if (value === 'Todas') return true;
  if (value === 'Outra / Não informado') return centralTone(farm.central) === 'other';
  return (farm.central || '') === value;
};
const farmHasPending = (farm, data) => farmStatus(farm) === 'Com pendência' || collarHasPending(farm) || data.visitas.some(v => v.fazenda_id === farm.id && v.pendencias);
const latestFarmVisit = (farm, data) => data.visitas.filter(v => v.fazenda_id === farm.id).sort((a,b) => String(b.data_visita || '').localeCompare(String(a.data_visita || '')))[0];

function Fazendas({data,onOpen}){
  const [q,setQ]=useState(''),[modal,setModal]=useState(false),[central,setCentral]=useState('Todas'),[status,setStatus]=useState('Todos'),[quick,setQuick]=useState('todos'),[filtersOpen,setFiltersOpen]=useState(false);
  const farmEquipments = (farm) => data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const farms=data.fazendas.filter(f=>{
    const equipmentText=farmEquipments(f).map(e=>[e.tipo,e.apelido,e.local_nome].join(' ')).join(' ');
    const matchesText=[f.nome,f.cidade,f.estado_uf,f.responsavel,f.central,f.regional_nome,f.veterinario_apoio,equipmentText].join(' ').toLowerCase().includes(q.toLowerCase());
    const currentStatus=farmStatus(f);
    const matchesStatus=status==='Todos'||currentStatus===status;
    const matchesQuick=quick==='todos'||(quick==='sem-gps'&&!(f.latitude&&f.longitude))||(quick==='sem-equip'&&!farmEquipments(f).length)||(quick==='pendencias'&&farmHasPending(f,data));
    return matchesText&&centralMatches(f,central)&&matchesStatus&&matchesQuick;
  });
  const counts={
    naoIniciadas:data.fazendas.filter(f=>farmStatus(f)==='Não iniciada').length,
    andamento:data.fazendas.filter(f=>farmStatus(f)==='Em andamento').length,
    pendencias:data.fazendas.filter(f=>farmHasPending(f,data)).length,
    finalizadas:data.fazendas.filter(f=>farmStatus(f)===FARM_STATUS_DONE).length,
    semGps:data.fazendas.filter(f=>!(f.latitude&&f.longitude)).length,
    semEquip:data.fazendas.filter(f=>!farmEquipments(f).length).length
  };
  const centralOptions=[
    {value:'Todas',label:'Todas',count:data.fazendas.length,tone:'all'},
    {value:'Alta Genetics',label:'Alta',count:data.fazendas.filter(f=>centralMatches(f,'Alta Genetics')).length,tone:'alta'},
    {value:'Genex Brasil',label:'Genex',count:data.fazendas.filter(f=>centralMatches(f,'Genex Brasil')).length,tone:'genex'},
    {value:'Outra / Não informado',label:'Outras',count:data.fazendas.filter(f=>centralMatches(f,'Outra / Não informado')).length,tone:'other'}
  ];
  const quickOptions=[
    {id:'todos',label:'Todas',count:data.fazendas.length},
    {id:'pendencias',label:'Pendências',count:counts.pendencias},
    {id:'sem-gps',label:'Sem GPS',count:counts.semGps},
    {id:'sem-equip',label:'Sem equip.',count:counts.semEquip}
  ];
  const resetFilters=()=>{setQ('');setCentral('Todas');setStatus('Todos');setQuick('todos')};
  const hasActiveFilters=Boolean(q)||central!=='Todas'||status!=='Todos'||quick!=='todos';
  const saveFarm=async(r)=>{const result=await data.saveFazenda(r);if(result.ok)setModal(false)};
  return <div className="farmsHome">
    <section className="farmsHeroHome">
      <div className="farmsHeroCopy">
        <span className="eyebrow">Operação de campo</span>
        <h1>Fazendas</h1>
        <div className="farmsHeroMetrics">
          <span><small>Total</small><b>{data.fazendas.length}</b><em>cadastradas</em></span>
          <span><small>A iniciar</small><b>{counts.naoIniciadas}</b><em>não iniciadas</em></span>
          <span><small>Agora</small><b>{counts.andamento}</b><em>em andamento</em></span>
          <span><small>Fechadas</small><b>{counts.finalizadas}</b><em>concluídas</em></span>
        </div>
      </div>
      <div className="farmsHeroVisual" aria-hidden="true">
        <div className="fieldRadar"><Building2 size={28}/><i /><i /></div>
        <div className="fieldLines"><span /><span /><span /></div>
      </div>
      <button className="btn primary farmsNewDesktop" onClick={()=>setModal(true)}><Plus size={18}/> Nova fazenda</button>
    </section>

    <section className="farmsCommandBar">
      <div className="farmHomeSearch">
        <Search size={19}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar fazenda, cidade, responsável ou equipamento" />
      </div>
      <button className={`farmFilterButton ${hasActiveFilters?'active':''}`} onClick={()=>setFiltersOpen(true)}>
        <Filter size={18}/><span>Filtros</span>{hasActiveFilters&&<b />}
      </button>
    </section>

    <div className="farmCentralRail" aria-label="Filtrar por central">
      {centralOptions.map(({value,label,count,tone})=><button key={value} className={`${central===value?'active ':''}${tone}`} onClick={()=>setCentral(value)}>
        <span>{label}</span><b>{count}</b>
      </button>)}
    </div>

    <div className="farmQuickRail" aria-label="Filtros rápidos">
      {quickOptions.map(({id,label,count})=><button key={id} className={quick===id?'active':''} onClick={()=>setQuick(id)}>
        <span>{label}</span><b>{count}</b>
      </button>)}
    </div>

    <section className="farmResultsPanel">
      <div className="farmResultsHeader">
        <div><span className="eyebrow">Localizar fazenda</span><h2>{farms.length} resultado(s)</h2></div>
        <div className="farmDesktopFilters">
          <select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select>
          <button className="btn light" onClick={resetFilters} disabled={!hasActiveFilters}>Limpar</button>
        </div>
      </div>
      {farms.length===0?<><Empty title="Nenhuma fazenda encontrada" text="Altere os filtros ou cadastre uma nova fazenda."/>{data.cloud&&data.fazendas.length===0&&<AccountDataNotice userId={data.userId}/>}</>:<div className="farmGrid finderGrid farmGridModern">{farms.map(f=><FarmCard key={f.id} farm={f} data={data} onOpen={()=>onOpen(f.id)}/>)}</div>}
    </section>

    <div className="fieldMapSecondary farmsMapPreview"><BrasilAtuacaoMap fazendas={data.fazendas} onOpen={onOpen}/></div>
    <button className="mobileFarmFab" onClick={()=>setModal(true)}><Plus size={22}/></button>
    {filtersOpen&&<div className="farmFilterSheetBackdrop" onClick={()=>setFiltersOpen(false)}>
      <aside className="farmFilterSheet" onClick={e=>e.stopPropagation()}>
        <header><div><span className="eyebrow">Filtros</span><h3>Refinar lista</h3></div><button type="button" onClick={()=>setFiltersOpen(false)}><X size={18}/></button></header>
        <label>Central<select value={central} onChange={e=>setCentral(e.target.value)}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></label>
        <div className="farmSheetQuick"><span>Condição</span><div>{quickOptions.map(({id,label,count})=><button type="button" key={id} className={quick===id?'active':''} onClick={()=>setQuick(id)}>{label}<b>{count}</b></button>)}</div></div>
        <div className="farmSheetActions"><button className="btn light" onClick={resetFilters}>Limpar filtros</button><button className="btn primary" onClick={()=>setFiltersOpen(false)}>Aplicar</button></div>
      </aside>
    </div>}
    {modal&&<FazendaModal data={data} onClose={()=>setModal(false)} onSave={saveFarm}/>}
  </div>
}
function AccountDataNotice({userId}){const copy=async()=>{try{await navigator.clipboard.writeText(userId||'');notify('UID copiado.')}catch{}};return <section className="accountNotice"><UserCheck size={24}/><div><h3>Conta conectada, mas sem fazendas vinculadas</h3><p>O Supabase protege os dados por UID. Se suas fazendas foram criadas com outra conta, elas continuam no banco, mas não aparecem para esta conta.</p><div className="uidBox"><code>{userId||'UID indisponível'}</code><button onClick={copy}><Copy size={15}/> Copiar UID</button></div><small>Use o arquivo <b>supabase/migrar_dados_entre_contas.sql</b> para transferir os registros da conta antiga para esta conta sem perder equipamentos, visitas ou checklists.</small></div></section>}
function FarmCard({farm,data,onOpen}){
  const access=farmAccess(farm,data);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const eq=equips.length;
  const planned=num(farm.qtd_colares_prevista), installed=collarInstalled(farm), handled=collarHandled(farm);
  const pct=collarProgress(farm);
  const displayStatus=farmStatus(farm);
  const tone=centralTone(farm.central);
  const lastVisit=latestFarmVisit(farm,data);
  const hasGps=Boolean(farm.latitude&&farm.longitude);
  const pending=farmHasPending(farm,data);
  const peopleLine=[farm.responsavel,farm.regional_nome].filter(Boolean).join(' • ')||'Responsável não informado';
  return <article className={`farmCard farmCardPro central-${tone}`} onClick={onOpen}>
    <div className="farmCardAccent" />
    <div className="farmCardHeader">
      <div className={`farmBrandMark ${tone}`}><Building2 size={20}/></div>
      <div className="farmCardBadges">
        <span className={`centralPill ${tone}`}>{centralDisplay(farm.central)}</span>
        <span className={`status ${statusTone(displayStatus)}`}>{displayStatus}</span>
      </div>
    </div>
    <h3>{farm.nome}</h3>
    <div className="farmCardMeta">
      <span><MapPin size={15}/>{farm.cidade||'Cidade não informada'}{getFarmUF(farm)?` / ${getFarmUF(farm)}`:''}</span>
      <span><User size={15}/>{peopleLine}</span>
    </div>
    <div className="farmCardProgress">
      <div className="farmProgressTitle"><span><Milk size={15}/> Colares atendidos</span><b>{handled} / {planned}</b></div>
      <div className={`milkMeter ${pct<=0?'milkEmpty':pct>=100?'complete':''}`} aria-label={`${pct}% dos colares atendidos`}>
        <div className="milkFill" style={{width:`${Math.min(pct,100)}%`}}/>
      </div>
      <small>{installed} instalado(s){collarDelivered(farm)>0?` • ${collarDelivered(farm)} entregue(s)`:''}</small>
    </div>
    <div className="farmSignalRow">
      <span className={hasGps?'ok':'warn'}><LocateFixed size={15}/>{hasGps?'GPS':'Sem GPS'}</span>
      <span><Cpu size={15}/>{eq} equip.</span>
      {pending&&<span className="warn"><AlertTriangle size={15}/>Pendência</span>}
    </div>
    {access.isShared&&<AccessBadge access={access}/>}
    <footer><span>Última visita: {lastVisit?brDate(lastVisit.data_visita):'sem visita'}</span><b>Abrir <ChevronLeft className="rotate" size={16}/></b></footer>
  </article>
}
function FazendaModal({farm={},data={},onClose,onSave}){
  const currentUserName=personName(data.currentUser);
  const initialResponsible=farm.servico_responsavel||(!farm.id?currentUserName:'');
  const [ufs,setUfs]=useState([]),[cities,setCities]=useState([]),[loadingCities,setLoadingCities]=useState(false);
  const [tab,setTab]=useState('dados'),[focus,setFocus]=useState(null);
  const [form,setForm]=useState({id:farm.id||uid(),nome:farm.nome||'',central:farm.central||'',regional_nome:farm.regional_nome||'',veterinario_apoio:farm.veterinario_apoio||'',responsavel:farm.responsavel||'',telefone:formatPhoneBR(farm.telefone||''),estado_uf:farm.estado_uf||parseUF(farm.cidade)||'',estado_nome:farm.estado_nome||'',cidade:farm.cidade?.replace(/\s*\/\s*[A-Z]{2}$/,'')||'',codigo_ibge_cidade:farm.codigo_ibge_cidade||'',latitude:farm.latitude||'',longitude:farm.longitude||'',localizacao_origem:farm.localizacao_origem||'',endereco:farm.endereco||'',qtd_colares_prevista:farm.qtd_colares_prevista||'',qtd_colares_instalada:farm.qtd_colares_instalada||'',qtd_colares_entregue_cliente:farm.qtd_colares_entregue_cliente||'',motivo_colares_restantes:farm.motivo_colares_restantes||'',observacoes_colares:farm.observacoes_colares||'',status:farmStatus(farm),servico_inicio_em:dateTimeInput(farm.servico_inicio_em),servico_fim_em:dateTimeInput(farm.servico_fim_em),servico_responsavel:initialResponsible,servico_observacoes:farm.servico_observacoes||'',observacoes:farm.observacoes||'',created_at:farm.created_at||nowISO()});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const cityListId=`city-options-${form.id}`;
  const normalizeCity=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const applyFarmLocation=(lat,lng,origin='mapa')=>{const next=[Number(lat),Number(lng)];setForm(prev=>({...prev,latitude:next[0],longitude:next[1],localizacao_origem:origin}));setFocus(next);};
  useEffect(()=>{ let alive=true; fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(r=>r.json()).then(list=>alive&&setUfs(list)).catch(()=>{}); return()=>{alive=false}; },[]);
  useEffect(()=>{ if(!form.estado_uf){setCities([]);return;} let alive=true; setLoadingCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado_uf}/municipios?orderBy=nome`).then(r=>r.json()).then(list=>{if(alive)setCities(list)}).catch(()=>alive&&setCities([])).finally(()=>alive&&setLoadingCities(false)); return()=>{alive=false}; },[form.estado_uf]);
  async function chooseCity(code){
    if(!code){setForm(prev=>({...prev,codigo_ibge_cidade:'',cidade:'',localizacao_origem:''}));return;}
    const city=cities.find(c=>String(c.id)===String(code));
    setForm(prev=>({...prev,codigo_ibge_cidade:code,cidade:city?.nome||prev.cidade,localizacao_origem:'cidade'}));
    try{ const c=await fetchCityCentroid(code); if(c) applyFarmLocation(c[0],c[1],'cidade'); }catch{}
  }
  async function chooseCityByName(value){
    const city=cities.find(c=>normalizeCity(c.nome)===normalizeCity(value));
    setForm(prev=>({...prev,cidade:value,codigo_ibge_cidade:city?.id||'',localizacao_origem:city?'cidade':prev.localizacao_origem}));
    if(city){try{const c=await fetchCityCentroid(city.id); if(c) applyFarmLocation(c[0],c[1],'cidade');}catch{}}
  }
  function useGPS(){
    if(!navigator.geolocation){notify('GPS não disponível neste navegador.','error');return;}
    navigator.geolocation.getCurrentPosition(
      pos=>applyFarmLocation(pos.coords.latitude,pos.coords.longitude,'gps'),
      ()=>notify('Não foi possível obter GPS. No iPhone, verifique permissão e HTTPS.','error'),
      {enableHighAccuracy:true,timeout:12000}
    );
  }
  const submit=e=>{
    e.preventDefault();
    onSave({
      ...form,
      qtd_colares_prevista:num(form.qtd_colares_prevista),
      qtd_colares_instalada:num(form.qtd_colares_instalada),
      qtd_colares_entregue_cliente:num(form.qtd_colares_entregue_cliente),
      motivo_colares_restantes:form.motivo_colares_restantes,
      observacoes_colares:form.observacoes_colares,
      status:autoServiceStatus(farm.servico_inicio_em || toIsoOrNull(form.servico_inicio_em), farm.servico_fim_em || toIsoOrNull(form.servico_fim_em), form.status),
      latitude:form.latitude!==''&&form.latitude!==null?Number(form.latitude):null,
      longitude:form.longitude!==''&&form.longitude!==null?Number(form.longitude):null,
      servico_inicio_em:toIsoOrNull(form.servico_inicio_em),
      servico_fim_em:toIsoOrNull(form.servico_fim_em)
    });
  };
  const hasLocation=form.latitude!==''&&form.longitude!==''&&Number.isFinite(Number(form.latitude))&&Number.isFinite(Number(form.longitude));
  const locationText=hasLocation?`${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`:'Localização ainda não definida';
  const sourceText={gps:'GPS do aparelho',mapa:'Marcada no mapa',cidade:'Centro estimado da cidade'}[form.localizacao_origem]||'não definida';
  const mapFarm={...farm,...form,nome:form.nome||farm.nome||'Fazenda'};
  return <Modal title={farm.id?'Editar fazenda':'Nova fazenda'} onClose={onClose}><form className="form modern farmEditor" onSubmit={submit}>
    <div className="editorTabs farmEditorTabs"><button type="button" className={tab==='dados'?'active':''} onClick={()=>setTab('dados')}><ClipboardPenLine size={17}/> Dados</button><button type="button" className={tab==='localizacao'?'active':''} onClick={()=>setTab('localizacao')}><MapPinned size={17}/> Localização {hasLocation&&<Check size={15}/>}</button></div>
    {tab==='dados'&&<div className="editorPane farmDataPane">
      <Field label="Nome da fazenda *" icon={Building2}><input value={form.nome} onChange={e=>set('nome',e.target.value)} required placeholder="Ex: Fazenda Santa Maria"/></Field>
      <div className="grid2"><Field label="Central / empresa atendida" icon={ShieldCheck}><select value={form.central} onChange={e=>set('central',e.target.value)}><option value="">Selecione...</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Nome do regional" icon={User}><input value={form.regional_nome} onChange={e=>set('regional_nome',e.target.value)} placeholder="Ex: nome do regional"/></Field></div>
      <Field label="Veterinário / apoio em campo" icon={Stethoscope}><input value={form.veterinario_apoio} onChange={e=>set('veterinario_apoio',e.target.value)} placeholder="Nome do veterinário, se estiver junto"/></Field>
      <div className="grid2"><Field label="Responsável da fazenda" icon={User}><input value={form.responsavel} onChange={e=>set('responsavel',e.target.value)} placeholder="Nome"/></Field><Field label="Telefone" icon={Phone}><input value={form.telefone} onChange={e=>set('telefone',formatPhoneBR(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel"/></Field></div>
      <div className="grid2"><Field label="Estado" icon={MapPin}><select value={form.estado_uf} onChange={e=>{const uf=e.target.value; const st=ufs.find(u=>u.sigla===uf); setForm(prev=>({...prev,estado_uf:uf,estado_nome:st?.nome||UF_NAMES[uf]||'',cidade:'',codigo_ibge_cidade:'',latitude:'',longitude:'',localizacao_origem:''}));setFocus(STATE_CENTER[uf]||null);}}><option value="">Selecione o estado...</option>{ufs.map(u=><option key={u.id} value={u.sigla}>{u.nome} — {u.sigla}</option>)}</select></Field><Field label="Cidade" icon={MapPin}><div className="cityLookup"><input list={cityListId} value={form.cidade} onChange={e=>chooseCityByName(e.target.value)} disabled={!form.estado_uf||loadingCities} placeholder={!form.estado_uf?'Selecione o estado primeiro':loadingCities?'Carregando cidades...':'Digite para buscar a cidade'}/><Search size={16}/></div><datalist id={cityListId}>{cities.map(c=><option key={c.id} value={c.nome}/>)}</datalist></Field></div>
      <div className="farmLocationCompact"><div><span className="eyebrow">Localização</span><h3>{hasLocation?'Ponto da fazenda salvo':'Defina o ponto da fazenda'}</h3><p>{locationText}</p><small>Origem: {sourceText}</small></div><div className="locationCompactActions"><button type="button" className="btn light" onClick={useGPS}><Navigation size={17}/> GPS</button><button type="button" className="btn locationShortcut" onClick={()=>setTab('localizacao')}><MapPinned size={17}/>{hasLocation?'Ajustar no mapa':'Escolher no mapa'}</button></div></div>
      <div className="grid2"><Field label="Endereço"><input value={form.endereco} onChange={e=>set('endereco',e.target.value)} placeholder="Endereço ou referência"/></Field><Field label="Colares previstos" icon={Hash}><input type="number" min="0" value={form.qtd_colares_prevista} onChange={e=>set('qtd_colares_prevista',e.target.value)} placeholder="0"/></Field></div>
      <Field label="Observações"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Informações importantes da fazenda"/></Field>
    </div>}
    {tab==='localizacao'&&<div className="editorPane locationPane farmLocationPane">
      <SearchMapControl onSelect={(lat,lng,label)=>{applyFarmLocation(lat,lng,'mapa');if(label&&!form.endereco)set('endereco',label)}} placeholder="Pesquisar cidade, fazenda, estrada ou endereço..."/>
      <div className="locationActions"><button type="button" className="btn light" onClick={useGPS}><Navigation size={17}/> Usar GPS atual</button>{hasLocation&&<span className="coordinateBadge"><LocateFixed size={15}/>{locationText}</span>}</div>
      <div className="editorMap farmLocationMap"><FarmLocationPicker farm={mapFarm} lat={form.latitude} lng={form.longitude} focus={focus} onPick={(lat,lng)=>applyFarmLocation(lat,lng,'mapa')}/></div>
    </div>}
    <div className="stickyFormActions"><button type="button" className="btn light" onClick={onClose}>Cancelar</button><button className="btn primary"><Save size={18}/> Salvar fazenda</button></div>
  </form></Modal>}

function serviceResponsibleOptions(data={}, farm={}, currentUserName=''){
  const base = [
    currentUserName && {value:currentUserName,label:currentUserName,detail:'Usuário atual'},
    farm.servico_responsavel && {value:farm.servico_responsavel,label:farm.servico_responsavel,detail:'Atual salvo'}
  ].filter(Boolean);
  const members = (data.fazendaMembros||[])
    .filter(m=>m.fazenda_id===farm.id)
    .map(m=>({value:personName(m.profiles)||m.profiles?.email||m.user_id,label:personName(m.profiles)||m.profiles?.email||'Usuário autorizado',detail:m.profiles?.email||'Acesso liberado'}))
    .filter(p=>p.value);
  return [...base,...members].reduce((list,item)=>list.some(x=>x.value.toLowerCase()===item.value.toLowerCase())?list:[...list,item],[]);
}

function ResponsibleServiceField({value,onChange,options=[]}){
  const [manual,setManual]=useState(false);
  const hasKnown = options.some(opt=>opt.value.toLowerCase()===String(value||'').toLowerCase());
  const isManual = manual || Boolean(value && !hasKnown);
  const choose=value=>{setManual(false);onChange(value);};
  return <Field label="Responsável técnico / equipe" icon={UserCheck}>
    <div className="responsiblePicker compactResponsiblePicker">
      {options.map(opt=><button type="button" key={opt.value} className={value===opt.value&&!isManual?'active':''} onClick={()=>choose(opt.value)}><span><UserCheck size={17}/></span><b>{opt.label}</b><small>{opt.detail}</small></button>)}
      <button type="button" className={isManual?'active manual':'manual'} onClick={()=>{setManual(true);if(hasKnown)onChange('')}}><span><Pencil size={17}/></span><b>Outro nome</b><small>equipe/parceiro</small></button>
    </div>
    {isManual&&<input className="responsibleManualInput" value={value} onChange={e=>onChange(e.target.value)} placeholder="Digite um nome padronizado"/>}
  </Field>
}

function ServiceModal({farm,data,mode='adjust',pendingEquips=[],onClose,onSave}){
  const finishing = mode === 'finish';
  const currentUserName=personName(data.currentUser);
  const options=serviceResponsibleOptions(data,farm,currentUserName);
  const nowLocal=dateTimeInput(nowISO());
  const defaultStart=dateTimeInput(farm.servico_inicio_em)||(finishing?nowLocal:'');
  const defaultEnd=finishing ? (dateTimeInput(farm.servico_fim_em)||nowLocal) : dateTimeInput(farm.servico_fim_em);
  const [advanced,setAdvanced]=useState(false);
  const [form,setForm]=useState({
    servico_inicio_em:defaultStart,
    servico_fim_em:defaultEnd,
    servico_responsavel:farm.servico_responsavel||currentUserName||farm.regional_nome||farm.responsavel||'',
    servico_observacoes:farm.servico_observacoes||'',
    qtd_colares_instalada:farm.qtd_colares_instalada||'',
    qtd_colares_entregue_cliente:farm.qtd_colares_entregue_cliente||'',
    motivo_colares_restantes:farm.motivo_colares_restantes||'',
    observacoes_colares:farm.observacoes_colares||'',
    status:finishing ? FARM_STATUS_DONE : autoServiceStatus(farm.servico_inicio_em, farm.servico_fim_em, farm.status)
  });
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const planned=num(farm.qtd_colares_prevista);
  const installed=num(form.qtd_colares_instalada);
  const delivered=num(form.qtd_colares_entregue_cliente);
  const handled=installed+delivered;
  const remaining=planned?Math.max(planned-handled,0):0;
  const handledProgress=planned?Math.min(100,Math.round((handled/planned)*100)):0;
  const clearService=()=>setForm(prev=>({
    ...prev,
    servico_inicio_em:'',
    servico_fim_em:'',
    servico_observacoes:'',
    qtd_colares_instalada:'',
    qtd_colares_entregue_cliente:'',
    motivo_colares_restantes:'',
    observacoes_colares:'',
    status:'Não iniciada'
  }));
  const submit=e=>{
    e.preventDefault();
    const startIso=toIsoOrNull(form.servico_inicio_em);
    const endIso=toIsoOrNull(form.servico_fim_em);
    const derivedStatus=advanced ? normalizeFarmStatus(form.status) : autoServiceStatus(startIso, endIso, farm.status);
    onSave({
      servico_inicio_em:startIso,
      servico_fim_em:endIso,
      servico_responsavel:form.servico_responsavel,
      servico_observacoes:form.servico_observacoes,
      qtd_colares_instalada:installed,
      qtd_colares_entregue_cliente:delivered,
      motivo_colares_restantes:form.motivo_colares_restantes,
      observacoes_colares:form.observacoes_colares,
      status:finishing ? FARM_STATUS_DONE : derivedStatus
    });
  };
  return <Modal title={finishing?'Finalizar serviço':'Ajustar serviço'} onClose={onClose}>
    <form className="form modern serviceModalForm" onSubmit={submit}>
      <section className={`serviceModalHero ${finishing?'finish':''}`}>
        <div className="serviceModalIcon">{finishing?<CheckCircle2 size={22}/>:<Clock size={22}/>}</div>
        <div><span className="eyebrow">Produtividade</span><h3>{finishing?'Fechamento do serviço':'Controle do serviço'}</h3><p>{finishing?'Revise os dados principais antes de encerrar a fazenda.':'Use para corrigir início, fim, técnico ou observações quando necessário.'}</p></div>
      </section>
      <div className="grid2">
        <Field label="Início do serviço" icon={PlayCircle}><input type="datetime-local" value={form.servico_inicio_em} onChange={e=>set('servico_inicio_em',e.target.value)} required={finishing}/></Field>
        <Field label="Fim do serviço" icon={CheckCircle2}><input type="datetime-local" value={form.servico_fim_em} onChange={e=>set('servico_fim_em',e.target.value)} required={finishing}/></Field>
      </div>
      {!finishing&&<button type="button" className="serviceResetButton" onClick={clearService}><X size={17}/> Limpar serviço iniciado por engano</button>}
      <div className="serviceCloseGrid">
        <Field label="Colares instalados em animais" icon={Hash}><input type="number" min="0" value={form.qtd_colares_instalada} onChange={e=>set('qtd_colares_instalada',e.target.value)} placeholder="0"/></Field>
        <Field label="Entregues ao cliente / reserva" icon={BadgeCheck}><input type="number" min="0" value={form.qtd_colares_entregue_cliente} onChange={e=>set('qtd_colares_entregue_cliente',e.target.value)} placeholder="0"/></Field>
        <article className={remaining>0?'serviceCollarPreview pending':'serviceCollarPreview'}>
          <Hash size={18}/>
          <div><b>{planned?`${handled} / ${planned}`:`${handled}`}</b><span>{planned?`${remaining} restante(s) • ${handledProgress}% atendido`:'sem meta prevista'}</span></div>
        </article>
      </div>
      {remaining>0&&<div className="grid2 collarReasonGrid"><Field label="Motivo dos colares restantes" icon={AlertTriangle}><select value={form.motivo_colares_restantes} onChange={e=>set('motivo_colares_restantes',e.target.value)}><option value="">Selecione...</option>{COLLAR_REASONS.map(reason=><option key={reason}>{reason}</option>)}</select></Field><Field label="Observação dos colares" icon={Info}><input value={form.observacoes_colares} onChange={e=>set('observacoes_colares',e.target.value)} placeholder="Ex.: 10 ficaram com o cliente, retorno combinado..."/></Field></div>}
      <ResponsibleServiceField value={form.servico_responsavel} onChange={v=>set('servico_responsavel',v)} options={options}/>
      <Field label={finishing?'Informações importantes do fechamento':'Observações do serviço'} icon={Info}><textarea value={form.servico_observacoes} onChange={e=>set('servico_observacoes',e.target.value)} placeholder="Ex.: colares instalados, ajuste de equipamento, pendência combinada, motivo de atraso..."/></Field>
      {finishing&&pendingEquips.length>0&&<div className="servicePendingAlert"><AlertTriangle size={20}/><div><b>{pendingEquips.length} equipamento(s) ainda pendente(s)</b><span>{pendingEquips.slice(0,3).map(e=>e.apelido||e.local_nome||e.tipo).join(', ')}{pendingEquips.length>3?'...':''}</span></div></div>}
      <details className="advancedServiceStatus" open={advanced} onToggle={e=>setAdvanced(e.currentTarget.open)}>
        <summary><BadgeCheck size={16}/> Ajuste avançado de status</summary>
        <Field label="Status manual"><select value={form.status} onChange={e=>set('status',e.target.value)}>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field>
      </details>
      <div className="stickyFormActions"><button type="button" className="btn light" onClick={onClose}>Cancelar</button><button className="btn primary"><Save size={18}/> {finishing?'Finalizar serviço':'Salvar ajuste'}</button></div>
    </form>
  </Modal>
}

function FazendaDetalhe({farm,data,onBack}){
  const [tab,setTab]=useState('resumo'),[edit,setEdit]=useState(false),[equipModal,setEquipModal]=useState(null),[visitModal,setVisitModal]=useState(false),[serviceModal,setServiceModal]=useState(null);
  const access=farmAccess(farm,data);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id), visits=data.visitas.filter(v=>v.fazenda_id===farm.id), checks=data.checklists.filter(c=>c.fazenda_id===farm.id), diags=data.diagnosticos.filter(d=>d.fazenda_id===farm.id), evidencias=(data.evidencias||[]).filter(e=>e.fazenda_id===farm.id);
  const tabs=[['resumo','Resumo',Building2],['checklists','Checklists',ClipboardCheck],['equipamentos','Equipamentos',Cpu],['mapa','Mapa técnico',MapIcon],['visitas','Visitas',CalendarDays],['evidencias','Evidências',ImageIcon],['relatorio','Relatório',FileText],access.canEdit&&['restrito','Restrito',ShieldCheck],access.canManageAccess&&['acessos','Acessos',UserCheck]].filter(Boolean);
  const serviceActive=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), serviceDone=Boolean(farm.servico_inicio_em&&farm.servico_fim_em), compactHero=tab!=='resumo';
  const currentResponsible=personName(data.currentUser);
  const openVisit=visits.find(isOpenVisit);
  const openVisitModal=()=>{if(openVisit)notify(`Já existe uma visita aberta desde ${brDate(openVisit.data_visita)}. Você pode continuar nela ou registrar uma nova visita.`,'warning');setVisitModal(true);};
  const openEquipmentFromMap=equip=>{if(!access.canEdit)return;setTab('equipamentos');setEquipModal(equip);};
  const saveVisitFromDetail=async(row)=>{const clean={...row,status:row.status || (row.iniciada_em&&!row.finalizada_em?VISIT_STATUS_OPEN:visitHasPending(row)?VISIT_STATUS_PENDING:VISIT_STATUS_DONE),updated_at:nowISO()};const result=await data.saveVisita(clean);if(result.ok)setVisitModal(false);return result;};
  const startService=async()=>{
    if(!access.canEdit)return;
    const startedAt=farm.servico_inicio_em||nowISO();
    const result=await data.saveFazenda({...farm,servico_inicio_em:startedAt,servico_fim_em:null,servico_responsavel:farm.servico_responsavel||currentResponsible||farm.regional_nome||farm.responsavel||'',status:'Em andamento'});
    if(!result.ok)return;
    if(!openVisit){
      await data.saveVisita({id:uid(),fazenda_id:farm.id,tipo:'Instalação',data_visita:todayInput(),resumo:'Serviço iniciado em campo.',status:VISIT_STATUS_OPEN,iniciada_em:startedAt,created_at:startedAt,updated_at:startedAt});
      notify('Serviço iniciado e visita aberta.');
      return;
    }
    notify(`Serviço iniciado. Visita aberta mantida: ${brDate(openVisit.data_visita)}.`);
  };
  const finishService=()=>{if(access.canEdit)setServiceModal('finish');};
  const saveService=async(payload)=>{
    if(!access.canEdit)return {ok:false};
    const finishing=serviceModal==='finish';
    const endedAt=finishing ? (payload.servico_fim_em || nowISO()) : payload.servico_fim_em;
    const startedAt=finishing ? (payload.servico_inicio_em || farm.servico_inicio_em || endedAt) : payload.servico_inicio_em;
    const status=finishing ? FARM_STATUS_DONE : normalizeFarmStatus(payload.status || autoServiceStatus(startedAt, endedAt, farm.status));
    const result=await data.saveFazenda({
      ...farm,
      servico_inicio_em:startedAt,
      servico_fim_em:endedAt,
      servico_responsavel:payload.servico_responsavel,
      servico_observacoes:payload.servico_observacoes,
      qtd_colares_instalada:num(payload.qtd_colares_instalada),
      qtd_colares_entregue_cliente:num(payload.qtd_colares_entregue_cliente),
      motivo_colares_restantes:payload.motivo_colares_restantes || '',
      observacoes_colares:payload.observacoes_colares || '',
      status
    });
    if(!result.ok)return result;
    if(finishing&&openVisit)await data.saveVisita(closeVisitPayload({...openVisit,finalizada_em:endedAt}));
    setServiceModal(null);
    notify(finishing?(openVisit&&visitHasPending(openVisit)?'Serviço finalizado com pendência registrada na visita.':'Serviço finalizado e visita encerrada.'):'Ajuste do serviço salvo.');
    return result;
  };
  return <div className="farmDetail">
    <button className="back" onClick={onBack}><ChevronLeft size={18}/> Voltar para fazendas</button>
    <section className={`farmHero ${compactHero?'compactHero':''}`}>
      <div>
        {!compactHero&&<span className="eyebrow">Dossiê técnico</span>}
        <h1><span className="farmTitleIcon"><Warehouse size={19}/></span><span>{farm.nome}</span></h1>
        {!compactHero&&<div className="farmHeroMeta"><span><MapPin size={16}/>{farm.cidade||'Cidade não informada'}</span><span><Building2 size={16}/>{farm.central||'Central não informada'}</span><span><User size={16}/>{farm.regional_nome||farm.responsavel||'Regional não informado'}</span></div>}
        {!compactHero&&<AccessBadge access={access}/>}
      </div>
      {tab==='resumo'&&<div className="farmHeroIconActions">
        {access.canEdit&&<button type="button" aria-label="Editar fazenda" title="Editar fazenda" onClick={()=>setEdit(true)}><Pencil size={18}/></button>}
        {farm.latitude&&farm.longitude?<button type="button" aria-label="Abrir rota" title="Abrir rota" onClick={()=>openMaps(farm.latitude,farm.longitude)}><Navigation size={18}/></button>:<button type="button" aria-label="Abrir mapa" title="Abrir mapa" onClick={()=>setTab('mapa')}><MapPinned size={18}/></button>}
      </div>}
    </section>
    {!access.canEdit&&<PermissionNotice/>}
    <div className="tabs farmTabs">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={tab===id?'active':''}><Icon size={17}/>{label}</button>)}</div>
    {tab==='resumo'&&<FarmExecutiveSummary farm={farm} visits={visits} checks={checks} diags={diags} equips={equips} evidencias={evidencias} canEdit={access.canEdit} onStart={startService} onFinish={finishService} onEdit={()=>setEdit(true)} onAdjustService={()=>setServiceModal('adjust')} onNewVisit={openVisitModal} onOpenMap={()=>setTab('mapa')}/>}
    {tab==='checklists'&&<ChecklistsFazenda farm={farm} data={data} canEdit={access.canEdit}/>} {tab==='equipamentos'&&<EquipamentosFazenda farm={farm} data={data} canEdit={access.canEdit} openNew={()=>setEquipModal({})}/>} {tab==='mapa'&&<MapaFazenda farm={farm} data={data} canEdit={access.canEdit} onEditEquip={openEquipmentFromMap}/>} {tab==='visitas'&&<VisitasFazenda farm={farm} data={data} canEdit={access.canEdit} openNew={openVisitModal}/>} {tab==='evidencias'&&<EvidenciasFazenda farm={farm} data={data} canEdit={access.canEdit}/>} {tab==='relatorio'&&<RelatorioFazenda farm={farm} data={data}/>} {tab==='restrito'&&access.canEdit&&<DadosRestritosFazenda farm={farm} data={data}/>} {tab==='acessos'&&<AcessosFazenda farm={farm} data={data} access={access}/>}
    <FarmBottomNav farm={farm} tabs={tabs} tab={tab} setTab={setTab} onBack={onBack} access={access} serviceActive={serviceActive} serviceDone={serviceDone} onStart={startService} onFinish={finishService} onEdit={()=>setEdit(true)} onNewVisit={openVisitModal}/>
    {edit&&access.canEdit&&<FazendaModal farm={farm} data={data} onClose={()=>setEdit(false)} onSave={async(r)=>{const result=await data.saveFazenda(r);if(result.ok)setEdit(false)}}/>}{serviceModal&&access.canEdit&&<ServiceModal farm={farm} data={data} mode={serviceModal} pendingEquips={equips.filter(isEquipmentPendingInstall)} onClose={()=>setServiceModal(null)} onSave={saveService}/>} {equipModal&&access.canEdit&&<EquipModal farm={farm} data={data} equip={equipModal} onClose={()=>setEquipModal(null)} onSave={async(r)=>{const result=await data.saveEquipamento(r);if(result.ok)setEquipModal(null)}}/>}{visitModal&&access.canEdit&&<VisitModal farm={farm} onClose={()=>setVisitModal(false)} onSave={saveVisitFromDetail}/>}
  </div>
}
function ServiceControl({farm,canEdit,onStart,onFinish,onEdit}){const active=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), done=Boolean(farm.servico_inicio_em&&farm.servico_fim_em); const status=farmStatus(farm); return <div className={`serviceControl ${active?'active':done?'done':''}`}><div className="serviceLead"><span className="eyebrow">Produtividade</span><h2><Clock size={20}/> Serviço da fazenda</h2></div><div className="serviceFacts"><div><span>Situação</span><b>{status}</b></div><div><span>Início</span><b>{brDateTime(farm.servico_inicio_em)}</b></div><div><span>Fim</span><b>{brDateTime(farm.servico_fim_em)}</b></div><div><span>Duração</span><b>{serviceDurationLabel(farm)}</b></div></div><div className="serviceActions">{canEdit&&!farm.servico_inicio_em&&<button className="btn primary" onClick={onStart}><PlayCircle size={17}/> Iniciar serviço</button>}{canEdit&&active&&<button className="btn primary" onClick={onFinish}><CheckCircle2 size={17}/> Finalizar serviço</button>}{canEdit&&<button className="btn light" onClick={onEdit}><Pencil size={17}/> Ajustar datas</button>}</div>{farm.servico_observacoes&&<p className="serviceNote">{farm.servico_observacoes}</p>}</div>}
function DadosRestritosFazenda({farm,data}){
  const existing=(data.dadosRestritos||[]).find(item=>item.fazenda_id===farm.id)||{};
  const [showSecret,setShowSecret]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({
    sistema:existing.sistema||'Nedap',
    usuario_service:existing.usuario_service||'',
    senha_service:existing.senha_service||'',
    numero_licenca:existing.numero_licenca||'',
    observacoes_restritas:existing.observacoes_restritas||''
  });
  useEffect(()=>setForm({sistema:existing.sistema||'Nedap',usuario_service:existing.usuario_service||'',senha_service:existing.senha_service||'',numero_licenca:existing.numero_licenca||'',observacoes_restritas:existing.observacoes_restritas||''}),[existing.id,farm.id]);
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const copyValue=async(label,value)=>{if(!value){notify(`${label} vazio.`, 'warning');return;}try{await navigator.clipboard.writeText(value);notify(`${label} copiado.`);}catch{notify('Não foi possível copiar automaticamente.','error');}};
  const save=async(e)=>{e.preventDefault();setSaving(true);await data.saveDadosRestritos({...existing,...form,fazenda_id:farm.id});setSaving(false);};
  return <section className="panel restrictedDataPanel">
    <div className="restrictedHero">
      <div className="restrictedHeroIcon"><ShieldCheck size={24}/></div>
      <div><span className="eyebrow">Acesso restrito</span><h2>Dados internos</h2><p>Licenças, usuário de serviço e senhas ficam fora dos relatórios e ocultos para visualizadores.</p></div>
    </div>
    <form className="restrictedForm" onSubmit={save}>
      <div className="grid2"><Field label="Sistema"><input value={form.sistema} onChange={e=>set('sistema',e.target.value)} placeholder="Nedap, CowControl, rede local..."/></Field><Field label="Número da licença"><div className="secretInput"><input value={form.numero_licenca} onChange={e=>set('numero_licenca',e.target.value)} placeholder="Chave ou licença"/><button type="button" onClick={()=>copyValue('Licença',form.numero_licenca)}><Copy size={16}/></button></div></Field></div>
      <div className="grid2"><Field label="Usuário service"><div className="secretInput"><input value={form.usuario_service} onChange={e=>set('usuario_service',e.target.value)} placeholder="Usuário de serviço"/><button type="button" onClick={()=>copyValue('Usuário',form.usuario_service)}><Copy size={16}/></button></div></Field><Field label="Senha service"><div className="secretInput"><input type={showSecret?'text':'password'} value={form.senha_service} onChange={e=>set('senha_service',e.target.value)} placeholder="Senha"/><button type="button" onClick={()=>setShowSecret(v=>!v)}><Eye size={16}/></button><button type="button" onClick={()=>copyValue('Senha',form.senha_service)}><Copy size={16}/></button></div></Field></div>
      <Field label="Observações restritas"><textarea value={form.observacoes_restritas} onChange={e=>set('observacoes_restritas',e.target.value)} placeholder="Configurações Nedap, acessos, IPs, contatos internos ou qualquer dado que não deve aparecer para visualizadores."/></Field>
      <div className="restrictedActions"><button className="btn primary" disabled={saving}><Save size={18}/> {saving?'Salvando...':'Salvar dados restritos'}</button>{existing.updated_at&&<small>Última atualização: {brDateTime(existing.updated_at)}</small>}</div>
    </form>
  </section>
}
function AcessosFazenda({farm,data,access}){
  const [email,setEmail]=useState(''),[role,setRole]=useState('viewer'),[busy,setBusy]=useState(false);
  const members=data.fazendaMembros.filter(m=>m.fazenda_id===farm.id);
  const roles=[['viewer','Visualizador','Consulta dados, mapa, visitas e relatórios sem alterar informações.'],['admin','Administrador','Pode editar fazenda, equipamentos, visitas, checklists e relatórios.']];
  const add=async(e)=>{e.preventDefault();setBusy(true);const r=await data.shareFarm(farm,email,role);if(r.ok)setEmail('');setBusy(false)};
  if(!access.canManageAccess)return <section className="panel"><PermissionNotice/></section>;
  return <section className="panel accessPanel"><div className="sectionTitle"><div><h2><UserCheck size={20}/> Acessos da fazenda</h2></div></div><form className="accessInvitePanel" onSubmit={add}><div className="accessInviteTop"><Field label="E-mail da pessoa"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.com" required/></Field><button className="btn primary" disabled={busy}><UserCheck size={17}/> {busy?'Liberando...':'Liberar acesso'}</button></div><div className="accessRoleCards">{roles.map(([value,label,desc])=><button type="button" key={value} className={role===value?'active':''} onClick={()=>setRole(value)}><span>{value==='admin'?<ShieldCheck size={18}/>:<UserCheck size={18}/>}</span><b>{label}</b><small>{desc}</small></button>)}</div></form><div className="accessPeopleGrid"><article className="accessPersonCard owner"><ShieldCheck size={22}/><div><b>Proprietário</b><span>Controle total da fazenda e dos acessos liberados.</span></div><AccessBadge access={{role:'owner',label:'Proprietário'}}/></article>{members.map(m=><article className="accessPersonCard" key={m.id}><UserCheck size={22}/><div><b>{m.profiles?.nome||m.profiles?.email||'Usuário autorizado'}</b><span>{m.profiles?.email||m.user_id}</span></div><div className="accessPersonActions"><select value={m.role} onChange={e=>data.updateFarmMember(m,e.target.value)}><option value="viewer">Visualizador</option><option value="admin">Administrador</option></select><button className="iconBtn danger" title="Remover acesso" onClick={()=>data.removeFarmMember(m.id)}><Trash2 size={16}/></button></div></article>)}</div>{!members.length&&<Empty icon={UserCheck} title="Nenhum acesso liberado" text="Adicione o e-mail de uma pessoa que já tenha conta no app."/>}</section>
}
function InfoCard({title,rows}){return <div className="infoCard"><h3>{title}</h3>{rows.map(([a,b])=><div className="infoRow" key={a}><span>{a}</span><b>{b||'-'}</b></div>)}</div>}
function FarmExecutiveSummary({farm,visits,checks,diags,equips,evidencias=[],canEdit,onStart,onFinish,onEdit,onAdjustService,onNewVisit,onOpenMap}){
  const predicted=num(farm.qtd_colares_prevista), installed=collarInstalled(farm), delivered=collarDelivered(farm), handled=collarHandled(farm);
  const progress=collarProgress(farm);
  const status=farmStatus(farm), active=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), done=Boolean(farm.servico_inicio_em&&farm.servico_fim_em);
  const hasLocation=farm.latitude&&farm.longitude, mapped=equips.filter(e=>e.latitude&&e.longitude).length, pendingVisits=visits.filter(v=>v.pendencias).length;
  const remaining=collarRemaining(farm);
  const cityUf=`${farm.cidade||''}${getFarmUF(farm)?` / ${getFarmUF(farm)}`:''}`.trim();
  const serviceState=done?'Encerrado':active?'Em andamento':'Não iniciada';
  const serviceHint=done?serviceDurationLabel(farm):active?`Início ${brDateTime(farm.servico_inicio_em)}`:'Aguardando início';
  const alerts=[
    !hasLocation&&['Fazenda sem GPS definido',MapPinned],
    equips.length>mapped&&[`${equips.length-mapped} equipamento(s) sem GPS`,Cpu],
    collarHasPending(farm)&&[`${remaining} colar(es) sem resolução`,Hash],
    pendingVisits>0&&[`${pendingVisits} visita(s) com pendência`,AlertTriangle]
  ].filter(Boolean);
  const fullDetails=[
    farm.central&&['Central',farm.central,Building2],
    farm.regional_nome&&['Regional',farm.regional_nome,ShieldCheck],
    farm.veterinario_apoio&&['Veterinário / apoio',farm.veterinario_apoio,Stethoscope],
    farm.responsavel&&['Responsável',farm.responsavel,User],
    farm.telefone&&['Telefone',farm.telefone,Phone],
    cityUf&&['Cidade',cityUf,MapPin],
    farm.endereco&&['Endereço',farm.endereco,Navigation],
    ['Status',status,BadgeCheck],
    farm.servico_inicio_em&&['Início do serviço',brDateTime(farm.servico_inicio_em),Clock],
    farm.servico_fim_em&&['Fim do serviço',brDateTime(farm.servico_fim_em),CheckCircle2],
    farm.servico_responsavel&&['Responsável técnico',farm.servico_responsavel,User],
    delivered>0&&['Colares entregues ao cliente',delivered,BadgeCheck],
    farm.motivo_colares_restantes&&['Motivo dos colares restantes',farm.motivo_colares_restantes,AlertTriangle],
    farm.observacoes_colares&&['Observação dos colares',farm.observacoes_colares,Info],
    canEdit&&farm.observacoes&&['Observações internas',farm.observacoes,Info],
    canEdit&&farm.servico_observacoes&&['Observações do serviço',farm.servico_observacoes,Info]
  ].filter(Boolean);
  const serviceAction=!farm.servico_inicio_em?['Iniciar',PlayCircle,onStart]:active?['Finalizar',CheckCircle2,onFinish]:null;
  const serviceAdjustButton=canEdit&&farm.servico_inicio_em?<button type="button" className="iconBtn serviceMiniAdjust" aria-label="Ajustar serviço" title="Ajustar serviço" onClick={onAdjustService}><Clock size={17}/></button>:null;
  return <section className="panel executiveSummaryPanel compactExecutiveSummary">
    <div className="execSummaryHead">
      <div><span className="eyebrow">Resumo</span><h2><Gauge size={22}/> Operação</h2></div>
      <span className={`miniStatusPill ${done?'done':active?'active':''}`}>{status}</span>
    </div>
    <div className={`serviceMiniBar ${done?'done':active?'active':''}`}>
      <div className="serviceMiniIcon">{done?<CheckCircle2 size={20}/>:active?<Clock size={20}/>:<PlayCircle size={20}/>}</div>
      <div className="serviceMiniText"><span>Serviço</span><div className="serviceMiniTitleLine"><b>{serviceState}</b>{serviceAdjustButton}</div><small>{serviceHint}</small></div>
      <div className="serviceMiniActions">
        {canEdit&&serviceAction&&<button type="button" className="btn primary serviceMiniPrimary" onClick={serviceAction[2]}>{React.createElement(serviceAction[1],{size:17})}<span>{serviceAction[0]}</span></button>}
      </div>
    </div>
    <div className="execCards execCompactCards">
      <article className="execCard execProgressCard"><div className="execCardIcon"><Hash size={19}/></div><span>Colares</span><b>{handled} / {predicted||'-'}</b><div className="execProgress"><i style={{width:`${progress}%`}}/></div><small>{delivered?`${installed} instalados • ${delivered} entregues`:`${progress}% concluído`}</small></article>
      <article className="execCard execMapCard"><div className="execCardIcon"><MapPinned size={19}/></div><span>Mapa</span><b>{mapped} / {equips.length}</b><small>equipamentos com GPS</small></article>
      <article className="execCard execTimeCard"><div className="execCardIcon"><Clock size={19}/></div><span>Tempo</span><b>{serviceDurationLabel(farm)}</b><small>{farm.servico_inicio_em?`Início ${brDateTime(farm.servico_inicio_em)}`:'sem início'}</small></article>
    </div>
    {alerts.length>0&&<div className="execAlerts">{alerts.map(([text,Icon])=><span key={text}><Icon size={15}/>{text}</span>)}</div>}
    <details className="farmFullDetails compactFarmDetails"><summary><span>Dados da fazenda</span><b>{fullDetails.length}</b></summary><div className="farmFullGrid">{fullDetails.map(([label,value,Icon])=><article key={label}><span><Icon size={15}/>{label}</span><b>{value}</b></article>)}<article><span><CalendarDays size={15}/>Última visita</span><b>{visits[0]?brDate(visits[0].data_visita):'Sem visita'}</b></article><article><span><ClipboardCheck size={15}/>Checklists</span><b>{checks.length}</b></article><article><span><Stethoscope size={15}/>Diagnósticos</span><b>{diags.length}</b></article><article><span><ImageIcon size={15}/>Evidências</span><b>{evidencias.length}</b></article></div></details>
  </section>
}

function ChecklistsFazenda({farm,data,canEdit=true}){
  const [template,setTemplate]=useState(QUICK_CHECKLISTS[0].id),[values,setValues]=useState({}),[obs,setObs]=useState(''),[editing,setEditing]=useState(null),[viewing,setViewing]=useState(null);
  const saved=useMemo(()=>data.checklists.filter(c=>c.fazenda_id===farm.id).sort((a,b)=>new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0)),[data.checklists,farm.id]);
  const latestForTemplate=id=>saved.find(c=>c.tipo===id);
  const hydrateChecklist=(item)=>{
    const itemTpl=QUICK_CHECKLISTS.find(t=>t.id===item.tipo)||QUICK_CHECKLISTS[0];
    setEditing(item);
    setTemplate(itemTpl.id);
    setObs(item.observacoes||'');
    const next={};
    (item.itens_json||[]).forEach((row,i)=>{next[i]=Boolean(row.ok)});
    setValues(next);
  };
  const startBlank=id=>{setTemplate(id);setValues({});setObs('');setEditing(null)};
  useEffect(()=>{
    const first=saved[0];
    if(first) hydrateChecklist(first);
    else startBlank(QUICK_CHECKLISTS[0].id);
  },[farm.id,data.checklists.length]);
  const tpl=QUICK_CHECKLISTS.find(t=>t.id===template)||QUICK_CHECKLISTS[0];
  const done=tpl.items.filter((_,i)=>values[i]).length;
  const pct=tpl.items.length?Math.round(done/tpl.items.length*100):0;
  const toggle=i=>canEdit&&setValues({...values,[i]:!values[i]});
  const reset=()=>startBlank(template);
  const chooseTemplate=id=>{
    const existing=latestForTemplate(id);
    if(existing) hydrateChecklist(existing);
    else startBlank(id);
  };
  const markAll=()=>canEdit&&setValues(Object.fromEntries(tpl.items.map((_,i)=>[i,true])));
  const clearAll=()=>canEdit&&setValues({});
  const save=async()=>{
    if(!canEdit){notify('Voce esta como visualizador nesta fazenda.','warning');return;}
    const items=tpl.items.map((label,i)=>({label,ok:Boolean(values[i])}));
    const row={id:editing?.id||uid(),fazenda_id:farm.id,tipo:tpl.id,titulo:tpl.title,itens_json:items,status:items.every(i=>i.ok)?'Completo':'Parcial',observacoes:obs,created_at:editing?.created_at||nowISO(),updated_at:nowISO()};
    const result=await data.saveChecklist(row);
    if(result.ok){setEditing(row);notify(editing?'Checklist atualizado.':'Checklist salvo.');}
  };
  return <section className="panel checklistPanel"><div className="sectionTitle"><div><h2><ClipboardCheck size={21}/> Checklist da fazenda</h2><p className="sectionHint editingHint">{editing?`Checklist salvo carregado: ${brDate(editing.updated_at||editing.created_at)}.`:'Checklist opcional. Salve apenas quando fizer sentido para esta fazenda.'}</p></div><div className="checkCounter"><b>{done}/{tpl.items.length}</b><span>itens concluídos</span></div></div>{!canEdit&&<PermissionNotice/>}<div className="checkTemplateRail">{QUICK_CHECKLISTS.map(t=>{const existing=latestForTemplate(t.id);const items=existing?.itens_json||[];const ok=items.filter(i=>i.ok).length;return <button type="button" key={t.id} className={`${template===t.id?'active ':''}${existing?'saved':''}`} onClick={()=>chooseTemplate(t.id)}><ClipboardList size={18}/><span><b>{t.title}</b><small>{existing?`${ok}/${items.length||t.items.length} salvo`:`${t.items.length} itens`}</small></span></button>})}</div><div className="checkProgressHero"><div><span>{tpl.source}</span><b>{pct}% concluído</b></div><div className="progress"><span style={{width:pct+'%'}}/></div><div className="checkProgressActions"><button className="btn light" disabled={!canEdit} onClick={markAll}>Marcar tudo</button><button className="btn light" disabled={!canEdit} onClick={clearAll}>Limpar</button></div></div><div className="checkGrid">{tpl.items.map((item,i)=><button type="button" className={values[i]?'checkCard done':'checkCard'} disabled={!canEdit} key={item} onClick={()=>toggle(i)}><span className="checkBoxVisual">{values[i]?<Check size={16}/>:i+1}</span><b>{item}</b></button>)}</div><textarea className="checkNotes" disabled={!canEdit} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações do checklist"/><div className="buttonRow"><button className="btn primary" disabled={!canEdit} onClick={save}><Save size={17}/> {editing?'Atualizar checklist':'Salvar checklist'}</button></div><div className="checkHistoryHead"><h3>Registros salvos</h3><span>{saved.length} registro(s)</span></div><div className="checkHistoryGrid">{saved.map(c=>{const items=c.itens_json||[];const ok=items.filter(i=>i.ok).length;return <article className={editing?.id===c.id?'checkHistoryCard active':'checkHistoryCard'} key={c.id}><div><ClipboardCheck size={18}/><span>{c.status}</span></div><b>{c.titulo}</b><small>{brDate(c.updated_at||c.created_at)} - {ok}/{items.length||0} itens</small>{c.observacoes&&<p>{c.observacoes}</p>}<footer><button className="btn light" onClick={()=>setViewing(c)}><Info size={16}/> Visualizar</button>{canEdit&&<button className="iconBtn" title="Editar" onClick={()=>hydrateChecklist(c)}><Pencil size={16}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir" onClick={async()=>{const result=await data.delChecklist(c.id);if(result.ok&&editing?.id===c.id)reset();}}><Trash2 size={16}/></button>}</footer></article>})}</div>{!saved.length&&<Empty icon={ClipboardCheck} title="Nenhum checklist salvo" text="Checklist não é obrigatório. Registre apenas quando precisar documentar conferências da fazenda."/>}{viewing&&<Modal title={viewing.titulo} onClose={()=>setViewing(null)}><div className="modalBody"><p className="sourceText">{brDate(viewing.updated_at||viewing.created_at)} - {viewing.status} - {viewing.observacoes||'sem observações'}</p><div className="checkViewList">{(viewing.itens_json||[]).map((item,i)=><div className={item.ok?'checkViewItem ok':'checkViewItem'} key={(item.label||'item')+'-'+i}><span>{item.ok?<Check size={15}/>:i+1}</span><b>{item.label}</b></div>)}</div></div></Modal>}</section>
}
function EquipamentosFazenda({farm,data,openNew,canEdit=true}){
  const [edit,setEdit]=useState(null),[photoEquip,setPhotoEquip]=useState(null);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const evidenceCount=id=>(data.evidencias||[]).filter(ev=>ev.equipamento_id===id).length;
  return <section className="panel">
    <div className="sectionTitle"><div><h2>Equipamentos instalados</h2></div>{canEdit&&<button className="btn primary" onClick={openNew}><Plus size={17}/> Adicionar</button>}</div>
    {!canEdit&&<PermissionNotice/>}
    <div className="equipGrid">{equips.map(e=>{
      const photos=evidenceCount(e.id), pendingInstall=isEquipmentPendingInstall(e), statusLabel=equipmentStatusLabel(e);
      return <article className="equipCard equipmentEvidenceCard" key={e.id}>
        <div className="equipIcon">{e.tipo?.includes('4102')?<RadioTower/>:<Cpu/>}</div>
        <div className="equipCardBody"><div className="equipTitleRow"><h3>{e.apelido||e.tipo}</h3><div className="equipBadges">{pendingInstall&&<span className="installPendingBadge"><Clock size={13}/> Pendente</span>}{photos>0&&<span className="photoCount"><ImageIcon size={13}/>{photos}</span>}</div></div><p>{e.tipo}</p><span>{e.local_nome||'Local não informado'} • {statusLabel}</span>{e.instalado_em&&<small><CalendarDays size={13}/> Instalação: {brDate(e.instalado_em)}</small>}{e.latitude&&<small><MapPin size={13}/> {Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}</small>}{e.tipo?.includes('4102')&&<small><Target size={13}/> Raio estimado: {Number(e.raio_metros)||75} m</small>}</div>
        <div className="equipCardActions">{canEdit&&<button className="btn light compact" onClick={()=>setPhotoEquip(e)}><Camera size={16}/> Fotos</button>}{canEdit&&<button className="iconBtn" title="Editar equipamento" onClick={()=>setEdit(e)}><Pencil size={17}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir equipamento" onClick={()=>data.delEquipamento(e.id)}><Trash2 size={17}/></button>}</div>
      </article>
    })}</div>
    {equips.length===0&&<Empty icon={Cpu} title="Nenhum equipamento" text="Cadastre VP8002, VP4102 ou outro equipamento da fazenda."/>}
    {photoEquip&&canEdit&&<EvidenceUploadModal farm={farm} data={data} equipamento={photoEquip} onClose={()=>setPhotoEquip(null)}/>}
    {edit&&canEdit&&<EquipModal farm={farm} data={data} equip={edit} onClose={()=>setEdit(null)} onSave={async(r)=>{await data.saveEquipamento(r);setEdit(null)}}/>}
  </section>
}
function EquipModal({farm,data,equip={},onClose,onSave}){
  const originalLat=equip.latitude?Number(equip.latitude):null, originalLng=equip.longitude?Number(equip.longitude):null;
  const initialStatus=EQUIP_STATUS.includes(equip.status)?equip.status:['Configurado','Validado'].includes(equip.status)?'Instalado':'Planejado';
  const [tab,setTab]=useState('dados'),[locationApproved,setLocationApproved]=useState(false),[pendingLocation,setPendingLocation]=useState(null),[focus,setFocus]=useState(null),[photoOpen,setPhotoOpen]=useState(false);
  const [form,setForm]=useState({id:equip.id||uid(),fazenda_id:farm.id,tipo:equip.tipo||EQUIP_TYPES[0],codigo_original:equip.codigo_original||'',apelido:equip.apelido||'',local_nome:equip.local_nome||'',latitude:equip.latitude||'',longitude:equip.longitude||'',raio_metros:equip.raio_metros||75,status:initialStatus,instalado_em:equip.instalado_em||todayInput(),observacoes:equip.observacoes||'',created_at:equip.created_at||nowISO()});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const setInstallDate=v=>setForm(prev=>({...prev,instalado_em:v,status:isFutureInstallDate(v)&&prev.status==='Instalado'?'Planejado':prev.status}));
  const coordsChanged=(lat,lng)=>equip.id&&originalLat!==null&&originalLng!==null&&(Math.abs(Number(lat)-originalLat)>.000001||Math.abs(Number(lng)-originalLng)>.000001);
  const applyLocation=(lat,lng)=>{setForm(prev=>({...prev,latitude:lat,longitude:lng}));setFocus([Number(lat),Number(lng)]);};
  const requestLocation=(lat,lng)=>{if(coordsChanged(lat,lng)&&!locationApproved){setPendingLocation([Number(lat),Number(lng)]);return false;}applyLocation(lat,lng);return true;};
  const confirmLocation=()=>{if(!pendingLocation)return;setLocationApproved(true);applyLocation(...pendingLocation);setPendingLocation(null);notify('Nova localização aplicada. Salve para concluir.','warning');};
  const clearLocation=()=>{setLocationApproved(true);setPendingLocation(null);setForm(prev=>({...prev,latitude:'',longitude:''}));setFocus(farmLatLng(farm));notify('Localização removida. Salve o equipamento para concluir.','warning');};
  const gps=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(pos=>requestLocation(pos.coords.latitude,pos.coords.longitude),()=>notify('Não foi possível usar o GPS. Verifique a permissão ou marque no mapa.','error'),{enableHighAccuracy:true,timeout:12000}):notify('GPS não disponível neste navegador.','error');
  const otherEquips=(data?.equipamentos||[]).filter(e=>e.fazenda_id===farm.id&&e.id!==form.id&&e.latitude&&e.longitude);
  const photos=(data?.evidencias||[]).filter(ev=>ev.equipamento_id===form.id);
  const installPending=isFutureInstallDate(form.instalado_em);
  const submit=e=>{
    e.preventDefault();
    if(coordsChanged(form.latitude,form.longitude)&&!locationApproved){setPendingLocation([Number(form.latitude),Number(form.longitude)]);return;}
    const status=installPending&&form.status==='Instalado'?'Planejado':form.status;
    if(installPending)notify('Data futura marcada. O equipamento ficará como instalação pendente.','warning');
    onSave({...form,status,latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null,raio_metros:Number(form.raio_metros)||75});
    notify(equip.id?'Equipamento atualizado com sucesso.':'Equipamento cadastrado com sucesso.');
  };
  const isAntenna=form.tipo?.includes('4102');
  return <Modal title={equip.id?'Editar equipamento':'Adicionar equipamento'} onClose={onClose}><form className="form modern equipmentEditor" onSubmit={submit}><div className="editorTabs equipmentEditorTabs"><button type="button" className={tab==='dados'?'active':''} onClick={()=>setTab('dados')}><ClipboardPenLine size={17}/> Dados</button><button type="button" className={tab==='localizacao'?'active':''} onClick={()=>setTab('localizacao')}><MapPin size={17}/> Localização {form.latitude&&<Check size={15}/>}</button><button type="button" className={tab==='fotos'?'active':''} onClick={()=>equip.id?setTab('fotos'):notify('Salve o equipamento antes de adicionar fotos.','warning')}><Camera size={17}/> Fotos {photos.length>0&&<b>{photos.length}</b>}</button></div>
  {tab==='dados'&&<div className="editorPane"><div className="grid2"><Field label="Tipo" icon={Cpu}><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{EQUIP_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Status" icon={BadgeCheck}><select value={form.status} onChange={e=>set('status',e.target.value)}>{EQUIP_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field></div><Field label="Apelido" icon={Pencil}><input value={form.apelido} onChange={e=>set('apelido',e.target.value)} placeholder="Ex.: Antena Galpão 01"/></Field><Field label="Local na fazenda" icon={MapPin}><input list="locais" value={form.local_nome} onChange={e=>set('local_nome',e.target.value)} placeholder="Ex.: Galpão 01"/><datalist id="locais">{LOCAL_SUGGESTIONS.map(l=><option key={l} value={l}/>)}</datalist></Field>{isAntenna&&<div className="radiusField"><Field label="Raio estimado da antena (m)" icon={Target}><input type="number" min="25" max="500" step="25" value={form.raio_metros} onChange={e=>set('raio_metros',e.target.value)}/></Field><div className="radiusPreview"><RadioTower size={22}/><b>{Number(form.raio_metros)||75} m</b><span>Exibido no mapa técnico</span></div></div>}<Field label="Data de instalação"><input type="date" value={form.instalado_em} onChange={e=>setInstallDate(e.target.value)}/></Field>{installPending&&<div className="installDateWarning"><Clock size={18}/><div><b>Instalação pendente</b><span>Data posterior a hoje. A finalização do serviço vai alertar enquanto este equipamento não estiver instalado.</span></div></div>}<Field label="Observações"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Pendências, configuração, cabo, rede, validação..."/></Field><div className="equipmentQuickActions"><button type="button" className="btn locationShortcut" onClick={()=>setTab('localizacao')}><MapPinned size={18}/>{form.latitude?'Revisar localização no mapa':'Definir localização no mapa'}</button><button type="button" className="btn light" onClick={()=>equip.id?setPhotoOpen(true):notify('Salve o equipamento antes de adicionar fotos.','warning')}><Camera size={18}/> Adicionar foto</button></div></div>}
  {tab==='localizacao'&&<div className="editorPane locationPane">{equip.id&&originalLat!==null&&<div className="locationLock"><ShieldCheck size={20}/><div><b>Localização protegida</b><span>Qualquer mudança exige confirmação antes de substituir o GPS atual.</span></div></div>}<SearchMapControl onSelect={(lat,lng,label)=>{requestLocation(lat,lng);if(label&&!form.local_nome)set('local_nome',label)}} placeholder="Pesquisar cidade, endereço, fazenda ou coordenada..."/><div className="locationActions"><button type="button" className="btn light" onClick={gps}><Navigation size={17}/> Usar GPS atual</button>{form.latitude&&<button type="button" className="btn light locationDangerButton" onClick={clearLocation}><Trash2 size={17}/> Limpar localização</button>}{form.latitude&&<span className="coordinateBadge"><LocateFixed size={15}/>{Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</span>}</div>{farm.latitude&&farm.longitude&&<div className="mapNeighborHint farmReferenceHint"><MapPinned size={17}/><span>O ponto da fazenda aparece no mapa como referência.</span></div>}{otherEquips.length>0&&<div className="mapNeighborHint"><Layers size={17}/><span>{otherEquips.length} equipamento(s) já cadastrado(s) aparecem em cinza no mapa.</span></div>}<div className="editorMap"><MapPicker farm={farm} lat={form.latitude} lng={form.longitude} radius={isAntenna?Number(form.raio_metros)||75:0} equip={{...form}} focus={focus} onPick={requestLocation} others={otherEquips}/></div></div>}
  {tab==='fotos'&&<div className="editorPane equipmentPhotosPane">{equip.id?<><div className="equipmentPhotoHead"><div><span className="eyebrow">Evidências</span><h3><Camera size={20}/> Fotos do equipamento</h3></div><button type="button" className="btn primary" onClick={()=>setPhotoOpen(true)}><Upload size={17}/> Adicionar fotos</button></div>{photos.length?<div className="equipmentPhotoGrid">{photos.map(item=><button type="button" key={item.id} onClick={()=>window.open(evidenceSrc(item),'_blank','noopener,noreferrer')}>{evidenceSrc(item)?<img src={evidenceSrc(item)} alt={item.descricao||item.categoria}/>:<ImageIcon size={26}/>}<span>{item.descricao||item.categoria}</span></button>)}</div>:<Empty icon={ImageIcon} title="Sem fotos neste equipamento" text="Adicione imagens para registrar como ficou a instalação."/>}</>:<Empty icon={Camera} title="Salve primeiro" text="Depois de salvar o equipamento, abra ele novamente para adicionar fotos."/>}</div>}
  <div className="stickyFormActions"><button type="button" className="btn light" onClick={onClose}>Cancelar</button><button className="btn primary"><Save size={18}/> Salvar equipamento</button></div></form>{photoOpen&&equip.id&&<EvidenceUploadModal farm={farm} data={data} equipamento={form} onClose={()=>setPhotoOpen(false)}/>} {pendingLocation&&<div className="confirmOverlay"><div className="confirmCard"><div className="confirmIcon"><AlertTriangle/></div><h3>Confirmar mudança de localização?</h3><p>Confira as coordenadas. A posição anterior será substituída somente após confirmar e salvar.</p><div className="coordinateCompare"><div><span>Local atual</span><b>{originalLat?.toFixed(6)}, {originalLng?.toFixed(6)}</b></div><Navigation size={20}/><div><span>Novo local</span><b>{pendingLocation[0].toFixed(6)}, {pendingLocation[1].toFixed(6)}</b></div></div><div className="confirmActions"><button type="button" className="btn light" onClick={()=>setPendingLocation(null)}>Manter localização atual</button><button type="button" className="btn warning" onClick={confirmLocation}>Usar nova localização</button></div></div></div>}</Modal>
}
function FarmLocationPicker({farm,lat,lng,onPick,focus}){const latNum=Number(lat),lngNum=Number(lng),hasCoords=lat!==''&&lng!==''&&Number.isFinite(latNum)&&Number.isFinite(lngNum);const center=hasCoords?[latNum,lngNum]:farmLatLng(farm);function Clicker(){useMapEvents({click(e){onPick(e.latlng.lat,e.latlng.lng)}});return null;}return <MapContainer center={center} zoom={hasCoords?17:13} className="map"><HybridLayers layer="hibrido"/><RecenterMap position={focus}/>{hasCoords&&<Marker position={[latNum,lngNum]} icon={farmMarkerIcon(farm)}/>}<Clicker/></MapContainer>}
function MapPicker({farm,lat,lng,onPick,radius=0,equip={},focus,others=[]}){const farmPoint=farm?.latitude&&farm?.longitude?[Number(farm.latitude),Number(farm.longitude)]:null, currentPoint=lat&&lng?[Number(lat),Number(lng)]:null, otherPoints=others.map(item=>[Number(item.latitude),Number(item.longitude)]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])), center=currentPoint||farmPoint||otherPoints[0]||[-19.7483,-47.9319], fitPoints=[farmPoint,currentPoint,...otherPoints].filter(Boolean), fitTrigger=`${Boolean(farmPoint)}-${Boolean(currentPoint)}-${otherPoints.length}`; function Clicker(){useMapEvents({click(e){onPick(e.latlng.lat,e.latlng.lng)}}); return null;} return <MapContainer center={center} zoom={currentPoint?17:13} className="map"><HybridLayers layer="hibrido"/><RecenterMap position={focus}/><FitBounds points={fitPoints} trigger={fitTrigger}/>{farmPoint&&<Marker position={farmPoint} icon={farmMarkerIcon(farm)}><Popup><b>{farm.nome}</b><br/>Localização da fazenda</Popup></Marker>}{others.map(item=><Marker key={item.id} position={[Number(item.latitude),Number(item.longitude)]} icon={equipmentMarkerIcon(item,{ghost:true})}><Popup><b>{item.apelido||item.tipo}</b><br/>{item.local_nome||'Outro equipamento da fazenda'}</Popup></Marker>)}{currentPoint&&<><Marker position={currentPoint} icon={equipmentMarkerIcon(equip)}/>{radius>0&&<Circle center={currentPoint} radius={radius} pathOptions={{color:'#22c55e',fillColor:'#22c55e',fillOpacity:.16,weight:2}}/>}</>}<Clicker/></MapContainer>}
function SearchMapControl({onSelect,placeholder='Pesquisar cidade, endereço ou local...'}){
  const [q,setQ]=useState(''),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState('');
  const search=async()=>{if(!q.trim())return;setBusy(true);setErr('');try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=6&addressdetails=1&q=${encodeURIComponent(q)}`);if(!r.ok)throw new Error('Falha na busca');const j=await r.json();setResults(j);}catch(e){setErr('Não foi possível pesquisar agora. Você ainda pode navegar manualmente no mapa.');}finally{setBusy(false)}};
  return <div className="mapSearch"><div className="mapSearchBar"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}} placeholder={placeholder}/><button type="button" onClick={search} disabled={busy}>{busy?'Buscando...':'Buscar'}</button></div>{results.length>0&&<div className="mapSearchResults">{results.map(r=><button type="button" key={r.place_id} onClick={()=>{onSelect(Number(r.lat),Number(r.lon),r.display_name);setResults([]);setQ(r.display_name)}}><MapPin size={15}/><span>{r.display_name}</span></button>)}</div>}{err&&<small className="sourceText">{err}</small>}</div>
}
function RecenterMap({position,zoom=17}){const map=useMapEvents({});useEffect(()=>{if(position?.[0]&&position?.[1])map.flyTo(position,zoom,{duration:.8})},[position?.[0],position?.[1],zoom]);return null;}
function FitBounds({points,trigger}){const map=useMapEvents({});useEffect(()=>{const valid=points.filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));if(!valid.length)return;if(valid.length===1){map.flyTo(valid[0],18,{duration:.6});return;}map.fitBounds(L.latLngBounds(valid),{padding:[42,42],maxZoom:18});},[trigger,points.length]);return null;}
function HybridLayers({layer}){const imagery='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';if(layer==='mapa')return <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap"/>;return <><TileLayer url={imagery} attribution="Esri"/>{layer==='hibrido'&&<TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="CARTO"/>}</>}
function TechnicalMapClick({mode,onPick}){useMapEvents({click(e){if(mode!=='navigate')onPick(e.latlng)}});return null;}
function MapaFazenda({farm,data,canEdit=false,onEditEquip}){
  const farmEquipamentos=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const all=farmEquipamentos.filter(e=>e.latitude&&e.longitude),[focus,setFocus]=useState(null),[fitTick,setFitTick]=useState(0),[showBuffers,setShowBuffers]=useState(true),[showLabels,setShowLabels]=useState(true),[typeFilter,setTypeFilter]=useState('todos'),[filtersOpen,setFiltersOpen]=useState(false);
  const antennaCount=all.filter(e=>e.tipo?.includes('4102')).length, processorCount=all.filter(e=>e.tipo?.includes('8002')).length, otherCount=all.length-antennaCount-processorCount, missingCoords=farmEquipamentos.length-all.length;
  const equips=all.filter(e=>typeFilter==='todos'||(typeFilter==='vp4102'&&e.tipo?.includes('4102'))||(typeFilter==='vp8002'&&e.tipo?.includes('8002'))||(typeFilter==='outros'&&!e.tipo?.includes('4102')&&!e.tipo?.includes('8002')));
  const center=all[0]?[Number(all[0].latitude),Number(all[0].longitude)]:farmLatLng(farm);
  const fitPoints=[farm.latitude&&farm.longitude?[Number(farm.latitude),Number(farm.longitude)]:null,...equips.map(e=>[Number(e.latitude),Number(e.longitude)])].filter(Boolean);
  const filterOptions=[['todos','Todos',all.length],['vp8002','VP8002',processorCount],['vp4102','VP4102',antennaCount],['outros','Outros',otherCount]];
  return <section className="panel readOnlyMapPanel operationalMapPanel">
    <div className="mapWorkspaceHeader">
      <div className="mapWorkspaceTitle"><span className="eyebrow">Mapa operacional</span><h2><MapIcon size={22}/> Mapa técnico</h2></div>
      <div className="mapMetricsStrip">
        <div><b>{all.length}</b><span>mapeados</span></div>
        <div><b>{antennaCount}</b><span>antenas</span></div>
        <div><b>{processorCount}</b><span>bases</span></div>
        {missingCoords>0&&<div className="mutedMetric"><b>{missingCoords}</b><span>sem GPS</span></div>}
      </div>
    </div>
    <div className="mapExperience">
      <div className="mapWrap technicalMap"><MapContainer center={center} zoom={all.length?18:15} className="bigMap"><HybridLayers layer="hibrido"/><RecenterMap position={focus}/><FitBounds points={fitPoints} trigger={fitTick}/>{farm.latitude&&farm.longitude&&<Marker position={[Number(farm.latitude),Number(farm.longitude)]} icon={farmMarkerIcon(farm)}><Popup><b>{farm.nome}</b><br/>Referência da fazenda<br/><button className="popupBtn" type="button" onClick={()=>openMaps(farm.latitude,farm.longitude)}>Abrir rota no Maps</button></Popup></Marker>}{equips.map(e=><React.Fragment key={e.id}><Marker position={[Number(e.latitude),Number(e.longitude)]} icon={equipmentMarkerIcon({...e,apelido:showLabels?(e.apelido||e.local_nome):''})}><Popup><b>{e.apelido||e.local_nome||e.tipo}</b><br/>{e.tipo}<br/>Local: {e.local_nome||'-'}<br/>Status: {equipmentStatusLabel(e)}<br/>Coordenadas: {Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}{e.tipo?.includes('4102')&&<><br/>Raio estimado: {Number(e.raio_metros)||75} m</>}<div className="popupActions">{canEdit&&onEditEquip&&<button className="popupBtn secondary" type="button" onClick={()=>onEditEquip(e)}><Pencil size={14}/> Editar equipamento</button>}<button className="popupBtn" type="button" onClick={()=>openMaps(e.latitude,e.longitude)}>Abrir rota no Maps</button></div></Popup></Marker>{showBuffers&&e.tipo?.includes('4102')&&<Circle center={[Number(e.latitude),Number(e.longitude)]} radius={Number(e.raio_metros)||75} pathOptions={{color:'#16a34a',fillColor:'#22c55e',fillOpacity:.08,weight:1.25}}/>}</React.Fragment>)}</MapContainer><div className="mapFloatingControls"><button type="button" className="mapIconControl" aria-label="Ver instalação inteira" title="Ver instalação inteira" onClick={()=>{setTypeFilter('todos');setFitTick(v=>v+1)}}><LocateFixed size={18}/></button><button type="button" className={`mapIconControl ${filtersOpen?'active':''}`} aria-label="Filtros do mapa" title="Filtros do mapa" onClick={()=>setFiltersOpen(v=>!v)}><Filter size={18}/></button>{filtersOpen&&<div className="mapFilterPopover"><div className="popoverTitle"><span>Filtros</span><button type="button" aria-label="Fechar filtros" onClick={()=>setFiltersOpen(false)}><X size={14}/></button></div><div className="popoverSegment">{filterOptions.map(([key,label,count])=><button type="button" key={key} className={typeFilter===key?'active':''} onClick={()=>setTypeFilter(key)}>{label}<b>{count}</b></button>)}</div><div className="popoverToggles"><label><input type="checkbox" checked={showBuffers} onChange={e=>setShowBuffers(e.target.checked)}/> Raios</label><label><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/> Nomes</label></div><div className="mapLegend popoverLegend"><span><i className="legendFarm"/> Fazenda</span><span><i className="legendProcessor"/> VP8002</span><span><i className="legendAntenna"/> VP4102</span>{otherCount>0&&<span><i className="legendOther"/> Outro</span>}{showBuffers&&<span><i className="legendBuffer"/> Cobertura</span>}</div></div>}</div></div>
      <aside className="mapPointList"><div className="mapPointHeader"><h3>Pontos da instalação</h3><span>{equips.length}/{all.length}</span></div>{farm.latitude&&farm.longitude&&<button onClick={()=>setFocus([Number(farm.latitude),Number(farm.longitude)])}><span className="pointDot farm"/>Fazenda<span>{farm.nome}</span></button>}{equips.map(e=><button key={e.id} onClick={()=>setFocus([Number(e.latitude),Number(e.longitude)])}><span className={`pointDot ${e.tipo?.includes('4102')?'antenna':e.tipo?.includes('8002')?'processor':'other'}`}/>{e.apelido||e.local_nome||e.tipo}<span>{e.local_nome||'sem local'} • {Number(e.latitude).toFixed(5)}, {Number(e.longitude).toFixed(5)}</span><em onClick={(event)=>{event.stopPropagation();openMaps(e.latitude,e.longitude)}}>Maps</em></button>)}</aside>
    </div>
    {!all.length&&<Empty icon={MapIcon} title="Nenhum equipamento no mapa" text="Nenhum equipamento com coordenadas nesta fazenda."/>}
  </section>
}
function VisitasFazenda({farm,data,openNew,canEdit=true}){
  const [viewing,setViewing]=useState(null),[editing,setEditing]=useState(null),[photoVisit,setPhotoVisit]=useState(null);
  const visits=data.visitas.filter(v=>v.fazenda_id===farm.id).sort((a,b)=>new Date(b.data_visita||b.created_at||0)-new Date(a.data_visita||a.created_at||0));
  const openVisit=visits.find(isOpenVisit), pending=visits.filter(v=>visitDisplayStatus(v)===VISIT_STATUS_PENDING), done=visits.filter(v=>visitDisplayStatus(v)===VISIT_STATUS_DONE).length, last=visits[0];
  const evidenceCount=id=>(data.evidencias||[]).filter(ev=>ev.visita_id===id).length;
  return <section className="panel visitsPanel">
    <div className="sectionTitle visitsHead"><div><span className="eyebrow">Campo</span><h2><CalendarDays size={22}/> Visitas</h2></div>{canEdit&&<button className="btn primary" onClick={openNew}><Plus size={17}/> Nova visita</button>}</div>
    {!canEdit&&<PermissionNotice/>}
    <div className="visitSummaryStrip">
      <article className={openVisit?'open':''}><PlayCircle size={18}/><b>{openVisit?1:0}</b><span>aberta</span></article>
      <article><CheckCircle2 size={18}/><b>{done}</b><span>concluídas</span></article>
      <article className={pending.length?'warn':''}><AlertTriangle size={18}/><b>{pending.length}</b><span>pendências</span></article>
      <article><Clock size={18}/><b>{last?brDate(last.data_visita):'-'}</b><span>última visita</span></article>
    </div>
    {openVisit&&<div className="visitOpenBanner"><div><PlayCircle size={20}/><span><b>Visita aberta</b>{openVisit.tipo} iniciada em {brDate(openVisit.data_visita)}</span></div><div>{canEdit&&<button className="btn light" onClick={()=>setPhotoVisit(openVisit)}><Camera size={16}/> Fotos</button>}{canEdit&&<button className="btn primary" onClick={()=>setEditing(openVisit)}><ClipboardPenLine size={16}/> Continuar</button>}</div></div>}
    <div className="visitTimeline">{visits.map(v=>{
      const tone=visitStatusTone(v), status=visitDisplayStatus(v), hasPending=visitHasPending(v), summary=visitSummaryText(v), photos=evidenceCount(v.id);
      return <article className={`visitCard ${tone}`} key={v.id}>
        <div className="visitStateIcon">{tone==='open'?<PlayCircle size={19}/>:hasPending?<AlertTriangle size={19}/>:<CheckCircle2 size={19}/>}</div>
        <div className="visitCardMain">
          <div className="visitCardTop"><div><h3>{v.tipo}</h3><span>{brDate(v.data_visita)}{photos>0&&` • ${photos} foto(s)`}</span></div><em>{status}</em></div>
          <p>{summary}</p>
          {tone==='open'?<div className="visitOpenBox"><PlayCircle size={15}/> Em andamento</div>:hasPending?<div className="visitPendingBox"><AlertTriangle size={15}/><span><b>Pendência</b>{v.pendencias||v.proxima_acao}</span></div>:<div className="visitOkBox"><CheckCircle2 size={15}/> Sem pendências registradas</div>}
          <footer><button className="btn light" onClick={()=>setViewing(v)}><Info size={15}/> Ver</button>{canEdit&&<button className="btn light" onClick={()=>setPhotoVisit(v)}><Camera size={15}/> Fotos</button>}{canEdit&&<button className="btn light" onClick={()=>setEditing(v)}><Pencil size={15}/> Editar</button>}{canEdit&&<button className="btn light dangerInline" onClick={()=>data.delVisita(v.id)}><Trash2 size={15}/> Excluir</button>}</footer>
        </div>
      </article>
    })}</div>
    {visits.length===0&&<Empty icon={CalendarDays} title="Nenhuma visita registrada" text="Registre instalação, diagnóstico, retorno ou suporte."/>}
    {viewing&&<VisitDetailModal visit={viewing} evidencias={(data.evidencias||[]).filter(ev=>ev.visita_id===viewing.id)} onClose={()=>setViewing(null)}/>}
    {photoVisit&&canEdit&&<EvidenceUploadModal farm={farm} data={data} visita={photoVisit} onClose={()=>setPhotoVisit(null)}/>}
    {editing&&canEdit&&<VisitModal farm={farm} visit={editing} onClose={()=>setEditing(null)} onSave={async(r)=>{await data.saveVisita(r);setEditing(null)}}/>}
  </section>
}
function VisitDetailModal({visit,evidencias=[],onClose}){
  const hasPending=visitHasPending(visit), status=visitDisplayStatus(visit), open=isOpenVisit(visit);
  const photos=evidencias.filter(item=>evidenceSrc(item));
  const details=[['Problemas',visit.problemas,AlertTriangle],['Solução',visit.solucao,CheckCircle2],['Próxima ação',visit.proxima_acao,Navigation]].filter(([,value])=>String(value||'').trim());
  return <Modal title={`${visit.tipo} • ${brDate(visit.data_visita)}`} onClose={onClose}><div className="modalBody visitDetailModal">
    <div className={`visitDetailStatus ${open?'open':hasPending?'pending':'ok'}`}>{open?<PlayCircle size={24}/>:hasPending?<AlertTriangle size={24}/>:<CheckCircle2 size={24}/>}<div><b>{status}</b><span>{open?'Visita em andamento.':hasPending?'Existe uma ação pendente registrada.':'Sem pendências registradas.'}</span></div></div>
    <section className="visitDetailSection"><h3>Resumo</h3><p>{visitSummaryText(visit)}</p></section>
    {hasPending&&<section className="visitDetailSection pending"><h3>Pendência</h3><p>{visit.pendencias||visit.proxima_acao}</p></section>}
    {photos.length>0&&<section className="visitDetailPhotos"><h3>Fotos da visita</h3><div>{photos.slice(0,4).map(item=><img key={item.id} src={evidenceSrc(item)} alt={item.descricao||item.categoria}/>)}</div></section>}
    {details.length>0&&<section className="visitDetailGrid">{details.map(([label,value,Icon])=><article key={label}><span><Icon size={15}/>{label}</span><b>{value}</b></article>)}</section>}
  </div></Modal>
}
function evidenceLinkedText(item,equips,visits){
  const equip = item.equipamento_id ? equips.find(e=>e.id===item.equipamento_id) : null;
  const visit = item.visita_id ? visits.find(v=>v.id===item.visita_id) : null;
  if(equip) return `Equipamento: ${equip.apelido||equip.local_nome||equip.tipo}`;
  if(visit) return `Visita: ${visit.tipo} - ${brDate(visit.data_visita)}`;
  return 'Registro geral da fazenda';
}
function EvidenciasFazendaOld({farm,data,canEdit=true}){
  const evidencias=(data.evidencias||[]).filter(e=>e.fazenda_id===farm.id);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const visits=data.visitas.filter(v=>v.fazenda_id===farm.id);
  const [categoria,setCategoria]=useState(EVIDENCE_CATEGORIES[0]),[descricao,setDescricao]=useState(''),[equipamentoId,setEquipamentoId]=useState(''),[visitaId,setVisitaId]=useState(''),[incluiRelatorio,setIncluiRelatorio]=useState(true),[filter,setFilter]=useState('Todas'),[busy,setBusy]=useState(false),[viewing,setViewing]=useState(null),[editing,setEditing]=useState(null);
  const uploadId=`evidence-upload-${farm.id}`;
  const visible=evidencias.filter(e=>filter==='Todas'||e.categoria===filter);
  const upload=async(e)=>{const files=e.target.files;if(!files?.length)return;setBusy(true);const result=await data.uploadEvidencias(farm,files,{categoria,descricao,equipamento_id:equipamentoId,visita_id:visitaId,inclui_relatorio:incluiRelatorio});setBusy(false);e.target.value='';if(result.ok)setDescricao('');};
  return <section className="panel evidencePanel"><div className="sectionTitle"><div><h2><ImageIcon size={21}/> Evidências da instalação</h2></div><div className="evidenceTotal"><b>{evidencias.length}</b><span>foto(s)</span></div></div>{!canEdit&&<PermissionNotice/>}{canEdit&&<div className="evidenceUploader"><div className="evidenceUploaderHead"><Camera size={24}/><div><b>Adicionar fotos</b></div></div><div className="grid2"><Field label="Categoria"><select value={categoria} onChange={e=>setCategoria(e.target.value)}>{EVIDENCE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Vincular a equipamento"><select value={equipamentoId} onChange={e=>{setEquipamentoId(e.target.value); if(e.target.value)setVisitaId('')}}><option value="">Registro geral</option>{equips.map(eq=><option key={eq.id} value={eq.id}>{eq.apelido||eq.local_nome||eq.tipo}</option>)}</select></Field></div><Field label="Vincular a visita"><select value={visitaId} onChange={e=>{setVisitaId(e.target.value); if(e.target.value)setEquipamentoId('')}}><option value="">Sem vínculo com visita</option>{visits.map(v=><option key={v.id} value={v.id}>{v.tipo} - {brDate(v.data_visita)}</option>)}</select></Field><Field label="Descrição opcional"><textarea value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex.: antena fixada no curral, VP8002 instalado na sala técnica, cabeamento finalizado..."/></Field><div className="evidenceUploadActions"><label className="optionCheck"><input type="checkbox" checked={incluiRelatorio} onChange={e=>setIncluiRelatorio(e.target.checked)}/> Entrar no relatório</label><input className="srOnly" id={uploadId} type="file" accept="image/*" multiple onChange={upload}/><label className={`btn primary ${busy?'disabled':''}`} htmlFor={busy?undefined:uploadId}><Upload size={18}/> {busy?'Enviando...':'Selecionar fotos'}</label></div></div>}<div className="evidenceFilters"><button className={filter==='Todas'?'active':''} onClick={()=>setFilter('Todas')}>Todas</button>{EVIDENCE_CATEGORIES.map(c=><button key={c} className={filter===c?'active':''} onClick={()=>setFilter(c)}>{c}</button>)}</div>{visible.length?<div className="evidenceGrid">{visible.map(item=><article className="evidenceCard" key={item.id}><button className="evidenceThumb" onClick={()=>setViewing(item)}>{evidenceSrc(item)?<img src={evidenceSrc(item)} alt={item.descricao||item.categoria}/>:<ImageIcon size={34}/>}<span><Eye size={15}/> Ver</span></button><div className="evidenceContent"><div><b>{item.categoria}</b>{item.inclui_relatorio!==false&&<span className="pill">Relatório</span>}</div><p>{item.descricao||'Sem descrição.'}</p><small><Link2 size={13}/>{evidenceLinkedText(item,equips,visits)}</small><small>{brDateTime(item.created_at)} • {item.arquivo_nome||'imagem'}</small></div><footer>{canEdit&&<button className="iconBtn" title="Editar evidência" onClick={()=>setEditing(item)}><Pencil size={16}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir evidência" onClick={()=>data.delEvidencia(item)}><Trash2 size={16}/></button>}</footer></article>)}</div>:<Empty icon={ImageIcon} title="Nenhuma evidência registrada" text="Adicione fotos para documentar como a instalação ficou."/>}{viewing&&<Modal title={viewing.categoria} onClose={()=>setViewing(null)}><div className="modalBody evidenceViewer">{evidenceSrc(viewing)?<img src={evidenceSrc(viewing)} alt={viewing.descricao||viewing.categoria}/>:<Empty icon={ImageIcon} title="Imagem indisponível" text="Não foi possível carregar o arquivo desta evidência."/>}<InfoCard title="Detalhes" rows={[['Categoria',viewing.categoria],['Descrição',viewing.descricao],['Vínculo',evidenceLinkedText(viewing,equips,visits)],['Relatório',viewing.inclui_relatorio!==false?'Sim':'Não'],['Data',brDateTime(viewing.created_at)]]}/></div></Modal>}{editing&&canEdit&&<EvidenceEditModal item={editing} equips={equips} visits={visits} onClose={()=>setEditing(null)} onSave={async(row)=>{const r=await data.saveEvidencia(row);if(r.ok)setEditing(null)}}/>}</section>
}
function EvidenciasFazenda({farm,data,canEdit=true}){
  const evidencias=(data.evidencias||[]).filter(e=>e.fazenda_id===farm.id);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const visits=data.visitas.filter(v=>v.fazenda_id===farm.id).sort((a,b)=>new Date(b.data_visita||b.created_at||0)-new Date(a.data_visita||a.created_at||0));
  const [filter,setFilter]=useState('todas'),[viewing,setViewing]=useState(null),[editing,setEditing]=useState(null),[generalUpload,setGeneralUpload]=useState(false);
  const contextOf=item=>item.equipamento_id?'equipamentos':item.visita_id?'visitas':'gerais';
  const visible=evidencias.filter(item=>filter==='todas'||contextOf(item)===filter);
  const totals={equipamentos:evidencias.filter(e=>e.equipamento_id).length,visitas:evidencias.filter(e=>e.visita_id).length,gerais:evidencias.filter(e=>!e.equipamento_id&&!e.visita_id).length};
  const latest=evidencias.slice().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0];
  const filters=[['todas','Todas',evidencias.length,ImageIcon],['equipamentos','Equipamentos',totals.equipamentos,Cpu],['visitas','Visitas',totals.visitas,CalendarDays],['gerais','Gerais',totals.gerais,FolderIconFallback]];
  const equipmentGroups=equips.map(eq=>({id:eq.id,label:eq.apelido||eq.local_nome||eq.tipo,count:evidencias.filter(ev=>ev.equipamento_id===eq.id).length,Icon:eq.tipo?.includes('4102')?RadioTower:Cpu})).filter(g=>g.count>0);
  const visitGroups=visits.map(v=>({id:v.id,label:`${v.tipo} • ${brDate(v.data_visita)}`,count:evidencias.filter(ev=>ev.visita_id===v.id).length,Icon:CalendarDays})).filter(g=>g.count>0);
  return <section className="panel evidencePanel evidenceGalleryPanel">
    <div className="sectionTitle evidenceGalleryHead"><div><span className="eyebrow">Registro fotográfico</span><h2><ImageIcon size={21}/> Evidências</h2></div><div className="evidenceHeadActions"><div className="evidenceTotal"><b>{evidencias.length}</b><span>foto(s)</span></div>{canEdit&&<button className="btn light" onClick={()=>setGeneralUpload(true)}><Camera size={17}/> Registro geral</button>}</div></div>
    {!canEdit&&<PermissionNotice/>}
    <div className="evidenceContextSummary">
      <article><Cpu size={18}/><b>{totals.equipamentos}</b><span>em equipamentos</span></article>
      <article><CalendarDays size={18}/><b>{totals.visitas}</b><span>em visitas</span></article>
      <article><ImageIcon size={18}/><b>{latest?brDate(latest.created_at):'-'}</b><span>último registro</span></article>
    </div>
    {(equipmentGroups.length>0||visitGroups.length>0)&&<div className="evidenceGroups">
      {equipmentGroups.map(g=>{const Icon=g.Icon;return <button key={`eq-${g.id}`} onClick={()=>setFilter('equipamentos')}><Icon size={16}/><span>{g.label}</span><b>{g.count}</b></button>})}
      {visitGroups.map(g=>{const Icon=g.Icon;return <button key={`v-${g.id}`} onClick={()=>setFilter('visitas')}><Icon size={16}/><span>{g.label}</span><b>{g.count}</b></button>})}
    </div>}
    <div className="evidenceFilters contextFilters">{filters.map(([key,label,count,Icon])=><button key={key} className={filter===key?'active':''} onClick={()=>setFilter(key)}><Icon size={15}/>{label}<span>{count}</span></button>)}</div>
    {visible.length?<div className="evidenceGrid">{visible.map(item=><article className="evidenceCard" key={item.id}><button className="evidenceThumb" onClick={()=>setViewing(item)}>{evidenceSrc(item)?<img src={evidenceSrc(item)} alt={item.descricao||item.categoria}/>:<ImageIcon size={34}/>}<span><Eye size={15}/> Ver</span></button><div className="evidenceContent"><div><b>{item.categoria}</b>{item.inclui_relatorio!==false&&<span className="pill">Relatório</span>}</div><p>{item.descricao||'Sem descrição.'}</p><small><Link2 size={13}/>{evidenceLinkedText(item,equips,visits)}</small><small>{brDateTime(item.created_at)} • {item.arquivo_nome||'imagem'}</small></div><footer>{canEdit&&<button className="iconBtn" title="Editar evidência" onClick={()=>setEditing(item)}><Pencil size={16}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir evidência" onClick={()=>data.delEvidencia(item)}><Trash2 size={16}/></button>}</footer></article>)}</div>:<Empty icon={ImageIcon} title="Nenhuma evidência neste filtro" text="As fotos entram pelo equipamento, pela visita ou como registro geral."/>}
    {generalUpload&&canEdit&&<EvidenceUploadModal farm={farm} data={data} onClose={()=>setGeneralUpload(false)}/>}
    {viewing&&<Modal title={viewing.categoria} onClose={()=>setViewing(null)}><div className="modalBody evidenceViewer">{evidenceSrc(viewing)?<img src={evidenceSrc(viewing)} alt={viewing.descricao||viewing.categoria}/>:<Empty icon={ImageIcon} title="Imagem indisponível" text="Não foi possível carregar o arquivo desta evidência."/>}<InfoCard title="Detalhes" rows={[['Categoria',viewing.categoria],['Descrição',viewing.descricao],['Vínculo',evidenceLinkedText(viewing,equips,visits)],['Relatório',viewing.inclui_relatorio!==false?'Sim':'Não'],['Data',brDateTime(viewing.created_at)]]}/></div></Modal>}
    {editing&&canEdit&&<EvidenceEditModal item={editing} equips={equips} visits={visits} onClose={()=>setEditing(null)} onSave={async(row)=>{const r=await data.saveEvidencia(row);if(r.ok)setEditing(null)}}/>}
  </section>
}
function FolderIconFallback(props){return <Layers {...props}/>}
function EvidenceUploadModal({farm,data,equipamento=null,visita=null,onClose}){
  const [categoria,setCategoria]=useState(evidenceCategoryFor({equipamento,visita})),[descricao,setDescricao]=useState(''),[incluiRelatorio,setIncluiRelatorio]=useState(true),[busy,setBusy]=useState(false);
  const contextTitle=equipamento?equipamento.apelido||equipamento.local_nome||equipamento.tipo:visita?`${visita.tipo} • ${brDate(visita.data_visita)}`:'Registro geral';
  const uploadBase=`evidence-context-${farm.id}-${equipamento?.id||visita?.id||'geral'}`;
  const upload=async(e)=>{
    const files=e.target.files;
    if(!files?.length)return;
    setBusy(true);
    const result=await data.uploadEvidencias(farm,files,{categoria,descricao,equipamento_id:equipamento?.id||null,visita_id:visita?.id||null,inclui_relatorio:incluiRelatorio});
    setBusy(false);
    e.target.value='';
    if(result.ok)onClose();
  };
  return <Modal title="Adicionar fotos" onClose={onClose}><div className="modalBody contextEvidenceModal">
    <div className="contextEvidenceTarget"><Camera size={22}/><div><span>Vínculo automático</span><b>{contextTitle}</b></div></div>
    <Field label="Categoria"><select value={categoria} onChange={e=>setCategoria(e.target.value)}>{EVIDENCE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
    <Field label="Descrição"><textarea value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder={equipamento?'Ex.: equipamento fixado, cabeamento conectado, local finalizado.':visita?'Ex.: registro da visita, validação, pendência encontrada.':'Ex.: foto geral da instalação ou do local.'}/></Field>
    <label className="optionCheck"><input type="checkbox" checked={incluiRelatorio} onChange={e=>setIncluiRelatorio(e.target.checked)}/> Entrar no relatório</label>
    <div className="contextUploadActions">
      <input className="srOnly" id={`${uploadBase}-camera`} type="file" accept="image/*" capture="environment" onChange={upload}/>
      <input className="srOnly" id={`${uploadBase}-files`} type="file" accept="image/*" multiple onChange={upload}/>
      <label className={`btn primary ${busy?'disabled':''}`} htmlFor={busy?undefined:`${uploadBase}-camera`}><Camera size={18}/> {busy?'Enviando...':'Usar câmera'}</label>
      <label className={`btn light ${busy?'disabled':''}`} htmlFor={busy?undefined:`${uploadBase}-files`}><Upload size={18}/> Galeria</label>
    </div>
  </div></Modal>
}
function EvidenceEditModal({item,equips,visits,onClose,onSave}){
  const [form,setForm]=useState({...item,categoria:item.categoria||EVIDENCE_CATEGORIES[0],descricao:item.descricao||'',equipamento_id:item.equipamento_id||'',visita_id:item.visita_id||'',inclui_relatorio:item.inclui_relatorio!==false});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  return <Modal title="Editar evidência" onClose={onClose}><form className="form" onSubmit={e=>{e.preventDefault();onSave(form)}}><Field label="Categoria"><select value={form.categoria} onChange={e=>set('categoria',e.target.value)}>{EVIDENCE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field><div className="grid2"><Field label="Equipamento"><select value={form.equipamento_id||''} onChange={e=>{set('equipamento_id',e.target.value);if(e.target.value)set('visita_id','')}}><option value="">Registro geral</option>{equips.map(eq=><option key={eq.id} value={eq.id}>{eq.apelido||eq.local_nome||eq.tipo}</option>)}</select></Field><Field label="Visita"><select value={form.visita_id||''} onChange={e=>{set('visita_id',e.target.value);if(e.target.value)set('equipamento_id','')}}><option value="">Sem vínculo</option>{visits.map(v=><option key={v.id} value={v.id}>{v.tipo} - {brDate(v.data_visita)}</option>)}</select></Field></div><Field label="Descrição"><textarea value={form.descricao} onChange={e=>set('descricao',e.target.value)} placeholder="Descreva o que a foto mostra."/></Field><label className="optionCheck"><input type="checkbox" checked={form.inclui_relatorio} onChange={e=>set('inclui_relatorio',e.target.checked)}/> Incluir no relatório técnico</label><button className="btn primary full"><Save size={18}/> Salvar evidência</button></form></Modal>
}

function VisitModal({farm,visit={},onClose,onSave}){
  const [form,setForm]=useState({id:visit.id||uid(),fazenda_id:farm.id,tipo:visit.tipo||'Instalação',data_visita:visit.data_visita||todayInput(),resumo:visit.resumo||'',problemas:visit.problemas||'',solucao:visit.solucao||'',pendencias:visit.pendencias||'',proxima_acao:visit.proxima_acao||'',status:visit.status||'',iniciada_em:visit.iniciada_em||'',finalizada_em:visit.finalizada_em||'',created_at:visit.created_at||nowISO()});
  const [hasPending,setHasPending]=useState(visitHasPending(visit));
  const [keepOpen,setKeepOpen]=useState(isOpenVisit(visit));
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const defaultOkSummary=()=>`${form.tipo} realizada em ${brDate(form.data_visita)}. Sem pendências registradas.`;
  const applyQuick=(kind)=>{
    if(kind==='ok'){setHasPending(false);setForm(prev=>({...prev,resumo:prev.resumo||`${prev.tipo} concluída em ${brDate(prev.data_visita)}. Tudo certo no campo.`,pendencias:'',proxima_acao:''}));}
    if(kind==='validado')setForm(prev=>({...prev,resumo:prev.resumo||'Equipamentos conferidos e operação validada em campo.'}));
    if(kind==='pending'){setHasPending(true);}
    if(kind==='return'){setHasPending(true);setForm(prev=>({...prev,pendencias:prev.pendencias||'Retorno necessário para concluir a validação.',proxima_acao:prev.proxima_acao||'Agendar retorno técnico.'}));}
  };
  const submit=e=>{
    e.preventDefault();
    const pendingText=String(form.pendencias||form.proxima_acao||'').trim();
    if(hasPending&&!pendingText){notify('Informe a pendência ou próxima ação.','warning');return;}
    const status=keepOpen?VISIT_STATUS_OPEN:hasPending?VISIT_STATUS_PENDING:VISIT_STATUS_DONE;
    const finishedAt=keepOpen?null:(form.finalizada_em||nowISO());
    const clean={...form,status,iniciada_em:form.iniciada_em||(keepOpen?nowISO():null),finalizada_em:finishedAt,resumo:String(form.resumo||'').trim()||`${form.tipo} registrada ${hasPending?'com pendência':'sem pendências'} em ${brDate(form.data_visita)}.`};
    if(!hasPending){clean.pendencias='';clean.proxima_acao='';}
    onSave(clean);
  };
  return <Modal title={visit.id?'Editar visita':'Nova visita'} onClose={onClose}><form className="form modern visitEditor" onSubmit={submit}>
    <div className="grid2 visitEditorTop"><Field label="Tipo"><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{VISIT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Data"><input type="date" value={form.data_visita} onChange={e=>set('data_visita',e.target.value)}/></Field></div>
    <div className="visitOutcome"><button type="button" className={!hasPending?'active ok':''} onClick={()=>applyQuick('ok')}><CheckCircle2 size={18}/><b>Tudo certo</b><span>sem pendência</span></button><button type="button" className={hasPending?'active pending':''} onClick={()=>applyQuick('pending')}><AlertTriangle size={18}/><b>Com pendência</b><span>precisa ação</span></button></div>
    <div className="visitQuickChips"><button type="button" onClick={()=>applyQuick('ok')}><Check size={14}/> Concluída</button><button type="button" onClick={()=>applyQuick('validado')}><ClipboardCheck size={14}/> Validada</button><button type="button" onClick={()=>applyQuick('return')}><Route size={14}/> Precisa retorno</button></div>
    {(visit.id||keepOpen)&&<div className={`visitOpenEditor ${keepOpen?'active':''}`}><Clock size={17}/><div><b>{keepOpen?'Visita aberta':'Visita será encerrada'}</b><span>{keepOpen?'Use enquanto o serviço está em andamento.':'Ao salvar, entra no histórico da fazenda.'}</span></div>{keepOpen?<button type="button" className="btn light" onClick={()=>setKeepOpen(false)}><CheckCircle2 size={15}/> Encerrar ao salvar</button>:visit.id&&isOpenVisit(visit)&&<button type="button" className="btn light" onClick={()=>setKeepOpen(true)}><PlayCircle size={15}/> Manter aberta</button>}</div>}
    <Field label="Resumo rápido"><textarea value={form.resumo} onChange={e=>set('resumo',e.target.value)} placeholder={defaultOkSummary()}/></Field>
    {hasPending&&<div className="visitPendingEditor"><Field label="Pendência"><textarea value={form.pendencias} onChange={e=>set('pendencias',e.target.value)} placeholder="Ex.: nobreak pendente, cabo para substituir, ajuste de antena..."/></Field><Field label="Próxima ação"><textarea value={form.proxima_acao} onChange={e=>set('proxima_acao',e.target.value)} placeholder="Ex.: levar nobreak, retornar com suporte, validar com cliente..."/></Field></div>}
    <details className="advancedVisit"><summary>Campos técnicos opcionais</summary><Field label="Problemas encontrados"><textarea value={form.problemas} onChange={e=>set('problemas',e.target.value)}/></Field><Field label="Solução aplicada"><textarea value={form.solucao} onChange={e=>set('solucao',e.target.value)}/></Field></details>
    <button className="btn primary full"><Save size={18}/> {visit.id?'Atualizar visita':'Salvar visita'}</button>
  </form></Modal>
}

function ReportPreview({farm,equips,visits,checks,mapped,evidencias=[]}){
  const farmPoint=farm.latitude&&farm.longitude?[Number(farm.latitude),Number(farm.longitude)]:null;
  const points=[farmPoint,...mapped.map(e=>[Number(e.latitude),Number(e.longitude)])].filter(Boolean);
  const center=points[0]||farmLatLng(farm);
  const displayStatus=farmStatus(farm);
  return <article className="printReport professionalReport reportPreview">
    <header className="reportHeader"><Logo/><div><span>RELATÓRIO TÉCNICO DE INSTALAÇÃO E CAMPO</span><small>Prévia conforme a fazenda selecionada</small></div></header>
    <section className="reportCover"><div><span className="reportTag">CONTROLTECH ASSIST</span><h1>{farm.nome}</h1><p>{farm.cidade||'Cidade não informada'} / {getFarmUF(farm)||'-'}</p></div><div className="reportStatus"><b>{displayStatus}</b><span>Situação da operação</span></div></section>
    <div className="reportMetrics"><div><b>{num(farm.qtd_colares_prevista)}</b><span>Colares previstos</span></div><div><b>{collarInstalled(farm)}</b><span>Instalados</span></div><div><b>{collarDelivered(farm)}</b><span>Entregues</span></div><div><b>{equips.length}</b><span>Equipamentos</span></div><div><b>{serviceDurationLabel(farm)}</b><span>Tempo de servico</span></div></div>
    <section className="reportSection"><h2>Dados da fazenda</h2><div className="reportInfoGrid"><div><span>Central</span><b>{farm.central||'-'}</b></div><div><span>Regional</span><b>{farm.regional_nome||'-'}</b></div><div><span>Responsavel</span><b>{farm.responsavel||'-'}</b></div><div><span>Telefone</span><b>{farm.telefone||'-'}</b></div><div><span>Veterinario/Apoio</span><b>{farm.veterinario_apoio||'-'}</b></div><div><span>Endereco</span><b>{farm.endereco||'-'}</b></div><div><span>Inicio do servico</span><b>{brDateTime(farm.servico_inicio_em)}</b></div><div><span>Fim do servico</span><b>{brDateTime(farm.servico_fim_em)}</b></div><div><span>Responsavel tecnico</span><b>{farm.servico_responsavel||'-'}</b></div></div></section>
    {points.length>0&&<section className="reportSection"><h2>Mapa técnico</h2><div className="reportMap"><MapContainer center={center} zoom={17} className="bigMap" scrollWheelZoom={false}><HybridLayers layer="hibrido"/><FitBounds points={points} trigger={points.length}/>{farmPoint&&<Marker position={farmPoint} icon={farmMarkerIcon(farm)}/>} {mapped.map(e=><Marker key={e.id} position={[Number(e.latitude),Number(e.longitude)]} icon={equipmentMarkerIcon(e)}/>)}</MapContainer></div></section>}
    <section className="reportSection"><h2>Equipamentos e coordenadas</h2>{equips.length?<div className="reportEquipmentList">{equips.slice(0,8).map((e,i)=><article key={e.id}><div className="reportEquipIndex">{i+1}</div><div><h3>{e.apelido||e.local_nome||e.tipo}</h3><p>{e.tipo} - {equipmentStatusLabel(e)}</p><dl><div><dt>Local</dt><dd>{e.local_nome||'-'}</dd></div><div><dt>Coordenadas</dt><dd>{e.latitude&&e.longitude?`${Number(e.latitude).toFixed(6)}, ${Number(e.longitude).toFixed(6)}`:'-'}</dd></div><div><dt>Raio</dt><dd>{e.tipo?.includes('4102')?`${Number(e.raio_metros)||75} m`:'-'}</dd></div></dl></div></article>)}</div>:<p className="sourceText">Nenhum equipamento registrado nesta fazenda.</p>}</section>
    <section className="reportSection"><h2>Histórico de visitas</h2>{visits.length?<div className="visit">{visits.slice(0,4).map(v=><article key={v.id}><h3>{brDate(v.data_visita)} - {v.tipo}</h3><p>{v.resumo||'Sem resumo.'}</p>{v.pendencias&&<p className="reportPending"><b>Pendências:</b> {v.pendencias}</p>}</article>)}</div>:<p className="sourceText">Nenhuma visita registrada.</p>}</section>
    {evidencias.length>0&&<section className="reportSection"><h2>Registro fotográfico</h2><div className="reportEvidenceGrid">{evidencias.slice(0,6).map(item=><article key={item.id}>{evidenceSrc(item)&&<img src={evidenceSrc(item)} alt={item.descricao||item.categoria}/>}<b>{item.categoria}</b><span>{item.descricao||evidenceLinkedText(item,equips,visits)}</span></article>)}</div></section>}
    <section className="reportSection"><h2>Checklists</h2>{checks.length?<div className="reportChecklist">{checks.slice(0,5).map(c=><div key={c.id}><b>{c.titulo}</b><span>{brDate(c.created_at)} - {c.status}</span></div>)}</div>:<p className="sourceText">Nenhum checklist salvo.</p>}</section>
  </article>
}

function RelatorioFazenda({farm,data}){
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const visits=data.visitas.filter(v=>v.fazenda_id===farm.id);
  const checks=data.checklists.filter(c=>c.fazenda_id===farm.id);
  const mapped=equips.filter(e=>e.latitude&&e.longitude);
  const evidencias=(data.evidencias||[]).filter(e=>e.fazenda_id===farm.id&&e.inclui_relatorio!==false);
  const displayStatus=farmStatus(farm);
  const [opts,setOpts]=useState({equip:true,visits:true,checks:true,evidencias:true,pend:true});
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [visitScope,setVisitScope]=useState('all');
  const [visitId,setVisitId]=useState('');
  const toggle=k=>setOpts(o=>({...o,[k]:!o[k]}));
  const visitTime=v=>new Date(v.data_visita||v.created_at||0).getTime()||0;
  const sortedVisits=[...visits].sort((a,b)=>visitTime(b)-visitTime(a));
  const activeVisitId=visitScope==='single'?(visitId||sortedVisits[0]?.id||''):'';
  const selectedVisit=activeVisitId?sortedVisits.find(v=>v.id===activeVisitId):null;
  const reportVisits=visitScope==='single'?(selectedVisit?[selectedVisit]:[]):sortedVisits;
  const reportEvidencias=visitScope==='single'&&activeVisitId?evidencias.filter(e=>e.visita_id===activeVisitId):evidencias;
  const reportScopeLabel=visitScope==='single'&&selectedVisit?`${selectedVisit.tipo||'Visita'} - ${brDate(selectedVisit.data_visita)}`:'Geral - todas as visitas';
  const pendingCount=reportVisits.filter(v=>v.pendencias).length;
  const reportOptions=[
    ['equip','Equipamentos',Cpu,equips.length],
    ['visits','Visitas',CalendarDays,reportVisits.length],
    ['checks','Checklists',ClipboardCheck,checks.length],
    ['evidencias','Evidências',ImageIcon,reportEvidencias.length],
    ['pend','Pendências',AlertTriangle,pendingCount]
  ];
  const enabledSections=reportOptions.filter(([k])=>opts[k]).length;
  const exportTsv=()=>{
    const rows=[
      ['RELATÓRIO TÉCNICO',farm.nome],
      ['Escopo',reportScopeLabel],
      ['Central',farm.central||''],
      ['Regional',farm.regional_nome||''],
      ['Veterinário/Apoio',farm.veterinario_apoio||''],
      ['Responsável',farm.responsavel||''],
      ['Cidade',`${farm.cidade||''} / ${getFarmUF(farm)}`],
      ['Status',displayStatus],
      ['Inicio do servico',brDateTime(farm.servico_inicio_em)],
      ['Fim do servico',brDateTime(farm.servico_fim_em)],
      ['Duracao do servico',serviceDurationLabel(farm)],
      ['Responsavel produtividade',farm.servico_responsavel||''],
      ['Colares previstos',farm.qtd_colares_prevista||0],
      ['Colares instalados',farm.qtd_colares_instalada||0],
      ['Colares entregues ao cliente',farm.qtd_colares_entregue_cliente||0],
      ['Colares restantes reais',collarRemaining(farm)],
      ['Motivo dos restantes',farm.motivo_colares_restantes||''],
      ['Evidências',reportEvidencias.length],
      [],
      ['EQUIPAMENTOS'],
      ['Tipo','Apelido','Local','Status','Raio (m)','Latitude','Longitude','Observações'],
      ...equips.map(e=>[e.tipo,e.apelido,e.local_nome,equipmentStatusLabel(e),e.raio_metros||'',e.latitude,e.longitude,e.observacoes||'']),
      [],
      ['VISITAS'],
      ['Data','Tipo','Resumo','Problemas','Solução','Pendências','Próxima ação'],
      ...reportVisits.map(v=>[v.data_visita,v.tipo,v.resumo,v.problemas,v.solucao,v.pendencias,v.proxima_acao]),
      [],
      ['EVIDÊNCIAS'],
      ['Data','Categoria','Descrição','Arquivo','Vínculo'],
      ...reportEvidencias.map(e=>[brDateTime(e.created_at),e.categoria,e.descricao,e.arquivo_nome,evidenceLinkedText(e,equips,visits)])
    ];
    download(`${farm.nome}-relatorio-tecnico.tsv`,rows.map(r=>r.join('\t')).join('\n'));
    notify('Arquivo TSV gerado.');
  };
  const printReport=()=>{
    const safe=v=>String(v===undefined||v===null||String(v).trim()===''?'-':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const points=[
      ...(farm.latitude&&farm.longitude?[{kind:'farm',label:farm.nome,lat:Number(farm.latitude),lng:Number(farm.longitude)}]:[]),
      ...mapped.map((e,i)=>({kind:e.tipo?.includes('4102')?'antenna':e.tipo?.includes('8002')?'processor':'other',label:e.apelido||e.local_nome||e.tipo,lat:Number(e.latitude),lng:Number(e.longitude),index:i+1}))
    ].filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
    const mapWidth=1000,mapHeight=430,mapAspect=mapWidth/mapHeight;
    const toMercator=p=>{
      const maxLat=85.05112878;
      const lat=Math.max(Math.min(p.lat,maxLat),-maxLat);
      const r=6378137;
      return {...p,mx:r*p.lng*Math.PI/180,my:r*Math.log(Math.tan(Math.PI/4+(lat*Math.PI/180)/2))};
    };
    const projected=points.map(toMercator);
    let bbox=null;
    if(projected.length){
      const xs=projected.map(p=>p.mx),ys=projected.map(p=>p.my);
      let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
      if(projected.length===1){minX-=420;maxX+=420;minY-=260;maxY+=260;}
      const width=Math.max(maxX-minX,320),height=Math.max(maxY-minY,180);
      minX-=Math.max(width*.28,110);maxX+=Math.max(width*.28,110);
      minY-=Math.max(height*.28,70);maxY+=Math.max(height*.28,70);
      const currentAspect=(maxX-minX)/(maxY-minY);
      if(currentAspect>mapAspect){
        const targetH=(maxX-minX)/mapAspect,extra=(targetH-(maxY-minY))/2;
        minY-=extra;maxY+=extra;
      }else{
        const targetW=(maxY-minY)*mapAspect,extra=(targetW-(maxX-minX))/2;
        minX-=extra;maxX+=extra;
      }
      bbox=[minX,minY,maxX,maxY];
    }
    const mapImg=bbox?`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox.map(n=>n.toFixed(2)).join(',')}&bboxSR=3857&imageSR=3857&size=${mapWidth},${mapHeight}&format=png&f=image`:'';
    const mapSymbol=p=>p.kind==='farm'?'F':p.kind==='antenna'?'A':p.kind==='processor'?'B':'O';
    const markerHtml=bbox?projected.map(p=>{
      const x=((p.mx-bbox[0])/(bbox[2]-bbox[0]))*100;
      const y=((bbox[3]-p.my)/(bbox[3]-bbox[1]))*100;
      const label=String(p.label||'').replace(/^Fazenda\s+/i,'').slice(0,16);
      return `<span class="mapTechPin ${p.kind}" style="left:${x}%;top:${y}%"><i>${mapSymbol(p)}</i><em>${safe(label||p.label)}</em></span>`;
    }).join(''):'';
    const mapKey=points.map(p=>`<div><b class="${p.kind}">${mapSymbol(p)}</b><span>${safe(p.label)}</span><small>${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}</small></div>`).join('');
    const mapStatsHtml=points.length?`<div class="mapStats"><span><b>${mapped.length}</b> item(ns) mapeado(s)</span><span><b>${equips.length-mapped.length}</b> sem coordenada</span><span><b>${points.length}</b> ponto(s) no mapa</span></div>`:'';
    const technicalMapHtml=points.length?`<section class="section mapSection"><h2>Mapa técnico da instalação</h2><div class="mapBox technicalMapPrint"><img src="${mapImg}" alt="Mapa técnico">${markerHtml}</div>${mapStatsHtml}<div class="mapKey">${mapKey}</div></section>`:'';
    const equipmentRows=equips.map((e,i)=>`<tr><td>${i+1}</td><td><b>${safe(e.apelido||e.local_nome||e.tipo)}</b><small>${safe(e.tipo)} - ${safe(equipmentStatusLabel(e))}</small></td><td>${safe(e.local_nome)}</td><td>${e.latitude&&e.longitude?`${Number(e.latitude).toFixed(6)}, ${Number(e.longitude).toFixed(6)}`:'-'}</td><td>${e.tipo?.includes('4102')?`${Number(e.raio_metros)||75} m`:'-'}</td></tr>`).join('');
    const visitRows=reportVisits.map(v=>`<article><h3>${safe(brDate(v.data_visita))} - ${safe(v.tipo)}</h3><p>${safe(v.resumo||'Sem resumo.')}</p>${opts.pend&&v.pendencias?`<p class="warn"><b>Pendências:</b> ${safe(v.pendencias)}</p>`:''}${v.solucao?`<p><b>Solução:</b> ${safe(v.solucao)}</p>`:''}</article>`).join('');
    const checkRows=checks.map(c=>`<tr><td>${safe(brDate(c.created_at))}</td><td>${safe(c.titulo)}</td><td>${safe(c.status)}</td><td>${safe(c.observacoes||'-')}</td></tr>`).join('');
    const evidenceRows=reportEvidencias.filter(e=>evidenceSrc(e)).slice(0,8).map(e=>`<figure style="margin:0;border:1px solid #dbe4ef;border-radius:12px;overflow:hidden;background:#f8fafc;break-inside:avoid"><img src="${safe(evidenceSrc(e))}" alt="${safe(e.descricao||e.categoria)}" style="width:100%;height:120px;object-fit:cover;display:block"><figcaption style="padding:7px 8px"><b style="display:block">${safe(e.categoria)}</b><span style="display:block;color:#64748b;font-size:9px;line-height:1.35">${safe(e.descricao||evidenceLinkedText(e,equips,visits))}</span></figcaption></figure>`).join('');
    const evidenceSectionHtml=evidenceRows?`<section><h2>Registro fotográfico da instalação</h2><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:7px">${evidenceRows}</div></section>`:'';
    const predicted=num(farm.qtd_colares_prevista),installed=collarInstalled(farm),delivered=collarDelivered(farm),handled=collarHandled(farm),progress=collarProgress(farm);
    const mappedCount=mapped.length,missingCoords=equips.filter(e=>!e.latitude||!e.longitude).length,pendingVisits=reportVisits.filter(v=>v.pendencias).length;
    const executiveHtml=`<section class="section executive"><h2>Resumo executivo</h2><p>${safe(`Relatório ${reportScopeLabel.toLowerCase()} da fazenda ${farm.nome}. Status ${displayStatus}, ${installed} colares instalados, ${delivered} entregues ao cliente/reserva, ${handled} de ${predicted} colares atendidos, ${equips.length} equipamento(s) cadastrado(s), ${mappedCount} com coordenadas e ${reportVisits.length} visita(s) no escopo.`)}</p><div class="execGrid"><div><span>Escopo</span><b>${safe(reportScopeLabel)}</b></div><div><span>Progresso atendido</span><b>${predicted?`${progress}%`:'-'}</b></div><div><span>Equipamentos mapeados</span><b>${mappedCount}/${equips.length}</b></div><div><span>Pendências em visitas</span><b>${opts.pend?pendingVisits:'-'}</b></div></div></section>`;
    const attentionItems=[
      missingCoords?`${missingCoords} equipamento(s) sem coordenadas no mapa técnico.`:'',
      !farm.servico_inicio_em||!farm.servico_fim_em?'Início ou fim do serviço ainda não informado para produtividade.':'',
      opts.pend&&pendingVisits?`${pendingVisits} visita(s) possuem pendências registradas.`:'',
      !checks.length?'Nenhum checklist salvo para esta fazenda.':''
    ].filter(Boolean);
    const attentionHtml=attentionItems.length?`<section class="section attention"><h2>Pontos de atenção</h2><ul>${attentionItems.map(item=>`<li>${safe(item)}</li>`).join('')}</ul></section>`:'';
    const printPolish=`<style>@media screen{html{background:#475569}body{width:210mm;min-height:297mm;margin:18px auto!important;padding:13mm!important;background:#fff!important;box-shadow:0 24px 80px rgba(15,23,42,.35)}}@media print{html,body{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important;background:#fff!important}}body{counter-reset:sec;color:#0b1220;font-size:10.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.top{align-items:center;padding-bottom:9px;margin-bottom:10px}.brand img{width:32px;height:32px}.brand b{font-size:17px}.doccode{font-size:9.5px}.cover{display:grid;grid-template-columns:1fr auto;align-items:end;min-height:88px;margin:8px 0 10px;padding:13px 16px}.cover h1{font-size:23px;line-height:1.05;margin:6px 0 4px}.cover p{margin:0}.status{font-weight:800}.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0}.box{min-height:42px;background:#fff;border-color:#cbd5e1;padding:6px 7px}.box b{font-size:9.4px}.box span{font-size:9.8px}.metrics{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:8px 0 10px}.metric{padding:7px 5px;background:#f0fdf4;border-color:#86efac}.metric b{font-size:18px;line-height:1.05}h2{font-size:13.5px;margin:11px 0 6px;color:#0f172a;display:flex;align-items:center;gap:7px}h2:before{counter-increment:sec;content:counter(sec);width:18px;height:18px;border-radius:6px;background:#dcfce7;color:#15803d;display:inline-grid;place-items:center;font-size:10px;font-weight:900}.section{margin-top:8px;break-inside:auto}.executive{background:#f8fafc;border:1px solid #dbe4ef;border-radius:12px;padding:9px 11px}.executive p{margin:3px 0 0;color:#334155}.execGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:7px}.execGrid div{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px}.execGrid span{display:block;color:#64748b;font-size:8.5px;font-weight:800;text-transform:uppercase}.execGrid b{display:block;margin-top:2px;font-size:12px}.attention{border:1px solid #fed7aa;background:#fff7ed;border-radius:12px;padding:8px 11px}.attention ul{margin:4px 0 0;padding-left:17px}.attention li{margin:2px 0}.mapBox{height:198px;margin-top:5px}.mapBox img{object-fit:fill!important}.mapKey{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.mapKey div{padding:5px}.mapKey small{font-size:8px}table{font-size:9.2px}thead{display:table-header-group}th{font-size:9px;letter-spacing:.02em}th,td{padding:4px 5px}td small{font-size:8.4px}.visit article{padding:6px 8px;margin:5px 0}.signature{margin-top:26px}.footer{margin-top:12px}.cover,.grid,.metrics,.executive,.mapBox,.mapKey,.signature{break-inside:avoid}@media print{.mapBox{height:190px}.section{break-inside:auto}.mapSection{break-inside:auto}.footer{position:static}}</style>`;
    const technicalMapCss=`<style>.technicalMapPrint{isolation:isolate}.technicalMapPrint:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.02),rgba(15,23,42,.10));pointer-events:none}.mapTechPin{--pin:#f59e0b;position:absolute;transform:translate(-50%,-92%);z-index:3;display:flex;flex-direction:column;align-items:center;gap:2px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.42))}.mapTechPin i{position:relative;width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:var(--pin);color:#fff;border:2px solid #fff;font-size:14px;font-style:normal;font-weight:900;line-height:1}.mapTechPin i:after{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid var(--pin)}.mapTechPin em{max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(255,255,255,.95);border:1px solid #dbe4ef;border-radius:8px;padding:2px 6px;color:#0f172a;font-size:7.5px;font-style:normal;font-weight:900}.mapTechPin.farm{--pin:#e11d48}.mapTechPin.antenna{--pin:#16a34a}.mapTechPin.processor{--pin:#2563eb}.mapTechPin.other{--pin:#f59e0b}.mapStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:6px}.mapStats span{border:1px solid #dbe4ef;background:#f8fafc;border-radius:9px;padding:5px 7px;color:#475569;font-size:8.5px}.mapStats b{display:block;color:#0f172a;font-size:11px}.mapKey{margin-top:6px}.mapKey b.farm{background:#e11d48}.mapKey b.antenna{background:#16a34a}.mapKey b.processor{background:#2563eb}.mapKey b.other{background:#f59e0b}@media print{.mapTechPin i{width:24px;height:24px;font-size:12px}.mapTechPin em{font-size:7px}.mapStats{break-inside:avoid}}</style>`;
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório técnico - ${safe(farm.nome)}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:0;background:#fff;font-size:11.5px;line-height:1.35}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0f172a;padding-bottom:12px;break-inside:avoid}.brand{display:flex;align-items:center;gap:10px}.brand img{width:40px;height:40px}.brand b{font-size:20px}.brand span{display:block;color:#16a34a;font-weight:800}.doccode{text-align:right;color:#64748b}.cover{margin:14px 0;padding:18px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#14532d);color:#fff;break-inside:avoid}.cover small{letter-spacing:.15em;color:#86efac;font-weight:800}.cover h1{font-size:28px;margin:6px 0 3px}.status{display:inline-block;margin-top:8px;padding:6px 10px;border:1px solid #ffffff44;border-radius:999px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.box{border:1px solid #dbe4ef;border-radius:10px;padding:8px;background:#f8fafc}.box b,.box span{display:block}.box span{color:#475569;margin-top:2px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;break-inside:avoid}.metric{border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:10px;text-align:center}.metric b{font-size:21px;color:#15803d;display:block}h2{font-size:16px;margin:18px 0 7px;border-bottom:1px solid #dbe4ef;padding-bottom:5px}.section{break-inside:auto}.mapBox{position:relative;height:260px;border:1px solid #dbe4ef;border-radius:14px;overflow:hidden;background:#eef2f7;break-inside:avoid}.mapBox img{width:100%;height:100%;object-fit:fill;display:block}.mapPin{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:900;border:2px solid #fff;box-shadow:0 3px 10px #0008;font-size:11px}.mapPin.farm{background:#e11d48}.mapPin.antenna{background:#16a34a}.mapPin.processor{background:#2563eb}.mapPin.other{background:#f59e0b}.mapKey{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px;break-inside:avoid}.mapKey div{border:1px solid #dbe4ef;border-radius:10px;padding:7px;display:grid;grid-template-columns:26px 1fr;column-gap:7px}.mapKey b{grid-row:1/3;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff}.mapKey b.farm{background:#e11d48}.mapKey b.antenna{background:#16a34a}.mapKey b.processor{background:#2563eb}.mapKey b.other{background:#f59e0b}.mapKey span{font-weight:800}.mapKey small{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:7px;page-break-inside:auto}tr{break-inside:avoid;page-break-inside:avoid}th{background:#0f172a;color:#fff;text-align:left}th,td{padding:6px;border:1px solid #dbe4ef;vertical-align:top;font-size:10.5px}td small{display:block;color:#64748b;margin-top:2px}.visit article{border-left:4px solid #16a34a;background:#f8fafc;padding:8px 10px;margin:7px 0;break-inside:avoid}.visit h3{margin:0 0 3px}.visit p{margin:3px 0}.warn{background:#fffbeb;border-left:3px solid #f59e0b;padding:5px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:46px;margin-top:42px;break-inside:avoid}.signature div{border-top:1px solid #334155;text-align:center;padding-top:7px;color:#64748b}.footer{margin-top:20px;border-top:1px solid #dbe4ef;padding-top:6px;color:#64748b;display:flex;justify-content:space-between;font-size:10px;break-inside:avoid}@media print{.noPrint{display:none}}</style></head><body><header class="top"><div class="brand"><img src="/logo-symbol.svg" alt=""><div><b>ControlTech</b><span>Assist</span></div></div><div class="doccode"><b>RELATÓRIO TÉCNICO</b><br>Emissão: ${safe(new Date().toLocaleString('pt-BR'))}<br>Versão ${APP_VERSION}</div></header><section class="cover"><small>INSTALAÇÃO E CAMPO</small><h1>${safe(farm.nome)}</h1><p>${safe(farm.cidade||'Cidade não informada')} / ${safe(getFarmUF(farm)||'-')}</p><span class="status">${safe(displayStatus)}</span></section><section class="grid"><div class="box"><b>Central</b><span>${safe(farm.central)}</span></div><div class="box"><b>Regional</b><span>${safe(farm.regional_nome)}</span></div><div class="box"><b>Veterinário/Apoio</b><span>${safe(farm.veterinario_apoio)}</span></div><div class="box"><b>Responsável</b><span>${safe(farm.responsavel)}</span></div><div class="box"><b>Telefone</b><span>${safe(farm.telefone)}</span></div><div class="box"><b>Endereço</b><span>${safe(farm.endereco)}</span></div><div class="box"><b>Inicio do servico</b><span>${safe(brDateTime(farm.servico_inicio_em))}</span></div><div class="box"><b>Fim do servico</b><span>${safe(brDateTime(farm.servico_fim_em))}</span></div><div class="box"><b>Responsavel tecnico</b><span>${safe(farm.servico_responsavel)}</span></div></section><section class="metrics"><div class="metric"><b>${predicted}</b>Colares previstos</div><div class="metric"><b>${installed}</b>Instalados</div><div class="metric"><b>${delivered}</b>Entregues</div><div class="metric"><b>${equips.length}</b>Equipamentos</div><div class="metric"><b>${safe(serviceDurationLabel(farm))}</b>Duracao</div></section><section class="section"><h2>Resumo executivo</h2><p>${safe('Instalação registrada no ControlTech Assist. Dados restritos e credenciais não entram neste documento.')}</p></section>${points.length?`<section class="section"><h2>Mapa técnico da instalação</h2><div class="mapBox"><img src="${mapImg}" alt="Mapa técnico">${markerHtml}</div><div class="mapKey">${mapKey}</div></section>`:''}${opts.equip?`<section><h2>Equipamentos e coordenadas</h2><table><thead><tr><th>#</th><th>Equipamento</th><th>Local</th><th>Coordenadas</th><th>Raio</th></tr></thead><tbody>${equipmentRows||'<tr><td colspan="5">Nenhum equipamento registrado.</td></tr>'}</tbody></table></section>`:''}${opts.visits?`<section><h2>Histórico de visitas</h2><div class="visit">${visitRows||'<p>Nenhuma visita registrada.</p>'}</div></section>`:''}${opts.evidencias?evidenceSectionHtml:''}${opts.checks?`<section><h2>Checklists</h2><table><thead><tr><th>Data</th><th>Checklist</th><th>Status</th><th>Observações</th></tr></thead><tbody>${checkRows||'<tr><td colspan="4">Nenhum checklist registrado.</td></tr>'}</tbody></table></section>`:''}<section class="signature"><div>Responsável técnico</div><div>Coordenação / Cliente</div></section><footer class="footer"><span>ControlTech Assist - Documento técnico de campo</span><span>${safe(farm.nome)}</span></footer><script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body></html>`;
    const polishedHtml=html.replace('</head>',`${printPolish}${technicalMapCss}</head>`).replace(/<section class="section"><h2>Resumo executivo<\/h2><p>[\s\S]*?<\/p><\/section>/,`${executiveHtml}${attentionHtml}`).replace(/<section class="section"><h2>Mapa técnico da instalação<\/h2>[\s\S]*?<\/section>/,technicalMapHtml).replaceAll('Inicio do servico','Início do serviço').replaceAll('Fim do servico','Fim do serviço').replaceAll('Responsavel tecnico','Responsável técnico').replaceAll('Duracao','Duração');
    const win=window.open('','_blank');if(!win){notify('Permita pop-ups para gerar o relatório.','error');return;}win.document.write(polishedHtml);win.document.close();
  };
  const share=async()=>{
    const text=`RELATÓRIO TÉCNICO — ${farm.nome}\nEscopo: ${reportScopeLabel}\n${farm.cidade||''} / ${getFarmUF(farm)}\nCentral: ${farm.central||'-'}\nRegional: ${farm.regional_nome||'-'}\nStatus: ${displayStatus}\nServico: ${brDateTime(farm.servico_inicio_em)} ate ${brDateTime(farm.servico_fim_em)} (${serviceDurationLabel(farm)})\nColares: ${collarBreakdown(farm)}\nEquipamentos: ${equips.length}\nEvidências: ${reportEvidencias.length}\nPendências: ${pendingCount}`;
    try{if(navigator.share)await navigator.share({title:`Relatório técnico - ${farm.nome}`,text});else{await navigator.clipboard.writeText(text);notify('Resumo copiado para compartilhar.')}}catch{}
  };
  const optionControls=<div className="reportOptions compact">{reportOptions.map(([k,l,Icon,count])=><label className={`reportOption ${opts[k]?'active':''}`} key={k}><input type="checkbox" checked={opts[k]} onChange={()=>toggle(k)}/><span><Icon size={17}/><b>{l}</b><small>{count}</small></span></label>)}</div>;
  return <section className="panel reportPanel reportComposer"><div className="reportControl noPrint"><div className="reportControlTop"><div className="reportControlTitle"><span className="eyebrow">Relatório</span><h2><FileText size={22}/> Técnico</h2></div><div className="reportControlHeaderActions"><div className="reportControlStatus"><b>{enabledSections}/5</b><span>seções</span></div><div className="reportFilterWrap"><button type="button" className={`reportFilterButton ${filtersOpen?'active':''}`} onClick={()=>setFiltersOpen(v=>!v)} aria-label="Filtros do relatório" title="Filtros do relatório"><Filter size={18}/></button>{filtersOpen&&<div className="reportFilterMenu"><div className="reportOptionHead"><b>Filtros do relatório</b><button type="button" onClick={()=>setFiltersOpen(false)} aria-label="Fechar filtros"><X size={16}/></button></div><div className="reportScopePicker"><button type="button" className={visitScope==='all'?'active':''} onClick={()=>setVisitScope('all')}><FileText size={16}/><span><b>Geral</b><small>Todas as visitas</small></span></button><button type="button" className={visitScope==='single'?'active':''} onClick={()=>setVisitScope('single')} disabled={!sortedVisits.length}><CalendarDays size={16}/><span><b>Por visita</b><small>{sortedVisits.length} visita(s)</small></span></button></div>{visitScope==='single'&&sortedVisits.length>0&&<Field label="Selecionar visita"><select className="reportVisitSelect" value={activeVisitId} onChange={e=>setVisitId(e.target.value)}>{sortedVisits.map(v=><option key={v.id} value={v.id}>{v.tipo||'Visita'} - {brDate(v.data_visita)}</option>)}</select></Field>}<div className="reportFilterDivider"/>{optionControls}</div>}</div></div></div><div className="reportActionGrid"><button className="btn primary reportGenerate" onClick={printReport}><Printer size={19}/><span>Gerar PDF</span></button><button className="btn light" onClick={share}><Share2 size={17}/><span>Compartilhar</span></button><button className="btn light" onClick={exportTsv}><FileDown size={17}/><span>Exportar</span></button></div></div><div className="reportScopeChip noPrint"><CalendarDays size={15}/><span>{reportScopeLabel}</span></div><div className="reportPreviewShell"><div className="reportPreviewTitle noPrint"><span>Prévia</span><b>{farm.nome}</b></div><ReportPreview farm={farm} equips={opts.equip?equips:[]} visits={opts.visits?reportVisits:[]} checks={opts.checks?checks:[]} mapped={mapped} evidencias={opts.evidencias?reportEvidencias:[]}/></div></section>}
function CoberturaAssist(){const [tipo,setTipo]=useState('interna'),[comp,setComp]=useState(120),[larg,setLarg]=useState(40),[obst,setObst]=useState('medio'); const raio=tipo==='externa'?250:75; const diam=raio*2; const precisa=Math.max(1,Math.ceil(num(comp)/diam)*Math.ceil(num(larg)/diam)); const risco=obst==='alto'?'Alto':obst==='medio'?'Médio':'Baixo'; return <section className="panel"><div className="sectionTitle"><h2><Ruler size={20}/> Planejador rápido de antena</h2><span className="pill">apoio de campo</span></div><div className="grid4"><Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="interna">Interna</option><option value="externa">Externa</option></select></Field><Field label="Comprimento aproximado (m)"><input type="number" value={comp} onChange={e=>setComp(e.target.value)}/></Field><Field label="Largura aproximada (m)"><input type="number" value={larg} onChange={e=>setLarg(e.target.value)}/></Field><Field label="Obstáculos"><select value={obst} onChange={e=>setObst(e.target.value)}><option value="baixo">Baixo</option><option value="medio">Médio</option><option value="alto">Alto/metálico</option></select></Field></div><div className="coverageResult"><RadioTower size={28}/><div><b>Estimativa inicial: {precisa} antena(s)</b><span>Raio usado: {raio} m • risco de interferência: {risco}. Validar com Reader/Tags analysis antes de encerrar.</span></div></div></section>}

function Instalacao({data}){
  const [farmId,setFarmId]=useState(''),[templateId,setTemplateId]=useState('pre'),[checked,setChecked]=useState({}),[obs,setObs]=useState('');
  useEffect(()=>{if(!farmId&&data.fazendas[0])setFarmId(data.fazendas[0].id)},[data.fazendas.length,farmId]);
  const farm=data.fazendas.find(f=>f.id===farmId);
  const template=QUICK_CHECKLISTS.find(t=>t.id===templateId)||QUICK_CHECKLISTS[0];
  const done=template.items.filter((_,i)=>checked[i]).length;
  const save=async()=>{if(!farm){notify('Selecione uma fazenda para salvar o checklist.','warning');return;}const items=template.items.map((label,i)=>({label,ok:Boolean(checked[i])}));await data.saveChecklist({id:uid(),fazenda_id:farm.id,tipo:template.id,titulo:template.title,itens_json:items,status:items.every(i=>i.ok)?'Completo':'Parcial',observacoes:obs,created_at:nowISO()});setChecked({});setObs('');notify('Checklist de instalação salvo na fazenda.');};
  const pending=data.fazendas.filter(f=>isOpenFarmStatus(farmStatus(f)));
  return <div><PageHead eyebrow="Instalação guiada" title="Executar instalação em campo"><select value={farmId} onChange={e=>setFarmId(e.target.value)}><option value="">Selecione a fazenda...</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select></PageHead><div className="statsGrid"><Stat icon={Route} label="fazendas em aberto" value={pending.length}/><Stat icon={Cpu} label="equipamentos" value={data.equipamentos.length}/><Stat icon={ClipboardCheck} label="checklists salvos" value={data.checklists.length}/><Stat icon={CalendarDays} label="visitas" value={data.visitas.length}/></div>{!data.fazendas.length&&<Empty icon={Building2} title="Nenhuma fazenda cadastrada" text="Cadastre uma fazenda antes de iniciar uma instalação guiada."/>}{farm&&<section className="panel installFocus"><div><span className="eyebrow">Fazenda selecionada</span><h2>{farm.nome}</h2><p>{farm.cidade||'Cidade não informada'} • {farm.central||'Central não informada'} • {farmStatus(farm)}</p></div><div className="installBadges"><span>{data.equipamentos.filter(e=>e.fazenda_id===farm.id).length} equipamento(s)</span><span>{data.visitas.filter(v=>v.fazenda_id===farm.id).length} visita(s)</span></div></section>}<section className="panel"><div className="sectionTitle"><div><h2><ClipboardList size={20}/> Checklist de instalação</h2></div><select value={templateId} onChange={e=>{setTemplateId(e.target.value);setChecked({})}}>{QUICK_CHECKLISTS.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></div><div className="manualSource">{template.source}</div><div className="progress"><span style={{width:`${template.items.length?Math.round(done/template.items.length*100):0}%`}}/></div><div className="checkPanel">{template.items.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(checked[i])} onChange={()=>setChecked({...checked,[i]:!checked[i]})}/><span>{item}</span></label>)}</div><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações rápidas da instalação"/><button className="btn primary" onClick={save} disabled={!farm}><Save size={17}/> Salvar checklist na fazenda</button></section><CoberturaAssist/><section className="panel"><div className="sectionTitle"><h2>Fazendas em andamento</h2></div><div className="list">{pending.slice(0,6).map(f=><div className="listItem" key={f.id}><Route size={19}/><div><b>{f.nome}</b><span>{f.cidade||'-'} • {farmStatus(f)} • {data.equipamentos.filter(e=>e.fazenda_id===f.id).length} equipamento(s)</span></div></div>)}</div>{!pending.length&&<Empty icon={CheckCircle2} title="Nada pendente" text="Não há fazendas em aberto pelos status atuais."/>}</section></div>
}

function Diagnostico({data}){const [tab,setTab]=useState('sintomas'); const tabs=[['sintomas',HelpCircle,'Sintomas'],['leds',Cpu,'LEDs'],['can',AlertTriangle,'CAN bus'],['suporte',LifeBuoy,'Antes do suporte']]; return <div><PageHead eyebrow="Diagnóstico técnico" title="Resolver problema no campo"/><div className="tabs">{tabs.map(([id,Icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>{tab==='sintomas'&&<Sintomas data={data}/>} {tab==='leds'&&<LedDiag/>} {tab==='can'&&<CanDiag/>} {tab==='suporte'&&<AntesSuporte data={data}/>}</div>}
function Sintomas({data}){const [q,setQ]=useState(''),[selected,setSelected]=useState(SYMPTOMS[0]),[farm,setFarm]=useState(''),[obs,setObs]=useState(''); const list=SYMPTOMS.filter(s=>[s.title,s.category,s.cause].join(' ').toLowerCase().includes(q.toLowerCase())); const save=()=>{data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:selected.category,sintoma:selected.title,resultado:selected.cause,acoes_realizadas:selected.action,observacoes:obs,created_at:nowISO()}); setObs(''); notify('Diagnóstico registrado.')}; return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar sintoma..."/></div></div><div className="diagLayout"><div className="diagList">{list.map(s=>{const I=s.icon;return <button key={s.id} className={selected.id===s.id?'active':''} onClick={()=>setSelected(s)}><I size={18}/><span><b>{s.title}</b><small>{s.category}</small></span></button>})}</div><div className="diagDetail"><span className="pill">{selected.category}</span><h2>{selected.title}</h2><p className="cause">{selected.cause}</p><h3>O que verificar</h3><ol>{selected.checks.map(c=><li key={c}>{c}</li>)}</ol><div className="callout"><b>Próxima ação:</b> {selected.action}</div><p className="sourceText">{selected.source}</p><div className="saveDiag"><select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="O que você fez no campo?"/><button className="btn primary" onClick={save}><Save size={17}/> Registrar diagnóstico</button></div></div></div></section>}
function LedDiag(){const [q,setQ]=useState(''); const list=LED_DIAGNOSTICS.filter(l=>[l.led,l.cor,l.modo,l.estado,l.acao].join(' ').toLowerCase().includes(q.toLowerCase())); return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar LED, cor ou modo..."/></div></div><div className="ledGrid">{list.map((l,i)=><div className="ledCard" key={i}><div className={`ledDot ${l.cor.toLowerCase().includes('verde')?'green':l.cor.toLowerCase().includes('vermelho')?'red':l.cor.toLowerCase().includes('laranja')?'orange':l.cor.toLowerCase().includes('azul')?'blue':''}`}/><h3>{l.led}</h3><p><b>{l.cor}</b> • {l.modo}</p><span>{l.estado}</span><small>{l.acao}</small></div>)}</div><p className="sourceText">{SOURCES.vp8002}</p></section>}
function CanDiag(){const [q,setQ]=useState(''); const list=CAN_ERRORS.filter(c=>[c.code,c.bus,c.desc,c.solution].join(' ').toLowerCase().includes(q.toLowerCase())); return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Digite código, ex: 02, 09, 16..."/></div></div><div className="canGrid">{list.map(c=><div className="canCard" key={c.code}><b>{c.code}</b><span>{c.bus}</span><h3>{c.desc}</h3><p>{c.solution}</p></div>)}</div><p className="sourceText">{SOURCES.vp8002}</p></section>}
function AntesSuporte({data}){const [checked,setChecked]=useState({}),[farm,setFarm]=useState(''),[obs,setObs]=useState(''); const done=SUPPORT_CHECKS.filter((_,i)=>checked[i]).length; const save=()=>{data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:'Antes de chamar suporte',sintoma:'Checklist de suporte',resultado:`${done}/${SUPPORT_CHECKS.length} itens conferidos`,acoes_realizadas:SUPPORT_CHECKS.filter((_,i)=>checked[i]).join('; '),observacoes:obs,created_at:nowISO()}); notify('Checklist de suporte registrado.')}; return <section className="panel"><div className="supportHead"><LifeBuoy size={28}/><div><h2>Antes de chamar suporte</h2></div><div className="circleProgress"><b>{done}</b><span>/{SUPPORT_CHECKS.length}</span></div></div><div className="checkPanel">{SUPPORT_CHECKS.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(checked[i])} onChange={()=>setChecked({...checked,[i]:!checked[i]})}/><span>{item}</span></label>)}</div><div className="saveDiag"><select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Resumo para enviar ao suporte"/><button className="btn primary" onClick={save}><Save size={17}/> Registrar checklist</button></div></section>}

function Guia(){return <div><PageHead eyebrow="Base técnica offline" title="Guia rápido"/><div className="knowledgeGrid">{INSTALL_GUIDES.map(g=>{const I=g.icon;return <article className="knowledge" key={g.id}><I size={28}/><h3>{g.title}</h3><p>{g.desc}</p><span>{g.source}</span>{g.phases.map(p=><details key={p.title}><summary>{p.title}</summary><ul>{p.items.map(i=><li key={i}>{i}</li>)}</ul></details>)}</article>})}</div></div>}
function ProductivityBars({rows,suffix='',decimals=0}){
  const max=Math.max(1,...rows.map(r=>Number(r.value)||0));
  return <div className="prodBars">{rows.map(r=>{const value=Number(r.value)||0;const width=Math.max(value?8:0,Math.round(value/max*100));return <div className="prodBar" key={r.label}><span>{r.label}</span><div><i style={{width:`${width}%`}}/></div><b>{value.toFixed(decimals)}{suffix}</b></div>})}</div>
}

function ProductivityLineChart({rows,suffix=' h',decimals=1}){
  const values=rows.map(r=>Number(r.value)||0), hasData=values.some(Boolean), max=Math.max(1,...values);
  if(!hasData) return <div className="lineEmpty"><BarChart3 size={24}/><span>Sem dados no período filtrado</span></div>;
  const width=640,height=230,padX=42,top=28,bottom=44,plotH=height-top-bottom,plotW=width-(padX*2);
  const points=rows.map((r,i)=>{const x=padX+(rows.length===1?plotW/2:(i*plotW)/(rows.length-1));const value=Number(r.value)||0;const y=top+(plotH-(value/max)*plotH);return {...r,value,x,y}});
  const line=points.map(p=>`${p.x},${p.y}`).join(' ');
  const area=`${padX},${height-bottom} ${line} ${width-padX},${height-bottom}`;
  return <div className="lineChart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Grafico de linha de produtividade">
    {[0,.25,.5,.75,1].map(t=><line key={t} className="lineGrid" x1={padX} x2={width-padX} y1={top+(plotH*t)} y2={top+(plotH*t)}/>)}
    <polygon className="lineArea" points={area}/>
    <polyline className="lineStroke" points={line}/>
    {points.map((p,i)=><g key={p.label}><circle className="lineDot" cx={p.x} cy={p.y} r={5}/>{p.value>0&&<text className="lineValue" x={p.x} y={Math.max(14,p.y-10)} textAnchor="middle">{p.value.toFixed(decimals)}{suffix}</text>}<text className="lineMonth" x={p.x} y={height-15} textAnchor="middle">{i%2===0||rows.length<=6?p.label:''}</text></g>)}
  </svg></div>
}

function Produtividade({data,onOpen}){
  const [year,setYear]=useState('Todos'),[month,setMonth]=useState('Todos'),[central,setCentral]=useState('Todas'),[resp,setResp]=useState('Todos');
  const [workStart,setWorkStart]=useState(DEFAULT_WORKDAY.start),[workEnd,setWorkEnd]=useState(DEFAULT_WORKDAY.end),[lunchMinutes,setLunchMinutes]=useState(DEFAULT_WORKDAY.lunchMinutes),[includeWeekends,setIncludeWeekends]=useState(false);
  const workConfig={start:workStart||DEFAULT_WORKDAY.start,end:workEnd||DEFAULT_WORKDAY.end,lunchMinutes:num(lunchMinutes),includeWeekends};
  const concluded=data.fazendas.filter(f=>f.servico_inicio_em&&f.servico_fim_em&&serviceHours(f)>0);
  const years=[...new Set(concluded.map(f=>new Date(f.servico_fim_em).getFullYear()).filter(Boolean))].sort((a,b)=>b-a);
  const responsaveis=[...new Set(data.fazendas.map(f=>f.servico_responsavel||f.regional_nome||f.responsavel).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const monthNames=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const dailyHours=Math.max(workdayHours(workConfig),0.1);
  const workedHoursFor=f=>businessHoursBetween(f.servico_inicio_em,f.servico_fim_em,workConfig);
  const activeHoursFor=f=>businessHoursBetween(f.servico_inicio_em,null,workConfig);
  const collarsFor=f=>num(f.qtd_colares_instalada||f.qtd_colares_prevista);
  const matchFarm=f=>{
    const end=f.servico_fim_em?new Date(f.servico_fim_em):null;
    const owner=f.servico_responsavel||f.regional_nome||f.responsavel||'';
    return (year==='Todos'||(end&&String(end.getFullYear())===String(year)))
      && (month==='Todos'||(end&&String(end.getMonth()+1)===String(month)))
      && (central==='Todas'||(f.central||'')===central||(!f.central&&central.startsWith('Outra')))
      && (resp==='Todos'||owner===resp);
  };
  const farms=concluded.filter(matchFarm).filter(f=>workedHoursFor(f)>0).sort((a,b)=>new Date(b.servico_fim_em)-new Date(a.servico_fim_em));
  const inProgress=data.fazendas.filter(f=>f.servico_inicio_em&&!f.servico_fim_em);
  const totalHours=farms.reduce((a,f)=>a+workedHoursFor(f),0);
  const totalElapsedHours=farms.reduce((a,f)=>a+serviceHours(f),0);
  const totalCollars=farms.reduce((a,f)=>a+collarsFor(f),0);
  const avgHours=farms.length?totalHours/farms.length:0;
  const avgLabel=avgHours?`${avgHours.toFixed(1)} h úteis`:'-';
  const collarsPerDay=totalHours?totalCollars/(totalHours/dailyHours):0;
  const monthlyBase=concluded.filter(f=>{
    const end=new Date(f.servico_fim_em);
    const owner=f.servico_responsavel||f.regional_nome||f.responsavel||'';
    return (year==='Todos'||String(end.getFullYear())===String(year))
      && (central==='Todas'||(f.central||'')===central||(!f.central&&central.startsWith('Outra')))
      && (resp==='Todos'||owner===resp);
  });
  const monthlyHours=monthNames.map((label,i)=>({label,value:monthlyBase.filter(f=>new Date(f.servico_fim_em).getMonth()===i).reduce((a,f)=>a+workedHoursFor(f),0)}));
  const monthlyCount=monthNames.map((label,i)=>({label,value:monthlyBase.filter(f=>new Date(f.servico_fim_em).getMonth()===i).length}));
  const buckets=[['0-100',0,100],['101-250',101,250],['251-500',251,500],['501+',501,Infinity]].map(([label,min,max])=>{
    const list=farms.filter(f=>{const collars=collarsFor(f);return collars>=min&&collars<=max;});
    return {label,value:list.length?list.reduce((a,f)=>a+workedHoursFor(f),0)/list.length/dailyHours:0};
  });
  const exportData=()=>{const jornada=`${workConfig.start}-${workConfig.end}; almoço ${workConfig.lunchMinutes} min; ${workConfig.includeWeekends?'inclui finais de semana':'dias úteis'}`;const rows=[['Fazenda','Central','Cidade','Responsavel produtividade','Inicio','Fim','Horas uteis','Dias uteis equivalentes','Tempo corrido horas','Colares instalados','Colares previstos','Colares por dia util','Jornada considerada'],...farms.map(f=>{const useful=workedHoursFor(f),collars=collarsFor(f);return [f.nome,f.central,f.cidade,f.servico_responsavel||f.regional_nome||f.responsavel,brDateTime(f.servico_inicio_em),brDateTime(f.servico_fim_em),useful.toFixed(2),(useful/dailyHours).toFixed(2),serviceHours(f).toFixed(2),num(f.qtd_colares_instalada),num(f.qtd_colares_prevista),useful?(collars/(useful/dailyHours)).toFixed(2):'0',jornada]})];download('produtividade-fazendas.tsv',rows.map(r=>r.join(String.fromCharCode(9))).join(String.fromCharCode(10)));};
  return <div>
    <PageHead eyebrow="Produtividade" title="Controle de produtividade"><button className="btn light" onClick={exportData}><Download size={18}/> Exportar análise</button></PageHead>
    <div className="statsGrid"><Stat icon={Building2} label="fazendas concluídas" value={farms.length}/><Stat icon={Clock} label="média por fazenda" value={avgLabel}/><Stat icon={Hash} label="colares/dia útil" value={collarsPerDay?collarsPerDay.toFixed(1):'-'} tone="green"/><Stat icon={PlayCircle} label="em andamento" value={inProgress.length}/></div>
    <section className="panel productivityFilters">
      <div className="sectionTitle"><div><h2><Filter size={20}/> Filtros</h2></div></div>
      <div className="grid4"><Field label="Ano"><select value={year} onChange={e=>setYear(e.target.value)}><option>Todos</option>{years.map(y=><option key={y}>{y}</option>)}</select></Field><Field label="Mês"><select value={month} onChange={e=>setMonth(e.target.value)}><option>Todos</option>{monthNames.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></Field><Field label="Central"><select value={central} onChange={e=>setCentral(e.target.value)}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Responsável"><select value={resp} onChange={e=>setResp(e.target.value)}><option>Todos</option>{responsaveis.map(r=><option key={r}>{r}</option>)}</select></Field></div>
      <div className="workdayPanel">
        <div className="workdayIntro"><span className="eyebrow">Jornada usada no cálculo</span><h3>{workConfig.start} - {workConfig.end} • {dailyHours.toFixed(1)} h/dia</h3><p>Não é controle de ponto. É uma régua padrão para comparar fazendas de períodos diferentes sem contar noite, espera fora da jornada ou dias sem trabalho.</p></div>
        <Field label="Início"><input type="time" value={workStart} onChange={e=>setWorkStart(e.target.value)}/></Field>
        <Field label="Fim"><input type="time" value={workEnd} onChange={e=>setWorkEnd(e.target.value)}/></Field>
        <Field label="Almoço (min)"><input type="number" min="0" max="240" step="15" value={lunchMinutes} onChange={e=>setLunchMinutes(e.target.value)}/></Field>
        <label className="workdayToggle"><input type="checkbox" checked={includeWeekends} onChange={e=>setIncludeWeekends(e.target.checked)}/><span>Incluir fins de semana</span></label>
      </div>
    </section>
    <div className="productivityGrid">
      <section className="panel prodChart"><div className="sectionTitle"><div><h2><BarChart3 size={20}/> Horas úteis por mês</h2></div><span className="pill">{(totalHours/dailyHours).toFixed(1)} dias úteis</span></div><ProductivityLineChart rows={monthlyHours}/></section>
      <section className="panel prodChart"><div className="sectionTitle"><div><h2><Gauge size={20}/> Tempo médio por colares</h2></div></div><ProductivityBars rows={buckets} suffix=" d" decimals={1}/><div className="prodMiniBars"><span>Instalações por mês</span><ProductivityBars rows={monthlyCount}/></div></section>
    </div>
    <section className="panel prodInsight"><div className="sectionTitle"><div><h2><ScanLine size={20}/> Leitura rápida</h2></div></div><div className="insightGrid"><div><span>Horas úteis no filtro</span><b>{totalHours?`${totalHours.toFixed(1)} h`:'-'}</b></div><div><span>Dias úteis equivalentes</span><b>{totalHours?(totalHours/dailyHours).toFixed(1):'-'}</b></div><div><span>Tempo corrido registrado</span><b>{totalElapsedHours?`${totalElapsedHours.toFixed(1)} h`:'-'}</b></div><div><span>Média de colares/fazenda</span><b>{farms.length?(totalCollars/farms.length).toFixed(1):'-'}</b></div></div></section>
    <section className="panel"><div className="sectionTitle"><div><h2><ClipboardList size={20}/> Fazendas analisadas</h2></div><span className="pill">{totalCollars} colares</span></div>{farms.length?<div className="prodTable"><table><thead><tr><th>Fazenda</th><th>Período</th><th>Horas úteis</th><th>Tempo corrido</th><th>Colares/dia útil</th><th>Responsável</th><th></th></tr></thead><tbody>{farms.map(f=>{const useful=workedHoursFor(f),collars=collarsFor(f);return <tr key={f.id}><td><b>{f.nome}</b><span>{f.cidade||'-'} • {f.central||'-'}</span></td><td>{brDate(f.servico_inicio_em)}<span>até {brDate(f.servico_fim_em)}</span></td><td>{workDurationLabel(useful,workConfig)}</td><td>{serviceDurationLabel(f)}</td><td>{useful?(collars/(useful/dailyHours)).toFixed(1):'-'}<span>{collars} colares</span></td><td>{f.servico_responsavel||f.regional_nome||f.responsavel||'-'}</td><td><button className="btn light" onClick={()=>onOpen(f.id)}>Abrir</button></td></tr>})}</tbody></table></div>:<Empty icon={Clock} title="Sem dados de produtividade" text="Abra uma fazenda e registre início e fim do serviço para gerar os gráficos."/>}</section>
    {inProgress.length>0&&<section className="panel"><div className="sectionTitle"><div><h2><PlayCircle size={20}/> Serviços em andamento</h2></div></div><div className="serviceOpenList">{inProgress.map(f=><button key={f.id} onClick={()=>onOpen(f.id)}><Clock size={18}/><span><b>{f.nome}</b><small>{brDateTime(f.servico_inicio_em)} • {workDurationLabel(activeHoursFor(f),workConfig)}</small></span></button>)}</div></section>}
  </div>
}

function Relatorios({data}){
  const today=new Date(),pad=n=>String(n).padStart(2,'0');
  const [period,setPeriod]=useState('todos'),[central,setCentral]=useState('Todas'),[status,setStatus]=useState('Todos'),[reportType,setReportType]=useState('geral'),[filtersOpen,setFiltersOpen]=useState(false);
  const [customStart,setCustomStart]=useState(`${today.getFullYear()}-${pad(today.getMonth()+1)}-01`),[customEnd,setCustomEnd]=useState(todayInput());
  const parseDate=v=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d;};
  const rangeFor=()=>{
    const startDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0,0);
    const endDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,59,59,999);
    if(period==='todos')return {start:null,end:null,label:'Todo o histórico'};
    if(period==='mes_anterior'){const s=new Date(today.getFullYear(),today.getMonth()-1,1),e=new Date(today.getFullYear(),today.getMonth(),0);return {start:startDay(s),end:endDay(e),label:s.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})};}
    if(period==='ultimos_30'){const s=new Date(today);s.setDate(s.getDate()-29);return {start:startDay(s),end:endDay(today),label:'Últimos 30 dias'};}
    if(period==='personalizado'){const s=parseDate(`${customStart}T00:00:00`),e=parseDate(`${customEnd}T23:59:59`);return {start:s,end:e,label:`${brDate(customStart)} até ${brDate(customEnd)}`};}
    const s=new Date(today.getFullYear(),today.getMonth(),1),e=new Date(today.getFullYear(),today.getMonth()+1,0);return {start:startDay(s),end:endDay(e),label:s.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})};
  };
  const range=rangeFor();
  const inRange=value=>{if(!range.start&&!range.end)return true;const d=parseDate(value);return Boolean(d&&(!range.start||d>=range.start)&&(!range.end||d<=range.end));};
  const centralMatch=f=>central==='Todas'||(f.central||'')===central||(!f.central&&central.startsWith('Outra'));
  const statusMatch=f=>status==='Todos'||farmStatus(f)===status;
  const farms=data.fazendas.filter(f=>centralMatch(f)&&statusMatch(f));
  const farmIds=new Set(farms.map(f=>f.id));
  const visitsInPeriod=data.visitas.filter(v=>farmIds.has(v.fazenda_id)&&inRange(v.data_visita||v.created_at));
  const visitFarmIds=new Set(visitsInPeriod.map(v=>v.fazenda_id));
  const serviceInPeriod=f=>period==='todos'
    ? Boolean(f.servico_inicio_em||f.servico_fim_em)
    : Boolean(inRange(f.servico_inicio_em)||inRange(f.servico_fim_em));
  const serviceFarms=farms.filter(serviceInPeriod);
  const activeFarms=period==='todos'?farms:farms.filter(f=>serviceInPeriod(f)||visitFarmIds.has(f.id));
  const equips=data.equipamentos.filter(e=>farmIds.has(e.fazenda_id));
  const checks=data.checklists.filter(c=>farmIds.has(c.fazenda_id)&&inRange(c.created_at));
  const evidencias=(data.evidencias||[]).filter(e=>farmIds.has(e.fazenda_id)&&inRange(e.created_at));
  const completed=farms.filter(f=>farmStatus(f)===FARM_STATUS_DONE||f.servico_fim_em);
  const completedInPeriod=serviceFarms.filter(f=>farmStatus(f)===FARM_STATUS_DONE||f.servico_fim_em);
  const inProgress=farms.filter(f=>f.servico_inicio_em&&!f.servico_fim_em);
  const notStarted=farms.filter(f=>farmStatus(f)==='Não iniciada'&&!f.servico_inicio_em&&!f.servico_fim_em);
  const operationalFarmIds=new Set(farms.filter(f=>!notStarted.some(n=>n.id===f.id)).map(f=>f.id));
  const pendingVisits=visitsInPeriod.filter(v=>v.pendencias);
  const missingGps=equips.filter(e=>!e.latitude||!e.longitude);
  const missingGpsOperational=missingGps.filter(e=>operationalFarmIds.has(e.fazenda_id));
  const incompleteServiceDates=farms.filter(f=>(farmStatus(f)===FARM_STATUS_DONE||f.servico_fim_em)&&(!f.servico_inicio_em||!f.servico_fim_em));
  const collarPendingFarms=farms.filter(collarHasPending);
  const pendingFarms=farms.filter(f=>operationalFarmIds.has(f.id)&&(farmHasPending(f,data)||missingGpsOperational.some(e=>e.fazenda_id===f.id)||incompleteServiceDates.some(item=>item.id===f.id)));
  const installed=farms.reduce((a,f)=>a+collarInstalled(f),0),delivered=farms.reduce((a,f)=>a+collarDelivered(f),0),handled=farms.reduce((a,f)=>a+collarHandled(f),0),planned=farms.reduce((a,f)=>a+num(f.qtd_colares_prevista),0);
  const installedInPeriod=serviceFarms.reduce((a,f)=>a+collarInstalled(f),0);
  const progress=planned?Math.round((handled/planned)*100):0;
  const totalUsefulHours=completedInPeriod.reduce((a,f)=>a+businessHoursBetween(f.servico_inicio_em,f.servico_fim_em,DEFAULT_WORKDAY),0);
  const reportTypes={geral:'Relatório geral',mensal:'Instalações mensais',produtividade:'Produtividade de campo',pendencias:'Pendências operacionais',central:'Resumo por central'};
  const centralRows=CENTRAIS.map(c=>{const list=farms.filter(f=>c==='Outra / Não informado'?(!f.central||!CENTRAIS.slice(0,2).includes(f.central)):f.central===c);return {label:c,count:list.length,done:list.filter(f=>farmStatus(f)===FARM_STATUS_DONE||f.servico_fim_em).length,collars:list.reduce((a,f)=>a+collarInstalled(f),0),handled:list.reduce((a,f)=>a+collarHandled(f),0)}}).filter(r=>r.count||central==='Todas');
  const ownerMap={};completedInPeriod.forEach(f=>{const key=f.servico_responsavel||f.regional_nome||f.responsavel||'Não informado';ownerMap[key]=ownerMap[key]||{label:key,count:0,collars:0,hours:0};ownerMap[key].count+=1;ownerMap[key].collars+=num(f.qtd_colares_instalada);ownerMap[key].hours+=businessHoursBetween(f.servico_inicio_em,f.servico_fim_em,DEFAULT_WORKDAY);});
  const ownerRows=Object.values(ownerMap).sort((a,b)=>b.count-a.count).slice(0,5);
  const groupByMonth=(!range.start&&!range.end)||((range.end-range.start)/86400000)>45;
  const installGroups={};completedInPeriod.forEach(f=>{const d=parseDate(f.servico_fim_em||f.servico_inicio_em);if(!d)return;const key=groupByMonth?`${pad(d.getMonth()+1)}/${String(d.getFullYear()).slice(2)}`:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});installGroups[key]=(installGroups[key]||0)+1;});
  const installRows=Object.entries(installGroups).map(([label,value])=>({label,value})).slice(-12);
  const actionItems=[
    missingGpsOperational.length&&`${missingGpsOperational.length} equipamento(s) sem GPS em fazendas iniciadas`,
    pendingVisits.length&&`${pendingVisits.length} visita(s) com pendência no período`,
    collarPendingFarms.length&&`${collarPendingFarms.length} fazenda(s) com colares sem resolução`,
    incompleteServiceDates.length&&`${incompleteServiceDates.length} fazenda(s) concluída(s) sem datas completas de serviço`,
    inProgress.length&&`${inProgress.length} serviço(s) em andamento`
  ].filter(Boolean);
  const exportData=()=>{const rows=[['Relatório',reportTypes[reportType]],['Período',range.label],['Central',central],['Status',status],[],['Indicador','Valor'],['Fazendas cadastradas no filtro',farms.length],['Fazendas não iniciadas',notStarted.length],['Fazendas com movimento no período',activeFarms.length],['Serviços no período',serviceFarms.length],['Concluídas total',completed.length],['Colares instalados total',installed],['Colares entregues total',delivered],['Colares atendidos total',handled],['Colares instalados no período',installedInPeriod],['Colares previstos total',planned],['Visitas no período',visitsInPeriod.length],['Equipamentos',equips.length],['Equipamentos sem GPS',missingGps.length],[],['Fazenda','Central','Cidade','Status','Inicio','Fim','Duração','Colares instalados','Colares entregues','Colares atendidos','Colares previstos','Restantes reais','Motivo restantes','Equipamentos','Visitas no período','Pendências no período'],...farms.map(f=>{const farmEquips=equips.filter(e=>e.fazenda_id===f.id),farmVisits=visitsInPeriod.filter(v=>v.fazenda_id===f.id);return [f.nome,f.central,f.cidade,farmStatus(f),brDateTime(f.servico_inicio_em),brDateTime(f.servico_fim_em),serviceDurationLabel(f),collarInstalled(f),collarDelivered(f),collarHandled(f),f.qtd_colares_prevista,collarRemaining(f),f.motivo_colares_restantes||'',farmEquips.length,farmVisits.length,farmVisits.filter(v=>v.pendencias).length]})];download('relatorio-gerencial.tsv',rows.map(r=>r.join(String.fromCharCode(9))).join(String.fromCharCode(10)));notify('Relatório gerencial exportado.');};
  const printReport=()=>{
    const safe=v=>String(v===undefined||v===null||String(v).trim()===''?'-':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const rows=serviceFarms.slice(0,28).map(f=>`<tr><td><b>${safe(f.nome)}</b><small>${safe(f.cidade||'Cidade não informada')}</small></td><td>${safe(f.central)}</td><td>${safe(farmStatus(f))}</td><td>${safe(brDate(f.servico_fim_em||f.servico_inicio_em))}</td><td>${safe(collarBreakdown(f))}</td></tr>`).join('');
    const centralTable=centralRows.map(r=>`<tr><td>${safe(r.label)}</td><td>${r.count}</td><td>${r.done}</td><td>${r.collars}</td><td>${r.handled}</td></tr>`).join('');
    const pendingRows=pendingFarms.slice(0,18).map(f=>`<tr><td><b>${safe(f.nome)}</b><small>${safe(f.cidade||'-')} • ${safe(f.central||'-')}</small></td><td>${safe(farmStatus(f))}</td><td>${missingGpsOperational.filter(e=>e.fazenda_id===f.id).length}</td><td>${visitsInPeriod.filter(v=>v.fazenda_id===f.id&&v.pendencias).length}</td></tr>`).join('');
    const prodRows=ownerRows.map(r=>`<tr><td>${safe(r.label)}</td><td>${r.count}</td><td>${r.collars}</td><td>${r.hours?r.hours.toFixed(1):'-'} h</td></tr>`).join('');
    const showInstall=reportType==='geral'||reportType==='mensal';
    const showProd=reportType==='geral'||reportType==='produtividade';
    const showPending=reportType==='geral'||reportType==='pendencias';
    const showCentral=reportType==='geral'||reportType==='central';
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${safe(reportTypes[reportType])}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:0;font-size:11px;line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0f172a;padding-bottom:10px}.brand{display:flex;align-items:center;gap:10px}.brand img{width:34px;height:34px}.brand b{font-size:18px}.brand span{display:block;color:#16a34a;font-weight:900}.meta{text-align:right;color:#64748b}.cover{margin:12px 0;padding:16px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#14532d);color:#fff}.cover small{color:#86efac;font-weight:900;letter-spacing:.12em}.cover h1{margin:6px 0 4px;font-size:26px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:10px 0}.metric{border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:8px;text-align:center}.metric b{display:block;color:#15803d;font-size:19px}h2{font-size:14px;margin:15px 0 7px;border-bottom:1px solid #dbe4ef;padding-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:7px}th{background:#0f172a;color:#fff;text-align:left;font-size:9.5px}th,td{border:1px solid #dbe4ef;padding:6px;vertical-align:top}td small{display:block;color:#64748b;margin-top:2px}.attention{border:1px solid #fed7aa;background:#fff7ed;border-radius:12px;padding:9px 12px}.attention ul{margin:4px 0 0;padding-left:18px}.section{break-inside:auto}.footer{margin-top:16px;border-top:1px solid #dbe4ef;padding-top:6px;color:#64748b;display:flex;justify-content:space-between}</style></head><body><header class="top"><div class="brand"><img src="/logo-symbol.svg" alt=""><div><b>ControlTech</b><span>Assist</span></div></div><div class="meta"><b>RELATÓRIO GERENCIAL</b><br>${safe(new Date().toLocaleString('pt-BR'))}<br>Período: ${safe(range.label)}</div></header><section class="cover"><small>${safe(central==='Todas'?'TODAS AS CENTRAIS':central)}</small><h1>${safe(reportTypes[reportType])}</h1><p>Status: ${safe(status)} • ${farms.length} fazenda(s) cadastrada(s) no filtro • ${activeFarms.length} com movimento no período</p></section><section class="metrics"><div class="metric"><b>${farms.length}</b>Fazendas</div><div class="metric"><b>${serviceFarms.length}</b>Serviços</div><div class="metric"><b>${installed}</b>Instalados</div><div class="metric"><b>${handled}</b>Atendidos</div><div class="metric"><b>${missingGps.length}</b>Sem GPS</div></section>${actionItems.length?`<section class="section attention"><h2>Pontos de atenção</h2><ul>${actionItems.map(i=>`<li>${safe(i)}</li>`).join('')}</ul></section>`:''}${showInstall?`<section class="section"><h2>Serviços e instalações no período</h2><table><thead><tr><th>Fazenda</th><th>Central</th><th>Status</th><th>Data de serviço</th><th>Colares</th></tr></thead><tbody>${rows||'<tr><td colspan="5">Sem serviços registrados no período.</td></tr>'}</tbody></table></section>`:''}${showCentral?`<section class="section"><h2>Resumo por central</h2><table><thead><tr><th>Central</th><th>Fazendas</th><th>Concluídas</th><th>Instalados</th><th>Atendidos</th></tr></thead><tbody>${centralTable||'<tr><td colspan="5">Sem dados.</td></tr>'}</tbody></table></section>`:''}${showProd?`<section class="section"><h2>Produtividade por responsável</h2><table><thead><tr><th>Responsável</th><th>Fazendas</th><th>Colares</th><th>Horas úteis</th></tr></thead><tbody>${prodRows||'<tr><td colspan="4">Sem serviços finalizados no período.</td></tr>'}</tbody></table></section>`:''}${showPending?`<section class="section"><h2>Pendências operacionais</h2><table><thead><tr><th>Fazenda</th><th>Status</th><th>Sem GPS</th><th>Visitas pendentes</th></tr></thead><tbody>${pendingRows||'<tr><td colspan="4">Sem pendências no filtro.</td></tr>'}</tbody></table></section>`:''}<footer class="footer"><span>ControlTech Assist - Relatórios gerenciais</span><span>${safe(range.label)}</span></footer><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
    const win=window.open('','_blank');if(!win){notify('Permita pop-ups para imprimir o relatório.','error');return;}win.document.write(html);win.document.close();
  };
  const filterSummary=[range.label,central,status].filter(Boolean).join(' • ');
  return <div className="managerReports">
    <PageHead eyebrow="Relatórios" title="Relatórios gerenciais"><div className="reportFilterWrap"><button type="button" className={`btn light managerFilterBtn ${filtersOpen?'active':''}`} onClick={()=>setFiltersOpen(v=>!v)}><Filter size={18}/> Filtros</button>{filtersOpen&&<><button type="button" className="managerFilterBackdrop" aria-label="Fechar filtros" onClick={()=>setFiltersOpen(false)}/><div className="reportFilterMenu managerFilterMenu"><div className="reportOptionHead"><b>Filtros gerenciais</b><button type="button" onClick={()=>setFiltersOpen(false)} aria-label="Fechar filtros"><X size={16}/></button></div><Field label="Tipo de relatório"><select value={reportType} onChange={e=>setReportType(e.target.value)}>{Object.entries(reportTypes).map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></Field><div className="grid2"><Field label="Período"><select value={period} onChange={e=>setPeriod(e.target.value)}><option value="todos">Todo histórico</option><option value="mes_atual">Mês atual</option><option value="mes_anterior">Mês anterior</option><option value="ultimos_30">Últimos 30 dias</option><option value="personalizado">Personalizado</option></select></Field><Field label="Central"><select value={central} onChange={e=>setCentral(e.target.value)}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></Field></div>{period==='personalizado'&&<div className="grid2"><Field label="Início"><input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}/></Field><Field label="Fim"><input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}/></Field></div>}<Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field></div></>}</div><button className="btn light" onClick={exportData}><Download size={18}/> Exportar</button><button className="btn primary" onClick={printReport}><Printer size={18}/> Imprimir</button></PageHead>
    <section className="managerHero"><div><span className="eyebrow">Central gerencial</span><h2><FileText size={24}/> {reportTypes[reportType]}</h2><p>{filterSummary}</p></div><div className="managerHeroScore"><b>{progress}%</b><span>progresso total</span></div></section>
    <div className="managerKpis"><article><Building2 size={22}/><span>Fazendas cadastradas</span><b>{farms.length}</b><small>{notStarted.length} não iniciada(s) • {completed.length} concluída(s)</small></article><article><Milk size={22}/><span>Colares atendidos</span><b>{handled}</b><small>{installed} instalados • {delivered} entregues</small></article><article><CalendarDays size={22}/><span>Movimento no período</span><b>{activeFarms.length}</b><small>{visitsInPeriod.length} visita(s)</small></article><article><Cpu size={22}/><span>Equipamentos</span><b>{equips.length}</b><small>{missingGps.length} sem GPS</small></article></div>
    <div className="managerGrid">
      <section className="panel managerMainPanel"><div className="sectionTitle"><div><h2><BarChart3 size={20}/> Serviços no período</h2></div><span className="pill">{range.label}</span></div>{installRows.length?<ProductivityBars rows={installRows}/>:<Empty icon={BarChart3} title="Sem serviços finalizados" text="Nenhuma instalação finalizada dentro do período selecionado."/>}<div className="managerSummaryStrip"><div><span>Serviços</span><b>{serviceFarms.length}</b></div><div><span>Horas úteis</span><b>{totalUsefulHours?`${totalUsefulHours.toFixed(1)} h`:'-'}</b></div><div><span>Evidências</span><b>{evidencias.length}</b></div></div></section>
      <section className="panel managerSidePanel"><div className="sectionTitle"><div><h2><AlertTriangle size={20}/> Pontos de atenção</h2></div></div>{actionItems.length?<div className="managerActionList">{actionItems.map(item=><div key={item}><AlertTriangle size={16}/><span>{item}</span></div>)}</div>:<Empty icon={CheckCircle2} title="Sem alertas" text="Nenhuma pendência relevante no filtro."/>}</section>
      <section className="panel managerMainPanel"><div className="sectionTitle"><div><h2><ClipboardList size={20}/> Fazendas no filtro</h2></div><span className="pill">{farms.length} cadastrada(s)</span></div>{farms.length?<div className="managerFarmRows">{farms.slice(0,8).map(f=>{const farmEquips=equips.filter(e=>e.fazenda_id===f.id),farmVisits=visitsInPeriod.filter(v=>v.fazenda_id===f.id);return <article key={f.id}><div><b>{f.nome}</b><span>{f.cidade||'Cidade não informada'} • {f.central||'Central não informada'}</span></div><div><strong>{farmStatus(f)}</strong><small>{collarBreakdown(f)} • {farmEquips.length} equip. • {farmVisits.length} visita(s) no período</small></div></article>})}</div>:<Empty icon={Building2} title="Sem fazendas no filtro" text="Altere central ou status."/>}</section>
      <section className="panel managerSidePanel"><div className="sectionTitle"><div><h2><ShieldCheck size={20}/> Por central</h2></div></div><div className="centralBreakdown">{centralRows.map(r=><div key={r.label}><span>{r.label}</span><b>{r.count}</b><small>{r.done} concluída(s) • {r.handled} atendidos</small></div>)}</div>{ownerRows.length>0&&<><div className="miniSectionTitle">Responsáveis no período</div><div className="centralBreakdown compact">{ownerRows.map(r=><div key={r.label}><span>{r.label}</span><b>{r.count}</b><small>{r.collars} colares • {r.hours.toFixed(1)} h</small></div>)}</div></>}</section>
    </div>
  </div>
}
function Field({label,icon:Icon,children}){return <label className="field"><span>{Icon&&<Icon size={15}/>} {label}</span>{children}</label>}
function Modal({title,onClose,children}){return <div className="modalBackdrop"><div className="modal"><header><h2>{title}</h2><button onClick={onClose}><X size={20}/></button></header>{children}</div></div>}
function download(filename, text){const blob=new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);}

createRoot(document.getElementById('root')).render(<App/>);
