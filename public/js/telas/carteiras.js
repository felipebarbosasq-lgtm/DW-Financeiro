import { S, gravar, apagar } from '../estado.js';
import { $, $$, esc, icone, abrirModal, fecharModal, toast, confirmar } from '../ui.js';
import { reais, saldos, hojeTxt, dataBR } from '../fin.js';
import { lerValor, valorCampo, avisar, formLancamento } from './comum.js';

export const titulo = 'Carteiras';
export const semMes = true;
const TIPOS = { dinheiro: ['Dinheiro / caixa', '💵'], banco: ['Conta bancária', '🏦'], maquininha: ['Maquininha / app', '💳'], outro: ['Outro', '👛'] };
const FORMAS = [['dinheiro', 'Dinheiro'], ['pix', 'Pix'], ['debito', 'Débito'], ['credito', 'Crédito'], ['outro', 'Outros']];

function form(c = {}) {
  const novo = !c.id;
  const m = abrirModal(novo ? 'Nova carteira' : 'Editar carteira', `
  <form id="fCart" class="form">
    <label>Nome<input name="nome" value="${esc(c.nome || '')}" placeholder="Ex.: Banco do Brasil" required maxlength="40"></label>
    <label>Tipo<select name="tipo">${Object.entries(TIPOS).map(([k, [n, e]]) => `<option value="${k}" ${c.tipo === k ? 'selected' : ''}>${e} ${n}</option>`).join('')}</select></label>
    <div class="linha2">
      <label>Saldo inicial<input name="saldo_inicial" inputmode="decimal" value="${valorCampo(c.saldo_inicial)}" placeholder="0,00"></label>
      <label>Na data<input name="data_inicial" type="date" value="${c.data_inicial || hojeTxt()}"></label>
    </div>
    <fieldset><legend>Vendas da hamburgueria que caem aqui</legend>
      <div class="checks">${FORMAS.map(([k, n]) => `<label class="check"><input type="checkbox" name="recebe" value="${k}" ${(c.recebe || []).includes(k) ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
      <small class="mut">Ex.: Pix cai no banco, dinheiro fica no caixa. Cada forma deve estar em uma carteira só.</small>
    </fieldset>
  </form>`,
  `${novo ? '' : '<button type="button" class="btn btn-perigo-txt" id="btExcluir">Excluir</button>'}<span class="esp"></span><button type="button" class="btn btn-borda" id="btCanc">Cancelar</button><button class="btn btn-preto" type="submit" form="fCart">Salvar</button>`);
  const f = $('#fCart', m);
  $('#btCanc', m).onclick = fecharModal;
  $('#btExcluir', m)?.addEventListener('click', async () => {
    if (S.lancamentos.some((l) => l.carteira_id === c.id || l.destino_id === c.id)) return toast('Essa carteira tem lançamentos. Mude-os de carteira antes de excluir.', true);
    if (!(await confirmar('Excluir carteira', `Excluir "${esc(c.nome)}"?`, 'Excluir', true))) return;
    await apagar('carteiras', c.id); toast('Carteira excluída'); avisar();
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = new FormData(f);
    const recebe = d.getAll('recebe');
    // Tira as formas escolhidas das outras carteiras
    for (const o of S.carteiras) if (o.id !== c.id && (o.recebe || []).some((x) => recebe.includes(x))) await gravar('carteiras', { ...o, recebe: o.recebe.filter((x) => !recebe.includes(x)) });
    await gravar('carteiras', { ...c, nome: d.get('nome').trim(), tipo: d.get('tipo'), saldo_inicial: lerValor(d.get('saldo_inicial')), data_inicial: d.get('data_inicial'), recebe });
    fecharModal(); toast('Carteira salva'); avisar();
  };
}

export function render(el) {
  const lista = saldos(S.cfg, S.carteiras, S.vendas, S.lancamentos);
  const total = lista.reduce((s, c) => s + c.saldo, 0);
  el.innerHTML = `
  <section class="destaque">
    <div class="dest-saldo"><p class="rot">Saldo total hoje</p><p class="valor-grande ${total < 0 ? 'neg' : ''}">${reais(total)}</p><p class="sub">Somando ${lista.length} carteira(s), já com vendas e taxas de cartão</p></div>
    <div class="dest-acoes"><button class="btn btn-amarelo" id="btTransf">⇄ Transferir</button><button class="btn btn-preto" id="btNova">${icone('mais', 16)} Carteira</button></div>
  </section>
  <section class="cartoes-carteira">${lista.map((c) => `<button class="carteira ${c.tipo}" data-id="${c.id}">
    <span class="cart-top"><span class="cart-ic">${TIPOS[c.tipo]?.[1] || '👛'}</span><small>${TIPOS[c.tipo]?.[0] || ''}</small></span>
    <b class="cart-nome">${esc(c.nome)}</b>
    <span class="cart-saldo ${c.saldo < 0 ? 'neg' : ''}">${reais(c.saldo)}</span>
    <small class="cart-rec">${(c.recebe || []).length ? `Recebe: ${(c.recebe || []).map((r) => FORMAS.find((f) => f[0] === r)?.[1]).join(', ')}` : 'Não recebe vendas'}</small>
    <small class="mut">Saldo inicial ${reais(c.saldo_inicial)} em ${dataBR(c.data_inicial)}</small>
  </button>`).join('')}</section>
  <p class="dica">${icone('alerta', 14)} Confira o saldo de cada carteira com o extrato do banco e o dinheiro do caixa. Se não bater, ajuste o saldo inicial ou lance a diferença.</p>`;
  $('#btNova', el).onclick = () => form({ recebe: [] });
  $('#btTransf', el).onclick = () => formLancamento('transferencia');
  $$('[data-id]', el).forEach((b) => { b.onclick = () => form(S.carteiras.find((c) => c.id === b.dataset.id)); });
}
