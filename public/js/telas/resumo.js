import { S } from '../estado.js';
import { $, $$, esc, icone, graficoLinhas, graficoCategorias, barra } from '../ui.js';
import { reais, reaisCurto, resultado, saldos, contasAPagar, situacaoConta, projecao, hojeTxt, somarMes, limitesMes, txt, MESES_C, categoria, dataBR, diasEntre } from '../fin.js';
import { periodo, formLancamento, chipCategoria } from './comum.js';
import { pagarConta } from './contas.js';

export const titulo = 'Visão geral';

export function render(el) {
  const { ini, fim } = periodo();
  const hoje = hojeTxt();
  const r = resultado(S.cfg, S.vendas, S.lancamentos, ini, fim);
  const cart = saldos(S.cfg, S.carteiras, S.vendas, S.lancamentos);
  const saldoHoje = cart.reduce((s, c) => s + c.saldo, 0);
  const diasFim = Math.max(0, diasEntre(hoje, fim));
  const proj = projecao(S.cfg, saldoHoje, S.vendas, S.recorrentes, S.lancamentos, Math.min(60, Math.max(diasFim, 1)));
  const previsto = fim >= hoje ? (proj.serie[Math.min(diasFim, proj.serie.length - 1)]?.saldo ?? saldoHoje) : null;

  // Contas do mês
  const contasMes = contasAPagar(S.recorrentes, S.lancamentos, ini, fim);
  const aPagar = contasMes.filter((c) => !c.paga).reduce((s, c) => s + c.valor, 0);
  const alertas = contasAPagar(S.recorrentes, S.lancamentos, somarMes(hoje.slice(0, 7), -3) + '-01', txt(new Date(Date.now() + 3 * 864e5)))
    .filter((c) => !c.paga && ['atrasada', 'hoje', 'breve'].includes(situacaoConta(c).id));
  const fixasMes = contasMes.filter((c) => c.origem === 'fixa').reduce((s, c) => s + c.valor, 0);
  const lmAnt = limitesMes(somarMes(S.mes, -1));
  const brutoRef = Math.max(r.bruto, resultado(S.cfg, S.vendas, S.lancamentos, txt(lmAnt.ini), txt(lmAnt.fim)).bruto);
  const comprometida = brutoRef ? (fixasMes / brutoRef) * 100 : 0;

  // Evolução 6 meses
  const pontos = [];
  for (let i = -5; i <= 0; i++) {
    const comp = somarMes(S.mes, i); const lm = limitesMes(comp);
    const x = resultado(S.cfg, S.vendas, S.lancamentos, txt(lm.ini), txt(lm.fim));
    pontos.push({ rot: MESES_C[lm.ini.getMonth()], entrou: x.entrou, saiu: x.saiu });
  }
  // Para onde foi
  const cats = Object.entries(r.porCategoria).map(([id, v]) => ({ id, v, c: categoria(S.cfg, id) }))
    .filter((x) => x.c.tipo === 'despesa').sort((a, b) => b.v - a.v).slice(0, 7)
    .map((x) => ({ rot: x.c.nome, emoji: x.c.emoji, v: x.v, limite: S.orcamentos.find((o) => o.categoria_id === x.id)?.limite }));

  const proximas = contasMes.filter((c) => !c.paga).slice(0, 6);

  el.innerHTML = `
  ${alertas.length ? `<section class="alerta-contas">
    <div class="ac-cab">${icone('alerta', 18)}<b>${alertas.length} conta${alertas.length > 1 ? 's' : ''} pedindo atenção</b><a href="#contas">Ver todas</a></div>
    ${alertas.slice(0, 4).map((c) => { const s = situacaoConta(c); return `<div class="ac-linha"><span class="tag ${s.cor}">${s.nome}</span><span class="ac-desc">${esc(c.descricao)}</span><b>${reais(c.valor)}</b><button class="btn btn-preto btn-peq" data-pagar="${esc(c.chave)}">Pagar</button></div>`; }).join('')}
  </section>` : ''}

  <section class="destaque">
    <div class="dest-saldo">
      <p class="rot">${previsto === null ? 'Saldo em caixa hoje' : 'Saldo previsto no fim do mês'}</p>
      <p class="valor-grande ${(previsto ?? saldoHoje) < 0 ? 'neg' : ''}">${reais(previsto ?? saldoHoje)}</p>
      <p class="sub">Hoje você tem <b>${reais(saldoHoje)}</b> somando ${cart.length} carteiras</p>
    </div>
    <div class="dest-acoes">
      <button class="btn btn-amarelo" data-novo="receita">${icone('receita', 16)} Receita</button>
      <button class="btn btn-preto" data-novo="despesa">${icone('despesa', 16)} Despesa</button>
    </div>
  </section>

  <section class="kpis">
    <div class="kpi"><span class="kpi-ic verde">${icone('receita')}</span><p>Entrou no mês</p><b>${reais(r.entrou)}</b><small>${r.pedidos} vendas · ${reais(r.vendas)} da hamburgueria</small></div>
    <div class="kpi"><span class="kpi-ic vermelho">${icone('despesa')}</span><p>Saiu no mês</p><b>${reais(r.saiu)}</b><small>${reais(aPagar)} ainda a pagar</small></div>
    <div class="kpi"><span class="kpi-ic ${r.lucro >= 0 ? 'amarelo' : 'vermelho'}">${icone('dre')}</span><p>Lucro do mês</p><b class="${r.lucro < 0 ? 'neg' : ''}">${reais(r.lucro)}</b><small>Margem de ${r.margemPct.toFixed(1).replace('.', ',')}%</small></div>
    <div class="kpi"><span class="kpi-ic azul">${icone('contas')}</span><p>Renda comprometida</p><b>${comprometida.toFixed(0)}%</b>${barra(comprometida, comprometida > 60 ? 'vermelho' : comprometida > 40 ? 'laranja' : '')}<small>${reais(fixasMes)} em contas fixas</small></div>
  </section>

  <section class="grade-2">
    <div class="cartao"><div class="cartao-cab"><h3>Evolução em 6 meses</h3><div class="legenda"><span class="lg verde">Entrou</span><span class="lg vermelho">Saiu</span></div></div>${graficoLinhas(pontos)}</div>
    <div class="cartao"><div class="cartao-cab"><h3>Para onde foi o dinheiro</h3><div class="legenda"><span class="lg ok">No limite</span><span class="lg atencao">Atenção</span><span class="lg estourou">Estourou</span><span class="lg sem">Sem orçamento</span></div></div>${graficoCategorias(cats)}</div>
  </section>

  <section class="grade-2">
    <div class="cartao"><div class="cartao-cab"><h3>Próximas contas</h3><a href="#contas" class="link">Ver todas</a></div>
      ${proximas.length ? `<ul class="lista-contas">${proximas.map((c) => { const s = situacaoConta(c); return `<li><span class="data-box"><b>${c.vencimento.slice(8, 10)}</b><small>${MESES_C[+c.vencimento.slice(5, 7) - 1]}</small></span><span class="lc-txt"><b>${esc(c.descricao)}</b>${chipCategoria(c.categoria_id)}</span><span class="lc-val"><b>${reais(c.valor)}</b><span class="tag ${s.cor}">${s.nome}</span></span></li>`; }).join('')}</ul>` : '<p class="vazio">Nenhuma conta pendente neste mês 🎉</p>'}
    </div>
    <div class="cartao"><div class="cartao-cab"><h3>Metas</h3><a href="#metas" class="link">Ver metas</a></div>
      ${S.metas.length ? S.metas.slice(0, 3).map((m) => { const g = (m.aportes || []).reduce((s, a) => s + +a.valor, 0); const p = m.alvo ? (g / m.alvo) * 100 : 0; return `<div class="meta-mini"><div><span>${m.icone || '🎯'} ${esc(m.nome)}</span><b>${p.toFixed(0)}%</b></div>${barra(p)}<small>${reaisCurto(g)} de ${reaisCurto(m.alvo)}${m.prazo ? ` · até ${dataBR(m.prazo)}` : ''}</small></div>`; }).join('') : '<p class="vazio">Crie sua primeira meta, como uma reserva de emergência.</p>'}
    </div>
  </section>`;

  $$('[data-novo]', el).forEach((b) => { b.onclick = () => formLancamento(b.dataset.novo); });
  $$('[data-pagar]', el).forEach((b) => { b.onclick = () => pagarConta(alertas.find((c) => c.chave === b.dataset.pagar)); });
}
