import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, Circle, GeoJSON, Polyline, Polygon } from 'react-leaflet';
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
  Image as ImageIcon, Camera, Upload, Eye, EyeOff, Link2, Milk, Mail, Maximize2, Minimize2, EllipsisVertical
} from 'lucide-react';
import './styles.css';
import appLogo from './assets/brand/controltech-logo.png';
import DeviceLedMap from './components/DeviceLedMap.jsx';
import vp8002LedPanelImage from './assets/vp8002-led-panel.png';
import altaLogo from '../LOGO_ALTA.png';
import genexLogo from '../LOGO_GENEX.png';
import urusLogo from '../LOGO_URUS.png';
import { SOURCES, INSTALL_GUIDES, SYMPTOMS, LED_DIAGNOSTICS, CAN_ERRORS, SUPPORT_CHECKS, QUICK_CHECKLISTS } from './data/manualContent.js';

const APP_VERSION = '3.0.8';
const LOCAL_MODE_KEY = 'cta_allow_local_mode';
const APP_CONTEXT_KEY = 'cta_last_context';
const FARM_VIEW_KEY = 'cta_farm_view_mode';
const FARM_FILTER_KEY = 'cta_farm_filters';
const BRAND_LOGOS = { alta: altaLogo, genex: genexLogo, urus: urusLogo };
const ROUTINE_ASSIST_URL = import.meta.env.VITE_ROUTINE_ASSIST_URL || 'https://routine-assist.vercel.app/';
const readAppContext = () => {
  try { return JSON.parse(localStorage.getItem(APP_CONTEXT_KEY) || '{}') || {}; } catch { return {}; }
};
const readFarmFilters = () => {
  const empty = { q:'', central:'Todas', status:'Todos', visitFrom:'', visitTo:'', state:'Todos', city:'Todas', collarsMin:'', collarsMax:'' };
  try {
    const saved = JSON.parse(localStorage.getItem(FARM_FILTER_KEY) || '{}') || {};
    return {
      q: typeof saved.q === 'string' ? saved.q : '',
      central: typeof saved.central === 'string' ? saved.central : 'Todas',
      status: typeof saved.status === 'string' ? saved.status : 'Todos',
      visitFrom: typeof saved.visitFrom === 'string' ? saved.visitFrom : '',
      visitTo: typeof saved.visitTo === 'string' ? saved.visitTo : '',
      state: typeof saved.state === 'string' ? saved.state : 'Todos',
      city: typeof saved.city === 'string' ? saved.city : 'Todas',
      collarsMin: typeof saved.collarsMin === 'string' ? saved.collarsMin : '',
      collarsMax: typeof saved.collarsMax === 'string' ? saved.collarsMax : ''
    };
  } catch {
    return empty;
  }
};
const normalizeMainView = view => view === 'diagnostico' || view === 'guia' ? 'suporte' : view;
const saveAppContext = (view, farmId = null) => {
  try { localStorage.setItem(APP_CONTEXT_KEY, JSON.stringify({ view: normalizeMainView(view), farmId })); } catch {}
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
const dateInputFromIso = (v) => dateTimeInput(v).slice(0, 10) || todayInput();
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
const visitServiceSessions = (farm, visits = []) => visits
  .filter(v => v?.fazenda_id === farm?.id && v.iniciada_em)
  .map(v => ({
    id: v.id,
    tipo: v.tipo || 'Visita',
    status: visitDisplayStatus(v),
    start: v.iniciada_em,
    end: v.finalizada_em || null,
    responsible: v.responsavel_tecnico || farm?.servico_responsavel || '',
    open: Boolean(v.iniciada_em && !v.finalizada_em),
    visit: v
  }))
  .sort((a, b) => new Date(a.start) - new Date(b.start));
const farmServiceSessions = (farm, visits = []) => {
  const sessions = visitServiceSessions(farm, visits);
  if (sessions.length) return sessions;
  if (!farm?.servico_inicio_em) return [];
  return [{
    id: `farm-${farm.id}`,
    tipo: 'Serviço',
    status: farmStatus(farm),
    start: farm.servico_inicio_em,
    end: farm.servico_fim_em || null,
    responsible: farm.servico_responsavel || '',
    open: Boolean(farm.servico_inicio_em && !farm.servico_fim_em),
    visit: null
  }];
};
const sessionHours = session => {
  if (!session?.start) return 0;
  const start = new Date(session.start);
  const end = session.end ? new Date(session.end) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return (end - start) / 36e5;
};
const serviceTotalHours = (farm, visits = []) => farmServiceSessions(farm, visits).reduce((total, session) => total + sessionHours(session), 0);
const hoursLabel = hours => {
  if (!hours) return '-';
  return hours < 24 ? `${Math.max(hours, 0.1).toFixed(1)} h` : `${(hours / 24).toFixed(1)} dias`;
};
const serviceTotalLabel = (farm, visits = []) => hoursLabel(serviceTotalHours(farm, visits));
const firstServiceStart = sessions => sessions[0]?.start || '';
const lastServiceEnd = sessions => [...sessions].reverse().find(session => session.end)?.end || '';
const serviceResponsibleLabel = (farm, visits = []) => {
  const names = farmServiceSessions(farm, visits)
    .map(session => cleanDisplayName(session.responsible))
    .filter(Boolean)
    .filter((name, index, list) => list.findIndex(item => item.toLowerCase() === name.toLowerCase()) === index);
  if (!names.length && farm?.servico_responsavel) names.push(cleanDisplayName(farm.servico_responsavel));
  return names.join(', ');
};
const serviceSessionText = (session) => {
  if (!session?.start) return '';
  const endText = session.end ? brDateTime(session.end) : 'em andamento';
  const duration = session.end ? ` • ${hoursLabel(sessionHours(session))}` : '';
  return `${brDateTime(session.start)} até ${endText}${duration}`;
};
const visitServiceText = visit => visit?.iniciada_em ? serviceSessionText({start:visit.iniciada_em,end:visit.finalizada_em||null}) : '';
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
const htmlSafe = (value='') => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function equipmentKind(e){const type=String(e?.tipo||'');return type.includes('4102')?'antenna':type.includes('8002')?'processor':'other';}
function equipmentMarkerSvg(kind){
  if(kind==='antenna')return '<svg class="equipment-marker-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V9"/><path d="M8.5 12.4a4 4 0 0 1 7 0"/><path d="M5.4 9.7a8 8 0 0 1 13.2 0"/><path d="M9.4 19h5.2"/><circle cx="12" cy="7" r="1.7"/></svg>';
  if(kind==='processor')return '<svg class="equipment-marker-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 9h3M4 15h3M17 9h3M17 15h3M9 4v3M15 4v3M9 17v3M15 17v3"/><path d="M10 10h4v4h-4z"/></svg>';
  return '<svg class="equipment-marker-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 7 4-7 4-7-4 7-4Z"/><path d="m5 12 7 4 7-4"/><path d="m5 16 7 4 7-4"/></svg>';
}
function equipmentMarkerIcon(e, opts={}){
  const kind=equipmentKind(e), ghost=opts.ghost;
  const label=htmlSafe(String(e?.apelido||e?.local_nome||e?.tipo||'').slice(0,12));
  const stackBadge=opts.stackTotal>1?`<em>${opts.stackIndex}</em>`:'';
  return L.divIcon({
    className:`equipment-marker-wrap professional-equipment-marker-wrap ${opts.stackTotal>1?'stacked':''}`,
    html:`<div class="equipment-marker equipment-marker-pro ${ghost?'ghost':kind}">${equipmentMarkerSvg(kind)}${stackBadge}</div>${label?`<b>${label}</b>`:''}`,
    iconSize:[62,54],
    iconAnchor:[31,43],
    popupAnchor:[0,-38]
  });
}
function spreadRepeatedCoordinates(items){
  const groups=items.reduce((acc,item)=>{const key=`${Number(item.latitude).toFixed(6)},${Number(item.longitude).toFixed(6)}`;(acc[key] ||= []).push(item);return acc;},{});
  return items.map(item=>{
    const key=`${Number(item.latitude).toFixed(6)},${Number(item.longitude).toFixed(6)}`;
    const group=groups[key]||[item], index=group.findIndex(g=>g.id===item.id);
    const lat=Number(item.latitude), lng=Number(item.longitude);
    if(group.length<2)return {...item,_mapPosition:[lat,lng],_stackIndex:0,_stackTotal:1};
    const radius=group.length===2?7:9, angle=(-Math.PI/2)+((Math.PI*2)/group.length)*index;
    const latOffset=(Math.sin(angle)*radius)/111320;
    const lngOffset=(Math.cos(angle)*radius)/(111320*Math.max(Math.cos(lat*Math.PI/180),.35));
    return {...item,_mapPosition:[lat+latOffset,lng+lngOffset],_stackIndex:index+1,_stackTotal:group.length};
  });
}
function mapPointIconFor(e){const kind=equipmentKind(e), Icon=kind==='antenna'?RadioTower:kind==='processor'?Cpu:Layers;return <span className={`mapPointIcon ${kind}`}><Icon size={16}/></span>;}
function farmMarkerIcon(f){const short=String(f?.nome||'Fazenda').replace(/^Fazenda\s+/i,'').slice(0,16);const glyph='<svg class="farm-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 6l8 5.2V20H4z"/><path d="M8 20v-5.2h8V20"/><path d="M8.6 11.5h6.8"/><path d="M10.2 8.9h3.6"/></svg>';return L.divIcon({className:'farm-marker-wrap modern-farm-marker-wrap',html:`<div class="farm-marker farm-location">${glyph}</div><b>${short}</b>`,iconSize:[76,48],iconAnchor:[38,36],popupAnchor:[0,-34]});}

const FARM_STATUS = ['Não iniciada', 'Em andamento', 'Com pendência', 'Aguardando validação', 'Instalação concluída'];
const FARM_STATUS_DONE = 'Instalação concluída';
const normalizeText = (value='') => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const VP8002_LED_MARKERS = [
  { id:'power', label:'POWER', x:28.4, y:20.0 },
  { id:'status', label:'STATUS', x:28.4, y:39.3 },
  { id:'vin1', label:'Vin1', x:7.0, y:72.0 },
  { id:'vin2', label:'Vin2', x:10.6, y:72.0 },
  { id:'vout1', label:'Vout1', x:19.6, y:72.0 },
  { id:'can1', label:'CAN1', x:25.0, y:72.0 },
  { id:'vout2', label:'Vout2', x:30.4, y:72.0 },
  { id:'can2', label:'CAN2', x:35.8, y:72.0 },
  { id:'o1', label:'O1', x:43.1, y:72.0 },
  { id:'i1', label:'I1', x:46.8, y:72.0 },
  { id:'o2', label:'O2', x:54.0, y:72.0 },
  { id:'i2', label:'I2', x:57.7, y:72.0 },
  { id:'link1', label:'LINK1', x:64.5, y:72.0 },
  { id:'act1', label:'ACT1', x:70.0, y:72.0 },
  { id:'link2', label:'LINK2', x:75.5, y:72.0 },
  { id:'act2', label:'ACT2', x:81.0, y:72.0 },
  { id:'usb1', label:'USB1', x:87.7, y:72.0 },
  { id:'usb2', label:'USB2', x:93.0, y:72.0 }
];
const vp8002LedMarkerIds = label => {
  const text = normalizeText(label);
  if(text.includes('power')) return ['power'];
  if(text.includes('status') || text.includes('ecra')) return ['status'];
  if(text.includes('vin1')) return ['vin1'];
  if(text.includes('vin2')) return ['vin2'];
  if(text.includes('vin')) return ['vin1','vin2'];
  if(text.includes('vout1')) return ['vout1'];
  if(text.includes('vout2')) return ['vout2'];
  if(text.includes('vout')) return ['vout1','vout2'];
  if(text.includes('can1')) return ['can1'];
  if(text.includes('can2')) return ['can2'];
  if(text.includes('can')) return ['can1','can2'];
  if(text.includes('link1') && text.includes('act1')) return ['link1','act1'];
  if(text.includes('link2') && text.includes('act2')) return ['link2','act2'];
  if(text.includes('link1')) return ['link1'];
  if(text.includes('act1')) return ['act1'];
  if(text.includes('link2')) return ['link2'];
  if(text.includes('act2')) return ['act2'];
  if(text.includes('link') || text.includes('act')) return ['link1','act1','link2','act2'];
  if(text.includes('usb1')) return ['usb1'];
  if(text.includes('usb2')) return ['usb2'];
  if(text.includes('usb')) return ['usb1','usb2'];
  if(text.includes('o1')) return ['o1'];
  if(text.includes('i1')) return ['i1'];
  if(text.includes('o2')) return ['o2'];
  if(text.includes('i2')) return ['i2'];
  return [];
};
const ledToneClass = value => {
  const text = normalizeText(value);
  return text.includes('verde') ? 'green' : text.includes('vermelho') ? 'red' : text.includes('laranja') ? 'orange' : text.includes('azul') ? 'blue' : '';
};
const LED_COLOR_OPTIONS = ['Verde', 'Azul', 'Laranja', 'Vermelho', 'Branco'];
const LED_MODE_OPTIONS = ['Aceso', 'Apagado', 'Pisca lentamente', 'Pisca rapidamente', '1 flash curto', '2 flashes curtos', '3 flashes curtos'];
const VP8002_LED_NORMALS = {
  power: { color:'Verde', mode:'Aceso', meaning:'Alimentação principal ligada e reserva interna carregada.', action:'Condição normal de alimentação.' },
  status: { color:'Azul', mode:'Pisca lentamente', meaning:'VP8002 em funcionamento normal.', action:'Condição normal. Continuar a validação da instalação.' },
  vin: { color:'Verde', mode:'Aceso', meaning:'Entrada de alimentação ligada.', action:'Condição normal.' },
  vout: { color:'Verde', mode:'Aceso', meaning:'Saída de alimentação ligada.', action:'Condição normal quando a saída está ativa.' },
  can: { color:'Verde', mode:'Aceso', meaning:'CAN bus OK.', action:'Condição normal de comunicação CAN.' },
  io1: { color:'Branco', mode:'Apagado', meaning:'Entrada/saída sem atividade no estado normal.', action:'Condição normal se este ponto não estiver em uso.' },
  io2: { color:'Branco', mode:'Apagado', meaning:'Entrada/saída sem atividade no estado normal.', action:'Condição normal se este ponto não estiver em uso.' },
  'link1-act1': { color:'Verde', mode:'Aceso', meaning:'Ligação LAN estabelecida em 100 Mbps.', action:'Condição normal de rede.' },
  'link2-act2': { color:'Verde', mode:'Aceso', meaning:'Ligação LAN estabelecida em 100 Mbps.', action:'Condição normal quando esta porta está conectada.' },
  usb: { color:'Branco', mode:'Apagado', meaning:'USB sem atividade.', action:'Condição normal quando não há backup ou dispositivo USB conectado.' }
};
Object.assign(VP8002_LED_NORMALS, {
  vin1: { color:'Verde', mode:'Aceso', meaning:'Entrada Vin1 alimentando o equipamento.', action:'Condição normal na alimentação principal.' },
  vin2: { color:'Branco', mode:'Apagado', meaning:'Entrada Vin2 sem uso no funcionamento normal.', action:'Condição normal quando não existe segunda entrada conectada.' },
  vout1: { color:'Verde', mode:'Aceso', meaning:'Saída Vout1 ativa.', action:'Condição normal quando a saída está em uso.' },
  vout2: { color:'Verde', mode:'Aceso', meaning:'Saída Vout2 ativa.', action:'Condição normal quando a saída está em uso.' },
  can1: { color:'Verde', mode:'Aceso', meaning:'CAN1 com barramento OK.', action:'Condição normal de comunicação CAN.' },
  can2: { color:'Verde', mode:'Aceso', meaning:'CAN2 com barramento OK.', action:'Condição normal de comunicação CAN.' },
  o1: { color:'Branco', mode:'Apagado', meaning:'Saída O1 sem atividade.', action:'Condição normal se esta saída não estiver em uso.' },
  i1: { color:'Branco', mode:'Apagado', meaning:'Entrada I1 sem atividade.', action:'Condição normal se esta entrada não estiver em uso.' },
  o2: { color:'Branco', mode:'Apagado', meaning:'Saída O2 sem atividade.', action:'Condição normal se esta saída não estiver em uso.' },
  i2: { color:'Branco', mode:'Apagado', meaning:'Entrada I2 sem atividade.', action:'Condição normal se esta entrada não estiver em uso.' },
  link1: { color:'Verde', mode:'Aceso', meaning:'Porta LAN 1 com link estabelecido.', action:'Condição normal de rede.' },
  act1: { color:'Verde', mode:'Pisca lentamente', meaning:'Porta LAN 1 com atividade periódica.', action:'Condição normal quando há tráfego na rede.' },
  link2: { color:'Verde', mode:'Aceso', meaning:'Porta LAN 2 com link estabelecido.', action:'Condição normal quando esta porta está conectada.' },
  act2: { color:'Verde', mode:'Pisca lentamente', meaning:'Porta LAN 2 com atividade periódica.', action:'Condição normal quando há tráfego na rede.' },
  usb1: { color:'Branco', mode:'Apagado', meaning:'USB1 sem atividade.', action:'Condição normal quando não há dispositivo USB conectado.' },
  usb2: { color:'Branco', mode:'Apagado', meaning:'USB2 sem atividade.', action:'Condição normal quando não há dispositivo USB conectado.' }
});
const defaultVp8002LedStates = () => Object.fromEntries(VP8002_LED_MARKERS.map(marker => [marker.id, {...VP8002_LED_NORMALS[marker.id]}]));
const ledColorMatches = (source='', target='') => {
  const sourceText = normalizeText(source);
  const targetText = normalizeText(target);
  if(!sourceText || !targetText) return false;
  return sourceText.split('/').some(part => {
    const clean = part.trim();
    return clean === targetText || clean.includes(targetText) || targetText.includes(clean);
  }) || sourceText.includes(targetText);
};
const ledModeMatches = (source='', target='') => {
  const sourceText = normalizeText(source);
  const targetText = normalizeText(target);
  if(!sourceText || !targetText) return false;
  if(sourceText === targetText) return true;
  if(sourceText.includes('piscando') && targetText.includes('pisca')) return true;
  if(targetText.includes('piscando') && sourceText.includes('pisca')) return true;
  const sourceFlash = sourceText.match(/(\d+)\s+flash/);
  const targetFlash = targetText.match(/(\d+)\s+flash/);
  if(sourceFlash && targetFlash) return sourceFlash[1] === targetFlash[1];
  if(sourceText.includes('rapidamente') && targetText.includes('rapidamente')) return true;
  if(sourceText.includes('lentamente') && targetText.includes('lentamente')) return true;
  return false;
};
const ledStateMatches = (expected={}, observed={}) => ledColorMatches(expected.color, observed.color) && ledModeMatches(expected.mode, observed.mode);
const ledLabelState = state => `${state?.color || '-'} • ${state?.mode || '-'}`;
const ledDiagnosticFor = (ledId, observed) => {
  const normal = VP8002_LED_NORMALS[ledId] || {};
  const rows = LED_DIAGNOSTICS.filter(row => vp8002LedMarkerIds(row.led).includes(ledId));
  const exact = rows.find(row => ledColorMatches(row.cor, observed.color) && ledModeMatches(row.modo, observed.mode));
  const isNormal = ledStateMatches(normal, observed);
  if(isNormal) return {
    isNormal,
    title: 'Funcionamento normal',
    meaning: normal.meaning || exact?.estado || 'O LED está no comportamento esperado.',
    action: normal.action || exact?.acao || 'Sem ação necessária.'
  };
  return {
    isNormal,
    title: exact?.estado || 'Comportamento diferente do esperado',
    meaning: exact?.estado || `O esperado era ${ledLabelState(normal)}.`,
    action: exact?.acao || 'Comparar com os demais LEDs, revisar alimentação, rede, cabeamento e registrar a condição se persistir.'
  };
};
const VP8002_FIELD_ACTIONS = [
  {
    id:'display-ip',
    title:'Localizar IP no display',
    code:'IP',
    icon:Globe2,
    category:'Rede / acesso',
    summary:'Use quando o Velos ou o Find my VPU não localizar a VP8002.',
    expected:'Display com IP válido da rede local. Evite avançar se aparecer 0.0.0.0 ou 169.254.xx.',
    relatedLedIds:['link1','act1','link2','act2'],
    steps:[
      'Confirme POWER verde e cabo de rede conectado na porta correta.',
      'Use o botão frontal para navegar até a informação de IP no display.',
      'Se aparecer 0.0.0.0, trate como ausência de rede física ou roteador desligado.',
      'Se aparecer 169.254.xx, trate como falha de DHCP e corrija o roteador antes de seguir.',
      'Com IP válido, acesse pelo navegador no mesmo ambiente de rede.'
    ]
  },
  {
    id:'menu-de',
    title:'Consultar dE - erros CAN',
    code:'dE',
    icon:AlertTriangle,
    category:'CAN bus',
    summary:'Use quando STATUS ou CAN indicar erro. O menu dE mostra o código que direciona a correção.',
    expected:'Código dE anotado e tratado no barramento correto antes de finalizar a instalação.',
    relatedLedIds:['status','can1','can2'],
    showCanCodes:true,
    steps:[
      'Abra o menu dE no display da VP8002.',
      'Anote exatamente o código apresentado.',
      'Confira se o erro está no CAN 1 ou CAN 2.',
      'Inspecione cabos, conectores, corrosão, sobrecarga ou curto no barramento indicado.',
      'Após corrigir, confirme CAN verde e STATUS em operação normal.'
    ]
  },
  {
    id:'menu-da',
    title:'Consultar dA - dados do equipamento',
    code:'dA',
    icon:Cpu,
    category:'Display VP8002',
    summary:'Use para conferir dados de diagnóstico da VPU quando a informação no Velos não estiver clara.',
    expected:'Dados conferidos no display e comparados com o comportamento físico dos LEDs.',
    relatedLedIds:['status','power'],
    steps:[
      'Abra o menu dA no display da VP8002.',
      'Compare a informação apresentada com o LED físico e com o estado no Velos.',
      'Se houver divergência entre display, LED e Velos, registre foto e reinicie a validação.',
      'Use dE em seguida se o display indicar erro relacionado ao CAN.'
    ]
  },
  {
    id:'reset-vp8002',
    title:'Reiniciar VP8002 com segurança',
    code:'RESET',
    icon:RefreshCw,
    category:'Procedimento controlado',
    summary:'Use quando a VPU estiver travada, após corrigir energia/rede, ou quando o manual orientar reinicialização.',
    expected:'Após religar, POWER verde, STATUS azul piscando lentamente e rede/CAN normalizados.',
    warning:'Antes de reiniciar, anote LEDs, códigos dE, IP exibido e tire foto se houver falha intermitente.',
    relatedLedIds:['power','status'],
    steps:[
      'Confirme que não existe atualização em andamento.',
      'Anote o comportamento dos LEDs e o código do display.',
      'Desligue a alimentação principal de forma controlada.',
      'Aguarde alguns segundos antes de religar.',
      'Religue, espere a inicialização e compare os LEDs com o funcionamento normal no app.'
    ]
  },
  {
    id:'lan-link-act',
    title:'Validar rede LINK / ACT',
    code:'LAN',
    icon:Cable,
    category:'Rede física',
    summary:'Use quando não encontrar IP, quando LINK/ACT estiver apagado ou quando o acesso ao Velos falhar.',
    expected:'LINK aceso e ACT piscando quando há tráfego de rede.',
    relatedLedIds:['link1','act1','link2','act2'],
    steps:[
      'Confirme se o cabo está na porta correta da VP8002.',
      'Troque o cabo Ethernet e teste outra porta no roteador ou switch.',
      'Verifique se o roteador está ligado e entregando DHCP.',
      'Se LINK acender e ACT piscar, volte para localizar IP.',
      'Se continuar apagado, trate como falha de cabo, porta ou rede física.'
    ]
  },
  {
    id:'power-check',
    title:'Conferir alimentação e saídas',
    code:'PWR',
    icon:Zap,
    category:'Energia',
    summary:'Use quando POWER, Vin ou Vout indicar baixa tensão, falha, sobrecarga ou UPS em uso.',
    expected:'POWER verde aceso, Vin/Vout conforme instalação e sem aviso laranja/vermelho.',
    relatedLedIds:['power','vin1','vin2','vout1','vout2'],
    steps:[
      'Confira tomada, fonte, polaridade e estabilidade da alimentação.',
      'Observe POWER, Vin1/Vin2 e Vout1/Vout2 no painel.',
      'Se houver laranja, investigue baixa potência, cabo longo ou bitola inadequada.',
      'Se houver vermelho piscando, investigue curto, sobrecarga ou fonte incorreta.',
      'Só avance para rede e CAN quando a alimentação estiver estável.'
    ]
  },
  {
    id:'vp4102-coverage',
    title:'Validar antena e cobertura',
    code:'RF',
    icon:RadioTower,
    category:'VP4102 / Antena',
    summary:'Use quando tags não aparecem, há área sem leitura ou a antena foi instalada em novo ponto.',
    expected:'Antena posicionada fora do alcance dos animais, com leitura validada em campo.',
    steps:[
      'Confira fixação, cabo da antena e proteção contra umidade.',
      'Abra Reader check ou Tags analysis no sistema Nedap.',
      'Caminhe com uma tag de teste na área de cobertura.',
      'Registre no mapa o ponto real da antena e ajuste se necessário.',
      'Se a área for grande ou tiver obstáculo metálico, planeje antena adicional.'
    ]
  }
];
const canCodesForLed = ledId => {
  if(ledId === 'can1') return CAN_ERRORS.filter(c => c.bus.includes('CAN 1') || c.code === '12');
  if(ledId === 'can2') return CAN_ERRORS.filter(c => c.bus.includes('CAN 2') || c.code === '12');
  if(ledId === 'status') return CAN_ERRORS;
  return [];
};
const actionForLed = ledId => VP8002_FIELD_ACTIONS.find(action => action.relatedLedIds?.includes(ledId));
const ledDiagnosticForRich = (ledId, observed={}) => {
  const normal = VP8002_LED_NORMALS[ledId] || {};
  const rows = LED_DIAGNOSTICS.filter(row => vp8002LedMarkerIds(row.led).includes(ledId));
  const exact = rows.find(row => ledColorMatches(row.cor, observed.color) && ledModeMatches(row.modo, observed.mode));
  const isNormal = ledStateMatches(normal, observed);
  const normalText = ledLabelState(normal);
  const colorText = normalizeText(observed?.color);
  const modeText = normalizeText(observed?.mode);
  const isRed = colorText.includes('vermelho');
  const isOrange = colorText.includes('laranja');
  const isGreen = colorText.includes('verde');
  const isBlue = colorText.includes('azul');
  const isWhite = colorText.includes('branco');
  const isOff = isWhite || modeText.includes('apagado');
  const isBlinking = modeText.includes('pisca') || modeText.includes('piscando') || modeText.includes('flash');
  const make = ({
    severity='warn',
    title=exact?.estado || 'Comportamento diferente do esperado',
    meaning=exact?.estado ? `Leitura encontrada no manual: ${exact.estado}.` : `O esperado era ${normalText}.`,
    probableCause='Divergencia visual entre a VP8002 fisica e o funcionamento normal usado como referencia.',
    action=exact?.acao || 'Compare com os demais LEDs, revise alimentacao, rede, cabos e registre a condicao se persistir.',
    checks=[],
    procedureId
  }={}) => ({isNormal, severity, title, meaning, probableCause, action, checks, procedureId});

  if(isNormal) return make({
    severity:'ok',
    title:'Funcionamento normal',
    meaning:normal.meaning || exact?.estado || 'O LED esta no comportamento esperado.',
    probableCause:'Sem indicio de falha neste LED.',
    action:normal.action || exact?.acao || 'Nenhuma acao necessaria para este LED.',
    checks:['Compare rapidamente com POWER e STATUS.', 'Continue a validacao dos demais pontos se houver sintoma no campo.']
  });

  if(ledId === 'power'){
    if(isOff) return make({
      severity:'danger',
      title:'VP8002 sem alimentacao',
      meaning:'POWER apagado indica que a controladora pode nao estar energizada.',
      probableCause:'Tomada, fonte, borne, polaridade ou alimentacao principal interrompida.',
      action:'Pare a configuracao e normalize a alimentacao antes de testar rede, CAN ou antenas.',
      checks:['Conferir tomada e disjuntor.', 'Medir a fonte de alimentacao.', 'Verificar borne e polaridade.', 'Religar e aguardar POWER verde aceso.'],
      procedureId:'power-check'
    });
    if(isOrange) return make({
      severity:'warn',
      title:'Baixa tensao ou UPS em alerta',
      meaning:'POWER laranja indica energia abaixo do ideal para operacao estavel.',
      probableCause:'Fonte fraca, cabo longo/fino, queda de tensao ou UPS interno em baixa carga.',
      action:'Corrija a alimentacao antes de finalizar a instalacao.',
      checks:['Conferir tensao de entrada.', 'Revisar comprimento e bitola dos cabos.', 'Validar Vin1/Vin2.', 'Observar se o alerta some apos estabilizar.'],
      procedureId:'power-check'
    });
    if(isRed || isBlinking) return make({
      severity:'danger',
      title:'Falha critica de alimentacao',
      meaning:'POWER vermelho ou piscando fora do esperado indica risco de queda ou fonte inadequada.',
      probableCause:'UPS muito baixo, curto, sobrecarga ou fonte fora de especificacao.',
      action:'Desligue cargas suspeitas, revise a fonte e acione suporte se persistir.',
      checks:['Isolar dispositivos conectados.', 'Verificar curto/sobrecarga.', 'Testar fonte confiavel.', 'Registrar foto do painel.'],
      procedureId:'power-check'
    });
  }

  if(ledId === 'status'){
    if(isRed || isOrange) return make({
      severity:'danger',
      title:'Erro ativo na VP8002',
      meaning:'STATUS fora do azul normal pede leitura do codigo no display.',
      probableCause:'Erro de sistema, falha CAN ou inconsistencia de firmware/configuracao.',
      action:'Abra o menu dE no display, anote o codigo e trate a causa antes de liberar a fazenda.',
      checks:['Consultar dE no display.', 'Anotar o codigo apresentado.', 'Verificar CAN1/CAN2.', 'Reiniciar somente depois de registrar a falha.'],
      procedureId:'menu-de'
    });
    if(isBlue && modeText.includes('1 flash')) return make({
      severity:'warn',
      title:'V-pack em falta',
      meaning:'STATUS com 1 flash curto indica dispositivo esperado ausente.',
      probableCause:'V-pack desconectado, sem alimentacao ou nao reconhecido no Velos.',
      action:'Confira alimentacao, cabeamento e cadastro dos V-packs.',
      checks:['Conferir V-pack esperado.', 'Revisar cabo e conector.', 'Validar se aparece no Velos.', 'Confirmar STATUS normal apos ajuste.'],
      procedureId:'menu-de'
    });
    if(isBlue && (modeText.includes('2 flash') || modeText.includes('3 flash'))) return make({
      severity:'warn',
      title:'Firmware precisa de atencao',
      meaning:'STATUS com 2 ou 3 flashes curtos indica firmware nao ativo ou ausente.',
      probableCause:'Atualizacao incompleta, firmware nao ativado ou controladora sem firmware correto.',
      action:'Verifique o Velos e conclua a atualizacao antes de continuar.',
      checks:['Abrir dados dA no display.', 'Conferir versao no Velos.', 'Executar atualizacao se disponivel.', 'Validar STATUS piscando lentamente.'],
      procedureId:'menu-da'
    });
    if(isBlue && modeText.includes('rapidamente')) return make({
      severity:'info',
      title:'Transferencia ou modo de servico',
      meaning:'STATUS azul piscando rapido pode indicar transferencia/servico em andamento.',
      probableCause:'Atualizacao, comunicacao ativa ou modo tecnico temporario.',
      action:'Aguarde estabilizar; se nao normalizar, confira rede e dados dA.',
      checks:['Aguardar alguns minutos.', 'Evitar desligar durante atualizacao.', 'Conferir rede.', 'Verificar dA se persistir.'],
      procedureId:'menu-da'
    });
  }

  if(ledId === 'can1' || ledId === 'can2'){
    const bus = ledId === 'can1' ? 'CAN 1' : 'CAN 2';
    if(isRed) return make({
      severity:'danger',
      title:`Erro no barramento ${bus}`,
      meaning:'CAN vermelho indica falha no barramento ou alimentacao dos dispositivos conectados.',
      probableCause:'Curto, sobrecarga, conector oxidado, cabo rompido ou dispositivo CAN com problema.',
      action:'Consultar dE, identificar o codigo e revisar o barramento antes de finalizar.',
      checks:['Abrir dE no display.', `Confirmar se o erro esta no ${bus}.`, 'Inspecionar cabos e conectores.', 'Desconectar trechos para isolar curto/sobrecarga.'],
      procedureId:'menu-de'
    });
    if(isOff) return make({
      severity:'warn',
      title:`${bus} desligado ou sem comunicacao`,
      meaning:'CAN apagado pode ser normal apenas se este barramento nao for usado.',
      probableCause:'CAN desabilitado, sem V-pack conectado, cabo desconectado ou alimentacao ausente.',
      action:'Confirme se este barramento deveria estar ativo para a instalacao.',
      checks:['Verificar se ha V-packs neste barramento.', 'Conferir configuracao no Velos.', 'Checar alimentacao de Vout.', 'Validar CAN verde apos conectar.'],
      procedureId:'menu-de'
    });
    if(isOrange) return make({
      severity:'warn',
      title:`Aviso no ${bus}`,
      meaning:'CAN laranja fora do normal indica condicao eletrica ou comunicacao instavel.',
      probableCause:'Tensao baixa, excesso de carga ou inicio de falha no cabo/conector.',
      action:'Revise alimentacao e cabos antes que vire erro vermelho.',
      checks:['Conferir Vout e Vin.', 'Revisar carga no barramento.', 'Inspecionar conectores.', 'Registrar a condicao na visita.'],
      procedureId:'menu-de'
    });
  }

  if(ledId === 'link1' || ledId === 'link2'){
    const porta = ledId === 'link1' ? 'LAN 1' : 'LAN 2';
    if(isOff) return make({
      severity:'danger',
      title:`Sem link fisico na ${porta}`,
      meaning:'LINK apagado indica que a porta Ethernet nao fechou comunicacao fisica.',
      probableCause:'Cabo desconectado, porta errada, roteador/switch desligado ou cabo com defeito.',
      action:'Corrija a rede fisica antes de procurar IP ou abrir Velos.',
      checks:['Reencaixar cabo Ethernet.', 'Testar outro cabo.', 'Trocar porta no roteador/switch.', 'Conferir se a LAN correta esta sendo usada.'],
      procedureId:'lan-link-act'
    });
    if(isOrange || isRed) return make({
      severity:'warn',
      title:`LINK fora do padrao na ${porta}`,
      meaning:'A porta tem sinal diferente do funcionamento normal esperado.',
      probableCause:'Negociacao de rede instavel, cabo ruim ou porta/switch com comportamento irregular.',
      action:'Valide cabo, porta e roteador antes de concluir a instalacao.',
      checks:['Trocar cabo.', 'Testar outra porta.', 'Verificar IP no display.', 'Confirmar ACT com trafego.'],
      procedureId:'lan-link-act'
    });
    if(isGreen && isBlinking) return make({
      severity:'info',
      title:`LINK oscilando na ${porta}`,
      meaning:'O LINK normalmente fica aceso; quem pisca com trafego costuma ser ACT.',
      probableCause:'Pode haver confusao visual entre LINK e ACT ou oscilacao de rede.',
      action:'Confirme no painel se o LED observado e LINK ou ACT e valide o IP.',
      checks:['Comparar LINK e ACT lado a lado.', 'Verificar IP no display.', 'Observar se perde acesso ao Velos.', 'Trocar cabo se oscilar.'],
      procedureId:'lan-link-act'
    });
  }

  if(ledId === 'act1' || ledId === 'act2'){
    const porta = ledId === 'act1' ? 'LAN 1' : 'LAN 2';
    if(isOff) return make({
      severity:'warn',
      title:`Sem atividade de rede na ${porta}`,
      meaning:'ACT apagado com LINK aceso indica rede conectada, mas sem trafego aparente.',
      probableCause:'Roteador sem DHCP, dispositivo fora da rede, cabo em porta sem comunicacao ou rede parada.',
      action:'Localize o IP no display e valide acesso ao Velos.',
      checks:['Confirmar LINK aceso.', 'Localizar IP no display.', 'Testar acesso pelo navegador.', 'Reiniciar roteador se DHCP falhar.'],
      procedureId:'display-ip'
    });
    if(isOrange || isRed) return make({
      severity:'warn',
      title:`Atividade anormal na ${porta}`,
      meaning:'ACT em cor de alerta sugere trafego ou porta fora do padrao esperado.',
      probableCause:'Instabilidade de rede, cabo/switch ruim ou comunicacao irregular.',
      action:'Valide rede fisica e IP antes de continuar.',
      checks:['Trocar cabo.', 'Testar outra porta.', 'Checar DHCP.', 'Confirmar acesso ao Velos.'],
      procedureId:'lan-link-act'
    });
    if(isGreen && !isBlinking) return make({
      severity:'info',
      title:`Rede conectada sem trafego visivel na ${porta}`,
      meaning:'ACT aceso sem piscar pode ocorrer se nao houver comunicacao no momento.',
      probableCause:'Rede conectada, mas sem acesso ativo ao Velos/Nedap ou pouco trafego.',
      action:'Abra o Velos ou pingue a VP8002 e observe se ACT pisca.',
      checks:['Abrir IP no navegador.', 'Testar Find my VPU.', 'Observar ACT durante acesso.', 'Se nao piscar, validar cabo e DHCP.'],
      procedureId:'display-ip'
    });
  }

  if(ledId.startsWith('vin') || ledId.startsWith('vout')){
    const isOutput = ledId.startsWith('vout');
    if(isRed) return make({
      severity:'danger',
      title:isOutput ? 'Erro na saida de alimentacao' : 'Erro na entrada de alimentacao',
      meaning:'Vermelho indica falha eletrica que pode afetar V-packs e comunicacao.',
      probableCause:isOutput ? 'Sobrecarga, curto ou dispositivo conectado com defeito.' : 'Fonte instavel, tensao fora do padrao ou entrada com defeito.',
      action:'Isole a carga e normalize energia antes de seguir.',
      checks:['Desconectar cargas suspeitas.', 'Medir tensao.', 'Verificar curto.', 'Religar e observar se volta para verde.'],
      procedureId:'power-check'
    });
    if(isOrange) return make({
      severity:'warn',
      title:isOutput ? 'Baixa potencia na saida' : 'Baixa potencia na entrada',
      meaning:'Laranja indica energia abaixo do ideal.',
      probableCause:'Cabo longo, bitola inadequada, fonte fraca ou consumo acima do previsto.',
      action:'Corrija alimentacao/cabeamento para evitar falha intermitente.',
      checks:['Medir tensao sob carga.', 'Revisar bitola e distancia.', 'Conferir fonte.', 'Reduzir carga para testar.'],
      procedureId:'power-check'
    });
    if(isOff && ['vin1','vout1','vout2'].includes(ledId)) return make({
      severity:'warn',
      title:'Alimentacao esperada esta apagada',
      meaning:'Este ponto costuma estar ativo no funcionamento normal da instalacao.',
      probableCause:'Entrada/saida desligada, cabo solto ou carga ausente.',
      action:'Confirme se este circuito deveria estar ligado nesta fazenda.',
      checks:['Comparar com esquema da instalacao.', 'Checar borne/cabo.', 'Validar configuracao.', 'Registrar se estiver propositalmente desligado.'],
      procedureId:'power-check'
    });
  }

  if(ledId.startsWith('usb')){
    if(isGreen) return make({
      severity:'info',
      title:'USB ativo',
      meaning:'USB verde indica dispositivo ou atividade USB presente.',
      probableCause:'Pendrive conectado, backup/transferencia ou periferico ativo.',
      action:'Confirme se o uso do USB e intencional antes de remover qualquer dispositivo.',
      checks:['Verificar USB fisico.', 'Confirmar se ha backup em andamento.', 'Evitar remover durante escrita.', 'Registrar se foi usado para manutencao.'],
      procedureId:'menu-da'
    });
    if(isRed || isOrange) return make({
      severity:'warn',
      title:'USB fora do padrao',
      meaning:'Cor de alerta em USB nao faz parte do funcionamento normal sem dispositivo.',
      probableCause:'Dispositivo USB com erro, consumo indevido ou atividade incompleta.',
      action:'Remova com seguranca, teste novamente e registre se persistir.',
      checks:['Confirmar se ha dispositivo USB.', 'Remover apos garantir que nao ha escrita.', 'Reiniciar validacao.', 'Testar outro pendrive se necessario.'],
      procedureId:'menu-da'
    });
  }

  if(['o1','i1','o2','i2'].includes(ledId)){
    if(isRed) return make({
      severity:'danger',
      title:'Erro em entrada/saida digital',
      meaning:'Vermelho indica falha no circuito de I/O.',
      probableCause:'Curto, sobrecarga ou dispositivo externo ligado incorretamente.',
      action:'Inspecione o dispositivo conectado e isole o circuito antes de prosseguir.',
      checks:['Identificar dispositivo ligado ao I/O.', 'Verificar curto/sobrecarga.', 'Desconectar para teste.', 'Validar retorno ao estado normal.'],
      procedureId:'power-check'
    });
    if(isOrange || isGreen) return make({
      severity:'info',
      title:'I/O ativo',
      meaning:'Entrada ou saida digital ativa. Pode ser normal dependendo da instalacao.',
      probableCause:'Dispositivo externo acionado ou configuracao ativa no Velos.',
      action:'Confirme se este I/O deveria estar ativo neste ponto.',
      checks:['Conferir o que esta ligado ao I/O.', 'Comparar com configuracao do Velos.', 'Registrar caso seja acionamento proposital.'],
      procedureId:'menu-da'
    });
  }

  return make({procedureId: exact ? actionForLed(ledId)?.id : undefined});
};
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
const EMPRESA_ACESSO = ['Alta Genetics', 'Genex Brasil', 'Urus'];
const centralOfficialName = value => {
  if (value === 'Alta Genetics') return 'ALTA Genetics';
  if (value === 'Genex Brasil') return 'GENEX Brasil';
  if (value === 'Urus') return 'URUS';
  return value || '';
};
const centralShortName = value => {
  if (value === 'Alta Genetics') return 'ALTA';
  if (value === 'Genex Brasil') return 'GENEX';
  if (value === 'Urus') return 'URUS';
  if (value === 'Outra / Não informado') return 'Outras';
  return value || 'Outras';
};
const normalizeEmpresaAcesso = value => EMPRESA_ACESSO.includes(value) ? value : 'Urus';
const APP_ROLES = ['user', 'admin', 'super_admin'];
const APP_ROLE_LABELS = {user:'Usuário',admin:'Administrador',super_admin:'Super admin'};
const normalizeAppRole = value => APP_ROLES.includes(value) ? value : 'user';
const normalizeProfile = profile => profile ? ({
  ...profile,
  empresa_acesso: normalizeEmpresaAcesso(profile.empresa_acesso),
  app_role: normalizeAppRole(profile.app_role),
  ativo: profile.ativo !== false
}) : null;
const isAppAdminProfile = profile => ['admin','super_admin'].includes(normalizeAppRole(profile?.app_role)) && profile?.ativo !== false;
const PROFILE_SELECT = 'id,email,nome,empresa_acesso,app_role,ativo,created_at,updated_at';
const allowedCentraisForAccess = value => {
  const access = normalizeEmpresaAcesso(value);
  return access === 'Urus' ? CENTRAIS : [access];
};
const currentEmpresaAcesso = data => normalizeEmpresaAcesso(data?.currentUser?.empresa_acesso || data?.currentProfile?.empresa_acesso);
const allowedCentrais = data => data?.allowedCentrais?.length ? data.allowedCentrais : allowedCentraisForAccess(currentEmpresaAcesso(data));
const canAccessCentralValue = (central, data) => currentEmpresaAcesso(data) === 'Urus' || (central || '') === currentEmpresaAcesso(data);
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
const VISIT_STATUS_WAITING_RETURN = 'Aguardando retorno';
const VISIT_STATUS_RESOLVED_RETURN = 'Resolvida por retorno';
const visitHasPending = v => Boolean(String(v?.pendencias||'').trim() || String(v?.proxima_acao||'').trim());
const visitSummaryText = v => String(v?.resumo||'').trim() || `${v?.tipo||'Visita'} registrada em ${brDate(v?.data_visita)} sem pendências.`;
const visitResolvedByReturn = v => String(v?.status||'').trim() === VISIT_STATUS_RESOLVED_RETURN || Boolean(v?.resolved_by_visit_id || v?.resolved_at);
const visitNeedsReturn = v => !visitResolvedByReturn(v) && (String(v?.status||'').trim() === VISIT_STATUS_WAITING_RETURN || v?.retorno_necessario === true);
const visitHasOpenPending = v => !visitResolvedByReturn(v) && visitHasPending(v);
const isOpenVisit = v => String(v?.status||'').trim() === VISIT_STATUS_OPEN || (v?.iniciada_em && !v?.finalizada_em && ![VISIT_STATUS_DONE,VISIT_STATUS_PENDING,VISIT_STATUS_WAITING_RETURN,VISIT_STATUS_RESOLVED_RETURN].includes(String(v?.status||'').trim()));
const visitDisplayStatus = v => isOpenVisit(v) ? VISIT_STATUS_OPEN : visitResolvedByReturn(v) ? VISIT_STATUS_RESOLVED_RETURN : visitNeedsReturn(v) ? VISIT_STATUS_WAITING_RETURN : visitHasPending(v) ? VISIT_STATUS_PENDING : VISIT_STATUS_DONE;
const visitStatusTone = v => isOpenVisit(v) ? 'open' : visitResolvedByReturn(v) ? 'resolved' : (visitNeedsReturn(v) || visitHasPending(v)) ? 'pending' : 'ok';
const closeVisitPayload = visit => ({...visit,status:visitHasPending(visit)?(visitNeedsReturn(visit)?VISIT_STATUS_WAITING_RETURN:VISIT_STATUS_PENDING):VISIT_STATUS_DONE,finalizada_em:visit.finalizada_em||nowISO(),resumo:String(visit.resumo||'').trim()||visitSummaryText(visit),updated_at:nowISO()});
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
const STATE_CENTER = {
  AC:[-9.02,-70.81], AL:[-9.57,-36.78], AP:[1.41,-51.77], AM:[-3.47,-65.10], BA:[-12.58,-41.70], CE:[-5.20,-39.53], DF:[-15.78,-47.93],
  ES:[-19.58,-40.52], GO:[-15.98,-49.86], MA:[-5.42,-45.44], MT:[-12.64,-55.42], MS:[-20.51,-54.54], MG:[-18.51,-44.55], PA:[-3.79,-52.48],
  PB:[-7.28,-36.72], PR:[-24.89,-51.55], PE:[-8.38,-37.86], PI:[-7.72,-42.73], RJ:[-22.25,-42.66], RN:[-5.81,-36.59], RS:[-30.03,-53.22],
  RO:[-10.83,-63.34], RR:[1.99,-61.33], SC:[-27.33,-49.44], SP:[-22.26,-48.48], SE:[-10.57,-37.45], TO:[-10.18,-48.33]
};
const STATE_COLORS = { 'Alta Genetics':'#0b5cab', 'Genex Brasil':'#009d94', 'Outra / Não informado':'#8b5cf6', mixed:'#64748b', none:'#e5e7eb' };
function getFarmUF(f){ return (f.estado_uf || parseUF(f.cidade) || '').toUpperCase(); }
function parseUF(city=''){ const m=String(city).match(/\b([A-Z]{2})\b$/); return m?.[1] || ''; }
function farmLatLng(f){ if(f.latitude && f.longitude) return [Number(f.latitude), Number(f.longitude)]; const uf=getFarmUF(f); return STATE_CENTER[uf] || [-14.2350,-51.9253]; }
function mapCentral(value){ return CENTRAIS.includes(value) ? value : 'Outra / Não informado'; }
function centralForUF(fazendas, uf){ const list=fazendas.filter(f=>getFarmUF(f)===uf); if(!list.length) return 'none'; const counts={}; list.forEach(f=>{ const c=mapCentral(f.central); counts[c]=(counts[c]||0)+1; }); const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]); return sorted.length>1 && sorted[0][1]===sorted[1][1] ? 'mixed' : sorted[0][0]; }
function coverageFarmMarkerIcon(f){
  const central=mapCentral(f?.central), color=STATE_COLORS[central]||STATE_COLORS.mixed;
  const glyph='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 6l8 5.2V20H4z"/><path d="M8 20v-5.2h8V20"/><path d="M8.6 11.5h6.8"/></svg>';
  return L.divIcon({
    className:'coverage-farm-marker-wrap',
    html:`<span class="coverage-farm-marker" style="--coverage-color:${color}">${glyph}</span>`,
    iconSize:[34,40], iconAnchor:[17,34], popupAnchor:[0,-31]
  });
}
function spreadCoverageFarms(farms){
  const groups={};
  farms.forEach(farm=>{
    const lat=Number(farm.latitude), lng=Number(farm.longitude), exact=Number.isFinite(lat)&&Number.isFinite(lng)&&farm.latitude!==''&&farm.longitude!=='';
    const base=exact?[lat,lng]:farmLatLng(farm), uf=getFarmUF(farm)||'BR';
    const key=exact?`coord:${lat.toFixed(4)}:${lng.toFixed(4)}`:`state:${uf}`;
    (groups[key] ||= []).push({farm,base,exact});
  });
  return Object.values(groups).flatMap(group=>group.map((item,index)=>{
    if(group.length===1)return {...item.farm,_coveragePosition:item.base,_coverageExact:item.exact};
    const ring=Math.floor(index/8), slot=index%8, slots=Math.min(8,group.length-ring*8);
    const angle=(-Math.PI/2)+(Math.PI*2*slot/Math.max(slots,1));
    const radius=(item.exact ? .018 : .28)+(ring*(item.exact ? .014 : .18));
    const lat=item.base[0]+Math.sin(angle)*radius;
    const lng=item.base[1]+Math.cos(angle)*radius/Math.max(Math.cos(item.base[0]*Math.PI/180),.42);
    return {...item.farm,_coveragePosition:[lat,lng],_coverageExact:item.exact};
  }));
}
function coverageGradient(parts,total){
  if(!total)return STATE_COLORS.none;
  let cursor=0;
  const stops=parts.filter(item=>item.count>0).map(item=>{
    const start=cursor; cursor+=(item.count/total)*100;
    return `${item.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
  });
  return `conic-gradient(${stops.join(',')})`;
}
function coverageStateIcon(state){
  const gradient=coverageGradient(state.parts,state.total);
  return L.divIcon({
    className:'coverage-state-marker-wrap',
    html:`<div class="coverage-state-marker" style="--coverage-gradient:${gradient}"><span><b>${state.total}</b></span><em>${state.uf}</em></div>`,
    iconSize:[58,64], iconAnchor:[29,32], popupAnchor:[0,-29]
  });
}
function getGeoUF(feature){ const p=feature?.properties||{}; const raw=p.sigla || p.SIGLA || p.uf || p.UF || p.codarea || p.CD_UF || p.id || p.ID; if(String(raw||'').length===2 && /[A-Z]{2}/.test(String(raw))) return String(raw).toUpperCase(); const str=String(raw||'').replace(/\D/g,''); return UF_CODES[Number(str)] || ''; }
function flattenCoords(coords, out=[]){ if(!Array.isArray(coords)) return out; if(typeof coords[0]==='number' && typeof coords[1]==='number'){ out.push(coords); return out; } coords.forEach(c=>flattenCoords(c,out)); return out; }
function centroidOfGeoJSON(geo){ const feature = geo?.type==='FeatureCollection' ? geo.features?.[0] : geo?.type==='Feature' ? geo : null; const pts = flattenCoords(feature?.geometry?.coordinates || []); if(!pts.length) return null; let lon=0, lat=0; pts.forEach(([x,y])=>{lon+=Number(x); lat+=Number(y)}); return [lat/pts.length, lon/pts.length]; }
async function fetchCityCentroid(codigo){ if(!codigo) return null; const url=`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigo}?formato=application/vnd.geo+json&qualidade=minima`; const res=await fetch(url); if(!res.ok) return null; const geo=await res.json(); return centroidOfGeoJSON(geo); }

function saveLocal(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function loadLocal(k){ try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } }
const cleanDisplayName = value => String(value || '').trim().replace(/\s+/g, ' ');
const nameFromEmail = email => {
  const raw = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  return raw ? raw.replace(/\b\w/g, c => c.toUpperCase()) : '';
};
const isEmailAliasName = (name, email) => {
  const clean = value => normalizeText(String(value || '')).replace(/\s+/g, '');
  return Boolean(name && email && clean(name) === clean(String(email).split('@')[0].replace(/[._-]+/g, ' ')));
};
const personName = person => cleanDisplayName(person?.nome || person?.name || person?.full_name || person?.user_metadata?.nome || person?.user_metadata?.name || '') || nameFromEmail(person?.email) || '';
const displayNameForUser = (profile, authUser) => {
  const profileName = cleanDisplayName(profile?.nome);
  const metaName = cleanDisplayName(authUser?.user_metadata?.nome || authUser?.user_metadata?.name || authUser?.user_metadata?.full_name);
  if (profileName && !isEmailAliasName(profileName, authUser?.email)) return profileName;
  return metaName || profileName || nameFromEmail(authUser?.email) || 'Usuário';
};
const shortDisplayName = value => cleanDisplayName(value).split(/\s+/).slice(0, 2).join(' ');
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
  const [fazendas,setFazendas]=useState([]), [equipamentos,setEquipamentos]=useState([]), [visitas,setVisitas]=useState([]), [checklists,setChecklists]=useState([]), [diagnosticos,setDiagnosticos]=useState([]), [planejamentos,setPlanejamentos]=useState([]), [obstaculos,setObstaculos]=useState([]), [testesCobertura,setTestesCobertura]=useState([]), [evidencias,setEvidencias]=useState([]), [fazendaMembros,setFazendaMembros]=useState([]), [dadosRestritos,setDadosRestritos]=useState([]), [integrationLinks,setIntegrationLinks]=useState([]);
  const [profiles,setProfiles]=useState([]), [adminLogs,setAdminLogs]=useState([]);
  const [currentProfile,setCurrentProfile]=useState(null);
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

  async function loadCurrentProfile(){
    if(!cloud || !user?.id) return null;
    const fallback = {
      id: user.id,
      email: String(user.email || '').trim().toLowerCase(),
      nome: displayNameForUser(null, user),
      empresa_acesso: normalizeEmpresaAcesso(user.user_metadata?.empresa_acesso),
      app_role: 'user',
      ativo: true
    };
    let {data:profile,error} = await supabase.from('profiles').select(PROFILE_SELECT).eq('id',user.id).maybeSingle();
    if(error && /app_role|ativo/i.test(error.message || '')){
      const legacy = await supabase.from('profiles').select('id,email,nome,empresa_acesso').eq('id',user.id).maybeSingle();
      profile = legacy.data;
      error = legacy.error;
    }
    if(error){
      console.warn('Perfil não carregado:', error.message);
      return fallback;
    }
    if(!profile){
      const {data:saved,error:insertError}=await supabase.from('profiles').insert({...fallback,updated_at:nowISO()}).select(PROFILE_SELECT).single();
      if(insertError){
        console.warn('Perfil não criado:', insertError.message);
        return fallback;
      }
      return normalizeProfile(saved);
    }
    return normalizeProfile(profile);
  }

  async function loadAdminDirectory(profile=currentProfile){
    if(!cloud || !isAppAdminProfile(profile)){
      setProfiles([]);
      setAdminLogs([]);
      return {ok:false};
    }
    const usersResult = await supabase.from('profiles').select(PROFILE_SELECT).order('nome',{ascending:true});
    if(usersResult.error){
      console.warn('Usuários não carregados:', usersResult.error.message);
      setProfiles([]);
      return {ok:false,error:usersResult.error};
    }
    setProfiles((usersResult.data||[]).map(normalizeProfile));
    const logsResult = await supabase.from('admin_logs').select('*').order('created_at',{ascending:false}).limit(20);
    if(logsResult.error){
      console.warn('Auditoria não carregada:', logsResult.error.message);
      setAdminLogs([]);
    } else {
      setAdminLogs(logsResult.data||[]);
    }
    return {ok:true};
  }

  useEffect(()=>{
    let alive = true;
    async function load(){
      setLoading(true);
      if(cloud){
        const profile = await loadCurrentProfile();
        if(!alive) return;
        setCurrentProfile(profile);
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
        const membros = await supabase.from('fazenda_membros').select('*, profiles:user_id(id,email,nome,empresa_acesso)').order('created_at',{ascending:true});
        if(!membros.error)setFazendaMembros(membros.data||[]);else{console.warn('Compartilhamento não carregado:',membros.error.message);setFazendaMembros([]);}
        const restritos = await supabase.from('fazenda_dados_restritos').select('*').order('updated_at',{ascending:false});
        if(!restritos.error)setDadosRestritos(restritos.data||[]);else{console.warn('Dados restritos não carregados:',restritos.error.message);setDadosRestritos([]);}
        const links = await supabase.from('external_integration_links').select('*').eq('provider','routine-assist').eq('entity_type','fazenda').order('created_at',{ascending:false});
        if(!links.error)setIntegrationLinks(links.data||[]);else{console.warn('Links de integração não carregados:',links.error.message);setIntegrationLinks([]);}
        if(isAppAdminProfile(profile)) await loadAdminDirectory(profile); else { setProfiles([]); setAdminLogs([]); }
        setOk();
      } else {
        setFazendas(loadLocal('cta_fazendas').map(normalizeFarmRow)); setEquipamentos(loadLocal('cta_equipamentos')); setVisitas(loadLocal('cta_visitas')); setChecklists(loadLocal('cta_checklists')); setDiagnosticos(loadLocal('cta_diagnosticos')); setPlanejamentos(loadLocal('cta_planejamentos')); setObstaculos(loadLocal('cta_obstaculos')); setTestesCobertura(loadLocal('cta_testes_cobertura')); setEvidencias(loadLocal('cta_evidencias')); setFazendaMembros([]); setDadosRestritos(loadLocal('cta_dados_restritos'));
        setProfiles([]);
        setAdminLogs([]);
        setIntegrationLinks([]);
        setCurrentProfile(null);
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
  async function deleteFazenda(farmOrId){
    const id = typeof farmOrId === 'string' ? farmOrId : farmOrId?.id;
    if(!id)return {ok:false};
    const evidencePaths = evidencias.filter(item=>item.fazenda_id===id&&item.arquivo_path).map(item=>item.arquivo_path);
    if(cloud){
      const { error } = await supabase.from('fazendas').delete().eq('id',id);
      if(error){
        setError(`Erro ao remover fazenda: ${error.message}`, error);
        notify(`Nao foi possivel remover a fazenda: ${error.message}`,'error');
        return {ok:false,error};
      }
      if(evidencePaths.length) await supabase.storage.from(EVIDENCE_BUCKET).remove(evidencePaths).catch(()=>{});
      setOk();
    }
    setFazendas(prev=>{const next=prev.filter(row=>row.id!==id); if(!cloud) saveLocal('cta_fazendas',next); return next;});
    setEquipamentos(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_equipamentos',next); return next;});
    setVisitas(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_visitas',next); return next;});
    setChecklists(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_checklists',next); return next;});
    setDiagnosticos(prev=>{const next=prev.map(row=>row.fazenda_id===id?{...row,fazenda_id:null}:row); if(!cloud) saveLocal('cta_diagnosticos',next); return next;});
    setPlanejamentos(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_planejamentos',next); return next;});
    setObstaculos(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_obstaculos',next); return next;});
    setTestesCobertura(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_testes_cobertura',next); return next;});
    setEvidencias(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_evidencias',next); return next;});
    setFazendaMembros(prev=>prev.filter(row=>row.fazenda_id!==id));
    setDadosRestritos(prev=>{const next=prev.filter(row=>row.fazenda_id!==id); if(!cloud) saveLocal('cta_dados_restritos',next); return next;});
    notify('Fazenda excluida.');
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
      sistema: row.sistema || '',
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
    const {data:profile,error:profileError}=await supabase.from('profiles').select('id,email,nome,empresa_acesso').eq('email',cleanEmail).maybeSingle();
    if(profileError){ notify(`Não foi possível buscar o usuário: ${profileError.message}`,'error'); return {ok:false,error:profileError}; }
    if(!profile){ notify('Usuário não encontrado. Ele precisa criar uma conta e entrar no app pelo menos uma vez.','warning'); return {ok:false}; }
    if(profile.id===farm.user_id){ notify('Este usuário já é o proprietário da fazenda.','warning'); return {ok:false}; }
    if(!canAccessCentralValue(farm.central,{currentUser:profile})){
      notify('Este usuário pertence a outra central e não pode acessar esta fazenda.','warning');
      return {ok:false};
    }
    const row={fazenda_id:farm.id,user_id:profile.id,role,created_by:user?.id,updated_at:nowISO()};
    const {data:saved,error}=await supabase.from('fazenda_membros').upsert(row,{onConflict:'fazenda_id,user_id'}).select('*, profiles:user_id(id,email,nome,empresa_acesso)').single();
    if(error){ notify(`Não foi possível compartilhar: ${error.message}`,'error'); return {ok:false,error}; }
    setFazendaMembros(prev=>{const next=prev.filter(m=>!(m.fazenda_id===farm.id&&m.user_id===profile.id));return [...next,saved];});
    notify('Acesso liberado para a fazenda.');
    return {ok:true,data:saved};
  }
  async function updateFarmMember(member, role){
    if(!cloud)return {ok:false};
    const {data:saved,error}=await supabase.from('fazenda_membros').update({role,updated_at:nowISO()}).eq('id',member.id).select('*, profiles:user_id(id,email,nome,empresa_acesso)').single();
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
  async function saveCurrentProfile(profile){
    if(!cloud || !user?.id){ notify('Configurações de perfil exigem Supabase ativo.','warning'); return {ok:false}; }
    const nome=cleanDisplayName(profile?.nome);
    if(nome.length<2){ notify('Informe como você quer ser chamado.','warning'); return {ok:false}; }
    const {data:saved,error}=await supabase.from('profiles').update({nome,updated_at:nowISO()}).eq('id',user.id).select(PROFILE_SELECT).single();
    if(error){ notify(`Não foi possível salvar seu perfil: ${error.message}`,'error'); return {ok:false,error}; }
    const normalized=normalizeProfile(saved);
    setCurrentProfile(normalized);
    setProfiles(prev=>{
      const exists=prev.some(p=>p.id===normalized.id);
      return exists ? prev.map(p=>p.id===normalized.id?normalized:p) : [...prev,normalized];
    });
    notify('Perfil atualizado.');
    return {ok:true,data:normalized};
  }
  async function updateCurrentUserPassword(password){
    if(!cloud || !supabase){ notify('Troca de senha exige Supabase ativo.','warning'); return {ok:false}; }
    const clean=String(password||'');
    if(clean.length<6){ notify('A senha precisa ter pelo menos 6 caracteres.','warning'); return {ok:false}; }
    const {error}=await supabase.auth.updateUser({password:clean});
    if(error){ notify(`Não foi possível trocar a senha: ${error.message}`,'error'); return {ok:false,error}; }
    notify('Senha atualizada.');
    return {ok:true};
  }
  async function recordAdminLog(acao, targetUserId, detalhes={}){
    if(!cloud || !isAppAdminProfile(currentProfile)) return;
    const {error}=await supabase.from('admin_logs').insert({actor_id:user?.id,target_user_id:targetUserId||null,acao,detalhes});
    if(error) console.warn('Auditoria não registrada:', error.message);
    else await loadAdminDirectory(currentProfile);
  }
  async function saveAdminProfile(profile){
    if(!cloud || !isAppAdminProfile(currentProfile)){ notify('Acesso gerencial não disponível para esta conta.','warning'); return {ok:false}; }
    if(!profile?.id){ notify('Usuário inválido.','error'); return {ok:false}; }
    const clean={
      nome:String(profile.nome||'').trim() || null,
      empresa_acesso:normalizeEmpresaAcesso(profile.empresa_acesso),
      app_role:normalizeAppRole(profile.app_role),
      ativo:profile.ativo !== false,
      updated_at:nowISO()
    };
    const self=profile.id===user?.id;
    if(self && !clean.ativo){ notify('Você não pode bloquear o próprio usuário.','warning'); return {ok:false}; }
    if(self && !isAppAdminProfile(clean)){ notify('Você não pode remover o próprio acesso gerencial por aqui.','warning'); return {ok:false}; }
    const {data:saved,error}=await supabase.from('profiles').update(clean).eq('id',profile.id).select(PROFILE_SELECT).single();
    if(error){ notify(`Não foi possível atualizar usuário: ${error.message}`,'error'); return {ok:false,error}; }
    const normalized=normalizeProfile(saved);
    setProfiles(prev=>prev.map(p=>p.id===normalized.id?normalized:p));
    if(self) setCurrentProfile(normalized);
    await recordAdminLog('profile_updated', normalized.id, {empresa_acesso:normalized.empresa_acesso, app_role:normalized.app_role, ativo:normalized.ativo});
    notify('Usuário atualizado.');
    return {ok:true,data:normalized};
  }
  async function resetAdminUserPassword(profile){
    if(!cloud || !isAppAdminProfile(currentProfile)){ notify('Acesso gerencial não disponível para esta conta.','warning'); return {ok:false}; }
    const email=String(profile?.email||'').trim().toLowerCase();
    if(!email){ notify('Este usuário não possui e-mail cadastrado.','warning'); return {ok:false}; }
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    if(error){ notify(`Não foi possível enviar recuperação: ${error.message}`,'error'); return {ok:false,error}; }
    await recordAdminLog('password_reset_requested', profile.id, {email});
    notify('Link de recuperação enviado por e-mail.');
    return {ok:true};
  }
  async function promoteFirstAdmin(){
    if(!cloud){ notify('Essa ação exige Supabase ativo.','warning'); return {ok:false}; }
    const {data:saved,error}=await supabase.rpc('promote_first_admin');
    if(error){ notify(`Não foi possível ativar administrador: ${error.message}`,'error'); return {ok:false,error}; }
    const normalized=normalizeProfile(saved);
    setCurrentProfile(normalized);
    await loadAdminDirectory(normalized);
    notify('Administrador inicial ativado.');
    return {ok:true,data:normalized};
  }
  const empresaAcesso = cloud ? normalizeEmpresaAcesso(currentProfile?.empresa_acesso || user?.user_metadata?.empresa_acesso) : 'Urus';
  const currentUserProfile = user ? {id:user.id,email:user.email,nome:displayNameForUser(currentProfile, user),empresa_acesso:empresaAcesso,app_role:normalizeAppRole(currentProfile?.app_role),ativo:currentProfile?.ativo !== false} : null;
  const appAdmin = isAppAdminProfile(currentUserProfile);
  return {
    cloud, loading, dbStatus, testConnection,
    userId:user?.id, currentUser:currentUserProfile, currentProfile, isAppAdmin:appAdmin, empresaAcesso, allowedCentrais:allowedCentraisForAccess(empresaAcesso), fazendas, equipamentos, visitas, checklists, diagnosticos, planejamentos, obstaculos, testesCobertura, evidencias, fazendaMembros, dadosRestritos, integrationLinks, profiles, adminLogs,
    shareFarm, updateFarmMember, removeFarmMember, uploadEvidencias, saveEvidencia, delEvidencia, saveDadosRestritos, saveCurrentProfile, updateCurrentUserPassword, saveAdminProfile, resetAdminUserPassword, refreshAdminData:()=>loadAdminDirectory(currentProfile), promoteFirstAdmin,
    saveFazenda: r => upsert('fazendas', setFazendas, 'cta_fazendas', normalizeFarmRow(withExistingOwner(fazendas,r))),
    saveEquipamento: r => upsert('equipamentos', setEquipamentos, 'cta_equipamentos', withExistingOwner(equipamentos,r)),
    saveVisita: r => upsert('visitas', setVisitas, 'cta_visitas', withExistingOwner(visitas,r)),
    saveChecklist: r => upsert('checklists_fazenda', setChecklists, 'cta_checklists', withExistingOwner(checklists,r)),
    saveDiagnostico: r => upsert('diagnosticos_realizados', setDiagnosticos, 'cta_diagnosticos', withExistingOwner(diagnosticos,r)),
    savePlanejamento: r => upsert('planejamentos_antena', setPlanejamentos, 'cta_planejamentos', withExistingOwner(planejamentos,r)),
    saveObstaculo: r => upsert('obstaculos_cobertura', setObstaculos, 'cta_obstaculos', withExistingOwner(obstaculos,r)),
    saveTesteCobertura: r => upsert('testes_cobertura', setTestesCobertura, 'cta_testes_cobertura', withExistingOwner(testesCobertura,r)),
    delFazenda: deleteFazenda,
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
  const [view,setView]=useState(()=>normalizeMainView(readAppContext().view || 'fazendas'));
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
    supabase.from('profiles').select('id').eq('id',user.id).maybeSingle().then(({data,error})=>{
      if(error){console.warn('Profile sync:',error.message);return;}
      if(data?.id)return;
      supabase.from('profiles').insert({id:user.id,email,nome:displayNameForUser(null,user),empresa_acesso:normalizeEmpresaAcesso(user.user_metadata?.empresa_acesso),updated_at:nowISO()}).then(({error:insertError})=>{if(insertError)console.warn('Profile sync:',insertError.message)});
    });
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
  const goFarm = id => { setSelectedFarmId(id); setView('fazenda'); saveAppContext('fazenda', id); requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'})); };
  const setMainView = v => { const next=normalizeMainView(v); setView(next); if(next!=='fazenda') setSelectedFarmId(null); saveAppContext(next, next==='fazenda'?selectedFarmId:null); };
  const exitLocalMode = () => { localStorage.removeItem(LOCAL_MODE_KEY); saveAppContext('fazendas', null); setLocalMode(false); setSelectedFarmId(null); setView('fazendas'); };
  const logout = async () => { if(localMode){ exitLocalMode(); return; } await supabase?.auth.signOut(); };
  const showGerencial = data.isAppAdmin || data.empresaAcesso === 'Urus';
  const activeTheme = view === 'fazenda' && selectedFarm ? brandThemeKey(selectedFarm.central) : brandThemeKey(data.empresaAcesso);
  return <div className={`app theme-${activeTheme}`}><NotificationCenter/><Sidebar view={view} setView={setMainView} user={user} cloud={data.cloud} localMode={localMode} onExitLocal={exitLocalMode} isAdmin={showGerencial}/><main className="main">
    {(!data.cloud || localMode) && <SystemStatus data={data} localMode={localMode} onDisableLocal={()=>{localStorage.removeItem(LOCAL_MODE_KEY); setLocalMode(false)}}/>}
    {view==='fazendas' && <Fazendas data={data} onOpen={goFarm}/>}
    {view==='suporte' && <SuporteTecnico data={data}/>}
    {(view==='produtividade'||view==='relatorios') && <Produtividade data={data} onOpen={goFarm} initialSection={view==='relatorios'?'relatorios':'visao'}/>}
    {view==='gerencial' && <GerencialUsuarios data={data}/>}
    {view==='fazenda' && selectedFarm && <FazendaDetalhe farm={selectedFarm} data={data} onBack={()=>setMainView('fazendas')}/>}
  </main>{view!=='fazenda'&&<BottomNav view={view} setView={setMainView} user={user} localMode={localMode} onLogout={logout} isAdmin={showGerencial}/>}</div>;
}

function Splash(){return <div className="splash"><Logo/><p>Carregando ambiente técnico...</p></div>}
function Logo(){return <div className="logo appLogo"><img src={appLogo} alt="ControlTech Assist" draggable="false"/><div><b>ControlTech</b><span>Assist</span></div></div>}
function translateAuthError(message=''){
  const m = String(message || '').toLowerCase();
  if(m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if(m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if(m.includes('user already registered')) return 'Este e-mail já possui cadastro. Use entrar ou recupere a senha.';
  if(m.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  return message || 'Não foi possível concluir a ação.';
}

function PasswordField({label,value,onChange,placeholder,autoComplete}){
  const [visible,setVisible]=useState(false);
  return <label className="authField">
    <span>{label}</span>
    <div className="authInput authPasswordInput">
      <ShieldCheck size={18}/>
      <input value={value} onChange={onChange} type={visible?'text':'password'} required placeholder={placeholder} autoComplete={autoComplete}/>
      <button type="button" className="authReveal" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Ocultar senha':'Mostrar senha'}>
        {visible?<EyeOff size={18}/>:<Eye size={18}/>}
      </button>
    </div>
  </label>
}

function Login({onUseLocal}){
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[access,setAccess]=useState('Alta Genetics'),[mode,setMode]=useState('login'),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
  const content={
    login:['Acesso seguro','Entrar no app','Use seu e-mail e senha para continuar.'],
    signup:['Criar conta','Novo acesso','Cadastre seu nome, e-mail e senha.'],
    forgot:['Recuperar senha','Recuperar acesso','Informe seu e-mail para receber o link de redefinição.']
  }[mode];
  const changeMode=(next)=>{setMsg('');setMode(next)};
  const submit=async(e)=>{
    e.preventDefault();
    setMsg('');
    setBusy(true);
    try{
      if(!supabase) throw new Error('Supabase não configurado.');
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim().replace(/\s+/g,' ');
      let result;
      if(mode==='forgot'){
        result = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin });
        if(result.error) throw result.error;
        setMsg('Enviamos um link para redefinir sua senha. Abra o e-mail neste mesmo navegador ou no domínio do app.');
        return;
      }
      if(mode==='signup' && cleanName.length < 3) throw new Error('Informe seu nome completo para criar a conta.');
      if(password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      if(mode==='login'){
        result = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if(result.error) throw result.error;
        setMsg('Entrando...');
      } else {
        const empresaAcesso = normalizeEmpresaAcesso(access);
        result = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name: cleanName, nome: cleanName, full_name: cleanName, empresa_acesso: empresaAcesso } }
        });
        if(result.error) throw result.error;
        if(result.data?.user?.id){
          const {error:profileError}=await supabase.from('profiles').insert({id:result.data.user.id,email:cleanEmail,nome:cleanName,empresa_acesso:empresaAcesso,updated_at:nowISO()});
          if(profileError) console.warn('Profile sync:',profileError.message);
        }
        setMsg('Cadastro criado. Se o Supabase pedir confirmação, verifique seu e-mail antes de entrar.');
      }
    } catch(err){
      console.error('Erro de autenticação:', err);
      setMsg(translateAuthError(err?.message));
    } finally { setBusy(false); }
  };
  return <AuthShell eyebrow={content[0]} title={content[1]} desc={content[2]}>
    <form onSubmit={submit} className="authForm">
      {mode==='signup'&&<label className="authField">
        <span>Nome completo</span>
        <div className="authInput"><UserCheck size={18}/><input value={name} onChange={e=>setName(e.target.value)} type="text" required placeholder="David Costa" autoComplete="name"/></div>
      </label>}
      {mode==='signup'&&<label className="authField">
        <span>Vínculo de acesso</span>
        <div className="authInput authSelectInput"><ShieldCheck size={18}/><select value={access} onChange={e=>setAccess(e.target.value)}>{EMPRESA_ACESSO.map(item=><option key={item} value={item}>{centralOfficialName(item)}</option>)}</select></div>
      </label>}
      <label className="authField">
        <span>E-mail</span>
        <div className="authInput"><Mail size={18}/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="david.costa@empresa.com" autoComplete="email"/></div>
      </label>
      {mode!=='forgot'&&<PasswordField label="Senha" value={password} onChange={e=>setPassword(e.target.value)} placeholder="mínimo 6 caracteres" autoComplete={mode==='login'?'current-password':'new-password'}/>}
      <button className="btn primary authSubmit" disabled={busy}>{busy?'Aguarde...':mode==='login'?'Entrar no app':mode==='signup'?'Criar minha conta':'Enviar link de recuperação'}</button>
    </form>
    <div className="authSecondaryActions">
      {mode==='login'&&<>
        <button type="button" onClick={()=>changeMode('forgot')}>Esqueci minha senha</button>
        <span/>
        <button type="button" onClick={()=>changeMode('signup')}>Criar conta</button>
      </>}
      {mode==='signup'&&<button type="button" onClick={()=>changeMode('login')}>Já tenho conta</button>}
      {mode==='forgot'&&<button type="button" onClick={()=>changeMode('login')}>Voltar para entrar</button>}
    </div>
    <button type="button" className="authEmergencyLink" onClick={onUseLocal}>Modo local de emergência</button>
    {msg&&<div className="notice authNotice">{msg}</div>}
  </AuthShell>
}

function AuthShell({eyebrow,title,desc,children}){
  return <div className="loginPage authPage theme-urus">
    <div className="authBackdrop" aria-hidden="true"><i/><i/><i/></div>
    <div className="authShell">
      <aside className="authAside">
        <div className="authAsideTop"><Logo/></div>
        <div className="authHeroCopy">
          <span className="eyebrow">AgTech leiteira</span>
          <h1>Colares inteligentes no campo, dados prontos para decisão.</h1>
          <p>Controle técnico para implantação, visitas, mapas e relatórios em fazendas de leite.</p>
        </div>
      </aside>
      <section className="loginCard authCard">
        <div className="authCardBrand"><Logo/></div>
        <div className="authCardHead"><span>{eyebrow}</span><h2>{title}</h2><p>{desc}</p></div>
        {children}
      </section>
    </div>
  </div>
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
  return <AuthShell eyebrow="Recuperação de acesso" title="Definir nova senha" desc="Crie uma senha nova para voltar ao ControlTech Assist com segurança."><form onSubmit={submit} className="authForm"><PasswordField label="Nova senha" value={password} onChange={e=>setPassword(e.target.value)} placeholder="mínimo 6 caracteres" autoComplete="new-password"/><PasswordField label="Confirmar senha" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="repita a nova senha" autoComplete="new-password"/><button className="btn primary authSubmit" disabled={busy}>{busy?'Salvando...':'Atualizar senha'}</button></form>{msg&&<div className="notice authNotice">{msg}</div>}</AuthShell>
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

function Sidebar({view,setView,user,cloud,localMode,onExitLocal,isAdmin=false}){const items=[['fazendas',MapPinned,'Fazendas'],['produtividade',Gauge,'Produtividade'],['suporte',LifeBuoy,'Suporte'],isAdmin&&['gerencial',ShieldCheck,'Gerencial']].filter(Boolean);return <aside className="sidebar"><Logo/><nav>{items.map(([id,Icon,label])=><button key={id} className={(id==='produtividade'?['produtividade','relatorios'].includes(view):view===id)?'active':''} onClick={()=>setView(id)}><Icon size={20}/>{label}</button>)}<a className="appSwitchLink" href={ROUTINE_ASSIST_URL} target="_blank" rel="noreferrer"><img src="/routine-assist-logo.png" alt=""/><span><b>Routine Assist</b><small>Abrir demandas</small></span></a></nav><div className="sideFoot"><span className={cloud?'cloud on':'cloud'}><Database size={15}/>{cloud?'Supabase ativo':'Modo local'}</span>{localMode&&<button className="logout" onClick={onExitLocal}><Database size={16}/> Voltar ao Supabase</button>}{user&&<button className="logout" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Sair</button>}</div></aside>}
function BottomNav({view,setView,user,localMode,onLogout,isAdmin=false}){const [open,setOpen]=useState(false);const items=[['fazendas',Home,'Início'],['produtividade',BarChart3,'Produtividade'],['suporte',LifeBuoy,'Suporte']];const go=id=>{setView(id);setOpen(false)};const moreActive=view==='gerencial';return <>{open&&<><button className="bottomMoreBackdrop" aria-label="Fechar menu" onClick={()=>setOpen(false)}/><div className="bottomMoreSheet"><div className="bottomMoreTitle"><span>Mais opções</span><button type="button" aria-label="Fechar menu" onClick={()=>setOpen(false)}><X size={16}/></button></div>{isAdmin&&<button className={view==='gerencial'?'active':''} onClick={()=>go('gerencial')}><ShieldCheck size={18}/><span>Admin</span></button>}<a className="appExternalNav sheet" href={ROUTINE_ASSIST_URL} target="_blank" rel="noreferrer" aria-label="Abrir Routine Assist"><img src="/routine-assist-logo.png" alt=""/><span>Routine Assist</span></a>{(user||localMode)&&<button className="mobileLogout" onClick={()=>{setOpen(false);onLogout();}}><LogOut size={18}/><span>Sair</span></button>}</div></> }<nav className="bottomNav" style={{gridTemplateColumns:'repeat(4,1fr)'}}>{items.map(([id,Icon,label])=><button key={id} className={(id==='produtividade'?['produtividade','relatorios'].includes(view):view===id)?'active':''} onClick={()=>go(id)}><Icon size={20}/><span>{label}</span></button>)}<button className={open||moreActive?'active':''} onClick={()=>setOpen(v=>!v)}><Layers size={20}/><span>Mais</span></button></nav></>}
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
const farmIntegrationLink = (farm,data) => data.integrationLinks?.find(link=>link.entity_type==='fazenda'&&link.entity_id===farm?.id&&link.provider==='routine-assist');
function FarmIntegrationBadge({farm,data,compact=false}){
  const link=farmIntegrationLink(farm,data);
  if(!link)return null;
  return <span className={`farmIntegrationBadge iconOnly ${compact?'compact':''}`} title={`Criada via Routine Assist em ${brDate(link.created_at)}`} aria-label="Criada via Routine Assist"><Sparkles size={compact?13:15}/></span>;
}
function PermissionNotice(){return <div className="permissionNotice"><ShieldCheck size={18}/><span>Você está como visualizador. Pode consultar informações e relatórios, mas não alterar dados desta fazenda.</span></div>}


function CoverageMapController({points,trigger}){
  const map=useMapEvents({});
  useEffect(()=>{
    const timer=setTimeout(()=>{
      map.invalidateSize();
      const valid=points.filter(point=>Number.isFinite(point?.[0])&&Number.isFinite(point?.[1]));
      if(!valid.length){map.setView([-15.8,-47.9],4);return;}
      if(valid.length===1){map.setView(valid[0],7);return;}
      map.fitBounds(L.latLngBounds(valid),{padding:[34,34],maxZoom:6});
    },180);
    return()=>clearTimeout(timer);
  },[map,trigger,points.length]);
  return null;
}

function BrasilAtuacaoMap({fazendas,onOpen,centrais=CENTRAIS,visitas=[],compact=false}){
  const [geo,setGeo]=useState(null), [filter,setFilter]=useState('Todas'), [metric,setMetric]=useState('fazendas'), [err,setErr]=useState(''), [fullscreen,setFullscreen]=useState(false), [showAllStates,setShowAllStates]=useState(false);
  useEffect(()=>{if(filter!=='Todas'&&!centrais.includes(filter))setFilter('Todas');},[filter,centrais.join('|')]);
  useEffect(()=>{if(!fullscreen)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous}},[fullscreen]);
  useEffect(()=>{
    let alive=true;
    fetch('https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF')
      .then(r=>{if(!r.ok)throw new Error('IBGE indisponível');return r.json()})
      .then(g=>{if(alive){setGeo(g);setErr('')}})
      .catch(()=>alive&&setErr('Não foi possível carregar a malha dos estados pelo IBGE. Os pontos das fazendas continuam disponíveis.'));
    return()=>{alive=false};
  },[]);
  const allFarmById=useMemo(()=>new Map(fazendas.map(f=>[f.id,f])),[fazendas]);
  const farms=useMemo(()=>fazendas.filter(f=>filter==='Todas'||mapCentral(f.central)===filter),[fazendas,filter]);
  const farmIds=useMemo(()=>new Set(farms.map(f=>f.id)),[farms]);
  const filteredVisits=useMemo(()=>visitas.filter(v=>farmIds.has(v.fazenda_id)),[visitas,farmIds]);
  const mappedFarms=useMemo(()=>spreadCoverageFarms(farms),[farms]);
  const centralList=useMemo(()=>Array.from(new Set([...centrais,...fazendas.map(f=>mapCentral(f.central))])),[centrais.join('|'),fazendas]);
  const metricLabel=metric==='visitas'?'atendimentos':'fazendas';
  const metricUnit=metric==='visitas'?'atendimento':'fazenda';
  const allCentralTotals=useMemo(()=>{
    const totals=Object.fromEntries(centralList.map(c=>[c,0]));
    if(metric==='fazendas')fazendas.forEach(f=>{const central=mapCentral(f.central);totals[central]=(totals[central]||0)+1});
    else visitas.forEach(v=>{const farm=allFarmById.get(v.fazenda_id);if(farm){const central=mapCentral(farm.central);totals[central]=(totals[central]||0)+1}});
    return totals;
  },[metric,fazendas,visitas,allFarmById,centralList.join('|')]);
  const stateStats=useMemo(()=>{
    const states=new Map();
    const ensure=uf=>{
      if(!states.has(uf))states.set(uf,{uf,name:UF_NAMES[uf]||uf,farmCount:0,visitCount:0,counts:Object.fromEntries(centralList.map(c=>[c,0]))});
      return states.get(uf);
    };
    farms.forEach(f=>{const uf=getFarmUF(f);if(uf)ensure(uf).farmCount+=1});
    filteredVisits.forEach(v=>{const farm=allFarmById.get(v.fazenda_id),uf=getFarmUF(farm);if(uf)ensure(uf).visitCount+=1});
    const metricFarms=metric==='fazendas'?farms:filteredVisits.map(v=>allFarmById.get(v.fazenda_id)).filter(Boolean);
    metricFarms.forEach(f=>{const uf=getFarmUF(f);if(!uf)return;const central=mapCentral(f.central),state=ensure(uf);state.counts[central]=(state.counts[central]||0)+1});
    return [...states.values()].map(state=>{
      const parts=centralList.map(central=>({central,label:centralOfficialName(central),count:state.counts[central]||0,color:STATE_COLORS[central]||STATE_COLORS.mixed}));
      const total=parts.reduce((sum,item)=>sum+item.count,0), dominant=[...parts].sort((a,b)=>b.count-a.count)[0];
      return {...state,parts,total,dominant,dominance:total?dominant.count/total:0,center:STATE_CENTER[state.uf]};
    }).sort((a,b)=>b.total-a.total||b.farmCount-a.farmCount||a.uf.localeCompare(b.uf));
  },[farms,filteredVisits,metric,allFarmById,centralList.join('|')]);
  const stateStatsByUF=useMemo(()=>new Map(stateStats.map(state=>[state.uf,state])),[stateStats]);
  const totalMetric=metric==='visitas'?filteredVisits.length:farms.length;
  const activeStates=stateStats.filter(state=>state.total>0);
  const visibleStates=showAllStates?activeStates:activeStates.slice(0,6);
  const filteredCentralTotals=centralList.map(central=>({central,count:stateStats.reduce((sum,state)=>sum+(state.counts[central]||0),0),color:STATE_COLORS[central]||STATE_COLORS.mixed}));
  const leadingCentral=[...filteredCentralTotals].sort((a,b)=>b.count-a.count)[0];
  const styleFeature=feature=>{
    const state=stateStatsByUF.get(getGeoUF(feature)), active=Boolean(state?.total), color=active?(state.dominant?.color||STATE_COLORS.mixed):STATE_COLORS.none;
    return {color:active?color:'#ffffff',weight:active?1.8:1,fillColor:color,fillOpacity:active ? .18+(.34*state.dominance) : .5};
  };
  const mapTrigger=`${filter}-${metric}-${fullscreen}-${mappedFarms.length}-${stateStats.map(s=>`${s.uf}:${s.total}`).join('|')}`;
  const topShare=leadingCentral&&totalMetric?Math.round(leadingCentral.count/totalMetric*100):0;
  const expanded=!compact||fullscreen;
  return <section className={`panel coveragePanel coverageDashboard ${compact?'compact ':''}${fullscreen?'mapFullscreen':''}`}>
    <header className="coverageDashboardHeader">
      <div><span className="eyebrow">Presença técnica</span><h2><Globe2 size={22}/> Mapa de atuação</h2><p>{expanded?'Veja onde as centrais atuam e como cada estado está distribuído.':'Resumo regional das fazendas e atendimentos cadastrados.'}</p></div>
      <button type="button" className="coverageExpandButton" onClick={()=>setFullscreen(value=>!value)} aria-label={fullscreen?'Fechar mapa completo':'Ver mapa completo'} title={fullscreen?'Fechar mapa completo':'Ver mapa completo'}>{fullscreen?<Minimize2 size={19}/>:<Maximize2 size={19}/>}<span>{fullscreen?'Fechar':'Ver mapa completo'}</span></button>
    </header>

    {expanded&&<><div className="coverageToolbar">
      <div className="coverageMetricSwitch" role="group" aria-label="Métrica exibida">
        <button type="button" className={metric==='fazendas'?'active':''} onClick={()=>setMetric('fazendas')} aria-pressed={metric==='fazendas'}><Building2 size={16}/> Fazendas</button>
        <button type="button" className={metric==='visitas'?'active':''} onClick={()=>setMetric('visitas')} aria-pressed={metric==='visitas'}><ClipboardCheck size={16}/> Atendimentos</button>
      </div>
      <div className="coverageCentralFilters" aria-label="Filtrar mapa por central">
        <button type="button" className={filter==='Todas'?'active all':''} onClick={()=>setFilter('Todas')}><i/>Todas <b>{Object.values(allCentralTotals).reduce((sum,count)=>sum+count,0)}</b></button>
        {centrais.map(central=><button type="button" key={central} className={filter===central?'active':''} onClick={()=>setFilter(central)} style={{'--central-color':STATE_COLORS[central]||STATE_COLORS.mixed}}><i/>{centralShortName(central)} <b>{allCentralTotals[central]||0}</b></button>)}
      </div>
    </div>

    <div className="coverageKpis">
      <div><span className="coverageKpiIcon teal"><MapPinned size={18}/></span><p><b>{farms.length}</b><small>fazendas no mapa</small></p></div>
      <div><span className="coverageKpiIcon blue"><ClipboardList size={18}/></span><p><b>{filteredVisits.length}</b><small>atendimentos registrados</small></p></div>
      <div><span className="coverageKpiIcon purple"><Globe2 size={18}/></span><p><b>{stateStats.filter(state=>state.farmCount>0).length}</b><small>estados com presença</small></p></div>
      <div><span className="coverageKpiIcon gold"><BarChart3 size={18}/></span><p><b>{leadingCentral?.count?`${centralShortName(leadingCentral.central)} ${topShare}%`:'-'}</b><small>maior participação em {metricLabel}</small></p></div>
    </div>

    <div className="coverageLegend">
      <span>Leitura do mapa:</span>{centralList.map(central=><b key={central}><i style={{background:STATE_COLORS[central]||STATE_COLORS.mixed}}/>{centralShortName(central)}</b>)}<small>Os círculos nos estados dividem as cores pela participação de cada central.</small>
    </div></>}

    {!expanded&&<div className="coverageCompactSummary">
      <span><MapPinned size={17}/><b>{fazendas.length}</b> fazendas</span>
      <span><ClipboardCheck size={17}/><b>{visitas.length}</b> atendimentos</span>
      <span><Globe2 size={17}/><b>{stateStats.filter(state=>state.farmCount>0).length}</b> estados</span>
      <span className="coverageCompactLegend">{centralList.map(central=><i key={central} style={{background:STATE_COLORS[central]||STATE_COLORS.mixed}} title={centralOfficialName(central)}/>)}</span>
    </div>}

    <div className="brMap coverageMapCanvas"><MapContainer center={[-15.8,-47.9]} zoom={4} minZoom={3} maxZoom={9} className="bigMap" scrollWheelZoom>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
      <CoverageMapController points={mappedFarms.map(f=>f._coveragePosition)} trigger={mapTrigger}/>
      {geo&&<GeoJSON key={mapTrigger} data={geo} style={styleFeature} onEachFeature={(feature,layer)=>{const uf=getGeoUF(feature),state=stateStatsByUF.get(uf),value=state?.total||0;layer.bindTooltip(`${UF_NAMES[uf]||uf||'Estado'} • ${value} ${metricLabel}`);}}/>}
      {activeStates.filter(state=>state.center).map(state=><Marker key={`state-${state.uf}-${metric}`} position={state.center} icon={coverageStateIcon(state)} zIndexOffset={350}><Popup><div className="coveragePopup"><b>{state.name} ({state.uf})</b><span>{state.total} {state.total===1?metricUnit:metricLabel}</span>{state.parts.filter(part=>part.count>0).map(part=><small key={part.central}><i style={{background:part.color}}/>{part.label}: <b>{part.count}</b> ({Math.round(part.count/state.total*100)}%)</small>)}</div></Popup></Marker>)}
      {mappedFarms.map(f=><Marker key={f.id} position={f._coveragePosition} icon={coverageFarmMarkerIcon(f)} zIndexOffset={500}><Tooltip direction="top" offset={[0,-24]}>{f.nome} • {centralShortName(mapCentral(f.central))}</Tooltip><Popup><div className="coveragePopup farm"><b>{f.nome}</b><span>{f.cidade||'-'} {getFarmUF(f)&&`/ ${getFarmUF(f)}`}</span><small><i style={{background:STATE_COLORS[mapCentral(f.central)]}}/>{centralOfficialName(mapCentral(f.central))}</small><small>Regional: <b>{f.regional_nome||'-'}</b></small><small>Colares: <b>{collarBreakdown(f)}</b></small>{!f._coverageExact&&<em>Posição aproximada pelo estado. Cadastre as coordenadas da fazenda para maior precisão.</em>}<button type="button" className="coverageOpenFarm" onClick={()=>onOpen(f.id)}>Abrir fazenda</button></div></Popup></Marker>)}
    </MapContainer>{!geo&&!err&&<div className="coverageMapLoading"><RefreshCw size={18}/> Carregando estados...</div>}</div>
    {expanded&&<p className="coverageMapHint"><Info size={15}/> Use a roda do mouse ou os botões para aproximar; toque nos gráficos dos estados e nos pontos para ver detalhes.</p>}
    {err&&<p className="sourceText coverageMapError">{err}</p>}

    {expanded&&<section className="coverageStateSection">
      <div className="coverageStateHeader"><div><span className="eyebrow">Distribuição regional</span><h3>Participação por estado</h3></div>{activeStates.length>6&&<button type="button" onClick={()=>setShowAllStates(value=>!value)}>{showAllStates?'Mostrar principais':'Ver todos os estados'}</button>}</div>
      {visibleStates.length?<div className="coverageStateGrid">{visibleStates.map(state=><article key={state.uf}>
        <header><span>{state.uf}</span><div><b>{state.name}</b><small>{state.farmCount} fazenda(s) • {state.visitCount} atendimento(s)</small></div><strong>{state.total}</strong></header>
        <div className="coverageShareBar" aria-label={`Distribuição de ${state.name}`}>{state.parts.filter(part=>part.count>0).map(part=><i key={part.central} style={{width:`${part.count/state.total*100}%`,background:part.color}} title={`${part.label}: ${Math.round(part.count/state.total*100)}%`}/>)}</div>
        <footer>{state.parts.filter(part=>part.count>0).map(part=><span key={part.central}><i style={{background:part.color}}/><b>{centralShortName(part.central)}</b> {part.count} • {Math.round(part.count/state.total*100)}%</span>)}</footer>
      </article>)}</div>:<div className="coverageEmpty"><MapPinned size={24}/><span>Nenhum {metricUnit} encontrado para este filtro.</span></div>}
    </section>}
  </section>
}

function centralTone(central) {
  const text = String(central || '').toLowerCase();
  if (text.includes('alta')) return 'alta';
  if (text.includes('genex')) return 'genex';
  return 'other';
}
function brandThemeKey(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('alta')) return 'alta';
  if (text.includes('genex')) return 'genex';
  return 'urus';
}
function BrandLogoMark({brand,className='',fallback:Fallback=Building2}) {
  const key = brandThemeKey(brand);
  const src = BRAND_LOGOS[key];
  return <span className={`brandLogoMark brand-${key} ${className}`} aria-hidden="true">
    {src ? <img src={src} alt="" draggable="false"/> : <Fallback size={20}/>}
  </span>;
}
const REPORT_BRAND_THEMES = {
  alta: {
    key: 'alta',
    name: 'ALTA Genetics',
    logo: BRAND_LOGOS.alta,
    primary: '#003F87',
    secondary: '#0B5CAB',
    soft: '#EAF3FF',
    border: '#B7D7FF',
    cover: 'linear-gradient(135deg,#061D3B,#003F87)'
  },
  genex: {
    key: 'genex',
    name: 'GENEX Brasil',
    logo: BRAND_LOGOS.genex,
    primary: '#009D94',
    secondary: '#057F78',
    soft: '#E6FFFD',
    border: '#99F6E4',
    cover: 'linear-gradient(135deg,#1E1E1C,#009D94)'
  },
  urus: {
    key: 'urus',
    name: 'URUS',
    logo: BRAND_LOGOS.urus || appLogo,
    primary: '#0A6D3A',
    secondary: '#07522C',
    soft: '#ECFDF5',
    border: '#B7E4C7',
    cover: 'linear-gradient(135deg,#020617,#0A6D3A)'
  }
};
const reportBrandForCentral = central => REPORT_BRAND_THEMES[brandThemeKey(central)] || REPORT_BRAND_THEMES.urus;
const centralDisplay = (central) => {
  return centralOfficialName(central) || 'Sem central';
};
const centralMatches = (farm, value) => {
  if (value === 'Todas') return true;
  if (value === 'Outra / Não informado') return centralTone(farm.central) === 'other';
  return (farm.central || '') === value;
};
const farmHasPending = (farm, data) => farmStatus(farm) === 'Com pendência' || collarHasPending(farm) || data.visitas.some(v => v.fazenda_id === farm.id && visitHasOpenPending(v));
const latestFarmVisit = (farm, data) => data.visitas.filter(v => v.fazenda_id === farm.id).sort((a,b) => String(b.data_visita || '').localeCompare(String(a.data_visita || '')))[0];
const FARM_VIEW_MODES = [
  ['cards','Cards',Layers],
  ['lista','Lista',ClipboardList]
];
const FARM_PAGE_SIZES = { cards: 9, lista: 10 };

function Fazendas({data,onOpen}){
  const initialFilters=useMemo(readFarmFilters,[]);
  const [q,setQ]=useState(initialFilters.q),[modal,setModal]=useState(false),[central,setCentral]=useState(initialFilters.central),[status,setStatus]=useState(initialFilters.status),[visitFrom,setVisitFrom]=useState(initialFilters.visitFrom),[visitTo,setVisitTo]=useState(initialFilters.visitTo),[stateFilter,setStateFilter]=useState(initialFilters.state),[cityFilter,setCityFilter]=useState(initialFilters.city),[collarsMin,setCollarsMin]=useState(initialFilters.collarsMin),[collarsMax,setCollarsMax]=useState(initialFilters.collarsMax),[filtersOpen,setFiltersOpen]=useState(false),[settingsOpen,setSettingsOpen]=useState(false);
  const [page,setPage]=useState(1);
  const [secondaryFiltersOpen,setSecondaryFiltersOpen]=useState(Boolean(initialFilters.visitFrom||initialFilters.visitTo||initialFilters.collarsMin!==''||initialFilters.collarsMax!==''));
  const resultsRef=useRef(null);
  const [viewMode,setViewMode]=useState(()=>{
    try{const saved=localStorage.getItem(FARM_VIEW_KEY);return FARM_VIEW_MODES.some(([id])=>id===saved)?saved:'cards';}catch{return 'cards';}
  });
  useEffect(()=>{try{localStorage.setItem(FARM_VIEW_KEY,viewMode)}catch{}},[viewMode]);
  useEffect(()=>{try{localStorage.setItem(FARM_FILTER_KEY,JSON.stringify({q,central,status,visitFrom,visitTo,state:stateFilter,city:cityFilter,collarsMin,collarsMax}))}catch{}},[q,central,status,visitFrom,visitTo,stateFilter,cityFilter,collarsMin,collarsMax]);
  useEffect(()=>{setPage(1)},[q,central,status,visitFrom,visitTo,stateFilter,cityFilter,collarsMin,collarsMax,viewMode]);
  const visibleCentrais=allowedCentrais(data);
  useEffect(()=>{if(central!=='Todas'&&!visibleCentrais.includes(central))setCentral('Todas');},[central,visibleCentrais.join('|')]);
  const stateOptions=useMemo(()=>Array.from(new Set(data.fazendas.map(getFarmUF).filter(Boolean))).sort((a,b)=>(UF_NAMES[a]||a).localeCompare(UF_NAMES[b]||b,'pt-BR')),[data.fazendas]);
  const cityOptions=useMemo(()=>Array.from(new Set(data.fazendas.filter(f=>stateFilter==='Todos'||getFarmUF(f)===stateFilter).map(f=>String(f.cidade||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt-BR')),[data.fazendas,stateFilter]);
  useEffect(()=>{if(cityFilter!=='Todas'&&!cityOptions.includes(cityFilter))setCityFilter('Todas')},[cityFilter,cityOptions.join('|')]);
  const farmEquipments = (farm) => data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const farms=data.fazendas.filter(f=>{
    const equipmentText=farmEquipments(f).map(e=>[e.tipo,e.apelido,e.local_nome].join(' ')).join(' ');
    const matchesText=[f.nome,f.cidade,f.estado_uf,f.responsavel,f.central,f.regional_nome,f.veterinario_apoio,equipmentText].join(' ').toLowerCase().includes(q.toLowerCase());
    const currentStatus=farmStatus(f);
    const matchesStatus=status==='Todos'||currentStatus===status;
    const lastVisit=latestFarmVisit(f,data), lastVisitDate=String(lastVisit?.data_visita||lastVisit?.created_at||'').slice(0,10);
    const matchesVisitFrom=!visitFrom||Boolean(lastVisitDate&&lastVisitDate>=visitFrom);
    const matchesVisitTo=!visitTo||Boolean(lastVisitDate&&lastVisitDate<=visitTo);
    const matchesState=stateFilter==='Todos'||getFarmUF(f)===stateFilter;
    const matchesCity=cityFilter==='Todas'||String(f.cidade||'').trim()===cityFilter;
    const collars=num(f.qtd_colares_prevista), matchesMin=collarsMin===''||collars>=Number(collarsMin), matchesMax=collarsMax===''||collars<=Number(collarsMax);
    return matchesText&&centralMatches(f,central)&&matchesStatus&&matchesVisitFrom&&matchesVisitTo&&matchesState&&matchesCity&&matchesMin&&matchesMax;
  });
  const counts={
    naoIniciadas:data.fazendas.filter(f=>farmStatus(f)==='Não iniciada').length,
    andamento:data.fazendas.filter(f=>farmStatus(f)==='Em andamento').length,
    finalizadas:data.fazendas.filter(f=>farmStatus(f)===FARM_STATUS_DONE).length
  };
  const resetFilters=()=>{setQ('');setCentral('Todas');setStatus('Todos');setVisitFrom('');setVisitTo('');setStateFilter('Todos');setCityFilter('Todas');setCollarsMin('');setCollarsMax('');setSecondaryFiltersOpen(false)};
  const hasActiveFilters=central!=='Todas'||status!=='Todos'||Boolean(visitFrom)||Boolean(visitTo)||stateFilter!=='Todos'||cityFilter!=='Todas'||collarsMin!==''||collarsMax!=='';
  const activeFilterLabels=[
    central!=='Todas'&&centralOfficialName(central),
    status!=='Todos'&&status,
    stateFilter!=='Todos'&&(UF_NAMES[stateFilter]||stateFilter),
    cityFilter!=='Todas'&&cityFilter,
    (visitFrom||visitTo)&&`Visita: ${visitFrom?brDate(visitFrom):'início'} a ${visitTo?brDate(visitTo):'hoje'}`,
    (collarsMin!==''||collarsMax!=='')&&`Colares: ${collarsMin||0} a ${collarsMax||'sem limite'}`
  ].filter(Boolean);
  const greetingName=shortDisplayName(personName(data.currentUser)||'Usuário');
  const saveFarm=async(r)=>data.saveFazenda(r);
  const pageSize=FARM_PAGE_SIZES[viewMode]||FARM_PAGE_SIZES.cards;
  const totalPages=Math.max(1,Math.ceil(farms.length/pageSize));
  const currentPage=Math.min(page,totalPages);
  const pageStart=(currentPage-1)*pageSize;
  const pageEnd=Math.min(pageStart+pageSize,farms.length);
  const pagedFarms=farms.slice(pageStart,pageEnd);
  useEffect(()=>{if(page>totalPages)setPage(totalPages)},[page,totalPages]);
  const changePage=next=>{
    setPage(Math.max(1,Math.min(totalPages,next)));
    requestAnimationFrame(()=>resultsRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
  };
  const renderFarmResults=()=>{
    if(farms.length===0) return <Empty title="Nenhuma fazenda encontrada" text="Altere os filtros ou cadastre uma nova fazenda."/>;
    if(viewMode==='lista') return <div className="farmListView">{pagedFarms.map(f=><FarmListItem key={f.id} farm={f} data={data} onOpen={()=>onOpen(f.id)}/>)}</div>;
    return <div className="farmGrid finderGrid farmGridModern">{pagedFarms.map(f=><FarmCard key={f.id} farm={f} data={data} onOpen={()=>onOpen(f.id)}/>)}</div>;
  };
  return <div className="farmsHome">
    <section className="farmsHeroHome">
      <div className="farmsHeroCopy">
        <span className="eyebrow">Operação de campo</span>
        <h1>Fazendas</h1>
        <div className="farmsHeroMetrics" role="group" aria-label="Filtrar fazendas por situação">
          <button type="button" className={status==='Todos'?'active':''} aria-pressed={status==='Todos'} onClick={()=>setStatus('Todos')}><small>Total</small><b>{data.fazendas.length}</b><em>cadastradas</em></button>
          <button type="button" className={status==='Não iniciada'?'active':''} aria-pressed={status==='Não iniciada'} onClick={()=>setStatus('Não iniciada')}><small>A iniciar</small><b>{counts.naoIniciadas}</b><em>não iniciadas</em></button>
          <button type="button" className={status==='Em andamento'?'active':''} aria-pressed={status==='Em andamento'} onClick={()=>setStatus('Em andamento')}><small>Em andamento</small><b>{counts.andamento}</b><em>em campo</em></button>
          <button type="button" className={status===FARM_STATUS_DONE?'active':''} aria-pressed={status===FARM_STATUS_DONE} onClick={()=>setStatus(FARM_STATUS_DONE)}><small>Concluídas</small><b>{counts.finalizadas}</b><em>finalizadas</em></button>
        </div>
      </div>
      <div className="farmsHeroVisual" aria-hidden="true">
        <div className="fieldRadar"><BrandLogoMark brand={data.empresaAcesso} className="heroBrandLogo"/><i /><i /></div>
        <div className="fieldLines"><span /><span /><span /></div>
      </div>
      <div className="farmsHeroActions">
        <button type="button" className="farmsUserGreeting" onClick={()=>setSettingsOpen(true)} title="Configurações do perfil">
          <span>Olá, <b>{greetingName}</b></span><Settings size={15}/>
        </button>
        <button className="btn primary farmsNewDesktop" onClick={()=>setModal(true)}><Plus size={18}/> Nova fazenda</button>
      </div>
    </section>

    <section className="farmsCommandBar">
      <div className="farmHomeSearch">
        <Search size={19}/>
        <input type="search" aria-label="Buscar por fazenda, cidade, responsável, central ou equipamento" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar fazendas..." />
        {q&&<button type="button" className="farmSearchClear" onClick={()=>setQ('')} aria-label="Limpar busca" title="Limpar busca"><X size={16}/></button>}
      </div>
      <div className="farmViewSwitcher" role="group" aria-label="Modo de visualização">
        {FARM_VIEW_MODES.map(([id,label,Icon])=><button type="button" key={id} className={viewMode===id?'active':''} aria-pressed={viewMode===id} title={label} onClick={()=>setViewMode(id)}><Icon size={16}/><span>{label}</span></button>)}
      </div>
      <button type="button" className={`farmFilterButton ${hasActiveFilters?'active':''}`} aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(true)}>
        <Filter size={18}/><span>Filtros</span>{hasActiveFilters&&<b />}
      </button>
      <button type="button" className="farmNewMobile" onClick={()=>setModal(true)} aria-label="Cadastrar nova fazenda"><Plus size={18}/><span>Nova</span></button>
    </section>

    {activeFilterLabels.length>0&&<div className="farmActiveFilters" aria-label="Filtros ativos">
      <span>Filtros ativos</span>
      <div>{activeFilterLabels.map(label=><b key={label}>{label}</b>)}</div>
      <button type="button" onClick={resetFilters}>Limpar</button>
    </div>}

    <div className="fieldMapSecondary farmsMapPreview"><BrasilAtuacaoMap compact fazendas={data.fazendas} visitas={data.visitas} onOpen={onOpen} centrais={visibleCentrais}/></div>

    <section className="farmResultsPanel" ref={resultsRef}>
      <div className="farmResultsHeader">
        <div><span className="eyebrow">Localizar fazenda</span><h2>{farms.length} resultado(s)</h2>{farms.length>0&&<small>{pageStart+1}-{pageEnd} de {farms.length}</small>}</div>
      </div>
      {renderFarmResults()}
      {farms.length>pageSize&&<div className="farmPagination">
        <button type="button" className="btn light" disabled={currentPage===1} onClick={()=>changePage(currentPage-1)}><ChevronLeft size={17}/> Anterior</button>
        <span>Página <b>{currentPage}</b> de <b>{totalPages}</b></span>
        <button type="button" className="btn light" disabled={currentPage===totalPages} onClick={()=>changePage(currentPage+1)}>Próxima <ChevronLeft className="rotate" size={17}/></button>
      </div>}
    </section>

    {filtersOpen&&<div className="farmFilterSheetBackdrop" onClick={()=>setFiltersOpen(false)}>
      <aside className="farmFilterSheet" onClick={e=>e.stopPropagation()}>
        <header><div><span className="eyebrow">Filtros</span><h3>Refinar lista</h3></div><button type="button" onClick={()=>setFiltersOpen(false)}><X size={18}/></button></header>
        <div className="farmFilterGrid">
          <label>Central<select aria-label="Central" value={central} onChange={e=>setCentral(e.target.value)}><option>Todas</option>{visibleCentrais.map(c=><option key={c} value={c}>{centralOfficialName(c)}</option>)}</select></label>
          <label>Status<select aria-label="Status" value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></label>
        </div>
        <section className="farmFilterGroup">
          <div className="farmFilterGroupTitle"><MapPin size={16}/><span><b>Localização</b><small>A cidade acompanha o estado selecionado.</small></span></div>
          <div className="farmFilterGrid"><label>Estado<select aria-label="Estado" value={stateFilter} onChange={e=>{setStateFilter(e.target.value);setCityFilter('Todas')}}><option value="Todos">Todos</option>{stateOptions.map(uf=><option key={uf} value={uf}>{UF_NAMES[uf]||uf} ({uf})</option>)}</select></label><label>Cidade<select aria-label="Cidade" value={cityFilter} onChange={e=>setCityFilter(e.target.value)}><option value="Todas">Todas</option>{cityOptions.map(city=><option key={city} value={city}>{city}</option>)}</select></label></div>
        </section>
        <details className="farmSecondaryFilters" open={secondaryFiltersOpen} onToggle={event=>setSecondaryFiltersOpen(event.currentTarget.open)}>
          <summary><span><Filter size={16}/><b>Mais filtros</b><small>Última visita e quantidade de colares</small></span><ChevronLeft className="rotate" size={17}/></summary>
          <div>
            <section className="farmFilterGroup">
              <div className="farmFilterGroupTitle"><CalendarDays size={16}/><span><b>Data da última visita</b><small>Informe um período ou deixe em branco.</small></span></div>
              <div className="farmFilterRange"><label>De<input aria-label="De" type="date" value={visitFrom} max={visitTo||undefined} onChange={e=>setVisitFrom(e.target.value)}/></label><label>Até<input aria-label="Até" type="date" value={visitTo} min={visitFrom||undefined} onChange={e=>setVisitTo(e.target.value)}/></label></div>
            </section>
            <section className="farmFilterGroup">
              <div className="farmFilterGroupTitle"><Tags size={16}/><span><b>Quantidade de colares</b><small>Faixa da quantidade prevista na fazenda.</small></span></div>
              <div className="farmFilterRange"><label>Mínimo<input aria-label="Mínimo" type="number" inputMode="numeric" min="0" value={collarsMin} onChange={e=>setCollarsMin(e.target.value)} placeholder="Ex.: 50"/></label><label>Máximo<input aria-label="Máximo" type="number" inputMode="numeric" min={collarsMin||0} value={collarsMax} onChange={e=>setCollarsMax(e.target.value)} placeholder="Ex.: 500"/></label></div>
            </section>
          </div>
        </details>
        <div className="farmSheetActions"><button className="btn light" onClick={resetFilters}>Limpar filtros</button><button className="btn primary" onClick={()=>setFiltersOpen(false)}>Aplicar</button></div>
      </aside>
    </div>}
    {modal&&<FazendaModal data={data} onClose={()=>setModal(false)} onSave={saveFarm}/>}
    {settingsOpen&&<ProfileSettingsModal data={data} onClose={()=>setSettingsOpen(false)}/>}
  </div>
}
function ProfileSettingsModal({data,onClose}){
  const [name,setName]=useState(personName(data.currentUser));
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [saving,setSaving]=useState(false);
  const [changing,setChanging]=useState(false);
  const saveProfile=async e=>{
    e.preventDefault();
    setSaving(true);
    const result=await data.saveCurrentProfile?.({nome:name});
    setSaving(false);
    if(result?.ok) onClose();
  };
  const changePassword=async e=>{
    e.preventDefault();
    if(password!==confirm){ notify('As senhas não conferem.','warning'); return; }
    setChanging(true);
    const result=await data.updateCurrentUserPassword?.(password);
    setChanging(false);
    if(result?.ok){ setPassword(''); setConfirm(''); }
  };
  return <Modal title="Configurações" onClose={onClose}>
    <div className="profileSettings">
      <section className="profileSettingsHero">
        <div className="profileAvatar"><UserCheck size={22}/></div>
        <div><span className="eyebrow">Seu perfil</span><h3>{personName(data.currentUser)||'Usuário'}</h3><p>Esse nome aparece na saudação e como sugestão de responsável técnico.</p></div>
      </section>
      <form className="profileSettingsCard" onSubmit={saveProfile}>
        <Field label="Nome de exibição"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: David Costa" autoComplete="name"/></Field>
        <div className="profileSettingsActions"><button type="submit" className="btn primary" disabled={saving}>{saving?'Salvando...':'Salvar nome'}</button></div>
      </form>
      <form className="profileSettingsCard" onSubmit={changePassword}>
        <div className="profileSettingsTitle"><ShieldCheck size={18}/><b>Trocar senha</b></div>
        <div className="passwordGrid">
          <Field label="Nova senha"><div className="profilePasswordInput"><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="mínimo 6 caracteres" autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></Field>
          <Field label="Confirmar senha"><input type={showPassword?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="repita a senha" autoComplete="new-password"/></Field>
        </div>
        <div className="profileSettingsActions"><button type="submit" className="btn light" disabled={changing||!password}>{changing?'Atualizando...':'Atualizar senha'}</button></div>
      </form>
    </div>
  </Modal>
}
function FarmCard({farm,data,onOpen}){
  const access=farmAccess(farm,data);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const eq=equips.length;
  const planned=num(farm.qtd_colares_prevista), installed=collarInstalled(farm), delivered=collarDelivered(farm), handled=collarHandled(farm);
  const pct=collarProgress(farm);
  const displayStatus=farmStatus(farm);
  const tone=centralTone(farm.central);
  const lastVisit=latestFarmVisit(farm,data);
  const hasGps=Boolean(farm.latitude&&farm.longitude);
  const pending=farmHasPending(farm,data);
  const peopleLine=[farm.responsavel,farm.regional_nome].filter(Boolean).join(' • ')||'Responsável não informado';
  return <article className={`farmCard farmCardPro central-${tone}`} role="button" tabIndex={0} aria-label={`Abrir detalhes de ${farm.nome}`} onClick={onOpen} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen()}}}>
    <div className="farmCardAccent" />
    <div className="farmCardHeader">
      <div className={`farmBrandMark ${tone}`}><Building2 size={20}/></div>
      <div className="farmCardBadges">
        <FarmIntegrationBadge farm={farm} data={data}/>
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
      <small><b>{installed}</b> instalado(s) <i/> <b>{delivered}</b> entregue(s)</small>
    </div>
    <div className="farmSignalRow">
      <span className={hasGps?'ok':'warn'} title={hasGps?'Localização GPS cadastrada':'Localização GPS ainda não cadastrada'}><LocateFixed size={15}/>{hasGps?'GPS cadastrado':'GPS pendente'}</span>
      <span title={`${eq} equipamento(s) cadastrado(s)`}><Cpu size={15}/>{eq} {eq===1?'equipamento':'equipamentos'}</span>
      {pending&&<span className="warn" title="Existe uma pendência operacional"><AlertTriangle size={15}/>Pendência</span>}
    </div>
    {access.isShared&&<AccessBadge access={access}/>}
    <footer><span>Última visita: {lastVisit?brDate(lastVisit.data_visita):'sem visita'}</span><b aria-hidden="true"><ChevronLeft className="rotate" size={17}/></b></footer>
  </article>
}

function FarmListItem({farm,data,onOpen}){
  const access=farmAccess(farm,data);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id);
  const planned=num(farm.qtd_colares_prevista), installed=collarInstalled(farm), delivered=collarDelivered(farm), handled=collarHandled(farm);
  const pct=collarProgress(farm);
  const displayStatus=farmStatus(farm);
  const tone=centralTone(farm.central);
  const lastVisit=latestFarmVisit(farm,data);
  const hasGps=Boolean(farm.latitude&&farm.longitude);
  const pending=farmHasPending(farm,data);
  const peopleLine=[farm.responsavel,farm.regional_nome].filter(Boolean).join(' • ')||'Responsável não informado';
  return <button type="button" className={`farmListItem central-${tone}`} onClick={onOpen}>
    <span className="farmListAccent" />
    <span className={`farmListIcon ${tone}`}><Building2 size={20}/></span>
    <span className="farmListMain">
      <b>{farm.nome}</b>
      <small><MapPin size={14}/>{farm.cidade||'Cidade não informada'}{getFarmUF(farm)?` / ${getFarmUF(farm)}`:''}</small>
      <small><User size={14}/>{peopleLine}</small>
    </span>
    <span className="farmListProgress">
      <span><Milk size={14}/> Colares</span>
      <b>{handled} / {planned}</b>
      <i><em style={{width:`${Math.min(pct,100)}%`}} /></i>
      <small>{installed} instalado(s) • {delivered} entregue(s)</small>
    </span>
    <span className="farmListBadges">
      <span className={`centralPill ${tone}`}>{centralDisplay(farm.central)}</span>
      <FarmIntegrationBadge farm={farm} data={data} compact/>
      <span className={`status ${statusTone(displayStatus)}`}>{displayStatus}</span>
      <span className={hasGps?'farmMiniPill ok':'farmMiniPill warn'} title={hasGps?'Localização GPS cadastrada':'Localização GPS pendente'}><LocateFixed size={13}/>{hasGps?'GPS cadastrado':'GPS pendente'}</span>
      <span className="farmMiniPill" title={`${equips.length} equipamento(s) cadastrado(s)`}><Cpu size={13}/>{equips.length} equip.</span>
      {pending&&<span className="farmMiniPill warn"><AlertTriangle size={13}/>Pendência</span>}
      {access.isShared&&<span className="farmMiniPill ok">Compartilhada</span>}
    </span>
    <span className="farmListFoot">
      <small>Última visita: {lastVisit?brDate(lastVisit.data_visita):'sem visita'}</small>
      <b aria-hidden="true"><ChevronLeft className="rotate" size={16}/></b>
    </span>
  </button>
}

function FazendaModal({farm={},data={},onClose,onSave}){
  const currentUserName=personName(data.currentUser);
  const initialResponsible=farm.servico_responsavel||(!farm.id?currentUserName:'');
  const centralChoices=allowedCentrais(data);
  const defaultCentral=!farm.id&&centralChoices.length===1?centralChoices[0]:'';
  const [ufs,setUfs]=useState([]),[cities,setCities]=useState([]),[loadingCities,setLoadingCities]=useState(false);
  const [tab,setTab]=useState('dados'),[focus,setFocus]=useState(null),[mapDraft,setMapDraft]=useState(null),[mapSearchLabel,setMapSearchLabel]=useState('');
  const [locating,setLocating]=useState(false),[saving,setSaving]=useState(false),[confirmClose,setConfirmClose]=useState(false),[fieldErrors,setFieldErrors]=useState({});
  const [form,setForm]=useState({id:farm.id||uid(),nome:farm.nome||'',central:farm.central||defaultCentral,regional_nome:farm.regional_nome||'',veterinario_apoio:farm.veterinario_apoio||'',responsavel:farm.responsavel||'',telefone:formatPhoneBR(farm.telefone||''),estado_uf:farm.estado_uf||parseUF(farm.cidade)||'',estado_nome:farm.estado_nome||'',cidade:farm.cidade?.replace(/\s*\/\s*[A-Z]{2}$/,'')||'',codigo_ibge_cidade:farm.codigo_ibge_cidade||'',latitude:farm.latitude||'',longitude:farm.longitude||'',localizacao_origem:farm.localizacao_origem||'',endereco:farm.endereco||'',qtd_colares_prevista:farm.qtd_colares_prevista||'',qtd_colares_instalada:farm.qtd_colares_instalada||'',qtd_colares_entregue_cliente:farm.qtd_colares_entregue_cliente||'',motivo_colares_restantes:farm.motivo_colares_restantes||'',observacoes_colares:farm.observacoes_colares||'',status:farmStatus(farm),servico_inicio_em:dateTimeInput(farm.servico_inicio_em),servico_fim_em:dateTimeInput(farm.servico_fim_em),servico_responsavel:initialResponsible,servico_observacoes:farm.servico_observacoes||'',observacoes:farm.observacoes||'',created_at:farm.created_at||nowISO()});
  const initialFormRef=useRef('');
  if(!initialFormRef.current)initialFormRef.current=JSON.stringify(form);
  const set=(k,v)=>{setFieldErrors(prev=>({...prev,[k]:''}));setForm(prev=>({...prev,[k]:v}));};
  const cityListId=`city-options-${form.id}`;
  const normalizeCity=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const applyFarmLocation=(lat,lng,origin='mapa')=>{const next=[Number(lat),Number(lng)];setForm(prev=>({...prev,latitude:next[0],longitude:next[1],localizacao_origem:origin}));setMapDraft(null);setFocus(next);};
  useEffect(()=>{ let alive=true; fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(r=>r.json()).then(list=>alive&&setUfs(list)).catch(()=>{}); return()=>{alive=false}; },[]);
  useEffect(()=>{ if(!form.estado_uf){setCities([]);return;} let alive=true; setLoadingCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado_uf}/municipios?orderBy=nome`).then(r=>r.json()).then(list=>{if(alive)setCities(list)}).catch(()=>alive&&setCities([])).finally(()=>alive&&setLoadingCities(false)); return()=>{alive=false}; },[form.estado_uf]);
  function chooseCity(code){
    if(!code){setForm(prev=>({...prev,codigo_ibge_cidade:'',cidade:''}));return;}
    const city=cities.find(c=>String(c.id)===String(code));
    setForm(prev=>({...prev,codigo_ibge_cidade:code,cidade:city?.nome||prev.cidade}));
  }
  function chooseCityByName(value){
    const city=cities.find(c=>normalizeCity(c.nome)===normalizeCity(value));
    setForm(prev=>({...prev,cidade:value,codigo_ibge_cidade:city?.id||''}));
  }
  function useGPS(){
    if(!navigator.geolocation){notify('GPS não disponível neste navegador.','error');return;}
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos=>{applyFarmLocation(pos.coords.latitude,pos.coords.longitude,'gps');setLocating(false);notify('Localização atual definida. Salve a fazenda para concluir.');},
      error=>{setLocating(false);const denied=error?.code===1;notify(denied?'Permissão de localização negada. Libere o acesso ao GPS nas configurações do navegador.':'Não foi possível obter sua localização. Verifique o sinal e tente novamente.','error');},
      {enableHighAccuracy:true,timeout:12000}
    );
  }
  const submit=async e=>{
    e.preventDefault();
    if(saving)return;
    const errors={};
    if(!String(form.nome||'').trim())errors.nome='Informe o nome da fazenda.';
    if(!canAccessCentralValue(form.central,data))errors.central='Seu usuário não tem acesso a esta central.';
    if(Object.keys(errors).length){setFieldErrors(errors);setTab('dados');notify('Revise os campos destacados.','error');return;}
    setSaving(true);
    let result;
    try{result=await onSave({
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
    });}catch(error){setSaving(false);notify(`Não foi possível salvar: ${error?.message||'erro inesperado'}`,'error');return;}
    setSaving(false);
    if(result?.ok){notify(farm.id?'Fazenda atualizada com sucesso.':'Fazenda cadastrada com sucesso.');onClose();}
  };
  const hasLocation=form.latitude!==''&&form.longitude!==''&&Number.isFinite(Number(form.latitude))&&Number.isFinite(Number(form.longitude));
  const locationText=hasLocation?`${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`:'Localização ainda não definida';
  const sourceText={gps:'GPS do aparelho',mapa:'Marcada no mapa',cidade:'Centro estimado da cidade'}[form.localizacao_origem]||'não definida';
  const hasUnsavedChanges=JSON.stringify(form)!==initialFormRef.current;
  const requestClose=()=>{if(saving)return;if(hasUnsavedChanges||mapDraft){setConfirmClose(true);return;}onClose();};
  const draftLocationText=mapDraft?`${mapDraft[0].toFixed(6)}, ${mapDraft[1].toFixed(6)}`:'';
  const mapFarm={...farm,...form,nome:form.nome||farm.nome||'Fazenda'};
  return <Modal title={farm.id?'Editar fazenda':'Nova fazenda'} className="farmEditorModal" onClose={requestClose}><form className="form modern farmEditor" onSubmit={submit}>
    <div className="editorTabs farmEditorTabs"><button type="button" className={tab==='dados'?'active':''} onClick={()=>setTab('dados')}><ClipboardPenLine size={17}/> Dados</button><button type="button" className={tab==='localizacao'?'active':''} onClick={()=>setTab('localizacao')}><MapPinned size={17}/> Localização {hasLocation&&<Check size={15}/>}</button></div>
    {tab==='dados'&&<div className="editorPane farmDataPane">
      <section className="farmFormSection">
        <header><span><Building2 size={17}/></span><div><h3>Identificação e responsáveis</h3><p>Dados principais para reconhecer a fazenda e seus contatos.</p></div></header>
        <Field label="Nome da fazenda *" icon={Building2}><input value={form.nome} onChange={e=>set('nome',e.target.value)} required aria-invalid={Boolean(fieldErrors.nome)} placeholder="Ex.: Fazenda Santa Maria"/>{fieldErrors.nome&&<small className="fieldError">{fieldErrors.nome}</small>}</Field>
        <div className="grid2">
          <Field label="Central / empresa atendida" icon={ShieldCheck}>{centralChoices.length===1?<div className="lockedCentralField"><BrandLogoMark brand={centralChoices[0]}/><span><b>{centralOfficialName(centralChoices[0])}</b><small>Definida pelo seu acesso</small></span><ShieldCheck size={17}/></div>:<select value={form.central} aria-invalid={Boolean(fieldErrors.central)} onChange={e=>set('central',e.target.value)}><option value="">Selecione...</option>{centralChoices.map(c=><option key={c} value={c}>{centralOfficialName(c)}</option>)}</select>}{fieldErrors.central&&<small className="fieldError">{fieldErrors.central}</small>}</Field>
          <Field label="Nome do regional (opcional)" icon={User}><input value={form.regional_nome} onChange={e=>set('regional_nome',e.target.value)} placeholder="Ex.: nome do regional"/></Field>
        </div>
        <div className="grid2"><Field label="Responsável da fazenda (opcional)" icon={User}><input value={form.responsavel} onChange={e=>set('responsavel',e.target.value)} placeholder="Nome do contato local"/></Field><Field label="Telefone (opcional)" icon={Phone}><input value={form.telefone} onChange={e=>set('telefone',formatPhoneBR(e.target.value))} placeholder="(00) 00000-0000" inputMode="numeric" autoComplete="tel"/></Field></div>
        <Field label="Veterinário / apoio em campo (opcional)" icon={Stethoscope}><input value={form.veterinario_apoio} onChange={e=>set('veterinario_apoio',e.target.value)} placeholder="Nome do profissional de apoio"/></Field>
      </section>

      <section className="farmFormSection">
        <header><span><MapPin size={17}/></span><div><h3>Endereço cadastral</h3><p>Estado, cidade e endereço não alteram o ponto geográfico salvo.</p></div></header>
        <div className="grid2"><Field label="Estado" icon={MapPin}><select value={form.estado_uf} onChange={e=>{const uf=e.target.value;const st=ufs.find(u=>u.sigla===uf);setForm(prev=>({...prev,estado_uf:uf,estado_nome:st?.nome||UF_NAMES[uf]||'',cidade:'',codigo_ibge_cidade:''}));setFocus(STATE_CENTER[uf]||null);}}><option value="">Selecione o estado...</option>{ufs.map(u=><option key={u.id} value={u.sigla}>{u.nome} — {u.sigla}</option>)}</select></Field><Field label="Cidade" icon={MapPin}><div className="cityLookup"><input list={cityListId} value={form.cidade} onChange={e=>chooseCityByName(e.target.value)} disabled={!form.estado_uf||loadingCities} placeholder={!form.estado_uf?'Selecione o estado primeiro':loadingCities?'Carregando cidades...':'Digite para buscar a cidade'}/><Search size={16}/></div><datalist id={cityListId}>{cities.map(c=><option key={c.id} value={c.nome}/>)}</datalist></Field></div>
        <Field label="Endereço ou referência (opcional)"><input value={form.endereco} onChange={e=>set('endereco',e.target.value)} placeholder="Estrada, bairro ou referência para chegada"/></Field>
        <div className={`farmLocationCompact ${hasLocation?'defined':''}`}><span className="farmLocationStateIcon">{hasLocation?<LocateFixed size={21}/>:<MapPinned size={21}/>}</span><div><span className="eyebrow">Ponto geográfico</span><h3>{hasLocation?'Localização definida':'Localização ainda não definida'}</h3><p>{hasLocation?sourceText:'Use o GPS ou escolha e confirme um ponto no mapa.'}</p><small>{hasLocation?locationText:'Estado e cidade não definem coordenadas automaticamente.'}</small></div><div className="locationCompactActions"><button type="button" className="btn light" onClick={useGPS} disabled={locating}>{locating?<RefreshCw className="spin" size={17}/>:<Navigation size={17}/>} {locating?'Obtendo localização...':'Usar minha localização'}</button><button type="button" className="btn locationShortcut" onClick={()=>setTab('localizacao')}><MapPinned size={17}/>{hasLocation?'Revisar no mapa':'Escolher no mapa'}</button></div></div>
      </section>

      <section className="farmFormSection compact">
        <header><span><ClipboardList size={17}/></span><div><h3>Informações operacionais</h3><p>Dados de planejamento e observações do atendimento.</p></div></header>
        <Field label="Colares previstos" icon={Hash}><input type="number" inputMode="numeric" min="0" value={form.qtd_colares_prevista} onChange={e=>set('qtd_colares_prevista',e.target.value)} placeholder="0"/></Field>
        <Field label="Observações (opcional)"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Informações importantes da fazenda"/></Field>
      </section>
    </div>}
    {tab==='localizacao'&&<div className="editorPane locationPane farmLocationPane">
      <div className="farmMapIntro"><span><MapPinned size={18}/></span><div><h3>Defina o ponto exato</h3><p>Pesquise para navegar ou toque no mapa. O ponto só muda após sua confirmação.</p></div></div>
      <SearchMapControl onSelect={(lat,lng,label)=>{setMapDraft(null);setFocus([Number(lat),Number(lng)]);setMapSearchLabel(label||'Resultado localizado no mapa.')}} placeholder="Pesquisar cidade, estrada ou endereço..."/>
      {mapSearchLabel&&<div className="mapSearchFocusNotice"><Search size={16}/><span>Mapa centralizado em <b>{mapSearchLabel}</b>. Toque no mapa se quiser selecionar um ponto.</span></div>}
      <div className="locationActions"><button type="button" className="btn light" onClick={useGPS} disabled={locating}>{locating?<RefreshCw className="spin" size={17}/>:<Navigation size={17}/>} {locating?'Obtendo...':'Usar minha localização'}</button>{hasLocation&&<span className="coordinateBadge"><LocateFixed size={15}/><span><small>Ponto salvo</small>{locationText}</span></span>}</div>
      <div className="mapSelectionHint"><Info size={16}/><span>Toque em um local do mapa para criar uma sugestão. Depois revise e confirme abaixo.</span></div>
      <div className="editorMap farmLocationMap"><FarmLocationPicker farm={mapFarm} lat={mapDraft?.[0]??form.latitude} lng={mapDraft?.[1]??form.longitude} focus={focus} onPick={(lat,lng)=>{setMapDraft([Number(lat),Number(lng)]);setMapSearchLabel('')}}/></div>
      {mapDraft&&<div className="mapDraftConfirm"><div><span>Novo ponto selecionado</span><b>{draftLocationText}</b><small>A localização salva ainda não foi alterada.</small></div><div><button type="button" className="btn light" onClick={()=>setMapDraft(null)}>Descartar</button><button type="button" className="btn primary" onClick={()=>{applyFarmLocation(mapDraft[0],mapDraft[1],'mapa');notify('Ponto confirmado. Salve a fazenda para concluir.')}}><Check size={17}/> Confirmar este ponto</button></div></div>}
    </div>}
    <div className="stickyFormActions"><button type="button" className="btn light" onClick={requestClose} disabled={saving}>Cancelar</button><button className="btn primary" disabled={saving}>{saving?<RefreshCw className="spin" size={18}/>:<Save size={18}/>} {saving?'Salvando...':'Salvar fazenda'}</button></div>
  </form>{confirmClose&&<div className="confirmOverlay farmUnsavedOverlay"><div className="confirmCard"><div className="confirmIcon"><AlertTriangle/></div><h3>Descartar alterações?</h3><p>As informações preenchidas neste cadastro ainda não foram salvas.</p><div className="confirmActions"><button type="button" className="btn light" onClick={()=>setConfirmClose(false)}>Continuar preenchendo</button><button type="button" className="btn warning" onClick={onClose}>Descartar alterações</button></div></div></div>}</Modal>}

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

function ServicePeriodsModal({farm,visits=[],canEdit=false,onClose,onEditVisit,onEditLegacy}){
  const sessions=[...farmServiceSessions(farm,visits)].reverse();
  return <Modal title="Atendimentos da fazenda" onClose={onClose}>
    <div className="modalBody servicePeriodsModal">
      <div className="servicePeriodsIntro"><Clock size={22}/><div><span className="eyebrow">Histórico de produtividade</span><h3>{sessions.length} atendimento(s)</h3><p>Cada período representa um atendimento em campo. Ajustes preservam o cálculo automático do tempo total.</p></div></div>
      <div className="servicePeriodList">{sessions.map((session,index)=><article key={session.id} className={session.open?'open':''}>
        <div className="servicePeriodNumber">{sessions.length-index}</div>
        <div className="servicePeriodContent">
          <div className="servicePeriodTitle"><b>{session.tipo}</b><span>{brDate(session.start)}</span></div>
          <div className="servicePeriodFacts">
            <span><small>Início</small><b>{brDateTime(session.start)}</b></span>
            <span><small>Fim</small><b>{session.end?brDateTime(session.end):'Em andamento'}</b></span>
            <span><small>Duração</small><b>{session.end?hoursLabel(sessionHours(session)):'Em andamento'}</b></span>
          </div>
          <small className="servicePeriodResponsible"><UserCheck size={14}/>{session.responsible||'Técnico não informado'}</small>
        </div>
        {canEdit&&<button type="button" className="iconBtn" aria-label={`Editar atendimento ${session.tipo}`} title="Corrigir horário ou técnico" onClick={()=>session.visit?onEditVisit(session.visit):onEditLegacy()}><Pencil size={17}/></button>}
      </article>)}</div>
      {!sessions.length&&<Empty icon={Clock} title="Nenhum atendimento registrado" text="Inicie o serviço para criar o primeiro período."/>}
      <div className="servicePeriodsTotal"><span>Tempo total registrado</span><b>{serviceTotalLabel(farm,visits)}</b></div>
    </div>
  </Modal>
}

function ServiceSessionEditModal({farm,visit,data,onClose,onSave}){
  const currentUserName=personName(data.currentUser);
  const options=serviceResponsibleOptions(data,farm,currentUserName);
  const [form,setForm]=useState({
    iniciada_em:dateTimeInput(visit.iniciada_em),
    finalizada_em:dateTimeInput(visit.finalizada_em),
    responsavel_tecnico:visit.responsavel_tecnico||farm.servico_responsavel||currentUserName||''
  });
  const [saving,setSaving]=useState(false);
  const set=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  const submit=async event=>{
    event.preventDefault();
    const start=toIsoOrNull(form.iniciada_em);
    const end=toIsoOrNull(form.finalizada_em);
    if(!start){notify('Informe o início do atendimento.','warning');return;}
    if(end&&new Date(end)<=new Date(start)){notify('O fim precisa ser posterior ao início.','warning');return;}
    if(!cleanDisplayName(form.responsavel_tecnico)){notify('Informe o técnico responsável.','warning');return;}
    setSaving(true);
    const result=await onSave({...visit,data_visita:dateInputFromIso(start),iniciada_em:start,finalizada_em:end,responsavel_tecnico:cleanDisplayName(form.responsavel_tecnico),updated_at:nowISO()});
    setSaving(false);
    if(result?.ok!==false)onClose();
  };
  return <Modal title="Ajustar atendimento" onClose={onClose}>
    <form className="form modern serviceSessionEdit" onSubmit={submit}>
      <div className="serviceSessionEditHero"><div><Clock size={22}/></div><span><small>{visit.tipo||'Visita'} • {brDate(visit.data_visita)}</small><b>Corrigir período registrado</b><p>Use quando o início ou o fim não foi registrado no horário correto.</p></span></div>
      <div className="grid2"><Field label="Início do atendimento" icon={PlayCircle}><input type="datetime-local" value={form.iniciada_em} onChange={e=>set('iniciada_em',e.target.value)} required/></Field><Field label="Fim do atendimento" icon={CheckCircle2}><input type="datetime-local" value={form.finalizada_em} onChange={e=>set('finalizada_em',e.target.value)}/></Field></div>
      <ResponsibleServiceField value={form.responsavel_tecnico} onChange={value=>set('responsavel_tecnico',value)} options={options}/>
      <div className="serviceEditNotice"><Info size={16}/><span>Essa correção atualiza o histórico, os relatórios e o total de horas da fazenda.</span></div>
      <div className="stickyFormActions"><button type="button" className="btn light" onClick={onClose} disabled={saving}>Cancelar</button><button className="btn primary" disabled={saving}><Save size={18}/>{saving?'Salvando...':'Salvar correção'}</button></div>
    </form>
  </Modal>
}

function FazendaDetalhe({farm,data,onBack}){
  const [tab,setTab]=useState('resumo'),[edit,setEdit]=useState(false),[equipModal,setEquipModal]=useState(null),[visitModal,setVisitModal]=useState(false),[serviceModal,setServiceModal]=useState(null);
  const [servicePeriodsOpen,setServicePeriodsOpen]=useState(false),[serviceSessionEdit,setServiceSessionEdit]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(false),[deletingFarm,setDeletingFarm]=useState(false),[heroMenuOpen,setHeroMenuOpen]=useState(false);
  const access=farmAccess(farm,data);
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id), visits=data.visitas.filter(v=>v.fazenda_id===farm.id), checks=data.checklists.filter(c=>c.fazenda_id===farm.id), diags=data.diagnosticos.filter(d=>d.fazenda_id===farm.id), evidencias=(data.evidencias||[]).filter(e=>e.fazenda_id===farm.id);
  const tabs=[['resumo','Resumo',Building2],['checklists','Checklists',ClipboardCheck],['equipamentos','Equipamentos',Cpu],['mapa','Mapa técnico',MapIcon],['visitas','Visitas',CalendarDays],['evidencias','Evidências',ImageIcon],['relatorio','Relatório',FileText],access.canEdit&&['restrito','Restrito',ShieldCheck],access.canManageAccess&&['acessos','Acessos',UserCheck]].filter(Boolean);
  const serviceActive=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), serviceDone=Boolean(farm.servico_inicio_em&&farm.servico_fim_em), compactHero=tab!=='resumo';
  const canDeleteFarm=access.role==='owner'||access.role==='admin'||data.isAppAdmin;
  const currentResponsible=personName(data.currentUser);
  const openVisit=visits.find(isOpenVisit);
  const goTab=id=>{setTab(id);setTimeout(()=>document.querySelector('.farmTabs')?.scrollIntoView({behavior:'smooth',block:'start'}),80);};
  const openVisitModal=()=>{if(openVisit)notify(`Já existe uma visita aberta desde ${brDate(openVisit.data_visita)}. Você pode continuar nela ou registrar uma nova visita.`,'warning');setVisitModal(true);};
  const openEquipmentFromMap=equip=>{if(!access.canEdit)return;setTab('equipamentos');setEquipModal(equip);};
  const deleteFarm=async()=>{
    if(!canDeleteFarm||deletingFarm)return;
    setDeletingFarm(true);
    const result=await data.delFazenda(farm);
    setDeletingFarm(false);
    if(result.ok){setDeleteConfirm(false);onBack();}
  };
  const saveVisitFromDetail=async(row)=>{const clean={...row,status:row.status || (row.iniciada_em&&!row.finalizada_em?VISIT_STATUS_OPEN:visitNeedsReturn(row)?VISIT_STATUS_WAITING_RETURN:visitHasPending(row)?VISIT_STATUS_PENDING:VISIT_STATUS_DONE),updated_at:nowISO()};const result=await data.saveVisita(clean);if(result.ok)setVisitModal(false);return result;};
  const startService=async()=>{
    if(!access.canEdit)return;
    const startedAt=serviceActive&&farm.servico_inicio_em?farm.servico_inicio_em:nowISO();
    const result=await data.saveFazenda({...farm,servico_inicio_em:startedAt,servico_fim_em:null,servico_responsavel:farm.servico_responsavel||currentResponsible||farm.regional_nome||farm.responsavel||'',status:'Em andamento'});
    if(!result.ok)return;
    if(!openVisit){
      await data.saveVisita({id:uid(),fazenda_id:farm.id,tipo:'Instalação',data_visita:todayInput(),resumo:'Serviço iniciado em campo.',status:VISIT_STATUS_OPEN,iniciada_em:startedAt,responsavel_tecnico:farm.servico_responsavel||currentResponsible||farm.regional_nome||farm.responsavel||'',created_at:startedAt,updated_at:startedAt});
      notify('Serviço iniciado e visita aberta.');
      return;
    }
    await data.saveVisita({...openVisit,iniciada_em:openVisit.iniciada_em||startedAt,responsavel_tecnico:openVisit.responsavel_tecnico||farm.servico_responsavel||currentResponsible||farm.regional_nome||farm.responsavel||'',updated_at:nowISO()});
    notify(`Serviço iniciado. Visita aberta mantida: ${brDate(openVisit.data_visita)}.`);
  };
  const startReturnFromVisit=async(sourceVisit)=>{
    if(!access.canEdit||!sourceVisit)return;
    if(openVisit){notify(`Já existe uma visita aberta desde ${brDate(openVisit.data_visita)}. Encerre ou continue a visita atual antes de iniciar o retorno.`,'warning');setTab('visitas');return;}
    const startedAt=nowISO();
    const serviceResult=await data.saveFazenda({...farm,servico_inicio_em:startedAt,servico_fim_em:null,servico_responsavel:farm.servico_responsavel||currentResponsible||farm.regional_nome||farm.responsavel||'',status:'Em andamento'});
    if(!serviceResult.ok)return;
    const returnVisit={id:uid(),fazenda_id:farm.id,tipo:'Retorno',data_visita:todayInput(),resumo:`Retorno iniciado para resolver pendência da visita de ${brDate(sourceVisit.data_visita)}.`,status:VISIT_STATUS_OPEN,iniciada_em:startedAt,responsavel_tecnico:farm.servico_responsavel||currentResponsible||farm.regional_nome||farm.responsavel||'',parent_visit_id:sourceVisit.id,retorno_necessario:false,created_at:startedAt,updated_at:startedAt};
    await data.saveVisita(returnVisit);
    await data.saveVisita({...sourceVisit,status:VISIT_STATUS_WAITING_RETURN,retorno_necessario:true,updated_at:startedAt});
    setTab('visitas');
    notify('Retorno iniciado. Uma nova visita foi aberta vinculada à pendência anterior.');
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
    if(finishing&&openVisit){
      const closedVisit=closeVisitPayload({
        ...openVisit,
        data_visita:dateInputFromIso(startedAt),
        iniciada_em:startedAt,
        finalizada_em:endedAt,
        responsavel_tecnico:payload.servico_responsavel||openVisit.responsavel_tecnico||''
      });
      await data.saveVisita(closedVisit);
      if(openVisit.parent_visit_id&&!visitHasOpenPending(closedVisit)){
        const parent=visits.find(v=>v.id===openVisit.parent_visit_id);
        if(parent)await data.saveVisita({...parent,status:VISIT_STATUS_RESOLVED_RETURN,retorno_necessario:false,resolved_by_visit_id:openVisit.id,resolved_at:endedAt,updated_at:endedAt});
      }
    }else if(!finishing&&openVisit){
      const adjustedVisit={
        ...openVisit,
        data_visita:startedAt?dateInputFromIso(startedAt):openVisit.data_visita,
        iniciada_em:startedAt||openVisit.iniciada_em,
        finalizada_em:endedAt||null,
        responsavel_tecnico:payload.servico_responsavel||openVisit.responsavel_tecnico||'',
        updated_at:nowISO()
      };
      await data.saveVisita(endedAt?closeVisitPayload(adjustedVisit):{...adjustedVisit,status:VISIT_STATUS_OPEN});
    }
    setServiceModal(null);
    notify(finishing?(openVisit&&visitHasPending(openVisit)?'Serviço finalizado com pendência registrada na visita.':'Serviço finalizado e visita encerrada.'):'Ajuste do serviço salvo.');
    return result;
  };
  const saveServiceSession=async row=>{
    if(!access.canEdit)return {ok:false};
    const visitResult=await data.saveVisita(row);
    if(!visitResult.ok)return visitResult;
    const nextVisits=visits.map(item=>item.id===row.id?row:item);
    const latest=[...nextVisits].filter(item=>item.iniciada_em).sort((a,b)=>new Date(b.iniciada_em)-new Date(a.iniciada_em))[0];
    if(latest?.id===row.id){
      const farmResult=await data.saveFazenda({...farm,servico_inicio_em:row.iniciada_em,servico_fim_em:row.finalizada_em||null,servico_responsavel:row.responsavel_tecnico||farm.servico_responsavel||'',status:autoServiceStatus(row.iniciada_em,row.finalizada_em,farm.status)});
      if(!farmResult.ok)return farmResult;
    }
    notify('Atendimento corrigido. Horas e técnico foram atualizados.');
    return {ok:true};
  };
  return <div className="farmDetail">
    <button className="back" onClick={onBack}><ChevronLeft size={18}/> Voltar para fazendas</button>
    <section className={`farmHero ${compactHero?'compactHero':''}`}>
      <div>
        {!compactHero&&<span className="eyebrow">Dossiê técnico</span>}
        <h1><span className="farmTitleIcon"><Warehouse size={19}/></span><span>{farm.nome}</span></h1>
        {!compactHero&&<div className="farmHeroMeta"><span><MapPin size={16}/>{farm.cidade||'Cidade não informada'}</span><span><Building2 size={16}/>{centralOfficialName(farm.central)||'Central não informada'}</span><span><User size={16}/>{farm.regional_nome||farm.responsavel||'Regional não informado'}</span><FarmIntegrationBadge farm={farm} data={data}/></div>}
        {!compactHero&&<AccessBadge access={access}/>}
      </div>
      {tab==='resumo'&&<div className="farmHeroPrimaryActions">
        {access.canEdit&&<button type="button" className="farmHeroAction" onClick={()=>setEdit(true)}><Pencil size={17}/><span>Editar</span></button>}
        {farm.latitude&&farm.longitude?<button type="button" className="farmHeroAction" onClick={()=>openMaps(farm.latitude,farm.longitude)}><Navigation size={17}/><span>Navegar</span></button>:<button type="button" className="farmHeroAction" onClick={()=>setTab('mapa')}><MapPinned size={17}/><span>Mapa</span></button>}
        {canDeleteFarm&&<div className="farmHeroMore">
          <button type="button" className="farmHeroMoreButton" aria-label="Mais ações" aria-expanded={heroMenuOpen} onClick={()=>setHeroMenuOpen(value=>!value)}><EllipsisVertical size={19}/></button>
          {heroMenuOpen&&<><button type="button" className="farmHeroMenuBackdrop" aria-label="Fechar menu" onClick={()=>setHeroMenuOpen(false)}/><div className="farmHeroMenu" role="menu"><button type="button" className="farmHeroDeleteAction" role="menuitem" onClick={()=>{setHeroMenuOpen(false);setDeleteConfirm(true)}}><Trash2 size={17}/><span><b>Excluir fazenda</b><small>Remove o dossiê e seus registros</small></span></button></div></>}
        </div>}
      </div>}
    </section>
    {!access.canEdit&&<PermissionNotice/>}
    <div className="tabs farmTabs">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={tab===id?'active':''}><Icon size={17}/>{label}</button>)}</div>
    {tab==='resumo'&&<FarmExecutiveSummary farm={farm} visits={visits} checks={checks} diags={diags} equips={equips} evidencias={evidencias} canEdit={access.canEdit} onStart={startService} onFinish={finishService} onEdit={()=>setEdit(true)} onAdjustService={()=>farmServiceSessions(farm,visits).some(session=>session.visit)?setServicePeriodsOpen(true):setServiceModal('adjust')} onNewVisit={openVisitModal} onOpenMap={()=>setTab('mapa')} onNavigate={goTab}/>}
    {tab==='checklists'&&<ChecklistsFazenda farm={farm} data={data} canEdit={access.canEdit}/>} {tab==='equipamentos'&&<EquipamentosFazenda farm={farm} data={data} canEdit={access.canEdit} openNew={()=>setEquipModal({})}/>} {tab==='mapa'&&<MapaFazenda farm={farm} data={data} canEdit={access.canEdit} onEditEquip={openEquipmentFromMap}/>} {tab==='visitas'&&<VisitasFazenda farm={farm} data={data} canEdit={access.canEdit} openNew={openVisitModal} onStartReturn={startReturnFromVisit}/>} {tab==='evidencias'&&<EvidenciasFazenda farm={farm} data={data} canEdit={access.canEdit}/>} {tab==='relatorio'&&<RelatorioFazenda farm={farm} data={data}/>} {tab==='restrito'&&access.canEdit&&<DadosRestritosFazenda farm={farm} data={data}/>} {tab==='acessos'&&<AcessosFazenda farm={farm} data={data} access={access}/>}
    <FarmBottomNav farm={farm} tabs={tabs} tab={tab} setTab={setTab} onBack={onBack} access={access} serviceActive={serviceActive} serviceDone={serviceDone} onStart={startService} onFinish={finishService} onEdit={()=>setEdit(true)} onNewVisit={openVisitModal}/>
    {edit&&access.canEdit&&<FazendaModal farm={farm} data={data} onClose={()=>setEdit(false)} onSave={r=>data.saveFazenda(r)}/>}{serviceModal&&access.canEdit&&<ServiceModal farm={farm} data={data} mode={serviceModal} pendingEquips={equips.filter(isEquipmentPendingInstall)} onClose={()=>setServiceModal(null)} onSave={saveService}/>} {servicePeriodsOpen&&<ServicePeriodsModal farm={farm} visits={visits} canEdit={access.canEdit} onClose={()=>setServicePeriodsOpen(false)} onEditLegacy={()=>{setServicePeriodsOpen(false);setServiceModal('adjust')}} onEditVisit={visit=>{setServicePeriodsOpen(false);setServiceSessionEdit(visit)}}/>}{serviceSessionEdit&&access.canEdit&&<ServiceSessionEditModal farm={farm} visit={serviceSessionEdit} data={data} onClose={()=>setServiceSessionEdit(null)} onSave={saveServiceSession}/>} {equipModal&&access.canEdit&&<EquipModal farm={farm} data={data} equip={equipModal} onClose={()=>setEquipModal(null)} onSave={async(r)=>{const result=await data.saveEquipamento(r);if(result.ok)setEquipModal(null)}}/>}{visitModal&&access.canEdit&&<VisitModal farm={farm} data={data} onClose={()=>setVisitModal(false)} onSave={saveVisitFromDetail}/>} {deleteConfirm&&<DeleteFarmModal farm={farm} busy={deletingFarm} onCancel={()=>setDeleteConfirm(false)} onConfirm={deleteFarm}/>}
  </div>
}

function DeleteFarmModal({farm,busy=false,onCancel,onConfirm}){
  return <div className="modalBackdrop deleteModalBackdrop">
    <section className="deleteConfirmModal" role="dialog" aria-modal="true" aria-labelledby="deleteFarmTitle">
      <button type="button" className="deleteModalClose" aria-label="Fechar" onClick={onCancel} disabled={busy}><X size={18}/></button>
      <div className="deleteConfirmIcon"><Trash2 size={25}/></div>
      <span className="eyebrow">Exclusão de fazenda</span>
      <h2 id="deleteFarmTitle">Excluir {farm?.nome||'esta fazenda'}?</h2>
      <p>Esta ação remove a fazenda e todos os registros vinculados ao dossiê técnico.</p>
      <div className="deleteImpactList">
        <span><Building2 size={16}/> Dados da fazenda</span>
        <span><Cpu size={16}/> Equipamentos, visitas e evidências</span>
        <span><ShieldCheck size={16}/> Acessos e registros restritos</span>
      </div>
      <div className="deleteConfirmActions">
        <button type="button" className="btn light" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="btn deleteDanger" onClick={onConfirm} disabled={busy}><Trash2 size={17}/> {busy?'Excluindo...':'Excluir fazenda'}</button>
      </div>
    </section>
  </div>
}

function ServiceControl({farm,visits=[],canEdit,onStart,onFinish,onEdit}){const sessions=farmServiceSessions(farm,visits), active=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), done=Boolean(sessions.length&&!active), status=farmStatus(farm), firstStart=firstServiceStart(sessions), lastEnd=lastServiceEnd(sessions); return <div className={`serviceControl ${active?'active':done?'done':''}`}><div className="serviceLead"><span className="eyebrow">Produtividade</span><h2><Clock size={20}/> Serviço da fazenda</h2></div><div className="serviceFacts"><div><span>Situação</span><b>{status}</b></div><div><span>Períodos</span><b>{sessions.length||'-'}</b></div><div><span>Primeiro início</span><b>{brDateTime(firstStart)}</b></div><div><span>Tempo total</span><b>{serviceTotalLabel(farm,visits)}</b></div><div><span>Último fim</span><b>{active?'em andamento':brDateTime(lastEnd)}</b></div></div><div className="serviceActions">{canEdit&&!active&&<button className="btn primary" onClick={onStart}><PlayCircle size={17}/> {sessions.length?'Iniciar novo serviço':'Iniciar serviço'}</button>}{canEdit&&active&&<button className="btn primary" onClick={onFinish}><CheckCircle2 size={17}/> Finalizar serviço</button>}{canEdit&&<button className="btn light" onClick={onEdit}><Pencil size={17}/> Ajustar datas</button>}</div>{farm.servico_observacoes&&<p className="serviceNote">{farm.servico_observacoes}</p>}</div>}
function DadosRestritosFazenda({farm,data}){
  const existing=(data.dadosRestritos||[]).find(item=>item.fazenda_id===farm.id)||{};
  const [showSecret,setShowSecret]=useState(false);
  const [saving,setSaving]=useState(false);
  const defaultServiceUser='service';
  const [form,setForm]=useState({
    sistema:existing.sistema||'',
    usuario_service:existing.usuario_service||defaultServiceUser,
    senha_service:existing.senha_service||'',
    numero_licenca:existing.numero_licenca||'',
    observacoes_restritas:existing.observacoes_restritas||''
  });
  useEffect(()=>{setShowSecret(false);setForm({sistema:existing.sistema||'',usuario_service:existing.usuario_service||defaultServiceUser,senha_service:existing.senha_service||'',numero_licenca:existing.numero_licenca||'',observacoes_restritas:existing.observacoes_restritas||''})},[existing.id,farm.id]);
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const copyValue=async(label,value)=>{if(!value){notify(`${label} vazio.`, 'warning');return;}try{await navigator.clipboard.writeText(value);notify(`${label} copiado.`);}catch{notify('Não foi possível copiar automaticamente.','error');}};
  const save=async(e)=>{e.preventDefault();setSaving(true);await data.saveDadosRestritos({...existing,...form,fazenda_id:farm.id});setSaving(false);};
  return <section className="panel restrictedDataPanel">
    <div className="restrictedHero">
      <div className="restrictedHeroIcon"><ShieldCheck size={24}/></div>
      <div><span className="eyebrow">Acesso restrito</span><h2>Dados internos</h2><p>Licenças, usuário de serviço e senhas ficam fora dos relatórios e ocultos para visualizadores.</p></div>
    </div>
    <form className="restrictedForm" onSubmit={save} autoComplete="off">
      <div className="grid2"><Field label="Domínio"><input value={form.sistema} onChange={e=>set('sistema',e.target.value)} placeholder="Ex: fazenda.vpu-online.com" autoComplete="off"/></Field><Field label="Número da licença"><div className="secretInput"><input value={form.numero_licenca} onChange={e=>set('numero_licenca',e.target.value)} placeholder="Chave ou licença" autoComplete="off" name={`license-${farm.id}`}/><button type="button" onClick={()=>copyValue('Licença',form.numero_licenca)}><Copy size={16}/></button></div></Field></div>
      <div className="grid2"><Field label="Usuário service"><div className="secretInput"><input value={form.usuario_service} onChange={e=>set('usuario_service',e.target.value)} placeholder="Usuário de serviço" autoComplete="off" autoCapitalize="none" spellCheck="false" name={`service-user-${farm.id}`}/><button type="button" onClick={()=>copyValue('Usuário',form.usuario_service)}><Copy size={16}/></button></div></Field><Field label="Senha service"><div className="secretInput"><input type={showSecret?'text':'password'} value={form.senha_service} onChange={e=>set('senha_service',e.target.value)} placeholder="Senha" autoComplete="new-password" autoCapitalize="none" spellCheck="false" name={`service-password-${farm.id}`}/><button type="button" onClick={()=>setShowSecret(v=>!v)}><Eye size={16}/></button><button type="button" onClick={()=>copyValue('Senha',form.senha_service)}><Copy size={16}/></button></div></Field></div>
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
function FarmDetailGroup({title,Icon,rows=[],children}){
  return <details className="farmDetailGroup">
    <summary><span className="farmDetailGroupTitle"><span className="farmDetailGroupIcon"><Icon size={17}/></span><b>{title}</b></span><span className="farmDetailGroupMeta">{rows.length>0&&<small>{rows.length}</small>}<ChevronLeft size={17}/></span></summary>
    <div className="farmDetailGroupBody">
      {rows.length>0&&<div className="farmDetailRows">{rows.map(([label,value,RowIcon,wide])=><article className={wide?'wide':''} key={label}><span><RowIcon size={15}/>{label}</span><b>{value||'-'}</b></article>)}</div>}
      {children}
    </div>
  </details>
}
function FarmExecutiveSummary({farm,visits,checks,diags,equips,evidencias=[],canEdit,onStart,onFinish,onEdit,onAdjustService,onNewVisit,onOpenMap,onNavigate}){
  const predicted=num(farm.qtd_colares_prevista), installed=collarInstalled(farm), delivered=collarDelivered(farm), handled=collarHandled(farm);
  const progress=collarProgress(farm);
  const status=farmStatus(farm), active=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), done=Boolean(farm.servico_inicio_em&&farm.servico_fim_em);
  const serviceSessions=farmServiceSessions(farm,visits), firstStart=firstServiceStart(serviceSessions), lastEnd=lastServiceEnd(serviceSessions), totalServiceLabel=serviceTotalLabel(farm,visits);
  const responsibleLabel=serviceResponsibleLabel(farm,visits);
  const hasLocation=farm.latitude&&farm.longitude, mapped=equips.filter(e=>e.latitude&&e.longitude).length, pendingVisits=visits.filter(visitHasOpenPending).length;
  const remaining=collarRemaining(farm);
  const cityUf=`${farm.cidade||''}${getFarmUF(farm)?` / ${getFarmUF(farm)}`:''}`.trim();
  const serviceState=active?'Em andamento':serviceSessions.length?'Serviço encerrado':'Não iniciada';
  const serviceHint=active?`Início atual ${brDateTime(farm.servico_inicio_em)}`:serviceSessions.length?`${serviceSessions.length} atendimento(s) • ${totalServiceLabel}`:'Aguardando início';
  const latestVisit=[...visits].sort((a,b)=>new Date(b.data_visita||b.updated_at||b.created_at||0)-new Date(a.data_visita||a.updated_at||a.created_at||0))[0];
  const phoneDigits=String(farm.telefone||'').replace(/\D/g,'');
  const alerts=[
    !hasLocation&&{text:'Fazenda sem GPS definido',Icon:MapPinned,tab:'mapa'},
    equips.length>mapped&&{text:`${equips.length-mapped} equipamento(s) sem GPS`,Icon:Cpu,tab:'equipamentos'},
    collarHasPending(farm)&&{text:`${remaining} colar(es) sem resolução`,Icon:Hash,tab:'resumo',action:canEdit?onAdjustService:null},
    pendingVisits>0&&{text:`${pendingVisits} visita(s) com pendência`,Icon:AlertTriangle,tab:'visitas'}
  ].filter(Boolean);
  const contactRows=[
    farm.regional_nome&&['Regional',farm.regional_nome,ShieldCheck],
    farm.veterinario_apoio&&['Veterinário / apoio',farm.veterinario_apoio,Stethoscope],
    farm.responsavel&&['Responsável da fazenda',farm.responsavel,User],
    farm.telefone&&['Telefone',phoneDigits?<a className="farmPhoneLink" href={`tel:${phoneDigits}`} title="Ligar para este número"><Phone size={14}/>{farm.telefone}</a>:farm.telefone,Phone]
  ].filter(Boolean);
  const locationRows=[
    cityUf&&['Cidade / UF',cityUf,MapPin],
    farm.endereco&&['Endereço',farm.endereco,Navigation,true],
    hasLocation&&['Coordenadas',`${Number(farm.latitude).toFixed(6)}, ${Number(farm.longitude).toFixed(6)}`,LocateFixed,true]
  ].filter(Boolean);
  const operationRows=[
    farm.central&&['Central',centralOfficialName(farm.central),Building2],
    ['Status',status,BadgeCheck],
    firstStart&&['Primeiro início do serviço',brDateTime(firstStart),Clock],
    lastEnd&&['Último fim do serviço',brDateTime(lastEnd),CheckCircle2],
    serviceSessions.length&&['Atendimentos',serviceSessions.length,CalendarDays],
    responsibleLabel&&['Responsável técnico',responsibleLabel,User],
    ['Última visita',latestVisit?brDate(latestVisit.data_visita||latestVisit.updated_at||latestVisit.created_at):'Sem visita',CalendarDays],
    delivered>0&&['Colares entregues ao cliente',delivered,BadgeCheck],
  ].filter(Boolean);
  const notes=[
    farm.motivo_colares_restantes&&['Motivo dos colares restantes',farm.motivo_colares_restantes,AlertTriangle],
    farm.observacoes_colares&&['Observação dos colares',farm.observacoes_colares,Info],
    canEdit&&farm.observacoes&&['Observações internas',farm.observacoes,ShieldCheck],
    canEdit&&farm.servico_observacoes&&['Observações do serviço',farm.servico_observacoes,Clock]
  ].filter(Boolean);
  const serviceAction=active?['Finalizar',CheckCircle2,onFinish]:[serviceSessions.length?'Novo serviço':'Iniciar',PlayCircle,onStart];
  const serviceAdjustButton=canEdit&&serviceSessions.length?<button type="button" className="serviceMiniEdit" onClick={onAdjustService} aria-label="Ajustar atendimentos" title="Corrigir horários ou técnico"><Pencil size={15}/></button>:null;
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
      <button type="button" className="execCard execMapCard" onClick={onOpenMap} aria-label="Abrir mapa técnico"><div className="execCardIcon"><MapPinned size={19}/></div><span>Mapa</span><b>{mapped} / {equips.length}</b><small>Com GPS</small></button>
      <article className="execCard execTimeCard"><div className="execCardIcon"><Clock size={19}/></div><span>Tempo em campo</span><b>{totalServiceLabel}</b><small>{serviceSessions.length?`${serviceSessions.length} atendimento(s)`:'sem início'}</small></article>
    </div>
    {alerts.length>0&&<div className="execAlerts">{alerts.map(({text,Icon,tab,action})=><button type="button" key={text} onClick={()=>action?action():onNavigate?.(tab)}><Icon size={15}/>{text}</button>)}</div>}
    <section className="farmInformationSection">
      <div className="farmInformationHeading"><div><span className="eyebrow">Dossiê</span><h3>Informações da fazenda</h3></div><small>Abra somente o grupo que deseja consultar</small></div>
      <div className="farmDetailGroups">
        <FarmDetailGroup title="Contatos e responsáveis" Icon={UserCheck} rows={contactRows}/>
        <FarmDetailGroup title="Localização" Icon={MapPinned} rows={locationRows}/>
        <FarmDetailGroup title="Dados operacionais" Icon={Gauge} rows={operationRows}/>
        <FarmDetailGroup title="Registros e observações" Icon={ClipboardList}>
          <div className="farmRecordShortcuts">
            <button type="button" onClick={()=>onNavigate?.('checklists')}><span><ClipboardCheck size={17}/>Checklists</span><b>{checks.length}</b><small>Abrir registros</small></button>
            <article><span><Stethoscope size={17}/>Diagnósticos</span><b>{diags.length}</b><small>Registros técnicos</small></article>
            <button type="button" onClick={()=>onNavigate?.('evidencias')}><span><ImageIcon size={17}/>Evidências</span><b>{evidencias.length}</b><small>Abrir galeria</small></button>
          </div>
          {notes.length>0?<div className="farmNoteList">{notes.map(([label,text,NoteIcon])=><details className="farmNoteItem" key={label}><summary><NoteIcon size={16}/><span><b>{label}</b><p>{text}</p></span><em className="noteExpand">Ver tudo</em><em className="noteCollapse">Recolher</em></summary><div className="farmNoteFullText">{text}</div></details>)}</div>:<p className="farmNoNotes"><Info size={16}/> Nenhuma observação adicional registrada.</p>}
        </FarmDetailGroup>
      </div>
    </section>
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
function MapPicker({farm,lat,lng,onPick,radius=0,equip={},focus,others=[]}){
  const farmPoint=farm?.latitude&&farm?.longitude?[Number(farm.latitude),Number(farm.longitude)]:null;
  const currentPoint=lat&&lng?[Number(lat),Number(lng)]:null;
  const otherPoints=others.map(item=>[Number(item.latitude),Number(item.longitude)]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
  const center=currentPoint||farmPoint||otherPoints[0]||[-19.7483,-47.9319];
  const fitPoints=[farmPoint,currentPoint,...otherPoints].filter(Boolean);
  const fitTrigger=`${Boolean(farmPoint)}-${Boolean(currentPoint)}-${otherPoints.length}`;
  const usePoint=(point)=>onPick(point[0],point[1]);
  function Clicker(){useMapEvents({click(e){onPick(e.latlng.lat,e.latlng.lng)}}); return null;}
  return <MapContainer center={center} zoom={currentPoint?17:13} className="map">
    <HybridLayers layer="hibrido"/>
    <RecenterMap position={focus}/>
    <FitBounds points={fitPoints} trigger={fitTrigger}/>
    {farmPoint&&<Marker position={farmPoint} icon={farmMarkerIcon(farm)}>
      <Popup>
        <b>{farm.nome}</b><br/>Localização da fazenda
        <button className="popupBtn secondary" type="button" onClick={()=>usePoint(farmPoint)}>Usar este ponto</button>
      </Popup>
    </Marker>}
    {others.map(item=>{
      const point=[Number(item.latitude),Number(item.longitude)];
      return <Marker key={item.id} position={point} icon={equipmentMarkerIcon(item,{ghost:true})}>
        <Popup>
          <b>{item.apelido||item.tipo}</b><br/>{item.local_nome||'Outro equipamento da fazenda'}
          <button className="popupBtn secondary" type="button" onClick={()=>usePoint(point)}>Usar este ponto</button>
        </Popup>
      </Marker>;
    })}
    {currentPoint&&<><Marker position={currentPoint} icon={equipmentMarkerIcon(equip)}/>{radius>0&&<Circle center={currentPoint} radius={radius} pathOptions={{color:'#22c55e',fillColor:'#22c55e',fillOpacity:.16,weight:2}}/>}</>}
    <Clicker/>
  </MapContainer>
}
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
  const filteredEquips=all.filter(e=>typeFilter==='todos'||(typeFilter==='vp4102'&&e.tipo?.includes('4102'))||(typeFilter==='vp8002'&&e.tipo?.includes('8002'))||(typeFilter==='outros'&&!e.tipo?.includes('4102')&&!e.tipo?.includes('8002')));
  const equips=spreadRepeatedCoordinates(filteredEquips);
  const center=all[0]?[Number(all[0].latitude),Number(all[0].longitude)]:farmLatLng(farm);
  const fitPoints=[farm.latitude&&farm.longitude?[Number(farm.latitude),Number(farm.longitude)]:null,...equips.map(e=>e._mapPosition)].filter(Boolean);
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
      <div className="mapWrap technicalMap"><MapContainer center={center} zoom={all.length?18:15} className="bigMap"><HybridLayers layer="hibrido"/><RecenterMap position={focus}/><FitBounds points={fitPoints} trigger={fitTick}/>{farm.latitude&&farm.longitude&&<Marker position={[Number(farm.latitude),Number(farm.longitude)]} icon={farmMarkerIcon(farm)}><Popup><b>{farm.nome}</b><br/>Referência da fazenda<br/><button className="popupBtn" type="button" onClick={()=>openMaps(farm.latitude,farm.longitude)}>Abrir rota no Maps</button></Popup></Marker>}{equips.map(e=><React.Fragment key={e.id}><Marker position={e._mapPosition} icon={equipmentMarkerIcon({...e,apelido:showLabels?(e.apelido||e.local_nome):''},{stackIndex:e._stackIndex,stackTotal:e._stackTotal})}><Popup><b>{e.apelido||e.local_nome||e.tipo}</b><br/>{e.tipo}<br/>Local: {e.local_nome||'-'}<br/>Status: {equipmentStatusLabel(e)}<br/>Coordenadas: {Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}{e._stackTotal>1&&<><br/>Ponto compartilhado: {e._stackIndex}/{e._stackTotal}</>}{e.tipo?.includes('4102')&&<><br/>Raio estimado: {Number(e.raio_metros)||75} m</>}<div className="popupActions">{canEdit&&onEditEquip&&<button className="popupBtn secondary" type="button" onClick={()=>onEditEquip(e)}><Pencil size={14}/> Editar equipamento</button>}<button className="popupBtn" type="button" onClick={()=>openMaps(e.latitude,e.longitude)}>Abrir rota no Maps</button></div></Popup></Marker>{showBuffers&&e.tipo?.includes('4102')&&<Circle center={[Number(e.latitude),Number(e.longitude)]} radius={Number(e.raio_metros)||75} pathOptions={{color:'#16a34a',fillColor:'#22c55e',fillOpacity:.08,weight:1.25}}/>}</React.Fragment>)}</MapContainer><div className="mapFloatingControls"><button type="button" className="mapIconControl" aria-label="Ver instalação inteira" title="Ver instalação inteira" onClick={()=>{setTypeFilter('todos');setFitTick(v=>v+1)}}><LocateFixed size={18}/></button><button type="button" className={`mapIconControl ${filtersOpen?'active':''}`} aria-label="Filtros do mapa" title="Filtros do mapa" onClick={()=>setFiltersOpen(v=>!v)}><Filter size={18}/></button>{filtersOpen&&<div className="mapFilterPopover"><div className="popoverTitle"><span>Filtros</span><button type="button" aria-label="Fechar filtros" onClick={()=>setFiltersOpen(false)}><X size={14}/></button></div><div className="popoverSegment">{filterOptions.map(([key,label,count])=><button type="button" key={key} className={typeFilter===key?'active':''} onClick={()=>setTypeFilter(key)}>{label}<b>{count}</b></button>)}</div><div className="popoverToggles"><label><input type="checkbox" checked={showBuffers} onChange={e=>setShowBuffers(e.target.checked)}/> Raios</label><label><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/> Nomes</label></div><div className="mapLegend popoverLegend"><span><i className="legendFarm"/> Fazenda</span><span><i className="legendProcessor"/> VP8002</span><span><i className="legendAntenna"/> VP4102</span>{otherCount>0&&<span><i className="legendOther"/> Outro</span>}{showBuffers&&<span><i className="legendBuffer"/> Cobertura</span>}</div></div>}</div></div>
      <aside className="mapPointList"><div className="mapPointHeader"><h3>Pontos da instalação</h3><span>{equips.length}/{all.length}</span></div>{farm.latitude&&farm.longitude&&<button className="mapPointItem farm" onClick={()=>setFocus([Number(farm.latitude),Number(farm.longitude)])}><span className="mapPointIcon farm"><Warehouse size={16}/></span><div><strong>Fazenda</strong><span>{farm.nome}</span></div></button>}{equips.map(e=><button className="mapPointItem" key={e.id} onClick={()=>setFocus(e._mapPosition)}>{mapPointIconFor(e)}<div><strong>{e.apelido||e.local_nome||e.tipo}</strong><span>{e.local_nome||'sem local'} • {Number(e.latitude).toFixed(5)}, {Number(e.longitude).toFixed(5)}{e._stackTotal>1?` • ponto ${e._stackIndex}/${e._stackTotal}`:''}</span></div><em onClick={(event)=>{event.stopPropagation();openMaps(e.latitude,e.longitude)}}>Maps</em></button>)}</aside>
    </div>
    {!all.length&&<Empty icon={MapIcon} title="Nenhum equipamento no mapa" text="Nenhum equipamento com coordenadas nesta fazenda."/>}
  </section>
}
function VisitasFazenda({farm,data,openNew,onStartReturn,canEdit=true}){
  const [viewing,setViewing]=useState(null),[editing,setEditing]=useState(null),[photoVisit,setPhotoVisit]=useState(null);
  const visits=data.visitas.filter(v=>v.fazenda_id===farm.id).sort((a,b)=>new Date(b.data_visita||b.created_at||0)-new Date(a.data_visita||a.created_at||0));
  const openVisit=visits.find(isOpenVisit), pending=visits.filter(v=>[VISIT_STATUS_PENDING,VISIT_STATUS_WAITING_RETURN].includes(visitDisplayStatus(v))), done=visits.filter(v=>[VISIT_STATUS_DONE,VISIT_STATUS_RESOLVED_RETURN].includes(visitDisplayStatus(v))).length, last=visits[0];
  const evidenceCount=id=>(data.evidencias||[]).filter(ev=>ev.visita_id===id).length;
  const visitById=id=>visits.find(v=>v.id===id);
  const saveEditedVisit=async row=>{
    const result=await data.saveVisita(row);
    if(!result.ok)return result;
    if(row.iniciada_em){
      const nextVisits=visits.map(item=>item.id===row.id?row:item);
      const latest=[...nextVisits].filter(item=>item.iniciada_em).sort((a,b)=>new Date(b.iniciada_em)-new Date(a.iniciada_em))[0];
      if(latest?.id===row.id){
        const farmResult=await data.saveFazenda({...farm,servico_inicio_em:row.iniciada_em,servico_fim_em:row.finalizada_em||null,servico_responsavel:row.responsavel_tecnico||farm.servico_responsavel||'',status:autoServiceStatus(row.iniciada_em,row.finalizada_em,farm.status)});
        if(!farmResult.ok)return farmResult;
      }
    }
    notify('Visita atualizada.');
    return {ok:true};
  };
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
      const tone=visitStatusTone(v), status=visitDisplayStatus(v), hasPending=visitHasOpenPending(v), summary=visitSummaryText(v), photos=evidenceCount(v.id), parent=visitById(v.parent_visit_id), resolvedBy=visitById(v.resolved_by_visit_id), canStartReturn=canEdit&&hasPending&&!isOpenVisit(v)&&!v.resolved_by_visit_id;
      const serviceText=visitServiceText(v);
      return <article className={`visitCard ${tone}`} key={v.id}>
        <div className="visitStateIcon">{tone==='open'?<PlayCircle size={19}/>:hasPending?<AlertTriangle size={19}/>:<CheckCircle2 size={19}/>}</div>
        <div className="visitCardMain">
          <div className="visitCardTop"><div><h3>{v.tipo}</h3><span>{brDate(v.data_visita)}{photos>0&&` • ${photos} foto(s)`}</span></div><em>{status}</em></div>
          {parent&&<div className="visitReturnLink"><Route size={14}/> Retorno da visita de {brDate(parent.data_visita)}</div>}
          {resolvedBy&&<div className="visitReturnLink resolved"><CheckCircle2 size={14}/> Resolvida pelo retorno de {brDate(resolvedBy.data_visita)}</div>}
          {serviceText&&<div className="visitServicePeriod"><Clock size={14}/> {serviceText}</div>}
          {v.responsavel_tecnico&&<div className="visitTechnician"><UserCheck size={14}/> {v.responsavel_tecnico}</div>}
          <p>{summary}</p>
          {tone==='open'?<div className="visitOpenBox"><PlayCircle size={15}/> Em andamento</div>:hasPending?<div className="visitPendingBox"><AlertTriangle size={15}/><span><b>{status===VISIT_STATUS_WAITING_RETURN?'Aguardando retorno':'Pendência'}</b>{v.pendencias||v.proxima_acao}</span></div>:<div className="visitOkBox"><CheckCircle2 size={15}/>{status===VISIT_STATUS_RESOLVED_RETURN?'Pendência resolvida por retorno':'Sem pendências registradas'}</div>}
          <footer><button className="btn light" onClick={()=>setViewing(v)}><Info size={15}/> Ver</button>{canStartReturn&&<button className="btn primary" onClick={()=>onStartReturn?.(v)}><Route size={15}/> Iniciar retorno</button>}{canEdit&&<button className="btn light" onClick={()=>setPhotoVisit(v)}><Camera size={15}/> Fotos</button>}{canEdit&&<button className="btn light" onClick={()=>setEditing(v)}><Pencil size={15}/> Editar</button>}{canEdit&&<button className="btn light dangerInline" onClick={()=>data.delVisita(v.id)}><Trash2 size={15}/> Excluir</button>}</footer>
        </div>
      </article>
    })}</div>
    {visits.length===0&&<Empty icon={CalendarDays} title="Nenhuma visita registrada" text="Registre instalação, diagnóstico, retorno ou suporte."/>}
    {viewing&&<VisitDetailModal visit={viewing} visits={visits} evidencias={(data.evidencias||[]).filter(ev=>ev.visita_id===viewing.id)} onClose={()=>setViewing(null)}/>}
    {photoVisit&&canEdit&&<EvidenceUploadModal farm={farm} data={data} visita={photoVisit} onClose={()=>setPhotoVisit(null)}/>}
    {editing&&canEdit&&<VisitModal farm={farm} visit={editing} data={data} onClose={()=>setEditing(null)} onSave={async(r)=>{const result=await saveEditedVisit(r);if(result.ok)setEditing(null)}}/>}
  </section>
}
function VisitDetailModal({visit,visits=[],evidencias=[],onClose}){
  const hasPending=visitHasOpenPending(visit), status=visitDisplayStatus(visit), open=isOpenVisit(visit), parent=visits.find(v=>v.id===visit.parent_visit_id), resolvedBy=visits.find(v=>v.id===visit.resolved_by_visit_id);
  const photos=evidencias.filter(item=>evidenceSrc(item));
  const serviceText=visitServiceText(visit);
  const details=[['Técnico responsável',visit.responsavel_tecnico,UserCheck],['Problemas',visit.problemas,AlertTriangle],['Solução',visit.solucao,CheckCircle2],['Próxima ação',visit.proxima_acao,Navigation]].filter(([,value])=>String(value||'').trim());
  return <Modal title={`${visit.tipo} • ${brDate(visit.data_visita)}`} onClose={onClose}><div className="modalBody visitDetailModal">
    <div className={`visitDetailStatus ${open?'open':hasPending?'pending':'ok'}`}>{open?<PlayCircle size={24}/>:hasPending?<AlertTriangle size={24}/>:<CheckCircle2 size={24}/>}<div><b>{status}</b><span>{open?'Visita em andamento.':hasPending?'Existe uma ação pendente registrada.':status===VISIT_STATUS_RESOLVED_RETURN?'Pendência resolvida por retorno.':'Sem pendências registradas.'}</span></div></div>
    {parent&&<section className="visitDetailSection return"><h3>Retorno vinculado</h3><p>Esta visita é retorno da visita de {brDate(parent.data_visita)}.</p></section>}
    {resolvedBy&&<section className="visitDetailSection return"><h3>Resolvida por retorno</h3><p>Resolvida pela visita de retorno de {brDate(resolvedBy.data_visita)}.</p></section>}
    {serviceText&&<section className="visitDetailSection"><h3>Atendimento</h3><p>{serviceText}</p></section>}
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
  const [filter,setFilter]=useState('todas'),[filtersOpen,setFiltersOpen]=useState(false),[viewing,setViewing]=useState(null),[editing,setEditing]=useState(null),[generalUpload,setGeneralUpload]=useState(false);
  const contextOf=item=>item.equipamento_id?'equipamentos':item.visita_id?'visitas':'gerais';
  const visible=evidencias.filter(item=>filter==='todas'||contextOf(item)===filter);
  const totals={equipamentos:evidencias.filter(e=>e.equipamento_id).length,visitas:evidencias.filter(e=>e.visita_id).length,gerais:evidencias.filter(e=>!e.equipamento_id&&!e.visita_id).length};
  const latest=evidencias.slice().sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0];
  const filters=[['todas','Todas',evidencias.length,ImageIcon],['equipamentos','Equipamentos',totals.equipamentos,Cpu],['visitas','Visitas',totals.visitas,CalendarDays],['gerais','Gerais',totals.gerais,FolderIconFallback]];
  const activeFilter=filters.find(([key])=>key===filter)||filters[0];
  const equipmentGroups=equips.map(eq=>({id:eq.id,label:eq.apelido||eq.local_nome||eq.tipo,count:evidencias.filter(ev=>ev.equipamento_id===eq.id).length,Icon:eq.tipo?.includes('4102')?RadioTower:Cpu})).filter(g=>g.count>0);
  const visitGroups=visits.map(v=>({id:v.id,label:`${v.tipo} • ${brDate(v.data_visita)}`,count:evidencias.filter(ev=>ev.visita_id===v.id).length,Icon:CalendarDays})).filter(g=>g.count>0);
  return <section className="panel evidencePanel evidenceGalleryPanel">
    <div className="sectionTitle evidenceGalleryHead"><div><span className="eyebrow">Registro fotográfico</span><h2><ImageIcon size={21}/> Evidências</h2></div><div className="evidenceHeadActions"><div className="evidenceTotal"><b>{evidencias.length}</b><span>foto(s)</span></div><div className="evidenceFilterWrap"><button type="button" className={`iconBtn evidenceFilterButton ${filtersOpen?'active':''}`} aria-label="Filtrar evidências" title="Filtrar evidências" onClick={()=>setFiltersOpen(v=>!v)}><Filter size={17}/></button>{filtersOpen&&<div className="evidenceFilterMenu"><div className="popoverTitle"><span>Filtros</span><button type="button" aria-label="Fechar filtros" onClick={()=>setFiltersOpen(false)}><X size={14}/></button></div><div className="contextFilters evidenceMenuFilters">{filters.map(([key,label,count,Icon])=><button key={key} className={filter===key?'active':''} onClick={()=>{setFilter(key);setFiltersOpen(false)}}><Icon size={15}/>{label}<span>{count}</span></button>)}</div>{(equipmentGroups.length>0||visitGroups.length>0)&&<><div className="reportFilterDivider"/><div className="evidenceMenuGroups">{equipmentGroups.map(g=>{const Icon=g.Icon;return <button key={`eq-${g.id}`} onClick={()=>{setFilter('equipamentos');setFiltersOpen(false)}}><Icon size={15}/><span>{g.label}</span><b>{g.count}</b></button>})}{visitGroups.map(g=>{const Icon=g.Icon;return <button key={`v-${g.id}`} onClick={()=>{setFilter('visitas');setFiltersOpen(false)}}><Icon size={15}/><span>{g.label}</span><b>{g.count}</b></button>})}</div></>}</div>}</div>{canEdit&&<button className="btn light" onClick={()=>setGeneralUpload(true)}><Camera size={17}/> Registro geral</button>}</div></div>
    {!canEdit&&<PermissionNotice/>}
    <div className="evidenceContextSummary">
      <article><Cpu size={18}/><b>{totals.equipamentos}</b><span>em equipamentos</span></article>
      <article><CalendarDays size={18}/><b>{totals.visitas}</b><span>em visitas</span></article>
      <article><ImageIcon size={18}/><b>{latest?brDate(latest.created_at):'-'}</b><span>último registro</span></article>
    </div>
    <div className="evidenceActiveFilter"><span>{activeFilter[1]}</span><b>{visible.length}</b></div>
    {visible.length?<div className="evidenceGrid">{visible.map(item=><article className="evidenceCard" key={item.id}><button className="evidenceThumb" onClick={()=>setViewing(item)}>{evidenceSrc(item)?<img src={evidenceSrc(item)} alt={item.descricao||item.categoria}/>:<ImageIcon size={34}/>}<span><Eye size={15}/> Ver</span></button><div className="evidenceContent"><div><b>{item.categoria}</b>{item.inclui_relatorio!==false&&<span className="pill">Relatório</span>}</div><small><Link2 size={13}/>{evidenceLinkedText(item,equips,visits)}</small><small><Clock size={13}/>{brDateTime(item.created_at)}</small></div><footer>{canEdit&&<button className="iconBtn" title="Editar evidência" onClick={()=>setEditing(item)}><Pencil size={16}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir evidência" onClick={()=>data.delEvidencia(item)}><Trash2 size={16}/></button>}</footer></article>)}</div>:<Empty icon={ImageIcon} title="Nenhuma evidência neste filtro" text="As fotos entram pelo equipamento, pela visita ou como registro geral."/>}
    {generalUpload&&canEdit&&<EvidenceUploadModal farm={farm} data={data} onClose={()=>setGeneralUpload(false)}/>}
    {viewing&&<Modal title={viewing.categoria} onClose={()=>setViewing(null)}><div className="modalBody evidenceViewer">{evidenceSrc(viewing)?<img src={evidenceSrc(viewing)} alt={viewing.descricao||viewing.categoria}/>:<Empty icon={ImageIcon} title="Imagem indisponível" text="Não foi possível carregar o arquivo desta evidência."/>}<InfoCard title="Detalhes" rows={[['Categoria',viewing.categoria],['Vínculo',evidenceLinkedText(viewing,equips,visits)],['Relatório',viewing.inclui_relatorio!==false?'Sim':'Não'],['Data',brDateTime(viewing.created_at)]]}/></div></Modal>}
    {editing&&canEdit&&<EvidenceEditModal item={editing} equips={equips} visits={visits} onClose={()=>setEditing(null)} onSave={async(row)=>{const r=await data.saveEvidencia(row);if(r.ok)setEditing(null)}}/>}
  </section>
}
function FolderIconFallback(props){return <Layers {...props}/>}
function EvidenceUploadModal({farm,data,equipamento=null,visita=null,onClose}){
  const [categoria,setCategoria]=useState(evidenceCategoryFor({equipamento,visita})),[incluiRelatorio,setIncluiRelatorio]=useState(true),[busy,setBusy]=useState(false);
  const contextTitle=equipamento?equipamento.apelido||equipamento.local_nome||equipamento.tipo:visita?`${visita.tipo} • ${brDate(visita.data_visita)}`:'Registro geral';
  const uploadBase=`evidence-context-${farm.id}-${equipamento?.id||visita?.id||'geral'}`;
  const upload=async(e)=>{
    const files=e.target.files;
    if(!files?.length)return;
    setBusy(true);
    const result=await data.uploadEvidencias(farm,files,{categoria,descricao:'',equipamento_id:equipamento?.id||null,visita_id:visita?.id||null,inclui_relatorio:incluiRelatorio});
    setBusy(false);
    e.target.value='';
    if(result.ok)onClose();
  };
  return <Modal title="Adicionar fotos" onClose={onClose}><div className="modalBody contextEvidenceModal">
    <div className="contextEvidenceTarget"><Camera size={22}/><div><span>Vínculo automático</span><b>{contextTitle}</b></div></div>
    <Field label="Categoria"><select value={categoria} onChange={e=>setCategoria(e.target.value)}>{EVIDENCE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
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
  const [form,setForm]=useState({...item,categoria:item.categoria||EVIDENCE_CATEGORIES[0],equipamento_id:item.equipamento_id||'',visita_id:item.visita_id||'',inclui_relatorio:item.inclui_relatorio!==false});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  return <Modal title="Editar evidência" onClose={onClose}><form className="form" onSubmit={e=>{e.preventDefault();onSave({...form,descricao:''})}}><Field label="Categoria"><select value={form.categoria} onChange={e=>set('categoria',e.target.value)}>{EVIDENCE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field><div className="grid2"><Field label="Equipamento"><select value={form.equipamento_id||''} onChange={e=>{set('equipamento_id',e.target.value);if(e.target.value)set('visita_id','')}}><option value="">Registro geral</option>{equips.map(eq=><option key={eq.id} value={eq.id}>{eq.apelido||eq.local_nome||eq.tipo}</option>)}</select></Field><Field label="Visita"><select value={form.visita_id||''} onChange={e=>{set('visita_id',e.target.value);if(e.target.value)set('equipamento_id','')}}><option value="">Sem vínculo</option>{visits.map(v=><option key={v.id} value={v.id}>{v.tipo} - {brDate(v.data_visita)}</option>)}</select></Field></div><label className="optionCheck"><input type="checkbox" checked={form.inclui_relatorio} onChange={e=>set('inclui_relatorio',e.target.checked)}/> Incluir no relatório técnico</label><button className="btn primary full"><Save size={18}/> Salvar evidência</button></form></Modal>
}

function VisitModal({farm,visit={},data={},onClose,onSave}){
  const hasServicePeriod=Boolean(visit.iniciada_em||visit.finalizada_em);
  const currentUserName=personName(data.currentUser);
  const responsibleOptions=serviceResponsibleOptions(data,farm,currentUserName);
  const [form,setForm]=useState({id:visit.id||uid(),fazenda_id:farm.id,tipo:visit.tipo||'Instalação',data_visita:visit.data_visita||todayInput(),resumo:visit.resumo||'',problemas:visit.problemas||'',solucao:visit.solucao||'',pendencias:visit.pendencias||'',proxima_acao:visit.proxima_acao||'',status:visit.status||'',iniciada_em:dateTimeInput(visit.iniciada_em),finalizada_em:dateTimeInput(visit.finalizada_em),responsavel_tecnico:visit.responsavel_tecnico||farm.servico_responsavel||currentUserName||'',parent_visit_id:visit.parent_visit_id||null,resolved_by_visit_id:visit.resolved_by_visit_id||null,resolved_at:visit.resolved_at||null,retorno_necessario:visit.retorno_necessario||visitNeedsReturn(visit),created_at:visit.created_at||nowISO()});
  const [hasPending,setHasPending]=useState(visitHasPending(visit));
  const [needsReturn,setNeedsReturn]=useState(visitNeedsReturn(visit));
  const [keepOpen,setKeepOpen]=useState(isOpenVisit(visit));
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const defaultOkSummary=()=>`${form.tipo} realizada em ${brDate(form.data_visita)}. Sem pendências registradas.`;
  const applyQuick=(kind)=>{
    if(kind==='ok'){setHasPending(false);setNeedsReturn(false);setForm(prev=>({...prev,resumo:prev.resumo||`${prev.tipo} concluída em ${brDate(prev.data_visita)}. Tudo certo no campo.`,pendencias:'',proxima_acao:'',retorno_necessario:false}));}
    if(kind==='validado')setForm(prev=>({...prev,resumo:prev.resumo||'Equipamentos conferidos e operação validada em campo.'}));
    if(kind==='pending'){setHasPending(true);setNeedsReturn(false);setForm(prev=>({...prev,retorno_necessario:false}));}
    if(kind==='return'){setHasPending(true);setNeedsReturn(true);setForm(prev=>({...prev,retorno_necessario:true,pendencias:prev.pendencias||'Retorno necessário para concluir a validação.',proxima_acao:prev.proxima_acao||'Agendar retorno técnico.'}));}
  };
  const submit=e=>{
    e.preventDefault();
    const pendingText=String(form.pendencias||form.proxima_acao||'').trim();
    if(hasPending&&!pendingText){notify('Informe a pendência ou próxima ação.','warning');return;}
    const startedAt=hasServicePeriod?toIsoOrNull(form.iniciada_em):null;
    const enteredEnd=hasServicePeriod?toIsoOrNull(form.finalizada_em):null;
    if(hasServicePeriod&&!startedAt){notify('Informe o início do atendimento.','warning');return;}
    if(startedAt&&enteredEnd&&new Date(enteredEnd)<=new Date(startedAt)){notify('O fim precisa ser posterior ao início.','warning');return;}
    const status=keepOpen?VISIT_STATUS_OPEN:hasPending?(needsReturn?VISIT_STATUS_WAITING_RETURN:VISIT_STATUS_PENDING):VISIT_STATUS_DONE;
    const finishedAt=keepOpen?null:(hasServicePeriod?(enteredEnd||nowISO()):nowISO());
    const clean={...form,status,retorno_necessario:hasPending&&needsReturn,iniciada_em:hasServicePeriod?startedAt:(keepOpen?nowISO():null),finalizada_em:finishedAt,responsavel_tecnico:hasServicePeriod?cleanDisplayName(form.responsavel_tecnico):visit.responsavel_tecnico||null,resumo:String(form.resumo||'').trim()||`${form.tipo} registrada ${hasPending?'com pendência':'sem pendências'} em ${brDate(form.data_visita)}.`};
    if(!hasPending){clean.pendencias='';clean.proxima_acao='';clean.retorno_necessario=false;}
    onSave(clean);
  };
  return <Modal title={visit.id?'Editar visita':'Nova visita'} onClose={onClose}><form className="form modern visitEditor" onSubmit={submit}>
    <div className="grid2 visitEditorTop"><Field label="Tipo"><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{VISIT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Data"><input type="date" value={form.data_visita} onChange={e=>set('data_visita',e.target.value)}/></Field></div>
    {hasServicePeriod&&<section className="visitServiceEditor"><div className="visitServiceEditorTitle"><Clock size={18}/><div><b>Período do atendimento</b><span>Corrija horários ou o técnico quando o registro em campo ficar incorreto.</span></div></div><div className="grid2"><Field label="Início"><input type="datetime-local" value={form.iniciada_em} onChange={e=>{set('iniciada_em',e.target.value);if(e.target.value)set('data_visita',e.target.value.slice(0,10))}} required/></Field><Field label="Fim"><input type="datetime-local" value={form.finalizada_em} onChange={e=>set('finalizada_em',e.target.value)}/></Field></div><ResponsibleServiceField value={form.responsavel_tecnico} onChange={value=>set('responsavel_tecnico',value)} options={responsibleOptions}/></section>}
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
  const reportBrand=reportBrandForCentral(farm.central);
  const serviceSessions=farmServiceSessions(farm,visits), firstStart=firstServiceStart(serviceSessions), lastEnd=lastServiceEnd(serviceSessions), totalServiceLabel=serviceTotalLabel(farm,visits);
  const responsibleLabel=serviceResponsibleLabel(farm,visits);
  return <article className={`printReport professionalReport reportPreview theme-${reportBrand.key}`}>
    <header className="reportHeader"><div className="reportBrandPreview"><img src={reportBrand.logo} alt="" draggable="false"/><div><b>{reportBrand.name}</b><small>ControlTech Assist</small></div></div><div><span>RELATÓRIO TÉCNICO DE INSTALAÇÃO E CAMPO</span><small>Prévia conforme a fazenda selecionada</small></div></header>
    <section className="reportCover"><div><span className="reportTag">CONTROLTECH ASSIST</span><h1>{farm.nome}</h1><p>{farm.cidade||'Cidade não informada'} / {getFarmUF(farm)||'-'}</p></div><div className="reportStatus"><b>{displayStatus}</b><span>Situação da operação</span></div></section>
    <div className="reportMetrics"><div><b>{num(farm.qtd_colares_prevista)}</b><span>Colares previstos</span></div><div><b>{collarInstalled(farm)}</b><span>Instalados</span></div><div><b>{collarDelivered(farm)}</b><span>Entregues</span></div><div><b>{equips.length}</b><span>Equipamentos</span></div><div><b>{totalServiceLabel}</b><span>Tempo em campo</span></div></div>
    <section className="reportSection"><h2>Dados da fazenda</h2><div className="reportInfoGrid"><div><span>Central</span><b>{centralOfficialName(farm.central)||'-'}</b></div><div><span>Regional</span><b>{farm.regional_nome||'-'}</b></div><div><span>Responsavel</span><b>{farm.responsavel||'-'}</b></div><div><span>Telefone</span><b>{farm.telefone||'-'}</b></div><div><span>Veterinario/Apoio</span><b>{farm.veterinario_apoio||'-'}</b></div><div><span>Endereco</span><b>{farm.endereco||'-'}</b></div><div><span>Primeiro inicio</span><b>{brDateTime(firstStart)}</b></div><div><span>Ultimo fim</span><b>{brDateTime(lastEnd)}</b></div><div><span>Atendimentos</span><b>{serviceSessions.length||'-'}</b></div><div><span>Responsavel tecnico</span><b>{responsibleLabel||'-'}</b></div></div></section>
    {points.length>0&&<section className="reportSection"><h2>Mapa técnico</h2><div className="reportMap"><MapContainer center={center} zoom={17} className="bigMap" scrollWheelZoom={false}><HybridLayers layer="hibrido"/><FitBounds points={points} trigger={points.length}/>{farmPoint&&<Marker position={farmPoint} icon={farmMarkerIcon(farm)}/>} {mapped.map(e=><Marker key={e.id} position={[Number(e.latitude),Number(e.longitude)]} icon={equipmentMarkerIcon(e)}/>)}</MapContainer></div></section>}
    <section className="reportSection"><h2>Equipamentos e coordenadas</h2>{equips.length?<div className="reportEquipmentList">{equips.slice(0,8).map((e,i)=><article key={e.id}><div className="reportEquipIndex">{i+1}</div><div><h3>{e.apelido||e.local_nome||e.tipo}</h3><p>{e.tipo} - {equipmentStatusLabel(e)}</p><dl><div><dt>Local</dt><dd>{e.local_nome||'-'}</dd></div><div><dt>Coordenadas</dt><dd>{e.latitude&&e.longitude?`${Number(e.latitude).toFixed(6)}, ${Number(e.longitude).toFixed(6)}`:'-'}</dd></div><div><dt>Raio</dt><dd>{e.tipo?.includes('4102')?`${Number(e.raio_metros)||75} m`:'-'}</dd></div></dl></div></article>)}</div>:<p className="sourceText">Nenhum equipamento registrado nesta fazenda.</p>}</section>
    <section className="reportSection"><h2>Histórico de visitas</h2>{visits.length?<div className="visit">{visits.slice(0,4).map(v=><article key={v.id}><h3>{brDate(v.data_visita)} - {v.tipo}</h3>{v.responsavel_tecnico&&<p><b>Técnico:</b> {v.responsavel_tecnico}</p>}{v.iniciada_em&&<p><b>Serviço:</b> {brDateTime(v.iniciada_em)} até {brDateTime(v.finalizada_em)} {v.finalizada_em?`(${hoursLabel(sessionHours({start:v.iniciada_em,end:v.finalizada_em}))})`:''}</p>}<p>{v.resumo||'Sem resumo.'}</p>{visitHasOpenPending(v)&&<p className="reportPending"><b>Pendências:</b> {v.pendencias||v.proxima_acao}</p>}</article>)}</div>:<p className="sourceText">Nenhuma visita registrada.</p>}</section>
    {evidencias.length>0&&<section className="reportSection"><h2>Registro fotográfico</h2><div className="reportEvidenceGrid">{evidencias.slice(0,6).map(item=><article key={item.id}>{evidenceSrc(item)&&<a href={evidenceSrc(item)} target="_blank" rel="noreferrer" className="reportEvidenceThumbPreview"><img src={evidenceSrc(item)} alt={item.categoria}/></a>}<b>{item.categoria}</b><span>{evidenceLinkedText(item,equips,visits)}</span></article>)}</div></section>}
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
  const reportServiceSessions=farmServiceSessions(farm,reportVisits), reportFirstStart=firstServiceStart(reportServiceSessions), reportLastEnd=lastServiceEnd(reportServiceSessions), reportServiceTotal=serviceTotalLabel(farm,reportVisits);
  const reportResponsible=serviceResponsibleLabel(farm,reportVisits);
  const pendingCount=reportVisits.filter(visitHasOpenPending).length;
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
      ['Central',centralOfficialName(farm.central)||''],
      ['Regional',farm.regional_nome||''],
      ['Veterinário/Apoio',farm.veterinario_apoio||''],
      ['Responsável',farm.responsavel||''],
      ['Cidade',`${farm.cidade||''} / ${getFarmUF(farm)}`],
      ['Status',displayStatus],
      ['Primeiro inicio do servico',brDateTime(reportFirstStart)],
      ['Ultimo fim do servico',brDateTime(reportLastEnd)],
      ['Atendimentos',reportServiceSessions.length],
      ['Tempo em campo',reportServiceTotal],
      ['Responsavel produtividade',reportResponsible||''],
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
      ['Data','Tipo','Técnico responsável','Inicio','Fim','Tempo','Resumo','Problemas','Solução','Pendências','Próxima ação'],
      ...reportVisits.map(v=>[v.data_visita,v.tipo,v.responsavel_tecnico||farm.servico_responsavel||'',brDateTime(v.iniciada_em),brDateTime(v.finalizada_em),v.iniciada_em&&v.finalizada_em?hoursLabel(sessionHours({start:v.iniciada_em,end:v.finalizada_em})):'',v.resumo,v.problemas,v.solucao,v.pendencias,v.proxima_acao]),
      [],
      ['EVIDÊNCIAS'],
      ['Data','Categoria','Descrição','Arquivo','Vínculo'],
      ...reportEvidencias.map(e=>[brDateTime(e.created_at),e.categoria,e.descricao,e.arquivo_nome,evidenceLinkedText(e,equips,visits)])
    ];
    download(`${farm.nome}-relatorio-tecnico.tsv`,rows.map(r=>r.join('\t')).join('\n'));
    notify('Arquivo TSV gerado.');
  };
  const printReport=async()=>{
    const safe=v=>String(v===undefined||v===null||String(v).trim()===''?'-':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const reportBrand=reportBrandForCentral(farm.central);
    const reportLogo=reportBrand.logo || appLogo || '/app-icon-192.png';
    const win=window.open('','_blank');
    if(!win){notify('Permita pop-ups para gerar o relatório.','error');return;}
    win.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Gerando relatório...</title><style>body{font-family:Inter,Arial,sans-serif;margin:40px;color:#0f172a}.loader{max-width:360px;border:1px solid #dbe4ef;border-radius:18px;padding:22px;background:#f8fafc}b{display:block;font-size:18px;margin-bottom:6px}span{color:#64748b}</style></head><body><div class="loader"><b>Gerando relatório...</b><span>Preparando mapa técnico para impressão.</span></div></body></html>');
    win.document.close();
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
    const tileProject=(point,zoom)=>{
      const scale=256*Math.pow(2,zoom);
      const lat=Math.max(-85.05112878,Math.min(85.05112878,point.lat));
      const sin=Math.sin(lat*Math.PI/180);
      return {x:((point.lng+180)/360)*scale,y:(0.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale};
    };
    const buildTileMap=()=>{
      if(!points.length)return null;
      const minZoom=3,maxZoom=18,pad=54;
      let zoom=minZoom,projectedPoints=[];
      for(let z=maxZoom;z>=minZoom;z--){
        const pp=points.map(p=>({...p,...tileProject(p,z)}));
        const xs=pp.map(p=>p.x),ys=pp.map(p=>p.y);
        const spanX=Math.max(...xs)-Math.min(...xs),spanY=Math.max(...ys)-Math.min(...ys);
        if(points.length===1||(spanX<=mapWidth-pad*2&&spanY<=mapHeight-pad*2)){zoom=z;projectedPoints=pp;break;}
        if(z===minZoom)projectedPoints=pp;
      }
      const xs=projectedPoints.map(p=>p.x),ys=projectedPoints.map(p=>p.y);
      const centerX=(Math.min(...xs)+Math.max(...xs))/2,centerY=(Math.min(...ys)+Math.max(...ys))/2;
      const originX=centerX-mapWidth/2,originY=centerY-mapHeight/2;
      const tileCount=Math.pow(2,zoom),maxTile=tileCount-1;
      const firstX=Math.floor(originX/256),lastX=Math.floor((originX+mapWidth)/256);
      const firstY=Math.floor(originY/256),lastY=Math.floor((originY+mapHeight)/256);
      const tiles=[];
      for(let tx=firstX;tx<=lastX;tx++){
        const wrappedX=((tx%tileCount)+tileCount)%tileCount;
        for(let ty=firstY;ty<=lastY;ty++){
          if(ty<0||ty>maxTile)continue;
          tiles.push({
            url:`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${wrappedX}`,
            leftPx:tx*256-originX,
            topPx:ty*256-originY,
            left:((tx*256-originX)/mapWidth)*100,
            top:((ty*256-originY)/mapHeight)*100,
            width:(256/mapWidth)*100,
            height:(256/mapHeight)*100
          });
        }
      }
      return {tiles,points:projectedPoints.map(p=>({...p,screenX:p.x-originX,screenY:p.y-originY}))};
    };
    const tileMap=buildTileMap();
    const blobToDataUrl=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
    const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
    const buildTileRaster=async()=>{
      if(!tileMap?.tiles?.length)return '';
      try{
        const canvas=document.createElement('canvas');
        canvas.width=mapWidth;
        canvas.height=mapHeight;
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#dbe4ef';
        ctx.fillRect(0,0,mapWidth,mapHeight);
        await Promise.all(tileMap.tiles.map(async t=>{
          try{
            const res=await fetch(t.url,{mode:'cors',cache:'force-cache'});
            if(!res.ok)return;
            const img=await loadImage(await blobToDataUrl(await res.blob()));
            ctx.drawImage(img,t.leftPx,t.topPx,256,256);
          }catch{}
        }));
        return canvas.toDataURL('image/jpeg',.9);
      }catch{return '';}
    };
    const mapRaster=await buildTileRaster();
    let mapBaseHtml=mapRaster?`<img class="mapRaster" src="${mapRaster}" alt="Mapa técnico">`:'';
    if(!mapBaseHtml){
      mapBaseHtml=tileMap?.tiles?.length?`<div class="mapTileLayer">${tileMap.tiles.map(t=>`<img src="${t.url}" alt="" loading="eager" referrerpolicy="no-referrer" style="left:${t.left}%;top:${t.top}%;width:${t.width}%;height:${t.height}%">`).join('')}</div>`:'';
    }
    const mapImg='';
    const mapSymbol=p=>p.kind==='farm'?'F':p.kind==='antenna'?'A':p.kind==='processor'?'B':'O';
    const farmPrintGlyph='<svg class="farm-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.2 12 6l8 5.2V20H4z"/><path d="M8 20v-5.2h8V20"/><path d="M8.6 11.5h6.8"/><path d="M10.2 8.9h3.6"/></svg>';
    const markerPoints=tileMap?.points||[];
    const markerHtml=markerPoints.map(p=>{
      const x=(p.screenX/mapWidth)*100;
      const y=(p.screenY/mapHeight)*100;
      const label=String(p.label||'').replace(/^Fazenda\s+/i,'').slice(0,16);
      if(p.kind==='farm')return `<span class="printMapMarker farm" style="left:${x}%;top:${y}%"><span class="farm-marker farm-location">${farmPrintGlyph}</span><b>${safe(label||p.label)}</b></span>`;
      return `<span class="printMapMarker equipment" style="left:${x}%;top:${y}%"><span class="equipment-marker ${p.kind==='antenna'?'antenna':p.kind==='processor'?'processor':'other'}"><span>${mapSymbol(p)}</span></span><b>${safe(label||p.label)}</b></span>`;
    }).join('');
    const mapKey=points.map(p=>`<div><b class="${p.kind}">${mapSymbol(p)}</b><span>${safe(p.label)}</span><small>${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}</small></div>`).join('');
    const mapStatsHtml=points.length?`<div class="mapStats"><span><b>${mapped.length}</b> item(ns) mapeado(s)</span><span><b>${equips.length-mapped.length}</b> sem coordenada</span><span><b>${points.length}</b> ponto(s) no mapa</span></div>`:'';
    const technicalMapHtml=points.length?`<section class="section mapSection"><h2>Mapa técnico da instalação</h2><div class="mapBox technicalMapPrint">${mapBaseHtml}${markerHtml}</div>${mapStatsHtml}<div class="mapKey">${mapKey}</div></section>`:'';
    const equipmentRows=equips.map((e,i)=>`<tr><td>${i+1}</td><td><b>${safe(e.apelido||e.local_nome||e.tipo)}</b><small>${safe(e.tipo)} - ${safe(equipmentStatusLabel(e))}</small></td><td>${safe(e.local_nome)}</td><td>${e.latitude&&e.longitude?`${Number(e.latitude).toFixed(6)}, ${Number(e.longitude).toFixed(6)}`:'-'}</td><td>${e.tipo?.includes('4102')?`${Number(e.raio_metros)||75} m`:'-'}</td></tr>`).join('');
    const visitRows=reportVisits.map(v=>`<article><h3>${safe(brDate(v.data_visita))} - ${safe(v.tipo)}</h3>${v.responsavel_tecnico?`<p><b>Técnico:</b> ${safe(v.responsavel_tecnico)}</p>`:''}${v.iniciada_em?`<p><b>Serviço:</b> ${safe(brDateTime(v.iniciada_em))} até ${safe(brDateTime(v.finalizada_em))} ${v.finalizada_em?`(${safe(hoursLabel(sessionHours({start:v.iniciada_em,end:v.finalizada_em})))})`:''}</p>`:''}<p>${safe(v.resumo||'Sem resumo.')}</p>${opts.pend&&visitHasOpenPending(v)?`<p class="warn"><b>Pendências:</b> ${safe(v.pendencias||v.proxima_acao)}</p>`:''}${v.solucao?`<p><b>Solução:</b> ${safe(v.solucao)}</p>`:''}</article>`).join('');
    const checkRows=checks.map(c=>`<tr><td>${safe(brDate(c.created_at))}</td><td>${safe(c.titulo)}</td><td>${safe(c.status)}</td><td>${safe(c.observacoes||'-')}</td></tr>`).join('');
    const evidencePrintItems=reportEvidencias.filter(e=>evidenceSrc(e)).slice(0,8).map((e,i)=>({item:e,src:evidenceSrc(e),anchor:`evidence-full-${i+1}`}));
    const evidenceRows=evidencePrintItems.map(({item,src,anchor},i)=>`<a class="evidenceThumbCard" href="#${anchor}"><figure><img src="${safe(src)}" alt="${safe(item.categoria)}"><figcaption><strong>${safe(item.categoria)}</strong><span>${safe(evidenceLinkedText(item,equips,visits))}</span><small>Imagem ${i+1} • clique para ampliar</small></figcaption></figure></a>`).join('');
    const evidenceSectionHtml=evidenceRows?`<section class="section evidenceSection"><h2>Registro fotográfico da instalação</h2><div class="evidenceGrid">${evidenceRows}</div></section>`:'';
    const evidenceAppendixHtml=evidencePrintItems.length?`<section class="section evidenceAppendix"><h2>Anexo de evidências ampliadas</h2>${evidencePrintItems.map(({item,src,anchor},i)=>`<article id="${anchor}" class="evidenceFullPage"><div><b>${safe(`Imagem ${i+1} - ${item.categoria}`)}</b><span>${safe(evidenceLinkedText(item,equips,visits))}</span></div><a href="${safe(src)}" target="_blank" rel="noreferrer"><img src="${safe(src)}" alt="${safe(item.categoria)}"></a></article>`).join('')}</section>`:'';
    const predicted=num(farm.qtd_colares_prevista),installed=collarInstalled(farm),delivered=collarDelivered(farm),handled=collarHandled(farm),progress=collarProgress(farm);
    const mappedCount=mapped.length,missingCoords=equips.filter(e=>!e.latitude||!e.longitude).length,pendingVisits=reportVisits.filter(visitHasOpenPending).length;
    const executiveHtml=`<section class="section executive"><h2>Resumo executivo</h2><p>${safe(`Relatório ${reportScopeLabel.toLowerCase()} da fazenda ${farm.nome}. Status ${displayStatus}, ${installed} colares instalados, ${delivered} entregues ao cliente/reserva, ${handled} de ${predicted} colares atendidos, ${equips.length} equipamento(s) cadastrado(s), ${mappedCount} com coordenadas, ${reportVisits.length} visita(s) no escopo e ${reportServiceSessions.length} atendimento(s) totalizando ${reportServiceTotal} em campo.`)}</p><div class="execGrid"><div><span>Escopo</span><b>${safe(reportScopeLabel)}</b></div><div><span>Progresso atendido</span><b>${predicted?`${progress}%`:'-'}</b></div><div><span>Tempo em campo</span><b>${safe(reportServiceTotal)}</b></div><div><span>Pendências em visitas</span><b>${opts.pend?pendingVisits:'-'}</b></div></div></section>`;
    const attentionItems=[
      missingCoords?`${missingCoords} equipamento(s) sem coordenadas no mapa técnico.`:'',
      !reportServiceSessions.length?'Nenhum atendimento com início registrado para produtividade.':reportServiceSessions.some(session=>!session.end)?'Existe atendimento em andamento sem fim registrado.':'',
      opts.pend&&pendingVisits?`${pendingVisits} visita(s) possuem pendências registradas.`:'',
      !checks.length?'Nenhum checklist salvo para esta fazenda.':''
    ].filter(Boolean);
    const attentionHtml=attentionItems.length?`<section class="section attention"><h2>Pontos de atenção</h2><ul>${attentionItems.map(item=>`<li>${safe(item)}</li>`).join('')}</ul></section>`:'';
    const reportBrandCss=`<style>:root{--report-brand:${reportBrand.primary};--report-brand-2:${reportBrand.secondary};--report-brand-soft:${reportBrand.soft};--report-brand-border:${reportBrand.border}}.top{border-bottom-color:var(--report-brand)!important}.brand img{width:76px!important;height:38px!important;object-fit:contain!important;border:1px solid #dbe4ef!important;border-radius:10px!important;background:#fff!important;padding:4px 7px!important}.brand span{color:var(--report-brand)!important}.cover{background:${reportBrand.cover}!important}.cover small{color:#fff!important;opacity:.88}.metric{border-color:var(--report-brand-border)!important;background:var(--report-brand-soft)!important}.metric b{color:var(--report-brand)!important}h2:before{background:var(--report-brand-soft)!important;color:var(--report-brand)!important}.visit article{border-left-color:var(--report-brand)!important}.status{background:rgba(255,255,255,.10)}</style>`;
    const printPolish=`<style>@media screen{html{background:#475569}body{width:210mm;min-height:297mm;margin:18px auto!important;padding:13mm!important;background:#fff!important;box-shadow:0 24px 80px rgba(15,23,42,.35)}}@media print{html,body{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important;background:#fff!important}}body{counter-reset:sec;color:#0b1220;font-size:10.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.top{align-items:center;padding-bottom:9px;margin-bottom:10px}.brand img{width:32px;height:32px}.brand b{font-size:17px}.doccode{font-size:9.5px}.cover{display:grid;grid-template-columns:1fr auto;align-items:end;min-height:88px;margin:8px 0 10px;padding:13px 16px}.cover h1{font-size:23px;line-height:1.05;margin:6px 0 4px}.cover p{margin:0}.status{font-weight:800}.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0}.box{min-height:42px;background:#fff;border-color:#cbd5e1;padding:6px 7px}.box b{font-size:9.4px}.box span{font-size:9.8px}.metrics{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:8px 0 10px}.metric{padding:7px 5px;background:#f0fdf4;border-color:#86efac}.metric b{font-size:18px;line-height:1.05}h2{font-size:13.5px;margin:11px 0 6px;color:#0f172a;display:flex;align-items:center;gap:7px}h2:before{counter-increment:sec;content:counter(sec);width:18px;height:18px;border-radius:6px;background:#dcfce7;color:#15803d;display:inline-grid;place-items:center;font-size:10px;font-weight:900}.section{margin-top:8px;break-inside:auto}.executive{background:#f8fafc;border:1px solid #dbe4ef;border-radius:12px;padding:9px 11px}.executive p{margin:3px 0 0;color:#334155}.execGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:7px}.execGrid div{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:6px}.execGrid span{display:block;color:#64748b;font-size:8.5px;font-weight:800;text-transform:uppercase}.execGrid b{display:block;margin-top:2px;font-size:12px}.attention{border:1px solid #fed7aa;background:#fff7ed;border-radius:12px;padding:8px 11px}.attention ul{margin:4px 0 0;padding-left:17px}.attention li{margin:2px 0}.mapBox{height:198px;margin-top:5px}.mapBox img{object-fit:fill!important}.mapKey{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.mapKey div{padding:5px}.mapKey small{font-size:8px}table{font-size:9.2px}thead{display:table-header-group}th{font-size:9px;letter-spacing:.02em}th,td{padding:4px 5px}td small{font-size:8.4px}.visit article{padding:6px 8px;margin:5px 0}.signature{margin-top:26px}.footer{margin-top:12px}.cover,.grid,.metrics,.executive,.mapBox,.mapKey,.signature{break-inside:avoid}@media print{.mapBox{height:190px}.section{break-inside:auto}.mapSection{break-inside:auto}.footer{position:static}}</style>`;
    const technicalMapCss=`<style>.technicalMapPrint{isolation:isolate}.mapRaster{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:fill!important;display:block!important}.mapTileLayer{position:absolute;inset:0;overflow:hidden;background:#dbe4ef}.mapTileLayer img{position:absolute!important;display:block!important;max-width:none!important;object-fit:fill!important;border:0!important;margin:0!important;padding:0!important}.technicalMapPrint:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.02),rgba(15,23,42,.10));pointer-events:none}.printMapMarker{position:absolute;transform:translate(-50%,-92%);z-index:3;display:flex;flex-direction:column;align-items:center;gap:2px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.42))}.printMapMarker>b{display:inline-block;max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(255,255,255,.96);border:1px solid #dbe4ef;border-radius:8px;padding:2px 6px;color:#0f172a;font-size:7.4px;line-height:1;font-weight:900}.printMapMarker .equipment-marker{width:27px;height:27px;border-radius:11px 11px 11px 4px;transform:rotate(-45deg);display:grid;place-items:center;border:2px solid #fff;box-shadow:0 7px 18px #0f172a66}.printMapMarker .equipment-marker>span{transform:rotate(45deg);font-size:13px;font-weight:900;color:#fff}.printMapMarker .equipment-marker.antenna{background:linear-gradient(135deg,#16a34a,#22c55e)}.printMapMarker .equipment-marker.processor{background:linear-gradient(135deg,#0f172a,#2563eb)}.printMapMarker .equipment-marker.other{background:linear-gradient(135deg,#f59e0b,#f97316)}.printMapMarker .farm-marker{width:30px;height:30px;border-radius:12px 12px 12px 4px;transform:rotate(-45deg);display:grid;place-items:center;border:2px solid #fff;box-shadow:0 7px 18px #0f172a66;background:linear-gradient(135deg,#0f172a,#0f766e)}.printMapMarker .farm-glyph{width:17px;height:17px;transform:rotate(45deg);fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.mapStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:6px}.mapStats span{border:1px solid #dbe4ef;background:#f8fafc;border-radius:9px;padding:5px 7px;color:#475569;font-size:8.5px}.mapStats b{display:block;color:#0f172a;font-size:11px}.mapKey{margin-top:6px}.mapKey b.farm{background:#0f766e}.mapKey b.antenna{background:#16a34a}.mapKey b.processor{background:#2563eb}.mapKey b.other{background:#f59e0b}@media print{.printMapMarker .equipment-marker{width:24px;height:24px}.printMapMarker .equipment-marker>span{font-size:12px}.printMapMarker .farm-marker{width:27px;height:27px}.printMapMarker .farm-glyph{width:15px;height:15px}.printMapMarker>b{font-size:7px}.mapStats{break-inside:avoid}}</style>`;
    const evidencePrintCss=`<style>.evidenceGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:7px}.evidenceThumbCard{color:inherit;text-decoration:none;break-inside:avoid}.evidenceThumbCard figure{margin:0;border:1px solid #dbe4ef;border-radius:12px;overflow:hidden;background:#f8fafc}.evidenceThumbCard img{width:100%;height:118px;object-fit:cover;display:block}.evidenceThumbCard figcaption{padding:7px 8px}.evidenceThumbCard strong,.evidenceThumbCard span,.evidenceThumbCard small{display:block}.evidenceThumbCard strong{font-size:10px}.evidenceThumbCard span{color:#64748b;font-size:8.8px;line-height:1.35;margin-top:2px}.evidenceThumbCard small{color:var(--report-brand);font-size:8px;font-weight:900;margin-top:5px;text-transform:uppercase;letter-spacing:.04em}.evidenceAppendix{counter-reset:none}.evidenceAppendix h2{margin-top:18px}.evidenceFullPage{break-before:page;page-break-before:always;break-inside:avoid}.evidenceFullPage>div{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;border-bottom:1px solid #dbe4ef;padding-bottom:6px;margin-bottom:8px}.evidenceFullPage b{font-size:13px}.evidenceFullPage span{color:#64748b;font-size:10px;text-align:right}.evidenceFullPage a{display:block}.evidenceFullPage img{width:100%;max-height:235mm;object-fit:contain;border:1px solid #dbe4ef;border-radius:12px;background:#f8fafc;display:block}@media print{.evidenceFullPage img{max-height:222mm}.evidenceThumbCard img{height:112px}}</style>`;
    const printReadyScript=`<script>(()=>{const printNow=()=>setTimeout(()=>window.print(),650);const imgs=Array.from(document.images||[]);if(!imgs.length){printNow();return;}let pending=imgs.filter(img=>!img.complete).length;if(!pending){printNow();return;}let printed=false;const finish=()=>{if(printed)return;printed=true;printNow();};const done=()=>{pending-=1;if(pending<=0)finish();};imgs.forEach(img=>{if(img.complete)return;img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true});});setTimeout(finish,5200);})()</script>`;
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório técnico - ${safe(farm.nome)}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:0;background:#fff;font-size:11.5px;line-height:1.35}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0f172a;padding-bottom:12px;break-inside:avoid}.brand{display:flex;align-items:center;gap:10px}.brand img{width:40px;height:40px}.brand b{font-size:20px}.brand span{display:block;color:#16a34a;font-weight:800}.doccode{text-align:right;color:#64748b}.cover{margin:14px 0;padding:18px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#14532d);color:#fff;break-inside:avoid}.cover small{letter-spacing:.15em;color:#86efac;font-weight:800}.cover h1{font-size:28px;margin:6px 0 3px}.status{display:inline-block;margin-top:8px;padding:6px 10px;border:1px solid #ffffff44;border-radius:999px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.box{border:1px solid #dbe4ef;border-radius:10px;padding:8px;background:#f8fafc}.box b,.box span{display:block}.box span{color:#475569;margin-top:2px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;break-inside:avoid}.metric{border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:10px;text-align:center}.metric b{font-size:21px;color:#15803d;display:block}h2{font-size:16px;margin:18px 0 7px;border-bottom:1px solid #dbe4ef;padding-bottom:5px}.section{break-inside:auto}.mapBox{position:relative;height:260px;border:1px solid #dbe4ef;border-radius:14px;overflow:hidden;background:#eef2f7;break-inside:avoid}.mapBox img{width:100%;height:100%;object-fit:fill;display:block}.mapPin{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:900;border:2px solid #fff;box-shadow:0 3px 10px #0008;font-size:11px}.mapPin.farm{background:#e11d48}.mapPin.antenna{background:#16a34a}.mapPin.processor{background:#2563eb}.mapPin.other{background:#f59e0b}.mapKey{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px;break-inside:avoid}.mapKey div{border:1px solid #dbe4ef;border-radius:10px;padding:7px;display:grid;grid-template-columns:26px 1fr;column-gap:7px}.mapKey b{grid-row:1/3;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff}.mapKey b.farm{background:#e11d48}.mapKey b.antenna{background:#16a34a}.mapKey b.processor{background:#2563eb}.mapKey b.other{background:#f59e0b}.mapKey span{font-weight:800}.mapKey small{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:7px;page-break-inside:auto}tr{break-inside:avoid;page-break-inside:avoid}th{background:#0f172a;color:#fff;text-align:left}th,td{padding:6px;border:1px solid #dbe4ef;vertical-align:top;font-size:10.5px}td small{display:block;color:#64748b;margin-top:2px}.visit article{border-left:4px solid #16a34a;background:#f8fafc;padding:8px 10px;margin:7px 0;break-inside:avoid}.visit h3{margin:0 0 3px}.visit p{margin:3px 0}.warn{background:#fffbeb;border-left:3px solid #f59e0b;padding:5px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:46px;margin-top:42px;break-inside:avoid}.signature div{border-top:1px solid #334155;text-align:center;padding-top:7px;color:#64748b}.footer{margin-top:20px;border-top:1px solid #dbe4ef;padding-top:6px;color:#64748b;display:flex;justify-content:space-between;font-size:10px;break-inside:avoid}@media print{.noPrint{display:none}}</style></head><body><header class="top"><div class="brand"><img src="/app-icon-192.png" alt=""><div><b>ControlTech</b><span>Assist</span></div></div><div class="doccode"><b>RELATÓRIO TÉCNICO</b><br>Emissão: ${safe(new Date().toLocaleString('pt-BR'))}<br>Versão ${APP_VERSION}</div></header><section class="cover"><small>INSTALAÇÃO E CAMPO</small><h1>${safe(farm.nome)}</h1><p>${safe(farm.cidade||'Cidade não informada')} / ${safe(getFarmUF(farm)||'-')}</p><span class="status">${safe(displayStatus)}</span></section><section class="grid"><div class="box"><b>Central</b><span>${safe(centralOfficialName(farm.central))}</span></div><div class="box"><b>Regional</b><span>${safe(farm.regional_nome)}</span></div><div class="box"><b>Veterinário/Apoio</b><span>${safe(farm.veterinario_apoio)}</span></div><div class="box"><b>Responsável</b><span>${safe(farm.responsavel)}</span></div><div class="box"><b>Telefone</b><span>${safe(farm.telefone)}</span></div><div class="box"><b>Endereço</b><span>${safe(farm.endereco)}</span></div><div class="box"><b>Primeiro início</b><span>${safe(brDateTime(reportFirstStart))}</span></div><div class="box"><b>Último fim</b><span>${safe(brDateTime(reportLastEnd))}</span></div><div class="box"><b>Períodos de serviço</b><span>${safe(reportServiceSessions.length||'-')}</span></div><div class="box"><b>Responsável técnico</b><span>${safe(farm.servico_responsavel)}</span></div></section><section class="metrics"><div class="metric"><b>${predicted}</b>Colares previstos</div><div class="metric"><b>${installed}</b>Instalados</div><div class="metric"><b>${delivered}</b>Entregues</div><div class="metric"><b>${equips.length}</b>Equipamentos</div><div class="metric"><b>${safe(reportServiceTotal)}</b>Tempo total</div></section><section class="section"><h2>Resumo executivo</h2><p>${safe('Instalação registrada no ControlTech Assist. Dados restritos e credenciais não entram neste documento.')}</p></section>${points.length?`<section class="section"><h2>Mapa técnico da instalação</h2><div class="mapBox"><img src="${mapImg}" alt="Mapa técnico">${markerHtml}</div><div class="mapKey">${mapKey}</div></section>`:''}${opts.equip?`<section><h2>Equipamentos e coordenadas</h2><table><thead><tr><th>#</th><th>Equipamento</th><th>Local</th><th>Coordenadas</th><th>Raio</th></tr></thead><tbody>${equipmentRows||'<tr><td colspan="5">Nenhum equipamento registrado.</td></tr>'}</tbody></table></section>`:''}${opts.visits?`<section><h2>Histórico de visitas</h2><div class="visit">${visitRows||'<p>Nenhuma visita registrada.</p>'}</div></section>`:''}${opts.evidencias?evidenceSectionHtml:''}${opts.checks?`<section><h2>Checklists</h2><table><thead><tr><th>Data</th><th>Checklist</th><th>Status</th><th>Observações</th></tr></thead><tbody>${checkRows||'<tr><td colspan="4">Nenhum checklist registrado.</td></tr>'}</tbody></table></section>`:''}<section class="signature"><div>Responsável técnico</div><div>Coordenação / Cliente</div></section><footer class="footer"><span>ControlTech Assist - Documento técnico de campo</span><span>${safe(farm.nome)}</span></footer><script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body></html>`;
    const polishedHtml=html
      .replace('<script>window.onload=()=>setTimeout(()=>window.print(),350)</script>',printReadyScript)
      .replace('</head>',`${printPolish}${reportBrandCss}${technicalMapCss}${evidencePrintCss}</head>`)
      .replace('<img src="/app-icon-192.png" alt=""><div><b>ControlTech</b><span>Assist</span></div>',`<img src="${safe(reportLogo)}" alt=""><div><b>${safe(reportBrand.name)}</b><span>ControlTech Assist</span></div>`)
      .replace(/<b>Respons[^<]*cnico<\/b><span>[^<]*<\/span>/,`<b>Responsável técnico</b><span>${safe(reportResponsible)}</span>`)
      .replace(/<section class="section"><h2>Resumo executivo<\/h2><p>[\s\S]*?<\/p><\/section>/,`${executiveHtml}${attentionHtml}`)
      .replace(/<section class="section"><h2>Mapa técnico da instalação<\/h2>[\s\S]*?<\/section>/,technicalMapHtml)
      .replace('<section class="signature">',`${opts.evidencias?evidenceAppendixHtml:''}<section class="signature">`)
      .replaceAll('Períodos de serviço','Atendimentos')
      .replaceAll('Tempo total','Tempo em campo')
      .replaceAll('Inicio do servico','Início do serviço')
      .replaceAll('Fim do servico','Fim do serviço')
      .replaceAll('Responsavel tecnico','Responsável técnico')
      .replaceAll('Duracao','Duração');
    win.document.open();win.document.write(polishedHtml);win.document.close();
  };
  const share=async()=>{
    const text=`RELATÓRIO TÉCNICO — ${farm.nome}\nEscopo: ${reportScopeLabel}\n${farm.cidade||''} / ${getFarmUF(farm)}\nCentral: ${centralOfficialName(farm.central)||'-'}\nRegional: ${farm.regional_nome||'-'}\nStatus: ${displayStatus}\nAtendimentos: ${reportServiceSessions.length}\nTempo em campo: ${reportServiceTotal}\nPrimeiro início: ${brDateTime(reportFirstStart)}\nÚltimo fim: ${brDateTime(reportLastEnd)}\nTécnico(s): ${reportResponsible||'-'}\nColares: ${collarBreakdown(farm)}\nEquipamentos: ${equips.length}\nEvidências: ${reportEvidencias.length}\nPendências: ${pendingCount}`;
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
  return <div><PageHead eyebrow="Instalação guiada" title="Executar instalação em campo"><select value={farmId} onChange={e=>setFarmId(e.target.value)}><option value="">Selecione a fazenda...</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select></PageHead><div className="statsGrid"><Stat icon={Route} label="fazendas em aberto" value={pending.length}/><Stat icon={Cpu} label="equipamentos" value={data.equipamentos.length}/><Stat icon={ClipboardCheck} label="checklists salvos" value={data.checklists.length}/><Stat icon={CalendarDays} label="visitas" value={data.visitas.length}/></div>{!data.fazendas.length&&<Empty icon={Building2} title="Nenhuma fazenda cadastrada" text="Cadastre uma fazenda antes de iniciar uma instalação guiada."/>}{farm&&<section className="panel installFocus"><div><span className="eyebrow">Fazenda selecionada</span><h2>{farm.nome}</h2><p>{farm.cidade||'Cidade não informada'} • {centralOfficialName(farm.central)||'Central não informada'} • {farmStatus(farm)}</p></div><div className="installBadges"><span>{data.equipamentos.filter(e=>e.fazenda_id===farm.id).length} equipamento(s)</span><span>{data.visitas.filter(v=>v.fazenda_id===farm.id).length} visita(s)</span></div></section>}<section className="panel"><div className="sectionTitle"><div><h2><ClipboardList size={20}/> Checklist de instalação</h2></div><select value={templateId} onChange={e=>{setTemplateId(e.target.value);setChecked({})}}>{QUICK_CHECKLISTS.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></div><div className="manualSource">{template.source}</div><div className="progress"><span style={{width:`${template.items.length?Math.round(done/template.items.length*100):0}%`}}/></div><div className="checkPanel">{template.items.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(checked[i])} onChange={()=>setChecked({...checked,[i]:!checked[i]})}/><span>{item}</span></label>)}</div><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações rápidas da instalação"/><button className="btn primary" onClick={save} disabled={!farm}><Save size={17}/> Salvar checklist na fazenda</button></section><CoberturaAssist/><section className="panel"><div className="sectionTitle"><h2>Fazendas em andamento</h2></div><div className="list">{pending.slice(0,6).map(f=><div className="listItem" key={f.id}><Route size={19}/><div><b>{f.nome}</b><span>{f.cidade||'-'} • {farmStatus(f)} • {data.equipamentos.filter(e=>e.fazenda_id===f.id).length} equipamento(s)</span></div></div>)}</div>{!pending.length&&<Empty icon={CheckCircle2} title="Nada pendente" text="Não há fazendas em aberto pelos status atuais."/>}</section></div>
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

function GerencialUsuarios({data}){
  const [q,setQ]=useState(''),[central,setCentral]=useState('Todas'),[role,setRole]=useState('Todos'),[status,setStatus]=useState('Todos');
  const loadedRef=useRef(false);
  useEffect(()=>{
    if(data.isAppAdmin && !loadedRef.current){
      loadedRef.current=true;
      data.refreshAdminData?.();
    }
  },[data.isAppAdmin]);
  if(!data.isAppAdmin){
    return <div className="adminUsersPage">
      <PageHead eyebrow="Gerencial" title="Acesso administrativo"/>
      <section className="panel adminLockedPanel">
        <div className="adminLockedIcon"><ShieldCheck size={28}/></div>
        <div>
          <h2>Painel restrito</h2>
          <p>Somente administradores podem alterar central de acesso, bloquear usuários ou enviar recuperação de senha.</p>
        </div>
        {data.cloud&&data.empresaAcesso==='Urus'&&<button className="btn primary" onClick={data.promoteFirstAdmin}><ShieldCheck size={18}/> Ativar primeiro administrador</button>}
      </section>
    </div>
  }
  const users=(data.profiles||[]).filter(Boolean);
  const text=String(q||'').trim().toLowerCase();
  const filtered=users.filter(profile=>{
    const roleLabel=APP_ROLE_LABELS[normalizeAppRole(profile.app_role)]||'Usuário';
    const matchesText=!text||[profile.nome,profile.email,profile.empresa_acesso,roleLabel].join(' ').toLowerCase().includes(text);
    const matchesCentral=central==='Todas'||profile.empresa_acesso===central;
    const matchesRole=role==='Todos'||profile.app_role===role;
    const matchesStatus=status==='Todos'||(status==='Ativos'?profile.ativo!==false:profile.ativo===false);
    return matchesText&&matchesCentral&&matchesRole&&matchesStatus;
  });
  const stats={
    total:users.length,
    active:users.filter(profile=>profile.ativo!==false).length,
    admins:users.filter(isAppAdminProfile).length,
    urus:users.filter(profile=>profile.empresa_acesso==='Urus').length
  };
  const logs=(data.adminLogs||[]).slice(0,8);
  const profileById=Object.fromEntries(users.map(profile=>[profile.id,profile]));
  const resetFilters=()=>{setQ('');setCentral('Todas');setRole('Todos');setStatus('Todos')};
  return <div className="adminUsersPage">
    <PageHead eyebrow="Gerencial" title="Usuários e acessos">
      <button className="btn light" onClick={data.refreshAdminData}><RefreshCw size={18}/> Atualizar</button>
    </PageHead>
    <section className="adminHero">
      <div>
        <span className="eyebrow">Controle de acesso</span>
        <h2><ShieldCheck size={25}/> Administração do app</h2>
        <p>Gerencie central, perfil administrativo, bloqueio de acesso e recuperação de senha sem compartilhar senhas.</p>
      </div>
      <div className="adminHeroBadge"><b>{APP_ROLE_LABELS[normalizeAppRole(data.currentUser?.app_role)]||'Administrador'}</b><span>{centralOfficialName(data.currentUser?.empresa_acesso)}</span></div>
    </section>
    <div className="adminKpis">
      <article><UserCheck size={20}/><span>Usuários</span><b>{stats.total}</b><small>{stats.active} ativo(s)</small></article>
      <article><ShieldCheck size={20}/><span>Admins</span><b>{stats.admins}</b><small>painel gerencial</small></article>
      <article><Building2 size={20}/><span>URUS</span><b>{stats.urus}</b><small>duas centrais</small></article>
      <article><Database size={20}/><span>Diretório</span><b>{filtered.length}</b><small>no filtro atual</small></article>
    </div>
    <section className="panel adminFilters">
      <div className="adminSearch"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome, e-mail, central ou perfil"/></div>
      <select value={central} onChange={e=>setCentral(e.target.value)}><option>Todas</option>{EMPRESA_ACESSO.map(item=><option key={item} value={item}>{centralOfficialName(item)}</option>)}</select>
      <select value={role} onChange={e=>setRole(e.target.value)}><option>Todos</option>{APP_ROLES.map(item=><option key={item} value={item}>{APP_ROLE_LABELS[item]}</option>)}</select>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option><option>Ativos</option><option>Bloqueados</option></select>
      <button className="btn light" onClick={resetFilters}>Limpar</button>
    </section>
    <div className="adminGrid">
      <section className="panel adminUsersPanel">
        <div className="sectionTitle"><div><h2><UserCheck size={20}/> Diretório</h2></div><span className="pill">{filtered.length} usuário(s)</span></div>
        <div className="adminUserList">{filtered.map(profile=><AdminUserCard key={profile.id} profile={profile} currentUserId={data.userId} onSave={data.saveAdminProfile} onReset={data.resetAdminUserPassword}/>)}</div>
        {!filtered.length&&<Empty icon={UserCheck} title="Nenhum usuário encontrado" text="Ajuste os filtros ou peça para a pessoa criar uma conta primeiro."/>}
      </section>
      <section className="panel adminAuditPanel">
        <div className="sectionTitle"><div><h2><ClipboardList size={20}/> Auditoria</h2></div></div>
        {logs.length?<div className="adminAuditList">{logs.map(log=>{
          const actor=profileById[log.actor_id], target=profileById[log.target_user_id];
          return <article key={log.id}><span>{brDateTime(log.created_at)}</span><b>{String(log.acao||'acao').replaceAll('_',' ')}</b><small>{actor?.nome||actor?.email||'Sistema'} - {target?.nome||target?.email||'Usuário'}</small></article>
        })}</div>:<Empty icon={ClipboardList} title="Sem ações registradas" text="As alterações feitas pelo painel aparecerão aqui."/>}
      </section>
    </div>
  </div>
}

function AdminUserCard({profile,currentUserId,onSave,onReset}){
  const [draft,setDraft]=useState(profile),[saving,setSaving]=useState(false),[resetting,setResetting]=useState(false);
  useEffect(()=>setDraft(profile),[profile.id,profile.nome,profile.email,profile.empresa_acesso,profile.app_role,profile.ativo]);
  const self=profile.id===currentUserId;
  const roleLabel=APP_ROLE_LABELS[normalizeAppRole(draft.app_role)]||'Usuário';
  const dirty=['nome','empresa_acesso','app_role','ativo'].some(key=>(draft?.[key]??'')!==(profile?.[key]??''));
  const set=(key,value)=>setDraft(prev=>({...prev,[key]:value}));
  const save=async()=>{
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };
  const reset=async()=>{
    if(!confirm(`Enviar link de recuperação para ${profile.email}?`)) return;
    setResetting(true);
    await onReset(profile);
    setResetting(false);
  };
  return <article className={`adminUserCard ${draft.ativo===false?'blocked':''}`}>
    <div className="adminUserAvatar"><UserCheck size={21}/></div>
    <div className="adminUserMain">
      <input value={draft.nome||''} onChange={e=>set('nome',e.target.value)} placeholder="Nome do usuário"/>
      <span>{profile.email||'E-mail não informado'}{self&&<b>Você</b>}</span>
    </div>
    <div className="adminUserStatus">
      <span className={`centralPill ${centralTone(draft.empresa_acesso)}`}>{centralOfficialName(draft.empresa_acesso)}</span>
      <span className={`status ${draft.ativo===false?'warn':'ok'}`}>{draft.ativo===false?'Bloqueado':'Ativo'}</span>
      <span className="pill">{roleLabel}</span>
    </div>
    <div className="adminUserControls">
      <label><span>Central</span><select value={draft.empresa_acesso} onChange={e=>set('empresa_acesso',e.target.value)}>{EMPRESA_ACESSO.map(item=><option key={item} value={item}>{centralOfficialName(item)}</option>)}</select></label>
      <label><span>Perfil</span><select value={draft.app_role} onChange={e=>set('app_role',e.target.value)}>{APP_ROLES.map(item=><option key={item} value={item}>{APP_ROLE_LABELS[item]}</option>)}</select></label>
      <label className="adminToggle"><span>Status</span><button type="button" className={draft.ativo!==false?'active':''} disabled={self} onClick={()=>set('ativo',draft.ativo===false)}>{draft.ativo!==false?'Ativo':'Bloqueado'}</button></label>
    </div>
    <div className="adminUserActions">
      <button className="btn primary" disabled={!dirty||saving} onClick={save}><Save size={16}/> {saving?'Salvando...':'Salvar'}</button>
      <button className="btn light" disabled={resetting||!profile.email} onClick={reset}><Mail size={16}/> {resetting?'Enviando...':'Recuperar senha'}</button>
    </div>
  </article>
}

function Produtividade({data,onOpen,initialSection='visao'}){
  const today=new Date(),pad=n=>String(n).padStart(2,'0');
  const monthNames=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const [section,setSection]=useState(initialSection),[filtersOpen,setFiltersOpen]=useState(false),[chartMetric,setChartMetric]=useState('colares');
  const [period,setPeriod]=useState('todos'),[month,setMonth]=useState(String(today.getMonth()+1)),[year,setYear]=useState(String(today.getFullYear()));
  const [customStart,setCustomStart]=useState(`${today.getFullYear()}-${pad(today.getMonth()+1)}-01`),[customEnd,setCustomEnd]=useState(todayInput());
  const [central,setCentral]=useState('Todas'),[resp,setResp]=useState('Todos'),[farmFilter,setFarmFilter]=useState('Todas'),[status,setStatus]=useState('Todos');
  const [workStart,setWorkStart]=useState(DEFAULT_WORKDAY.start),[workEnd,setWorkEnd]=useState(DEFAULT_WORKDAY.end),[lunchMinutes,setLunchMinutes]=useState(DEFAULT_WORKDAY.lunchMinutes),[includeWeekends,setIncludeWeekends]=useState(false);
  const [selectedTech,setSelectedTech]=useState('Todos'),[periodLimit,setPeriodLimit]=useState(12),[reportType,setReportType]=useState('geral'),[reportDetail,setReportDetail]=useState('resumido');
  useEffect(()=>setSection(initialSection),[initialSection]);
  const visibleCentrais=allowedCentrais(data);
  useEffect(()=>{if(central!=='Todas'&&!visibleCentrais.includes(central))setCentral('Todas');},[central,visibleCentrais.join('|')]);
  const workConfig={start:workStart||DEFAULT_WORKDAY.start,end:workEnd||DEFAULT_WORKDAY.end,lunchMinutes:num(lunchMinutes),includeWeekends};
  const dailyHours=Math.max(workdayHours(workConfig),0.1);
  const parseDate=value=>{if(!value)return null;const parsed=new Date(value);return Number.isNaN(parsed.getTime())?null:parsed;};
  const startDay=date=>new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
  const endDay=date=>new Date(date.getFullYear(),date.getMonth(),date.getDate(),23,59,59,999);
  const range=(()=>{
    if(period==='todos')return {start:null,end:null,label:'Todo o histórico'};
    if(period==='ultimos_30'){const start=new Date(today);start.setDate(start.getDate()-29);return {start:startDay(start),end:endDay(today),label:'Últimos 30 dias'};}
    if(period==='personalizado'){const start=parseDate(`${customStart}T00:00:00`),end=parseDate(`${customEnd}T23:59:59`);return {start,end,label:`${brDate(customStart)} até ${brDate(customEnd)}`};}
    const selectedYear=num(year)||today.getFullYear(),selectedMonth=Math.max(1,num(month)||today.getMonth()+1);
    const start=new Date(selectedYear,selectedMonth-1,1),end=new Date(selectedYear,selectedMonth,0);
    return {start:startDay(start),end:endDay(end),label:start.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})};
  })();
  const inRange=value=>{if(!range.start&&!range.end)return true;const date=parseDate(value);return Boolean(date&&(!range.start||date>=range.start)&&(!range.end||date<=range.end));};
  const farmById=Object.fromEntries(data.fazendas.map(f=>[f.id,f]));
  const visitSessions=data.visitas.map(visit=>{
    const farm=farmById[visit.fazenda_id];
    if(!farm||!visit.iniciada_em||!visit.finalizada_em)return null;
    return {...farm,session_id:visit.id,session_tipo:visit.tipo||'Visita',session_status:visit.status,servico_inicio_em:visit.iniciada_em,servico_fim_em:visit.finalizada_em,servico_responsavel:visit.responsavel_tecnico||farm.servico_responsavel||personName(data.currentUser)||farm.regional_nome||farm.responsavel||'',_sessionFromVisit:true};
  }).filter(Boolean).filter(session=>serviceHours(session)>0);
  const sessionFarmIds=new Set(visitSessions.map(session=>session.id));
  const fallbackSessions=data.fazendas.filter(farm=>farm.servico_inicio_em&&farm.servico_fim_em&&serviceHours(farm)>0&&!sessionFarmIds.has(farm.id)).map(farm=>({...farm,session_id:`farm-${farm.id}`,session_tipo:'Serviço'}));
  const concluded=[...visitSessions,...fallbackSessions];
  const ownerFor=item=>item.servico_responsavel||item.regional_nome||item.responsavel||'Não informado';
  const workedHoursFor=item=>businessHoursBetween(item.servico_inicio_em,item.servico_fim_em,workConfig);
  const activeHoursFor=item=>businessHoursBetween(item.servico_inicio_em,null,workConfig);
  const collarsFor=item=>num(item.qtd_colares_instalada||item.qtd_colares_prevista);
  const years=[...new Set([today.getFullYear(),...concluded.map(item=>parseDate(item.servico_fim_em)?.getFullYear()).filter(Boolean)])].sort((a,b)=>b-a);
  const responsaveis=[...new Set(concluded.map(ownerFor).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const centralMatch=farm=>central==='Todas'||(farm.central||'')===central||(!farm.central&&central.startsWith('Outra'));
  const statusMatch=farm=>status==='Todos'||farmStatus(farm)===status;
  const technicianFarmIds=resp==='Todos'?null:new Set(concluded.filter(item=>ownerFor(item)===resp).map(item=>item.id));
  const baseFarmMatch=farm=>centralMatch(farm)&&statusMatch(farm)&&(farmFilter==='Todas'||farm.id===farmFilter)&&(!technicianFarmIds||technicianFarmIds.has(farm.id));
  const scopedFarms=data.fazendas.filter(baseFarmMatch),scopedFarmIds=new Set(scopedFarms.map(farm=>farm.id));
  const sessions=concluded.filter(item=>scopedFarmIds.has(item.id)&&(resp==='Todos'||ownerFor(item)===resp)&&inRange(item.servico_fim_em||item.servico_inicio_em)).filter(item=>workedHoursFor(item)>0).sort((a,b)=>new Date(b.servico_fim_em)-new Date(a.servico_fim_em));
  const inProgress=scopedFarms.filter(farm=>farm.servico_inicio_em&&!farm.servico_fim_em&&(resp==='Todos'||ownerFor(farm)===resp)&&inRange(farm.servico_inicio_em));
  const totalHours=sessions.reduce((sum,item)=>sum+workedHoursFor(item),0),totalElapsedHours=sessions.reduce((sum,item)=>sum+serviceHours(item),0);
  const uniqueServiceFarms=[...new Map(sessions.map(item=>[item.id,item])).values()];
  const totalCollars=uniqueServiceFarms.reduce((sum,item)=>sum+collarsFor(item),0),productiveDays=totalHours/dailyHours,avgHours=sessions.length?totalHours/sessions.length:0;
  const collarsPerDay=productiveDays?totalCollars/productiveDays:0,avgLabel=avgHours?`${avgHours.toFixed(1)} h úteis`:'-';
  const monthlyCollars=monthNames.map((label,index)=>({label,value:[...new Map(sessions.filter(item=>parseDate(item.servico_fim_em)?.getMonth()===index).map(item=>[item.id,item])).values()].reduce((sum,item)=>sum+collarsFor(item),0)}));
  const monthlyHours=monthNames.map((label,index)=>({label,value:sessions.filter(item=>parseDate(item.servico_fim_em)?.getMonth()===index).reduce((sum,item)=>sum+workedHoursFor(item),0)}));
  const chartRows=chartMetric==='horas'?monthlyHours:monthlyCollars,secondaryRows=chartMetric==='horas'?monthlyCollars:monthlyHours;
  const ownerRows=Object.values(sessions.reduce((acc,item)=>{
    const owner=ownerFor(item),hours=workedHoursFor(item),collars=collarsFor(item);
    acc[owner]||={owner,periods:0,collars:0,hours:0,farmIds:new Set()};
    acc[owner].periods+=1;acc[owner].hours+=hours;
    if(!acc[owner].farmIds.has(item.id)){acc[owner].farmIds.add(item.id);acc[owner].collars+=collars;}
    return acc;
  },{})).map(row=>({...row,farms:row.farmIds.size,rate:row.hours?row.collars/(row.hours/dailyHours):0})).sort((a,b)=>a.owner.localeCompare(b.owner));
  useEffect(()=>{if(selectedTech!=='Todos'&&!ownerRows.some(row=>row.owner===selectedTech))setSelectedTech('Todos');},[selectedTech,ownerRows.map(row=>row.owner).join('|')]);
  const activeTechnician=resp!=='Todos'?resp:selectedTech;
  const technicianPeriods=activeTechnician==='Todos'?sessions:sessions.filter(item=>ownerFor(item)===activeTechnician);
  const farmOptions=data.fazendas.filter(centralMatch).sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||'')));
  const visitsInPeriod=data.visitas.filter(visit=>scopedFarmIds.has(visit.fazenda_id)&&inRange(visit.data_visita||visit.created_at));
  const visitFarmIds=new Set(visitsInPeriod.map(visit=>visit.fazenda_id)),serviceFarmIds=new Set(sessions.map(item=>item.id));
  const serviceFarms=scopedFarms.filter(farm=>serviceFarmIds.has(farm.id)),activeFarms=scopedFarms.filter(farm=>serviceFarmIds.has(farm.id)||visitFarmIds.has(farm.id));
  const equips=data.equipamentos.filter(item=>scopedFarmIds.has(item.fazenda_id)),checks=data.checklists.filter(item=>scopedFarmIds.has(item.fazenda_id)&&inRange(item.created_at)),evidencias=(data.evidencias||[]).filter(item=>scopedFarmIds.has(item.fazenda_id)&&inRange(item.created_at));
  const completed=scopedFarms.filter(farm=>farmStatus(farm)===FARM_STATUS_DONE||farm.servico_fim_em),notStarted=scopedFarms.filter(farm=>farmStatus(farm)==='Não iniciada'&&!farm.servico_inicio_em&&!farm.servico_fim_em);
  const installed=scopedFarms.reduce((sum,farm)=>sum+collarInstalled(farm),0),delivered=scopedFarms.reduce((sum,farm)=>sum+collarDelivered(farm),0),handled=scopedFarms.reduce((sum,farm)=>sum+collarHandled(farm),0),planned=scopedFarms.reduce((sum,farm)=>sum+num(farm.qtd_colares_prevista),0);
  const installedInPeriod=serviceFarms.reduce((sum,farm)=>sum+collarInstalled(farm),0),progress=planned?Math.round((handled/planned)*100):0;
  const statusRows=FARM_STATUS.map(label=>({label,count:scopedFarms.filter(farm=>farmStatus(farm)===label).length})).filter(row=>row.count);
  const centralRows=visibleCentrais.map(item=>{const list=scopedFarms.filter(farm=>item==='Outra / Não informado'?(!farm.central||!CENTRAIS.slice(0,2).includes(farm.central)):farm.central===item);return {label:centralOfficialName(item)||item,count:list.length,done:list.filter(farm=>farmStatus(farm)===FARM_STATUS_DONE||farm.servico_fim_em).length,collars:list.reduce((sum,farm)=>sum+collarInstalled(farm),0),handled:list.reduce((sum,farm)=>sum+collarHandled(farm),0)}}).filter(row=>row.count||central==='Todas');
  const groupByMonth=(!range.start&&!range.end)||((range.end-range.start)/86400000)>45,installGroups={};
  sessions.forEach(item=>{const date=parseDate(item.servico_fim_em||item.servico_inicio_em);if(!date)return;const key=groupByMonth?`${pad(date.getMonth()+1)}/${String(date.getFullYear()).slice(2)}`:date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});installGroups[key]=(installGroups[key]||0)+1;});
  const installRows=Object.entries(installGroups).map(([label,value])=>({label,value})).slice(-12);
  const reportTypes={geral:'Relatório geral',mensal:'Serviços mensais',produtividade:'Produtividade de campo',central:'Resumo por central'};
  const customWorkday=workStart!==DEFAULT_WORKDAY.start||workEnd!==DEFAULT_WORKDAY.end||num(lunchMinutes)!==num(DEFAULT_WORKDAY.lunchMinutes)||includeWeekends;
  const activeFilterLabels=[range.label,central!=='Todas'?centralOfficialName(central):null,resp!=='Todos'?resp:null,farmFilter!=='Todas'?farmById[farmFilter]?.nome:null,status!=='Todos'?status:null,customWorkday?`Jornada ${workConfig.start}-${workConfig.end}`:null].filter(Boolean);
  const activeFilterCount=[period!=='todos',central!=='Todas',resp!=='Todos',farmFilter!=='Todas',status!=='Todos',customWorkday].filter(Boolean).length;
  const activeFilters=activeFilterCount>0;
  const resetFilters=()=>{setPeriod('todos');setMonth(String(today.getMonth()+1));setYear(String(today.getFullYear()));setCustomStart(`${today.getFullYear()}-${pad(today.getMonth()+1)}-01`);setCustomEnd(todayInput());setCentral('Todas');setResp('Todos');setFarmFilter('Todas');setStatus('Todos');setWorkStart(DEFAULT_WORKDAY.start);setWorkEnd(DEFAULT_WORKDAY.end);setLunchMinutes(DEFAULT_WORKDAY.lunchMinutes);setIncludeWeekends(false);};
  const exportProductivity=()=>{const journey=`${workConfig.start}-${workConfig.end}; almoço ${workConfig.lunchMinutes} min; ${workConfig.includeWeekends?'inclui finais de semana':'dias úteis'}`;const rows=[['Fazenda','Tipo de período','Central','Cidade','Responsável produtividade','Início','Fim','Horas úteis','Dias úteis equivalentes','Tempo corrido horas','Colares instalados','Colares previstos','Colares por dia útil','Jornada considerada'],...sessions.map(item=>{const useful=workedHoursFor(item),collars=collarsFor(item);return [item.nome,item.session_tipo||'Serviço',centralOfficialName(item.central),item.cidade,ownerFor(item),brDateTime(item.servico_inicio_em),brDateTime(item.servico_fim_em),useful.toFixed(2),(useful/dailyHours).toFixed(2),serviceHours(item).toFixed(2),num(item.qtd_colares_instalada),num(item.qtd_colares_prevista),useful?(collars/(useful/dailyHours)).toFixed(2):'0',journey]})];download('produtividade-fazendas.tsv',rows.map(row=>row.join(String.fromCharCode(9))).join(String.fromCharCode(10)));notify('Planilha de produtividade exportada.');};
  const exportReport=()=>{const rows=[['Relatório',reportTypes[reportType]],['Versão',reportDetail],['Período',range.label],['Central',central==='Todas'?'Todas':centralOfficialName(central)],['Técnico',resp],['Fazenda',farmFilter==='Todas'?'Todas':farmById[farmFilter]?.nome],['Status',status],[],['Indicador','Valor'],['Fazendas cadastradas no filtro',scopedFarms.length],['Fazendas não iniciadas',notStarted.length],['Fazendas com movimento no período',activeFarms.length],['Períodos de serviço',sessions.length],['Concluídas total',completed.length],['Colares instalados total',installed],['Colares entregues total',delivered],['Colares atendidos total',handled],['Colares instalados no período',installedInPeriod],['Colares previstos total',planned],['Visitas no período',visitsInPeriod.length],['Horas úteis no período',totalHours.toFixed(2)],[],['Fazenda','Central','Cidade','Status','Primeiro início','Último fim','Períodos','Tempo total','Colares instalados','Colares entregues','Colares atendidos','Colares previstos','Equipamentos','Visitas no período'],...scopedFarms.map(farm=>{const farmEquips=equips.filter(item=>item.fazenda_id===farm.id),farmVisits=visitsInPeriod.filter(visit=>visit.fazenda_id===farm.id),farmSessions=farmServiceSessions(farm,data.visitas);return [farm.nome,centralOfficialName(farm.central),farm.cidade,farmStatus(farm),brDateTime(firstServiceStart(farmSessions)),brDateTime(lastServiceEnd(farmSessions)),farmSessions.length,serviceTotalLabel(farm,data.visitas),collarInstalled(farm),collarDelivered(farm),collarHandled(farm),farm.qtd_colares_prevista,farmEquips.length,farmVisits.length]})];download('relatorio-gerencial.tsv',rows.map(row=>row.join(String.fromCharCode(9))).join(String.fromCharCode(10)));notify('Relatório gerencial exportado.');};
  const printReport=()=>{
    const safe=value=>String(value===undefined||value===null||String(value).trim()===''?'-':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const brand=reportBrandForCentral(central==='Todas'?data.empresaAcesso:central),logo=brand.logo||appLogo;
    const serviceRows=sessions.slice(0,40).map(item=>`<tr><td><b>${safe(item.nome)}</b><small>${safe(item.cidade||'Cidade não informada')}</small></td><td>${safe(centralOfficialName(item.central))}</td><td>${safe(ownerFor(item))}</td><td>${safe(brDate(item.servico_inicio_em))}</td><td>${safe(workDurationLabel(workedHoursFor(item),workConfig))}</td></tr>`).join('');
    const centralTable=centralRows.map(row=>`<tr><td>${safe(row.label)}</td><td>${row.count}</td><td>${row.done}</td><td>${row.collars}</td><td>${row.handled}</td></tr>`).join('');
    const technicianTable=ownerRows.map(row=>`<tr><td>${safe(row.owner)}</td><td>${row.farms}</td><td>${row.periods}</td><td>${row.collars}</td><td>${row.hours.toFixed(1)} h</td></tr>`).join('');
    const showInstall=reportType==='geral'||reportType==='mensal',showProd=reportType==='geral'||reportType==='produtividade',showCentral=reportType==='geral'||reportType==='central';
    const detailed=reportDetail==='detalhado';
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${safe(reportTypes[reportType])}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:0;font-size:11px;line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid ${brand.primary};padding-bottom:10px}.brand{display:flex;align-items:center;gap:10px}.brand img{width:68px;height:38px;object-fit:contain}.brand b{font-size:17px}.brand span{display:block;color:${brand.primary};font-weight:900}.meta{text-align:right;color:#64748b}.cover{margin:12px 0;padding:16px;border-radius:16px;background:${brand.cover};color:#fff}.cover small{font-weight:900;letter-spacing:.12em}.cover h1{margin:6px 0 4px;font-size:25px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:10px 0}.metric{border:1px solid ${brand.border};background:${brand.soft};border-radius:10px;padding:8px;text-align:center}.metric b{display:block;color:${brand.primary};font-size:19px}h2{font-size:14px;margin:15px 0 7px;border-bottom:1px solid #dbe4ef;padding-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:7px}th{background:${brand.primary};color:#fff;text-align:left;font-size:9.5px}th,td{border:1px solid #dbe4ef;padding:6px;vertical-align:top}td small{display:block;color:#64748b;margin-top:2px}.section{break-inside:auto}.executive{padding:10px;border:1px solid ${brand.border};background:${brand.soft};border-radius:12px}.footer{margin-top:16px;border-top:1px solid #dbe4ef;padding-top:6px;color:#64748b;display:flex;justify-content:space-between}</style></head><body><header class="top"><div class="brand"><img src="${safe(logo)}" alt=""><div><b>${safe(brand.name)}</b><span>ControlTech Assist</span></div></div><div class="meta"><b>RELATÓRIO GERENCIAL</b><br>${safe(new Date().toLocaleString('pt-BR'))}<br>${safe(range.label)}</div></header><section class="cover"><small>${safe(central==='Todas'?brand.name:centralOfficialName(central))}</small><h1>${safe(reportTypes[reportType])}</h1><p>${safe(reportDetail==='detalhado'?'Versão detalhada':'Versão resumida')} • ${scopedFarms.length} fazenda(s) • ${sessions.length} período(s) de serviço</p></section><section class="executive"><b>Resumo executivo</b><p>No recorte selecionado foram registrados ${sessions.length} período(s) de serviço em ${serviceFarms.length} fazenda(s), totalizando ${totalHours.toFixed(1)} horas úteis e ${totalCollars} colares vinculados à produtividade. O filtro gerencial contém ${handled} colares atendidos de ${planned} previstos.</p></section><section class="metrics"><div class="metric"><b>${scopedFarms.length}</b>Fazendas</div><div class="metric"><b>${sessions.length}</b>Períodos</div><div class="metric"><b>${totalHours.toFixed(1)} h</b>Horas úteis</div><div class="metric"><b>${handled}</b>Atendidos</div><div class="metric"><b>${visitsInPeriod.length}</b>Visitas</div></section>${detailed&&showInstall?`<section class="section"><h2>Serviços realizados</h2><table><thead><tr><th>Fazenda</th><th>Central</th><th>Técnico</th><th>Data</th><th>Horas úteis</th></tr></thead><tbody>${serviceRows||'<tr><td colspan="5">Sem serviços no período.</td></tr>'}</tbody></table></section>`:''}${showCentral?`<section class="section"><h2>Distribuição por central</h2><table><thead><tr><th>Central</th><th>Fazendas</th><th>Concluídas</th><th>Instalados</th><th>Atendidos</th></tr></thead><tbody>${centralTable||'<tr><td colspan="5">Sem dados.</td></tr>'}</tbody></table></section>`:''}${showProd?`<section class="section"><h2>Resultados por técnico</h2><table><thead><tr><th>Técnico</th><th>Fazendas</th><th>Períodos</th><th>Colares</th><th>Horas úteis</th></tr></thead><tbody>${technicianTable||'<tr><td colspan="5">Sem serviços finalizados.</td></tr>'}</tbody></table></section>`:''}<footer class="footer"><span>ControlTech Assist • ${safe(brand.name)}</span><span>${safe(range.label)}</span></footer><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
    const win=window.open('','_blank');if(!win){notify('Permita pop-ups para gerar o relatório.','error');return;}win.document.write(html);win.document.close();
  };
  const tabs=[['visao',Gauge,'Visão geral'],['tecnicos',UserCheck,'Técnicos'],['relatorios',FileText,'Relatórios']];
  return <div className="productivityPage productivityUnified">
    <PageHead eyebrow="Operação" title="Produtividade">
      <button className={`btn light prodFilterBtn ${activeFilters?'active':''}`} onClick={()=>setFiltersOpen(true)}><Filter size={18}/> Filtros {activeFilters&&<span>{activeFilterCount}</span>}</button>
    </PageHead>
    <div className="prodSectionTabs" role="tablist" aria-label="Áreas de produtividade">{tabs.map(([id,Icon,label])=><button key={id} role="tab" aria-selected={section===id} className={section===id?'active':''} onClick={()=>setSection(id)}><Icon size={18}/><span>{label}</span></button>)}</div>
    <div className="prodFilterSummary"><span><Filter size={14}/> Recorte atual</span>{activeFilterLabels.map(label=><b key={label}>{label}</b>)}{!activeFilters&&<small>Sem filtros adicionais</small>}</div>

    {section==='visao'&&<>
      <section className="prodHeroPanel">
        <div className="prodHeroCopy"><span className="eyebrow">Leitura operacional</span><h2>{collarsPerDay?`${collarsPerDay.toFixed(1)} colares/dia útil`:'Sem serviços finalizados'}</h2><p>{range.label} • mesma base de períodos usada nos relatórios</p></div>
        <div className="prodHeroStats"><article><Building2 size={21}/><span>Períodos</span><b>{sessions.length}</b></article><article><Milk size={21}/><span>Colares</span><b>{totalCollars}</b></article><article><Clock size={21}/><span>Horas úteis</span><b>{totalHours?`${totalHours.toFixed(1)} h`:'-'}</b></article><article><PlayCircle size={21}/><span>Em andamento</span><b>{inProgress.length}</b></article></div>
      </section>
      <section className="panel prodChartPanel prodChartWide">
        <div className="sectionTitle"><div><span className="eyebrow">Desempenho</span><h2><BarChart3 size={20}/> Evolução mensal</h2></div><span className="pill">{productiveDays?`${productiveDays.toFixed(1)} dias úteis`:avgLabel}</span></div>
        <div className="prodMetricSwitch" role="group" aria-label="Métrica do gráfico"><button className={chartMetric==='colares'?'active':''} onClick={()=>setChartMetric('colares')}><Milk size={16}/> Colares</button><button className={chartMetric==='horas'?'active':''} onClick={()=>setChartMetric('horas')}><Clock size={16}/> Horas</button></div>
        <ProductivityLineChart rows={chartRows} suffix={chartMetric==='horas'?' h':''} decimals={chartMetric==='horas'?1:0}/>
        <div className="prodOverviewStrip"><div><span>Média por período</span><b>{avgLabel}</b></div><div><span>Tempo corrido</span><b>{totalElapsedHours?`${totalElapsedHours.toFixed(1)} h`:'-'}</b></div><div><span>Fazendas atendidas</span><b>{uniqueServiceFarms.length}</b></div></div>
        <div className="prodMiniBars"><span>{chartMetric==='horas'?'Colares por mês':'Horas úteis por mês'}</span><ProductivityBars rows={secondaryRows} suffix={chartMetric==='horas'?'':' h'} decimals={chartMetric==='horas'?0:1}/></div>
      </section>
      {inProgress.length>0&&<section className="panel prodOpenPanel"><div className="sectionTitle"><div><h2><PlayCircle size={20}/> Serviços em andamento</h2></div><span className="pill">{inProgress.length}</span></div><div className="serviceOpenList">{inProgress.map(farm=><button key={farm.id} onClick={()=>onOpen(farm.id)}><Clock size={18}/><span><b>{farm.nome}</b><small>{brDateTime(farm.servico_inicio_em)} • {workDurationLabel(activeHoursFor(farm),workConfig)}</small></span></button>)}</div></section>}
    </>}

    {section==='tecnicos'&&<>
      <section className="panel prodTechnicianPanel"><div className="sectionTitle"><div><span className="eyebrow">Equipe de campo</span><h2><UserCheck size={20}/> Técnicos e responsáveis</h2></div><span className="pill">{ownerRows.length} no recorte</span></div>
        {ownerRows.length?<div className="prodTechnicianGrid">{ownerRows.map(row=><button key={row.owner} className={activeTechnician===row.owner?'active':''} onClick={()=>setSelectedTech(activeTechnician===row.owner?'Todos':row.owner)}><span className="prodTechAvatar"><UserCheck size={20}/></span><span className="prodTechIdentity"><b>{row.owner}</b><small>{row.farms} fazenda(s) • {row.periods} período(s)</small></span><span><small>Colares</small><b>{row.collars}</b></span><span><small>Horas úteis</small><b>{row.hours.toFixed(1)} h</b></span><span><small>Produtividade</small><b>{row.rate?`${row.rate.toFixed(1)}/dia`:'-'}</b></span></button>)}</div>:<Empty icon={UserCheck} title="Sem técnicos no recorte" text="Finalize um período de serviço para gerar os indicadores individuais."/>}
      </section>
      <section className="panel prodFarmPanel"><div className="sectionTitle"><div><span className="eyebrow">Histórico operacional</span><h2><ClipboardList size={20}/> Períodos de serviço</h2></div><span className="pill">{activeTechnician==='Todos'?'Todos os técnicos':activeTechnician}</span></div>
        {technicianPeriods.length?<div className="prodFarmRows">{technicianPeriods.slice(0,periodLimit).map(item=>{const useful=workedHoursFor(item),days=useful/dailyHours,rate=days?collarsFor(item)/days:0;return <button className="prodFarmRow" key={item.session_id||item.id} onClick={()=>onOpen(item.id)}><span className="prodFarmIdentity"><b>{item.nome}</b><small><MapPin size={13}/>{item.cidade||'sem cidade'} • {centralOfficialName(item.central)||'sem central'} • {item.session_tipo||'Serviço'}</small></span><span className="prodFarmMetric"><small>Técnico</small><b>{ownerFor(item)}</b></span><span className="prodFarmMetric"><small>Período</small><b>{brDate(item.servico_inicio_em)} • {workDurationLabel(useful,workConfig)}</b></span><span className="prodFarmMetric"><small>Colares/dia</small><b>{rate?rate.toFixed(1):'-'}</b></span><span className="prodFarmOpen">Abrir</span></button>})}</div>:<Empty icon={Clock} title="Sem períodos neste recorte" text="Altere os filtros ou selecione outro técnico."/>}
        {technicianPeriods.length>periodLimit&&<button className="btn light prodLoadMore" onClick={()=>setPeriodLimit(limit=>limit+12)}>Mostrar mais períodos</button>}
      </section>
    </>}

    {section==='relatorios'&&<div className="managerReports prodReportsView">
      <section className="prodReportComposer"><div><span className="eyebrow">Documento gerencial</span><h2><FileText size={22}/> Gerar relatório</h2><p>As opções abaixo usam o mesmo recorte dos indicadores e respeitam as centrais autorizadas.</p></div><div className="prodReportControls"><Field label="Conteúdo"><select value={reportType} onChange={event=>setReportType(event.target.value)}>{Object.entries(reportTypes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></Field><div className="prodReportDetail" role="group" aria-label="Nível de detalhe"><button className={reportDetail==='resumido'?'active':''} onClick={()=>setReportDetail('resumido')}>Resumido</button><button className={reportDetail==='detalhado'?'active':''} onClick={()=>setReportDetail('detalhado')}>Detalhado</button></div><button className="btn light" onClick={exportReport}><Download size={17}/> Exportar planilha</button><button className="btn primary" onClick={printReport}><Printer size={17}/> Gerar relatório</button></div></section>
      <section className="managerHero"><div><span className="eyebrow">Resumo executivo</span><h2><FileText size={24}/> {reportTypes[reportType]}</h2><p>{activeFilterLabels.join(' • ')}</p></div><div className="managerHeroScore"><b>{progress}%</b><span>progresso total</span></div></section>
      <div className="managerKpis compact"><article><Building2 size={22}/><span>Fazendas no filtro</span><b>{scopedFarms.length}</b><small>{notStarted.length} não iniciada(s) • {completed.length} concluída(s)</small></article><article><Milk size={22}/><span>Colares atendidos</span><b>{handled}</b><small>{installed} instalados • {delivered} entregues</small></article><article><CalendarDays size={22}/><span>Movimento no período</span><b>{activeFarms.length}</b><small>{sessions.length} período(s) • {visitsInPeriod.length} visita(s)</small></article><article><Clock size={22}/><span>Horas úteis</span><b>{totalHours?`${totalHours.toFixed(1)} h`:'-'}</b><small>mesma base da visão geral</small></article></div>
      <div className="managerGrid">
        <section className="panel managerMainPanel"><div className="sectionTitle"><div><h2><BarChart3 size={20}/> Serviços realizados</h2></div><span className="pill">{range.label}</span></div>{installRows.length?<ProductivityBars rows={installRows}/>:<Empty icon={BarChart3} title="Sem serviços finalizados" text="Nenhum período de serviço dentro do recorte selecionado."/>}<div className="managerSummaryStrip"><div><span>Períodos</span><b>{sessions.length}</b></div><div><span>Fazendas atendidas</span><b>{serviceFarms.length}</b></div><div><span>Evidências</span><b>{evidencias.length}</b></div></div></section>
        <section className="panel managerSidePanel"><div className="sectionTitle"><div><h2><Building2 size={20}/> Situação das fazendas</h2></div></div>{statusRows.length?<div className="centralBreakdown compact">{statusRows.map(row=><div key={row.label}><span>{row.label}</span><b>{row.count}</b><small>{scopedFarms.length?Math.round((row.count/scopedFarms.length)*100):0}% do filtro</small></div>)}</div>:<Empty icon={Building2} title="Sem fazendas no filtro" text="Altere os filtros compartilhados."/>}</section>
        <section className="panel managerMainPanel"><div className="sectionTitle"><div><h2><ShieldCheck size={20}/> Distribuição por central</h2></div><span className="pill">{centralRows.length}</span></div><div className="prodCentralGrid">{centralRows.map(row=><article key={row.label}><BrandLogoMark brand={row.label}/><div><span>{row.label}</span><b>{row.count} fazenda(s)</b><small>{row.done} concluída(s) • {row.collars} instalados • {row.handled} atendidos</small></div></article>)}</div></section>
        <section className="panel managerSidePanel"><div className="sectionTitle"><div><h2><UserCheck size={20}/> Técnicos no relatório</h2></div><span className="pill">{ownerRows.length}</span></div><div className="centralBreakdown compact">{ownerRows.slice(0,6).map(row=><div key={row.owner}><span>{row.owner}</span><b>{row.periods}</b><small>{row.farms} fazenda(s) • {row.collars} colares • {row.hours.toFixed(1)} h</small></div>)}</div></section>
      </div>
      <details className="managerFarmDisclosure"><summary><span><ClipboardList size={18}/> Fazendas incluídas no filtro</span><b>{scopedFarms.length}</b></summary><div className="managerFarmRows">{scopedFarms.map(farm=>{const farmEquips=equips.filter(item=>item.fazenda_id===farm.id),farmVisits=visitsInPeriod.filter(visit=>visit.fazenda_id===farm.id);return <button type="button" key={farm.id} onClick={()=>onOpen(farm.id)}><div><b>{farm.nome}</b><span>{farm.cidade||'Cidade não informada'} • {centralOfficialName(farm.central)||'Central não informada'}</span></div><div><strong>{farmStatus(farm)}</strong><small>{collarBreakdown(farm)} • {farmEquips.length} equip. • {farmVisits.length} visita(s)</small></div></button>})}</div></details>
      <div className="prodReportFootnote"><Info size={16}/><span>Colares atendidos representam o total atual das fazendas no filtro. Horas e períodos consideram somente os serviços dentro do período selecionado.</span></div>
    </div>}

    {filtersOpen&&<div className="prodFilterBackdrop" onClick={()=>setFiltersOpen(false)}><aside className="prodFilterSheet" onClick={event=>event.stopPropagation()}><header><div><span className="eyebrow">Filtro compartilhado</span><h2>Refinar produtividade</h2></div><button className="iconBtn" onClick={()=>setFiltersOpen(false)} aria-label="Fechar filtros"><X size={18}/></button></header><div className="prodFilterGrid"><Field label="Período"><select value={period} onChange={event=>setPeriod(event.target.value)}><option value="todos">Todo o histórico</option><option value="mes">Mês e ano</option><option value="ultimos_30">Últimos 30 dias</option><option value="personalizado">Personalizado</option></select></Field>{period==='mes'&&<><Field label="Mês"><select value={month} onChange={event=>setMonth(event.target.value)}>{monthNames.map((label,index)=><option key={label} value={index+1}>{label}</option>)}</select></Field><Field label="Ano"><select value={year} onChange={event=>setYear(event.target.value)}>{years.map(item=><option key={item}>{item}</option>)}</select></Field></>}{period==='personalizado'&&<><Field label="Início"><input type="date" value={customStart} onChange={event=>setCustomStart(event.target.value)}/></Field><Field label="Fim"><input type="date" value={customEnd} onChange={event=>setCustomEnd(event.target.value)}/></Field></>}<Field label="Central"><select value={central} onChange={event=>{setCentral(event.target.value);setFarmFilter('Todas')}}><option>Todas</option>{visibleCentrais.map(item=><option key={item} value={item}>{centralOfficialName(item)}</option>)}</select></Field><Field label="Técnico / responsável"><select value={resp} onChange={event=>setResp(event.target.value)}><option>Todos</option>{responsaveis.map(item=><option key={item}>{item}</option>)}</select></Field><Field label="Fazenda"><select value={farmFilter} onChange={event=>setFarmFilter(event.target.value)}><option value="Todas">Todas</option>{farmOptions.map(farm=><option key={farm.id} value={farm.id}>{farm.nome}</option>)}</select></Field><Field label="Situação"><select value={status} onChange={event=>setStatus(event.target.value)}><option>Todos</option>{FARM_STATUS.map(item=><option key={item}>{item}</option>)}</select></Field></div><div className="prodWorkdayBox"><div><span className="eyebrow">Jornada considerada</span><b>{workConfig.start} - {workConfig.end} • {dailyHours.toFixed(1)} h/dia</b></div><div className="prodFilterGrid compact"><Field label="Início"><input type="time" value={workStart} onChange={event=>setWorkStart(event.target.value)}/></Field><Field label="Fim"><input type="time" value={workEnd} onChange={event=>setWorkEnd(event.target.value)}/></Field><Field label="Almoço (min)"><input type="number" min="0" max="240" step="15" value={lunchMinutes} onChange={event=>setLunchMinutes(event.target.value)}/></Field></div><label className="workdayToggle"><input type="checkbox" checked={includeWeekends} onChange={event=>setIncludeWeekends(event.target.checked)}/><span>Incluir fins de semana</span></label></div><footer><button className="btn light" onClick={resetFilters}>Limpar filtros</button><button className="btn primary" onClick={()=>setFiltersOpen(false)}>Aplicar</button></footer></aside></div>}
  </div>
}
function Field({label,icon:Icon,children}){return <label className="field"><span>{Icon&&<Icon size={15}/>} {label}</span>{children}</label>}
function Modal({title,onClose,children,className=''}){return <div className="modalBackdrop"><div className={`modal ${className}`}><header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Fechar"><X size={20}/></button></header>{children}</div></div>}
function download(filename, text){const blob=new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);}

function SuporteTecnico({data}){
  const [tab,setTab]=useState('resolver'),[q,setQ]=useState(''),[symptomId,setSymptomId]=useState(SYMPTOMS[0]?.id||''),[guideId,setGuideId]=useState(INSTALL_GUIDES[0]?.id||''),[actionId,setActionId]=useState(VP8002_FIELD_ACTIONS[0]?.id||''),[farm,setFarm]=useState(''),[obs,setObs]=useState(''),[checked,setChecked]=useState({});
  const [mobilePanel,setMobilePanel]=useState(null);
  const [selectedLedId,setSelectedLedId]=useState('power');
  const [observedLedStates,setObservedLedStates]=useState(()=>defaultVp8002LedStates());
  const ledInspectorRef = useRef(null);
  const query=q.trim().toLowerCase();
  const matches=(...parts)=>!query||parts.flat().join(' ').toLowerCase().includes(query);
  const symptomResults=SYMPTOMS.filter(s=>matches(s.title,s.category,s.cause,s.action,s.checks));
  const guideResults=INSTALL_GUIDES.filter(g=>matches(g.title,g.desc,g.source,g.phases.flatMap(p=>[p.title,...p.items])));
  const actionResults=VP8002_FIELD_ACTIONS.filter(action=>matches(action.title,action.code,action.category,action.summary,action.expected,action.steps));
  const selectedSymptom=symptomResults.find(s=>s.id===symptomId)||symptomResults[0];
  const selectedGuide=guideResults.find(g=>g.id===guideId)||guideResults[0];
  const selectedAction=actionResults.find(action=>action.id===actionId)||actionResults[0]||VP8002_FIELD_ACTIONS[0];
  const selectedLedMarker=VP8002_LED_MARKERS.find(marker=>marker.id===selectedLedId)||VP8002_LED_MARKERS[0];
  const selectedLedNormal=VP8002_LED_NORMALS[selectedLedMarker.id]||{};
  const selectedLedObserved=observedLedStates[selectedLedMarker.id]||selectedLedNormal;
  const selectedLedDiagnostic=ledDiagnosticForRich(selectedLedMarker.id, selectedLedObserved);
  const selectedLedCanCodes=canCodesForLed(selectedLedMarker.id);
  const selectedLedAction=actionForLed(selectedLedMarker.id);
  const selectedLedProcedureAction=VP8002_FIELD_ACTIONS.find(action=>action.id===selectedLedDiagnostic.procedureId)||selectedLedAction;
  const simulatedLedStates=Object.fromEntries(VP8002_LED_MARKERS.map(marker=>{
    const normal=VP8002_LED_NORMALS[marker.id]||{};
    const observed=observedLedStates[marker.id]||normal;
    return [marker.id,{...observed,different:!ledStateMatches(normal,observed)}];
  }));
  const ledDivergenceCount=VP8002_LED_MARKERS.filter(marker=>simulatedLedStates[marker.id]?.different).length;
  const done=SUPPORT_CHECKS.filter((_,i)=>checked[i]).length;
  const tabs=[
    ['resolver',Stethoscope,'Problemas',symptomResults.length],
    ['leds',Cpu,'VP8002',ledDivergenceCount||VP8002_LED_MARKERS.length],
    ['procedimentos',Wrench,'Procedimentos',actionResults.length],
    ['guia',BookOpen,'Guias',guideResults.length],
    ['suporte',LifeBuoy,'Checklist',SUPPORT_CHECKS.length]
  ];
  const openMobilePanel=panel=>{
    if(typeof window!=='undefined'&&window.matchMedia('(max-width: 900px)').matches) setMobilePanel(panel);
  };
  const openAction=id=>{
    setActionId(id);
    setTab('procedimentos');
    openMobilePanel('procedimentos');
  };
  const selectLedMarker=marker=>{
    setSelectedLedId(marker.id);
    const scrollToInspector=()=>ledInspectorRef.current?.scrollIntoView({behavior:'smooth', block:'center'});
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(scrollToInspector);
    else setTimeout(scrollToInspector, 0);
  };
  const updateObservedLed=patch=>setObservedLedStates(prev=>({
    ...prev,
    [selectedLedMarker.id]: {...(prev[selectedLedMarker.id]||selectedLedNormal), ...patch}
  }));
  const resetObservedLed=()=>setObservedLedStates(prev=>({...prev,[selectedLedMarker.id]: {...selectedLedNormal}}));
  const resetAllLeds=()=>setObservedLedStates(defaultVp8002LedStates());
  useEffect(()=>{setMobilePanel(null);},[tab,q]);
  const saveSymptom=()=>{
    if(!selectedSymptom) return;
    data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:selectedSymptom.category,sintoma:selectedSymptom.title,resultado:selectedSymptom.cause,acoes_realizadas:selectedSymptom.action,observacoes:obs,created_at:nowISO()});
    setObs('');
    notify('Diagnóstico registrado.');
  };
  const saveSupport=()=>{
    data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:'Antes de chamar suporte',sintoma:'Checklist de suporte',resultado:`${done}/${SUPPORT_CHECKS.length} itens conferidos`,acoes_realizadas:SUPPORT_CHECKS.filter((_,i)=>checked[i]).join('; '),observacoes:obs,created_at:nowISO()});
    setObs('');
    notify('Checklist de suporte registrado.');
  };
  const ActionDetail=()=>selectedAction?<article className="supportCommandDetail">
    <div className="supportCommandHero">
      <div className="vpCommandVisual" aria-hidden="true">
        <div className="vpCommandTop"><span>VP8002</span><b>{selectedAction.category}</b></div>
        <div className="vpCommandDisplay"><small>DISPLAY</small><strong>{selectedAction.code}</strong><em>{selectedAction.title}</em></div>
        <div className="vpCommandLedRow"><i className="green"/><i className="blue blink"/><i className="green"/><i/></div>
        <div className="vpCommandButton">BOTAO</div>
      </div>
      <div>
        <span className="pill">{selectedAction.code}</span>
        <h2>{selectedAction.title}</h2>
        <p>{selectedAction.summary}</p>
        <div className="supportAction"><CheckCircle2 size={19}/><span><b>Resultado esperado</b>{selectedAction.expected}</span></div>
      </div>
    </div>
    {selectedAction.warning&&<div className="supportWarning"><AlertTriangle size={18}/><b>{selectedAction.warning}</b></div>}
    <div className="supportStepTimeline">{selectedAction.steps.map((step,i)=><div key={step}><span>{i+1}</span><b>{step}</b></div>)}</div>
    {selectedAction.relatedLedIds?.length>0&&<div className="supportLinkedLeds">
      <small>LEDs relacionados</small>
      <div>{selectedAction.relatedLedIds.map(id=>{const marker=VP8002_LED_MARKERS.find(item=>item.id===id);return marker?<button type="button" key={id} onClick={()=>{setTab('leds');selectLedMarker(marker)}}><span className={`ledSelectorDot ${ledToneClass(simulatedLedStates[id]?.color)}`}/>{marker.label}</button>:null})}</div>
    </div>}
    {selectedAction.showCanCodes&&<div className="supportCanReference">
      <div className="sectionTitle"><div><h3><AlertTriangle size={18}/> Codigos dE / CAN</h3></div><span className="pill">{CAN_ERRORS.length}</span></div>
      <div className="supportCanTable">{CAN_ERRORS.map(code=><article key={code.code}><b>{code.code}</b><span>{code.bus}</span><strong>{code.desc}</strong><p>{code.solution}</p></article>)}</div>
    </div>}
    <p className="sourceText">{SOURCES.vp8002}</p>
  </article>:<Empty icon={Wrench} title="Nenhum procedimento encontrado" text="Limpe a busca ou procure por IP, dE, dA, reset, rede ou antena."/>;
  return <div className="supportPage">
    <PageHead eyebrow="Suporte técnico" title="Resolver no campo"/>
    <section className="supportHero">
      <div>
        <span className="eyebrow">Busca rápida</span>
        <h2>Diagnóstico, guia e checklist em um só lugar.</h2>
        <p>Digite o erro, LED, código CAN, equipamento ou sintoma para encontrar o procedimento certo.</p>
      </div>
      <div className="supportSearch">
        <Search size={20}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar IP, antena, CAN, LED, tag..."/>
      </div>
    </section>
    <div className="supportTabs">{tabs.map(([id,Icon,label,count])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={18}/><span>{label}</span><b>{count}</b></button>)}</div>

    {tab==='resolver'&&<section className="panel supportWorkspace">
      <div className="supportList">
        <div className="supportListHead"><b>Sintomas encontrados</b><span>{symptomResults.length}</span></div>
        {symptomResults.map(s=>{const I=s.icon;return <button key={s.id} className={selectedSymptom?.id===s.id?'active':''} onClick={()=>{setSymptomId(s.id);openMobilePanel('resolver')}}><I size={18}/><span><b>{s.title}</b><small>{s.category}</small></span></button>})}
        {!symptomResults.length&&<Empty icon={Search} title="Nada encontrado" text="Tente buscar por IP, rede, antena, tag, CAN ou LED."/>}
      </div>
      {selectedSymptom&&<div className="supportDesktopDetail"><article className="supportDetail">
        <span className="pill">{selectedSymptom.category}</span>
        <h2>{selectedSymptom.title}</h2>
        <p className="cause">{selectedSymptom.cause}</p>
        <div className="supportCheckGrid">{selectedSymptom.checks.map((item,i)=><div key={item}><span>{i+1}</span><b>{item}</b></div>)}</div>
        <div className="supportAction"><Zap size={19}/><span><b>Próxima ação</b>{selectedSymptom.action}</span></div>
        <div className="supportQuickActions">
          {normalizeText(selectedSymptom.category).includes('can')&&<button type="button" className="btn light" onClick={()=>openAction('menu-de')}><AlertTriangle size={17}/> Consultar dE / CAN</button>}
          {normalizeText(selectedSymptom.title).includes('ip')&&<button type="button" className="btn light" onClick={()=>openAction('display-ip')}><Globe2 size={17}/> Ver IP no display</button>}
          {normalizeText(selectedSymptom.title).includes('link')&&<button type="button" className="btn light" onClick={()=>openAction('lan-link-act')}><Cable size={17}/> Validar LINK / ACT</button>}
        </div>
        <details className="supportRegister">
          <summary><Save size={17}/> Registrar diagnóstico</summary>
          <div className="saveDiag compact">
            <select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select>
            <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Resumo do que foi feito no campo"/>
            <button className="btn primary" onClick={saveSymptom}><Save size={17}/> Salvar registro</button>
          </div>
        </details>
        <p className="sourceText">{selectedSymptom.source}</p>
      </article></div>}
    </section>}

    {tab==='procedimentos'&&<section className="panel supportCommandPanel">
      <div className="supportCommandRail">
        <div className="supportListHead"><b>Procedimentos de campo</b><span>{actionResults.length}</span></div>
        {actionResults.map(action=>{const I=action.icon;return <button key={action.id} className={selectedAction?.id===action.id?'active':''} onClick={()=>{setActionId(action.id);openMobilePanel('procedimentos')}}><I size={18}/><span><b>{action.title}</b><small>{action.category} • {action.code}</small></span></button>})}
        {!actionResults.length&&<Empty icon={Search} title="Nada encontrado" text="Procure por IP, dE, dA, reset, rede, energia ou antena."/>}
      </div>
      <div className="supportDesktopDetail"><ActionDetail/></div>
    </section>}

    {tab==='guia'&&<section className="panel supportGuidePanel">
      <div className="supportGuideRail">{guideResults.map(g=>{const I=g.icon;return <button key={g.id} className={selectedGuide?.id===g.id?'active':''} onClick={()=>{setGuideId(g.id);openMobilePanel('guia')}}><I size={18}/><span><b>{g.title}</b><small>{g.phases.length} etapas</small></span></button>})}</div>
      {selectedGuide?<div className="supportDesktopDetail"><article className="supportGuideDetail">
        <span className="pill">{selectedGuide.source}</span>
        <h2>{selectedGuide.title}</h2>
        <p>{selectedGuide.desc}</p>
        <div className="supportPhaseGrid">{selectedGuide.phases.map((phase,i)=><details key={phase.title} open={i===0}><summary><span>{i+1}</span><b>{phase.title}</b></summary><ul>{phase.items.map(item=><li key={item}>{item}</li>)}</ul></details>)}</div>
      </article></div>:<Empty icon={BookOpen} title="Nenhum guia encontrado" text="Limpe a busca ou procure por VP8002, antena, Nedap Now ou colares."/>}
    </section>}

    {tab==='leds'&&<section className="panel supportCardPanel ledSimulatorPanel">
      <div className="sectionTitle">
        <div><span className="eyebrow">Simulador visual</span><h2><Cpu size={20}/> LEDs da VP8002</h2></div>
        <span className={`pill ${ledDivergenceCount?'warn':''}`}>{ledDivergenceCount?`${ledDivergenceCount} divergente(s)`:'Operação normal'}</span>
      </div>
      <div className="ledSimulatorLayout">
        <div className="ledSimulatorStage">
          <div className="ledSimulatorIntro">
            <div>
              <b>Modo: Funcionamento normal</b>
              <span>Compare com a VP8002 física e toque no LED que estiver diferente.</span>
            </div>
            <button type="button" className="btn light" onClick={resetAllLeds}><RefreshCw size={16}/> Restaurar funcionamento normal</button>
          </div>
          <DeviceLedMap
            imageSrc={vp8002LedPanelImage}
            imageAlt="Painel frontal da VP8002 com LEDs e conectores"
            markers={VP8002_LED_MARKERS}
            stateById={simulatedLedStates}
            activeIds={[selectedLedMarker.id]}
            onMarkerClick={selectLedMarker}
          />
          <div className="ledSelectorRail" aria-label="Selecionar LED da VP8002">
            {VP8002_LED_MARKERS.map(marker=>{
              const state=simulatedLedStates[marker.id]||{};
              const active=marker.id===selectedLedMarker.id;
              return <button key={marker.id} type="button" className={`${active?'active':''} ${state.different?'different':''}`} onClick={()=>selectLedMarker(marker)}>
                <span className={`ledSelectorDot ${ledToneClass(state.color)}`}/>
                <b>{marker.label}</b>
              </button>
            })}
          </div>
        </div>
        <aside className="ledInspectorPanel" ref={ledInspectorRef}>
          <header>
            <span className={`ledInspectorDot ${ledToneClass(selectedLedObserved.color)}`}/>
            <div>
              <span className="eyebrow">LED selecionado</span>
              <h3>{selectedLedMarker.label}</h3>
            </div>
            <span className={`status ${selectedLedDiagnostic.isNormal?'ok':selectedLedDiagnostic.severity||'warn'}`}>{selectedLedDiagnostic.isNormal?'Normal':'Divergente'}</span>
          </header>
          <div className="ledCompareGrid">
            <article>
              <small>Estado normal esperado</small>
              <b>{ledLabelState(selectedLedNormal)}</b>
              <span>{selectedLedNormal.meaning}</span>
            </article>
            <article className={selectedLedDiagnostic.isNormal?'ok':selectedLedDiagnostic.severity||'warn'}>
              <small>Estado observado</small>
              <b>{ledLabelState(selectedLedObserved)}</b>
              <span>{selectedLedDiagnostic.isNormal?'Igual ao funcionamento esperado.':'Diferente do funcionamento normal.'}</span>
            </article>
          </div>
          <div className="ledObservedControls">
            <Field label="Cor observada">
              <select value={selectedLedObserved.color||'Verde'} onChange={e=>updateObservedLed({color:e.target.value})}>
                {LED_COLOR_OPTIONS.map(color=><option key={color}>{color}</option>)}
              </select>
            </Field>
            <Field label="Comportamento observado">
              <select value={selectedLedObserved.mode||'Aceso'} onChange={e=>updateObservedLed({mode:e.target.value})}>
                {LED_MODE_OPTIONS.map(mode=><option key={mode}>{mode}</option>)}
              </select>
            </Field>
          </div>
          <article className={`ledDiagnosticResult ${selectedLedDiagnostic.severity||'warn'} ${selectedLedDiagnostic.isNormal?'ok':'warn'}`}>
            <span>Diagnóstico</span>
            <h4>{selectedLedDiagnostic.title}</h4>
            <p>{selectedLedDiagnostic.meaning}</p>
            {selectedLedDiagnostic.probableCause&&<><b>Leitura provavel</b><p>{selectedLedDiagnostic.probableCause}</p></>}
            <b>Ação recomendada</b>
            <p>{selectedLedDiagnostic.action}</p>
            {selectedLedDiagnostic.checks?.length>0&&<div className="ledActionSteps">
              {selectedLedDiagnostic.checks.map((item,i)=><div key={item}><span>{i+1}</span><b>{item}</b></div>)}
            </div>}
          </article>
          {(selectedLedProcedureAction||selectedLedCanCodes.length>0)&&<div className="ledProcedureHint">
            <div><Wrench size={17}/><span><b>Procedimento relacionado</b>{selectedLedProcedureAction?.title||'Consultar dE - erros CAN'}</span></div>
            {selectedLedCanCodes.length>0&&<div className="ledMiniCodes">{selectedLedCanCodes.slice(0,6).map(code=><span key={code.code}>{code.code}</span>)}</div>}
            <button type="button" className="btn light full" onClick={()=>openAction(selectedLedProcedureAction?.id||'menu-de')}>Abrir procedimento visual</button>
          </div>}
          <button type="button" className="btn light full" onClick={resetObservedLed}><RefreshCw size={16}/> Voltar este LED ao normal</button>
          <p className="sourceText">{SOURCES.vp8002}</p>
        </aside>
      </div>
    </section>}

    {tab==='suporte'&&<section className="panel supportBeforePanel">
      <div className="supportBeforeHead"><div><span className="eyebrow">Antes de acionar suporte</span><h2><LifeBuoy size={21}/> Conferência rápida</h2></div><div className="circleProgress"><b>{done}</b><span>/{SUPPORT_CHECKS.length}</span></div></div>
      <div className="supportChecklist">{SUPPORT_CHECKS.map((item,i)=><button key={item} className={checked[i]?'done':''} onClick={()=>setChecked({...checked,[i]:!checked[i]})}><span>{checked[i]?<Check size={15}/>:i+1}</span><b>{item}</b></button>)}</div>
      <div className="saveDiag supportSaveLine">
        <select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select>
        <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Resumo para enviar ao suporte"/>
        <button className="btn primary" onClick={saveSupport}><Save size={17}/> Registrar checklist</button>
      </div>
    </section>}
    {mobilePanel==='resolver'&&selectedSymptom&&<div className="supportMobileModalBackdrop" onClick={()=>setMobilePanel(null)}>
      <aside className="supportMobileModal" onClick={e=>e.stopPropagation()}>
        <header><span>Procedimento</span><button type="button" onClick={()=>setMobilePanel(null)} aria-label="Fechar"><X size={18}/></button></header>
        <article className="supportDetail">
          <span className="pill">{selectedSymptom.category}</span>
          <h2>{selectedSymptom.title}</h2>
          <p className="cause">{selectedSymptom.cause}</p>
          <div className="supportCheckGrid">{selectedSymptom.checks.map((item,i)=><div key={item}><span>{i+1}</span><b>{item}</b></div>)}</div>
          <div className="supportAction"><Zap size={19}/><span><b>Próxima ação</b>{selectedSymptom.action}</span></div>
          <div className="supportQuickActions">
            {normalizeText(selectedSymptom.category).includes('can')&&<button type="button" className="btn light" onClick={()=>openAction('menu-de')}><AlertTriangle size={17}/> Consultar dE / CAN</button>}
            {normalizeText(selectedSymptom.title).includes('ip')&&<button type="button" className="btn light" onClick={()=>openAction('display-ip')}><Globe2 size={17}/> Ver IP no display</button>}
            {normalizeText(selectedSymptom.title).includes('link')&&<button type="button" className="btn light" onClick={()=>openAction('lan-link-act')}><Cable size={17}/> Validar LINK / ACT</button>}
          </div>
          <details className="supportRegister">
            <summary><Save size={17}/> Registrar diagnóstico</summary>
            <div className="saveDiag compact">
              <select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select>
              <textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Resumo do que foi feito no campo"/>
              <button className="btn primary" onClick={saveSymptom}><Save size={17}/> Salvar registro</button>
            </div>
          </details>
          <p className="sourceText">{selectedSymptom.source}</p>
        </article>
      </aside>
    </div>}
    {mobilePanel==='procedimentos'&&selectedAction&&<div className="supportMobileModalBackdrop" onClick={()=>setMobilePanel(null)}>
      <aside className="supportMobileModal" onClick={e=>e.stopPropagation()}>
        <header><span>Procedimento visual</span><button type="button" onClick={()=>setMobilePanel(null)} aria-label="Fechar"><X size={18}/></button></header>
        <ActionDetail/>
      </aside>
    </div>}
    {mobilePanel==='guia'&&selectedGuide&&<div className="supportMobileModalBackdrop" onClick={()=>setMobilePanel(null)}>
      <aside className="supportMobileModal" onClick={e=>e.stopPropagation()}>
        <header><span>Guia técnico</span><button type="button" onClick={()=>setMobilePanel(null)} aria-label="Fechar"><X size={18}/></button></header>
        <article className="supportGuideDetail">
          <span className="pill">{selectedGuide.source}</span>
          <h2>{selectedGuide.title}</h2>
          <p>{selectedGuide.desc}</p>
          <div className="supportPhaseGrid">{selectedGuide.phases.map((phase,i)=><details key={phase.title} open={i===0}><summary><span>{i+1}</span><b>{phase.title}</b></summary><ul>{phase.items.map(item=><li key={item}>{item}</li>)}</ul></details>)}</div>
        </article>
      </aside>
    </div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
