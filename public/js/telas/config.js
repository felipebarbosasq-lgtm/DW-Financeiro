import { S, gravar } from '../estado.js';
import { $, $$, esc, icone, abrirModal, fecharModal, toast, confirmar, baixarCSV, moedaCSV } from '../ui.js';
import { GRUPOS, categoria, dataBR } from '../fin.js';
import { modoDemo, resetarDemo } from '../dados.js';
import { avisar, lerValor } from './comum.js';

export const titulo = 'Configurações';
export const semMes = true;

function formCat(c = {}) {
  const novo = !c.id;
  const m = abrirModal(novo ? 'Nova categoria' : 'Editar categoria', `
  <form id="fCat" class="form">
    <div class="linha2 l-emoji"><label>Emoji<input name="emoji" value="${esc(c.emoji || '🏷️')}" maxlength="4"></label><label>Nome<input name="nome" value="${esc(c.nome || '')}" required maxlength="40"></label></div>
    <label>Tipo<select name="tipo"><option value="despesa" ${c.tipo !== 'receita' ? 'selected' : ''}>Despesa</option><option value="receita" ${c.tipo === 'receita' ? 'selected' : ''}>Receita</option></select></label>
    <label>Grupo no resultado<select name="grupo">${Object.entries(GRUPOS).filter(([k]) => k !== 'receita').map(([k, g]) => `<option value="${k}" ${c.grupo === k ? 'selected' : ''}>${g.nome}</option>`).join('')}</select></label>
    ${novo ? '' : `<label class="interruptor"><input type="checkbox" name="oculta" ${c.oculta ? 'checked' : ''}><span></span> Esconder nos formulários</label>`}
  </form>`, '<span class="esp"></span><button type="button" class="btn btn-borda" id="btCanc">Cancelar</button><button class="btn btn-preto" type="submit" form="fCat">Salvar</button>');
  $('#btCanc', m).onclick = fecharModal;
  $('#fCat', m).onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const reg = { ...c, id: c.id || `cat_${Date.now().toString(36)}`, nome: d.nome.trim(), emoji: d.emoji || '🏷️', tipo: d.tipo, grupo: d.tipo === 'receita' ? 'receita' : d.grupo, oculta: !!d.oculta };
    const cats = S.cfg.categorias.filter((x) => x.id !== reg.id);
    await gravar('config', { ...S.cfg, categorias: novo ? [...S.cfg.categorias, reg] : S.cfg.categorias.map((x) => (x.id === reg.id ? reg : x)) });
    void cats; fecharModal(); toast('Categoria salva'); avisar();
  };
}

export function render(el) {
  const t = S.cfg.taxas;
  const grupos = Object.entries(GRUPOS);
  el.innerHTML = `
  <section class="grade-2">
    <div class="cartao"><h3>Vendas da hamburgueria</h3>
      <label class="interruptor"><input type="checkbox" id="cVendas" ${S.cfg.vendas_automaticas ? 'checked' : ''}><span></span> Somar as vendas do DOM Web automaticamente</label>
      <p class="mut">Pedidos concluídos e contas de mesa fechadas entram como receita, caindo na carteira de cada forma de pagamento.</p>
      <h4>Taxa da maquininha (%)</h4>
      <form id="fTaxas" class="taxas">${[['pix', 'Pix'], ['debito', 'Débito'], ['credito', 'Crédito'], ['dinheiro', 'Dinheiro'], ['outro', 'Outros']].map(([k, n]) => `<label>${n}<input name="${k}" inputmode="decimal" value="${String(t[k] ?? 0).replace('.', ',')}"></label>`).join('')}
        <button class="btn btn-preto btn-peq" type="submit">Salvar taxas</button></form>
    </div>
    <div class="cartao"><h3>Dados e backup</h3>
      <p class="mut">Baixe tudo em planilha (abre no Excel e Google Planilhas).</p>
      <div class="pilha-bts">
        <button class="btn btn-borda" id="csvLanc">${icone('baixar', 16)} Todos os lançamentos</button>
        <button class="btn btn-borda" id="csvFixas">${icone('baixar', 16)} Contas fixas</button>
        <button class="btn btn-borda" id="jsonBk">${icone('baixar', 16)} Backup completo (JSON)</button>
      </div>
      ${modoDemo ? `<h4>Demonstração</h4><p class="mut">Os dados de exemplo ficam só neste navegador.</p><button class="btn btn-perigo-txt" id="btReset">Recomeçar com dados de exemplo</button>` : `<h4>Acesso</h4><p class="mut">Só o login de dono entra aqui. Logins da equipe (garçom, caixa, gerente) são bloqueados pelo banco.</p>`}
    </div>
  </section>
  <div class="cartao">
    <div class="cartao-cab"><h3>Categorias</h3><button class="btn btn-preto btn-peq" id="btCat">${icone('mais', 14)} Nova categoria</button></div>
    <div class="grade-cats">${grupos.map(([g, info]) => `<div><p class="grupo-tit"><i style="background:${info.cor}"></i>${info.nome}</p>
      ${S.cfg.categorias.filter((c) => c.grupo === g).map((c) => `<button class="cat-item ${c.oculta ? 'oculta' : ''}" data-cat="${c.id}" ${c.auto ? 'disabled title="Automática"' : ''}>${c.emoji} ${esc(c.nome)}${c.auto ? ' <small>auto</small>' : ''}</button>`).join('')}</div>`).join('')}</div>
  </div>`;

  $('#cVendas', el).onchange = async (e) => { await gravar('config', { ...S.cfg, vendas_automaticas: e.target.checked }); toast('Configuração salva'); avisar(); };
  $('#fTaxas', el).onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const taxas = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Math.min(30, Math.max(0, lerValor(v)))]));
    await gravar('config', { ...S.cfg, taxas }); toast('Taxas salvas'); avisar();
  };
  $('#btCat', el).onclick = () => formCat();
  $$('[data-cat]', el).forEach((b) => { b.onclick = () => formCat(S.cfg.categorias.find((c) => c.id === b.dataset.cat)); });
  $('#csvLanc', el).onclick = () => baixarCSV('lancamentos.csv', [
    ['Data', 'Tipo', 'Descrição', 'Categoria', 'Grupo', 'Carteira', 'Situação', 'Vencimento', 'Valor', 'Observação'],
    ...[...S.lancamentos].sort((a, b) => ((a.data || '') < (b.data || '') ? -1 : 1)).map((l) => { const c = categoria(S.cfg, l.categoria_id); return [dataBR(l.data), l.tipo, l.descricao, l.tipo === 'transferencia' ? '' : c.nome, l.tipo === 'transferencia' ? '' : GRUPOS[c.grupo]?.nome, S.carteiras.find((x) => x.id === l.carteira_id)?.nome || '', l.status, dataBR(l.vencimento), moedaCSV(l.valor), l.obs || '']; }),
  ]);
  $('#csvFixas', el).onclick = () => baixarCSV('contas-fixas.csv', [['Conta', 'Categoria', 'Frequência', 'Dia', 'Valor', 'Ativa'], ...S.recorrentes.map((r) => [r.descricao, categoria(S.cfg, r.categoria_id).nome, r.frequencia, r.dia ?? '', moedaCSV(r.valor), r.ativo === false ? 'não' : 'sim'])]);
  $('#jsonBk', el).onclick = () => {
    const dados = { gerado_em: new Date().toISOString(), config: S.cfg, carteiras: S.carteiras, recorrentes: S.recorrentes, lancamentos: S.lancamentos.map(({ comprovante, ...l }) => l), metas: S.metas, orcamentos: S.orcamentos };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })); a.download = `backup-financeiro-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  $('#btReset', el)?.addEventListener('click', async () => {
    if (!(await confirmar('Recomeçar demonstração', 'Apagar tudo o que você lançou na demonstração e voltar aos dados de exemplo?', 'Recomeçar', true))) return;
    resetarDemo(); location.reload();
  });
}
