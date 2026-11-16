import { S } from '../estado.js';
import { $$, esc, icone, graficoSaldo } from '../ui.js';
import { reais, saldos, projecao, dataBR, situacaoConta } from '../fin.js';
import { chipCategoria } from './comum.js';
import { pagarConta } from './contas.js';

export const titulo = 'Projeção de caixa';
export const semMes = true;
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
let dias = 30;

export function render(el) {
  const saldoHoje = saldos(S.cfg, S.carteiras, S.vendas, S.lancamentos).reduce((s, c) => s + c.saldo, 0);
  const p = projecao(S.cfg, saldoHoje, S.vendas, S.recorrentes, S.lancamentos, dias);
  const fim = p.serie[p.serie.length - 1].saldo;
  const menor = p.serie.reduce((m, s) => (s.saldo < m.saldo ? s : m), p.serie[0]);
  const entra = p.serie.reduce((s, x) => s + x.entra, 0);
  const sai = p.serie.reduce((s, x) => s + x.sai, 0);
  const maxM = Math.max(1, ...p.media);

  el.innerHTML = `
  <div class="barra-acoes"><div class="abas">${[15, 30, 60].map((d) => `<button data-d="${d}" class="${dias === d ? 'ativa' : ''}">${d} dias</button>`).join('')}</div></div>
  ${menor.saldo < 0 ? `<div class="faixa-erro">${icone('alerta', 15)} Atenção: no dia ${dataBR(menor.data)} o caixa pode ficar negativo (${reais(menor.saldo)}). Antecipe recebimentos ou negocie o vencimento.</div>` : ''}
  <section class="kpis">
    <div class="kpi"><span class="kpi-ic preto">${icone('carteira')}</span><p>Saldo hoje</p><b>${reais(saldoHoje)}</b><small>todas as carteiras</small></div>
    <div class="kpi"><span class="kpi-ic verde">${icone('receita')}</span><p>Deve entrar</p><b>${reais(entra)}</b><small>média das últimas 4 semanas</small></div>
    <div class="kpi"><span class="kpi-ic vermelho">${icone('despesa')}</span><p>Contas a pagar</p><b>${reais(sai)}</b><small>${p.contas.length} conta(s) no período</small></div>
    <div class="kpi"><span class="kpi-ic ${fim < 0 ? 'vermelho' : 'amarelo'}">${icone('projecao')}</span><p>Saldo em ${dias} dias</p><b class="${fim < 0 ? 'neg' : ''}">${reais(fim)}</b><small>menor: ${reais(menor.saldo)} em ${dataBR(menor.data).slice(0, 5)}</small></div>
  </section>
  <div class="cartao"><div class="cartao-cab"><h3>Saldo previsto dia a dia</h3><div class="legenda"><span class="lg amarelo">Saldo</span><span class="lg vermelho">Negativo</span></div></div>${graficoSaldo(p.serie)}</div>
  <section class="grade-2">
    <div class="cartao"><h3>Contas no período</h3>
      ${p.contas.length ? `<ul class="lista-contas">${p.contas.map((c) => { const s = situacaoConta(c); return `<li><span class="data-box"><b>${c.vencimento.slice(8, 10)}</b><small>${c.vencimento.slice(5, 7)}</small></span><span class="lc-txt"><b>${esc(c.descricao)}</b>${chipCategoria(c.categoria_id)}</span><span class="lc-val"><b>${reais(c.valor)}</b><span class="tag ${s.cor}">${s.nome}</span></span><span class="lc-acao"><button class="btn btn-borda btn-peq" data-pagar="${esc(c.chave)}">Pagar</button></span></li>`; }).join('')}</ul>` : '<p class="vazio">Nenhuma conta prevista.</p>'}
    </div>
    <div class="cartao"><h3>Média de vendas por dia da semana</h3>
      <div class="mini-barras alto">${p.media.map((v, i) => `<div title="${SEMANA[i]}: ${reais(v)}"><em>${v ? Math.round(v) : ''}</em><span style="height:${(v / maxM) * 100}%"></span><small>${SEMANA[i]}</small></div>`).join('')}</div>
      <p class="mut">Valores líquidos (já sem as taxas de cartão), usados para prever as entradas.</p>
    </div>
  </section>`;
  $$('[data-d]', el).forEach((b) => { b.onclick = () => { dias = +b.dataset.d; render(el); }; });
  $$('[data-pagar]', el).forEach((b) => { b.onclick = () => pagarConta(p.contas.find((c) => c.chave === b.dataset.pagar)); });
}
