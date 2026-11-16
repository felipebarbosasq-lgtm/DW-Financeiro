import { S, gravar, apagar } from '../estado.js';
import { $, $$, esc, icone, abrirModal, fecharModal, toast, confirmar, barra } from '../ui.js';
import { reais, hojeTxt, dataBR, diasEntre } from '../fin.js';
import { lerValor, valorCampo, avisar } from './comum.js';

export const titulo = 'Metas';
export const semMes = true;
const ICONES = ['🎯', '🛟', '🍳', '🛠️', '🏪', '🛵', '❄️', '📈', '🎉', '🏖️'];
const guardado = (m) => (m.aportes || []).reduce((s, a) => s + +a.valor, 0);

function form(m = {}) {
  const novo = !m.id;
  const md = abrirModal(novo ? 'Nova meta' : 'Editar meta', `
  <form id="fMeta" class="form">
    <div class="icones">${ICONES.map((i) => `<label><input type="radio" name="icone" value="${i}" ${(m.icone || '🎯') === i ? 'checked' : ''}><span>${i}</span></label>`).join('')}</div>
    <label>Nome da meta<input name="nome" value="${esc(m.nome || '')}" placeholder="Ex.: Reserva de emergência" required maxlength="60"></label>
    <div class="linha2">
      <label>Valor da meta<input name="alvo" inputmode="decimal" value="${valorCampo(m.alvo)}" placeholder="0,00" required></label>
      <label>Até quando<input name="prazo" type="date" value="${m.prazo || ''}"></label>
    </div>
  </form>`,
  `${novo ? '' : '<button type="button" class="btn btn-perigo-txt" id="btExcluir">Excluir</button>'}<span class="esp"></span><button type="button" class="btn btn-borda" id="btCanc">Cancelar</button><button class="btn btn-preto" type="submit" form="fMeta">Salvar</button>`);
  $('#btCanc', md).onclick = fecharModal;
  $('#btExcluir', md)?.addEventListener('click', async () => {
    if (!(await confirmar('Excluir meta', `Excluir a meta "${esc(m.nome)}"?`, 'Excluir', true))) return;
    await apagar('metas', m.id); toast('Meta excluída'); avisar();
  });
  $('#fMeta', md).onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const alvo = lerValor(d.alvo);
    if (alvo <= 0) return toast('Informe o valor da meta', true);
    await gravar('metas', { ...m, nome: d.nome.trim(), icone: d.icone, alvo, prazo: d.prazo || undefined, aportes: m.aportes || [] });
    fecharModal(); toast('Meta salva'); avisar();
  };
}

function aporte(m) {
  const md = abrirModal(`Guardar dinheiro · ${esc(m.nome)}`, `
  <form id="fAp" class="form">
    <div class="seg"><label><input type="radio" name="sentido" value="1" checked><span>Guardar</span></label><label><input type="radio" name="sentido" value="-1"><span>Retirar</span></label></div>
    <div class="campo-valor receita"><span>R$</span><input name="valor" inputmode="decimal" placeholder="0,00" required aria-label="Valor"></div>
    <label>Data<input name="data" type="date" value="${hojeTxt()}"></label>
    ${(m.aportes || []).length ? `<p class="mut">Histórico</p><ul class="lista-simples">${[...m.aportes].reverse().slice(0, 8).map((a) => `<li>${dataBR(a.data)}<b class="${a.valor < 0 ? 'neg' : ''}">${reais(a.valor)}</b></li>`).join('')}</ul>` : ''}
  </form>`, '<span class="esp"></span><button type="button" class="btn btn-borda" id="btCanc">Cancelar</button><button class="btn btn-amarelo" type="submit" form="fAp">Confirmar</button>');
  $('#btCanc', md).onclick = fecharModal;
  $('#fAp', md).onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const v = lerValor(d.valor) * +d.sentido;
    if (!v) return toast('Informe o valor', true);
    await gravar('metas', { ...m, aportes: [...(m.aportes || []), { valor: v, data: d.data }] });
    fecharModal(); toast(v > 0 ? 'Valor guardado 💪' : 'Retirada registrada'); avisar();
  };
}

export function render(el) {
  const total = S.metas.reduce((s, m) => s + guardado(m), 0);
  const alvo = S.metas.reduce((s, m) => s + +m.alvo, 0);
  el.innerHTML = `
  <section class="destaque">
    <div class="dest-saldo"><p class="rot">Guardado nas metas</p><p class="valor-grande">${reais(total)}</p><p class="sub">de ${reais(alvo)} planejados em ${S.metas.length} meta(s)</p></div>
    <div class="dest-acoes"><button class="btn btn-preto" id="btNova">${icone('mais', 16)} Nova meta</button></div>
  </section>
  <section class="grade-metas">${S.metas.map((m) => {
    const g = guardado(m); const p = m.alvo ? (g / m.alvo) * 100 : 0;
    const dias = m.prazo ? diasEntre(hojeTxt(), m.prazo) : null;
    const porMes = dias && dias > 0 && g < m.alvo ? (m.alvo - g) / Math.max(1, dias / 30.4) : 0;
    return `<div class="cartao meta">
      <div class="meta-top"><span class="meta-ic">${m.icone || '🎯'}</span><div><b>${esc(m.nome)}</b><small>${m.prazo ? `até ${dataBR(m.prazo)}${dias < 0 ? ' · prazo vencido' : ''}` : 'sem prazo'}</small></div><button class="bt-ic" data-edit="${m.id}" aria-label="Editar">✎</button></div>
      <p class="meta-val"><b>${reais(g)}</b> <span>de ${reais(m.alvo)}</span></p>
      ${barra(p, p >= 100 ? 'verde' : '')}
      <div class="meta-pe"><small>${p >= 100 ? 'Meta alcançada! 🎉' : porMes ? `Guarde ${reais(porMes)} por mês para chegar lá` : `${p.toFixed(0)}% concluído`}</small><button class="btn btn-amarelo btn-peq" data-ap="${m.id}">Guardar</button></div>
    </div>`;
  }).join('') || '<div class="cartao vazio">Sem metas ainda. Que tal começar por uma reserva de emergência de 3 meses de custos fixos?</div>'}</section>`;
  $('#btNova', el).onclick = () => form();
  $$('[data-edit]', el).forEach((b) => { b.onclick = () => form(S.metas.find((m) => m.id === b.dataset.edit)); });
  $$('[data-ap]', el).forEach((b) => { b.onclick = () => aporte(S.metas.find((m) => m.id === b.dataset.ap)); });
}
