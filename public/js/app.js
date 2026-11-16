// DOM Web Financeiro: entrada, login e moldura do aplicativo.
import { modoDemo, entrar, usuarioAtual, sair } from './dados.js';
import { S, carregarTudo } from './estado.js';
import { $, $$, esc, icone, toast } from './ui.js';
import { nomeMes, somarMes, competencia, contasAPagar, situacaoConta, hojeTxt, txt, DIA, deTxt } from './fin.js';

const MENU = [
  { g: '', itens: [['resumo', 'Visão geral', 'resumo']] },
  { g: 'Movimentações', itens: [['vendas', 'Vendas', 'vendas'], ['receitas', 'Receitas', 'receita'], ['despesas', 'Despesas', 'despesa']] },
  { g: 'Gestão', itens: [['contas', 'Contas a pagar', 'contas'], ['fixas', 'Contas fixas', 'repetir'], ['carteiras', 'Carteiras', 'carteira']] },
  { g: 'Planejamento', itens: [['orcamentos', 'Orçamentos', 'orcamento'], ['metas', 'Metas', 'metas'], ['projecao', 'Projeção de caixa', 'projecao']] },
  { g: 'Relatórios', itens: [['resultado', 'Resultado do mês', 'dre']] },
];
const TELAS = {
  resumo: () => import('./telas/resumo.js'), vendas: () => import('./telas/vendas.js'),
  receitas: () => import('./telas/lancamentos.js').then((m) => m.tela('receita')), despesas: () => import('./telas/lancamentos.js').then((m) => m.tela('despesa')),
  contas: () => import('./telas/contas.js'), fixas: () => import('./telas/fixas.js'), carteiras: () => import('./telas/carteiras.js'),
  orcamentos: () => import('./telas/orcamentos.js'), metas: () => import('./telas/metas.js'), projecao: () => import('./telas/projecao.js'),
  resultado: () => import('./telas/resultado.js'), config: () => import('./telas/config.js'),
};
let atual = null;

// ---------- Login ----------

function telaLogin(msg = '') {
  document.body.className = 'pg-login';
  $('#app').innerHTML = `
  <div class="login-fundo">
    <header class="login-top"><img src="/img/marca/domweb.svg" alt="DOM Web" class="login-logo"><span class="pilula">Financeiro</span></header>
    <main class="login-hero">
      <section class="hero-txt">
        <span class="selo">${icone('check', 14)} Ligado às vendas da hamburgueria</span>
        <h1>Seu financeiro,<br><span>sem planilhas complicadas.</span></h1>
        <p>Contas a pagar com alerta, entradas e saídas do dia, lucro real do mês e a projeção do caixa. Tudo num só lugar, só para o dono.</p>
        <ul class="hero-lista">
          <li>${icone('contas')} Contas fixas com vencimento e aviso</li>
          <li>${icone('dre')} Lucro real: vendas − custos − despesas</li>
          <li>${icone('projecao')} Saldo previsto para os próximos 30 dias</li>
        </ul>
      </section>
      <form class="login-card" id="fLogin">
        <img src="/img/marca/domweb-icone.svg" alt="" class="login-ic">
        <h2>Entrar no financeiro</h2>
        <p class="sub">${modoDemo ? 'Modo demonstração: os dados são de exemplo e ficam só neste navegador.' : 'Use o mesmo e-mail e senha de dono do painel DOM Web.'}</p>
        ${modoDemo ? '' : `<label>E-mail<input name="email" type="email" autocomplete="username" required></label>
        <label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>`}
        ${msg ? `<p class="erro-login">${esc(msg)}</p>` : ''}
        <button class="btn btn-preto btn-grande" type="submit">${modoDemo ? 'Ver demonstração' : 'Entrar'}</button>
        <p class="rodape-login">${icone('alerta', 13)} Acesso exclusivo do dono</p>
      </form>
    </main>
  </div>`;
  $('#fLogin').onsubmit = async (e) => {
    e.preventDefault();
    const b = $('button', e.target); b.disabled = true; b.textContent = 'Entrando…';
    try {
      const f = new FormData(e.target);
      await entrar(f.get('email'), f.get('senha'));
      iniciar();
    } catch (err) { telaLogin(err.message); }
  };
}

// ---------- Moldura ----------

function alertasContas() {
  const hoje = hojeTxt();
  const fim = txt(new Date(deTxt(hoje).getTime() + 3 * DIA));
  const ini = txt(new Date(deTxt(hoje).getTime() - 90 * DIA));
  return contasAPagar(S.recorrentes, S.lancamentos, ini, fim).filter((c) => !c.paga && ['atrasada', 'hoje', 'breve'].includes(situacaoConta(c, hoje).id));
}
export function atualizarBadge() {
  const n = alertasContas().length;
  const b = $('[data-rota="contas"] .badge');
  if (b) { b.textContent = n; b.hidden = !n; }
}

function moldura(user) {
  document.body.className = 'pg-app';
  $('#app').innerHTML = `
  <aside class="lateral" id="lateral">
    <div class="lat-marca"><img src="/img/marca/domweb.svg" alt="DOM Web"><span>Financeiro</span></div>
    <nav>${MENU.map((g) => `${g.g ? `<p class="lat-grupo">${g.g}</p>` : ''}${g.itens.map(([id, nome, ic]) => `<a href="#${id}" data-rota="${id}">${icone(ic)}<span>${nome}</span>${id === 'contas' ? '<b class="badge" hidden></b>' : ''}</a>`).join('')}`).join('')}</nav>
    <div class="lat-pe">
      <a href="#config" data-rota="config">${icone('config')}<span>Configurações</span></a>
      <button type="button" id="btSair">${icone('sair')}<span>Sair</span></button>
      <p class="lat-user">${modoDemo ? 'Demonstração' : esc(user?.email || '')}</p>
    </div>
  </aside>
  <div class="lat-fundo" id="latFundo"></div>
  <div class="principal">
    <header class="topo">
      <button class="bt-menu" id="btMenu" type="button" aria-label="Menu">${icone('menu', 22)}</button>
      <div class="topo-tit"><p class="saud" id="saud"></p><h1 id="titulo"></h1></div>
      <div class="seletor-mes" id="selMes">
        <button type="button" data-m="-1" aria-label="Mês anterior">${icone('esq')}</button>
        <span id="nomeMes"></span>
        <button type="button" data-m="1" aria-label="Próximo mês">${icone('dir')}</button>
      </div>
    </header>
    ${modoDemo ? '<div class="faixa-demo">Modo demonstração · dados de exemplo · nada é enviado para o banco</div>' : ''}
    ${S.erroVendas ? `<div class="faixa-erro">${icone('alerta', 15)} Não consegui ler as vendas da hamburgueria: ${esc(S.erroVendas)}</div>` : ''}
    <main id="tela" class="tela"></main>
  </div>
  <div class="modal-fundo oculto" id="modalFundo"><div class="modal" id="modal" role="dialog" aria-modal="true"></div></div>`;

  const h = new Date().getHours();
  $('#saud').textContent = h < 12 ? 'Bom dia 👋' : h < 18 ? 'Boa tarde 👋' : 'Boa noite 👋';
  $('#btSair').onclick = () => { sair(); location.hash = ''; location.reload(); };
  $('#btMenu').onclick = () => document.body.classList.toggle('menu-aberto');
  $('#latFundo').onclick = () => document.body.classList.remove('menu-aberto');
  $$('[data-m]').forEach((b) => { b.onclick = () => { S.mes = somarMes(S.mes, +b.dataset.m); mostrarMes(); atual?.render($('#tela')); }; });
  $('#modalFundo').addEventListener('mousedown', (e) => { if (e.target.id === 'modalFundo') e.currentTarget.classList.add('oculto'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modalFundo')?.classList.add('oculto'); });
  mostrarMes();
  atualizarBadge();
}

function mostrarMes() {
  $('#nomeMes').textContent = nomeMes(S.mes);
  $('#selMes').classList.toggle('atual', S.mes === competencia(new Date()));
}

async function rota() {
  const id = (location.hash.slice(1) || 'resumo').split('?')[0];
  const carregar = TELAS[id] || TELAS.resumo;
  document.body.classList.remove('menu-aberto');
  $$('[data-rota]').forEach((a) => a.classList.toggle('ativo', a.dataset.rota === id));
  try {
    atual = await carregar();
    $('#titulo').textContent = atual.titulo;
    $('#selMes').hidden = atual.semMes === true;
    const el = $('#tela');
    el.innerHTML = '';
    el.scrollTop = 0;
    await atual.render(el);
  } catch (e) {
    console.error(e);
    $('#tela').innerHTML = `<div class="cartao vazio">Erro ao abrir a tela: ${esc(e.message)}</div>`;
  }
}

async function iniciar() {
  const user = await usuarioAtual();
  if (!user) return telaLogin();
  $('#app').innerHTML = '<div class="carregando"><img src="/img/marca/domweb-icone.svg" alt=""><p>Carregando seu financeiro…</p></div>';
  try {
    await carregarTudo();
  } catch (e) {
    if (/sess|jwt|expired/i.test(e.message)) { sair(); return telaLogin('Sua sessão expirou. Entre novamente.'); }
    if (/fin_registros|relation|schema cache/i.test(e.message)) return telaLogin('O banco do financeiro ainda não foi criado. Rode o arquivo supabase/financeiro.sql no Supabase (SQL Editor).');
    return telaLogin(e.message);
  }
  moldura(user);
  window.onhashchange = rota;
  rota();
}

export function recarregarTela() { atual?.render($('#tela')); atualizarBadge(); }
window.addEventListener('fin:mudou', recarregarTela);

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') navigator.serviceWorker.register('/sw.js').catch(() => {});
window.addEventListener('unhandledrejection', (e) => toast(e.reason?.message || 'Algo deu errado', true));
iniciar();
