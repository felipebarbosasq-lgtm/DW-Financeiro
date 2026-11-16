import { S } from '../estado.js';
import { $, esc, icone, baixarCSV, moedaCSV } from '../ui.js';
import { reais, resultado, categoria, limitesMes, somarMes, txt, MESES_C, GRUPOS, nomeMes } from '../fin.js';
import { periodo } from './comum.js';

export const titulo = 'Resultado do mês';
const pct = (v, b) => (b ? `${((v / b) * 100).toFixed(1).replace('.', ',')}%` : '—');

export function render(el) {
  const { ini, fim } = periodo();
  const r = resultado(S.cfg, S.vendas, S.lancamentos, ini, fim);
  const cats = (g) => Object.entries(r.porCategoria).map(([id, v]) => ({ c: categoria(S.cfg, id), v })).filter((x) => x.c.grupo === g && x.c.tipo === 'despesa').sort((a, b) => b.v - a.v);
  const linha = (nome, v, cls = '', sub = '') => `<tr class="${cls}"><td>${nome}${sub ? `<small>${sub}</small>` : ''}</td><td class="dir">${reais(v)}</td><td class="dir mut">${pct(v, r.bruto)}</td></tr>`;
  const det = (g) => cats(g).map((x) => `<tr class="det"><td>${x.c.emoji} ${esc(x.c.nome)}</td><td class="dir">${reais(x.v)}</td><td class="dir mut">${pct(x.v, r.bruto)}</td></tr>`).join('');

  const meses = [];
  for (let i = -5; i <= 0; i++) { const lm = limitesMes(somarMes(S.mes, i)); meses.push({ rot: MESES_C[lm.ini.getMonth()], ...resultado(S.cfg, S.vendas, S.lancamentos, txt(lm.ini), txt(lm.fim)) }); }
  const maxL = Math.max(1, ...meses.map((m) => Math.abs(m.lucro)));

  el.innerHTML = `
  <section class="kpis">
    <div class="kpi"><span class="kpi-ic preto">${icone('vendas')}</span><p>Faturamento</p><b>${reais(r.bruto)}</b><small>${r.pedidos} vendas + outras receitas</small></div>
    <div class="kpi"><span class="kpi-ic amarelo">${icone('vendas')}</span><p>CMV</p><b>${pct(r.cmv, r.bruto)}</b><small>${reais(r.cmv)} · ideal entre 30% e 38%</small></div>
    <div class="kpi"><span class="kpi-ic ${r.lucro >= 0 ? 'verde' : 'vermelho'}">${icone('dre')}</span><p>Lucro real</p><b class="${r.lucro < 0 ? 'neg' : ''}">${reais(r.lucro)}</b><small>margem ${r.margemPct.toFixed(1).replace('.', ',')}%</small></div>
    <div class="kpi"><span class="kpi-ic azul">${icone('carteira')}</span><p>Sobrou após retirada</p><b class="${r.sobra < 0 ? 'neg' : ''}">${reais(r.sobra)}</b><small>retirada do dono ${reais(r.retirada)}</small></div>
  </section>
  <section class="grade-2 g-dre">
    <div class="cartao sem-pad">
      <div class="cartao-cab pad"><h3>DRE · ${nomeMes(S.mes)}</h3><button class="btn btn-borda btn-peq" id="btCsv">${icone('baixar', 14)} CSV</button></div>
      <table class="tabela dre"><thead><tr><th></th><th class="dir">Valor</th><th class="dir">%</th></tr></thead><tbody>
        ${linha('Vendas da hamburgueria', r.vendas, '', `${r.pedidos} vendas`)}
        ${linha('Outras receitas', r.outrasReceitas)}
        ${linha('= Faturamento bruto', r.bruto, 'total')}
        ${linha('− Taxas de cartão e apps', r.taxas, 'menos')}
        ${linha('− Custo dos produtos (CMV)', r.cmv, 'menos')}${det('cmv')}
        ${linha('= Margem de contribuição', r.margem, 'total')}
        ${linha('− Pessoal', r.pessoal, 'menos')}${det('pessoal')}
        ${linha('− Despesas fixas', r.fixa, 'menos')}${det('fixa')}
        ${linha('− Despesas variáveis', r.variavel, 'menos')}${det('variavel')}
        ${linha('− Impostos e tarifas', r.imposto, 'menos')}${det('imposto')}
        ${linha('= Lucro real', r.lucro, `final ${r.lucro < 0 ? 'neg' : 'pos'}`)}
        ${linha('− Retirada do dono', r.retirada, 'menos')}
        ${linha('= Sobra no caixa', r.sobra, `total ${r.sobra < 0 ? 'neg' : ''}`)}
      </tbody></table>
    </div>
    <div>
      <div class="cartao"><h3>Lucro nos últimos 6 meses</h3>
        <div class="barras-lucro">${meses.map((m) => `<div title="${m.rot}: ${reais(m.lucro)}"><em class="${m.lucro < 0 ? 'neg' : ''}">${(m.lucro / 1000).toFixed(1).replace('.', ',')}k</em><span class="${m.lucro < 0 ? 'neg' : ''}" style="height:${(Math.abs(m.lucro) / maxL) * 100}%"></span><small>${m.rot}</small></div>`).join('')}</div>
      </div>
      <div class="cartao"><h3>Para onde vai cada R$ 100 vendidos</h3>
        ${r.bruto ? `<div class="pilha alta">${[['cmv', r.cmv], ['pessoal', r.pessoal], ['fixa', r.fixa], ['variavel', r.variavel], ['imposto', r.imposto + r.taxas]].map(([g, v]) => `<span style="flex:${Math.max(0, v)};background:${GRUPOS[g].cor}"></span>`).join('')}<span style="flex:${Math.max(0, r.lucro)};background:#1f9d55"></span></div>
        <ul class="lista-simples">${[['cmv', r.cmv], ['pessoal', r.pessoal], ['fixa', r.fixa], ['variavel', r.variavel], ['imposto', r.imposto + r.taxas]].map(([g, v]) => `<li><i style="background:${GRUPOS[g].cor}"></i>${GRUPOS[g].nome}<b>R$ ${((v / r.bruto) * 100).toFixed(2).replace('.', ',')}</b></li>`).join('')}
        <li><i style="background:#1f9d55"></i><b>Lucro</b><b class="${r.lucro < 0 ? 'neg' : ''}">R$ ${((r.lucro / r.bruto) * 100).toFixed(2).replace('.', ',')}</b></li></ul>` : '<p class="vazio">Sem faturamento no mês.</p>'}
      </div>
    </div>
  </section>`;
  $('#btCsv', el).onclick = () => baixarCSV(`resultado-${S.mes}.csv`, [
    ['Linha', 'Valor', '% do faturamento'],
    ...[['Vendas da hamburgueria', r.vendas], ['Outras receitas', r.outrasReceitas], ['Faturamento bruto', r.bruto], ['Taxas de cartão', -r.taxas], ['CMV', -r.cmv], ['Margem de contribuição', r.margem], ['Pessoal', -r.pessoal], ['Despesas fixas', -r.fixa], ['Despesas variáveis', -r.variavel], ['Impostos e tarifas', -r.imposto], ['Lucro real', r.lucro], ['Retirada do dono', -r.retirada], ['Sobra', r.sobra]]
      .map(([n, v]) => [n, moedaCSV(v), r.bruto ? ((Math.abs(v) / r.bruto) * 100).toFixed(1).replace('.', ',') : '']),
  ]);
}
