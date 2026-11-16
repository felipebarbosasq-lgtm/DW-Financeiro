import { S, gravar, apagar } from '../estado.js';
import { $, $$, esc, icone, abrirModal, fecharModal, toast, confirmar } from '../ui.js';
import { reais, hojeTxt, MESES, ocorrencias, contasAPagar, dataBR, txt, deTxt, DIA } from '../fin.js';
import { optCategorias, optCarteiras, lerValor, valorCampo, chipCategoria, avisar } from './comum.js';

export const titulo = 'Contas fixas';
export const semMes = true;
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const quando = (r) => (r.frequencia === 'quinzenal' ? 'A cada 15 dias' : r.frequencia === 'semanal' ? `Toda ${SEMANA[r.dia_semana ?? 1]}` : r.frequencia === 'anual' ? `Todo ano em ${r.dia} de ${MESES[r.mes_anual ?? 0].toLowerCase()}` : `Todo dia ${r.dia}`);
const porMes = (r) => (r.frequencia === 'quinzenal' ? (r.valor * 30.4) / 15 : r.frequencia === 'semanal' ? r.valor * 4.33 : r.frequencia === 'anual' ? r.valor / 12 : r.valor);

// Próximo pagamento ainda não feito de uma conta fixa (inclui os atrasados)
function proximo(r) {
  if (r.ativo === false) return null;
  const hoje = hojeTxt();
  const ini = txt(new Date(deTxt(hoje).getTime() - 60 * DIA));
  const fim = txt(new Date(deTxt(hoje).getTime() + 800 * DIA));
  return contasAPagar([r], S.lancamentos, ini, fim).find((c) => c.origem === 'fixa' && !c.paga) || null;
}
function proxTxt(r) {
  const c = proximo(r);
  if (!c) return '<span class="mut">—</span>';
  const atrasada = c.vencimento < hojeTxt();
  return `<b class="${atrasada ? 'neg' : ''}">${dataBR(c.vencimento)}</b>${atrasada ? ' <span class="tag vermelho">atrasado</span>' : c.vencimento === hojeTxt() ? ' <span class="tag laranja">hoje</span>' : ''}`;
}

function form(r = {}) {
  const novo = !r.id;
  const freq = r.frequencia || 'mensal';
  const m = abrirModal(`${novo ? 'Nova' : 'Editar'} conta fixa`, `
  <form id="fFixa" class="form">
    <div class="campo-valor despesa"><span>R$</span><input name="valor" inputmode="decimal" placeholder="0,00" value="${valorCampo(r.valor)}" required aria-label="Valor"></div>
    <label>Nome da conta<input name="descricao" value="${esc(r.descricao || '')}" placeholder="Ex.: Aluguel do ponto" required maxlength="80"></label>
    <label>Categoria<select name="categoria_id">${optCategorias('despesa', r.categoria_id || 'fix_aluguel')}</select></label>
    <div class="linha2">
      <label>Repete<select name="frequencia"><option value="mensal" ${freq === 'mensal' ? 'selected' : ''}>Todo mês</option><option value="quinzenal" ${freq === 'quinzenal' ? 'selected' : ''}>A cada 15 dias (quinzenal)</option><option value="semanal" ${freq === 'semanal' ? 'selected' : ''}>Toda semana</option><option value="anual" ${freq === 'anual' ? 'selected' : ''}>Todo ano</option></select></label>
      <label class="f-dia">Dia do vencimento<input name="dia" type="number" min="1" max="31" value="${r.dia || 10}"></label>
      <label class="f-sem">Dia da semana<select name="dia_semana">${SEMANA.map((s, i) => `<option value="${i}" ${(r.dia_semana ?? 1) === i ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    </div>
    <label class="f-mes">Mês<select name="mes_anual">${MESES.map((s, i) => `<option value="${i}" ${(r.mes_anual ?? 0) === i ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    <div class="linha2">
      <label>Paga com<select name="carteira_id">${optCarteiras(r.carteira_id || 'cart_banco')}</select></label>
      <label><span class="rot-inicio">Começa em</span><input name="inicio" type="date" value="${r.inicio || hojeTxt()}"></label>
    </div>
    <div class="f-prox"></div>
    ${novo ? `<label class="interruptor"><input type="checkbox" name="ja_pago"><span></span> <em class="rot-pago">Já paguei o primeiro</em></label>` : ''}
    <label>Termina em <small>(opcional, ex.: parcelamento)</small><input name="fim" type="date" value="${r.fim || ''}"></label>
    <label class="interruptor"><input type="checkbox" name="ativo" ${r.ativo === false ? '' : 'checked'}><span></span> Conta ativa</label>
  </form>`,
  `${novo ? '' : '<button type="button" class="btn btn-perigo-txt" id="btExcluir">Excluir</button>'}<span class="esp"></span><button type="button" class="btn btn-borda" id="btCanc">Cancelar</button><button class="btn btn-preto" type="submit" form="fFixa">Salvar</button>`);
  const f = $('#fFixa', m);
  // Mostra as próximas datas de pagamento enquanto preenche
  const sinc = () => {
    const v = f.frequencia.value;
    $('.f-dia', f).hidden = v === 'semanal' || v === 'quinzenal';
    $('.f-sem', f).hidden = v !== 'semanal';
    $('.f-mes', f).hidden = v !== 'anual';
    $('.rot-inicio', f).textContent = v === 'quinzenal' ? 'Primeiro pagamento' : 'Começa em';
    const ini = f.inicio.value || hojeTxt();
    const fim = txt(new Date(deTxt(ini).getTime() + (v === 'anual' ? 800 : v === 'mensal' ? 130 : 70) * DIA));
    const datas = ocorrencias([{ id: 'x', frequencia: v, dia: +f.dia.value || 1, dia_semana: +f.dia_semana.value, mes_anual: +f.mes_anual.value, inicio: ini, fim: f.fim.value || undefined }], ini, fim).slice(0, 4);
    $('.f-prox', f).innerHTML = datas.length ? `<span>📅 Próximos pagamentos:</span> ${datas.map((o) => `<b>${dataBR(o.venc).slice(0, 5)}</b>`).join(' · ')}` : '';
    const pago = $('.rot-pago', f);
    if (pago) pago.textContent = datas[0] ? `Já paguei o primeiro (${dataBR(datas[0].venc).slice(0, 5)})` : 'Já paguei o primeiro';
  };
  f.addEventListener('input', sinc); f.addEventListener('change', sinc); sinc();
  $('#btCanc', m).onclick = fecharModal;
  $('#btExcluir', m)?.addEventListener('click', async () => {
    if (!(await confirmar('Excluir conta fixa', `Excluir "${esc(r.descricao)}"? Os pagamentos já feitos continuam nas despesas.`, 'Excluir', true))) return;
    await apagar('recorrentes', r.id); toast('Conta fixa excluída'); avisar();
  });
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const valor = lerValor(d.valor);
    if (valor <= 0) return toast('Informe o valor da conta', true);
    const reg = await gravar('recorrentes', { ...r, descricao: d.descricao.trim(), categoria_id: d.categoria_id, valor, frequencia: d.frequencia, dia: Math.min(31, Math.max(1, +d.dia || 1)), dia_semana: +d.dia_semana, mes_anual: +d.mes_anual, carteira_id: d.carteira_id, inicio: d.inicio || hojeTxt(), fim: d.fim || undefined, ativo: !!d.ativo });
    // "Já paguei o primeiro": registra o pagamento e a conta passa a avisar o próximo
    if (d.ja_pago) {
      const ini = reg.inicio;
      const o = ocorrencias([reg], ini, txt(new Date(deTxt(ini).getTime() + 800 * DIA)))[0];
      if (o) await gravar('lancamentos', { tipo: 'despesa', descricao: reg.descricao, categoria_id: reg.categoria_id, valor, data: hojeTxt(), vencimento: o.venc, status: 'pago', carteira_id: reg.carteira_id, recorrente_id: reg.id, competencia: o.comp });
    }
    const prox = proximo(reg);
    fecharModal(); toast(prox ? `Conta fixa salva · próximo pagamento ${dataBR(prox.vencimento).slice(0, 5)}` : 'Conta fixa salva'); avisar();
  };
}

export function render(el) {
  const ativas = S.recorrentes.filter((r) => r.ativo !== false);
  const total = ativas.reduce((s, r) => s + porMes(r), 0);
  const lista = [...S.recorrentes].sort((a, b) => (a.ativo === false) - (b.ativo === false) || (a.dia || 0) - (b.dia || 0));
  el.innerHTML = `
  <section class="kpis k3">
    <div class="kpi"><span class="kpi-ic vermelho">${icone('repetir')}</span><p>Custo fixo por mês</p><b>${reais(total)}</b><small>${ativas.length} conta(s) ativa(s)</small></div>
    <div class="kpi"><span class="kpi-ic amarelo">${icone('vendas')}</span><p>Precisa vender por dia</p><b>${reais(total / 26)}</b><small>só para cobrir as fixas (26 dias abertos)</small></div>
    <div class="kpi"><span class="kpi-ic azul">${icone('contas')}</span><p>Por semana</p><b>${reais(total / 4.33)}</b><small>média</small></div>
  </section>
  <div class="barra-acoes"><p class="mut">Cadastre uma vez e a conta aparece todo mês em <a href="#contas">Contas a pagar</a>, com aviso de vencimento.</p><span class="esp"></span><button class="btn btn-preto" id="btNova">${icone('mais', 16)} Nova conta fixa</button></div>
  <div class="cartao sem-pad">
    ${lista.length ? `<table class="tabela clicavel"><thead><tr><th>Conta</th><th>Quando</th><th>Próximo pagamento</th><th>Categoria</th><th class="dir">Valor</th></tr></thead><tbody>
    ${lista.map((r) => `<tr data-id="${r.id}" class="${r.ativo === false ? 'inativa' : ''}"><td><b>${esc(r.descricao)}</b>${r.ativo === false ? ' <span class="tag cinza">pausada</span>' : ''}${r.fim ? `<br><small class="mut">até ${r.fim.split('-').reverse().join('/')}</small>` : ''}</td><td>${quando(r)}</td><td>${proxTxt(r)}</td><td>${chipCategoria(r.categoria_id)}</td><td class="dir"><b>${reais(r.valor)}</b></td></tr>`).join('')}
    </tbody></table>` : '<p class="vazio">Nenhuma conta fixa ainda. Comece pelo aluguel, energia e salários.</p>'}
  </div>`;
  $('#btNova', el).onclick = () => form();
  $$('tr[data-id]', el).forEach((tr) => { tr.onclick = () => form(S.recorrentes.find((r) => r.id === tr.dataset.id)); });
}
