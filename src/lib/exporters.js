function escapeTSV(value) {
  return String(value ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');
}

export function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportEquipmentsTSV(equipments, farms, locations) {
  const farmById = Object.fromEntries(farms.map((farm) => [farm.id, farm.nome]));
  const locationById = Object.fromEntries(locations.map((location) => [location.id, location.nome]));
  const header = ['Fazenda', 'Local', 'Código', 'Tipo', 'Status', 'Latitude', 'Longitude', 'Observações', 'Instalado em'];
  const rows = equipments.map((item) => [
    farmById[item.fazenda_id] || '',
    locationById[item.local_id] || '',
    item.codigo,
    item.tipo,
    item.status,
    item.latitude,
    item.longitude,
    item.observacoes,
    item.instalado_em
  ]);
  return [header, ...rows].map((row) => row.map(escapeTSV).join('\t')).join('\n');
}

export function exportRecordsTSV(records, farms) {
  const farmById = Object.fromEntries(farms.map((farm) => [farm.id, farm.nome]));
  const header = ['Data', 'Fazenda', 'Título', 'Tipo', 'Descrição', 'Solução', 'Observações'];
  const rows = records.map((item) => [
    item.created_at,
    farmById[item.fazenda_id] || '',
    item.titulo,
    item.tipo,
    item.descricao,
    item.solucao,
    item.observacoes
  ]);
  return [header, ...rows].map((row) => row.map(escapeTSV).join('\t')).join('\n');
}
