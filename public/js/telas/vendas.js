import { S } from '../estado.js';
import { $, esc, icone, baixarCSV, moedaCSV } from '../ui.js';
import { reais, vendasPorDia, taxaVenda, tipoForma, dataBR, limitesMes, somarMes, txt } from '../fin.js';
import { periodo } from './comum.js';

export const titulo = 'Vendas da hamburgueria';
const NOME_FORMA = { pix: 'Pix', dinheiro: 'Dinheiro', credito: 'Crédito', debito: 'Débito', outro: 'Outros' };
const COR_FORMA = { pix: '#0ea5a4', dinheiro: '#1f9d55', credito: '#2d6cdf', debito: '#7a5af5', outro: '#9a9a95' };
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function render(el) {
  const { ini, fim } = periodo();
  const vs = S.vendas.filter((v) => v.data >= ini && v.data <= fim);
  const total = vs.reduce((s, v) => s + v.total, 0);
  const taxas = vs.reduce((s, v) => s + taxaVenda(S.cfg, v), 0);
  const ticket = vs.length ? total / vs.length : 0;
  const ant = limitesMes(somarMes(S.mes, -1));
  const totAnt = S.vendas.filter((v) => v.data >= txt(ant.ini) && v.data <= txt(ant.fim)).reduce((s, v) => s + v.total, 0);
  const varPct = totAnt ? ((total - totAnt) / totAnt) * 100 : null;

  const formas = {};
  for (const v of vs) for (const p of v.pagamentos) { const k = tipoForma(p.forma); formas[k] = (formas[k] || 0) + p.valor; }
  const tipos = {};
  for (const v of vs) { const k = v.tipo === 'entrega' ? 'Entrega' : v.tipo === 'mesa' ? 'Mesa' : v.tipo === 'balcao' ? 'Balcão' : 'Retirada'; tipos[k] = (tipos[k] || 0) + v.total; }
  const semana = Array(7).fill(0);
  for (const v of vs) semana[new Date(`${v.data}T12:00`).getDay()] += v.total;
  const maxS = Math.max(1, ...semana);
  const dias = vendasPorDia(S.vendas, ini, fim).reverse();
  const maxD = Math.max(1, ...dias.map((d) => d.total));

  el.innerHTML = `
  ${S.cfg.vendas_automaticas ? '' : `<div class="faixa-erro">${icone('alerta', 15)} As vendas automáticas estão desligadas nas configurações, então não entram no resultado nem nos saldos.</div>`}
  <section class="kpis">
    <div class="kpi"><span class="kpi-ic preto">${icone('vendas')}</span><p>Faturamento</p><b>${reais(total)}</b><small>${varPct === null ? 'sem mês anterior' : `${varPct >= 0 ? '▲' : '▼'} ${Math.abs(varPct).toFixed(0)}% vs mês anterior`}</small></div>
    <div class="kpi"><span class="kpi-ic amarelo">${icone('check')}</span><p>Vendas</p><b>${vs.length}</b><small>pedidos e mesas fechadas</small></div>
    <div class="kpi"><span class="kpi-ic azul">${icone('dre')}</span><p>Ticket médio</p><b>${reais(ticket)}</b><small>por venda</small></div>
    <div class="kpi"><span class="kpi-ic vermelho">${icone('despesa')}</span><p>Taxas de cartão</p><b>${reais(taxas)}</b><small>líquido ${reais(total - taxas)}</small></div>
  </section>
  <section class="grade-3">
    <div class="cartao"><h3>Formas de pagamento</h3>
      <div class="pilha">${Object.entries(formas).map(([k, v]) => `<span style="flex:${v};background:${COR_FORMA[k]}"></span>`).join('')}</div>
      <ul class="lista-simples">${Object.entries(formas).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li><i style="background:${COR_FORMA[k]}"></i>${NOME_FORMA[k]}<b>${reais(v)}</b><small>${total ? Math.round((v / total) * 100) : 0}%</small></li>`).join('') || '<li class="vazio">Sem vendas</li>'}</ul>
    </div>
    <div class="cartao"><h3>Por tipo de pedido</h3>
      <ul class="lista-simples">${Object.entries(tipos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<li>${k}<b>${reais(v)}</b><small>${total ? Math.round((v / total) * 100) : 0}%</small></li>`).join('') || '<li class="vazio">Sem vendas</li>'}</ul>
    </div>
    <div class="cartao"><h3>Dias da semana</h3>
      <div class="mini-barras">${semana.map((v, i) => `<div title="${SEMANA[i]}: ${reais(v)}"><span style="height:${(v / maxS) * 100}%"></span><small>${SEMANA[i]}</small></div>`).join('')}</div>
    </div>
  </section>
  <div class="cartao sem-pad">
    <div class="cartao-cab pad"><h3>Dia a dia</h3><button class="btn btn-borda btn-peq" id="btCsv">${icone('baixar', 14)} CSV</button></div>
    ${dias.length ? `<table class="tabela"><thead><tr><th>Dia</th><th>Vendas</th><th class="col-barra"></th><th class="dir">Total</th></tr></thead><tbody>
      ${dias.map((d) => `<tr><td>${dataBR(d.data)} <small class="mut">${SEMANA[new Date(`${d.data}T12:00`).getDay()]}</small></td><td>${d.pedidos}</td><td class="col-barra"><div class="barrinha"><span style="width:${(d.total / maxD) * 100}%"></span></div></td><td class="dir"><b>${reais(d.total)}</b></td></tr>`).join('')}
    </tbody></table>` : '<p class="vazio">Nenhuma venda neste mês.</p>'}
  </div>
  <p class="dica">${icone('alerta', 14)} Estes números vêm direto do painel DOM Web (pedidos concluídos e contas de mesa fechadas). O financeiro só lê: nada é alterado na hamburgueria.</p>`;

  $('#btCsv', el).onclick = () => baixarCSV(`vendas-${S.mes}.csv`, [
    ['Data', 'Número', 'Tipo', 'Pagamento', 'Total'],
    ...vs.map((v) => [dataBR(v.data), v.numero ?? '', v.tipo || '', v.pagamentos.map((p) => p.forma).join(' + '), moedaCSV(v.total)]),
  ]);
  void esc;
}
