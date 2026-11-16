import { S } from '../estado.js';
import { $, $$, esc, icone, baixarCSV, moedaCSV } from '../ui.js';
import { reais, categoria, dataBR, GRUPOS } from '../fin.js';
import { periodo, formLancamento, linhaLanc, vazio } from './comum.js';

const filtros = { receita: { busca: '', cat: '' }, despesa: { busca: '', cat: '' } };

export function tela(tipo) {
  const ehR = tipo === 'receita';
  return {
    titulo: ehR ? 'Receitas' : 'Despesas',
    render(el) {
      const f = filtros[tipo];
      const { ini, fim } = periodo();
      const doMes = S.lancamentos.filter((l) => (l.tipo === tipo || (!ehR && l.tipo === 'transferencia')) && (l.status === 'pendente' ? (l.vencimento || l.data) : l.data) >= ini && (l.status === 'pendente' ? (l.vencimento || l.data) : l.data) <= fim);
      const lista = doMes.filter((l) => (!f.cat || l.categoria_id === f.cat) && (!f.busca || l.descricao.toLowerCase().includes(f.busca.toLowerCase())))
        .sort((a, b) => ((b.data || '') > (a.data || '') ? 1 : -1));
      const efetivas = doMes.filter((l) => l.tipo === tipo && l.status !== 'pendente');
      const total = efetivas.reduce((s, l) => s + +l.valor, 0);
      const pend = doMes.filter((l) => l.tipo === tipo && l.status === 'pendente').reduce((s, l) => s + +l.valor, 0);
      const vendasMes = S.vendas.filter((v) => v.data >= ini && v.data <= fim).reduce((s, v) => s + v.total, 0);

      // Por grupo (despesas) ou categoria (receitas)
      const porGrupo = {};
      for (const l of efetivas) { const c = categoria(S.cfg, l.categoria_id); const k = ehR ? c.nome : GRUPOS[c.grupo]?.nome || c.grupo; porGrupo[k] = (porGrupo[k] || { v: 0, cor: GRUPOS[c.grupo]?.cor }); porGrupo[k].v += +l.valor; }
      const grupos = Object.entries(porGrupo).sort((a, b) => b[1].v - a[1].v);
      const cats = [...new Set(doMes.map((l) => l.categoria_id).filter(Boolean))].map((id) => categoria(S.cfg, id));

      // Agrupa a lista por dia
      const dias = new Map();
      for (const l of lista) { const d = l.status === 'pendente' ? 'pendente' : l.data; if (!dias.has(d)) dias.set(d, []); dias.get(d).push(l); }

      el.innerHTML = `
      <section class="kpis k3">
        <div class="kpi"><span class="kpi-ic ${ehR ? 'verde' : 'vermelho'}">${icone(ehR ? 'receita' : 'despesa')}</span><p>${ehR ? 'Recebido' : 'Pago'} no mês</p><b>${reais(total)}</b><small>${efetivas.length} lançamento(s)</small></div>
        <div class="kpi"><span class="kpi-ic amarelo">${icone('contas')}</span><p>${ehR ? 'A receber' : 'A pagar'}</p><b>${reais(pend)}</b><small>lançados como pendentes</small></div>
        ${ehR ? `<div class="kpi"><span class="kpi-ic preto">${icone('vendas')}</span><p>Vendas da hamburgueria</p><b>${reais(vendasMes)}</b><small>entram sozinhas · <a href="#vendas">ver vendas</a></small></div>`
    : `<div class="kpi"><span class="kpi-ic azul">${icone('orcamento')}</span><p>Maior grupo</p><b>${grupos[0] ? esc(grupos[0][0]) : '—'}</b><small>${grupos[0] ? reais(grupos[0][1].v) : 'sem despesas'}</small></div>`}
      </section>
      ${grupos.length ? `<div class="cartao"><div class="pilha">${grupos.map(([n, g]) => `<span style="flex:${g.v};background:${g.cor || '#999'}" title="${esc(n)}: ${reais(g.v)}"></span>`).join('')}</div>
        <div class="pilha-leg">${grupos.map(([n, g]) => `<span><i style="background:${g.cor || '#999'}"></i>${esc(n)} <b>${reais(g.v)}</b> <small>${total ? Math.round((g.v / total) * 100) : 0}%</small></span>`).join('')}</div></div>` : ''}
      <div class="barra-acoes">
        <input type="search" class="busca" placeholder="Buscar ${ehR ? 'receita' : 'despesa'}…" value="${esc(f.busca)}" id="busca">
        <select id="fCat" class="sel-filtro"><option value="">Todas as categorias</option>${cats.map((c) => `<option value="${c.id}" ${f.cat === c.id ? 'selected' : ''}>${c.emoji} ${esc(c.nome)}</option>`).join('')}</select>
        <span class="esp"></span>
        <button class="btn btn-borda" id="btCsv" title="Baixar planilha">${icone('baixar', 16)} CSV</button>
        ${ehR ? '' : `<button class="btn btn-borda" id="btTransf">⇄ Transferir</button>`}
        <button class="btn ${ehR ? 'btn-amarelo' : 'btn-preto'}" id="btNovo">${icone('mais', 16)} Nova ${ehR ? 'receita' : 'despesa'}</button>
      </div>
      <div class="cartao sem-pad">
        ${lista.length ? [...dias.entries()].map(([d, ls]) => `<div class="dia-grupo"><p class="dia-tit">${d === 'pendente' ? (ehR ? 'A receber' : 'A pagar') : dataBR(d)}<span>${reais(ls.filter((l) => l.tipo === tipo).reduce((s, l) => s + +l.valor, 0))}</span></p>${ls.map(linhaLanc).join('')}</div>`).join('')
    : vazio(`Nenhuma ${ehR ? 'receita' : 'despesa'} lançada neste mês.`, '')}
      </div>`;

      let t;
      $('#busca', el).oninput = (e) => { clearTimeout(t); t = setTimeout(() => { f.busca = e.target.value; render(el); $('#busca', el).focus(); const i = $('#busca', el); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
      $('#fCat', el).onchange = (e) => { f.cat = e.target.value; render(el); };
      $('#btNovo', el).onclick = () => formLancamento(tipo);
      $('#btTransf', el)?.addEventListener('click', () => formLancamento('transferencia'));
      $$('[data-lanc]', el).forEach((b) => { b.onclick = () => { const l = S.lancamentos.find((x) => x.id === b.dataset.lanc); formLancamento(l.tipo, l); }; });
      $('#btCsv', el).onclick = () => baixarCSV(`${ehR ? 'receitas' : 'despesas'}-${S.mes}.csv`, [
        ['Data', 'Vencimento', 'Descrição', 'Categoria', 'Carteira', 'Situação', 'Valor', 'Observação'],
        ...lista.map((l) => [dataBR(l.data), dataBR(l.vencimento), l.descricao, l.tipo === 'transferencia' ? 'Transferência' : categoria(S.cfg, l.categoria_id).nome, S.carteiras.find((c) => c.id === l.carteira_id)?.nome || '', l.status === 'pendente' ? 'Pendente' : (ehR ? 'Recebido' : 'Pago'), moedaCSV(l.valor), l.obs || '']),
      ]);
    },
  };
}
