// Formulários e peças usadas por várias telas.
import { S, gravar, apagar } from '../estado.js';
import { $, esc, abrirModal, fecharModal, toast, confirmar, icone } from '../ui.js';
import { reduzirImagem, modoDemo } from '../dados.js';
import { limitesMes, txt, hojeTxt, categoria, arred, reais, dataBR, GRUPOS } from '../fin.js';

export const avisar = () => window.dispatchEvent(new Event('fin:mudou'));

export function periodo() {
  const { ini, fim } = limitesMes(S.mes);
  return { ini: txt(ini), fim: txt(fim) };
}

export const optCategorias = (tipo, sel) => {
  const cats = S.cfg.categorias.filter((c) => c.tipo === tipo && !c.auto && !c.oculta);
  const grupos = [...new Set(cats.map((c) => c.grupo))];
  return grupos.map((g) => `<optgroup label="${esc(GRUPOS[g]?.nome || g)}">${cats.filter((c) => c.grupo === g).map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.emoji} ${esc(c.nome)}</option>`).join('')}</optgroup>`).join('');
};
export const optCarteiras = (sel) => S.carteiras.map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');

export const lerValor = (v) => {
  const s = String(v ?? '').trim().replace(/\s|R\$/g, '');
  if (!s) return 0;
  const n = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return arred(parseFloat(n) || 0);
};
export const valorCampo = (v) => (v ? String(arred(v)).replace('.', ',') : '');

export function chipCategoria(id) {
  const c = categoria(S.cfg, id);
  return `<span class="chip-cat" style="--c:${GRUPOS[c.grupo]?.cor || '#888'}">${c.emoji} ${esc(c.nome)}</span>`;
}

// ---------- Lançamento (receita/despesa/transferência) ----------

export function formLancamento(tipo, l = {}, extra = {}) {
  const novo = !l.id;
  const ehTransf = tipo === 'transferencia';
  const nomeT = ehTransf ? 'transferência' : tipo === 'receita' ? 'receita' : 'despesa';
  const pago = (l.status || extra.status || 'pago') === 'pago';
  const m = abrirModal(`${novo ? 'Nova' : 'Editar'} ${nomeT}`, `
    <form id="fLanc" class="form">
      <div class="campo-valor ${tipo}"><span>R$</span><input name="valor" inputmode="decimal" placeholder="0,00" value="${valorCampo(l.valor ?? extra.valor)}" required aria-label="Valor"></div>
      <label>Descrição<input name="descricao" value="${esc(l.descricao ?? extra.descricao ?? '')}" placeholder="${tipo === 'receita' ? 'Ex.: Evento particular' : ehTransf ? 'Ex.: Depósito do caixa no banco' : 'Ex.: Compra de carne'}" required maxlength="120"></label>
      ${ehTransf ? '' : `<label>Categoria<select name="categoria_id" required>${optCategorias(tipo, l.categoria_id ?? extra.categoria_id)}</select></label>`}
      <div class="linha2">
        <label>${ehTransf ? 'Sai de' : tipo === 'receita' ? 'Entra em' : 'Sai de'}<select name="carteira_id">${optCarteiras(l.carteira_id ?? extra.carteira_id ?? (tipo === 'receita' ? 'cart_banco' : 'cart_caixa'))}</select></label>
        ${ehTransf ? `<label>Vai para<select name="destino_id">${optCarteiras(l.destino_id ?? 'cart_banco')}</select></label>` : `<label>Data<input name="data" type="date" value="${l.data ?? extra.data ?? hojeTxt()}" required></label>`}
      </div>
      ${ehTransf ? `<label>Data<input name="data" type="date" value="${l.data ?? hojeTxt()}" required></label>` : `
      <div class="seg" role="radiogroup">
        <label><input type="radio" name="status" value="pago" ${pago ? 'checked' : ''}><span>${icone('check', 14)} ${tipo === 'receita' ? 'Recebido' : 'Pago'}</span></label>
        <label><input type="radio" name="status" value="pendente" ${pago ? '' : 'checked'}><span>${tipo === 'receita' ? 'A receber' : 'A pagar'}</span></label>
      </div>
      <label class="so-pendente">Vencimento<input name="vencimento" type="date" value="${l.vencimento ?? extra.vencimento ?? ''}"></label>`}
      <label>Observação<textarea name="obs" rows="2" maxlength="400">${esc(l.obs ?? '')}</textarea></label>
      ${ehTransf ? '' : `<div class="comprovante">
        <label class="btn btn-borda btn-peq">${icone('foto', 15)} ${l.comprovante ? 'Trocar foto' : 'Foto do comprovante'}<input type="file" accept="image/*" capture="environment" name="foto" hidden></label>
        <img id="prevFoto" ${l.comprovante ? `src="${l.comprovante}"` : 'hidden'} alt="Comprovante">
        ${modoDemo ? '' : '<small>A foto fica guardada só para você.</small>'}
      </div>`}
    </form>`,
  `${novo ? '' : '<button type="button" class="btn btn-perigo-txt" id="btExcluir">Excluir</button>'}<span class="esp"></span>
   <button type="button" class="btn btn-borda" id="btCancelar">Cancelar</button><button type="submit" form="fLanc" class="btn btn-preto">Salvar</button>`);

  const f = $('#fLanc', m);
  let foto = l.comprovante || '';
  const sincPend = () => { const p = f.status?.value === 'pendente'; const v = $('.so-pendente', f); if (v) v.hidden = !p; };
  f.querySelectorAll('[name=status]').forEach((r) => { r.onchange = sincPend; });
  sincPend();
  const inp = f.foto;
  if (inp) inp.onchange = async () => {
    if (!inp.files[0]) return;
    try { foto = await reduzirImagem(inp.files[0]); const p = $('#prevFoto', m); p.src = foto; p.hidden = false; } catch { toast('Não consegui ler essa imagem', true); }
  };
  $('#btCancelar', m).onclick = fecharModal;
  $('#btExcluir', m)?.addEventListener('click', async () => {
    if (!(await confirmar('Excluir lançamento', `Excluir "${esc(l.descricao)}" de ${reais(l.valor)}?`, 'Excluir', true))) return;
    await apagar('lancamentos', l.id); toast('Lançamento excluído'); avisar();
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const valor = lerValor(d.valor);
    if (valor <= 0) return toast('Informe um valor maior que zero', true);
    if (ehTransf && d.carteira_id === d.destino_id) return toast('Escolha carteiras diferentes', true);
    const reg = {
      ...l, ...extra, tipo, valor, descricao: d.descricao.trim(), data: d.data, carteira_id: d.carteira_id, obs: (d.obs || '').trim(),
      status: ehTransf ? 'pago' : d.status, categoria_id: ehTransf ? null : d.categoria_id, destino_id: ehTransf ? d.destino_id : undefined,
      vencimento: !ehTransf && d.status === 'pendente' ? (d.vencimento || d.data) : (l.vencimento ?? extra.vencimento),
      comprovante: foto || undefined,
    };
    const b = $('[type=submit]', m.parentElement); if (b) b.disabled = true;
    try { await gravar('lancamentos', reg); fecharModal(); toast(novo ? 'Lançamento salvo' : 'Alterações salvas'); avisar(); }
    catch (err) { toast(err.message, true); if (b) b.disabled = false; }
  };
}

// Linha de lançamento numa lista
export function linhaLanc(l) {
  const c = categoria(S.cfg, l.categoria_id);
  const cart = S.carteiras.find((x) => x.id === l.carteira_id);
  const sinal = l.tipo === 'receita' ? '+' : l.tipo === 'despesa' ? '−' : '⇄';
  return `<button type="button" class="lanc ${l.tipo} ${l.status === 'pendente' ? 'pendente' : ''}" data-lanc="${l.id}">
    <span class="lanc-ic" style="--c:${GRUPOS[c.grupo]?.cor || '#999'}">${l.tipo === 'transferencia' ? '⇄' : c.emoji}</span>
    <span class="lanc-txt"><b>${esc(l.descricao)}</b><small>${l.tipo === 'transferencia' ? 'Transferência' : esc(c.nome)} · ${esc(cart?.nome || '')}${l.comprovante ? ' · 📎' : ''}${l.recorrente_id ? ' · fixa' : ''}</small></span>
    <span class="lanc-val"><b>${sinal} ${reais(l.valor)}</b><small>${l.status === 'pendente' ? `vence ${dataBR(l.vencimento || l.data)}` : dataBR(l.data)}</small></span>
  </button>`;
}

export function vazio(txt, botao = '') { return `<div class="vazio">${txt}${botao}</div>`; }
