import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { checklistTemplates } from './data/checklists.js';
import { troubleshootingFlows } from './data/troubleshooting.js';
import { knowledgeBase } from './data/knowledge.js';
import { hasSupabaseConfig, supabase } from './lib/supabase.js';
import { makeId, nowIso, readLocal, writeLocal } from './lib/localStore.js';
import { downloadFile, exportEquipmentsTSV, exportRecordsTSV } from './lib/exporters.js';

const STORAGE = {
  farms: 'controltech_farms_v11',
  locations: 'controltech_locations_v11',
  equipments: 'controltech_equipments_v11',
  records: 'controltech_records_v11',
  checklist: 'controltech_checklist_progress_v11',
  operation: 'controltech_operation_v11'
};

const navItems = [
  { id: 'inicio', label: 'Início', short: 'Início', icon: 'home' },
  { id: 'fazendas', label: 'Fazendas', short: 'Fazendas', icon: 'farm' },
  { id: 'checklists', label: 'Checklists', short: 'Check', icon: 'checklist' },
  { id: 'diagnostico', label: 'Diagnóstico', short: 'Diagn.', icon: 'wrench' },
  { id: 'guia', label: 'Guia Técnico', short: 'Guia', icon: 'book' },
  { id: 'registros', label: 'Registros', short: 'Registros', icon: 'records' },
  { id: 'config', label: 'Configurações', short: 'Config.', icon: 'settings' }
];

const equipmentTypes = ['VP', 'Gateway', 'Base', 'Antena', 'Roteador', 'Switch', 'Outro'];
const equipmentStatuses = ['Instalado', 'Testado', 'Pendente', 'Com problema', 'Removido'];

function Icon({ name, size = 22 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const icons = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    farm: <><path d="M3 21h18" /><path d="M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6" /><path d="M9 11h6" /></>,
    checklist: <><path d="M9 5h6" /><path d="M9 3h6v4H9z" /><path d="M7 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><path d="m8 13 2 2 4-5" /><path d="M8 19h8" /></>,
    wrench: <><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18v3h3l6.7-6.7a4 4 0 0 0 5-5l-2.6 2.6-2.8-2.8z" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /></>,
    records: <><path d="M4 4h16v16H4z" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" /></>,
    settings: <><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.42 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.42H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6c.37-.15.7-.35 1-.6.28-.32.43-.7.42-1.1V3a2 2 0 1 1 4 0v.09c0 .4.14.78.42 1.1.3.25.63.45 1 .6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.15.37.35.7.6 1 .32.28.7.43 1.1.42H21a2 2 0 1 1 0 4h-.09c-.4 0-.78.14-1.1.42-.25.3-.45.63-.6 1z" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    map: <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" /><path d="M9 3v15" /><path d="M15 6v15" /></>,
    pin: <><path d="M12 21s7-5.1 7-11a7 7 0 0 0-14 0c0 5.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    gps: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" /><path d="M5 5l2.2 2.2" /><path d="M16.8 16.8 19 19" /><path d="M19 5l-2.2 2.2" /><path d="M7.2 16.8 5 19" /></>,
    cow: <><path d="M7 9c-2-1-3-2-3-4 3 0 5 1 6 3" /><path d="M17 9c2-1 3-2 3-4-3 0-5 1-6 3" /><path d="M6 10c0-3 3-5 6-5s6 2 6 5v5c0 3-3 5-6 5s-6-2-6-5z" /><path d="M9 13h.01" /><path d="M15 13h.01" /><path d="M10 17h4" /></>,
    gateway: <><rect x="4" y="12" width="16" height="7" rx="2" /><path d="M8 12V9" /><path d="M16 12V9" /><path d="M7 16h.01" /><path d="M11 16h.01" /><path d="M15 16h2" /><path d="M8 7a6 6 0 0 1 8 0" /><path d="M10 4a9 9 0 0 1 4 0" /></>,
    wifi: <><path d="M5 13a10 10 0 0 1 14 0" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M12 20h.01" /></>,
    antenna: <><path d="M12 21V9" /><path d="m8 21 4-12 4 12" /><path d="M7 8a7 7 0 0 1 10 0" /><path d="M4 5a11 11 0 0 1 16 0" /></>,
    network: <><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="M8.5 8.5 11 15" /><path d="m15.5 8.5-2.5 6.5" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16V9" /><path d="M12 16V6" /><path d="M16 16v-4" /></>,
    user: <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>,
    terminal: <><path d="m4 8 4 4-4 4" /><path d="M10 18h10" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 15H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    cloud: <><path d="M17.5 19H7a5 5 0 1 1 1-9.9A7 7 0 0 1 21 12.5 4 4 0 0 1 17.5 19z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-5" /></>
  };
  return <svg {...common}>{icons[name] || icons.checklist}</svg>;
}

function Badge({ children, tone = 'slate' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Logo() {
  return (
    <div className="brand">
      <img src="/logo-symbol.svg" alt="ControlTech Assist" />
      <div>
        <strong>Control<span>Tech</span></strong>
        <small>Assist</small>
      </div>
    </div>
  );
}

function EmptyState({ icon = 'search', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const authCall = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await authCall;
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(mode === 'login' ? 'Entrada realizada.' : 'Conta criada. Se o Supabase pedir confirmação, confirme pelo e-mail antes de entrar.');
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <Logo />
        <div className="auth-copy">
          <Badge tone="green">V1.1 com Supabase</Badge>
          <h1>Entre para sincronizar suas fazendas, pontos e equipamentos.</h1>
          <p>Use e-mail e senha. Com RLS ativo, cada técnico vê somente os próprios dados.</p>
        </div>
        <form onSubmit={submit} className="form-stack">
          <Field label="E-mail">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="seuemail@exemplo.com" />
          </Field>
          <Field label="Senha">
            <input type="password" minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="Mínimo 6 caracteres" />
          </Field>
          {message && <p className="form-message">{message}</p>}
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
          <button className="ghost-button" type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
          </button>
        </form>
      </section>
    </main>
  );
}

function DesktopSidebar({ activeTab, setActiveTab, user }) {
  return (
    <aside className="sidebar">
      <Logo />
      <nav className="nav-list">
        {navItems.map((item) => (
          <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} type="button" onClick={() => setActiveTab(item.id)}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <Icon name="shield" />
        <strong>Modo campo</strong>
        <p>Checklist primeiro. Registro sempre. Suporte com evidência.</p>
        {user && <small>{user.email}</small>}
      </div>
    </aside>
  );
}

function BottomNav({ activeTab, setActiveTab }) {
  const items = navItems.filter((item) => ['inicio', 'fazendas', 'checklists', 'diagnostico', 'registros'].includes(item.id));
  return (
    <nav className="bottom-nav" aria-label="Navegação mobile">
      {items.map((item) => (
        <button key={item.id} type="button" className={activeTab === item.id ? 'active' : ''} onClick={() => setActiveTab(item.id)}>
          <Icon name={item.icon} size={20} />
          <span>{item.short}</span>
        </button>
      ))}
    </nav>
  );
}

function Topbar({ activeTab, syncMode }) {
  const title = navItems.find((item) => item.id === activeTab)?.label || 'ControlTech Assist';
  return (
    <header className="topbar">
      <div>
        <strong>{title}</strong>
        <span>{syncMode === 'supabase' ? 'Dados sincronizados no Supabase' : 'Modo local sem Supabase configurado'}</span>
      </div>
      <Badge tone={syncMode === 'supabase' ? 'green' : 'amber'}>{syncMode === 'supabase' ? 'Online' : 'Local'}</Badge>
    </header>
  );
}

function FarmForm({ onSave, onCancel }) {
  const [form, setForm] = useState({ nome: '', responsavel: '', telefone: '', cidade: '', endereco: '', observacoes: '' });
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.nome.trim()) return;
    onSave(form);
    setForm({ nome: '', responsavel: '', telefone: '', cidade: '', endereco: '', observacoes: '' });
  };
  return (
    <form className="panel form-stack" onSubmit={submit}>
      <div className="section-heading compact"><div><Badge tone="green">Cadastro rápido</Badge><h2>Nova fazenda</h2><p>Na correria, preencha só o nome. O restante pode ficar para depois.</p></div></div>
      <div className="form-grid two">
        <Field label="Nome da fazenda *"><input value={form.nome} onChange={(e) => update('nome', e.target.value)} placeholder="Ex.: Fazenda Santa Maria" required /></Field>
        <Field label="Responsável"><input value={form.responsavel} onChange={(e) => update('responsavel', e.target.value)} placeholder="Nome do contato" /></Field>
        <Field label="Telefone"><input value={form.telefone} onChange={(e) => update('telefone', e.target.value)} placeholder="(34) 99999-9999" /></Field>
        <Field label="Cidade"><input value={form.cidade} onChange={(e) => update('cidade', e.target.value)} placeholder="Uberaba / MG" /></Field>
      </div>
      <Field label="Endereço"><input value={form.endereco} onChange={(e) => update('endereco', e.target.value)} placeholder="Opcional" /></Field>
      <Field label="Observações"><textarea value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} placeholder="Ex.: acesso, responsável pelo curral, internet disponível..." /></Field>
      <div className="button-row"><button className="primary-button" type="submit"><Icon name="plus" /> Salvar fazenda</button>{onCancel && <button className="ghost-button" type="button" onClick={onCancel}>Cancelar</button>}</div>
    </form>
  );
}

function LocationForm({ farmId, onSave }) {
  const [form, setForm] = useState({ nome: '', descricao: '', latitude: '', longitude: '', observacoes: '' });
  const [gpsMessage, setGpsMessage] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function useGps() {
    if (!navigator.geolocation) {
      setGpsMessage('GPS não disponível neste dispositivo/navegador.');
      return;
    }
    setGpsMessage('Buscando localização...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update('latitude', position.coords.latitude.toFixed(6));
        update('longitude', position.coords.longitude.toFixed(6));
        setGpsMessage('Localização capturada com sucesso.');
      },
      () => setGpsMessage('Não consegui acessar o GPS. Permita localização no navegador.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }
  const submit = (event) => {
    event.preventDefault();
    if (!form.nome.trim()) return;
    onSave({ ...form, fazenda_id: farmId });
    setForm({ nome: '', descricao: '', latitude: '', longitude: '', observacoes: '' });
    setGpsMessage('');
  };
  return (
    <form className="subform" onSubmit={submit}>
      <h3>Novo local da fazenda</h3>
      <div className="form-grid two">
        <Field label="Nome do local *"><input value={form.nome} onChange={(e) => update('nome', e.target.value)} placeholder="Galpão 01, Curral, Ordenha..." required /></Field>
        <Field label="Descrição"><input value={form.descricao} onChange={(e) => update('descricao', e.target.value)} placeholder="Ponto de instalação ou referência" /></Field>
        <Field label="Latitude"><input value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="-19.748400" /></Field>
        <Field label="Longitude"><input value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="-47.936600" /></Field>
      </div>
      <Field label="Observações"><textarea value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} /></Field>
      {gpsMessage && <p className="mini-message">{gpsMessage}</p>}
      <div className="button-row"><button className="secondary-button" type="button" onClick={useGps}><Icon name="gps" /> Usar GPS atual</button><button className="primary-button" type="submit">Salvar local</button></div>
    </form>
  );
}

function EquipmentForm({ farmId, locations, onSave }) {
  const [form, setForm] = useState({ codigo: '', tipo: 'VP', status: 'Instalado', local_id: '', latitude: '', longitude: '', observacoes: '' });
  const [gpsMessage, setGpsMessage] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  function useGps() {
    if (!navigator.geolocation) {
      setGpsMessage('GPS não disponível neste dispositivo/navegador.');
      return;
    }
    setGpsMessage('Buscando localização...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update('latitude', position.coords.latitude.toFixed(6));
        update('longitude', position.coords.longitude.toFixed(6));
        setGpsMessage('Localização capturada com sucesso.');
      },
      () => setGpsMessage('Não consegui acessar o GPS. Permita localização no navegador.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }
  const submit = (event) => {
    event.preventDefault();
    if (!form.codigo.trim()) return;
    onSave({ ...form, fazenda_id: farmId, instalado_em: new Date().toISOString().slice(0, 10) });
    setForm({ codigo: '', tipo: 'VP', status: 'Instalado', local_id: '', latitude: '', longitude: '', observacoes: '' });
    setGpsMessage('');
  };
  return (
    <form className="subform" onSubmit={submit}>
      <h3>Novo equipamento / VP</h3>
      <div className="form-grid two">
        <Field label="Código do equipamento *"><input value={form.codigo} onChange={(e) => update('codigo', e.target.value.toUpperCase())} placeholder="VP8002" required /></Field>
        <Field label="Tipo"><select value={form.tipo} onChange={(e) => update('tipo', e.target.value)}>{equipmentTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => update('status', e.target.value)}>{equipmentStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field>
        <Field label="Local"><select value={form.local_id} onChange={(e) => update('local_id', e.target.value)}><option value="">Sem local vinculado</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.nome}</option>)}</select></Field>
        <Field label="Latitude"><input value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="-19.748400" /></Field>
        <Field label="Longitude"><input value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="-47.936600" /></Field>
      </div>
      <Field label="Observações"><textarea value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} placeholder="Ex.: galpão 01, próximo à ordenha, cabo trocado..." /></Field>
      {gpsMessage && <p className="mini-message">{gpsMessage}</p>}
      <div className="button-row"><button className="secondary-button" type="button" onClick={useGps}><Icon name="gps" /> Usar GPS atual</button><button className="primary-button" type="submit">Salvar equipamento</button></div>
    </form>
  );
}

function FarmMap({ farm, locations, equipments }) {
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const layerRef = useRef(null);
  const points = useMemo(() => {
    const locationPoints = locations.filter((item) => item.latitude && item.longitude).map((item) => ({ kind: 'Local', name: item.nome, lat: Number(item.latitude), lng: Number(item.longitude), description: item.descricao || item.observacoes || '' }));
    const equipmentPoints = equipments.filter((item) => item.latitude && item.longitude).map((item) => ({ kind: item.tipo || 'Equipamento', name: item.codigo, lat: Number(item.latitude), lng: Number(item.longitude), description: `${item.status || ''}${item.observacoes ? ` — ${item.observacoes}` : ''}` }));
    return [...locationPoints, ...equipmentPoints].filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  }, [locations, equipments]);

  useEffect(() => {
    if (!mapNode.current || mapInstance.current) return;
    mapInstance.current = L.map(mapNode.current, { zoomControl: true }).setView([-19.748, -47.936], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapInstance.current);
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    if (layerRef.current) layerRef.current.remove();
    layerRef.current = L.layerGroup().addTo(map);
    points.forEach((point) => {
      L.circleMarker([point.lat, point.lng], {
        radius: point.kind === 'Local' ? 9 : 7,
        color: point.kind === 'Local' ? '#0f172a' : '#16a34a',
        fillColor: point.kind === 'Local' ? '#0f172a' : '#22c55e',
        fillOpacity: 0.88,
        weight: 2
      }).bindPopup(`<strong>${point.name}</strong><br/>${point.kind}<br/>${point.description}<br/>${point.lat}, ${point.lng}`).addTo(layerRef.current);
    });
    setTimeout(() => map.invalidateSize(), 150);
    if (points.length) {
      map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [35, 35], maxZoom: 17 });
    }
  }, [points]);

  return (
    <div className="map-card">
      <div className="map-header"><div><h3>Mapa da {farm.nome}</h3><p>{points.length} ponto(s) com coordenadas</p></div><Badge tone="green">OpenStreetMap</Badge></div>
      <div className="map-container" ref={mapNode} />
      {!points.length && <div className="map-empty">Cadastre um local ou equipamento com latitude/longitude para aparecer no mapa.</div>}
    </div>
  );
}

function FarmDetail({ farm, allLocations, allEquipments, allRecords, onBack, onAddLocation, onAddEquipment, onDeleteLocation, onDeleteEquipment }) {
  const [tab, setTab] = useState('resumo');
  const locations = allLocations.filter((item) => item.fazenda_id === farm.id);
  const equipments = allEquipments.filter((item) => item.fazenda_id === farm.id);
  const records = allRecords.filter((item) => item.fazenda_id === farm.id);
  const locationById = Object.fromEntries(locations.map((location) => [location.id, location.nome]));
  const installed = equipments.filter((item) => item.status === 'Instalado' || item.status === 'Testado').length;
  const issueCount = equipments.filter((item) => item.status === 'Com problema' || item.status === 'Pendente').length;

  return (
    <div className="page-stack">
      <section className="farm-hero panel">
        <button className="ghost-button small" type="button" onClick={onBack}>← Voltar</button>
        <div>
          <Badge tone="green">Fazenda</Badge>
          <h1>{farm.nome}</h1>
          <p>{farm.responsavel || 'Responsável não informado'} {farm.cidade ? `• ${farm.cidade}` : ''}</p>
        </div>
        <div className="farm-stats-inline"><span>{locations.length}<small>locais</small></span><span>{equipments.length}<small>equipamentos</small></span><span>{installed}<small>instalados/testados</small></span><span>{issueCount}<small>pendências</small></span></div>
      </section>

      <div className="tabs-row">
        {['resumo', 'locais', 'equipamentos', 'mapa', 'registros'].map((item) => <button key={item} type="button" className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === 'resumo' && (
        <section className="panel">
          <div className="section-heading"><div><h2>Resumo da fazenda</h2><p>Visão rápida para chegar no local e entender o que já foi instalado.</p></div></div>
          <div className="info-grid">
            <div><span>Responsável</span><strong>{farm.responsavel || '-'}</strong></div>
            <div><span>Telefone</span><strong>{farm.telefone || '-'}</strong></div>
            <div><span>Cidade</span><strong>{farm.cidade || '-'}</strong></div>
            <div><span>Endereço</span><strong>{farm.endereco || '-'}</strong></div>
          </div>
          {farm.observacoes && <p className="note-box">{farm.observacoes}</p>}
        </section>
      )}

      {tab === 'locais' && <section className="panel"><LocationForm farmId={farm.id} onSave={onAddLocation} /><div className="list-grid">{locations.map((location) => <article className="list-card" key={location.id}><div><Icon name="pin" /><strong>{location.nome}</strong><p>{location.descricao || location.observacoes || 'Sem descrição'}</p><small>{location.latitude && location.longitude ? `${location.latitude}, ${location.longitude}` : 'Sem coordenadas'}</small></div><button className="danger-icon" type="button" onClick={() => onDeleteLocation(location.id)}><Icon name="trash" /></button></article>)}</div></section>}

      {tab === 'equipamentos' && <section className="panel"><EquipmentForm farmId={farm.id} locations={locations} onSave={onAddEquipment} /><div className="list-grid">{equipments.map((item) => <article className="list-card" key={item.id}><div><Icon name={item.tipo === 'VP' ? 'cow' : item.tipo === 'Gateway' || item.tipo === 'Base' ? 'gateway' : 'wifi'} /><strong>{item.codigo}</strong><p>{item.tipo} • {locationById[item.local_id] || 'Sem local'} • {item.status}</p><small>{item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'Sem coordenadas'}</small></div><div className="card-actions"><a className="map-link" href={item.latitude && item.longitude ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}` : '#'} target="_blank" rel="noreferrer">Mapa</a><button className="danger-icon" type="button" onClick={() => onDeleteEquipment(item.id)}><Icon name="trash" /></button></div></article>)}</div></section>}

      {tab === 'mapa' && <FarmMap farm={farm} locations={locations} equipments={equipments} />}

      {tab === 'registros' && <section className="panel"><div className="section-heading"><div><h2>Registros desta fazenda</h2><p>Histórico de problemas, soluções e visitas.</p></div></div>{records.length ? <div className="timeline">{records.map((record) => <article key={record.id}><Badge>{record.tipo}</Badge><h3>{record.titulo}</h3><p>{record.descricao || record.solucao || record.observacoes}</p><small>{new Date(record.created_at).toLocaleString('pt-BR')}</small></article>)}</div> : <EmptyState title="Sem registros ainda" text="Quando você criar registros de campo vinculados a esta fazenda, eles aparecerão aqui." />}</section>}
    </div>
  );
}

function FarmsPage({ farms, locations, equipments, records, onAddFarm, onAddLocation, onAddEquipment, onDeleteFarm, onDeleteLocation, onDeleteEquipment }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const selectedFarm = farms.find((farm) => farm.id === selectedFarmId);
  if (selectedFarm) return <FarmDetail farm={selectedFarm} allLocations={locations} allEquipments={equipments} allRecords={records} onBack={() => setSelectedFarmId(null)} onAddLocation={onAddLocation} onAddEquipment={onAddEquipment} onDeleteLocation={onDeleteLocation} onDeleteEquipment={onDeleteEquipment} />;
  return (
    <div className="page-stack">
      <section className="hero-compact panel"><div><Badge tone="green">Novo módulo</Badge><h1>Fazendas, pontos e VPs instaladas</h1><p>Cadastre primeiro só o nome da fazenda. Depois marque locais, equipamentos e coordenadas usando o GPS do celular.</p></div><button className="primary-button" onClick={() => setShowForm((v) => !v)}><Icon name="plus" /> Nova fazenda</button></section>
      {showForm && <FarmForm onSave={(farm) => { onAddFarm(farm); setShowForm(false); }} onCancel={() => setShowForm(false)} />}
      {farms.length ? <div className="farm-grid">{farms.map((farm) => {
        const farmLocations = locations.filter((item) => item.fazenda_id === farm.id).length;
        const farmEquipments = equipments.filter((item) => item.fazenda_id === farm.id);
        return <article className="farm-card" key={farm.id}><div className="farm-card-head"><div className="farm-icon"><Icon name="farm" /></div><button className="danger-icon" onClick={() => onDeleteFarm(farm.id)}><Icon name="trash" /></button></div><h3>{farm.nome}</h3><p>{farm.responsavel || farm.cidade || 'Cadastro rápido'}</p><div className="farm-metrics"><span>{farmLocations}<small>locais</small></span><span>{farmEquipments.length}<small>equip.</small></span><span>{farmEquipments.filter((item) => item.status === 'Com problema' || item.status === 'Pendente').length}<small>alertas</small></span></div><button className="secondary-button full" onClick={() => setSelectedFarmId(farm.id)}>Abrir fazenda <Icon name="arrow" /></button></article>;
      })}</div> : <EmptyState icon="farm" title="Nenhuma fazenda cadastrada" text="Crie a primeira fazenda para começar a marcar locais, VPs e coordenadas." action={<button className="primary-button" onClick={() => setShowForm(true)}>Criar primeira fazenda</button>} />}
    </div>
  );
}

function HomePage({ setActiveTab, farms, locations, equipments, records }) {
  const issueCount = equipments.filter((item) => item.status === 'Pendente' || item.status === 'Com problema').length;
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <Badge tone="green">ControlTech Assist V1.1</Badge>
          <h1>O que você vai fazer hoje?</h1>
          <p>Escolha uma ação e vá direto para a tela certa. No celular, nada fica escondido no fim da página.</p>
          <div className="quick-actions">
            <button onClick={() => setActiveTab('fazendas')}><Icon name="farm" />Nova / abrir fazenda</button>
            <button onClick={() => setActiveTab('checklists')}><Icon name="checklist" />Fazer checklist</button>
            <button onClick={() => setActiveTab('diagnostico')}><Icon name="wrench" />Resolver problema</button>
            <button onClick={() => setActiveTab('registros')}><Icon name="records" />Registrar atendimento</button>
          </div>
        </div>
        <div className="hero-logo"><img src="/logo-symbol.svg" alt="" /><strong>Menos erro em campo.</strong><span>Mais controle na instalação.</span></div>
      </section>
      <section className="stats-grid"><article><Icon name="farm" /><span>Fazendas</span><strong>{farms.length}</strong></article><article><Icon name="pin" /><span>Locais</span><strong>{locations.length}</strong></article><article><Icon name="cow" /><span>Equipamentos</span><strong>{equipments.length}</strong></article><article><Icon name="wrench" /><span>Pendências</span><strong>{issueCount}</strong></article></section>
      <section className="panel"><div className="section-heading"><div><h2>Últimos registros</h2><p>Resumo rápido do que já foi anotado.</p></div><button className="ghost-button" onClick={() => setActiveTab('registros')}>Ver todos</button></div>{records.slice(0, 3).length ? <div className="timeline">{records.slice(0, 3).map((record) => <article key={record.id}><Badge>{record.tipo}</Badge><h3>{record.titulo}</h3><p>{record.descricao || record.solucao || record.observacoes}</p></article>)}</div> : <EmptyState title="Nenhum registro ainda" text="Quando finalizar uma instalação ou diagnóstico, registre aqui para não depender da memória." />}</section>
    </div>
  );
}

function ChecklistsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [progress, setProgress] = useState(() => readLocal(STORAGE.checklist, {}));
  const selected = checklistTemplates.find((item) => item.id === selectedId);
  function toggle(key) {
    const next = { ...progress, [key]: !progress[key] };
    setProgress(next);
    writeLocal(STORAGE.checklist, next);
  }
  function totalDone(template) {
    let total = 0; let done = 0;
    template.sections.forEach((section, sIndex) => section.items.forEach((_item, iIndex) => { total += 1; if (progress[`${template.id}_${sIndex}_${iIndex}`]) done += 1; }));
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }
  if (selected) {
    const metrics = totalDone(selected);
    return <div className="page-stack"><section className="panel"><button className="ghost-button small" onClick={() => setSelectedId(null)}>← Voltar</button><div className="section-heading"><div><Badge tone="green">{metrics.percent}% concluído</Badge><h1>{selected.title}</h1><p>{selected.subtitle}</p></div></div><div className="progress-shell"><div style={{ width: `${metrics.percent}%` }} /></div></section>{selected.sections.map((section, sIndex) => <section className="panel checklist-section" key={section.title}><h2>{section.title}</h2>{section.items.map((item, iIndex) => { const key = `${selected.id}_${sIndex}_${iIndex}`; return <label className="check-row" key={item}><input type="checkbox" checked={Boolean(progress[key])} onChange={() => toggle(key)} /><span>{item}</span></label>; })}</section>)}</div>;
  }
  return <div className="page-stack"><section className="hero-compact panel"><div><Badge tone="green">Passo a passo seguro</Badge><h1>Checklists</h1><p>Cada checklist agora abre como uma tela própria para não se perder no celular.</p></div></section><div className="module-grid">{checklistTemplates.map((template) => { const metrics = totalDone(template); return <button className="module-card" key={template.id} onClick={() => setSelectedId(template.id)}><Icon name={template.icon || 'checklist'} /><h3>{template.title}</h3><p>{template.subtitle}</p><Badge tone="green">{metrics.done}/{metrics.total} itens</Badge></button>; })}</div></div>;
}

function DiagnosticPage() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = troubleshootingFlows.find((item) => item.id === selectedId);
  if (selected) return <div className="page-stack"><section className="panel"><button className="ghost-button small" onClick={() => setSelectedId(null)}>← Voltar</button><div className="section-heading"><div><Badge tone="amber">{selected.severity}</Badge><h1>{selected.title}</h1><p>{selected.symptom}</p></div></div></section><section className="panel diagnostic-flow">{selected.checks.map((check, index) => <article key={check.question}><span>{index + 1}</span><div><h3>{check.question}</h3><p><strong>Por quê:</strong> {check.why}</p><p><strong>Ação:</strong> {check.action}</p></div></article>)}<div className="result-box"><strong>Conclusão segura</strong><p>{selected.result}</p></div></section></div>;
  return <div className="page-stack"><section className="hero-compact panel"><div><Badge tone="amber">Sem IA por enquanto</Badge><h1>Diagnóstico guiado</h1><p>Escolha o sintoma. O sistema abre uma sequência de perguntas e ações objetivas.</p></div></section><div className="module-grid">{troubleshootingFlows.map((flow) => <button className="module-card" key={flow.id} onClick={() => setSelectedId(flow.id)}><Icon name={flow.icon || 'wrench'} /><h3>{flow.title}</h3><p>{flow.symptom}</p><Badge>{flow.severity}</Badge></button>)}</div></div>;
}

function GuidePage() {
  const [query, setQuery] = useState('');
  const filtered = knowledgeBase.filter((item) => `${item.title} ${item.summary} ${item.content}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-stack"><section className="hero-compact panel"><div><Badge tone="green">Base de conhecimento</Badge><h1>Guia técnico rápido</h1><p>Explicações simples para consultar no campo.</p></div><div className="search-box"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar IP, DNS, LoRa..." /></div></section><div className="guide-grid">{filtered.map((item) => <article className="guide-card" key={item.id}><Icon name={item.icon || 'book'} /><h3>{item.title}</h3><p>{item.summary}</p><small>{item.content}</small></article>)}</div></div>;
}

function RecordsPage({ farms, records, onAddRecord, onExportRecords }) {
  const [form, setForm] = useState({ fazenda_id: '', titulo: '', tipo: 'Instalação', descricao: '', solucao: '', observacoes: '' });
  const farmById = Object.fromEntries(farms.map((farm) => [farm.id, farm.nome]));
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = (event) => { event.preventDefault(); if (!form.titulo.trim()) return; onAddRecord(form); setForm({ fazenda_id: '', titulo: '', tipo: 'Instalação', descricao: '', solucao: '', observacoes: '' }); };
  return <div className="page-stack"><section className="panel"><div className="section-heading"><div><Badge tone="green">Histórico</Badge><h1>Registros de campo</h1><p>Anote problemas, soluções, pendências e evidências da visita.</p></div><button className="secondary-button" onClick={onExportRecords}><Icon name="download" /> Exportar TSV</button></div><form className="form-stack" onSubmit={submit}><div className="form-grid two"><Field label="Fazenda"><select value={form.fazenda_id} onChange={(e) => update('fazenda_id', e.target.value)}><option value="">Sem fazenda vinculada</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.nome}</option>)}</select></Field><Field label="Tipo"><select value={form.tipo} onChange={(e) => update('tipo', e.target.value)}><option>Instalação</option><option>Diagnóstico</option><option>Manutenção</option><option>Rede</option><option>Treinamento</option></select></Field></div><Field label="Título *"><input value={form.titulo} onChange={(e) => update('titulo', e.target.value)} placeholder="Ex.: Gateway offline resolvido" required /></Field><Field label="Descrição"><textarea value={form.descricao} onChange={(e) => update('descricao', e.target.value)} /></Field><Field label="Solução aplicada"><textarea value={form.solucao} onChange={(e) => update('solucao', e.target.value)} /></Field><Field label="Observações"><textarea value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} /></Field><button className="primary-button" type="submit">Salvar registro</button></form></section><section className="timeline">{records.length ? records.map((record) => <article key={record.id}><Badge>{record.tipo}</Badge><h3>{record.titulo}</h3><p>{record.descricao || record.solucao || record.observacoes}</p><small>{farmById[record.fazenda_id] || 'Sem fazenda'} • {new Date(record.created_at).toLocaleString('pt-BR')}</small></article>) : <EmptyState title="Nenhum registro" text="Registre cada visita para criar histórico e facilitar suporte." />}</section></div>;
}

function SettingsPage({ syncMode, user, onSignOut, onExportEquipments, onBackup }) {
  return <div className="page-stack"><section className="panel"><div className="section-heading"><div><Badge tone="green">Configurações</Badge><h1>Sistema</h1><p>Controle de sincronização, backup e área futura de IA.</p></div></div><div className="settings-grid"><article><Icon name="cloud" /><h3>Sincronização</h3><p>{syncMode === 'supabase' ? 'Supabase ativo com autenticação e RLS.' : 'Supabase não configurado. Usando LocalStorage.'}</p>{user && <small>{user.email}</small>}</article><article><Icon name="download" /><h3>Exportações</h3><p>Gere TSV de equipamentos ou backup JSON para segurança.</p><div className="button-row"><button className="secondary-button" onClick={onExportEquipments}>Equipamentos TSV</button><button className="secondary-button" onClick={onBackup}>Backup JSON</button></div></article><article><Icon name="wrench" /><h3>Assistente IA</h3><p>Espaço reservado para uma versão futura. Nesta versão, nenhum recurso de IA está ativo.</p><Badge>Em breve</Badge></article></div>{user && <button className="danger-button" type="button" onClick={onSignOut}><Icon name="logout" /> Sair</button>}</section></div>;
}

export default function App() {
  const { session, loading } = useSupabaseAuth();
  const user = session?.user || null;
  const syncMode = hasSupabaseConfig ? 'supabase' : 'local';
  const [activeTab, setActiveTab] = useState('inicio');
  const [farms, setFarms] = useState(() => readLocal(STORAGE.farms, []));
  const [locations, setLocations] = useState(() => readLocal(STORAGE.locations, []));
  const [equipments, setEquipments] = useState(() => readLocal(STORAGE.equipments, []));
  const [records, setRecords] = useState(() => readLocal(STORAGE.records, []));
  const [appLoading, setAppLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchAll() {
    if (!hasSupabaseConfig || !user) return;
    setAppLoading(true);
    setError('');
    const [farmRes, locationRes, equipmentRes, recordRes] = await Promise.all([
      supabase.from('fazendas').select('*').order('created_at', { ascending: false }),
      supabase.from('locais_fazenda').select('*').order('created_at', { ascending: false }),
      supabase.from('equipamentos_instalados').select('*').order('created_at', { ascending: false }),
      supabase.from('registros_campo').select('*').order('created_at', { ascending: false })
    ]);
    setAppLoading(false);
    const firstError = farmRes.error || locationRes.error || equipmentRes.error || recordRes.error;
    if (firstError) { setError(firstError.message); return; }
    setFarms(farmRes.data || []); setLocations(locationRes.data || []); setEquipments(equipmentRes.data || []); setRecords(recordRes.data || []);
  }

  useEffect(() => { if (user) fetchAll(); }, [user?.id]);
  useEffect(() => { if (!hasSupabaseConfig) writeLocal(STORAGE.farms, farms); }, [farms]);
  useEffect(() => { if (!hasSupabaseConfig) writeLocal(STORAGE.locations, locations); }, [locations]);
  useEffect(() => { if (!hasSupabaseConfig) writeLocal(STORAGE.equipments, equipments); }, [equipments]);
  useEffect(() => { if (!hasSupabaseConfig) writeLocal(STORAGE.records, records); }, [records]);

  async function insertRow(table, data, setter) {
    const item = { id: makeId(), ...data, user_id: user?.id || null, created_at: nowIso(), updated_at: nowIso() };
    if (hasSupabaseConfig && user) {
      const { data: saved, error: saveError } = await supabase.from(table).insert(item).select().single();
      if (saveError) { setError(saveError.message); return null; }
      setter((current) => [saved, ...current]); return saved;
    }
    setter((current) => [item, ...current]); return item;
  }

  async function deleteRow(table, id, setter) {
    if (hasSupabaseConfig && user) {
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
      if (deleteError) { setError(deleteError.message); return; }
    }
    setter((current) => current.filter((item) => item.id !== id));
  }

  function toNullableNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  function cleanLocation(location) {
    return {
      ...location,
      latitude: toNullableNumber(location.latitude),
      longitude: toNullableNumber(location.longitude)
    };
  }

  function cleanEquipment(equipment) {
    return {
      ...equipment,
      local_id: equipment.local_id || null,
      latitude: toNullableNumber(equipment.latitude),
      longitude: toNullableNumber(equipment.longitude)
    };
  }

  function cleanRecord(record) {
    return {
      ...record,
      fazenda_id: record.fazenda_id || null
    };
  }

  const handlers = {
    addFarm: (farm) => insertRow('fazendas', farm, setFarms),
    addLocation: (location) => insertRow('locais_fazenda', cleanLocation(location), setLocations),
    addEquipment: (equipment) => insertRow('equipamentos_instalados', cleanEquipment(equipment), setEquipments),
    addRecord: (record) => insertRow('registros_campo', cleanRecord(record), setRecords),
    deleteFarm: async (id) => { await deleteRow('fazendas', id, setFarms); setLocations((current) => current.filter((item) => item.fazenda_id !== id)); setEquipments((current) => current.filter((item) => item.fazenda_id !== id)); },
    deleteLocation: (id) => deleteRow('locais_fazenda', id, setLocations),
    deleteEquipment: (id) => deleteRow('equipamentos_instalados', id, setEquipments)
  };

  function exportEquipments() { downloadFile('controltech-equipamentos.tsv', exportEquipmentsTSV(equipments, farms, locations), 'text/tab-separated-values;charset=utf-8'); }
  function exportRecords() { downloadFile('controltech-registros.tsv', exportRecordsTSV(records, farms), 'text/tab-separated-values;charset=utf-8'); }
  function backupJson() { downloadFile('controltech-backup.json', JSON.stringify({ farms, locations, equipments, records, generated_at: nowIso() }, null, 2), 'application/json;charset=utf-8'); }

  if (loading) return <main className="loading-screen"><Logo /><p>Carregando...</p></main>;
  if (hasSupabaseConfig && !user) return <AuthScreen />;

  const pages = {
    inicio: <HomePage setActiveTab={setActiveTab} farms={farms} locations={locations} equipments={equipments} records={records} />,
    fazendas: <FarmsPage farms={farms} locations={locations} equipments={equipments} records={records} onAddFarm={handlers.addFarm} onAddLocation={handlers.addLocation} onAddEquipment={handlers.addEquipment} onDeleteFarm={handlers.deleteFarm} onDeleteLocation={handlers.deleteLocation} onDeleteEquipment={handlers.deleteEquipment} />,
    checklists: <ChecklistsPage />,
    diagnostico: <DiagnosticPage />,
    guia: <GuidePage />,
    registros: <RecordsPage farms={farms} records={records} onAddRecord={handlers.addRecord} onExportRecords={exportRecords} />,
    config: <SettingsPage syncMode={syncMode} user={user} onSignOut={() => supabase.auth.signOut()} onExportEquipments={exportEquipments} onBackup={backupJson} />
  };

  return (
    <div className="app-shell">
      <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <main className="main-content">
        <Topbar activeTab={activeTab} syncMode={syncMode} />
        {error && <div className="app-alert">{error}</div>}
        {appLoading && <div className="app-alert neutral">Sincronizando dados...</div>}
        <div className="content-area">{pages[activeTab]}</div>
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
