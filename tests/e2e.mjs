// Teste de ponta a ponta no modo demonstração: node tests/e2e.mjs
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const srv = spawn('node', ['tools/preview.mjs'], { env: { ...process.env, PORT: '8790' } });
await new Promise((r) => setTimeout(r, 700));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
const erros = [];
p.on('pageerror', (e) => erros.push(e.message));
const ok = (c, m) => { if (!c) throw new Error(m); console.log('✓', m); };
try {
  await p.goto('http://localhost:8790/');
  await p.click('#fLogin button');
  await p.waitForSelector('.kpis');
  ok(await p.isVisible('.alerta-contas'), 'visão geral mostra contas pedindo atenção');
  const badge = await p.textContent('[data-rota="contas"] .badge');

  // Lança uma despesa
  await p.click('[data-novo="despesa"]');
  await p.fill('[name=valor]', '123,45');
  await p.fill('[name=descricao]', 'Teste de despesa');
  await p.click('.modal-pe [type=submit]');
  await p.goto('http://localhost:8790/#despesas');
  await p.waitForSelector('.lanc');
  ok((await p.textContent('.tela')).includes('Teste de despesa'), 'despesa aparece na lista');

  // Paga uma conta fixa
  await p.evaluate(() => { location.hash = 'contas'; });
  await p.waitForSelector('[data-pagar]');
  const antes = await p.locator('[data-pagar]').count();
  await p.locator('[data-pagar]').first().click();
  await p.click('.modal-pe [type=submit]');
  await p.waitForTimeout(300);
  ok((await p.locator('[data-pagar]').count()) === antes - 1, 'conta paga sai da lista em aberto');
  ok(Number(await p.textContent('[data-rota="contas"] .badge').catch(() => '0')) <= Number(badge), 'alerta de contas atualiza');

  // Nova conta fixa
  await p.evaluate(() => { location.hash = 'fixas'; });
  await p.click('#btNova');
  await p.fill('[name=valor]', '99');
  await p.fill('[name=descricao]', 'Sistema DOM Web');
  await p.click('.modal-pe [type=submit]');
  await p.waitForTimeout(200);
  ok((await p.textContent('.tela')).includes('Sistema DOM Web'), 'conta fixa criada');

  // Meta: guardar dinheiro
  await p.evaluate(() => { location.hash = 'metas'; });
  await p.locator('[data-ap]').first().click();
  await p.fill('[name=valor]', '500');
  await p.click('.modal-pe [type=submit]');
  await p.waitForTimeout(200);
  ok((await p.textContent('.destaque')).includes('17.500,00'), 'valor guardado na meta');

  for (const t of ['vendas', 'receitas', 'carteiras', 'orcamentos', 'projecao', 'resultado', 'config']) {
    await p.evaluate((t) => { location.hash = t; }, t);
    await p.waitForTimeout(200);
    ok(!(await p.textContent('.tela')).includes('Erro ao abrir'), `tela ${t} abre`);
  }
  await p.evaluate(() => { location.hash = 'resultado'; });
  await p.waitForSelector('.dre');
  ok((await p.textContent('.dre')).includes('Lucro real'), 'DRE mostra lucro real');
  const mes = await p.textContent('#nomeMes');
  await p.click('[data-m="-1"]');
  ok((await p.textContent('#nomeMes')) !== mes, 'troca de mês');
  // Apagar dados e recomeçar (sem tocar nas vendas)
  await p.evaluate(() => { location.hash = 'config'; });
  await p.click('#btZerar');
  await p.fill('[name=conf]', 'apagar');
  await p.click('#zOk');
  await p.waitForTimeout(400);
  await p.evaluate(() => { location.hash = 'despesas'; });
  await p.waitForTimeout(300);
  ok((await p.textContent('.tela')).includes('Nenhuma despesa'), 'apagar dados zera os lançamentos');
  await p.evaluate(() => { location.hash = 'fixas'; });
  await p.waitForTimeout(300);
  ok((await p.textContent('.tela')).includes('Nenhuma conta fixa'), 'apagar dados zera as contas fixas');
  await p.evaluate(() => { location.hash = 'vendas'; });
  await p.waitForTimeout(300);
  ok(!(await p.textContent('.tela')).includes('Nenhuma venda neste mês'), 'vendas da hamburgueria continuam');
  await p.reload();
  await p.waitForSelector('.kpis');
  await p.evaluate(() => { location.hash = 'despesas'; });
  await p.waitForTimeout(300);
  ok((await p.textContent('.tela')).includes('Nenhuma despesa'), 'continua zerado depois de recarregar');
  ok(!erros.length, `sem erros no navegador ${erros.join(' | ')}`);
} catch (e) {
  console.error('✗', e.message); process.exitCode = 1;
} finally {
  await b.close(); srv.kill();
}
