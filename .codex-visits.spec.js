import { test, expect } from '@playwright/test';

const farm = {
  id: 'farm-visits-test',
  nome: 'Fazenda Teste de Visitas',
  cidade: 'Uberaba',
  estado_uf: 'MG',
  central: 'Genex Brasil',
  responsavel: 'Cliente Teste',
  regional_nome: 'Regional Teste',
  qtd_colares_prevista: 100,
  qtd_colares_instalada: 45,
  status: 'Em andamento',
  created_at: '2026-10-01T10:00:00-03:00'
};

const visits = [
  {
    id: 'visit-open', fazenda_id: farm.id, tipo: 'Instalação', data_visita: '2026-10-30',
    resumo: 'Instalação em andamento no curral principal.', status: 'Aberta',
    iniciada_em: '2026-10-30T08:05:00-03:00', finalizada_em: null,
    responsavel_tecnico: 'David Costa', created_at: '2026-10-30T08:05:00-03:00'
  },
  {
    id: 'visit-pending', fazenda_id: farm.id, tipo: 'Diagnóstico', data_visita: '2026-10-29',
    resumo: 'Validação técnica dos equipamentos.', status: 'Aguardando retorno',
    pendencias: 'Retornar com um novo nobreak para concluir a validação.',
    proxima_acao: 'Agendar retorno técnico.', retorno_necessario: true,
    iniciada_em: '2026-10-29T08:00:00-03:00', finalizada_em: '2026-10-29T16:30:00-03:00',
    responsavel_tecnico: 'David Costa', created_at: '2026-10-29T08:00:00-03:00'
  },
  {
    id: 'visit-return', fazenda_id: farm.id, tipo: 'Retorno', data_visita: '2026-10-28',
    resumo: 'Retorno concluído e operação validada.', status: 'Concluída', parent_visit_id: 'visit-source',
    iniciada_em: '2026-10-28T09:00:00-03:00', finalizada_em: '2026-10-28T11:15:00-03:00',
    responsavel_tecnico: 'Equipe Técnica', created_at: '2026-10-28T09:00:00-03:00'
  },
  {
    id: 'visit-source', fazenda_id: farm.id, tipo: 'Instalação', data_visita: '2026-10-27',
    resumo: 'Primeira etapa da instalação.', status: 'Resolvida por retorno', resolved_by_visit_id: 'visit-return',
    pendencias: 'Ajuste final de antena.', iniciada_em: '2026-10-27T08:30:00-03:00',
    finalizada_em: '2026-10-27T17:00:00-03:00', responsavel_tecnico: 'Equipe Técnica',
    created_at: '2026-10-27T08:30:00-03:00'
  }
];

const evidencias = [{
  id: 'evidence-visit', fazenda_id: farm.id, visita_id: 'visit-pending', categoria: 'Visita técnica',
  arquivo_url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23009d94%22/%3E%3C/svg%3E',
  created_at: '2026-10-29T12:00:00-03:00'
}];

async function seed(page) {
  await page.addInitScript(({ farm, visits, evidencias }) => {
    localStorage.setItem('cta_allow_local_mode', 'true');
    localStorage.setItem('cta_fazendas', JSON.stringify([farm]));
    localStorage.setItem('cta_visitas', JSON.stringify(visits));
    localStorage.setItem('cta_evidencias', JSON.stringify(evidencias));
    localStorage.setItem('cta_equipamentos', '[]');
    localStorage.setItem('cta_checklists', '[]');
    localStorage.setItem('cta_diagnosticos', '[]');
    localStorage.setItem('cta_planejamentos', '[]');
    localStorage.setItem('cta_obstaculos', '[]');
    localStorage.setItem('cta_testes_cobertura', '[]');
    localStorage.setItem('cta_dados_restritos', '[]');
    localStorage.setItem('cta_app_context', JSON.stringify({ view: 'fazendas' }));
  }, { farm, visits, evidencias });
  await page.goto('http://127.0.0.1:5175/');
  await page.getByRole('button', { name: `Abrir detalhes de ${farm.nome}` }).click();
  await page.getByRole('button', { name: 'Visitas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Visitas' })).toBeVisible();
}

test('jornada de visitas no desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await seed(page);
  await expect(page.locator('.visitCard')).toHaveCount(4);
  await expect(page.getByText('Retorno da visita de 27/10/2026')).toBeVisible();
  await expect(page.getByText('Resolvida pelo retorno de 28/10/2026')).toBeVisible();

  await page.locator('.visitCard').filter({ hasText: 'Diagnóstico' }).click();
  await expect(page.getByText('Fotos da visita')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Abrir foto da visita' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar' }).click();

  const pendingCard = page.locator('.visitCard').filter({ hasText: 'Diagnóstico' });
  await pendingCard.getByRole('button', { name: /Mais ações/ }).click();
  await pendingCard.getByRole('menuitem', { name: /Editar visita/ }).click();
  await expect(page.getByRole('heading', { name: 'Editar visita' })).toBeVisible();
  await expect(page.locator('.visitFormActions')).toBeVisible();
  await page.screenshot({ path: 'test-results/visitas-desktop-form.png', fullPage: false });
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await pendingCard.getByRole('button', { name: /Mais ações/ }).click();
  await pendingCard.getByRole('menuitem', { name: /Excluir visita/ }).click();
  await expect(page.getByRole('heading', { name: 'Excluir esta visita?' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  await page.getByRole('button', { name: 'Nova visita' }).click();
  await page.getByRole('button', { name: /Com pendência/ }).click();
  await page.getByLabel('Pendência').fill('Teste de pendência controlada.');
  await page.getByLabel('Resumo rápido').fill('Visita criada no teste da interface.');
  await page.getByRole('button', { name: 'Salvar visita' }).click();
  await expect(page.getByText('Visita registrada.')).toBeVisible();
  await expect(page.locator('.visitCard')).toHaveCount(5);
});

test('visitas responsivas no celular', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  const card = page.locator('.visitCard').first();
  await expect(card).toBeVisible();
  const cardBox = await card.boundingBox();
  expect(cardBox.x).toBeGreaterThanOrEqual(0);
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(390);

  await card.getByRole('button', { name: /Mais ações/ }).click();
  await expect(page.locator('.visitActionMenu')).toBeVisible();
  await page.locator('.visitActionBackdrop').click({ position: { x: 5, y: 5 } });

  await page.getByRole('button', { name: 'Nova visita' }).click();
  const footer = page.locator('.visitFormActions');
  await expect(footer).toBeVisible();
  const footerBox = await footer.boundingBox();
  expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: 'test-results/visitas-mobile-form.png', fullPage: false });
});
