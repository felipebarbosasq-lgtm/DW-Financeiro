import { S, gravar } from '../estado.js';
import { $, $$, esc, icone, toast } from '../ui.js';
import { reais, contasAPagar, situacaoConta, hojeTxt, MESES_C } from '../fin.js';
import { periodo, formLancamento, chipCategoria, avisar } from './comum.js';

export const titulo = 'Contas a pagar';

// Abre o formulário já preenchido para registrar o pagamento
export function pagarConta(c) {
  if (!c) return;
  if (c.origem === 'avulsa') return formLancamento('despesa', { ...c.lancamento, status: 'pago', data: hojeTxt() });
  formLancamento('despesa', {}, {
    descricao: c.descricao, categoria_id: c.categoria_id, valor: c.valor, carteira_id: c.recorrente.carteira_id,
    recorrente_id: c.recorrente.id, competencia: c.competencia, vencimento: c.vencimento, data: hojeTxt(), status: 'pago',
  });
}

let filtro = 'abertas';

export function render(el) {
  const { ini, fim } = periodo();
  const hoje = hojeTxt();
  // Inclui atrasadas de meses anteriores
  const desde = ini > hoje ? ini : `${Number(ini.slice(0, 4)) - 1}${ini.slice(4)}`;
  const todas = contasAPagar(S.recorrentes, S.lancamentos, desde, fim).filter((c) => c.vencimento >= ini || !c.paga);
  const lista = todas.filter((c) => (filtro === 'abertas' ? !c.paga : filtro === 'pagas' ? c.paga : true));
  const soma = (f) => todas.filter(f).reduce((s, c) => s + c.valor, 0);
  const atrasadas = todas.filter((c) => !c.paga && c.vencimento < hoje);

  el.innerHTML = `
  <section class="kpis k3">
    <div class="kpi"><span class="kpi-ic vermelho">${icone('alerta')}</span><p>Atrasadas</p><b class="${atrasadas.length ? 'neg' : ''}">${reais(atrasadas.reduce((s, c) => s + c.valor, 0))}</b><small>${atrasadas.length} conta(s)</small></div>
    <div class="kpi"><span class="kpi-ic amarelo">${icone('contas')}</span><p>A pagar no mês</p><b>${reais(soma((c) => !c.paga && c.vencimento >= ini))}</b><small>${todas.filter((c) => !c.paga && c.vencimento >= ini).length} conta(s)</small></div>
    <div class="kpi"><span class="kpi-ic verde">${icone('check')}</span><p>Pagas no mês</p><b>${reais(soma((c) => c.paga))}</b><small>${todas.filter((c) => c.paga).length} conta(s)</small></div>
  </section>
  <div class="barra-acoes">
    <div class="abas">${[['abertas', 'Em aberto'], ['pagas', 'Pagas'], ['todas', 'Todas']].map(([k, n]) => `<button class="${filtro === k ? 'ativa' : ''}" data-f="${k}">${n}</button>`).join('')}</div>
    <span class="esp"></span>
    <a class="btn btn-borda" href="#fixas">${icone('repetir', 16)} Contas fixas</a>
    <button class="btn btn-preto" id="btNova">${icone('mais', 16)} Conta avulsa</button>
  </div>
  <div class="cartao sem-pad">
    ${lista.length ? `<ul class="lista-contas grande">${lista.map((c) => { const s = situacaoConta(c, hoje); return `<li class="${s.id}">
      <span class="data-box"><b>${c.vencimento.slice(8, 10)}</b><small>${MESES_C[+c.vencimento.slice(5, 7) - 1]}</small></span>
      <span class="lc-txt"><b>${esc(c.descricao)}</b><span>${chipCategoria(c.categoria_id)} ${c.origem === 'fixa' ? `<small class="mut">${icone('repetir', 12)} fixa</small>` : ''}</span></span>
      <span class="lc-val"><b>${reais(c.valor)}</b><span class="tag ${s.cor}">${s.nome}</span></span>
      <span class="lc-acao">${c.paga ? `<button class="btn btn-borda btn-peq" data-ver="${esc(c.chave)}">Ver</button>` : `<button class="btn btn-preto btn-peq" data-pagar="${esc(c.chave)}">${icone('check', 14)} Pagar</button>`}</span>
    </li>`; }).join('')}</ul>` : `<p class="vazio">${filtro === 'abertas' ? 'Nada em aberto. Tudo pago! 🎉' : 'Nenhuma conta aqui.'}</p>`}
  </div>
  <p class="dica">${icone('alerta', 14)} As contas fixas (aluguel, energia, salários…) aparecem aqui sozinhas todo mês. Ao pagar, o valor sai da carteira escolhida.</p>`;

  $$('[data-f]', el).forEach((b) => { b.onclick = () => { filtro = b.dataset.f; render(el); }; });
  $('#btNova', el).onclick = () => formLancamento('despesa', {}, { status: 'pendente', vencimento: hoje });
  $$('[data-pagar]', el).forEach((b) => { b.onclick = () => pagarConta(lista.find((c) => c.chave === b.dataset.pagar)); });
  $$('[data-ver]', el).forEach((b) => { b.onclick = () => { const c = lista.find((x) => x.chave === b.dataset.ver); if (c?.lancamento) formLancamento('despesa', c.lancamento); }; });
}
export { gravar, toast, avisar };
