import { S, gravar, apagar } from '../estado.js';
import { $, $$, esc, icone, abrirModal, fecharModal, toast, barra } from '../ui.js';
import { reais, resultado, categoria, limitesMes, somarMes, txt, hojeTxt, diasEntre } from '../fin.js';
import { periodo, optCategorias, lerValor, valorCampo, avisar } from './comum.js';

export const titulo = 'Orçamentos';

function form(o = {}) {
  const novo = !o.id;
  const m = abrirModal(novo ? 'Novo orçamento' : 'Editar orçamento', `
  <form id="fOrc" class="form">
    <label>Categoria<select name="categoria_id">${optCategorias('despesa', o.categoria_id)}</select></label>
    <div class="campo-valor"><span>R$</span><input name="limite" inputmode="decimal" placeholder="0,00" value="${valorCampo(o.limite)}" required aria-label="Limite por mês"></div>
    <p class="mut">Limite de gasto por mês nessa categoria. Você recebe um aviso quando passar de 90%.</p>
  </form>`,
  `${novo ? '' : '<button type="button" class="btn btn-perigo-txt" id="btExcluir">Excluir</button>'}<span class="esp"></span><button type="button" class="btn btn-borda" id="btCanc">Cancelar</button><button class="btn btn-preto" type="submit" form="fOrc">Salvar</button>`);
  const f = $('#fOrc', m);
  $('#btCanc', m).onclick = fecharModal;
  $('#btExcluir', m)?.addEventListener('click', async () => { await apagar('orcamentos', o.id); fecharModal(); toast('Orçamento excluído'); avisar(); });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const limite = lerValor(d.limite);
    if (limite <= 0) return toast('Informe o limite', true);
    const outro = S.orcamentos.find((x) => x.categoria_id === d.categoria_id && x.id !== o.id);
    await gravar('orcamentos', { ...(outro || o), categoria_id: d.categoria_id, limite });
    if (outro && o.id) await apagar('orcamentos', o.id);
    fecharModal(); toast('Orçamento salvo'); avisar();
  };
}

export function render(el) {
  const { ini, fim } = periodo();
  const r = resultado(S.cfg, S.vendas, S.lancamentos, ini, fim);
  const ant = limitesMes(somarMes(S.mes, -1));
  const rAnt = resultado(S.cfg, S.vendas, S.lancamentos, txt(ant.ini), txt(ant.fim));
  const hoje = hojeTxt();
  const pctMes = hoje < ini ? 0 : hoje > fim ? 100 : ((diasEntre(ini, hoje) + 1) / (diasEntre(ini, fim) + 1)) * 100;
  const itens = S.orcamentos.map((o) => {
    const gasto = r.porCategoria[o.categoria_id] || 0;
    return { ...o, gasto, pct: (gasto / o.limite) * 100, ant: rAnt.porCategoria[o.categoria_id] || 0, c: categoria(S.cfg, o.categoria_id) };
  }).sort((a, b) => b.pct - a.pct);
  const tl = itens.reduce((s, i) => s + i.limite, 0); const tg = itens.reduce((s, i) => s + i.gasto, 0);
  const estourados = itens.filter((i) => i.pct >= 90).length;

  el.innerHTML = `
  <section class="kpis k3">
    <div class="kpi"><span class="kpi-ic amarelo">${icone('orcamento')}</span><p>Orçado no mês</p><b>${reais(tl)}</b><small>${itens.length} categoria(s)</small></div>
    <div class="kpi"><span class="kpi-ic ${tg > tl ? 'vermelho' : 'verde'}">${icone('despesa')}</span><p>Gasto até agora</p><b>${reais(tg)}</b>${barra(tl ? (tg / tl) * 100 : 0, tg > tl ? 'vermelho' : '')}<small>${tl ? Math.round((tg / tl) * 100) : 0}% usado · ${Math.round(pctMes)}% do mês passou</small></div>
    <div class="kpi"><span class="kpi-ic vermelho">${icone('alerta')}</span><p>Perto do limite</p><b>${estourados}</b><small>acima de 90%</small></div>
  </section>
  <div class="barra-acoes"><p class="mut">A linha fina mostra quanto do mês já passou: se a barra passou dela, o gasto está adiantado.</p><span class="esp"></span><button class="btn btn-preto" id="btNovo">${icone('mais', 16)} Novo orçamento</button></div>
  <section class="grade-orc">${itens.map((i) => `<button class="cartao orc ${i.pct >= 100 ? 'estourou' : i.pct >= 90 ? 'atencao' : ''}" data-id="${i.id}">
    <div class="orc-top"><span class="orc-ic">${i.c.emoji}</span><b>${esc(i.c.nome)}</b><span class="tag ${i.pct >= 100 ? 'vermelho' : i.pct >= 90 ? 'laranja' : i.pct >= 50 ? 'amarelo' : 'verde'}">${Math.round(i.pct)}%</span></div>
    <div class="orc-barra">${barra(i.pct, i.pct >= 100 ? 'vermelho' : i.pct >= 90 ? 'laranja' : '')}<span class="marca-mes" style="left:${pctMes}%"></span></div>
    <div class="orc-val"><span><b>${reais(i.gasto)}</b> de ${reais(i.limite)}</span><small>${i.gasto <= i.limite ? `sobram ${reais(i.limite - i.gasto)}` : `passou ${reais(i.gasto - i.limite)}`}</small></div>
    <small class="mut">Mês anterior: ${reais(i.ant)}</small>
  </button>`).join('') || '<div class="cartao vazio">Defina limites para as categorias que mais pesam, como carnes, embalagens e diárias.</div>'}</section>`;
  $('#btNovo', el).onclick = () => form();
  $$('[data-id]', el).forEach((b) => { b.onclick = () => form(S.orcamentos.find((o) => o.id === b.dataset.id)); });
}
