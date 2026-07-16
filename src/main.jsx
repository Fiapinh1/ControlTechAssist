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
  ClipboardPenLine, LifeBuoy, FileDown, Antenna, Gauge, ScanLine, Globe2, Filter, LocateFixed, Printer, Share2, MousePointer2,
  BrickWall, Trees, Mountain, Warehouse, Signal, SignalLow, SignalZero, CloudOff, RefreshCw, Copy, UserCheck
} from 'lucide-react';
import './styles.css';
import { SOURCES, INSTALL_GUIDES, SYMPTOMS, LED_DIAGNOSTICS, CAN_ERRORS, SUPPORT_CHECKS, QUICK_CHECKLISTS } from './data/manualContent.js';

const APP_VERSION = '3.0.0';
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
const notify = (message, type='success') => window.dispatchEvent(new CustomEvent('cta-notify',{detail:{message,type,id:Date.now()}}));
function NotificationCenter(){const [items,setItems]=useState([]);useEffect(()=>{const h=e=>{setItems(v=>[...v,e.detail]);setTimeout(()=>setItems(v=>v.filter(x=>x.id!==e.detail.id)),3600)};window.addEventListener('cta-notify',h);return()=>window.removeEventListener('cta-notify',h)},[]);return <div className="toastStack">{items.map(i=><div key={i.id} className={`toast ${i.type}`}><div>{i.type==='error'?<CircleAlert size={20}/>:i.type==='warning'?<AlertTriangle size={20}/>:<CheckCircle2 size={20}/>}</div><span>{i.message}</span></div>)}</div>}
function equipmentMarkerIcon(e){const antenna=e?.tipo?.includes('4102');const label=String(e?.apelido||e?.codigo_original||'').slice(0,10);return L.divIcon({className:'equipment-marker-wrap',html:`<div class="equipment-marker ${antenna?'antenna':'processor'}"><span>${antenna?'⌁':'▣'}</span></div><b>${label}</b>`,iconSize:[48,42],iconAnchor:[24,34],popupAnchor:[0,-30]});}
function farmMarkerIcon(f){const short=String(f?.nome||'Fazenda').replace(/^Fazenda\s+/i,'').slice(0,16);return L.divIcon({className:'farm-marker-wrap',html:`<div class="farm-marker farm-location"><span>⌂</span></div><b>${short}</b>`,iconSize:[86,52],iconAnchor:[43,40],popupAnchor:[0,-36]});}

const FARM_STATUS = ['Não iniciada', 'Em andamento', 'Instalação concluída', 'Aguardando validação', 'Com pendência', 'Finalizada'];
const CENTRAIS = ['Alta Genetics', 'Genex Brasil', 'Outra / Não informado'];
const EQUIP_TYPES = ['VP8002 — Processador/Base', 'VP4102 — Antena', 'Outro equipamento'];
const EQUIP_STATUS = ['Planejado', 'Instalado', 'Configurado', 'Validado', 'Com problema', 'Removido'];
const VISIT_TYPES = ['Instalação', 'Manutenção', 'Diagnóstico', 'Retorno', 'Validação', 'Treinamento', 'Suporte'];
const LOCAL_SUGGESTIONS = ['Ordenha', 'Sala de leite', 'Curral', 'Galpão 01', 'Galpão 02', 'Compost barn', 'Free stall', 'Piquete', 'Bezerreiro', 'Pré-parto', 'Pós-parto', 'Casa de máquinas', 'Escritório', 'Sala técnica', 'Torre', 'Caixa d’água', 'Barracão', 'Cocho', 'Pista de trato', 'Outro'];
const OBSTACLE_TYPES = ['Parede de alvenaria','Parede de concreto','Estrutura metálica','Telhado metálico','Barracão/galpão','Mata densa','Desnível/relevo','Outro'];
const COVERAGE_RESULTS = ['Leitura boa','Leitura instável','Sem leitura'];
const COVERAGE_COLORS = {'Leitura boa':'#22c55e','Leitura instável':'#f59e0b','Sem leitura':'#ef4444'};

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

function saveLocal(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
function loadLocal(k){ try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } }

function useData(user, localMode=false){
  const [fazendas,setFazendas]=useState([]), [equipamentos,setEquipamentos]=useState([]), [visitas,setVisitas]=useState([]), [checklists,setChecklists]=useState([]), [diagnosticos,setDiagnosticos]=useState([]), [planejamentos,setPlanejamentos]=useState([]), [obstaculos,setObstaculos]=useState([]), [testesCobertura,setTestesCobertura]=useState([]), [fazendaMembros,setFazendaMembros]=useState([]);
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
        setFazendas(tables[0].data||[]); setEquipamentos(tables[1].data||[]); setVisitas(tables[2].data||[]); setChecklists(tables[3].data||[]); setDiagnosticos(tables[4].data||[]); setPlanejamentos(tables[5].data||[]); setObstaculos(tables[6].data||[]); setTestesCobertura(tables[7].data||[]);
        const membros = await supabase.from('fazenda_membros').select('*, profiles:user_id(id,email,nome)').order('created_at',{ascending:true});
        if(!membros.error)setFazendaMembros(membros.data||[]);else{console.warn('Compartilhamento não carregado:',membros.error.message);setFazendaMembros([]);}
        setOk();
      } else {
        setFazendas(loadLocal('cta_fazendas')); setEquipamentos(loadLocal('cta_equipamentos')); setVisitas(loadLocal('cta_visitas')); setChecklists(loadLocal('cta_checklists')); setDiagnosticos(loadLocal('cta_diagnosticos')); setPlanejamentos(loadLocal('cta_planejamentos')); setObstaculos(loadLocal('cta_obstaculos')); setTestesCobertura(loadLocal('cta_testes_cobertura')); setFazendaMembros([]);
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
        notify(`Não foi possível salvar no Supabase: ${error.message}`,'error');
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
        notify(`Não foi possível remover no Supabase: ${error.message}`,'error');
        return {ok:false,error};
      }
      setOk();
    }
    setter(prev => { const next=prev.filter(x=>x.id!==id); if(!cloud) saveLocal(key,next); return next; });
    return {ok:true};
  }
  const withExistingOwner = (list, row) => ({...row, user_id:list.find(x=>x.id===row.id)?.user_id || row.user_id || user?.id});
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
    userId:user?.id, fazendas, equipamentos, visitas, checklists, diagnosticos, planejamentos, obstaculos, testesCobertura, fazendaMembros,
    shareFarm, updateFarmMember, removeFarmMember,
    saveFazenda: r => upsert('fazendas', setFazendas, 'cta_fazendas', withExistingOwner(fazendas,r)),
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
  const [view,setView]=useState('fazendas');
  const [selectedFarmId,setSelectedFarmId]=useState(null);
  const [localMode,setLocalMode]=useState(localStorage.getItem(LOCAL_MODE_KEY)==='true');
  const [recoveryMode,setRecoveryMode]=useState(()=> window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery'));
  const updateHandled=useRef(false);
  const update = useAppUpdate();
  const data=useData(user, localMode);
  const selectedFarm=data.fazendas.find(f=>f.id===selectedFarmId);
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
  const goFarm = id => { setSelectedFarmId(id); setView('fazenda'); };
  const setMainView = v => { setView(v); if(v!=='fazenda') setSelectedFarmId(null); };
  const exitLocalMode = () => { localStorage.removeItem(LOCAL_MODE_KEY); setLocalMode(false); setSelectedFarmId(null); setView('fazendas'); };
  const logout = async () => { if(localMode){ exitLocalMode(); return; } await supabase?.auth.signOut(); };
  return <div className="app"><NotificationCenter/><Sidebar view={view} setView={setMainView} user={user} cloud={data.cloud} localMode={localMode} onExitLocal={exitLocalMode}/><main className="main">
    {(!data.cloud || localMode) && <SystemStatus data={data} localMode={localMode} onDisableLocal={()=>{localStorage.removeItem(LOCAL_MODE_KEY); setLocalMode(false)}}/>}
    {view==='fazendas' && <Fazendas data={data} onOpen={goFarm}/>}
    {view==='diagnostico' && <Diagnostico data={data}/>}
    {view==='guia' && <Guia/>}
    {view==='produtividade' && <Produtividade data={data} onOpen={goFarm}/>}
    {view==='relatorios' && <Relatorios data={data} onOpen={goFarm}/>}
    {view==='fazenda' && selectedFarm && <FazendaDetalhe farm={selectedFarm} data={data} onBack={()=>setMainView('fazendas')}/>}
  </main><BottomNav view={view} setView={setMainView} user={user} localMode={localMode} onLogout={logout}/></div>;
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
function PageHead({eyebrow,title,desc,children}){return <header className="pageHead"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{desc&&<p>{desc}</p>}</div><div className="headActions">{children}</div></header>}
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
    <p className="mutedLine">Estados ficam cinza até você cadastrar uma fazenda naquele UF. Os pontos mostram as cidades/fazendas visitadas.</p>
    <div className="legend"><span><i style={{background:STATE_COLORS['Alta Genetics']}}/> Alta Genetics</span><span><i style={{background:STATE_COLORS['Genex Brasil']}}/> Genex Brasil</span><span><i style={{background:STATE_COLORS.mixed}}/> Mais de uma central</span><span><i style={{background:STATE_COLORS.none}}/> Sem atendimento</span></div>
    <div className="brMap"><MapContainer center={[-15.8,-47.9]} zoom={4} minZoom={3} className="bigMap" scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap" />
      {geo && <GeoJSON key={filter+fazendas.length} data={geo} style={styleFeature} onEachFeature={(feature,layer)=>{const uf=getGeoUF(feature); const count=farms.filter(f=>getFarmUF(f)===uf).length; layer.bindTooltip(`${uf || 'UF'} • ${count} fazenda(s)`);}} />}
      {farms.map(f=><Marker key={f.id} position={farmLatLng(f)} icon={farmMarkerIcon(f)} eventHandlers={{click:()=>onOpen(f.id)}}><Popup><b>{f.nome}</b><br/>{f.cidade||'-'} {getFarmUF(f)&&`/ ${getFarmUF(f)}`}<br/>Central: {f.central||'-'}<br/>Regional: {f.regional_nome||'-'}<br/>Colares: {num(f.qtd_colares_instalada)} / {num(f.qtd_colares_prevista)}</Popup></Marker>)}
    </MapContainer></div>{err&&<p className="sourceText">{err}</p>}</section>
}

function Fazendas({data,onOpen}){
  const [q,setQ]=useState(''),[modal,setModal]=useState(false),[central,setCentral]=useState('Todas'),[status,setStatus]=useState('Todos'),[quick,setQuick]=useState('todos');
  const farms=data.fazendas.filter(f=>{
    const equipmentText=data.equipamentos.filter(e=>e.fazenda_id===f.id).map(e=>[e.tipo,e.codigo_original,e.apelido,e.local_instalacao].join(' ')).join(' ');
    const matchesText=[f.nome,f.cidade,f.estado_uf,f.responsavel,f.central,f.regional_nome,f.veterinario_apoio,equipmentText].join(' ').toLowerCase().includes(q.toLowerCase());
    const matchesCentral=central==='Todas'||(f.central||'')===central||(!f.central&&central.startsWith('Outra'));
    const matchesStatus=status==='Todos'||f.status===status;
    const matchesQuick=quick==='todos'||(quick==='sem-gps'&&!(f.latitude&&f.longitude))||(quick==='sem-equip'&&!data.equipamentos.some(e=>e.fazenda_id===f.id))||(quick==='pendencias'&&((f.status||'').toLowerCase().includes('pend')||data.visitas.some(v=>v.fazenda_id===f.id&&v.pendencias)));
    return matchesText&&matchesCentral&&matchesStatus&&matchesQuick;
  });
  const counts={andamento:data.fazendas.filter(f=>f.status==='Em andamento').length,pendencias:data.fazendas.filter(f=>(f.status||'').toLowerCase().includes('pend')).length,finalizadas:data.fazendas.filter(f=>{const s=(f.status||'').toLowerCase();return s.includes('final')||s.includes('conclu');}).length};
  const resetFilters=()=>{setQ('');setCentral('Todas');setStatus('Todos');setQuick('todos')};
  return <div><PageHead eyebrow="Operação de campo" title="Visão geral das fazendas" desc="Busque a fazenda primeiro, abra o dossiê e use o mapa como apoio visual."><button className="btn primary" onClick={()=>setModal(true)}><Plus size={18}/> Nova fazenda</button></PageHead>
    <div className="statsGrid fieldStats"><Stat icon={MapPinned} label="fazendas" value={data.fazendas.length}/><Stat icon={Clock} label="em andamento" value={counts.andamento}/><Stat icon={AlertTriangle} label="com pendência" value={counts.pendencias} tone="orange"/><Stat icon={CheckCircle2} label="concluídas" value={counts.finalizadas} tone="green"/></div>
    <section className="panel fieldFinder smartFilters"><div className="filterHeader fieldFinderHeader"><div><span className="eyebrow">Localizar fazenda</span><h2><Filter size={20}/> Busca e filtros</h2><p>A lista fica no topo para abrir a fazenda sem rolar até o fim da página.</p></div><button className="btn light" onClick={resetFilters}>Limpar filtros</button></div><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por fazenda, cidade, regional, veterinário, equipamento ou código..."/></div><select value={central} onChange={e=>setCentral(e.target.value)}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></div><div className="filterChips"><button className={quick==='todos'?'active':''} onClick={()=>setQuick('todos')}>Todas</button><button className={quick==='pendencias'?'active':''} onClick={()=>setQuick('pendencias')}><AlertTriangle size={15}/> Com pendências</button><button className={quick==='sem-gps'?'active':''} onClick={()=>setQuick('sem-gps')}><LocateFixed size={15}/> Sem GPS</button><button className={quick==='sem-equip'?'active':''} onClick={()=>setQuick('sem-equip')}><Cpu size={15}/> Sem equipamentos</button></div><div className="finderSummary"><b>{farms.length}</b><span>fazenda(s) encontrada(s)</span></div>{farms.length===0?<><Empty title="Nenhuma fazenda encontrada" text="Altere os filtros ou cadastre uma nova fazenda."/>{data.cloud&&data.fazendas.length===0&&<AccountDataNotice userId={data.userId}/>}</>:<div className="farmGrid finderGrid">{farms.map(f=><FarmCard key={f.id} farm={f} data={data} onOpen={()=>onOpen(f.id)}/>)}</div>}</section>
    <div className="fieldMapSecondary"><BrasilAtuacaoMap fazendas={data.fazendas} onOpen={onOpen}/></div>
    {modal&&<FazendaModal onClose={()=>setModal(false)} onSave={(r)=>{data.saveFazenda(r);setModal(false)}}/>}</div>
}
function AccountDataNotice({userId}){const copy=async()=>{try{await navigator.clipboard.writeText(userId||'');notify('UID copiado.')}catch{}};return <section className="accountNotice"><UserCheck size={24}/><div><h3>Conta conectada, mas sem fazendas vinculadas</h3><p>O Supabase protege os dados por UID. Se suas fazendas foram criadas com outra conta, elas continuam no banco, mas não aparecem para esta conta.</p><div className="uidBox"><code>{userId||'UID indisponível'}</code><button onClick={copy}><Copy size={15}/> Copiar UID</button></div><small>Use o arquivo <b>supabase/migrar_dados_entre_contas.sql</b> para transferir os registros da conta antiga para esta conta sem perder equipamentos, visitas ou checklists.</small></div></section>}
function FarmCard({farm,data,onOpen}){const access=farmAccess(farm,data);const eq=data.equipamentos.filter(e=>e.fazenda_id===farm.id).length; const visits=data.visitas.filter(v=>v.fazenda_id===farm.id); const pct=num(farm.qtd_colares_prevista)?Math.round(num(farm.qtd_colares_instalada)/num(farm.qtd_colares_prevista)*100):0; return <article className="farmCard" onClick={onOpen}><div className="cardTop"><div className="badgeIcon"><Building2 size={20}/></div><span className={`status ${farm.status?.includes('pend')?'warn':farm.status?.includes('Final')||farm.status?.includes('conclu')?'ok':''}`}>{farm.status||'Não iniciada'}</span></div><div className="farmCentral"><span>{farm.central||'Central não informada'}</span>{access.isShared&&<AccessBadge access={access}/>}</div><h3>{farm.nome}</h3><p><MapPin size={15}/>{farm.cidade||'Cidade não informada'}{getFarmUF(farm)?` / ${getFarmUF(farm)}`:''}</p><p><User size={15}/>{farm.responsavel||'Responsável não informado'}</p><p><ShieldCheck size={15}/>{farm.regional_nome||'Regional não informado'}</p>{farm.veterinario_apoio&&<p><Stethoscope size={15}/>{farm.veterinario_apoio}</p>}<div className="progress"><span style={{width:`${Math.min(pct,100)}%`}}/></div><div className="miniStats"><span><b>{num(farm.qtd_colares_instalada)}</b> instalados</span><span><b>{num(farm.qtd_colares_prevista)}</b> previstos</span><span><b>{eq}</b> equips.</span></div><footer>Última visita: {visits[0]?brDate(visits[0].data_visita):'sem visita'}<ChevronLeft className="rotate" size={17}/></footer></article>}
function FazendaModal({farm={},onClose,onSave}){
  const [ufs,setUfs]=useState([]),[cities,setCities]=useState([]),[loadingCities,setLoadingCities]=useState(false);
  const [form,setForm]=useState({id:farm.id||uid(),nome:farm.nome||'',central:farm.central||'',regional_nome:farm.regional_nome||'',veterinario_apoio:farm.veterinario_apoio||'',responsavel:farm.responsavel||'',telefone:farm.telefone||'',estado_uf:farm.estado_uf||parseUF(farm.cidade)||'',estado_nome:farm.estado_nome||'',cidade:farm.cidade?.replace(/\s*\/\s*[A-Z]{2}$/,'')||'',codigo_ibge_cidade:farm.codigo_ibge_cidade||'',latitude:farm.latitude||'',longitude:farm.longitude||'',localizacao_origem:farm.localizacao_origem||'',endereco:farm.endereco||'',qtd_colares_prevista:farm.qtd_colares_prevista||'',qtd_colares_instalada:farm.qtd_colares_instalada||'',status:farm.status||FARM_STATUS[0],servico_inicio_em:dateTimeInput(farm.servico_inicio_em),servico_fim_em:dateTimeInput(farm.servico_fim_em),servico_responsavel:farm.servico_responsavel||'',servico_observacoes:farm.servico_observacoes||'',observacoes:farm.observacoes||'',created_at:farm.created_at||nowISO()});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  useEffect(()=>{ let alive=true; fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(r=>r.json()).then(list=>alive&&setUfs(list)).catch(()=>{}); return()=>{alive=false}; },[]);
  useEffect(()=>{ if(!form.estado_uf){setCities([]);return;} let alive=true; setLoadingCities(true); fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado_uf}/municipios?orderBy=nome`).then(r=>r.json()).then(list=>{if(alive)setCities(list)}).catch(()=>alive&&setCities([])).finally(()=>alive&&setLoadingCities(false)); return()=>{alive=false}; },[form.estado_uf]);
  async function chooseCity(code){ const city=cities.find(c=>String(c.id)===String(code)); setForm(prev=>({...prev,codigo_ibge_cidade:code,cidade:city?.nome||prev.cidade,localizacao_origem:'cidade'})); try{ const c=await fetchCityCentroid(code); if(c) setForm(prev=>({...prev,latitude:c[0],longitude:c[1],localizacao_origem:'cidade'})); }catch{} }
  function useGPS(){ if(!navigator.geolocation){notify('GPS não disponível neste navegador.','error');return;} navigator.geolocation.getCurrentPosition(pos=>setForm(prev=>({...prev,latitude:pos.coords.latitude,longitude:pos.coords.longitude,localizacao_origem:'gps'})),()=>notify('Não foi possível obter GPS. No iPhone, verifique permissão e HTTPS.','error'),{enableHighAccuracy:true,timeout:12000}); }
  return <Modal title={farm.id?'Editar fazenda':'Nova fazenda'} onClose={onClose}><form className="form modern" onSubmit={e=>{e.preventDefault();onSave({...form,qtd_colares_prevista:num(form.qtd_colares_prevista),qtd_colares_instalada:num(form.qtd_colares_instalada),latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null,servico_inicio_em:toIsoOrNull(form.servico_inicio_em),servico_fim_em:toIsoOrNull(form.servico_fim_em)})}}> <Field label="Nome da fazenda *" icon={Building2}><input value={form.nome} onChange={e=>set('nome',e.target.value)} required placeholder="Ex: Fazenda Santa Maria"/></Field><div className="grid2"><Field label="Central / empresa atendida" icon={ShieldCheck}><select value={form.central} onChange={e=>set('central',e.target.value)}><option value="">Selecione...</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Nome do regional" icon={User}><input value={form.regional_nome} onChange={e=>set('regional_nome',e.target.value)} placeholder="Ex: nome do regional"/></Field></div><Field label="Veterinário / apoio em campo" icon={Stethoscope}><input value={form.veterinario_apoio} onChange={e=>set('veterinario_apoio',e.target.value)} placeholder="Nome do veterinário, se estiver junto"/></Field><div className="grid2"><Field label="Responsável da fazenda" icon={User}><input value={form.responsavel} onChange={e=>set('responsavel',e.target.value)} placeholder="Nome"/></Field><Field label="Telefone" icon={Phone}><input value={form.telefone} onChange={e=>set('telefone',e.target.value)} placeholder="(00) 00000-0000"/></Field></div><div className="grid2"><Field label="Estado" icon={MapPin}><select value={form.estado_uf} onChange={e=>{const uf=e.target.value; const st=ufs.find(u=>u.sigla===uf); setForm(prev=>({...prev,estado_uf:uf,estado_nome:st?.nome||UF_NAMES[uf]||'',cidade:'',codigo_ibge_cidade:'',latitude:'',longitude:'',localizacao_origem:''}))}}><option value="">Selecione o estado...</option>{ufs.map(u=><option key={u.id} value={u.sigla}>{u.nome} — {u.sigla}</option>)}</select></Field><Field label="Cidade" icon={MapPin}><select value={form.codigo_ibge_cidade} onChange={e=>chooseCity(e.target.value)} disabled={!form.estado_uf||loadingCities}><option value="">{loadingCities?'Carregando cidades...':'Selecione a cidade...'}</option>{cities.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field></div><div className="grid2"><Field label="Latitude" icon={LocateFixed}><input value={form.latitude} onChange={e=>set('latitude',e.target.value)} placeholder="Automático pela cidade, GPS ou manual"/></Field><Field label="Longitude" icon={LocateFixed}><input value={form.longitude} onChange={e=>set('longitude',e.target.value)} placeholder="Automático pela cidade, GPS ou manual"/></Field></div><button type="button" className="btn light" onClick={useGPS}><Navigation size={17}/> Usar GPS atual da fazenda</button><small className="sourceText">Origem da localização: {form.localizacao_origem||'não definida'}. Ao selecionar cidade, o app tenta estimar o ponto pelo mapa oficial do IBGE; para maior precisão, use GPS ou marque equipamentos no mapa.</small><div className="grid2"><Field label="Status" icon={BadgeCheck}><select value={form.status} onChange={e=>set('status',e.target.value)}>{FARM_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Endereço"><input value={form.endereco} onChange={e=>set('endereco',e.target.value)} placeholder="Endereço ou referência"/></Field></div><div className="grid2"><Field label="Colares previstos" icon={Hash}><input type="number" value={form.qtd_colares_prevista} onChange={e=>set('qtd_colares_prevista',e.target.value)}/></Field><Field label="Colares instalados" icon={CheckCircle2}><input type="number" value={form.qtd_colares_instalada} onChange={e=>set('qtd_colares_instalada',e.target.value)}/></Field></div><section className="formBlock"><div><span className="eyebrow">Produtividade</span><h3>Controle do servico</h3><p>Use esses campos para medir tempo medio por fazenda e quantidade de colares.</p></div><div className="grid2"><Field label="Inicio do servico" icon={PlayCircle}><input type="datetime-local" value={form.servico_inicio_em} onChange={e=>set('servico_inicio_em',e.target.value)}/></Field><Field label="Fim do servico" icon={CheckCircle2}><input type="datetime-local" value={form.servico_fim_em} onChange={e=>set('servico_fim_em',e.target.value)}/></Field></div><Field label="Responsavel tecnico / equipe" icon={User}><input value={form.servico_responsavel} onChange={e=>set('servico_responsavel',e.target.value)} placeholder="Ex: David, equipe PR, parceiro local"/></Field><Field label="Observacoes do servico"><textarea value={form.servico_observacoes} onChange={e=>set('servico_observacoes',e.target.value)} placeholder="Deslocamento, espera por estrutura, retorno pendente ou motivo de atraso"/></Field></section><Field label="Observações"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Informações importantes da fazenda"/></Field><button className="btn primary full"><Save size={18}/> Salvar</button></form></Modal>}
function FazendaDetalhe({farm,data,onBack}){const [tab,setTab]=useState('resumo'),[edit,setEdit]=useState(false),[equipModal,setEquipModal]=useState(false),[visitModal,setVisitModal]=useState(false); const access=farmAccess(farm,data); const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id), visits=data.visitas.filter(v=>v.fazenda_id===farm.id), checks=data.checklists.filter(c=>c.fazenda_id===farm.id), diags=data.diagnosticos.filter(d=>d.fazenda_id===farm.id); const tabs=[['resumo','Resumo',Building2],['checklists','Checklists',ClipboardCheck],['equipamentos','Equipamentos',Cpu],['mapa','Mapa técnico',MapIcon],['visitas','Visitas',CalendarDays],['relatorio','Relatório',FileText],access.canManageAccess&&['acessos','Acessos',UserCheck]].filter(Boolean); const pct=num(farm.qtd_colares_prevista)?Math.round(num(farm.qtd_colares_instalada)/num(farm.qtd_colares_prevista)*100):0; const serviceActive=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), serviceDone=Boolean(farm.servico_inicio_em&&farm.servico_fim_em); const startService=async()=>{if(!access.canEdit)return;await data.saveFazenda({...farm,servico_inicio_em:farm.servico_inicio_em||nowISO(),servico_fim_em:null,servico_responsavel:farm.servico_responsavel||farm.regional_nome||farm.responsavel||'',status:FARM_STATUS[1]});notify('Servico iniciado.');}; const finishService=async()=>{if(!access.canEdit)return;await data.saveFazenda({...farm,servico_inicio_em:farm.servico_inicio_em||nowISO(),servico_fim_em:nowISO(),status:FARM_STATUS[2]});notify('Servico finalizado.');};
  return <div><button className="back" onClick={onBack}><ChevronLeft size={18}/> Voltar para fazendas</button><section className="farmHero"><div><span className="eyebrow">Dossiê técnico</span><h1>{farm.nome}</h1><p><MapPin size={16}/>{farm.cidade||'Cidade não informada'} <span>•</span> <Building2 size={16}/>{farm.central||'Central não informada'} <span>•</span> <User size={16}/>{farm.regional_nome||farm.responsavel||'Regional não informado'}</p><AccessBadge access={access}/></div><div className="heroActions">{access.canEdit&&!serviceActive&&!serviceDone&&<button className="btn light" onClick={startService}><PlayCircle size={17}/> Iniciar servico</button>}{access.canEdit&&serviceActive&&<button className="btn primary" onClick={finishService}><CheckCircle2 size={17}/> Finalizar servico</button>}{access.canEdit&&<button className="btn light" onClick={()=>setEdit(true)}><Pencil size={17}/> Editar</button>}{access.canEdit&&<button className="btn primary" onClick={()=>setVisitModal(true)}><Plus size={17}/> Nova visita</button>}</div></section>{!access.canEdit&&<PermissionNotice/>}<div className="tabs farmTabs">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={tab===id?'active':''}><Icon size={17}/>{label}</button>)}</div>
    {tab==='resumo'&&<section className="panel"><ServiceControl farm={farm} canEdit={access.canEdit} onStart={startService} onFinish={finishService} onEdit={()=>setEdit(true)}/><div className="statsGrid"><Stat icon={Hash} label="colares previstos" value={num(farm.qtd_colares_prevista)}/><Stat icon={CheckCircle2} label="instalados" value={num(farm.qtd_colares_instalada)} tone="green"/><Stat icon={Gauge} label="progresso" value={`${pct}%`}/><Stat icon={Cpu} label="equipamentos" value={equips.length}/><Stat icon={Clock} label="tempo de servico" value={serviceDurationLabel(farm)}/></div><div className="grid2"><InfoCard title="Dados da fazenda" rows={[["Central",farm.central],["Regional",farm.regional_nome],["Veterinário / apoio",farm.veterinario_apoio],["Responsável",farm.responsavel],["Telefone",farm.telefone],["Cidade",farm.cidade],["Endereço",farm.endereco],["Status",farm.status],["Observações",farm.observacoes]]}/><InfoCard title="Atalhos de campo" rows={[["Última visita",visits[0]?brDate(visits[0].data_visita):'Sem visita'],["Checklists salvos",checks.length],["Diagnósticos registrados",diags.length],["Equipamentos mapeados",equips.filter(e=>e.latitude&&e.longitude).length]]}/></div></section>}
    {tab==='checklists'&&<ChecklistsFazenda farm={farm} data={data} canEdit={access.canEdit}/>} {tab==='equipamentos'&&<EquipamentosFazenda farm={farm} data={data} canEdit={access.canEdit} openNew={()=>setEquipModal(true)}/>} {tab==='mapa'&&<MapaFazenda farm={farm} data={data}/>} {tab==='visitas'&&<VisitasFazenda farm={farm} data={data} canEdit={access.canEdit} openNew={()=>setVisitModal(true)}/>} {tab==='relatorio'&&<RelatorioFazenda farm={farm} data={data}/>} {tab==='acessos'&&<AcessosFazenda farm={farm} data={data} access={access}/>}
    {edit&&access.canEdit&&<FazendaModal farm={farm} onClose={()=>setEdit(false)} onSave={async(r)=>{await data.saveFazenda(r);setEdit(false)}}/>}{equipModal&&access.canEdit&&<EquipModal farm={farm} onClose={()=>setEquipModal(false)} onSave={async(r)=>{await data.saveEquipamento(r);setEquipModal(false)}}/>}{visitModal&&access.canEdit&&<VisitModal farm={farm} onClose={()=>setVisitModal(false)} onSave={async(r)=>{await data.saveVisita(r);setVisitModal(false)}}/>}</div>}
function ServiceControl({farm,canEdit,onStart,onFinish,onEdit}){const active=Boolean(farm.servico_inicio_em&&!farm.servico_fim_em), done=Boolean(farm.servico_inicio_em&&farm.servico_fim_em); const status=active?'Em andamento':done?'Finalizado':'Nao iniciado'; return <div className={`serviceControl ${active?'active':done?'done':''}`}><div className="serviceLead"><span className="eyebrow">Produtividade</span><h2><Clock size={20}/> Servico da fazenda</h2><p>{active?'Cronometro aberto para esta fazenda. Finalize quando encerrar a instalacao.':done?'Servico encerrado e pronto para os relatorios de produtividade.':'Inicie o servico quando comecar a atuacao nesta fazenda.'}</p></div><div className="serviceFacts"><div><span>Status</span><b>{status}</b></div><div><span>Inicio</span><b>{brDateTime(farm.servico_inicio_em)}</b></div><div><span>Fim</span><b>{brDateTime(farm.servico_fim_em)}</b></div><div><span>Duracao</span><b>{serviceDurationLabel(farm)}</b></div></div><div className="serviceActions">{canEdit&&!farm.servico_inicio_em&&<button className="btn primary" onClick={onStart}><PlayCircle size={17}/> Iniciar servico</button>}{canEdit&&active&&<button className="btn primary" onClick={onFinish}><CheckCircle2 size={17}/> Finalizar servico</button>}{canEdit&&<button className="btn light" onClick={onEdit}><Pencil size={17}/> Ajustar datas</button>}</div>{farm.servico_observacoes&&<p className="serviceNote">{farm.servico_observacoes}</p>}</div>}
function AcessosFazenda({farm,data,access}){
  const [email,setEmail]=useState(''),[role,setRole]=useState('viewer'),[busy,setBusy]=useState(false);
  const members=data.fazendaMembros.filter(m=>m.fazenda_id===farm.id);
  const roles=[['viewer','Visualizador','Consulta dados, mapa, visitas e relatórios sem alterar informações.'],['admin','Administrador','Pode editar fazenda, equipamentos, visitas, checklists e relatórios.']];
  const add=async(e)=>{e.preventDefault();setBusy(true);const r=await data.shareFarm(farm,email,role);if(r.ok)setEmail('');setBusy(false)};
  if(!access.canManageAccess)return <section className="panel"><PermissionNotice/></section>;
  return <section className="panel accessPanel"><div className="sectionTitle"><div><h2><UserCheck size={20}/> Acessos da fazenda</h2><p className="sectionHint">Convide por e-mail e escolha claramente quem só visualiza e quem pode alterar dados.</p></div></div><form className="accessInvitePanel" onSubmit={add}><div className="accessInviteTop"><Field label="E-mail da pessoa"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nome@email.com" required/></Field><button className="btn primary" disabled={busy}><UserCheck size={17}/> {busy?'Liberando...':'Liberar acesso'}</button></div><div className="accessRoleCards">{roles.map(([value,label,desc])=><button type="button" key={value} className={role===value?'active':''} onClick={()=>setRole(value)}><span>{value==='admin'?<ShieldCheck size={18}/>:<UserCheck size={18}/>}</span><b>{label}</b><small>{desc}</small></button>)}</div></form><div className="accessPeopleGrid"><article className="accessPersonCard owner"><ShieldCheck size={22}/><div><b>Proprietário</b><span>Controle total da fazenda e dos acessos liberados.</span></div><AccessBadge access={{role:'owner',label:'Proprietário'}}/></article>{members.map(m=><article className="accessPersonCard" key={m.id}><UserCheck size={22}/><div><b>{m.profiles?.nome||m.profiles?.email||'Usuário autorizado'}</b><span>{m.profiles?.email||m.user_id}</span></div><div className="accessPersonActions"><select value={m.role} onChange={e=>data.updateFarmMember(m,e.target.value)}><option value="viewer">Visualizador</option><option value="admin">Administrador</option></select><button className="iconBtn danger" title="Remover acesso" onClick={()=>data.removeFarmMember(m.id)}><Trash2 size={16}/></button></div></article>)}</div>{!members.length&&<Empty icon={UserCheck} title="Nenhum acesso liberado" text="Adicione o e-mail de uma pessoa que já tenha conta no app."/>}</section>
}
function InfoCard({title,rows}){return <div className="infoCard"><h3>{title}</h3>{rows.map(([a,b])=><div className="infoRow" key={a}><span>{a}</span><b>{b||'-'}</b></div>)}</div>}

function ChecklistsFazenda({farm,data,canEdit=true}){
  const [template,setTemplate]=useState(QUICK_CHECKLISTS[0].id),[values,setValues]=useState({}),[obs,setObs]=useState(''),[editing,setEditing]=useState(null),[viewing,setViewing]=useState(null);
  const tpl=QUICK_CHECKLISTS.find(t=>t.id===template)||QUICK_CHECKLISTS[0];
  const saved=data.checklists.filter(c=>c.fazenda_id===farm.id);
  const done=tpl.items.filter((_,i)=>values[i]).length;
  const pct=tpl.items.length?Math.round(done/tpl.items.length*100):0;
  const toggle=i=>canEdit&&setValues({...values,[i]:!values[i]});
  const reset=()=>{setEditing(null);setValues({});setObs('')};
  const chooseTemplate=id=>{if(!canEdit)return;setTemplate(id);setValues({});setEditing(null)};
  const markAll=()=>canEdit&&setValues(Object.fromEntries(tpl.items.map((_,i)=>[i,true])));
  const clearAll=()=>canEdit&&setValues({});
  const edit=(item)=>{const itemTpl=QUICK_CHECKLISTS.find(t=>t.id===item.tipo)||QUICK_CHECKLISTS[0];setEditing(item);setTemplate(itemTpl.id);setObs(item.observacoes||'');const next={};(item.itens_json||[]).forEach((row,i)=>{next[i]=Boolean(row.ok)});setValues(next);};
  const save=async()=>{if(!canEdit){notify('Voce esta como visualizador nesta fazenda.','warning');return;}const items=tpl.items.map((label,i)=>({label,ok:Boolean(values[i])}));await data.saveChecklist({id:editing?.id||uid(),fazenda_id:farm.id,tipo:tpl.id,titulo:tpl.title,itens_json:items,status:items.every(i=>i.ok)?'Completo':'Parcial',observacoes:obs,created_at:editing?.created_at||nowISO()});reset();notify(editing?'Checklist atualizado.':'Checklist salvo.');};
  return <section className="panel checklistPanel"><div className="sectionTitle"><div><h2><ClipboardCheck size={21}/> Checklist por fazenda</h2><p className="sectionHint">Escolha o roteiro, marque os itens em cartões grandes e salve o histórico da fazenda.</p>{editing&&<p className="sectionHint editingHint">Editando histórico salvo em {brDate(editing.created_at)}.</p>}</div><div className="checkCounter"><b>{done}/{tpl.items.length}</b><span>itens concluídos</span></div></div>{!canEdit&&<PermissionNotice/>}<div className="checkTemplateRail">{QUICK_CHECKLISTS.map(t=><button type="button" key={t.id} className={template===t.id?'active':''} disabled={!canEdit} onClick={()=>chooseTemplate(t.id)}><ClipboardList size={18}/><span><b>{t.title}</b><small>{t.items.length} itens</small></span></button>)}</div><div className="checkProgressHero"><div><span>{tpl.source}</span><b>{pct}% concluído</b></div><div className="progress"><span style={{width:pct+'%'}}/></div><div className="checkProgressActions"><button className="btn light" disabled={!canEdit} onClick={markAll}>Marcar tudo</button><button className="btn light" disabled={!canEdit} onClick={clearAll}>Limpar</button></div></div><div className="checkGrid">{tpl.items.map((item,i)=><button type="button" className={values[i]?'checkCard done':'checkCard'} disabled={!canEdit} key={item} onClick={()=>toggle(i)}><span className="checkBoxVisual">{values[i]?<Check size={16}/>:i+1}</span><b>{item}</b></button>)}</div><textarea className="checkNotes" disabled={!canEdit} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações do checklist"/><div className="buttonRow"><button className="btn primary" disabled={!canEdit} onClick={save}><Save size={17}/> {editing?'Atualizar checklist':'Salvar checklist'}</button>{editing&&<button className="btn light" onClick={reset}>Cancelar edição</button>}</div><div className="checkHistoryHead"><h3>Histórico</h3><span>{saved.length} registro(s)</span></div><div className="checkHistoryGrid">{saved.map(c=>{const items=c.itens_json||[];const ok=items.filter(i=>i.ok).length;return <article className="checkHistoryCard" key={c.id}><div><ClipboardCheck size={18}/><span>{c.status}</span></div><b>{c.titulo}</b><small>{brDate(c.created_at)} - {ok}/{items.length||0} itens</small>{c.observacoes&&<p>{c.observacoes}</p>}<footer><button className="btn light" onClick={()=>setViewing(c)}><Info size={16}/> Visualizar</button>{canEdit&&<button className="iconBtn" title="Editar" onClick={()=>edit(c)}><Pencil size={16}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir" onClick={()=>data.delChecklist(c.id)}><Trash2 size={16}/></button>}</footer></article>})}</div>{!saved.length&&<Empty icon={ClipboardCheck} title="Nenhum checklist salvo" text="Salve um checklist para criar histórico da fazenda."/>}{viewing&&<Modal title={viewing.titulo} onClose={()=>setViewing(null)}><div className="modalBody"><p className="sourceText">{brDate(viewing.created_at)} - {viewing.status} - {viewing.observacoes||'sem observações'}</p><div className="checkViewList">{(viewing.itens_json||[]).map((item,i)=><div className={item.ok?'checkViewItem ok':'checkViewItem'} key={(item.label||'item')+'-'+i}><span>{item.ok?<Check size={15}/>:i+1}</span><b>{item.label}</b></div>)}</div></div></Modal>}</section>
}
function EquipamentosFazenda({farm,data,openNew,canEdit=true}){const [edit,setEdit]=useState(null); const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id); return <section className="panel"><div className="sectionTitle"><div><h2>Equipamentos instalados</h2><p className="sectionHint">A localização salva é protegida contra alterações acidentais.</p></div>{canEdit&&<button className="btn primary" onClick={openNew}><Plus size={17}/> Adicionar</button>}</div>{!canEdit&&<PermissionNotice/>}<div className="equipGrid">{equips.map(e=><div className="equipCard" key={e.id}><div className="equipIcon">{e.tipo?.includes('4102')?<RadioTower/>:<Cpu/>}</div><div><h3>{e.apelido||e.codigo_original||e.tipo}</h3><p>{e.tipo}</p><span>{e.local_nome||'Local não informado'} • {e.status}</span>{e.latitude&&<small><MapPin size={13}/> {Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}</small>}{e.tipo?.includes('4102')&&<small><Target size={13}/> Raio estimado: {Number(e.raio_metros)||75} m</small>}</div>{canEdit&&<button className="iconBtn" title="Editar equipamento" onClick={()=>setEdit(e)}><Pencil size={17}/></button>}{canEdit&&<button className="iconBtn danger" title="Excluir equipamento" onClick={()=>data.delEquipamento(e.id)}><Trash2 size={17}/></button>}</div>)}</div>{equips.length===0&&<Empty icon={Cpu} title="Nenhum equipamento" text="Cadastre VP8002, VP4102 ou outro equipamento da fazenda."/>}{edit&&canEdit&&<EquipModal farm={farm} equip={edit} onClose={()=>setEdit(null)} onSave={async(r)=>{await data.saveEquipamento(r);setEdit(null)}}/>}</section>}
function EquipModal({farm,equip={},onClose,onSave}){
  const originalLat=equip.latitude?Number(equip.latitude):null, originalLng=equip.longitude?Number(equip.longitude):null;
  const [tab,setTab]=useState('dados'),[locationApproved,setLocationApproved]=useState(false),[pendingLocation,setPendingLocation]=useState(null),[focus,setFocus]=useState(null);
  const [form,setForm]=useState({id:equip.id||uid(),fazenda_id:farm.id,tipo:equip.tipo||EQUIP_TYPES[0],codigo_original:equip.codigo_original||'',apelido:equip.apelido||'',local_nome:equip.local_nome||'',latitude:equip.latitude||'',longitude:equip.longitude||'',raio_metros:equip.raio_metros||75,status:equip.status||'Planejado',instalado_em:equip.instalado_em||todayInput(),observacoes:equip.observacoes||'',created_at:equip.created_at||nowISO()});
  const set=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const coordsChanged=(lat,lng)=>equip.id&&originalLat!==null&&originalLng!==null&&(Math.abs(Number(lat)-originalLat)>.000001||Math.abs(Number(lng)-originalLng)>.000001);
  const applyLocation=(lat,lng)=>{setForm(prev=>({...prev,latitude:lat,longitude:lng}));setFocus([Number(lat),Number(lng)]);};
  const requestLocation=(lat,lng)=>{if(coordsChanged(lat,lng)&&!locationApproved){setPendingLocation([Number(lat),Number(lng)]);return false;}applyLocation(lat,lng);return true;};
  const confirmLocation=()=>{if(!pendingLocation)return;setLocationApproved(true);applyLocation(...pendingLocation);setPendingLocation(null);notify('Nova localização aplicada. Salve para concluir.','warning');};
  const gps=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(pos=>requestLocation(pos.coords.latitude,pos.coords.longitude),()=>notify('Não foi possível usar o GPS. Verifique a permissão ou marque no mapa.','error'),{enableHighAccuracy:true,timeout:12000}):notify('GPS não disponível neste navegador.','error');
  const submit=e=>{e.preventDefault();if(coordsChanged(form.latitude,form.longitude)&&!locationApproved){setPendingLocation([Number(form.latitude),Number(form.longitude)]);return;}onSave({...form,latitude:form.latitude?Number(form.latitude):null,longitude:form.longitude?Number(form.longitude):null,raio_metros:Number(form.raio_metros)||75});notify(equip.id?'Equipamento atualizado com sucesso.':'Equipamento cadastrado com sucesso.');};
  const isAntenna=form.tipo?.includes('4102');
  return <Modal title={equip.id?'Editar equipamento':'Adicionar equipamento'} onClose={onClose}><form className="form modern equipmentEditor" onSubmit={submit}><div className="editorTabs"><button type="button" className={tab==='dados'?'active':''} onClick={()=>setTab('dados')}><ClipboardPenLine size={17}/> Dados</button><button type="button" className={tab==='localizacao'?'active':''} onClick={()=>setTab('localizacao')}><MapPin size={17}/> Localização {form.latitude&&<Check size={15}/>}</button></div>
  {tab==='dados'&&<div className="editorPane"><div className="grid2"><Field label="Tipo" icon={Cpu}><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{EQUIP_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Status" icon={BadgeCheck}><select value={form.status} onChange={e=>set('status',e.target.value)}>{EQUIP_STATUS.map(s=><option key={s}>{s}</option>)}</select></Field></div><div className="grid2"><Field label="Código original" icon={Hash}><input value={form.codigo_original} onChange={e=>set('codigo_original',e.target.value)} placeholder="Ex: VP8002 / 60"/></Field><Field label="Apelido" icon={Pencil}><input value={form.apelido} onChange={e=>set('apelido',e.target.value)} placeholder="Ex: Antena Galpão 01"/></Field></div><Field label="Local na fazenda" icon={MapPin}><input list="locais" value={form.local_nome} onChange={e=>set('local_nome',e.target.value)} placeholder="Ex: Galpão 01"/><datalist id="locais">{LOCAL_SUGGESTIONS.map(l=><option key={l} value={l}/>)}</datalist></Field>{isAntenna&&<div className="radiusField"><Field label="Raio estimado da antena (m)" icon={Target}><input type="number" min="25" max="500" step="25" value={form.raio_metros} onChange={e=>set('raio_metros',e.target.value)}/></Field><div className="radiusPreview"><RadioTower size={22}/><b>{Number(form.raio_metros)||75} m</b><span>Exibido no mapa técnico</span></div></div>}<Field label="Data de instalação"><input type="date" value={form.instalado_em} onChange={e=>set('instalado_em',e.target.value)}/></Field><Field label="Observações"><textarea value={form.observacoes} onChange={e=>set('observacoes',e.target.value)} placeholder="Pendências, configuração, cabo, rede, validação..."/></Field><button type="button" className="btn locationShortcut" onClick={()=>setTab('localizacao')}><MapPinned size={18}/>{form.latitude?'Revisar localização no mapa':'Definir localização no mapa'}</button></div>}
  {tab==='localizacao'&&<div className="editorPane locationPane">{equip.id&&originalLat!==null&&<div className="locationLock"><ShieldCheck size={20}/><div><b>Localização protegida</b><span>Qualquer mudança exige confirmação antes de substituir o GPS atual.</span></div></div>}<SearchMapControl onSelect={(lat,lng,label)=>{requestLocation(lat,lng);if(label&&!form.local_nome)set('local_nome',label)}} placeholder="Pesquisar cidade, endereço, fazenda ou coordenada..."/><div className="locationActions"><button type="button" className="btn light" onClick={gps}><Navigation size={17}/> Usar GPS atual</button>{form.latitude&&<span className="coordinateBadge"><LocateFixed size={15}/>{Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</span>}</div><div className="editorMap"><MapPicker lat={form.latitude} lng={form.longitude} radius={isAntenna?Number(form.raio_metros)||75:0} equip={{...form}} focus={focus} onPick={requestLocation}/></div><p className="mapHelp"><MousePointer2 size={16}/> Toque no mapa para escolher o ponto. O raio da VP4102 é atualizado automaticamente.</p></div>}
  <div className="stickyFormActions"><button type="button" className="btn light" onClick={onClose}>Cancelar</button><button className="btn primary"><Save size={18}/> Salvar equipamento</button></div></form>{pendingLocation&&<div className="confirmOverlay"><div className="confirmCard"><div className="confirmIcon"><AlertTriangle/></div><h3>Confirmar mudança de localização?</h3><p>Confira as coordenadas. A posição anterior será substituída somente após confirmar e salvar.</p><div className="coordinateCompare"><div><span>Local atual</span><b>{originalLat?.toFixed(6)}, {originalLng?.toFixed(6)}</b></div><Navigation size={20}/><div><span>Novo local</span><b>{pendingLocation[0].toFixed(6)}, {pendingLocation[1].toFixed(6)}</b></div></div><div className="confirmActions"><button type="button" className="btn light" onClick={()=>setPendingLocation(null)}>Manter localização atual</button><button type="button" className="btn warning" onClick={confirmLocation}>Usar nova localização</button></div></div></div>}</Modal>
}
function MapPicker({lat,lng,onPick,radius=0,equip={},focus}){const center=[Number(lat)||-19.7483,Number(lng)||-47.9319]; function Clicker(){useMapEvents({click(e){onPick(e.latlng.lat,e.latlng.lng)}}); return null;} return <MapContainer center={center} zoom={lat?17:13} className="map"><HybridLayers layer="hibrido"/><RecenterMap position={focus}/>{lat&&lng&&<><Marker position={[Number(lat),Number(lng)]} icon={equipmentMarkerIcon(equip)}/>{radius>0&&<Circle center={[Number(lat),Number(lng)]} radius={radius} pathOptions={{color:'#22c55e',fillColor:'#22c55e',fillOpacity:.16,weight:2}}/>}</>}<Clicker/></MapContainer>}
function SearchMapControl({onSelect,placeholder='Pesquisar cidade, endereço ou local...'}){
  const [q,setQ]=useState(''),[results,setResults]=useState([]),[busy,setBusy]=useState(false),[err,setErr]=useState('');
  const search=async()=>{if(!q.trim())return;setBusy(true);setErr('');try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=6&addressdetails=1&q=${encodeURIComponent(q)}`);if(!r.ok)throw new Error('Falha na busca');const j=await r.json();setResults(j);}catch(e){setErr('Não foi possível pesquisar agora. Você ainda pode navegar manualmente no mapa.');}finally{setBusy(false)}};
  return <div className="mapSearch"><div className="mapSearchBar"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder={placeholder}/><button type="button" onClick={search} disabled={busy}>{busy?'Buscando...':'Buscar'}</button></div>{results.length>0&&<div className="mapSearchResults">{results.map(r=><button type="button" key={r.place_id} onClick={()=>{onSelect(Number(r.lat),Number(r.lon),r.display_name);setResults([]);setQ(r.display_name)}}><MapPin size={15}/><span>{r.display_name}</span></button>)}</div>}{err&&<small className="sourceText">{err}</small>}</div>
}
function RecenterMap({position,zoom=17}){const map=useMapEvents({});useEffect(()=>{if(position?.[0]&&position?.[1])map.flyTo(position,zoom,{duration:.8})},[position?.[0],position?.[1],zoom]);return null;}
function FitBounds({points,trigger}){const map=useMapEvents({});useEffect(()=>{const valid=points.filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));if(!valid.length)return;if(valid.length===1){map.flyTo(valid[0],18,{duration:.6});return;}map.fitBounds(L.latLngBounds(valid),{padding:[42,42],maxZoom:18});},[trigger,points.length]);return null;}
function HybridLayers({layer}){const imagery='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';if(layer==='mapa')return <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="OpenStreetMap"/>;return <><TileLayer url={imagery} attribution="Esri"/>{layer==='hibrido'&&<TileLayer url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png" attribution="CARTO"/>}</>}
function TechnicalMapClick({mode,onPick}){useMapEvents({click(e){if(mode!=='navigate')onPick(e.latlng)}});return null;}
function MapaFazenda({farm,data}){
  const all=data.equipamentos.filter(e=>e.fazenda_id===farm.id&&e.latitude&&e.longitude),[layer,setLayer]=useState('hibrido'),[focus,setFocus]=useState(null),[fitTick,setFitTick]=useState(0),[showBuffers,setShowBuffers]=useState(true),[showLabels,setShowLabels]=useState(true),[typeFilter,setTypeFilter]=useState('todos');
  const equips=all.filter(e=>typeFilter==='todos'||(typeFilter==='vp4102'&&e.tipo?.includes('4102'))||(typeFilter==='vp8002'&&e.tipo?.includes('8002'))||(typeFilter==='outros'&&!e.tipo?.includes('4102')&&!e.tipo?.includes('8002')));
  const center=all[0]?[Number(all[0].latitude),Number(all[0].longitude)]:farmLatLng(farm);
  const fitPoints=[farm.latitude&&farm.longitude?[Number(farm.latitude),Number(farm.longitude)]:null,...equips.map(e=>[Number(e.latitude),Number(e.longitude)])].filter(Boolean);
  return <section className="panel readOnlyMapPanel"><div className="sectionTitle"><div><h2>Mapa técnico operacional</h2><p>Equipamentos com posição, identificação, rota por Maps e cobertura estimada.</p></div><div className="mapHeadActions"><select value={layer} onChange={e=>setLayer(e.target.value)}><option value="hibrido">Híbrido</option><option value="mapa">Mapa com nomes</option><option value="satelite">Satélite</option></select><button className="btn light" onClick={()=>setFitTick(v=>v+1)}><LocateFixed size={16}/> Ver instalação inteira</button></div></div><SearchMapControl onSelect={(lat,lng)=>setFocus([lat,lng])}/><div className="mapControls"><div className="filterChips"><button className={typeFilter==='todos'?'active':''} onClick={()=>setTypeFilter('todos')}>Todos ({all.length})</button><button className={typeFilter==='vp8002'?'active':''} onClick={()=>setTypeFilter('vp8002')}>VP8002</button><button className={typeFilter==='vp4102'?'active':''} onClick={()=>setTypeFilter('vp4102')}>VP4102</button><button className={typeFilter==='outros'?'active':''} onClick={()=>setTypeFilter('outros')}>Outros</button></div><label className="mapToggle"><input type="checkbox" checked={showBuffers} onChange={e=>setShowBuffers(e.target.checked)}/> Raios</label><label className="mapToggle"><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/> Nomes</label></div><div className="mapLegend"><span><i className="legendFarm"/> Fazenda</span><span><i className="legendProcessor"/> VP8002</span><span><i className="legendAntenna"/> VP4102</span><span><i className="legendOther"/> Outro equipamento</span><span><i className="legendBuffer"/> Cobertura estimada</span></div><div className="mapExperience"><div className="mapWrap technicalMap"><MapContainer center={center} zoom={all.length?18:15} className="bigMap"><HybridLayers layer={layer}/><RecenterMap position={focus}/><FitBounds points={fitPoints} trigger={fitTick}/>{farm.latitude&&farm.longitude&&<Marker position={[Number(farm.latitude),Number(farm.longitude)]} icon={farmMarkerIcon(farm)}><Popup><b>{farm.nome}</b><br/>Referência da fazenda<br/><button className="popupBtn" type="button" onClick={()=>openMaps(farm.latitude,farm.longitude)}>Abrir rota no Maps</button></Popup></Marker>}{equips.map(e=><React.Fragment key={e.id}><Marker position={[Number(e.latitude),Number(e.longitude)]} icon={equipmentMarkerIcon({...e,apelido:showLabels?(e.apelido||e.codigo_original):''})}><Popup><b>{e.apelido||e.codigo_original||e.tipo}</b><br/>{e.tipo}<br/>Código: {e.codigo_original||'-'}<br/>Local: {e.local_nome||'-'}<br/>Status: {e.status}<br/>Coordenadas: {Number(e.latitude).toFixed(6)}, {Number(e.longitude).toFixed(6)}{e.tipo?.includes('4102')&&<><br/>Raio estimado: {Number(e.raio_metros)||75} m</>}<br/><button className="popupBtn" type="button" onClick={()=>openMaps(e.latitude,e.longitude)}>Abrir rota no Maps</button></Popup></Marker>{showBuffers&&e.tipo?.includes('4102')&&<Circle center={[Number(e.latitude),Number(e.longitude)]} radius={Number(e.raio_metros)||75} pathOptions={{color:'#16a34a',fillColor:'#22c55e',fillOpacity:.08,weight:1.25}}/>}</React.Fragment>)}</MapContainer></div><aside className="mapPointList"><h3>Pontos da instalação</h3>{farm.latitude&&farm.longitude&&<button onClick={()=>setFocus([Number(farm.latitude),Number(farm.longitude)])}><span className="pointDot farm"/>Fazenda<span>{farm.nome}</span></button>}{equips.map(e=><button key={e.id} onClick={()=>setFocus([Number(e.latitude),Number(e.longitude)])}><span className={`pointDot ${e.tipo?.includes('4102')?'antenna':e.tipo?.includes('8002')?'processor':'other'}`}/>{e.apelido||e.codigo_original||e.tipo}<span>{e.local_nome||'sem local'} • {Number(e.latitude).toFixed(5)}, {Number(e.longitude).toFixed(5)}</span><em onClick={(event)=>{event.stopPropagation();openMaps(e.latitude,e.longitude)}}>Maps</em></button>)}</aside></div><div className="mapSummary"><div><b>{all.length}</b><span>equipamentos mapeados</span></div><div><b>{all.filter(e=>e.tipo?.includes('4102')).length}</b><span>antenas</span></div><div><b>{all.filter(e=>e.tipo?.includes('8002')).length}</b><span>processadores</span></div></div>{!all.length&&<Empty icon={MapIcon} title="Nenhum equipamento no mapa" text="Cadastre e posicione os equipamentos na aba Equipamentos."/>}</section>
}
function VisitasFazenda({farm,data,openNew,canEdit=true}){const [viewing,setViewing]=useState(null),[editing,setEditing]=useState(null);const visits=data.visitas.filter(v=>v.fazenda_id===farm.id); return <section className="panel"><div className="sectionTitle"><h2>Visitas e registros</h2>{canEdit&&<button className="btn primary" onClick={openNew}><Plus size={17}/> Nova visita</button>}</div>{!canEdit&&<PermissionNotice/>}<div className="timeline">{visits.map(v=><div className="visit actionVisit" key={v.id}><div className="dot"/><h3>{v.tipo} • {brDate(v.data_visita)}</h3><p><b>Resumo:</b> {v.resumo||'-'}</p>{v.pendencias&&<p><b>Pendências:</b> {v.pendencias}</p>}<div className="visitActionsText"><button className="btn light" onClick={()=>setViewing(v)}><Info size={15}/> Visualizar</button>{canEdit&&<button className="btn light" onClick={()=>setEditing(v)}><Pencil size={15}/> Editar</button>}{canEdit&&<button className="btn light dangerInline" onClick={()=>data.delVisita(v.id)}><Trash2 size={15}/> Excluir</button>}</div></div>)}</div>{visits.length===0&&<Empty icon={CalendarDays} title="Nenhuma visita registrada" text="Registre instalação, diagnóstico, retorno ou suporte."/>}{viewing&&<Modal title={`${viewing.tipo} • ${brDate(viewing.data_visita)}`} onClose={()=>setViewing(null)}><div className="modalBody"><InfoCard title="Detalhes da visita" rows={[['Resumo',viewing.resumo],['Problemas',viewing.problemas],['Solução',viewing.solucao],['Pendências',viewing.pendencias],['Próxima ação',viewing.proxima_acao]]}/></div></Modal>}{editing&&canEdit&&<VisitModal farm={farm} visit={editing} onClose={()=>setEditing(null)} onSave={async(r)=>{await data.saveVisita(r);setEditing(null)}}/>}</section>}
function VisitModal({farm,visit={},onClose,onSave}){const [form,setForm]=useState({id:visit.id||uid(),fazenda_id:farm.id,tipo:visit.tipo||'Instalação',data_visita:visit.data_visita||todayInput(),resumo:visit.resumo||'',problemas:visit.problemas||'',solucao:visit.solucao||'',pendencias:visit.pendencias||'',proxima_acao:visit.proxima_acao||'',created_at:visit.created_at||nowISO()}); const set=(k,v)=>setForm({...form,[k]:v}); return <Modal title={visit.id?'Editar visita':'Nova visita'} onClose={onClose}><form className="form modern compactVisitForm" onSubmit={e=>{e.preventDefault();onSave(form)}}><div className="grid2"><Field label="Tipo"><select value={form.tipo} onChange={e=>set('tipo',e.target.value)}>{VISIT_TYPES.map(t=><option key={t}>{t}</option>)}</select></Field><Field label="Data"><input type="date" value={form.data_visita} onChange={e=>set('data_visita',e.target.value)}/></Field></div><Field label="Resumo da visita"><textarea value={form.resumo} onChange={e=>set('resumo',e.target.value)} placeholder="Ex.: base instalada, antena posicionada, testes feitos..."/></Field><Field label="Pendências / próxima ação"><textarea value={form.pendencias} onChange={e=>set('pendencias',e.target.value)} placeholder="Deixe em branco se não houver pendência."/></Field><details className="advancedVisit"><summary>Campos técnicos opcionais</summary><Field label="Problemas encontrados"><textarea value={form.problemas} onChange={e=>set('problemas',e.target.value)}/></Field><Field label="Solução aplicada"><textarea value={form.solucao} onChange={e=>set('solucao',e.target.value)}/></Field><Field label="Próxima ação detalhada"><textarea value={form.proxima_acao} onChange={e=>set('proxima_acao',e.target.value)}/></Field></details><button className="btn primary full"><Save size={18}/> {visit.id?'Atualizar visita':'Salvar visita'}</button></form></Modal>}

function ReportPreview({farm,equips,visits,checks,mapped}){
  const farmPoint=farm.latitude&&farm.longitude?[Number(farm.latitude),Number(farm.longitude)]:null;
  const points=[farmPoint,...mapped.map(e=>[Number(e.latitude),Number(e.longitude)])].filter(Boolean);
  const center=points[0]||farmLatLng(farm);
  return <article className="printReport professionalReport reportPreview"><header className="reportHeader"><Logo/><div><span>RELATÓRIO TÉCNICO DE INSTALAÇÃO E CAMPO</span><small>Prévia conforme a fazenda selecionada</small></div></header><section className="reportCover"><div><span className="reportTag">CONTROLTECH ASSIST</span><h1>{farm.nome}</h1><p>{farm.cidade||'Cidade não informada'} / {getFarmUF(farm)||'-'}</p></div><div className="reportStatus"><b>{farm.status||'Não informado'}</b><span>Situação da operação</span></div></section><div className="reportMetrics"><div><b>{num(farm.qtd_colares_prevista)}</b><span>Colares previstos</span></div><div><b>{num(farm.qtd_colares_instalada)}</b><span>Colares instalados</span></div><div><b>{equips.length}</b><span>Equipamentos</span></div><div><b>{visits.length}</b><span>Visitas registradas</span></div><div><b>{serviceDurationLabel(farm)}</b><span>Tempo de servico</span></div></div><section className="reportSection"><h2>Dados da fazenda</h2><div className="reportInfoGrid"><div><span>Central</span><b>{farm.central||'-'}</b></div><div><span>Regional</span><b>{farm.regional_nome||'-'}</b></div><div><span>Responsavel</span><b>{farm.responsavel||'-'}</b></div><div><span>Telefone</span><b>{farm.telefone||'-'}</b></div><div><span>Veterinario/Apoio</span><b>{farm.veterinario_apoio||'-'}</b></div><div><span>Endereco</span><b>{farm.endereco||'-'}</b></div><div><span>Inicio do servico</span><b>{brDateTime(farm.servico_inicio_em)}</b></div><div><span>Fim do servico</span><b>{brDateTime(farm.servico_fim_em)}</b></div><div><span>Responsavel tecnico</span><b>{farm.servico_responsavel||'-'}</b></div></div></section>{points.length>0&&<section className="reportSection"><h2>Mapa técnico</h2><div className="reportMap"><MapContainer center={center} zoom={17} className="bigMap" scrollWheelZoom={false}><HybridLayers layer="hibrido"/><FitBounds points={points} trigger={points.length}/>{farmPoint&&<Marker position={farmPoint} icon={farmMarkerIcon(farm)}/>} {mapped.map(e=><Marker key={e.id} position={[Number(e.latitude),Number(e.longitude)]} icon={equipmentMarkerIcon(e)}/>)}</MapContainer></div></section>}<section className="reportSection"><h2>Equipamentos e coordenadas</h2>{equips.length?<div className="reportEquipmentList">{equips.slice(0,8).map((e,i)=><article key={e.id}><div className="reportEquipIndex">{i+1}</div><div><h3>{e.apelido||e.codigo_original||e.tipo}</h3><p>{e.tipo} - {e.status||'sem status'}</p><dl><div><dt>Local</dt><dd>{e.local_nome||'-'}</dd></div><div><dt>Código</dt><dd>{e.codigo_original||'-'}</dd></div><div><dt>Coordenadas</dt><dd>{e.latitude&&e.longitude?`${Number(e.latitude).toFixed(6)}, ${Number(e.longitude).toFixed(6)}`:'-'}</dd></div><div><dt>Raio</dt><dd>{e.tipo?.includes('4102')?`${Number(e.raio_metros)||75} m`:'-'}</dd></div></dl></div></article>)}</div>:<p className="sourceText">Nenhum equipamento registrado nesta fazenda.</p>}</section><section className="reportSection"><h2>Histórico de visitas</h2>{visits.length?<div className="visit">{visits.slice(0,4).map(v=><article key={v.id}><h3>{brDate(v.data_visita)} - {v.tipo}</h3><p>{v.resumo||'Sem resumo.'}</p>{v.pendencias&&<p className="reportPending"><b>Pendências:</b> {v.pendencias}</p>}</article>)}</div>:<p className="sourceText">Nenhuma visita registrada.</p>}</section><section className="reportSection"><h2>Checklists</h2>{checks.length?<div className="reportChecklist">{checks.slice(0,5).map(c=><div key={c.id}><b>{c.titulo}</b><span>{brDate(c.created_at)} - {c.status}</span></div>)}</div>:<p className="sourceText">Nenhum checklist salvo.</p>}</section></article>
}

function RelatorioFazenda({farm,data}){
  const equips=data.equipamentos.filter(e=>e.fazenda_id===farm.id),visits=data.visitas.filter(v=>v.fazenda_id===farm.id),checks=data.checklists.filter(c=>c.fazenda_id===farm.id),mapped=equips.filter(e=>e.latitude&&e.longitude);
  const [opts,setOpts]=useState({equip:true,visits:true,checks:true,pend:true});const toggle=k=>setOpts(o=>({...o,[k]:!o[k]}));
  const exportTsv=()=>{const rows=[['RELATÓRIO TÉCNICO',farm.nome],['Central',farm.central||''],['Regional',farm.regional_nome||''],['Veterinário/Apoio',farm.veterinario_apoio||''],['Responsável',farm.responsavel||''],['Cidade',`${farm.cidade||''} / ${getFarmUF(farm)}`],['Status',farm.status||''],['Inicio do servico',brDateTime(farm.servico_inicio_em)],['Fim do servico',brDateTime(farm.servico_fim_em)],['Duracao do servico',serviceDurationLabel(farm)],['Responsavel produtividade',farm.servico_responsavel||''],['Colares previstos',farm.qtd_colares_prevista||0],['Colares instalados',farm.qtd_colares_instalada||0],[],['EQUIPAMENTOS'],['Tipo','Código','Apelido','Local','Status','Raio (m)','Latitude','Longitude','Observações'],...equips.map(e=>[e.tipo,e.codigo_original,e.apelido,e.local_nome,e.status,e.raio_metros||'',e.latitude,e.longitude,e.observacoes||'']),[],['VISITAS'],['Data','Tipo','Resumo','Problemas','Solução','Pendências','Próxima ação'],...visits.map(v=>[v.data_visita,v.tipo,v.resumo,v.problemas,v.solucao,v.pendencias,v.proxima_acao])];download(`${farm.nome}-relatorio-tecnico.tsv`,rows.map(r=>r.join('\t')).join('\n'));notify('Arquivo TSV gerado.');};
  const printReport=()=>{
    const safe=v=>String(v===undefined||v===null||String(v).trim()===''?'-':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const points=[
      ...(farm.latitude&&farm.longitude?[{kind:'farm',label:farm.nome,lat:Number(farm.latitude),lng:Number(farm.longitude)}]:[]),
      ...mapped.map((e,i)=>({kind:e.tipo?.includes('4102')?'antenna':e.tipo?.includes('8002')?'processor':'other',label:e.apelido||e.codigo_original||e.tipo,lat:Number(e.latitude),lng:Number(e.longitude),index:i+1}))
    ].filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
    const coveragePoints=mapped.map((e,i)=>({label:e.apelido||e.codigo_original||e.tipo,lat:Number(e.latitude),lng:Number(e.longitude),radius:e.tipo?.includes('4102')?Number(e.raio_metros)||75:0,index:i+1})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.radius>0);
    const lats=points.map(p=>p.lat),lngs=points.map(p=>p.lng);
    const minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs);
    const centerLat=points.length?(minLat+maxLat)/2:0,maxRadiusMeters=Math.max(0,...coveragePoints.map(p=>p.radius));
    const metersPerLat=111320,metersPerLng=111320*Math.max(0.2,Math.abs(Math.cos(centerLat*Math.PI/180)));
    const latPad=Math.max((maxLat-minLat)*0.35,0.0018,(maxRadiusMeters/metersPerLat)*1.15),lngPad=Math.max((maxLng-minLng)*0.35,0.0018,(maxRadiusMeters/metersPerLng)*1.15);
    const bbox=points.length?[minLng-lngPad,minLat-latPad,maxLng+lngPad,maxLat+latPad]:null;
    const mapImg=bbox?`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox.join(',')}&bboxSR=4326&imageSR=4326&size=1000,430&format=png&f=image`:'';
    const coverageHtml=bbox?coveragePoints.map(p=>{const x=((p.lng-bbox[0])/(bbox[2]-bbox[0]))*100;const y=((bbox[3]-p.lat)/(bbox[3]-bbox[1]))*100;const w=Math.max(4,Math.min(100,((p.radius*2)/((bbox[2]-bbox[0])*metersPerLng))*100));const h=Math.max(4,Math.min(100,((p.radius*2)/((bbox[3]-bbox[1])*metersPerLat))*100));return `<span class="mapRadius" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"><i>${p.radius} m</i></span>`;}).join(''):'';
    const markerHtml=points.map(p=>{const x=((p.lng-bbox[0])/(bbox[2]-bbox[0]))*100;const y=((bbox[3]-p.lat)/(bbox[3]-bbox[1]))*100;return `<span class="mapPin ${p.kind}" style="left:${x}%;top:${y}%">${p.kind==='farm'?'F':p.index}</span>`;}).join('');
    const mapKey=points.map(p=>{const radius=p.kind==='antenna'?coveragePoints.find(c=>c.index===p.index)?.radius:0;return `<div><b class="${p.kind}">${p.kind==='farm'?'F':p.index}</b><span>${safe(p.label)}</span><small>${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}${radius?` • raio ${radius} m`:''}</small></div>`;}).join('');
    const mapStatsHtml=points.length?`<div class="mapStats"><span><b>${mapped.length}</b> item(ns) mapeado(s)</span><span><b>${coveragePoints.length}</b> raio(s) de cobertura</span><span><b>${maxRadiusMeters||'-'}${maxRadiusMeters?' m':''}</b> maior raio</span></div>`:'';
    const technicalMapHtml=points.length?`<section class="section"><h2>Mapa técnico da instalação</h2><div class="mapBox technicalMapPrint"><img src="${mapImg}" alt="Mapa técnico">${coverageHtml}${markerHtml}</div>${mapStatsHtml}<div class="mapKey">${mapKey}</div></section>`:'';
    const equipmentRows=equips.map((e,i)=>`<tr><td>${i+1}</td><td><b>${safe(e.apelido||e.codigo_original||e.tipo)}</b><small>${safe(e.tipo)} - ${safe(e.status)}</small></td><td>${safe(e.local_nome)}</td><td>${safe(e.codigo_original)}</td><td>${e.latitude&&e.longitude?`${Number(e.latitude).toFixed(6)}, ${Number(e.longitude).toFixed(6)}`:'-'}</td><td>${e.tipo?.includes('4102')?`${Number(e.raio_metros)||75} m`:'-'}</td></tr>`).join('');
    const visitRows=visits.map(v=>`<article><h3>${safe(brDate(v.data_visita))} - ${safe(v.tipo)}</h3><p>${safe(v.resumo||'Sem resumo.')}</p>${opts.pend&&v.pendencias?`<p class="warn"><b>Pendências:</b> ${safe(v.pendencias)}</p>`:''}${v.solucao?`<p><b>Solução:</b> ${safe(v.solucao)}</p>`:''}</article>`).join('');
    const checkRows=checks.map(c=>`<tr><td>${safe(brDate(c.created_at))}</td><td>${safe(c.titulo)}</td><td>${safe(c.status)}</td><td>${safe(c.observacoes||'-')}</td></tr>`).join('');
    const predicted=num(farm.qtd_colares_prevista),installed=num(farm.qtd_colares_instalada),progress=predicted?Math.min(100,Math.round((installed/predicted)*100)):0;
    const mappedCount=mapped.length,missingCoords=equips.filter(e=>!e.latitude||!e.longitude).length,pendingVisits=visits.filter(v=>v.pendencias).length;
    const executiveHtml=`<section class="section executive"><h2>Resumo executivo</h2><p>${safe(farm.observacoes||`A fazenda ${farm.nome} está com status ${farm.status||'não informado'}, ${installed} de ${predicted} colares instalados, ${equips.length} equipamento(s) cadastrado(s), ${mappedCount} com coordenadas e ${visits.length} visita(s) registrada(s).`)}</p><div class="execGrid"><div><span>Progresso de colares</span><b>${predicted?`${progress}%`:'-'}</b></div><div><span>Equipamentos mapeados</span><b>${mappedCount}/${equips.length}</b></div><div><span>Pendências em visitas</span><b>${pendingVisits}</b></div><div><span>Checklists salvos</span><b>${checks.length}</b></div></div></section>`;
    const attentionItems=[
      missingCoords?`${missingCoords} equipamento(s) sem coordenadas no mapa técnico.`:'',
      !farm.servico_inicio_em||!farm.servico_fim_em?'Início ou fim do serviço ainda não informado para produtividade.':'',
      pendingVisits?`${pendingVisits} visita(s) possuem pendências registradas.`:'',
      !checks.length?'Nenhum checklist salvo para esta fazenda.':''
    ].filter(Boolean);
    const attentionHtml=attentionItems.length?`<section class="section attention"><h2>Pontos de atenção</h2><ul>${attentionItems.map(item=>`<li>${safe(item)}</li>`).join('')}</ul></section>`:'';
    const printPolish=`<style>@media screen{html{background:#475569}body{width:210mm;min-height:297mm;margin:18px auto!important;padding:14mm!important;background:#fff!important;box-shadow:0 24px 80px rgba(15,23,42,.35)}}@media print{html,body{width:auto!important;min-height:0!important;margin:0!important;padding:0!important;box-shadow:none!important;background:#fff!important}}body{counter-reset:sec;color:#0b1220;font-size:10.8px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.top{align-items:center;padding-bottom:10px;margin-bottom:12px}.brand img{width:34px;height:34px}.brand b{font-size:18px}.doccode{font-size:10px}.cover{display:grid;grid-template-columns:1fr auto;align-items:end;min-height:112px;margin:10px 0 12px;padding:16px 18px}.cover h1{font-size:26px;line-height:1.05;margin:8px 0 6px}.cover p{margin:0}.status{font-weight:800}.grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:10px 0 8px}.box{min-height:48px;background:#fff;border-color:#cbd5e1;padding:7px 8px}.box b{font-size:10px}.box span{font-size:10.2px}.metrics{grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:8px 0 14px}.metric{padding:8px 6px;background:#f0fdf4;border-color:#86efac}.metric b{font-size:20px;line-height:1.05}h2{font-size:14px;margin:14px 0 7px;color:#0f172a;display:flex;align-items:center;gap:7px}h2:before{counter-increment:sec;content:counter(sec);width:20px;height:20px;border-radius:6px;background:#dcfce7;color:#15803d;display:inline-grid;place-items:center;font-size:11px;font-weight:900}.section{margin-top:12px;break-inside:avoid}.executive{background:#f8fafc;border:1px solid #dbe4ef;border-radius:12px;padding:10px 12px}.executive p{margin:4px 0 0;color:#334155}.execGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}.execGrid div{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:7px}.execGrid span{display:block;color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase}.execGrid b{display:block;margin-top:3px;font-size:14px}.attention{border:1px solid #fed7aa;background:#fff7ed;border-radius:12px;padding:9px 12px}.attention ul{margin:5px 0 0;padding-left:18px}.attention li{margin:3px 0}.mapBox{height:225px;margin-top:6px}.mapKey{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.mapKey div{padding:6px}.mapKey small{font-size:9px}table{font-size:9.8px}thead{display:table-header-group}th{font-size:9.5px;letter-spacing:.02em}th,td{padding:5px 6px}td small{font-size:9px}.visit article{padding:7px 9px;margin:6px 0}.signature{margin-top:34px}.footer{margin-top:16px}.cover,.grid,.metrics,.executive,.attention,.mapBox,.mapKey,.signature{break-inside:avoid}@media print{.mapBox{height:220px}.section{break-inside:avoid-page}.footer{position:static}}</style>`;
    const technicalMapCss=`<style>.technicalMapPrint{isolation:isolate}.technicalMapPrint:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.02),rgba(15,23,42,.12));pointer-events:none}.mapRadius{position:absolute;transform:translate(-50%,-50%);border:2px solid rgba(22,163,74,.95);background:rgba(34,197,94,.22);border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.75),0 0 18px rgba(22,163,74,.35);z-index:1}.mapRadius i{position:absolute;right:3px;bottom:3px;background:rgba(255,255,255,.92);border:1px solid #bbf7d0;border-radius:999px;padding:2px 5px;color:#166534;font-size:8px;font-style:normal;font-weight:900}.mapPin{z-index:3}.mapStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:7px}.mapStats span{border:1px solid #dbe4ef;background:#f8fafc;border-radius:9px;padding:6px 8px;color:#475569;font-size:9px}.mapStats b{display:block;color:#0f172a;font-size:12px}.mapKey{margin-top:7px}.mapKey b.antenna{background:#16a34a}.mapKey b.processor{background:#2563eb}.mapKey b.other{background:#f59e0b}@media print{.mapRadius{border-width:1.5px}.mapRadius i{font-size:7px}.mapStats{break-inside:avoid}}</style>`;
    const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório técnico - ${safe(farm.nome)}</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;margin:0;background:#fff;font-size:11.5px;line-height:1.35}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #0f172a;padding-bottom:12px;break-inside:avoid}.brand{display:flex;align-items:center;gap:10px}.brand img{width:40px;height:40px}.brand b{font-size:20px}.brand span{display:block;color:#16a34a;font-weight:800}.doccode{text-align:right;color:#64748b}.cover{margin:14px 0;padding:18px;border-radius:16px;background:linear-gradient(135deg,#0f172a,#14532d);color:#fff;break-inside:avoid}.cover small{letter-spacing:.15em;color:#86efac;font-weight:800}.cover h1{font-size:28px;margin:6px 0 3px}.status{display:inline-block;margin-top:8px;padding:6px 10px;border:1px solid #ffffff44;border-radius:999px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 0}.box{border:1px solid #dbe4ef;border-radius:10px;padding:8px;background:#f8fafc}.box b,.box span{display:block}.box span{color:#475569;margin-top:2px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;break-inside:avoid}.metric{border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:10px;text-align:center}.metric b{font-size:21px;color:#15803d;display:block}h2{font-size:16px;margin:18px 0 7px;border-bottom:1px solid #dbe4ef;padding-bottom:5px}.section{break-inside:avoid-page}.mapBox{position:relative;height:260px;border:1px solid #dbe4ef;border-radius:14px;overflow:hidden;background:#eef2f7;break-inside:avoid}.mapBox img{width:100%;height:100%;object-fit:cover;display:block}.mapPin{position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:900;border:2px solid #fff;box-shadow:0 3px 10px #0008;font-size:11px}.mapPin.farm{background:#e11d48}.mapPin.antenna{background:#16a34a}.mapPin.processor{background:#2563eb}.mapPin.other{background:#f59e0b}.mapKey{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px;break-inside:avoid}.mapKey div{border:1px solid #dbe4ef;border-radius:10px;padding:7px;display:grid;grid-template-columns:26px 1fr;column-gap:7px}.mapKey b{grid-row:1/3;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff}.mapKey b.farm{background:#e11d48}.mapKey b.antenna{background:#16a34a}.mapKey b.processor{background:#2563eb}.mapKey b.other{background:#f59e0b}.mapKey span{font-weight:800}.mapKey small{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:7px;page-break-inside:auto}tr{break-inside:avoid;page-break-inside:avoid}th{background:#0f172a;color:#fff;text-align:left}th,td{padding:6px;border:1px solid #dbe4ef;vertical-align:top;font-size:10.5px}td small{display:block;color:#64748b;margin-top:2px}.visit article{border-left:4px solid #16a34a;background:#f8fafc;padding:8px 10px;margin:7px 0;break-inside:avoid}.visit h3{margin:0 0 3px}.visit p{margin:3px 0}.warn{background:#fffbeb;border-left:3px solid #f59e0b;padding:5px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:46px;margin-top:42px;break-inside:avoid}.signature div{border-top:1px solid #334155;text-align:center;padding-top:7px;color:#64748b}.footer{margin-top:20px;border-top:1px solid #dbe4ef;padding-top:6px;color:#64748b;display:flex;justify-content:space-between;font-size:10px;break-inside:avoid}@media print{.noPrint{display:none}}</style></head><body><header class="top"><div class="brand"><img src="/logo-symbol.svg" alt=""><div><b>ControlTech</b><span>Assist</span></div></div><div class="doccode"><b>RELATÓRIO TÉCNICO</b><br>Emissão: ${safe(new Date().toLocaleString('pt-BR'))}<br>Versão ${APP_VERSION}</div></header><section class="cover"><small>INSTALAÇÃO E CAMPO</small><h1>${safe(farm.nome)}</h1><p>${safe(farm.cidade||'Cidade não informada')} / ${safe(getFarmUF(farm)||'-')}</p><span class="status">${safe(farm.status||'Não informado')}</span></section><section class="grid"><div class="box"><b>Central</b><span>${safe(farm.central)}</span></div><div class="box"><b>Regional</b><span>${safe(farm.regional_nome)}</span></div><div class="box"><b>Veterinário/Apoio</b><span>${safe(farm.veterinario_apoio)}</span></div><div class="box"><b>Responsável</b><span>${safe(farm.responsavel)}</span></div><div class="box"><b>Telefone</b><span>${safe(farm.telefone)}</span></div><div class="box"><b>Endereço</b><span>${safe(farm.endereco)}</span></div><div class="box"><b>Inicio do servico</b><span>${safe(brDateTime(farm.servico_inicio_em))}</span></div><div class="box"><b>Fim do servico</b><span>${safe(brDateTime(farm.servico_fim_em))}</span></div><div class="box"><b>Responsavel tecnico</b><span>${safe(farm.servico_responsavel)}</span></div></section><section class="metrics"><div class="metric"><b>${num(farm.qtd_colares_prevista)}</b>Colares previstos</div><div class="metric"><b>${num(farm.qtd_colares_instalada)}</b>Colares instalados</div><div class="metric"><b>${equips.length}</b>Equipamentos</div><div class="metric"><b>${visits.length}</b>Visitas</div><div class="metric"><b>${safe(serviceDurationLabel(farm))}</b>Duracao</div></section><section class="section"><h2>Resumo executivo</h2><p>${safe(farm.observacoes||'Instalação registrada no ControlTech Assist. Consulte os quadros abaixo para equipamentos, coordenadas, visitas e pendências.')}</p></section>${points.length?`<section class="section"><h2>Mapa técnico da instalação</h2><div class="mapBox"><img src="${mapImg}" alt="Mapa técnico">${markerHtml}</div><div class="mapKey">${mapKey}</div></section>`:''}${opts.equip?`<section><h2>Equipamentos e coordenadas</h2><table><thead><tr><th>#</th><th>Equipamento</th><th>Local</th><th>Código</th><th>Coordenadas</th><th>Raio</th></tr></thead><tbody>${equipmentRows||'<tr><td colspan="6">Nenhum equipamento registrado.</td></tr>'}</tbody></table></section>`:''}${opts.visits?`<section><h2>Histórico de visitas</h2><div class="visit">${visitRows||'<p>Nenhuma visita registrada.</p>'}</div></section>`:''}${opts.checks?`<section><h2>Checklists</h2><table><thead><tr><th>Data</th><th>Checklist</th><th>Status</th><th>Observações</th></tr></thead><tbody>${checkRows||'<tr><td colspan="4">Nenhum checklist registrado.</td></tr>'}</tbody></table></section>`:''}<section class="signature"><div>Responsável técnico</div><div>Coordenação / Cliente</div></section><footer class="footer"><span>ControlTech Assist - Documento técnico de campo</span><span>${safe(farm.nome)}</span></footer><script>window.onload=()=>setTimeout(()=>window.print(),350)</script></body></html>`;
    const polishedHtml=html.replace('</head>',`${printPolish}${technicalMapCss}</head>`).replace(/<section class="section"><h2>Resumo executivo<\/h2><p>[\s\S]*?<\/p><\/section>/,`${executiveHtml}${attentionHtml}`).replace(/<section class="section"><h2>Mapa técnico da instalação<\/h2>[\s\S]*?<\/section>/,technicalMapHtml).replaceAll('Inicio do servico','Início do serviço').replaceAll('Fim do servico','Fim do serviço').replaceAll('Responsavel tecnico','Responsável técnico').replaceAll('Duracao','Duração');
    const win=window.open('','_blank');if(!win){notify('Permita pop-ups para gerar o relatório.','error');return;}win.document.write(polishedHtml);win.document.close();
  };
  const share=async()=>{const text=`RELATÓRIO TÉCNICO — ${farm.nome}\n${farm.cidade||''} / ${getFarmUF(farm)}\nCentral: ${farm.central||'-'}\nRegional: ${farm.regional_nome||'-'}\nStatus: ${farm.status||'-'}\nServico: ${brDateTime(farm.servico_inicio_em)} ate ${brDateTime(farm.servico_fim_em)} (${serviceDurationLabel(farm)})\nColares: ${num(farm.qtd_colares_instalada)} / ${num(farm.qtd_colares_prevista)}\nEquipamentos: ${equips.length}\nPendências: ${visits.filter(v=>v.pendencias).length}`;try{if(navigator.share)await navigator.share({title:`Relatório técnico - ${farm.nome}`,text});else{await navigator.clipboard.writeText(text);notify('Resumo copiado para compartilhar.')}}catch{}};
  return <section className="panel reportPanel"><div className="sectionTitle noPrint"><div><h2>Relatório técnico para coordenação</h2><p>Documento limpo com logo, cores, dados organizados e sem captura da tela do app.</p></div><div className="headActions"><button className="btn light" onClick={share}><Share2 size={17}/> Compartilhar resumo</button><button className="btn primary" onClick={printReport}><Printer size={17}/> Gerar relatório / PDF</button><button className="btn light" onClick={exportTsv}><FileDown size={17}/> Exportar dados</button></div></div><div className="reportOptions noPrint">{[['equip','Equipamentos'],['visits','Visitas'],['checks','Checklists'],['pend','Pendências']].map(([k,l])=><label className="optionCheck" key={k}><input type="checkbox" checked={opts[k]} onChange={()=>toggle(k)}/>{l}</label>)}</div><ReportPreview farm={farm} equips={equips} visits={visits} checks={checks} mapped={mapped}/></section>}
function CoberturaAssist(){const [tipo,setTipo]=useState('interna'),[comp,setComp]=useState(120),[larg,setLarg]=useState(40),[obst,setObst]=useState('medio'); const raio=tipo==='externa'?250:75; const diam=raio*2; const precisa=Math.max(1,Math.ceil(num(comp)/diam)*Math.ceil(num(larg)/diam)); const risco=obst==='alto'?'Alto':obst==='medio'?'Médio':'Baixo'; return <section className="panel"><div className="sectionTitle"><h2><Ruler size={20}/> Planejador rápido de antena</h2><span className="pill">apoio de campo</span></div><div className="grid4"><Field label="Tipo"><select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="interna">Interna</option><option value="externa">Externa</option></select></Field><Field label="Comprimento aproximado (m)"><input type="number" value={comp} onChange={e=>setComp(e.target.value)}/></Field><Field label="Largura aproximada (m)"><input type="number" value={larg} onChange={e=>setLarg(e.target.value)}/></Field><Field label="Obstáculos"><select value={obst} onChange={e=>setObst(e.target.value)}><option value="baixo">Baixo</option><option value="medio">Médio</option><option value="alto">Alto/metálico</option></select></Field></div><div className="coverageResult"><RadioTower size={28}/><div><b>Estimativa inicial: {precisa} antena(s)</b><span>Raio usado: {raio} m • risco de interferência: {risco}. Validar com Reader/Tags analysis antes de encerrar.</span></div></div></section>}

function Instalacao({data}){
  const [farmId,setFarmId]=useState(''),[templateId,setTemplateId]=useState('pre'),[checked,setChecked]=useState({}),[obs,setObs]=useState('');
  useEffect(()=>{if(!farmId&&data.fazendas[0])setFarmId(data.fazendas[0].id)},[data.fazendas.length,farmId]);
  const farm=data.fazendas.find(f=>f.id===farmId);
  const template=QUICK_CHECKLISTS.find(t=>t.id===templateId)||QUICK_CHECKLISTS[0];
  const done=template.items.filter((_,i)=>checked[i]).length;
  const save=async()=>{if(!farm){notify('Selecione uma fazenda para salvar o checklist.','warning');return;}const items=template.items.map((label,i)=>({label,ok:Boolean(checked[i])}));await data.saveChecklist({id:uid(),fazenda_id:farm.id,tipo:template.id,titulo:template.title,itens_json:items,status:items.every(i=>i.ok)?'Completo':'Parcial',observacoes:obs,created_at:nowISO()});setChecked({});setObs('');notify('Checklist de instalação salvo na fazenda.');};
  const pending=data.fazendas.filter(f=>['Não iniciada','Em andamento','Com pendência','Aguardando validação'].includes(f.status||''));
  return <div><PageHead eyebrow="Instalação guiada" title="Executar instalação em campo" desc="Fluxo rápido para abrir a fazenda, seguir checklist, planejar antenas e deixar histórico salvo."><select value={farmId} onChange={e=>setFarmId(e.target.value)}><option value="">Selecione a fazenda...</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select></PageHead><div className="statsGrid"><Stat icon={Route} label="fazendas em aberto" value={pending.length}/><Stat icon={Cpu} label="equipamentos" value={data.equipamentos.length}/><Stat icon={ClipboardCheck} label="checklists salvos" value={data.checklists.length}/><Stat icon={CalendarDays} label="visitas" value={data.visitas.length}/></div>{!data.fazendas.length&&<Empty icon={Building2} title="Nenhuma fazenda cadastrada" text="Cadastre uma fazenda antes de iniciar uma instalação guiada."/>}{farm&&<section className="panel installFocus"><div><span className="eyebrow">Fazenda selecionada</span><h2>{farm.nome}</h2><p>{farm.cidade||'Cidade não informada'} • {farm.central||'Central não informada'} • {farm.status||'Sem status'}</p></div><div className="installBadges"><span>{data.equipamentos.filter(e=>e.fazenda_id===farm.id).length} equipamento(s)</span><span>{data.visitas.filter(v=>v.fazenda_id===farm.id).length} visita(s)</span></div></section>}<section className="panel"><div className="sectionTitle"><div><h2><ClipboardList size={20}/> Checklist de instalação</h2><p className="sectionHint">Escolha o roteiro e salve o resultado no histórico da fazenda.</p></div><select value={templateId} onChange={e=>{setTemplateId(e.target.value);setChecked({})}}>{QUICK_CHECKLISTS.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></div><div className="manualSource">{template.source}</div><div className="progress"><span style={{width:`${template.items.length?Math.round(done/template.items.length*100):0}%`}}/></div><div className="checkPanel">{template.items.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(checked[i])} onChange={()=>setChecked({...checked,[i]:!checked[i]})}/><span>{item}</span></label>)}</div><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observações rápidas da instalação"/><button className="btn primary" onClick={save} disabled={!farm}><Save size={17}/> Salvar checklist na fazenda</button></section><CoberturaAssist/><section className="panel"><div className="sectionTitle"><h2>Fazendas em andamento</h2></div><div className="list">{pending.slice(0,6).map(f=><div className="listItem" key={f.id}><Route size={19}/><div><b>{f.nome}</b><span>{f.cidade||'-'} • {f.status||'-'} • {data.equipamentos.filter(e=>e.fazenda_id===f.id).length} equipamento(s)</span></div></div>)}</div>{!pending.length&&<Empty icon={CheckCircle2} title="Nada pendente" text="Não há fazendas em aberto pelos status atuais."/>}</section></div>
}

function Diagnostico({data}){const [tab,setTab]=useState('sintomas'); const tabs=[['sintomas',HelpCircle,'Sintomas'],['leds',Cpu,'LEDs'],['can',AlertTriangle,'CAN bus'],['suporte',LifeBuoy,'Antes do suporte']]; return <div><PageHead eyebrow="Diagnóstico técnico" title="Resolver problema no campo" desc="Fluxos práticos baseados nos manuais VP8002, VP4102 e Nedap Now."/><div className="tabs">{tabs.map(([id,Icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</div>{tab==='sintomas'&&<Sintomas data={data}/>} {tab==='leds'&&<LedDiag/>} {tab==='can'&&<CanDiag/>} {tab==='suporte'&&<AntesSuporte data={data}/>}</div>}
function Sintomas({data}){const [q,setQ]=useState(''),[selected,setSelected]=useState(SYMPTOMS[0]),[farm,setFarm]=useState(''),[obs,setObs]=useState(''); const list=SYMPTOMS.filter(s=>[s.title,s.category,s.cause].join(' ').toLowerCase().includes(q.toLowerCase())); const save=()=>{data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:selected.category,sintoma:selected.title,resultado:selected.cause,acoes_realizadas:selected.action,observacoes:obs,created_at:nowISO()}); setObs(''); notify('Diagnóstico registrado.')}; return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar sintoma..."/></div></div><div className="diagLayout"><div className="diagList">{list.map(s=>{const I=s.icon;return <button key={s.id} className={selected.id===s.id?'active':''} onClick={()=>setSelected(s)}><I size={18}/><span><b>{s.title}</b><small>{s.category}</small></span></button>})}</div><div className="diagDetail"><span className="pill">{selected.category}</span><h2>{selected.title}</h2><p className="cause">{selected.cause}</p><h3>O que verificar</h3><ol>{selected.checks.map(c=><li key={c}>{c}</li>)}</ol><div className="callout"><b>Próxima ação:</b> {selected.action}</div><p className="sourceText">{selected.source}</p><div className="saveDiag"><select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="O que você fez no campo?"/><button className="btn primary" onClick={save}><Save size={17}/> Registrar diagnóstico</button></div></div></div></section>}
function LedDiag(){const [q,setQ]=useState(''); const list=LED_DIAGNOSTICS.filter(l=>[l.led,l.cor,l.modo,l.estado,l.acao].join(' ').toLowerCase().includes(q.toLowerCase())); return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar LED, cor ou modo..."/></div></div><div className="ledGrid">{list.map((l,i)=><div className="ledCard" key={i}><div className={`ledDot ${l.cor.toLowerCase().includes('verde')?'green':l.cor.toLowerCase().includes('vermelho')?'red':l.cor.toLowerCase().includes('laranja')?'orange':l.cor.toLowerCase().includes('azul')?'blue':''}`}/><h3>{l.led}</h3><p><b>{l.cor}</b> • {l.modo}</p><span>{l.estado}</span><small>{l.acao}</small></div>)}</div><p className="sourceText">{SOURCES.vp8002}</p></section>}
function CanDiag(){const [q,setQ]=useState(''); const list=CAN_ERRORS.filter(c=>[c.code,c.bus,c.desc,c.solution].join(' ').toLowerCase().includes(q.toLowerCase())); return <section className="panel"><div className="toolbar"><div className="search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Digite código, ex: 02, 09, 16..."/></div></div><div className="canGrid">{list.map(c=><div className="canCard" key={c.code}><b>{c.code}</b><span>{c.bus}</span><h3>{c.desc}</h3><p>{c.solution}</p></div>)}</div><p className="sourceText">{SOURCES.vp8002}</p></section>}
function AntesSuporte({data}){const [checked,setChecked]=useState({}),[farm,setFarm]=useState(''),[obs,setObs]=useState(''); const done=SUPPORT_CHECKS.filter((_,i)=>checked[i]).length; const save=()=>{data.saveDiagnostico({id:uid(),fazenda_id:farm||null,categoria:'Antes de chamar suporte',sintoma:'Checklist de suporte',resultado:`${done}/${SUPPORT_CHECKS.length} itens conferidos`,acoes_realizadas:SUPPORT_CHECKS.filter((_,i)=>checked[i]).join('; '),observacoes:obs,created_at:nowISO()}); notify('Checklist de suporte registrado.')}; return <section className="panel"><div className="supportHead"><LifeBuoy size={28}/><div><h2>Antes de chamar suporte</h2><p>Use isso para chegar no suporte com informação organizada e não perder tempo no campo.</p></div><div className="circleProgress"><b>{done}</b><span>/{SUPPORT_CHECKS.length}</span></div></div><div className="checkPanel">{SUPPORT_CHECKS.map((item,i)=><label className="checkItem" key={item}><input type="checkbox" checked={Boolean(checked[i])} onChange={()=>setChecked({...checked,[i]:!checked[i]})}/><span>{item}</span></label>)}</div><div className="saveDiag"><select value={farm} onChange={e=>setFarm(e.target.value)}><option value="">Sem vincular fazenda</option>{data.fazendas.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select><textarea value={obs} onChange={e=>setObs(e.target.value)} placeholder="Resumo para enviar ao suporte"/><button className="btn primary" onClick={save}><Save size={17}/> Registrar checklist</button></div></section>}

function Guia(){return <div><PageHead eyebrow="Base técnica offline" title="Guia rápido" desc="Conteúdo prático extraído dos manuais enviados e traduzido para uso no campo."/><div className="knowledgeGrid">{INSTALL_GUIDES.map(g=>{const I=g.icon;return <article className="knowledge" key={g.id}><I size={28}/><h3>{g.title}</h3><p>{g.desc}</p><span>{g.source}</span>{g.phases.map(p=><details key={p.title}><summary>{p.title}</summary><ul>{p.items.map(i=><li key={i}>{i}</li>)}</ul></details>)}</article>})}</div></div>}
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
    <PageHead eyebrow="Produtividade" title="Controle de produtividade" desc="Meça sua rotina por horas úteis de trabalho, compare períodos e acompanhe produtividade por quantidade de colares."><button className="btn light" onClick={exportData}><Download size={18}/> Exportar análise</button></PageHead>
    <div className="statsGrid"><Stat icon={Building2} label="fazendas concluídas" value={farms.length}/><Stat icon={Clock} label="média por fazenda" value={avgLabel}/><Stat icon={Hash} label="colares/dia útil" value={collarsPerDay?collarsPerDay.toFixed(1):'-'} tone="green"/><Stat icon={PlayCircle} label="em andamento" value={inProgress.length}/></div>
    <section className="panel productivityFilters">
      <div className="sectionTitle"><div><h2><Filter size={20}/> Filtros</h2><p className="sectionHint">Use o período de conclusão para fechar produtividade mensal, anual ou por responsável.</p></div></div>
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
      <section className="panel prodChart"><div className="sectionTitle"><div><h2><BarChart3 size={20}/> Horas úteis por mês</h2><p className="sectionHint">Linha mensal com a soma das horas úteis das fazendas finalizadas no filtro.</p></div><span className="pill">{(totalHours/dailyHours).toFixed(1)} dias úteis</span></div><ProductivityLineChart rows={monthlyHours}/></section>
      <section className="panel prodChart"><div className="sectionTitle"><div><h2><Gauge size={20}/> Tempo médio por colares</h2><p className="sectionHint">Média em dias úteis por faixa de colares instalados ou previstos.</p></div></div><ProductivityBars rows={buckets} suffix=" d" decimals={1}/><div className="prodMiniBars"><span>Instalações por mês</span><ProductivityBars rows={monthlyCount}/></div></section>
    </div>
    <section className="panel prodInsight"><div className="sectionTitle"><div><h2><ScanLine size={20}/> Leitura rápida</h2><p className="sectionHint">Resumo operacional com base na jornada selecionada.</p></div></div><div className="insightGrid"><div><span>Horas úteis no filtro</span><b>{totalHours?`${totalHours.toFixed(1)} h`:'-'}</b></div><div><span>Dias úteis equivalentes</span><b>{totalHours?(totalHours/dailyHours).toFixed(1):'-'}</b></div><div><span>Tempo corrido registrado</span><b>{totalElapsedHours?`${totalElapsedHours.toFixed(1)} h`:'-'}</b></div><div><span>Média de colares/fazenda</span><b>{farms.length?(totalCollars/farms.length).toFixed(1):'-'}</b></div></div></section>
    <section className="panel"><div className="sectionTitle"><div><h2><ClipboardList size={20}/> Fazendas analisadas</h2><p className="sectionHint">A produtividade usa apenas fazendas com início, fim e horas dentro da jornada configurada.</p></div><span className="pill">{totalCollars} colares</span></div>{farms.length?<div className="prodTable"><table><thead><tr><th>Fazenda</th><th>Período</th><th>Horas úteis</th><th>Tempo corrido</th><th>Colares/dia útil</th><th>Responsável</th><th></th></tr></thead><tbody>{farms.map(f=>{const useful=workedHoursFor(f),collars=collarsFor(f);return <tr key={f.id}><td><b>{f.nome}</b><span>{f.cidade||'-'} • {f.central||'-'}</span></td><td>{brDate(f.servico_inicio_em)}<span>até {brDate(f.servico_fim_em)}</span></td><td>{workDurationLabel(useful,workConfig)}</td><td>{serviceDurationLabel(f)}</td><td>{useful?(collars/(useful/dailyHours)).toFixed(1):'-'}<span>{collars} colares</span></td><td>{f.servico_responsavel||f.regional_nome||f.responsavel||'-'}</td><td><button className="btn light" onClick={()=>onOpen(f.id)}>Abrir</button></td></tr>})}</tbody></table></div>:<Empty icon={Clock} title="Sem dados de produtividade" text="Abra uma fazenda e registre início e fim do serviço para gerar os gráficos."/>}</section>
    {inProgress.length>0&&<section className="panel"><div className="sectionTitle"><div><h2><PlayCircle size={20}/> Serviços em andamento</h2><p className="sectionHint">Fazendas iniciadas e ainda sem data de fim. A prévia usa a mesma jornada.</p></div></div><div className="serviceOpenList">{inProgress.map(f=><button key={f.id} onClick={()=>onOpen(f.id)}><Clock size={18}/><span><b>{f.nome}</b><small>{brDateTime(f.servico_inicio_em)} • {workDurationLabel(activeHoursFor(f),workConfig)}</small></span></button>)}</div></section>}
  </div>
}

function Relatorios({data,onOpen}){
  const [central,setCentral]=useState('Todas'),[farmId,setFarmId]=useState(''),[q,setQ]=useState('');
  const fazendasBase=data.fazendas.filter(f=>central==='Todas'||(f.central||'')===central||(!f.central&&central.startsWith('Outra')));
  const fazendas=fazendasBase.filter(f=>[f.nome,f.cidade,f.central,f.regional_nome,f.responsavel,f.veterinario_apoio,f.status].join(' ').toLowerCase().includes(q.toLowerCase()));
  const selected=fazendas.find(f=>f.id===farmId)||fazendas[0]||null;
  const exportGeral=()=>{const rows=[['Central','Fazenda','Cidade','Regional','Veterinario/Apoio','Responsavel','Status','Inicio servico','Fim servico','Duracao','Colares previstos','Colares instalados','Equipamentos','Visitas'],...fazendas.map(f=>[f.central,f.nome,f.cidade,f.regional_nome,f.veterinario_apoio,f.responsavel,f.status,brDateTime(f.servico_inicio_em),brDateTime(f.servico_fim_em),serviceDurationLabel(f),f.qtd_colares_prevista,f.qtd_colares_instalada,data.equipamentos.filter(e=>e.fazenda_id===f.id).length,data.visitas.filter(v=>v.fazenda_id===f.id).length])]; download('relatorio-geral-fazendas.tsv', rows.map(r=>r.join(String.fromCharCode(9))).join(String.fromCharCode(10)));};
  const alta=data.fazendas.filter(f=>f.central==='Alta Genetics').length, genex=data.fazendas.filter(f=>f.central==='Genex Brasil').length;
  return <div><PageHead eyebrow="Relatórios" title="Relatório por fazenda" desc="Escolha a fazenda na lateral e veja o documento técnico sem perder o contexto."><button className="btn light" onClick={exportGeral}><Download size={18}/> Exportar geral</button>{selected&&<button className="btn primary" onClick={()=>onOpen(selected.id)}><FileText size={18}/> Abrir fazenda</button>}</PageHead><div className="statsGrid"><Stat icon={Building2} label="Alta Genetics" value={alta} tone="green"/><Stat icon={ShieldCheck} label="Genex Brasil" value={genex}/><Stat icon={MapPinned} label="fazendas no filtro" value={fazendas.length}/><Stat icon={Hash} label="colares instalados" value={fazendas.reduce((a,f)=>a+num(f.qtd_colares_instalada),0)}/></div><div className="reportWorkspace"><aside className="reportFarmRail"><div className="railHeader"><div><h2><FileText size={20}/> Fazendas</h2><span>{fazendas.length} no filtro atual</span></div></div><div className="search reportSearch"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar fazenda..."/></div><select className="reportCentralSelect" value={central} onChange={e=>{setCentral(e.target.value);setFarmId('')}}><option>Todas</option>{CENTRAIS.map(c=><option key={c}>{c}</option>)}</select><div className="reportFarmList">{fazendas.map(f=>{const active=selected?.id===f.id;const eq=data.equipamentos.filter(e=>e.fazenda_id===f.id).length;const visits=data.visitas.filter(v=>v.fazenda_id===f.id).length;return <button key={f.id} className={active?'active':''} onClick={()=>setFarmId(f.id)}><b>{f.nome}</b><span>{f.cidade||'Cidade não informada'} - {f.central||'Central não informada'}</span><small>{eq} equip. - {visits} visita(s) - {f.status||'Sem status'}</small></button>})}</div>{!fazendas.length&&<Empty icon={FileText} title="Nada no filtro" text="Ajuste a busca ou a central para selecionar uma fazenda."/>}</aside><main className="reportDocumentPane">{selected?<><div className="reportSelectedHeader noPrint"><div><span className="eyebrow">Relatório selecionado</span><h2>{selected.nome}</h2><p>{selected.cidade||'Cidade não informada'} - {selected.central||'Central não informada'} - {selected.status||'Sem status'}</p></div><div className="reportSelectedStats"><span>{data.equipamentos.filter(e=>e.fazenda_id===selected.id).length} equipamentos</span><span>{data.visitas.filter(v=>v.fazenda_id===selected.id).length} visitas</span><span>{data.checklists.filter(c=>c.fazenda_id===selected.id).length} checklists</span></div></div><RelatorioFazenda farm={selected} data={data}/></>:<Empty icon={FileText} title="Nenhuma fazenda para relatório" text="Cadastre uma fazenda ou ajuste os filtros para visualizar o relatório técnico."/>}</main></div></div>
}
function Field({label,icon:Icon,children}){return <label className="field"><span>{Icon&&<Icon size={15}/>} {label}</span>{children}</label>}
function Modal({title,onClose,children}){return <div className="modalBackdrop"><div className="modal"><header><h2>{title}</h2><button onClick={onClose}><X size={20}/></button></header>{children}</div></div>}
function download(filename, text){const blob=new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);}

createRoot(document.getElementById('root')).render(<App/>);
